import { mockWorks } from './src/mock/works';

console.log('Total works:', mockWorks.length);
console.log('Expected works:', 120 + 180);
console.log('Works generated correctly:', mockWorks.length === 300);
console.log('First few works:', mockWorks.slice(0, 5).map(w => ({ id: w.id, title: w.title })));
console.log('Last few works:', mockWorks.slice(-5).map(w => ({ id: w.id, title: w.title })));
