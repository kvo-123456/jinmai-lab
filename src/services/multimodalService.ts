/**
 * 多模态服务模块 - 提供多模态创作支持
 */

// 多模态内容类型
export type ContentType = 'image' | 'audio' | 'video' | 'text' | '3d' | 'animation' | 'interactive';

// 多模态内容接口
export interface MultimodalContent {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  duration?: number; // 音频/视频时长（秒）
  size?: number; // 文件大小（字节）
  width?: number; // 图片/视频宽度
  height?: number; // 图片/视频高度
  format?: string; // 文件格式
  metadata?: Record<string, any>; // 额外元数据
  createdAt: string;
  updatedAt: string;
  prompt?: string; // 生成提示词
  isGenerated?: boolean; // 是否为AI生成
  generationParams?: Record<string, any>; // 生成参数
  tags?: string[]; // 标签
  likes?: number; // 点赞数
  views?: number; // 浏览量
  shares?: number; // 分享数
  comments?: number; // 评论数
  author?: string; // 作者
  isPublic?: boolean; // 是否公开
  license?: string; // 许可证
}

// 生成任务状态
export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'cancelled';

// 生成任务接口
export interface GenerationTask {
  id: string;
  type: ContentType;
  prompt: string;
  status: GenerationStatus;
  result?: MultimodalContent;
  error?: string;
  progress?: number; // 生成进度（0-100）
  createdAt: string;
  updatedAt: string;
  estimatedTime?: number; // 估计剩余时间（秒）
  generationParams?: Record<string, any>;
  author?: string;
}

// 常量定义
const CONTENT_KEY = 'jmzf_multimodal_content';
const TASKS_KEY = 'jmzf_generation_tasks';

/**
 * 获取所有多模态内容
 */
export function getAllContent(): MultimodalContent[] {
  const raw = localStorage.getItem(CONTENT_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * 根据ID获取多模态内容
 */
export function getContentById(id: string): MultimodalContent | undefined {
  const content = getAllContent();
  return content.find(item => item.id === id);
}

/**
 * 根据类型获取多模态内容
 */
export function getContentByType(type: ContentType): MultimodalContent[] {
  const content = getAllContent();
  return content.filter(item => item.type === type);
}

/**
 * 添加多模态内容
 */
export function addContent(content: Omit<MultimodalContent, 'id' | 'createdAt' | 'updatedAt'>): MultimodalContent {
  const newContent: MultimodalContent = {
    id: `content-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    likes: 0,
    views: 0,
    shares: 0,
    comments: 0,
    isPublic: true,
    ...content
  };
  
  const allContent = getAllContent();
  allContent.unshift(newContent);
  localStorage.setItem(CONTENT_KEY, JSON.stringify(allContent));
  
  return newContent;
}

/**
 * 更新多模态内容
 */
export function updateContent(id: string, updates: Partial<MultimodalContent>): MultimodalContent | undefined {
  const allContent = getAllContent();
  const index = allContent.findIndex(item => item.id === id);
  
  if (index !== -1) {
    allContent[index] = {
      ...allContent[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(CONTENT_KEY, JSON.stringify(allContent));
    return allContent[index];
  }
  
  return undefined;
}

/**
 * 删除多模态内容
 */
export function deleteContent(id: string): boolean {
  const allContent = getAllContent();
  const newContent = allContent.filter(item => item.id !== id);
  
  if (newContent.length !== allContent.length) {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(newContent));
    return true;
  }
  
  return false;
}

/**
 * 获取所有生成任务
 */
export function getAllGenerationTasks(): GenerationTask[] {
  const raw = localStorage.getItem(TASKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * 获取活跃的生成任务
 */
export function getActiveGenerationTasks(): GenerationTask[] {
  const tasks = getAllGenerationTasks();
  return tasks.filter(task => task.status === 'pending' || task.status === 'generating');
}

/**
 * 获取完成的生成任务
 */
export function getCompletedGenerationTasks(): GenerationTask[] {
  const tasks = getAllGenerationTasks();
  return tasks.filter(task => task.status === 'completed');
}

/**
 * 获取失败的生成任务
 */
export function getFailedGenerationTasks(): GenerationTask[] {
  const tasks = getAllGenerationTasks();
  return tasks.filter(task => task.status === 'failed');
}

/**
 * 创建生成任务
 */
export function createGenerationTask(task: Omit<GenerationTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>): GenerationTask {
  const newTask: GenerationTask = {
    id: `task-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...task
  };
  
  const tasks = getAllGenerationTasks();
  tasks.push(newTask);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  
  return newTask;
}

/**
 * 更新生成任务
 */
export function updateGenerationTask(id: string, updates: Partial<GenerationTask>): GenerationTask | undefined {
  const tasks = getAllGenerationTasks();
  const index = tasks.findIndex(task => task.id === id);
  
  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return tasks[index];
  }
  
  return undefined;
}

/**
 * 取消生成任务
 */
export function cancelGenerationTask(id: string): GenerationTask | undefined {
  return updateGenerationTask(id, { status: 'cancelled' });
}

/**
 * 删除生成任务
 */
export function deleteGenerationTask(id: string): boolean {
  const tasks = getAllGenerationTasks();
  const newTasks = tasks.filter(task => task.id !== id);
  
  if (newTasks.length !== tasks.length) {
    localStorage.setItem(TASKS_KEY, JSON.stringify(newTasks));
    return true;
  }
  
  return false;
}

/**
 * 生成多模态内容（模拟）
 */
export async function generateContent(type: ContentType, prompt: string, params?: Record<string, any>): Promise<GenerationTask> {
  // 创建生成任务
  const task = createGenerationTask({
    type,
    prompt,
    generationParams: params
  });
  
  // 更新任务状态为生成中
  updateGenerationTask(task.id, { status: 'generating', progress: 0 });
  
  try {
    // 模拟生成过程
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        clearInterval(interval);
        progress = 100;
      }
      updateGenerationTask(task.id, { progress });
    }, 1000);
    
    // 模拟生成延迟
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
    clearInterval(interval);
    
    // 生成模拟结果
    const result: MultimodalContent = {
      id: `content-${Date.now()}`,
      type,
      title: `${prompt.substring(0, 20)}...`,
      description: `AI生成的${type}内容`,
      url: `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=square&prompt=${encodeURIComponent(prompt)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      prompt,
      isGenerated: true,
      generationParams: params,
      format: type === 'image' ? 'png' : type === 'audio' ? 'mp3' : type === 'video' ? 'mp4' : 'txt',
      likes: 0,
      views: 0,
      shares: 0,
      comments: 0,
      isPublic: true
    };
    
    // 添加宽度和高度（如果是图片或视频）
    if (type === 'image' || type === 'video') {
      result.width = 1024;
      result.height = 1024;
    }
    
    // 添加时长（如果是音频或视频）
    if (type === 'audio' || type === 'video') {
      result.duration = Math.floor(Math.random() * 60) + 10; // 10-70秒
    }
    
    // 添加文件大小
    result.size = Math.floor(Math.random() * 1024 * 1024 * 10) + 1024 * 1024; // 1-11MB
    
    // 保存生成结果
    addContent(result);
    
    // 更新任务状态为完成
    const completedTask = updateGenerationTask(task.id, {
      status: 'completed',
      result,
      progress: 100
    });
    
    return completedTask as GenerationTask;
  } catch (error) {
    // 更新任务状态为失败
    const failedTask = updateGenerationTask(task.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : '生成失败'
    });
    
    return failedTask as GenerationTask;
  }
}

/**
 * 批量生成多模态内容
 */
export async function batchGenerateContent(items: Array<{ type: ContentType; prompt: string; params?: Record<string, any> }>): Promise<GenerationTask[]> {
  const tasks: GenerationTask[] = [];
  
  for (const item of items) {
    const task = await generateContent(item.type, item.prompt, item.params);
    tasks.push(task);
    // 等待1秒后开始下一个任务
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return tasks;
}

/**
 * 获取内容的缩略图URL
 */
export function getThumbnailUrl(content: MultimodalContent): string {
  // 如果有缩略图，直接返回
  if (content.thumbnail) {
    return content.thumbnail;
  }
  
  // 根据内容类型返回默认缩略图
  switch (content.type) {
    case 'image':
      return content.url;
    case 'audio':
      return 'https://via.placeholder.com/300x300?text=Audio+Content';
    case 'video':
      return content.url || 'https://via.placeholder.com/300x300?text=Video+Content';
    case 'text':
      return 'https://via.placeholder.com/300x300?text=Text+Content';
    case '3d':
      return 'https://via.placeholder.com/300x300?text=3D+Model';
    case 'animation':
      return 'https://via.placeholder.com/300x300?text=Animation';
    case 'interactive':
      return 'https://via.placeholder.com/300x300?text=Interactive+Content';
    default:
      return 'https://via.placeholder.com/300x300?text=Content';
  }
}

/**
 * 获取内容类型的中文名称
 */
export function getContentTypeLabel(type: ContentType): string {
  const labels: Record<ContentType, string> = {
    image: '图片',
    audio: '音频',
    video: '视频',
    text: '文本',
    '3d': '3D模型',
    animation: '动画',
    interactive: '互动内容'
  };
  
  return labels[type] || '内容';
}

/**
 * 获取文件大小的友好显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取时长的友好显示
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}分${remainingSeconds}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours}时${minutes}分${remainingSeconds}秒`;
  }
}

/**
 * 搜索多模态内容
 */
export function searchContent(query: string, types?: ContentType[]): MultimodalContent[] {
  const content = getAllContent();
  const lowerQuery = query.toLowerCase();
  
  return content.filter(item => {
    // 类型筛选
    if (types && types.length > 0 && !types.includes(item.type)) {
      return false;
    }
    
    // 关键词筛选
    return (
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.prompt?.toLowerCase().includes(lowerQuery) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      item.author?.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * 获取热门内容
 */
export function getPopularContent(limit: number = 10): MultimodalContent[] {
  const content = getAllContent();
  return content
    .sort((a, b) => (b.likes || 0) - (a.likes || 0) || (b.views || 0) - (a.views || 0))
    .slice(0, limit);
}

/**
 * 获取最新内容
 */
export function getLatestContent(limit: number = 10): MultimodalContent[] {
  const content = getAllContent();
  return content
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

/**
 * 增加内容的浏览量
 */
export function incrementViewCount(id: string): MultimodalContent | undefined {
  const content = getContentById(id);
  if (content) {
    return updateContent(id, { views: (content.views || 0) + 1 });
  }
  return undefined;
}

/**
 * 增加内容的点赞数
 */
export function incrementLikeCount(id: string): MultimodalContent | undefined {
  const content = getContentById(id);
  if (content) {
    return updateContent(id, { likes: (content.likes || 0) + 1 });
  }
  return undefined;
}

/**
 * 减少内容的点赞数
 */
export function decrementLikeCount(id: string): MultimodalContent | undefined {
  const content = getContentById(id);
  if (content && (content.likes || 0) > 0) {
    return updateContent(id, { likes: (content.likes || 0) - 1 });
  }
  return undefined;
}

/**
 * 增加内容的分享数
 */
export function incrementShareCount(id: string): MultimodalContent | undefined {
  const content = getContentById(id);
  if (content) {
    return updateContent(id, { shares: (content.shares || 0) + 1 });
  }
  return undefined;
}

/**
 * 增加内容的评论数
 */
export function incrementCommentCount(id: string): MultimodalContent | undefined {
  const content = getContentById(id);
  if (content) {
    return updateContent(id, { comments: (content.comments || 0) + 1 });
  }
  return undefined;
}

/**
 * 减少内容的评论数
 */
export function decrementCommentCount(id: string): MultimodalContent | undefined {
  const content = getContentById(id);
  if (content && (content.comments || 0) > 0) {
    return updateContent(id, { comments: (content.comments || 0) - 1 });
  }
  return undefined;
}

// 导出服务对象
export default {
  getAllContent,
  getContentById,
  getContentByType,
  addContent,
  updateContent,
  deleteContent,
  getAllGenerationTasks,
  getActiveGenerationTasks,
  getCompletedGenerationTasks,
  getFailedGenerationTasks,
  createGenerationTask,
  updateGenerationTask,
  cancelGenerationTask,
  deleteGenerationTask,
  generateContent,
  batchGenerateContent,
  getThumbnailUrl,
  getContentTypeLabel,
  formatFileSize,
  formatDuration,
  searchContent,
  getPopularContent,
  getLatestContent,
  incrementViewCount,
  incrementLikeCount,
  decrementLikeCount,
  incrementShareCount,
  incrementCommentCount,
  decrementCommentCount
};