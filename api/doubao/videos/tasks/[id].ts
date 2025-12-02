import type { VercelRequest, VercelResponse } from '@vercel/node'

const BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
const API_KEY = process.env.DOUBAO_API_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' })
    return
  }
  if (!API_KEY) {
    res.status(500).json({ error: 'CONFIG_MISSING' })
    return
  }
  try {
    const id = (req.query?.id as string) || ''
    if (!id) {
      res.status(400).json({ error: 'ID_REQUIRED' })
      return
    }
    const arkRes = await fetch(`${BASE_URL}/contents/generations/tasks/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
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

