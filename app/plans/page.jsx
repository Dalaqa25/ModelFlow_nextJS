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

    if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <>
            <div className="min-h-screen flex flex-col justify-center items-center px-2 sm:px-4 bg-gradient-to-br from-white via-purple-50 to-purple-100">
                <div className="flex flex-col gap-8 w-full max-w-xs sm:max-w-2xl md:max-w-5xl md:flex-row md:gap-6 justify-center items-center flex-1">
                    <BasicPlan user={user} />
                    <ProPlan user={user} />
                    <EnterprisePlan user={user} />
                </div>
            </div>
        </>
    );
}