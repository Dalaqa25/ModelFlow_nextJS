"use client";
import { useState, useEffect } from "react";

export default function EarningHistory({ earnings = [] }) {
  const [earningsWithCountdown, setEarningsWithCountdown] = useState([]);

  useEffect(() => {
    // Initialize earnings with countdown values
    const initialEarnings = earnings.map(earning => ({
      ...earning,
      timeLeft: calculateTimeLeft(earning.releaseAt)
    }));
    setEarningsWithCountdown(initialEarnings);

    // Set up interval to update countdowns
    const interval = setInterval(() => {
      setEarningsWithCountdown(prev => 
        prev.map(earning => ({
          ...earning,
          timeLeft: calculateTimeLeft(earning.releaseAt)
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [earnings]);

  function calculateTimeLeft(releaseAt) {
    if (!releaseAt) return null;
    
    const releaseDate = new Date(releaseAt);
    const now = new Date();
    const difference = releaseDate - now;
    
    if (difference <= 0) {
      return { released: true };
    }
    
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    
    return {
      minutes,
      seconds,
      released: false
    };
  }

  function formatCurrency(amount) {
    return `$${(amount / 100).toFixed(2)}`;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  if (earnings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No earnings history yet.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Earning History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Model</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Buyer</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Amount</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Earned At</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Release Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {earningsWithCountdown.map((earning, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-800">{earning.modelName || 'N/A'}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{earning.buyerEmail}</td>
                <td className="py-3 px-4 text-sm font-medium text-gray-800">{formatCurrency(earning.amount)}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{formatDate(earning.earnedAt)}</td>
                <td className="py-3 px-4 text-sm">
                  {earning.timeLeft?.released ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Released
                    </span>
                  ) : earning.timeLeft ? (
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {earning.timeLeft.minutes}m {earning.timeLeft.seconds}s
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Processing
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}