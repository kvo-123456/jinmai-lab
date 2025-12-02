/**
 * 大语言模型服务模块
 * 提供与各类大语言模型交互的接口
 */

// 模型类型定义
export interface LLMModel {
  id: string;
  name: string;
  description: string;
  strengths: string[];
  isDefault: boolean;
  apiKey?: string;
}

// 对话历史类型定义
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// 对话会话类型定义
export interface ConversationSession {
  id: string;
  name: string;
  modelId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  tags?: string[];
  metadata?: Record<string, any>;
}

// 性能监控数据类型定义
export interface ModelPerformance {
  modelId: string;
  requestCount: number;
  successCount: number;
  failureCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  lastRequestTime: number;
  lastSuccessTime: number;
  lastFailureTime: number;
}

// 性能监控记录类型定义
export interface PerformanceRecord {
  modelId: string;
  startTime: number;
  endTime: number;
  responseTime: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

// 模型配置类型定义
export interface ModelConfig {
  temperature: number;
  top_p: number;
  max_tokens: number;
  timeout: number;
  system_prompt: string;
  max_history: number;
  stream: boolean;
  kimi_model: string;
  kimi_base_url: string;
  retry: number;
  backoff_ms: number;
  deepseek_model?: string;
  deepseek_base_url?: string;
  // 新增通用高级参数
  presence_penalty: number;
  frequency_penalty: number;
  stop: string[];
  // 新增豆包模型配置
  doubao_model: string;
  doubao_base_url: string;
  // 新增文心一言模型配置
  wenxin_model: string;
  wenxin_base_url: string;
  // 新增通义千问模型配置
  qwen_model: string;
  qwen_base_url: string;
  // 新增对话相关配置
  enable_memory: boolean;
  memory_window: number;
  context_window: number;
  // 新增多模态配置
  enable_multimodal: boolean;
  image_resolution: string;
  // 新增安全配置
  enable_safety_check: boolean;
  safety_level: 'low' | 'medium' | 'high';
}

// 可用的模型列表
export const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '擅长传统纹样生成和文化元素融合',
    strengths: ['传统纹样生成', '文化元素融合', '设计创意'],
    isDefault: false
  },
  {
    id: 'doubao',
    name: '豆包',
    description: '擅长现代设计风格和创新表达',
    strengths: ['现代设计', '创新表达', '交互对话'],
    isDefault: false
  },
  {
    id: 'wenxinyiyan',
    name: '文心一言',
    description: '擅长多模态生成和传统文化理解',
    strengths: ['多模态生成', '传统文化理解', '创意激发'],
    isDefault: false
  },
  {
    id: 'qwen',
    name: '通义千问',
    description: '阿里云DashScope，中文对话与综合任务表现优秀',
    strengths: ['中文对话', '综合任务', '工具调用'],
    isDefault: false
  },
  {
    id: 'kimi',
    name: 'Kimi',
    description: 'Kimi（Moonshot AI），擅长中文长文创作与协作',
    strengths: ['中文对话', '长上下文写作', '检索增强'],
    isDefault: true
  }
];

// 默认模型配置
export const DEFAULT_CONFIG: ModelConfig = {
  temperature: 0.7,
  top_p: 0.9,
  max_tokens: 2000,
  timeout: 30000,
  system_prompt: '你是一个帮助创作者进行设计构思与文化融合的助手。',
  max_history: 10,
  stream: false,
  kimi_model: 'moonshot-v1-32k',
  kimi_base_url: 'https://api.moonshot.cn/v1',
  retry: 2,
  backoff_ms: 800,
  deepseek_model: 'deepseek-chat',
  deepseek_base_url: 'https://api.deepseek.com',
  // 新增通用高级参数默认值
  presence_penalty: 0,
  frequency_penalty: 0,
  stop: [],
  // 新增豆包模型配置默认值
  doubao_model: 'doubao-pro-32k',
  doubao_base_url: 'https://api.doubao.com/v1',
  // 新增文心一言模型配置默认值
  wenxin_model: 'ERNIE-Speed-8K',
  wenxin_base_url: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
  // 新增通义千问模型配置默认值
  qwen_model: 'qwen-plus',
  qwen_base_url: 'https://dashscope.aliyuncs.com/api/v1',
  // 新增对话相关配置默认值
  enable_memory: true,
  memory_window: 20,
  context_window: 8192,
  // 新增多模态配置默认值
  enable_multimodal: true,
  image_resolution: '1024x1024',
  // 新增安全配置默认值
  enable_safety_check: true,
  safety_level: 'medium'
};

/**
 * LLM服务类
 */
class LLMService {
  private currentModel: LLMModel = AVAILABLE_MODELS.find(m => m.isDefault) || AVAILABLE_MODELS[0];
  private modelConfig: ModelConfig = { ...DEFAULT_CONFIG };
  // 对话会话相关属性
  private conversationSessions: ConversationSession[] = [];
  private currentSessionId: string = '';
  // 性能监控相关属性
  private performanceData: Record<string, ModelPerformance> = {};
  private performanceRecords: PerformanceRecord[] = [];
  private maxPerformanceRecords = 1000; // 最多保存1000条性能记录

  /**
   * 设置当前使用的模型
   * @param modelId 模型ID
   * @param preserveHistory 是否保留对话历史
   */
  setCurrentModel(modelId: string, preserveHistory: boolean = false): void {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (model) {
      // 如果不保留历史，清除当前对话历史
      if (!preserveHistory) {
        this.clearHistory();
      }
      
      const previousModelId = this.currentModel.id;
      this.currentModel = model;
      
      try {
        localStorage.setItem('LLM_CURRENT_MODEL', model.id);
      } catch (error) {
        console.error('Failed to save current model to localStorage:', error);
      }
      
      // 触发模型切换事件
      this.emitModelChangeEvent(previousModelId, model.id);
    }
  }
  
  /**
   * 触发模型切换事件
   */
  private emitModelChangeEvent(previousModelId: string, newModelId: string): void {
    // 创建自定义事件
    const event = new CustomEvent('llm-model-changed', {
      detail: {
        previousModelId,
        newModelId,
        timestamp: Date.now()
      }
    });
    
    // 派发事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  /**
   * 获取当前使用的模型
   */
  getCurrentModel(): LLMModel {
    return this.currentModel;
  }

  /**
   * 更新模型配置
   */
  updateConfig(config: Partial<ModelConfig>): void {
    this.modelConfig = { ...this.modelConfig, ...config };
    try { localStorage.setItem('LLM_CONFIG', JSON.stringify(this.modelConfig)); } catch {}
  }

  /**
   * 获取当前模型配置
   */
  getConfig(): ModelConfig {
    return { ...this.modelConfig };
  }

  /**
   * 清除当前会话的对话历史
   */
  clearHistory(): void {
    const session = this.getCurrentSession();
    if (session) {
      session.messages = [];
      session.updatedAt = Date.now();
      this.saveSessions();
    }
  }
  
  /**
   * 初始化模型性能数据
   */
  private initializePerformanceData(modelId: string): void {
    if (!this.performanceData[modelId]) {
      this.performanceData[modelId] = {
        modelId,
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        lastRequestTime: 0,
        lastSuccessTime: 0,
        lastFailureTime: 0
      };
    }
  }
  
  /**
   * 更新模型性能数据
   */
  private updatePerformanceData(record: PerformanceRecord): void {
    const { modelId, responseTime, success, error } = record;
    
    // 初始化性能数据（如果不存在）
    this.initializePerformanceData(modelId);
    
    const performance = this.performanceData[modelId];
    
    // 更新请求计数
    performance.requestCount++;
    performance.lastRequestTime = Date.now();
    
    if (success) {
      // 更新成功计数
      performance.successCount++;
      performance.lastSuccessTime = Date.now();
    } else {
      // 更新失败计数
      performance.failureCount++;
      performance.lastFailureTime = Date.now();
    }
    
    // 更新响应时间数据
    performance.totalResponseTime += responseTime;
    performance.averageResponseTime = performance.totalResponseTime / performance.requestCount;
    performance.minResponseTime = Math.min(performance.minResponseTime, responseTime);
    performance.maxResponseTime = Math.max(performance.maxResponseTime, responseTime);
    
    // 记录性能记录
    this.performanceRecords.push(record);
    
    // 限制性能记录数量
    if (this.performanceRecords.length > this.maxPerformanceRecords) {
      this.performanceRecords.shift();
    }
  }
  
  /**
   * 记录性能数据
   */
  private recordPerformance(modelId: string, startTime: number, success: boolean, error?: string): void {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const record: PerformanceRecord = {
      modelId,
      startTime,
      endTime,
      responseTime,
      success,
      error,
      timestamp: endTime
    };
    
    this.updatePerformanceData(record);
  }
  
  /**
   * 获取模型性能数据
   */
  getPerformanceData(modelId?: string): ModelPerformance | Record<string, ModelPerformance> {
    if (modelId) {
      this.initializePerformanceData(modelId);
      return { ...this.performanceData[modelId] };
    }
    
    // 确保所有可用模型都有性能数据
    AVAILABLE_MODELS.forEach(model => {
      this.initializePerformanceData(model.id);
    });
    
    return { ...this.performanceData };
  }
  
  /**
   * 获取性能记录
   */
  getPerformanceRecords(modelId?: string, limit: number = 100): PerformanceRecord[] {
    let records = [...this.performanceRecords];
    
    if (modelId) {
      records = records.filter(record => record.modelId === modelId);
    }
    
    // 按时间倒序排列，返回最新的记录
    return records.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
  
  /**
   * 重置模型性能数据
   */
  resetPerformanceData(modelId?: string): void {
    if (modelId) {
      delete this.performanceData[modelId];
      this.performanceRecords = this.performanceRecords.filter(record => record.modelId !== modelId);
    } else {
      this.performanceData = {};
      this.performanceRecords = [];
    }
  }

  /**
   * 初始化会话系统
   */
  private initializeSessions(): void {
    try {
      const savedSessions = localStorage.getItem('LLM_CONVERSATION_SESSIONS');
      if (savedSessions) {
        this.conversationSessions = JSON.parse(savedSessions);
      }
      
      const savedCurrentSessionId = localStorage.getItem('LLM_CURRENT_SESSION_ID');
      if (savedCurrentSessionId) {
        this.currentSessionId = savedCurrentSessionId;
      }
      
      // 如果没有会话或当前会话不存在，创建一个新会话
      if (this.conversationSessions.length === 0 || !this.getCurrentSession()) {
        this.createSession('新对话');
      }
    } catch (error) {
      console.error('Failed to initialize sessions:', error);
      // 初始化失败，创建一个默认会话
      this.createSession('新对话');
    }
  }
  
  /**
   * 保存会话到localStorage
   */
  private saveSessions(): void {
    try {
      localStorage.setItem('LLM_CONVERSATION_SESSIONS', JSON.stringify(this.conversationSessions));
      localStorage.setItem('LLM_CURRENT_SESSION_ID', this.currentSessionId);
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }
  
  /**
   * 创建新会话
   */
  createSession(name: string, modelId?: string): ConversationSession {
    const session: ConversationSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      modelId: modelId || this.currentModel.id,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true
    };
    
    // 停用当前会话
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      currentSession.isActive = false;
    }
    
    // 添加新会话
    this.conversationSessions.push(session);
    this.currentSessionId = session.id;
    
    // 保存会话
    this.saveSessions();
    
    return session;
  }
  
  /**
   * 切换会话
   */
  switchSession(sessionId: string): void {
    const session = this.conversationSessions.find(s => s.id === sessionId);
    if (session) {
      // 停用当前会话
      const currentSession = this.getCurrentSession();
      if (currentSession) {
        currentSession.isActive = false;
      }
      
      // 激活新会话
      session.isActive = true;
      this.currentSessionId = session.id;
      
      // 切换到会话使用的模型
      this.setCurrentModel(session.modelId, true);
      
      // 保存会话
      this.saveSessions();
    }
  }
  
  /**
   * 删除会话
   */
  deleteSession(sessionId: string): void {
    const index = this.conversationSessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      // 如果删除的是当前会话，切换到另一个会话
      if (sessionId === this.currentSessionId) {
        this.conversationSessions.splice(index, 1);
        
        if (this.conversationSessions.length > 0) {
          // 切换到第一个会话
          const newSession = this.conversationSessions[0];
          newSession.isActive = true;
          this.currentSessionId = newSession.id;
          this.setCurrentModel(newSession.modelId, true);
        } else {
          // 如果没有会话了，创建一个新会话
          this.createSession('新对话');
        }
      } else {
        // 删除非当前会话
        this.conversationSessions.splice(index, 1);
      }
      
      // 保存会话
      this.saveSessions();
    }
  }
  
  /**
   * 重命名会话
   */
  renameSession(sessionId: string, name: string): void {
    const session = this.conversationSessions.find(s => s.id === sessionId);
    if (session) {
      session.name = name;
      session.updatedAt = Date.now();
      this.saveSessions();
    }
  }
  
  /**
   * 获取当前会话
   */
  private getCurrentSession(): ConversationSession | undefined {
    return this.conversationSessions.find(s => s.id === this.currentSessionId);
  }
  
  /**
   * 获取所有会话
   */
  getSessions(): ConversationSession[] {
    return [...this.conversationSessions].sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * 获取指定会话
   */
  getSession(sessionId: string): ConversationSession | undefined {
    return this.conversationSessions.find(s => s.id === sessionId);
  }
  
  /**
   * 获取当前会话的对话历史
   */
  getHistory(): Message[] {
    const session = this.getCurrentSession();
    return session ? [...session.messages] : [];
  }
  
  /**
   * 获取指定会话的对话历史
   */
  getSessionHistory(sessionId: string): Message[] {
    const session = this.getSession(sessionId);
    return session ? [...session.messages] : [];
  }
  
  /**
   * 导入对话历史到当前会话
   */
  importHistory(messages: Message[]): void {
    const session = this.getCurrentSession();
    if (session) {
      const limit = this.modelConfig.max_history || 10;
      const trimmed = messages.slice(-limit);
      session.messages = [...trimmed];
      session.updatedAt = Date.now();
      this.saveSessions();
      
      try {
        localStorage.setItem('LLM_HISTORY_IMPORTED_AT', String(Date.now()));
      } catch (error) {
        console.error('Failed to save import timestamp:', error);
      }
    }
  }
  
  /**
   * 导出当前会话
   */
  exportSession(): ConversationSession {
    const session = this.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }
    return JSON.parse(JSON.stringify(session));
  }
  
  /**
   * 导入会话
   */
  importSession(sessionData: ConversationSession): ConversationSession {
    // 创建新会话ID，避免冲突
    const newSession: ConversationSession = {
      ...sessionData,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.conversationSessions.push(newSession);
    this.saveSessions();
    
    return newSession;
  }

  /**
   * 向模型发送请求
   * 支持文本和图像输入（多模态）
   */
  async generateResponse(
    prompt: string,
    options?: {
      onDelta?: (chunk: string) => void;
      signal?: AbortSignal;
      images?: string[]; // 支持多图像输入
    }
  ): Promise<string> {
    // 添加用户消息到历史
    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    };
    this.addToHistory(userMessage);

    // 记录请求开始时间
    const startTime = Date.now();
    const modelId = this.currentModel.id;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const error = new Error('模型响应超时');
        this.recordPerformance(modelId, startTime, false, error.message);
        reject(error);
      }, this.modelConfig.timeout);

      const handleSuccess = (response: string) => {
        clearTimeout(timeoutId);
        const aiMessage: Message = { role: 'assistant', content: response, timestamp: Date.now() };
        this.addToHistory(aiMessage);
        this.recordPerformance(modelId, startTime, true);
        resolve(response);
      };

      const handleError = (error: Error | string) => {
        clearTimeout(timeoutId);
        const errorMessage = typeof error === 'string' ? error : error.message;
        
        // 检测百度千帆配额用完错误
        if (errorMessage.includes('QUOTA_EXCEEDED') && modelId === 'wenxinyiyan') {
          // 标记百度千帆配额用完，后续不再使用
          localStorage.setItem('QIANFAN_QUOTA_EXCEEDED', 'true');
          // 自动切换到其他可用模型
          this.ensureAvailableModel().catch(err => {
            console.error('Failed to switch model after quota exceeded:', err);
          });
        }
        
        const fallback = this.getFallbackResponse(modelId, errorMessage);
        const aiMessage: Message = { role: 'assistant', content: fallback, timestamp: Date.now() };
        this.addToHistory(aiMessage);
        this.recordPerformance(modelId, startTime, false, errorMessage);
        resolve(fallback);
      };

      // 构建带有多模态支持的请求
      const requestOptions = {
        ...options,
        images: options?.images || [],
        multimodalConfig: {
          enable_multimodal: this.modelConfig.enable_multimodal,
          image_resolution: this.modelConfig.image_resolution
        }
      };

      if (this.currentModel.id === 'kimi') {
        this.callKimi(prompt, requestOptions)
          .then(handleSuccess)
          .catch(handleError);
        return;
      }
      if (this.currentModel.id === 'deepseek') {
        this.callDeepseek(prompt, requestOptions)
          .then(handleSuccess)
          .catch(handleError);
        return;
      }
      if (this.currentModel.id === 'wenxinyiyan') {
        this.callWenxin(prompt, requestOptions)
          .then(handleSuccess)
          .catch(handleError);
        return;
      }
      if (this.currentModel.id === 'doubao') {
        this.callDoubao(prompt, requestOptions)
          .then(handleSuccess)
          .catch(handleError);
        return;
      }
      if (this.currentModel.id === 'qwen') {
        this.callQwen(prompt, requestOptions)
          .then(handleSuccess)
          .catch(handleError);
        return;
      }

      setTimeout(() => {
        clearTimeout(timeoutId);
        
        let response = '';
        
        // 根据当前模型生成不同风格的响应
        if (this.currentModel.id === 'deepseek') {
          response = this.generateDeepSeekResponse(prompt);
        } else if (this.currentModel.id === 'doubao') {
          response = this.generateDoubaoResponse(prompt);
        } else if (this.currentModel.id === 'wenxinyiyan') {
          response = this.generateWenxinResponse(prompt);
        }
        
        // 添加AI响应到历史
        const aiMessage: Message = {
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        };
        this.addToHistory(aiMessage);
        
        this.recordPerformance(modelId, startTime, true);
        resolve(response);
      }, Math.random() * 1500 + 500);
    });
  }
  
  /**
   * 获取模型调用失败时的回退响应
   */
  private getFallbackResponse(modelId: string, errorMessage: string): string {
    switch (modelId) {
      case 'kimi':
        return 'Kimi接口不可用或未配置密钥，返回模拟响应。';
      case 'deepseek':
        return 'DeepSeek接口不可用或未配置密钥，返回模拟响应。';
      case 'wenxinyiyan':
        return '文心一言接口鉴权失败或未配置密钥，请在 .env.local 设置 QIANFAN_ACCESS_TOKEN（或 QIANFAN_AK/QIANFAN_SK）后重试。';
      case 'doubao':
        return '豆包接口不可用或未配置密钥，请检查API配置后重试。';
      case 'qwen':
        return '通义千问接口不可用或未配置密钥，请在 .env.local 设置 DASHSCOPE_API_KEY 后重试。';
      default:
        return `模型调用失败: ${errorMessage}`;
    }
  }

  /**
   * 确保当前模型可用：按优先级选择已配置的供应商
   * @param preferred 首选模型列表
   * @returns 最终选择的模型ID
   */
  async ensureAvailableModel(preferred: string[] = []): Promise<string> {
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || ''
    let configured: Record<string, boolean> = {}
    let healthCheckSuccess = false
    
    if (apiBase) {
      try {
        const res = await fetch(`${apiBase}/api/health/llms`, { 
          method: 'GET'
        })
        if (res.ok) {
          const data = await res.json()
          const st = data?.status || {}
          configured = {
            doubao: !!st?.doubao?.configured,
            kimi: !!st?.kimi?.configured,
            deepseek: !!st?.deepseek?.configured,
            qwen: !!st?.qwen?.configured,
            wenxinyiyan: !!st?.wenxin?.configured,
          }
          healthCheckSuccess = true
        }
      } catch (error) {
        console.warn('Failed to fetch LLM health status:', error)
      }
    }
    
    // 如果API健康检查失败，使用本地配置判断
    if (!healthCheckSuccess) {
      // 无代理时，基于本地密钥判断
      configured = {
        kimi: !!(localStorage.getItem('KIMI_API_KEY') || ''),
        deepseek: !!(localStorage.getItem('DEEPSEEK_API_KEY') || ''),
        doubao: !!(localStorage.getItem('DOUBAO_API_KEY') || ''),
        qwen: !!(localStorage.getItem('QWEN_API_KEY') || ''),
        wenxinyiyan: !!(localStorage.getItem('WENXIN_API_KEY') || ''),
      }
    }
    
    // 检查百度千帆是否被标记为配额用完
    const isQianfanQuotaExceeded = localStorage.getItem('QIANFAN_QUOTA_EXCEEDED') === 'true';
    if (isQianfanQuotaExceeded) {
      // 如果配额用完，标记为不可用
      configured.wenxinyiyan = false;
    }
    
    // 构建模型优先级列表
    const modelPriorityOrder = [
      ...preferred.filter(id => AVAILABLE_MODELS.some(m => m.id === id)), // 过滤掉无效的首选模型
      'kimi', 'deepseek', 'doubao', 'qwen', 'wenxinyiyan' // 默认优先级
    ]
    
    // 去重优先级列表
    const uniquePriorityOrder = [...new Set(modelPriorityOrder)]
    
    // 选择第一个可用的模型
    const selectedModelId = uniquePriorityOrder.find(id => configured[id]) 
      || (this.currentModel?.id || 'kimi') // 如果没有可用模型，使用当前模型或默认模型
    
    // 如果选择的模型与当前模型不同，切换模型
    if (selectedModelId !== this.currentModel.id) {
      this.setCurrentModel(selectedModelId)
    }
    
    return selectedModelId
  }

  /**
   * 通用API调用方法，实现指数退避重试策略
   */
  private async callApiWithRetry(
    modelId: string,
    requestFn: () => Promise<string>,
    maxRetries: number,
    initialBackoffMs: number
  ): Promise<string> {
    let lastErr: any;
    let backoffMs = initialBackoffMs;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (e) {
        lastErr = e;
        
        // 如果是最后一次尝试，直接抛出错误
        if (attempt >= maxRetries) {
          break;
        }
        
        // 分析错误类型，决定是否重试
        const errorMessage = typeof e === 'string' ? e : (e as Error).message;
        
        // 这些错误类型适合重试
        const retryableErrors = [
          'timeout',
          'network',
          '500',
          '502',
          '503',
          '504',
          'service unavailable',
          'connection reset',
          'request failed'
        ];
        
        const shouldRetry = retryableErrors.some(err => 
          errorMessage.toLowerCase().includes(err)
        );
        
        if (!shouldRetry) {
          break;
        }
        
        // 指数退避，每次重试间隔增加
        await new Promise(r => setTimeout(r, backoffMs));
        // 指数退避因子为2，加上随机抖动
        backoffMs = Math.min(backoffMs * 2 + Math.random() * 100, 5000); // 最大等待5秒
      }
    }
    
    throw lastErr || new Error(`${modelId} API error`);
  }
  
  private async callKimi(prompt: string, options?: { onDelta?: (chunk: string) => void; signal?: AbortSignal; images?: string[]; multimodalConfig?: any }): Promise<string> {
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_KIMI_API_KEY) || '';
    const storedKey = localStorage.getItem('KIMI_API_KEY') || '';
    const key = storedKey || envKey;
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
    const useProxy = !!apiBase;
    if (!useProxy && !key) {
      throw new Error('Missing Kimi API key');
    }
    const base = this.modelConfig.kimi_base_url || 'https://api.moonshot.cn/v1';
    const url = useProxy ? `${apiBase}/api/kimi/chat/completions` : (base + '/chat/completions');
    const effectiveStream = useProxy ? false : (this.modelConfig.stream === true);
    
    const requestFn = async () => {
      // 构建消息内容，支持多模态输入
      const messages: any[] = [
        { role: 'system', content: this.modelConfig.system_prompt }
      ];
      
      // 处理图像输入
      if (options?.images && options?.images.length > 0 && this.modelConfig.enable_multimodal) {
        // 多模态消息格式
        const messageContent: any[] = [
          { type: 'text', text: prompt }
        ];
        
        // 添加图像内容
        for (const imageUrl of options.images) {
          messageContent.push({
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: this.modelConfig.image_resolution === '2048x2048' ? 'high' : 'auto'
            }
          });
        }
        
        messages.push({ role: 'user', content: messageContent });
      } else {
        // 纯文本消息格式
        messages.push({ role: 'user', content: prompt });
      }
      
      const payload: any = {
        model: this.modelConfig.kimi_model || 'moonshot-v1-32k',
        messages,
        temperature: this.modelConfig.temperature,
        top_p: this.modelConfig.top_p,
        max_tokens: this.modelConfig.max_tokens,
        presence_penalty: this.modelConfig.presence_penalty,
        frequency_penalty: this.modelConfig.frequency_penalty,
        stop: this.modelConfig.stop
      };
      if (effectiveStream) payload.stream = true;
      
      const headers: any = { 'Content-Type': 'application/json' };
      if (!useProxy) headers['Authorization'] = `Bearer ${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: options?.signal
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Kimi API error: ${res.status} ${errorText}`);
      }
      
      if (effectiveStream && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const json = t.slice(5).trim();
            if (json === '[DONE]') continue;
            try {
              const obj = JSON.parse(json);
              const delta = obj?.choices?.[0]?.delta?.content || '';
              if (delta) {
                full += delta;
                if (options?.onDelta) options.onDelta(full);
              }
            } catch (e) {
              console.error('Failed to parse Kimi stream chunk:', e);
            }
          }
        }
        return full || 'Kimi未返回内容';
      } else {
        const data = await res.json();
        const raw = useProxy ? (data?.data || {}) : data;
        const content = raw?.choices?.[0]?.message?.content || '';
        return content || 'Kimi未返回内容';
      }
    };
    
    return this.callApiWithRetry('kimi', requestFn, this.modelConfig.retry, this.modelConfig.backoff_ms);
  }

  private async callDeepseek(prompt: string, options?: { onDelta?: (chunk: string) => void; signal?: AbortSignal; images?: string[]; multimodalConfig?: any }): Promise<string> {
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_DEEPSEEK_API_KEY) || '';
    const storedKey = localStorage.getItem('DEEPSEEK_API_KEY') || '';
    const key = storedKey || envKey;
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
    const useProxy = !!apiBase;
    if (!useProxy && !key) throw new Error('Missing DeepSeek API key');
    const base = this.modelConfig.deepseek_base_url || 'https://api.deepseek.com';
    const url = useProxy ? `${apiBase}/api/deepseek/chat/completions` : ((base.endsWith('/v1') ? base : base + '/v1') + '/chat/completions');
    const effectiveStream = useProxy ? false : (this.modelConfig.stream === true);
    
    const requestFn = async () => {
      // 构建消息内容，支持多模态输入
      const messages: any[] = [
        { role: 'system', content: this.modelConfig.system_prompt }
      ];
      
      // 处理图像输入
      if (options?.images && options?.images.length > 0 && this.modelConfig.enable_multimodal) {
        // 多模态消息格式
        const messageContent: any[] = [
          { type: 'text', text: prompt }
        ];
        
        // 添加图像内容
        for (const imageUrl of options.images) {
          messageContent.push({
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: this.modelConfig.image_resolution === '2048x2048' ? 'high' : 'auto'
            }
          });
        }
        
        messages.push({ role: 'user', content: messageContent });
      } else {
        // 纯文本消息格式
        messages.push({ role: 'user', content: prompt });
      }
      
      const payload: any = {
        model: this.modelConfig.deepseek_model || 'deepseek-chat',
        messages,
        temperature: this.modelConfig.temperature,
        top_p: this.modelConfig.top_p,
        max_tokens: this.modelConfig.max_tokens,
        presence_penalty: this.modelConfig.presence_penalty,
        frequency_penalty: this.modelConfig.frequency_penalty,
        stop: this.modelConfig.stop
      };
      if (effectiveStream) payload.stream = true;
      
      const headers: any = { 'Content-Type': 'application/json' };
      if (!useProxy) headers['Authorization'] = `Bearer ${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: options?.signal
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`DeepSeek API error: ${res.status} ${errorText}`);
      }
      
      if (effectiveStream && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const json = t.slice(5).trim();
            if (json === '[DONE]') continue;
            try {
              const obj = JSON.parse(json);
              const delta = obj?.choices?.[0]?.delta?.content || '';
              if (delta) {
                full += delta;
                if (options?.onDelta) options.onDelta(full);
              }
              const rdelta = obj?.choices?.[0]?.delta?.reasoning_content || '';
              if (rdelta) {
                // 可扩展：保存推理内容
              }
            } catch (e) {
              console.error('Failed to parse DeepSeek stream chunk:', e);
            }
          }
        }
        return full || 'DeepSeek未返回内容';
      } else {
        const data = await res.json();
        const raw = useProxy ? (data?.data || {}) : data;
        const content = raw?.choices?.[0]?.message?.content || '';
        return content || 'DeepSeek未返回内容';
      }
    };
    
    return this.callApiWithRetry('deepseek', requestFn, this.modelConfig.retry, this.modelConfig.backoff_ms);
  }

  private async callWenxin(prompt: string, options?: { onDelta?: (chunk: string) => void; signal?: AbortSignal; images?: string[]; multimodalConfig?: any }): Promise<string> {
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
    if (!apiBase) throw new Error('Missing API base for Wenxin');
    const url = `${apiBase}/api/qianfan/chat/completions`;
    
    const requestFn = async () => {
      // 构建消息内容，支持多模态输入
      const messages: any[] = [
        { role: 'system', content: this.modelConfig.system_prompt }
      ];
      
      // 处理图像输入
      if (options?.images && options?.images.length > 0 && this.modelConfig.enable_multimodal) {
        // 多模态消息格式
        const messageContent: any[] = [
          { type: 'text', text: prompt }
        ];
        
        // 添加图像内容
        for (const imageUrl of options.images) {
          messageContent.push({
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: this.modelConfig.image_resolution === '2048x2048' ? 'high' : 'auto'
            }
          });
        }
        
        messages.push({ role: 'user', content: messageContent });
      } else {
        // 纯文本消息格式
        messages.push({ role: 'user', content: prompt });
      }
      
      const payload: any = {
        model: this.modelConfig.wenxin_model || 'ERNIE-Speed-8K',
        messages,
        temperature: this.modelConfig.temperature,
        top_p: this.modelConfig.top_p,
        max_tokens: this.modelConfig.max_tokens,
        presence_penalty: this.modelConfig.presence_penalty,
        frequency_penalty: this.modelConfig.frequency_penalty,
        stop: this.modelConfig.stop
      };
      
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload), 
        signal: options?.signal 
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorText = JSON.stringify(data) || await res.text();
        
        // 检测配额用完错误
        if (res.status === 429 || data.error === 'QUOTA_EXCEEDED') {
          throw new Error('QUOTA_EXCEEDED: 百度千帆API免费额度已用完');
        }
        
        throw new Error(`Wenxin API error: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      const raw = data?.data || {};
      const content = raw?.result || raw?.choices?.[0]?.message?.content || '';
      return content || '文心一言未返回内容';
    };
    
    return this.callApiWithRetry('wenxin', requestFn, this.modelConfig.retry, this.modelConfig.backoff_ms);
  }

  private async callQwen(prompt: string, options?: { onDelta?: (chunk: string) => void; signal?: AbortSignal; images?: string[]; multimodalConfig?: any }): Promise<string> {
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
    if (!apiBase) throw new Error('Missing API base for Qwen');
    const url = `${apiBase}/api/dashscope/chat/completions`;
    
    const requestFn = async () => {
      // 构建消息内容，支持多模态输入
      const messages: any[] = [
        { role: 'system', content: this.modelConfig.system_prompt }
      ];
      
      // 处理图像输入
      if (options?.images && options?.images.length > 0 && this.modelConfig.enable_multimodal) {
        // 多模态消息格式
        const messageContent: any[] = [
          { type: 'text', text: prompt }
        ];
        
        // 添加图像内容
        for (const imageUrl of options.images) {
          messageContent.push({
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: this.modelConfig.image_resolution === '2048x2048' ? 'high' : 'auto'
            }
          });
        }
        
        messages.push({ role: 'user', content: messageContent });
      } else {
        // 纯文本消息格式
        messages.push({ role: 'user', content: prompt });
      }
      
      const payload: any = {
        model: this.modelConfig.qwen_model || 'qwen-plus',
        messages,
        temperature: this.modelConfig.temperature,
        top_p: this.modelConfig.top_p,
        max_tokens: this.modelConfig.max_tokens,
        presence_penalty: this.modelConfig.presence_penalty,
        frequency_penalty: this.modelConfig.frequency_penalty,
        stop: this.modelConfig.stop
      };
      
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload), 
        signal: options?.signal 
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Qwen API error: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      const raw = data?.data || {};
      const content = raw?.choices?.[0]?.message?.content || raw?.output_text || '';
      return content || '通义千问未返回内容';
    };
    
    return this.callApiWithRetry('qwen', requestFn, this.modelConfig.retry, this.modelConfig.backoff_ms);
  }

  private async callDoubao(prompt: string, options?: { onDelta?: (chunk: string) => void; signal?: AbortSignal; images?: string[]; multimodalConfig?: any }): Promise<string> {
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
    if (!apiBase) throw new Error('Missing API base for Doubao');
    const url = `${apiBase}/api/doubao/chat/completions`;
    
    const requestFn = async () => {
      // 构建消息内容，支持多模态输入
      const messages: any[] = [
        { role: 'system', content: this.modelConfig.system_prompt }
      ];
      
      // 处理图像输入
      if (options?.images && options?.images.length > 0 && this.modelConfig.enable_multimodal) {
        // 多模态消息格式
        const messageContent: any[] = [
          { type: 'text', text: prompt }
        ];
        
        // 添加图像内容
        for (const imageUrl of options.images) {
          messageContent.push({
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: this.modelConfig.image_resolution === '2048x2048' ? 'high' : 'auto'
            }
          });
        }
        
        messages.push({ role: 'user', content: messageContent });
      } else {
        // 纯文本消息格式
        messages.push({ role: 'user', content: prompt });
      }
      
      const payload: any = {
        model: this.modelConfig.doubao_model || 'doubao-pro-32k',
        messages,
        temperature: this.modelConfig.temperature,
        top_p: this.modelConfig.top_p,
        max_tokens: this.modelConfig.max_tokens,
        presence_penalty: this.modelConfig.presence_penalty,
        frequency_penalty: this.modelConfig.frequency_penalty,
        stop: this.modelConfig.stop
      };
      
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload), 
        signal: options?.signal 
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Doubao API error: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      const raw = data?.data || {};
      const content = raw?.choices?.[0]?.message?.content || '';
      return content || '豆包未返回内容';
    };
    
    return this.callApiWithRetry('doubao', requestFn, this.modelConfig.retry, this.modelConfig.backoff_ms);
  }

  /**
   * 添加消息到当前会话历史，并保持历史长度限制
   */
  private addToHistory(message: Message): void {
    const session = this.getCurrentSession();
    if (session) {
      session.messages.push(message);
      const limit = this.modelConfig.max_history || 10;
      if (session.messages.length > limit) {
        session.messages.shift();
      }
      session.updatedAt = Date.now();
      this.saveSessions();
    }
  }

  /**
   * 生成DeepSeek模型的模拟响应
   */
  private generateDeepSeekResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('青花瓷') || lowerPrompt.includes('纹样')) {
      return '已为您生成融合青花瓷纹样的设计方案。这种纹样源自明代永宣时期，以其典雅的蓝色调和流畅的线条著称。设计中结合了传统青花瓷的经典元素和现代简约风格，既保留了文化底蕴，又符合当代审美。您可以继续调整色彩或添加其他文化元素。';
    } else if (lowerPrompt.includes('中秋') || lowerPrompt.includes('节日')) {
      return '为您设计了一套中秋主题的国潮风格方案。方案融合了传统中秋元素（如月饼、玉兔、桂花）与现代设计语言，色彩以喜庆的红色和金色为主，传达团圆美满的节日氛围。建议添加传统纹样如云纹或回纹作为装饰元素，增强文化感。';
    } else if (lowerPrompt.includes('调整') || lowerPrompt.includes('修改')) {
      return '已根据您的要求调整设计。颜色已从红色调改为靛蓝色，这种颜色在传统中国文化中象征着宁静和智慧，与您的设计主题非常契合。同时优化了元素布局，使其更加平衡和谐。您可以继续提出调整建议。';
    } else {
      return '根据您的描述，我为您生成了一个融合传统与现代的设计方案。方案注重文化元素的合理运用，同时保持了现代设计的简洁美感。您可以提出具体的修改意见，或添加更多细节要求，我会进一步优化方案。';
    }
  }

  /**
   * 生成豆包模型的模拟响应
   */
  private generateDoubaoResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('创新') || lowerPrompt.includes('现代')) {
      return '为您打造了一款充满现代感的创新设计。设计采用了大胆的几何形状和鲜明的色彩对比，同时巧妙融入了传统元素，实现了传统与现代的完美平衡。这种风格特别适合吸引年轻消费群体，展现品牌的活力与创新精神。';
    } else if (lowerPrompt.includes('年轻化') || lowerPrompt.includes('潮流')) {
      return '根据您的需求，我设计了一套年轻化的国潮方案。方案结合了当下流行的设计趋势，使用了明亮活泼的色彩和有趣的图形元素，同时保留了足够的文化识别度。这种设计能够有效吸引Z世代消费者的关注，提升品牌在年轻群体中的影响力。';
    } else if (lowerPrompt.includes('优化') || lowerPrompt.includes('改进')) {
      return '已对您的设计进行了优化。主要改进了视觉层次和信息传达效率，使设计更加清晰易懂。同时调整了色彩搭配，使其更加和谐统一。您可以继续提出具体的优化方向，我会进一步完善方案。';
    } else {
      return '基于您的需求，我为您生成了一个富有创意的设计方案。这个方案注重视觉冲击力和情感表达，能够有效传达品牌信息和文化内涵。您可以告诉我您对方案的看法，或提出具体的调整要求，我会根据您的反馈进一步优化。';
    }
  }

  /**
   * 生成文心一言模型的模拟响应
   */
  private generateWenxinResponse(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('文化') || lowerPrompt.includes('传统')) {
      return '为您生成了一个深度融合传统文化元素的设计方案。方案参考了多个历史时期的艺术风格，将传统纹样、色彩和构图原则与现代设计需求相结合，创造出既有文化底蕴又符合当代审美的作品。这种设计能够有效传达品牌的文化价值和历史传承。';
    } else if (lowerPrompt.includes('多模态') || lowerPrompt.includes('综合')) {
      return '根据您的需求，我为您创建了一个多模态设计方案。这个方案结合了视觉、文字和互动元素，提供了丰富的用户体验。设计中融入了多种文化符号和表现手法，能够在不同场景下有效传达信息。您可以告诉我您对方案的具体看法。';
    } else if (lowerPrompt.includes('建议') || lowerPrompt.includes('指导')) {
      return '根据您的创作内容，我提供以下建议：1. 可以增加一些传统纹样作为装饰元素，增强文化识别度；2. 考虑调整色彩搭配，使其更加和谐统一；3. 优化元素布局，提升整体视觉效果。这些调整将有助于提升作品的文化内涵和艺术表现力。';
    } else {
      return '基于您的描述，我为您生成了一个富有文化内涵的设计方案。这个方案注重文化元素的准确运用和创意表达，能够有效传达品牌的文化价值和理念。您可以提出具体的修改意见，我会根据您的反馈进一步完善方案。';
    }
  }

  /**
   * 创意启发功能 - 基于用户输入扩展创作方向
   */
  generateCreativeDirections(prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase();
    const directions: string[] = [];
    
    // 主题关键词匹配
    const themes: Record<string, string[]> = {
      // 天津特色主题
      tianjin: [
        '津味民俗+现代插画风格',
        '传统漕运文化与现代城市景观结合',
        '天津地方特色小吃元素融入',
        '海河两岸历史建筑与现代艺术表现',
        '杨柳青年画风格创新设计',
        '泥人张彩塑元素数字化应用',
        '天津方言文化的视觉表达',
        '天津租界建筑风格的现代演绎',
        '天津曲艺文化与新媒体结合',
        '天津老字号品牌的年轻化设计'
      ],
      // 节日主题
      festival: [
        '传统春联与现代设计语言结合',
        '剪纸艺术的现代演绎',
        '传统灯笼元素创新应用',
        '团圆主题的现代诠释',
        '中国传统色彩的现代应用',
        '非遗技艺的年轻化表达',
        '老字号品牌的现代视觉重构',
        '节日氛围与数字艺术结合',
        '传统节日习俗的创新表现',
        '节日主题的互动式设计'
      ],
      // 国潮主题
      guochao: [
        '传统文化元素与现代简约风格结合',
        '地域文化特色的创新表达',
        '传统技艺的现代应用',
        '经典纹样的重新诠释',
        '中国传统色彩的时尚应用',
        '非遗文化的商业化设计',
        '传统符号的现代解构',
        '东方美学与西方设计语言融合',
        '国潮IP的跨界合作设计',
        '传统工艺与数字技术结合'
      ],
      // 科技主题
      tech: [
        '未来科技与传统文化融合',
        'AI生成艺术与人文创意结合',
        '数字孪生与文化遗产保护',
        '元宇宙中的传统文化表达',
        'AR/VR技术与文化体验设计',
        '区块链与数字文创结合',
        '智能交互与传统艺术表现',
        '数据可视化与文化叙事',
        '科技感与东方美学结合',
        '未来城市与传统文化元素融合'
      ],
      // 自然主题
      nature: [
        '自然元素与传统纹样结合',
        '节气文化与现代设计结合',
        '山水意境的现代表达',
        '传统园林美学的现代应用',
        '植物纹样的创新设计',
        '自然色彩的和谐搭配',
        '生态主题与文化创意结合',
        '传统风水文化的现代诠释',
        '自然材料与现代工艺结合',
        '可持续设计与传统文化融合'
      ],
      // 生活主题
      life: [
        '传统生活方式的现代演绎',
        '日常用品的文化创意设计',
        '传统饮食文化的现代表达',
        '居住空间的文化元素融入',
        '传统服饰的现代改良',
        '生活美学与传统文化结合',
        '传统礼仪的现代诠释',
        '家庭文化与现代设计结合',
        '传统手工艺的现代应用',
        '生活场景的文化创意表达'
      ]
    };
    
    // 关键词匹配逻辑
    let matchedThemes: string[] = [];
    
    // 天津主题匹配
    if (lowerPrompt.includes('海河') || lowerPrompt.includes('天津') || lowerPrompt.includes('津味') || lowerPrompt.includes('杨柳青') || lowerPrompt.includes('泥人张')) {
      matchedThemes.push('tianjin');
    }
    
    // 节日主题匹配
    if (lowerPrompt.includes('春节') || lowerPrompt.includes('中秋') || lowerPrompt.includes('端午') || lowerPrompt.includes('元宵') || lowerPrompt.includes('节日')) {
      matchedThemes.push('festival');
    }
    
    // 国潮主题匹配
    if (lowerPrompt.includes('国潮') || lowerPrompt.includes('传统文化') || lowerPrompt.includes('非遗') || lowerPrompt.includes('老字号')) {
      matchedThemes.push('guochao');
    }
    
    // 科技主题匹配
    if (lowerPrompt.includes('科技') || lowerPrompt.includes('AI') || lowerPrompt.includes('数字') || lowerPrompt.includes('元宇宙') || lowerPrompt.includes('智能')) {
      matchedThemes.push('tech');
    }
    
    // 自然主题匹配
    if (lowerPrompt.includes('自然') || lowerPrompt.includes('山水') || lowerPrompt.includes('植物') || lowerPrompt.includes('节气') || lowerPrompt.includes('生态')) {
      matchedThemes.push('nature');
    }
    
    // 生活主题匹配
    if (lowerPrompt.includes('生活') || lowerPrompt.includes('日常') || lowerPrompt.includes('家庭') || lowerPrompt.includes('饮食') || lowerPrompt.includes('服饰')) {
      matchedThemes.push('life');
    }
    
    // 如果没有匹配到主题，默认使用国潮主题
    if (matchedThemes.length === 0) {
      matchedThemes.push('guochao');
    }
    
    // 从匹配的主题中选择创意方向
    matchedThemes.forEach(theme => {
      directions.push(...themes[theme]);
    });
    
    // 去重并随机排序，增加多样性
    const uniqueDirections = Array.from(new Set(directions));
    uniqueDirections.sort(() => Math.random() - 0.5);
    
    // 限制返回数量，最多返回12个创意方向
    return uniqueDirections.slice(0, 12);
  }

  /**
   * 文化元素推荐功能 - 根据主题推荐相关文化元素
   */
  recommendCulturalElements(topic: string): string[] {
    const lowerTopic = topic.toLowerCase();
    const elements: string[] = [];
    
    // 文化元素库
    const culturalElements: Record<string, string[]> = {
      // 天津特色文化元素
      tianjin: [
        '杨柳青年画',
        '泥人张彩塑',
        '天津方言',
        '狗不理包子',
        '十八街麻花',
        '耳朵眼炸糕',
        '天津快板',
        '京韵大鼓',
        '天津时调',
        '海河',
        '天津之眼',
        '五大道建筑',
        '意式风情区',
        '古文化街',
        '天后宫',
        '天津文庙',
        '石家大院',
        '天津传统小吃',
        '天津传统服饰',
        '天津传统节庆',
        '天津传统手工艺',
        '天津传统建筑风格',
        '天津传统色彩',
        '天津传统纹样',
        '天津历史名人'
      ],
      // 春节主题元素
      festival_spring: [
        '春联',
        '剪纸',
        '红灯笼',
        '中国结',
        '鞭炮',
        '福字',
        '年画',
        '饺子',
        '压岁钱',
        '舞龙舞狮',
        '拜年',
        '庙会',
        '元宵',
        '花灯',
        '猜灯谜'
      ],
      // 中秋主题元素
      festival_midautumn: [
        '月饼',
        '玉兔',
        '桂花',
        '月亮',
        '灯笼',
        '团圆',
        '赏月',
        '嫦娥奔月',
        '吴刚伐桂',
        '月饼盒',
        '桂花酒',
        '中秋诗词'
      ],
      // 国潮主题元素
      guochao: [
        '祥云纹',
        '龙纹',
        '凤纹',
        '青花瓷',
        '中国红',
        '书法',
        '印章',
        '水墨画',
        '剪纸',
        '刺绣',
        '盘扣',
        '旗袍',
        '汉服',
        '传统色彩',
        '经典纹样',
        '传统符号',
        '非遗技艺',
        '历史故事'
      ],
      // 传统纹样元素
      patterns: [
        '云纹',
        '回纹',
        '花卉纹',
        '几何纹',
        '龙纹',
        '凤纹',
        '缠枝纹',
        '卷草纹',
        '如意纹',
        '宝相花纹',
        '饕餮纹',
        '夔龙纹',
        '波浪纹',
        '寿字纹',
        '福字纹',
        '蝙蝠纹',
        '鱼纹',
        '莲花纹'
      ],
      // 传统色彩元素
      colors: [
        '中国红',
        '朱砂红',
        '胭脂红',
        '枣红',
        '靛蓝',
        '宝蓝',
        '孔雀蓝',
        '石青',
        '翠绿',
        '竹青',
        '豆绿',
        '明黄',
        '赤金',
        '琥珀',
        '墨黑',
        '象牙白',
        '玉白',
        '藕粉',
        '黛紫',
        '酱紫'
      ],
      // 传统技艺元素
      crafts: [
        '剪纸',
        '刺绣',
        '木雕',
        '石雕',
        '砖雕',
        '泥塑',
        '陶瓷',
        '漆器',
        '景泰蓝',
        '玉雕',
        '金银器',
        '编织',
        '印染',
        '造纸',
        '制笔',
        '制墨',
        '制砚'
      ],
      // 传统符号元素
      symbols: [
        '龙',
        '凤',
        '麒麟',
        '貔貅',
        '狮子',
        '大象',
        '蝙蝠',
        '鱼',
        '莲花',
        '牡丹',
        '梅花',
        '竹子',
        '菊花',
        '松树',
        '仙鹤',
        '喜鹊',
        '如意',
        '八卦',
        '太极',
        '祥云'
      ]
    };
    
    // 主题匹配逻辑
    let matchedElementGroups: string[] = [];
    
    // 天津主题匹配
    if (lowerTopic.includes('天津') || lowerTopic.includes('津味') || lowerTopic.includes('杨柳青') || lowerTopic.includes('泥人张') || lowerTopic.includes('海河')) {
      matchedElementGroups.push('tianjin');
    }
    
    // 春节主题匹配
    if (lowerTopic.includes('春节') || lowerTopic.includes('过年') || lowerTopic.includes('春联') || lowerTopic.includes('年画')) {
      matchedElementGroups.push('festival_spring');
    }
    
    // 中秋主题匹配
    if (lowerTopic.includes('中秋') || lowerTopic.includes('月饼') || lowerTopic.includes('月亮') || lowerTopic.includes('团圆')) {
      matchedElementGroups.push('festival_midautumn');
    }
    
    // 国潮主题匹配
    if (lowerTopic.includes('国潮') || lowerTopic.includes('国风') || lowerTopic.includes('传统') || lowerTopic.includes('非遗')) {
      matchedElementGroups.push('guochao');
    }
    
    // 纹样主题匹配
    if (lowerTopic.includes('纹样') || lowerTopic.includes('图案') || lowerTopic.includes('花纹')) {
      matchedElementGroups.push('patterns');
    }
    
    // 色彩主题匹配
    if (lowerTopic.includes('色彩') || lowerTopic.includes('颜色') || lowerTopic.includes('色调')) {
      matchedElementGroups.push('colors');
    }
    
    // 技艺主题匹配
    if (lowerTopic.includes('技艺') || lowerTopic.includes('工艺') || lowerTopic.includes('手工')) {
      matchedElementGroups.push('crafts');
    }
    
    // 符号主题匹配
    if (lowerTopic.includes('符号') || lowerTopic.includes('象征') || lowerTopic.includes('图腾')) {
      matchedElementGroups.push('symbols');
    }
    
    // 如果没有匹配到主题，默认使用国潮和传统元素
    if (matchedElementGroups.length === 0) {
      matchedElementGroups.push('guochao');
      matchedElementGroups.push('colors');
      matchedElementGroups.push('patterns');
    }
    
    // 从匹配的主题中选择元素
    matchedElementGroups.forEach(group => {
      elements.push(...culturalElements[group]);
    });
    
    // 去重并随机排序，增加多样性
    const uniqueElements = Array.from(new Set(elements));
    uniqueElements.sort(() => Math.random() - 0.5);
    
    // 限制返回数量，最多返回15个元素
    return uniqueElements.slice(0, 15);
  }

  /**
   * 创作问题诊断功能 - 分析创作中可能存在的问题
   */
  diagnoseCreationIssues(contentDescription: string): string[] {
    const lowerContent = contentDescription.toLowerCase();
    const issues: string[] = [];
    
    // 模拟检测可能存在的问题
    if (lowerContent.includes('密集') || lowerContent.includes('拥挤')) {
      issues.push('纹样排布过于密集，建议采用散点式布局，增加留白空间');
    }
    if (lowerContent.includes('龙纹') && Math.random() > 0.5) {
      issues.push('此龙纹形态不符合清代官窑标准，是否替换为品牌标准龙纹？');
    }
    if (lowerContent.includes('色彩') && Math.random() > 0.5) {
      issues.push('色彩搭配较为单调，建议增加传统色彩层次，提升视觉丰富度');
    }
    if (Math.random() > 0.7) {
      issues.push('文化元素融合略显生硬，建议调整元素比例和组合方式，使整体更加和谐');
    }
    
    // 如果没有检测到明显问题，提供一些通用建议
    if (issues.length === 0) {
      issues.push('整体设计良好，建议进一步强化文化元素的独特性和识别度');
      if (Math.random() > 0.5) {
        issues.push('可以考虑增加互动性元素，提升用户参与感和体验');
      }
    }
    
    return issues;
  }

  /**
   * 智能配色助手 - 生成色彩方案
   */
  generateColorScheme(theme: string, style?: string): string[] {
    const lowerTheme = theme.toLowerCase();
    const lowerStyle = style?.toLowerCase() || '';
    
    // 色彩方案库
    const colorSchemes: Record<string, string[]> = {
      // 传统风格配色
      traditional: [
        '中国红,朱砂红,靛蓝,象牙白,赤金',
        '黛紫,酱紫,明黄,玉白,墨黑',
        '翠绿,竹青,藕粉,琥珀,墨黑',
        '宝蓝,孔雀蓝,明黄,象牙白,赤金',
        '胭脂红,枣红,石青,玉白,墨黑'
      ],
      // 现代简约风格配色
      modern: [
        '纯白,浅灰,深灰,黑色,金色',
        '米白,淡蓝,深蓝,银灰,黑色',
        '象牙白,浅绿,深绿,棕色,黑色',
        '纯白,淡粉,深粉,灰色,黑色',
        '米白,浅紫,深紫,银灰,黑色'
      ],
      // 天津特色配色
      tianjin: [
        '杨柳青年画红,杨柳青年画绿,杨柳青年画黄,杨柳青年画蓝,杨柳青年画白',
        '泥人张彩塑红,泥人张彩塑黄,泥人张彩塑绿,泥人张彩塑蓝,泥人张彩塑白',
        '天津传统建筑红,天津传统建筑灰,天津传统建筑白,天津传统建筑黑,天津传统建筑金',
        '海河蓝,天津之眼红,五大道灰,意式风情区黄,古文化街青',
        '天津小吃红,天津小吃黄,天津小吃白,天津小吃棕,天津小吃绿'
      ],
      // 节日主题配色
      festival: [
        '春节红,春节金,春节黄,春节白,春节黑',
        '中秋金,中秋银,中秋蓝,中秋白,中秋红',
        '端午绿,端午黄,端午红,端午白,端午黑',
        '元宵红,元宵黄,元宵绿,元宵蓝,元宵白',
        '国庆红,国庆金,国庆蓝,国庆白,国庆黑'
      ],
      // 国潮风格配色
      guochao: [
        '国潮红,国潮金,国潮黑,国潮白,国潮蓝',
        '国潮绿,国潮黄,国潮红,国潮白,国潮黑',
        '国潮紫,国潮金,国潮红,国潮白,国潮黑',
        '国潮蓝,国潮金,国潮红,国潮白,国潮黑',
        '国潮粉,国潮金,国潮红,国潮白,国潮黑'
      ],
      // 自然主题配色
      nature: [
        '山水绿,山水蓝,山水白,山水灰,山水黑',
        '花卉红,花卉粉,花卉白,花卉绿,花卉黄',
        '森林绿,森林棕,森林白,森林灰,森林黑',
        '海洋蓝,海洋白,海洋绿,海洋灰,海洋黑',
        '沙漠黄,沙漠棕,沙漠白,沙漠灰,沙漠黑'
      ]
    };
    
    // 主题匹配逻辑
    let matchedSchemeGroup: string[] = [];
    
    // 天津主题匹配
    if (lowerTheme.includes('天津') || lowerTheme.includes('津味') || lowerTheme.includes('杨柳青') || lowerTheme.includes('泥人张')) {
      matchedSchemeGroup = colorSchemes.tianjin;
    }
    // 节日主题匹配
    else if (lowerTheme.includes('春节') || lowerTheme.includes('中秋') || lowerTheme.includes('端午') || lowerTheme.includes('元宵') || lowerTheme.includes('节日')) {
      matchedSchemeGroup = colorSchemes.festival;
    }
    // 国潮主题匹配
    else if (lowerTheme.includes('国潮') || lowerTheme.includes('国风') || lowerTheme.includes('传统')) {
      matchedSchemeGroup = colorSchemes.guochao;
    }
    // 自然主题匹配
    else if (lowerTheme.includes('自然') || lowerTheme.includes('山水') || lowerTheme.includes('花卉') || lowerTheme.includes('森林') || lowerTheme.includes('海洋')) {
      matchedSchemeGroup = colorSchemes.nature;
    }
    // 风格匹配
    else if (lowerStyle.includes('现代') || lowerStyle.includes('简约')) {
      matchedSchemeGroup = colorSchemes.modern;
    }
    else if (lowerStyle.includes('传统') || lowerStyle.includes('古典')) {
      matchedSchemeGroup = colorSchemes.traditional;
    }
    // 默认使用国潮配色
    else {
      matchedSchemeGroup = colorSchemes.guochao;
    }
    
    // 随机选择一个配色方案
    const randomScheme = matchedSchemeGroup[Math.floor(Math.random() * matchedSchemeGroup.length)];
    return randomScheme.split(',');
  }

  /**
   * 智能配色助手 - 色彩搭配建议
   */
  getColorMatchingAdvice(colors: string[]): string {
    const lowerColors = colors.map(color => color.toLowerCase());
    
    // 色彩搭配建议库
    const colorAdvice: Record<string, string> = {
      '中国红': '中国红象征喜庆、吉祥，常用于节日和庆典主题，搭配金色或白色效果最佳',
      '朱砂红': '朱砂红比中国红更深沉，具有传统韵味，适合搭配靛蓝或象牙白',
      '靛蓝': '靛蓝是中国传统色彩，象征宁静、智慧，适合搭配红色或金色',
      '象牙白': '象牙白比纯白更温暖，具有古典气质，适合搭配各种传统色彩',
      '赤金': '赤金象征高贵、华丽，常用于装饰和强调，适合搭配红色或蓝色',
      '黛紫': '黛紫是深紫色，具有神秘、高贵的气质，适合搭配明黄或玉白',
      '酱紫': '酱紫是紫红色，具有传统韵味，适合搭配明黄或玉白',
      '明黄': '明黄象征皇权、高贵，适合搭配紫色或蓝色',
      '玉白': '玉白是温润的白色，具有古典气质，适合搭配各种色彩',
      '墨黑': '墨黑象征庄重、神秘，适合搭配各种明亮色彩',
      '翠绿': '翠绿象征生机、活力，适合搭配竹青或藕粉',
      '竹青': '竹青是淡绿色，象征清新、自然，适合搭配翠绿或琥珀',
      '藕粉': '藕粉是淡粉色，具有温柔、优雅的气质，适合搭配翠绿或琥珀',
      '琥珀': '琥珀是暖黄色，具有古典韵味，适合搭配墨黑或翠绿',
      '宝蓝': '宝蓝是深蓝色，象征高贵、神秘，适合搭配孔雀蓝或明黄',
      '孔雀蓝': '孔雀蓝是明亮的蓝色，象征华丽、高贵，适合搭配宝蓝或明黄',
      '胭脂红': '胭脂红是粉红色，具有温柔、优雅的气质，适合搭配枣红或石青',
      '枣红': '枣红是暗红色，具有传统韵味，适合搭配胭脂红或石青',
      '石青': '石青是深青色，具有古典气质，适合搭配胭脂红或枣红'
    };
    
    // 生成搭配建议
    let advice = '这套配色方案的特点和搭配建议：\n';
    
    colors.forEach(color => {
      if (colorAdvice[color]) {
        advice += `- ${color}：${colorAdvice[color]}\n`;
      }
    });
    
    // 添加整体搭配建议
    advice += '\n整体搭配建议：\n';
    
    // 检测是否包含中国红
    if (lowerColors.includes('中国红') || lowerColors.includes('朱砂红') || lowerColors.includes('胭脂红') || lowerColors.includes('枣红')) {
      advice += '- 红色系为主的配色方案，建议使用白色或金色作为辅助色，以平衡视觉效果\n';
    }
    // 检测是否包含蓝色系
    else if (lowerColors.includes('靛蓝') || lowerColors.includes('宝蓝') || lowerColors.includes('孔雀蓝') || lowerColors.includes('石青')) {
      advice += '- 蓝色系为主的配色方案，建议使用白色或金色作为辅助色，以增强层次感\n';
    }
    // 检测是否包含绿色系
    else if (lowerColors.includes('翠绿') || lowerColors.includes('竹青')) {
      advice += '- 绿色系为主的配色方案，建议使用白色或棕色作为辅助色，以营造自然和谐的氛围\n';
    }
    // 检测是否包含紫色系
    else if (lowerColors.includes('黛紫') || lowerColors.includes('酱紫')) {
      advice += '- 紫色系为主的配色方案，建议使用白色或金色作为辅助色，以增强高贵感\n';
    }
    // 检测是否包含黄色系
    else if (lowerColors.includes('明黄') || lowerColors.includes('赤金') || lowerColors.includes('琥珀')) {
      advice += '- 黄色系为主的配色方案，建议使用白色或黑色作为辅助色，以平衡视觉效果\n';
    }
    // 现代简约风格
    else if (lowerColors.includes('纯白') || lowerColors.includes('浅灰') || lowerColors.includes('深灰') || lowerColors.includes('黑色')) {
      advice += '- 现代简约风格的配色方案，建议使用少量亮色作为点缀，以增强视觉焦点\n';
    }
    
    return advice;
  }
}

// 导出单例实例
const service = new LLMService();
try {
  const savedModel = localStorage.getItem('LLM_CURRENT_MODEL');
  if (savedModel) service.setCurrentModel(savedModel);
  const savedCfg = localStorage.getItem('LLM_CONFIG');
  if (savedCfg) service.updateConfig(JSON.parse(savedCfg));
  
  // 初始化会话系统
  (service as any).initializeSessions();
} catch (error) {
  console.error('Failed to initialize LLM service:', error);
}
export default service;
