// Performance monitoring and alerting for production
interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  avgResponseTime: number;
  peakMemoryUsage: number;
  activeConnections: number;
  lastReset: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    requestCount: 0,
    errorCount: 0,
    avgResponseTime: 0,
    peakMemoryUsage: 0,
    activeConnections: 0,
    lastReset: Date.now()
  };

  private responseTimes: number[] = [];
  private readonly maxSamples = 1000; // Keep last 1000 response times

  recordRequest(responseTime: number): void {
    this.metrics.requestCount++;
    this.responseTimes.push(responseTime);
    
    // Keep only recent samples for memory efficiency
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes = this.responseTimes.slice(-this.maxSamples);
    }
    
    // Recalculate average
    this.metrics.avgResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  recordError(): void {
    this.metrics.errorCount++;
  }

  updateMemoryUsage(): void {
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, memUsage);
  }

  setActiveConnections(count: number): void {
    this.metrics.activeConnections = count;
  }

  getMetrics(): PerformanceMetrics & { 
    errorRate: number; 
    requestsPerMinute: number;
    memoryUsageMB: number;
  } {
    const timeElapsed = Date.now() - this.metrics.lastReset;
    const minutes = timeElapsed / (1000 * 60);
    
    return {
      ...this.metrics,
      errorRate: this.metrics.requestCount > 0 ? 
        (this.metrics.errorCount / this.metrics.requestCount) * 100 : 0,
      requestsPerMinute: minutes > 0 ? this.metrics.requestCount / minutes : 0,
      memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024
    };
  }

  reset(): void {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      avgResponseTime: 0,
      peakMemoryUsage: 0,
      activeConnections: this.metrics.activeConnections,
      lastReset: Date.now()
    };
    this.responseTimes = [];
  }

  // Alert if performance degrades
  checkAlerts(): string[] {
    const alerts: string[] = [];
    const current = this.getMetrics();
    
    if (current.errorRate > 5) { // More than 5% error rate
      alerts.push(`High error rate: ${current.errorRate.toFixed(2)}%`);
    }
    
    if (current.avgResponseTime > 1000) { // Responses taking more than 1 second
      alerts.push(`Slow response time: ${current.avgResponseTime.toFixed(0)}ms average`);
    }
    
    if (current.memoryUsageMB > 500) { // More than 500MB memory usage
      alerts.push(`High memory usage: ${current.memoryUsageMB.toFixed(0)}MB`);
    }
    
    return alerts;
  }
}

export const monitor = new PerformanceMonitor();

// Log performance metrics every 5 minutes
setInterval(() => {
  monitor.updateMemoryUsage();
  const metrics = monitor.getMetrics();
  const alerts = monitor.checkAlerts();
  
  console.log('Performance Metrics:', {
    requests: metrics.requestCount,
    errors: metrics.errorCount,
    errorRate: `${metrics.errorRate.toFixed(2)}%`,
    avgResponse: `${metrics.avgResponseTime.toFixed(0)}ms`,
    reqPerMin: metrics.requestsPerMinute.toFixed(1),
    memoryMB: metrics.memoryUsageMB.toFixed(0),
    connections: metrics.activeConnections
  });
  
  if (alerts.length > 0) {
    console.warn('PERFORMANCE ALERTS:', alerts);
  }
}, 5 * 60 * 1000);

// Express middleware for request monitoring
export function performanceMiddleware(req: any, res: any, next: any): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    monitor.recordRequest(duration);
    
    if (res.statusCode >= 400) {
      monitor.recordError();
    }
  });
  
  next();
}