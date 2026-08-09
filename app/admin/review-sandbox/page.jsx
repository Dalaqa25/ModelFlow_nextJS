'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FlaskConical, Play, RefreshCw, ShieldCheck, TriangleAlert, UserRound, XCircle } from 'lucide-react';

function statusLabel(status) {
  if (status === 'passed') return 'Sandbox passed';
  if (status === 'failed') return 'Needs attention';
  return 'Not tested';
}

export default function ReviewSandboxPage() {
  const [automations, setAutomations] = useState([]);
  const [libraryCertification, setLibraryCertification] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/review-sandbox', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load automations');
      setAutomations(data.automations || []);
      setLibraryCertification(data.libraryCertification || null);
      setSelectedId((current) => current || data.automations?.[0]?.id || null);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const selected = useMemo(() => automations.find((item) => item.id === selectedId) || null, [automations, selectedId]);
  const sandbox = selected?.workflow?.latestSandbox;

  useEffect(() => {
    if (!selected) return;
    setMessages([{ role: 'assistant', text: `I’m ready to review “${selected.name}”. Ask me about its trigger, steps, credentials, or what the safe test checks.` }]);
  }, [selectedId]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !selected || chatting) return;
    const history = messages.map((item) => ({ role: item.role, content: item.text }));
    setMessages((items) => [...items, { role: 'user', text }]);
    setDraft('');
    setChatting(true);
    try {
      const response = await fetch(`/api/admin/review-sandbox/${selected.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, messages: history }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Review assistant could not respond');
      setMessages((items) => [...items, { role: 'assistant', text: data.reply }]);
    } catch (e) {
      setError(e.message);
      setMessages((items) => [...items, { role: 'assistant', text: `I could not analyze this workflow right now: ${e.message}` }]);
    } finally { setChatting(false); }
  };

  const runTest = async () => {
    if (!selected || running) return;
    setRunning(true); setError('');
    setMessages((items) => [...items, { role: 'assistant', text: 'Starting a safe certification run. No customer-side effects will be executed.' }]);
    try {
      const response = await fetch(`/api/admin/review-sandbox/${selected.id}/run`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok && !data.sandbox) throw new Error(data.error || 'Sandbox test failed');
      setAutomations((items) => items.map((item) => item.id === selected.id ? {
        ...item,
        workflow: { ...item.workflow, latestSandbox: data.sandbox },
      } : item));
      const result = data.sandbox?.status === 'passed' ? 'passed' : 'failed';
      setMessages((items) => [...items, { role: 'assistant', text: result === 'passed' ? 'Safe test passed — the workflow loads and its checks are clean.' : `Safe test found ${data.sandbox?.certification?.summary?.failed || 1} check(s) worth a look. This does not block approval — the sandbox cannot reach every service, so a workflow can be fine and still fail here.` }]);
    } catch (e) { setError(e.message); setMessages((items) => [...items, { role: 'assistant', text: `The sandbox could not complete: ${e.message}` }]); }
    finally { setRunning(false); }
  };

  return (
    <main className="mg-dark-surface min-h-screen bg-[#0d1024] text-white">
      <div className="mx-auto max-w-[1500px] px-6 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Admin console</Link>
            <div className="flex items-center gap-3"><div className="rounded-xl bg-violet-500/15 p-3 text-violet-300"><FlaskConical /></div><div><p className="text-xs font-bold uppercase tracking-[.22em] text-violet-300">Review workspace</p><h1 className="text-3xl font-bold">Automation Review Sandbox</h1></div></div>
            <p className="mt-3 max-w-3xl text-slate-400">Talk through an imported workflow, run a safe readiness check, and keep it inactive until the evidence is good enough to approve.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"><RefreshCw className="h-4 w-4" /> Refresh</button>
        </div>
        {error && <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        {libraryCertification && <section className="mb-6 rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-violet-300">n8n template library</p><h2 className="mt-1 text-xl font-semibold">Certification evidence</h2><p className="mt-2 max-w-3xl text-sm text-slate-400">Every level 1 + 2 survivor is accounted for. Only workflows with zero isolation blockers were executed.</p></div>
            <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">Full level 3: {libraryCertification.summary.fullyLevel3Certified}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Static + native passed', libraryCertification.summary.level12Passed, 'text-sky-300'],
              ['Safe to execute', libraryCertification.summary.readyForControlledExecution, 'text-violet-300'],
              ['Controlled passed', libraryCertification.summary.controlledPassed, 'text-emerald-300'],
              ['Controlled failed', libraryCertification.summary.controlledFailed, 'text-red-300'],
              ['Blocked safely', libraryCertification.summary.blocked, 'text-amber-300'],
            ].map(([label, value, color]) => <div key={label} className="rounded-xl border border-white/10 bg-black/15 p-4"><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p></div>)}
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
            <div className="rounded-xl border border-white/10 bg-black/15 p-4"><p className="mb-3 text-sm font-semibold">Controlled execution results</p><div className="grid gap-2 sm:grid-cols-2">{libraryCertification.candidates.filter((candidate) => candidate.level3 === 'ready_for_real_test').map((candidate) => <div key={candidate.templateId} className="flex items-center justify-between rounded-lg bg-white/[.04] px-3 py-2 text-xs"><span className="truncate pr-3">#{candidate.templateId} · {candidate.name}</span>{candidate.controlledExecution?.status === 'passed' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <TriangleAlert className="h-4 w-4 shrink-0 text-amber-300" />}</div>)}</div></div>
            <div className="rounded-xl border border-white/10 bg-black/15 p-4"><p className="mb-1 text-sm font-semibold">Why 252 stayed blocked</p><p className="mb-3 text-xs text-slate-500">Finding counts can overlap within one workflow.</p><div className="space-y-2">{Object.entries(libraryCertification.blockerCounts).sort((left, right) => right[1] - left[1]).map(([code, count]) => <div key={code} className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-slate-400">{code.replaceAll('_', ' ')}</span><span className="rounded bg-white/10 px-2 py-1 font-semibold">{count}</span></div>)}</div></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">Controlled execution is not full certification. Real connector output, retry behavior, duplicate prevention, and token charging remain required.</p>
        </section>}
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Pending automations</h2><span className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300">{automations.length}</span></div>
            {loading ? <p className="p-4 text-sm text-slate-400">Loading review queue…</p> : automations.length === 0 ? <p className="p-4 text-sm text-slate-400">No pending automations.</p> : <div className="space-y-2">{automations.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-xl border p-4 text-left transition ${item.id === selectedId ? 'border-violet-400 bg-violet-500/15' : 'border-white/10 bg-black/10 hover:bg-white/5'}`}><div className="flex items-start justify-between gap-2"><span className="font-semibold leading-tight">{item.name}</span>{item.workflow.latestSandbox?.status === 'passed' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : item.workflow.latestSandbox?.status === 'failed' ? <XCircle className="h-4 w-4 shrink-0 text-red-400" /> : null}</div><span className="mt-2 block truncate text-xs text-slate-400">{item.authorEmail || 'Unknown author'}</span></button>)}</div>}
          </aside>
          <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
            {!selected ? <div className="rounded-2xl border border-white/10 bg-white/[.04] p-8 text-slate-400">Select an automation to begin.</div> : <>
              <div className="flex min-h-[620px] flex-col rounded-2xl border border-white/10 bg-white/[.04]">
                <div className="border-b border-white/10 p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">{selected.name}</h2><p className="mt-1 flex items-center gap-2 text-sm text-slate-400"><UserRound className="h-4 w-4" /> {selected.authorEmail || 'Unknown author'}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${sandbox?.status === 'passed' ? 'bg-emerald-400/15 text-emerald-300' : sandbox?.status === 'failed' ? 'bg-red-400/15 text-red-300' : 'bg-slate-400/15 text-slate-300'}`}>{statusLabel(sandbox?.status)}</span></div></div>
                <div className="flex-1 space-y-4 overflow-auto p-6">{messages.map((message, index) => <div key={`${index}-${message.role}`} className={message.role === 'user' ? 'ml-auto max-w-[78%] rounded-2xl rounded-br-sm bg-violet-500/25 px-4 py-3 text-sm text-violet-50' : 'max-w-[86%] rounded-2xl rounded-bl-sm bg-black/20 px-4 py-3 text-sm leading-6 text-slate-200'}>{message.text}</div>)}</div>
                <div className="border-t border-white/10 p-4"><div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[.16em] text-slate-500"><span>ModelGrow AI review</span><span>Simulation only · no external side effects</span></div><div className="flex gap-2"><input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }} placeholder="Ask what a real user would do…" disabled={chatting} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-violet-400 disabled:opacity-60" /><button onClick={sendMessage} disabled={chatting} className="rounded-xl bg-violet-500 px-4 text-sm font-semibold hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60">{chatting ? 'Thinking…' : 'Send'}</button></div></div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><div className="mb-5 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-300" /><h3 className="font-semibold">Safe test</h3></div><p className="mb-4 text-sm leading-6 text-slate-400">Loads the exact workflow temporarily and checks readiness. It does not send messages, publish content, or modify external accounts.</p><div className="mb-5 space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-400">Steps</span><span>{selected.workflow.nodeCount}</span></div><div className="flex justify-between"><span className="text-slate-400">Trigger</span><span className="max-w-[180px] truncate">{selected.workflow.trigger || 'Not detected'}</span></div><div className="flex justify-between"><span className="text-slate-400">Connectors</span><span>{selected.connectors.length || 0}</span></div></div><button disabled={running} onClick={runTest} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 disabled:cursor-wait disabled:opacity-60"><Play className="h-4 w-4" /> {running ? 'Testing safely…' : 'Run safe test'}</button>{sandbox?.certification?.checks && <div className="mt-5 space-y-2">{sandbox.certification.checks.map((check) => <div key={check.id} className="rounded-lg border border-white/10 bg-black/15 p-3"><div className="flex items-center justify-between text-sm font-medium"><span>{check.title}</span>{check.status === 'passed' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <TriangleAlert className="h-4 w-4 text-amber-300" />}</div>{check.issues?.slice(0, 2).map((issue, i) => <p key={i} className="mt-1 text-xs leading-5 text-amber-200">{issue.message}</p>)}</div>)}</div>}</div>
            </>}
          </section>
        </div>
      </div>
    </main>
  );
}
