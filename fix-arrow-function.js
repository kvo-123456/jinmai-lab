import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/components/ModelSelector.tsx';
const content = readFileSync(filePath, 'utf8');

// 修复箭头函数闭合括号后的多余逗号
const fixedContent = content.replace(/setQwenVariant\('qwen-plus'\);\n            \}\}\s*,/g, 'setQwenVariant(\'qwen-plus\');\n            \}\}\n            ');

writeFileSync(filePath, fixedContent);
console.log('Fixed the extra comma after arrow function');
