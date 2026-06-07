'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Send, Users, ArrowLeft, Workflow, Power } from 'lucide-react';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com', 'g.dalaqishvili01@gmail.com'];

export default function AdminWithdrawalsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [activeTab, setActiveTab] = useState('withdrawals');
  const [recipientCount, setRecipientCount] = useState(0);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [automationsLoading, setAutomationsLoading] = useState(false);
  const [automationFilter, setAutomationFilter] = useState('pending');
  const [automationActionLoading, setAutomationActionLoading] = useState(null);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'broadcast') {
      setActiveTab('broadcast');
    } else if (tabFromUrl === 'automations') {
      setActiveTab('automations');
    } else if (tabFromUrl === 'withdrawals') {
      setActiveTab('withdrawals');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push('/');
        return;
      }
      fetchWithdrawals();
      fetchRecipientCount();
      fetchAutomations();
    }
  }, [authLoading, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin && activeTab === 'automations') {
      fetchAutomations();
    }
  }, [automationFilter, activeTab, authLoading, isAuthenticated, isAdmin]);

  const fetchRecipientCount = async () => {
    setRecipientLoading(true);
    try {
      const res = await fetch('/api/admin/broadcast');
      if (!res.ok) throw new Error('Failed to fetch recipients');
      const data = await res.json();
      setRecipientCount(data.recipientCount || 0);
    } catch (e) {
      setRecipientCount(0);
    } finally {
      setRecipientLoading(false);
    }
  };

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

  const fetchAutomations = async () => {
    setAutomationsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/automations?status=${automationFilter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch automations');
      setAutomations(data.automations || []);
    } catch (e) {
      setError(e.message || 'Failed to load automations.');
    } finally {
      setAutomationsLoading(false);
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

  const handleBroadcastSend = async () => {
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
      alert('Please fill subject and message.');
      return;
    }

    if (recipientCount === 0) {
      alert('No recipients found.');
      return;
    }

    setBroadcastSending(true);
    setBroadcastResult(null);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: broadcastSubject,
          message: broadcastMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send broadcast');

      setBroadcastResult(data);
      if (data.success) {
        setBroadcastSubject('');
        setBroadcastMessage('');
      } else {
        alert('No emails were sent. Check the failure reason shown below.');
      }
    } catch (e) {
      alert(`Broadcast failed: ${e.message}`);
    } finally {
      setBroadcastSending(false);
    }
  };

  const handleAutomationAction = async (automationId, action) => {
    setAutomationActionLoading(`${action}:${automationId}`);
    try {
      const res = await fetch(`/api/admin/automations/${automationId}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action} automation`);
      await fetchAutomations();
    } catch (e) {
      alert(`Automation ${action} failed: ${e.message}`);
    } finally {
      setAutomationActionLoading(null);
    }
  };

  const getPageTitle = () => {
    if (activeTab === 'broadcast') return 'Broadcast Email';
    if (activeTab === 'automations') return 'Automation Reviews';
    return 'Withdrawal Requests';
  };

  const getPageDescription = () => {
    if (activeTab === 'broadcast') return 'Send feature updates to all users via Resend';
    if (activeTab === 'automations') return 'Review builder-published automations before they enter the marketplace';
    return 'Review and process pending withdrawal requests';
  };

  const handleRefresh = () => {
    if (activeTab === 'broadcast') return fetchRecipientCount();
    if (activeTab === 'automations') return fetchAutomations();
    return fetchWithdrawals();
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
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </Link>
            <h1 className="text-3xl font-bold text-white">{getPageTitle()}</h1>
            <p className="text-gray-400 mt-1">{getPageDescription()}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'withdrawals'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Withdrawals
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'broadcast'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Broadcast Email
          </button>
          <button
            onClick={() => setActiveTab('automations')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'automations'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            Automations
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {activeTab === 'withdrawals' && (withdrawals.length === 0 ? (
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
        ))}

        {activeTab === 'broadcast' && (
          <div className="bg-slate-900 border border-slate-700/60 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Send className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Send Product Update</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Send a feature/update announcement to all users from the `users` table.
            </p>

            <div className="mb-5 p-4 rounded-lg bg-slate-800/70 border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Recipients</span>
              </div>
              <span className="text-sm font-semibold text-white">
                {recipientLoading ? 'Loading...' : recipientCount}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email subject</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  maxLength={140}
                  placeholder="e.g. New feature: Scheduled automation monitoring"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  maxLength={8000}
                  rows={8}
                  placeholder="Write what changed, why it matters, and what users should do next."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500">
                Emails are sent one-by-one to protect user privacy.
              </p>
              <button
                onClick={handleBroadcastSend}
                disabled={broadcastSending || recipientCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {broadcastSending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {broadcastSending ? 'Sending...' : 'Send to all users'}
              </button>
            </div>

            {broadcastResult && (
              <div
                className={`mt-5 p-4 rounded-lg border text-sm ${
                  broadcastResult.sent > 0
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <p className={`${broadcastResult.sent > 0 ? 'text-emerald-300' : 'text-red-300'} font-medium`}>
                  Broadcast complete: {broadcastResult.sent} sent, {broadcastResult.failed} failed, {broadcastResult.total} total.
                </p>
                {broadcastResult.from && (
                  <p className="text-xs text-gray-400 mt-2">
                    Sender: {broadcastResult.from}
                  </p>
                )}
                {Array.isArray(broadcastResult.failureReasons) && broadcastResult.failureReasons.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Failure reasons</p>
                    {broadcastResult.failureReasons.map((item, index) => (
                      <p key={index} className="text-xs text-red-300">
                        {item.count}x — {item.reason}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'automations' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-semibold text-white">Marketplace Queue</h2>
              </div>
              <div className="flex gap-2">
                {['pending', 'active', 'all'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setAutomationFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      automationFilter === status
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {automationsLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-purple-400"></div>
              </div>
            ) : automations.length === 0 ? (
              <div className="text-center py-20 text-gray-500 bg-slate-900 border border-slate-700/60 rounded-xl">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500/40" />
                <p className="text-lg font-medium">No automations found</p>
                <p className="text-sm mt-1">The {automationFilter} queue is empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {automations.map((automation) => {
                  const connectors = Array.isArray(automation.required_connectors)
                    ? automation.required_connectors
                    : [];
                  const isApproveLoading = automationActionLoading === `approve:${automation.id}`;
                  const isDisableLoading = automationActionLoading === `disable:${automation.id}`;

                  return (
                    <div
                      key={automation.id}
                      className="bg-slate-900 border border-slate-700/60 rounded-xl p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">{automation.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              automation.is_active
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {automation.is_active ? 'Active' : 'Pending'}
                            </span>
                            {automation.activepieces_source_flow_id && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300">
                                Activepieces
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-400 leading-6 mb-4">
                            {automation.description || 'No description provided.'}
                          </p>

                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg bg-slate-800/60 p-3">
                              <p className="text-xs text-gray-500 mb-1">Author</p>
                              <p className="text-sm font-medium text-white break-all">{automation.author_email || 'Unknown'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-800/60 p-3">
                              <p className="text-xs text-gray-500 mb-1">Cost / Runs</p>
                              <p className="text-sm font-medium text-white">{automation.token_cost || 0} tokens · {automation.total_runs || 0} runs</p>
                            </div>
                            <div className="rounded-lg bg-slate-800/60 p-3">
                              <p className="text-xs text-gray-500 mb-1">Trigger</p>
                              <p className="text-sm font-medium text-white capitalize">{automation.activepieces_trigger_type || 'Unknown'}</p>
                            </div>
                            <div className="rounded-lg bg-slate-800/60 p-3">
                              <p className="text-xs text-gray-500 mb-1">Created</p>
                              <p className="text-sm font-medium text-white">
                                {automation.created_at ? new Date(automation.created_at).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Required Connectors</p>
                            <div className="flex flex-wrap gap-2">
                              {connectors.length === 0 ? (
                                <span className="text-xs text-gray-500">None detected</span>
                              ) : connectors.map((connector) => (
                                <span key={connector} className="px-2 py-1 rounded-md bg-slate-800 text-xs font-medium text-gray-200">
                                  {connector}
                                </span>
                              ))}
                            </div>
                          </div>

                          {automation.activepieces_source_flow_id && (
                            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-xs text-gray-400">
                              <p>Source project: <span className="font-mono text-gray-200">{automation.activepieces_source_project_id || 'Unknown'}</span></p>
                              <p className="mt-1">Source flow: <span className="font-mono text-gray-200">{automation.activepieces_source_flow_id}</span></p>
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-2 lg:flex-col">
                          {!automation.is_active && (
                            <button
                              onClick={() => handleAutomationAction(automation.id, 'approve')}
                              disabled={Boolean(automationActionLoading)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              {isApproveLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Approve
                            </button>
                          )}
                          {automation.is_active && (
                            <button
                              onClick={() => handleAutomationAction(automation.id, 'disable')}
                              disabled={Boolean(automationActionLoading)}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              {isDisableLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                              Disable
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
