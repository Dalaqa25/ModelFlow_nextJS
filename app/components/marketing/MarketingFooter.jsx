'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function MarketingFooter() {
  return (
    <footer className="marketing-world-footer border-t border-white/10 bg-[#17215a] text-white">
      <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={30} height={30} />
            <span className="text-base font-black tracking-[-0.035em] text-white marketing-white-copy">ModelGrow</span>
          </Link>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-white/65">
            <Link href="/#how-it-works" className="hover:text-white">How it works</Link>
            <Link href="/explore" className="hover:text-white">Automations</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/developers" className="hover:text-white">For developers</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs font-semibold text-white/45 sm:flex-row">
          <p>© {new Date().getFullYear()} ModelGrow. Automate the work, keep the control.</p>
          <p>Ready-made automations for everyday work.</p>
        </div>
      </div>
    </footer>
  );
}
