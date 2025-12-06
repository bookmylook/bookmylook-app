import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Clock, Plus, Trash2, Edit, Calendar, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  dayOfWeek: number;
  isActive: boolean;
  providerId: string;
}

interface TimeSlotManagerProps {
  providerId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

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

export default function TimeSlotManager({ providerId }: TimeSlotManagerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [bulkMode, setBulkMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    startTime: "09:00",
    endTime: "09:30",
    dayOfWeek: 1,
    isActive: true,
    bulkDays: [1, 2, 3, 4, 5] as number[], // Default: Mon-Fri
  });

  // Load existing time slots
  useEffect(() => {
    // In a real app, this would fetch from the API
    const mockSlots: TimeSlot[] = [
      {
        id: "1",
        startTime: "09:00",
        endTime: "09:30",
        duration: 30,
        dayOfWeek: 1,
        isActive: true,
        providerId,
      },
      {
        id: "2",
        startTime: "09:30",
        endTime: "10:00",
        duration: 30,
        dayOfWeek: 1,
        isActive: true,
        providerId,
      },
      {
        id: "3",
        startTime: "10:00",
        endTime: "10:30",
        duration: 30,
        dayOfWeek: 1,
        isActive: true,
        providerId,
      }
    ];
    setTimeSlots(mockSlots);
  }, [providerId]);

  const createTimeSlotMutation = useMutation({
    mutationFn: (data: Omit<TimeSlot, 'id'>) => apiRequest("/api/time-slots", "POST", data),
    onSuccess: () => {
      toast({ title: "Time slot created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/time-slots"] });
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const updateTimeSlotMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeSlot> }) => 
      apiRequest(`/api/time-slots/${id}`, "PUT", data),
    onSuccess: () => {
      toast({ title: "Time slot updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/time-slots"] });
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const deleteTimeSlotMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/time-slots/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Time slot deleted successfully!" });
      setTimeSlots(prev => prev.filter(slot => slot.id !== id));
    },
  });

  const resetForm = () => {
    setFormData({
      startTime: "09:00",
      endTime: "09:30",
      dayOfWeek: selectedDay,
      isActive: true,
      bulkDays: [1, 2, 3, 4, 5],
    });
    setEditingSlot(null);
    setBulkMode(false);
  };

  const calculateDuration = (start: string, end: string) => {
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    return endMinutes - startMinutes;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const duration = calculateDuration(formData.startTime, formData.endTime);
    
    if (duration <= 0) {
      toast({ title: "Error", description: "End time must be after start time", variant: "destructive" });
      return;
    }

    if (bulkMode) {
      // Create slots for multiple days
      formData.bulkDays.forEach(dayOfWeek => {
        const newSlot = {
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration,
          dayOfWeek,
          isActive: formData.isActive,
          providerId,
        };
        
        // Add to local state for immediate UI update
        const tempId = `temp-${Date.now()}-${dayOfWeek}`;
        setTimeSlots(prev => [...prev, { ...newSlot, id: tempId }]);
      });
      
      toast({ title: `Created ${formData.bulkDays.length} time slots` });
    } else {
      const slotData = {
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration,
        dayOfWeek: formData.dayOfWeek,
        isActive: formData.isActive,
        providerId,
      };

      if (editingSlot) {
        updateTimeSlotMutation.mutate({ id: editingSlot.id, data: slotData });
      } else {
        // Add to local state for immediate UI update
        const tempId = `temp-${Date.now()}`;
        setTimeSlots(prev => [...prev, { ...slotData, id: tempId }]);
        toast({ title: "Time slot created successfully!" });
      }
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setFormData({
      startTime: slot.startTime,
      endTime: slot.endTime,
      dayOfWeek: slot.dayOfWeek,
      isActive: slot.isActive,
      bulkDays: [1, 2, 3, 4, 5],
    });
    setIsDialogOpen(true);
  };

  const handleToggleActive = (id: string) => {
    setTimeSlots(prev => 
      prev.map(slot => 
        slot.id === id ? { ...slot, isActive: !slot.isActive } : slot
      )
    );
  };

  const generateQuickSlots = (startTime: string, endTime: string, slotDuration: number, days: number[]) => {
    const newSlots: TimeSlot[] = [];
    
    days.forEach(dayOfWeek => {
      let currentTime = startTime;
      const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
      
      while (true) {
        const currentMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);
        const slotEndMinutes = currentMinutes + slotDuration;
        
        if (slotEndMinutes > endMinutes) break;
        
        const slotEndTime = `${Math.floor(slotEndMinutes / 60).toString().padStart(2, '0')}:${(slotEndMinutes % 60).toString().padStart(2, '0')}`;
        
        newSlots.push({
          id: `quick-${Date.now()}-${dayOfWeek}-${currentMinutes}`,
          startTime: currentTime,
          endTime: slotEndTime,
          duration: slotDuration,
          dayOfWeek,
          isActive: true,
          providerId,
        });
        
        currentTime = slotEndTime;
      }
    });
    
    setTimeSlots(prev => [...prev, ...newSlots]);
    toast({ title: `Generated ${newSlots.length} time slots` });
  };

  const getSlotsByDay = (dayOfWeek: number) => {
    return timeSlots
      .filter(slot => slot.dayOfWeek === dayOfWeek)
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
        <h2 className="text-2xl font-bold text-gray-800">Time Slot Management</h2>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-mint-green text-white">
                <Settings className="w-4 h-4 mr-2" />
                Quick Setup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Quick Time Slot Generation</DialogTitle>
                <DialogDescription>
                  Generate multiple time slots automatically for your working hours
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Select defaultValue="09:00">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.slice(16, 36).map(time => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Select defaultValue="17:00">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.slice(20, 40).map(time => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Slot Duration</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="90">1.5 hours</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => generateQuickSlots("09:00", "17:00", 30, [1, 2, 3, 4, 5])}
                  className="w-full bg-gradient-mint"
                >
                  Generate Monday-Friday Slots
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-primary text-white"
                onClick={() => resetForm()}
                data-testid="button-add-time-slot"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Time Slot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSlot ? "Edit Time Slot" : "Create Time Slot"}
                </DialogTitle>
                <DialogDescription>
                  {editingSlot ? "Modify the selected time slot" : "Add a new available time slot for bookings"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={bulkMode}
                    onCheckedChange={setBulkMode}
                    data-testid="switch-bulk-mode"
                  />
                  <Label>Bulk create for multiple days</Label>
                </div>
                
                {bulkMode ? (
                  <div className="space-y-2">
                    <Label>Select Days</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <label key={day.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.bulkDays.includes(day.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  bulkDays: [...prev.bulkDays, day.value]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  bulkDays: prev.bulkDays.filter(d => d !== day.value)
                                }));
                              }
                            }}
                            data-testid={`checkbox-day-${day.value}`}
                          />
                          <span className="text-sm">{day.short}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select 
                      value={formData.dayOfWeek.toString()} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                    >
                      <SelectTrigger data-testid="select-day">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map(day => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select 
                      value={formData.startTime} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, startTime: value }))}
                    >
                      <SelectTrigger data-testid="select-start-time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select 
                      value={formData.endTime} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, endTime: value }))}
                    >
                      <SelectTrigger data-testid="select-end-time">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map(time => (
                          <SelectItem key={time.value} value={time.value}>
                            {time.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    data-testid="switch-active"
                  />
                  <Label>Active</Label>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-gradient-primary"
                    data-testid="button-save"
                  >
                    {editingSlot ? "Update" : "Create"} Slot
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {DAYS_OF_WEEK.map(day => (
            <TabsTrigger key={day.value} value={day.value.toString()}>
              {day.short}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {DAYS_OF_WEEK.map(day => (
          <TabsContent key={day.value} value={day.value.toString()} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">{day.label} Time Slots</h3>
              <Badge variant="outline">
                {getSlotsByDay(day.value).filter(slot => slot.isActive).length} active slots
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getSlotsByDay(day.value).map(slot => (
                <Card 
                  key={slot.id} 
                  className={`transition-all hover:shadow-md ${
                    slot.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                      </div>
                      <Badge 
                        variant={slot.isActive ? "default" : "secondary"}
                        className={slot.isActive ? "bg-green-500" : ""}
                      >
                        {slot.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      Duration: {slot.duration} minutes
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <Switch
                        checked={slot.isActive}
                        onCheckedChange={() => handleToggleActive(slot.id)}
                        size="sm"
                        data-testid={`switch-slot-${slot.id}`}
                      />
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(slot)}
                          data-testid={`button-edit-slot-${slot.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTimeSlotMutation.mutate(slot.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-slot-${slot.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getSlotsByDay(day.value).length === 0 && (
                <Card className="p-8 text-center col-span-full">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No time slots for {day.label}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, dayOfWeek: day.value }));
                      setIsDialogOpen(true);
                    }}
                    data-testid={`button-add-first-slot-${day.value}`}
                  >
                    Add First Slot
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-800 mb-2">Time Slot Tips</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Create consistent time slots for easier client booking</li>
            <li>• Use bulk creation for recurring weekly schedules</li>
            <li>• Toggle slots on/off for temporary availability changes</li>
            <li>• Consider service duration when creating time slots</li>
            <li>• Use Quick Setup to generate standard business hours</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}