import { processImageUrl } from './src/utils/imageUrlUtils';

// 测试不同类型的URL
const testUrls = [
  'https://images.unsplash.com/photo-1511245003488-178461620586?w=600&h=400&fit=crop',
  'http://images.unsplash.com/photo-1511245003488-178461620586?w=600&h=400&fit=crop',
  '/assets/image.jpg',
  'assets/image.jpg',
  'images/image.jpg',
  'image.jpg',
  ''
];

console.log('测试processImageUrl函数：');
console.log('=' .repeat(50));

testUrls.forEach(url => {
  const result = processImageUrl(url);
  console.log(`原始URL: ${url}`);
  console.log(`处理后: ${result}`);
  console.log('-' .repeat(50));
});
