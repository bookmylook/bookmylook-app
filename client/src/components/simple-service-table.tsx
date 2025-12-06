import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DollarSign } from "lucide-react";

interface ServiceRow {
  id: string;
  serviceName: string;
  price: string;
  time: string;
  selected: boolean;
}

interface SimpleServiceTableProps {
  onChange: (services: ServiceRow[]) => void;
  initialServices?: Array<{ serviceName: string; price: string; time: string }>;
}

function SimpleServiceTable({ onChange, initialServices }: SimpleServiceTableProps) {
  const hasInitialized = useRef(false);
  
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>(() => {
    // Initialize with 20 empty rows - will be populated by useEffect if needed
    return Array.from({ length: 20 }, (_, index) => ({
      id: `row-${index + 1}`,
      serviceName: '',
      price: '',
      time: '',
      selected: false
    }));
  });

  // Update rows ONLY ONCE when initialServices first arrives (for edit mode)
  useEffect(() => {
    if (initialServices && initialServices.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      
      const filledRows = initialServices.map((service, index) => ({
        id: `row-${index + 1}`,
        serviceName: service.serviceName,
        price: service.price,
        time: service.time,
        selected: true
      }));
      
      const emptyRows = Array.from({ length: Math.max(0, 20 - filledRows.length) }, (_, index) => ({
        id: `row-${filledRows.length + index + 1}`,
        serviceName: '',
        price: '',
        time: '',
        selected: false
      }));
      
      setServiceRows([...filledRows, ...emptyRows]);
      
      // Also notify parent of existing services
      onChange(filledRows);
    }
  }, [initialServices, onChange]);

  const updateServiceRow = (rowIndex: number, field: keyof ServiceRow, value: string | boolean) => {
    const updatedRows = serviceRows.map((row, index) => 
      index === rowIndex ? { ...row, [field]: value } : row
    );
    setServiceRows(updatedRows);
    
    // Only pass selected and complete services to parent
    const selectedServices = updatedRows.filter(row => 
      row.selected && 
      row.serviceName.trim() !== '' && 
      row.price.trim() !== '' && 
      row.time.trim() !== ''
    );
    onChange(selectedServices);
  };

  const toggleServiceSelection = (rowIndex: number) => {
    updateServiceRow(rowIndex, 'selected', !serviceRows[rowIndex].selected);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-green-600" />
          <div>
            <CardTitle className="text-green-900">Services & Pricing Table</CardTitle>
            <CardDescription>
              Fill in up to 20 services with prices (in ₹) and duration (in minutes). Check "SELECT" to include service in your profile.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 font-semibold bg-green-50">#</th>
                <th className="text-left p-3 font-semibold bg-green-50 min-w-[200px]">Services Provided</th>
                <th className="text-left p-3 font-semibold bg-green-50 min-w-[100px]">Price (₹)</th>
                <th className="text-left p-3 font-semibold bg-green-50 min-w-[120px]">Time (minutes)</th>
                <th className="text-center p-3 font-semibold bg-green-50 min-w-[80px]">SELECT</th>
              </tr>
            </thead>
            <tbody>
              {serviceRows.map((row, index) => {
                const isRowComplete = row.serviceName.trim() !== '' && row.price.trim() !== '' && row.time.trim() !== '';
                const rowBgClass = row.selected && isRowComplete ? 'bg-green-100 hover:bg-green-150' : 'hover:bg-green-50';
                
                return (
                  <tr key={row.id} className={`border-b border-gray-100 ${rowBgClass}`}>
                    <td className="p-3 text-gray-500 font-medium">{index + 1}</td>
                    <td className="p-2">
                      <Input
                        value={row.serviceName}
                        onChange={(e) => updateServiceRow(index, 'serviceName', e.target.value)}
                        placeholder="e.g., Hair Cut, Facial, Manicure"
                        className="border-0 focus:ring-1 focus:ring-green-500"
                        data-testid={`input-service-name-${index}`}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.price}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*$/.test(value)) {
                            updateServiceRow(index, 'price', value);
                          }
                        }}
                        placeholder="500"
                        inputMode="numeric"
                        className="border-0 focus:ring-1 focus:ring-green-500"
                        data-testid={`input-price-${index}`}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={row.time}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*$/.test(value)) {
                            updateServiceRow(index, 'time', value);
                          }
                        }}
                        placeholder="30"
                        inputMode="numeric"
                        className="border-0 focus:ring-1 focus:ring-green-500"
                        data-testid={`input-time-${index}`}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={row.selected}
                        onCheckedChange={() => toggleServiceSelection(index)}
                        disabled={!isRowComplete}
                        className={`${isRowComplete ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                        data-testid={`checkbox-select-${index}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Quick Guide:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Enter service name (e.g., Hair Cut, Facial)</li>
            <li>• Set your price in rupees (e.g., 500)</li>
            <li>• Add duration in minutes (e.g., 30)</li>
            <li>• Check SELECT to include service in your profile</li>
            <li>• Only selected and complete rows will be saved</li>
            <li>• You can modify these anytime in your dashboard</li>
          </ul>
          
          {/* Service count indicator */}
          <div className="mt-3 p-2 bg-green-100 rounded border border-green-200">
            <p className="text-sm font-semibold text-green-900">
              Selected Services: {serviceRows.filter(row => row.selected && row.serviceName.trim() !== '' && row.price.trim() !== '' && row.time.trim() !== '').length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SimpleServiceTable;