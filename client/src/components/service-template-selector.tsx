import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Clock, IndianRupee, Sparkles } from "lucide-react";
import { getAllServiceCategories, ServiceCategory, ServiceTemplate } from "@shared/service-templates";

interface SelectedService {
  templateId: string;
  serviceName: string;
  category: string;
  price: string;  // Changed to string to match form schema
  duration: string; // Changed to string to match form schema (in minutes)
}

interface ServiceTemplateSelectorProps {
  serviceCategory: string; // "gents" | "ladies" | "unisex"
  onServicesSelected: (services: SelectedService[]) => void;
  initialServices?: SelectedService[];
}

export default function ServiceTemplateSelector({ 
  serviceCategory, 
  onServicesSelected,
  initialServices = []
}: ServiceTemplateSelectorProps) {
  const [selectedServices, setSelectedServices] = useState<Map<string, SelectedService>>(
    new Map(initialServices.map(s => [s.templateId, s]))
  );

  const allCategories = getAllServiceCategories(serviceCategory);
  
  // Expand all categories by default so users can see all services without clicking
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(allCategories.map(cat => cat.name))
  );

  const handleServiceToggle = (template: ServiceTemplate, checked: boolean) => {
    const newSelected = new Map(selectedServices);
    
    if (checked) {
      newSelected.set(template.id, {
        templateId: template.id,
        serviceName: template.name,
        category: template.category,
        price: "",  // Empty string - provider will fill it
        duration: "",  // Empty string - provider will fill it
      });
    } else {
      newSelected.delete(template.id);
    }
    
    setSelectedServices(newSelected);
    onServicesSelected(Array.from(newSelected.values()));
  };

  const handlePriceChange = (templateId: string, value: string) => {
    const newSelected = new Map(selectedServices);
    const service = newSelected.get(templateId);
    if (service) {
      // Keep as string - no conversion needed
      service.price = value;
      newSelected.set(templateId, service);
      setSelectedServices(newSelected);
      onServicesSelected(Array.from(newSelected.values()));
    }
  };

  const handleDurationChange = (templateId: string, value: string) => {
    const newSelected = new Map(selectedServices);
    const service = newSelected.get(templateId);
    if (service) {
      // Keep as string - no conversion needed
      service.duration = value;
      newSelected.set(templateId, service);
      setSelectedServices(newSelected);
      onServicesSelected(Array.from(newSelected.values()));
    }
  };

  const toggleCategoryExpansion = (categoryName: string) => {
    console.log('🔄 Toggle category expansion:', categoryName);
    console.log('📋 Current expanded categories:', Array.from(expandedCategories));
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      console.log('➖ Collapsing category');
      newExpanded.delete(categoryName);
    } else {
      console.log('➕ Expanding category');
      newExpanded.add(categoryName);
    }
    console.log('📋 New expanded categories:', Array.from(newExpanded));
    setExpandedCategories(newExpanded);
  };

  const renderService = (service: ServiceTemplate) => {
    const isSelected = selectedServices.has(service.id);
    const selectedService = selectedServices.get(service.id);

    return (
      <div 
        key={service.id} 
        className={`p-3 border rounded-lg transition-all ${
          isSelected ? 'bg-rose-50 border-rose-300' : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            id={service.id}
            checked={isSelected}
            onCheckedChange={(checked) => handleServiceToggle(service, !!checked)}
            className="mt-1"
            data-testid={`checkbox-service-${service.id}`}
          />
          <div className="flex-1 space-y-2">
            <Label 
              htmlFor={service.id} 
              className="text-sm font-medium cursor-pointer flex items-center gap-2"
            >
              {service.name}
              {service.isPopular && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 inline mr-0.5" />
                  Popular
                </span>
              )}
            </Label>

            {isSelected && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`price-${service.id}`} className="text-xs text-gray-600 flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" />
                    Price (₹)
                  </Label>
                  <Input
                    id={`price-${service.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={selectedService?.price || ''}
                    onChange={(e) => handlePriceChange(service.id, e.target.value)}
                    placeholder="0"
                    className="mt-1 h-9 text-sm"
                    data-testid={`input-price-${service.id}`}
                  />
                </div>
                <div>
                  <Label htmlFor={`duration-${service.id}`} className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Duration (mins)
                  </Label>
                  <Input
                    id={`duration-${service.id}`}
                    type="number"
                    min="5"
                    step="5"
                    value={selectedService?.duration || ''}
                    onChange={(e) => handleDurationChange(service.id, e.target.value)}
                    placeholder="0"
                    className="mt-1 h-9 text-sm"
                    data-testid={`input-duration-${service.id}`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-500" />
          Select Your Services
        </CardTitle>
        <CardDescription>
          Choose services, add price & time for each
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allCategories.map((category) => {
          const popularServices = category.services.filter(s => s.isPopular);
          const moreServices = category.services.filter(s => !s.isPopular);
          const isCategoryExpanded = expandedCategories.has(category.name);
          const categorySelectedCount = category.services.filter(s => 
            selectedServices.has(s.id)
          ).length;

          return (
            <div key={category.name} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{category.name}</h3>
                {categorySelectedCount > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {categorySelectedCount} selected
                  </span>
                )}
              </div>
              
              {/* Popular Services - Always Visible */}
              {popularServices.length > 0 && (
                <div className="space-y-2 mb-2">
                  {popularServices.map(service => renderService(service))}
                </div>
              )}

              {/* More Services - Expandable */}
              {moreServices.length > 0 && (
                <>
                  {isCategoryExpanded && (
                    <div className="space-y-2 mb-2">
                      {moreServices.map(service => renderService(service))}
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCategoryExpansion(category.name);
                    }}
                    className="w-full text-xs h-8 flex items-center justify-center gap-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                    data-testid={`button-toggle-${category.name}`}
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  >
                    {isCategoryExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        <span>Show Less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        <span>{moreServices.length} More</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          );
        })}

        {/* Summary */}
        {selectedServices.size > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">
              ✓ {selectedServices.size} service{selectedServices.size !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
