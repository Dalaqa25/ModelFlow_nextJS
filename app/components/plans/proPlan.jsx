"use client";

import { FaStar } from 'react-icons/fa';
import { useEffect, useState, useRef } from 'react';
import LoadingDialog from './LoadingDialog';

// Replace this with your actual store ID or use NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID
const STORE_ID = process.env.LEMONSQUEEZY_STORE_ID ? parseInt(process.env.LEMONSQUEEZY_STORE_ID, 10) : 194698;

export default function ProPlan({ user }) {
  const isCurrentPlan = user?.subscription?.plan === 'professional';
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleCancel = () => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleUpgrade = async () => {
    setIsLoading(true);
    abortControllerRef.current = new AbortController();
    
    // Set a timeout to automatically hide loading after 30 seconds
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      alert('Checkout setup is taking longer than expected. Please try again.');
    }, 30000);

    try {
      const res = await fetch('/api/lemon/checkout-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'professional', email: user.email }),
        signal: abortControllerRef.current.signal,
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setIsLoading(false);
        alert(data.error || 'Failed to start checkout');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }
      setIsLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      alert('An error occurred while setting up checkout');
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <>
      <LoadingDialog isOpen={isLoading} planName="Professional" onCancel={handleCancel} />
      <div className="relative bg-white/60 backdrop-blur-md border-2 border-purple-400/40 rounded-2xl shadow-md p-10 flex flex-col items-center w-full max-w-sm transition-transform transition-shadow duration-300 ease-out transform hover:scale-110 hover:shadow-2xl opacity-0 animate-fade-in">
        <span className="absolute -top-4 right-4 bg-purple-600 text-white text-sm font-bold px-4 py-1 rounded-full shadow-md">Recommended</span>
        <h2 className="text-3xl font-bold mb-4 text-purple-700">Professional</h2>
        <p className="text-5xl font-extrabold mb-6">$14.50<span className="text-2xl font-medium">/mo</span></p>
        <ul className="text-gray-700 text-lg w-full mb-8">
          <li className="flex items-center gap-3 mb-2"><FaStar className="text-yellow-400 text-xl" /> <span className="font-bold text-purple-700">1 GB</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Active Storage</span></li>
          <li className="flex items-center gap-3 mb-2"><FaStar className="text-yellow-400 text-xl" /> <span className="font-bold text-purple-700">500 MB</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Archive Storage</span></li>
          <li className="flex items-center gap-3 mb-2"><FaStar className="text-yellow-400 text-xl" /> <span className="font-bold text-purple-700">12</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Models (Active + Archived)</span></li>
          <li className="flex items-center gap-3 mb-2"><FaStar className="text-yellow-400 text-xl" /> <span className="font-bold text-purple-700">100 MB</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Max File Size</span></li>
          <li className="flex items-center gap-3 mb-2"><FaStar className="text-yellow-400 text-xl" /> <span className="font-bold text-purple-700">50</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Buyers Per Model</span></li>
          <li className="flex items-center gap-3 mb-2"><FaStar className="text-yellow-400 text-xl" /> <span className="font-bold text-purple-700">1000</span> <span className="bg-purple-100 text-xs px-2 py-0.5 rounded-full ml-1">Downloads/Month</span></li>
        </ul>
        <button
          className={`px-8 py-3 rounded-lg text-lg font-semibold transition-transform transition-colors duration-200 hover:scale-105 ${
            isCurrentPlan 
              ? 'bg-purple-200 text-purple-700 cursor-default hover:bg-purple-300' 
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
          onClick={isCurrentPlan ? undefined : handleUpgrade}
          disabled={isCurrentPlan || isLoading}
        >
          {isCurrentPlan ? 'Current Plan' : isLoading ? 'Loading...' : 'Upgrade'}
        </button>
      </div>
    </>
  );
}
