import { useState } from "react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Users, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DemoSlots() {
  const { toast } = useToast();
  const [staffCount, setStaffCount] = useState(10);
  const [staffNames, setStaffNames] = useState<Record<number, string>>({});
  const [slotStates, setSlotStates] = useState<Record<string, { isAvailable: boolean; bookingsCount: number }>>({});
  const [editingStaff, setEditingStaff] = useState<number | null>(null);

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  const staffMembers = Array.from({ length: staffCount }, (_, index) => {
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

  const handleStaffNameUpdate = (staffIndex: number, newName: string) => {
    setStaffNames(prev => ({ ...prev, [staffIndex]: newName }));
    setEditingStaff(null);
    toast({
      title: "Staff name updated",
      description: `Updated name for staff member ${staffIndex}`,
    });
  };

  const enableAllMorning = () => {
    const morningSlots = ["09:00", "10:00", "11:00", "12:00"];
    const newStates: Record<string, { isAvailable: boolean; bookingsCount: number }> = {};
    
    for (let i = 1; i <= staffCount; i++) {
      morningSlots.forEach(time => {
        const key = `${i}-${time}`;
        newStates[key] = { isAvailable: true, bookingsCount: 0 };
      });
    }
    
    setSlotStates(prev => ({ ...prev, ...newStates }));
    toast({
      title: "Morning slots enabled",
      description: `Enabled 9 AM - 12 PM for all ${staffCount} staff members`,
    });
  };

  const enableAllAfternoon = () => {
    const afternoonSlots = ["13:00", "14:00", "15:00", "16:00", "17:00"];
    const newStates: Record<string, { isAvailable: boolean; bookingsCount: number }> = {};
    
    for (let i = 1; i <= staffCount; i++) {
      afternoonSlots.forEach(time => {
        const key = `${i}-${time}`;
        newStates[key] = { isAvailable: true, bookingsCount: 0 };
      });
    }
    
    setSlotStates(prev => ({ ...prev, ...newStates }));
    toast({
      title: "Afternoon slots enabled",
      description: `Enabled 1 PM - 5 PM for all ${staffCount} staff members`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Staff Slot Management Demo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Immediate slot management for {staffCount} staff members
          </p>

          <div className="flex items-center justify-center gap-4 mb-6">
            <label className="text-sm font-medium">Staff Count:</label>
            <Input 
              type="number" 
              min="1" 
              max="20" 
              value={staffCount}
              onChange={(e) => setStaffCount(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <Button onClick={() => window.location.reload()}>
              Update
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold">{staffCount}</p>
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
                  <p className="text-2xl font-bold">
                    {staffMembers.reduce((total, staff) => 
                      total + staff.slots.filter(slot => slot.isAvailable).length, 0)}
                  </p>
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
                  <p className="text-2xl font-bold">{staffCount * timeSlots.length}</p>
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
                  <p className="text-2xl font-bold">
                    {staffMembers.reduce((total, staff) => 
                      total + staff.slots.filter(slot => slot.bookingsCount > 0).length, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button onClick={enableAllMorning} className="bg-green-600 hover:bg-green-700">
            Enable All Morning Slots (9 AM - 12 PM)
          </Button>
          <Button onClick={enableAllAfternoon} className="bg-blue-600 hover:bg-blue-700">
            Enable All Afternoon Slots (1 PM - 5 PM)
          </Button>
        </div>

        {/* Individual Staff Slot Management */}
        <div className="space-y-6">
          {staffMembers.map(({ staffIndex, name, slots }) => (
            <Card key={staffIndex} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-6 w-6 text-blue-600" />
                    {editingStaff === staffIndex ? (
                      <Input
                        defaultValue={name}
                        className="font-semibold text-lg max-w-xs"
                        onBlur={(e) => handleStaffNameUpdate(staffIndex, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleStaffNameUpdate(staffIndex, e.currentTarget.value);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <h3 
                        className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => setEditingStaff(staffIndex)}
                      >
                        {name}
                      </h3>
                    )}
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {slots.filter(slot => slot.isAvailable).length}/{slots.length} available
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
                  {slots.map(({ id, time, isAvailable, bookingsCount }) => {
                    const getSlotStyle = () => {
                      if (bookingsCount > 0) return "bg-green-500 text-white border-green-500"; // Booked
                      if (isAvailable) return "bg-white text-green-600 border-green-500 hover:bg-green-50"; // Available
                      return "bg-gray-100 text-gray-400 border-gray-300"; // Unavailable
                    };

                    return (
                      <Button
                        key={id}
                        variant="outline"
                        size="sm"
                        className={`${getSlotStyle()} transition-all duration-200 font-medium`}
                        onClick={() => handleSlotToggle(staffIndex, time)}
                        data-testid={`slot-${staffIndex}-${time}`}
                      >
                        {time}
                        {bookingsCount > 0 && (
                          <span className="ml-1 text-xs">({bookingsCount})</span>
                        )}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
                  <span>Click any time slot to toggle availability</span>
                  <span>{slots.filter(s => s.isAvailable).length} slots available</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click any staff member name to rename them</li>
            <li>• Click any time slot button to toggle availability</li>
            <li>• Green outline = Available, Solid green = Booked, Gray = Unavailable</li>
            <li>• Use quick action buttons to enable all morning or afternoon slots</li>
            <li>• Change staff count at the top to see immediate updates</li>
          </ul>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}