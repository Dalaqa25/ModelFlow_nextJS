"use client";
import { useEffect, useState } from "react";
import BasicPlan from "../components/plans/basicPlan";
import ProPlan from "../components/plans/proPlan";
import EnterprisePlan from "../components/plans/enterpricePlan";

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
            <div className="min-h-screen flex flex-col justify-center items-center px-2 sm:px-4 bg-gradient-to-b from-white to-purple-50">
                <div className="w-full flex flex-col items-center justify-center">
                    <div className="mb-6">
                        <svg className="animate-spin h-12 w-12 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-extrabold text-gray-600 drop-shadow-lg tracking-wide animate-pulse">
                        Loading plans...
                    </h1>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen flex flex-col justify-center items-center px-2 sm:px-4 bg-gradient-to-b from-white to-purple-50">
                <div className="flex flex-col gap-8 w-full max-w-xs sm:max-w-2xl md:max-w-5xl md:flex-row md:gap-6 justify-center items-center flex-1">
                    <BasicPlan user={user} />
                    <ProPlan user={user} />
                    <EnterprisePlan user={user} />
                </div>
            </div>
        </>
    );
}