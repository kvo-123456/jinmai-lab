type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions<TBody> {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: TBody
  timeoutMs?: number
  retries?: number
}

interface ApiResponse<T> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

const DEFAULT_TIMEOUT = 10000
const DEFAULT_RETRIES = 1

const getBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined
  if (envUrl && envUrl.trim()) return envUrl
  // 中文注释：自动判断本地开发环境（localhost/127.0.0.1/file协议），统一指向本地服务端 3001
  try {
    const w = typeof window !== 'undefined' ? window : undefined
    if (w) {
      const { protocol, hostname, port } = w.location
      const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
      const isFile = protocol === 'file:'
      const isDev = isLocalHost || isFile
      // 中文注释：当前端端口不是 3001（避免自指），使用后端端口 3001
      if (isDev && port !== '3001') return 'http://localhost:3001'
    }
  } catch {}
  // 中文注释：默认返回空字符串，使用相对路径（生产环境由同源后端提供路由）
  return ''
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: any
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs)
  })
  try {
    const result = await Promise.race([promise, timeoutPromise])
    clearTimeout(timeoutId)
    return result as T
  } catch (e) {
    clearTimeout(timeoutId)
    throw e
  }
}

export async function apiRequest<TResp, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {}
): Promise<ApiResponse<TResp>> {
  const base = getBaseUrl()
  const url = base ? `${base}${path}` : path
  const altUrl = path
  const method = options.method || 'GET'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT
  const retries = options.retries ?? DEFAULT_RETRIES

  let attempt = 0
  let fallbackTried = false
  while (attempt <= retries) {
    try {
      const target = base && fallbackTried ? altUrl : url
      const fetchPromise = fetch(target, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })
      const res = await withTimeout(fetchPromise, timeoutMs)
      const contentType = res.headers.get('content-type') || ''
      const isJson = contentType.includes('application/json')
      const data = isJson ? await res.json() : (await res.text()) as any
      if (!res.ok) {
        const message = (data && (data.message || data.error)) || `HTTP ${res.status}`
        return { ok: false, status: res.status, error: message }
      }
      return { ok: true, status: res.status, data }
    } catch (err: any) {
      if (base && !fallbackTried) {
        fallbackTried = true
        continue
      }
      attempt++
      if (attempt > retries) {
        return { ok: false, status: 0, error: err?.message || 'NETWORK_ERROR' }
      }
      await sleep(300)
    }
  }
  return { ok: false, status: 0, error: 'UNKNOWN_ERROR' }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions<never>) => apiRequest<T, never>(path, { ...options, method: 'GET' }),
  post: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'POST', body }),
  put: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'PUT', body }),
  patch: <T, B = unknown>(path: string, body?: B, options?: RequestOptions<B>) => apiRequest<T, B>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions<never>) => apiRequest<T, never>(path, { ...options, method: 'DELETE' }),
}

export default apiClient
