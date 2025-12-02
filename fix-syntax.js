import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'components', 'ModelSelector.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all syntax errors
content = content.replace(/\}\},/g, '}}');
content = content.replace(/\}\s*\],/g, '}]');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed syntax errors in ModelSelector.tsx');