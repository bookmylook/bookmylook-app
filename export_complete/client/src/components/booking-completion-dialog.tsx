import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BookingCompletionDialogProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function BookingCompletionDialog({ 
  booking, 
  isOpen, 
  onClose, 
  onComplete 
}: BookingCompletionDialogProps) {
  const [actualEndTime, setActualEndTime] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const { toast } = useToast();

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      const now = new Date();
      const [hours, minutes] = actualEndTime.split(':');
      const actualEnd = new Date(now);
      actualEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const scheduledEnd = new Date(booking.appointmentEndTime || booking.appointmentDate);
      
      const response = await apiRequest(`/api/bookings/${booking.id}`, "PATCH", {
        status: "completed",
        actualEndTime: actualEnd.toISOString(),
      });

      if (!response.ok) {
        throw new Error("Failed to complete booking");
      }

      const overtimeMinutes = Math.floor((actualEnd.getTime() - scheduledEnd.getTime()) / (1000 * 60));
      
      if (overtimeMinutes > 0) {
        toast({
          title: "Service Completed with Overtime",
          description: `Service ran ${overtimeMinutes} minutes over. Checking for affected bookings...`,
          variant: "default",
        });
      } else {
        toast({
          title: "Service Completed",
          description: "Booking marked as completed successfully",
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/provider'] });
      onComplete();
      onClose();
    } catch (error) {
      console.error("Error completing booking:", error);
      toast({
        title: "Error",
        description: "Failed to complete booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkForOvertime = () => {
    const now = new Date();
    const [hours, minutes] = actualEndTime.split(':');
    const actualEnd = new Date(now);
    actualEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const scheduledEnd = new Date(booking.appointmentEndTime || booking.appointmentDate);
    const overtimeMinutes = Math.floor((actualEnd.getTime() - scheduledEnd.getTime()) / (1000 * 60));
    
    setShowWarning(overtimeMinutes > 0);
  };

  const formatScheduledTime = () => {
    const start = new Date(booking.appointmentDate);
    const end = new Date(booking.appointmentEndTime || booking.appointmentDate);
    return `${start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Complete Service
          </DialogTitle>
          <DialogDescription>
            Mark when the service actually ended. If it ran overtime, affected bookings will be automatically rescheduled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Client</Label>
            <div className="text-sm text-gray-700">{booking.clientName}</div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Token Number</Label>
            <div className="text-sm text-gray-700 font-mono">{booking.tokenNumber}</div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Scheduled Time</Label>
            <div className="text-sm text-gray-700">{formatScheduledTime()}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actualEndTime" className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Actual End Time
            </Label>
            <Input
              id="actualEndTime"
              type="time"
              value={actualEndTime}
              onChange={(e) => {
                setActualEndTime(e.target.value);
                checkForOvertime();
              }}
              onBlur={checkForOvertime}
              className="font-mono"
              data-testid="input-actual-end-time"
            />
          </div>

          {showWarning && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                <strong>Overtime Detected!</strong>
                <br />
                The system will automatically reschedule any conflicting bookings to the nearest available time slot and notify affected clients via SMS.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-confirm-completion"
          >
            {isSubmitting ? "Completing..." : "Complete Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
