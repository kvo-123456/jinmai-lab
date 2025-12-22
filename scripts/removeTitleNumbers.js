import fs from 'fs';
import path from 'path';

// 读取 mock 数据文件
const worksPath = './src/mock/works.ts';
let content = fs.readFileSync(worksPath, 'utf8');

// 使用正则表达式替换所有标题中的数字
// 匹配格式："title": "类别名称数字"
const regex = /"title": "([\u4e00-\u9fa5]+)\d+"/g;

// 替换为："title": "类别名称"
const updatedContent = content.replace(regex, (match, category) => {
  return `"title": "${category}"`;
});

// 写入修改后的内容
fs.writeFileSync(worksPath, updatedContent, 'utf8');

console.log('已移除所有作品标题中的数字！');
