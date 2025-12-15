/**
 * 性能监控工具
 * 用于跟踪和分析应用性能，包括自定义性能指标和定期审计功能
 */

// Web Vitals相关类型定义
declare interface LargestContentfulPaint {
  renderTime: number;
  loadTime: number;
  size: number;
  element?: Element;
}

declare interface LayoutShift {
  value: number;
  hadRecentInput: boolean;
}

declare interface FirstInputDelay {
  startTime: number;
  processingStart: number;
  target?: Element;
  type: string;
}

declare interface InteractionToNextPaint {
  duration: number;
  target?: Element;
  type: string;
}

declare interface PerformanceLongTaskTiming {
  duration: number;
  attribution: Array<{
    entryType: string;
    name: string;
    duration: number;
  }>;
}

declare interface PerformanceNavigationTiming {
  responseStart: number;
  domContentLoadedEventEnd: number;
  loadEventEnd: number;
  startTime: number;
  navigationStart?: number;
}

/**
 * 自定义性能指标类型
 */
export type PerformanceMetric = {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  description?: string;
  timestamp: number;
  category?: string; // 新增：指标分类
  metadata?: Record<string, any>; // 新增：附加元数据
};

/**
 * 网络请求性能指标类型
 */
export type NetworkRequestMetric = {
  url: string;
  method: string;
  duration: number;
  status: number;
  size: number;
  timestamp: number;
  fromCache: boolean;
  retries: number;
  error?: string;
};

/**
 * 组件渲染性能指标类型
 */
export type ComponentRenderMetric = {
  componentName: string;
  renderTime: number;
  timestamp: number;
  renderCount: number;
  propsSize?: number;
  isInitialRender: boolean;
};

/**
 * 内存使用指标类型
 */
export type MemoryUsageMetric = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
};

/**
 * 性能监控类
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private networkRequests: NetworkRequestMetric[] = [];
  private componentRenders: ComponentRenderMetric[] = [];
  private memoryUsage: MemoryUsageMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;
  private memoryMonitoringInterval: NodeJS.Timeout | null = null;
  private componentRenderCounts: Map<string, number> = new Map();

  /**
   * 初始化性能监控
   */
  init() {
    if (this.isInitialized) return;

    // 优化：只在开发环境启用完整的性能监控
    const isDev = import.meta.env.DEV;
    
    // 监听核心 Web Vitals - 始终启用，开销较小
    this.setupWebVitalsObserver();
    
    // 监听资源加载性能 - 只在开发环境启用，避免生产环境开销
    if (isDev) {
      this.setupResourceObserver();
      this.setupNavigationObserver();
      this.setupMemoryMonitoring();
      this.setupLongTaskObserver();
    }
    
    this.isInitialized = true;
  }

  /**
   * 清理性能监控资源
   */
  cleanup() {
    // 断开所有观察者连接
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];
    
    // 清除内存监控定时器
    if (this.memoryMonitoringInterval) {
      clearInterval(this.memoryMonitoringInterval);
      this.memoryMonitoringInterval = null;
    }
    
    this.isInitialized = false;
  }

  /**
   * 设置 Web Vitals 观察者
   */
  private setupWebVitalsObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            // 处理测量类型的条目
            if (entry.entryType === 'measure') {
              const measureEntry = entry as PerformanceMeasure;
              // 记录核心 Web Vitals
              if (this.isWebVital(measureEntry.name)) {
                this.recordMetric({
                  name: measureEntry.name,
                  value: measureEntry.duration,
                  unit: 'ms',
                  description: this.getWebVitalDescription(measureEntry.name),
                  timestamp: Date.now(),
                  category: 'web-vitals',
                });
              }
            }
            // 处理 LCP 条目
            else if (entry.entryType === 'largest-contentful-paint') {
              const lcpEntry = entry as unknown as LargestContentfulPaint;
              this.recordMetric({
                name: 'LCP',
                value: lcpEntry.renderTime || lcpEntry.loadTime || 0,
                unit: 'ms',
                description: 'Largest Contentful Paint',
                timestamp: Date.now(),
                category: 'web-vitals',
                metadata: {
                  element: lcpEntry.element?.tagName,
                  size: lcpEntry.size,
                },
              });
            }
            // 处理 CLS 条目
            else if (entry.entryType === 'layout-shift') {
              const clsEntry = entry as unknown as LayoutShift;
              if (!clsEntry.hadRecentInput) {
                this.recordMetric({
                  name: 'CLS',
                  value: clsEntry.value,
                  unit: 'count',
                  description: 'Cumulative Layout Shift',
                  timestamp: Date.now(),
                  category: 'web-vitals',
                });
              }
            }
            // 处理 FID 条目
            else if (entry.entryType === 'first-input') {
              const fidEntry = entry as unknown as FirstInputDelay;
              this.recordMetric({
                name: 'FID',
                value: fidEntry.processingStart - fidEntry.startTime,
                unit: 'ms',
                description: 'First Input Delay',
                timestamp: Date.now(),
                category: 'web-vitals',
                metadata: {
                  target: fidEntry.target?.tagName,
                  type: fidEntry.type,
                },
              });
            }
            // 处理 INP 条目
            else if (entry.entryType === 'event') {
              const inpEntry = entry as unknown as InteractionToNextPaint;
              this.recordMetric({
                name: 'INP',
                value: inpEntry.duration,
                unit: 'ms',
                description: 'Interaction to Next Paint',
                timestamp: Date.now(),
                category: 'web-vitals',
                metadata: {
                  target: inpEntry.target?.tagName,
                  type: inpEntry.type,
                },
              });
            }
          });
        });

        // 监听 Web Vitals 指标
        observer.observe({ type: 'measure', buffered: true });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        observer.observe({ type: 'layout-shift', buffered: true });
        observer.observe({ type: 'first-input', buffered: true });
        observer.observe({ type: 'event', buffered: true });
        
        this.observers.push(observer);
      } catch (error) {
        console.error('Failed to initialize Web Vitals observer:', error);
      }
    }
  }

  /**
   * 设置资源加载观察者
   */
  private setupResourceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformanceResourceTiming[];
          entries.forEach((entry) => {
            // 记录资源加载时间
            this.recordMetric({
              name: `resource-${entry.name.split('/').pop()}`,
              value: entry.duration,
              unit: 'ms',
              description: `${entry.initiatorType} resource load time`,
              timestamp: Date.now(),
              category: 'resource',
              metadata: {
                url: entry.name,
                initiatorType: entry.initiatorType,
                transferSize: entry.transferSize,
                encodedBodySize: entry.encodedBodySize,
                decodedBodySize: entry.decodedBodySize,
              },
            });
          });
        });

        observer.observe({ type: 'resource', buffered: true });
        this.observers.push(observer);
      } catch (error) {
        console.error('Failed to initialize resource observer:', error);
      }
    }
  }

  /**
   * 设置导航性能观察者
   */
  private setupNavigationObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries() as unknown as PerformanceNavigationTiming[];
          entries.forEach((entry) => {
            // 记录导航性能指标
            this.recordMetric({
              name: 'TTFB',
              value: entry.responseStart,
              unit: 'ms',
              description: 'Time to First Byte',
              timestamp: Date.now(),
              category: 'navigation',
            });
            
            this.recordMetric({
              name: 'DOMContentLoaded',
              value: entry.domContentLoadedEventEnd - entry.startTime,
              unit: 'ms',
              description: 'DOM Content Loaded Time',
              timestamp: Date.now(),
              category: 'navigation',
            });
            
            this.recordMetric({
              name: 'LoadEvent',
              value: entry.loadEventEnd - entry.startTime,
              unit: 'ms',
              description: 'Load Event Time',
              timestamp: Date.now(),
              category: 'navigation',
            });
          });
        });

        observer.observe({ type: 'navigation', buffered: true });
        this.observers.push(observer);
      } catch (error) {
        console.error('Failed to initialize navigation observer:', error);
      }
    }
  }

  /**
   * 设置长任务观察者
   */
  private setupLongTaskObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries() as unknown as PerformanceLongTaskTiming[];
          entries.forEach((entry) => {
            // 记录长任务
            if (entry.duration > 50) {
              this.recordMetric({
                name: 'LongTask',
                value: entry.duration,
                unit: 'ms',
                description: 'Long Task Duration',
                timestamp: Date.now(),
                category: 'long-task',
                metadata: {
                  sources: entry.attribution.map(attribution => ({
                    type: attribution.entryType,
                    name: attribution.name,
                    duration: attribution.duration,
                  })),
                },
              });
            }
          });
        });

        observer.observe({ type: 'longtask', buffered: true });
        this.observers.push(observer);
      } catch (error) {
        console.error('Failed to initialize long task observer:', error);
      }
    }
  }

  /**
   * 设置内存使用监控
   */
  private setupMemoryMonitoring() {
    if ('performance' in window && 'memory' in performance) {
      // 立即记录一次内存使用情况
      this.recordMemoryUsage();
      
      // 定期记录内存使用情况（每30秒）
      this.memoryMonitoringInterval = setInterval(() => {
        this.recordMemoryUsage();
      }, 30000);
    }
  }

  /**
   * 记录内存使用情况
   */
  private recordMemoryUsage() {
    if ('performance' in window && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      const metric: MemoryUsageMetric = {
        usedJSHeapSize: memoryInfo.usedJSHeapSize,
        totalJSHeapSize: memoryInfo.totalJSHeapSize,
        jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
        timestamp: Date.now(),
      };
      this.memoryUsage.push(metric);
      
      // 限制内存使用记录数量
      if (this.memoryUsage.length > 100) {
        this.memoryUsage = this.memoryUsage.slice(-50);
      }
      
      // 同时记录为通用指标
      this.recordMetric({
        name: 'MemoryUsage',
        value: memoryInfo.usedJSHeapSize,
        unit: 'bytes',
        description: 'Used JavaScript Heap Size',
        timestamp: Date.now(),
        category: 'memory',
        metadata: {
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
          usagePercentage: (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100,
        },
      });
    }
  }

  /**
   * 检查是否为核心 Web Vital
   */
  private isWebVital(name: string): name is 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP' {
    return ['LCP', 'FID', 'CLS', 'TTFB', 'INP'].includes(name);
  }

  /**
   * 获取 Web Vital 描述
   */
  private getWebVitalDescription(name: string): string {
    const descriptions: Record<string, string> = {
      LCP: 'Largest Contentful Paint',
      FID: 'First Input Delay',
      CLS: 'Cumulative Layout Shift',
      TTFB: 'Time to First Byte',
      INP: 'Interaction to Next Paint',
    };
    return descriptions[name] || name;
  }

  /**
   * 记录自定义性能指标
   */
  recordMetric(metric: PerformanceMetric) {
    // 优化：只在开发环境记录完整指标，生产环境只记录核心Web Vitals
    const isDev = import.meta.env.DEV;
    if (!isDev && !this.isWebVital(metric.name)) {
      return;
    }
    
    this.metrics.push(metric);
    
    // 优化：进一步限制指标数量，避免内存泄漏
    if (this.metrics.length > 500) {
      this.metrics = this.metrics.slice(-200);
    }
  }

  /**
   * 记录网络请求性能
   */
  recordNetworkRequest(metric: NetworkRequestMetric) {
    // 优化：只在开发环境记录完整的网络请求指标
    const isDev = import.meta.env.DEV;
    if (!isDev) return;
    
    this.networkRequests.push(metric);
    
    // 限制网络请求记录数量
    if (this.networkRequests.length > 200) {
      this.networkRequests = this.networkRequests.slice(-100);
    }
    
    // 同时记录为通用指标
    this.recordMetric({
      name: `network-${metric.method}-${metric.url.split('/').pop()}`,
      value: metric.duration,
      unit: 'ms',
      description: `${metric.method} request to ${metric.url}`,
      timestamp: metric.timestamp,
      category: 'network',
      metadata: {
        url: metric.url,
        method: metric.method,
        status: metric.status,
        size: metric.size,
        fromCache: metric.fromCache,
        retries: metric.retries,
      },
    });
  }

  /**
   * 记录组件渲染性能
   */
  recordComponentRender(metric: ComponentRenderMetric) {
    // 优化：只在开发环境记录完整的组件渲染指标
    const isDev = import.meta.env.DEV;
    if (!isDev) return;
    
    // 更新组件渲染计数
    const renderCount = this.componentRenderCounts.get(metric.componentName) || 0;
    this.componentRenderCounts.set(metric.componentName, renderCount + 1);
    
    const updatedMetric = {
      ...metric,
      renderCount: renderCount + 1,
    };
    
    this.componentRenders.push(updatedMetric);
    
    // 限制组件渲染记录数量
    if (this.componentRenders.length > 200) {
      this.componentRenders = this.componentRenders.slice(-100);
    }
    
    // 同时记录为通用指标
    this.recordMetric({
      name: `component-${metric.componentName}`,
      value: metric.renderTime,
      unit: 'ms',
      description: `${metric.componentName} render time`,
      timestamp: metric.timestamp,
      category: 'component',
      metadata: {
        componentName: metric.componentName,
        isInitialRender: metric.isInitialRender,
        renderCount: updatedMetric.renderCount,
      },
    });
  }

  /**
   * 获取所有性能指标
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 获取网络请求指标
   */
  getNetworkRequests(): NetworkRequestMetric[] {
    return [...this.networkRequests];
  }

  /**
   * 获取组件渲染指标
   */
  getComponentRenders(): ComponentRenderMetric[] {
    return [...this.componentRenders];
  }

  /**
   * 获取内存使用指标
   */
  getMemoryUsage(): MemoryUsageMetric[] {
    return [...this.memoryUsage];
  }

  /**
   * 清除所有性能指标
   */
  clearMetrics() {
    this.metrics = [];
    this.networkRequests = [];
    this.componentRenders = [];
    this.memoryUsage = [];
    this.componentRenderCounts.clear();
  }

  /**
   * 清除网络请求指标
   */
  clearNetworkRequests() {
    this.networkRequests = [];
  }

  /**
   * 清除组件渲染指标
   */
  clearComponentRenders() {
    this.componentRenders = [];
    this.componentRenderCounts.clear();
  }

  /**
   * 清除内存使用指标
   */
  clearMemoryUsage() {
    this.memoryUsage = [];
  }

  /**
   * 获取组件渲染统计信息
   */
  getComponentRenderStats() {
    const stats = new Map<string, {
      renderCount: number;
      averageRenderTime: number;
      minRenderTime: number;
      maxRenderTime: number;
      initialRenderTime: number | null;
    }>();
    
    for (const metric of this.componentRenders) {
      if (!stats.has(metric.componentName)) {
        stats.set(metric.componentName, {
          renderCount: 0,
          averageRenderTime: 0,
          minRenderTime: Infinity,
          maxRenderTime: 0,
          initialRenderTime: metric.isInitialRender ? metric.renderTime : null,
        });
      }
      
      const current = stats.get(metric.componentName)!;
      current.renderCount++;
      current.averageRenderTime = (current.averageRenderTime * (current.renderCount - 1) + metric.renderTime) / current.renderCount;
      current.minRenderTime = Math.min(current.minRenderTime, metric.renderTime);
      current.maxRenderTime = Math.max(current.maxRenderTime, metric.renderTime);
      if (metric.isInitialRender) {
        current.initialRenderTime = metric.renderTime;
      }
    }
    
    return Object.fromEntries(stats);
  }

  /**
   * 获取网络请求统计信息
   */
  getNetworkRequestStats() {
    const stats = {
      totalRequests: this.networkRequests.length,
      averageDuration: 0,
      averageSize: 0,
      cacheHitRate: 0,
      successRate: 0,
      methods: new Map<string, number>(),
      statusCodes: new Map<number, number>(),
    };
    
    if (stats.totalRequests === 0) return stats;
    
    let cacheHits = 0;
    let successfulRequests = 0;
    let totalDuration = 0;
    let totalSize = 0;
    
    for (const request of this.networkRequests) {
      // 方法统计
      stats.methods.set(request.method, (stats.methods.get(request.method) || 0) + 1);
      
      // 状态码统计
      stats.statusCodes.set(request.status, (stats.statusCodes.get(request.status) || 0) + 1);
      
      // 缓存命中率
      if (request.fromCache) cacheHits++;
      
      // 成功率
      if (request.status >= 200 && request.status < 300) successfulRequests++;
      
      // 总时长和总大小
      totalDuration += request.duration;
      totalSize += request.size;
    }
    
    stats.averageDuration = totalDuration / stats.totalRequests;
    stats.averageSize = totalSize / stats.totalRequests;
    stats.cacheHitRate = cacheHits / stats.totalRequests;
    stats.successRate = successfulRequests / stats.totalRequests;
    
    return {
      ...stats,
      methods: Object.fromEntries(stats.methods),
      statusCodes: Object.fromEntries(stats.statusCodes),
    };
  }

  /**
   * 测量代码执行时间
   */
  measureExecutionTime<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    this.recordMetric({
      name,
      value: end - start,
      unit: 'ms',
      description: `Execution time for ${name}`,
      timestamp: Date.now(),
    });
    
    return result;
  }

  /**
   * 开始性能测量
   */
  startMeasure(name: string) {
    performance.mark(`${name}-start`);
  }

  /**
   * 结束性能测量
   */
  endMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name).pop();
    if (measure) {
      this.recordMetric({
        name,
        value: measure.duration,
        unit: 'ms',
        description: `Performance measure for ${name}`,
        timestamp: Date.now(),
      });
    }
    
    // 清理标记
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
  }

  /**
   * 运行性能审计
   */
  async runAudit(): Promise<PerformanceAuditResult> {
    // 等待所有资源加载完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 获取性能数据
    const navigationEntry = performance.getEntriesByType('navigation')[0] as unknown as PerformanceNavigationTiming;
    const resourceEntries = performance.getEntriesByType('resource') as unknown as PerformanceResourceTiming[];
    const longTaskEntries = performance.getEntriesByType('longtask') as unknown as PerformanceLongTaskTiming[];
    
    // 计算审计结果
    const auditResult: PerformanceAuditResult = {
      timestamp: Date.now(),
      metrics: {
        // 核心 Web Vitals
        LCP: this.getMetricValue('LCP') || 0,
        FID: this.getMetricValue('FID') || 0,
        CLS: this.getMetricValue('CLS') || 0,
        TTFB: navigationEntry?.responseStart || 0,
        INP: this.getMetricValue('INP') || 0,
        // 导航性能
        navigationStart: navigationEntry?.startTime || 0,
        domContentLoaded: navigationEntry?.domContentLoadedEventEnd || 0,
        loadEvent: navigationEntry?.loadEventEnd || 0,
        // 资源统计
        totalResources: resourceEntries.length,
        totalResourceSize: resourceEntries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
        // 长任务统计
        longTasks: longTaskEntries.length,
        totalLongTaskDuration: longTaskEntries.reduce((sum, entry) => sum + entry.duration, 0),
        // 网络请求统计
        networkRequests: this.networkRequests.length,
        averageRequestDuration: this.getNetworkRequestStats().averageDuration,
        cacheHitRate: this.getNetworkRequestStats().cacheHitRate,
        // 组件渲染统计
        componentRenders: this.componentRenders.length,
        averageComponentRenderTime: this.componentRenders.length > 0 
          ? this.componentRenders.reduce((sum, entry) => sum + entry.renderTime, 0) / this.componentRenders.length 
          : 0,
        // 内存使用
        memoryUsage: this.memoryUsage.length > 0 
          ? this.memoryUsage[this.memoryUsage.length - 1].usedJSHeapSize 
          : 0,
        // 自定义指标
        customMetrics: this.metrics,
      },
      // 性能评分（基于 Web Vitals）
      score: this.calculatePerformanceScore(),
      // 优化建议
      suggestions: this.generateOptimizationSuggestions(),
      // 新增：详细统计信息
      detailedStats: {
        network: this.getNetworkRequestStats(),
        components: this.getComponentRenderStats(),
        memory: this.memoryUsage.length > 0 ? this.memoryUsage[this.memoryUsage.length - 1] : undefined,
      },
    };
    
    return auditResult;
  }

  /**
   * 获取指标值
   */
  private getMetricValue(name: string): number | undefined {
    const metric = this.metrics.find(m => m.name === name);
    return metric?.value;
  }

  /**
   * 计算性能评分
   */
  private calculatePerformanceScore(): number {
    // 基于核心 Web Vitals 计算评分（0-100）
    let score = 100;
    
    // LCP (Good: <2.5s, Needs Improvement: 2.5s-4s, Poor: >4s)
    const lcp = this.getMetricValue('LCP') || 0;
    if (lcp > 4000) score -= 30;
    else if (lcp > 2500) score -= 15;
    
    // FID (Good: <100ms, Needs Improvement: 100ms-300ms, Poor: >300ms)
    const fid = this.getMetricValue('FID') || 0;
    if (fid > 300) score -= 25;
    else if (fid > 100) score -= 10;
    
    // CLS (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    const cls = this.getMetricValue('CLS') || 0;
    if (cls > 0.25) score -= 25;
    else if (cls > 0.1) score -= 10;
    
    // INP (Good: <200ms, Needs Improvement: 200ms-500ms, Poor: >500ms)
    const inp = this.getMetricValue('INP') || 0;
    if (inp > 500) score -= 20;
    else if (inp > 200) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    
    const lcp = this.getMetricValue('LCP') || 0;
    const fid = this.getMetricValue('FID') || 0;
    const cls = this.getMetricValue('CLS') || 0;
    const inp = this.getMetricValue('INP') || 0;
    
    if (lcp > 2500) {
      suggestions.push('优化最大内容绘制 (LCP)：考虑优化图片大小、使用 CDN 或预加载关键资源');
    }
    
    if (fid > 100) {
      suggestions.push('优化首次输入延迟 (FID)：减少主线程阻塞，考虑代码分割或懒加载');
    }
    
    if (cls > 0.1) {
      suggestions.push('优化累积布局偏移 (CLS)：为图片添加固定尺寸，避免动态插入内容');
    }
    
    if (inp > 200) {
      suggestions.push('优化交互到下一次绘制 (INP)：减少事件处理器执行时间，使用防抖/节流');
    }
    
    return suggestions;
  }
}

/**
 * 性能审计结果类型
 */
export type PerformanceAuditResult = {
  timestamp: number;
  metrics: {
    // 核心 Web Vitals
    LCP: number;
    FID: number;
    CLS: number;
    TTFB: number;
    INP: number;
    // 导航性能
    navigationStart: number;
    domContentLoaded: number;
    loadEvent: number;
    // 资源统计
    totalResources: number;
    totalResourceSize: number;
    // 长任务统计
    longTasks: number;
    totalLongTaskDuration: number;
    // 网络请求统计
    networkRequests: number;
    averageRequestDuration: number;
    cacheHitRate: number;
    // 组件渲染统计
    componentRenders: number;
    averageComponentRenderTime: number;
    // 内存使用
    memoryUsage: number;
    // 自定义指标
    customMetrics: PerformanceMetric[];
  };
  // 性能评分（0-100）
  score: number;
  // 优化建议
  suggestions: string[];
  // 详细统计信息
  detailedStats?: {
    network: ReturnType<PerformanceMonitor['getNetworkRequestStats']>;
    components: ReturnType<PerformanceMonitor['getComponentRenderStats']>;
    memory?: MemoryUsageMetric;
  };
};

// 导出单例实例
export const performanceMonitor = new PerformanceMonitor();

// 自动初始化
export function initPerformanceMonitor() {
  performanceMonitor.init();
}

// 导出便捷函数
export const { 
  recordMetric, 
  recordNetworkRequest,
  recordComponentRender,
  getMetrics, 
  getNetworkRequests,
  getComponentRenders,
  getMemoryUsage,
  getComponentRenderStats,
  getNetworkRequestStats,
  clearMetrics, 
  clearNetworkRequests,
  clearComponentRenders,
  clearMemoryUsage,
  measureExecutionTime, 
  startMeasure, 
  endMeasure,
  runAudit,
  init,
  cleanup
} = performanceMonitor;