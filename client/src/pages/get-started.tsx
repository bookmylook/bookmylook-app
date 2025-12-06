import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, User, Calendar, Star, MapPin, Clock, DollarSign, Users } from "lucide-react";

export default function GetStarted() {
  const [, navigate] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"client" | "provider" | null>(null);

  const handleRoleSelect = (role: "client" | "provider") => {
    setSelectedRole(role);
    
    // Navigate based on role selection
    if (role === "client") {
      navigate("/providers");
    } else {
      navigate("/become-provider");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-pink to-warm-beige">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Scissors className="h-8 w-8 text-dusty-rose" />
              <span className="text-xl font-bold text-gray-800">Salon Connect</span>
            </Link>
            <Link href="/">
              <Button variant="ghost">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            How would you like to use Salon Connect?
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose your path to get started. You can always switch between roles later.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Client Option */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-2xl border-2 ${
              selectedRole === "client" ? "border-dusty-rose shadow-xl" : "border-gray-200 hover:border-dusty-rose/50"
            }`}
            onClick={() => handleRoleSelect("client")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-soft-pink rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-dusty-rose" />
              </div>
              <CardTitle className="text-2xl text-gray-800">I want to book services</CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Find and book beauty appointments with local providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-dusty-rose mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Easy Booking</h4>
                    <p className="text-gray-600 text-sm">Browse services and book appointments instantly</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-dusty-rose mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Local Providers</h4>
                    <p className="text-gray-600 text-sm">Find beauty professionals in your area</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-dusty-rose mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Verified Professionals</h4>
                    <p className="text-gray-600 text-sm">Browse portfolios from verified beauty experts</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-dusty-rose mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Flexible Scheduling</h4>
                    <p className="text-gray-600 text-sm">Book at times that work for you</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full bg-dusty-rose hover:bg-dusty-rose/90 text-white py-3 text-lg"
                  onClick={() => handleRoleSelect("client")}
                >
                  Start Booking Services
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Provider Option */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-2xl border-2 ${
              selectedRole === "provider" ? "border-dusty-rose shadow-xl" : "border-gray-200 hover:border-dusty-rose/50"
            }`}
            onClick={() => handleRoleSelect("provider")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 mx-auto mb-4 bg-soft-pink rounded-full flex items-center justify-center">
                <Scissors className="h-10 w-10 text-dusty-rose" />
              </div>
              <CardTitle className="text-2xl text-gray-800">I want to offer services</CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Start your beauty business and connect with clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-dusty-rose mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Grow Your Business</h4>
                    <p className="text-gray-600 text-sm">Reach new clients and increase bookings</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-dusty-rose mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Build Your Portfolio</h4>
                    <p className="text-gray-600 text-sm">Showcase your work and expertise</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-dusty-rose mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Manage Bookings</h4>
                    <p className="text-gray-600 text-sm">Easy scheduling and appointment management</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-dusty-rose mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Build Reputation</h4>
                    <p className="text-gray-600 text-sm">Showcase your portfolio and expertise</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full bg-dusty-rose hover:bg-dusty-rose/90 text-white py-3 text-lg"
                  onClick={() => handleRoleSelect("provider")}
                >
                  Start Offering Services
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3">
            <Badge variant="secondary" className="bg-soft-pink text-dusty-rose">
              Pro Tip
            </Badge>
            <span className="text-gray-700">You can switch between booking and providing services anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}