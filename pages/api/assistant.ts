import type { NextApiRequest, NextApiResponse } from 'next';
import { VAPI_BASE_URL, authHeader } from '../../lib/vapi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = process.env.VAPI_API_KEY || (req.headers['x-vapi-api-key'] as string);
  if (!token) return res.status(400).json({ error: 'Missing Vapi API key' });
  const payload = req.body || {};
  try {
    const r = await fetch(`${VAPI_BASE_URL}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Assistant create failed' });
  }
}
