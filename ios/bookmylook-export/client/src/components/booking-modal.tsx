import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { X, Clock } from "lucide-react";
import { ProviderWithServices } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BookingModalProps {
  provider: ProviderWithServices;
  selectedServiceId?: string | null;
  onClose: () => void;
}

const bookingSchema = z.object({
  serviceId: z.string().min(1, "Please select a service"),
  appointmentDate: z.date({
    required_error: "Please select a date",
  }),
  appointmentTime: z.string().min(1, "Please select a time"),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const allTimeSlots = [
  "9:00 AM", "10:30 AM", "12:00 PM", "2:00 PM", "3:30 PM", "5:00 PM"
];

export default function BookingModal({ provider, selectedServiceId, onClose }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { toast } = useToast();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      serviceId: selectedServiceId || "",
      notes: "",
    },
  });

  const selectedService = provider.services.find(s => s.id === form.watch("serviceId"));

  const bookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      // In a real app, you would get the client ID from authentication
      const clientId = "demo-client-id";
      
      const [time, period] = data.appointmentTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      
      if (period === 'PM' && hours !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }
      
      const appointmentDateTime = new Date(data.appointmentDate);
      appointmentDateTime.setHours(hour24, minutes || 0, 0, 0);
      
      const response = await apiRequest("POST", "/api/bookings", {
        clientId,
        serviceId: data.serviceId,
        providerId: provider.id,
        appointmentDate: appointmentDateTime.toISOString(),
        totalPrice: selectedService?.price || "0",
        notes: data.notes,
        status: "pending",
      });
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Booking confirmed!",
        description: "You will receive a confirmation email shortly.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Booking failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        variant: "destructive",
      });
      return;
    }
    
    bookingMutation.mutate({
      ...data,
      appointmentDate: selectedDate,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl dark:text-white">Book with {provider.user?.firstName} {provider.user?.lastName}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5 dark:text-white" />
            </Button>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Service Selection */}
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Select Service</h4>
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-3"
                      >
                        {provider.services.map((service) => (
                          <div key={service.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-750">
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value={service.id} id={service.id} />
                              <label htmlFor={service.id} className="flex-1 cursor-pointer">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-medium text-gray-800 dark:text-gray-100">{service.name}</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{service.description}</p>
                                    <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                                      <Clock className="w-4 h-4 mr-1" />
                                      {service.duration} min
                                    </div>
                                  </div>
                                  <span className="font-medium text-professional-teal dark:text-teal-400 text-lg">
                                    ${service.price}
                                  </span>
                                </div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Date Selection */}
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Select Date</h4>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today || date.getDay() === 0; // Allow today, disable past dates and Sundays
                }}
                className="rounded-md border"
              />
            </div>
            
            {/* Time Selection */}
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Available Times</h4>
              <FormField
                control={form.control}
                name="appointmentTime"
                render={({ field }) => {
                  // Filter time slots for same-day bookings (1-hour advance notice)
                  const getAvailableTimeSlots = () => {
                    if (!selectedDate) return allTimeSlots;
                    
                    const isToday = selectedDate.toDateString() === new Date().toDateString();
                    if (!isToday) return allTimeSlots;
                    
                    const now = new Date();
                    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
                    
                    return allTimeSlots.filter(timeSlot => {
                      const [time, period] = timeSlot.split(' ');
                      const [hours, minutes] = time.split(':').map(Number);
                      let hour24 = hours;
                      
                      if (period === 'PM' && hours !== 12) {
                        hour24 += 12;
                      } else if (period === 'AM' && hours === 12) {
                        hour24 = 0;
                      }
                      
                      const slotDateTime = new Date(selectedDate);
                      slotDateTime.setHours(hour24, minutes || 0, 0, 0);
                      
                      return slotDateTime >= oneHourFromNow;
                    });
                  };
                  
                  const availableSlots = getAvailableTimeSlots();
                  const isToday = selectedDate?.toDateString() === new Date().toDateString();
                  
                  return (
                    <FormItem>
                      <FormControl>
                        <div>
                          {isToday && availableSlots.length < allTimeSlots.length && (
                            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-700 dark:text-blue-200">
                              ⏰ Same-day booking: Only slots 1+ hours from now are available
                            </div>
                          )}
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-3 gap-3"
                          >
                            {availableSlots.length === 0 ? (
                              <div className="col-span-3 text-center py-4 text-gray-500 dark:text-gray-400">
                                {isToday ? "No available time slots for today. Please select a future date." : "No available time slots."}
                              </div>
                            ) : (
                              availableSlots.map((time) => (
                                <div key={time}>
                                  <RadioGroupItem value={time} id={time} className="peer sr-only" />
                                  <label
                                    htmlFor={time}
                                    className="flex items-center justify-center px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm cursor-pointer hover:bg-soft-pink dark:hover:bg-gray-700 peer-checked:bg-professional-teal peer-checked:text-white transition-colors dark:bg-gray-750 dark:text-gray-200"
                                  >
                                    {time}
                                  </label>
                                </div>
                              ))
                            )}
                          </RadioGroup>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
            
            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-gray-200">Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any special requests or information for your appointment..."
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Booking Summary */}
            {selectedService && selectedDate && form.watch("appointmentTime") && (
              <div className="bg-warm-beige dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Booking Summary</h4>
                <div className="space-y-2 text-sm dark:text-gray-200">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date & Time:</span>
                    <span>
                      {selectedDate.toLocaleDateString()} at {form.watch("appointmentTime")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <span>{provider.user?.firstName} {provider.user?.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{selectedService.duration} minutes</span>
                  </div>
                  <Separator className="my-2 dark:bg-gray-600" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span className="text-professional-teal dark:text-teal-400">${selectedService.price}</span>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-professional-teal text-white hover:bg-professional-teal/90"
              disabled={bookingMutation.isPending}
            >
              {bookingMutation.isPending ? "Confirming..." : "Confirm Booking"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
