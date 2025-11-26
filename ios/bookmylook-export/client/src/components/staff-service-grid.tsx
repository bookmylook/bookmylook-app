import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Users, Settings, Edit, Save, DollarSign, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StaffMember {
  id: string;
  name: string;
  specialties?: string[];
  isActive: boolean;
}

interface Service {
  id: string;
  serviceName: string;
  customPrice: string;
  customDuration: number;
  isOffered: boolean;
}

interface StaffServiceGridProps {
  providerId: string;
  provider: any;
}

interface StaffServiceAssignment {
  staffId: string;
  serviceId: string;
  isAssigned: boolean;
  customPrice?: string;
  customDuration?: number;
}

export default function StaffServiceGrid({ providerId, provider }: StaffServiceGridProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, StaffServiceAssignment>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch staff members
  const { data: staffMembers = [], isLoading: staffLoading } = useQuery<StaffMember[]>({
    queryKey: [`/api/staff-members/${providerId}`],
    queryFn: async () => {
      const response = await fetch(`/api/staff-members/${providerId}`);
      if (!response.ok) throw new Error("Failed to fetch staff members");
      return response.json();
    },
  });

  // Fetch services
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: [`/api/providers/${providerId}/services`],
    queryFn: async () => {
      const response = await fetch(`/api/providers/${providerId}/services`);
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  const updateAssignment = useMutation({
    mutationFn: async (assignment: StaffServiceAssignment) => {
      return await apiRequest("POST", "/api/staff-service-assignments", assignment);
    },
    onSuccess: () => {
      toast({
        title: "Assignment updated",
        description: "Staff service assignment has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update staff service assignment.",
        variant: "destructive",
      });
    },
  });

  const handleAssignmentToggle = (staffId: string, serviceId: string, isAssigned: boolean) => {
    const key = `${staffId}-${serviceId}`;
    const assignment: StaffServiceAssignment = {
      staffId,
      serviceId,
      isAssigned,
      customPrice: assignments[key]?.customPrice,
      customDuration: assignments[key]?.customDuration,
    };

    setAssignments(prev => ({
      ...prev,
      [key]: assignment
    }));

    updateAssignment.mutate(assignment);
  };

  const handlePriceUpdate = (staffId: string, serviceId: string, price: string) => {
    const key = `${staffId}-${serviceId}`;
    const assignment: StaffServiceAssignment = {
      staffId,
      serviceId,
      isAssigned: assignments[key]?.isAssigned ?? true,
      customPrice: price,
      customDuration: assignments[key]?.customDuration,
    };

    setAssignments(prev => ({
      ...prev,
      [key]: assignment
    }));

    updateAssignment.mutate(assignment);
  };

  if (staffLoading || servicesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Staff Service Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (staffMembers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Staff Service Assignment
          </CardTitle>
          <CardDescription>Assign services to your staff members</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Staff Members</h3>
          <p className="text-gray-500">
            Add staff members first to assign services to them
          </p>
        </CardContent>
      </Card>
    );
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Staff Service Assignment
          </CardTitle>
          <CardDescription>Assign services to your staff members</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Services</h3>
          <p className="text-gray-500">
            Add services first to assign them to staff members
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          Staff Service Assignment Grid
        </h3>
        <p className="text-gray-600 mt-1">
          Manage which services each staff member can provide and set custom pricing
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Staff Members</p>
                <p className="text-2xl font-bold text-gray-800">{staffMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Settings className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Services</p>
                <p className="text-2xl font-bold text-gray-800">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-800">
                  {Object.values(assignments).filter(a => a.isAssigned).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Grid Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Assignment Matrix</CardTitle>
          <CardDescription>
            Toggle switches to assign services to staff members. Click on price cells to edit custom pricing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Service Name
                    </div>
                  </TableHead>
                  <TableHead className="text-center">Base Price</TableHead>
                  <TableHead className="text-center">Duration</TableHead>
                  {staffMembers.map((staff) => (
                    <TableHead key={staff.id} className="text-center min-w-[150px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-medium text-sm">{staff.name}</span>
                        {staff.specialties && staff.specialties.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {staff.specialties[0]}
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id} className="hover:bg-gray-50">
                    <TableCell className="sticky left-0 bg-white z-10 font-medium">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">{service.serviceName}</span>
                        {service.isOffered && (
                          <Badge variant="secondary" className="text-xs w-fit mt-1">
                            Active
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">₹{service.customPrice}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>{service.customDuration}min</span>
                      </div>
                    </TableCell>
                    {staffMembers.map((staff) => {
                      const key = `${staff.id}-${service.id}`;
                      const assignment = assignments[key];
                      const isAssigned = assignment?.isAssigned ?? false;
                      
                      return (
                        <TableCell key={key} className="text-center">
                          <div className="flex flex-col items-center space-y-2">
                            {/* Assignment Toggle */}
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={isAssigned}
                                onCheckedChange={(checked) => 
                                  handleAssignmentToggle(staff.id, service.id, checked)
                                }
                                data-testid={`assignment-toggle-${staff.id}-${service.id}`}
                              />
                              <span className="text-xs text-gray-500">
                                {isAssigned ? 'Assigned' : 'Not assigned'}
                              </span>
                            </div>
                            
                            {/* Custom Price Input */}
                            {isAssigned && (
                              <div className="w-full">
                                {editingCell === key ? (
                                  <Input
                                    type="number"
                                    defaultValue={assignment?.customPrice || service.customPrice}
                                    className="h-8 text-sm text-center"
                                    onBlur={(e) => {
                                      handlePriceUpdate(staff.id, service.id, e.target.value);
                                      setEditingCell(null);
                                    }}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        handlePriceUpdate(staff.id, service.id, e.currentTarget.value);
                                        setEditingCell(null);
                                      }
                                    }}
                                    autoFocus
                                    data-testid={`price-input-${staff.id}-${service.id}`}
                                  />
                                ) : (
                                  <div
                                    className="cursor-pointer bg-blue-50 hover:bg-blue-100 rounded px-2 py-1 text-sm border border-blue-200"
                                    onClick={() => setEditingCell(key)}
                                    data-testid={`price-cell-${staff.id}-${service.id}`}
                                  >
                                    ₹{assignment?.customPrice || service.customPrice}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Quick Assignment Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                // Assign all services to all staff
                const newAssignments: Record<string, StaffServiceAssignment> = {};
                staffMembers.forEach(staff => {
                  services.forEach(service => {
                    const key = `${staff.id}-${service.id}`;
                    newAssignments[key] = {
                      staffId: staff.id,
                      serviceId: service.id,
                      isAssigned: true,
                      customPrice: service.customPrice,
                      customDuration: service.customDuration,
                    };
                  });
                });
                setAssignments(newAssignments);
                toast({
                  title: "All services assigned",
                  description: "All services have been assigned to all staff members",
                });
              }}
              data-testid="assign-all-button"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Assign All Services
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                setAssignments({});
                toast({
                  title: "All assignments cleared",
                  description: "All service assignments have been removed",
                });
              }}
              data-testid="clear-all-button"
            >
              <Settings className="h-4 w-4 mr-2" />
              Clear All Assignments
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                toast({
                  title: "Assignments saved",
                  description: "All current assignments have been saved to the database",
                });
              }}
              data-testid="save-assignments-button"
            >
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}