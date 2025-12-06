// 性能测试工具
interface PerformanceMetrics {
  initialLoadTime: number;
  timeToInteractive: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  imageLoadTimes: number[];
  componentRenderTimes: number[];
  memoryUsage: number;
  fps: number;
  bundleSize: number;
  cacheHitRate: number;
}

class PerformanceTest {
  private metrics: PerformanceMetrics = {
    initialLoadTime: 0,
    timeToInteractive: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    cumulativeLayoutShift: 0,
    totalBlockingTime: 0,
    imageLoadTimes: [],
    componentRenderTimes: [],
    memoryUsage: 0,
    fps: 0,
    bundleSize: 0,
    cacheHitRate: 0
  };

  private startTime: number = 0;
  private renderTimes: number[] = [];
  private imageLoadStartTimes: Map<string, number> = new Map();
  private observer: PerformanceObserver | null = null;

  // 开始性能测试
  startTest() {
    this.startTime = performance.now();
    this.setupPerformanceObservers();
    this.startMemoryMonitoring();
    this.startFpsMonitoring();
  }

  // 设置性能观察器
  private setupPerformanceObservers() {
    // 监听页面加载指标
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          switch (entry.entryType) {
            case 'paint':
              if (entry.name === 'first-paint') {
                this.metrics.initialLoadTime = entry.startTime;
              } else if (entry.name === 'first-contentful-paint') {
                this.metrics.firstContentfulPaint = entry.startTime;
              }
              break;
            case 'largest-contentful-paint':
              this.metrics.largestContentfulPaint = entry.startTime;
              break;
            case 'layout-shift':
              // 使用类型断言为any，避免TypeScript编译错误
              const layoutShiftEntry = entry as any;
              if (!layoutShiftEntry.hadRecentInput) {
                this.metrics.cumulativeLayoutShift += layoutShiftEntry.value;
              }
              break;
          }
        });
      });

      this.observer.observe({
        entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift']
      });
    }
  }

  // 开始内存监控
  private startMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
      }, 1000);
    }
  }

  // 开始FPS监控
  private startFpsMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();

    const updateFps = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(updateFps);
    };

    requestAnimationFrame(updateFps);
  }

  // 标记组件渲染时间
  markComponentRender(componentName: string) {
    const renderTime = performance.now() - this.startTime;
    this.metrics.componentRenderTimes.push(renderTime);
    
    // 如果是Square组件的首次渲染，记录为可交互时间
    if (componentName === 'Square' && this.metrics.timeToInteractive === 0) {
      this.metrics.timeToInteractive = renderTime;
    }
  }

  // 标记图片开始加载
  markImageLoadStart(imageUrl: string) {
    this.imageLoadStartTimes.set(imageUrl, performance.now());
  }

  // 标记图片加载完成
  markImageLoadComplete(imageUrl: string) {
    const startTime = this.imageLoadStartTimes.get(imageUrl);
    if (startTime) {
      const loadTime = performance.now() - startTime;
      this.metrics.imageLoadTimes.push(loadTime);
      this.imageLoadStartTimes.delete(imageUrl);
    }
  }

  // 计算缓存命中率
  calculateCacheHitRate(totalRequests: number, cacheHits: number) {
    this.metrics.cacheHitRate = cacheHits / totalRequests * 100;
  }

  // 获取性能报告
  getReport(): PerformanceMetrics {
    // 计算平均值
    const avgImageLoadTime = this.metrics.imageLoadTimes.length > 0 
      ? this.metrics.imageLoadTimes.reduce((a, b) => a + b, 0) / this.metrics.imageLoadTimes.length 
      : 0;
    
    const avgRenderTime = this.metrics.componentRenderTimes.length > 0
      ? this.metrics.componentRenderTimes.reduce((a, b) => a + b, 0) / this.metrics.componentRenderTimes.length
      : 0;

    return {
      ...this.metrics,
      imageLoadTimes: [avgImageLoadTime], // 返回平均值
      componentRenderTimes: [avgRenderTime] // 返回平均值
    };
  }

  // 生成性能报告摘要
  getSummary(): string {
    const report = this.getReport();
    return `
性能测试报告:
================
初始加载时间: ${report.initialLoadTime.toFixed(2)}ms
可交互时间: ${report.timeToInteractive.toFixed(2)}ms
首次内容绘制: ${report.firstContentfulPaint.toFixed(2)}ms
最大内容绘制: ${report.largestContentfulPaint.toFixed(2)}ms
累计布局偏移: ${report.cumulativeLayoutShift.toFixed(4)}
平均图片加载时间: ${report.imageLoadTimes[0]?.toFixed(2) || 0}ms
平均组件渲染时间: ${report.componentRenderTimes[0]?.toFixed(2) || 0}ms
内存使用: ${report.memoryUsage.toFixed(2)}MB
FPS: ${report.fps}
缓存命中率: ${report.cacheHitRate.toFixed(2)}%
================
    `;
  }
}

export default PerformanceTest;