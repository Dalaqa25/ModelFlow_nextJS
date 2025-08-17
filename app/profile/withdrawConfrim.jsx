"use client"
import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'

export default function WithdrawConfirm({ isOpen, onClose, onConfirm }) {
    const [email, setEmail] = useState('')
    const [confirmEmail, setConfirmEmail] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [availableAmount, setAvailableAmount] = useState(0)

    // Fetch available balance when component opens
    useEffect(() => {
        if (isOpen) {
            fetchAvailableBalance();
        }
    }, [isOpen]);

    const fetchAvailableBalance = async () => {
        try {
            const res = await fetch('/api/withdraw/available-balance');
            if (res.ok) {
                const data = await res.json();
                setAvailableAmount(data.availableBalance);
            }
        } catch (err) {
            console.error('Failed to fetch available balance:', err);
        }
    };

    const getAvailableAmount = () => {
        return availableAmount;
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess(false);
        
        if (email !== confirmEmail) {
            setError('Emails do not match');
            return;
        }
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setError('Please enter a valid email');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('/api/withdraw/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paypalEmail: email,
                    amount: getAvailableAmount() // Use the actual amount
                })
            });

            const data = await res.json();
            
            if (!res.ok) {
                setError(data.error || 'Something went wrong');
            } else {
                setSuccess(true);
                // Show success message for 2 seconds before closing
                setTimeout(() => {
                    onConfirm(email);
                    onClose();
                    // Reset states when closing
                    setEmail('');
                    setConfirmEmail('');
                    setSuccess(false);
                }, 2000);
            }
        } catch (err) {
            setError('Failed to submit withdrawal request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 dark:bg-black/80" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 p-8 text-left align-middle shadow-2xl dark:shadow-slate-900/50 transition-all border border-gray-100 dark:border-slate-700">
                                {/* Header with Icon */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <div>
                                        <Dialog.Title
                                            as="h3"
                                            className="text-xl font-bold text-gray-900 dark:text-white"
                                        >
                                            Withdraw Funds
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Request withdrawal to PayPal
                                        </p>
                                    </div>
                                </div>

                                {/* Amount Display */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5 mb-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-green-800 dark:text-green-300">Available to withdraw</span>
                                        <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                                            ${(getAvailableAmount() / 100).toFixed(2)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                                        💳 Funds will be sent to your PayPal account within 3-5 business days
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">
                                            PayPal Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                                </svg>
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-200"
                                                placeholder="Enter your PayPal email"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2">
                                            Confirm PayPal Email
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="email"
                                                value={confirmEmail}
                                                onChange={(e) => setConfirmEmail(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white dark:focus:bg-slate-600 transition-all duration-200"
                                                placeholder="Confirm your PayPal email"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <p className="text-red-800 dark:text-red-300 text-sm font-semibold">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {success && (
                                        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-green-800 dark:text-green-300 text-sm font-semibold">
                                                        Withdrawal request submitted successfully!
                                                    </p>
                                                    <p className="text-green-700 dark:text-green-400 text-xs mt-1">
                                                        You will be notified once it's processed.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center items-center px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                                            onClick={onClose}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                                            onClick={handleSubmit}
                                            disabled={isLoading || success}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Processing...
                                                </>
                                            ) : success ? (
                                                <>
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Success!
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                                    </svg>
                                                    Confirm Withdrawal
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}