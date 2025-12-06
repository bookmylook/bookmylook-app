import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Grid, List, Eye, Camera, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { PortfolioItem } from "@shared/schema";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "hair", label: "Hair Services" },
  { value: "nails", label: "Nail Services" },
  { value: "makeup", label: "Makeup" },
  { value: "skincare", label: "Skincare" },
  { value: "massage", label: "Massage" },
  { value: "spa", label: "Spa Services" },
];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: portfolioItems, isLoading } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/portfolio", selectedCategory === "all" ? undefined : selectedCategory, searchQuery || undefined],
  });

  const { data: featuredItems } = useQuery<PortfolioItem[]>({
    queryKey: ["/api/portfolio/featured"],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 pb-20">
      <Header />
      
      {/* Provider Showcase Content */}
      <div className="bg-white/95 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-800">Provider Showcase</h1>
              <Sparkles className="w-8 h-8 text-pink-600" />
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore stunning beauty transformations, inspiring work, and amazing results from our verified providers
            </p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
              <Camera className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Advertisement & Portfolio Gallery</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search provider work..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Featured Section */}
          {featuredItems && featuredItems.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">✨ Featured Work</h2>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
                  Editor's Choice
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredItems.slice(0, 4).map((item) => (
                  <FeaturedPortfolioCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Latest Work
              {portfolioItems && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({portfolioItems.length} items)
                </span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-6"
            }>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : portfolioItems && portfolioItems.length > 0 ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-6"
            }>
              {portfolioItems.map((item) => (
                <PortfolioCard key={item.id} item={item} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 md:p-12 text-center">
                <div className="text-6xl mb-6">💇‍♀️✨</div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                  Provider Showcase Coming Soon
                </h3>
                <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                  This is where providers will showcase their best work, transformations, and beauty creations
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 mt-8 text-left">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="text-3xl mb-3">📸</div>
                    <h4 className="font-semibold text-gray-800 mb-2">Portfolio Display</h4>
                    <p className="text-sm text-gray-600">
                      Providers can showcase their best work, before/after transformations, and creative styles
                    </p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="text-3xl mb-3">🎯</div>
                    <h4 className="font-semibold text-gray-800 mb-2">Advertisement Space</h4>
                    <p className="text-sm text-gray-600">
                      Promote special services, seasonal offers, and unique beauty treatments to attract clients
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-gray-600 mb-4">
                    Meanwhile, explore our verified providers and book your beauty appointments
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/providers'}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    Browse Providers
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

function FeaturedPortfolioCard({ item }: { item: PortfolioItem }) {
  return (
    <Card className="group cursor-pointer hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="relative">
        <img
          src={item.imageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
          alt={item.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
          Featured
        </Badge>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-semibold text-sm mb-1 line-clamp-1">{item.title}</h3>
          <div className="flex items-center text-xs opacity-90">
            <Eye className="w-3 h-3 mr-1" />
            {item.views || 0} views
          </div>
        </div>
      </div>
    </Card>
  );
}

function PortfolioCard({ item, viewMode }: { item: PortfolioItem; viewMode: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <Card className="flex overflow-hidden hover:shadow-lg transition-shadow">
        <img
          src={item.imageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
          alt={item.title}
          className="w-48 h-32 object-cover flex-shrink-0"
        />
        <CardContent className="flex-1 p-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-800">{item.title}</h3>
              <Badge variant="outline" className="mt-1">
                {item.category}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="w-4 h-4" />
              {item.views || 0}
            </div>
          </div>
          {item.description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{item.description}</p>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group cursor-pointer hover:shadow-xl transition-shadow duration-300 overflow-hidden" data-testid={`card-portfolio-${item.id}`}>
      <div className="relative">
        <img
          src={item.imageUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
          alt={item.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          data-testid={`img-portfolio-${item.id}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs">
              <Eye className="w-3 h-3 mr-1" />
              {item.views || 0}
            </div>
            <Badge className="bg-black/50 border-0">
              {item.category}
            </Badge>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-1" data-testid={`text-title-${item.id}`}>
          {item.title}
        </h3>
        {item.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{item.description}</p>
        )}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
