'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com'];

export default function AdminWithdrawalsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push('/');
        return;
      }
      fetchWithdrawals();
    }
  }, [authLoading, isAuthenticated, isAdmin]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/withdrawals/pending');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    } catch (e) {
      setError('Failed to load withdrawal requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve');
      setWithdrawals(prev => prev.filter(w => w.withdrawal_id !== id));
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject');
      setWithdrawals(prev => prev.filter(w => w.withdrawal_id !== id));
      setRejectingId(null);
      setRejectReason('');
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-400"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Withdrawal Requests</h1>
            <p className="text-gray-400 mt-1">Review and process pending withdrawal requests</p>
          </div>
          <button
            onClick={fetchWithdrawals}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {withdrawals.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500/40" />
            <p className="text-lg font-medium">No pending withdrawals</p>
            <p className="text-sm mt-1">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((w) => (
              <div
                key={w.withdrawal_id}
                className={`bg-slate-900 border rounded-xl overflow-hidden transition-all ${
                  w.verification.fraud_risk === 'high'
                    ? 'border-red-500/40'
                    : 'border-slate-700/60'
                }`}
              >
                {/* Main Row */}
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Risk indicator */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      w.verification.fraud_risk === 'high' ? 'bg-red-500' : 'bg-green-500'
                    }`} />

                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{w.user.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {w.user.name || 'No name'} · Requested {new Date(w.request.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-white">${w.request.amount.toFixed(2)}</p>
                    <p className="text-xs text-green-400">Payout: ${w.request.payout.toFixed(2)}</p>
                    {/* Payment method badge */}
                    {w.request.payment_info && (
                      <p className="text-xs text-purple-400 mt-0.5">
                        {w.request.payment_info.method === 'wisetag'
                          ? `Wise: ${w.request.payment_info.wisetag}`
                          : `Bank: ${w.request.payment_info.account_holder}`}
                      </p>
                    )}
                  </div>

                  {/* Risk badge */}
                  <div className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    w.verification.fraud_risk === 'high'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {w.verification.fraud_risk === 'high' ? (
                      <><AlertTriangle className="w-3 h-3" /> High Risk</>
                    ) : (
                      <><CheckCircle className="w-3 h-3" /> Low Risk</>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === w.withdrawal_id ? null : w.withdrawal_id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      {expandedId === w.withdrawal_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {rejectingId === w.withdrawal_id ? null : (
                      <>
                        <button
                          onClick={() => setRejectingId(w.withdrawal_id)}
                          disabled={actionLoading === w.withdrawal_id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(w.withdrawal_id)}
                          disabled={actionLoading === w.withdrawal_id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {actionLoading === w.withdrawal_id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Reject reason input */}
                {rejectingId === w.withdrawal_id && (
                  <div className="px-5 pb-4 border-t border-slate-700/60 pt-4">
                    <p className="text-sm text-gray-300 mb-2 font-medium">Rejection reason:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Suspicious activity, insufficient verification..."
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      />
                      <button
                        onClick={() => handleReject(w.withdrawal_id)}
                        disabled={actionLoading === w.withdrawal_id}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {actionLoading === w.withdrawal_id ? 'Rejecting...' : 'Confirm Reject'}
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded verification details */}
                {expandedId === w.withdrawal_id && (
                  <div className="border-t border-slate-700/60 p-5 space-y-5">

                    {/* Payment destination — most important for admin */}
                    {w.request.payment_info && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Send Payment To</p>
                        <div className={`p-4 rounded-lg border ${
                          w.request.payment_info.method === 'wisetag'
                            ? 'bg-purple-500/10 border-purple-500/20'
                            : 'bg-blue-500/10 border-blue-500/20'
                        }`}>
                          {w.request.payment_info.method === 'wisetag' ? (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Wise @tag</p>
                              <p className="text-lg font-bold text-purple-300">{w.request.payment_info.wisetag}</p>
                              <p className="text-xs text-gray-500 mt-1">Search this tag in Wise and send ${w.request.payout.toFixed(2)}</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-400 mb-2">Bank Transfer Details</p>
                              {[
                                ['Account Holder', w.request.payment_info.account_holder],
                                ['IBAN / Account', w.request.payment_info.iban_or_account],
                                ['Bank Name', w.request.payment_info.bank_name],
                                ['Country', w.request.payment_info.country],
                                w.request.payment_info.routing_number && ['Routing Number', w.request.payment_info.routing_number],
                              ].filter(Boolean).map(([label, value]) => value && (
                                <div key={label} className="flex justify-between text-sm">
                                  <span className="text-gray-400">{label}</span>
                                  <span className="text-white font-mono">{value}</span>
                                </div>
                              ))}
                              <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-slate-600">Enter these details in Wise to send ${w.request.payout.toFixed(2)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Verification numbers */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Verification</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { label: 'True Earnings', value: `$${w.verification.true_earnings.toFixed(2)}`, color: 'text-green-400' },
                          { label: 'True Withdrawn', value: `$${w.verification.true_withdrawn.toFixed(2)}`, color: 'text-blue-400' },
                          { label: 'True Available', value: `$${w.verification.true_available.toFixed(2)}`, color: 'text-purple-400' },
                          { label: 'Cached Earnings', value: `$${w.verification.cached_earnings.toFixed(2)}`, color: 'text-gray-300' },
                          { label: 'Requested', value: `$${w.request.amount.toFixed(2)}`, color: 'text-white' },
                          { label: 'Legitimate?', value: w.verification.is_legitimate ? 'Yes ✓' : 'No ✗', color: w.verification.is_legitimate ? 'text-green-400' : 'text-red-400' },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="bg-slate-800/60 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                            <p className={`text-sm font-bold ${color}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                      {w.verification.has_mismatch && (
                        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                          <p className="text-xs text-yellow-400">Cached balance doesn't match transaction history. Review carefully.</p>
                        </div>
                      )}
                    </div>

                    {/* Earning history */}
                    {w.earning_history.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Earning History</p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {w.earning_history.map((e, i) => (
                            <div key={i} className="flex items-center justify-between text-sm bg-slate-800/40 rounded-lg px-3 py-2">
                              <div>
                                <span className="text-white">{e.automation || 'Unknown automation'}</span>
                                <span className="text-gray-500 ml-2 text-xs">by {e.runner || 'unknown'}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-green-400 font-medium">+${e.amount.toFixed(2)}</span>
                                <span className="text-gray-500 text-xs ml-2">{new Date(e.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
