import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Clock, Plus, Users, Edit, Trash2, Calendar, User, Settings } from "lucide-react";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Provider, StaffMember, TimeSlot } from "@shared/schema";

interface IndividualStaffSlotsProps {
  providerId: string;
  provider: Provider;
}

export default function IndividualStaffSlots({ providerId, provider }: IndividualStaffSlotsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffSpecialties, setNewStaffSpecialties] = useState("");

  // Fetch staff members
  const { data: staffMembers = [], isLoading: staffLoading } = useQuery({
    queryKey: ['/api/staff-members', providerId],
    enabled: !!providerId,
  });

  // Fetch time slots for selected staff member
  const { data: timeSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ['/api/staff-time-slots', selectedStaff, selectedDate],
    enabled: !!selectedStaff && !!selectedDate,
  });

  // Create staff member mutation
  const createStaffMutation = useMutation({
    mutationFn: async (staffData: any) => {
      return apiRequest('/api/staff-members', {
        method: 'POST',
        body: JSON.stringify(staffData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-members', providerId] });
      setIsAddingStaff(false);
      setNewStaffName("");
      setNewStaffSpecialties("");
      toast({
        title: "Staff member added",
        description: "New staff member has been added successfully.",
      });
    },
  });

  // Create time slot for specific staff mutation
  const createSlotMutation = useMutation({
    mutationFn: async (slotData: any) => {
      return apiRequest('/api/staff-time-slots', {
        method: 'POST',
        body: JSON.stringify(slotData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-time-slots', selectedStaff, selectedDate] });
      toast({
        title: "Time slot created",
        description: "New time slot has been created for staff member.",
      });
    },
  });

  // Auto-create staff members based on staff count
  const autoCreateStaffMutation = useMutation({
    mutationFn: async () => {
      const promises = [];
      for (let i = 1; i <= provider.staffCount; i++) {
        promises.push(
          apiRequest('/api/staff-members', {
            method: 'POST',
            body: JSON.stringify({
              providerId,
              name: `Staff Member ${i}`,
              specialties: [],
              isActive: true,
            }),
          })
        );
      }
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff-members', providerId] });
      toast({
        title: "Staff members created",
        description: `Created ${provider.staffCount} staff member profiles.`,
      });
    },
  });

  const handleCreateStaff = () => {
    if (!newStaffName.trim()) return;

    createStaffMutation.mutate({
      providerId,
      name: newStaffName.trim(),
      specialties: newStaffSpecialties.split(',').map(s => s.trim()).filter(Boolean),
      isActive: true,
    });
  };

  const handleCreateSlot = (startTime: string, endTime: string) => {
    if (!selectedStaff) return;

    createSlotMutation.mutate({
      providerId,
      staffMemberId: selectedStaff,
      date: new Date(selectedDate),
      startTime,
      endTime,
      maxCapacity: 1,
      currentBookings: 0,
      isActive: true,
    });
  };

  // Generate time slots for the day
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      slots.push({ startTime, endTime });
    }
    return slots;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Individual Staff Slot Management</h2>
          <p className="text-gray-600">Manage time slots for each of your {provider.staffCount} staff members</p>
        </div>
        
        {staffMembers.length === 0 && (
          <Button 
            onClick={() => autoCreateStaffMutation.mutate()}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={autoCreateStaffMutation.isPending}
          >
            <Users className="h-4 w-4 mr-2" />
            Auto-Create {provider.staffCount} Staff
          </Button>
        )}
      </div>

      {/* Staff Members Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold">{provider.staffCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold">{staffMembers.filter((s: any) => s.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Today's Slots</p>
                <p className="text-2xl font-bold">{timeSlots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="staff-list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="staff-list">Staff Members</TabsTrigger>
          <TabsTrigger value="slot-management">Slot Management</TabsTrigger>
          <TabsTrigger value="bulk-creation">Bulk Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="staff-list" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Staff Members ({staffMembers.length})</h3>
            <Button 
              onClick={() => setIsAddingStaff(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>

          {staffLoading ? (
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : staffMembers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No staff members yet</h3>
                <p className="text-gray-500 mb-4">Add individual staff members to manage their slots</p>
                <Button onClick={() => setIsAddingStaff(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Staff Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {staffMembers.map((staff: any) => (
                <Card key={staff.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{staff.name}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant={staff.isActive ? "default" : "secondary"}>
                                {staff.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {staff.specialties?.length > 0 ? `${staff.specialties.length} specialties` : "No specialties"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {staff.specialties?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {staff.specialties.map((specialty: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedStaff(staff.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Manage Slots
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="slot-management" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Individual Slot Management</h3>
            <div className="flex items-center space-x-4">
              <Label htmlFor="date-select">Select Date:</Label>
              <Input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          {/* Staff Selection */}
          {staffMembers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Staff Member</CardTitle>
                <CardDescription>Choose a staff member to manage their individual time slots</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {staffMembers.map((staff: any) => (
                    <Button
                      key={staff.id}
                      variant={selectedStaff === staff.id ? "default" : "outline"}
                      onClick={() => setSelectedStaff(staff.id)}
                      className="h-16 flex flex-col"
                      data-testid={`staff-select-${staff.id}`}
                    >
                      <User className="h-4 w-4 mb-1" />
                      <span className="text-sm">{staff.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Slots for Selected Staff */}
          {selectedStaff && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Time Slots for {staffMembers.find((s: any) => s.id === selectedStaff)?.name}
                </CardTitle>
                <CardDescription>
                  Manage individual time slots for {format(new Date(selectedDate), 'PPP')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {generateTimeSlots().map(({ startTime, endTime }) => {
                    const existingSlot = timeSlots.find((slot: any) => slot.startTime === startTime);
                    const isBooked = existingSlot && existingSlot.currentBookings >= existingSlot.maxCapacity;
                    
                    return (
                      <Button
                        key={startTime}
                        variant={existingSlot ? (isBooked ? "destructive" : "default") : "outline"}
                        onClick={() => !existingSlot && handleCreateSlot(startTime, endTime)}
                        disabled={!!existingSlot}
                        className="h-16 flex flex-col text-sm"
                        data-testid={`slot-${startTime}-${endTime}`}
                      >
                        <Clock className="h-4 w-4 mb-1" />
                        <span>{startTime} - {endTime}</span>
                        {existingSlot && (
                          <span className="text-xs mt-1">
                            {existingSlot.currentBookings}/{existingSlot.maxCapacity} booked
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border-2 border-gray-300 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span>Open Slot</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-600 rounded"></div>
                    <span>Fully Booked</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bulk-creation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Slot Creation</CardTitle>
              <CardDescription>Create time slots for multiple staff members at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-gray-500 py-8">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Bulk creation tools coming soon...</p>
                <p className="text-sm">Create slots for all staff members with a single click</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Staff Dialog */}
      <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Add a new staff member to your team to manage their individual time slots
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staff-name">Staff Member Name</Label>
              <Input
                id="staff-name"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="Enter staff member name"
                data-testid="input-staff-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-specialties">Specialties (comma-separated)</Label>
              <Textarea
                id="staff-specialties"
                value={newStaffSpecialties}
                onChange={(e) => setNewStaffSpecialties(e.target.value)}
                placeholder="e.g., Hair Styling, Coloring, Extensions"
                data-testid="input-staff-specialties"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleCreateStaff}
              disabled={!newStaffName.trim() || createStaffMutation.isPending}
              data-testid="button-create-staff"
            >
              {createStaffMutation.isPending ? "Creating..." : "Add Staff Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}