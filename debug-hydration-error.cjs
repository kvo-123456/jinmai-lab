// 调试脚本：用于检测代码库中可能导致Hydration错误的代码
// 运行方式：node debug-hydration-error.cjs

const fs = require('fs');
const path = require('path');

// 要检查的目录
const srcDir = path.join(__dirname, 'src');

// 要检查的模式
const patternsToCheck = [
  // 直接访问浏览器全局变量的模式
  /(window|document|localStorage|sessionStorage|navigator|screen|location|history|matchMedia)\./g,
  // useState初始化中访问浏览器全局变量的模式
  /useState.*=.*\(\(\) =>.*(window|document|localStorage|sessionStorage|navigator|screen|location|history|matchMedia)/g,
  // 没有环境检查的浏览器API调用
  /(window|document|localStorage|sessionStorage|navigator|screen|location|history|matchMedia)\s*\(/g
];

// 检查文件
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const errors = [];
    
    patternsToCheck.forEach((pattern, index) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // 获取匹配行
        const lines = content.substring(0, match.index).split('\n');
        const lineNumber = lines.length;
        
        errors.push({
          file: filePath,
          line: lineNumber,
          column: match.index - lines.join('\n').length,
          match: match[0],
          pattern: patternsToCheck[index].source
        });
      }
    });
    
    return errors;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// 遍历目录
function traverseDirectory(dir) {
  let allErrors = [];
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // 排除测试目录
      if (file !== '__tests__') {
        allErrors = allErrors.concat(traverseDirectory(filePath));
      }
    } else if ((file.endsWith('.ts') || file.endsWith('.tsx')) && !file.endsWith('.test.ts') && !file.endsWith('.test.tsx')) {
      const errors = checkFile(filePath);
      allErrors = allErrors.concat(errors);
    }
  });
  
  return allErrors;
}

// 过滤掉已经有环境检查的错误
function filterFalsePositives(errors) {
  return errors.filter(error => {
    const content = fs.readFileSync(error.file, 'utf8');
    const lines = content.split('\n');
    const lineContent = lines[error.line - 1];
    
    // 检查是否有环境检查
    if (lineContent.includes('typeof window !==') || lineContent.includes('typeof document !==')) {
      return false;
    }
    
    // 检查前几行是否有环境检查
    for (let i = Math.max(0, error.line - 5); i < error.line; i++) {
      const prevLine = lines[i];
      if (prevLine && (prevLine.includes('if (typeof window !==') || prevLine.includes('if (typeof document !=='))) {
        return false;
      }
    }
    
    return true;
  });
}

// 运行检查
console.log('开始检查代码库中的Hydration错误...');
const allErrors = traverseDirectory(srcDir);
const filteredErrors = filterFalsePositives(allErrors);

// 输出结果
console.log('\n=== 可能导致Hydration错误的代码 ===');
if (filteredErrors.length === 0) {
  console.log('没有发现明显的Hydration错误代码！');
} else {
  filteredErrors.forEach((error, index) => {
    console.log(`${index + 1}. ${error.file}:${error.line}`);
    console.log(`   匹配: ${error.match}`);
    console.log(`   模式: ${error.pattern}`);
    console.log('---');
  });
}

console.log('\n=== 检查完成 ===');