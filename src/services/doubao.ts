import apiClient from '@/lib/apiClient'

export type DoubaoGenerateParams = {
  prompt: string
  size?: string
  n?: number
  seed?: number
  guidance_scale?: number
  response_format?: 'url' | 'b64_json'
  watermark?: boolean
  model?: string
  // 新增高级配置参数
  steps?: number
  style?: string
  negative_prompt?: string
  aspect_ratio?: string
  quality?: 'standard' | 'hd' | 'uhd'
  enable_style_optimization?: boolean
  reference_image?: string
  reference_strength?: number
  color_palette?: string[]
  composition_guidance?: string
  detail_level?: 'low' | 'medium' | 'high'
}

export type DoubaoGenerateResponse = {
  ok: boolean
  data?: any
  error?: string
}

export async function generateImage(params: DoubaoGenerateParams): Promise<DoubaoGenerateResponse> {
  const resp = await apiClient.post<DoubaoGenerateResponse, DoubaoGenerateParams>('/api/doubao/images/generate', params, { retries: 1, timeoutMs: 20000 })
  if (!resp.ok) return { ok: false, error: resp.error }
  return resp.data as DoubaoGenerateResponse
}

export type DoubaoMessageContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }
  | { type: 'audio_url'; audio_url: { url: string; format?: 'mp3' | 'wav' | 'ogg' } }
  | { type: 'video_url'; video_url: { url: string; format?: 'mp4' | 'avi' | 'mov' } }
  | { type: 'file_url'; file_url: { url: string; format?: string } }
  | { type: 'code'; code: string; language?: string }

export type DoubaoMessage = {
  role: 'system' | 'user' | 'assistant'
  content: DoubaoMessageContent[]
}

export type DoubaoChatParams = {
  model?: string
  messages: DoubaoMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
  stream?: boolean
  // 新增高级配置参数
  presence_penalty?: number
  frequency_penalty?: number
  stop?: string[]
  seed?: number
  response_format?: {
    type: 'text' | 'json_object'
  }
  tools?: Array<{
    type: 'function'
    function: {
      name: string
      description: string
      parameters: Record<string, any>
    }
  }>
  tool_choice?: 'none' | 'auto' | {
    type: 'function'
    function: {
      name: string
    }
  }
  user_id?: string
  enable_search?: boolean
  enable_citation?: boolean
  system_prompt?: string
  context_window?: number
  enable_memory?: boolean
  memory_window?: number
}

export type DoubaoChatResponse = {
  ok: boolean
  data?: any
  error?: string
}

export async function chatCompletions(params: DoubaoChatParams): Promise<DoubaoChatResponse> {
  const resp = await apiClient.post<DoubaoChatResponse, DoubaoChatParams>('/api/doubao/chat/completions', params, { retries: 1, timeoutMs: 20000 })
  if (!resp.ok) return { ok: false, error: resp.error }
  return resp.data as DoubaoChatResponse
}

export default { generateImage, chatCompletions }

export type DoubaoVideoContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } }

export type DoubaoVideoCreateParams = {
  model?: string
  content: DoubaoVideoContent[]
  // 新增视频生成高级配置
  duration?: number
  resolution?: '720p' | '1080p' | '4k'
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3'
  fps?: 24 | 30 | 60
  style?: string
  music?: {
    type: 'default' | 'custom'
    url?: string
    volume?: number
  }
  seed?: number
  guidance_scale?: number
  negative_prompt?: string
  enable_style_optimization?: boolean
  reference_video?: string
  reference_strength?: number
  motion_intensity?: 'low' | 'medium' | 'high'
  enable_subtitles?: boolean
  language?: string
  watermark?: boolean
  user_id?: string
}

export type DoubaoVideoTaskCreateResponse = {
  ok: boolean
  data?: { id: string; status: string }
  error?: string
}

export type DoubaoVideoTaskGetResponse = {
  ok: boolean
  data?: {
    id: string
    model: string
    status: string
    content?: { video_url?: string; last_frame_url?: string }
    usage?: { completion_tokens?: number; total_tokens?: number }
    created_at?: number
    updated_at?: number
    error?: { code?: string; message?: string } | null
  }
  error?: string
}

export async function createVideoTask(params: DoubaoVideoCreateParams): Promise<DoubaoVideoTaskCreateResponse> {
  const resp = await apiClient.post<DoubaoVideoTaskCreateResponse, DoubaoVideoCreateParams>('/api/doubao/videos/tasks', params, { retries: 1, timeoutMs: 20000 })
  if (!resp.ok) return { ok: false, error: resp.error }
  return resp.data as DoubaoVideoTaskCreateResponse
}

export async function getVideoTask(taskId: string): Promise<DoubaoVideoTaskGetResponse> {
  const resp = await apiClient.get<DoubaoVideoTaskGetResponse>(`/api/doubao/videos/tasks/${taskId}`, { retries: 1, timeoutMs: 20000 })
  if (!resp.ok) return { ok: false, error: resp.error }
  return resp.data as DoubaoVideoTaskGetResponse
}

export async function pollVideoTask(
  taskId: string, 
  opts?: { 
    intervalMs?: number; 
    timeoutMs?: number;
    onProgress?: (status: string, progress?: number) => void;
  }
): Promise<DoubaoVideoTaskGetResponse> {
  const intervalMs = opts?.intervalMs ?? 10000
  const timeoutMs = opts?.timeoutMs ?? 600000
  const start = Date.now()
  
  while (Date.now() - start < timeoutMs) {
    const r = await getVideoTask(taskId)
    if (!r.ok) return r
    
    const status = r.data?.status
    // 调用进度回调
    if (opts?.onProgress) {
      // 根据状态估算进度
      let progress = 0
      switch (status) {
        case 'pending':
          progress = 10
          break
        case 'running':
          progress = 50
          break
        case 'succeeded':
          progress = 100
          break
        case 'failed':
        case 'cancelled':
          progress = 100
          break
        default:
          progress = 0
      }
      opts.onProgress(status || 'unknown', progress)
    }
    
    if (status === 'succeeded' || status === 'failed' || status === 'cancelled') {
      return r
    }
    
    await new Promise((res) => setTimeout(res, intervalMs))
  }
  
  return { ok: false, error: 'TIMEOUT' }
}

/**
 * 取消视频生成任务
 */
export async function cancelVideoTask(taskId: string): Promise<DoubaoVideoTaskGetResponse> {
  const resp = await apiClient.post<DoubaoVideoTaskGetResponse, {}>(
    `/api/doubao/videos/tasks/${taskId}/cancel`, 
    {}, 
    { retries: 1, timeoutMs: 20000 }
  )
  if (!resp.ok) return { ok: false, error: resp.error }
  return resp.data as DoubaoVideoTaskGetResponse
}

/**
 * 获取视频任务列表
 */
export async function listVideoTasks(
  params?: { 
    limit?: number; 
    offset?: number; 
    status?: string;
    user_id?: string;
  }
): Promise<{
  ok: boolean;
  data?: {
    tasks: DoubaoVideoTaskGetResponse['data'][];
    total: number;
  };
  error?: string;
}> {
  const queryParams = new URLSearchParams()
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.offset) queryParams.append('offset', params.offset.toString())
  if (params?.status) queryParams.append('status', params.status)
  if (params?.user_id) queryParams.append('user_id', params.user_id)
  
  const resp = await apiClient.get<{
    ok: boolean;
    data?: {
      tasks: DoubaoVideoTaskGetResponse['data'][];
      total: number;
    };
    error?: string;
  }>(
    `/api/doubao/videos/tasks?${queryParams.toString()}`, 
    { retries: 1, timeoutMs: 20000 }
  )
  
  if (!resp.ok) return { ok: false, error: resp.error }
  return resp.data as any
}

/**
 * 下载生成的视频
 */
export async function downloadVideo(videoUrl: string, filename?: string): Promise<{
  ok: boolean;
  data?: Blob;
  error?: string;
}> {
  try {
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const blob = await response.blob()
    
    // 如果提供了文件名，自动下载
    if (filename && typeof window !== 'undefined') {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
    
    return { ok: true, data: blob }
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Failed to download video'
    }
  }
}

/**
 * 获取视频生成状态的友好描述
 */
export function getVideoStatusDescription(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': '视频生成任务已提交，正在排队等待处理',
    'running': '视频生成中，请耐心等待',
    'succeeded': '视频生成成功',
    'failed': '视频生成失败',
    'cancelled': '视频生成任务已取消'
  }
  return statusMap[status] || `未知状态: ${status}`
}

// 多模态辅助函数
export const createTextContent = (text: string): DoubaoMessageContent => {
  return { type: 'text', text };
};

export const createImageContent = (url: string, detail: 'low' | 'high' | 'auto' = 'auto'): DoubaoMessageContent => {
  return { type: 'image_url', image_url: { url, detail } };
};

export const createAudioContent = (url: string, format?: 'mp3' | 'wav' | 'ogg'): DoubaoMessageContent => {
  return { type: 'audio_url', audio_url: { url, format } };
};

export const createVideoContent = (url: string, format?: 'mp4' | 'avi' | 'mov'): DoubaoMessageContent => {
  return { type: 'video_url', video_url: { url, format } };
};

export const createFileContent = (url: string, format?: string): DoubaoMessageContent => {
  return { type: 'file_url', file_url: { url, format } };
};

export const createCodeContent = (code: string, language?: string): DoubaoMessageContent => {
  return { type: 'code', code, language };
};

export const createUserMessage = (content: DoubaoMessageContent[]): DoubaoMessage => {
  return { role: 'user', content };
};

export const createAssistantMessage = (content: DoubaoMessageContent[]): DoubaoMessage => {
  return { role: 'assistant', content };
};

export const createSystemMessage = (content: string): DoubaoMessage => {
  return { role: 'system', content: [{ type: 'text', text: content }] };
};

export const video = { 
  createVideoTask, 
  getVideoTask, 
  pollVideoTask,
  cancelVideoTask,
  listVideoTasks,
  downloadVideo,
  getStatusDescription: getVideoStatusDescription
}
