import React, { ErrorInfo, ReactNode } from 'react';
import { ThemeContext } from '@/hooks/useTheme';
import errorService from '../services/errorService';
import ErrorFeedback from './ErrorFeedback';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: React.FC<{ error: Error }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  showFeedback: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = ThemeContext;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null as Error | null, showFeedback: false };
  }

  static getDerivedStateFromError(error: Error) {
    // 更新状态，使下一次渲染能够显示降级UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 收集更详细的错误上下文信息
    const context = {
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      referrer: document.referrer,
      timestamp: Date.now(),
      deviceMemory: (navigator as any).deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      // 尝试获取用户信息（如果有）
      userId: localStorage.getItem('userId') || sessionStorage.getItem('userId') || undefined
    };
    
    // 检查是否是removeChild错误，如果是，忽略它
    if (error instanceof DOMException && error.name === 'NotFoundError' && error.message.includes('removeChild')) {
      console.warn('忽略DOM移除错误:', error.message);
      return;
    }
    
    // 记录错误信息
    const errorInfoObj = errorService.logError(error, context);
    
    // 上报错误到远程服务器
    errorService.reportErrorToServer(errorInfoObj).catch(err => {
      console.warn('错误上报失败:', err);
    });
  }

  handleCloseFeedback = () => {
    this.setState({ showFeedback: false });
  };

  render() {
    const { hasError, error, showFeedback } = this.state;
    const { children, fallbackComponent } = this.props;
    const theme = this.context as React.ContextType<typeof ThemeContext>;
    const { isDark } = theme;

    if (hasError) {
      // 如果提供了自定义降级组件，则使用它
      if (fallbackComponent && error) {
        const Fallback = fallbackComponent;
        return <Fallback error={error} />;
      }

      // 分析错误类型，提供更精准的错误信息
      let errorType = 'DEFAULT_ERROR';
      if (error) {
        if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
          errorType = 'NETWORK_ERROR';
        } else if (error.message.includes('timeout')) {
          errorType = 'TIMEOUT_ERROR';
        } else if (error.message.includes('Permission denied')) {
          errorType = 'PERMISSION_DENIED';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorType = 'RESOURCE_NOT_FOUND';
        }
      }

      // 默认降级UI
      return (
        <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col`}>
          {/* 顶部导航栏 (保持一致的UI体验) */}
          <nav className={`sticky top-0 z-50 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} px-4 py-3`}>
            <div className="container mx-auto flex justify-between items-center">
              <div className="flex items-center space-x-1">
                <span className="text-xl font-bold text-red-600">AI</span>
                <span className="text-xl font-bold">共创</span>
              </div>
            </div>
          </nav>
          
          {/* 错误信息 */}
          <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
            {/* 错误详情（仅在开发环境显示或添加调试按钮） */}
            <div className={`mb-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} max-w-md w-full shadow-lg transition-all hover:shadow-xl`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                错误详情
              </h3>
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-gray-700 rounded-lg text-left overflow-auto max-h-60">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">{error.name}: {error.message}</p>
                  <pre className="text-xs mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{error.stack}</pre>
                </div>
              )}
              
              {/* 解决方案 */}
              <h3 className="text-lg font-semibold mb-4 mt-6 flex items-center">
                <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                推荐解决方案
              </h3>
              <ul className="space-y-3">
                {errorService.getErrorFixSuggestions(errorType).map((suggestion, index) => (
                  <li key={index} className="flex items-start justify-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-3 flex-shrink-0"></i>
                    <span className="text-sm text-left leading-relaxed">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                刷新页面
              </button>
              <button 
                onClick={() => {
                  window.location.href = '/test-basic';
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <i className="fas fa-home mr-2"></i>
                基础测试页面
              </button>
              <button 
                onClick={() => this.setState({ showFeedback: true })}
                className={`px-8 py-3 rounded-full transition-all transform hover:scale-105 ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50 shadow-md hover:shadow-lg'}`}
              >
                <i className="fas fa-comment-dots mr-2"></i>
                反馈问题
              </button>
            </div>
          </main>
          
          {/* 页脚 */}
          <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4`}>
            <div className="container mx-auto text-center">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                © 2025 AI共创平台. 保留所有权利
              </p>
            </div>
          </footer>
          
          {/* 错误反馈弹窗 */}
          {showFeedback && <ErrorFeedback onClose={this.handleCloseFeedback} autoShow error={error || undefined} />}
        </div>
      );
    }

    // 正常渲染子组件
    return children;
  }
}

export default ErrorBoundary;
