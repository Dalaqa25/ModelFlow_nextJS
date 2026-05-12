"use client";
import { useState, useEffect } from 'react';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import Link from 'next/link';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { Leaf, Rocket, Star, Flame, Crown, Check, Sparkles } from 'lucide-react';
import { initializePaddle, openPaddleCheckout } from '@/lib/paddle';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import SignInDialog from '@/app/components/auth/login/SignInDialog';
import SignUpDialog from '@/app/components/auth/signup/SignUpDialog';

export default function Pricing() {
    const { isMobile, isExpanded } = useSidebar();
    const sidebarOffset = !isMobile ? (isExpanded ? 256 : 52) : 0;
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    
    const [loading, setLoading] = useState(null);
    const [isSignInOpen, setIsSignInOpen] = useState(false);
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);

    const switchToSignUp = () => { setIsSignInOpen(false); setIsSignUpOpen(true); };
    const switchToSignIn = () => { setIsSignUpOpen(false); setIsSignInOpen(true); };

    // Initialize Paddle on component mount
    useEffect(() => {
        initializePaddle().catch(console.error);
    }, []);

    const handleBuyTokens = async (packageName, tokens, price, priceId) => {
        // Don't do anything if auth is still loading
        if (authLoading) {
            console.log('[Buy Tokens] Auth still loading, waiting...');
            return;
        }

        console.log('[Buy Tokens] Starting purchase flow');
        console.log('[Buy Tokens] Package:', packageName);
        console.log('[Buy Tokens] Tokens:', tokens);
        console.log('[Buy Tokens] Price:', price);
        console.log('[Buy Tokens] Price ID:', priceId);
        console.log('[Buy Tokens] User:', user);
        console.log('[Buy Tokens] Is Authenticated:', isAuthenticated);

        setLoading(packageName);

        try {
            // Check if user is logged in
            if (!isAuthenticated || !user) {
                console.log('[Buy Tokens] User not authenticated, opening sign-in modal');
                setLoading(null);
                setIsSignInOpen(true); // Open custom sign-in modal
                return;
            }

            console.log('[Buy Tokens] User email:', user.email);
            console.log('[Buy Tokens] User ID:', user.id);

            // Check if Paddle is configured
            if (!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) {
                console.error('[Buy Tokens] Paddle client token not configured!');
                alert('Payment system is not configured. Please add Paddle credentials.');
                setLoading(null);
                return;
            }

            console.log('[Buy Tokens] Opening Paddle checkout...');

            // Open Paddle checkout
            await openPaddleCheckout({
                priceId: priceId,
                customerEmail: user.email, // Add customer email
                customData: {
                    user_id: user.id,
                    package_name: packageName,
                    token_amount: tokens
                },
                onSuccess: (data) => {
                    console.log('Payment successful!', data);
                    alert(`Success! ${tokens} tokens will be added to your account shortly.`);
                    setLoading(null);
                    // Optionally refresh the page or update token balance
                    window.location.reload();
                },
                onError: (error) => {
                    console.error('Payment error:', error);
                    const errorMessage = error?.detail || error?.message || 'Payment failed. Please try again.';
                    alert(`Checkout Error: ${errorMessage}`);
                    setLoading(null);
                }
            });

        } catch (error) {
            console.error('Error opening checkout:', error);
            alert('Failed to open checkout. Please try again.');
            setLoading(null);
        }
    };

    const tokenPackages = [
        {
            name: "Starter",
            tokens: 50,
            baseTokens: 50,
            bonus: 0,
            price: 5,
            priceId: "pri_01krcch5mcqcbpy404s6bajcyy",
            popular: false,
            description: "Perfect for trying out automations",
            color: "from-blue-500 to-cyan-400",
            iconColor: "text-blue-500 dark:text-blue-400",
            bgLight: "bg-blue-50",
            bgDark: "dark:bg-blue-500/10",
            icon: Leaf
        },
        {
            name: "Popular",
            tokens: 210,
            baseTokens: 200,
            bonus: 10,
            bonusPercent: 5,
            price: 20,
            priceId: "pri_01krccvba5hhg78n2z57m3e4ey",
            popular: true,
            description: "Most popular choice for regular users",
            color: "from-purple-600 to-pink-500",
            iconColor: "text-purple-600 dark:text-purple-400",
            bgLight: "bg-purple-50",
            bgDark: "dark:bg-purple-500/10",
            icon: Star
        },
        {
            name: "Pro",
            tokens: 550,
            baseTokens: 500,
            bonus: 50,
            bonusPercent: 10,
            price: 50,
            priceId: "pri_01krcdazb6cx6bba8pdzqpvc0y",
            popular: false,
            description: "Best for frequent automation users",
            color: "from-orange-500 to-amber-400",
            iconColor: "text-orange-500 dark:text-orange-400",
            bgLight: "bg-orange-50",
            bgDark: "dark:bg-orange-500/10",
            icon: Flame
        }
    ];

    return (
        <AdaptiveBackground variant="content" className="pt-20">
            <div className="min-h-screen pb-24" style={{ paddingLeft: sidebarOffset, transition: 'padding-left 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <div className="w-[92%] sm:w-[85%] max-w-[1400px] mx-auto pt-10">
                    
                    {/* Hero Section */}
                    <div className="relative flex flex-col items-center text-center gap-6 mb-20 animate-fade-in-up">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-purple-200 dark:border-purple-500/20 shadow-sm mb-2 hover:border-purple-300 dark:hover:border-purple-500/40 transition-colors">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Simple, Transparent Pricing</span>
                        </div>
                        
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2 z-10">
                            Power your <br className="hidden sm:block" />
                            <span className="relative inline-block mt-2">
                                <span className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-20 blur-xl rounded-full"></span>
                                <span className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient">Automations</span>
                            </span>
                        </h1>
                        
                        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl z-10 leading-relaxed">
                            Purchase tokens to run AI automations. <br/>
                            <span className="font-semibold text-purple-600 dark:text-purple-400">Get up to 10% bonus tokens</span> on larger packages.
                        </p>
                    </div>

                    {/* Token Packages */}
                    <div className="relative mb-32 z-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 xl:gap-6 items-stretch">
                            {tokenPackages.map((pack, index) => {
                                const Icon = pack.icon;
                                return (
                                <div 
                                    key={index} 
                                    className={`group relative flex flex-col rounded-3xl transition-all duration-300 animate-fade-in-up ${
                                        pack.popular 
                                            ? 'bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.15)] ring-2 ring-purple-500 z-20 lg:-translate-y-2' 
                                            : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:-translate-y-1 hover:shadow-xl hover:border-gray-300 dark:hover:border-slate-600 z-10'
                                    }`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    {/* Popular Badge */}
                                    {pack.popular && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 blur-md opacity-60 rounded-full"></div>
                                                <span className="relative bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider">
                                                    <Star className="w-3 h-3 fill-white" /> MOST POPULAR
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-6 xl:p-8 flex-grow flex flex-col relative overflow-hidden rounded-3xl pt-10">
                                        
                                        {/* Header */}
                                        <div className="flex flex-col items-center text-center mb-6 relative z-10">
                                            <div className={`w-14 h-14 mb-4 rounded-2xl flex items-center justify-center ${pack.bgLight} ${pack.bgDark} ${pack.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                                                <Icon className="w-7 h-7" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{pack.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 h-10 px-2">{pack.description}</p>
                                        </div>
                                        
                                        {/* Tokens Display */}
                                        <div className="text-center mb-6 relative z-10 flex-grow flex flex-col justify-center">
                                            <div className="flex items-baseline justify-center gap-1">
                                                <span className={`text-4xl xl:text-5xl font-black bg-gradient-to-br ${pack.color} bg-clip-text text-transparent tracking-tight`}>
                                                    {pack.tokens}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold tracking-widest text-gray-400 dark:text-gray-500 uppercase mt-1">Tokens</p>
                                            
                                            {/* Bonus Display */}
                                            <div className="mt-4 h-8 flex items-center justify-center">
                                                {pack.bonus > 0 ? (
                                                    <div className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold border border-green-200 dark:border-green-500/20">
                                                        <Sparkles className="w-3 h-3" />
                                                        <span>+{pack.bonusPercent}% Bonus ({pack.bonus})</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 dark:text-gray-600 font-medium">Standard</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Price & CTA */}
                                        <div className="text-center mt-auto relative z-10 pt-6 border-t border-gray-100 dark:border-slate-700/50">
                                            <div className="mb-5">
                                                <div className="flex items-start justify-center">
                                                    <span className="text-gray-500 dark:text-gray-400 text-lg font-medium mt-1 mr-1">$</span>
                                                    <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{pack.price}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                                    ${(pack.price / pack.tokens).toFixed(3)} / token
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => handleBuyTokens(pack.name, pack.tokens, pack.price, pack.priceId)}
                                                disabled={loading === pack.name}
                                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 relative group/btn shadow-sm flex items-center justify-center gap-2 ${
                                                    pack.popular 
                                                        ? `bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600 hover:shadow-lg` 
                                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600'
                                                } ${loading === pack.name ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {loading === pack.name ? (
                                                    <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : 'Buy Tokens'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="mb-24 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Everything you need</h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-3">Simple pricing, no hidden fees, and full access to the platform.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {[
                                "Access all automations instantly",
                                "Tokens never expire",
                                "No monthly subscriptions",
                                "Secure payments via Paddle",
                                "24/7 Platform availability",
                                "Dedicated community support"
                            ].map((feature, index) => (
                                <div key={index} className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="text-gray-800 dark:text-gray-200 font-medium text-sm">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Developer CTA */}
                    <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl bg-gray-900 p-10 sm:p-12 border border-gray-800 shadow-2xl group mb-24 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                            <div className="max-w-xl">
                                <h4 className="text-3xl font-bold text-white mb-3 tracking-tight">Are you a developer?</h4>
                                <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                                    Build automations and earn real money when others use them. Take home an industry-leading <span className="text-purple-400 font-semibold">80% revenue share</span>.
                                </p>
                                <Link 
                                    href="/dashboard" 
                                    className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 px-6 py-3 rounded-xl font-bold transition-colors group/link"
                                >
                                    Start Building 
                                    <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="max-w-3xl mx-auto mb-20 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
                        <div className="grid gap-4">
                            {[
                                { q: "Do tokens expire?", a: "No, your tokens are yours forever. They sit safely in your wallet until you decide to use them." },
                                { q: "How much does an automation cost?", a: "Costs are set by developers, typically ranging from 1-10 tokens ($0.10 - $1.00) depending on complexity." },
                                { q: "What are bonus tokens?", a: "To reward bulk purchases, we add extra free tokens to larger packages. For example, buying the $100 package gives you 20% more tokens for free!" }
                            ].map((faq, i) => (
                                <div key={i} className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-gray-100 dark:border-slate-700/50 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="text-center pb-8 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            By purchasing, you agree to our{' '}
                            <Link href="/terms" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">Privacy Policy</Link>.
                        </p>
                    </div>

                </div>
            </div>

            {/* Sign In / Sign Up Modals */}
            <SignInDialog 
                isOpen={isSignInOpen} 
                onClose={() => setIsSignInOpen(false)} 
                onSwitchToSignUp={switchToSignUp} 
            />
            <SignUpDialog 
                isOpen={isSignUpOpen} 
                onClose={() => setIsSignUpOpen(false)} 
                onSwitchToSignIn={switchToSignIn} 
            />
        </AdaptiveBackground>
    );
}
