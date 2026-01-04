"use client";
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import Link from 'next/link';

export default function Refund() {
    return (
        <AdaptiveBackground variant="content" className="pt-24">
            <div className="min-h-screen flex flex-col py-12 px-6">
                <div className="w-[90%] sm:w-[70%] max-w-[1200px] mx-auto">
                    <div className="flex flex-col items-center text-center gap-5 mb-16">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white">Refund Policy</h1>
                        <p className="text-xl sm:text-2xl text-gray-300 font-light">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-lg sm:text-xl text-gray-300 font-light max-w-3xl">
                            This Refund Policy explains when and how you can request a refund for purchases made on ModelGrow.
                        </p>
                    </div>

                    <div className="flex flex-col gap-12 text-gray-300">
                        {/* 1. Credit Purchases */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">1. Credit Purchases</h2>
                            <div className="space-y-4 text-lg">
                                <p>Credit purchases on ModelGrow are generally non-refundable once the transaction is complete. However, we may consider refund requests in the following circumstances:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>Duplicate Charges:</strong> If you were charged multiple times for the same purchase due to a technical error.</li>
                                    <li><strong>Unauthorized Transactions:</strong> If a purchase was made without your authorization (subject to verification).</li>
                                    <li><strong>Technical Issues:</strong> If credits were not properly added to your account after a successful payment.</li>
                                </ul>
                            </div>
                        </section>

                        {/* 2. Unused Credits */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">2. Unused Credits</h2>
                            <div className="space-y-4 text-lg">
                                <p>Unused credits are non-refundable. Credits do not expire and can be used at any time. We encourage you to purchase only the credits you expect to use.</p>
                                <p>If you have unused credits and wish to close your account, please note that remaining credits will be forfeited and cannot be refunded or transferred.</p>
                            </div>
                        </section>

                        {/* 3. Automation Purchases */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">3. Automation Usage</h2>
                            <div className="space-y-4 text-lg">
                                <p>Once credits are used to run an automation, that transaction is final and non-refundable. Before running an automation, please:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Review the automation description and requirements carefully</li>
                                    <li>Check the credit cost before confirming</li>
                                    <li>Ensure you understand what the automation does</li>
                                </ul>
                                <p className="mt-4">If an automation fails to work as described due to a defect or misrepresentation by the developer, you may request a credit refund within 7 days of the transaction.</p>
                            </div>
                        </section>

                        {/* 4. How to Request a Refund */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">4. How to Request a Refund</h2>
                            <div className="space-y-4 text-lg">
                                <p>To request a refund, please contact us with the following information:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Your account email address</li>
                                    <li>Date of the transaction</li>
                                    <li>Amount of the transaction</li>
                                    <li>Reason for the refund request</li>
                                    <li>Any relevant screenshots or documentation</li>
                                </ul>
                                <div className="bg-slate-800/50 rounded-lg p-6 mt-4">
                                    <p className="mb-2"><strong className="text-white">Contact for Refunds:</strong></p>
                                    <p className="mb-2">Email: g.dalaqishvili01@gmail.com</p>
                                    <p className="text-sm text-gray-400 mt-4">Please include "Refund Request" in the subject line.</p>
                                </div>
                            </div>
                        </section>

                        {/* 5. Refund Processing */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">5. Refund Processing</h2>
                            <div className="space-y-4 text-lg">
                                <p>If your refund request is approved:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Refunds will be processed within 5-10 business days</li>
                                    <li>Refunds will be issued to the original payment method</li>
                                    <li>You will receive an email confirmation when the refund is processed</li>
                                    <li>Depending on your bank or payment provider, it may take additional time for the refund to appear in your account</li>
                                </ul>
                            </div>
                        </section>

                        {/* 6. Refund Timeframe */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">6. Refund Request Timeframe</h2>
                            <div className="space-y-4 text-lg">
                                <p>Refund requests must be submitted within:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>7 days</strong> for credit purchase issues (duplicate charges, technical errors)</li>
                                    <li><strong>7 days</strong> for automation-related issues (defective or misrepresented automations)</li>
                                </ul>
                                <p className="mt-4">Requests submitted after these timeframes may not be eligible for a refund.</p>
                            </div>
                        </section>

                        {/* 7. Exceptions */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">7. Exceptions</h2>
                            <div className="space-y-4 text-lg">
                                <p>Refunds will NOT be provided in the following cases:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Change of mind after purchasing credits</li>
                                    <li>Failure to read automation descriptions before use</li>
                                    <li>User error in running automations</li>
                                    <li>Account suspension or termination due to Terms of Service violations</li>
                                    <li>Requests made after the refund timeframe has expired</li>
                                </ul>
                            </div>
                        </section>

                        {/* 8. Contractor Payments */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">8. Contractor Payments</h2>
                            <div className="space-y-4 text-lg">
                                <p>For contractors who build automations for ModelGrow:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Contractor payments are subject to a holding period before processing</li>
                                    <li>If a refund is issued for an automation, the corresponding payment may be adjusted</li>
                                    <li>Payment requests are processed according to our payout schedule</li>
                                </ul>
                            </div>
                        </section>

                        {/* 9. Changes to This Policy */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">9. Changes to This Policy</h2>
                            <div className="space-y-4 text-lg">
                                <p>We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting on this page. We encourage you to review this policy periodically.</p>
                            </div>
                        </section>

                        {/* 10. Contact Us */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">10. Contact Us</h2>
                            <div className="space-y-4 text-lg">
                                <p>If you have any questions about this Refund Policy, please contact us:</p>
                                <div className="bg-slate-800/50 rounded-lg p-6 mt-4">
                                    <p className="mb-2"><strong className="text-white">ModelGrow</strong></p>
                                    <p className="mb-2">Email: g.dalaqishvili01@gmail.com</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer Links */}
                    <div className="mt-16 pt-8 border-t border-gray-700">
                        <p className="text-center text-gray-400 text-sm">
                            See also: <Link href="/terms" className="text-blue-400 hover:underline">Terms of Service</Link> | <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>
                        </p>
                    </div>
                </div>
            </div>
        </AdaptiveBackground>
    );
}
