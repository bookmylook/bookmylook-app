import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Star, CheckCircle } from "lucide-react";
import type { StaffMember, StaffSlot, StaffSelectionGridProps } from "@/lib/booking-shared";

export default function StaffSelectionGrid({
  staffMembers,
  staffTimeSlots,
  selectedTime,
  selectedStaffId,
  onStaffSelect,
  className = ""
}: StaffSelectionGridProps) {
  // Get available staff for the selected time
  const getAvailableStaffForTime = () => {
    if (!selectedTime) return [];
    
    return staffTimeSlots
      .filter(slot => slot.time === selectedTime && !slot.isBooked && !slot.isPassed)
      .map(slot => {
        const staffMember = staffMembers.find(staff => staff.id === slot.staffId);
        return staffMember ? { ...staffMember, slot } : null;
      })
      .filter(Boolean);
  };

  const availableStaff = getAvailableStaffForTime();

  // If only one staff member is available, auto-select them
  if (availableStaff.length === 1 && !selectedStaffId) {
    const staff = availableStaff[0];
    if (staff) {
      onStaffSelect(staff.id, staff.name);
    }
  }

  if (!selectedTime) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please select a time first to see available staff</p>
        </CardContent>
      </Card>
    );
  }

  if (availableStaff.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No staff available for the selected time</p>
          <p className="text-sm text-gray-400 mt-2">Please choose a different time slot</p>
        </CardContent>
      </Card>
    );
  }

  if (availableStaff.length === 1) {
    const staff = availableStaff[0];
    return (
      <Card className={`${className} border-green-200 bg-green-50`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              {staff?.profileImage ? (
                <img 
                  src={staff.profileImage} 
                  alt={staff.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800">{staff?.name}</h4>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">Only Available</Badge>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              {staff?.specialties && staff.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {staff.specialties.slice(0, 2).map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {staff.specialties.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{staff.specialties.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Multiple staff available - show grid selection
  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Choose Your Staff Member</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableStaff.map((staff) => {
          if (!staff) return null;
          
          const isSelected = selectedStaffId === staff.id;
          
          return (
            <Card 
              key={staff.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => onStaffSelect(staff.id, staff.name)}
              data-testid={`staff-card-${staff.id}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center space-y-3">
                  {/* Staff Avatar */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                      : 'bg-gradient-to-br from-gray-500 to-gray-600'
                  }`}>
                    {staff.profileImage ? (
                      <img 
                        src={staff.profileImage} 
                        alt={staff.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-white" />
                    )}
                  </div>

                  {/* Staff Name */}
                  <div className="text-center">
                    <h4 className={`font-semibold ${
                      isSelected ? 'text-blue-800' : 'text-gray-800'
                    }`}>
                      {staff.name}
                    </h4>
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="flex items-center justify-center mt-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-blue-600 ml-1 font-medium">Selected</span>
                      </div>
                    )}
                  </div>

                  {/* Specialties */}
                  {staff.specialties && staff.specialties.length > 0 && (
                    <div className="w-full">
                      <div className="flex flex-wrap justify-center gap-1">
                        {staff.specialties.slice(0, 3).map((specialty, index) => (
                          <Badge 
                            key={index} 
                            variant={isSelected ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            {specialty}
                          </Badge>
                        ))}
                        {staff.specialties.length > 3 && (
                          <Badge 
                            variant={isSelected ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            +{staff.specialties.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rating (placeholder for future) */}
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">4.8</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Selection Helper Text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 text-center">
          ✨ Click on a staff member to select them for your appointment at {selectedTime}
        </p>
      </div>
    </div>
  );
}