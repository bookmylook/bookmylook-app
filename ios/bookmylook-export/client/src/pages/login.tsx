import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Phone, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  phone: z.string().min(10, "Please enter your registered phone number"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Get redirect URL from query params - default to booking page since users login to book services
  const urlParams = new URLSearchParams(window.location.search);
  const redirectAfterLogin = urlParams.get('redirect') || '/booking';

  // Client login form
  const clientLoginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
    },
  });

  // Client login mutation
  const clientLoginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("/api/clients/login", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Store client data in localStorage for mobile app (cookies don't work reliably in Capacitor)
      localStorage.setItem('clientData', JSON.stringify({
        id: data.id,
        title: data.title,
        firstName: data.firstName,
        phone: data.phone,
        role: 'client'
      }));
      localStorage.setItem('userRole', 'client');
      
      // Clear any provider authentication flags
      localStorage.removeItem('providerAuthenticated');
      localStorage.removeItem('providerAuthTimestamp');
      
      queryClient.invalidateQueries({ queryKey: ["/api/clients/current"] });
      
      toast({
        title: "Welcome back!",
        description: `Welcome back ${data.title} ${data.firstName}!`,
      });
      setLocation(redirectAfterLogin);
    },
    onError: () => {
      toast({
        title: "Phone number not found",
        description: "Please register first or check your phone number.",
        variant: "destructive",
      });
    },
  });

  const onClientLoginSubmit = (data: LoginFormData) => {
    clientLoginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">BookMyLook</h1>
          </Link>
          <p className="text-gray-600">Your Style, Your Schedule</p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-gray-800">
              Client Login
            </CardTitle>
            <CardDescription className="text-center">
              Enter your registered phone number to access your bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="bg-purple-50 p-4 rounded-lg mb-4">
                <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-purple-700 font-medium">Quick Client Login</p>
                <p className="text-xs text-purple-600">Enter your registered phone number</p>
              </div>
            </div>

            <Form {...clientLoginForm}>
              <form onSubmit={clientLoginForm.handleSubmit(onClientLoginSubmit)} className="space-y-4">
                <FormField
                  control={clientLoginForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            {...field} 
                            type="tel" 
                            placeholder="Enter your phone number"
                            className="pl-10 text-lg h-12"
                            data-testid="input-client-phone"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 text-lg"
                  disabled={clientLoginMutation.isPending}
                  data-testid="button-client-login"
                >
                  {clientLoginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500 mb-3">Don't have an account?</p>
              <Link href="/client-registration">
                <Button variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50">
                  Register as Client
                </Button>
              </Link>
            </div>

            <div className="text-center pt-6 border-t mt-6">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-gray-600">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
