'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Boxes,
  Compass,
  DollarSign,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';

const workflowItems = [
  { icon: Compass, title: 'Find a workflow', text: 'Search by what you want done, not by tool names.' },
  { icon: Play, title: 'Run from chat', text: 'The automation starts where the request begins.' },
  { icon: ShieldCheck, title: 'Stay in control', text: 'Review required accounts and actions before running.' },
];

const userSteps = [
  'Describe the job in plain English.',
  'ModelGrow matches a workflow.',
  'Connect accounts once.',
  'Run it and track the result.',
];

const builderSteps = [
  { icon: Upload, label: 'Publish', text: 'Upload reusable automations for others to run.' },
  { icon: Boxes, label: 'Package', text: 'Add connectors, pricing, and a clean run flow.' },
  { icon: DollarSign, label: 'Earn', text: 'Get tokens when people use what you built.' },
];

const examplePrompts = [
  'Post my TikTok drafts every morning',
  'Send LinkedIn updates when I publish a blog',
  'Find auto parts and summarize prices',
  'Create invoices from uploaded files',
];

const faqs = [
  {
    q: 'Do users need to know code?',
    a: 'No. Users describe the task and run existing workflows. Developers can still publish deeper automations.',
  },
  {
    q: 'What if a workflow does not exist?',
    a: 'Users can post a community request. Builders can pick up useful requests and publish a reusable workflow.',
  },
  {
    q: 'How does earning work?',
    a: 'Builders price their automation runs in tokens. When users run the workflow, the builder earns from usage.',
  },
];

function SectionLabel({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-white/35 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--landing-muted)] dark:bg-white/[0.06]">
      <Sparkles className="h-3.5 w-3.5 text-[var(--landing-accent)]" />
      {children}
    </span>
  );
}

function PrimaryButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="landing-button inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition-transform"
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h2 className="mt-5 text-3xl font-black leading-tight text-[var(--landing-ink)] sm:text-4xl">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-7 text-[var(--landing-muted)]">
        {text}
      </p>
    </div>
  );
}

function WorkflowCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)] p-5 shadow-[0_10px_26px_rgba(38,51,79,0.06)] backdrop-blur">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--landing-yellow)]/22 text-[var(--landing-accent)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-black text-[var(--landing-ink)]">{item.title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-[var(--landing-muted)]">{item.text}</p>
    </div>
  );
}

function PromptBoard() {
  return (
    <div className="rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card-strong)] p-4 shadow-[0_14px_34px_rgba(38,51,79,0.08)] backdrop-blur">
      <div className="flex items-center gap-2 border-b border-[var(--landing-border)] pb-3">
        <Search className="h-4 w-4 text-[var(--landing-accent-3)]" />
        <span className="text-sm font-black text-[var(--landing-ink)]">Try a real request</span>
      </div>
      <div className="mt-4 grid gap-2">
        {examplePrompts.map((prompt) => (
          <div
            key={prompt}
            className="flex items-center justify-between gap-3 rounded-lg border border-[var(--landing-border)] bg-white/35 px-3 py-3 text-sm font-bold text-[var(--landing-ink)] dark:bg-white/[0.05]"
          >
            <span>{prompt}</span>
            <Plus className="h-4 w-4 flex-shrink-0 text-[var(--landing-accent-2)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function UserFlow() {
  return (
    <div className="grid gap-3">
      {userSteps.map((step, index) => (
        <div key={step} className="flex items-start gap-4">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--landing-accent-2)]/16 text-sm font-black text-[var(--landing-accent-2)]">
            {index + 1}
          </div>
          <div className="min-h-8 border-b border-[var(--landing-border)] pb-3 text-sm font-bold leading-6 text-[var(--landing-ink)]">
            {step}
          </div>
        </div>
      ))}
    </div>
  );
}

function BuilderCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="rounded-lg border border-[var(--landing-border)] bg-white/32 p-5 dark:bg-white/[0.05]">
      <Icon className="mb-4 h-5 w-5 text-[var(--landing-accent-3)]" />
      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-[var(--landing-muted)]">
        {item.label}
      </h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--landing-ink)]">{item.text}</p>
    </div>
  );
}

function MiniConsole() {
  return (
    <div className="rounded-lg border border-[var(--landing-border)] bg-[#202538] p-4 text-sm shadow-[0_16px_38px_rgba(38,51,79,0.12)]">
      <div className="mb-4 flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#c77dff]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#8792ff]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#5d58ff]" />
      </div>
      <div className="space-y-2 font-mono text-xs leading-6 text-[#dbe7ff]">
        <p><span className="text-[#ffb86b]">workflow</span>: social-poster</p>
        <p><span className="text-[#82e6c9]">trigger</span>: every weekday</p>
        <p><span className="text-[#9fb0ff]">action</span>: publish approved draft</p>
        <p><span className="text-[#ffd166]">price</span>: 8 tokens/run</p>
      </div>
    </div>
  );
}

export default function LandingSections({ onSignUpClick }) {
  return (
    <div className="w-full text-[var(--landing-ink)]">
      <section className="w-full px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionLabel>Automation</SectionLabel>
            <h2 className="mt-5 text-3xl font-black leading-tight text-[var(--landing-ink)] sm:text-4xl">
              Less landing page noise. More useful automation.
            </h2>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[var(--landing-muted)]">
              The product should explain itself as you scroll: search, run, publish, earn. Each section below has one job.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <PrimaryButton onClick={onSignUpClick}>Start free</PrimaryButton>
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--landing-border)] bg-white/35 px-5 py-3 text-sm font-black text-[var(--landing-ink)] transition hover:bg-white/55 dark:bg-white/[0.06]"
              >
                Request workflow
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <PromptBoard />
        </div>
      </section>

      <section className="w-full border-y border-[var(--landing-border)] bg-white/20 px-6 py-16 backdrop-blur-sm dark:bg-white/[0.03] sm:px-10 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="How it works"
            title="One clear path from idea to completed task."
            text="No spinning demo walls, no fake dashboard maze. The core user flow stays readable."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {workflowItems.map((item) => (
              <WorkflowCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionLabel>For users</SectionLabel>
            <h2 className="mt-5 text-3xl font-black leading-tight text-[var(--landing-ink)] sm:text-4xl">
              Ask once. Run the right workflow.
            </h2>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[var(--landing-muted)]">
              The page should feel like the app: practical, fast, and easy to scan.
            </p>
          </div>
          <UserFlow />
        </div>
      </section>

      <section className="w-full border-y border-[var(--landing-border)] bg-white/20 px-6 py-16 backdrop-blur-sm dark:bg-white/[0.03] sm:px-10 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionLabel>For builders</SectionLabel>
            <h2 className="mt-5 text-3xl font-black leading-tight text-[var(--landing-ink)] sm:text-4xl">
              Publish workflows people can actually use.
            </h2>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[var(--landing-muted)]">
              Developers get a straightforward workflow story: upload, package, earn.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {builderSteps.map((item) => (
                <BuilderCard key={item.label} item={item} />
              ))}
            </div>
          </div>
          <MiniConsole />
        </div>
      </section>

      <section className="w-full px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            eyebrow="Useful details"
            title="Short answers. No filler."
            text="The bottom of the page should remove uncertainty, not add another animation sequence."
          />
          <div className="mt-10 grid gap-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-[var(--landing-border)] bg-[var(--landing-card)] p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-[var(--landing-ink)]">
                  {item.q}
                  <ArrowRight className="h-4 w-4 flex-shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-[var(--landing-muted)]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <PrimaryButton onClick={onSignUpClick}>Create account</PrimaryButton>
            <p className="text-sm font-semibold text-[var(--landing-muted)]">
              <Bot className="mr-2 inline h-4 w-4 text-[var(--landing-accent-2)]" />
              Run existing automations or publish your own.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
