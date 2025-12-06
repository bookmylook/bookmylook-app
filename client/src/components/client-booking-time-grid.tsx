import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, User, CheckCircle, Users, RefreshCw } from "lucide-react";
import type { StaffSlot, ClientBookingTimeGridProps } from "@/lib/booking-shared";

export default function ClientBookingTimeGrid({
  groupedTimeSlots,
  selectedTime,
  selectedStaffId,
  onTimeSelect,
  onStaffSelect,
  selectedDate,
  className = "",
  onRefresh
}: ClientBookingTimeGridProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getSlotColor = (slot: StaffSlot, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-blue-100 border-blue-500 text-blue-800 ring-2 ring-blue-200';
    } else if (slot.isPassed) {
      return 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 cursor-not-allowed';
    } else if (slot.isBooked) {
      return 'bg-red-100 border-red-300 text-red-800';
    } else {
      return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200 cursor-pointer';
    }
  };

  const getTimeSlotStats = (slots: StaffSlot[]) => {
    const available = slots.filter(s => !s.isBooked && !s.isPassed).length;
    const booked = slots.filter(s => s.isBooked).length;
    const passed = slots.filter(s => s.isPassed).length;
    return { available, booked, passed, total: slots.length };
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Select Time Slot</span>
          </CardTitle>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(selectedDate)}</span>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="flex items-center space-x-1 text-xs"
                data-testid="button-refresh-availability"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Availability Legend */}
        <div className="flex items-center justify-center space-x-4 text-xs mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-green-800">Available</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span className="text-red-800">Booked</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
            <span className="text-blue-800">Selected</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded opacity-50"></div>
            <span className="text-gray-500">Past Time</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {Object.keys(groupedTimeSlots).length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No available time slots for this date</p>
            <p className="text-sm text-gray-400 mt-2">Please choose a different date</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTimeSlots)
              // Filter out time slots where ALL staff members have passed
              .filter(([time, slots]: [string, StaffSlot[]]) => {
                const allPassed = slots.every(s => s.isPassed);
                return !allPassed; // Only show if at least one staff is not passed
              })
              .map(([time, slots]: [string, StaffSlot[]]) => {
              const stats = getTimeSlotStats(slots);
              const availableSlots = slots.filter(s => !s.isBooked && !s.isPassed);
              const bookedSlots = slots.filter(s => s.isBooked);
              const isTimeSelected = selectedTime?.startsWith(time);
              
              return (
                <div key={time} className="bg-white border border-gray-200 rounded-lg p-4">
                  {/* Time Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-800 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-blue-600" />
                        {time}
                      </h4>
                      <div className="flex space-x-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          {stats.available} Available
                        </Badge>
                        {stats.booked > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                            {stats.booked} Booked
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Time Selection Button */}
                    <Button
                      type="button"
                      variant={isTimeSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => onTimeSelect(time)}
                      className={isTimeSelected ? 'bg-blue-600 text-white' : ''}
                      data-testid={`time-select-${time}`}
                    >
                      {isTimeSelected ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Selected
                        </>
                      ) : (
                        `Select ${time}`
                      )}
                    </Button>
                  </div>

                  {/* Staff Slot Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {slots.map((slot) => {
                      const isSelected = isTimeSelected && selectedStaffId === slot.staffId;
                      const canSelect = !slot.isBooked && !slot.isPassed;
                      
                      return (
                        <div
                          key={`${slot.time}-${slot.staffId}`}
                          className={`
                            group relative p-3 rounded-lg border-2 transition-all duration-200
                            ${getSlotColor(slot, isSelected)}
                            ${canSelect && !isSelected ? 'hover:shadow-md' : ''}
                          `}
                          onClick={() => {
                            if (canSelect) {
                              onStaffSelect(slot.staffId, slot.staffName, time);
                            }
                          }}
                          data-testid={`staff-slot-${slot.time}-${slot.staffId}`}
                          title={
                            slot.isPassed ? 'Time slot has passed' :
                            slot.isBooked ? `Booked by ${slot.staffName}` :
                            isSelected ? `Selected: ${slot.staffName}` :
                            `Available with ${slot.staffName}`
                          }
                        >
                          <div className="text-center">
                            {/* Staff Info */}
                            <div className="flex items-center justify-center mb-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-blue-600 text-white' 
                                  : slot.isBooked 
                                    ? 'bg-red-500 text-white'
                                    : 'bg-green-500 text-white'
                              }`}>
                                <User className="w-4 h-4" />
                              </div>
                            </div>
                            
                            <div className="font-medium text-sm truncate">
                              {slot.staffName}
                            </div>
                            
                            <div className="text-xs mt-1">
                              {slot.isPassed ? '⏰ Passed' : 
                               slot.isBooked ? '❌ Booked' :
                               isSelected ? '✅ Selected' : '✅ Available'}
                            </div>
                            
                            {isSelected && (
                              <div className="mt-2">
                                <CheckCircle className="w-4 h-4 mx-auto text-blue-600" />
                              </div>
                            )}
                          </div>
                          
                          {/* Hover tooltip for staff details */}
                          {canSelect && !isSelected && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                              <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg">
                                Click to book with {slot.staffName}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Additional Info for Multi-Staff Scenarios */}
                  {stats.total > 1 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center text-sm text-blue-800">
                        <Users className="w-4 h-4 mr-2" />
                        <span>
                          {stats.available > 0 
                            ? `${stats.available} staff member${stats.available > 1 ? 's' : ''} available at ${time}`
                            : `All staff members are booked at ${time}`
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Summary Information */}
        {Object.keys(groupedTimeSlots).length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <div className="text-sm text-gray-700">
              <div className="font-semibold mb-2">Booking Instructions:</div>
              <div className="space-y-1 text-xs">
                <div>1. Select a time slot you prefer</div>
                <div>2. Choose an available staff member</div>
                <div>3. Complete your booking details</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}