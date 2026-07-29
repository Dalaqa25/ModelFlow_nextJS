'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Check,
  CircleCheck,
  Code2,
  Eye,
  FileJson2,
  KeyRound,
  ShieldCheck,
  Sparkles,
  TestTube2,
  UsersRound,
  Workflow,
  Wrench,
} from 'lucide-react';
import MarketingFooter from '@/app/components/marketing/MarketingFooter';
import { useAuth } from '@/lib/auth/supabase-auth-context';

const journey = [
  {
    number: '01',
    icon: Workflow,
    title: 'Build the workflow',
    copy: 'Create the trigger, actions, mappings, and defaults in ModelGrow Builder. Keep the source workflow editable in your creator workspace.',
    tag: 'Builder workspace',
  },
  {
    number: '02',
    icon: TestTube2,
    title: 'Run the real test',
    copy: 'Test the complete path with realistic data. ModelGrow requires a successful builder run before the workflow can move toward publication.',
    tag: 'Required publish test',
  },
  {
    number: '03',
    icon: FileJson2,
    title: 'Define the setup',
    copy: 'Review what belongs to you, what a customer must choose, and which connected apps are required. Customers only see the choices that matter.',
    tag: 'Setup contract',
  },
  {
    number: '04',
    icon: BadgeCheck,
    title: 'Submit for review',
    copy: 'Add the customer-facing title and explanation, then submit. Review keeps incomplete or misleading automations out of the public catalog.',
    tag: 'Marketplace review',
  },
  {
    number: '05',
    icon: UsersRound,
    title: 'Customers set it up',
    copy: 'People discover the automation, connect the required apps, and make a few guided choices without entering the builder.',
    tag: 'Guided installation',
  },
  {
    number: '06',
    icon: Eye,
    title: 'Track and improve',
    copy: 'Customers see simple run status. You keep a clean source workflow that can be tested, updated, and submitted again when it changes.',
    tag: 'Run visibility',
  },
];

const architecture = [
  { icon: Code2, title: 'Your source flow', copy: 'The workflow you build and maintain.' },
  { icon: BadgeCheck, title: 'Approved listing', copy: 'The safe, customer-facing version in ModelGrow.' },
  { icon: KeyRound, title: 'Guided setup', copy: 'Each customer connects their own apps and chooses their own destinations.' },
  { icon: ShieldCheck, title: 'Private runtime', copy: 'A separate runtime copy runs with that customer’s configuration.' },
];

function CreatorAction({ compact = false }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <Link
        href="/dashboard"
        className={`${compact ? 'px-5 py-3 text-sm' : 'px-7 py-4 text-base'} inline-flex items-center gap-2 rounded-full bg-white font-black text-[#171c30] shadow-[0_15px_35px_rgba(5,8,31,0.2)] transition-transform hover:-translate-y-0.5`}
      >
        Open creator dashboard
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('modelgrow:open-signup'))}
      className={`${compact ? 'px-5 py-3 text-sm' : 'px-7 py-4 text-base'} inline-flex items-center gap-2 rounded-full bg-white font-black text-[#171c30] shadow-[0_15px_35px_rgba(5,8,31,0.2)] transition-transform hover:-translate-y-0.5`}
    >
      Start building
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function BuilderPreview() {
  return (
    <div className="developer-builder-window overflow-hidden rounded-[30px] border border-white/15 bg-white shadow-[0_42px_95px_rgba(6,10,43,0.38)]">
      <div className="flex items-center justify-between border-b border-[#17203a]/8 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={30} height={30} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9aa1b2]">ModelGrow Builder</p>
            <p className="mt-0.5 text-sm font-black text-[#171c30]">Client invoice assistant</p>
          </div>
        </div>
        <span className="rounded-full bg-[#e7f9ef] px-3 py-1.5 text-[11px] font-black text-[#13845a]">Test passed</span>
      </div>
      <div className="developer-builder-canvas px-5 py-7 sm:px-8 sm:py-9">
        {[
          ['Trigger', 'New invoice email', 'Gmail'],
          ['Extract', 'Read invoice details', 'AI'],
          ['Action', 'Create spreadsheet row', 'Google Sheets'],
        ].map(([type, title, app], index) => (
          <div key={title} className="relative mx-auto max-w-[360px]">
            <div className="flex items-center gap-4 rounded-[20px] border border-[#2b245e]/10 bg-white p-4 shadow-[0_12px_35px_rgba(32,26,73,0.08)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eee8ff] text-[#7041d6]">
                {index === 0 ? <Sparkles className="h-5 w-5" /> : index === 1 ? <Boxes className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#9aa1b2]">{type}</p>
                <p className="mt-1 truncate text-sm font-black text-[#171c30]">{title}</p>
              </div>
              <span className="text-[11px] font-bold text-[#747d92]">{app}</span>
            </div>
            {index < 2 && <div className="mx-auto h-7 w-px bg-gradient-to-b from-[#8f64e8] to-[#9ccdc1]" />}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-[#17203a]/8 bg-[#f8f7fb] px-5 py-4 text-xs font-bold text-[#667086] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-[#18a66e]" /> Every step completed</span>
        <span>Ready for publication review</span>
      </div>
    </div>
  );
}

export default function DevelopersPage() {
  // No sidebar offset and no auth-dependent padding: this page renders under the
  // public navbar for everyone, so it must not reserve space for app chrome.
  return (
    <main className="marketing-page overflow-hidden text-[#151b2d]">
      <section className="developer-hero relative overflow-hidden bg-[#11184a] pb-24 pt-[76px] text-white sm:pb-32">
        <div className="absolute inset-0 developer-hero-grid" />
        <div className="absolute -left-32 top-16 h-[430px] w-[430px] rounded-full bg-[#43d9c2]/20 blur-[90px]" />
        <div className="absolute -right-28 top-24 h-[480px] w-[480px] rounded-full bg-[#d47de9]/24 blur-[100px]" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 pt-20 sm:px-8 sm:pt-24 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/85 backdrop-blur-md">
              <Code2 className="h-3.5 w-3.5 text-[#8ff1cf]" />
              ModelGrow for developers
            </div>
            <h1 className="marketing-display mt-7 max-w-[650px] text-[clamp(3.4rem,6vw,6.6rem)] font-black leading-[0.9] tracking-[-0.055em] text-white marketing-white-copy">
              Build once. Make it usable by anyone.
            </h1>
            <p className="mt-7 max-w-[630px] text-lg font-medium leading-8 text-white/72 sm:text-xl sm:leading-9">
              Create reliable automations in ModelGrow Builder, prove they work, and publish a guided experience that nontechnical customers can set up themselves.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <CreatorAction />
              <a href="#developer-flow" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-7 py-4 text-base font-black text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/10">
                See the full flow
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
          <BuilderPreview />
        </div>
      </section>

      <section className="border-b border-[#17203a]/7 bg-white py-7">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-9 gap-y-4 px-5 text-xs font-black uppercase tracking-[0.12em] text-[#747c90] sm:px-8">
          {['Visual builder', 'Required test run', 'Guided customer setup', 'Private runtime copies', 'Run visibility'].map((item) => (
            <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#7447d0]" />{item}</span>
          ))}
        </div>
      </section>

      <section id="developer-flow" className="marketing-anchor mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.72fr]">
          <div>
            <p className="marketing-kicker">The complete creator journey</p>
            <h2 className="marketing-display mt-4 max-w-[800px] text-[clamp(2.9rem,5vw,5.2rem)] font-black leading-[0.96] tracking-[-0.045em] text-[#12182b]">From builder canvas to a customer’s running automation.</h2>
          </div>
          <p className="text-lg font-medium leading-8 text-[#656e83]">The workflow remains technical where it should. The customer experience does not.</p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {journey.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.number} className="group rounded-[26px] border border-[#17203a]/9 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(23,32,58,0.09)] sm:p-7">
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eee8ff] text-[#7041d6]"><Icon className="h-5 w-5" /></span>
                  <span className="text-[12px] font-black tracking-[0.18em] text-[#b0b5c2]">{step.number}</span>
                </div>
                <h3 className="mt-7 text-xl font-black tracking-[-0.035em] text-[#151b2d]">{step.title}</h3>
                <p className="mt-3 min-h-[112px] text-[15px] font-medium leading-7 text-[#656e83]">{step.copy}</p>
                <p className="mt-5 border-t border-[#17203a]/8 pt-5 text-xs font-black text-[#8259dd]">{step.tag}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="developer-architecture overflow-hidden bg-[#f0ecfb] py-24 sm:py-32">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="mx-auto max-w-[780px] text-center">
            <p className="marketing-kicker">How delivery stays safe</p>
            <h2 className="marketing-display mt-4 text-[clamp(2.8rem,5vw,5rem)] font-black leading-[0.96] tracking-[-0.045em] text-[#12182b]">One source workflow. A private setup for every customer.</h2>
            <p className="mx-auto mt-5 max-w-[680px] text-lg font-medium leading-8 text-[#656e83]">Customers do not edit your source flow, and their connected accounts are not shared with other installations.</p>
          </div>

          <div className="relative mt-14 grid gap-4 lg:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-[42px] hidden h-px bg-gradient-to-r from-[#a78be6] via-[#78cdb4] to-[#a78be6] lg:block" />
            {architecture.map((item, index) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="relative rounded-[24px] border border-[#2b245e]/10 bg-white/90 p-6 shadow-[0_18px_50px_rgba(42,31,91,0.07)] backdrop-blur-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-[5px] border-[#f0ecfb] bg-[#7041d6] text-white"><Icon className="h-5 w-5" /></div>
                  <p className="mt-6 text-[10px] font-black uppercase tracking-[0.14em] text-[#9b91b2]">Stage {index + 1}</p>
                  <h3 className="mt-2 text-lg font-black text-[#151b2d]">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#697287]">{item.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] gap-5 px-5 sm:px-8 lg:grid-cols-2">
          <article className="rounded-[30px] border border-[#17203a]/9 bg-[#fbfaf7] p-7 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#8b63e6]">You own the automation</p>
            <h2 className="marketing-display mt-4 text-4xl font-black tracking-[-0.04em] text-[#151b2d]">What the creator controls</h2>
            <div className="mt-8 space-y-5">
              {['Workflow logic and step mappings', 'Developer-owned API configuration', 'Customer-facing defaults and safe options', 'Testing, maintenance, and version updates'].map((item) => (
                <p key={item} className="flex gap-3 text-sm font-semibold leading-6 text-[#626b80]"><CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#7041d6]" />{item}</p>
              ))}
            </div>
          </article>
          <article className="rounded-[30px] bg-[#151a2d] p-7 text-white sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#a98cff]">ModelGrow handles delivery</p>
            <h2 className="marketing-display mt-4 text-4xl font-black tracking-[-0.04em] text-white marketing-white-copy">What the platform handles</h2>
            <div className="mt-8 space-y-5">
              {['Discovery and customer-facing setup', 'Connected account collection and validation', 'Private runtime preparation for each customer', 'Simple status, controls, and run visibility'].map((item) => (
                <p key={item} className="flex gap-3 text-sm font-semibold leading-6 text-[#aeb6c8]"><CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8ff1cf]" />{item}</p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[36px] bg-[#4c399e] px-6 py-16 text-center shadow-[0_30px_80px_rgba(45,32,98,0.22)] sm:px-10 sm:py-20">
          <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#55d8c5]/25 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-[#f58dd8]/25 blur-3xl" />
          <div className="relative">
            <h2 className="marketing-display mx-auto max-w-[850px] text-[clamp(2.8rem,5vw,5.3rem)] font-black leading-[0.94] tracking-[-0.04em] text-white marketing-white-copy">Build the automation. ModelGrow makes it approachable.</h2>
            <p className="mx-auto mt-5 max-w-[650px] text-lg font-medium leading-8 text-white/70">Create your first flow, run the required test, and see the complete publication path from inside your dashboard.</p>
            <div className="mt-8"><CreatorAction /></div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
