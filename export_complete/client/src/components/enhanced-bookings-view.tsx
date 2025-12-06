import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, DollarSign, Users } from "lucide-react";
import { format, parseISO, isToday, isTomorrow, isAfter, startOfDay } from "date-fns";

interface EnhancedBookingsViewProps {
  providerId: string;
}

interface Booking {
  id: string;
  appointmentDate: string;
  status: string;
  servicePrice: string;
  platformFee: string;
  totalPrice: string;
  clientName: string;
  clientPhone: string;
  staffMember?: { id: string; name: string };
  globalService?: { id: string; name: string };
}

export default function EnhancedBookingsView({ providerId }: EnhancedBookingsViewProps) {
  // Fetch all bookings for this provider
  const { data: allBookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/provider", providerId],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/provider/${providerId}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  // Group bookings by date
  const bookingsByDate = allBookings.reduce((acc, booking) => {
    const date = format(parseISO(booking.appointmentDate), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  // Sort dates
  const sortedDates = Object.keys(bookingsByDate).sort();

  // Categorize dates
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const tomorrowDate = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
  
  const todayBookings = bookingsByDate[todayDate] || [];
  const tomorrowBookings = bookingsByDate[tomorrowDate] || [];
  const futureDates = sortedDates.filter(date => date > tomorrowDate);

  // Calculate revenue by staff for a given set of bookings
  const calculateStaffRevenue = (bookings: Booking[]) => {
    const staffRevenue: Record<string, { name: string; bookings: Booking[]; revenue: number; count: number }> = {};
    
    bookings.forEach(booking => {
      const staffId = booking.staffMember?.id || 'unassigned';
      const staffName = booking.staffMember?.name || 'Unassigned';
      
      if (!staffRevenue[staffId]) {
        staffRevenue[staffId] = {
          name: staffName,
          bookings: [],
          revenue: 0,
          count: 0,
        };
      }
      
      staffRevenue[staffId].bookings.push(booking);
      // Provider gets 100% of service price (not platform fee)
      staffRevenue[staffId].revenue += parseFloat(booking.servicePrice || '0');
      staffRevenue[staffId].count += 1;
    });
    
    return Object.values(staffRevenue);
  };

  // Calculate total revenue for bookings
  const calculateTotalRevenue = (bookings: Booking[]) => {
    return bookings.reduce((sum, booking) => sum + parseFloat(booking.servicePrice || '0'), 0);
  };

  // Render booking card with staff breakdown
  const renderDateSection = (title: string, date: string, bookings: Booking[], icon: React.ReactNode) => {
    if (bookings.length === 0) return null;

    const staffBreakdown = calculateStaffRevenue(bookings);
    const totalRevenue = calculateTotalRevenue(bookings);

    return (
      <Card key={date} className="mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {icon}
              <div>
                <CardTitle className="text-xl font-bold">{title}</CardTitle>
                <p className="text-sm text-gray-600">{format(parseISO(date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-gray-600">Total Revenue</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {staffBreakdown.map((staff, idx) => (
            <div key={staff.name} className={idx > 0 ? 'mt-6 pt-6 border-t' : ''}>
              {/* Staff Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{staff.name}</h3>
                    <p className="text-xs text-gray-600">{staff.count} booking{staff.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">₹{staff.revenue.toFixed(2)}</div>
                  <p className="text-xs text-gray-600">Staff Revenue</p>
                </div>
              </div>

              {/* Staff Bookings */}
              <div className="space-y-3 ml-12">
                {staff.bookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {format(parseISO(booking.appointmentDate), 'h:mm a')}
                          </span>
                          <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'completed' ? 'secondary' : 'outline'}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{booking.clientName}</span>
                            <span className="text-gray-500">• {booking.clientPhone}</span>
                          </div>
                          <div className="text-gray-600">
                            {booking.globalService?.name || 'Service'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold text-green-700">₹{parseFloat(booking.servicePrice || '0').toFixed(2)}</div>
                        <div className="text-xs text-gray-500">Service</div>
                        <div className="text-xs text-gray-400">+₹{parseFloat(booking.platformFee || '0').toFixed(2)} fee</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Today's Bookings */}
      {renderDateSection(
        "Today's Bookings",
        todayDate,
        todayBookings,
        <Calendar className="w-6 h-6 text-blue-600" />
      )}

      {/* Tomorrow's Bookings */}
      {renderDateSection(
        "Tomorrow's Bookings",
        tomorrowDate,
        tomorrowBookings,
        <Calendar className="w-6 h-6 text-purple-600" />
      )}

      {/* Future Bookings */}
      {futureDates.map(date => 
        renderDateSection(
          "Upcoming Bookings",
          date,
          bookingsByDate[date],
          <Calendar className="w-6 h-6 text-gray-600" />
        )
      )}

      {/* No Bookings Message */}
      {allBookings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Bookings Yet</h3>
            <p className="text-gray-500">You don't have any bookings scheduled at the moment.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
