'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  Code2,
  FileCheck2,
  FileText,
  Inbox,
  Mail,
  MessageSquare,
  MousePointerClick,
  Pause,
  Play,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Table2,
  UsersRound,
  Zap,
} from 'lucide-react';
import MarketingFooter from './MarketingFooter';

const examples = [
  'Save invoices to a spreadsheet',
  'Summarize my inbox',
  'Prepare weekly reports',
];

const useCases = [
  {
    icon: ReceiptText,
    title: 'Invoice processing',
    description: 'Read invoices from your inbox and keep your spreadsheet up to date.',
    result: 'Email → organized rows',
    tone: 'violet',
  },
  {
    icon: Inbox,
    title: 'Inbox organization',
    description: 'Sort incoming messages, surface the important ones, and reduce inbox noise.',
    result: 'Inbox → clear priorities',
    tone: 'blue',
  },
  {
    icon: FileCheck2,
    title: 'Weekly reporting',
    description: 'Collect updates from your tools and turn them into one reliable report.',
    result: 'Scattered data → one report',
    tone: 'amber',
  },
  {
    icon: UsersRound,
    title: 'Client onboarding',
    description: 'Create folders, share the right information, and keep every handoff moving.',
    result: 'New client → ready to go',
    tone: 'green',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Job search support',
    description: 'Find relevant openings and organize the opportunities worth pursuing.',
    result: 'Open roles → focused shortlist',
    tone: 'rose',
  },
  {
    icon: CalendarDays,
    title: 'Scheduling and follow-up',
    description: 'Keep calendars, reminders, and follow-ups moving without the busywork.',
    result: 'Loose ends → handled',
    tone: 'cyan',
  },
];

const statusRows = [
  { label: 'Invoice received', meta: 'Gmail · 9:41 AM', state: 'done' },
  { label: 'Details organized', meta: '7 fields captured', state: 'done' },
  { label: 'Spreadsheet updated', meta: 'Completed in 12 seconds', state: 'done' },
];

function openSignUp() {
  window.dispatchEvent(new Event('modelgrow:open-signup'));
}

function AppBadge({ icon: Icon, name, color, background }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#17203a]/10 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(23,32,58,0.06)]">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ color, background }}>
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
      <span className="text-xs font-extrabold text-[#343b50]">{name}</span>
    </div>
  );
}

function HeroWorkflow({ activeStep = 0, developerView = false }) {
  const nodes = developerView
    ? [
        { icon: Mail, title: 'Gmail trigger', meta: 'New PDF attachment', tone: 'mail' },
        { icon: Sparkles, title: 'Extract invoice fields', meta: 'Structured AI output', tone: 'ai' },
        { icon: Table2, title: 'Google Sheets action', meta: 'Append one row', tone: 'sheets' },
      ]
    : [
        { icon: Mail, title: 'New invoice received', meta: 'Invoice-1042.pdf · Acme Supplies', tone: 'mail' },
        { icon: Sparkles, title: 'Important details captured', meta: 'Vendor, amount, date, invoice number', tone: 'ai' },
        { icon: Table2, title: 'Spreadsheet updated', meta: 'A new row was added automatically', tone: 'sheets' },
      ];

  return (
    <div className="marketing-hero-board relative mx-auto w-full max-w-[520px]">
      <div className="absolute -left-8 top-14 hidden lg:block">
        <AppBadge icon={Mail} name="Gmail" color="#d94235" background="#fff0ed" />
      </div>
      <div className="absolute -right-7 bottom-16 hidden lg:block">
        <AppBadge icon={Table2} name="Google Sheets" color="#168452" background="#eaf9f1" />
      </div>

      <div className="overflow-hidden rounded-[30px] border border-[#17203a]/10 bg-[#f7f8fb] shadow-[0_36px_90px_rgba(30,35,65,0.16)]">
        <div className="flex items-center justify-between border-b border-[#17203a]/8 bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#9299aa]">{developerView ? 'Builder graph' : 'Live automation'}</p>
            <h3 className="mt-1 text-[17px] font-black tracking-[-0.025em] text-[#141a2d]">Invoice to spreadsheet</h3>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#e9fbf2] px-3 py-1.5 text-xs font-black text-[#118357]">
            <span className="h-2 w-2 rounded-full bg-[#19b979]" />
            On
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {nodes.map((node, index) => {
            const Icon = node.icon;
            const state = index < activeStep ? 'complete' : index === activeStep ? 'active' : 'waiting';
            return (
              <div key={node.title}>
                <div className={`marketing-demo-node marketing-demo-node--${node.tone}`} data-state={state}>
                  <div className="marketing-demo-node-icon">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-[#151b2d]">{node.title}</p>
                      {state === 'complete' ? <CircleCheck className="h-5 w-5 text-[#18a66e]" /> : state === 'active' ? <span className="marketing-node-pulse" /> : <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#a3a9b7]">Next</span>}
                    </div>
                    <p className="mt-1 truncate text-xs font-semibold text-[#747d92]">{node.meta}</p>
                  </div>
                </div>
                {index < nodes.length - 1 && (
                  <div className="marketing-demo-connector ml-9 h-7 w-px" data-complete={index < activeStep} />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-[#17203a]/8 bg-white px-5 py-3.5 text-xs sm:px-6">
          <span className="flex items-center gap-1.5 font-bold text-[#687187]"><Clock3 className="h-3.5 w-3.5" /> {activeStep >= 2 ? 'Completed in 12s' : 'Working now'}</span>
          <span className={activeStep >= 2 ? 'font-black text-[#118357]' : 'font-black text-[#7651cf]'}>{activeStep >= 2 ? 'Everything worked' : 'In progress'}</span>
        </div>
      </div>
    </div>
  );
}

function HeroProductStage() {
  const [mode, setMode] = useState('work');
  const [developerView, setDeveloperView] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    setActiveStep(0);
    const timers = [
      window.setTimeout(() => setActiveStep(1), 1200),
      window.setTimeout(() => setActiveStep(2), 2500),
      window.setTimeout(() => setActiveStep(0), 8200),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [mode, developerView, paused]);

  return (
    <div className="marketing-product-stage mx-auto w-full max-w-[1120px] overflow-hidden rounded-t-[30px] border border-white/45 bg-white/95 shadow-[0_50px_110px_rgba(7,12,45,0.38)] backdrop-blur-sm">
      <div className="flex flex-col gap-4 border-b border-[#17203a]/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={28} height={28} />
          <span className="text-sm font-black tracking-[-0.03em] text-[#171c30]">ModelGrow</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="marketing-mode-tabs" aria-label="Demo mode">
            {['work', 'automate'].map((item) => (
              <button key={item} type="button" data-active={mode === item} onClick={() => setMode(item)}>
                {item === 'work' ? 'Work' : 'Automate'}
              </button>
            ))}
          </div>
          <button type="button" className="marketing-developer-toggle" data-active={developerView} onClick={() => setDeveloperView((value) => !value)} aria-pressed={developerView}>
            <span>Developer view</span>
            <span className="marketing-toggle-track"><span /></span>
          </button>
          <button type="button" className="marketing-demo-pause" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Play demo' : 'Pause demo'}>
            {paused ? <Play className="h-3.5 w-3.5" fill="currentColor" /> : <Pause className="h-3.5 w-3.5" fill="currentColor" />}
          </button>
        </div>
      </div>

      <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
        <div className="flex min-h-[410px] flex-col justify-between rounded-[24px] bg-[#f3f0fb] p-5 sm:p-7">
          {developerView ? (
            <div className="marketing-stage-copy" key="developer">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a75ba]">The builder underneath</p>
              <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#171c30]">Reliable nodes. Clear inputs. Real run history.</h3>
              <div className="mt-6 space-y-3 rounded-[20px] border border-[#7041d6]/12 bg-[#211d43] p-4 text-left font-mono text-[11px] leading-5 text-[#d8ccff]">
                <p><span className="text-[#8ff1cf]">trigger</span> Gmail.new_attachment</p>
                <p><span className="text-[#8ff1cf]">action</span> AI.extract_fields</p>
                <p><span className="text-[#8ff1cf]">action</span> Sheets.append_row</p>
                <p className="border-t border-white/10 pt-3 text-white/55">Credentials stay private and are resolved only at runtime.</p>
              </div>
            </div>
          ) : mode === 'work' ? (
            <div className="marketing-stage-copy" key="work">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a75ba]">Tell ModelGrow the outcome</p>
              <div className="mt-7 ml-auto max-w-[320px] rounded-[20px_20px_6px_20px] bg-[#25204f] px-4 py-3.5 text-sm font-bold leading-6 text-white marketing-white-copy">
                Save every new invoice from Gmail into my spreadsheet.
              </div>
              <div className="mt-5 max-w-[340px] rounded-[20px_20px_20px_6px] border border-[#7041d6]/10 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(57,42,100,0.08)]">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ece5ff] text-[#7041d6]"><Sparkles className="h-4 w-4" /></span>
                  <div>
                    <p className="text-sm font-black text-[#171c30]">Found the right automation</p>
                    <p className="mt-1.5 text-xs font-semibold leading-5 text-[#737c90]">Connect Gmail and Google Sheets once. The repetitive part is handled from there.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="marketing-stage-copy" key="automate">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a75ba]">Automation prepared</p>
              <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#171c30]">One request becomes a dependable background process.</h3>
              <div className="mt-6 grid gap-3">
                {['Choose your spreadsheet', 'Connect the required apps', 'Review and turn it on'].map((label, index) => (
                  <div key={label} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_22px_rgba(57,42,100,0.06)]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ece5ff] text-[11px] font-black text-[#7041d6]">{index + 1}</span>
                    <span className="text-xs font-black text-[#394055]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link href="/explore" className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[#171c30] px-5 py-3 text-xs font-black text-white marketing-white-copy transition-transform hover:-translate-y-0.5">
            {developerView ? 'Open ModelGrow Builder' : 'Use this automation'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <HeroWorkflow activeStep={activeStep} developerView={developerView} />
      </div>
    </div>
  );
}

function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const cleanQuery = query.trim();
    router.push(cleanQuery ? `/explore?search=${encodeURIComponent(cleanQuery)}` : '/explore');
  };

  const useExample = (example) => {
    setQuery(example);
    router.push(`/explore?search=${encodeURIComponent(example)}`);
  };

  return (
    <div className="w-full max-w-[660px]">
      <form onSubmit={submit} className="marketing-search flex items-center gap-2 rounded-[22px] border border-[#17203a]/12 bg-white p-2 shadow-[0_20px_55px_rgba(23,32,58,0.11)]">
        <Search className="ml-3 h-5 w-5 shrink-0 text-[#8e5cff]" strokeWidth={2.4} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="What should ModelGrow handle?"
          aria-label="Search for an automation"
          className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-[15px] font-bold text-[#161c2e] outline-none placeholder:text-[#9299aa] sm:text-base"
        />
        <button
          type="submit"
          aria-label="Find automations"
          className="marketing-primary-button flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#171c30] shadow-[0_8px_18px_rgba(23,28,48,0.2)] transition-transform hover:-translate-y-0.5 sm:w-auto sm:px-5"
        >
          <span className="hidden text-sm font-black sm:block">Find it</span>
          <ArrowRight className="h-4 w-4 sm:ml-2" />
        </button>
      </form>
      <div className="marketing-search-examples mt-4 flex flex-wrap items-center justify-center gap-2 text-center">
        <span className="py-2 text-xs font-bold text-[#9299aa]">Try:</span>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => useExample(example)}
            className="rounded-full border border-[#17203a]/9 bg-white/70 px-3 py-2 text-xs font-extrabold text-[#5d6579] transition-all hover:border-[#8e5cff]/30 hover:bg-white hover:text-[#4e30a9]"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepCard({ number, icon: Icon, title, description, detail }) {
  return (
    <article className="group relative rounded-[26px] border border-[#17203a]/9 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(23,32,58,0.09)] sm:p-7">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0eaff] text-[#7544de]">
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <span className="text-[12px] font-black tracking-[0.18em] text-[#b0b5c2]">0{number}</span>
      </div>
      <h3 className="mt-7 text-xl font-black tracking-[-0.035em] text-[#151b2d]">{title}</h3>
      <p className="mt-3 text-[15px] font-medium leading-7 text-[#656e83]">{description}</p>
      <div className="mt-6 flex items-center gap-2 border-t border-[#17203a]/8 pt-5 text-xs font-extrabold text-[#8a62e8]">
        <CircleCheck className="h-4 w-4" />
        {detail}
      </div>
    </article>
  );
}

function UseCaseCard({ item }) {
  const Icon = item.icon;
  return (
    <Link href={`/explore?search=${encodeURIComponent(item.title)}`} className={`marketing-use-case marketing-use-case--${item.tone} group rounded-[24px] border border-[#17203a]/9 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#8e5cff]/25 hover:shadow-[0_22px_55px_rgba(23,32,58,0.08)]`}>
      <div className="flex items-center justify-between">
        <span className="marketing-use-case-icon flex h-11 w-11 items-center justify-center rounded-2xl">
          <Icon className="h-5 w-5" strokeWidth={2.1} />
        </span>
        <ArrowUpRight className="h-4 w-4 text-[#a1a7b5] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#7143d4]" />
      </div>
      <h3 className="mt-6 text-[18px] font-black tracking-[-0.025em] text-[#161c2e]">{item.title}</h3>
      <p className="mt-2 min-h-[72px] text-sm font-medium leading-6 text-[#697287]">{item.description}</p>
      <p className="mt-5 border-t border-[#17203a]/7 pt-4 text-xs font-black text-[#5d6579]">{item.result}</p>
    </Link>
  );
}

const manualInvoiceSteps = [
  'Open the email and download the PDF',
  'Find the vendor, date, total, and invoice number',
  'Copy each value into the right spreadsheet column',
  'Double-check the row and repeat next time',
];

function WhyModelGrowSection() {
  return (
    <section
      id="why-modelgrow"
      className="marketing-anchor relative overflow-hidden border-b border-white/10 py-24 text-white sm:py-32"
      style={{
        background: 'radial-gradient(circle at 12% 18%, rgba(180, 83, 255, 0.34), transparent 30%), radial-gradient(circle at 84% 24%, rgba(76, 126, 255, 0.28), transparent 31%), linear-gradient(135deg, #17123f 0%, #21185c 48%, #101a38 100%)',
      }}
    >
      <div className="marketing-signal-field absolute inset-0 opacity-35" aria-hidden="true" />
      <div className="absolute -left-32 bottom-[-18rem] h-[34rem] w-[34rem] rounded-full bg-[#ea63c9]/20 blur-[110px]" aria-hidden="true" />
      <div className="absolute -right-36 top-[-16rem] h-[34rem] w-[34rem] rounded-full bg-[#6d8cff]/20 blur-[110px]" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end lg:gap-20">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.17em] text-[#aeece3]">Why ModelGrow</p>
            <h2 className="marketing-display mt-5 max-w-[720px] text-[clamp(3.2rem,6.2vw,6.6rem)] font-black leading-[0.9] tracking-[-0.052em] text-white marketing-white-copy">
              Give the busywork back to software.
            </h2>
          </div>
          <div className="max-w-[590px] lg:justify-self-end">
            <p className="text-xl font-semibold leading-9 text-white/82 sm:text-2xl sm:leading-10">
              Your time should go into judgment, creativity, and people—not copying the same information between apps again and again.
            </p>
            <p className="mt-5 text-base font-medium leading-7 text-white/58">
              ModelGrow handles the predictable steps, keeps the result visible, and brings you back in when a real decision is required.
            </p>
          </div>
        </div>

        <div className="mt-16 grid border-y border-white/14 md:grid-cols-3 sm:mt-20">
          {[
            [Clock3, 'Save time', 'The repeated clicks disappear, so every task gives a little time back instead of taking another piece of your day.'],
            [BadgeDollarSign, 'Spend less on repetition', 'Routine work no longer consumes paid hours that could be used for customers, growth, or higher-value work.'],
            [FileCheck2, 'Decide with cleaner information', 'The same useful details arrive in the same place, giving you a consistent record when it is time to act.'],
          ].map(([Icon, title, text], index) => (
            <article key={title} className="relative border-b border-white/14 px-1 py-9 last:border-b-0 md:border-b-0 md:px-8 md:first:pl-0 md:last:pr-0 md:[&:not(:last-child)]:border-r">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/14 bg-white/[0.08] text-[#bba7ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md">
                  <Icon className="h-5 w-5" strokeWidth={2.1} />
                </span>
                <span className="marketing-display text-3xl font-bold text-white/15">0{index + 1}</span>
              </div>
              <h3 className="marketing-display mt-8 text-3xl font-bold tracking-[-0.035em] text-white marketing-white-copy">{title}</h3>
              <p className="mt-4 max-w-[340px] text-sm font-medium leading-7 text-white/62">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[670px] text-sm font-semibold leading-6 text-[#c8c4e4]">The value grows every time the same task returns. Start with one workflow, see the result, then decide what else deserves to run without you.</p>
          <a href="#savings-example" className="inline-flex w-fit items-center gap-2 rounded-full border border-white/16 bg-white/[0.08] px-5 py-3 text-sm font-black text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/[0.13]">
            See a real example
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function SavingsExampleSection() {
  return (
    <section id="savings-example" className="marketing-anchor relative overflow-hidden border-b border-[#25204f]/8 bg-[#f8f7fb] py-24 sm:py-32">
      <div className="absolute left-[12%] top-16 h-64 w-64 rounded-full bg-[#bb95ff]/14 blur-[90px]" aria-hidden="true" />
      <div className="absolute bottom-0 right-[8%] h-72 w-72 rounded-full bg-[#6f9cff]/10 blur-[100px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mx-auto max-w-[880px] text-center">
          <p className="marketing-kicker">See the savings in one task</p>
          <h2 className="marketing-display mt-4 text-[clamp(3rem,5.6vw,5.8rem)] font-black leading-[0.92] tracking-[-0.048em] text-[#25204f]">One invoice. Two very different experiences.</h2>
          <p className="mx-auto mt-6 max-w-[720px] text-lg font-medium leading-8 text-[#687187]">A small task may not feel expensive once. The cost appears when the same manual steps return every day, week, or month.</p>
        </div>

        <div className="marketing-value-example mx-auto mt-14 max-w-[1080px] overflow-hidden rounded-[32px] border border-[#6e57ab]/14 bg-white shadow-[0_34px_90px_rgba(37,32,79,0.11)]">
          <div className="flex flex-col gap-3 border-b border-[#25204f]/9 bg-gradient-to-r from-[#f3efff] via-white to-[#eef4ff] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#9272d7]">Illustrative example</p>
              <p className="mt-2 text-sm font-bold text-[#4f566c]">A PDF invoice arrives in Gmail and its details need to reach a spreadsheet.</p>
            </div>
            <span className="w-fit rounded-full bg-[#f0eaff] px-3 py-1.5 text-[11px] font-black text-[#7041d6]">20 invoices / month</span>
          </div>

          <div className="grid md:grid-cols-2">
            <div className="border-b border-[#25204f]/9 p-6 sm:p-8 md:border-b-0 md:border-r">
              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#9b6a71]">Done manually</p>
              <div className="mt-6 space-y-5">
                {manualInvoiceSteps.map((step, index) => (
                  <div key={step} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f8ecec] text-[10px] font-black text-[#9b5b67]">{index + 1}</span>
                    <p className="text-sm font-semibold leading-6 text-[#596174]">{step}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 border-t border-[#25204f]/8 pt-5">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9ba1af]">Your attention</p>
                <p className="marketing-display mt-1 text-3xl font-bold text-[#25204f]">About 8 minutes</p>
                <p className="mt-1 text-xs font-semibold text-[#858c9d]">every time the task returns</p>
              </div>
            </div>

            <div className="bg-[#f3f0fb] p-6 sm:p-8">
              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#6747a7]">Handled by ModelGrow</p>
              <div className="mt-6 border-l border-[#7e62bc]/25 pl-5">
                {[
                  ['Invoice arrives', 'Gmail notices the new PDF'],
                  ['Details are captured', 'The same useful fields are organized'],
                  ['Your records are updated', 'A clean spreadsheet row is added'],
                  ['You see what happened', 'The completed run stays visible'],
                ].map(([title, text], index) => (
                  <div key={title} className="relative pb-6 last:pb-0">
                    <span className="absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-[3px] border-[#f3f0fb] bg-[#825ce0]" />
                    <p className="text-sm font-black text-[#332856]">{title}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#756d88]">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 border-t border-[#5e498d]/10 pt-5">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8b7ea5]">Your attention</p>
                <p className="marketing-display mt-1 text-3xl font-bold text-[#332856]">Only when needed</p>
                <p className="mt-1 text-xs font-semibold text-[#847b96]">review the result or step in when something needs attention</p>
              </div>
            </div>
          </div>

          <div className="marketing-savings-equation grid gap-6 bg-gradient-to-r from-[#251b5a] via-[#332072] to-[#17224c] px-6 py-7 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:px-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#c9bdff]">What repetition adds up to</p>
              <p className="marketing-display mt-2 text-[clamp(1.8rem,3.2vw,2.7rem)] font-bold leading-tight tracking-[-0.035em] text-white marketing-white-copy">8 minutes × 20 invoices = 2h 40m returned each month.</p>
            </div>
            <div className="border-t border-white/14 pt-5 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/50">At $30 / hour</p>
              <p className="marketing-display mt-1 text-3xl font-bold text-[#8ef0cf]">$80 / month</p>
              <p className="mt-1 max-w-[170px] text-[11px] font-semibold leading-4 text-white/55">on one small repeated task</p>
            </div>
          </div>
          <p className="px-6 py-4 text-[11px] font-semibold leading-5 text-[#8c93a3] sm:px-8">This is an example, not a guaranteed saving. Your result depends on how often the work happens and what that time costs you.</p>
        </div>
      </div>
    </section>
  );
}

function ControlStorySection() {
  return (
    <section className="border-b border-[#17203a]/7 bg-white py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
        <div>
          <p className="marketing-kicker">What ModelGrow does—and does not do</p>
          <h2 className="marketing-display mt-4 max-w-[620px] text-[clamp(2.9rem,5vw,5rem)] font-black leading-[0.95] tracking-[-0.045em] text-[#151b2d]">The repetition is automatic. The control is still yours.</h2>
          <p className="mt-7 max-w-[570px] text-lg font-medium leading-8 text-[#656e83]">
            ModelGrow never asks you to hand over everything. You choose the job, approve the exact app connections it needs, and decide when it should stop.
          </p>
          <div className="mt-9 inline-flex items-center gap-3 rounded-full border border-[#137556]/12 bg-[#eaf8f2] px-4 py-2.5 text-sm font-black text-[#137556]">
            <ShieldCheck className="h-4 w-4" />
            No surprise access. No hidden builder to learn.
          </div>
        </div>

        <div className="border-y border-[#17203a]/10">
          {[
            ['01', 'You choose the automation', 'Start with a result you want—like organizing invoices—not a blank workflow canvas.'],
            ['02', 'Every connection is explicit', 'You see which apps are required and approve each connection during setup.'],
            ['03', 'ModelGrow prepares your copy', 'Your setup and connected accounts stay separate from the public automation other people see.'],
            ['04', 'You can stop it', 'Pause or remove an automation from ModelGrow whenever the work is no longer useful.'],
          ].map(([number, title, text]) => (
            <div key={number} className="grid gap-3 border-b border-[#17203a]/10 py-6 last:border-b-0 sm:grid-cols-[52px_1fr] sm:py-7">
              <span className="marketing-display text-2xl font-bold text-[#7143d4]/38">{number}</span>
              <div>
                <h3 className="text-base font-black tracking-[-0.02em] text-[#151b2d]">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#697287]">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrackingPanel() {
  return (
    <div className="relative rounded-[30px] border border-white/12 bg-[#171d32] p-4 shadow-[0_40px_90px_rgba(7,10,23,0.25)] sm:p-6">
      <div className="flex items-center justify-between border-b border-white/9 pb-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#9ea9c3]">Automation tracking</p>
          <h3 className="mt-1.5 text-lg font-black tracking-[-0.025em] text-white marketing-white-copy">Invoice to spreadsheet</h3>
        </div>
        <button type="button" aria-label="Refresh status" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-[#aeb8cf]">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-1 py-4">
        {statusRows.map((row, index) => (
          <div key={row.label} className="relative flex gap-4 rounded-2xl px-2 py-3">
            {index < statusRows.length - 1 && <span className="absolute left-[21px] top-9 h-8 w-px bg-[#35405b]" />}
            <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#37d394]/30 bg-[#18382f] text-[#53e2a8]">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <div>
              <p className="text-sm font-black text-[#f6f7fb]">{row.label}</p>
              <p className="mt-1 text-xs font-semibold text-[#8f9ab3]">{row.meta}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 border-t border-white/9 pt-5">
        {[
          ['Runs', '18'],
          ['Succeeded', '18'],
          ['Needs attention', '0'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/[0.045] p-3">
            <p className="text-lg font-black text-white marketing-white-copy">{value}</p>
            <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8e99b2]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutcomeEffectSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const rowRefs = useRef([]);
  const activeItem = useCases[activeIndex];
  const ActiveIcon = activeItem.icon;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visibleEntry) setActiveIndex(Number(visibleEntry.target.dataset.index));
      },
      { rootMargin: '-28% 0px -44% 0px', threshold: [0.15, 0.35, 0.6] },
    );

    rowRefs.current.forEach((row) => row && observer.observe(row));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="use-cases" className="marketing-anchor marketing-outcome-grid bg-[#f7f6f1] py-24 sm:py-32">
      <div className="mx-auto grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="marketing-kicker">The ModelGrow effect</p>
          <h2 className="marketing-display mt-4 max-w-[520px] text-[clamp(3.2rem,6vw,6.1rem)] font-black leading-[0.88] tracking-[-0.045em] text-[#25204f]">The work that quietly disappears.</h2>
          <p className="mt-7 max-w-[470px] text-lg font-medium leading-8 text-[#656e83]">Start with the outcome, not the machinery. ModelGrow turns repetitive steps into work that simply gets done.</p>

          <div className="marketing-outcome-preview mt-8" aria-live="polite">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ece5ff] text-[#7041d6]"><ActiveIcon className="h-5 w-5" /></span>
              <span className="marketing-display text-3xl font-bold text-[#25204f]/18">{String(activeIndex + 1).padStart(2, '0')}</span>
            </div>
            <p className="mt-6 text-[11px] font-black uppercase tracking-[0.17em] text-[#9272d7]">{activeItem.title}</p>
            <p className="marketing-display mt-2 text-3xl font-bold leading-tight tracking-[-0.035em] text-[#25204f]">{activeItem.result}</p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#25204f]/8">
              <span className="block h-full rounded-full bg-gradient-to-r from-[#7041d6] to-[#b26dff] transition-[width] duration-500" style={{ width: `${((activeIndex + 1) / useCases.length) * 100}%` }} />
            </div>
          </div>

          <Link href="/explore" className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#6540ba]/16 bg-white px-5 py-3 text-sm font-black text-[#6540ba] shadow-[0_10px_24px_rgba(54,41,91,0.06)] transition-transform hover:-translate-y-0.5">
            Browse every outcome
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="divide-y divide-[#25204f]/10 border-y border-[#25204f]/10">
          {useCases.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                ref={(element) => { rowRefs.current[index] = element; }}
                data-index={index}
                data-active={activeIndex === index}
                href={`/explore?search=${encodeURIComponent(item.title)}`}
                className="marketing-outcome-row group grid gap-5 py-8 sm:grid-cols-[52px_1fr_auto] sm:items-center sm:px-4 sm:py-12"
              >
                <span className="marketing-display text-4xl font-bold text-[#25204f]/20">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.17em] text-[#9272d7]">{item.title}</p>
                  <h3 className="marketing-display mt-2 text-[clamp(1.75rem,3vw,2.7rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#25204f]">{item.result}</h3>
                  <p className="mt-3 max-w-[590px] text-sm font-medium leading-6 text-[#70788b]">{item.description}</p>
                </div>
                <span className="marketing-outcome-row-icon flex h-12 w-12 items-center justify-center rounded-full border border-[#25204f]/10 bg-white text-[#7041d6] shadow-[0_8px_24px_rgba(37,32,79,0.07)]">
                  <Icon className="h-5 w-5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const flowDemoSteps = [
  { icon: Mail, eyebrow: 'Trigger', title: 'Invoice arrives', detail: 'Gmail notices one new PDF' },
  { icon: Sparkles, eyebrow: 'Understand', title: 'Details captured', detail: 'The useful fields are organized' },
  { icon: Table2, eyebrow: 'Action', title: 'Sheet updated', detail: 'One clean row is added' },
  { icon: CircleCheck, eyebrow: 'Done', title: 'You stay informed', detail: 'A successful run is recorded' },
];

function FlowDemoSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '-12% 0px -12% 0px', threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || !isVisible || activeStep >= flowDemoSteps.length - 1) return undefined;
    const timer = window.setTimeout(() => setActiveStep((step) => step + 1), 1700);
    return () => window.clearTimeout(timer);
  }, [activeStep, isVisible, paused]);

  const isFinished = activeStep === flowDemoSteps.length - 1;

  const togglePlayback = () => {
    if (isFinished) {
      setActiveStep(0);
      setPaused(false);
      return;
    }
    setPaused((value) => !value);
  };

  return (
    <section ref={sectionRef} className="marketing-flow-story relative overflow-hidden bg-[#4b3baa] px-5 py-24 text-white sm:px-8 sm:py-32">
      <div className="marketing-flow-orb marketing-flow-orb--one" />
      <div className="marketing-flow-orb marketing-flow-orb--two" />
      <div className="relative mx-auto max-w-[1240px]">
        <div className="mx-auto max-w-[820px] text-center">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c9bdff]">See the whole job move</p>
          <h2 className="marketing-display mt-5 text-[clamp(3rem,6vw,6.2rem)] font-black leading-[0.9] tracking-[-0.045em] text-white marketing-white-copy">One small trigger. Every step handled.</h2>
          <p className="mx-auto mt-6 max-w-[650px] text-lg font-medium leading-8 text-white/70">This is what “running in the background” actually means—visible, understandable, and easy to trust.</p>
        </div>

        <div className="marketing-flow-window mt-14 overflow-hidden rounded-[30px] border border-white/24 bg-[#f9f8ff] text-[#171c30] shadow-[0_48px_110px_rgba(13,9,54,0.34)]">
          <div className="flex items-center justify-between border-b border-[#201b4b]/8 bg-white px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="" width={28} height={28} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#969caf]">Live flow</p>
                <p className="text-sm font-black">Invoice to spreadsheet</p>
              </div>
            </div>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#201b4b]/10 bg-[#f4f1ff] text-[#6742bd]" onClick={togglePlayback} aria-label={isFinished ? 'Replay flow' : paused ? 'Play flow' : 'Pause flow'}>
              {paused || isFinished ? <Play className="h-4 w-4" fill="currentColor" /> : <Pause className="h-4 w-4" fill="currentColor" />}
            </button>
          </div>

          <div className="marketing-flow-canvas px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
            <div className="marketing-flow-rail">
              {flowDemoSteps.map((step, index) => {
                const Icon = step.icon;
                const state = isFinished || index < activeStep ? 'complete' : index === activeStep ? 'active' : 'waiting';
                return (
                  <div key={step.title} className="marketing-flow-step" data-state={state}>
                    <span className="marketing-flow-step-icon"><Icon className="h-5 w-5" /></span>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-[#9473db]">{step.eyebrow}</p>
                    <h3 className="mt-2 text-lg font-black tracking-[-0.03em]">{step.title}</h3>
                    <p className="mt-2 text-xs font-semibold leading-5 text-[#747c91]">{step.detail}</p>
                    <span className="marketing-flow-step-state">{state === 'complete' ? 'Complete' : state === 'active' ? 'Working now' : 'Waiting'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#201b4b]/8 bg-white px-5 py-4 text-xs font-bold text-[#687187] sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <span className="flex items-center gap-2"><span className="marketing-live-dot" /> Automation is active and waiting for the next invoice</span>
            <span>{isFinished ? 'Completed · Replay any time' : `${activeStep + 1} of ${flowDemoSteps.length} · ${flowDemoSteps[activeStep].title}`}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MarketingLanding() {
  const [heroLoaded, setHeroLoaded] = useState(false);

  return (
    <main className="marketing-page overflow-hidden text-[#151b2d]">
      <section className="marketing-hero-world relative min-h-[1120px] overflow-hidden bg-[#11184a] pt-[76px]">
        <div className="marketing-hero-placeholder absolute inset-0" aria-hidden="true" />
        <Image
          src="/marketing/modelgrow-automation-garden-v2.png"
          alt="An illustrated automation garden with glowing paths connecting completed tasks"
          fill
          priority
          quality={96}
          sizes="100vw"
          onLoad={() => setHeroLoaded(true)}
          data-loaded={heroLoaded}
          className="marketing-hero-image object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,15,61,0.42)_0%,rgba(24,24,80,0.04)_52%,rgba(9,16,56,0.4)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[#101746]/65 to-transparent" />
        <div className="marketing-signal-field absolute inset-0" aria-hidden="true">
          <span className="marketing-signal-dot marketing-signal-dot--one" />
          <span className="marketing-signal-dot marketing-signal-dot--two" />
          <span className="marketing-signal-dot marketing-signal-dot--three" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[1240px] flex-col items-center px-5 pt-20 text-center sm:px-8 sm:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white/90 backdrop-blur-md">
            <Zap className="h-3.5 w-3.5 text-[#87f4e8]" fill="currentColor" />
            Ready-made automations for everyday work
          </div>
          <h1 className="marketing-display mt-7 max-w-[1050px] text-[clamp(3.5rem,7vw,7.4rem)] font-black leading-[0.88] tracking-[-0.055em] text-white marketing-white-copy">
            Make the work you repeat run itself.
          </h1>
          <p className="mt-7 max-w-[760px] text-lg font-medium leading-8 text-white/78 sm:text-[22px] sm:leading-9">
            Pick a proven automation, connect the apps already in your day, and watch the busywork disappear into the background.
          </p>
          <div className="marketing-hero-search mt-9 w-full max-w-[660px] text-left">
            <SearchBox />
          </div>
          <div className="marketing-hero-actions mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/explore" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black text-[#171c30] shadow-[0_14px_36px_rgba(7,12,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#f5f1ff]">
              Explore automations
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how-it-works" className="marketing-primary-button inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#161b4d]/30 px-7 py-3.5 text-sm font-black text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-[#161b4d]/50">
              <Play className="h-4 w-4" fill="currentColor" />
              See it work
            </a>
          </div>
          <p className="marketing-hero-trust mt-6 flex items-center gap-2 text-xs font-bold text-white/68">
            <ShieldCheck className="h-4 w-4 text-[#75e6bd]" />
            You stay in control. Pause or remove anything whenever you want.
          </p>

          <div className="mt-16 w-full sm:mt-20">
            <HeroProductStage />
          </div>
        </div>
      </section>

      <section className="marketing-section-curve relative z-20 -mt-1 border-b border-[#17203a]/7 bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-6 px-5 py-7 sm:px-8 lg:flex-row">
          <p className="text-center text-xs font-black uppercase tracking-[0.13em] text-[#9299aa] lg:text-left">Works with the apps already in your day</p>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 text-sm font-black text-[#4e566a]">
            {[
              [Mail, 'Gmail'],
              [MessageSquare, 'Slack'],
              [Table2, 'Google Sheets'],
              [FileText, 'Notion'],
              [CalendarDays, 'Calendar'],
            ].map(([Icon, label]) => (
              <span key={label} className="flex items-center gap-2"><Icon className="h-4 w-4 text-[#8e5cff]" />{label}</span>
            ))}
            <span className="text-[#8b63e6]">and more</span>
          </div>
        </div>
      </section>

      <WhyModelGrowSection />

      <section id="how-it-works" className="marketing-anchor mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.72fr]">
          <div>
            <p className="marketing-kicker">How it works</p>
            <h2 className="marketing-display mt-4 max-w-[760px] text-[clamp(2.8rem,5vw,5.1rem)] font-black leading-[0.98] tracking-[-0.045em] text-[#12182b]">From “I keep doing this” to “it is already handled.”</h2>
          </div>
          <p className="max-w-[520px] text-lg font-medium leading-8 text-[#656e83] lg:justify-self-end">
            You do not need to learn a builder or create a workflow. ModelGrow guides you through the few choices that matter.
          </p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <StepCard number="1" icon={Search} title="Tell us what repeats" description="Describe the work in plain language or browse by the result you want." detail="Start with the problem, not a builder" />
          <StepCard number="2" icon={MousePointerClick} title="Connect what the job needs" description="Choose the destination, approve the required apps, and review the setup before anything runs." detail="Every connection is visible" />
          <StepCard number="3" icon={Play} title="Let it run—and see the result" description="ModelGrow handles each matching task and shows you what completed or what needs attention." detail="The outcome stays visible" />
        </div>
      </section>

      <SavingsExampleSection />

      <OutcomeEffectSection />

      <FlowDemoSection />

      <section className="bg-[#0f1425] py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1240px] items-center gap-16 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <TrackingPanel />
          <div className="max-w-[610px]">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#ad8cff]">Know what happened</p>
            <h2 className="marketing-display mt-5 text-[clamp(2.9rem,5vw,5.2rem)] font-black leading-[0.95] tracking-[-0.04em] text-white marketing-white-copy">You never have to wonder if it worked.</h2>
            <p className="mt-6 text-lg font-medium leading-8 text-[#aab3c7]">
              See when an automation is waiting, when it ran, what it completed, and whether anything needs your attention.
            </p>
            <div className="mt-9 space-y-5">
              {[
                [CircleCheck, 'Clear run history', 'See successful and failed runs without opening a technical dashboard.'],
                [RefreshCw, 'Useful status updates', 'Know when the next event arrives and when the work is complete.'],
                [Pause, 'Simple controls', 'Pause or remove an automation directly from ModelGrow.'],
              ].map(([Icon, title, text]) => (
                <div key={title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.07] text-[#b596ff]"><Icon className="h-4 w-4" /></span>
                  <div>
                    <h3 className="text-sm font-black text-white marketing-white-copy">{title}</h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-[#8f9ab3]">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ControlStorySection />

      <section id="for-developers" className="marketing-anchor py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-[34px] border border-[#6f48c8]/10 bg-[#ece5ff] px-6 py-10 sm:px-12 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10 lg:px-16 lg:py-12">
            <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[#c8b5ff]/55 blur-3xl" />
            <div className="relative">
              <p className="marketing-kicker">Build automations?</p>
              <h2 className="marketing-display mt-4 max-w-[720px] text-[clamp(2.25rem,4vw,3.7rem)] font-black leading-[0.98] tracking-[-0.04em] text-[#151b2d]">There is a complete creator platform behind ModelGrow.</h2>
              <p className="mt-5 max-w-[680px] text-base font-medium leading-7 text-[#655b7d]">See how to build, test, publish, and maintain automations people can set up without learning a workflow builder.</p>
            </div>
            <Link href="/developers" className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-[#5b369e]/18 bg-white px-6 py-3.5 text-sm font-black text-[#4d2b91] shadow-[0_12px_30px_rgba(77,43,145,0.1)] transition-transform hover:-translate-y-0.5 lg:mt-0">
              <Code2 className="h-4 w-4" />
              Explore the developer platform
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[36px] bg-[#151a2d] px-6 py-16 text-center shadow-[0_30px_80px_rgba(21,26,45,0.2)] sm:px-10 sm:py-20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.08]">
            <Image src="/logo.png" alt="" width={38} height={38} />
          </div>
          <h2 className="marketing-display mx-auto mt-7 max-w-[830px] text-[clamp(2.8rem,5vw,5.3rem)] font-black leading-[0.94] tracking-[-0.04em] text-white marketing-white-copy">What would you like to stop doing manually?</h2>
          <p className="mx-auto mt-5 max-w-[620px] text-lg font-medium leading-8 text-[#aeb6c8]">There may already be an automation ready to handle it.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/explore" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-black text-[#171c30] transition-transform hover:-translate-y-0.5">
              Explore automations
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={openSignUp} className="marketing-primary-button inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3.5 text-sm font-black transition-all hover:-translate-y-0.5 hover:bg-white/[0.1]">
              Create your account
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
