"use client";
import { useState, useEffect } from "react";
import UnifiedCard from '@/app/components/shared/UnifiedCard';

export default function EarningHistory({ earnings = [] }) {
  const [earningsWithCountdown, setEarningsWithCountdown] = useState([]);

  useEffect(() => {
    // Initialize earnings with countdown values
    const initialEarnings = earnings.map(earning => ({
      ...earning,
      timeLeft: calculateTimeLeft(earning.release_at)
    }));
    setEarningsWithCountdown(initialEarnings);

    // Set up interval to update countdowns
    const interval = setInterval(() => {
      setEarningsWithCountdown(prev =>
        prev.map(earning => ({
          ...earning,
          timeLeft: calculateTimeLeft(earning.release_at)
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
      <UnifiedCard variant="content" padding="lg">
        <h3 className="text-xl font-semibold text-white mb-6">Earning History</h3>
        <div className="text-center py-8 text-gray-400">
          No earnings history yet.
        </div>
      </UnifiedCard>
    );
  }

  return (
    <UnifiedCard variant="content" padding="lg">
      <h3 className="text-xl font-semibold text-white mb-6">Earning History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full rounded-lg overflow-hidden">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Model</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Buyer</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Amount</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Earned At</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Release Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {earningsWithCountdown.map((earning, index) => (
              <tr key={index} className="hover:bg-gray-800/30 transition-colors duration-200">
                <td className="py-3 px-4 text-sm text-white font-medium">{earning.model_name || 'N/A'}</td>
                <td className="py-3 px-4 text-sm text-gray-300">{earning.buyer_email}</td>
                <td className="py-3 px-4 text-sm font-medium text-green-400">{formatCurrency(earning.amount)}</td>
                <td className="py-3 px-4 text-sm text-gray-400">{formatDate(earning.earned_at)}</td>
                <td className="py-3 px-4 text-sm">
                  {earning.timeLeft?.released ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      Released
                    </span>
                  ) : earning.timeLeft ? (
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        {earning.timeLeft.minutes}m {earning.timeLeft.seconds}s
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                      Processing
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </UnifiedCard>
  );
}