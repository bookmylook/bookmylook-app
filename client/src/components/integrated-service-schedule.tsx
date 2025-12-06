import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Calendar, Settings, Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: string;
  isActive: boolean;
}

interface Schedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  breakStartTime?: string;
  breakEndTime?: string;
}

interface ServiceTimeSlot {
  id: string;
  serviceId: string;
  serviceName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  price: string;
}

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

const timeSlotFormSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  isAvailable: z.boolean(),
});

type TimeSlotFormData = z.infer<typeof timeSlotFormSchema>;

interface IntegratedServiceScheduleProps {
  providerId: string;
}

export default function IntegratedServiceSchedule({ providerId }: IntegratedServiceScheduleProps) {
  const [selectedDay, setSelectedDay] = useState(1); // Monday
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ServiceTimeSlot | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch provider's services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/provider/services", providerId],
    queryFn: async () => {
      const response = await fetch(`/api/provider/${providerId}/services`);
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  // Fetch provider's schedule
  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", providerId],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/${providerId}`);
      if (!response.ok) throw new Error("Failed to fetch schedules");
      return response.json();
    },
  });

  // Fetch service-specific time slots
  const { data: serviceTimeSlots = [], isLoading } = useQuery<ServiceTimeSlot[]>({
    queryKey: ["/api/service-time-slots", providerId],
    queryFn: async () => {
      const response = await fetch(`/api/provider/${providerId}/service-time-slots`);
      if (!response.ok) throw new Error("Failed to fetch service time slots");
      return response.json();
    },
  });

  const form = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotFormSchema),
    defaultValues: {
      serviceId: "",
      dayOfWeek: selectedDay,
      startTime: "09:00",
      isAvailable: true,
    },
  });

  const createServiceTimeSlotMutation = useMutation({
    mutationFn: async (data: TimeSlotFormData & { endTime: string; duration: number; price: string; serviceName: string }) => {
      return await apiRequest("POST", "/api/service-time-slots", {
        providerId,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-time-slots", providerId] });
      setShowAddSlotDialog(false);
      form.reset();
      toast({ title: "Service time slot created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create service time slot", variant: "destructive" });
    },
  });

  const deleteServiceTimeSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/service-time-slots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-time-slots", providerId] });
      toast({ title: "Service time slot deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete service time slot", variant: "destructive" });
    },
  });

  const generateSlotsForServiceMutation = useMutation({
    mutationFn: async ({ serviceId, dayOfWeek }: { serviceId: string; dayOfWeek: number }) => {
      return await apiRequest("POST", "/api/service-time-slots/generate", {
        providerId,
        serviceId,
        dayOfWeek,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-time-slots", providerId] });
      toast({ title: "Time slots generated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to generate time slots", variant: "destructive" });
    },
  });

  const handleSubmit = (data: TimeSlotFormData) => {
    const selectedService = services.find(s => s.id === data.serviceId);
    if (!selectedService) return;

    // Calculate end time based on service duration
    const startMinutes = parseInt(data.startTime.split(':')[0]) * 60 + parseInt(data.startTime.split(':')[1]);
    const endMinutes = startMinutes + selectedService.duration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    createServiceTimeSlotMutation.mutate({
      ...data,
      endTime,
      duration: selectedService.duration,
      price: selectedService.price,
      serviceName: selectedService.name,
    });
  };

  const generateAutoSlots = (serviceId: string, dayOfWeek: number) => {
    generateSlotsForServiceMutation.mutate({ serviceId, dayOfWeek });
  };

  const getScheduleForDay = (dayOfWeek: number) => {
    return schedules.find(s => s.dayOfWeek === dayOfWeek);
  };

  const getSlotsForDay = (dayOfWeek: number) => {
    return serviceTimeSlots.filter(slot => slot.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Service-Based Schedule</h3>
          <p className="text-gray-600">Manage your availability for each service</p>
        </div>
        <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
          <DialogTrigger asChild>
            <Button className="bg-dusty-rose hover:bg-dusty-rose/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Service Time
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Service Time Slot</DialogTitle>
              <DialogDescription>
                Create a specific time slot for one of your services
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} ({service.duration}min - ${service.price})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Available for Booking</FormLabel>
                        <div className="text-sm text-gray-600">
                          Make this time slot bookable by clients
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddSlotDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-dusty-rose hover:bg-dusty-rose/90"
                    disabled={createServiceTimeSlotMutation.isPending}
                  >
                    Add Time Slot
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
        <TabsList className="grid w-full grid-cols-7">
          {DAYS_OF_WEEK.map((day, index) => (
            <TabsTrigger key={index} value={index.toString()}>
              {day.slice(0, 3)}
            </TabsTrigger>
          ))}
        </TabsList>

        {DAYS_OF_WEEK.map((day, dayIndex) => (
          <TabsContent key={dayIndex} value={dayIndex.toString()} className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold">{day} Schedule</h4>
              <div className="flex space-x-2">
                {services.map((service) => (
                  <Button
                    key={service.id}
                    variant="outline"
                    size="sm"
                    onClick={() => generateAutoSlots(service.id, dayIndex)}
                    disabled={generateSlotsForServiceMutation.isPending}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Auto-fill {service.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Working Hours Display */}
            {(() => {
              const daySchedule = getScheduleForDay(dayIndex);
              return daySchedule ? (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Working Hours: {formatTime(daySchedule.startTime)} - {formatTime(daySchedule.endTime)}
                      </span>
                      {daySchedule.breakStartTime && daySchedule.breakEndTime && (
                        <span className="text-sm text-blue-600">
                          | Break: {formatTime(daySchedule.breakStartTime)} - {formatTime(daySchedule.breakEndTime)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        No working hours set for {day}. Please set your schedule first.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Service Time Slots */}
            <div className="grid gap-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : getSlotsForDay(dayIndex).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No service times set</h3>
                    <p className="text-gray-500 mb-4">Add specific time slots for your services on {day}</p>
                    <Button 
                      onClick={() => {
                        form.setValue("dayOfWeek", dayIndex);
                        setShowAddSlotDialog(true);
                      }}
                      className="bg-dusty-rose hover:bg-dusty-rose/90"
                    >
                      Add First Time Slot
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                getSlotsForDay(dayIndex).map((slot) => (
                  <Card key={slot.id} className={`transition-all hover:shadow-md ${slot.isAvailable ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50'}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-gray-800">{slot.serviceName}</h4>
                            <Badge variant={slot.isAvailable ? "default" : "secondary"}>
                              {slot.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </div>
                            <div>
                              Duration: {slot.duration} minutes
                            </div>
                            <div className="font-medium text-green-600">
                              ${slot.price}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Edit functionality would go here
                              toast({ title: "Edit functionality coming soon" });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteServiceTimeSlotMutation.mutate(slot.id)}
                            disabled={deleteServiceTimeSlotMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Tips */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
            Service Scheduling Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>• Set your general working hours first in the Schedule Manager</div>
            <div>• Service time slots will automatically use your service durations</div>
            <div>• Use "Auto-fill" to generate slots based on your working hours</div>
            <div>• Clients can only book available time slots that match your services</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}