import { useEffect, useMemo, useRef, useState } from 'react';
import Feedback from '../components/Feedback';

function useSearchParam(key: string) {
  if (typeof window === 'undefined') return '';
  const s = new URLSearchParams(window.location.search);
  return s.get(key) || '';
}

export default function App() {
  const [regNo, setRegNo] = useState('');
  const [daf1, setDaf1] = useState<File | null>(null);
  const [daf2, setDaf2] = useState<File | null>(null);
  const [candidate, setCandidate] = useState<any>({});
  const [prompt, setPrompt] = useState<string>('');
  const [assistantId, setAssistantId] = useState<string>('');
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [log, setLog] = useState<string>('');
  const publicKey = useSearchParam('publicKey') || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';
  const vapiRef = useRef<any>(null);

  function append(s:string){ setLog(p=>p+s+'\n'); }

  async function fileToBase64(f: File){
    const buf = await f.arrayBuffer();
    const b64 = Buffer.from(buf).toString('base64');
    const mimeType = f.type || (f.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
    return { base64: b64, mimeType };
  }

  async function onExtract(){
    try{
      if(!daf1 || !daf2){ alert('Upload DAF-1 and DAF-2'); return; }
      const [b1,b2] = await Promise.all([fileToBase64(daf1), fileToBase64(daf2)]);
      const r = await fetch('/api/parse', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '', files:[b1,b2], regNo })});
      const data = await r.json();
      if(!r.ok) throw new Error(data.error||'Parse failed');
      setCandidate(data.candidate||{});
      append('Parsed candidate JSON');
    }catch(e:any){ append('Parse error: '+(e?.message||e)); }
  }

  useEffect(()=>{
    const seed = (c:any)=>{
      const name = c?.name || 'Candidate';
      const roll = c?.roll_no || regNo || '';
      const interviewee_json = JSON.stringify(c||{}, null, 2);
      return `[Identity]\nYou are a UPSC Interview Board Member conducting the Civil Services Personality Test.\n[Interviewee JSON]\n${interviewee_json}`;
    };
    setPrompt(seed(candidate));
  },[candidate, regNo]);

  async function onCreateAssistant(){
    try{
      if(!prompt.trim()){ alert('Prompt empty'); return; }
      const payload = {
        name: `UPSC BOARD MEMBER – ${candidate?.roll_no || regNo || 'NA'}`,
        voice:{ provider:'11labs', model:'eleven_multilingual_v2', voiceId:'xZp4zaaBzoWhWxxrcAij' },
        model:{ provider:'openai', model:'gpt-4o-mini', messages:[{role:'system', content: prompt}] },
        transcriber:{ provider:'deepgram', model:'nova-2', language:'en' },
        analysisPlan:{ structuredDataPlan:{ enabled:true, schema:{ type:'object', properties:{ clarityOfExpression:{type:'string'} } }, messages:[{ role:'system', content:'Extract qualitative feedback JSON with the given schema.' }] } }
      };
      const r = await fetch('/api/assistant', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      const data = await r.json();
      if(!r.ok) throw new Error(data.error||'Assistant create failed');
      setAssistantId(data.id);
      append('Assistant created: '+data.id);
    }catch(e:any){ append('Assistant error: '+(e?.message||e)); }
  }

  async function ensureSDK(){
    const anyWin = window as any; if (anyWin.Vapi) return anyWin.Vapi.default || anyWin.Vapi;
    await new Promise<void>(res=>{ const retry=()=> anyWin.Vapi?res():setTimeout(retry,150); retry(); });
    return (window as any).Vapi.default || (window as any).Vapi;
  }

  async function onStart(){
    if(!assistantId){ alert('Create/select assistant first'); return; }
    const Vapi = await ensureSDK();
    const v = new Vapi(publicKey);
    vapiRef.current = v;
    v.start(assistantId);
    v.on('call-start', ()=> append('call-start'));
    v.on('call-end', ()=> append('call-end'));
    v.on('message', (m:any)=>{ if(m?.type==='transcript') append(`${m.role}: ${m.transcript}`); });
  }
  function onEnd(){ try{ vapiRef.current?.stop(); }catch{} }
  function onMute(){ try{ vapiRef.current?.mute(); }catch{} }
  function onUnmute(){ try{ vapiRef.current?.unmute(); }catch{} }

  async function fetchLatest(){
    if(!assistantId){ alert('No assistant'); return; }
    const r = await fetch(`/api/calls?assistantId=${assistantId}&limit=20`);
    const data = await r.json();
    const items = Array.isArray(data) ? data : (data.items||[]);
    if(!items.length){ append('No calls yet'); return; }
    const latest = items.sort((a:any,b:any)=> (b.endedAt||'').localeCompare(a.endedAt||''))[0];
    const r2 = await fetch(`/api/call/${latest.id}`);
    const call = await r2.json();
    setCurrentCall(call);
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold">UPSC Mock Interview – Full Flow</h2>

      <div className="mt-4 p-3 border border-neutral-800 rounded">
        <h3 className="font-medium mb-2">Step 1 – Candidate Inputs</h3>
        <div className="flex gap-2 items-center mb-2">
          <label>Reg/Roll No:</label>
          <input value={regNo} onChange={e=>setRegNo(e.target.value)} className="bg-neutral-900 px-2 py-1 rounded" />
        </div>
        <div className="flex gap-2 mb-2">
          <input type="file" accept="application/pdf,image/*" onChange={e=>setDaf1(e.target.files?.[0]||null)} />
          <input type="file" accept="application/pdf,image/*" onChange={e=>setDaf2(e.target.files?.[0]||null)} />
        </div>
        <button className="bg-teal-500 text-black px-3 py-1 rounded" onClick={onExtract}>Extract with Gemini</button>
      </div>

      <div className="mt-4 p-3 border border-neutral-800 rounded">
        <h3 className="font-medium mb-2">Step 2 – Edit Candidate JSON</h3>
        <textarea value={JSON.stringify(candidate, null, 2)} onChange={e=>{ try{ setCandidate(JSON.parse(e.target.value)); }catch{} }} className="w-full h-40 bg-neutral-900 rounded p-2 font-mono text-sm" />
      </div>

      <div className="mt-4 p-3 border border-neutral-800 rounded">
        <h3 className="font-medium mb-2">Step 3 – System Prompt</h3>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} className="w-full h-40 bg-neutral-900 rounded p-2 font-mono text-sm" />
      </div>

      <div className="mt-4 p-3 border border-neutral-800 rounded">
        <h3 className="font-medium mb-2">Step 4 – Create Assistant</h3>
        <button className="bg-teal-500 text-black px-3 py-1 rounded" onClick={onCreateAssistant}>Create/Update</button>
        {assistantId && <div className="mt-2 text-sm opacity-80">Assistant: {assistantId}</div>}
      </div>

      <div className="mt-4 p-3 border border-neutral-800 rounded">
        <h3 className="font-medium mb-2">Step 5 – Start Interview</h3>
        <div className="flex gap-2 mb-2">
          <button className="bg-teal-500 text-black px-3 py-1 rounded" onClick={onStart}>Start</button>
          <button className="bg-neutral-700 px-3 py-1 rounded" onClick={onEnd}>End</button>
          <button className="bg-neutral-700 px-3 py-1 rounded" onClick={onMute}>Mute</button>
          <button className="bg-neutral-700 px-3 py-1 rounded" onClick={onUnmute}>Unmute</button>
        </div>
        <pre className="bg-neutral-900 p-2 rounded h-40 overflow-auto text-sm">{log}</pre>
      </div>

      <div className="mt-4 p-3 border border-neutral-800 rounded">
        <h3 className="font-medium mb-2">Step 6 – Fetch & Display Feedback</h3>
        <button className="bg-teal-500 text-black px-3 py-1 rounded" onClick={fetchLatest}>Fetch Latest</button>
        {currentCall && <Feedback call={currentCall} />}
      </div>
    </div>
  );
}
