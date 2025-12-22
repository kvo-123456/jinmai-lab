// 检查作品数量的脚本
import fs from 'fs/promises';

async function main() {
  try {
    const data = await fs.readFile('src/mock/works.ts', 'utf8');
    
    // 使用正则表达式匹配id字段的数量
    const idMatches = data.match(/id:\s*\d+/g);
    if (idMatches) {
      console.log(`当前作品数量: ${idMatches.length}`);
    } else {
      console.log('未找到任何作品id！');
    }
    
    // 检查数组是否正确闭合
    const arrayEndIndex = data.indexOf('];');
    if (arrayEndIndex === -1) {
      console.log('数组未正确闭合！');
    } else {
      console.log('数组已正确闭合');
    }
  } catch (error) {
    console.error('发生错误:', error);
  }
}

main();
