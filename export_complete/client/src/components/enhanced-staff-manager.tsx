import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { User, Plus, Edit, Trash2, Save, X, Users, CheckCircle, Star, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StaffMember {
  id: string;
  name: string;
  specialties?: string[];
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
}

interface EnhancedStaffManagerProps {
  providerId: string;
  provider: any;
}

const staffFormSchema = z.object({
  name: z.string().min(2, "Staff name must be at least 2 characters"),
  specialties: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffFormSchema>;

export default function EnhancedStaffManager({ providerId, provider }: EnhancedStaffManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch staff members
  const { data: staffMembers = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: [`/api/staff-members/${providerId}`],
    queryFn: async () => {
      const response = await fetch(`/api/staff-members/${providerId}`);
      if (!response.ok) throw new Error("Failed to fetch staff members");
      return response.json();
    },
  });

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: "",
      specialties: "",
    },
  });

  // Create staff member mutation
  const createStaffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      const specialtiesArray = data.specialties 
        ? data.specialties.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      return await apiRequest("POST", "/api/staff-members", {
        providerId,
        name: data.name,
        specialties: specialtiesArray,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/staff-members/${providerId}`] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: "Staff member added successfully!",
        description: "Your new staff member is ready to accept bookings.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add staff member",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update staff member mutation
  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StaffFormData> }) => {
      const specialtiesArray = data.specialties 
        ? data.specialties.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      return await apiRequest("PUT", `/api/staff-members/${id}`, {
        name: data.name,
        specialties: specialtiesArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/staff-members/${providerId}`] });
      setEditingStaff(null);
      form.reset();
      toast({
        title: "Staff member updated successfully!",
        description: "Changes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update staff member",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete staff member mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/staff-members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/staff-members/${providerId}`] });
      toast({
        title: "Staff member removed",
        description: "Staff member has been successfully removed.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to remove staff member",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: StaffFormData) => {
    if (editingStaff) {
      updateStaffMutation.mutate({ id: editingStaff.id, data });
    } else {
      createStaffMutation.mutate(data);
    }
  };

  const startEditing = (staff: StaffMember) => {
    setEditingStaff(staff);
    form.reset({
      name: staff.name,
      specialties: staff.specialties?.join(', ') || "",
    });
    setShowAddDialog(true);
  };

  const cancelEdit = () => {
    setEditingStaff(null);
    setShowAddDialog(false);
    form.reset();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Staff Management
          </h3>
          <p className="text-gray-600 mt-1">
            Manage your team members and their specialties
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              data-testid="add-staff-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </DialogTitle>
              <DialogDescription>
                {editingStaff 
                  ? "Update staff member information and specialties"
                  : "Add a new team member to your business"
                }
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter staff member's name" 
                          {...field} 
                          data-testid="staff-name-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="specialties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialties (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Hair Cutting, Color, Styling (separate with commas)" 
                          {...field}
                          data-testid="staff-specialties-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createStaffMutation.isPending || updateStaffMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingStaff ? "Update" : "Add"} Staff Member
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-800">{staffMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Staff</p>
                <p className="text-2xl font-bold text-gray-800">
                  {staffMembers.filter(s => s.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Specialized Staff</p>
                <p className="text-2xl font-bold text-gray-800">
                  {staffMembers.filter(s => s.specialties && s.specialties.length > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Members Grid */}
      {staffMembers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Staff Members Yet</h3>
            <p className="text-gray-500 mb-6">
              Add your first team member to start managing bookings and appointments
            </p>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="add-first-staff-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Staff Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Your Team Members
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffMembers.map((staff) => (
              <Card 
                key={staff.id} 
                className={`transition-all hover:shadow-lg ${
                  staff.isActive ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Staff Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          staff.isActive 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                            : 'bg-gray-400'
                        }`}>
                          {staff.profileImage ? (
                            <img 
                              src={staff.profileImage} 
                              alt={staff.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800" data-testid={`staff-name-${staff.id}`}>
                            {staff.name}
                          </h4>
                          <Badge 
                            variant={staff.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {staff.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(staff)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          data-testid={`edit-staff-${staff.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteStaffMutation.mutate(staff.id)}
                          disabled={deleteStaffMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`delete-staff-${staff.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Specialties */}
                    {staff.specialties && staff.specialties.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {staff.specialties.map((specialty, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-xs"
                            >
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Member Since */}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                      Member since: {new Date(staff.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Staff Management Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>• Each staff member gets their own booking slots</div>
            <div>• Clients can choose their preferred staff member</div>
            <div>• Add specialties to help clients find the right expert</div>
            <div>• Staff names appear as headings in client booking flow</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}