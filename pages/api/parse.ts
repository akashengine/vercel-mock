import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { geminiApiKey, files, regNo } = req.body || {};
  const apiKey = geminiApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || !Array.isArray(files)) return res.status(400).json({ error: 'Missing inputs' });
  try {
    const ai = new GoogleGenAI({ apiKey });
    const sys = `You are an expert UPSC DAF parser. Extract JSON following this schema: {\"name\":\"string\",\"roll_no\":\"string\"}. Candidate roll/registration no.: ${regNo || 'UNKNOWN'}. Return valid JSON only.`;
    const contents: any[] = [{ role: 'user', parts: [sys] }];
    for (const f of files) contents[0].parts.push({ inlineData: { mimeType: f.mimeType, data: f.base64 } });
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash-001', contents });
    const text = (response as any).text || (response as any).text();
    const s: string = typeof text === 'function' ? await text() : (text || '');
    const i = s.indexOf('{'); const j = s.lastIndexOf('}');
    const json = i >= 0 && j > i ? JSON.parse(s.slice(i, j + 1)) : {};
    if (!json.roll_no && regNo) json.roll_no = regNo;
    res.json({ candidate: json });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Parse failed' });
  }
}
