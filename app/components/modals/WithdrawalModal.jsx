'use client';

import { useState } from 'react';
import { X, Wallet, Building2, ChevronDown } from 'lucide-react';

const MIN_WITHDRAWAL = 100.00;
const PLATFORM_FEE = 0.20;

export default function WithdrawalModal({ isOpen, onClose, availableAmount, onSuccess }) {
  const [step, setStep] = useState(1); // 1 = amount, 2 = payment details
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wisetag'); // 'wisetag' | 'bank'
  const [wisetag, setWisetag] = useState('');
  const [bankDetails, setBankDetails] = useState({
    account_holder: '',
    iban_or_account: '',
    bank_name: '',
    country: '',
    routing_number: '', // US only
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const requestedAmount = parseFloat(amount) || 0;
  const platformFee = requestedAmount * PLATFORM_FEE;
  const payoutAmount = requestedAmount - platformFee;

  const handleNextStep = () => {
    setError('');
    if (requestedAmount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is $${MIN_WITHDRAWAL.toFixed(2)}`);
      return;
    }
    if (requestedAmount > availableAmount) {
      setError(`You only have $${availableAmount.toFixed(2)} available`);
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate payment details
    if (paymentMethod === 'wisetag') {
      if (!wisetag.trim()) {
        setError('Please enter your Wise @tag');
        return;
      }
    } else {
      if (!bankDetails.account_holder.trim() || !bankDetails.iban_or_account.trim() || !bankDetails.country.trim()) {
        setError('Please fill in all required bank details');
        return;
      }
    }

    setLoading(true);

    const paymentInfo = paymentMethod === 'wisetag'
      ? { method: 'wisetag', wisetag: wisetag.startsWith('@') ? wisetag : `@${wisetag}` }
      : { method: 'bank', ...bankDetails };

    try {
      const response = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: requestedAmount, payment_info: paymentInfo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to request withdrawal');
      }

      onSuccess && onSuccess(data);
      onClose();
      setAmount('');
      setStep(1);
      setWisetag('');
      setBankDetails({ account_holder: '', iban_or_account: '', bank_name: '', country: '', routing_number: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-purple-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h3 className="text-xl font-bold text-white">Request Withdrawal</h3>
            <p className="text-xs text-gray-400 mt-0.5">Step {step} of 2 — {step === 1 ? 'Amount' : 'Payment Details'}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Amount */}
        {step === 1 && (
          <div className="p-6 space-y-5">
            {/* Available Balance */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Available to Withdraw</p>
              <p className="text-3xl font-bold text-purple-400">${availableAmount.toFixed(2)}</p>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Withdrawal Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">$</span>
                <input
                  type="number"
                  step="0.01"
                  min={MIN_WITHDRAWAL}
                  max={availableAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min $${MIN_WITHDRAWAL.toFixed(2)}`}
                  className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Minimum withdrawal: ${MIN_WITHDRAWAL.toFixed(2)}</p>
            </div>

            {/* Breakdown */}
            {requestedAmount >= MIN_WITHDRAWAL && (
              <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Requested Amount</span>
                  <span className="text-white font-medium">${requestedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Platform Fee (20%)</span>
                  <span className="text-red-400 font-medium">-${platformFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 flex justify-between">
                  <span className="text-white font-semibold">You'll Receive</span>
                  <span className="text-green-400 font-bold text-lg">${payoutAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium">
                Cancel
              </button>
              <button
                onClick={handleNextStep}
                disabled={requestedAmount < MIN_WITHDRAWAL || requestedAmount > availableAmount}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Details */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Summary */}
            <div className="bg-slate-700/30 rounded-lg p-3 flex justify-between items-center">
              <span className="text-sm text-gray-400">You'll receive</span>
              <span className="text-green-400 font-bold text-lg">${payoutAmount.toFixed(2)}</span>
            </div>

            {/* Method selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wisetag')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'wisetag'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                  }`}
                >
                  <Wallet className={`w-6 h-6 ${paymentMethod === 'wisetag' ? 'text-purple-400' : 'text-gray-400'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${paymentMethod === 'wisetag' ? 'text-white' : 'text-gray-300'}`}>Wise @tag</p>
                    <p className="text-xs text-gray-500 mt-0.5">Recommended</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'bank'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                  }`}
                >
                  <Building2 className={`w-6 h-6 ${paymentMethod === 'bank' ? 'text-purple-400' : 'text-gray-400'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${paymentMethod === 'bank' ? 'text-white' : 'text-gray-300'}`}>Bank Transfer</p>
                    <p className="text-xs text-gray-500 mt-0.5">IBAN / Account</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Wise @tag fields */}
            {paymentMethod === 'wisetag' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Wise @tag</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={wisetag.replace('@', '')}
                    onChange={(e) => setWisetag(e.target.value)}
                    placeholder="yourwisetag"
                    className="w-full pl-8 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Find your @tag in the Wise app under your profile</p>
              </div>
            )}

            {/* Bank transfer fields */}
            {paymentMethod === 'bank' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    value={bankDetails.account_holder}
                    onChange={(e) => setBankDetails(p => ({ ...p, account_holder: e.target.value }))}
                    placeholder="Full name as on bank account"
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">IBAN or Account Number *</label>
                  <input
                    type="text"
                    value={bankDetails.iban_or_account}
                    onChange={(e) => setBankDetails(p => ({ ...p, iban_or_account: e.target.value }))}
                    placeholder="e.g. GB29NWBK60161331926819"
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankDetails.bank_name}
                      onChange={(e) => setBankDetails(p => ({ ...p, bank_name: e.target.value }))}
                      placeholder="e.g. Barclays"
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Country *</label>
                    <input
                      type="text"
                      value={bankDetails.country}
                      onChange={(e) => setBankDetails(p => ({ ...p, country: e.target.value }))}
                      placeholder="e.g. United Kingdom"
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Routing Number <span className="text-gray-600">(US only)</span></label>
                  <input
                    type="text"
                    value={bankDetails.routing_number}
                    onChange={(e) => setBankDetails(p => ({ ...p, routing_number: e.target.value }))}
                    placeholder="9-digit routing number"
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono"
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-400">
                💡 Withdrawals are reviewed and typically processed within 1–3 business days via Wise.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium">
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all font-semibold shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
