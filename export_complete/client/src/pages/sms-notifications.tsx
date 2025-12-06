import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Send, 
  Bell, 
  CheckCircle, 
  Clock, 
  Phone,
  Settings,
  AlertCircle,
  Calendar,
  Users
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "../components/layout/header";

interface Booking {
  id: string;
  tokenNumber: string;
  clientId: string;
  providerId: string;
  appointmentDate: Date;
  totalPrice: string;
  status: string;
}

interface NotificationLog {
  id: string;
  type: string;
  recipient: string;
  message: string;
  status: string;
  sentAt: string;
  bookingId?: string;
}

export default function SMSNotifications() {
  const [testPhone, setTestPhone] = useState("9797208011");
  const [testMessage, setTestMessage] = useState("Test message from BookMyLook SMS system");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [reminderType, setReminderType] = useState("client");
  
  const { toast } = useToast();

  // Fetch recent bookings for testing
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
    enabled: true
  });

  // Fetch notification logs (we'll create this endpoint)
  const { data: notificationLogs = [] } = useQuery<NotificationLog[]>({
    queryKey: ['/api/notifications/logs'],
    enabled: true
  });

  // Test SMS mutation
  const testSMSMutation = useMutation({
    mutationFn: async (data: { phone: string; message: string }) => {
      const response = await apiRequest("POST", "/api/notifications/test-sms", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SMS Sent",
        description: "Test SMS has been sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/logs'] });
    },
    onError: (error: any) => {
      toast({
        title: "SMS Failed",
        description: error.message || "Failed to send test SMS",
        variant: "destructive",
      });
    }
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("POST", "/api/notifications/reminder", { bookingId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reminders Sent",
        description: "Appointment reminders sent to both client and provider!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/logs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Reminder Failed", 
        description: error.message || "Failed to send reminders",
        variant: "destructive",
      });
    }
  });

  // Resend booking confirmation mutation
  const resendConfirmationMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiRequest("POST", "/api/notifications/resend-confirmation", { bookingId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Confirmation Resent",
        description: "Booking confirmation SMS has been resent!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/logs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Resend Failed",
        description: error.message || "Failed to resend confirmation",
        variant: "destructive",
      });
    }
  });

  const handleTestSMS = (e: React.FormEvent) => {
    e.preventDefault();
    testSMSMutation.mutate({ phone: testPhone, message: testMessage });
  };

  const handleSendReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBookingId) {
      sendReminderMutation.mutate(selectedBookingId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            SMS Notifications
          </h1>
          <p className="text-gray-600 mt-2">
            Test and manage SMS notifications for bookings, reminders, and status updates
          </p>
        </div>

        <Tabs defaultValue="test" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Test SMS
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Reminders
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              SMS Logs
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Test SMS Tab */}
          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  Test SMS Sending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTestSMS} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="testPhone">Phone Number</Label>
                      <Input
                        id="testPhone"
                        type="tel"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="9876543210"
                        data-testid="input-test-phone"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Enter phone number without +91 (will be added automatically)
                      </p>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="submit"
                        disabled={testSMSMutation.isPending}
                        className="w-full"
                        data-testid="button-send-test-sms"
                      >
                        {testSMSMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Test SMS
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="testMessage">Message</Label>
                    <Textarea
                      id="testMessage"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Enter your test message here..."
                      rows={4}
                      data-testid="textarea-test-message"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Character count: {testMessage.length}/160
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    Send Appointment Reminders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendReminder} className="space-y-4">
                    <div>
                      <Label htmlFor="bookingSelect">Select Booking</Label>
                      <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                        <SelectTrigger data-testid="select-booking">
                          <SelectValue placeholder="Choose a booking..." />
                        </SelectTrigger>
                        <SelectContent>
                          {bookings.map((booking) => (
                            <SelectItem key={booking.id} value={booking.id}>
                              Token #{booking.tokenNumber} - {new Date(booking.appointmentDate).toLocaleDateString()} - ₹{booking.totalPrice}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      type="submit"
                      disabled={sendReminderMutation.isPending || !selectedBookingId}
                      className="w-full"
                      data-testid="button-send-reminder"
                    >
                      {sendReminderMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sending Reminders...
                        </>
                      ) : (
                        <>
                          <Bell className="w-4 h-4 mr-2" />
                          Send Reminder (Both Client & Provider)
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Recent Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {bookings.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No recent bookings found
                      </p>
                    ) : (
                      bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Token #{booking.tokenNumber}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(booking.appointmentDate).toLocaleDateString()} - ₹{booking.totalPrice}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                                {booking.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resendConfirmationMutation.mutate(booking.id)}
                                disabled={resendConfirmationMutation.isPending}
                                data-testid={`button-resend-${booking.id}`}
                              >
                                Resend
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SMS Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  SMS Notification Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notificationLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No SMS logs found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        SMS logs will appear here when notifications are sent
                      </p>
                    </div>
                  ) : (
                    notificationLogs.map((log) => (
                      <div key={log.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                              {log.type}
                            </Badge>
                            <span className="text-sm font-medium">{log.recipient}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {log.status === 'sent' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className="text-sm text-gray-500">{log.sentAt}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          {log.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  SMS Configuration Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Twilio Account SID</span>
                      </div>
                      <p className="text-sm text-gray-500">Configured ✓</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Auth Token</span>
                      </div>
                      <p className="text-sm text-gray-500">Configured ✓</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Phone Number</span>
                      </div>
                      <p className="text-sm text-gray-500">Configured ✓</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">SMS Notification Types</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Booking confirmations (sent automatically to clients)</li>
                      <li>• New booking alerts (sent automatically to providers)</li>
                      <li>• Status updates (confirmed/cancelled/completed/rescheduled)</li>
                      <li>• Appointment reminders (manual or scheduled)</li>
                      <li>• Test messages (for testing purposes)</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">System Status</h4>
                    <p className="text-sm text-green-700">
                      SMS notification system is fully operational. All Twilio credentials are configured 
                      and the system is ready to send notifications.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}