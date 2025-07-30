"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/supabase-auth-context";
import RequestBox from "@/app/components/requests/requestBox";
import Request from "@/app/components/requests/request";

export default function RequestsClient() {
    const [isClicked, setIsClicked] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();

    const handleNewRequestClick = () => {
        if (!user) {
            // Redirect to login if user is not authenticated
            router.push('/auth/login');
            return;
        }
        // If user is authenticated, show the request box
        setIsClicked(true);
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${isClicked ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsClicked(false)}
                style={{ transitionProperty: 'opacity' }}>
            </div>
            <div className="mt-20 sm:mt-27 w-[92%] sm:w-[85%] mx-auto">
                <div className="flex flex-col items-center justify-center">
                    <h1 className="text-3xl sm:text-5xl font-semibold text-center">Requests</h1>
                    <p className="text-sm sm:text-lg font-light text-gray-500 mt-2 sm:mt-3 px-4 text-center">
                        Suggest and discuss AI models to be created
                    </p>
                    <button
                        onClick={handleNewRequestClick}
                        disabled={loading}
                        className="btn-primary text-white py-2.5 sm:py-3 text-base sm:text-lg px-8 sm:px-10 rounded-xl mt-4 sm:mt-5 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Loading...' : 'New Request'}
                    </button>
                    {isClicked && user && <RequestBox/>}
                </div>
                <div className="flex flex-col items-center justify-center mt-12 sm:mt-20 gap-3 sm:gap-5 mb-15">
                    <Request />
                </div>
            </div>
        </>
    );
}