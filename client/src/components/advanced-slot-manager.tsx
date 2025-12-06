import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, startOfDay, isToday, isTomorrow } from "date-fns";
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Calendar as CalendarIcon, 
  Users, 
  Settings, 
  Copy,
  CheckCircle
} from "lucide-react";
import { TimeSlot, Provider } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const timeSlotFormSchema = z.object({
  date: z.date(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  maxCapacity: z.number().min(1, "Must have at least 1 slot").max(10, "Cannot exceed 10 slots"),
  isActive: z.boolean(),
});

const staffUpdateSchema = z.object({
  staffCount: z.number().min(1, "Must have at least 1 staff member").max(20, "Cannot exceed 20 staff members"),
});

type TimeSlotFormData = z.infer<typeof timeSlotFormSchema>;
type StaffUpdateData = z.infer<typeof staffUpdateSchema>;

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = (i % 2) * 30;
  const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return { value: time, label: displayTime };
});

interface AdvancedSlotManagerProps {
  providerId: string;
  provider: Provider;
}

export default function AdvancedSlotManager({ providerId, provider }: AdvancedSlotManagerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [showStaffSettings, setShowStaffSettings] = useState(false);
  const [bulkCreateMode, setBulkCreateMode] = useState(false);
  const [bulkDates, setBulkDates] = useState<Date[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: timeSlots = [], isLoading } = useQuery<TimeSlot[]>({
    queryKey: ["/api/time-slots", providerId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(`/api/time-slots/${providerId}/${format(selectedDate, 'yyyy-MM-dd')}`);
      if (!response.ok) throw new Error("Failed to fetch time slots");
      return response.json();
    },
  });

  const slotForm = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotFormSchema),
    defaultValues: {
      date: selectedDate,
      startTime: "09:00",
      endTime: "10:00",
      maxCapacity: provider.staffCount || 1,
      isActive: true,
    },
  });

  const staffForm = useForm<StaffUpdateData>({
    resolver: zodResolver(staffUpdateSchema),
    defaultValues: {
      staffCount: provider.staffCount || 1,
    },
  });

  const createSlotMutation = useMutation({
    mutationFn: async (data: TimeSlotFormData) => {
      const slotData = {
        providerId,
        date: startOfDay(data.date).toISOString(),
        startTime: data.startTime,
        endTime: data.endTime,
        maxCapacity: data.maxCapacity,
        currentBookings: 0,
        isActive: data.isActive,
      };

      if (bulkCreateMode && bulkDates.length > 0) {
        // Create slots for multiple dates
        const promises = bulkDates.map(date =>
          apiRequest('/api/time-slots', {
            method: 'POST',
            body: JSON.stringify({
              ...slotData,
              date: startOfDay(date).toISOString(),
            }),
          })
        );
        return Promise.all(promises);
      } else {
        return apiRequest('/api/time-slots', {
          method: 'POST',
          body: JSON.stringify(slotData),
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: bulkCreateMode ? "Time slots created for multiple dates" : "Time slot created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-slots"] });
      setShowCreateForm(false);
      setBulkCreateMode(false);
      setBulkDates([]);
      slotForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create time slot",
        variant: "destructive",
      });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async (data: StaffUpdateData) => {
      return apiRequest(`/api/providers/${providerId}`, {
        method: 'PUT',
        body: JSON.stringify({ staffCount: data.staffCount }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff count updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setShowStaffSettings(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff count",
        variant: "destructive",
      });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      return apiRequest(`/api/time-slots/${slotId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Time slot deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time-slots"] });
    },
  });

  const generateQuickSlots = () => {
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const slotDuration = 60; // 60 minutes
    const staffCount = provider.staffCount || 1;
    
    const newSlots: TimeSlotFormData[] = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      newSlots.push({
        date: selectedDate,
        startTime,
        endTime,
        maxCapacity: staffCount,
        isActive: true,
      });
    }

    // Create all slots
    newSlots.forEach(slotData => {
      createSlotMutation.mutate(slotData);
    });
  };

  const copyToNextDays = (slot: TimeSlot, days: number = 7) => {
    const promises = [];
    
    for (let i = 1; i <= days; i++) {
      const nextDate = addDays(selectedDate, i);
      promises.push(
        createSlotMutation.mutateAsync({
          date: nextDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxCapacity: slot.maxCapacity,
          isActive: slot.isActive,
        })
      );
    }

    Promise.all(promises).then(() => {
      toast({
        title: "Success",
        description: `Slot copied to next ${days} days`,
      });
    });
  };

  const handleSubmit = (data: TimeSlotFormData) => {
    createSlotMutation.mutate(data);
  };

  const handleStaffUpdate = (data: StaffUpdateData) => {
    updateStaffMutation.mutate(data);
  };

  const getDateDisplayText = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM dd, yyyy");
  };

  const getSlotUtilization = (slot: TimeSlot) => {
    const percentage = (slot.currentBookings / slot.maxCapacity) * 100;
    return {
      percentage: Math.round(percentage),
      available: slot.maxCapacity - slot.currentBookings,
      color: percentage >= 100 ? 'red' : percentage >= 80 ? 'orange' : 'green'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header with Staff Settings */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Advanced Slot Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage time slots with capacity based on your team size
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStaffSettings(true)}
            data-testid="button-staff-settings"
          >
            <Users className="h-4 w-4 mr-2" />
            Staff: {provider.staffCount || 1}
          </Button>
        </div>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Select Date
          </CardTitle>
          <CardDescription>
            Choose a date to manage time slots for {getDateDisplayText(selectedDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            disabled={(date) => date < new Date(Date.now() - 86400000)} // Disable past dates
            className="rounded-md border w-fit"
          />
        </CardContent>
      </Card>

      {/* Slot Management Controls */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600"
          data-testid="button-create-slot"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Single Slot
        </Button>
        
        <Button
          onClick={() => {
            setBulkCreateMode(true);
            setShowCreateForm(true);
          }}
          variant="outline"
          data-testid="button-bulk-create"
        >
          <Copy className="h-4 w-4 mr-2" />
          Bulk Create
        </Button>

        <Button
          onClick={generateQuickSlots}
          variant="outline"
          disabled={createSlotMutation.isPending}
          data-testid="button-quick-setup"
        >
          <Settings className="h-4 w-4 mr-2" />
          Quick Setup (9-5)
        </Button>
      </div>

      {/* Time Slots List */}
      <Card>
        <CardHeader>
          <CardTitle>Time Slots for {getDateDisplayText(selectedDate)}</CardTitle>
          <CardDescription>
            Manage individual time slots and their capacity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading time slots...</div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No time slots created for this date. Click "Create Single Slot" to get started.
            </div>
          ) : (
            <div className="grid gap-4">
              {timeSlots.map((slot) => {
                const utilization = getSlotUtilization(slot);
                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`slot-${slot.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-medium">
                        {format(new Date(`2000-01-01T${slot.startTime}`), 'h:mm a')} -{' '}
                        {format(new Date(`2000-01-01T${slot.endTime}`), 'h:mm a')}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={utilization.color === 'green' ? 'default' : utilization.color === 'orange' ? 'secondary' : 'destructive'}
                        >
                          {slot.currentBookings}/{slot.maxCapacity} booked
                        </Badge>
                        
                        {slot.isActive ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToNextDays(slot)}
                        disabled={createSlotMutation.isPending}
                        data-testid={`button-copy-${slot.id}`}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingSlot(slot)}
                        data-testid={`button-edit-${slot.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteSlotMutation.mutate(slot.id)}
                        disabled={deleteSlotMutation.isPending || slot.currentBookings > 0}
                        data-testid={`button-delete-${slot.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Slot Form */}
      {(showCreateForm || editingSlot) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSlot ? 'Edit Time Slot' : bulkCreateMode ? 'Bulk Create Time Slots' : 'Create Time Slot'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...slotForm}>
              <form onSubmit={slotForm.handleSubmit(handleSubmit)} className="space-y-4">
                {bulkCreateMode && (
                  <div className="space-y-2">
                    <FormLabel>Select Dates for Bulk Creation</FormLabel>
                    <Calendar
                      mode="multiple"
                      selected={bulkDates}
                      onSelect={(dates) => setBulkDates(dates || [])}
                      disabled={(date) => date < new Date(Date.now() - 86400000)}
                      className="rounded-md border w-fit"
                    />
                    <p className="text-sm text-muted-foreground">
                      {bulkDates.length} dates selected
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={slotForm.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-start-time">
                              <SelectValue placeholder="Select start time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={slotForm.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-end-time">
                              <SelectValue placeholder="Select end time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={slotForm.control}
                    name="maxCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Capacity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            max={provider.staffCount || 1}
                            data-testid="input-max-capacity"
                          />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">
                          Max: {provider.staffCount || 1} (based on staff count)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={slotForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Active Slot</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-active"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createSlotMutation.isPending}
                    data-testid="button-save-slot"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createSlotMutation.isPending ? 'Saving...' : 'Save Slot'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingSlot(null);
                      setBulkCreateMode(false);
                      setBulkDates([]);
                    }}
                    data-testid="button-cancel"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Staff Settings Modal */}
      {showStaffSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>
              Update your team size to adjust slot capacity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...staffForm}>
              <form onSubmit={staffForm.handleSubmit(handleStaffUpdate)} className="space-y-4">
                <FormField
                  control={staffForm.control}
                  name="staffCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Staff Members</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          min="1"
                          max="20"
                          data-testid="input-staff-count"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        This determines the maximum capacity for your time slots
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={updateStaffMutation.isPending}
                    data-testid="button-save-staff"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateStaffMutation.isPending ? 'Updating...' : 'Update Staff Count'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowStaffSettings(false)}
                    data-testid="button-cancel-staff"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}