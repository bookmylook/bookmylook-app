import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, Plus, Edit, Trash2, Save, X, Calendar } from "lucide-react";
import { Schedule, InsertSchedule } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const scheduleFormSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  isAvailable: z.boolean(),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

interface ScheduleManagerProps {
  providerId: string;
}

export default function ScheduleManager({ providerId }: ScheduleManagerProps) {
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules", providerId],
    queryFn: async () => {
      const response = await fetch(`/api/schedules/${providerId}`);
      if (!response.ok) throw new Error("Failed to fetch schedules");
      return response.json();
    },
  });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      isAvailable: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const scheduleData: InsertSchedule = {
        providerId,
        ...data,
      };
      return await apiRequest("POST", "/api/schedules", scheduleData);
    },
    onSuccess: () => {
      // Invalidate schedule queries
      queryClient.invalidateQueries({ queryKey: ["/api/schedules", providerId] });
      // Invalidate availability queries to refresh time slots (matches TimeSlotGrid query key)
      queryClient.invalidateQueries({ queryKey: ["/api/provider", providerId, "availability"] });
      // Invalidate service time slots
      queryClient.invalidateQueries({ queryKey: ["/api/service-time-slots", providerId] });
      setShowAddForm(false);
      form.reset();
      toast({ title: "Schedule added successfully - Time slots updated!" });
    },
    onError: () => {
      toast({ title: "Failed to add schedule", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ScheduleFormData> }) => {
      return await apiRequest("PUT", `/api/schedules/${id}`, data);
    },
    onSuccess: () => {
      // Invalidate schedule queries
      queryClient.invalidateQueries({ queryKey: ["/api/schedules", providerId] });
      // Invalidate availability queries to refresh time slots (matches TimeSlotGrid query key)
      queryClient.invalidateQueries({ queryKey: ["/api/provider", providerId, "availability"] });
      // Invalidate service time slots
      queryClient.invalidateQueries({ queryKey: ["/api/service-time-slots", providerId] });
      setEditingSchedule(null);
      toast({ title: "Schedule updated successfully - Time slots refreshed!" });
    },
    onError: () => {
      toast({ title: "Failed to update schedule", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      // Invalidate schedule queries
      queryClient.invalidateQueries({ queryKey: ["/api/schedules", providerId] });
      // Invalidate availability queries to refresh time slots (matches TimeSlotGrid query key)
      queryClient.invalidateQueries({ queryKey: ["/api/provider", providerId, "availability"] });
      // Invalidate service time slots
      queryClient.invalidateQueries({ queryKey: ["/api/service-time-slots", providerId] });
      toast({ title: "Schedule deleted successfully - Availability updated!" });
    },
    onError: () => {
      toast({ title: "Failed to delete schedule", variant: "destructive" });
    },
  });

  const handleSubmit = (data: ScheduleFormData) => {
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEditing = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    form.reset({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isAvailable: schedule.isAvailable ?? true,
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingSchedule(null);
    setShowAddForm(false);
    form.reset();
  };



  // Sort schedules by day of week
  const sortedSchedules = [...schedules].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  // Get schedules by day for display
  const schedulesByDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    dayIndex: index,
    schedule: sortedSchedules.find(s => s.dayOfWeek === index),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Weekly Schedule</h3>
          <p className="text-gray-600">Set your availability for each day of the week</p>
        </div>

      </div>

      {/* Add/Edit Schedule Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSchedule ? "Edit Schedule" : "Add New Schedule"}</CardTitle>
            <CardDescription>
              Set your working hours and availability for a specific day
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    name="isAvailable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Available</FormLabel>
                          <div className="text-sm text-gray-600">
                            Are you available on this day?
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

              </form>
            </Form>
          </CardContent>
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={cancelEdit} className="w-full sm:w-auto">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={form.handleSubmit(handleSubmit)}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 w-full sm:w-auto text-white font-bold text-lg px-8 py-3 rounded-xl shadow-2xl hover:shadow-pink-500/50 transform hover:scale-105 transition-all duration-300 animate-pulse border-2 border-white/30"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="h-5 w-5 mr-3 animate-bounce" />
                <span className="relative">
                  {createMutation.isPending || updateMutation.isPending ? "✨ Saving..." : (editingSchedule ? "🎉 Update Schedule" : "💫 Save Schedule")}
                  <span className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-pink-400/30 rounded animate-ping"></span>
                </span>
              </Button>
            </div>
          </div>
        </Card>
      )}



      {/* Current Schedule Display */}
      <div className="grid gap-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {isLoading ? (
          <div className="grid gap-3">
            {DAYS_OF_WEEK.map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          schedulesByDay.map(({ day, dayIndex, schedule }) => (
            <Card key={dayIndex}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-gray-800">{day}</h4>
                    {schedule ? (
                      <div className="flex items-center space-x-2">
                        <Badge variant={schedule.isAvailable ? "default" : "secondary"}>
                          {schedule.isAvailable ? "Available" : "Closed"}
                        </Badge>
                        {schedule.isAvailable && (
                          <>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline">Not Set</Badge>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {schedule ? (
                      <div className="flex space-x-1">
                        <Button
                          variant={schedule.isAvailable ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateMutation.mutate({ 
                            id: schedule.id, 
                            data: { isAvailable: true }
                          })}
                          disabled={updateMutation.isPending}
                          className={schedule.isAvailable 
                            ? "bg-green-600 text-white hover:bg-green-700 border-green-600" 
                            : "text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                          }
                        >
                          Open
                        </Button>
                        <Button
                          variant={!schedule.isAvailable ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateMutation.mutate({ 
                            id: schedule.id, 
                            data: { isAvailable: false }
                          })}
                          disabled={updateMutation.isPending}
                          className={!schedule.isAvailable 
                            ? "bg-red-600 text-white hover:bg-red-700 border-red-600" 
                            : "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                          }
                        >
                          Closed
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          form.setValue("dayOfWeek", dayIndex);
                          setShowAddForm(true);
                        }}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-200"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Set Hours
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}