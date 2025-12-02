import type { VercelRequest, VercelResponse } from '@vercel/node'

const BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
const API_KEY = process.env.DOUBAO_API_KEY || ''
const MODEL_ID = process.env.DOUBAO_MODEL_ID || 'doubao-seedance-1-0-pro-250528'

function sanitizeText(s: string) {
  return s.replace(/`/g, '').trim()
}

function sanitizeUrl(u: string) {
  return u.replace(/`/g, '').trim()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
    return
  }
  if (!API_KEY || !MODEL_ID) {
    res.status(500).json({ error: 'CONFIG_MISSING' })
    return
  }
  try {
    const { model, content } = req.body || {}
    if (!content || !Array.isArray(content)) {
      res.status(400).json({ error: 'CONTENT_REQUIRED' })
      return
    }
    const payloadContent = content.map((it: any) => {
      if (it?.type === 'text' && typeof it.text === 'string') {
        return { type: 'text', text: sanitizeText(it.text) }
      }
      if (it?.type === 'image_url' && it?.image_url && typeof it.image_url.url === 'string') {
        return { type: 'image_url', image_url: { url: sanitizeUrl(it.image_url.url) } }
      }
      return it
    })
    const payload: any = { model: model || MODEL_ID, content: payloadContent }
    const arkRes = await fetch(`${BASE_URL}/contents/generations/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    })
    const contentType = arkRes.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await arkRes.json() : await arkRes.text()
    if (!arkRes.ok) {
      const code = (data && (data as any).error && (data as any).error.code) || 'SERVER_ERROR'
      res.status(arkRes.status).json({ error: code, data })
      return
    }
    res.status(200).json({ ok: true, data })
  } catch (e: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
}

