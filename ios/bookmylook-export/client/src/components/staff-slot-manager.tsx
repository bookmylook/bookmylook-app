import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Clock, Plus, Users, Edit, Calendar, User, Settings, CheckCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Provider } from "@shared/schema";

interface StaffSlotManagerProps {
  providerId: string;
  provider: Provider;
}

interface ManagerStaffSlot {
  id: string;
  staffName: string;
  timeSlot: string;
  isAvailable: boolean;
  bookingsCount: number;
  maxCapacity: number;
}

export default function StaffSlotManager({ providerId, provider }: StaffSlotManagerProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingStaff, setEditingStaff] = useState<number | null>(null);
  const [staffNames, setStaffNames] = useState<Record<number, string>>({});
  const [slotStates, setSlotStates] = useState<Record<string, { isAvailable: boolean; bookingsCount: number }>>({});

  // Generate time slots
  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  // Create staff members array
  const staffMembers = Array.from({ length: provider.staffCount || 1 }, (_, index) => {
    const staffIndex = index + 1;
    return {
      staffIndex,
      name: staffNames[staffIndex] || `Staff Member ${staffIndex}`,
      slots: timeSlots.map(time => ({
        id: `${staffIndex}-${time}`,
        time,
        isAvailable: slotStates[`${staffIndex}-${time}`]?.isAvailable ?? true,
        bookingsCount: slotStates[`${staffIndex}-${time}`]?.bookingsCount ?? 0,
      })),
    };
  });

  const handleStaffNameEdit = (staffIndex: number, newName: string) => {
    setStaffNames(prev => ({
      ...prev,
      [staffIndex]: newName
    }));
    setEditingStaff(null);
    toast({
      title: "Staff name updated",
      description: `Updated name for staff member ${staffIndex}`,
    });
  };

  const handleSlotToggle = (staffIndex: number, timeSlot: string) => {
    const slotKey = `${staffIndex}-${timeSlot}`;
    setSlotStates(prev => ({
      ...prev,
      [slotKey]: {
        isAvailable: !(prev[slotKey]?.isAvailable ?? true),
        bookingsCount: prev[slotKey]?.bookingsCount ?? 0,
      }
    }));
    
    const staffName = staffNames[staffIndex] || `Staff Member ${staffIndex}`;
    const newState = !(slotStates[slotKey]?.isAvailable ?? true);
    
    toast({
      title: `Slot ${newState ? 'enabled' : 'disabled'}`,
      description: `${staffName} - ${timeSlot} is now ${newState ? 'available' : 'unavailable'}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Staff Slot Management</h2>
          <p className="text-gray-600">Manage individual slots for your {provider.staffCount} staff members</p>
        </div>
        <div className="flex items-center space-x-4">
          <Label htmlFor="date-select">Date:</Label>
          <Input
            id="date-select"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Available Slots</p>
                <p className="text-2xl font-bold">{staffMembers.reduce((total, staff) => 
                  total + staff.slots.filter(slot => slot.isAvailable).length, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Slots</p>
                <p className="text-2xl font-bold">{staffMembers.length * timeSlots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Booked</p>
                <p className="text-2xl font-bold">{staffMembers.reduce((total, staff) => 
                  total + staff.slots.filter(slot => slot.bookingsCount > 0).length, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Staff Slot Management */}
      <div className="space-y-6">
        {staffMembers.map(({ staffIndex, name, slots }) => (
          <Card key={staffIndex} className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    {editingStaff === staffIndex ? (
                      <Input
                        defaultValue={name}
                        className="h-8 text-lg font-semibold"
                        onBlur={(e) => handleStaffNameEdit(staffIndex, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleStaffNameEdit(staffIndex, e.currentTarget.value);
                          }
                        }}
                        autoFocus
                        data-testid={`input-staff-name-${staffIndex}`}
                      />
                    ) : (
                      <CardTitle 
                        className="text-lg cursor-pointer hover:text-blue-600"
                        onClick={() => setEditingStaff(staffIndex)}
                        data-testid={`text-staff-name-${staffIndex}`}
                      >
                        {name}
                      </CardTitle>
                    )}
                    <CardDescription>
                      {slots.filter(s => s.isAvailable).length} available slots for {format(new Date(selectedDate), 'PPP')}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingStaff(staffIndex)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Name
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                {slots.map(({ id, time, isAvailable, bookingsCount }) => (
                  <Button
                    key={id}
                    variant={isAvailable ? (bookingsCount > 0 ? "default" : "outline") : "secondary"}
                    className={`h-16 flex flex-col text-sm transition-all duration-200 ${
                      isAvailable 
                        ? bookingsCount > 0 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : "border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() => handleSlotToggle(staffIndex, time)}
                    disabled={!isAvailable}
                    data-testid={`slot-button-${staffIndex}-${time}`}
                  >
                    <Clock className="h-4 w-4 mb-1" />
                    <span className="font-medium">{time}</span>
                    {bookingsCount > 0 && (
                      <span className="text-xs mt-1">
                        {bookingsCount} booked
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border-2 border-dashed border-gray-300 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded"></div>
                    <span>Unavailable</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-medium">{slots.filter(s => s.isAvailable).length}</span> available slots
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-800">Quick Actions</CardTitle>
          <CardDescription>Manage all staff slots at once</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                toast({
                  title: "All slots enabled",
                  description: "All staff members now have available slots for today",
                });
              }}
              data-testid="button-enable-all-slots"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Enable All Slots
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                toast({
                  title: "Morning slots enabled",
                  description: "9 AM - 12 PM slots enabled for all staff",
                });
              }}
              data-testid="button-enable-morning-slots"
            >
              <Clock className="h-4 w-4 mr-2" />
              Enable Morning Only
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                toast({
                  title: "Afternoon slots enabled", 
                  description: "1 PM - 5 PM slots enabled for all staff",
                });
              }}
              data-testid="button-enable-afternoon-slots"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Enable Afternoon Only
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}