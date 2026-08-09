'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, FileText, Mail, Sparkles, X } from 'lucide-react';

const workflowSteps = [
  { icon: Mail, label: 'Work arrives', meta: 'From the apps you already use' },
  { icon: Sparkles, label: 'ModelGrow handles it', meta: 'The repeated steps run for you' },
  { icon: Check, label: 'You see the result', meta: 'Clear status, history, and control' },
];

export default function AuthDialogFrame({
  isOpen,
  onClose,
  eyebrow,
  title,
  description,
  children,
  labelledBy,
  compact = false,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          // 10000 rather than the old 2147483647: nothing can sit above the
          // maximum int, which is how toasts ended up rendering behind this
          // dialog — including the rate-limit message explaining why sign-in
          // was doing nothing. Above NavigationLoader and VideoPreview (9999),
          // below the Toaster (10010).
          className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto px-4 py-6 sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          <motion.button
            type="button"
            aria-label="Close authentication dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 h-full w-full cursor-default bg-[#101640]/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 14 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative grid w-full max-w-[900px] overflow-hidden rounded-[32px] border border-white/45 bg-[#fbfaf7] shadow-[0_42px_120px_rgba(8,12,40,0.38)] md:grid-cols-[0.92fr_1.08fr]"
          >
            <aside className="auth-story-panel relative hidden min-h-[620px] overflow-hidden border-r border-white/10 bg-[#23205b] p-9 text-white md:flex md:flex-col">
              <div className="auth-story-grid absolute inset-0" aria-hidden="true" />
              <div className="auth-story-glow auth-story-glow--one" aria-hidden="true" />
              <div className="auth-story-glow auth-story-glow--two" aria-hidden="true" />

              <div className="relative flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-[0_12px_30px_rgba(8,12,40,0.2)] backdrop-blur-md">
                  <Image src="/logo.png" alt="" width={30} height={30} className="object-contain" />
                </span>
                <div>
                  <p className="text-[15px] font-black tracking-[-0.03em]">ModelGrow</p>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/48">Work, already handled</p>
                </div>
              </div>

              <div className="relative mt-16">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#cfc4ff]">Ready-made automation</p>
                <h2 className="marketing-display mt-4 max-w-[330px] text-[2.65rem] font-black leading-[0.94] tracking-[-0.045em] text-white marketing-white-copy">
                  Give the repetitive work somewhere else to go.
                </h2>
                <p className="mt-5 max-w-[320px] text-sm font-medium leading-6 text-white/62">
                  Choose an automation, connect the apps it needs, and keep every result visible.
                </p>
              </div>

              <div className="relative mt-auto space-y-2.5 pt-10">
                {workflowSteps.map(({ icon: Icon, label, meta }, index) => (
                  <div key={label} className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#d7ceff]">
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white marketing-white-copy">{index + 1}. {label}</p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-white/45">{meta}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="relative mt-5 flex items-center gap-2 text-[10px] font-bold text-white/45">
                <FileText className="h-3.5 w-3.5" /> Connect only what each automation needs.
              </p>
            </aside>

            <section className="relative flex min-h-0 flex-col bg-[#fbfaf7] px-6 py-7 sm:px-10 sm:py-9 md:max-h-[calc(100vh-3rem)] md:overflow-y-auto">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-[#25204f]/8 bg-white text-[#767d8f] shadow-[0_8px_22px_rgba(37,32,79,0.06)] transition-all hover:-translate-y-0.5 hover:text-[#25204f]"
                aria-label="Close"
              >
                <X className="h-[18px] w-[18px]" />
              </button>

              <div className="flex items-center gap-2.5 pr-12 md:hidden">
                <Image src="/logo.png" alt="" width={30} height={30} className="object-contain" />
                <span className="text-sm font-black tracking-[-0.03em] text-[#171c30]">ModelGrow</span>
              </div>

              <div className={compact ? 'md:my-auto md:py-10' : ''}>
                <header className="mt-9 md:mt-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8059d3]">{eyebrow}</p>
                  <h1 id={labelledBy} className="marketing-display mt-3 max-w-[410px] text-[2.65rem] font-black leading-[0.96] tracking-[-0.045em] text-[#25204f]">
                    {title}
                  </h1>
                  <p className="mt-4 max-w-[390px] text-sm font-medium leading-6 text-[#6d7487]">{description}</p>
                </header>

                <div className="mt-8">{children}</div>
              </div>
            </section>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
