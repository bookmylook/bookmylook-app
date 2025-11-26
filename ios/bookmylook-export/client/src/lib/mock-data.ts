import { ProviderWithServices, Service, Review } from "@shared/schema";

export const mockProviders: ProviderWithServices[] = [
  {
    id: "provider1",
    userId: "user1", 
    businessName: "Sarah's Hair Studio",
    description: "Specializing in modern cuts and color with 8+ years experience. Certified in advanced coloring techniques.",
    location: "Downtown District",
    profileImage: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
    portfolio: [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"
    ],
    specialties: ["Hair Cutting", "Hair Coloring", "Styling"],
    rating: "4.9",
    reviewCount: 47,
    verified: true,
    createdAt: new Date(),
    user: {
      id: "user1",
      email: "sarah@example.com", 
      password: "password123",
      firstName: "Sarah",
      lastName: "Johnson",
      phone: "+1-555-0101",
      role: "provider",
      createdAt: new Date(),
    },
    services: [
      {
        id: "service1",
        providerId: "provider1",
        name: "Women's Haircut & Style",
        description: "Cut, wash, and basic styling",
        category: "hair",
        price: "65.00",
        duration: 90,
        active: true,
        createdAt: new Date(),
      },
      {
        id: "service2", 
        providerId: "provider1",
        name: "Full Color Service",
        description: "Color application with cut and style",
        category: "hair",
        price: "120.00",
        duration: 180,
        active: true,
        createdAt: new Date(),
      }
    ],
    reviews: [
      {
        id: "review1",
        bookingId: "booking1",
        clientId: "client1",
        providerId: "provider1", 
        rating: 5,
        comment: "Amazing experience! Sarah really understood what I wanted.",
        createdAt: new Date(),
      }
    ]
  }
];
