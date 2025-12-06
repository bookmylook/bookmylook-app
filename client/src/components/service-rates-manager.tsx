import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw } from "lucide-react";

interface ServiceRateManagerProps {
  providerId: string;
}

interface ServiceRow {
  id: string;
  serviceName: string;
  price: string;
  time: string;
  isActive: boolean;
}

export function ServiceRatesManager({ providerId }: ServiceRateManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize with 20 empty rows
  useEffect(() => {
    const emptyRows = Array.from({ length: 20 }, (_, index) => ({
      id: `row-${index + 1}`,
      serviceName: '',
      price: '',
      time: '',
      isActive: true
    }));
    setServiceRows(emptyRows);
  }, []);

  // Load existing services from provider
  const { data: existingServices, isLoading } = useQuery({
    queryKey: [`/api/providers/${providerId}/service-table`],
    enabled: !!providerId,
  });

  // Save service table mutation
  const saveServicesMutation = useMutation({
    mutationFn: async (services: ServiceRow[]) => {
      const response = await fetch(`/api/providers/${providerId}/service-table`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: services.filter(s => s.serviceName.trim() !== '') }),
      });
      if (!response.ok) throw new Error('Failed to save services');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Services updated successfully!",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: [`/api/providers/${providerId}/service-table`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update services",
        variant: "destructive",
      });
    },
  });

  // Load existing services into the grid
  useEffect(() => {
    if (existingServices && Array.isArray(existingServices)) {
      // Create fresh empty rows
      const freshRows = Array.from({ length: 20 }, (_, index) => ({
        id: `row-${index + 1}`,
        serviceName: '',
        price: '',
        time: '',
        isActive: true
      }));
      
      // Fill in existing services
      existingServices.forEach((service: any, index: number) => {
        if (index < 20) {
          freshRows[index] = {
            id: `row-${index + 1}`,
            serviceName: service.serviceName || '',
            price: service.price?.toString() || '',
            time: service.time?.toString() || '',
            isActive: service.isActive !== false // Default to true if not specified
          };
        }
      });
      
      setServiceRows(freshRows);
    }
  }, [existingServices]);

  const updateServiceRow = (rowIndex: number, field: keyof ServiceRow, value: string | boolean) => {
    setServiceRows(prev => {
      const updated = [...prev];
      updated[rowIndex] = { ...updated[rowIndex], [field]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    saveServicesMutation.mutate(serviceRows);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Services & Pricing</CardTitle>
          <CardDescription>Loading your services...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Services & Pricing Table</CardTitle>
            <CardDescription>
              Fill in your services, prices, and duration. Use the switch to control which services are available for client booking. Only active services will appear to clients.
            </CardDescription>
          </div>
          {hasChanges && (
            <Button 
              onClick={handleSave} 
              disabled={saveServicesMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-save-services"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveServicesMutation.isPending ? "Saving..." : "Save Services"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 font-semibold bg-gray-50">#</th>
                <th className="text-left p-3 font-semibold bg-gray-50 min-w-[200px]">Service Name</th>
                <th className="text-left p-3 font-semibold bg-gray-50 min-w-[100px]">Price (₹)</th>
                <th className="text-left p-3 font-semibold bg-gray-50 min-w-[120px]">Time (minutes)</th>
                <th className="text-center p-3 font-semibold bg-gray-50 min-w-[100px]">Available for Booking</th>
              </tr>
            </thead>
            <tbody>
              {serviceRows.map((row, index) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-gray-500 font-medium">{index + 1}</td>
                  <td className="p-2">
                    <Input
                      value={row.serviceName}
                      onChange={(e) => updateServiceRow(index, 'serviceName', e.target.value)}
                      placeholder="e.g., Hair Cut, Facial, Manicure"
                      className="border-0 focus:ring-1 focus:ring-blue-500"
                      data-testid={`input-service-name-${index}`}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={row.price}
                      onChange={(e) => updateServiceRow(index, 'price', e.target.value)}
                      placeholder="e.g., 500"
                      type="number"
                      min="0"
                      className="border-0 focus:ring-1 focus:ring-blue-500"
                      data-testid={`input-price-${index}`}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={row.time}
                      onChange={(e) => updateServiceRow(index, 'time', e.target.value)}
                      placeholder="e.g., 30"
                      type="number"
                      min="0"
                      className="border-0 focus:ring-1 focus:ring-blue-500"
                      data-testid={`input-time-${index}`}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={row.isActive}
                        onCheckedChange={(checked) => updateServiceRow(index, 'isActive', checked)}
                        disabled={!row.serviceName.trim() || !row.price.trim() || !row.time.trim()}
                        data-testid={`switch-active-${index}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Fill in the service name, price in rupees, and duration in minutes</li>
            <li>• Use the toggle switch to make services available for client booking</li>
            <li>• You can use all 20 rows or just the ones you need</li>
            <li>• Empty rows will be ignored and won't appear to clients</li>
            <li>• Only services marked as "Available for Booking" will be visible to clients</li>
            <li>• Click "Save Services" to update your service catalog</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}