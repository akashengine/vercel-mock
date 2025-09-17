import Feedback from "../components/Feedback";
import "../styles/globals.css";
import { useEffect, useMemo, useRef, useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState<'idle'|'starting'|'in_call'|'ended'>('idle');
  const [log, setLog] = useState<string>('');
  const vapiRef = useRef<any>(null);

  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const queryAssistantId = search.get('assistantId') || search.get('assistant') || '';
  const envKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '';
  const queryKey = search.get('publicKey') || search.get('apiKey') || '';
  const publicKey = useMemo(() => queryKey || envKey, [queryKey, envKey]);
  const [assistantId, setAssistantId] = useState<string>(queryAssistantId);

  useEffect(() => { setAssistantId(queryAssistantId); }, [queryAssistantId]);

  function append(msg: string) { setLog(prev => prev + msg + '\n'); }

  async function ensureSDK() {
    const anyWin = window as any;
    if (anyWin.Vapi) return anyWin.Vapi.default || anyWin.Vapi;
    await new Promise<void>((res) => {
      const retry = () => { if (anyWin.Vapi) res(); else setTimeout(retry, 150); };
      retry();
    });
    return (window as any).Vapi.default || (window as any).Vapi;
  }

  async function startCall() {
    try {
      if (!publicKey) { append('Missing publicKey'); return; }
      if (!assistantId) { append('Missing assistantId'); return; }
      setStatus('starting');
      const Vapi = await ensureSDK();
      const v = new Vapi(publicKey);
      vapiRef.current = v;
      v.start(assistantId);
      v.on('call-start', () => { setStatus('in_call'); append('call-start'); });
      v.on('call-end', () => { setStatus('ended'); append('call-end'); });
      v.on('message', (m: any) => { if (m?.type === 'transcript') append(`${m.role}: ${m.transcript}`); });
      append('SDK ready. If mic prompt is blocked, open this page directly in a tab.');
    } catch (e: any) { append('start failed: ' + (e?.message || e)); }
  }

  function endCall() { try { vapiRef.current?.stop(); } catch {} }
  function mute() { try { vapiRef.current?.mute(); } catch {} }
  function unmute() { try { vapiRef.current?.unmute(); } catch {} }

  return (
    <div>
      <h2>UPSC Interview – Voice (Web SDK)</h2>
      <div style={{marginTop:8}}>
        <label>Assistant ID:&nbsp;</label>
        <input style={{width:'360px'}} value={assistantId} onChange={e=>setAssistantId(e.target.value)} placeholder="assistantId" />
      </div>
      <div id="controls">
        <button onClick={startCall}>Start</button>
        <button className="secondary" onClick={endCall}>End</button>
        <button className="secondary" onClick={mute}>Mute</button>
        <button className="secondary" onClick={unmute}>Unmute</button>
      </div>
      <pre>{log}</pre>
      <p style={{opacity:.8}}>Use query params: ?assistantId=...&publicKey=... (publicKey overrides env)</p>
    </div>
  );
}
