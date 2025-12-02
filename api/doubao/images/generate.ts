import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const API_KEY = process.env.DOUBAO_API_KEY || '';
const MODEL_ID = process.env.DOUBAO_MODEL_ID || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = process.env.CORS_ALLOW_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  if (!API_KEY || !MODEL_ID) {
    res.status(500).json({ error: 'CONFIG_MISSING' });
    return;
  }

  try {
    const { prompt, size = '1024x1024', n = 1, seed, guidance_scale, response_format = 'url', watermark, model } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'PROMPT_REQUIRED' });
      return;
    }

    const payload: any = {
      model: model || MODEL_ID,
      prompt,
      size,
      n,
    };
    if (seed !== undefined) payload.seed = seed;
    if (guidance_scale !== undefined) payload.guidance_scale = guidance_scale;
    if (response_format) payload.response_format = response_format;
    if (typeof watermark === 'boolean') payload.watermark = watermark;

    const arkRes = await fetch(`${BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const contentType = arkRes.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await arkRes.json() : await arkRes.text();

    if (!arkRes.ok) {
      const code = (data && data.error && data.error.code) || 'SERVER_ERROR';
      res.status(arkRes.status).json({ error: code, data });
      return;
    }

    res.status(200).json({ ok: true, data });
  } catch (e: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: e?.message || 'UNKNOWN' });
  }
}
