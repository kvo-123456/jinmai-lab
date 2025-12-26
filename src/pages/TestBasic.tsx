import React from 'react';

const TestBasic: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">基本功能测试</h1>
        
        <div className="space-y-8">
          {/* 基本渲染测试 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">基本渲染</h2>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-700">✅ 页面已成功加载</p>
              <p className="text-gray-600 mt-2">这是一个基本的测试页面，用于验证应用的核心功能是否正常工作。</p>
            </div>
          </section>
          
          {/* React 状态测试 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">React 状态</h2>
            <StateTest />
          </section>
          
          {/* 图片加载测试 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">图片加载</h2>
            <ImageTest />
          </section>
          
          {/* 错误处理测试 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">错误处理</h2>
            <ErrorHandlingTest />
          </section>
        </div>
      </div>
    </div>
  );
};

// 状态测试组件
const StateTest: React.FC = () => {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <p className="text-blue-700">✅ React 状态工作正常</p>
      <div className="mt-4 flex items-center gap-4">
        <button 
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          减 1
        </button>
        <span className="text-xl font-bold">{count}</span>
        <button 
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          加 1
        </button>
      </div>
    </div>
  );
};

// 图片加载测试组件
const ImageTest: React.FC = () => {
  const [localImageLoaded, setLocalImageLoaded] = React.useState(false);
  const [localImageError, setLocalImageError] = React.useState(false);
  const [externalImageLoaded, setExternalImageLoaded] = React.useState(false);
  const [externalImageError, setExternalImageError] = React.useState(false);
  
  return (
    <div className="space-y-4">
      {/* 本地图片测试 */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="font-medium text-purple-800 mb-2">本地图片</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32">
            <img 
              src="/images/placeholder-image.jpg" 
              alt="本地占位图" 
              className="w-full h-full object-cover rounded"
              onLoad={() => setLocalImageLoaded(true)}
              onError={() => setLocalImageError(true)}
            />
            {localImageLoaded && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                ✅ 加载成功
              </div>
            )}
            {localImageError && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                ❌ 加载失败
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              测试本地图片是否能够正常加载。
              {localImageLoaded ? ' ✅ 本地图片加载成功' : localImageError ? ' ❌ 本地图片加载失败' : ' ⏳ 正在加载...'}
            </p>
          </div>
        </div>
      </div>
      
      {/* 外部图片测试 */}
      <div className="bg-pink-50 p-4 rounded-lg">
        <h3 className="font-medium text-pink-800 mb-2">外部图片</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-32 h-32">
            <img 
              src="https://picsum.photos/200/200" 
              alt="外部测试图" 
              className="w-full h-full object-cover rounded"
              onLoad={() => setExternalImageLoaded(true)}
              onError={() => setExternalImageError(true)}
            />
            {externalImageLoaded && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                ✅ 加载成功
              </div>
            )}
            {externalImageError && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                ❌ 加载失败
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              测试外部图片是否能够正常加载。
              {externalImageLoaded ? ' ✅ 外部图片加载成功' : externalImageError ? ' ❌ 外部图片加载失败' : ' ⏳ 正在加载...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 错误处理测试组件
const ErrorHandlingTest: React.FC = () => {
  const [shouldThrowError, setShouldThrowError] = React.useState(false);
  
  if (shouldThrowError) {
    throw new Error('测试错误处理机制');
  }
  
  return (
    <div className="bg-yellow-50 p-4 rounded-lg">
      <h3 className="font-medium text-yellow-800 mb-2">错误边界测试</h3>
      <p className="text-sm text-gray-600 mb-4">
        点击按钮触发一个错误，测试应用的错误边界是否能够正常工作。
      </p>
      <button 
        onClick={() => setShouldThrowError(true)}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        触发错误
      </button>
    </div>
  );
};

export default TestBasic;