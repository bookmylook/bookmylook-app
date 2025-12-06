import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Clock, DollarSign, Tag, Plus, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Service, InsertService } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ServiceCustomizerProps {
  providerId: string;
  services: Service[];
}

const colorThemes = [
  { name: "Ocean Breeze", primary: "bg-gradient-primary", accent: "bg-oceanic-blue", text: "text-oceanic-blue" },
  { name: "Coral Sunset", primary: "bg-gradient-coral", accent: "bg-coral-orange", text: "text-coral-orange" },
  { name: "Mint Fresh", primary: "bg-gradient-mint", accent: "bg-mint-green", text: "text-mint-green" },
  { name: "Lavender Dreams", primary: "bg-gradient-lavender", accent: "bg-lavender-purple", text: "text-lavender-purple" },
  { name: "Rose Garden", primary: "bg-rose-pink", accent: "bg-peach-pink", text: "text-rose-pink" },
  { name: "Sky Paradise", primary: "bg-sky-blue", accent: "bg-emerald-green", text: "text-sky-blue" },
];

const serviceCategories = [
  "Hair Styling", "Hair Coloring", "Manicure", "Pedicure", "Facial Treatment", 
  "Massage Therapy", "Eyebrow Services", "Makeup Application", "Skin Care", "Spa Treatment"
];

export default function ServiceCustomizer({ providerId, services }: ServiceCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    customizations: [] as string[],
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: InsertService) => apiRequest("/api/services", "POST", data),
    onSuccess: () => {
      toast({ title: "Service created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      resetForm();
      setIsOpen(false);
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) => 
      apiRequest(`/api/services/${id}`, "PUT", data),
    onSuccess: () => {
      toast({ title: "Service updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      resetForm();
      setIsOpen(false);
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/services/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Service deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
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
      customizations: [],
    });
    setEditingService(null);
    setSelectedTheme(colorThemes[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceData = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      duration: parseInt(formData.duration),
      category: formData.category,
      providerId,
      colorTheme: formData.colorTheme,
      customizations: formData.customizations,
      active: true,
    };

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data: serviceData });
    } else {
      createServiceMutation.mutate(serviceData as InsertService);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      duration: service.duration.toString(),
      category: service.category,
      colorTheme: colorThemes[0].name,
      customizations: [],
    });
    const theme = colorThemes[0];
    setSelectedTheme(theme);
    setIsOpen(true);
  };

  const addCustomization = () => {
    const newCustomization = prompt("Enter customization option:");
    if (newCustomization) {
      setFormData(prev => ({
        ...prev,
        customizations: [...prev.customizations, newCustomization]
      }));
    }
  };

  const removeCustomization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customizations: prev.customizations.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Service Management</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-primary text-white"
              onClick={() => resetForm()}
              data-testid="button-add-service"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Create New Service"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Service Details</TabsTrigger>
                  <TabsTrigger value="styling">Color & Style</TabsTrigger>
                  <TabsTrigger value="customizations">Customizations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Service Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Premium Hair Cut"
                        required
                        data-testid="input-service-name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger data-testid="select-category">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your service in detail..."
                      rows={3}
                      data-testid="textarea-description"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                        required
                        data-testid="input-price"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="60"
                        required
                        data-testid="input-duration"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="styling" className="space-y-4">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Choose Color Theme
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {colorThemes.map((theme) => (
                        <Card 
                          key={theme.name}
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedTheme.name === theme.name ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => {
                            setSelectedTheme(theme);
                            setFormData(prev => ({ ...prev, colorTheme: theme.name }));
                          }}
                          data-testid={`theme-${theme.name.toLowerCase().replace(' ', '-')}`}
                        >
                          <CardContent className="p-3">
                            <div className={`w-full h-12 rounded-lg mb-2 ${theme.primary}`}></div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{theme.name}</span>
                              <div className={`w-4 h-4 rounded-full ${theme.accent}`}></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-4 border rounded-lg">
                      <Label className="text-sm text-gray-600">Preview:</Label>
                      <div className={`mt-2 p-4 rounded-lg ${selectedTheme.primary}`}>
                        <h3 className="font-semibold text-white">
                          {formData.name || "Your Service Name"}
                        </h3>
                        <p className="text-white/90 text-sm">
                          {formData.description || "Service description will appear here"}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="customizations" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Service Customizations
                      </Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={addCustomization}
                        data-testid="button-add-customization"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {formData.customizations.map((customization, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                          <Badge variant="secondary" className="flex-1">
                            {customization}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomization(index)}
                            data-testid={`button-remove-customization-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      
                      {formData.customizations.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No customizations added yet. Click "Add Option" to create customizable features for your service.
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className={selectedTheme.primary}
                  disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                  data-testid="button-save-service"
                >
                  {editingService ? "Update Service" : "Create Service"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
        {services.map((service, index) => {
          const theme = colorThemes[index % colorThemes.length];
          return (
            <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`h-32 ${theme.primary} relative`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-semibold">{service.name}</h3>
                  <p className="text-sm opacity-90">{service.category}</p>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/20 text-white border-white/30">
                    ${service.price}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4 space-y-3">
                <p className="text-gray-600 text-sm line-clamp-2">
                  {service.description || "No description provided"}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {service.duration}min
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    ${service.price}
                  </span>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(service)}
                    data-testid={`button-edit-service-${service.id}`}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => deleteServiceMutation.mutate(service.id)}
                    data-testid={`button-delete-service-${service.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {services.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Palette className="w-12 h-12 mx-auto text-gray-400" />
            <div>
              <h3 className="text-lg font-medium text-gray-800">No services yet</h3>
              <p className="text-gray-600">Create your first service to start attracting clients</p>
            </div>
            <Button 
              className="bg-gradient-primary text-white"
              onClick={() => setIsOpen(true)}
              data-testid="button-create-first-service"
            >
              Create Your First Service
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}