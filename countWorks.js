import fs from 'fs/promises';

// 主函数
async function countWorks() {
  try {
    // 读取文件内容
    const data = await fs.readFile('src/mock/works.ts', 'utf8');
    
    // 计算作品数量 - 查找每个作品对象的开始标记 `{"id":`
    const workCount = (data.match(/\{\s*"id"\s*:/g) || []).length;
    
    console.log('作品数量:', workCount);
  } catch (error) {
    console.error('发生错误:', error);
  }
}

// 运行主函数
countWorks();
