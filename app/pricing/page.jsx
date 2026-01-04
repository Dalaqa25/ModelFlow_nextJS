"use client";
import { useState } from 'react';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import Link from 'next/link';

export default function Pricing() {
    const [loading, setLoading] = useState(null);

    const handleBuyCredits = async (credits) => {
        setLoading(credits);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credits }),
            });
            
            const data = await res.json();
            
            if (data.error) {
                alert(data.error === 'Unauthorized' ? 'Please sign in to purchase credits' : data.error);
                return;
            }
            
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Failed to start checkout. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    const creditPacks = [
        {
            credits: 1000,
            price: 10,
            popular: false,
            description: "Perfect for trying out automations"
        },
        {
            credits: 3000,
            price: 25,
            popular: true,
            description: "Most popular choice for regular users"
        },
        {
            credits: 6000,
            price: 45,
            popular: false,
            description: "Best value for power users"
        }
    ];

    return (
        <AdaptiveBackground variant="content" className="pt-24">
            <div className="min-h-screen flex flex-col py-12 px-6">
                <div className="w-[90%] sm:w-[70%] max-w-[1200px] mx-auto">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center gap-5 mb-16">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white">Pricing</h1>
                        <p className="text-xl sm:text-2xl text-gray-300 font-light max-w-3xl">
                            Purchase credits to run automations. Simple, transparent pricing with no hidden fees.
                        </p>
                    </div>

                    {/* How It Works */}
                    <div className="mb-16">
                        <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-8 text-center">How It Works</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-slate-800/50 rounded-xl p-6 text-center">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl text-purple-400">1</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Buy Credits</h3>
                                <p className="text-gray-400">Purchase a credit pack that fits your needs</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-6 text-center">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl text-purple-400">2</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Browse Automations</h3>
                                <p className="text-gray-400">Explore automations created by developers</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-6 text-center">
                                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl text-purple-400">3</span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Run & Automate</h3>
                                <p className="text-gray-400">Use credits to run automations and save time</p>
                            </div>
                        </div>
                    </div>

                    {/* Credit Packs */}
                    <div className="mb-16">
                        <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-8 text-center">Credit Packs</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {creditPacks.map((pack, index) => (
                                <div 
                                    key={index} 
                                    className={`relative bg-slate-800/50 rounded-xl p-8 flex flex-col ${
                                        pack.popular ? 'ring-2 ring-purple-500' : ''
                                    }`}
                                >
                                    {pack.popular && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-center mb-6">
                                        <h3 className="text-4xl font-bold text-white mb-2">{pack.credits}</h3>
                                        <p className="text-gray-400">Credits</p>
                                    </div>
                                    <div className="text-center mb-6">
                                        <span className="text-5xl font-bold text-white">${pack.price}</span>
                                    </div>
                                    <p className="text-gray-400 text-center mb-6">{pack.description}</p>
                                    <div className="text-center text-sm text-gray-500 mb-6">
                                        ${(pack.price / pack.credits).toFixed(3)} per credit
                                    </div>
                                    <button 
                                        onClick={() => handleBuyCredits(pack.credits)}
                                        disabled={loading === pack.credits}
                                        className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                                            pack.popular 
                                                ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg' 
                                                : 'bg-slate-700 hover:bg-slate-600 text-white'
                                        } ${loading === pack.credits ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {loading === pack.credits ? 'Loading...' : 'Buy Credits'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Features */}
                    <div className="mb-16">
                        <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-8 text-center">What You Get</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            {[
                                "Access to all platform automations",
                                "Credits never expire",
                                "Run automations instantly",
                                "No subscription required",
                                "Secure payment processing",
                                "24/7 platform access"
                            ].map((feature, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-300">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* For Developers */}
                    <div className="bg-slate-800/50 rounded-xl p-8 mb-16">
                        <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4 text-center">For Developers</h2>
                        <p className="text-gray-300 text-center max-w-2xl mx-auto mb-6">
                            Join our team of automation builders. We work with talented developers who create automations for our platform.
                        </p>
                        <div className="flex justify-center">
                            <Link 
                                href="/auth" 
                                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white py-3 px-8 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                            >
                                Apply Now
                            </Link>
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="mb-16">
                        <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-8 text-center">Frequently Asked Questions</h2>
                        <div className="space-y-6 max-w-3xl mx-auto">
                            <div className="bg-slate-800/50 rounded-xl p-6">
                                <h3 className="text-xl font-semibold text-white mb-2">Do credits expire?</h3>
                                <p className="text-gray-400">No, your credits never expire. Use them whenever you need.</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-6">
                                <h3 className="text-xl font-semibold text-white mb-2">How many credits does an automation cost?</h3>
                                <p className="text-gray-400">Each automation has its own credit cost set by the developer. Costs are clearly displayed before you run any automation.</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-6">
                                <h3 className="text-xl font-semibold text-white mb-2">Can I get a refund?</h3>
                                <p className="text-gray-400">Please see our <Link href="/refund" className="text-purple-400 hover:underline">Refund Policy</Link> for details on refunds and cancellations.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="text-center text-gray-400 text-sm">
                        <p>
                            By purchasing credits, you agree to our{' '}
                            <Link href="/terms" className="text-purple-400 hover:underline">Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </AdaptiveBackground>
    );
}
