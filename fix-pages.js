import fs from 'fs';
import path from 'path';

// 页面文件列表
const pages = [
  'BrandGuide.tsx',
  'Community.tsx',
  'CulturalKnowledge.tsx',
  'Dashboard.tsx',
  'Drafts.tsx',
  'Explore.tsx',
  'Neo.tsx',
  'Square.tsx',
  'Tools.tsx',
  'WorkDetail.tsx'
];

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const pagesDir = path.join(__dirname, 'src', 'pages');

pages.forEach(page => {
  const filePath = path.join(pagesDir, page);
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 移除 SidebarLayout 导入
    content = content.replace(/import SidebarLayout from '@\/components\/SidebarLayout';\n/g, '');
    
    // 移除 SidebarLayout 组件的使用
    content = content.replace(/\s*<SidebarLayout>/g, '');
    
    // 确保 return 语句中的 JSX 有一个父元素
    // 如果 return 后直接是多个元素，添加 Fragment
    const returnMatch = content.match(/return\s*\(([\s\S]*?)\);/);
    if (returnMatch) {
      let returnContent = returnMatch[1];
      // 检查是否已经有一个父元素
      const hasSingleParent = /^\s*<[A-Za-z][^>]*>/.test(returnContent) && 
                            /<\/[A-Za-z][^>]*>\s*$/.test(returnContent);
      
      if (!hasSingleParent) {
        // 添加 Fragment
        returnContent = `<>${returnContent}</>`;
        content = content.replace(returnMatch[0], `return (${returnContent});`);
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${page}`);
  } catch (error) {
    console.error(`Error fixing ${page}:`, error.message);
  }
});

console.log('All pages fixed!');