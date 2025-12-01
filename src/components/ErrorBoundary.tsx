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
    // 记录错误信息
    errorService.logError(error, {
      componentStack: errorInfo.componentStack
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
            <div className="mb-6 text-8xl text-red-600 animate-pulse">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <h1 className="text-3xl font-bold mb-4">抱歉，出现了一些问题</h1>
            <p className={`max-w-lg mx-auto mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {error ? errorService.getFriendlyErrorMessage(errorType) : '页面加载过程中出现了错误。'}
            </p>
            
            {/* 解决方案 */}
            <div className={`mb-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} max-w-md w-full shadow-lg transition-all hover:shadow-xl`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
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
            
            {/* 错误详情（可展开） */}
            {error && (
              <div className={`mb-8 p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} max-w-md w-full shadow-lg`}>
                <details className="group">
                  <summary className="text-sm font-medium cursor-pointer flex items-center justify-between">
                    <span>错误详情</span>
                    <i className="fas fa-chevron-down group-open:rotate-180 transition-transform duration-200 text-gray-500"></i>
                  </summary>
                  <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'} text-left overflow-x-auto`}>
                    <p className="text-sm font-mono mb-2">{error.message}</p>
                    {error.stack && (
                      <pre className="text-xs text-gray-500 whitespace-pre-wrap">{error.stack}</pre>
                    )}
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(error.stack || error.message)
                          .then(() => alert('错误信息已复制到剪贴板'))
                          .catch(() => alert('复制失败，请手动复制'))
                      }}
                      className="mt-3 text-xs text-blue-500 hover:text-blue-700 flex items-center"
                    >
                      <i className="fas fa-copy mr-1"></i>
                      复制错误信息
                    </button>
                  </div>
                </details>
              </div>
            )}
            
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
                onClick={() => window.history.back()}
                className={`px-8 py-3 rounded-full transition-all transform hover:scale-105 ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50 shadow-md hover:shadow-lg'}`}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                返回上一页
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
