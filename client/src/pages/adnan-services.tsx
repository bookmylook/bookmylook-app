import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Palette, Clock, DollarSign, Tag, Plus, Trash2, Edit, Scissors, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Service, InsertService } from "@shared/schema";

const ADNAN_PROVIDER_ID = "0bdc7424-54f2-45dc-aaf9-37a026ae6cfb";

const colorThemes = [
  { name: "Ocean Breeze", bg: "bg-gradient-to-r from-blue-500 to-cyan-500", text: "text-blue-600" },
  { name: "Coral Sunset", bg: "bg-gradient-to-r from-orange-500 to-pink-500", text: "text-orange-600" },
  { name: "Mint Fresh", bg: "bg-gradient-to-r from-green-500 to-emerald-500", text: "text-green-600" },
  { name: "Lavender Dreams", bg: "bg-gradient-to-r from-purple-500 to-violet-500", text: "text-purple-600" },
  { name: "Rose Garden", bg: "bg-gradient-to-r from-pink-500 to-rose-500", text: "text-pink-600" },
];

const serviceCategories = [
  "Hair Styling", "Hair Coloring", "Hair Cut", "Beard Styling", "Manicure", "Pedicure", 
  "Facial Treatment", "Massage Therapy", "Eyebrow Services", "Makeup Application", 
  "Skin Care", "Spa Treatment"
];

export default function AdnanServices() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [selectedTheme, setSelectedTheme] = useState(colorThemes[0]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    category: "",
    colorTheme: colorThemes[0].name,
  });

  // Fetch Adnan's services
  const { data: services = [], isLoading, refetch } = useQuery<Service[]>({
    queryKey: ["/api/services", ADNAN_PROVIDER_ID],
    queryFn: () => fetch(`/api/services?providerId=${ADNAN_PROVIDER_ID}`).then(res => res.json()),
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: InsertService) => {
      const response = await apiRequest("/api/services", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Service created successfully!" });
      refetch();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Failed to create service", description: "Please try again." });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Service> }) => {
      const response = await apiRequest(`/api/services/${id}`, "PUT", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Service updated successfully!" });
      refetch();
      resetForm();
      setIsDialogOpen(false);
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/services/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Service deleted successfully!" });
      refetch();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: "",
      category: "",
      colorTheme: colorThemes[0].name,
    });
    setEditingService(null);
    setSelectedTheme(colorThemes[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.duration || !formData.category) {
      toast({ title: "Please fill in all required fields" });
      return;
    }

    const serviceData: InsertService = {
      providerId: ADNAN_PROVIDER_ID,
      name: formData.name,
      description: formData.description,
      price: formData.price, // Keep as string to match schema
      duration: parseInt(formData.duration),
      category: formData.category,
    };

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data: serviceData });
    } else {
      createServiceMutation.mutate(serviceData);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price,
      duration: service.duration.toString(),
      category: service.category,
      colorTheme: colorThemes[0].name,
    });
    setSelectedTheme(colorThemes[0]);
    setIsDialogOpen(true);
  };

  const handleDelete = (service: Service) => {
    if (confirm(`Are you sure you want to delete "${service.name}"?`)) {
      deleteServiceMutation.mutate(service.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Adnan Den - Service Management
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Manage your beauty services and pricing
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Scissors className="h-12 w-12 text-blue-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Services</h3>
              <p className="text-3xl font-bold text-blue-600">{services.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Price</h3>
              <p className="text-3xl font-bold text-green-600">
                ${services.length > 0 ? (services.reduce((sum, s) => sum + parseFloat(s.price), 0) / services.length).toFixed(0) : '0'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 text-orange-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Avg Duration</h3>
              <p className="text-3xl font-bold text-orange-600">
                {services.length > 0 ? Math.round(services.reduce((sum, s) => sum + s.duration, 0) / services.length) : '0'}m
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Service Button */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Your Services</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { resetForm(); setIsDialogOpen(true); }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Service
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Service Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      placeholder="e.g., Premium Haircut"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                    placeholder="Describe your service..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
                      placeholder="25.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duration (minutes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="5"
                      step="5"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({...prev, duration: e.target.value}))}
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <Label>Color Theme</Label>
                  <div className="grid grid-cols-5 gap-3 mt-2">
                    {colorThemes.map((theme) => (
                      <button
                        key={theme.name}
                        type="button"
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedTheme.name === theme.name 
                            ? 'border-gray-800 ring-2 ring-gray-300' 
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        onClick={() => {
                          setSelectedTheme(theme);
                          setFormData(prev => ({...prev, colorTheme: theme.name}));
                        }}
                      >
                        <div className={`w-full h-8 rounded ${theme.bg}`} />
                        <p className="text-xs mt-1 text-center">{theme.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                  >
                    {editingService ? 'Update Service' : 'Create Service'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Services List */}
        {isLoading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : services.length === 0 ? (
          <Card className="text-center p-12">
            <CardContent>
              <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No services yet</h3>
              <p className="text-gray-500 mb-6">Create your first service to start accepting bookings</p>
              <Button 
                onClick={() => { resetForm(); setIsDialogOpen(true); }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {services.map((service) => {
              const theme = colorThemes[0]; // Use default theme since colorTheme might not exist
              return (
                <Card key={service.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                          <Badge className={`${theme.bg} text-white`}>
                            {service.category}
                          </Badge>
                        </div>
                        
                        {service.description && (
                          <p className="text-gray-600 mb-4">{service.description}</p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">${service.price}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-600">{service.duration} minutes</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(service)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(service)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}