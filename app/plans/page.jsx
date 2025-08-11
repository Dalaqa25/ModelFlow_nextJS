"use client";
import { useEffect, useState } from "react";
import BasicPlan from "../components/plans/basicPlan";
import ProPlan from "../components/plans/proPlan";
import EnterprisePlan from "../components/plans/enterpricePlan";
import UnifiedBackground from '@/app/components/shared/UnifiedBackground';

export default function PlansPage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Replace with your actual user fetching logic or API endpoint
        fetch('/api/user')
            .then(res => res.json())
            .then(data => setUser(data));
    }, []);

    if (!user) {
        return (
            <UnifiedBackground variant="content" className="pt-16">
                <div className="min-h-screen flex flex-col justify-center items-center px-6">
                    <div className="w-full flex flex-col items-center justify-center">
                        <div className="mb-6">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                        </div>
                        <h1 className="text-xl font-bold text-white drop-shadow-lg tracking-wide animate-pulse">
                            Loading plans...
                        </h1>
                    </div>
                </div>
            </UnifiedBackground>
        );
    }

    return (
        <UnifiedBackground variant="content" className="pt-16">
            <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8">
                        <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                        Subscription Plans
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                        Choose Your
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Plan</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                        Select the perfect plan to unlock the full potential of our AI marketplace
                    </p>
                </div>
                
                <div className="flex flex-col gap-8 w-full max-w-xs sm:max-w-2xl md:max-w-5xl md:flex-row md:gap-6 justify-center items-center flex-1">
                    <BasicPlan user={user} />
                    <ProPlan user={user} />
                    <EnterprisePlan user={user} />
                </div>
            </div>
        </UnifiedBackground>
    );
}