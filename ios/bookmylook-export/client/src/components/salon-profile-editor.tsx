import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit, Save, X, Plus, MapPin, Star, Users } from "lucide-react";
import { Provider } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LocationPicker from "./location-picker";
import { useLocation } from "wouter";

const profileFormSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  specialties: z.array(z.string()).min(1, "Select at least one specialty"),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

const specialtyOptions = [
  "Hair Cutting", "Hair Coloring", "Hair Styling", "Blowouts",
  "Manicure", "Pedicure", "Nail Art", "Gel Nails",
  "Bridal Makeup", "Special Events", "Natural Looks", "Glamour Makeup",
  "Facials", "Anti-aging Treatments", "Acne Treatment", "Skin Consultation",
  "Eyebrow Shaping", "Eyelash Extensions", "Massage Therapy", "Hair Extensions"
];

interface SalonProfileEditorProps {
  providerId: string;
}

export default function SalonProfileEditor({ providerId }: SalonProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [locationData, setLocationData] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: provider, isLoading } = useQuery<Provider>({
    queryKey: ["/api/providers", providerId],
    queryFn: async () => {
      const response = await fetch(`/api/providers/${providerId}`);
      if (!response.ok) throw new Error("Failed to fetch provider");
      return response.json();
    },
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      businessName: provider?.businessName || "",
      description: provider?.description || "",
      location: provider?.location || "",
      specialties: provider?.specialties || [],
    },
  });

  // Update form when provider data loads
  useState(() => {
    if (provider) {
      form.reset({
        businessName: provider.businessName,
        description: provider.description,
        location: provider.location,
        specialties: provider.specialties || [],
      });
      setSelectedSpecialties(provider.specialties || []);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PUT", `/api/providers/${providerId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers", providerId] });
      setIsEditing(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleSubmit = (data: ProfileFormData) => {
    updateMutation.mutate({
      ...data,
      specialties: selectedSpecialties,
      ...(locationData && {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      }),
    });
  };

  const handleLocationSelect = (location: { address: string; latitude: number; longitude: number }) => {
    setLocationData(location);
    form.setValue('location', location.address);
    form.setValue('latitude', location.latitude);
    form.setValue('longitude', location.longitude);
  };

  const startEditing = () => {
    if (provider) {
      form.reset({
        businessName: provider.businessName,
        description: provider.description,
        location: provider.location,
        specialties: provider.specialties || [],
      });
      setSelectedSpecialties(provider.specialties || []);
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    form.reset();
  };

  const addSpecialty = (specialty: string) => {
    if (!selectedSpecialties.includes(specialty)) {
      const newSpecialties = [...selectedSpecialties, specialty];
      setSelectedSpecialties(newSpecialties);
      form.setValue("specialties", newSpecialties);
    }
  };

  const removeSpecialty = (specialty: string) => {
    const newSpecialties = selectedSpecialties.filter(s => s !== specialty);
    setSelectedSpecialties(newSpecialties);
    form.setValue("specialties", newSpecialties);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded mb-4 w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Salon Profile</h3>
          <p className="text-gray-600">Manage your business information and specialties</p>
        </div>
        {!isEditing && (
          <Button onClick={startEditing} variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Salon Profile</CardTitle>
            <CardDescription>
              Update your business information to attract more clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salon/Business Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Sarah's Hair Studio, Bella Salon, Elite Beauty" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-gray-500">
                        This is how clients will find and recognize your business
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your salon, services, and what makes you special..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-gray-500">
                        Tell clients about your experience, style, and unique offerings
                      </p>
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    currentLocation={form.getValues('location')}
                    currentLatitude={provider?.latitude ? parseFloat(provider.latitude) : undefined}
                    currentLongitude={provider?.longitude ? parseFloat(provider.longitude) : undefined}
                  />
                </div>

                <div className="space-y-3">
                  <FormLabel>Specialties & Pricing</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSpecialties.map((specialty) => (
                      <Badge 
                        key={specialty} 
                        variant="default" 
                        className="bg-dusty-rose hover:bg-dusty-rose/90 cursor-pointer"
                        onClick={() => removeSpecialty(specialty)}
                      >
                        {specialty} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                    <Badge 
                      variant="outline" 
                      className="border-green-500 text-green-700 bg-green-50 hover:bg-green-100 cursor-pointer"
                      onClick={() => {
                        // Navigate to pricing tab in dashboard
                        setLocation('/provider-dashboard?tab=pricing');
                      }}
                    >
                      💰 Manage Pricing
                    </Badge>
                  </div>
                  <Select onValueChange={addSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add a specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialtyOptions
                        .filter(option => !selectedSpecialties.includes(option))
                        .map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500">
                    Select your specialties and click "Manage Pricing" to set service prices
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={cancelEditing}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-dusty-rose hover:bg-dusty-rose/90"
                    disabled={updateMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Business Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{provider?.businessName || "Business Name Not Set"}</CardTitle>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {provider?.location || "Location not set"}
                    </div>
                    {provider?.verified && (
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                {provider?.description || "No business description provided yet."}
              </p>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {provider?.specialties && provider.specialties.length > 0 ? (
                    provider.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="bg-soft-pink text-dusty-rose">
                        {specialty}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No specialties added yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Plus className="h-8 w-8 text-dusty-rose" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Specialties</p>
                    <p className="text-xl font-bold text-gray-900">{provider?.specialties?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-dusty-rose" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Business Location</p>
                    <p className="text-sm font-bold text-gray-900">{provider?.location || "Not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}