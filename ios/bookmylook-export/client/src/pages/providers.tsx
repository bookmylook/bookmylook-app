import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ProviderCard from "@/components/provider-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Grid } from "lucide-react";
import { ProviderWithServices } from "@shared/schema";

export default function Providers() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithServices | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price'>('newest');

  const { data: providers, isLoading } = useQuery<ProviderWithServices[]>({
    queryKey: ["/api/providers"],
  });

  // Enhanced provider filtering
  const filteredProviders = providers?.filter(provider => {
    const matchesSearch = !searchQuery || 
      provider.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.specialties?.some(specialty => specialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      provider.services.some(service => 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory = !selectedCategory || selectedCategory === 'all' ||
      provider.services.some(service => service.category.toLowerCase() === selectedCategory.toLowerCase());

    const matchesLocation = !selectedLocation ||
      provider.location.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesCategory && matchesLocation;
  });

  // Enhanced sorting
  const sortedProviders = filteredProviders?.sort((a, b) => {
    switch (sortBy) {
      case 'price':
        const aPrice = a.services.length > 0 ? Math.min(...a.services.map(s => parseFloat(s.price || '0'))) : 0;
        const bPrice = b.services.length > 0 ? Math.min(...b.services.map(s => parseFloat(s.price || '0'))) : 0;
        return aPrice - bPrice;
      case 'newest':
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      default:
        return 0;
    }
  });

  const handleSearch = () => {
    console.log('Searching for:', { searchQuery, selectedCategory, selectedLocation });
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', encodeURIComponent(searchQuery));
    if (selectedCategory && selectedCategory !== 'all') params.append('category', encodeURIComponent(selectedCategory));
    if (selectedLocation) params.append('location', encodeURIComponent(selectedLocation));
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
    window.history.pushState({}, '', newUrl);
  };

  return (
    <div className="min-h-screen bg-soft-blue pb-24">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Simple Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">Beauty Professionals</h1>
            <p className="text-center text-gray-600">
              {filteredProviders?.length || 0} verified providers • All background verified ✓
            </p>
          </div>

          {/* Provider Grid View */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : sortedProviders && sortedProviders.length > 0 ? (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-rose-600">{sortedProviders.length}</p>
                  <p className="text-sm text-gray-600">Available Providers</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {sortedProviders.reduce((sum, p) => sum + p.services.length, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Services</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    ${sortedProviders.length > 0 && sortedProviders.some(p => p.services.length > 0) ? 
                      Math.min(...sortedProviders.filter(p => p.services.length > 0).map(p => Math.min(...p.services.map(s => parseFloat(s.price || '0'))))) 
                      : '0'}+
                  </p>
                  <p className="text-sm text-gray-600">Starting From</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProviders.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No providers found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or browse all available providers.
              </p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedLocation('');
                }}
                className="bg-rose-500 hover:bg-rose-600"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

      <Footer />
    </div>
  );
}