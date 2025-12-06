// Simple in-memory cache with TTL for high-performance data access
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiry) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getSize(): number {
    return this.cache.size;
  }
}

export const cache = new MemoryCache();

// Clean up expired cache entries every 10 minutes
setInterval(() => {
  cache.cleanup();
  console.log(`Cache cleanup completed. Current cache size: ${cache.getSize()}`);
}, 10 * 60 * 1000);

// Cache key generators
export const CacheKeys = {
  allProviders: 'providers:all',
  providerSearch: (search?: string, category?: string, location?: string) => 
    `providers:search:${search || 'all'}:${category || 'all'}:${location || 'all'}`,
  provider: (id: string) => `provider:${id}`,
  providerServices: (providerId: string) => `provider:${providerId}:services`,
  userBookings: (userId: string) => `user:${userId}:bookings`,
};