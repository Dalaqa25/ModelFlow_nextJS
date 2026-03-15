'use client';

import { useState, useEffect } from 'react';
import { useThemeAdaptive } from '@/lib/contexts/theme-adaptive-context';

const DEMOS = [
    {
        userMsg: 'Post my TikToks every day at 9am',
        aiMsg: 'On it — building your TikTok scheduler...',
        card: { icon: '🎵', name: 'TikTok Daily Poster', desc: 'Posts your queued videos every day at 9:00 AM', badge: 'Active' },
    },
    {
        userMsg: 'Send me a weekly sales report every Monday',
        aiMsg: 'Setting up your weekly report automation...',
        card: { icon: '📊', name: 'Weekly Sales Report', desc: 'Compiles and emails your sales data every Monday at 8 AM', badge: 'Active' },
    },
    {
        userMsg: 'Notify my Slack when a Google Form is submitted',
        aiMsg: 'Connecting Google Forms to Slack for you...',
        card: { icon: '🔔', name: 'Form → Slack Notifier', desc: 'Sends a Slack message instantly on every new form submission', badge: 'Active' },
    },
];

// Timing (ms)
const TYPE_SPEED = 38;
const AI_DELAY = 600;
const CARD_DELAY = 500;
const HOLD_DURATION = 2800;
const FADE_OUT_DURATION = 400;

export default function DemoAnimation() {
    const { isDarkMode } = useThemeAdaptive();
    const [demoIndex, setDemoIndex] = useState(0);
    const [phase, setPhase] = useState('typing'); // typing | ai | card | hold | fading
    const [typedText, setTypedText] = useState('');
    const [visible, setVisible] = useState(true);

    const demo = DEMOS[demoIndex];

    // Reset and run a demo cycle
    useEffect(() => {
        let cancelled = false;
        setTypedText('');
        setPhase('typing');
        setVisible(true);

        const msg = demo.userMsg;
        let i = 0;

        const typeNext = () => {
            if (cancelled) return;
            if (i <= msg.length) {
                setTypedText(msg.slice(0, i));
                i++;
                setTimeout(typeNext, TYPE_SPEED);
            } else {
                // Done typing → show AI bubble
                setTimeout(() => {
                    if (cancelled) return;
                    setPhase('ai');
                    setTimeout(() => {
                        if (cancelled) return;
                        setPhase('card');
                        setTimeout(() => {
                            if (cancelled) return;
                            setPhase('hold');
                            setTimeout(() => {
                                if (cancelled) return;
                                setPhase('fading');
                                setTimeout(() => {
                                    if (cancelled) return;
                                    setDemoIndex((prev) => (prev + 1) % DEMOS.length);
                                }, FADE_OUT_DURATION);
                            }, HOLD_DURATION);
                        }, CARD_DELAY);
                    }, AI_DELAY);
                }, 300);
            }
        };

        setTimeout(typeNext, 200);
        return () => { cancelled = true; };
    }, [demoIndex]);

    const showUser = phase !== 'typing' || typedText.length > 0;
    const showAi = ['ai', 'card', 'hold', 'fading'].includes(phase);
    const showCard = ['card', 'hold', 'fading'].includes(phase);
    const fading = phase === 'fading';

    const bubble = `rounded-2xl px-4 py-2.5 text-sm max-w-[85%]`;
    const dark = isDarkMode;

    return (
        <div
            className="w-full max-w-sm mx-auto pointer-events-none select-none"
            style={{ opacity: fading ? 0 : 1, transition: `opacity ${FADE_OUT_DURATION}ms ease` }}
        >
            <div className={`rounded-2xl border px-4 py-3 flex flex-col gap-3 ${
                dark ? 'bg-slate-800/60 border-white/8' : 'bg-white/70 border-slate-200'
            }`}>

                {/* User bubble */}
                <div className="flex justify-end">
                    <div className={`${bubble} ${dark ? 'bg-violet-600/80 text-white' : 'bg-violet-500 text-white'}`}>
                        {typedText}
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
                        transform: showAi ? 'translateY(0)' : 'translateY(6px)',
                        transition: 'opacity 0.3s ease, transform 0.3s ease',
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
                        transform: showCard ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
                        transition: 'opacity 0.35s ease, transform 0.35s ease',
                        maxHeight: showCard ? '80px' : '0',
                        overflow: 'hidden',
                    }}
                >
                    <div className={`rounded-xl border px-3 py-2.5 flex items-center gap-3 ${
                        dark ? 'bg-slate-900/60 border-violet-500/30' : 'bg-violet-50 border-violet-200'
                    }`}>
                        <span className="text-xl">{demo.card.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${dark ? 'text-white' : 'text-gray-900'}`}>
                                {demo.card.name}
                            </p>
                            <p className={`text-[11px] truncate ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {demo.card.desc}
                            </p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 whitespace-nowrap">
                            ✓ {demo.card.badge}
                        </span>
                    </div>
                </div>

            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-1.5 mt-2">
                {DEMOS.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        i === demoIndex
                            ? 'bg-violet-500 w-3'
                            : dark ? 'bg-white/20' : 'bg-slate-300'
                    }`} />
                ))}
            </div>
        </div>
    );
}
