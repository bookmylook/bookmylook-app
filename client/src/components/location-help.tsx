import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, MapPin, Settings, Smartphone, Globe } from "lucide-react";

export default function LocationHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="w-full mt-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Need help with location detection?
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Mobile Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-medium text-blue-800">On Mobile Devices</h4>
                </div>
                <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Make sure Location Services are enabled in your device Settings</li>
                  <li>Open your browser settings and allow location access for this site</li>
                  <li>Refresh the page and try location detection again</li>
                  <li>If prompted, tap "Allow" to share your location</li>
                </ol>
              </div>

              {/* Browser Steps */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-medium text-green-800">Browser Settings</h4>
                </div>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• Chrome: Click the location icon in the address bar → Allow</li>
                  <li>• Safari: Settings → Privacy & Security → Location Services → On</li>
                  <li>• Firefox: Click the shield icon → Allow location access</li>
                </ul>
              </div>

              {/* Troubleshooting */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-orange-600" />
                  <h4 className="text-sm font-medium text-orange-800">Still Having Issues?</h4>
                </div>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Try using WiFi instead of mobile data</li>
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Use a different browser or incognito mode</li>
                  <li>• Enter your address manually in the field above</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>Note:</strong> If location detection continues to fail, you can always enter your business address manually. 
                  The system will still work perfectly for your clients to find and book your services.
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}