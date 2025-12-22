import React from 'react';
import LazyImage from './LazyImage';
import { processImageUrl } from '../utils/imageUrlUtils';
import imageService from '../services/imageService';

const GitHubImageTest: React.FC = () => {
  // 测试各种GitHub图片URL
  const testUrls = [
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF/Box.gltf',
    'https://github.com/KhronosGroup/glTF-Sample-Models/raw/master/2.0/Duck/glTF/Duck.gltf',
    'https://raw.githubusercontent.com/octocat/Hello-World/master/images/octocat.png',
    'https://github.com/octocat/Hello-World/blob/master/images/octocat.png?raw=true'
  ];

  // 测试URL处理函数
  const testUrlProcessing = () => {
    console.log('Testing URL processing...');
    testUrls.forEach((url, index) => {
      console.log(`\nTest ${index + 1}:`);
      console.log(`Original URL: ${url}`);
      console.log(`Processed URL: ${processImageUrl(url)}`);
      console.log(`Normalized URL: ${imageService.normalizeUrl(url)}`);
      console.log(`Responsive URL: ${imageService.getResponsiveUrl(url)}`);
      console.log(`Low quality URL: ${imageService.getLowQualityUrl(url)}`);
    });
  };

  React.useEffect(() => {
    testUrlProcessing();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">GitHub图片URL测试</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {testUrls.map((url, index) => (
          <div key={index} className="border p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">测试 {index + 1}</h2>
            <p className="text-sm text-gray-600 mb-4 break-all">{url}</p>
            <div className="h-48 flex items-center justify-center bg-gray-100 rounded-md overflow-hidden">
              {url.endsWith('.gltf') ? (
                <p className="text-gray-500">这是一个GLTF模型文件</p>
              ) : (
                <LazyImage
                  src={url}
                  alt={`GitHub Image Test ${index + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
            <div className="mt-4 text-sm">
              <p><strong>处理后URL:</strong></p>
              <p className="text-xs break-all text-blue-600">{processImageUrl(url)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">测试结果</h2>
        <p className="mb-4">请在浏览器控制台查看完整的URL处理测试结果。</p>
        <p className="text-sm text-gray-600">
          检查点:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>GitHub URL是否保持原始格式？</li>
            <li>是否没有添加额外的参数？</li>
            <li>URL标准化是否跳过了GitHub域名？</li>
            <li>响应式URL是否保持了原始GitHub URL？</li>
          </ul>
        </p>
      </div>
    </div>
  );
};

export default GitHubImageTest;