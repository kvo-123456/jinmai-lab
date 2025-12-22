// 检查ID为284的作品数据
import { mockWorks } from './src/mock/works.js';

const work284 = mockWorks.find(work => work.id === 284);
console.log('ID为284的作品数据:', work284);

// 检查ID为289的作品数据
const work289 = mockWorks.find(work => work.id === 289);
console.log('ID为289的作品数据:', work289);

// 检查作品总数
console.log('作品总数:', mockWorks.length);

// 检查前几个作品和后几个作品
console.log('前5个作品:', mockWorks.slice(0, 5).map(w => ({ id: w.id, title: w.title })));
console.log('后5个作品:', mockWorks.slice(-5).map(w => ({ id: w.id, title: w.title })));
