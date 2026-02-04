/**
 * Performance Monitoring
 */

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): void {
    this.metrics.set(label, Date.now());
  }

  endTimer(label: string): number {
    const startTime = this.metrics.get(label);
    if (!startTime) return 0;
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ ${label}: ${duration}ms`);
    this.metrics.delete(label);
    return duration;
  }

  measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(label);
    return fn().finally(() => this.endTimer(label));
  }

  logMemoryUsage(): void {
    if (__DEV__) {
      console.log('📊 Memory usage monitoring enabled');
    }
  }
}

// Usage examples:
// const monitor = PerformanceMonitor.getInstance();
// monitor.startTimer('API_CALL');
// await fetchData();
// monitor.endTimer('API_CALL');