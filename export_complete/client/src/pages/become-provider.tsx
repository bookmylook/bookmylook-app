import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import QrScanner from "qr-scanner";

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Calendar, 
  Star, 
  TrendingUp, 
  MapPin,
  Camera,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Scissors,
  Clock,
  Sun,
  Moon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Header from "../components/layout/header";
import Footer from "../components/layout/footer";
import { MobileNavigationNew } from "../components/mobile-navigation-new";
// Simple location input (works without Google Maps billing)
import { SimpleLocationInput } from "@/components/simple-location-input";
import SimpleServiceTable from "../components/simple-service-table";
import { useToast } from "@/hooks/use-toast";
import ServiceTemplateSelector from "@/components/service-template-selector";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Predefined service lists based on service category
const PREDEFINED_SERVICES = {
  gents: [
    { serviceName: "Haircut", price: "300", time: "30" },
    { serviceName: "Beard Trim", price: "150", time: "20" },
    { serviceName: "Shave", price: "100", time: "15" },
    { serviceName: "Hair Wash", price: "100", time: "15" },
    { serviceName: "Head Massage", price: "200", time: "20" },
    { serviceName: "Mustache Trim", price: "50", time: "10" },
    { serviceName: "Eyebrow Trim", price: "50", time: "10" },
    { serviceName: "Face Cleanup", price: "400", time: "45" },
    { serviceName: "Hair Styling", price: "200", time: "20" },
    { serviceName: "Beard Oil Treatment", price: "250", time: "25" }
  ],
  ladies: [
    { serviceName: "Hair Cut", price: "500", time: "45" },
    { serviceName: "Hair Wash & Blow Dry", price: "300", time: "30" },
    { serviceName: "Hair Color", price: "1500", time: "90" },
    { serviceName: "Highlights", price: "2000", time: "120" },
    { serviceName: "Facial", price: "800", time: "60" },
    { serviceName: "Eyebrow Threading", price: "100", time: "15" },
    { serviceName: "Upper Lip Wax", price: "100", time: "10" },
    { serviceName: "Full Face Wax", price: "300", time: "30" },
    { serviceName: "Manicure", price: "400", time: "45" },
    { serviceName: "Pedicure", price: "500", time: "60" },
    { serviceName: "Nail Polish", price: "200", time: "20" },
    { serviceName: "Hair Spa", price: "800", time: "75" },
    { serviceName: "Bridal Makeup", price: "3000", time: "120" },
    { serviceName: "Party Makeup", price: "1500", time: "60" },
    { serviceName: "Hair Straightening", price: "2500", time: "180" }
  ],
  unisex: [
    { serviceName: "Haircut", price: "400", time: "30" },
    { serviceName: "Hair Wash", price: "150", time: "15" },
    { serviceName: "Hair Color", price: "1200", time: "90" },
    { serviceName: "Facial", price: "600", time: "60" },
    { serviceName: "Head Massage", price: "200", time: "20" },
    { serviceName: "Eyebrow Shaping", price: "100", time: "15" },
    { serviceName: "Hair Styling", price: "250", time: "25" },
    { serviceName: "Deep Conditioning", price: "500", time: "45" },
    { serviceName: "Scalp Treatment", price: "400", time: "30" },
    { serviceName: "Hair Trim", price: "200", time: "20" }
  ]
};

// Create a dynamic schema based on edit mode
const createProviderFormSchema = (isEditMode: boolean) => z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: isEditMode ? z.string().optional() : z.string().min(10, "Valid phone number required"),
  businessName: z.string().min(1, "Business name is required"),
  profileImage: z.any().optional(), // Will handle file validation separately
  staffCount: z.number().min(1, "At least 1 staff member required"),
  staffNames: z.array(z.string().min(1, "Staff name is required")).optional(),
  serviceCategory: z.enum(["gents", "ladies", "unisex"]).default("unisex"),

  location: z.string().min(1, "Location is required"),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  
  // Payment details - UPI is preferred (simpler), bank account as fallback
  // At least ONE payment method must be provided
  upiId: z.string().optional().refine((val) => !val || /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(val), "Invalid UPI ID format (e.g., name@paytm, 9876543210@ybl)"),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional().refine((val) => !val || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), "Invalid IFSC code format"),
  panNumber: z.string().optional().refine((val) => !val || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val), "Invalid PAN format (e.g., ABCDE1234F)"),
  
  selectedServices: z.array(z.object({
    serviceName: z.string().min(1, "Service name is required"),
    price: z.string().default("").optional(),  // Allow empty price - provider will fill it
    time: z.string().default("").optional(),   // Allow empty time - provider will fill it
  })).default([]),
  // Schedule information
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  holidayDays: z.array(z.number()).default([]), // Array of day indices (0=Sunday, 1=Monday, etc.)
});

// Use the dynamic schema
const providerFormSchema = createProviderFormSchema(false); // Default for registration

type ProviderFormData = z.infer<typeof providerFormSchema>;

export default function BecomeProvider() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check if we're in edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const isEditMode = urlParams.get('edit') === 'true';
  
  // Check for provider authentication in edit mode
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    if (isEditMode) {
      const checkProviderAuth = () => {
        const providerAuth = localStorage.getItem('providerAuthenticated');
        const authTimestamp = localStorage.getItem('providerAuthTimestamp');
        
        if (providerAuth === 'true' && authTimestamp) {
          const authTime = parseInt(authTimestamp);
          const currentTime = Date.now();
          const sevenDays = 7 * 24 * 60 * 60 * 1000; // Provider-specific: 7-day auto-logout for security
          
          if (currentTime - authTime < sevenDays) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('providerAuthenticated');
            localStorage.removeItem('providerAuthTimestamp');
            setLocation('/provider-dashboard');
          }
        } else {
          setLocation('/provider-dashboard');
        }
      };
      checkProviderAuth();
    }
  }, [isEditMode, setLocation]);

  // Fetch existing provider data in edit mode
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery<{ provider: any }>({
    queryKey: ["/api/provider/dashboard"],
    enabled: isEditMode && isAuthenticated,
  });

  const [locationData, setLocationData] = useState<{
    address: string;
    latitude: number | null;
    longitude: number | null;
  } | null>(null);
  const [serviceTableData, setServiceTableData] = useState<any[]>([]);
  const qrImageInputRef = useRef<HTMLInputElement>(null);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<"gents" | "ladies" | "unisex">("unisex");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  // UPI verification function removed - payment processing not needed for cash/offline only app



  const form = useForm<ProviderFormData>({
    resolver: zodResolver(createProviderFormSchema(isEditMode)),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      businessName: "",
      staffCount: 1,
      staffNames: ["Staff Member 1"],
      serviceCategory: "unisex",

      location: "",
      city: "",
      district: "",
      state: "",
      latitude: undefined,
      longitude: undefined,

      // Bank account details for payouts
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      panNumber: "",
      upiId: "",

      selectedServices: [],
      openingTime: "09:00",
      closingTime: "18:00",
      holidayDays: [],
    },
  });

  // Handle service category change and auto-populate services
  const handleServiceCategoryChange = (category: "gents" | "ladies" | "unisex") => {
    setSelectedServiceCategory(category);
    form.setValue("serviceCategory", category);
    
    // Auto-populate services based on category
    const predefinedServices = PREDEFINED_SERVICES[category];
    form.setValue("selectedServices", predefinedServices);
    setServiceTableData(predefinedServices);
  };

  // Pre-populate form with existing provider data in edit mode
  useEffect(() => {
    if (isEditMode && dashboardData?.provider && !isDashboardLoading) {
      const provider = dashboardData.provider;
      console.log('📝 Loading provider data for editing:', provider);
      
      // Set form values from existing provider data
      // Transform existing services into the format expected by the form
      const existingServices = provider.services && provider.services.length > 0
        ? provider.services.map((service: any) => ({
            serviceName: service.serviceName || service.name,
            price: service.price?.toString() || "0",
            time: service.time?.toString() || "0",
          }))
        : [];

      const formData = {
        firstName: provider.user?.firstName || "",
        lastName: provider.user?.lastName || "",
        phone: provider.user?.phone || "",
        businessName: provider.businessName || "",
        staffCount: provider.staffCount || 1,
        staffNames: provider.staffMembers?.map((staff: any) => staff.name) || ["Staff Member 1"],
        serviceCategory: provider.serviceCategory || "unisex",
        location: provider.location || "",
        city: provider.city || "",
        district: provider.district || "",
        state: provider.state || "",
        latitude: provider.latitude ? parseFloat(provider.latitude) : undefined,
        longitude: provider.longitude ? parseFloat(provider.longitude) : undefined,

        // Bank account details
        bankName: provider.bankName || "",
        accountHolderName: provider.accountHolderName || "",
        accountNumber: provider.accountNumber || "",
        ifscCode: provider.ifscCode || "",
        panNumber: provider.panNumber || "",
        upiId: provider.upiId || "",

        selectedServices: existingServices, // Pre-fill with existing services
        openingTime: provider.schedules?.[0]?.startTime || "09:00",
        closingTime: provider.schedules?.[0]?.endTime || "18:00",
        holidayDays: provider.schedules?.filter((s: any) => !s.isAvailable).map((s: any) => s.dayOfWeek) || [],
      };
      
      console.log('📝 Form data being set:', formData);
      console.log('📝 Existing services:', existingServices);
      form.reset(formData);
      
      // Also update the service table data state
      if (existingServices.length > 0) {
        setServiceTableData(existingServices);
      }

      // Clear phone validation error in edit mode since phone is disabled
      setTimeout(() => {
        form.clearErrors("phone");
      }, 100);

      // Set the service category state from existing provider data
      const category = provider.serviceCategory || "unisex";
      setSelectedServiceCategory(category as "gents" | "ladies" | "unisex");

      // Set location data
      if (provider.location) {
        setLocationData({
          address: provider.location,
          latitude: provider.latitude ? parseFloat(provider.latitude) : null,
          longitude: provider.longitude ? parseFloat(provider.longitude) : null,
        });
      }
    }
  }, [isEditMode, dashboardData, isDashboardLoading, form]);

  // Watch form fields for real-time validation status
  const watchedFields = form.watch();
  const formErrors = form.formState.errors;
  
  // Helper function to determine field completion status
  const getFieldStatus = (fieldName: string, value: any, additionalCheck?: boolean) => {
    const hasError = !!formErrors[fieldName as keyof typeof formErrors];
    const isEmpty = !value || (Array.isArray(value) && value.length === 0);
    const customCheck = additionalCheck !== undefined ? !additionalCheck : false;
    
    if (hasError || isEmpty || customCheck) {
      return { status: 'incomplete', icon: AlertCircle, color: 'text-red-500' };
    }
    return { status: 'complete', icon: CheckCircle, color: 'text-green-500' };
  };
  
  // Check completion status for each section
  const isPersonalComplete = watchedFields.firstName && watchedFields.lastName && 
                            (isEditMode || watchedFields.phone) && // Phone not required in edit mode since it's pre-filled and disabled
                            !formErrors.firstName && !formErrors.lastName && 
                            (isEditMode || !formErrors.phone); // Phone errors not checked in edit mode
  const personalInfoStatus = isPersonalComplete ? 
    { status: 'complete', icon: CheckCircle, color: 'text-green-500' } : 
    { status: 'incomplete', icon: AlertCircle, color: 'text-red-500' };
  
  const isBusinessComplete = watchedFields.businessName && watchedFields.staffCount && 
                            watchedFields.openingTime && watchedFields.closingTime &&
                            !formErrors.businessName && !formErrors.staffCount && 
                            (!watchedFields.staffNames || watchedFields.staffNames.every(name => name.trim() !== ''));
  const businessInfoStatus = isBusinessComplete ? 
    { status: 'complete', icon: CheckCircle, color: 'text-green-500' } : 
    { status: 'incomplete', icon: AlertCircle, color: 'text-red-500' };
  
  const isLocationComplete = locationData && locationData.address;
  const locationStatus = isLocationComplete ? 
    { status: 'complete', icon: CheckCircle, color: 'text-green-500' } : 
    { status: 'incomplete', icon: AlertCircle, color: 'text-red-500' };
    
  const isServicesComplete = serviceTableData.length > 0;
  const servicesStatus = isServicesComplete ? 
    { status: 'complete', icon: CheckCircle, color: 'text-green-500' } : 
    { status: 'incomplete', icon: AlertCircle, color: 'text-red-500' };

  const registerMutation = useMutation({
    mutationFn: async (data: ProviderFormData) => {
      // Upload profile image first if provided
      let profileImageUrl: string | null = null;
      if (profileImageFile) {
        const formData = new FormData();
        formData.append('image', profileImageFile);
        
        const uploadResponse = await fetch('/api/providers/profile-image/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          profileImageUrl = result.imageUrl;
        }
      }
      
      if (isEditMode) {
        try {
          const providerId = dashboardData?.provider?.id;
          if (!providerId) {
            throw new Error("Provider ID not found");
          }

          // Transform serviceTableData to match backend expectations
          const transformedServices = serviceTableData.map(service => ({
            name: service.serviceName,
            price: service.price,
            duration: parseInt(service.time)
          }));

          // Update provider profile
          const providerData = {
            businessName: data.businessName,
            description: dashboardData?.provider?.description || "Beauty service provider",
            staffCount: data.staffCount,
            serviceCategory: data.serviceCategory,
            location: data.location,
            city: data.city || null,
            district: data.district || null,
            state: data.state || null,
            latitude: data.latitude?.toString() || null,
            longitude: data.longitude?.toString() || null,
            profileImage: profileImageUrl || dashboardData?.provider?.profileImage || null, // Include profile image
            bankName: data.bankName,
            accountHolderName: data.accountHolderName,
            accountNumber: data.accountNumber,
            ifscCode: data.ifscCode,
            panNumber: data.panNumber,
            services: transformedServices, // Changed from selectedServices to services
            staffNames: data.staffNames,
            openingTime: data.openingTime,
            closingTime: data.closingTime,
            holidayDays: data.holidayDays,
          };
          
          const providerResponse = await apiRequest(`/api/providers/${providerId}`, "PUT", providerData);
          const providerResult = await providerResponse.json();
          
          return { provider: providerResult, updated: true };
        } catch (error) {
          console.error("Update error:", error);
          throw error;
        }
      } else {
        try {
          // Create user first
          const userResponse = await apiRequest("/api/auth/register", "POST", {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            password: "temp123", // Temporary password - will be handled by auth system
          });
          
          const userResult = await userResponse.json();
          
          // Then create provider profile
          const providerData = {
            userId: userResult.user.id,
            businessName: data.businessName,
            description: "New beauty service provider",
            staffCount: data.staffCount,
            serviceCategory: data.serviceCategory,
            location: data.location,
            city: data.city || null,
            district: data.district || null,
            state: data.state || null,
            latitude: data.latitude?.toString() || null,
            longitude: data.longitude?.toString() || null,
            profileImage: profileImageUrl || null, // Include profile image
            upiId: data.upiId || null, // CRITICAL FIX: Include UPI ID for automatic payouts
            bankName: data.bankName,
            accountHolderName: data.accountHolderName,
            accountNumber: data.accountNumber,
            ifscCode: data.ifscCode,
            panNumber: data.panNumber,
            specialties: [],
            portfolio: [],
            selectedServices: serviceTableData, // Include service table data in provider creation
            staffNames: data.staffNames, // Include staff names for auto-creation
            openingTime: data.openingTime,
            closingTime: data.closingTime,
            holidayDays: data.holidayDays,
          };
          
          const providerResponse = await apiRequest("/api/providers", "POST", providerData);
          const providerResult = await providerResponse.json();
          
          // Auto-login the user after successful registration
          const loginResponse = await apiRequest("/api/auth/login", "POST", {
            phone: data.phone,
            password: "temp123", // Temporary password - will be handled by auth system
          });
          
          const loginResult = await loginResponse.json();
          
          return { provider: providerResult, user: loginResult.user };
        } catch (error) {
          console.error("Registration error:", error);
          throw error;
        }
      }
    },
    onSuccess: (data) => {
      // Set user role and 7-day auto-login for new provider registrations
      if (!isEditMode) {
        localStorage.setItem('userRole', 'professional');
        localStorage.setItem('providerAuthenticated', 'true');
        localStorage.setItem('providerAuthTimestamp', Date.now().toString());
      }
      
      if (isEditMode) {
        // Show update success notification
        alert("✅ Profile Updated Successfully!\n\n✅ Your business details have been updated\n✅ Changes are now live for clients\n\nRedirecting to your dashboard...");
      } else {
        // Show registration success notification
        alert("🎉 Registration Successful!\n\n✅ Your provider account has been created\n✅ You're now visible in the provider listings\n✅ Clients can now discover and book your services\n\nRedirecting to your dashboard...");
      }
      
      // Redirect to provider dashboard after successful operation
      setTimeout(() => {
        setLocation('/provider-dashboard');
      }, 2000);
    },
    onError: (error: any) => {
      console.error("Registration failed:", error);
    },
  });

  const handleLocationSelect = (location: { address: string; latitude: number | null; longitude: number | null }) => {
    const locationData = {
      address: location.address,
      latitude: location.latitude || 0,
      longitude: location.longitude || 0
    };
    setLocationData(locationData);
    form.setValue("location", location.address);
    form.setValue("latitude", location.latitude || undefined);
    form.setValue("longitude", location.longitude || undefined);
  };

  const onSubmit = (data: ProviderFormData) => {
    console.log('🚀 Form submit triggered');
    console.log('📋 Form data:', data);
    console.log('🛠️ Service table data:', serviceTableData);
    console.log('❌ Form errors:', form.formState.errors);
    
    // Ensure location data is included
    if (locationData) {
      data.latitude = locationData.latitude || undefined;
      data.longitude = locationData.longitude || undefined;
      data.location = locationData.address;
    }
    
    // If no location data but manual location is provided, use that
    if (!data.location || data.location.trim() === "") {
      data.location = "Location to be updated later";
      data.latitude = 0;
      data.longitude = 0;
    }
    
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-cream salon-equipment-bg">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {isEditMode ? 'Edit Your Profile' : 'Join BookMyLook as a Provider'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {isEditMode ? 
              'Update your business details, services, and schedule information.' :
              'Grow your beauty business by connecting with clients in your area. Start accepting bookings and showcase your skills today.'
            }
          </p>
        </div>

        {/* Benefits Section with Vibrant Colorful Boxes - Only show for new registrations */}
        {!isEditMode && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 relative">
          {/* Step 1 - Electric Blue Box */}
          <div className="text-center p-8 bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-blue-200 hover:border-blue-300">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                1
              </div>
            </div>
            <h3 className="font-bold text-xl mb-3 text-blue-900">Reach More Clients</h3>
            <p className="text-blue-800 font-medium">Connect with beauty enthusiasts in your area</p>
          </div>

          {/* Arrow/Connector 1 - Rainbow */}
          <div className="hidden md:flex absolute top-1/2 left-1/4 transform -translate-y-1/2 translate-x-16 z-10">
            <div className="w-12 h-2 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-pink-500 rounded-full transform rotate-45 -ml-2 shadow-lg"></div>
          </div>
          
          {/* Step 2 - Emerald Green Box */}
          <div className="text-center p-8 bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-green-200 hover:border-green-300">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce" style={{animationDelay: '0.5s'}}>
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                2
              </div>
            </div>
            <h3 className="font-bold text-xl mb-3 text-green-900">Easy Booking</h3>
            <p className="text-green-800 font-medium">Streamlined appointment management</p>
          </div>

          {/* Arrow/Connector 2 - Rainbow */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 transform -translate-y-1/2 translate-x-16 z-10">
            <div className="w-12 h-2 bg-gradient-to-r from-teal-400 via-yellow-500 to-orange-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="w-4 h-4 bg-yellow-500 rounded-full transform rotate-45 -ml-2 shadow-lg"></div>
          </div>
          
          {/* Step 3 - Golden Yellow Box */}
          <div className="text-center p-8 bg-gradient-to-br from-yellow-100 via-orange-50 to-red-100 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-yellow-200 hover:border-yellow-300">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce" style={{animationDelay: '1s'}}>
                <Star className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                3
              </div>
            </div>
            <h3 className="font-bold text-xl mb-3 text-yellow-900">Build Reputation</h3>
            <p className="text-yellow-800 font-medium">Showcase your portfolio and grow trust</p>
          </div>

          {/* Arrow/Connector 3 - Rainbow */}
          <div className="hidden md:flex absolute top-1/2 right-1/4 transform -translate-y-1/2 -translate-x-16 z-10">
            <div className="w-12 h-2 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="w-4 h-4 bg-red-500 rounded-full transform rotate-45 -ml-2 shadow-lg"></div>
          </div>
          
          {/* Step 4 - Hot Pink Box */}
          <div className="text-center p-8 bg-gradient-to-br from-pink-100 via-rose-50 to-red-100 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-pink-200 hover:border-pink-300">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl animate-bounce" style={{animationDelay: '1.5s'}}>
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-red-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                4
              </div>
            </div>
            <h3 className="font-bold text-xl mb-3 text-pink-900">Grow Business</h3>
            <p className="text-pink-800 font-medium">Increase revenue and client base</p>
          </div>
        </div>
        )}

        {/* Registration Progress Summary */}
        <div className="max-w-2xl mx-auto mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Registration Progress</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                  <User className={`w-6 h-6 mb-2 ${isPersonalComplete ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-xs text-center font-medium">Personal Info</span>
                  {isPersonalComplete ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mt-1 animate-pulse" />
                  )}
                </div>
                
                <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                  <Building className={`w-6 h-6 mb-2 ${isBusinessComplete ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-xs text-center font-medium">Business Info</span>
                  {isBusinessComplete ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mt-1 animate-pulse" />
                  )}
                </div>
                
                <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                  <MapPin className={`w-6 h-6 mb-2 ${isLocationComplete ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-xs text-center font-medium">Location</span>
                  {isLocationComplete ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mt-1 animate-pulse" />
                  )}
                </div>
                
                <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm">
                  <Scissors className={`w-6 h-6 mb-2 ${isServicesComplete ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-xs text-center font-medium">Services</span>
                  {isServicesComplete ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 mt-1 animate-pulse" />
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${((isPersonalComplete ? 1 : 0) + (isBusinessComplete ? 1 : 0) + (isLocationComplete ? 1 : 0) + (isServicesComplete ? 1 : 0)) / 4 * 100}%` 
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {((isPersonalComplete ? 1 : 0) + (isBusinessComplete ? 1 : 0) + (isLocationComplete ? 1 : 0) + (isServicesComplete ? 1 : 0))} of 4 sections complete
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {isEditMode ? 'Update Your Account Details' : 'Create Your Provider Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {registerMutation.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h4 className="font-semibold text-red-800">Registration Failed</h4>
                </div>
                <p className="text-red-700 text-sm">
                  {registerMutation.error?.message || 'An error occurred during registration. Please try again.'}
                </p>
                {registerMutation.error?.message?.includes('Phone number already') && (
                  <div className="mt-3 p-3 bg-red-100 rounded border border-red-300">
                    <p className="text-red-800 text-sm font-medium mb-2">
                      This phone number is already registered. Try one of these options:
                    </p>
                    <ul className="text-red-700 text-sm space-y-1 ml-4 list-disc">
                      <li>Use a different phone number</li>
                      <li>Go to <a href="/provider-dashboard" className="underline font-medium">Provider Login</a> if you already have an account</li>
                      <li>Contact support if you believe this is an error</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(
                onSubmit,
                (errors) => {
                  console.error('❌ Form validation failed:', errors);
                  const errorMessages = Object.entries(errors).map(([field, error]) => 
                    `${field}: ${error?.message || 'Invalid'}`
                  );
                  toast({
                    title: "Form Validation Failed",
                    description: `Please fix these errors:\n${errorMessages.join('\n')}`,
                    variant: "destructive",
                  });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              )} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">Personal Information</h3>
                    <div className="flex items-center gap-2 ml-auto">
                      {personalInfoStatus.status === 'complete' ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">Complete</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                          <span className="text-sm text-red-600 font-medium">Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your first name" {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your last name" {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="9876543210" 
                            {...field} 
                            disabled={isEditMode}
                            className={isEditMode ? "bg-gray-100 text-gray-600" : ""}
                            data-testid="input-phone" 
                          />
                        </FormControl>
                        {isEditMode && (
                          <p className="text-sm text-gray-500">Phone number cannot be changed</p>
                        )}
                        {!isEditMode && <FormMessage />}
                      </FormItem>
                    )}
                  />
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold">Business Information</h3>
                    <div className="flex items-center gap-2 ml-auto">
                      {businessInfoStatus.status === 'complete' ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">Complete</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                          <span className="text-sm text-red-600 font-medium">Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your salon/studio name" {...field} data-testid="input-business-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Profile Image Upload */}
                  <FormField
                    control={form.control}
                    name="profileImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Profile Image (Optional)</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => profileImageInputRef.current?.click()}
                                className="flex items-center gap-2"
                                data-testid="button-upload-profile-image"
                              >
                                <Camera className="w-4 h-4" />
                                {profileImagePreview || dashboardData?.provider?.profileImage ? 'Change Image' : 'Upload Image'}
                              </Button>
                              {(profileImagePreview || dashboardData?.provider?.profileImage) && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setProfileImageFile(null);
                                    setProfileImagePreview(null);
                                    field.onChange(null);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                  data-testid="button-remove-profile-image"
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                            <input
                              ref={profileImageInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setProfileImageFile(file);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setProfileImagePreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                  field.onChange(file);
                                }
                              }}
                            />
                            {(profileImagePreview || dashboardData?.provider?.profileImage) && (
                              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200">
                                <img
                                  src={profileImagePreview || dashboardData?.provider?.profileImage || ''}
                                  alt="Business profile preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <p className="text-sm text-gray-500">
                              Upload a photo of your business, salon, or logo. This will be shown to clients when booking.
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="staffCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Staff Members</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={50}
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Allow empty string to enable complete deletion
                              if (value === "") {
                                field.onChange("");
                                return;
                              }
                              
                              // Parse and validate the number
                              const numValue = parseInt(value, 10);
                              if (!isNaN(numValue) && numValue >= 1 && numValue <= 50) {
                                field.onChange(numValue);
                                
                                // Update staff names array when staff count changes
                                const currentStaffNames = form.getValues('staffNames') || [];
                                const newStaffNames = [];
                                for (let i = 0; i < numValue; i++) {
                                  newStaffNames.push(currentStaffNames[i] || `Staff Member ${i + 1}`);
                                }
                                form.setValue('staffNames', newStaffNames);
                              }
                            }}
                            data-testid="input-staff-count"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Category</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          handleServiceCategoryChange(value as "gents" | "ladies" | "unisex");
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-service-category">
                              <SelectValue placeholder="Select your target clientele" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gents">
                              <div className="flex items-center gap-2">
                                <span>🧔</span>
                                <span>Gents Services (Barber, Men's Grooming)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="ladies">
                              <div className="flex items-center gap-2">
                                <span>💄</span>
                                <span>Ladies Services (Salon, Beauty Treatments)</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="unisex">
                              <div className="flex items-center gap-2">
                                <span>✂️</span>
                                <span>Unisex Services (Both Men & Women)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedServiceCategory === "gents" && "Services like haircut, beard trim, shave will be auto-added"}
                          {selectedServiceCategory === "ladies" && "Services like hair color, facial, manicure will be auto-added"}
                          {selectedServiceCategory === "unisex" && "Mixed services for both men and women will be auto-added"}
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Dynamic Staff Names */}
                  {watchedFields.staffCount && watchedFields.staffCount > 0 && (
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <h4 className="text-md font-medium text-gray-800">Staff Member Names</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Array.from({ length: watchedFields.staffCount }, (_, index) => (
                          <FormField
                            key={index}
                            control={form.control}
                            name={`staffNames.${index}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Staff Member {index + 1} Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    placeholder={`Enter name for staff member ${index + 1}`}
                                    data-testid={`input-staff-name-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">
                        💡 These names will appear in your booking system for clients to choose from
                      </p>
                    </div>
                  )}

                  {/* Payment Details Section - UPI First (Simpler) */}
                  <div className="space-y-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Building className="text-green-600 h-5 w-5" />
                      <h4 className="text-lg font-semibold text-green-800">Payment Details (For Receiving Money)</h4>
                    </div>
                    <p className="text-sm text-green-700 bg-green-100 p-3 rounded">
                      💰 You'll receive <strong>100% of your service price</strong> instantly after each booking.
                    </p>
                    
                    <Tabs defaultValue="upi" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upi" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                          ⚡ UPI (Recommended - Simple)
                        </TabsTrigger>
                        <TabsTrigger value="bank" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                          🏦 Bank Account
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="upi" className="space-y-4 mt-4">
                        <FormField
                          control={form.control}
                          name="upiId"
                          render={({ field }) => {
                            const isValidUpi = field.value && /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(field.value);
                            return (
                              <FormItem>
                                <FormLabel className="text-base">Your UPI ID *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      placeholder="e.g., yourname@paytm, 9876543210@ybl" 
                                      {...field}
                                      className="lowercase text-lg h-12 pr-12"
                                      onBlur={(e) => {
                                        field.onChange(e.target.value.toLowerCase());
                                        field.onBlur();
                                      }}
                                      data-testid="input-upi-id"
                                    />
                                    {isValidUpi && (
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                      </div>
                                    )}
                                  </div>
                                </FormControl>
                                <FormMessage />
                                <p className="text-xs text-gray-500">Open PhonePe/Paytm/Google Pay → Profile → Your UPI ID</p>
                              </FormItem>
                            );
                          }}
                        />
                      </TabsContent>
                      
                      <TabsContent value="bank" className="space-y-4 mt-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h5 className="font-semibold text-yellow-800 mb-2">⚠️ Bank Details are Complex:</h5>
                          <p className="text-sm text-yellow-700">Use UPI instead if possible - it's much simpler and faster. Only use bank details if you don't have a UPI ID.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="bankName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., State Bank of India" 
                                    {...field} 
                                    data-testid="input-bank-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="accountHolderName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Holder Name</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="As per bank records" 
                                    {...field} 
                                    data-testid="input-account-holder-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="accountNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Number</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter account number" 
                                    {...field} 
                                    type="text"
                                    data-testid="input-account-number"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="ifscCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IFSC Code</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., SBIN0001234" 
                                    {...field}
                                    className="uppercase"
                                    onBlur={(e) => {
                                      field.onChange(e.target.value.toUpperCase());
                                      field.onBlur();
                                    }}
                                    maxLength={11}
                                    data-testid="input-ifsc-code"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="panNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PAN Number (Optional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., ABCDE1234F" 
                                  {...field}
                                  className="uppercase"
                                  onBlur={(e) => {
                                    field.onChange(e.target.value.toUpperCase());
                                    field.onBlur();
                                  }}
                                  maxLength={10}
                                  data-testid="input-pan-number"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-gray-600">For tax compliance (optional but recommended)</p>
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Business Hours Section */}
                  <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="text-blue-600 h-5 w-5" />
                      <h4 className="text-lg font-semibold text-blue-800">Business Hours</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="openingTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Sun className="w-4 h-4 text-yellow-500" />
                              Opening Time
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field} 
                                className="text-center font-mono text-lg"
                                data-testid="input-opening-time"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="closingTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Moon className="w-4 h-4 text-indigo-500" />
                              Closing Time
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field} 
                                className="text-center font-mono text-lg"
                                data-testid="input-closing-time"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Holiday Days Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-500" />
                        <h5 className="text-md font-medium text-gray-800">Weekly Holiday Days</h5>
                      </div>
                      <p className="text-sm text-gray-600">Select the days you'll be closed each week</p>
                      
                      <FormField
                        control={form.control}
                        name="holidayDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                                  const isSelected = field.value.includes(index);
                                  return (
                                    <Button
                                      key={day}
                                      type="button"
                                      variant={isSelected ? "default" : "outline"}
                                      className={`h-12 text-sm font-medium transition-all ${
                                        isSelected 
                                          ? "bg-red-600 text-white hover:bg-red-700 border-red-600" 
                                          : "text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-300"
                                      }`}
                                      onClick={() => {
                                        const newValue = isSelected 
                                          ? field.value.filter((d: number) => d !== index)
                                          : [...field.value, index];
                                        field.onChange(newValue);
                                      }}
                                      data-testid={`holiday-day-${index}`}
                                    >
                                      {day}
                                    </Button>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {form.watch('holidayDays')?.length > 0 && (
                        <div className="p-2 bg-red-50 rounded border border-red-200">
                          <p className="text-sm text-red-700">
                            <strong>Closed on:</strong> {form.watch('holidayDays')?.map((dayIndex: number) => 
                              ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex]
                            ).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Information Section Removed - App uses cash/offline payments only */}

                {/* Location Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold">Business Location</h3>
                    <div className="flex items-center gap-2 ml-auto">
                      {locationStatus.status === 'complete' ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">Complete</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                          <span className="text-sm text-red-600 font-medium">Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <SimpleLocationInput
                    onLocationSelect={(address: string, latitude?: number, longitude?: number, city?: string, district?: string, state?: string) => {
                      setLocationData({
                        address: address,
                        latitude: latitude || 0,
                        longitude: longitude || 0
                      });
                      form.setValue('location', address);
                      if (latitude) form.setValue('latitude', latitude);
                      if (longitude) form.setValue('longitude', longitude);
                      
                      // Auto-fill city, district, and state from Google Maps
                      if (city) form.setValue('city', city);
                      if (district) form.setValue('district', district);
                      if (state) form.setValue('state', state);
                    }}
                    initialValue={locationData?.address || ''}
                    placeholder="Start typing your business address..."
                  />

                  {/* City, District, State auto-filled silently in background - no display boxes */}
                </div>

                {/* Services Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Scissors className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold">Services Offered</h3>
                    <div className="flex items-center gap-2 ml-auto">
                      {servicesStatus.status === 'complete' ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600 font-medium">Complete</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                          <span className="text-sm text-red-600 font-medium">Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Add the services you provide. You can always update these later from your dashboard.
                  </p>
                  
                  <ServiceTemplateSelector 
                    serviceCategory={selectedServiceCategory}
                    onServicesSelected={(services) => {
                      setServiceTableData(services);
                      form.setValue("selectedServices", services);
                    }}
                    initialServices={serviceTableData}
                  />
                  
                  {/* Service Count Indicator */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${serviceTableData.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm font-medium text-gray-700">
                        Services Configured: {serviceTableData.length}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {serviceTableData.length === 0 ? 'Add at least one service to continue' : 'Ready for registration'}
                    </span>
                  </div>
                </div>

                {/* Registration Button */}
                <div className="pt-6">
                  <div className="space-y-3">
                    {/* Form Completeness Checker */}
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Ready to Register?</span>
                        <div className="flex items-center gap-2">
                          {isPersonalComplete && isBusinessComplete && isLocationComplete && isServicesComplete ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-green-600 font-medium">All Required Fields Complete</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              <span className="text-sm text-orange-600 font-medium">Complete Required Sections</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Missing Fields Indicator */}
                      {(!isPersonalComplete || !isBusinessComplete || !isLocationComplete || !isServicesComplete) && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Still needed:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {!isPersonalComplete && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                <User className="w-3 h-3" />
                                Personal Info
                              </span>
                            )}
                            {!isBusinessComplete && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                <Building className="w-3 h-3" />
                                Business Info
                              </span>
                            )}
                            {!isLocationComplete && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                <MapPin className="w-3 h-3" />
                                Location
                              </span>
                            )}
                            {!isServicesComplete && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                <Scissors className="w-3 h-3" />
                                Services
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className={`w-full py-6 text-lg font-semibold transition-all duration-300 ${
                        isPersonalComplete && isBusinessComplete && isLocationComplete && isServicesComplete
                          ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={registerMutation.isPending || !isPersonalComplete || !isBusinessComplete || !isLocationComplete || !isServicesComplete}
                      data-testid="submit-registration"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          {isEditMode ? 'Updating Profile...' : 'Creating Your Account...'}
                        </>
                      ) : isPersonalComplete && isBusinessComplete && isLocationComplete && isServicesComplete ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          {isEditMode ? 'Update Profile' : 'Join as Provider'}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Complete Required Fields First
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner Modal removed */}
      
      <Footer />
      <MobileNavigationNew />
    </div>
  );
}