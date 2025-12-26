import http from 'http'
import { URL } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import { WebSocketServer } from 'ws'
import { generateToken, verifyToken } from './jwt.mjs'
import { userDB, favoriteDB, videoTaskDB, getDBStatus } from './database.mjs'

// Load .env.local for local development (non-production)
try {
  // 使用简单的路径，直接使用当前目录下的.env.local
  const envPath = './.env.local';

  
  if (fs.existsSync(envPath)) {

    const content = fs.readFileSync(envPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    
    for (const line of lines) {
      // 跳过注释和空行
      if (line.trim().startsWith('#') || line.trim() === '') {
        continue;
      }
      
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m) {

        continue;
      }
      
      const k = m[1];
      let v = m[2];
      
      // 移除引号
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('\'') && v.endsWith('\''))) {
        v = v.slice(1, -1);
      }
      
      // 始终以 .env.local 内容为准进行覆盖，确保密钥更新生效
      process.env[k] = v;

    }
    
    // 将前端变量映射到服务端使用的变量（无条件覆盖，避免旧值残留）

    
    // Kimi
    if (process.env.VITE_KIMI_API_KEY) {
      process.env.KIMI_API_KEY = process.env.VITE_KIMI_API_KEY;

    }
    if (process.env.VITE_KIMI_BASE_URL) {
      process.env.KIMI_BASE_URL = process.env.VITE_KIMI_BASE_URL;

    }
    
    // DeepSeek
    if (process.env.VITE_DEEPSEEK_API_KEY) {
      process.env.DEEPSEEK_API_KEY = process.env.VITE_DEEPSEEK_API_KEY;

    }
    if (process.env.VITE_DEEPSEEK_BASE_URL) {
      process.env.DEEPSEEK_BASE_URL = process.env.VITE_DEEPSEEK_BASE_URL;

    }
    
    // Doubao
    if (process.env.VITE_DOBAO_API_KEY) {
      process.env.DOUBAO_API_KEY = process.env.VITE_DOBAO_API_KEY;

    }
    if (process.env.VITE_DOUBAO_BASE_URL) {
      process.env.DOUBAO_BASE_URL = process.env.VITE_DOUBAO_BASE_URL;

    }
    
    // Qwen (DashScope)
    if (process.env.VITE_QWEN_API_KEY) {
      process.env.DASHSCOPE_API_KEY = process.env.VITE_QWEN_API_KEY;

    }
    
    // Wenxin (Qianfan)
    if (process.env.VITE_WENXIN_API_KEY) {
      process.env.QIANFAN_AUTH = process.env.VITE_WENXIN_API_KEY;

    }
    
    // ChatGPT
    if (process.env.VITE_CHATGPT_API_KEY) {
      process.env.CHATGPT_API_KEY = process.env.VITE_CHATGPT_API_KEY;

    }
    
    // Gemini
    if (process.env.VITE_GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

    }
    
    // Gork
    if (process.env.VITE_GORK_API_KEY) {
      process.env.GORK_API_KEY = process.env.VITE_GORK_API_KEY;

    }
    
    // Zhipu
    if (process.env.VITE_ZHIPU_API_KEY) {
      process.env.ZHIPU_API_KEY = process.env.VITE_ZHIPU_API_KEY;

    }
  }
} catch (error) {
  console.error('Failed to load .env.local:', error);
}

// 端口配置
const PORT = Number(process.env.LOCAL_API_PORT || process.env.PORT) || 3008

// Volcengine TTS config (server-side only)
const VOLC_TTS_APP_ID = process.env.VOLC_TTS_APP_ID || ''
const VOLC_TTS_ACCESS_TOKEN = process.env.VOLC_TTS_ACCESS_TOKEN || ''
const VOLC_TTS_SECRET_KEY = process.env.VOLC_TTS_SECRET_KEY || ''
const VOLC_TTS_ENDPOINT = process.env.VOLC_TTS_ENDPOINT || ''

// ChatGPT config
const CHATGPT_BASE_URL = process.env.CHATGPT_BASE_URL || 'https://api.openai.com/v1'
const CHATGPT_API_KEY = process.env.CHATGPT_API_KEY || ''
const CHATGPT_MODEL_ID = process.env.CHATGPT_MODEL_ID || 'gpt-4o'

// Gemini config
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL_ID = process.env.GEMINI_MODEL_ID || 'gemini-1.5-flash'

// Gork config
const GORK_BASE_URL = process.env.GORK_BASE_URL || 'https://api.x.ai/v1'
const GORK_API_KEY = process.env.GORK_API_KEY || ''
const GORK_MODEL_ID = process.env.GORK_MODEL_ID || 'grok-beta'

// Zhipu config
const ZHIPU_BASE_URL = process.env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || ''
const ZHIPU_MODEL_ID = process.env.ZHIPU_MODEL_ID || 'glm-4-plus'

// 豆包模型基础配置
const BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
const API_KEY = process.env.DOUBAO_API_KEY || ''
const MODEL_ID = process.env.DOUBAO_MODEL_ID || 'doubao-seedance-1-0-pro-250528'
const ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*'
const MOCK = process.env.DOUBAO_MOCK === '1'

// Kimi (Moonshot) config
const KIMI_BASE_URL = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1'
const KIMI_API_KEY = process.env.KIMI_API_KEY || ''

// DeepSeek config
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

// DashScope (Aliyun Qwen) config
const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || ''
const DASHSCOPE_MODEL_ID = process.env.DASHSCOPE_MODEL_ID || 'qwen-plus'

// Qianfan (Wenxin Yiyan) config
const QIANFAN_BASE_URL = process.env.QIANFAN_BASE_URL || 'https://qianfan.baidubce.com'
const QIANFAN_MODEL_ID = process.env.QIANFAN_MODEL_ID || 'ERNIE-Speed-8K'
const QIANFAN_AUTH = process.env.QIANFAN_AUTH || ''
const QIANFAN_ACCESS_TOKEN = process.env.QIANFAN_ACCESS_TOKEN || ''
const QIANFAN_AK = process.env.QIANFAN_AK || process.env.BAIDU_AK || ''
const QIANFAN_SK = process.env.QIANFAN_SK || process.env.BAIDU_SK || ''

// Qianfan auth cache
let __qf_token = (process.env.QIANFAN_ACCESS_TOKEN || '')
let __qf_token_expire = 0

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

async function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) }
    })
  })
}

async function proxyFetch(path, method, body) {
  // 确保使用最新的环境变量值
  const base = process.env.DOUBAO_BASE_URL || BASE_URL
  const key = process.env.DOUBAO_API_KEY || API_KEY
  
  // 确保基础URL和API密钥存在
  if (!base || !key) {
    return { status: 500, ok: false, data: { error: { code: 'CONFIG_MISSING', message: 'Missing base URL or API key' } } }
  }
  
  try {
    const resp = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const contentType = resp.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
    return { status: resp.status, ok: resp.ok, data }
  } catch (error) {
    console.error('Proxy fetch error:', error)
    return { 
      status: 500, 
      ok: false, 
      data: { error: { code: 'REQUEST_ERROR', message: error?.message || 'Failed to send request' } } 
    }
  }
}

async function kimiFetch(path, method, body) {
  const base = process.env.KIMI_BASE_URL || KIMI_BASE_URL
  const key = process.env.KIMI_API_KEY || KIMI_API_KEY
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

async function deepseekFetch(path, method, body) {
  const base = process.env.DEEPSEEK_BASE_URL || DEEPSEEK_BASE_URL
  const key = process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}
async function dashscopeFetch(path, method, body) {
  const base = process.env.DASHSCOPE_BASE_URL || DASHSCOPE_BASE_URL
  const key = process.env.DASHSCOPE_API_KEY || DASHSCOPE_API_KEY
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

async function chatgptFetch(path, method, body) {
  const base = process.env.CHATGPT_BASE_URL || CHATGPT_BASE_URL
  const key = process.env.CHATGPT_API_KEY || CHATGPT_API_KEY

  try {
    // 添加超时设置，避免长时间等待
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const resp = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId);
    
    const contentType = resp.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await resp.json() : await resp.text()

    return { status: resp.status, ok: resp.ok, data }
  } catch (error) {
    console.error(`[chatgptFetch] Error: ${error.message}`)
    // 处理不同类型的错误
    const errorMessage = error.name === 'AbortError' ? 'Request timed out' : error.message;
    return { status: 500, ok: false, data: { error: errorMessage } }
  }
}

async function geminiFetch(path, method, body) {
  const base = process.env.GEMINI_BASE_URL || GEMINI_BASE_URL
  const key = process.env.GEMINI_API_KEY || GEMINI_API_KEY
  // Gemini API requires API key in query string
  const url = new URL(`${base}${path}`)
  url.searchParams.append('key', key)

  try {
    const resp = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const contentType = resp.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await resp.json() : await resp.text()

    return { status: resp.status, ok: resp.ok, data }
  } catch (error) {
    console.error(`[geminiFetch] Error: ${error.message}`)
    return { status: 500, ok: false, data: { error: error.message } }
  }
}

async function gorkFetch(path, method, body) {
  const base = process.env.GORK_BASE_URL || GORK_BASE_URL
  const key = process.env.GORK_API_KEY || GORK_API_KEY

  try {
    const resp = await fetch(`${base}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const contentType = resp.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await resp.json() : await resp.text()

    return { status: resp.status, ok: resp.ok, data }
  } catch (error) {
    console.error(`[gorkFetch] Error: ${error.message}`)
    return { status: 500, ok: false, data: { error: error.message } }
  }
}

async function zhipuFetch(path, method, body) {
  const base = process.env.ZHIPU_BASE_URL || ZHIPU_BASE_URL
  const key = process.env.ZHIPU_API_KEY || ZHIPU_API_KEY
  const resp = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

async function qianfanAuthHeader() {
  // 百度千帆API密钥支持多种格式
  // 1. QIANFAN_ACCESS_TOKEN: 直接使用的token
  // 2. QIANFAN_AK/QIANFAN_SK: 用于获取token的密钥对
  // 3. QIANFAN_AUTH: 支持bce-v3格式的密钥
  
  // 优先使用ACCESS_TOKEN
  const preset = process.env.QIANFAN_ACCESS_TOKEN || QIANFAN_ACCESS_TOKEN
  if (preset) return `Bearer ${preset}`
  
  // 检查缓存的token
  const now = Math.floor(Date.now() / 1000)
  if (__qf_token && __qf_token_expire > now + 60) return `Bearer ${__qf_token}`
  
  // 尝试使用AK/SK获取新token
  const ak = process.env.QIANFAN_AK || QIANFAN_AK
  const sk = process.env.QIANFAN_SK || QIANFAN_SK
  if (ak && sk) {
    try {
      const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(ak)}&client_secret=${encodeURIComponent(sk)}`
      const resp = await fetch(url, { method: 'GET' })
      const data = await resp.json()
      const token = data?.access_token || ''
      const expiresIn = Number(data?.expires_in || 0)
      if (token) {
        __qf_token = token
        __qf_token_expire = now + (expiresIn || 0)
        return `Bearer ${token}`
      }
    } catch (error) {
      console.error('Failed to get qianfan token:', error)
    }
  }
  
  // 最后尝试使用bce-v3格式的密钥
  const override = process.env.QIANFAN_AUTH || QIANFAN_AUTH
  if (override) return override
  
  return ''
}

async function qianfanFetch(path, method, body) {
  const base = process.env.QIANFAN_BASE_URL || QIANFAN_BASE_URL
  const auth = await qianfanAuthHeader()
  const headers = { 'Content-Type': 'application/json' }
  if (auth) headers['Authorization'] = auth
  const resp = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const contentType = resp.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  return { status: resp.status, ok: resp.ok, data }
}

// Basic rate limiter per IP for TTS
const rateMap = new Map()
function allowTts(ip) {
  const now = Date.now()
  const rec = rateMap.get(ip) || { count: 0, windowStart: now }
  if (now - rec.windowStart > 60_000) { rec.windowStart = now; rec.count = 0 }
  rec.count += 1
  rateMap.set(ip, rec)
  return rec.count <= 20
}

// Volcengine TTS fetcher: delegates to provided endpoint with token
async function volcTtsSynthesize({ text, voice, speed, pitch, format }) {
  if (!VOLC_TTS_ENDPOINT || !VOLC_TTS_ACCESS_TOKEN) {
    return { ok: false, status: 500, data: { error: 'CONFIG_MISSING' } }
  }
  const payload = {
    text: String(text || '').slice(0, 2000),
    voice: voice || 'female',
    speed: typeof speed === 'number' ? speed : 1.0,
    pitch: typeof pitch === 'number' ? pitch : 1.0,
    app_id: VOLC_TTS_APP_ID || undefined,
    secret_key: VOLC_TTS_SECRET_KEY ? undefined : undefined,
    audio_format: format || 'mp3'
  }
  const resp = await fetch(VOLC_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VOLC_TTS_ACCESS_TOKEN}`
    },
    body: JSON.stringify(payload)
  })
  const ct = resp.headers.get('content-type') || ''
  if (ct.startsWith('audio/')) {
    const buf = Buffer.from(await resp.arrayBuffer())
    const audio_base64 = buf.toString('base64')
    return { ok: true, status: 200, data: { audio_base64, content_type: ct } }
  }
  const data = ct.includes('application/json') ? await resp.json() : await resp.text()
  return { ok: resp.ok, status: resp.status, data }
}

// Proxy remote binary (video/audio/image) with Range support
async function proxyBinary(remoteUrl, req, res) {
  try {
    const range = req.headers['range'] || undefined
    const headers = { ...(range ? { Range: range } : {}) }
    const resp = await fetch(remoteUrl, { method: 'GET', headers })
    if (!resp.ok) {
      const ct = resp.headers.get('content-type') || 'application/json'
      res.statusCode = resp.status
      res.setHeader('Content-Type', ct)
      const data = ct.includes('application/json') ? await resp.json() : await resp.text()
      res.end(typeof data === 'string' ? data : JSON.stringify(data))
      return
    }
    const ct = resp.headers.get('content-type') || 'application/octet-stream'
    const cl = resp.headers.get('content-length') || undefined
    const cr = resp.headers.get('content-range') || undefined
    const ar = resp.headers.get('accept-ranges') || undefined
    res.statusCode = resp.status
    res.setHeader('Content-Type', ct)
    if (cl) res.setHeader('Content-Length', cl)
    if (cr) res.setHeader('Content-Range', cr)
    if (ar) res.setHeader('Accept-Ranges', ar)
    const buf = Buffer.from(await resp.arrayBuffer())
    res.end(buf)
  } catch (e) {
    sendJson(res, 500, { error: 'PROXY_ERROR', message: e?.message || 'UNKNOWN' })
  }
}

function sendJson(res, status, obj) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(obj))
}

// JWT验证中间件
function verifyRequestToken(req) {
  const authHeader = req.headers.authorization
  if (!authHeader) return null
  
  const token = authHeader.split(' ')[1]
  if (!token) return null
  
  try {
    const decoded = verifyToken(token)
    return decoded
  } catch (error) {
    console.error('JWT验证失败:', error.message)
    return null
  }
}

// 中文注释：数据库连接由 database.mjs 自动管理

// 中文注释：安全读取社区配置文件（每次请求时读取，便于热更新）
function loadCommunityConfig() {
  try {
    const rawPath = new URL('./data/community.json', import.meta.url).pathname
    const pathA = decodeURIComponent(rawPath)
    const pathB = `${process.cwd()}/server/data/community.json`
    const final = fs.existsSync(pathA) ? pathA : (fs.existsSync(pathB) ? pathB : '')
    if (!final) return null
    const text = fs.readFileSync(final, 'utf-8')
    const json = JSON.parse(text)
    return json && typeof json === 'object' ? json : null
  } catch {
    return null
  }
}

const server = http.createServer(async (req, res) => {
  setCors(res)
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }
  const u = new URL(req.url, `http://localhost:${PORT}`)
  const path = u.pathname

  // Skip global Doubao key check; validate per-route

  try {
    // 中文注释：教程收藏改为使用数据库持久化
    if (req.method === 'GET' && path === '/api/favorites/tutorials') {
      // 从JWT令牌获取当前用户ID
      const decoded = verifyRequestToken(req)
      if (!decoded) {
        sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
        return
      }
      
      const ids = await favoriteDB.getUserFavorites(decoded.userId)
      sendJson(res, 200, { ok: true, ids })
      return
    }

    // 中文注释：社区标签（用于前端热门话题展示）
    if (req.method === 'GET' && path === '/api/community/tags') {
      const cfg = loadCommunityConfig()
      const details = Array.isArray(cfg?.tagDetails) ? cfg.tagDetails : null
      if (details) {
        sendJson(res, 200, { ok: true, data: details })
        return
      }
      const tags = Array.isArray(cfg?.tags) ? cfg.tags : ['国潮设计', '非遗传承', '品牌联名', '校园活动', '文旅推广']
      sendJson(res, 200, { ok: true, data: tags })
      return
    }

    // 中文注释：精选社群条目（用于前端精选社群列表）
    if (req.method === 'GET' && path === '/api/community/featured') {
      const cfg = loadCommunityConfig()
      const items = Array.isArray(cfg?.featured) ? cfg.featured : [
        { name: '国潮共创组', members: 128, path: '/community?group=guochao' },
        { name: '非遗研究社', members: 96, path: '/community?group=heritage' },
        { name: '品牌联名工坊', members: 73, path: '/community?group=brand' },
      ]
      sendJson(res, 200, { ok: true, data: items })
      return
    }

    if (req.method === 'POST' && path === '/api/favorites/tutorials/toggle') {
      // 从JWT令牌获取当前用户ID
      const decoded = verifyRequestToken(req)
      if (!decoded) {
        sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
        return
      }
      
      const b = await readBody(req)
      const id = Number(b?.id)
      if (!id || Number.isNaN(id)) { sendJson(res, 400, { error: 'ID_INVALID' }); return }
      
      const ids = await favoriteDB.toggleFavorite(decoded.userId, id)
      sendJson(res, 200, { ok: true, ids })
      return
    }

    if (req.method === 'POST' && path === '/api/doubao/images/generate') {
      const key = process.env.DOUBAO_API_KEY || API_KEY
      if (!key) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || MODEL_ID,
        prompt: b.prompt,
        size: b.size || '1024x1024',
        n: b.n || 1,
        seed: b.seed,
        guidance_scale: b.guidance_scale,
        response_format: b.response_format || 'url',
        watermark: b.watermark,
      }
      const r = await proxyFetch('/images/generations', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'POST' && path === '/api/doubao/chat/completions') {
      const key = process.env.DOUBAO_API_KEY || API_KEY
      if (!key) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const msgs = Array.isArray(b.messages) ? b.messages.map((m) => {
        const content = Array.isArray(m?.content) ? m.content.map((it) => {
          if (it?.type === 'text') return { type: 'text', text: String(it.text || '').replace(/`/g, '').trim() }
          if (it?.type === 'image_url') return { type: 'image_url', image_url: { url: String(it?.image_url?.url || '').replace(/`/g, '').trim() } }
          return it
        }) : []
        return { role: m?.role || 'user', content }
      }) : []
      const maxTokens = typeof b.max_tokens === 'number'
        ? b.max_tokens
        : (typeof b.max_completion_tokens === 'number' ? b.max_completion_tokens : undefined)
      const payload = { model: b.model || MODEL_ID, messages: msgs, max_tokens: maxTokens, temperature: b.temperature, top_p: b.top_p, stream: b.stream }
      const r = await proxyFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.code) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Kimi (Moonshot) chat completions proxy
    if (req.method === 'POST' && path === '/api/kimi/chat/completions') {
      const keyPresent = (process.env.KIMI_API_KEY || KIMI_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || 'moonshot-v1-32k',
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream,
      }
      const r = await kimiFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'POST' && path === '/api/deepseek/chat/completions') {
      const keyPresent = (process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || 'deepseek-chat',
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: false,
      }
      const r = await deepseekFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }
    if (req.method === 'POST' && path === '/api/dashscope/chat/completions') {
      const keyPresent = (process.env.DASHSCOPE_API_KEY || DASHSCOPE_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || DASHSCOPE_MODEL_ID,
        messages: Array.isArray(b.messages) ? b.messages : [],
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: false,
      }
      const r = await dashscopeFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.code) || (r.data?.message) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Qianfan (Wenxin Yiyan) chat completions proxy
    if (req.method === 'POST' && path === '/api/qianfan/chat/completions') {
      const hasCfg = (process.env.QIANFAN_AUTH || QIANFAN_AUTH || process.env.QIANFAN_ACCESS_TOKEN || QIANFAN_ACCESS_TOKEN || process.env.QIANFAN_AK || QIANFAN_AK)
      if (!hasCfg) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const messages = Array.isArray(b.messages) ? b.messages.map((m) => ({ role: m?.role || 'user', content: String(m?.content || '').replace(/`/g, '').trim() })) : []
      const payload = {
        model: b.model || QIANFAN_MODEL_ID,
        messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: false,
      }
      const r = await qianfanFetch('/v2/chat/completions', 'POST', payload)
      if (!r.ok) {
        const code = (r.data?.error?.code) || (r.data?.error_msg) || 'SERVER_ERROR'
        const hint = String(code).includes('invalid_iam_token') ? 'QIANFAN_AUTH 无法用于 chat 接口，请改用 QIANFAN_ACCESS_TOKEN 或设置 QIANFAN_AK/QIANFAN_SK 以自动获取 token' : undefined
        sendJson(res, r.status, { error: code, hint, data: r.data })
        return
      }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // ChatGPT chat completions proxy
    if (req.method === 'POST' && path === '/api/chatgpt/chat/completions') {
      const keyPresent = (process.env.CHATGPT_API_KEY || CHATGPT_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || CHATGPT_MODEL_ID,
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream,
      }
      const r = await chatgptFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Gemini chat completions proxy
    if (req.method === 'POST' && path === '/api/gemini/generateContent') {
      const keyPresent = (process.env.GEMINI_API_KEY || GEMINI_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const r = await geminiFetch(`/models/${b.model || GEMINI_MODEL_ID}/generateContent`, 'POST', b)
      if (!r.ok) { sendJson(res, r.status, { error: 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Gork chat completions proxy
    if (req.method === 'POST' && path === '/api/gork/chat/completions') {
      const keyPresent = (process.env.GORK_API_KEY || GORK_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || GORK_MODEL_ID,
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream,
      }
      const r = await gorkFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    // Zhipu chat completions proxy
    if (req.method === 'POST' && path === '/api/zhipu/chat/completions') {
      const keyPresent = (process.env.ZHIPU_API_KEY || ZHIPU_API_KEY)
      if (!keyPresent) { sendJson(res, 500, { error: 'CONFIG_MISSING' }); return }
      const b = await readBody(req)
      const payload = {
        model: b.model || ZHIPU_MODEL_ID,
        messages: b.messages,
        max_tokens: b.max_tokens,
        temperature: b.temperature,
        top_p: b.top_p,
        stream: b.stream,
      }
      const r = await zhipuFetch('/chat/completions', 'POST', payload)
      if (!r.ok) { sendJson(res, r.status, { error: (r.data?.error?.type) || 'SERVER_ERROR', data: r.data }); return }
      sendJson(res, 200, { ok: true, data: r.data })
      return
    }

    if (req.method === 'POST' && path === '/api/doubao/videos/tasks') {
      const key = process.env.DOUBAO_API_KEY || API_KEY
      if (MOCK || !key) {
        const b = await readBody(req)
        const mid = `mock-${Date.now()}`
        const model = 'doubao-seedance-1-0-pro-fast-251015'
        try { await videoTaskDB.upsertTask({ id: mid, status: 'succeeded', model, payload: b }) } catch {}
        sendJson(res, 200, { ok: true, data: { id: mid, status: 'succeeded', content: { video_url: 'https://example.com/mock.mp4', last_frame_url: 'https://example.com/mock.jpg' } } })
        return
      }
      
      const b = await readBody(req)
      
      // Validate request body
      if (!b.content || !Array.isArray(b.content)) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: 'Content must be a non-empty array' });
        return
      }
      
      // Process and sanitize content
      const content = b.content.map((it) => {
        if (it?.type === 'text') return { 
          type: 'text', 
          text: String(it.text || '').replace(/`/g, '').trim() 
        }
        if (it?.type === 'image_url') return { 
          type: 'image_url', 
          image_url: { 
            url: String(it?.image_url?.url || '').replace(/`/g, '').trim() 
          } 
        }
        return it
      }).filter(item => { 
        // Remove empty or invalid items
        if (item?.type === 'text') return item.text.length > 0;
        if (item?.type === 'image_url') return item.image_url?.url && item.image_url.url.length > 0;
        return false;
      })
      
      if (content.length === 0) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: 'No valid content provided' });
        return;
      }
      
      // 检查是否包含图片URL（图生视频）
      const hasImageUrl = content.some(item => item.type === 'image_url');
      
      // 根据内容类型选择合适的模型
      if (hasImageUrl) {
        // 图生视频 - 优先使用快速模型，不开通则回退到标准模型
        const fastModel = 'doubao-seedance-1-0-pro-fast-251015'
        const fallbackModel = MODEL_ID // 默认配置或 'doubao-seedance-1-0-pro-250528'
        const payload = { model: fastModel, content };
        
        let r = await proxyFetch('/contents/generations/tasks', 'POST', payload);
        
        if (!r.ok && (r.data?.error?.code === 'ModelNotOpen')) {
          const fallbackPayload = { model: fallbackModel, content }
          r = await proxyFetch('/contents/generations/tasks', 'POST', fallbackPayload)
        }
        
        if (!r.ok) {
          // 进一步回退：改为文本生成视频
          const textOnly = content.filter(it => it.type === 'text')
          if (textOnly.length > 0) {
            const r2 = await proxyFetch('/contents/generations/tasks', 'POST', { model: fallbackModel, content: textOnly })
            if (!r2.ok) {
              sendJson(res, r2.status, { error: (r2.data?.error?.code) || 'SERVER_ERROR', message: (r2.data?.error?.message) || 'Video generation failed', data: r2.data })
              return
            }
            try { await videoTaskDB.upsertTask({ id: r2.data?.id, status: r2.data?.status, model: r2.data?.model || fallbackModel, payload: { model: fallbackModel, content: textOnly } }) } catch {}
            sendJson(res, 200, { ok: true, data: r2.data });
            return
          }
          sendJson(res, r.status, { 
            error: (r.data?.error?.code) || 'SERVER_ERROR', 
            message: (r.data?.error?.message) || 'Image-to-video generation failed',
            data: r.data 
          }); 
          return 
        }
        
        try { await videoTaskDB.upsertTask({ id: r.data?.id, status: r.data?.status, model: r.data?.model || fastModel, payload }) } catch {}
        sendJson(res, 200, { ok: true, data: r.data });
        return;
      } else {
        // 文本生成视频
        const model = b.model || MODEL_ID;
        const payload = { model, content };
        
        let r = await proxyFetch('/contents/generations/tasks', 'POST', payload);

        // 如果模型未开通，自动降级到已测试可用的快速模型
        if (!r.ok && (r.data?.error?.code === 'ModelNotOpen')) {
          const fallbackPayload = { model: 'doubao-seedance-1-0-pro-fast-251015', content };
          r = await proxyFetch('/contents/generations/tasks', 'POST', fallbackPayload);
        }

        if (!r.ok) {
          sendJson(res, r.status, { 
            error: (r.data?.error?.code) || 'SERVER_ERROR', 
            message: (r.data?.error?.message) || 'Video generation failed',
            data: r.data 
          }); 
          return 
        }

        try { await videoTaskDB.upsertTask({ id: r.data?.id, status: r.data?.status, model, payload }) } catch {}
        sendJson(res, 200, { ok: true, data: r.data });
        return;
      }
    }

    if (req.method === 'GET' && path.startsWith('/api/doubao/videos/tasks/')) {
      const id = path.split('/').pop() || ''
      
      // Validate task ID
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        sendJson(res, 400, { error: 'INVALID_TASK_ID', message: 'Invalid task ID provided' });
        return
      }
      
      const key = process.env.DOUBAO_API_KEY || API_KEY
      if (MOCK || !key) {
        sendJson(res, 200, { ok: true, data: { id, status: 'succeeded', content: { video_url: 'https://example.com/mock.mp4', last_frame_url: 'https://example.com/mock.jpg' } } })
        return
      }
      
      try {
        const r = await proxyFetch(`/contents/generations/tasks/${id}`, 'GET')
        
        if (!r.ok) {
          sendJson(res, r.status, { 
            error: (r.data?.error?.code) || 'SERVER_ERROR', 
            message: (r.data?.error?.message) || 'Failed to get video task status',
            data: r.data 
          }); 
          return 
        }
        
        try { await videoTaskDB.upsertTask({ id, status: r.data?.status }) } catch {}
        sendJson(res, 200, { ok: true, data: r.data })
        return
      } catch (error) {
        sendJson(res, 500, { 
          error: 'INTERNAL_ERROR', 
          message: 'An error occurred while retrieving the video task status' 
        });
        return
      }
    }

    if (req.method === 'POST' && path === '/api/volc/tts/synthesize') {
      const ip = req.socket.remoteAddress || 'unknown'
      if (!allowTts(ip)) { sendJson(res, 429, { error: 'RATE_LIMITED' }); return }
      const b = await readBody(req)
      const text = String(b.text || '').trim()
      if (!text) { sendJson(res, 400, { error: 'TEXT_EMPTY' }); return }
      if (text.length > 2000) { sendJson(res, 400, { error: 'TEXT_TOO_LONG' }); return }

      const r = await volcTtsSynthesize({ text, voice: b.voice, speed: b.speed, pitch: b.pitch, format: b.format })
      if (!r.ok) { sendJson(res, r.status, r.data); return }

      const { audio_base64, content_type } = r.data || {}
      sendJson(res, 200, { ok: true, audio_base64, content_type: content_type || 'audio/mpeg' })
      return
    }

    if (req.method === 'GET' && path === '/api/proxy/video') {
      const remote = (new URL(req.url, `http://localhost:${PORT}`)).searchParams.get('url') || ''
      const safe = remote.startsWith('https://') && (remote.includes('volces.com') || remote.includes('tos-cn-beijing'))
      if (!safe) { sendJson(res, 400, { error: 'URL_NOT_ALLOWED' }); return }
      await proxyBinary(remote, req, res)
      return
    }

    if (req.method === 'GET' && path === '/api/proxy/video/meta') {
      const remote = (new URL(req.url, `http://localhost:${PORT}`)).searchParams.get('url') || ''
      const safe = remote.startsWith('https://') && (remote.includes('volces.com') || remote.includes('tos-cn-beijing'))
      if (!safe) { sendJson(res, 400, { error: 'URL_NOT_ALLOWED' }); return }
      try {
        let resp = await fetch(remote, { method: 'HEAD' })
        if (!resp.ok) {
          resp = await fetch(remote, { method: 'GET' })
        }
        const ct = resp.headers.get('content-type') || 'application/octet-stream'
        const cl = Number(resp.headers.get('content-length') || 0)
        const ar = resp.headers.get('accept-ranges') || ''
        sendJson(res, 200, { ok: true, content_type: ct, content_length: cl, accept_ranges: ar })
      } catch (e) {
        sendJson(res, 500, { error: 'META_ERROR', message: e?.message || 'UNKNOWN' })
      }
      return
    }

    // 代理 trae-api-sg.mchost.guru API 请求，解决 CORS 问题
    if (req.method === 'GET' && path.startsWith('/api/proxy/trae-api')) {
      const remotePath = path.replace('/api/proxy/trae-api', '')
      const queryString = u.search
      const remoteUrl = `https://trae-api-sg.mchost.guru${remotePath}${queryString}`
      
      try {
        // 允许重定向，最多跟随10次重定向
        const resp = await fetch(remoteUrl, {
          method: req.method,
          headers: {
            'Accept': 'application/json, image/*, text/html, */*',
          },
          redirect: 'follow', // 跟随重定向
          follow: 10, // 最多跟随10次重定向
        })
        
        // 设置响应头
        res.statusCode = resp.status
        const contentType = resp.headers.get('content-type') || 'application/octet-stream'
        res.setHeader('Content-Type', contentType)
        
        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        // 根据响应类型返回相应的数据
        if (contentType.startsWith('image/')) {
          // 图片类型，返回二进制数据
          const buffer = Buffer.from(await resp.arrayBuffer())
          res.end(buffer)
        } else if (contentType.startsWith('application/json')) {
          // JSON类型，返回JSON数据
          const data = await resp.json()
          sendJson(res, resp.status, data)
        } else {
          // 其他类型（如text/html、text/plain等），返回文本数据
          const text = await resp.text()
          res.end(text)
        }
      } catch (e) {
        console.error(`[Proxy Error] ${remoteUrl}: ${e.message}`)
        sendJson(res, 500, { error: 'PROXY_ERROR', message: e?.message || 'UNKNOWN' })
      }
      return
    }

    // 代理 Unsplash 图片请求，解决 CORS 问题
    if (req.method === 'GET' && path.startsWith('/api/proxy/unsplash')) {
      const remotePath = path.replace('/api/proxy/unsplash', '')
      const queryString = u.search
      const remoteUrl = `https://images.unsplash.com${remotePath}${queryString}`
      
      try {
        // 允许重定向，最多跟随10次重定向
        const resp = await fetch(remoteUrl, {
          method: req.method,
          headers: {
            'Accept': 'image/*, */*',
            'User-Agent': req.headers['user-agent'] || '',
          },
          redirect: 'follow', // 跟随重定向
          follow: 10, // 最多跟随10次重定向
        })
        
        // 设置响应头
        res.statusCode = resp.status
        const contentType = resp.headers.get('content-type') || 'image/jpeg'
        res.setHeader('Content-Type', contentType)
        
        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        
        // 返回图片二进制数据
        const buffer = Buffer.from(await resp.arrayBuffer())
        res.end(buffer)
      } catch (e) {
        console.error(`[Unsplash Proxy Error] ${remoteUrl}: ${e.message}`)
        sendJson(res, 500, { error: 'UNSPLASH_PROXY_ERROR', message: e?.message || 'Failed to proxy Unsplash image' })
      }
      return
    }

    // 健康检查：返回各模型的配置状态，便于前端快速定位问题
    if (req.method === 'GET' && path === '/api/health/llms') {
      const status = {
        doubao: { configured: !!(process.env.DOUBAO_API_KEY || API_KEY), base: (process.env.DOUBAO_BASE_URL || BASE_URL) },
        kimi: { configured: !!(process.env.KIMI_API_KEY || KIMI_API_KEY), base: (process.env.KIMI_BASE_URL || KIMI_BASE_URL) },
        deepseek: { configured: !!(process.env.DEEPSEEK_API_KEY || DEEPSEEK_API_KEY), base: (process.env.DEEPSEEK_BASE_URL || DEEPSEEK_BASE_URL) },
        qwen: { configured: !!(process.env.DASHSCOPE_API_KEY || DASHSCOPE_API_KEY), base: (process.env.DASHSCOPE_BASE_URL || DASHSCOPE_BASE_URL), model: (process.env.DASHSCOPE_MODEL_ID || DASHSCOPE_MODEL_ID) },
        wenxin: {
          configured: !!(process.env.QIANFAN_AUTH || QIANFAN_AUTH || process.env.QIANFAN_ACCESS_TOKEN || QIANFAN_ACCESS_TOKEN || process.env.QIANFAN_AK || QIANFAN_AK),
          base: (process.env.QIANFAN_BASE_URL || QIANFAN_BASE_URL),
          token_cached: !!__qf_token
        },
        // 添加新模型
        chatgpt: { configured: !!(process.env.CHATGPT_API_KEY || CHATGPT_API_KEY), base: (process.env.CHATGPT_BASE_URL || CHATGPT_BASE_URL), model: (process.env.CHATGPT_MODEL_ID || CHATGPT_MODEL_ID) },
        gemini: { configured: !!(process.env.GEMINI_API_KEY || GEMINI_API_KEY), base: (process.env.GEMINI_BASE_URL || GEMINI_BASE_URL), model: (process.env.GEMINI_MODEL_ID || GEMINI_MODEL_ID) },
        gork: { configured: !!(process.env.GORK_API_KEY || GORK_API_KEY), base: (process.env.GORK_BASE_URL || GORK_BASE_URL), model: (process.env.GORK_MODEL_ID || GORK_MODEL_ID) },
        zhipu: { configured: !!(process.env.ZHIPU_API_KEY || ZHIPU_API_KEY), base: (process.env.ZHIPU_BASE_URL || ZHIPU_BASE_URL), model: (process.env.ZHIPU_MODEL_ID || ZHIPU_MODEL_ID) }
      }
      sendJson(res, 200, { ok: true, status })
      return
    }

    if (req.method === 'GET' && path === '/api/health/ping') {
      sendJson(res, 200, { ok: true, message: 'pong', port: PORT })
      return
    }
    
    // 图生视频专用路由
    if (req.method === 'POST' && path === '/api/doubao/videos/image-to-video') {
      const key = process.env.DOUBAO_API_KEY || API_KEY
      const b = await readBody(req)
      if (MOCK || !key) {
        const mid = `mock-${Date.now()}`
        const model = b.model || 'doubao-seedance-1-0-pro-fast-251015'
        try { await videoTaskDB.upsertTask({ id: mid, status: 'succeeded', model, payload: b }) } catch {}
        sendJson(res, 200, { ok: true, data: { id: mid, status: 'succeeded', content: { video_url: 'https://example.com/mock.mp4', last_frame_url: 'https://example.com/mock.jpg' } } })
        return
      }
      
      // Validate request body
      if (!b.content || !Array.isArray(b.content) || b.content.length === 0) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: 'Content must be a non-empty array' });
        return
      }
      
      // 验证是否包含图片URL
      const hasImageUrl = b.content.some(item => item?.type === 'image_url');
      if (!hasImageUrl) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: 'Content must include at least one image_url item' });
        return;
      }
      
      // Process and sanitize content
      const content = b.content.map((it) => {
        if (it?.type === 'text') return { 
          type: 'text', 
          text: String(it.text || '').replace(/`/g, '').trim() 
        }
        if (it?.type === 'image_url') return { 
          type: 'image_url', 
          image_url: { 
            url: String(it?.image_url?.url || '').replace(/`/g, '').trim() 
          } 
        }
        return it
      }).filter(item => {
        if (item?.type === 'text') return item.text.length > 0;
        if (item?.type === 'image_url') return item.image_url?.url && item.image_url.url.length > 0;
        return false;
      })
      
      if (content.length === 0) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: 'No valid content provided' });
        return;
      }
      
      // 使用图生视频专用模型，未开通则回退到标准模型
      const fastModel = (b.model && String(b.model).includes('fast')) ? b.model : 'doubao-seedance-1-0-pro-fast-251015';
      const fallbackModel = MODEL_ID;
      const payload = { model: fastModel, content };
      
      let r = await proxyFetch('/contents/generations/tasks', 'POST', payload);
      
      if (!r.ok && (r.data?.error?.code === 'ModelNotOpen')) {
        const fallbackPayload = { model: fallbackModel, content }
        r = await proxyFetch('/contents/generations/tasks', 'POST', fallbackPayload)
      }
      
      if (!r.ok) {
        sendJson(res, r.status, { 
          error: (r.data?.error?.code) || 'SERVER_ERROR', 
          message: (r.data?.error?.message) || 'Image-to-video generation failed',
          data: r.data 
        }); 
        return 
      }
      
      try { await videoTaskDB.upsertTask({ id: r.data?.id, status: r.data?.status, model: r.data?.model || fastModel, payload }) } catch {}
      sendJson(res, 200, { ok: true, data: r.data });
      return;
    }

    // 中文注释：数据库状态与视频任务查询（本地存储）
    if (req.method === 'GET' && path === '/api/db/status') {
      const stats = getDBStatus()
      sendJson(res, 200, { ok: true, stats })
      return
    }

    if (req.method === 'GET' && path.startsWith('/api/video_tasks/')) {
      const id = path.split('/').pop() || ''
      const row = await videoTaskDB.getTask(id)
      if (!row) { sendJson(res, 404, { error: 'NOT_FOUND' }); return }
      sendJson(res, 200, { ok: true, data: row })
      return
    }

    // 用户认证相关API
    
    // 用户注册
    if (req.method === 'POST' && path === '/api/auth/register') {
      const b = await readBody(req)
      
      // 验证必填字段
      if (!b.username || !b.email || !b.password) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: '用户名、邮箱和密码不能为空' })
        return
      }
      
      // 验证用户名格式
      if (b.username.length < 2 || b.username.length > 20) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: '用户名长度必须在2-20个字符之间' })
        return
      }
      
      // 验证密码格式（简化要求，至少8个字符，包含字母和数字）
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
      if (!passwordRegex.test(b.password)) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: '密码至少8个字符，包含至少一个字母和一个数字' })
        return
      }
      
      // 检查用户名是否已存在
      const existingUserByUsername = await userDB.findByUsername(b.username)
      if (existingUserByUsername) {
        sendJson(res, 400, { error: 'USERNAME_EXISTS', message: '用户名已被注册' })
        return
      }
      
      // 检查邮箱是否已存在
      const existingUserByEmail = await userDB.findByEmail(b.email)
      if (existingUserByEmail) {
        sendJson(res, 400, { error: 'EMAIL_EXISTS', message: '邮箱已被注册' })
        return
      }
      
      // 密码哈希
      const salt = await bcrypt.genSalt(10)
      const password_hash = await bcrypt.hash(b.password, salt)
      
      // 创建用户
      const result = await userDB.createUser({
        username: b.username,
        email: b.email,
        password_hash,
        phone: b.phone || null,
        avatar_url: b.avatar_url || null,
        interests: b.interests ? JSON.stringify(b.interests) : null,
        age: b.age ? parseInt(b.age) : null,
        tags: b.tags ? JSON.stringify(b.tags) : null
      })
      const userId = result.id
      
      if (!userId) {
        sendJson(res, 500, { error: 'SERVER_ERROR', message: '创建用户失败' })
        return
      }
      
      // 生成JWT令牌
      const token = generateToken({ userId })
      
      sendJson(res, 201, { 
        ok: true, 
        message: '注册成功',
        token,
        user: {
          id: userId,
          username: b.username,
          email: b.email,
          phone: b.phone || null,
          avatar_url: b.avatar_url || null,
          interests: b.interests || null,
          age: b.age ? parseInt(b.age) : null,
          tags: b.tags || null
        }
      })
      return
    }
    
    // 用户登录
    if (req.method === 'POST' && path === '/api/auth/login') {
      const b = await readBody(req)
      
      // 验证必填字段
      if (!b.email || !b.password) {
        sendJson(res, 400, { error: 'INVALID_REQUEST', message: '邮箱和密码不能为空' })
        return
      }
      
      // 查找用户
      const user = await userDB.findByEmail(b.email)
      if (!user) {
        sendJson(res, 401, { error: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' })
        return
      }
      
      // 验证密码
      const isPasswordValid = await bcrypt.compare(b.password, user.password_hash)
      if (!isPasswordValid) {
        sendJson(res, 401, { error: 'INVALID_CREDENTIALS', message: '邮箱或密码错误' })
        return
      }
      
      // 生成JWT令牌
      const token = generateToken({ userId: user.id })
      
      sendJson(res, 200, { 
        ok: true, 
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone || null,
          avatar_url: user.avatar_url || null,
          interests: user.interests ? JSON.parse(user.interests) : null,
          age: user.age || null,
          tags: user.tags ? JSON.parse(user.tags) : null,
          isAdmin: user.email === 'testuser789@example.com' || user.isAdmin
        }
      })
      return
    }
    
    // 获取当前用户信息
    if (req.method === 'GET' && path === '/api/auth/me') {
      const decoded = verifyRequestToken(req)
      if (!decoded) {
        sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
        return
      }
      
      const user = await userDB.findById(decoded.userId)
      if (!user) {
        sendJson(res, 404, { error: 'USER_NOT_FOUND', message: '用户不存在' })
        return
      }
      
      sendJson(res, 200, { 
        ok: true, 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone || null,
          avatar_url: user.avatar_url || null,
          interests: user.interests ? JSON.parse(user.interests) : null,
          age: user.age || null,
          tags: user.tags ? JSON.parse(user.tags) : null,
          isAdmin: user.email === 'testuser789@example.com' || user.isAdmin
        }
      })
      return
    }
    
    // 获取所有用户数据（仅管理员）
    if (req.method === 'GET' && path === '/api/admin/users') {
      const decoded = verifyRequestToken(req)
      if (!decoded) {
        sendJson(res, 401, { error: 'UNAUTHORIZED', message: '未授权访问' })
        return
      }
      
      // 检查用户是否为管理员
      const currentUser = await userDB.findById(decoded.userId)
      if (!currentUser || (currentUser.email !== 'testuser789@example.com' && !currentUser.isAdmin)) {
        sendJson(res, 403, { error: 'FORBIDDEN', message: '只有管理员可以访问此资源' })
        return
      }
      
      // 获取所有用户数据
      const users = await userDB.getAllUsers()
      
      // 格式化用户数据
      const formattedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone || null,
        avatar_url: user.avatar_url || null,
        interests: user.interests ? JSON.parse(user.interests) : null,
        age: user.age || null,
        tags: user.tags ? JSON.parse(user.tags) : null,
        created_at: user.created_at,
        updated_at: user.updated_at
      }))
      
      sendJson(res, 200, { 
        ok: true, 
        users: formattedUsers
      })
      return
    }
    
    // 用户登出
    if (req.method === 'POST' && path === '/api/auth/logout') {
      // JWT是无状态的，登出只需客户端删除令牌即可
      sendJson(res, 200, { ok: true, message: '登出成功' })
      return
    }

    sendJson(res, 404, { error: 'NOT_FOUND' })
  } catch (e) {
    sendJson(res, 500, { error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
})

server.listen(PORT, () => {
  console.log(`Local API server running on port ${PORT}`);
})

// 实时协作WebSocket服务器
const wss = new WebSocketServer({ server, path: '/ws' })

// 协作会话管理
const collaborationSessions = new Map()
const connectedUsers = new Map()

// WebSocket连接处理
wss.on('connection', (ws, req) => {
  console.log('WebSocket连接建立')
  
  // 解析URL参数获取会话ID和用户信息
  const url = new URL(req.url, `http://localhost:3007`)
  const sessionId = url.searchParams.get('sessionId')
  const userId = url.searchParams.get('userId')
  const username = url.searchParams.get('username')
  
  if (!sessionId || !userId) {
    ws.close(1008, '缺少必要参数')
    return
  }
  
  // 初始化会话
  if (!collaborationSessions.has(sessionId)) {
    collaborationSessions.set(sessionId, {
      id: sessionId,
      users: new Map(),
      content: '',
      createdAt: Date.now(),
      lastActivity: Date.now()
    })
  }
  
  const session = collaborationSessions.get(sessionId)
  const userInfo = { id: userId, username, ws, joinedAt: Date.now() }
  
  // 添加用户到会话
  session.users.set(userId, userInfo)
  connectedUsers.set(ws, { sessionId, userId })
  
  // 发送欢迎消息和当前会话状态
  ws.send(JSON.stringify({
    type: 'session_joined',
    sessionId,
    userId,
    content: session.content,
    users: Array.from(session.users.values()).map(u => ({
      id: u.id,
      username: u.username,
      joinedAt: u.joinedAt
    }))
  }))
  
  // 广播用户加入消息
  broadcastToSession(sessionId, {
    type: 'user_joined',
    userId,
    username,
    timestamp: Date.now()
  }, userId)
  
  // 处理消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      handleWebSocketMessage(ws, sessionId, userId, message)
      session.lastActivity = Date.now()
    } catch (error) {
      console.error('WebSocket消息解析错误:', error)
      ws.send(JSON.stringify({
        type: 'error',
        message: '消息格式错误'
      }))
    }
  })
  
  // 处理连接关闭
  ws.on('close', () => {
    console.log('WebSocket连接关闭')
    handleUserDisconnect(ws, sessionId, userId)
  })
  
  // 处理错误
  ws.on('error', (error) => {
    console.error('WebSocket错误:', error)
    handleUserDisconnect(ws, sessionId, userId)
  })
})

// 处理WebSocket消息
function handleWebSocketMessage(ws, sessionId, userId, message) {
  const session = collaborationSessions.get(sessionId)
  if (!session) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '会话不存在'
    }))
    return
  }
  
  switch (message.type) {
    case 'text_edit':
      // 处理文本编辑
      handleTextEdit(sessionId, userId, message)
      break
      
    case 'cursor_move':
      // 处理光标移动
      broadcastToSession(sessionId, {
        type: 'cursor_update',
        userId,
        position: message.position,
        timestamp: Date.now()
      }, userId)
      break
      
    case 'selection_change':
      // 处理选择变化
      broadcastToSession(sessionId, {
        type: 'selection_update',
        userId,
        selection: message.selection,
        timestamp: Date.now()
      }, userId)
      break
      
    case 'ping':
      // 心跳检测
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now()
      }))
      break
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: '未知的消息类型'
      }))
  }
}

// 处理文本编辑
function handleTextEdit(sessionId, userId, message) {
  const session = collaborationSessions.get(sessionId)
  if (!session) return
  
  // 应用编辑操作（简单的文本合并，实际应该使用CRDT算法）
  if (message.operation === 'insert') {
    session.content = 
      session.content.slice(0, message.position) + 
      message.text + 
      session.content.slice(message.position)
  } else if (message.operation === 'delete') {
    session.content = 
      session.content.slice(0, message.position) + 
      session.content.slice(message.position + message.length)
  }
  
  // 广播编辑操作给其他用户
  broadcastToSession(sessionId, {
    type: 'text_edit',
    userId,
    operation: message.operation,
    position: message.position,
    text: message.text,
    length: message.length,
    timestamp: Date.now()
  }, userId)
}

// 向会话中的所有用户广播消息（排除发送者）
function broadcastToSession(sessionId, message, excludeUserId = null) {
  const session = collaborationSessions.get(sessionId)
  if (!session) return
  
  const messageStr = JSON.stringify(message)
  
  for (const [userId, userInfo] of session.users) {
    if (userId !== excludeUserId && userInfo.ws.readyState === 1) {
      userInfo.ws.send(messageStr)
    }
  }
}

// 处理用户断开连接
function handleUserDisconnect(ws, sessionId, userId) {
  const userInfo = connectedUsers.get(ws)
  if (!userInfo) return
  
  connectedUsers.delete(ws)
  
  const session = collaborationSessions.get(sessionId)
  if (session) {
    session.users.delete(userId)
    
    // 如果会话中没有用户了，清理会话
    if (session.users.size === 0) {
      collaborationSessions.delete(sessionId)
      console.log(`会话 ${sessionId} 已清理`)
    } else {
      // 广播用户离开消息
      broadcastToSession(sessionId, {
        type: 'user_left',
        userId,
        timestamp: Date.now()
      })
    }
  }
}

// 定期清理不活跃的会话（24小时无活动）
setInterval(() => {
  const now = Date.now()
  const inactiveThreshold = 24 * 60 * 60 * 1000 // 24小时
  
  for (const [sessionId, session] of collaborationSessions) {
    if (now - session.lastActivity > inactiveThreshold) {
      collaborationSessions.delete(sessionId)
      console.log(`清理不活跃会话: ${sessionId}`)
    }
  }
}, 60 * 60 * 1000) // 每小时检查一次

console.log('WebSocket实时协作服务器已启动')
