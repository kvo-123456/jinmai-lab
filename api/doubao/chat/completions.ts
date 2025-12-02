import type { VercelRequest, VercelResponse } from '@vercel/node'

const BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
const API_KEY = process.env.DOUBAO_API_KEY || ''
const MODEL_ID = process.env.DOUBAO_MODEL_ID || ''

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
    const { model, messages, max_tokens, temperature, top_p, stream, max_completion_tokens } = req.body || {}
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'MESSAGES_REQUIRED' })
      return
    }

    const sanitized = messages.map((m: any) => {
      const content = Array.isArray(m?.content) ? m.content.map((it: any) => {
        if (it?.type === 'text') return { type: 'text', text: String(it.text || '').replace(/`/g, '').trim() }
        if (it?.type === 'image_url') return { type: 'image_url', image_url: { url: String(it?.image_url?.url || '').replace(/`/g, '').trim() } }
        return it
      }) : []
      return { role: m?.role || 'user', content }
    })

    const payload: any = {
      model: model || MODEL_ID,
      messages: sanitized,
    }
    const mt = typeof max_tokens === 'number' ? max_tokens : (typeof max_completion_tokens === 'number' ? max_completion_tokens : undefined)
    if (typeof mt === 'number') payload.max_tokens = mt
    if (typeof temperature === 'number') payload.temperature = temperature
    if (typeof top_p === 'number') payload.top_p = top_p
    if (typeof stream === 'boolean') payload.stream = stream

    const arkRes = await fetch(`${BASE_URL}/chat/completions`, {
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
