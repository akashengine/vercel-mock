import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { geminiApiKey, files, regNo } = req.body || {};
  if (!geminiApiKey || !Array.isArray(files)) return res.status(400).json({ error: 'Missing inputs' });
  try {
    const genai: any = await import('google-generativeai');
    genai.configure({ apiKey: geminiApiKey });
    const model = new genai.GenerativeModel('gemini-1.5-flash');
    const schema = { name: 'string', roll_no: 'string' };
    const sys = `You are an expert UPSC DAF parser. Extract JSON following this schema: ${JSON.stringify(schema)}. Candidate roll/registration no.: ${regNo || 'UNKNOWN'}. Return valid JSON only.`;
    const parts: any[] = [{ text: sys }];
    for (const f of files) parts.push({ inline_data: { mime_type: f.mimeType, data: f.base64 } });
    const resp = await model.generateContent(parts as any);
    const text: string = (resp as any).text() || (resp as any).response?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const i = text.indexOf('{'); const j = text.lastIndexOf('}');
    const json = i >= 0 && j > i ? JSON.parse(text.slice(i, j + 1)) : {};
    if (!json.roll_no && regNo) json.roll_no = regNo;
    res.json({ candidate: json });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Parse failed' });
  }
}
