import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, User, Phone, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TimeSlotGridProps {
  providerId: string;
  selectedDate?: Date;
}

interface BookingDetail {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  clientId: string;
  totalPrice: string;
  servicePrice: string;
  tokenNumber: string;
  clientName: string;
  clientPhone: string;
  staffMemberName?: string | null;
  paymentStatus?: string | null;
  services?: string[];
}

interface TimeSlotStaffSlot {
  staffId: string;
  staffName: string;
  booking: BookingDetail | null;
  isAvailable: boolean;
  isBreakTime: boolean;
}

interface HourlySlot {
  hour: number;
  label: string;
  bookings: BookingDetail[];
  isAvailable: boolean;
  bookingCount: number;
  staffSlots: TimeSlotStaffSlot[];
  isBreakTime?: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  isActive: boolean;
  specialties: string[];
}

interface AvailabilityData {
  date: string;
  totalBookings: number;
  availableSlots: number;
  bookedSlots: number;
  hourlyAvailability: HourlySlot[];
  staffMembers: StaffMember[];
}

export default function TimeSlotGrid({ providerId, selectedDate }: TimeSlotGridProps) {
  const dateString = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const { data: availabilityData, isLoading, refetch } = useQuery<AvailabilityData>({
    queryKey: ['/api/provider', providerId, 'availability', dateString],
    queryFn: async () => {
      const response = await fetch(`/api/provider/${providerId}/availability/${dateString}`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    },
    refetchInterval: 30000,
    staleTime: 0,
  });

  const timeSlots = availabilityData?.hourlyAvailability || [];
  const totalBookings = availabilityData?.totalBookings || 0;

  // Extract all bookings from time slots
  const allBookings: (BookingDetail & { timeLabel: string })[] = [];
  
  timeSlots.forEach(slot => {
    slot.staffSlots?.forEach(staffSlot => {
      if (staffSlot.booking) {
        allBookings.push({
          ...staffSlot.booking,
          timeLabel: slot.label,
          staffMemberName: staffSlot.staffName
        });
      }
    });
  });

  // Sort bookings by time
  allBookings.sort((a, b) => {
    const timeA = a.appointmentTime || a.timeLabel;
    const timeB = b.appointmentTime || b.timeLabel;
    return timeA.localeCompare(timeB);
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (booking: BookingDetail) => {
    const status = booking.status?.toLowerCase();
    const paymentStatus = booking.paymentStatus?.toLowerCase();
    
    if (status === 'completed') {
      return <Badge className="bg-green-500 text-white">Completed</Badge>;
    } else if (status === 'cancelled') {
      return <Badge className="bg-red-500 text-white">Cancelled</Badge>;
    } else if (paymentStatus === 'confirmed' || paymentStatus === 'paid') {
      return <Badge className="bg-blue-500 text-white">Confirmed & Paid</Badge>;
    } else if (status === 'confirmed') {
      return <Badge className="bg-blue-400 text-white">Confirmed</Badge>;
    } else {
      return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{formatDate(dateString)}</span>
        </div>
        <button 
          onClick={() => refetch()}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          data-testid="refresh-bookings"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Bookings Count */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-800">{allBookings.length}</p>
            <p className="text-sm text-gray-600">
              {allBookings.length === 1 ? 'Booking' : 'Bookings'} for this day
            </p>
          </div>
          {allBookings.length > 0 && (
            <CheckCircle className="w-8 h-8 text-green-500" />
          )}
        </div>
      </div>

      {/* Bookings List */}
      {allBookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Bookings</h3>
          <p className="text-gray-500">You don't have any bookings for this day yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allBookings.map((booking, index) => (
            <Card 
              key={booking.id || index} 
              className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow"
              data-testid={`booking-card-${booking.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Time and Token */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1 text-lg font-semibold text-blue-600">
                        <Clock className="w-4 h-4" />
                        {booking.appointmentTime || booking.timeLabel}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Token #{booking.tokenNumber}
                      </Badge>
                    </div>
                    
                    {/* Client Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-800">{booking.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{booking.clientPhone}</span>
                      </div>
                      {booking.staffMemberName && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>Staff: {booking.staffMemberName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status and Price */}
                  <div className="text-right space-y-2">
                    {getStatusBadge(booking)}
                    <div className="text-lg font-bold text-green-600">
                      ₹{parseFloat(booking.servicePrice || booking.totalPrice || '0').toFixed(0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {allBookings.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Your Earnings</span>
            <span className="font-bold text-green-600">
              ₹{allBookings.reduce((sum, b) => sum + parseFloat(b.servicePrice || b.totalPrice || '0'), 0).toFixed(0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
