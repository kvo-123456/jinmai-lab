import fs from 'fs';
import path from 'path';

// 读取 mock/works.ts 文件
const worksPath = path.join(process.cwd(), 'src', 'mock', 'works.ts');
let worksContent = fs.readFileSync(worksPath, 'utf8');

// 修复无效的 creatorAvatar URL
const fixedContent = worksContent.replace(/creatorAvatar:\s*'(https:\/\/images\.unsplash\.com\/[^']+?)(&User%20avatar)'/g, 'creatorAvatar: \'$1\'');

// 保存修复后的文件
fs.writeFileSync(worksPath, fixedContent, 'utf8');

console.log('修复完成！已移除 creatorAvatar URL 中的无效查询参数 &User%20avatar');

