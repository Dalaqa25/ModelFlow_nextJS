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
  X,
  Zap,
} from 'lucide-react';
import MarketingFooter from './MarketingFooter';
import RolePicker from './RolePicker';
import RotatingWord from './RotatingWord';
import HeroCluster from './HeroCluster';
import NoSetupSection from './NoSetupSection';
import AutomationShowcase from './AutomationShowcase';
import AutomationWall from './AutomationWall';
import { automationsForRole } from '@/lib/marketing/role-automations';

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

const automationLibraryGroups = {
  Everyday: [
    { name: 'Invoice Organizer', apps: [Mail, Table2], time: '32 hrs/yr', trigger: 'A new invoice arrives', result: 'A clean row appears in Sheets', credits: 2 },
    { name: 'Inbox Brief', apps: [Inbox, FileText], time: '52 hrs/yr', trigger: 'Your morning starts', result: 'Important emails are summarized', credits: 1 },
    { name: 'Meeting Notes', apps: [CalendarDays, FileText], time: '40 hrs/yr', trigger: 'A meeting ends', result: 'Notes and next steps are ready', credits: 2 },
  ],
  Sales: [
    { name: 'Lead Follow-up', apps: [UsersRound, Mail], time: '64 hrs/yr', trigger: 'A new lead comes in', result: 'A personal follow-up is sent', credits: 3 },
    { name: 'CRM Cleanup', apps: [UsersRound, Table2], time: '36 hrs/yr', trigger: 'A deal changes stage', result: 'The customer record stays current', credits: 2 },
    { name: 'Proposal Reminder', apps: [BriefcaseBusiness, CalendarDays], time: '24 hrs/yr', trigger: 'A proposal waits too long', result: 'The right reminder goes out', credits: 1 },
  ],
  Marketing: [
    { name: 'Weekly Report', apps: [Table2, FileCheck2], time: '48 hrs/yr', trigger: 'Friday morning arrives', result: 'The weekly report is ready', credits: 2 },
    { name: 'Content Brief', apps: [MessageSquare, FileText], time: '30 hrs/yr', trigger: 'A topic is approved', result: 'A clear content brief appears', credits: 2 },
    { name: 'Campaign Digest', apps: [Mail, FileCheck2], time: '42 hrs/yr', trigger: 'A campaign finishes', result: 'Results arrive in one digest', credits: 2 },
  ],
  Support: [
    { name: 'Priority Inbox', apps: [Inbox, Mail], time: '52 hrs/yr', trigger: 'A customer needs help', result: 'Urgent messages move to the top', credits: 1 },
    { name: 'Ticket Digest', apps: [MessageSquare, FileText], time: '38 hrs/yr', trigger: 'The support day closes', result: 'Open issues are summarized', credits: 2 },
    { name: 'SLA Reminder', apps: [Clock3, MessageSquare], time: '28 hrs/yr', trigger: 'A deadline gets close', result: 'The owner gets a reminder', credits: 1 },
  ],
};

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

function HeroBackdrop() {
  return (
    <div className="marketing-hero-artwork absolute inset-0" aria-hidden="true">
      <svg viewBox="0 0 1600 1200" preserveAspectRatio="xMidYMid slice" role="presentation">
        <defs>
          <linearGradient id="hero-sky" x1="0" x2="0.85" y1="0" y2="1">
            <stop offset="0%" stopColor="#10184d" />
            <stop offset="48%" stopColor="#473f94" />
            <stop offset="100%" stopColor="#191e58" />
          </linearGradient>
          <radialGradient id="hero-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f5b4d1" stopOpacity="0.82" />
            <stop offset="48%" stopColor="#ad75e8" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#ad75e8" stopOpacity="0" />
          </radialGradient>
          <filter id="hero-soften" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="32" />
          </filter>
        </defs>
        <rect width="1600" height="1200" fill="url(#hero-sky)" />
        <ellipse cx="800" cy="530" rx="510" ry="370" fill="url(#hero-glow)" filter="url(#hero-soften)" />
        <ellipse cx="180" cy="1090" rx="590" ry="300" fill="#27a89e" opacity="0.28" filter="url(#hero-soften)" />
        <ellipse cx="1430" cy="1040" rx="520" ry="310" fill="#2b7088" opacity="0.27" filter="url(#hero-soften)" />
        <path d="M-40 980C230 820 443 1100 698 951s440-140 942 27v222H-40Z" fill="#153d54" opacity="0.48" />
        <path d="M-40 1070c230-119 432 29 686-91 281-132 503 91 994-13v234H-40Z" fill="#102b48" opacity="0.62" />
        <g fill="#fff" opacity="0.68">
          <circle cx="129" cy="231" r="1.4" /><circle cx="280" cy="122" r="1" /><circle cx="415" cy="310" r="1.4" />
          <circle cx="654" cy="154" r="1.2" /><circle cx="895" cy="236" r="1.5" /><circle cx="1073" cy="102" r="1" />
          <circle cx="1281" cy="287" r="1.5" /><circle cx="1489" cy="170" r="1.1" /><circle cx="1518" cy="428" r="1.4" />
          <circle cx="86" cy="475" r="1" /><circle cx="339" cy="515" r="1.3" /><circle cx="1190" cy="513" r="1.1" />
        </g>
        <g fill="none" stroke="#d5c7ff" strokeLinecap="round" opacity="0.16">
          <path d="M55 804C269 667 406 744 570 650s308-19 512-147 311-100 480-17" strokeWidth="1.5" />
          <path d="M-50 714c227-133 355 37 600-76s424-112 634-33 302-18 470-142" strokeWidth="1" />
        </g>
      </svg>
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
          placeholder="Tell ModelGrow what you repeat…"
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

function AboutModelGrowSection() {
  return (
    <section data-ground="light" id="what-is-modelgrow" className="marketing-anchor relative overflow-hidden border-b border-[#17203a]/7 bg-[#fbfaf7] py-16 sm:py-20">
      <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-[#bba1ff]/18 blur-[100px]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
        <div>
          <p className="marketing-kicker">What is ModelGrow?</p>
          <h2 className="marketing-display mt-4 max-w-[600px] text-[clamp(2.5rem,4.4vw,4.5rem)] font-black leading-[0.94] tracking-[-0.05em] text-[#151b2d]">
            Give the repetitive part away.
          </h2>
          <p className="mt-5 max-w-[480px] text-base font-medium leading-7 text-[#656e83]">
            Pick a job. Connect your apps. ModelGrow handles the handoff.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#7041d6]/12 bg-[#f0eaff] px-4 py-2.5 text-sm font-black text-[#6741bd]">
            <Sparkles className="h-4 w-4" />
            Built for people who have work to do
          </div>
        </div>

        <div className="relative min-h-[430px] overflow-hidden rounded-[34px] border border-[#17203a]/8 bg-gradient-to-br from-[#f0ecff] via-white to-[#e9f5ff] p-5 shadow-[0_30px_80px_rgba(45,39,95,0.1)] sm:p-8">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(112,65,214,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(112,65,214,0.07) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#8d78bc]">Your workday</p>
              <p className="mt-1 text-sm font-black text-[#25204f]">The same small jobs, every day</p>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-black text-[#6c5a99] shadow-sm"><span className="h-2 w-2 rounded-full bg-[#f1b45f]" /> Waiting</span>
          </div>

          <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
            <AppBadge icon={Mail} name="New invoice in Gmail" color="#d94235" background="#fff0ed" />
            <AppBadge icon={Inbox} name="Inbox needs sorting" color="#5c63d8" background="#eef0ff" />
            <AppBadge icon={FileText} name="Weekly report due" color="#3974b7" background="#edf6ff" />
            <AppBadge icon={CalendarDays} name="Follow-up tomorrow" color="#168452" background="#eaf9f1" />
          </div>

          <div className="relative mx-auto mt-7 max-w-[470px] rounded-[26px] border border-[#7041d6]/15 bg-[#171c30] p-5 text-white shadow-[0_24px_55px_rgba(32,24,77,0.2)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7b5ce0]"><Sparkles className="h-4 w-4" /></span><span className="text-sm font-black">ModelGrow is handling it</span></div>
              <span className="text-[10px] font-black uppercase tracking-[0.13em] text-[#8ff1cf]">Active</span>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs font-bold text-white/65">
              <span className="rounded-full bg-white/10 px-2.5 py-1.5">Gmail</span><ArrowRight className="h-3.5 w-3.5 text-[#8ff1cf]" /><span className="rounded-full bg-white/10 px-2.5 py-1.5">ModelGrow</span><ArrowRight className="h-3.5 w-3.5 text-[#8ff1cf]" /><span className="rounded-full bg-white/10 px-2.5 py-1.5">Sheets</span>
            </div>
            <p className="mt-4 text-xs font-semibold leading-5 text-white/55">The useful details are captured, checked, and placed where they belong.</p>
          </div>

          <div className="relative mt-5 flex items-center justify-between rounded-2xl bg-white/75 px-4 py-3 text-xs font-black text-[#3f4960] shadow-sm">
            <span className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-[#16a16b]" /> Your attention is free</span>
            <span className="text-[#7041d6]">See the result →</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyModelGrowSection() {
  return (
    <section data-ground="dark" id="why-modelgrow" className="marketing-anchor border-b border-[#17203a]/7 bg-[#11184a] py-20 text-white sm:py-24">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.17em] text-[#aeece3]">Why ModelGrow</p>
            <h2 className="marketing-display mt-4 max-w-[700px] text-[clamp(2.5rem,4.4vw,4.5rem)] font-black leading-[0.94] tracking-[-0.05em] text-white marketing-white-copy">Less busywork. More room to think.</h2>
          </div>
          <p className="max-w-[320px] text-sm font-semibold leading-6 text-white/55">Ready-made. Clear. Under your control.</p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[26px] border border-white/10 bg-white/10 md:grid-cols-3">
          {[
            [Zap, 'Ready-made', 'Start with the result—not a blank canvas.'],
            [MousePointerClick, 'Easy to start', 'Connect the apps you already know.'],
            [ShieldCheck, 'Still yours', 'Pause, review, or remove it anytime.'],
          ].map(([Icon, title, text]) => (
            <article key={title} className="bg-[#202642] p-6 sm:p-7">
              <Icon className="h-5 w-5 text-[#8ff1cf]" />
              <h3 className="mt-8 text-xl font-black text-white marketing-white-copy">{title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-white/55">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SavingsExampleSection() {
  return (
    <section data-ground="light" id="savings-example" className="marketing-anchor relative overflow-hidden border-b border-[#25204f]/8 bg-[#fbfaf7] py-24 sm:py-32">
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
    <section data-ground="light" className="border-b border-[#17203a]/7 bg-[#fbfaf7] py-24 sm:py-32">
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
    <section data-ground="light" id="use-cases" className="marketing-anchor marketing-outcome-grid bg-[#fbfaf7] py-24 sm:py-32">
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

function SimpleUseCasesSection() {
  return (
    <section data-ground="light" id="use-cases" className="marketing-anchor border-b border-[#17203a]/7 bg-[#fbfaf7] py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="marketing-kicker">Start with one thing</p>
            <h2 className="marketing-display mt-3 max-w-[660px] text-[clamp(2.8rem,5vw,5rem)] font-black leading-[0.92] tracking-[-0.045em] text-[#25204f]">Pick the work you want off your plate.</h2>
          </div>
          <Link href="/explore" className="inline-flex w-fit items-center gap-2 rounded-full border border-[#6540ba]/16 bg-white px-5 py-3 text-sm font-black text-[#6540ba] shadow-[0_10px_24px_rgba(54,41,91,0.06)] transition-transform hover:-translate-y-0.5">Browse all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={`/explore?search=${encodeURIComponent(item.title)}`} className="group flex items-center gap-4 rounded-[22px] border border-[#17203a]/8 bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(23,32,58,0.08)] sm:p-5">
                <span className={`marketing-use-case-icon marketing-use-case--${item.tone} flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl`}><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-black text-[#25204f]">{item.title}</span><span className="mt-1 block truncate text-xs font-semibold text-[#858c9d]">{item.result}</span></span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#a1a7b5] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#7143d4]" />
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
    <section data-ground="dark" ref={sectionRef} className="marketing-flow-story relative overflow-hidden bg-[#11184a] px-5 py-20 text-white sm:px-8 sm:py-24">
      <div className="marketing-flow-orb marketing-flow-orb--one" />
      <div className="marketing-flow-orb marketing-flow-orb--two" />
      <div className="relative mx-auto max-w-[1240px]">
        <div className="mx-auto max-w-[820px] text-center">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c9bdff]">See the whole job move</p>
          <h2 className="marketing-display mt-5 text-[clamp(2.7rem,4.8vw,4.8rem)] font-black leading-[0.94] tracking-[-0.045em] text-white marketing-white-copy">One small trigger. Every step handled.</h2>
          <p className="mx-auto mt-5 max-w-[560px] text-base font-medium leading-7 text-white/70">Watch one invoice move from inbox to spreadsheet.</p>
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

function HandoffStorySection() {
  return (
    <section data-ground="light" id="what-is-modelgrow" className="marketing-anchor mg-chapter mg-handoff-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mg-section-heading mx-auto text-center">
          <p className="marketing-kicker">What is ModelGrow?</p>
          <h2 className="marketing-display">One request. The whole handoff.</h2>
          <p>It notices the work, handles the middle, and puts the result where it belongs.</p>
        </div>

        <div className="mg-handoff-scene">
          <div className="mg-handoff-glow" aria-hidden="true" />
          <div className="mg-handoff-path" aria-hidden="true"><span /></div>

          <article className="mg-window mg-window--source">
            <div className="mg-window-bar">
              <span className="mg-app-mark mg-app-mark--mail"><Mail className="h-4 w-4" /></span>
              <span>Gmail</span>
              <span className="mg-window-time">9:41</span>
            </div>
            <div className="mg-mail-preview">
              <span className="mg-avatar">AS</span>
              <div>
                <strong>Invoice #1042</strong>
                <small>Acme Supplies · PDF attached</small>
              </div>
            </div>
            <div className="mg-attachment"><FileText className="h-4 w-4" /><span>invoice-1042.pdf</span><strong>$2,480</strong></div>
          </article>

          <div className="mg-agent-core">
            <div className="mg-agent-rings" aria-hidden="true"><span /><span /></div>
            <span className="mg-agent-logo"><Image src="/logo.png" alt="" width={42} height={42} /></span>
            <strong>Handling it</strong>
            <div className="mg-agent-actions">
              {['Read', 'Check', 'Move'].map((label) => <span key={label}><Check className="h-3 w-3" />{label}</span>)}
            </div>
          </div>

          <article className="mg-window mg-window--result">
            <div className="mg-window-bar">
              <span className="mg-app-mark mg-app-mark--sheets"><Table2 className="h-4 w-4" /></span>
              <span>Google Sheets</span>
              <span className="mg-done-pill"><CircleCheck className="h-3 w-3" /> Added</span>
            </div>
            <div className="mg-sheet-head"><span>Vendor</span><span>Invoice</span><span>Total</span></div>
            <div className="mg-sheet-row"><strong>Acme Supplies</strong><span>#1042</span><strong>$2,480</strong></div>
            <div className="mg-sheet-row mg-sheet-row--ghost"><span>Northstar</span><span>#1041</span><span>$860</span></div>
          </article>

          <div className="mg-handoff-status">
            <span><span className="mg-live-dot" /> Ready for the next one</span>
            <span>12 seconds</span>
            <span>No copy-paste</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyVisualSection() {
  return (
    <section data-ground="dark" id="why-modelgrow" className="marketing-anchor mg-chapter mg-why-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mg-section-heading mg-section-heading--light">
          <p>Why ModelGrow?</p>
          <h2 className="marketing-display">Five little steps. Every single time.</h2>
        </div>

        <div className="mg-compare-stage">
          <div className="mg-compare-side mg-compare-side--builder">
            <div className="mg-compare-label"><span>Without ModelGrow</span><small>Every invoice</small></div>
            <div className="mg-manual-loop">
              <div className="mg-manual-summary">
                <span><Clock3 className="h-5 w-5" /></span>
                <div><small>Manual routine</small><strong>About 8 minutes</strong></div>
                <em>again</em>
              </div>

              <div className="mg-manual-steps" aria-label="Five manual steps repeated for every invoice">
                <div className="mg-manual-step"><i>1</i><Mail className="h-4 w-4" /><strong>Open the email</strong><small>1 min</small></div>
                <div className="mg-manual-step"><i>2</i><FileText className="h-4 w-4" /><strong>Download the invoice</strong><small>1 min</small></div>
                <div className="mg-manual-step"><i>3</i><Search className="h-4 w-4" /><strong>Find the right details</strong><small>2 min</small></div>
                <div className="mg-manual-step"><i>4</i><Table2 className="h-4 w-4" /><strong>Copy them into Sheets</strong><small>3 min</small></div>
                <div className="mg-manual-step"><i>5</i><CircleCheck className="h-4 w-4" /><strong>Check it again</strong><small>1 min</small></div>
              </div>

              <div className="mg-manual-repeat"><RefreshCw className="h-4 w-4" /><span>Then repeat for the next one</span></div>
            </div>
          </div>

          <div className="mg-compare-vs">vs</div>

          <div className="mg-compare-side mg-compare-side--modelgrow">
            <div className="mg-compare-label"><span>With ModelGrow</span><small>Connect once</small></div>
            <div className="mg-ready-flow">
              <div className="mg-ready-request"><Search className="h-4 w-4" /><span>Save invoices to my spreadsheet</span></div>
              <span className="mg-ready-arrow"><ArrowRight className="h-4 w-4" /></span>
              <div className="mg-ready-result">
                <div><span className="mg-agent-logo mg-agent-logo--small"><Image src="/logo.png" alt="" width={30} height={30} /></span><div><small>Automation found</small><strong>Invoice to spreadsheet</strong></div></div>
                <div className="mg-ready-apps"><span><Mail className="h-4 w-4" />Gmail</span><ArrowRight className="h-4 w-4" /><span><Table2 className="h-4 w-4" />Sheets</span></div>
                <div className="mg-ready-footer"><CircleCheck className="h-4 w-4" /> Ready to connect</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mg-no-list" aria-label="Manual busywork removed">
          <span>No copy-paste</span><span>No retyping</span><span>No repeat routine</span>
        </div>
      </div>
    </section>
  );
}

function SavingsPainSection() {
  const [monthlyRuns, setMonthlyRuns] = useState(20);
  const minutesPerTask = 8;
  const hourlyValue = 30;
  const annualHours = Math.round((monthlyRuns * minutesPerTask * 12) / 60);
  const annualValue = annualHours * hourlyValue;
  const workdays = Math.round(annualHours / 8);
  const rangeProgress = ((monthlyRuns - 5) / 55) * 100;
  const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  return (
    <section data-ground="light" id="savings" className="marketing-anchor mg-chapter mg-savings-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mg-section-heading">
          <p className="marketing-kicker">The hidden cost</p>
          <h2 className="marketing-display">“Only eight minutes” adds up.</h2>
        </div>

        <div className="mg-savings-stage">
          <div className="mg-savings-input">
            <div className="mg-savings-control-head">
              <span>How often does it repeat?</span>
              <strong>{monthlyRuns}<small> / month</small></strong>
            </div>

            <input
              className="mg-savings-range"
              type="range"
              min="5"
              max="60"
              step="5"
              value={monthlyRuns}
              aria-label="Repeated tasks per month"
              style={{ '--mg-range-progress': `${rangeProgress}%` }}
              onChange={(event) => setMonthlyRuns(Number(event.target.value))}
            />
            <div className="mg-savings-range-labels"><span>5 times</span><span>60 times</span></div>

            <div className="mg-year-visual" aria-hidden="true">
              <div className="mg-year-visual-title"><span>The same task</span><strong>all year</strong></div>
              <div className="mg-year-bars">
                {months.map((month, index) => (
                  <span key={`${month}-${index}`}><i style={{ height: `${24 + monthlyRuns * 0.8}px` }} /><small>{month}</small></span>
                ))}
              </div>
            </div>

            <div className="mg-savings-equation" aria-label={`${minutesPerTask} minutes, ${monthlyRuns} times per month, for 12 months`}>
              <span><strong>{minutesPerTask} min</strong><small>each time</small></span>
              <b>×</b>
              <span><strong>{monthlyRuns}</strong><small>each month</small></span>
              <b>×</b>
              <span><strong>12</strong><small>months</small></span>
            </div>
          </div>

          <div className="mg-savings-output" aria-live="polite">
            <p>Potentially reclaimed each year</p>
            <div className="mg-savings-main-result">
              <span><Clock3 className="h-7 w-7" /></span>
              <div><strong>{annualHours}</strong><small>hours back</small></div>
            </div>

            <div className="mg-savings-secondary-results">
              <div><BadgeDollarSign className="h-5 w-5" /><span><strong>${annualValue.toLocaleString('en-US')}</strong><small>value of your time</small></span></div>
              <div><CalendarDays className="h-5 w-5" /><span><strong>{workdays} workdays</strong><small>at 8 hours a day</small></span></div>
            </div>

            <div className="mg-savings-callout"><Sparkles className="h-4 w-4" />One tiny repeat. One very real yearly cost.</div>
          </div>
        </div>

        <p className="mg-savings-note">Illustrative estimate using 8 minutes per task and $30/hour. Actual savings vary.</p>
      </div>
    </section>
  );
}

function HowVisualSection() {
  return (
    <section data-ground="light" id="how-it-works" className="marketing-anchor mg-chapter mg-how-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mg-section-heading mx-auto text-center">
          <p className="marketing-kicker">How it works</p>
          <h2 className="marketing-display">Choose it. Connect it. Let it run.</h2>
        </div>

        <div className="mg-setup-stage">
          <div className="mg-setup-progress" aria-hidden="true"><span /><span /><span /></div>

          <article className="mg-setup-step">
            <span className="mg-step-number">01</span>
            <div className="mg-step-visual mg-step-visual--search"><Search className="h-5 w-5" /><span>invoices → spreadsheet</span></div>
            <h3>Pick the outcome</h3>
            <p>Start with what you want done.</p>
          </article>

          <article className="mg-setup-step">
            <span className="mg-step-number">02</span>
            <div className="mg-step-visual mg-step-visual--connect">
              <span className="mg-app-mark mg-app-mark--mail"><Mail className="h-5 w-5" /></span>
              <span className="mg-connect-line"><span /></span>
              <span className="mg-app-mark mg-app-mark--sheets"><Table2 className="h-5 w-5" /></span>
            </div>
            <h3>Connect the apps</h3>
            <p>Approve only what the job needs.</p>
          </article>

          <article className="mg-setup-step">
            <span className="mg-step-number">03</span>
            <div className="mg-step-visual mg-step-visual--running"><span className="mg-live-dot" /><strong>Running</strong><small>18 jobs completed</small></div>
            <h3>Keep the result</h3>
            <p>Each run stays visible.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

function AutomationLibrarySection() {
  const [activeCategory, setActiveCategory] = useState('Everyday');
  const [activeAutomationIndex, setActiveAutomationIndex] = useState(0);
  const activeAutomations = automationLibraryGroups[activeCategory];
  const activeAutomation = activeAutomations[activeAutomationIndex];

  const chooseCategory = (category) => {
    setActiveCategory(category);
    setActiveAutomationIndex(0);
  };

  return (
    <section data-ground="dark" id="use-cases" className="marketing-anchor mg-chapter mg-library-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mg-section-heading mg-section-heading--light mx-auto text-center">
          <p>What can it handle?</p>
          <h2 className="marketing-display">Pick a job. See it run.</h2>
        </div>

        <div className="mg-chooser-shell">
          <div className="mg-chooser-board">
            <div className="mg-chooser-toolbar">
              <div><span className="mg-agent-logo mg-agent-logo--small"><Image src="/logo.png" alt="" width={30} height={30} /></span><strong>Automation library</strong></div>
              <span><span className="mg-live-dot" /> Always ready</span>
            </div>

            <div className="mg-chooser-layout">
              <div className="mg-chooser-picker">
                <div className="mg-chooser-tabs" role="tablist" aria-label="Automation categories">
                  {Object.keys(automationLibraryGroups).map((category) => (
                    <button
                      key={category}
                      type="button"
                      role="tab"
                      aria-selected={activeCategory === category}
                      className={activeCategory === category ? 'is-active btn-white-text' : ''}
                      onClick={() => chooseCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="mg-chooser-cards">
                  {activeAutomations.map((automation, index) => (
                    <button
                      key={automation.name}
                      type="button"
                      className={activeAutomationIndex === index ? 'mg-chooser-card is-active' : 'mg-chooser-card'}
                      aria-pressed={activeAutomationIndex === index}
                      onClick={() => setActiveAutomationIndex(index)}
                    >
                      <span className="mg-chooser-card-apps">
                        {automation.apps.map((AppIcon, appIndex) => <i key={`${automation.name}-${appIndex}`}><AppIcon className="h-4 w-4" /></i>)}
                      </span>
                      <span className="mg-chooser-card-copy"><strong>{automation.name}</strong><small>{automation.trigger}</small></span>
                      <span className="mg-chooser-card-value"><strong>≈ {automation.time}</strong><small>potentially returned</small></span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <aside key={activeAutomation.name} className="mg-chooser-preview">
                <div className="mg-chooser-preview-top">
                  <span className="mg-chooser-preview-apps">
                    {activeAutomation.apps.map((AppIcon, appIndex) => <i key={`preview-${activeAutomation.name}-${appIndex}`}><AppIcon className="h-5 w-5" /></i>)}
                  </span>
                  <span className="mg-chooser-live"><span className="mg-live-dot" /> Automatic</span>
                </div>

                <p>{activeCategory} automation</p>
                <h3>{activeAutomation.name}</h3>

                <div className="mg-chooser-timeline">
                  <div><span>1</span><p><small>When this happens</small><strong>{activeAutomation.trigger}</strong></p></div>
                  <i />
                  <div><span>2</span><p><small>ModelGrow</small><strong>Runs automatically</strong></p></div>
                  <i />
                  <div><span>3</span><p><small>Your result</small><strong>{activeAutomation.result}</strong></p></div>
                </div>

                <div className="mg-chooser-charge">
                  <div><CircleCheck className="h-4 w-4" /><span><small>Completed</small><strong>{activeAutomation.credits} credits</strong></span></div>
                  <div><X className="h-4 w-4" /><span><small>Failed</small><strong>0 credits</strong></span></div>
                </div>

                <div className="mg-chooser-return"><Clock3 className="h-4 w-4" /> Potentially returns {activeAutomation.time}</div>
              </aside>
            </div>
          </div>
        </div>

        <p className="mg-library-note">Illustrative time estimates. Your result depends on how often the work repeats.</p>
      </div>
    </section>
  );
}

function PayAsYouGoSection() {
  return (
    <section data-ground="light" id="pricing-explained" className="marketing-anchor mg-chapter mg-pay-section">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mg-section-heading mx-auto text-center">
          <p className="marketing-kicker">Simple pay-as-you-go</p>
          <h2 className="marketing-display">Buy credits once. Spend them only on success.</h2>
        </div>

        <div className="mg-credit-story">
          <article className="mg-credit-pack">
            <div className="mg-credit-pack-top"><span><BadgeDollarSign className="h-5 w-5" /></span><small>One-time purchase</small></div>
            <p>Starter credit pack</p>
            <div className="mg-credit-count"><strong>50</strong><span>credits</span></div>
            <div className="mg-credit-price"><strong>$5</strong><span>paid once</span></div>
            <div className="mg-credit-pack-points"><span><CircleCheck className="h-4 w-4" /> No subscription</span><span><CircleCheck className="h-4 w-4" /> Never expires</span></div>
          </article>

          <div className="mg-credit-path" aria-hidden="true"><span /><ArrowRight className="h-5 w-5" /></div>

          <div className="mg-credit-outcomes">
            <p>Example automation · 2 credits per run</p>
            <article className="mg-credit-outcome mg-credit-outcome--success">
              <span><CircleCheck className="h-5 w-5" /></span>
              <div><small>Run completed</small><strong>The result was delivered</strong></div>
              <div className="mg-credit-balance"><small>Balance</small><strong>50 → 48</strong><span>2 credits used</span></div>
            </article>
            <article className="mg-credit-outcome mg-credit-outcome--failed">
              <span><X className="h-5 w-5" /></span>
              <div><small>Run failed</small><strong>Nothing was delivered</strong></div>
              <div className="mg-credit-balance"><small>Balance</small><strong>50 → 50</strong><span>0 credits used</span></div>
            </article>
            <div className="mg-credit-rule"><ShieldCheck className="h-4 w-4" /> Your balance moves only after successful work.</div>
          </div>
        </div>

        <div className="mg-pay-actions">
          <Link href="/pricing">See one-time credit packs <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/explore">See automation costs first</Link>
        </div>
      </div>
    </section>
  );
}

function ControlFinaleSection() {
  return (
    <section data-ground="dark" className="mg-control-finale">
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
        <div>
          <p className="mg-dark-kicker">Still your work. Still your call.</p>
          <h2 className="marketing-display">Always visible. Always yours.</h2>
          <div className="mg-control-points">
            <span><CircleCheck className="h-4 w-4" /> Every run logged</span>
            <span><Pause className="h-4 w-4" /> Pause anytime</span>
            <span><ShieldCheck className="h-4 w-4" /> App access visible</span>
          </div>
          <div className="mg-finale-actions">
            <Link href="/explore">Explore automations <ArrowRight className="h-4 w-4" /></Link>
            <button type="button" onClick={openSignUp}>Get started</button>
          </div>
        </div>
        <div className="mg-tracking-wrap">
          <span className="mg-tracking-float"><span className="mg-live-dot" /> Live activity</span>
          <TrackingPanel />
        </div>
      </div>
    </section>
  );
}

const HERO_CHORES = [
  'invoices',
  'thumbnails',
  'captions',
  'hashtags',
  'brand deals',
  'rate cards',
];

export default function MarketingLanding({ automations = [] }) {
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const cluster = document.querySelector('[data-cluster]');
    if (!cluster) return undefined;

    const onMove = (event) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;
      cluster.style.setProperty('--mg-ry', `${(-19 + x * 17).toFixed(2)}deg`);
      cluster.style.setProperty('--mg-rx', `${(12 - y * 13).toFixed(2)}deg`);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  // No role chosen yet means "show what is doing best", not an empty page.
  const shownAutomations = selectedRole
    ? automationsForRole(selectedRole, automations)
    : automations.slice(0, 6);

  return (
    <main className="marketing-page overflow-x-clip text-[#151b2d]">
      <section data-ground="dark" className="marketing-hero-world relative min-h-[1120px] overflow-hidden bg-[#11184a] pt-[68px]">
        <HeroBackdrop />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,15,61,0.42)_0%,rgba(24,24,80,0.04)_52%,rgba(9,16,56,0.4)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-[#101746]/65 to-transparent" />
        <div className="marketing-signal-field absolute inset-0" aria-hidden="true">
          <span className="marketing-signal-dot marketing-signal-dot--one" />
          <span className="marketing-signal-dot marketing-signal-dot--two" />
          <span className="marketing-signal-dot marketing-signal-dot--three" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1240px] items-center gap-12 px-5 pt-24 sm:px-8 sm:pt-28 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-10">
          <div className="text-center lg:text-left">
            <h1 className="marketing-display max-w-[620px] text-[clamp(2.9rem,5.4vw,5.4rem)] font-black leading-[0.92] tracking-[-0.055em] text-white marketing-white-copy">
              Your<br />
              <RotatingWord words={HERO_CHORES} className="text-[#b79cff]" /><br />
              handled.
            </h1>

            <div className="marketing-hero-actions mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/explore" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black text-[#171c30] shadow-[0_14px_36px_rgba(7,12,45,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#f5f1ff]">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how-it-works" className="marketing-primary-button inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#161b4d]/30 px-7 py-3.5 text-sm font-black text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-[#161b4d]/50">
                <Play className="h-4 w-4" fill="currentColor" />
                See it work
              </a>
            </div>

            <p className="marketing-hero-trust mt-6 flex items-center justify-center gap-2 text-xs font-bold text-white/68 lg:justify-start">
              <ShieldCheck className="h-4 w-4 text-[#75e6bd]" />
              You stay in control. Pause or remove anything whenever you want.
            </p>
          </div>

          <HeroCluster automations={automations} />
        </div>

        <div className="relative z-10 mx-auto mt-14 w-full max-w-[1240px] px-5 sm:px-8">
          <RolePicker selected={selectedRole} onSelect={setSelectedRole} />
        </div>

        <div className="relative z-10 mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="mt-16 w-full sm:mt-20">
            <HeroProductStage />
          </div>
        </div>
      </section>

      <section data-ground="light" className="marketing-section-curve relative z-20 -mt-1 border-b border-[#17203a]/7 bg-[#fbfaf7]">
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

      {/* Results land directly under the hero: the answer has to arrive in the
          same motion as the click, or the moment is lost to a page change. */}
      <AutomationWall automations={shownAutomations} roleSelected={Boolean(selectedRole)} />


      <NoSetupSection />
      <AutomationShowcase automations={automations} />
      <AutomationLibrarySection />
      <PayAsYouGoSection />
      <ControlFinaleSection />

      <MarketingFooter />
    </main>
  );
}
