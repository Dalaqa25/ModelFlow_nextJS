'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function MarketingFooter() {
  return (
    <footer className="marketing-world-footer border-t border-white/10 bg-[#17215a] text-white">
      <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="" width={34} height={34} />
              <span className="text-lg font-black tracking-[-0.035em] text-white marketing-white-copy">ModelGrow</span>
            </Link>
            <p className="mt-5 max-w-[280px] text-sm font-medium leading-6 text-white/55">Give the repetitive work to software. Keep the decisions, time, and control.</p>
            <a href="mailto:hello@modelgrow.com" className="mt-6 inline-flex rounded-full border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-white/[0.12]">hello@modelgrow.com</a>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#bba7ff]">Product</p>
            <div className="mt-5 grid gap-3 text-sm font-bold text-white/65">
              <Link href="/#what-is-modelgrow" className="hover:text-white">What is ModelGrow?</Link>
              <Link href="/#why-modelgrow" className="hover:text-white">Why ModelGrow?</Link>
              <Link href="/#how-it-works" className="hover:text-white">How it works</Link>
              <Link href="/explore" className="hover:text-white">Automations</Link>
              <Link href="/pricing" className="hover:text-white">Pricing</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#bba7ff]">Explore</p>
            <div className="mt-5 grid gap-3 text-sm font-bold text-white/65">
              <Link href="/#use-cases" className="hover:text-white">Use cases</Link>
              <Link href="/#what-is-modelgrow" className="hover:text-white">See it in action</Link>
              <Link href="/developers" className="hover:text-white">For developers</Link>
              <Link href="/community" className="hover:text-white">Community</Link>
              <Link href="/google-permissions" className="hover:text-white">App permissions</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#bba7ff]">Help & legal</p>
            <div className="mt-5 grid gap-3 text-sm font-bold text-white/65">
              <a href="mailto:hello@modelgrow.com" className="hover:text-white">Contact us</a>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/refund" className="hover:text-white">Refund policy</Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 pt-7 text-xs font-semibold text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} ModelGrow. Ready-made automations for everyday work.</p>
          <p>You stay in control. Pause or remove anything whenever you want.</p>
        </div>
      </div>
    </footer>
  );
}
