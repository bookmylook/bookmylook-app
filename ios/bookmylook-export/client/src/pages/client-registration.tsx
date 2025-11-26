import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { User, Phone, UserCheck } from "lucide-react";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const clientRegistrationSchema = z.object({
  title: z.string().min(1, "Please select a title"),
  name: z.string().min(2, "Name is required (minimum 2 characters)"),
  phone: z.string().min(10, "Valid mobile number is required").max(15, "Invalid mobile number"),
});

type ClientRegistrationData = z.infer<typeof clientRegistrationSchema>;

export default function ClientRegistration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get redirect URL from query params - default to booking page since users register to book services
  const urlParams = new URLSearchParams(window.location.search);
  const redirectAfterRegistration = urlParams.get('redirect') || '/booking';

  const form = useForm<ClientRegistrationData>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: {
      title: "",
      name: "",
      phone: "",
    },
  });

  const registrationMutation = useMutation({
    mutationFn: async (data: ClientRegistrationData) => {
      const response = await apiRequest("/api/clients/register", "POST", data);
      const contentType = response.headers.get("content-type");
      
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Server returned invalid response. Please ensure the server is running and try again.`);
      }
      
      return await response.json();
    },
    onSuccess: (data: any) => {
      // Store client data in localStorage for mobile app (cookies don't work reliably in Capacitor)
      localStorage.setItem('clientData', JSON.stringify({
        id: data.id,
        title: data.title,
        firstName: data.name,
        phone: data.phone,
        role: 'client'
      }));
      localStorage.setItem('userRole', 'client');
      
      // Clear any provider authentication flags
      localStorage.removeItem('providerAuthenticated');
      localStorage.removeItem('providerAuthTimestamp');
      
      // Invalidate queries to refresh authentication state
      queryClient.invalidateQueries({ queryKey: ["/api/clients/current"] });
      
      toast({
        title: "Registration Successful! 🎉",
        description: `Welcome ${data.title} ${data.name}! You can now book appointments without re-entering your details.`,
        duration: 4000,
      });
      
      // Navigate to booking page - use window.location for Capacitor compatibility
      console.log('Navigation clicked: Book Now ->', redirectAfterRegistration);
      setTimeout(() => {
        // In Capacitor, we need to use full URL with current origin
        const targetUrl = `${window.location.origin}${redirectAfterRegistration}`;
        console.log('[NAVIGATION] Redirecting to:', targetUrl);
        window.location.href = targetUrl;
      }, 500);
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      setIsLoading(false);
    },
  });

  const onSubmit = async (data: ClientRegistrationData) => {
    setIsLoading(true);
    
    try {
      await registrationMutation.mutateAsync(data);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 pb-32">
      <Header />
      
      <div className="py-12 px-4 pb-24">
        <Card className="max-w-md mx-auto shadow-xl mb-24">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
              <UserCheck className="h-6 w-6 text-purple-600" />
              <span className="font-bold text-xl">BookMyLook</span>
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Register once and skip entering your details for future bookings!
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Title</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Mr">Mr</SelectItem>
                          <SelectItem value="Miss">Miss</SelectItem>
                          <SelectItem value="Mrs">Mrs</SelectItem>
                          <SelectItem value="Dr">Dr</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            placeholder="Enter your full name"
                            className="pl-10"
                            data-testid="input-name"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">Mobile Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            type="tel"
                            placeholder="Enter your mobile number"
                            className="pl-10"
                            data-testid="input-phone"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                  disabled={isLoading || registrationMutation.isPending}
                  data-testid="button-register"
                >
                  {isLoading || registrationMutation.isPending ? (
                    "Registering..."
                  ) : (
                    "Register & Start Booking"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already registered?{" "}
                <button
                  onClick={() => setLocation(redirectAfterRegistration !== '/booking' ? `/login?redirect=${redirectAfterRegistration}` : '/login')}
                  className="text-purple-600 hover:text-purple-500 font-medium"
                  data-testid="link-login"
                >
                  Login instead
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}