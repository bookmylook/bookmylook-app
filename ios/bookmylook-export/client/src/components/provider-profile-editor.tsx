import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Save, X, MapPin, User, Building, Clock, Users, CheckCircle, Plus, Scissors, CreditCard, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation as useQueryMutation, useQueryClient as useQClient } from "@tanstack/react-query";

// Linked Account Section Component
function LinkedAccountSection({ providerId, provider }: { providerId: string; provider: any }) {
  const { toast } = useToast();
  const queryClient = useQClient();
  
  // Fetch linked account status
  const { data: linkedAccountStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/providers', providerId, 'linked-account-status'],
    queryFn: async () => {
      const response = await apiRequest(`/api/providers/${providerId}/linked-account-status`, 'GET');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Create linked account mutation
  const createLinkedAccountMutation = useQueryMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/providers/${providerId}/create-linked-account`, 'POST', {});
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create linked account');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Linked Account Created",
        description: "Your Razorpay account is now linked. Payments will be automatically split.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/providers', providerId, 'linked-account-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Linked Account",
        description: error.message || "Please ensure all bank details are filled correctly.",
        variant: "destructive",
      });
    },
  });
  
  // Check if bank details are complete
  const hasBankDetails = provider.accountNumber && provider.ifscCode && provider.panNumber && provider.accountHolderName;
  
  if (statusLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading account status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="w-4 h-4" />
          Automatic Payment Setup
          {linkedAccountStatus?.hasLinkedAccount && linkedAccountStatus?.activated && (
            <Badge className="bg-green-500 text-white text-xs">Active</Badge>
          )}
          {linkedAccountStatus?.hasLinkedAccount && !linkedAccountStatus?.activated && (
            <Badge variant="secondary" className="text-xs">Pending</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {linkedAccountStatus?.hasLinkedAccount ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Razorpay Account Linked</span>
            </div>
            <p className="text-sm text-gray-600">
              When clients pay online, you receive your full service amount automatically. 
              The 3% platform fee is paid by the client on top of your service price.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Account Status:</span>
                <span className={`font-medium ${linkedAccountStatus?.activated ? 'text-green-600' : 'text-yellow-600'}`}>
                  {linkedAccountStatus?.activated ? 'Activated' : linkedAccountStatus?.status || 'Pending'}
                </span>
              </div>
              {linkedAccountStatus?.accountId && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-600">Account ID:</span>
                  <span className="font-mono text-xs">{linkedAccountStatus.accountId.substring(0, 15)}...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!hasBankDetails ? (
              <div className="flex items-start gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Bank details required</p>
                  <p className="text-gray-600 mt-1">
                    Please fill in your Account Number, IFSC Code, PAN Number, and Account Holder Name 
                    in the Payment Information section above, then save to enable automatic payments.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Link your account to receive payments automatically. When clients pay online, 
                  you'll receive your full service amount directly to your bank account.
                </p>
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="font-medium text-blue-800">How it works:</p>
                  <ul className="mt-2 space-y-1 text-blue-700">
                    <li>• Your service price: ₹500</li>
                    <li>• Platform fee (3%): ₹15 (paid by client)</li>
                    <li>• Client pays: ₹515 total</li>
                    <li>• You receive: ₹500 (instant transfer)</li>
                  </ul>
                </div>
                <Button
                  onClick={() => createLinkedAccountMutation.mutate()}
                  disabled={createLinkedAccountMutation.isPending}
                  className="w-full"
                  data-testid="create-linked-account"
                >
                  {createLinkedAccountMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Enable Automatic Payments
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface Provider {
  id: string;
  businessName: string;
  description?: string;
  location: string;
  staffCount: number;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  panNumber?: string;
  upiId?: string;
  user?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  schedules?: Array<{
    startTime: string;
    endTime: string;
    dayOfWeek: number;
    isAvailable: boolean;
  }>;
  staffMembers?: Array<{
    id: string;
    name: string;
  }>;
  services?: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
  }>;
}

interface ProfileEditorProps {
  provider: Provider;
}

// Individual field schemas for validation
const businessNameSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
});

const descriptionSchema = z.object({
  description: z.string().optional(),
});

const locationSchema = z.object({
  location: z.string().min(1, "Location is required"),
});

const staffCountSchema = z.object({
  staffCount: z.number().min(1, "At least 1 staff member required"),
});


const paymentSchema = z.object({
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  panNumber: z.string().optional(),
  upiId: z.string().optional(),
});

const scheduleSchema = z.object({
  openingTime: z.string().min(1, "Opening time required"),
  closingTime: z.string().min(1, "Closing time required"),
});

const staffNamesSchema = z.object({
  staffNames: z.array(z.string().min(1, "Staff name required")).min(1, "At least one staff member required"),
});

const servicesSchema = z.object({
  services: z.array(z.object({
    name: z.string().min(1, "Service name required"),
    price: z.number().min(0, "Price must be positive"),
    duration: z.number().min(1, "Duration must be at least 1 minute"),
  })).min(1, "At least one service required"),
});

export default function ProviderProfileEditor({ provider }: ProfileEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [updatedValues, setUpdatedValues] = useState<Record<string, any>>({});

  // Individual forms for each editable section
  const businessForm = useForm({
    resolver: zodResolver(businessNameSchema),
    defaultValues: { businessName: provider.businessName || "" },
  });

  const descriptionForm = useForm({
    resolver: zodResolver(descriptionSchema),
    defaultValues: { description: provider.description || "" },
  });

  const locationForm = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: { location: provider.location || "" },
  });

  const staffCountForm = useForm({
    resolver: zodResolver(staffCountSchema),
    defaultValues: { staffCount: provider.staffCount || 1 },
  });


  const paymentForm = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      bankName: provider.bankName || "",
      accountHolderName: provider.accountHolderName || "",
      accountNumber: provider.accountNumber || "",
      ifscCode: provider.ifscCode || "",
      panNumber: provider.panNumber || "",
      upiId: provider.upiId || "",
    },
  });

  const scheduleForm = useForm({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      openingTime: provider.schedules?.[0]?.startTime || "09:00",
      closingTime: provider.schedules?.[0]?.endTime || "18:00",
    },
  });

  const staffNamesForm = useForm({
    resolver: zodResolver(staffNamesSchema),
    defaultValues: {
      staffNames: provider.staffMembers?.map(staff => staff.name) || ["Staff Member 1"],
    },
  });

  const servicesForm = useForm({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      services: provider.services?.map(service => ({
        name: service.name,
        price: service.price,
        duration: service.duration,
      })) || [{ name: "Haircut", price: 500, duration: 30 }],
    },
  });

  // Update mutation
  const updateProviderMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest(`/api/providers/${provider.id}`, "PUT", updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setLastUpdateTime(Date.now());
      setHasUnsavedChanges(false);
      
      // Don't invalidate queries immediately to preserve the updated values display
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/provider/dashboard"] });
      }, 2000);
      
      // Keep the editing field open briefly to show the updated value
      setTimeout(() => setEditingField(null), 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generic update handler
  const handleUpdate = async (fieldName: string, data: any) => {
    try {
      setHasUnsavedChanges(true);
      
      // Store the updated value locally to persist it
      setUpdatedValues(prev => ({
        ...prev,
        [fieldName]: data[fieldName]
      }));
      
      await updateProviderMutation.mutateAsync(data);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const renderEditableField = (
    fieldName: string,
    title: string,
    currentValue: string | number,
    form: any,
    onSubmit: (data: any) => void,
    renderInput: () => React.ReactNode,
    icon: React.ReactNode
  ) => {
    // Use updated value if available, otherwise use current value
    const displayValue = updatedValues[fieldName] !== undefined ? updatedValues[fieldName] : currentValue;
    const isEditing = editingField === fieldName;
    const isUpdating = updateProviderMutation.isPending;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              {icon}
              {title}
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingField(fieldName)}
                data-testid={`edit-${fieldName}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {renderInput()}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isUpdating}
                    data-testid={`save-${fieldName}`}
                  >
                    {isUpdating ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingField(null);
                      form.reset();
                    }}
                    disabled={isUpdating}
                    data-testid={`cancel-${fieldName}`}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="text-gray-900">
              <span>{String(displayValue) || "Not set"}</span>
              {updatedValues[fieldName] !== undefined && (
                <span className="ml-2 text-green-600 text-xs">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  Updated
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Global save all changes
  const saveAllChangesMutation = useMutation({
    mutationFn: async () => {
      const allUpdates = {
        businessName: businessForm.getValues().businessName,
        description: descriptionForm.getValues().description,
        location: locationForm.getValues().location,
        staffCount: staffCountForm.getValues().staffCount,
        bankName: paymentForm.getValues().bankName,
        accountHolderName: paymentForm.getValues().accountHolderName,
        accountNumber: paymentForm.getValues().accountNumber,
        ifscCode: paymentForm.getValues().ifscCode,
        panNumber: paymentForm.getValues().panNumber,
        upiId: paymentForm.getValues().upiId,
        openingTime: scheduleForm.getValues().openingTime,
        closingTime: scheduleForm.getValues().closingTime,
        staffNames: staffNamesForm.getValues().staffNames,
        services: servicesForm.getValues().services,
      };
      
      const response = await apiRequest(`/api/providers/${provider.id}`, "PUT", allUpdates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "All Changes Saved",
        description: "Your complete profile has been updated successfully.",
      });
      setLastUpdateTime(Date.now());
      setHasUnsavedChanges(false);
      
      // Don't invalidate queries immediately to preserve the updated values display
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/provider/dashboard"] });
      }, 3000);
      
      // Keep all forms accessible to show updated values
      setTimeout(() => setEditingField(null), 3000);
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save all changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Profile Settings</h2>
            <p className="text-sm text-gray-600">Edit individual sections as needed. Your phone number cannot be changed as it's used for authentication.</p>
          </div>
          <Button
            onClick={() => saveAllChangesMutation.mutate()}
            disabled={saveAllChangesMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="save-all-changes"
          >
            {saveAllChangesMutation.isPending ? (
              <>Saving All...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Business Name */}
      {renderEditableField(
        "businessName",
        "Business Name",
        provider.businessName,
        businessForm,
        (data) => handleUpdate("businessName", data),
        () => (
          <FormField
            control={businessForm.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Enter business name" data-testid="input-businessName" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        <Building className="w-4 h-4" />
      )}

      {/* Description */}
      {renderEditableField(
        "description",
        "Business Description",
        provider.description || "No description provided",
        descriptionForm,
        (data) => handleUpdate("description", data),
        () => (
          <FormField
            control={descriptionForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Describe your business and services..."
                    rows={3}
                    data-testid="textarea-description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        <Building className="w-4 h-4" />
      )}

      {/* Location */}
      {renderEditableField(
        "location",
        "Business Location",
        provider.location,
        locationForm,
        (data) => handleUpdate("location", data),
        () => (
          <FormField
            control={locationForm.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Enter business address" data-testid="input-location" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        <MapPin className="w-4 h-4" />
      )}

      {/* Staff Count */}
      {renderEditableField(
        "staffCount",
        "Staff Count",
        provider.staffCount,
        staffCountForm,
        (data) => handleUpdate("staffCount", data),
        () => (
          <FormField
            control={staffCountForm.control}
            name="staffCount"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number"
                    min={1}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        field.onChange('');
                      } else {
                        field.onChange(parseInt(value) || 1);
                      }
                    }}
                    placeholder="Number of staff members"
                    data-testid="input-staffCount"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        <Users className="w-4 h-4" />
      )}

      {/* Operating Hours */}
      {renderEditableField(
        "schedule",
        "Operating Hours",
        `${provider.schedules?.[0]?.startTime || "09:00"} - ${provider.schedules?.[0]?.endTime || "18:00"}`,
        scheduleForm,
        (data) => handleUpdate("schedule", data),
        () => (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={scheduleForm.control}
              name="openingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Time</FormLabel>
                  <FormControl>
                    <Input {...field} type="time" data-testid="input-openingTime" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={scheduleForm.control}
              name="closingTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Closing Time</FormLabel>
                  <FormControl>
                    <Input {...field} type="time" data-testid="input-closingTime" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ),
        <Clock className="w-4 h-4" />
      )}

      {/* Staff Names */}
      {renderEditableField(
        "staffNames",
        "Staff Members",
        provider.staffMembers && provider.staffMembers.length > 0 
          ? provider.staffMembers.map((staff: any) => staff.name).join(", ") 
          : "No staff configured",
        staffNamesForm,
        (data) => handleUpdate("staffNames", data),
        () => (
          <FormField
            control={staffNamesForm.control}
            name="staffNames"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-2">
                    {field.value.map((name, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={name}
                          onChange={(e) => {
                            const newNames = [...field.value];
                            newNames[index] = e.target.value;
                            field.onChange(newNames);
                          }}
                          placeholder={`Staff Member ${index + 1}`}
                          data-testid={`input-staffName-${index}`}
                        />
                        {field.value.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newNames = field.value.filter((_, i) => i !== index);
                              field.onChange(newNames);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        field.onChange([...field.value, `Staff Member ${field.value.length + 1}`]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Staff Member
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        <Users className="w-4 h-4" />
      )}

      {/* Services */}
      {renderEditableField(
        "services",
        "Services Offered",
        provider.services && provider.services.length > 0
          ? provider.services.map((s: any) => `${s.serviceName} (₹${s.price})`).join(", ")
          : "No services configured",
        servicesForm,
        (data) => handleUpdate("services", data),
        () => (
          <FormField
            control={servicesForm.control}
            name="services"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="space-y-4">
                    {field.value.map((service, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">Service {index + 1}</span>
                          {field.value.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newServices = field.value.filter((_, i) => i !== index);
                                field.onChange(newServices);
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <FormLabel className="text-xs">Service Name</FormLabel>
                            <Input
                              value={service.name}
                              onChange={(e) => {
                                const newServices = [...field.value];
                                newServices[index] = { ...service, name: e.target.value };
                                field.onChange(newServices);
                              }}
                              placeholder="e.g. Haircut"
                              data-testid={`input-serviceName-${index}`}
                            />
                          </div>
                          <div>
                            <FormLabel className="text-xs">Price (₹)</FormLabel>
                            <Input
                              inputMode="numeric"
                              value={service.price === 0 ? '' : service.price.toString()}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d+$/.test(value)) {
                                  const newServices = [...field.value];
                                  newServices[index] = { ...service, price: value === '' ? 0 : parseInt(value) };
                                  field.onChange(newServices);
                                }
                              }}
                              placeholder="500"
                              data-testid={`input-servicePrice-${index}`}
                            />
                          </div>
                          <div>
                            <FormLabel className="text-xs">Duration (min)</FormLabel>
                            <Input
                              inputMode="numeric"
                              value={service.duration === 0 ? '' : service.duration.toString()}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d+$/.test(value)) {
                                  const newServices = [...field.value];
                                  newServices[index] = { ...service, duration: value === '' ? 0 : parseInt(value) };
                                  field.onChange(newServices);
                                }
                              }}
                              placeholder="30"
                              data-testid={`input-serviceDuration-${index}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        field.onChange([...field.value, { name: `Service ${field.value.length + 1}`, price: 500, duration: 30 }]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ),
        <Scissors className="w-4 h-4" />
      )}

      {/* Payment Information */}
      {renderEditableField(
        "payment",
        "Payment Information",
        "Not configured",
        paymentForm,
        (data) => handleUpdate("payment", data),
        () => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={paymentForm.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., HDFC, SBI, ICICI" data-testid="input-bankName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="accountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Holder Name</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Name as per bank" 
                        className="uppercase"
                        onBlur={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                          field.onBlur();
                        }}
                        data-testid="input-accountHolderName" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={paymentForm.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Account number" data-testid="input-accountNumber" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="ifscCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., HDFC0001234" 
                        className="uppercase"
                        onBlur={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                          field.onBlur();
                        }}
                        data-testid="input-ifscCode" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={paymentForm.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN Number</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., ABCDE1234F" 
                      className="uppercase"
                      maxLength={10}
                      onBlur={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                        field.onBlur();
                      }}
                      data-testid="input-panNumber" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={paymentForm.control}
              name="upiId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UPI ID (For Direct UPI Payments)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="e.g., business@paytm, 9876543210@ybl" 
                      className="lowercase"
                      onBlur={(e) => {
                        field.onChange(e.target.value.toLowerCase());
                        field.onBlur();
                      }}
                      data-testid="input-upiId" 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500">Clients can pay directly via PhonePe/GPay/Paytm if you add your UPI ID</p>
                </FormItem>
              )}
            />
          </div>
        ),
        <Building className="w-4 h-4" />
      )}

      {/* Razorpay Linked Account Status */}
      <LinkedAccountSection providerId={provider.id} provider={provider} />

      {/* Read-only fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4" />
            Contact Information
            <Badge variant="secondary" className="text-xs">Read Only</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <span className="ml-2 text-gray-900">
                {provider.user?.firstName} {provider.user?.lastName}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Phone:</span>
              <a 
                href={`tel:${provider.user?.phone}`}
                className="ml-2 text-professional-teal hover:underline"
                data-testid="link-profile-phone"
              >
                {provider.user?.phone}
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Phone number cannot be changed as it's used for authentication.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}