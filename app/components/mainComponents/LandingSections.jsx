'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { FaTiktok, FaLinkedinIn, FaFileInvoiceDollar, FaTwitter, FaDiscord, FaGithub } from 'react-icons/fa';
import { FiTrendingUp, FiUpload, FiUsers, FiDollarSign, FiZap, FiPlay, FiCheck, FiMessageSquare, FiSearch, FiCpu, FiCode, FiBarChart2, FiShield, FiGlobe, FiGitBranch, FiActivity, FiTerminal, FiChevronDown, FiChevronLeft, FiChevronRight, FiLayout, FiShoppingCart, FiHelpCircle, FiUser, FiUploadCloud, FiRefreshCw } from 'react-icons/fi';

// ─── Scroll-triggered visibility hook ───
function useScrollVisible(threshold = 0.15) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return [ref, visible];
}

// ─── USER FLOW ANIMATION ───
const USER_DEMOS = [
    {
        userMsg: 'Schedule my TikToks every day at 9am',
        aiMsg: 'I found the perfect automation for you…',
        card: { icon: <FaTiktok className="w-5 h-5 text-white" />, name: 'TikTok Daily Poster', desc: 'Posts your queued videos every day at 9:00 AM' },
    },
    {
        userMsg: 'Auto-post my blog articles to LinkedIn',
        aiMsg: 'Great choice — here\'s a popular one...',
        card: { icon: <FaLinkedinIn className="w-5 h-5 text-[#0A66C2]" />, name: 'LinkedIn Auto Blog Poster', desc: 'Publishes new blog posts to your LinkedIn feed automatically' },
    },
    {
        userMsg: 'Manage my invoices automatically',
        aiMsg: 'Setting up your invoice workflow…',
        card: { icon: <FaFileInvoiceDollar className="w-5 h-5 text-purple-400" />, name: 'Invoice Manager System', desc: 'Tracks, sends, and organizes invoices on autopilot' },
    },
];

const TYPE_SPEED = 40;
const AI_DELAY = 700;
const CARD_DELAY = 600;
const STATUS_DELAY = 800;
const HOLD = 2500;
const FADE_OUT = 450;

function UserFlowAnimation({ isActive }) {
    const { isDarkMode } = useThemeAdaptive();
    const [demoIdx, setDemoIdx] = useState(0);
    const [phase, setPhase] = useState('idle'); // idle | typing | ai | card | running | hold | fading
    const [typed, setTyped] = useState('');

    const demo = USER_DEMOS[demoIdx];

    // Reset when becoming active or demo changes
    useEffect(() => {
        if (!isActive) { setPhase('idle'); return; }

        let cancelled = false;
        setTyped('');
        setPhase('typing');

        const msg = demo.userMsg;
        let i = 0;

        const typeNext = () => {
            if (cancelled) return;
            if (i <= msg.length) {
                setTyped(msg.slice(0, i));
                i++;
                setTimeout(typeNext, TYPE_SPEED);
            } else {
                setTimeout(() => {
                    if (cancelled) return;
                    setPhase('ai');
                    setTimeout(() => {
                        if (cancelled) return;
                        setPhase('card');
                        setTimeout(() => {
                            if (cancelled) return;
                            setPhase('running');
                            setTimeout(() => {
                                if (cancelled) return;
                                setPhase('hold');
                                setTimeout(() => {
                                    if (cancelled) return;
                                    setPhase('fading');
                                    setTimeout(() => {
                                        if (cancelled) return;
                                        setDemoIdx(prev => (prev + 1) % USER_DEMOS.length);
                                    }, FADE_OUT);
                                }, HOLD);
                            }, STATUS_DELAY);
                        }, CARD_DELAY);
                    }, AI_DELAY);
                }, 350);
            }
        };

        setTimeout(typeNext, 300);
        return () => { cancelled = true; };
    }, [isActive, demoIdx]);

    const showAi = ['ai', 'card', 'running', 'hold', 'fading'].includes(phase);
    const showCard = ['card', 'running', 'hold', 'fading'].includes(phase);
    const isRunning = ['running', 'hold', 'fading'].includes(phase);
    const fading = phase === 'fading';

    const dark = isDarkMode;
    const bubble = 'rounded-2xl px-4 py-2.5 text-sm max-w-[85%]';

    return (
        <div
            className="w-full max-w-md mx-auto select-none"
            style={{ opacity: fading ? 0 : 1, transition: `opacity ${FADE_OUT}ms ease` }}
        >
            <div className={`rounded-2xl border px-5 py-4 flex flex-col gap-3 ${dark ? 'bg-slate-800/70 border-white/10' : 'bg-white/80 border-slate-200 shadow-lg'}`}>

                {/* Step label */}
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-purple-400' : 'text-purple-600'}`}>
                        {phase === 'typing' ? 'Step 1 — Describe' : showAi && !showCard ? 'Step 2 — AI Finds' : showCard ? 'Step 3 — It Runs' : 'Step 1 — Describe'}
                    </span>
                </div>

                {/* User bubble */}
                <div className="flex justify-end">
                    <div className={`${bubble} ${dark ? 'bg-violet-600/80 text-white' : 'bg-violet-500 text-white'}`}>
                        {typed}
                        {phase === 'typing' && (
                            <span className="inline-block w-0.5 h-3.5 bg-white/70 ml-0.5 align-middle animate-pulse" />
                        )}
                    </div>
                </div>

                {/* AI bubble */}
                <div
                    className="flex justify-start"
                    style={{
                        opacity: showAi ? 1 : 0,
                        transform: showAi ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.35s ease, transform 0.35s ease',
                    }}
                >
                    <div className={`${bubble} flex items-center gap-2 ${dark ? 'bg-slate-700/80 text-gray-200' : 'bg-slate-100 text-gray-700'}`}>
                        <span className="text-base">🤖</span>
                        <span>{demo.aiMsg}</span>
                        {showAi && !showCard && (
                            <span className="flex gap-0.5 ml-1">
                                {[0, 1, 2].map(i => (
                                    <span key={i} className={`w-1 h-1 rounded-full ${dark ? 'bg-gray-400' : 'bg-gray-500'} animate-bounce`}
                                        style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </span>
                        )}
                    </div>
                </div>

                {/* Automation card */}
                <div
                    style={{
                        opacity: showCard ? 1 : 0,
                        transform: showCard ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)',
                        transition: 'opacity 0.4s ease, transform 0.4s ease',
                        maxHeight: showCard ? '90px' : '0',
                        overflow: 'hidden',
                    }}
                >
                    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${dark ? 'bg-slate-900/60 border-violet-500/30' : 'bg-violet-50 border-violet-200'}`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${dark ? 'bg-violet-600/30' : 'bg-violet-100'}`}>
                            {demo.card.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>
                                {demo.card.name}
                            </p>
                            <p className={`text-xs truncate ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {demo.card.desc}
                            </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all duration-500 ${isRunning
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {isRunning ? '✓ Running' : 'Setting up…'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 mt-3">
                {USER_DEMOS.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === demoIdx
                        ? 'bg-violet-500 w-4'
                        : dark ? 'bg-white/20' : 'bg-slate-300'
                        }`} />
                ))}
            </div>
        </div>
    );
}

// ─── DEVELOPER FLOW ANIMATION ───
const DEV_DEMOS = [
    { name: 'TikTok Scheduler v2', users: [12, 47, 156], tokens: [24, 89, 215] },
    { name: 'LinkedIn Auto Poster', users: [8, 34, 92], tokens: [16, 68, 184] },
    { name: 'Invoice Automator', users: [5, 28, 73], tokens: [10, 56, 146] },
];

function DevFlowAnimation({ isActive }) {
    const { isDarkMode } = useThemeAdaptive();
    const [demoIdx, setDemoIdx] = useState(0);
    const [phase, setPhase] = useState('idle');
    // phases: idle | uploading | uploaded | users-0 | users-1 | users-2 | tokens-0 | tokens-1 | tokens-2 | cashout | hold | fading
    const [counterVal, setCounterVal] = useState({ users: 0, tokens: 0 });

    const demo = DEV_DEMOS[demoIdx];

    useEffect(() => {
        if (!isActive) { setPhase('idle'); return; }

        let cancelled = false;
        setPhase('uploading');
        setCounterVal({ users: 0, tokens: 0 });

        const sequence = [
            { phase: 'uploaded', delay: 1200 },
            { phase: 'users-0', delay: 600, cb: () => setCounterVal(v => ({ ...v, users: demo.users[0] })) },
            { phase: 'users-1', delay: 500, cb: () => setCounterVal(v => ({ ...v, users: demo.users[1] })) },
            { phase: 'users-2', delay: 500, cb: () => setCounterVal(v => ({ ...v, users: demo.users[2] })) },
            { phase: 'tokens-0', delay: 600, cb: () => setCounterVal(v => ({ ...v, tokens: demo.tokens[0] })) },
            { phase: 'tokens-1', delay: 400, cb: () => setCounterVal(v => ({ ...v, tokens: demo.tokens[1] })) },
            { phase: 'tokens-2', delay: 400, cb: () => setCounterVal(v => ({ ...v, tokens: demo.tokens[2] })) },
            { phase: 'cashout', delay: 1200 },
            { phase: 'hold', delay: HOLD },
            { phase: 'fading', delay: FADE_OUT, cb: () => setDemoIdx(prev => (prev + 1) % DEV_DEMOS.length) },
        ];

        let timeout;
        let i = 0;

        const run = () => {
            if (cancelled || i >= sequence.length) return;
            const step = sequence[i];
            timeout = setTimeout(() => {
                if (cancelled) return;
                setPhase(step.phase);
                step.cb?.();
                i++;
                run();
            }, step.delay);
        };

        run();
        return () => { cancelled = true; clearTimeout(timeout); };
    }, [isActive, demoIdx]);

    const dark = isDarkMode;
    const fading = phase === 'fading';
    const uploaded = phase !== 'idle' && phase !== 'uploading';
    const showUsers = phase.startsWith('users') || phase.startsWith('tokens') || phase === 'cashout' || phase === 'hold' || phase === 'fading';
    const showTokens = phase.startsWith('tokens') || phase === 'cashout' || phase === 'hold' || phase === 'fading';
    const showCashout = phase === 'cashout' || phase === 'hold' || phase === 'fading';

    return (
        <div
            className="w-full max-w-md mx-auto select-none"
            style={{ opacity: fading ? 0 : 1, transition: `opacity ${FADE_OUT}ms ease` }}
        >
            <div className={`rounded-2xl border px-5 py-4 flex flex-col gap-3 ${dark ? 'bg-slate-800/70 border-white/10' : 'bg-white/80 border-slate-200 shadow-lg'}`}>

                {/* Upload area */}
                <div className={`rounded-xl border-2 border-dashed px-4 py-4 flex items-center gap-3 transition-all duration-500 ${uploaded
                    ? dark ? 'border-green-500/40 bg-green-500/5' : 'border-green-400/50 bg-green-50'
                    : dark ? 'border-white/15 bg-slate-700/30' : 'border-slate-300 bg-slate-50'
                    }`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 ${uploaded
                        ? 'bg-green-500/20'
                        : dark ? 'bg-purple-600/30' : 'bg-purple-100'
                        }`}>
                        {uploaded
                            ? <FiCheck className="w-5 h-5 text-green-400" />
                            : <FiUpload className={`w-5 h-5 ${dark ? 'text-purple-400' : 'text-purple-600'} ${phase === 'uploading' ? 'animate-bounce' : ''}`} />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                            {uploaded ? demo.name : 'Uploading automation…'}
                        </p>
                        <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {uploaded ? 'Published to marketplace ✓' : 'Packaging and validating…'}
                        </p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Users counter */}
                    <div className={`rounded-xl border px-4 py-3 text-center transition-all duration-300 ${dark ? 'bg-slate-700/40 border-white/8' : 'bg-slate-50 border-slate-200'}`}
                        style={{
                            opacity: showUsers ? 1 : 0.3,
                            transform: showUsers ? 'scale(1)' : 'scale(0.95)',
                            transition: 'opacity 0.4s, transform 0.4s',
                        }}>
                        <FiUsers className={`w-4 h-4 mx-auto mb-1 ${dark ? 'text-blue-400' : 'text-blue-600'}`} />
                        <p className={`text-xl font-bold tabular-nums ${dark ? 'text-white' : 'text-gray-900'}`}>
                            {counterVal.users}
                        </p>
                        <p className={`text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>users</p>
                    </div>

                    {/* Tokens counter */}
                    <div className={`rounded-xl border px-4 py-3 text-center transition-all duration-300 ${dark ? 'bg-slate-700/40 border-white/8' : 'bg-slate-50 border-slate-200'}`}
                        style={{
                            opacity: showTokens ? 1 : 0.3,
                            transform: showTokens ? 'scale(1)' : 'scale(0.95)',
                            transition: 'opacity 0.4s, transform 0.4s',
                        }}>
                        <FiDollarSign className={`w-4 h-4 mx-auto mb-1 ${dark ? 'text-green-400' : 'text-green-600'}`} />
                        <p className={`text-xl font-bold tabular-nums ${dark ? 'text-white' : 'text-gray-900'}`}>
                            +{counterVal.tokens}
                        </p>
                        <p className={`text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>tokens earned</p>
                    </div>
                </div>

                {/* Cash out badge */}
                <div
                    className="flex justify-center"
                    style={{
                        opacity: showCashout ? 1 : 0,
                        transform: showCashout ? 'translateY(0)' : 'translateY(8px)',
                        transition: 'opacity 0.4s ease, transform 0.4s ease',
                    }}
                >
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-full text-xs font-semibold ${dark ? 'bg-gradient-to-r from-purple-600/30 to-green-600/30 text-white border border-purple-500/30' : 'bg-gradient-to-r from-purple-50 to-green-50 text-gray-800 border border-purple-200'}`}>
                        <span>💰 Cash Out</span>
                        <span className={`w-px h-4 ${dark ? 'bg-white/20' : 'bg-gray-300'}`} />
                        <span>🔄 Use In-App</span>
                    </div>
                </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 mt-3">
                {DEV_DEMOS.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === demoIdx
                        ? 'bg-violet-500 w-4'
                        : dark ? 'bg-white/20' : 'bg-slate-300'
                        }`} />
                ))}
            </div>
        </div>
    );
}

// ─── DASHBOARD ANIMATION (For Everyone — second block) ───
const DASH_TASKS = [
    { name: 'TikTok Daily Poster', status: 'Running', statusColor: 'text-green-400 bg-green-500/15' },
    { name: 'Invoice Automator', status: 'Completed', statusColor: 'text-blue-400 bg-blue-500/15' },
    { name: 'LinkedIn Scheduler', status: 'Queued', statusColor: 'text-amber-400 bg-amber-500/15' },
];

const DASH_ACTIVITY = [
    '✓ TikTok Poster ran successfully',
    '✓ LinkedIn post published',
    '✓ Invoice #142 sent',
];

function DashboardAnimation({ isActive }) {
    const { isDarkMode } = useThemeAdaptive();
    const dark = isDarkMode;
    const [phase, setPhase] = useState('idle');
    const [cycle, setCycle] = useState(0);
    const [statsVal, setStatsVal] = useState({ tasks: 0, rate: 0, active: 0 });

    useEffect(() => {
        if (!isActive) { setPhase('idle'); return; }

        let cancelled = false;
        setPhase('loading');
        setStatsVal({ tasks: 0, rate: 0, active: 0 });

        const sequence = [
            { phase: 'tasks', delay: 800 },
            { phase: 'activity-0', delay: 900 },
            { phase: 'activity-1', delay: 600 },
            { phase: 'activity-2', delay: 600 },
            { phase: 'stats', delay: 500, cb: () => setStatsVal({ tasks: 12, rate: 98, active: 3 }) },
            { phase: 'hold', delay: 2800 },
            { phase: 'fading', delay: 500, cb: () => setCycle(c => c + 1) },
        ];

        let i = 0;
        let timeout;
        const run = () => {
            if (cancelled || i >= sequence.length) return;
            const step = sequence[i];
            timeout = setTimeout(() => {
                if (cancelled) return;
                setPhase(step.phase);
                step.cb?.();
                i++;
                run();
            }, step.delay);
        };
        run();
        return () => { cancelled = true; clearTimeout(timeout); };
    }, [isActive, cycle]);

    const fading = phase === 'fading';
    const showTasks = phase !== 'idle' && phase !== 'loading';
    const activityCount = phase.startsWith('activity-') ? parseInt(phase.split('-')[1]) + 1
        : ['stats', 'hold', 'fading'].includes(phase) ? 3 : 0;
    const showStats = ['stats', 'hold', 'fading'].includes(phase);

    const shimmer = `animate-pulse rounded ${dark ? 'bg-slate-700/60' : 'bg-slate-200/80'}`;

    return (
        <div
            className="w-full max-w-md mx-auto select-none"
            style={{ opacity: fading ? 0 : 1, transition: 'opacity 450ms ease', minHeight: '380px' }}
        >
            <div className={`rounded-2xl border overflow-hidden ${dark ? 'bg-slate-800/70 border-white/10' : 'bg-white/80 border-slate-200 shadow-lg'}`}>

                {/* Dashboard header */}
                <div className={`px-5 py-3 border-b flex items-center gap-2 ${dark ? 'border-white/8 bg-slate-800/50' : 'border-slate-100 bg-slate-50/80'}`}>
                    <FiActivity className={`w-4 h-4 ${dark ? 'text-violet-400' : 'text-violet-600'}`} />
                    <span className={`text-xs font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Dashboard</span>
                    <div className="flex-1" />
                    <div className={`w-2 h-2 rounded-full ${showTasks ? 'bg-green-400' : dark ? 'bg-slate-600' : 'bg-slate-300'}`} />
                </div>

                <div className="px-5 py-4 space-y-3">

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                        {[{ label: 'Tasks Today', val: statsVal.tasks, suffix: '' }, { label: 'Success', val: statsVal.rate, suffix: '%' }, { label: 'Active', val: statsVal.active, suffix: '' }].map((s, i) => (
                            <div key={s.label} className={`text-center py-2 rounded-lg transition-all duration-400 ${dark ? 'bg-slate-700/40' : 'bg-slate-50'}`}
                                style={{ opacity: showStats ? 1 : 0.4, transition: 'opacity 0.4s' }}>
                                <p className={`text-lg font-bold tabular-nums ${dark ? 'text-white' : 'text-gray-900'}`}>
                                    {showStats ? `${s.val}${s.suffix}` : '—'}
                                </p>
                                <p className={`text-[10px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Task cards */}
                    {!showTasks ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => <div key={i} className={`${shimmer} h-10`} />)}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {DASH_TASKS.map((t, i) => (
                                <div key={t.name}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-500 ${dark ? 'bg-slate-700/30 border-white/5' : 'bg-white border-slate-100'}`}
                                    style={{
                                        opacity: showTasks ? 1 : 0,
                                        transform: showTasks ? 'translateY(0)' : 'translateY(10px)',
                                        transition: `opacity 0.4s ease ${i * 150}ms, transform 0.4s ease ${i * 150}ms`,
                                    }}>
                                    <div className={`w-2 h-2 rounded-full ${t.status === 'Running' ? 'bg-green-400' : t.status === 'Completed' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                                    <span className={`text-xs font-medium flex-1 ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{t.name}</span>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.statusColor}`}>{t.status}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Activity feed */}
                    {activityCount > 0 && (
                        <div className={`rounded-xl border px-3 py-2.5 ${dark ? 'bg-slate-900/40 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Recent Activity</p>
                            {DASH_ACTIVITY.slice(0, activityCount).map((a, i) => (
                                <p key={i}
                                    className={`text-[11px] py-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}
                                    style={{
                                        opacity: 1,
                                        animation: 'fade-in-up 0.35s ease',
                                    }}>
                                    {a}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── CODE DEPLOY ANIMATION (For Developers — second block) ───
const CODE_LINES = [
    { text: 'export default {', color: 'text-purple-400' },
    { text: '  name: "Social Poster",', color: 'text-green-400' },
    { text: '  trigger: "schedule",', color: 'text-green-400' },
    { text: '  cron: "0 9 * * *",', color: 'text-amber-400' },
    { text: '  platforms: ["tiktok", "linkedin"],', color: 'text-blue-400' },
    { text: '  action: postToSocial,', color: 'text-cyan-400' },
    { text: '}', color: 'text-purple-400' },
];

function CodeDeployAnimation({ isActive }) {
    const { isDarkMode } = useThemeAdaptive();
    const dark = isDarkMode;
    const [phase, setPhase] = useState('idle');
    const [visibleLines, setVisibleLines] = useState(0);
    const [cycle, setCycle] = useState(0);
    const [metrics, setMetrics] = useState({ users: 0, tokens: 0 });

    useEffect(() => {
        if (!isActive) { setPhase('idle'); return; }

        let cancelled = false;
        setPhase('typing');
        setVisibleLines(0);
        setMetrics({ users: 0, tokens: 0 });

        // Type lines one by one
        let line = 0;
        const typeNext = () => {
            if (cancelled) return;
            if (line < CODE_LINES.length) {
                line++;
                setVisibleLines(line);
                setTimeout(typeNext, 280);
            } else {
                // Done typing
                setTimeout(() => {
                    if (cancelled) return;
                    setPhase('ready');
                    setTimeout(() => {
                        if (cancelled) return;
                        setPhase('deploying');
                        setTimeout(() => {
                            if (cancelled) return;
                            setPhase('live');
                            setTimeout(() => {
                                if (cancelled) return;
                                setPhase('metrics');
                                setMetrics({ users: 12, tokens: 24 });
                                setTimeout(() => {
                                    if (cancelled) return;
                                    setPhase('hold');
                                    setTimeout(() => {
                                        if (cancelled) return;
                                        setPhase('fading');
                                        setTimeout(() => {
                                            if (cancelled) return;
                                            setCycle(c => c + 1);
                                        }, 500);
                                    }, 2500);
                                }, 1000);
                            }, 800);
                        }, 1200);
                    }, 600);
                }, 400);
            }
        };
        setTimeout(typeNext, 400);
        return () => { cancelled = true; };
    }, [isActive, cycle]);

    const fading = phase === 'fading';
    const isReady = phase !== 'idle' && phase !== 'typing';
    const isDeploying = phase === 'deploying';
    const isLive = ['live', 'metrics', 'hold', 'fading'].includes(phase);
    const showMetrics = ['metrics', 'hold', 'fading'].includes(phase);

    return (
        <div
            className="w-full max-w-md mx-auto select-none"
            style={{ opacity: fading ? 0 : 1, transition: 'opacity 450ms ease', minHeight: '340px' }}
        >
            <div className={`rounded-2xl border overflow-hidden ${dark ? 'bg-slate-800/70 border-white/10' : 'bg-white/80 border-slate-200 shadow-lg'}`}>

                {/* Editor header */}
                <div className={`px-4 py-2.5 border-b flex items-center gap-2 ${dark ? 'border-white/8 bg-slate-900/60' : 'border-slate-100 bg-slate-50/80'}`}>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                    </div>
                    <span className={`text-[10px] font-mono ml-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>automation.config.js</span>
                </div>

                {/* Code area */}
                <div className={`px-5 py-4 font-mono text-xs leading-6 ${dark ? 'bg-slate-900/40' : 'bg-slate-50/60'}`}>
                    {CODE_LINES.map((line, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3"
                            style={{
                                opacity: i < visibleLines ? 1 : 0,
                                transform: i < visibleLines ? 'translateX(0)' : 'translateX(-8px)',
                                transition: 'opacity 0.25s ease, transform 0.25s ease',
                            }}
                        >
                            <span className={`w-4 text-right text-[10px] select-none ${dark ? 'text-gray-600' : 'text-gray-300'}`}>{i + 1}</span>
                            <span className={line.color}>{line.text}</span>
                        </div>
                    ))}
                    {phase === 'typing' && (
                        <span className={`inline-block w-1.5 h-3.5 ml-7 ${dark ? 'bg-violet-400' : 'bg-violet-500'} animate-pulse`} />
                    )}
                </div>

                {/* Deploy bar */}
                <div className={`px-5 py-3 border-t ${dark ? 'border-white/8' : 'border-slate-100'}`}>
                    {/* Progress bar (during deploy) */}
                    {isDeploying && (
                        <div className={`w-full h-1 rounded-full mb-2 overflow-hidden ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-green-500" style={{
                                width: '100%',
                                animation: 'shimmer-btn 1.2s ease forwards',
                            }} />
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isReady && (
                                <FiCheck className={`w-3.5 h-3.5 transition-all duration-300 ${isLive ? 'text-green-400' : dark ? 'text-gray-500' : 'text-gray-400'}`} />
                            )}
                            <span className={`text-[11px] font-medium ${
                                isLive ? (dark ? 'text-green-400' : 'text-green-600')
                                : isDeploying ? (dark ? 'text-amber-400' : 'text-amber-600')
                                : isReady ? (dark ? 'text-gray-400' : 'text-gray-500')
                                : (dark ? 'text-gray-600' : 'text-gray-400')
                            }`}>
                                {isLive ? 'Live ✓' : isDeploying ? 'Deploying…' : isReady ? 'Ready to deploy' : 'Writing…'}
                            </span>
                        </div>

                        {!isLive && !isDeploying && (
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-semibold ${
                                isReady
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                    : dark ? 'bg-slate-700 text-gray-500' : 'bg-slate-200 text-gray-400'
                            }`}>
                                Deploy
                            </div>
                        )}

                        {isLive && (
                            <div className="px-3 py-1 rounded-lg text-[10px] font-semibold bg-green-500/20 text-green-400">
                                Published
                            </div>
                        )}
                    </div>

                    {/* Mini metrics */}
                    {showMetrics && (
                        <div className="flex gap-4 mt-3 pt-2 border-t border-dashed" style={{
                            borderColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                            animation: 'fade-in-up 0.4s ease',
                        }}>
                            <div className="flex items-center gap-1.5">
                                <FiUsers className={`w-3 h-3 ${dark ? 'text-blue-400' : 'text-blue-500'}`} />
                                <span className={`text-[11px] font-semibold tabular-nums ${dark ? 'text-white' : 'text-gray-900'}`}>{metrics.users}</span>
                                <span className={`text-[10px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>users</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <FiDollarSign className={`w-3 h-3 ${dark ? 'text-green-400' : 'text-green-500'}`} />
                                <span className={`text-[11px] font-semibold tabular-nums ${dark ? 'text-white' : 'text-gray-900'}`}>+{metrics.tokens}</span>
                                <span className={`text-[10px] ${dark ? 'text-gray-500' : 'text-gray-400'}`}>tokens</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── AUTOMATION CATEGORIES (inline pills) ───
const CATEGORIES = [
    { icon: <FaTiktok className="w-4 h-4" />, label: 'TikTok', color: 'text-white' },
    { icon: <FaLinkedinIn className="w-4 h-4" />, label: 'LinkedIn', color: 'text-[#0A66C2]' },
    { icon: <FiTrendingUp className="w-4 h-4" />, label: 'Analytics', color: 'text-purple-400' },
    { icon: <FaFileInvoiceDollar className="w-4 h-4" />, label: 'Invoicing', color: 'text-emerald-400' },
    { icon: <FiZap className="w-4 h-4" />, label: 'Workflows', color: 'text-amber-400' },
    { icon: <FiPlay className="w-4 h-4" />, label: 'Video', color: 'text-red-400' },
];

const STATS = [
    { value: '50+', label: 'Automations' },
    { value: '6+', label: 'Platforms' },
    { value: '24/7', label: 'Always On' },
];

const DEV_STEPS = [
    { step: '01', icon: <FiUpload className="w-5 h-5" />, title: 'Upload', desc: 'Publish your automation to the marketplace' },
    { step: '02', icon: <FiUsers className="w-5 h-5" />, title: 'Users Run It', desc: 'People discover and use your automation' },
    { step: '03', icon: <FiDollarSign className="w-5 h-5" />, title: 'Earn Tokens', desc: 'Get credits for every run — cash out or use in-app' },
];

const HOW_IT_WORKS = [
    { num: '01', icon: <FiMessageSquare className="w-6 h-6" />, title: 'Describe', desc: 'Tell the AI what you want in plain words — no technical jargon needed' },
    { num: '02', icon: <FiSearch className="w-6 h-6" />, title: 'Match', desc: 'Our AI searches the marketplace and finds the best automation for your task' },
    { num: '03', icon: <FiCpu className="w-6 h-6" />, title: 'Run', desc: 'One click and it runs on autopilot — 24/7, completely hands-free' },
];

const USER_FEATURES = [
    { icon: <FiCode className="w-5 h-5" />, title: 'No Code Required', desc: 'Use any automation without writing a single line of code' },
    { icon: <FiCpu className="w-5 h-5" />, title: 'AI-Powered Matching', desc: 'Our AI understands your needs and finds the perfect tool' },
    { icon: <FiZap className="w-5 h-5" />, title: 'Always Running', desc: 'Set it once — it works around the clock, even while you sleep' },
];

const DEV_BENEFITS = [
    { icon: <FiGlobe className="w-5 h-5" />, title: 'Open Marketplace', desc: 'Reach thousands of users looking for automations', color: 'text-blue-400' },
    { icon: <FiBarChart2 className="w-5 h-5" />, title: 'Revenue Analytics', desc: 'Track earnings, usage stats, and growth in real-time', color: 'text-green-400' },
    { icon: <FiGitBranch className="w-5 h-5" />, title: 'Version Control', desc: 'Push updates seamlessly — users always get the latest', color: 'text-violet-400' },
    { icon: <FiShield className="w-5 h-5" />, title: 'Secure & Sandboxed', desc: 'Automations run in isolated, secure environments', color: 'text-amber-400' },
];

// ─── MINI ANIMATIONS FOR PLATFORM OVERVIEW ───

// ─── UNIFIED PLATFORM STORY ANIMATION ───

function PlatformStoryAnim({ isActive, dark }) {
    const [phase, setPhase] = useState(0);
    const [cycle, setCycle] = useState(0);

    // Human-centric Phases:
    // 0: Creator (Alex) building locally
    // 1: Uploading/Publishing to ModelGrow Hub
    // 2: User (Sarah) requesting via AI finding the automation
    // 3: Success & Token exchange (Sarah -> Alex)
    useEffect(() => {
        if (!isActive) return;
        let cancelled = false;
        setPhase(0);
        // Timing adjusted for storytelling
        const delays = [3000, 2000, 3000, 3500]; 
        let i = 0;
        let t;
        const next = () => {
            if (cancelled) return;
            t = setTimeout(() => {
                if (cancelled) return;
                i++;
                if (i >= delays.length) { setCycle(c => c + 1); return; }
                setPhase(i);
                next();
            }, delays[i]);
        };
        next();
        return () => { cancelled = true; clearTimeout(t); };
    }, [isActive, cycle]);

    const codeLines = [
        <span key={1}><span className="text-pink-400">export const</span> <span className="text-blue-400">tiktokPoster</span> = {'{'}</span>,
        <span key={2} className="pl-4"><span className="text-blue-300">trigger:</span> <span className="text-amber-300">'@schedule'</span>,</span>,
        <span key={3} className="pl-4"><span className="text-blue-300">action:</span> <span className="text-green-300">uploadVideo</span>()</span>,
        <span key={4}>{'}'}</span>
    ];

    return (
        <div className={`w-full relative p-6 sm:p-10 md:p-12 rounded-[2.5rem] border overflow-hidden shadow-2xl flex flex-col md:flex-row items-stretch justify-between gap-10 select-none ${
            dark ? 'bg-slate-800/40 border-white/[0.08] shadow-violet-500/5' : 'bg-white/60 border-slate-200/80 shadow-violet-500/10'
        }`}>
            {/* Background Glows */}
            <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r ${dark ? 'from-violet-500/10' : 'from-violet-500/5'} to-transparent -z-10`} />
            <div className={`absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-l ${dark ? 'from-amber-500/10' : 'from-amber-500/5'} to-transparent -z-10`} />

            {/* 1. THE CREATOR (Left) */}
            <div className={`w-full md:w-1/3 flex flex-col gap-5 relative z-10 transition-all duration-700 ${phase >= 0 ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-8'}`}>
                {/* Persona Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shadow-lg">
                        <FiUser className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className={`text-[10px] font-bold tracking-widest uppercase ${dark ? 'text-violet-400' : 'text-violet-600'}`}>The Creator</span>
                        <h3 className={`text-sm font-bold leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Alex<br/><span className="text-xs font-normal opacity-70">Automation Expert</span></h3>
                    </div>
                </div>

                {/* Developer Workspace */}
                <div className={`p-4 rounded-2xl border backdrop-blur-sm relative z-20 ${dark ? 'bg-slate-900/80 border-white/5 shadow-xl' : 'bg-white shadow-xl border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/50 dark:border-white/5">
                        <div className="flex items-center gap-2">
                            <FiTerminal className={`w-3.5 h-3.5 ${dark ? 'text-violet-400' : 'text-violet-600'}`} />
                            <span className={`text-xs font-mono font-semibold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>tiktok-poster.js</span>
                        </div>
                        {/* Status dot */}
                        <div className={`w-2 h-2 rounded-full transition-colors ${phase >= 1 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500 animate-pulse'}`} />
                    </div>
                    <div className="font-mono text-[10px] sm:text-[11px] leading-loose flex flex-col gap-1 mb-4">
                        {codeLines.map((line, i) => (
                            <div key={i} style={{ opacity: phase >= 0 ? 1 : 0, transition: `opacity 0.3s ease ${i * 150}ms` }}>
                                {line}
                            </div>
                        ))}
                    </div>

                    {/* Publish Action */}
                    <div className={`flex items-center justify-between pt-3 border-t ${dark ? 'border-white/5' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-1.5">
                            <FiDollarSign className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[11px] font-bold text-amber-500">10 Tokens</span>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                            phase >= 1 
                                ? 'bg-green-500/20 text-green-600 dark:text-green-400' 
                                : 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                        }`}>
                            {phase >= 1 ? <FiCheck className="w-3 h-3" /> : <FiUploadCloud className="w-3 h-3" />}
                            {phase >= 1 ? 'Published' : 'Publish'}
                        </div>
                    </div>
                </div>

                {/* Creator Wallet */}
                <div className={`mt-2 p-3 rounded-xl border flex items-center justify-between ${dark ? 'bg-slate-800/60 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Earnings</span>
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all ${
                        phase >= 3 
                            ? (dark ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-100 border-green-300') 
                            : 'bg-transparent'
                    }`}>
                        <span className={`text-[11px] font-bold font-mono transition-colors ${phase >= 3 ? 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {phase >= 3 ? '1,250' : '1,240'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. THE PLATFORM HUB (Center) */}
            <div className="w-full md:w-1/3 flex flex-col items-center justify-center relative min-h-[220px]">
                {/* Connecting Lines (Desktop only) */}
                <div className="hidden md:block absolute top-[40%] left-0 w-full h-[2px] -translate-y-1/2 -z-10">
                    <div className={`w-full h-full ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    
                    {/* File Uploading Animation (Left to Center) */}
                    {phase === 1 && (
                        <div className="absolute top-1/2 left-0 w-1/2 h-0 flex items-center -translate-y-1/2 origin-left z-20"
                             style={{ animation: 'upload-file 2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
                            <div className="w-8 h-8 rounded bg-violet-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                                <FiCode className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    )}

                    {/* Flow Execution Animation (Center to Right) */}
                    {phase >= 2 && (
                        <div className="absolute top-0 right-0 h-full bg-gradient-to-l from-violet-500 via-pink-500 to-transparent w-full origin-right" 
                             style={{ animation: 'shimmer-btn 1.5s ease-out forwards' }} />
                    )}
                </div>

                {/* Hub Core */}
                <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] flex flex-col items-center justify-center border transition-all duration-700 z-10 backdrop-blur-md ${
                    phase >= 1 
                        ? (dark ? 'border-violet-500/50 bg-violet-500/10 shadow-[0_0_50px_rgba(139,92,246,0.25)]' : 'border-violet-400 bg-violet-50 shadow-[0_0_50px_rgba(139,92,246,0.3)]')
                        : (dark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white/50')
                }`}>
                    {/* Ring animation */}
                    {phase >= 1 && (
                        <div className={`absolute inset-0 rounded-[2rem] border-2 opacity-20 ${phase === 3 ? 'border-green-500' : 'border-violet-500'}`} style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                    )}

                    {phase === 0 ? (
                        <FiCpu className={`w-10 h-10 ${dark ? 'text-slate-600' : 'text-slate-300'}`} />
                    ) : phase === 1 ? (
                        <FiUploadCloud className={`w-10 h-10 animate-bounce ${dark ? 'text-violet-400' : 'text-violet-500'}`} />
                    ) : phase === 2 ? (
                        <FiZap className={`w-10 h-10 animate-pulse ${dark ? 'text-pink-400' : 'text-pink-500'}`} />
                    ) : (
                        <FiCheck className="w-12 h-12 text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] scale-110 transition-transform" />
                    )}

                    {/* Animated Token moving right-to-left (User -> Creator) */}
                    {phase === 3 && (
                        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-amber-400 border-2 border-amber-200 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.6)] z-30"
                             style={{ animation: 'move-token 2.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}>
                            <FiDollarSign className="w-5 h-5 text-amber-900" />
                        </div>
                    )}
                </div>

                {/* Hub Status */}
                <div className="mt-8 text-center bg-slate-900/5 dark:bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-slate-200/50 dark:border-white/5">
                    <p className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${phase >= 1 ? 'opacity-100' : 'opacity-0'} ${
                        phase === 3 ? 'text-green-500' : dark ? 'text-violet-400' : 'text-violet-600'
                    }`}>
                        {phase === 1 ? 'Receiving...' : phase === 2 ? 'Running Job...' : phase === 3 ? 'Success' : 'Ready'}
                    </p>
                </div>
                
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes upload-file {
                        0% { transform: translate(-100px, -50%) scale(0.5); opacity: 0; }
                        20% { transform: translate(-50px, -50%) scale(1); opacity: 1; }
                        80% { transform: translate(50px, -50%) scale(1); opacity: 1; }
                        100% { transform: translate(100px, -50%) scale(0.5); opacity: 0; }
                    }
                    @keyframes move-token {
                        0% { transform: translate(180px, -50%) scale(0.5); opacity: 0; }
                        20% { transform: translate(90px, -50%) scale(1.1); opacity: 1; }
                        80% { transform: translate(-90px, -50%) scale(1); opacity: 1; }
                        100% { transform: translate(-180px, -50%) scale(0.5); opacity: 0; }
                    }
                    @media (max-width: 767px) {
                        @keyframes move-token {
                            0% { transform: translate(-50%, 180px) scale(0.5); opacity: 0; }
                            20% { transform: translate(-50%, 90px) scale(1.1); opacity: 1; }
                            80% { transform: translate(-50%, -90px) scale(1); opacity: 1; }
                            100% { transform: translate(-50%, -180px) scale(0.5); opacity: 0; }
                        }
                        @keyframes upload-file {
                            0% { transform: translate(-50%, -100px) scale(0.5); opacity: 0; }
                            20% { transform: translate(-50%, -50px) scale(1); opacity: 1; }
                            80% { transform: translate(-50%, 50px) scale(1); opacity: 1; }
                            100% { transform: translate(-50%, 100px) scale(0.5); opacity: 0; }
                        }
                    }
                `}} />
            </div>

            {/* 3. THE END USER (Right) */}
            <div className={`w-full md:w-1/3 flex flex-col gap-5 relative z-10 transition-all duration-700 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-8'}`}>
                {/* Persona Header (Reversed layout) */}
                <div className="flex items-center justify-end gap-3 mb-2 text-right">
                    <div>
                        <span className={`text-[10px] font-bold tracking-widest uppercase ${dark ? 'text-pink-400' : 'text-pink-600'}`}>The End User</span>
                        <h3 className={`text-sm font-bold leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Sarah<br/><span className="text-xs font-normal opacity-70">Content Creator</span></h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center shadow-lg">
                        <FiUser className="w-5 h-5 text-white" />
                    </div>
                </div>

                {/* User App Interface */}
                <div className={`p-4 rounded-2xl border backdrop-blur-sm ${dark ? 'bg-slate-900/80 border-white/5 shadow-xl' : 'bg-white shadow-xl border-slate-200'}`}>
                    <div className="flex flex-col gap-4">
                        {/* User Message */}
                        <div className="flex justify-end" style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.4s ease' }}>
                            <div className={`px-4 py-2.5 rounded-2xl rounded-tr-sm text-[11px] font-medium max-w-[95%] shadow-md ${dark ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'}`}>
                                Post my newest video to TikTok!
                            </div>
                        </div>

                        {/* AI Match Response */}
                        <div className="flex justify-start" style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.6s ease 500ms' }}>
                            <div className={`px-3 py-3 rounded-2xl rounded-tl-sm text-xs font-medium w-full shadow-md flex flex-col gap-3 ${dark ? 'bg-slate-800 text-slate-200 border border-white/5' : 'bg-slate-50 text-slate-700 border border-slate-200/50'}`}>
                                <p className="text-[10px] opacity-80">Finding automation...</p>
                                <div className={`px-3 py-2.5 rounded-xl flex items-center justify-between border ${dark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <div className="flex items-center gap-2">
                                        <FaTiktok className={`w-4 h-4 ${phase >= 3 ? 'text-pink-500' : 'text-slate-400'}`} />
                                        <span className="text-[11px] font-semibold">tiktok-poster</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {phase >= 3 && <FiCheck className="w-3 h-3 text-green-500" />}
                                        <span className={`text-[10px] font-bold ${phase >= 3 ? 'text-green-500' : 'text-amber-500'}`}>
                                            {phase >= 3 ? 'Done' : '-10 Tokens'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Wallet */}
                <div className={`mt-2 p-3 rounded-xl border flex items-center justify-between ${dark ? 'bg-slate-800/60 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-xs font-semibold ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Balance</span>
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded transition-all ${
                        phase >= 3 
                            ? (dark ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-100 border-red-300') 
                            : 'bg-transparent'
                    }`}>
                        <span className={`text-[11px] font-bold font-mono transition-colors ${phase >= 3 ? 'text-red-500' : dark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {phase >= 3 ? '490' : '500'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

const FAQ_ITEMS = [
    { q: 'What is ModelGrow?', a: 'ModelGrow is an AI-powered automation platform where you can discover, run, and build automations for social media, invoicing, analytics, and more — all through a simple chat interface.' },
    { q: 'Is it free to use?', a: 'Yes! You can sign up and start using automations for free. Some premium automations may require tokens, which you can earn by contributing or purchase in the app.' },
    { q: 'How do tokens work?', a: 'Tokens are the in-app currency. Users spend tokens to run premium automations, and developers earn tokens every time someone uses their automation. Tokens can be cashed out or reinvested.' },
    { q: 'Do I need to code?', a: 'Not at all! As a user, just describe what you want in plain language and our AI will find and run the right automation for you. No technical knowledge required.' },
    { q: 'How do I earn as a developer?', a: 'Build an automation, publish it to the marketplace, and earn tokens every time a user runs it. The more popular your automation, the more you earn.' },
    { q: 'What platforms are supported?', a: 'Currently we support TikTok, LinkedIn, invoicing tools, analytics platforms, and more. New integrations are added regularly based on community demand.' },
];

function FaqItem({ item, isOpen, onToggle, dark }) {
    return (
        <div className={`border-b transition-colors ${dark ? 'border-white/[0.06]' : 'border-slate-200/80'}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between py-5 text-left group"
            >
                <span className={`text-[15px] sm:text-base font-semibold group-hover:text-violet-500 transition-colors ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {item.q}
                </span>
                <FiChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-500' : dark ? 'text-slate-500' : 'text-slate-400'}`}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out`}
                style={{
                    maxHeight: isOpen ? '200px' : '0',
                    opacity: isOpen ? 1 : 0,
                    marginBottom: isOpen ? '20px' : '0'
                }}
            >
                <p className={`text-sm sm:text-[15px] leading-relaxed pr-8 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {item.a}
                </p>
            </div>
        </div>
    );
}

// ─── FOOTER COMPONENT ───
function Footer({ dark }) {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className={`w-full pt-16 pb-8 relative overflow-hidden ${dark ? 'bg-transparent' : 'bg-slate-50 border-t border-slate-200'}`}>
            {/* Top gradient divider */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${dark ? 'from-transparent via-violet-500/40 to-transparent' : 'from-transparent via-violet-500/20 to-transparent'}`} />
            {/* Subtle ambient glow */}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[150px] rounded-full pointer-events-none ${dark ? 'bg-violet-900/10' : 'bg-violet-500/5'}`} />

            <div className="max-w-7xl mx-auto px-6 sm:px-10 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
                    
                    {/* Brand Column */}
                    <div className="col-span-2 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Image src="/logo.png" alt="ModelGrow Logo" width={32} height={32} className="object-contain" />
                            <span className={`text-xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>ModelGrow</span>
                        </div>
                        <p className={`text-sm leading-relaxed max-w-sm mb-6 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                            The AI automation platform built for scale. Discover, run, and monetize automations effortlessly through a conversational interface.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${dark ? 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-white/10 hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-white text-slate-500 hover:text-slate-900 shadow-sm border border-slate-200 hover:border-violet-200 hover:shadow-violet-500/10'}`}>
                                <FaTwitter className="w-4 h-4" />
                            </a>
                            <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${dark ? 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-white/10 hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-white text-slate-500 hover:text-slate-900 shadow-sm border border-slate-200 hover:border-violet-200 hover:shadow-violet-500/10'}`}>
                                <FaGithub className="w-4 h-4" />
                            </a>
                            <a href="#" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${dark ? 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-white/10 hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-white text-slate-500 hover:text-slate-900 shadow-sm border border-slate-200 hover:border-violet-200 hover:shadow-violet-500/10'}`}>
                                <FaDiscord className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>Product</h4>
                        <ul className={`text-sm flex flex-col gap-3 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <li><a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400' : 'hover:text-violet-500'}`}>Features</a></li>
                            <li><a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400' : 'hover:text-violet-500'}`}>Token Economy</a></li>
                            <li><a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400' : 'hover:text-violet-500'}`}>Pricing</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>Resources</h4>
                        <ul className={`text-sm flex flex-col gap-3 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <li><a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400' : 'hover:text-violet-500'}`}>Documentation</a></li>
                            <li><a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400' : 'hover:text-violet-500'}`}>Developer API</a></li>
                            <li><a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400' : 'hover:text-violet-500'}`}>Blog</a></li>
                            <li><a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400' : 'hover:text-violet-500'}`}>Community</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className={`text-sm font-semibold mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>Company</h4>
                        <ul className={`text-sm flex flex-col gap-3 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <li><a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400' : 'hover:text-violet-500'}`}>About Us</a></li>
                            <li><a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400' : 'hover:text-violet-500'}`}>Careers</a></li>
                            <li><a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400' : 'hover:text-violet-500'}`}>Contact</a></li>
                            <li><a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400' : 'hover:text-violet-500'}`}>Partners</a></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className={`pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs ${dark ? 'border-white/10 text-slate-400' : 'border-slate-200/80 text-slate-500'}`}>
                    <p>© {currentYear} ModelGrow Inc. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <a href="/privacy" className={`transition-colors ${dark ? 'hover:text-violet-400 text-slate-400' : 'hover:text-violet-500 text-slate-500'}`}>Privacy Policy</a>
                        <a href="/terms" className={`transition-colors ${dark ? 'hover:text-violet-400 text-slate-400' : 'hover:text-violet-500 text-slate-500'}`}>Terms of Service</a>
                        <a href="#" className={`transition-colors ${dark ? 'hover:text-violet-400 text-slate-400' : 'hover:text-violet-500 text-slate-500'}`}>Security</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// ─── AUTOMATIONS SHOWCASE ───
// Icon mapping for connector names
const CONNECTOR_ICONS = {
    tiktok: <FaTiktok className="w-3 h-3" />,
    google: <FiGlobe className="w-3 h-3" />,
    gmail: <FiMessageSquare className="w-3 h-3" />,
    sheets: <FiBarChart2 className="w-3 h-3" />,
    drive: <FiUploadCloud className="w-3 h-3" />,
    calendar: <FiActivity className="w-3 h-3" />,
    linkedin: <FaLinkedinIn className="w-3 h-3" />,
    email: <FiMessageSquare className="w-3 h-3" />,
    slack: <FiMessageSquare className="w-3 h-3" />,
    notion: <FiLayout className="w-3 h-3" />,
};

// Deterministic gradient palette per card index
const CARD_GRADIENTS = [
    'from-violet-500 to-indigo-600',
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-rose-500',
    'from-emerald-500 to-green-500',
    'from-amber-500 to-orange-500',
    'from-purple-500 to-fuchsia-500',
];

function getConnectorIcon(name = '') {
    const key = name.toLowerCase();
    for (const [k, icon] of Object.entries(CONNECTOR_ICONS)) {
        if (key.includes(k)) return icon;
    }
    return <FiZap className="w-3 h-3" />;
}

function getCardIcon(name = '') {
    const n = name.toLowerCase();
    if (n.includes('linkedin')) return <FaLinkedinIn className="w-4 h-4 text-white" />;
    if (n.includes('tiktok')) return <FaTiktok className="w-4 h-4 text-white" />;
    return <FiZap className="w-4 h-4 text-white" />;
}

function AutomationShowcaseCard({ automation, index, isVisible, onSignUpClick }) {
    const { isDarkMode } = useThemeAdaptive();
    const dark = isDarkMode;
    const grad = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

    const connectors = Array.isArray(automation.required_connectors)
        ? automation.required_connectors
        : typeof automation.required_connectors === 'string'
            ? automation.required_connectors.split(',').map(s => s.trim()).filter(Boolean)
            : [];

    const price = automation.price_per_run
        ? `${automation.price_per_run.toFixed(2)} cr / run`
        : 'Free';

    const isFree = !automation.price_per_run;

    return (
        <div
            className={`rounded-2xl border flex flex-col gap-4 p-5 cursor-pointer group transition-all duration-300 ${
                dark
                    ? 'bg-slate-800/60 border-white/[0.07] hover:border-violet-500/40 hover:bg-slate-800/90 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]'
                    : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-xl shadow-sm'
            }`}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(18px)',
                transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s ease ${index * 80}ms`,
            }}
            onClick={onSignUpClick}
        >
            {/* Icon + name row */}
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                    {getCardIcon(automation.name)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-snug truncate ${dark ? 'text-white' : 'text-gray-900'}`}>
                        {automation.name}
                    </p>
                    <span className={`text-[11px] font-semibold mt-0.5 inline-block ${
                        isFree
                            ? dark ? 'text-emerald-400' : 'text-emerald-600'
                            : dark ? 'text-violet-400' : 'text-violet-600'
                    }`}>
                        {price}
                    </span>
                </div>
            </div>

            {/* Description */}
            <p className={`text-xs leading-relaxed line-clamp-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                {automation.description}
            </p>

            {/* Connectors */}
            {connectors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-auto">
                    {connectors.slice(0, 4).map((c, i) => (
                        <span
                            key={i}
                            className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                dark
                                    ? 'bg-slate-700/80 text-slate-300 border border-white/[0.06]'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                        >
                            {c}
                        </span>
                    ))}
                    {connectors.length > 4 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            +{connectors.length - 4}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

function AutomationsShowcase({ isActive, onSignUpClick }) {
    const { isDarkMode } = useThemeAdaptive();
    const dark = isDarkMode;

    const PAGE_SIZE = 6;
    const [allAutomations, setAllAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [cardsVisible, setCardsVisible] = useState(false);
    const [swapping, setSwapping] = useState(false);

    useEffect(() => {
        fetch('/api/automations')
            .then(r => r.json())
            .then(data => {
                if (!Array.isArray(data)) { setLoading(false); return; }
                // Sort: LinkedIn first, then TikTok, then rest
                const sorted = [...data].sort((a, b) => {
                    const priority = (name = '') => {
                        const n = name.toLowerCase();
                        if (n.includes('linkedin')) return 0;
                        if (n.includes('tiktok')) return 1;
                        return 2;
                    };
                    return priority(a.name) - priority(b.name);
                });
                setAllAutomations(sorted);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (isActive && !loading) {
            const t = setTimeout(() => setCardsVisible(true), 100);
            return () => clearTimeout(t);
        }
    }, [isActive, loading]);

    const totalPages = Math.ceil(allAutomations.length / PAGE_SIZE);
    const currentCards = allAutomations.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    const hasMore = allAutomations.length > PAGE_SIZE;

    const handlePageChange = (nextPage) => {
        // Fade out → swap → fade in
        setCardsVisible(false);
        setSwapping(true);
        setTimeout(() => {
            setPage(nextPage);
            setSwapping(false);
            setTimeout(() => setCardsVisible(true), 60);
        }, 280);
    };

    const handleShowMore = () => {
        const nextPage = (page + 1) % totalPages;
        handlePageChange(nextPage);
    };

    // Skeleton placeholders while loading
    const skeletonCards = Array.from({ length: PAGE_SIZE });

    return (
        <div className="w-full max-w-6xl mx-auto px-6 sm:px-10 pt-20 sm:pt-28 pb-12">
            {/* Header */}
            <div className="text-center mb-12">
                <span className={`inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full ${dark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                    Live automations
                </span>
                <h2 className={`text-3xl sm:text-4xl font-bold leading-tight mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>
                    Run any of these{' '}
                    <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
                        in one message.
                    </span>
                </h2>
                <p className={`text-sm sm:text-base max-w-lg mx-auto ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Real automations, built by creators. Just describe what you need — the AI finds and runs it for you.
                </p>
            </div>

            {/* Cards grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skeletonCards.map((_, i) => (
                        <div
                            key={i}
                            className={`h-44 rounded-2xl border animate-pulse ${dark ? 'bg-slate-800/40 border-white/[0.05]' : 'bg-slate-100 border-slate-200'}`}
                        />
                    ))}
                </div>
            ) : currentCards.length > 0 ? (
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    style={{ transition: 'opacity 0.25s ease', opacity: swapping ? 0 : 1 }}
                >
                    {currentCards.map((auto, i) => (
                        <AutomationShowcaseCard
                            key={auto.id}
                            automation={auto}
                            index={i}
                            isVisible={cardsVisible}
                            onSignUpClick={onSignUpClick}
                        />
                    ))}
                </div>
            ) : (
                /* Empty state */
                <div className={`rounded-2xl border p-12 text-center ${dark ? 'bg-slate-800/40 border-white/[0.07]' : 'bg-slate-50 border-slate-200'}`}>
                    <FiZap className={`w-8 h-8 mx-auto mb-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Automations coming soon — check back shortly.
                    </p>
                </div>
            )}

            {/* Bottom row: Sign up CTA + optional page swap */}
            {!loading && currentCards.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                    <button
                        onClick={onSignUpClick}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all duration-200"
                    >
                        <FiZap className="w-4 h-4" />
                        Sign up to run these
                    </button>

                    {hasMore && (
                        <button
                            onClick={handleShowMore}
                            disabled={swapping}
                            className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                                dark
                                    ? 'border-white/10 text-slate-300 hover:border-violet-500/40 hover:text-white hover:bg-white/5'
                                    : 'border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <FiChevronRight className="w-4 h-4" />
                            Show more
                            <span className={`text-[11px] font-normal ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {page + 1} / {totalPages}
                            </span>
                        </button>
                    )}
                </div>
            )}

            {!loading && currentCards.length > 0 && (
                <p className={`text-xs text-center mt-3 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Free to start · No credit card required
                </p>
            )}
        </div>
    );
}



export default function LandingSections({ onSignUpClick }) {
    const { isDarkMode } = useThemeAdaptive();
    const dark = isDarkMode;

    const [wfRef, wfVisible] = useScrollVisible(0.15);
    const [userRef, userVisible] = useScrollVisible(0.15);
    const [dashRef, dashVisible] = useScrollVisible(0.12);
    const [howRef, howVisible] = useScrollVisible(0.12);
    const [featRef, featVisible] = useScrollVisible(0.12);
    const [devRef, devVisible] = useScrollVisible(0.15);
    const [codeRef, codeVisible] = useScrollVisible(0.12);
    const [benRef, benVisible] = useScrollVisible(0.12);
    const [platRef, platVisible] = useScrollVisible(0.1);
    const [faqRef, faqVisible] = useScrollVisible(0.1);
    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div className="w-full">

            {/* ══════════════════════════════════════════════════
                SECTION 0 — WORKFLOW LOG (first thing after hero)
            ══════════════════════════════════════════════════ */}
            <div ref={wfRef} className="anim-contain">
                <AutomationsShowcase isActive={wfVisible} onSignUpClick={onSignUpClick} />
            </div>

            {/* ══════════════════════════════════════════════════
                SECTION 1 — FOR EVERYONE
                Split layout: text-left, animation-right
            ══════════════════════════════════════════════════ */}
            <section
                ref={userRef}
                className="relative w-full overflow-hidden"
            >
                {/* Decorative glow orbs */}
                <div
                    className="landing-glow"
                    style={{
                        width: '500px', height: '500px',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)',
                        top: '-100px', right: '-100px',
                    }}
                />
                <div
                    className="landing-glow"
                    style={{
                        width: '400px', height: '400px',
                        background: 'radial-gradient(circle, rgba(79,70,229,0.4) 0%, transparent 70%)',
                        bottom: '-50px', left: '-80px',
                    }}
                />

                <div className={`max-w-6xl mx-auto px-6 sm:px-10 py-20 sm:py-28 relative z-10`}>
                    <div className="landing-split">

                        {/* Left column — text content */}
                        <div className={`animate-on-scroll stagger-1 ${userVisible ? 'visible' : ''}`}>
                            <span className={`inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full ${dark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                                For Everyone
                            </span>

                            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                                Describe It.{' '}
                                <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
                                    We Automate It.
                                </span>
                            </h2>

                            <p className={`text-base sm:text-lg mb-8 leading-relaxed max-w-lg ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Tell us what you want to automate in plain language. Our AI finds the right tool and runs it for you — no coding needed.
                            </p>

                            {/* Category pills */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {CATEGORIES.map((cat, i) => (
                                    <div
                                        key={cat.label}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-300 hover:scale-105 cursor-default ${dark
                                            ? 'bg-slate-800/70 border-white/10 hover:border-violet-500/40 text-gray-300'
                                            : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-md text-gray-700'
                                            }`}
                                        style={{ animationDelay: `${i * 60}ms` }}
                                    >
                                        <span className={cat.color}>{cat.icon}</span>
                                        {cat.label}
                                    </div>
                                ))}
                            </div>

                            {/* Inline stats */}
                            <div className="flex gap-6 sm:gap-8">
                                {STATS.map(stat => (
                                    <div key={stat.label}>
                                        <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${dark ? 'text-white' : 'text-gray-900'}`}>
                                            {stat.value}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right column — animation */}
                        <div className={`mt-10 md:mt-0 animate-on-scroll stagger-2 ${userVisible ? 'visible' : ''}`}>
                            <div className={`rounded-2xl p-4 sm:p-6 glass-card anim-contain ${dark
                                ? 'bg-slate-800/40 border border-white/[0.06] shadow-2xl shadow-violet-500/5'
                                : 'bg-white/50 border border-slate-200/60 shadow-xl shadow-violet-500/5'
                                }`}>
                                <UserFlowAnimation isActive={userVisible} />
                            </div>
                        </div>
                    </div>

                    {/* ── Dashboard Preview — animation-left, text-right ── */}
                    <div
                        ref={dashRef}
                        className={`mt-20 sm:mt-28 animate-on-scroll ${dashVisible ? 'visible' : ''}`}
                    >
                        <div className="landing-split-reverse">
                            {/* Text — right side (DOM first, pushed right by CSS) */}
                            <div className={`animate-on-scroll stagger-1 ${dashVisible ? 'visible' : ''}`}>
                                <span className={`inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full ${dark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                                    Your Control Center
                                </span>

                                <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-5 leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                                    Track Everything.{' '}
                                    <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                                        In Real Time.
                                    </span>
                                </h3>

                                <p className={`text-base sm:text-lg mb-6 leading-relaxed max-w-lg ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Monitor all your running automations from a single dashboard. See what's active, what's completed, and what needs attention — all in one glance.
                                </p>

                                <div className="flex flex-wrap gap-4">
                                    {[{ icon: <FiActivity className="w-4 h-4" />, text: 'Live status updates' }, { icon: <FiBarChart2 className="w-4 h-4" />, text: 'Detailed activity log' }, { icon: <FiZap className="w-4 h-4" />, text: 'Instant notifications' }].map(f => (
                                        <div key={f.text} className={`flex items-center gap-2 text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <span className={dark ? 'text-violet-400' : 'text-violet-500'}>{f.icon}</span>
                                            {f.text}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Animation — left side (DOM second, pushed left by CSS) */}
                            <div className={`mt-10 md:mt-0 animate-on-scroll stagger-2 ${dashVisible ? 'visible' : ''}`}>
                                <div className={`rounded-2xl p-4 sm:p-6 glass-card anim-contain ${dark
                                    ? 'bg-slate-800/40 border border-white/[0.06] shadow-2xl shadow-violet-500/5'
                                    : 'bg-white/50 border border-slate-200/60 shadow-xl shadow-violet-500/5'
                                }`}>
                                    <DashboardAnimation isActive={dashVisible} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── How It Works — 3-step flow ── */}
                    <div
                        ref={howRef}
                        className={`mt-20 sm:mt-28 animate-on-scroll stagger-1 ${howVisible ? 'visible' : ''}`}
                    >
                        <div className="text-center mb-12">
                            <h3 className={`text-2xl sm:text-3xl font-bold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>
                                How It Works
                            </h3>
                            <p className={`text-sm sm:text-base max-w-md mx-auto ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Three simple steps to automate anything
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 max-w-3xl mx-auto">
                            {HOW_IT_WORKS.map((step, i) => (
                                <div
                                    key={step.num}
                                    className={`step-connector text-center px-4 py-6 rounded-2xl border transition-all duration-500 hover:scale-[1.03] ${dark
                                        ? 'bg-slate-800/50 border-white/[0.06] hover:border-violet-500/30'
                                        : 'bg-white/70 border-slate-200 hover:border-violet-300 hover:shadow-lg'
                                    }`}
                                    style={{ transitionDelay: `${i * 120}ms` }}
                                >
                                    {/* Number badge */}
                                    <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${dark
                                        ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20 text-violet-400'
                                        : 'bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600'
                                    }`}>
                                        {step.icon}
                                    </div>
                                    <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${dark ? 'text-violet-400/60' : 'text-violet-500/60'}`}>
                                        Step {step.num}
                                    </p>
                                    <p className={`text-base font-semibold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>
                                        {step.title}
                                    </p>
                                    <p className={`text-xs sm:text-sm leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {step.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Feature highlights ── */}
                    <div
                        ref={featRef}
                        className={`mt-16 sm:mt-20 animate-on-scroll stagger-2 ${featVisible ? 'visible' : ''}`}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
                            {USER_FEATURES.map((feat, i) => (
                                <div
                                    key={feat.title}
                                    className={`flex items-start gap-4 p-5 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${dark
                                        ? 'bg-slate-800/30 border-white/[0.05] hover:border-violet-500/20'
                                        : 'bg-white/60 border-slate-200/80 hover:border-violet-200 hover:shadow-md'
                                    }`}
                                    style={{ transitionDelay: `${i * 100}ms` }}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${dark
                                        ? 'bg-violet-500/10 text-violet-400'
                                        : 'bg-violet-100 text-violet-600'
                                    }`}>
                                        {feat.icon}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>
                                            {feat.title}
                                        </p>
                                        <p className={`text-xs leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {feat.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section divider ── */}
            <div className="w-full max-w-6xl mx-auto px-6 sm:px-10">
                <div className={`h-px ${dark
                    ? 'bg-gradient-to-r from-transparent via-violet-500/20 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-slate-300 to-transparent'
                    }`}
                />
            </div>

            {/* ══════════════════════════════════════════════════
                SECTION 2 — FOR DEVELOPERS
                Contrasting background, reverse split layout
            ══════════════════════════════════════════════════ */}
            <section
                ref={devRef}
                className={`relative w-full overflow-hidden ${dark
                    ? ''
                    : 'bg-gradient-to-b from-slate-50/80 via-slate-100/40 to-transparent'
                    }`}
            >
                {/* Decorative glow orbs */}
                <div
                    className="landing-glow"
                    style={{
                        width: '450px', height: '450px',
                        background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%)',
                        top: '-80px', left: '-60px',
                    }}
                />
                <div
                    className="landing-glow"
                    style={{
                        width: '350px', height: '350px',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
                        bottom: '-60px', right: '-60px',
                    }}
                />

                <div className={`max-w-6xl mx-auto px-6 sm:px-10 py-20 sm:py-28 relative z-10`}>
                    <div className="landing-split-reverse">

                        {/* Left column (visually) — text content (but DOM order: first child, pushed to right by CSS) */}
                        <div className={`animate-on-scroll stagger-1 ${devVisible ? 'visible' : ''}`}>
                            <span className={`inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full ${dark ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                For Developers
                            </span>

                            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                                Upload.{' '}
                                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                                    Earn. Grow.
                                </span>
                            </h2>

                            <p className={`text-base sm:text-lg mb-10 leading-relaxed max-w-lg ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Build automations, publish them to the marketplace, and earn tokens every time someone uses your work. Cash out or reinvest — it's up to you.
                            </p>

                            {/* Vertical timeline — How it works */}
                            <div className="space-y-0 mb-10">
                                {DEV_STEPS.map((s, i) => (
                                    <div key={s.step} className="flex gap-4 items-start">
                                        {/* Timeline node + connector */}
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${dark ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                                {s.icon}
                                            </div>
                                            {i < DEV_STEPS.length - 1 && (
                                                <div className={`w-0.5 h-8 my-1 ${dark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                            )}
                                        </div>

                                        {/* Step text */}
                                        <div className="pt-1.5 pb-2">
                                            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>
                                                {s.title}
                                            </p>
                                            <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {s.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <div>
                                <button
                                    onClick={() => onSignUpClick?.()}
                                    className="btn-shimmer px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300"
                                >
                                    Start Earning
                                </button>
                                <p className={`text-xs mt-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Free to join. No upfront costs.
                                </p>
                            </div>
                        </div>

                        {/* Right column (visually) — animation (DOM order: second child, pushed to left by CSS) */}
                        <div className={`mt-10 md:mt-0 animate-on-scroll stagger-2 ${devVisible ? 'visible' : ''}`}>
                            <div className={`rounded-2xl p-4 sm:p-6 glass-card ${dark
                                ? 'bg-slate-800/40 border border-white/[0.06] shadow-2xl shadow-green-500/5'
                                : 'bg-white/50 border border-slate-200/60 shadow-xl shadow-green-500/5'
                                }`}>
                                <DevFlowAnimation isActive={devVisible} />
                            </div>
                        </div>
                    </div>

                    {/* ── Code Deploy Preview — animation-right, text-left ── */}
                    <div
                        ref={codeRef}
                        className={`mt-20 sm:mt-28 animate-on-scroll ${codeVisible ? 'visible' : ''}`}
                    >
                        <div className="landing-split">
                            {/* Text — left side */}
                            <div className={`animate-on-scroll stagger-1 ${codeVisible ? 'visible' : ''}`}>
                                <span className={`inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full ${dark ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                    Developer Experience
                                </span>

                                <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-5 leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                                    Build It. Ship It.{' '}
                                    <span className="bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
                                        Done.
                                    </span>
                                </h3>

                                <p className={`text-base sm:text-lg mb-6 leading-relaxed max-w-lg ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Create automations with a simple config, deploy in one click, and watch users start using it immediately. No infrastructure to manage.
                                </p>

                                <div className="flex flex-wrap gap-4">
                                    {[{ icon: <FiTerminal className="w-4 h-4" />, text: 'Simple config format' }, { icon: <FiUpload className="w-4 h-4" />, text: 'One-click deploy' }, { icon: <FiUsers className="w-4 h-4" />, text: 'Instant user access' }].map(f => (
                                        <div key={f.text} className={`flex items-center gap-2 text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <span className={dark ? 'text-green-400' : 'text-green-500'}>{f.icon}</span>
                                            {f.text}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Animation — right side */}
                            <div className={`mt-10 md:mt-0 animate-on-scroll stagger-2 ${codeVisible ? 'visible' : ''}`}>
                                <div className={`rounded-2xl p-4 sm:p-6 glass-card ${dark
                                    ? 'bg-slate-800/40 border border-white/[0.06] shadow-2xl shadow-green-500/5'
                                    : 'bg-white/50 border border-slate-200/60 shadow-xl shadow-green-500/5'
                                }`}>
                                    <CodeDeployAnimation isActive={codeVisible} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Developer Benefits Grid ── */}
                    <div
                        ref={benRef}
                        className={`mt-20 sm:mt-28 animate-on-scroll stagger-3 ${benVisible ? 'visible' : ''}`}
                    >
                        <div className="text-center mb-12">
                            <h3 className={`text-2xl sm:text-3xl font-bold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>
                                Built for Developers
                            </h3>
                            <p className={`text-sm sm:text-base max-w-md mx-auto ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Everything you need to build, ship, and earn
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
                            {DEV_BENEFITS.map((b, i) => (
                                <div
                                    key={b.title}
                                    className={`p-5 rounded-xl border transition-all duration-300 hover:scale-[1.02] group ${dark
                                        ? 'bg-slate-800/40 border-white/[0.06] hover:border-green-500/25'
                                        : 'bg-white/60 border-slate-200/80 hover:border-green-300 hover:shadow-lg'
                                    }`}
                                    style={{ transitionDelay: `${i * 100}ms` }}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 ${dark
                                        ? 'bg-slate-700/60'
                                        : 'bg-slate-100'
                                    }`}>
                                        <span className={b.color}>{b.icon}</span>
                                    </div>
                                    <p className={`text-sm font-semibold mb-1.5 ${dark ? 'text-white' : 'text-gray-900'}`}>
                                        {b.title}
                                    </p>
                                    <p className={`text-xs leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {b.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Social proof */}
                        <div className="text-center mt-14">
                            <p className={`text-sm font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Join <span className={`font-bold ${dark ? 'text-green-400' : 'text-green-600'}`}>200+</span> developers already earning on ModelGrow
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════
                SECTION 3 — PLATFORM OVERVIEW
            ══════════════════════════════════════════════════ */}
            <section
                ref={platRef}
                className="relative w-full overflow-hidden"
            >
                {/* Glow */}
                <div
                    className="landing-glow"
                    style={{
                        width: '500px', height: '500px',
                        background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
                        top: '-120px', left: '50%', transform: 'translateX(-50%)',
                    }}
                />

                <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20 sm:py-28 relative z-10">
                    <div className={`text-center mb-14 animate-on-scroll ${platVisible ? 'visible' : ''}`}>
                        <span className={`inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full ${dark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                            The Full Platform
                        </span>
                        <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 ${dark ? 'text-white' : 'text-gray-900'}`}>
                            Everything You Need.{' '}
                            <span className="bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
                                One Platform.
                            </span>
                        </h2>
                        <p className={`text-base sm:text-lg max-w-xl mx-auto ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                            From discovering automations to building and earning — ModelGrow has it all.
                        </p>
                    </div>

                    {/* Unified Platform Story Animation */}
                    <div className={`max-w-5xl mx-auto animate-on-scroll stagger-1 ${platVisible ? 'visible' : ''}`}>
                        <PlatformStoryAnim isActive={platVisible} dark={dark} />
                    </div>
                </div>
            </section>

            {/* ══ Section divider ══ */}
            <div className="w-full max-w-6xl mx-auto px-6 sm:px-10">
                <div className={`h-px ${dark
                    ? 'bg-gradient-to-r from-transparent via-violet-500/20 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-slate-300 to-transparent'
                }`} />
            </div>

            {/* ══════════════════════════════════════════════════
                SECTION 4 — FAQ
            ══════════════════════════════════════════════════ */}
            <section
                ref={faqRef}
                className="relative w-full overflow-hidden"
            >
                <div className="max-w-2xl mx-auto px-6 sm:px-10 py-20 sm:py-28 relative z-10">
                    <div className={`text-center mb-12 animate-on-scroll ${faqVisible ? 'visible' : ''}`}>
                        <span className={`inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full ${dark ? 'bg-slate-700/60 text-gray-300' : 'bg-slate-100 text-gray-600'}`}>
                            <FiHelpCircle className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
                            FAQ
                        </span>
                        <h2 className={`text-3xl sm:text-4xl font-bold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>
                            Common Questions
                        </h2>
                        <p className={`text-sm sm:text-base ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Everything you need to know before getting started
                        </p>
                    </div>

                    <div className={`animate-on-scroll stagger-1 ${faqVisible ? 'visible' : ''}`}>
                        {FAQ_ITEMS.map((item, i) => (
                            <FaqItem
                                key={i}
                                item={item}
                                isOpen={openFaq === i}
                                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                                dark={dark}
                            />
                        ))}
                    </div>

                    {/* Bottom CTA */}
                    <div className={`text-center mt-14 animate-on-scroll stagger-2 ${faqVisible ? 'visible' : ''}`}>
                        <p className={`text-sm mb-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Still have questions? We're here to help.
                        </p>
                        <button
                            onClick={() => onSignUpClick?.()}
                            className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105 transition-all duration-300"
                        >
                            Get Started Free
                        </button>
                    </div>
                </div>
            </section>
            
            {/* ══════════════════════════════════════════════════
                SECTION 5 — FOOTER
            ══════════════════════════════════════════════════ */}
            <Footer dark={dark} />
        </div>
    );
}
