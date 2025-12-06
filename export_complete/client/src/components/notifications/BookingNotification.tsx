import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Phone, Calendar, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';

interface NotificationData {
  bookingId: string;
  tokenNumber: string;
  clientName: string;
  serviceName: string;
  appointmentDate: string;
  totalPrice: string;
  clientPhone: string;
}

interface BookingNotificationProps {
  notification: {
    type: string;
    data: NotificationData;
  };
  onClose: () => void;
}

export function BookingNotification({ notification, onClose }: BookingNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Auto-hide notification after 30 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 30000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ maxWidth: '400px' }}
    >
      <Card className="border-2 border-green-500 bg-white shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-500 text-white font-bold text-sm">
                  🔔 NEW BOOKING
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  {notification.data.tokenNumber}
                </Badge>
              </div>
              
              <h3 className="font-semibold text-lg text-gray-900 mb-1">
                {notification.data.clientName}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Service:</span>
                  <span>{notification.data.serviceName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(notification.data.appointmentDate)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold">${notification.data.totalPrice}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a 
                    href={`tel:${notification.data.clientPhone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {notification.data.clientPhone}
                  </a>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleClose}
                >
                  ✓ Acknowledge
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setLocation('/provider-dashboard')}
                >
                  View Dashboard
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}