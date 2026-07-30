'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Clapperboard,
  FileText,
  Film,
  FolderOpen,
  Instagram,
  Mail,
  ReceiptText,
  Table2,
  Youtube,
} from 'lucide-react';

// Four cards, four buyers. The pitch deck failed because ModelGrow was described
// as a capability ("automations") instead of a person ("this is your week").
// Each card answers one question — is this me? — before any reading happens.
//
// The screen on each card shows the visitor's own apps, never ModelGrow's UI.
// That is the whole claim: the work stays where it already lives, minus you.
//
// Every CTA points at an automation that genuinely exists in the catalog, so a
// card can never promise something the explore page cannot deliver.

/* ---------------------------------------------------------------- chrome -- */

function Win({ app, tint, className = '', style, children }) {
  return (
    <div
      className={`absolute overflow-hidden rounded-[10px] border border-black/10 bg-white ${className}`}
      style={style}
    >
      <div className="flex h-[18px] items-center gap-1.5 border-b border-black/8 bg-[#eceef1] px-2">
        <span className="h-[7px] w-[7px] shrink-0 rounded-[2px]" style={{ background: tint }} />
        <span className="truncate text-[7px] font-bold tracking-tight text-[#5b6270]">{app}</span>
        <span className="ml-auto text-[8px] leading-none text-[#98a0ad]">×</span>
      </div>
      <div className="h-[calc(100%-18px)]">{children}</div>
    </div>
  );
}

function Toolbar({ items }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-[#e6e8ec] px-1.5 py-[3px]">
      {items.map((item) => (
        <span key={item} className="text-[6px] font-semibold text-[#8b93a1]">
          {item}
        </span>
      ))}
    </div>
  );
}

function SheetBody({ title, head, rows }) {
  return (
    <div className="flex h-full flex-col bg-white">
      <Toolbar items={['File', 'Edit', 'View', 'Insert', 'Format', 'Data']} />
      <div className="grid grid-cols-[14px_1.5fr_1fr_0.8fr] border-b border-[#e6e8ec] bg-[#f5f6f8] text-[6px] font-bold text-[#98a0ad]">
        {['', 'A', 'B', 'C'].map((letter, index) => (
          <span key={index} className="border-r border-[#e6e8ec] px-1 py-[2px] text-center last:border-r-0">
            {letter}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-[14px_1fr] border-b border-[#e6e8ec]">
        <span className="border-r border-[#e6e8ec] bg-[#f5f6f8] px-1 py-[3px] text-center text-[6px] font-bold text-[#98a0ad]">1</span>
        <span className="px-1.5 py-[3px] text-[7px] font-black text-[#2b3140]">{title}</span>
      </div>
      <div className="grid grid-cols-[14px_1.5fr_1fr_0.8fr] border-b border-[#e6e8ec] bg-[#fafbfc]">
        <span className="border-r border-[#e6e8ec] bg-[#f5f6f8] px-1 py-[3px] text-center text-[6px] font-bold text-[#98a0ad]">2</span>
        {head.map((label) => (
          <span key={label} className="truncate border-r border-[#e6e8ec] px-1.5 py-[3px] text-[6px] font-black text-[#5b6270] last:border-r-0">
            {label}
          </span>
        ))}
      </div>
      {rows.map((row, index) => (
        <div key={row[0]} className="grid grid-cols-[14px_1.5fr_1fr_0.8fr] border-b border-[#eef0f3]">
          <span className="border-r border-[#e6e8ec] bg-[#f5f6f8] px-1 py-[3px] text-center text-[6px] font-bold text-[#98a0ad]">
            {index + 3}
          </span>
          {row.map((cell, cellIndex) => (
            <span
              key={cellIndex}
              className={
                cellIndex === row.length - 1
                  ? 'truncate border-r border-[#eef0f3] px-1.5 py-[3px] text-[6px] font-black text-[#16805a] last:border-r-0'
                  : 'truncate border-r border-[#eef0f3] px-1.5 py-[3px] text-[6px] font-medium text-[#5b6270] last:border-r-0'
              }
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
      <div className="mt-auto flex items-center gap-1 border-t border-[#e6e8ec] px-1.5 py-[3px]">
        <span className="rounded-[3px] bg-[#eaf3ff] px-1.5 py-[1px] text-[6px] font-bold text-[#2f6fd0]">Sheet1</span>
      </div>
    </div>
  );
}

function MailBody({ rows }) {
  return (
    <div className="flex h-full bg-white">
      <aside className="flex w-[24%] shrink-0 flex-col gap-[3px] border-r border-[#eceef1] p-1.5">
        <span className="mb-1 rounded-full bg-[#e8f0fe] px-2 py-[3px] text-center text-[6px] font-black text-[#2f6fd0]">
          Compose
        </span>
        {['Inbox', 'Starred', 'Sent', 'Drafts'].map((label, index) => (
          <span
            key={label}
            className={
              index === 0
                ? 'rounded-r-full bg-[#fce8e6] px-1.5 py-[2px] text-[6px] font-black text-[#c5372c]'
                : 'px-1.5 py-[2px] text-[6px] font-semibold text-[#8b93a1]'
            }
          >
            {label}
          </span>
        ))}
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-[#eceef1] px-2 py-[3px]">
          <span className="border-b-2 border-[#c5372c] pb-[1px] text-[6px] font-black text-[#c5372c]">Primary</span>
          <span className="text-[6px] font-semibold text-[#98a0ad]">Promotions</span>
          <span className="text-[6px] font-semibold text-[#98a0ad]">Social</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.from}
            className={`grid grid-cols-[0.7fr_1.6fr_auto] items-center gap-1.5 border-b border-[#f1f2f5] px-2 py-[4px] ${row.unread ? 'bg-white' : 'bg-[#fbfbfc]'}`}
          >
            <span className={`truncate text-[6px] ${row.unread ? 'font-black text-[#2b3140]' : 'font-semibold text-[#7d8593]'}`}>
              {row.from}
            </span>
            <span className={`truncate text-[6px] ${row.unread ? 'font-bold text-[#3d4453]' : 'font-medium text-[#98a0ad]'}`}>
              {row.subject}
            </span>
            <span className="text-[5px] font-bold text-[#a8afba]">{row.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocBody({ heading, lines }) {
  return (
    <div className="flex h-full flex-col bg-white">
      <Toolbar items={['File', 'Edit', 'View', 'Insert', 'Format', 'Tools']} />
      <div className="flex-1 px-3 py-2.5">
        <p className="text-[8px] font-black tracking-tight text-[#2b3140]">{heading}</p>
        <div className="mt-2 space-y-[5px]">
          {lines.map((line, index) => (
            <p key={line} className="flex gap-1.5 text-[6px] font-medium leading-[1.5] text-[#5b6270]">
              <span className="font-black text-[#98a0ad]">{index + 1}.</span>
              <span className={index === 0 ? 'rounded-[2px] bg-[#fff3c4] px-[2px] text-[#3d4453]' : ''}>{line}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineBody({ clips }) {
  return (
    <div className="flex h-full flex-col bg-[#1e2027]">
      <div className="flex flex-1 gap-1.5 p-1.5">
        <div className="flex-1 rounded-[4px] bg-gradient-to-br from-[#4b5a7a] to-[#252a38]" />
        <div className="flex w-[28%] flex-col gap-[3px]">
          {['Pacing', 'B-roll', 'Retention'].map((label) => (
            <span key={label} className="rounded-[3px] bg-white/8 px-1.5 py-[3px] text-[5px] font-bold text-white/60">
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-[3px] border-t border-white/8 p-1.5">
        {clips.map((track, trackIndex) => (
          <div key={trackIndex} className="flex h-[9px] gap-[2px]">
            {track.map((clip, clipIndex) => (
              <span
                key={clipIndex}
                className="rounded-[2px]"
                style={{ flex: clip.span, background: clip.tint }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardBody({ title, items }) {
  return (
    <div className="flex h-full flex-col bg-[#fafbfc]">
      <div className="border-b border-[#e6e8ec] bg-white px-2 py-[4px] text-[7px] font-black text-[#2b3140]">{title}</div>
      <div className="flex-1 space-y-[4px] p-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 rounded-[5px] border border-[#e9ebef] bg-white px-1.5 py-[4px]">
            <span className="h-[10px] w-[10px] shrink-0 rounded-[3px]" style={{ background: item.tint }} />
            <span className="min-w-0 flex-1 truncate text-[6px] font-bold text-[#3d4453]">{item.label}</span>
            <span className="text-[5px] font-black uppercase tracking-[0.08em] text-[#16805a]">{item.state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- cards -- */

const CARDS = [
  {
    id: 'creator',
    title: 'Content Creator',
    copy: 'ModelGrow writes the hooks, cuts the captions, builds the thumbnail, and spots the trend worth chasing. You shoot — everything around the upload is handled.',
    apps: [
      { icon: Youtube, tint: '#ff0033', bg: '#ffffff' },
      { icon: Instagram, tint: '#d6249f', bg: '#ffffff' },
      { icon: FolderOpen, tint: '#f5b400', bg: '#ffffff' },
    ],
    automation: 'Hook Generator',
    flip: false,
    sky: 'linear-gradient(178deg,#f8c9a4 0%,#eda67f 34%,#b96a5c 62%,#5e3547 100%)',
    hills: ['#8a4a52', '#3d2338'],
    scene: (
      <>
        <Win app="YouTube Studio" tint="#ff0033" className="max-sm:hidden right-[-8%] top-[7%] h-[68%] w-[46%] shadow-[0_10px_30px_rgba(20,10,30,0.3)]">
          <BoardBody
            title="Recent uploads"
            items={[
              { label: 'Why nobody finishes your video', tint: '#ff0033', state: 'Live' },
              { label: '3 edits that fix retention', tint: '#ff5a4d', state: 'Live' },
              { label: 'Trend breakdown — this week', tint: '#ffb199', state: 'Draft' },
            ]}
          />
        </Win>
        <Win app="Hooks — Google Docs" tint="#3b74d8" className="left-[5%] top-[15%] h-[74%] w-[74%] max-sm:left-[6%] max-sm:top-[13%] max-sm:h-[78%] max-sm:w-[88%] shadow-[0_18px_44px_rgba(20,10,30,0.34)]">
          <DocBody
            heading="Hooks for Thursday's upload"
            lines={[
              'You have been editing in the wrong order this whole time.',
              'Nobody tells you what happens after the first 100k.',
              'I tried it for 30 days so you would not have to.',
              'This one setting changed everything about my audio.',
            ]}
          />
        </Win>
      </>
    ),
  },
  {
    id: 'editor',
    title: 'Video Editor',
    copy: 'It reviews the cut for pacing, marks exactly where b-roll belongs, times every transition, and predicts where people drop off — all before you export.',
    apps: [
      { icon: Clapperboard, tint: '#9a5cff', bg: '#ffffff' },
      { icon: Film, tint: '#2f6fd0', bg: '#ffffff' },
      { icon: Table2, tint: '#16805a', bg: '#ffffff' },
    ],
    automation: 'Video Pacing Analyzer',
    flip: true,
    sky: 'linear-gradient(178deg,#bcd7ea 0%,#7ba6c8 30%,#3f6a92 58%,#16283f 100%)',
    hills: ['#2c4b68', '#132538'],
    scene: (
      <>
        <Win app="Google Sheets" tint="#16805a" className="max-sm:hidden right-[-8%] top-[7%] h-[68%] w-[46%] shadow-[0_10px_30px_rgba(6,16,30,0.34)]">
          <SheetBody
            title="Retention by segment"
            head={['Segment', 'Drop-off', 'Fix']}
            rows={[
              ['0:00 – 0:12', '4%', 'Keep'],
              ['0:12 – 0:41', '31%', 'Trim'],
              ['0:41 – 1:20', '9%', 'Keep'],
            ]}
          />
        </Win>
        <Win app="Timeline — Episode 14" tint="#9a5cff" className="left-[5%] top-[15%] h-[74%] w-[74%] max-sm:left-[6%] max-sm:top-[13%] max-sm:h-[78%] max-sm:w-[88%] shadow-[0_18px_44px_rgba(6,16,30,0.4)]">
          <TimelineBody
            clips={[
              [
                { span: 3, tint: '#6f8dff' },
                { span: 1.4, tint: '#4a5db8' },
                { span: 2.2, tint: '#6f8dff' },
                { span: 1, tint: '#3a4880' },
              ],
              [
                { span: 1.2, tint: '#39caa9' },
                { span: 2.6, tint: '#2a8f78' },
                { span: 1.1, tint: '#39caa9' },
              ],
              [
                { span: 2, tint: '#c9a24d' },
                { span: 3.4, tint: '#8a6f33' },
              ],
            ]}
          />
        </Win>
      </>
    ),
  },
  {
    id: 'creator-business',
    title: 'Brand Deals & Money',
    copy: 'Sponsor emails get answered with your real rates, contracts get read and explained in plain language, and every payment lands in your income tracker.',
    apps: [
      { icon: Mail, tint: '#d94235', bg: '#ffffff' },
      { icon: FileText, tint: '#3b74d8', bg: '#ffffff' },
      { icon: Table2, tint: '#16805a', bg: '#ffffff' },
    ],
    automation: 'Brand Deal Email Generator',
    flip: false,
    sky: 'linear-gradient(178deg,#dbe7c4 0%,#a8c078 32%,#5f7f4d 60%,#25361f 100%)',
    hills: ['#4a6438', '#1e2c1a'],
    scene: (
      <>
        <Win app="Income Tracker" tint="#16805a" className="max-sm:hidden right-[-8%] top-[7%] h-[68%] w-[46%] shadow-[0_10px_30px_rgba(14,24,10,0.32)]">
          <SheetBody
            title="Brand deals 2026"
            head={['Brand', 'Fee', 'Status']}
            rows={[
              ['Northbound', '$4,200', 'Paid'],
              ['Kettle Co.', '$2,800', 'Paid'],
              ['Loop Audio', '$5,500', 'Signed'],
            ]}
          />
        </Win>
        <Win app="Gmail" tint="#d94235" className="left-[5%] top-[15%] h-[74%] w-[74%] max-sm:left-[6%] max-sm:top-[13%] max-sm:h-[78%] max-sm:w-[88%] shadow-[0_18px_44px_rgba(14,24,10,0.36)]">
          <MailBody
            rows={[
              { from: 'Loop Audio', subject: 'Sponsorship — Q3 collaboration', time: 'Jul 28', unread: true },
              { from: 'Kettle Co.', subject: 'Re: Rate card and deliverables', time: 'Jul 26', unread: true },
              { from: 'Northbound', subject: 'Contract signed — invoice attached', time: 'Jul 24', unread: false },
              { from: 'Fieldnote', subject: 'Interested in a long-term deal?', time: 'Jul 22', unread: false },
              { from: 'Halcyon', subject: 'Following up on our last message', time: 'Jul 19', unread: false },
            ]}
          />
        </Win>
      </>
    ),
  },
  {
    id: 'admin',
    title: 'The Business Side',
    copy: 'Invoices arrive in your inbox and end up as clean rows in your spreadsheet — vendor, amount, date, number — with nothing typed by hand and nothing missed.',
    apps: [
      { icon: Mail, tint: '#d94235', bg: '#ffffff' },
      { icon: ReceiptText, tint: '#7041d6', bg: '#ffffff' },
      { icon: Table2, tint: '#16805a', bg: '#ffffff' },
    ],
    automation: 'Invoice Inbox to Google Sheets',
    flip: true,
    sky: 'linear-gradient(178deg,#d9cdf2 0%,#a58ddb 30%,#6a54ad 58%,#241c46 100%)',
    hills: ['#493a7d', '#1c1638'],
    scene: (
      <>
        <Win app="Gmail" tint="#d94235" className="max-sm:hidden right-[-8%] top-[7%] h-[68%] w-[46%] shadow-[0_10px_30px_rgba(16,10,38,0.34)]">
          <MailBody
            rows={[
              { from: 'Acme Supplies', subject: 'Invoice #1042 attached', time: '9:41', unread: true },
              { from: 'Northstar', subject: 'Invoice #1041', time: 'Jul 27', unread: false },
              { from: 'Bright Ltd', subject: 'Statement — July', time: 'Jul 25', unread: false },
            ]}
          />
        </Win>
        <Win app="Google Sheets" tint="#16805a" className="left-[5%] top-[15%] h-[74%] w-[74%] max-sm:left-[6%] max-sm:top-[13%] max-sm:h-[78%] max-sm:w-[88%] shadow-[0_18px_44px_rgba(16,10,38,0.38)]">
          <SheetBody
            title="Invoices — July"
            head={['Vendor', 'Invoice', 'Total']}
            rows={[
              ['Acme Supplies', '#1042', '$2,480'],
              ['Northstar', '#1041', '$860'],
              ['Bright Ltd', '#1039', '$1,315'],
              ['Kerrow', '#1036', '$420'],
            ]}
          />
        </Win>
      </>
    ),
  },
];

/* ------------------------------------------------------------------ card -- */

function AppPill({ apps }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white bg-[#f6f6f5] px-4 py-3 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_10px_26px_rgba(23,32,58,0.07)]">
      <span className="px-1 text-[13px] font-black leading-none tracking-[0.1em] text-[#c8cad0]">···</span>
      {apps.map(({ icon: Icon, tint, bg }, index) => {
        const lead = index === 1;
        return (
          <span
            key={index}
            className={`flex items-center justify-center rounded-full ${lead ? 'h-14 w-14 shadow-[0_10px_22px_rgba(23,32,58,0.16)]' : 'h-11 w-11 shadow-[0_6px_16px_rgba(23,32,58,0.1)]'}`}
            style={{ background: bg }}
          >
            <Icon className={lead ? 'h-6 w-6' : 'h-5 w-5'} style={{ color: tint }} strokeWidth={2.1} />
          </span>
        );
      })}
      <span className="px-1 text-[13px] font-black leading-none tracking-[0.1em] text-[#c8cad0]">···</span>
    </div>
  );
}

function Screen({ card }) {
  return (
    <div className="relative mx-auto w-full pb-8">
      <div
        className="relative aspect-[16/10.5] w-full overflow-hidden rounded-[24px] shadow-[0_26px_70px_rgba(23,32,58,0.2)]"
        style={{ background: card.sky }}
      >
        {/* Two very wide, very flat arcs read as a distant horizon. Anything
            narrower turns into a dome sitting in the middle of the picture. */}
        <span
          className="absolute inset-x-[-70%] bottom-[-26%] h-[46%] rounded-[50%] blur-[7px]"
          style={{ background: card.hills[0], opacity: 0.92 }}
          aria-hidden="true"
        />
        <span
          className="absolute inset-x-[-85%] bottom-[-34%] h-[40%] rounded-[50%] blur-[3px]"
          style={{ background: card.hills[1] }}
          aria-hidden="true"
        />
        {card.scene}
      </div>

      {/* ModelGrow sits at the desk — deliberately the logo and not a stock face,
          because nobody is actually doing this work. */}
      <span className="absolute bottom-[10px] left-1/2 flex h-[52px] w-[52px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-white bg-white shadow-[0_10px_24px_rgba(23,32,58,0.18)]">
        <Image src="/logo.png" alt="" width={30} height={30} />
      </span>
    </div>
  );
}

function RoleCard({ card }) {
  const copySide = (
    <div className={card.flip ? 'lg:order-2 lg:pl-6' : 'lg:pr-6'}>
      <AppPill apps={card.apps} />
      <h3 className="marketing-display mt-9 max-w-[420px] text-[clamp(2.1rem,3.5vw,3.2rem)] font-black leading-[1.02] tracking-[-0.045em] text-[#151b2d]">
        {card.title}
      </h3>
      <p className="mt-5 max-w-[470px] text-[17px] font-medium leading-[1.65] text-[#656e83]">
        {card.copy}
      </p>
      <Link
        href={`/explore?search=${encodeURIComponent(card.automation)}`}
        className="mt-9 inline-flex items-center gap-2.5 rounded-full bg-[#171c30] px-7 py-4 text-sm font-black text-white marketing-white-copy transition-transform duration-300 hover:-translate-y-0.5"
      >
        Use it
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );

  return (
    <article className="grid items-center gap-9 rounded-[32px] bg-white px-5 py-10 sm:gap-12 sm:rounded-[40px] sm:px-12 sm:py-14 lg:grid-cols-2 lg:gap-14 lg:px-16 lg:py-20">
      {/* Copy always leads in the DOM so a phone reads title-then-picture four
          times in a row. The alternation is a desktop effect only; stacked, it
          just makes every other card start with an unexplained screenshot. */}
      {copySide}
      <div className={card.flip ? 'lg:order-1' : undefined}>
        <Screen card={card} />
      </div>
    </article>
  );
}

export default function RoleShowcase() {
  return (
    <section data-ground="light" id="who-its-for" className="marketing-anchor border-b border-[#17203a]/7 bg-[#e8e6e1] py-20 sm:py-28">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="marketing-kicker">Who ModelGrow is for</p>
          <h2 className="marketing-display mt-4 text-[clamp(2.6rem,5vw,4.8rem)] font-black leading-[0.94] tracking-[-0.05em] text-[#151b2d]">
            Find yourself here.
          </h2>
          <p className="mx-auto mt-5 max-w-[520px] text-base font-medium leading-7 text-[#656e83]">
            Every one of these is already running for someone.
          </p>
        </div>

        <div className="mt-14 space-y-6 sm:mt-16">
          {CARDS.map((card) => (
            <RoleCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
