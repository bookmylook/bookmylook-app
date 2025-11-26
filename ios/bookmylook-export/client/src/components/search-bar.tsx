import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (locationQuery) params.append('location', locationQuery);
    
    setLocation(`/providers?${params.toString()}`);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input 
            type="text" 
            placeholder="What service are you looking for?" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-oceanic-blue focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <Input 
            type="text" 
            placeholder="Enter your location" 
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-oceanic-blue focus:border-transparent"
          />
        </div>
        <button 
          onClick={handleSearch}
          className="px-8 py-3 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          🔍 Search
        </button>
      </div>
    </div>
  );
}
