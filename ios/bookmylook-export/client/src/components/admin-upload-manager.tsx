import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Shield, Upload, Image, Package, Plus, X } from "lucide-react";
import type { Provider } from "@shared/schema";

export default function AdminUploadManager() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<"portfolio" | "product">("portfolio");
  
  // Portfolio form state
  const [portfolioForm, setPortfolioForm] = useState({
    providerId: "",
    title: "",
    description: "",
    category: "",
    imageUrl: "",
    featured: false
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    providerId: "",
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    inStock: true
  });

  const { data: providers = [] } = useQuery<Provider[]>({
    queryKey: ["/api/providers"]
  });

  const adminAuthentication = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch("/api/admin/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role: "play_console_manager" })
      });
      if (!response.ok) throw new Error("Authentication failed");
      return response.json();
    },
    onSuccess: () => {
      setIsAdminMode(true);
      setAdminPassword("");
      localStorage.setItem('adminAuthenticated', 'true');
      toast({ title: "Admin access granted", description: "You can now upload provider work" });
    },
    onError: () => {
      toast({ title: "Authentication failed", description: "Invalid Google Play Console manager credentials", variant: "destructive" });
    }
  });

  const uploadPortfolioMutation = useMutation({
    mutationFn: async (data: typeof portfolioForm) => {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": import.meta.env.VITE_ADMIN_PASSWORD
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to upload portfolio item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      setShowUploadDialog(false);
      setPortfolioForm({ providerId: "", title: "", description: "", category: "", imageUrl: "", featured: false });
      toast({ title: "Portfolio item uploaded", description: "Provider work has been added successfully" });
    },
    onError: () => {
      toast({ title: "Upload failed", description: "Unable to upload portfolio item", variant: "destructive" });
    }
  });

  const uploadProductMutation = useMutation({
    mutationFn: async (data: typeof productForm) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-admin-password": import.meta.env.VITE_ADMIN_PASSWORD
        },
        body: JSON.stringify({
          ...data,
          price: parseFloat(data.price)
        })
      });
      if (!response.ok) throw new Error("Failed to upload product");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowUploadDialog(false);
      setProductForm({ providerId: "", name: "", description: "", price: "", category: "", imageUrl: "", inStock: true });
      toast({ title: "Product uploaded", description: "Provider product has been added successfully" });
    },
    onError: () => {
      toast({ title: "Upload failed", description: "Unable to upload product", variant: "destructive" });
    }
  });

  const handleAdminLogin = () => {
    if (!adminPassword.trim()) {
      toast({ title: "Password required", description: "Enter Google Play Console manager password", variant: "destructive" });
      return;
    }
    adminAuthentication.mutate(adminPassword);
  };

  const handleUpload = () => {
    if (uploadType === "portfolio") {
      if (!portfolioForm.providerId || !portfolioForm.title || !portfolioForm.imageUrl) {
        toast({ title: "Missing fields", description: "Provider, title, and image URL are required", variant: "destructive" });
        return;
      }
      uploadPortfolioMutation.mutate(portfolioForm);
    } else {
      if (!productForm.providerId || !productForm.name || !productForm.price || !productForm.imageUrl) {
        toast({ title: "Missing fields", description: "Provider, name, price, and image URL are required", variant: "destructive" });
        return;
      }
      uploadProductMutation.mutate(productForm);
    }
  };

  if (!isAdminMode) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-red-600" />
            Admin Access Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="admin-password">Google Play Console Manager Password</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              data-testid="admin-password-input"
            />
          </div>
          <Button
            onClick={handleAdminLogin}
            disabled={adminAuthentication.isPending}
            className="w-full bg-red-600 hover:bg-red-700"
            data-testid="admin-login-button"
          >
            <Shield className="w-4 h-4 mr-2" />
            {adminAuthentication.isPending ? "Authenticating..." : "Access Admin Panel"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Upload Manager</h1>
          <p className="text-gray-600">Upload portfolio items and products for providers</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Admin Mode Active
          </div>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="upload-work-button"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Provider Work
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Image className="w-5 h-5 mr-2 text-blue-600" />
              Portfolio Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Upload and manage provider portfolio items, showcasing their work and services.</p>
            <Button
              onClick={() => {
                setUploadType("portfolio");
                setShowUploadDialog(true);
              }}
              variant="outline"
              className="w-full"
              data-testid="upload-portfolio-button"
            >
              <Image className="w-4 h-4 mr-2" />
              Upload Portfolio Item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2 text-green-600" />
              Product Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Upload and manage marketplace products that providers offer for sale.</p>
            <Button
              onClick={() => {
                setUploadType("product");
                setShowUploadDialog(true);
              }}
              variant="outline"
              className="w-full"
              data-testid="upload-product-button"
            >
              <Package className="w-4 h-4 mr-2" />
              Upload Product
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {uploadType === "portfolio" ? (
                <>
                  <Image className="w-5 h-5 mr-2 text-blue-600" />
                  Upload Portfolio Item
                </>
              ) : (
                <>
                  <Package className="w-5 h-5 mr-2 text-green-600" />
                  Upload Product
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {uploadType === "portfolio" 
                ? "Add a new portfolio item to showcase provider work"
                : "Add a new product to the marketplace"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="provider">Provider</Label>
              <Select
                value={uploadType === "portfolio" ? portfolioForm.providerId : productForm.providerId}
                onValueChange={(value) => {
                  if (uploadType === "portfolio") {
                    setPortfolioForm(prev => ({ ...prev, providerId: value }));
                  } else {
                    setProductForm(prev => ({ ...prev, providerId: value }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {uploadType === "portfolio" ? (
              <>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={portfolioForm.title}
                    onChange={(e) => setPortfolioForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Portfolio item title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={portfolioForm.description}
                    onChange={(e) => setPortfolioForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the work..."
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={portfolioForm.category}
                    onValueChange={(value) => setPortfolioForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hair">Hair Services</SelectItem>
                      <SelectItem value="skincare">Skincare</SelectItem>
                      <SelectItem value="makeup">Makeup</SelectItem>
                      <SelectItem value="nails">Nail Services</SelectItem>
                      <SelectItem value="massage">Massage</SelectItem>
                      <SelectItem value="spa">Spa Services</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input
                    id="image-url"
                    value={portfolioForm.imageUrl}
                    onChange={(e) => setPortfolioForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Product description..."
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={productForm.category}
                    onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hair-care">Hair Care</SelectItem>
                      <SelectItem value="skincare">Skincare</SelectItem>
                      <SelectItem value="makeup">Makeup</SelectItem>
                      <SelectItem value="tools">Tools & Equipment</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input
                    id="image-url"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/product.jpg"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadPortfolioMutation.isPending || uploadProductMutation.isPending}
              className={uploadType === "portfolio" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
              data-testid="confirm-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadPortfolioMutation.isPending || uploadProductMutation.isPending ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}