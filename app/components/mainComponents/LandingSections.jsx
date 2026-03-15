'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';
import { FaTiktok, FaLinkedinIn, FaFileInvoiceDollar } from 'react-icons/fa';
import { FiTrendingUp, FiUpload, FiUsers, FiDollarSign, FiZap, FiPlay, FiCheck } from 'react-icons/fi';

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

// ─── AUTOMATION CATEGORIES ───
const CATEGORIES = [
    { icon: <FaTiktok className="w-5 h-5" />, label: 'TikTok', color: 'text-white' },
    { icon: <FaLinkedinIn className="w-5 h-5" />, label: 'LinkedIn', color: 'text-[#0A66C2]' },
    { icon: <FiTrendingUp className="w-5 h-5" />, label: 'Analytics', color: 'text-purple-400' },
    { icon: <FaFileInvoiceDollar className="w-5 h-5" />, label: 'Invoicing', color: 'text-emerald-400' },
    { icon: <FiZap className="w-5 h-5" />, label: 'Workflows', color: 'text-amber-400' },
    { icon: <FiPlay className="w-5 h-5" />, label: 'Video', color: 'text-red-400' },
];

// ─── MAIN COMPONENT ───
export default function LandingSections({ onSignUpClick }) {
    const { isDarkMode } = useThemeAdaptive();
    const dark = isDarkMode;

    const [userRef, userVisible] = useScrollVisible(0.2);
    const [devRef, devVisible] = useScrollVisible(0.2);
    const [catRef, catVisible] = useScrollVisible(0.15);
    const [statsRef, statsVisible] = useScrollVisible(0.15);

    return (
        <div className="w-full">
            {/* ── PART 2: FOR USERS ── */}
            <section
                ref={userRef}
                className={`w-full max-w-5xl mx-auto px-6 pt-20 pb-16 animate-on-scroll ${userVisible ? 'visible' : ''}`}
            >
                {/* Section header */}
                <div className="text-center mb-12">
                    <span className={`inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full ${dark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                        For Everyone
                    </span>
                    <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
                        See How It Works
                    </h2>
                    <p className={`text-base max-w-xl mx-auto ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Describe what you want to automate. We'll find the right tool and run it for you — no coding needed.
                    </p>
                </div>

                {/* Animated walkthrough */}
                <UserFlowAnimation isActive={userVisible} />
            </section>

            {/* ── CATEGORIES ── */}
            <section
                ref={catRef}
                className={`w-full max-w-5xl mx-auto px-6 py-16 animate-on-scroll ${catVisible ? 'visible' : ''}`}
            >
                <div className="text-center mb-10">
                    <h3 className={`text-2xl sm:text-3xl font-bold mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>
                        What You Can Automate
                    </h3>
                    <p className={`text-sm max-w-md mx-auto ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                        From social media scheduling to invoice management — pick from dozens of ready-made automations.
                    </p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 max-w-2xl mx-auto">
                    {CATEGORIES.map((cat, i) => (
                        <div
                            key={cat.label}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 hover:scale-105 ${dark
                                ? 'bg-slate-800/60 border-white/8 hover:border-purple-500/40'
                                : 'bg-white border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md'
                                }`}
                            style={{ transitionDelay: `${i * 60}ms` }}
                        >
                            <div className={cat.color}>{cat.icon}</div>
                            <span className={`text-xs font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{cat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── STATS ── */}
            <section
                ref={statsRef}
                className={`w-full max-w-5xl mx-auto px-6 py-12 animate-on-scroll ${statsVisible ? 'visible' : ''}`}
            >
                <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto text-center">
                    {[
                        { value: '50+', label: 'Automations' },
                        { value: '6+', label: 'Platforms' },
                        { value: '24/7', label: 'Always Running' },
                    ].map(stat => (
                        <div key={stat.label}>
                            <p className={`text-3xl sm:text-4xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                            <p className={`text-xs mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Divider ── */}
            <div className={`w-full max-w-xs mx-auto h-px my-8 ${dark ? 'bg-gradient-to-r from-transparent via-white/10 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-200 to-transparent'}`} />

            {/* ── PART 3: FOR DEVELOPERS ── */}
            <section
                ref={devRef}
                className={`w-full max-w-5xl mx-auto px-6 pt-16 pb-24 animate-on-scroll ${devVisible ? 'visible' : ''}`}
            >
                {/* Section header */}
                <div className="text-center mb-12">
                    <span className={`inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full ${dark ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-600'}`}>
                        For Developers
                    </span>
                    <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
                        Upload. Earn. Grow.
                    </h2>
                    <p className={`text-base max-w-xl mx-auto ${dark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Build automations, publish them to the marketplace, and earn tokens every time someone uses your work.
                        Cash out or reinvest — it's up to you.
                    </p>
                </div>

                {/* Animated walkthrough */}
                <DevFlowAnimation isActive={devVisible} />

                {/* How earnings work — 3 steps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-12">
                    {[
                        { step: '01', icon: <FiUpload className="w-5 h-5" />, title: 'Upload', desc: 'Publish your automation to the marketplace' },
                        { step: '02', icon: <FiUsers className="w-5 h-5" />, title: 'Users Run It', desc: 'People discover and use your automation' },
                        { step: '03', icon: <FiDollarSign className="w-5 h-5" />, title: 'Earn Tokens', desc: 'Get credits for every run — cash out or use in-app' },
                    ].map((s, i) => (
                        <div key={s.step} className="text-center">
                            <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${dark ? 'bg-green-500/15 text-green-400' : 'bg-green-100 text-green-600'}`}>
                                {s.icon}
                            </div>
                            <p className={`text-sm font-semibold mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>{s.title}</p>
                            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{s.desc}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-12">
                    <button
                        onClick={() => onSignUpClick?.()}
                        className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300"
                    >
                        Start Earning
                    </button>
                    <p className={`text-xs mt-3 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Free to join. No upfront costs.
                    </p>
                </div>
            </section>
        </div>
    );
}
