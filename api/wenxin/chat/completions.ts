import type { VercelRequest, VercelResponse } from '@vercel/node'

const BASE_URL = process.env.QIANFAN_BASE_URL || 'https://qianfan.baidubce.com'
const MODEL_ID = process.env.QIANFAN_MODEL_ID || 'ERNIE-Speed-8K'
const AUTH = process.env.QIANFAN_AUTH || ''
let token = process.env.QIANFAN_ACCESS_TOKEN || ''
let expireAt = 0

async function getAuthHeader() {
  if (AUTH && AUTH.startsWith('bce-v3')) return AUTH
  const now = Math.floor(Date.now() / 1000)
  if (token && expireAt > now + 60) return `Bearer ${token}`
  if (process.env.QIANFAN_ACCESS_TOKEN) return `Bearer ${process.env.QIANFAN_ACCESS_TOKEN}`
  const ak = process.env.QIANFAN_AK || process.env.BAIDU_AK || ''
  const sk = process.env.QIANFAN_SK || process.env.BAIDU_SK || ''
  if (!ak || !sk) return ''
  const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(ak)}&client_secret=${encodeURIComponent(sk)}`
  const resp = await fetch(url)
  const data = await resp.json()
  const t = data?.access_token || ''
  const exp = Number(data?.expires_in || 0)
  if (t) { token = t; expireAt = now + exp }
  return t ? `Bearer ${t}` : ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.status(204).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'METHOD_NOT_ALLOWED' }); return }

  const hasCfg = (AUTH || process.env.QIANFAN_ACCESS_TOKEN || process.env.QIANFAN_AK)
  if (!hasCfg) { res.status(500).json({ error: 'CONFIG_MISSING' }); return }

  try {
    const { model, messages, max_tokens, temperature, top_p } = req.body || {}
    const msgs = Array.isArray(messages) ? messages.map((m: any) => ({ role: m?.role || 'user', content: String(m?.content || '').replace(/`/g, '').trim() })) : []
    const payload: any = {
      model: model || MODEL_ID,
      messages: msgs,
      max_tokens,
      temperature,
      top_p,
      stream: false,
    }
    const auth = await getAuthHeader()
    const r = await fetch(`${BASE_URL}/v2/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
      body: JSON.stringify(payload)
    })
    const ct = r.headers.get('content-type') || ''
    const data = ct.includes('application/json') ? await r.json() : await r.text()
    if (!r.ok) { 
      const msg = (data && (data as any).error_msg) || 'SERVER_ERROR'; 
      const errCode = (data && (data as any).error_code) || '';
      // 检测配额用完错误
      if (msg.includes('quota exceeded') || msg.includes('配额') || errCode === '4001') {
        res.status(429).json({ error: 'QUOTA_EXCEEDED', message: '百度千帆API免费额度已用完' }); 
        return;
      }
      res.status(r.status).json({ error: msg, data }); 
      return;
    }
    res.status(200).json({ ok: true, data })
  } catch (e: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
}
