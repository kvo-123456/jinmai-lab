import type { VercelRequest, VercelResponse } from '@vercel/node'

const ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*'
const VOLC_TTS_APP_ID = process.env.VOLC_TTS_APP_ID || ''
const VOLC_TTS_ACCESS_TOKEN = process.env.VOLC_TTS_ACCESS_TOKEN || ''
const VOLC_TTS_SECRET_KEY = process.env.VOLC_TTS_SECRET_KEY || ''
const VOLC_TTS_ENDPOINT = process.env.VOLC_TTS_ENDPOINT || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.status(204).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'METHOD_NOT_ALLOWED' }); return }

  if (!VOLC_TTS_ENDPOINT || !VOLC_TTS_ACCESS_TOKEN) {
    res.status(500).json({ error: 'CONFIG_MISSING' })
    return
  }

  try {
    const { text, voice, speed, pitch, format } = (req.body || {}) as any
    const t = String(text || '').trim()
    if (!t) { res.status(400).json({ error: 'TEXT_EMPTY' }); return }
    if (t.length > 2000) { res.status(400).json({ error: 'TEXT_TOO_LONG' }); return }

    const payload: any = {
      text: t,
      voice: voice || 'female',
      speed: typeof speed === 'number' ? speed : 1.0,
      pitch: typeof pitch === 'number' ? pitch : 1.0,
      app_id: VOLC_TTS_APP_ID || undefined,
      audio_format: format || 'mp3',
    }

    const r = await fetch(VOLC_TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOLC_TTS_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })

    const ct = r.headers.get('content-type') || ''
    if (ct.startsWith('audio/')) {
      const buf = Buffer.from(await r.arrayBuffer())
      const audio_base64 = buf.toString('base64')
      res.status(200).json({ ok: true, audio_base64, content_type: ct })
      return
    }

    const data = ct.includes('application/json') ? await r.json() : await r.text()
    if (!r.ok) {
      res.status(r.status).json({ error: 'SERVER_ERROR', data })
      return
    }
    res.status(200).json({ ok: true, data })
  } catch (e: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' })
  }
}

