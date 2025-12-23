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

// 模型角色类型定义
export interface ModelRole {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  temperature: number;
  top_p: number;
  presence_penalty: number;
  frequency_penalty: number;
  is_default: boolean;
  created_at: number;
  updated_at: number;
  tags?: string[];
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
  // 新增ChatGPT模型配置
  chatgpt_model: string;
  chatgpt_base_url: string;
  // 新增Gemini模型配置
  gemini_model: string;
  gemini_base_url: string;
  // 新增Gork模型配置
  gork_model: string;
  gork_base_url: string;
  // 新增智谱模型配置
  zhipu_model: string;
  zhipu_base_url: string;
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
  // 新增角色配置
  current_role_id?: string;
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
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    description: 'OpenAI旗下的通用AI模型，擅长多种任务',
    strengths: ['通用任务', '创意写作', '代码生成'],
    isDefault: false
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google旗下的多模态AI模型，擅长图像和文本理解',
    strengths: ['多模态理解', '图像分析', '创意生成'],
    isDefault: false
  },
  {
    id: 'gork',
    name: 'Gork',
    description: 'XAI旗下的AI模型，擅长生成和推理',
    strengths: ['推理能力', '创意生成', '长文本处理'],
    isDefault: false
  },
  {
    id: 'zhipu',
    name: '智谱',
    description: '智谱AI旗下的大语言模型，擅长中文处理和多模态',
    strengths: ['中文处理', '多模态生成', '知识问答'],
    isDefault: false
  }
];

// 默认角色列表
export const DEFAULT_ROLES: ModelRole[] = [
  {
    id: 'default',
    name: '默认助手',
    description: '帮助创作者进行设计构思、文化融合和平台使用的全能助手',
    system_prompt: '你是一个帮助创作者进行设计构思、文化融合和平台使用的全能助手。请提供详细、具体、有用的回答，帮助用户解决在平台使用过程中遇到的各种问题，包括创作、上传、编辑、分享、推广、数据分析、账户设置等方面。你的回答应该友好、专业、易于理解，并且提供清晰的步骤和建议。',
    temperature: 0.7,
    top_p: 0.9,
    presence_penalty: 0,
    frequency_penalty: 0,
    is_default: true,
    created_at: Date.now(),
    updated_at: Date.now(),
    tags: ['默认', '创意', '帮助']
  },
  {
    id: 'designer',
    name: '设计专家',
    description: '专注于设计领域的专家，提供专业的设计建议和创意',
    system_prompt: '你是一位资深的设计专家，专注于视觉设计、UI/UX设计、创意设计、文化融合设计和传统元素创新应用。请提供专业、详细、实用的设计建议和创意构思，包括色彩搭配、排版设计、元素运用、风格定位等方面。你的回答应该具体、可操作，并且结合最新的设计趋势和传统美学。',
    temperature: 0.8,
    top_p: 0.95,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
    is_default: false,
    created_at: Date.now(),
    updated_at: Date.now(),
    tags: ['设计', '创意', '文化']
  },
  {
    id: 'coder',
    name: '代码助手',
    description: '帮助编写和优化代码的助手',
    system_prompt: '你是一位资深的软件开发工程师，擅长多种编程语言和技术栈。请提供准确、高效、安全的代码解决方案和优化建议。你的回答应该包括完整的代码示例、详细的解释和最佳实践。对于问题，要先理解需求，然后提供清晰、可运行的代码，并解释代码的工作原理和优化点。',
    temperature: 0.3,
    top_p: 0.8,
    presence_penalty: 0,
    frequency_penalty: 0,
    is_default: false,
    created_at: Date.now(),
    updated_at: Date.now(),
    tags: ['编程', '技术', '代码']
  },
  {
    id: 'writer',
    name: '文案专家',
    description: '专注于文案创作的专家，提供吸引人的文案建议',
    system_prompt: '你是一位资深的文案专家，擅长创作各种类型的文案，包括广告文案、营销文案、社交媒体文案、产品描述、品牌故事等。请提供吸引人、有创意、符合品牌调性的文案内容。你的回答应该结合目标受众、传播渠道和营销目标，提供具体、可直接使用的文案示例，并解释文案的创作思路和效果预期。',
    temperature: 0.9,
    top_p: 0.95,
    presence_penalty: 0.2,
    frequency_penalty: 0.1,
    is_default: false,
    created_at: Date.now(),
    updated_at: Date.now(),
    tags: ['文案', '创作', '营销']
  },
  {
    id: 'teacher',
    name: '教育导师',
    description: '提供详细解释和指导的教育导师',
    system_prompt: '你是一位耐心、详细的教育导师，擅长将复杂的概念简单化，帮助学习者理解各种知识。请提供清晰、详细、循序渐进的解释和指导。你的回答应该包括基本概念、核心原理、实际应用和练习建议，使用通俗易懂的语言和生动的例子，帮助学习者建立完整的知识体系。',
    temperature: 0.6,
    top_p: 0.85,
    presence_penalty: 0,
    frequency_penalty: 0,
    is_default: false,
    created_at: Date.now(),
    updated_at: Date.now(),
    tags: ['教育', '学习', '指导']
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
  // 新增ChatGPT模型配置默认值
  chatgpt_model: 'gpt-4o',
  chatgpt_base_url: 'https://api.openai.com/v1',
  // 新增Gemini模型配置默认值
  gemini_model: 'gemini-1.5-flash',
  gemini_base_url: 'https://generativelanguage.googleapis.com/v1',
  // 新增Gork模型配置默认值
  gork_model: 'grok-beta',
  gork_base_url: 'https://api.x.ai/v1',
  // 新增智谱模型配置默认值
  zhipu_model: 'glm-4-plus',
  zhipu_base_url: 'https://open.bigmodel.cn/api/paas/v4',
  // 新增对话相关配置默认值
  enable_memory: true,
  memory_window: 20,
  context_window: 8192,
  // 新增多模态配置默认值
  enable_multimodal: true,
  image_resolution: '1024x1024',
  // 新增安全配置默认值
  enable_safety_check: true,
  safety_level: 'medium',
  // 新增角色配置默认值
  current_role_id: 'default'
};

/**
   * 连接状态类型定义
   */
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

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
  // 角色管理相关属性
  private roles: ModelRole[] = [...DEFAULT_ROLES];
  private currentRole: ModelRole = DEFAULT_ROLES.find(r => r.is_default) || DEFAULT_ROLES[0];
  // 连接状态相关属性
  private connectionStatus: Record<string, ConnectionStatus> = {};
  private connectionStatusListeners: Array<(modelId: string, status: ConnectionStatus, error?: string) => void> = [];

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
   * 初始化角色系统
   */
  private initializeRoles(): void {
    try {
      const savedRoles = localStorage.getItem('LLM_ROLES');
      if (savedRoles) {
        const parsedRoles = JSON.parse(savedRoles);
        // 合并默认角色和保存的角色，避免丢失默认角色
        const roleMap = new Map<string, ModelRole>();
        
        // 先添加默认角色
        DEFAULT_ROLES.forEach(role => {
          roleMap.set(role.id, role);
        });
        
        // 再添加保存的角色，覆盖同名默认角色
        parsedRoles.forEach((role: ModelRole) => {
          roleMap.set(role.id, role);
        });
        
        this.roles = Array.from(roleMap.values());
      }
      
      const savedCurrentRoleId = localStorage.getItem('LLM_CURRENT_ROLE_ID');
      if (savedCurrentRoleId) {
        const role = this.roles.find(r => r.id === savedCurrentRoleId);
        if (role) {
          this.currentRole = role;
          this.applyRoleToConfig(role);
        }
      }
    } catch (error) {
      console.error('Failed to initialize roles:', error);
      // 初始化失败，使用默认角色
      this.roles = [...DEFAULT_ROLES];
      this.currentRole = DEFAULT_ROLES.find(r => r.is_default) || DEFAULT_ROLES[0];
      this.applyRoleToConfig(this.currentRole);
    }
  }
  
  /**
   * 将角色配置应用到模型配置
   */
  private applyRoleToConfig(role: ModelRole): void {
    this.modelConfig = {
      ...this.modelConfig,
      system_prompt: role.system_prompt,
      temperature: role.temperature,
      top_p: role.top_p,
      presence_penalty: role.presence_penalty,
      frequency_penalty: role.frequency_penalty,
      current_role_id: role.id
    };
    
    // 保存更新后的配置
    try {
      localStorage.setItem('LLM_CONFIG', JSON.stringify(this.modelConfig));
    } catch (error) {
      console.error('Failed to save config with role:', error);
    }
  }
  
  /**
   * 保存角色到localStorage
   */
  private saveRoles(): void {
    try {
      localStorage.setItem('LLM_ROLES', JSON.stringify(this.roles));
      localStorage.setItem('LLM_CURRENT_ROLE_ID', this.currentRole.id);
    } catch (error) {
      console.error('Failed to save roles:', error);
    }
  }
  
  /**
   * 初始化会话系统
   */
  private initializeSessions(): void {
    // 先初始化角色系统
    this.initializeRoles();
    
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
   * 获取所有角色
   */
  getRoles(): ModelRole[] {
    return [...this.roles];
  }
  
  /**
   * 获取当前角色
   */
  getCurrentRole(): ModelRole {
    return { ...this.currentRole };
  }
  
  /**
   * 设置当前角色
   * @param roleId 角色ID
   */
  setCurrentRole(roleId: string): void {
    const role = this.roles.find(r => r.id === roleId);
    if (role) {
      this.currentRole = role;
      this.applyRoleToConfig(role);
      this.saveRoles();
      
      // 触发角色切换事件
      this.emitRoleChangeEvent(roleId);
    }
  }
  
  /**
   * 触发角色切换事件
   */
  private emitRoleChangeEvent(roleId: string): void {
    // 创建自定义事件
    const event = new CustomEvent('llm-role-changed', {
      detail: {
        roleId,
        timestamp: Date.now()
      }
    });
    
    // 派发事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }
  
  /**
   * 创建新角色
   * @param roleData 角色数据
   */
  createRole(roleData: Omit<ModelRole, 'id' | 'created_at' | 'updated_at'>): ModelRole {
    const newRole: ModelRole = {
      ...roleData,
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: Date.now(),
      updated_at: Date.now()
    };
    
    this.roles.push(newRole);
    this.saveRoles();
    
    return newRole;
  }
  
  /**
   * 更新角色
   * @param roleId 角色ID
   * @param roleData 角色数据
   */
  updateRole(roleId: string, roleData: Partial<ModelRole>): ModelRole | null {
    const index = this.roles.findIndex(r => r.id === roleId);
    if (index !== -1) {
      const updatedRole: ModelRole = {
        ...this.roles[index],
        ...roleData,
        updated_at: Date.now()
      };
      
      this.roles[index] = updatedRole;
      this.saveRoles();
      
      // 如果更新的是当前角色，应用新配置
      if (roleId === this.currentRole.id) {
        this.currentRole = updatedRole;
        this.applyRoleToConfig(updatedRole);
      }
      
      return updatedRole;
    }
    
    return null;
  }
  
  /**
   * 删除角色
   * @param roleId 角色ID
   */
  deleteRole(roleId: string): boolean {
    // 不能删除默认角色
    const role = this.roles.find(r => r.id === roleId);
    if (role && role.is_default) {
      return false;
    }
    
    const index = this.roles.findIndex(r => r.id === roleId);
    if (index !== -1) {
      this.roles.splice(index, 1);
      this.saveRoles();
      
      // 如果删除的是当前角色，切换到默认角色
      if (roleId === this.currentRole.id) {
        const defaultRole = this.roles.find(r => r.is_default) || this.roles[0];
        this.setCurrentRole(defaultRole.id);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * 获取指定角色
   * @param roleId 角色ID
   */
  getRole(roleId: string): ModelRole | undefined {
    return this.roles.find(r => r.id === roleId);
  }
  
  /**
   * 设置模型连接状态
   */
  private setConnectionStatus(modelId: string, status: ConnectionStatus, error?: string): void {
    this.connectionStatus[modelId] = status;
    
    // 触发状态变更事件
    this.connectionStatusListeners.forEach(listener => {
      try {
        listener(modelId, status, error);
      } catch (e) {
        console.error('Error in connection status listener:', e);
      }
    });
    
    // 触发全局事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('llm-connection-status-changed', {
        detail: {
          modelId,
          status,
          error,
          timestamp: Date.now()
        }
      }));
    }
  }
  
  /**
   * 获取模型连接状态
   */
  getConnectionStatus(modelId?: string): ConnectionStatus | Record<string, ConnectionStatus> {
    if (modelId) {
      return this.connectionStatus[modelId] || 'disconnected';
    }
    return { ...this.connectionStatus };
  }
  
  /**
   * 添加连接状态监听器
   */
  addConnectionStatusListener(
    listener: (modelId: string, status: ConnectionStatus, error?: string) => void
  ): () => void {
    this.connectionStatusListeners.push(listener);
    
    // 返回移除监听器的函数
    return () => {
      const index = this.connectionStatusListeners.indexOf(listener);
      if (index !== -1) {
        this.connectionStatusListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * 检查模型连接状态
   */
  async checkConnectionStatus(modelId: string): Promise<ConnectionStatus> {
    this.setConnectionStatus(modelId, 'connecting');
    
    // 1. 检查API密钥是否配置
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
    const useProxy = !!apiBase;
    let hasValidKey = false;
    
    if (!useProxy) {
      // 非代理模式下，检查本地存储或环境变量中的API密钥
      const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[`VITE_${modelId.toUpperCase()}_API_KEY`]) || '';
      const storedKey = localStorage.getItem(`${modelId.toUpperCase()}_API_KEY`) || '';
      hasValidKey = !!(storedKey || envKey);
      
      if (!hasValidKey) {
        const detailedError = `${modelId} API密钥未配置`;
        this.setConnectionStatus(modelId, 'error', detailedError);
        return 'error';
      }
    }
    
    // 2. 网络连通性检测
    try {
      // 获取模型的基础URL
      let baseUrl = '';
      
      // 根据模型ID获取对应的基础URL
      switch (modelId) {
        case 'kimi':
          baseUrl = this.modelConfig.kimi_base_url || 'https://api.moonshot.cn/v1';
          break;
        case 'deepseek':
          baseUrl = this.modelConfig.deepseek_base_url || 'https://api.deepseek.com';
          break;
        case 'doubao':
          baseUrl = this.modelConfig.doubao_base_url || 'https://api.doubao.com/v1';
          break;
        case 'qwen':
          baseUrl = this.modelConfig.qwen_base_url || 'https://dashscope.aliyuncs.com/api/v1';
          break;
        case 'wenxinyiyan':
          // 百度文心一言API的基础URL需要特殊处理
          const rawWenxinUrl = this.modelConfig.wenxin_base_url || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions';
          // 只使用域名部分进行连通性检测
          const urlObj = new URL(rawWenxinUrl);
          baseUrl = `${urlObj.protocol}//${urlObj.host}`;
          break;
        case 'chatgpt':
          baseUrl = this.modelConfig.chatgpt_base_url || 'https://api.openai.com/v1';
          break;
        case 'gemini':
          baseUrl = this.modelConfig.gemini_base_url || 'https://generativelanguage.googleapis.com/v1';
          break;
        case 'gork':
          baseUrl = this.modelConfig.gork_base_url || 'https://api.x.ai/v1';
          break;
        case 'zhipu':
          baseUrl = this.modelConfig.zhipu_base_url || 'https://open.bigmodel.cn/api/paas/v4';
          break;
        default:
          baseUrl = this.modelConfig.kimi_base_url || 'https://api.moonshot.cn/v1';
      }
      
      // 测试网络连通性：使用HEAD请求更快，添加超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时
      
      try {
        const response = await fetch(baseUrl, {
          method: 'HEAD', // HEAD请求只获取响应头，更快
          signal: controller.signal,
          // 不跟随重定向，直接检测目标服务器
          redirect: 'manual'
        });
        
        // 检查响应状态码
        if (response.status >= 400 && response.status < 600) {
          throw new Error(`服务器返回错误状态码: ${response.status}`);
        }
        
        clearTimeout(timeoutId);
      } catch (error) {
        clearTimeout(timeoutId);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const networkErrorMsg = `${modelId} 网络连通性检测失败: ${errorMessage}`;
        this.setConnectionStatus(modelId, 'error', networkErrorMsg);
        return 'error';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const networkErrorMsg = `${modelId} 网络连通性检测失败: ${errorMessage}`;
      this.setConnectionStatus(modelId, 'error', networkErrorMsg);
      return 'error';
    }
    
    // 3. API调用测试：使用专门的测试方法，避免影响当前模型
    try {
      // 创建临时的模型配置，避免修改当前配置
      const tempConfig = { ...this.modelConfig };
      const tempModel = AVAILABLE_MODELS.find(m => m.id === modelId) || this.currentModel;
      
      // 发送一个简单的测试请求，使用独立的调用逻辑，避免影响当前模型
      const testResponse = await this.testModelConnection(modelId, tempModel, tempConfig, useProxy);
      
      this.setConnectionStatus(modelId, 'connected');
      return 'connected';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      let detailedError = '';
      
      // 详细的错误分类和处理
      if (errorMessage.includes('Missing')) {
        detailedError = `${modelId} API密钥缺失: ${errorMessage}`;
      } else if (errorMessage.includes('Invalid API key') || 
                 errorMessage.includes('authentication failed') || 
                 errorMessage.includes('Unauthorized') || 
                 errorMessage.includes('401') ||
                 errorMessage.includes('invalid_iam_token')) {
        detailedError = `${modelId} API密钥无效或认证失败: ${errorMessage}`;
      } else if (errorMessage.includes('QUOTA_EXCEEDED') || 
                 errorMessage.includes('quota') || 
                 errorMessage.includes('limit') ||
                 errorMessage.includes('429')) {
        detailedError = `${modelId} API配额已用完: ${errorMessage}`;
      } else if (errorMessage.includes('timeout') || 
                 errorMessage.includes('Timeout') ||
                 errorMessage.includes('Timed out')) {
        detailedError = `${modelId} API请求超时: ${errorMessage}`;
      } else if (errorMessage.includes('network') || 
                 errorMessage.includes('Network') ||
                 errorMessage.includes('fetch failed') ||
                 errorMessage.includes('connection')) {
        detailedError = `${modelId} 网络连接错误: ${errorMessage}`;
      } else if (errorMessage.includes('500') || 
                 errorMessage.includes('502') || 
                 errorMessage.includes('503') || 
                 errorMessage.includes('504') ||
                 errorMessage.includes('service unavailable')) {
        detailedError = `${modelId} 服务器内部错误: ${errorMessage}`;
      } else {
        detailedError = `${modelId} API调用失败: ${errorMessage}`;
      }
      
      this.setConnectionStatus(modelId, 'error', detailedError);
      return 'error';
    }
  }
  
  /**
   * 测试模型连接的内部方法，不影响当前模型状态
   */
  private async testModelConnection(
    modelId: string, 
    model: LLMModel, 
    config: ModelConfig, 
    useProxy: boolean
  ): Promise<string> {
    const testPrompt = 'ping';
    
    // 根据模型ID调用相应的API测试方法
    switch (modelId) {
      case 'kimi':
        return this.callKimi(testPrompt, { 
          signal: AbortSignal.timeout(5000),
          // 不使用流模式，测试更简单
          onDelta: undefined
        });
      case 'deepseek':
        return this.callDeepseek(testPrompt, { 
          signal: AbortSignal.timeout(5000),
          onDelta: undefined
        });
      case 'doubao':
        return this.callDoubao(testPrompt, { 
          signal: AbortSignal.timeout(5000),
          onDelta: undefined
        });
      case 'qwen':
        return this.callQwen(testPrompt, { 
          signal: AbortSignal.timeout(5000),
          onDelta: undefined
        });
      case 'wenxinyiyan':
        return this.callWenxin(testPrompt, { 
          signal: AbortSignal.timeout(5000),
          onDelta: undefined
        });
      case 'chatgpt':
        return this.callChatGPT(testPrompt, { 
          signal: AbortSignal.timeout(5000),
          onDelta: undefined
        });
      case 'gemini':
        return this.callGemini(testPrompt, { 
          signal: AbortSignal.timeout(5000),
          onDelta: undefined
        });
      case 'gork':
        return this.callGork(testPrompt, { 
          signal: AbortSignal.timeout(5000),
          onDelta: undefined
        });
      case 'zhipu':
        return this.callZhipu(testPrompt, { 
          signal: AbortSignal.timeout(5000),
          onDelta: undefined
        });
      default:
        throw new Error(`未知模型: ${modelId}`);
    }
  }
  
  /**
   * 检查所有模型的连接状态
   */
  async checkAllConnectionsStatus(): Promise<Record<string, ConnectionStatus>> {
    const results: Record<string, ConnectionStatus> = {};
    const promises = AVAILABLE_MODELS.map(async (model) => {
      results[model.id] = await this.checkConnectionStatus(model.id);
    });
    
    await Promise.allSettled(promises);
    return results;
  }

  /**
   * 向多个模型并行发送请求
   * 支持文本和图像输入（多模态）
   */
  async generateResponsesFromMultipleModels(
    prompt: string,
    modelIds: string[],
    options?: {
      onModelResponse?: (modelId: string, response: string, success: boolean, error?: string) => void;
      signal?: AbortSignal;
      images?: string[]; // 支持多图像输入
    }
  ): Promise<Record<string, { response: string; success: boolean; error?: string }>> {
    const results: Record<string, { response: string; success: boolean; error?: string }> = {};
    const modelPromises: Promise<void>[] = [];
    
    // 为每个模型创建一个请求函数
    for (const modelId of modelIds) {
      const modelPromise = this.generateResponseForModel(
        prompt,
        modelId,
        options?.images,
        options?.signal
      ).then(
        (response) => {
          results[modelId] = { response, success: true };
          options?.onModelResponse?.(modelId, response, true);
        },
        (error) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results[modelId] = { response: '', success: false, error: errorMessage };
          options?.onModelResponse?.(modelId, '', false, errorMessage);
        }
      );
      
      modelPromises.push(modelPromise);
    }
    
    // 等待所有请求完成
    await Promise.allSettled(modelPromises);
    
    return results;
  }
  
  /**
   * 向单个模型发送请求（内部方法）
   * 支持文本和图像输入（多模态）
   */
  private async generateResponseForModel(
    prompt: string,
    modelId: string,
    images?: string[],
    signal?: AbortSignal
  ): Promise<string> {
    // 保存当前模型和配置
    const originalModel = this.currentModel;
    const originalConfig = { ...this.modelConfig };
    
    try {
      // 切换到目标模型
      this.setCurrentModel(modelId, true);
      
      // 调用生成方法
      return await this.generateResponse(prompt, { images, signal });
    } finally {
      // 恢复原始模型和配置
      this.currentModel = originalModel;
      this.modelConfig = originalConfig;
    }
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
    const originalModelId = this.currentModel.id;
    
    // 尝试过的模型列表
    const attemptedModels: string[] = [];
    
    // 获取当前连接状态
    const connectionStatus = this.getConnectionStatus() as Record<string, ConnectionStatus>;
    
    // 获取模型性能数据
    const performanceData = this.getPerformanceData() as Record<string, ModelPerformance>;
    
    // 构建带有多模态支持的请求选项
    const requestOptions = {
      ...options,
      images: options?.images || [],
      multimodalConfig: {
        enable_multimodal: this.modelConfig.enable_multimodal,
        image_resolution: this.modelConfig.image_resolution
      }
    };
    
    // 智能回退机制：尝试多个模型直到成功
    const tryNextModel = async (fallbackCount: number = 0): Promise<string> => {
      // 获取当前模型
      const currentModelId = this.currentModel.id;
      
      // 记录尝试过的模型
      if (!attemptedModels.includes(currentModelId)) {
        attemptedModels.push(currentModelId);
      }
      
      // 设置连接状态为连接中
      this.setConnectionStatus(currentModelId, 'connecting');
      
      try {
        // 调用当前模型
        let response: string;
        
        switch (currentModelId) {
          case 'kimi':
            response = await this.callKimi(prompt, requestOptions);
            break;
          case 'deepseek':
            response = await this.callDeepseek(prompt, requestOptions);
            break;
          case 'wenxinyiyan':
            response = await this.callWenxin(prompt, requestOptions);
            break;
          case 'doubao':
            response = await this.callDoubao(prompt, requestOptions);
            break;
          case 'qwen':
            response = await this.callQwen(prompt, requestOptions);
            break;
          case 'chatgpt':
            response = await this.callChatGPT(prompt, requestOptions);
            break;
          case 'gemini':
            response = await this.callGemini(prompt, requestOptions);
            break;
          case 'gork':
            response = await this.callGork(prompt, requestOptions);
            break;
          case 'zhipu':
            response = await this.callZhipu(prompt, requestOptions);
            break;
          default:
            throw new Error(`未知模型: ${currentModelId}`);
        }
        
        // 设置连接状态为已连接
        this.setConnectionStatus(currentModelId, 'connected');
        
        // 添加AI响应到历史
        const aiMessage: Message = { 
          role: 'assistant', 
          content: response, 
          timestamp: Date.now() 
        };
        this.addToHistory(aiMessage);
        
        // 记录性能数据
        this.recordPerformance(currentModelId, startTime, true);
        
        // 如果不是原始模型，记录模型切换信息
        if (currentModelId !== originalModelId) {
          console.log(`模型切换成功: ${originalModelId} → ${currentModelId}`);
        }
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // 设置连接状态为错误
        this.setConnectionStatus(currentModelId, 'error', errorMessage);
        
        // 记录性能数据
        this.recordPerformance(currentModelId, startTime, false, errorMessage);
        
        // 检测配额用完错误，标记模型不可用
        if ((errorMessage.includes('QUOTA_EXCEEDED') || errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('429'))) {
          localStorage.setItem(`${currentModelId.toUpperCase()}_QUOTA_EXCEEDED`, 'true');
        }
        
        // 计算已尝试的模型数量
        const availableModels = AVAILABLE_MODELS.filter(model => {
          // 检查模型是否已配置
          const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
          const useProxy = !!apiBase;
          let isConfigured = false;
          
          if (useProxy) {
            isConfigured = true; // 代理模式下，假设所有模型都已配置
          } else {
            const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[`VITE_${model.id.toUpperCase()}_API_KEY`]) || '';
            const storedKey = localStorage.getItem(`${model.id.toUpperCase()}_API_KEY`) || '';
            isConfigured = !!(storedKey || envKey);
          }
          
          // 检查模型是否已被标记为配额用完
          const isQuotaExceeded = localStorage.getItem(`${model.id.toUpperCase()}_QUOTA_EXCEEDED`) === 'true';
          
          return isConfigured && !isQuotaExceeded && !attemptedModels.includes(model.id);
        });
        
        // 如果没有更多可用模型，返回错误或模拟响应
        if (availableModels.length === 0) {
          console.error('所有可用模型均调用失败:', attemptedModels);
          
          // 生成模拟响应
          const mockResponse = this.getFallbackResponse(originalModelId, errorMessage);
          const aiMessage: Message = { 
            role: 'assistant', 
            content: mockResponse, 
            timestamp: Date.now() 
          };
          this.addToHistory(aiMessage);
          return mockResponse;
        }
        
        // 根据性能和连接状态选择下一个最佳模型
        const nextModelId = this.selectNextBestModel(availableModels, connectionStatus, performanceData);
        
        // 如果找不到合适的模型，返回错误
        if (!nextModelId) {
          console.error('无法找到合适的下一个模型');
          
          // 生成模拟响应
          const mockResponse = this.getFallbackResponse(originalModelId, errorMessage);
          const aiMessage: Message = { 
            role: 'assistant', 
            content: mockResponse, 
            timestamp: Date.now() 
          };
          this.addToHistory(aiMessage);
          return mockResponse;
        }
        
        // 切换到下一个模型
        console.log(`模型切换: ${currentModelId} → ${nextModelId} (原因: ${errorMessage})`);
        this.setCurrentModel(nextModelId, true);
        
        // 递归调用，尝试下一个模型
        return await tryNextModel(fallbackCount + 1);
      }
    };
    
    // 开始尝试第一个模型
    return tryNextModel();
  }
  
  /**
   * 根据性能和连接状态选择下一个最佳模型
   */
  private selectNextBestModel(
    availableModels: LLMModel[],
    connectionStatus: Record<string, ConnectionStatus>,
    performanceData: Record<string, ModelPerformance>
  ): string | null {
    // 如果只有一个可用模型，直接返回
    if (availableModels.length === 1) {
      return availableModels[0].id;
    }
    
    // 计算每个模型的评分
    const scoredModels = availableModels.map(model => {
      let score = 0;
      const modelId = model.id;
      
      // 连接状态评分 (30%权重)
      if (connectionStatus[modelId] === 'connected') {
        score += 30;
      } else if (!connectionStatus[modelId]) {
        score += 15; // 未知状态，给予中等评分
      } else {
        score += 5; // 错误状态，给予低评分
      }
      
      // 性能评分 (70%权重)
      const perf = performanceData[modelId];
      if (perf) {
        // 成功率评分 (40%权重)
        const successRate = perf.requestCount > 0 ? (perf.successCount / perf.requestCount) : 0;
        score += successRate * 40;
        
        // 平均响应时间评分 (30%权重，响应时间越短评分越高)
        const responseTimeScore = perf.averageResponseTime > 0 ? Math.max(0, 30 - (perf.averageResponseTime / 1000)) : 15;
        score += Math.min(responseTimeScore, 30);
      } else {
        // 没有性能数据，给予中等评分
        score += 35;
      }
      
      return { modelId, score };
    });
    
    // 按评分降序排序
    scoredModels.sort((a, b) => b.score - a.score);
    
    // 返回评分最高的模型
    return scoredModels[0]?.modelId || null;
  }
  
  /**
   * 添加消息到历史记录
   */
  private addToHistory(message: Message): void {
    const session = this.getCurrentSession();
    if (session) {
      session.messages.push(message);
      session.updatedAt = Date.now();
      this.saveSessions();
    }
  }
  
  /**
   * 基础模型调用方法（需要根据实际API实现）
   */
  private async callKimi(prompt: string, options: any): Promise<string> {
    throw new Error('Kimi API 调用未实现');
  }
  
  private async callDeepseek(prompt: string, options: any): Promise<string> {
    throw new Error('Deepseek API 调用未实现');
  }
  
  private async callDoubao(prompt: string, options: any): Promise<string> {
    throw new Error('Doubao API 调用未实现');
  }
  
  private async callQwen(prompt: string, options: any): Promise<string> {
    throw new Error('Qwen API 调用未实现');
  }
  
  private async callWenxin(prompt: string, options: any): Promise<string> {
    throw new Error('Wenxin API 调用未实现');
  }
  
  private async callChatGPT(prompt: string, options: any): Promise<string> {
    throw new Error('ChatGPT API 调用未实现');
  }
  
  private async callGemini(prompt: string, options: any): Promise<string> {
    throw new Error('Gemini API 调用未实现');
  }
  
  private async callGork(prompt: string, options: any): Promise<string> {
    throw new Error('Gork API 调用未实现');
  }
  
  private async callZhipu(prompt: string, options: any): Promise<string> {
    throw new Error('Zhipu API 调用未实现');
  }
  
  /**
   * 获取模型调用失败时的回退响应
   */
  private getFallbackResponse(modelId: string, errorMessage: string): string {
    // 详细的错误类型分析
    const isNetworkError = errorMessage.includes('fetch failed') || errorMessage.includes('Request timed out') || errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED');
    const isAuthError = errorMessage.includes('invalid_iam_token') || errorMessage.includes('Invalid API key') || errorMessage.includes('authentication failed') || errorMessage.includes('Unauthorized');
    const isQuotaExceeded = errorMessage.includes('QUOTA_EXCEEDED') || errorMessage.includes('quota') || errorMessage.includes('limit') || errorMessage.includes('429');
    const isApiError = errorMessage.includes('API error') || errorMessage.includes('HTTP 5');
    
    // 统一的错误处理逻辑
    const baseErrorMsg = `${this.currentModel.name}接口调用失败，`;
    
    switch (modelId) {
      case 'kimi':
        if (isNetworkError) {
          return `${baseErrorMsg}可能是网络连接问题或API服务异常，请检查网络设置或稍后重试。错误详情：${errorMessage}`;
        } else if (isAuthError) {
          return `${baseErrorMsg}API密钥无效或未配置，请确保在设置中配置了正确的Kimi API密钥。错误详情：${errorMessage}`;
        } else if (isQuotaExceeded) {
          return `${baseErrorMsg}API请求配额已用完，请检查账号配额或稍后重试。错误详情：${errorMessage}`;
        }
        return `${baseErrorMsg}返回模拟响应。错误详情：${errorMessage}`;
      
      case 'deepseek':
        if (isNetworkError) {
          return `${baseErrorMsg}可能是网络连接问题或API服务异常，请检查网络设置或稍后重试。错误详情：${errorMessage}`;
        } else if (isAuthError) {
          return `${baseErrorMsg}API密钥无效或未配置，请确保在设置中配置了正确的DeepSeek API密钥。错误详情：${errorMessage}`;
        }
        return `${baseErrorMsg}返回模拟响应。错误详情：${errorMessage}`;
      
      case 'wenxinyiyan':
        if (isAuthError) {
          return `${baseErrorMsg}鉴权失败，请确保 .env.local 中设置了正确的 QIANFAN_ACCESS_TOKEN（或 QIANFAN_AK/QIANFAN_SK）。注意：bce-v3 格式的密钥不适用于 chat 接口。错误详情：${errorMessage}`;
        } else if (isQuotaExceeded) {
          return `${baseErrorMsg}百度千帆API免费额度已用完，请检查账号配额或购买付费套餐。错误详情：${errorMessage}`;
        }
        return `${baseErrorMsg}请检查API配置后重试。错误详情：${errorMessage}`;
      
      case 'doubao':
        if (isNetworkError) {
          return `${baseErrorMsg}可能是网络连接问题或API服务异常，请检查网络设置或稍后重试。错误详情：${errorMessage}`;
        } else if (isAuthError) {
          return `${baseErrorMsg}API密钥无效或未配置，请确保在设置中配置了正确的豆包API密钥。错误详情：${errorMessage}`;
        }
        return `${baseErrorMsg}请检查API配置后重试。错误详情：${errorMessage}`;
      
      case 'qwen':
        if (isNetworkError) {
          return `${baseErrorMsg}可能是网络连接问题或API服务异常，请检查网络设置或稍后重试。错误详情：${errorMessage}`;
        } else if (isAuthError) {
          return `${baseErrorMsg}API密钥无效或未配置，请在 .env.local 设置 DASHSCOPE_API_KEY 后重试。错误详情：${errorMessage}`;
        } else if (isQuotaExceeded) {
          return `${baseErrorMsg}API请求配额已用完，请检查阿里云DashScope账号配额。错误详情：${errorMessage}`;
        }
        return `${baseErrorMsg}请检查API配置后重试。错误详情：${errorMessage}`;
      
      case 'chatgpt':
        if (isNetworkError) {
          return `${baseErrorMsg}网络连接失败，可能是国内访问限制导致。请检查网络设置（如VPN）或尝试使用其他模型。错误详情：${errorMessage}`;
        } else if (isAuthError) {
          return `${baseErrorMsg}API密钥无效或未配置，请确保在设置中配置了正确的OpenAI API密钥。错误详情：${errorMessage}`;
        }
        return `${baseErrorMsg}请检查API配置后重试。错误详情：${errorMessage}`;
      
      case 'gemini':
        if (isNetworkError) {
          return `${baseErrorMsg}网络连接失败，可能是国内访问限制导致。请检查网络设置（如VPN）或尝试使用其他模型。错误详情：${errorMessage}`;
        } else if (isAuthError) {
          return `${baseErrorMsg}API密钥无效或未配置，请确保在设置中配置了正确的Google Gemini API密钥。错误详情：${errorMessage}`;
        }
        return `${baseErrorMsg}请检查API配置后重试。错误详情：${errorMessage}`;
      
      case 'gork':
        if (isNetworkError) {
          return `${baseErrorMsg}网络连接失败，可能是国内访问限制导致。请检查网络设置（如VPN）或尝试使用其他模型。错误详情：${errorMessage}`;
        } else if (isAuthError) {
          return `${baseErrorMsg}API密钥无效或未配置，请确保在设置中配置了正确的Gork API密钥。错误详情：${errorMessage}`;
        }
        return `${baseErrorMsg}请检查API配置后重试。错误详情：${errorMessage}`;
      
      case 'zhipu':
        if (isNetworkError) {
          return `${baseErrorMsg}可能是网络连接问题或API服务异常，请检查网络设置或稍后重试。错误详情：${errorMessage}`;
        } else if (isAuthError) {
          return `${baseErrorMsg}API密钥无效或未配置，请确保在设置中配置了正确的智谱API密钥。错误详情：${errorMessage}`;
        }
        return `${baseErrorMsg}请检查API配置后重试。错误详情：${errorMessage}`;
      
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
    const apiBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || '';
    const useProxy = !!apiBase;
    
    // 1. 检查当前模型是否已配置且可用
    const currentModel = this.getCurrentModel();
    const hasValidKey = this.hasValidApiKey(currentModel.id, useProxy);
    
    if (hasValidKey) {
      try {
        const status = await this.checkConnectionStatus(currentModel.id);
        if (status === 'connected') {
          return currentModel.id;
        }
      } catch (error) {
        console.warn(`当前模型 ${currentModel.id} 不可用，尝试其他模型: ${error}`);
      }
    }
    
    // 2. 如果当前模型不可用，按优先级选择已配置的模型
    const availableModels = AVAILABLE_MODELS.filter(model => {
      return this.hasValidApiKey(model.id, useProxy) && 
             localStorage.getItem(`${model.id.toUpperCase()}_QUOTA_EXCEEDED`) !== 'true';
    });
    
    // 按优先级排序：首选列表 > 默认模型 > 其他模型
    const sortedModels = [...availableModels].sort((a, b) => {
      // 检查是否在首选列表中
      const aIsPreferred = preferred.includes(a.id);
      const bIsPreferred = preferred.includes(b.id);
      
      if (aIsPreferred && !bIsPreferred) return -1;
      if (!aIsPreferred && bIsPreferred) return 1;
      
      // 如果都在或都不在首选列表，检查是否是默认模型
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      
      // 最后按ID排序，确保一致性
      return a.id.localeCompare(b.id);
    });
    
    // 3. 检查并返回第一个可用模型
    for (const model of sortedModels) {
      try {
        const status = await this.checkConnectionStatus(model.id);
        if (status === 'connected') {
          this.setCurrentModel(model.id, true);
          return model.id;
        }
      } catch (error) {
        console.warn(`模型 ${model.id} 不可用: ${error}`);
      }
    }
    
    // 4. 如果没有可用模型，返回当前模型（即使可能不可用）
    return currentModel.id;
  }
  
  /**
   * 检查模型是否有有效的API密钥
   */
  private hasValidApiKey(modelId: string, useProxy: boolean): boolean {
    if (useProxy) {
      return true; // 代理模式下，假设所有模型都已配置
    } else {
      const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[`VITE_${modelId.toUpperCase()}_API_KEY`]) || '';
      const storedKey = localStorage.getItem(`${modelId.toUpperCase()}_API_KEY`) || '';
      return !!(storedKey || envKey);
    }
  }
}

/**
 * LLM服务实例
 */
export const llmService = new LLMService();

// 同时添加默认导出，兼容旧的导入方式
export default llmService;