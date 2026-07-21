'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Flame, Leaf, ShieldCheck, Sparkles, Star, Zap } from 'lucide-react';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { initializePaddle, openPaddleCheckout } from '@/lib/paddle';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import SignInDialog from '@/app/components/auth/login/SignInDialog';
import SignUpDialog from '@/app/components/auth/signup/SignUpDialog';
import MarketingFooter from '@/app/components/marketing/MarketingFooter';

const tokenPackages = [
  {
    name: 'Starter',
    tokens: 50,
    bonus: 0,
    price: 5,
    priceId: 'pri_01krcch5mcqcbpy404s6bajcyy',
    description: 'A simple way to try a few automations.',
    icon: Leaf,
    accent: '#3776ca',
    tint: '#eaf3ff',
  },
  {
    name: 'Popular',
    tokens: 210,
    bonus: 10,
    bonusPercent: 5,
    price: 20,
    priceId: 'pri_01krccvba5hhg78n2z57m3e4ey',
    description: 'For the work you want running every week.',
    icon: Star,
    accent: '#7041d6',
    tint: '#eee8ff',
    popular: true,
  },
  {
    name: 'Pro',
    tokens: 550,
    bonus: 50,
    bonusPercent: 10,
    price: 50,
    priceId: 'pri_01krcdazb6cx6bba8pdzqpvc0y',
    description: 'For frequent, higher-volume automation use.',
    icon: Flame,
    accent: '#b86b17',
    tint: '#fff0dc',
  },
];

const included = [
  'Use any automation in the marketplace',
  'See the token cost before setup',
  'Tokens stay in your account until used',
  'No monthly subscription required',
  'Pause or remove your automations anytime',
  'Secure checkout powered by Paddle',
];

const faqs = [
  {
    question: 'What is a token?',
    answer: 'A token is ModelGrow credit used when an automation runs. Every automation shows its token cost before you set it up.',
  },
  {
    question: 'Do my tokens expire?',
    answer: 'No. Purchased tokens remain in your account until you use them.',
  },
  {
    question: 'Do I need a monthly plan?',
    answer: 'No. Buy a token pack when you need one and use it across the automations you choose.',
  },
];

export default function PricingPage() {
  const { isMobile, isExpanded } = useSidebar();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const sidebarOffset = isAuthenticated && !isMobile ? (isExpanded ? 256 : 52) : 0;
  const [loading, setLoading] = useState(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
      initializePaddle().catch(console.error);
    }
  }, []);

  const switchToSignUp = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(true);
  };

  const switchToSignIn = () => {
    setIsSignUpOpen(false);
    setIsSignInOpen(true);
  };

  const handleBuyTokens = async (pack) => {
    if (authLoading) return;
    setLoading(pack.name);

    try {
      if (!isAuthenticated || !user) {
        setLoading(null);
        setIsSignInOpen(true);
        return;
      }

      if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
        alert('Payment system is not configured. Please add Paddle credentials.');
        setLoading(null);
        return;
      }

      await openPaddleCheckout({
        priceId: pack.priceId,
        customerEmail: user.email,
        customData: {
          user_id: user.id,
          package_name: pack.name,
          token_amount: pack.tokens,
        },
        onSuccess: () => {
          alert(`Success! ${pack.tokens} tokens will be added to your account shortly.`);
          setLoading(null);
          window.location.reload();
        },
        onError: (error) => {
          const message = error?.detail || error?.message || 'Payment failed. Please try again.';
          alert(`Checkout Error: ${message}`);
          setLoading(null);
        },
      });
    } catch (error) {
      console.error('Error opening checkout:', error);
      alert('Failed to open checkout. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div
      className="marketing-page overflow-hidden transition-[padding] duration-300"
      style={{ paddingLeft: sidebarOffset }}
    >
      <main className={isAuthenticated ? 'pt-16' : 'pt-[76px]'}>
        <section className="pricing-hero relative overflow-hidden px-5 pb-24 pt-20 sm:px-8 sm:pb-28 sm:pt-24">
          <div className="absolute inset-0 marketing-hero-grid" />
          <div className="relative mx-auto max-w-[1240px] text-center">
            <p className="marketing-kicker flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" /> Simple pay-as-you-go pricing
            </p>
            <h1 className="marketing-display mx-auto mt-5 max-w-[980px] text-[clamp(3.8rem,7vw,7.2rem)] font-black leading-[0.88] tracking-[-0.06em] text-[#12182b]">
              Pay for the work<br />that gets done.
            </h1>
            <p className="mx-auto mt-7 max-w-[690px] text-lg font-medium leading-8 text-[#646d82] sm:text-xl sm:leading-9">
              No complicated plans. Choose an automation, see its cost before setup, and use tokens only when it runs.
            </p>
            <div className="mx-auto mt-9 flex max-w-fit flex-wrap justify-center gap-x-6 gap-y-3 rounded-full border border-[#17203a]/9 bg-white/70 px-6 py-3 text-sm font-bold text-[#596176] shadow-[0_14px_40px_rgba(34,30,71,0.06)] backdrop-blur-sm">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#13845a]" /> No subscription</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#13845a]" /> Tokens do not expire</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#13845a]" /> Cost shown first</span>
            </div>
          </div>
        </section>

        <section className="relative px-5 pb-24 sm:px-8 sm:pb-32">
          <div className="mx-auto grid max-w-[1120px] gap-5 md:grid-cols-3">
            {tokenPackages.map((pack) => {
              const Icon = pack.icon;
              return (
                <article
                  key={pack.name}
                  className={`pricing-card relative flex min-h-[480px] flex-col rounded-[30px] border bg-white p-7 transition-all duration-300 hover:-translate-y-1 sm:p-8 ${pack.popular ? 'border-[#7041d6] shadow-[0_30px_75px_rgba(80,50,157,0.16)]' : 'border-[#17203a]/9 shadow-[0_18px_55px_rgba(23,32,58,0.07)]'}`}
                >
                  {pack.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#7041d6] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                      Most popular
                    </span>
                  )}
                  <div className="flex items-start justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: pack.tint, color: pack.accent }}>
                      <Icon className="h-6 w-6" />
                    </span>
                    {pack.bonus > 0 && (
                      <span className="rounded-full bg-[#e5f8ef] px-3 py-1.5 text-[11px] font-black text-[#13845a]">+{pack.bonusPercent}% bonus</span>
                    )}
                  </div>
                  <h2 className="mt-7 text-2xl font-black tracking-[-0.04em] text-[#151b2d]">{pack.name}</h2>
                  <p className="mt-2 min-h-12 text-sm font-medium leading-6 text-[#6a7286]">{pack.description}</p>
                  <div className="mt-9">
                    <div className="flex items-end gap-2">
                      <strong className="marketing-display text-[4.6rem] font-black leading-none tracking-[-0.06em]" style={{ color: pack.accent }}>{pack.tokens}</strong>
                      <span className="pb-2 text-xs font-black uppercase tracking-[0.13em] text-[#9aa0af]">tokens</span>
                    </div>
                    {pack.bonus > 0 && <p className="mt-2 text-xs font-bold text-[#13845a]">Includes {pack.bonus} bonus tokens</p>}
                  </div>
                  <div className="mt-auto border-t border-[#17203a]/8 pt-7">
                    <div className="flex items-end justify-between">
                      <p><span className="text-sm font-bold text-[#8a91a1]">$</span><span className="text-4xl font-black tracking-[-0.04em] text-[#151b2d]">{pack.price}</span></p>
                      <span className="pb-1 text-xs font-bold text-[#8a91a1]">one-time</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBuyTokens(pack)}
                      disabled={loading === pack.name}
                      className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-black transition-all hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 ${pack.popular ? 'marketing-primary-button bg-[#7041d6] text-white shadow-[0_12px_30px_rgba(112,65,214,0.25)]' : 'bg-[#151a2d] text-white'}`}
                    >
                      {loading === pack.name ? 'Opening checkout…' : `Choose ${pack.name}`}
                      {loading !== pack.name && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-[#f0ecfb] px-5 py-24 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-[1160px] gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="marketing-kicker">Everything included</p>
              <h2 className="marketing-display mt-4 text-[clamp(2.8rem,5vw,4.8rem)] font-black leading-[0.95] tracking-[-0.05em] text-[#12182b]">Simple enough to understand before you buy.</h2>
              <p className="mt-5 max-w-[520px] text-lg font-medium leading-8 text-[#656e83]">ModelGrow tells you what an automation needs, what it costs, and whether it is running—without hiding the important part behind a plan.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {included.map((item) => (
                <div key={item} className="flex min-h-[104px] items-center gap-4 rounded-[22px] border border-[#2b245e]/9 bg-white/85 p-5 shadow-[0_12px_32px_rgba(42,31,91,0.05)]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e5f8ef] text-[#13845a]"><Check className="h-5 w-5" /></span>
                  <p className="text-sm font-bold leading-6 text-[#4f586c]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto grid max-w-[1160px] gap-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="rounded-[30px] bg-[#151a2d] p-8 text-white sm:p-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#8ff1cf]"><Zap className="h-6 w-6" /></span>
              <h2 className="marketing-display mt-7 text-4xl font-black tracking-[-0.04em] text-white marketing-white-copy">Start with the outcome, not a plan.</h2>
              <p className="mt-4 text-base font-medium leading-7 text-white/65">Browse first. Every automation explains what it does and what it costs before you connect anything.</p>
              <Link href="/explore" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#151a2d]">
                Browse automations <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4">
              {faqs.map((faq) => (
                <article key={faq.question} className="rounded-[24px] border border-[#17203a]/9 bg-white p-6 sm:p-7">
                  <h3 className="text-lg font-black tracking-[-0.025em] text-[#151b2d]">{faq.question}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#697287]">{faq.answer}</p>
                </article>
              ))}
              <div className="flex items-center gap-3 px-2 pt-2 text-sm font-bold text-[#697287]">
                <ShieldCheck className="h-5 w-5 text-[#7041d6]" /> Payments are securely processed by Paddle.
              </div>
            </div>
          </div>
        </section>

        {!isAuthenticated && <MarketingFooter />}
      </main>

      <SignInDialog isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} onSwitchToSignUp={switchToSignUp} />
      <SignUpDialog isOpen={isSignUpOpen} onClose={() => setIsSignUpOpen(false)} onSwitchToSignIn={switchToSignIn} />
    </div>
  );
}
