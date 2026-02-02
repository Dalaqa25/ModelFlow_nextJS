"use client";
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';

export default function Terms() {
    return (
        <AdaptiveBackground variant="content" className="pt-24">
            <div className="min-h-screen flex flex-col py-12 px-6">
                <div className="w-[90%] sm:w-[70%] max-w-[1200px] mx-auto">
                    <div className="flex flex-col items-center text-center gap-5 mb-16">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white">Terms of Service</h1>
                        <p className="text-xl sm:text-2xl text-gray-300 font-light">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-lg sm:text-xl text-gray-300 font-light max-w-3xl">Please read these Terms of Service carefully before using ModelGrow. By accessing or using our platform, you agree to be bound by these terms.</p>
                        
                        {/* Limited Use Clarification */}
                        <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-xl p-6 mt-4 max-w-4xl">
                            <h3 className="text-2xl font-semibold text-white mb-3">🔒 We Only Use What Your Automations Need</h3>
                            <p className="text-lg text-gray-200">
                                While we request access to multiple Google services, <strong className="text-purple-300">we ONLY use the permissions that your specific automations require</strong>. If an automation doesn't need Gmail, we don't access your Gmail. If it doesn't need Drive, we don't access your Drive. You're always in control of which automations you run.
                            </p>
                        </div>
                    </div>   
                    
                    <div className="flex flex-col gap-12 text-gray-300">
                        {/* Company Information */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">Company Information</h2>
                            <div className="space-y-4 text-lg">
                                <p>ModelGrow is operated by <strong>შპს ModelGrow</strong> (Limited Liability Company), registered in Georgia.</p>
                            </div>
                        </section>

                        {/* 1. Acceptance of Terms */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">1. Acceptance of Terms</h2>
                            <div className="space-y-4 text-lg">
                                <p>By accessing or using ModelGrow ("the Platform," "we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.</p>
                                <p>These Terms constitute a legally binding agreement between you and ModelGrow. We may modify these Terms at any time, and such modifications will be effective immediately upon posting on the Platform. Your continued use of the Platform after any such modifications constitutes your acceptance of the modified Terms.</p>
                            </div>
                        </section>

                        {/* 2. Description of Service */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">2. Description of Service</h2>
                            <div className="space-y-4 text-lg">
                                <p>ModelGrow is an AI automation platform that enables users to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Purchase credits to run AI automations</li>
                                    <li>Browse and use automations available on the platform</li>
                                    <li>Participate in community features, including requests and comments</li>
                                    <li>Manage subscriptions and earnings</li>
                                    <li>Interact with other users through the platform</li>
                                </ul>
                                <p>We reserve the right to modify, suspend, or discontinue any aspect of the Platform at any time, with or without notice.</p>
                            </div>
                        </section>

                        {/* 3. Account Registration and Eligibility */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">3. Account Registration and Eligibility</h2>
                            <div className="space-y-4 text-lg">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">3.1 Eligibility</h3>
                                    <p>You must be at least 18 years old to use the Platform. By creating an account, you represent and warrant that:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>You are at least 18 years of age</li>
                                        <li>You have the legal capacity to enter into these Terms</li>
                                        <li>All information you provide is accurate, current, and complete</li>
                                        <li>You will maintain and update your information to keep it accurate</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">3.2 Account Creation</h3>
                                    <p>To use certain features of the Platform, you must create an account. You are responsible for:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Maintaining the confidentiality of your account credentials</li>
                                        <li>All activities that occur under your account</li>
                                        <li>Notifying us immediately of any unauthorized use of your account</li>
                                        <li>Ensuring that your account information is accurate and up-to-date</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">3.3 Account Suspension and Termination</h3>
                                    <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason, including but not limited to:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Violation of these Terms</li>
                                        <li>Fraudulent, illegal, or harmful activity</li>
                                        <li>Misrepresentation of your identity or information</li>
                                        <li>Abuse of the Platform or other users</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 4. User Content */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">4. User Content</h2>
                            <div className="space-y-4 text-lg">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">4.1 Ownership and Rights</h3>
                                    <p>You retain ownership of all content you submit to the Platform, including feedback, suggestions, and other materials ("User Content"). By submitting User Content, you grant ModelGrow:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>A worldwide, non-exclusive, royalty-free license to host, display, distribute, and promote your User Content on the Platform</li>
                                        <li>The right to use your User Content for marketing and promotional purposes</li>
                                        <li>The right to remove or modify your User Content if it violates these Terms</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">4.2 Content Requirements</h3>
                                    <p>You represent and warrant that your User Content:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Does not infringe upon any third-party intellectual property rights, including copyrights, trademarks, or patents</li>
                                        <li>Does not contain illegal, harmful, or offensive material</li>
                                        <li>Does not violate any applicable laws or regulations</li>
                                        <li>Is accurate and not misleading</li>
                                        <li>Does not contain viruses, malware, or other harmful code</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">4.3 Automation Quality</h3>
                                    <p>All automations on the platform are reviewed and maintained by ModelGrow. We reserve the right to:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Reject or remove any model that violates these Terms or our policies</li>
                                        <li>Require modifications before approval</li>
                                        <li>Set pricing guidelines and restrictions</li>
                                        <li>Moderate content for quality and compliance</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">4.4 Prohibited Content</h3>
                                    <p>You may not submit content that:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Violates intellectual property rights</li>
                                        <li>Contains illegal or harmful material</li>
                                        <li>Is designed to harm, exploit, or deceive users</li>
                                        <li>Violates privacy rights or contains personal information without consent</li>
                                        <li>Promotes violence, hate speech, or discrimination</li>
                                        <li>Contains spam, phishing, or fraudulent content</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 5. Purchases and Payments */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">5. Purchases and Payments</h2>
                            <div className="space-y-4 text-lg">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">5.1 Model Purchases</h3>
                                    <p>When you purchase credits on the Platform:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>You receive credits to use automations according to the terms specified on the Platform</li>
                                        <li>All sales are final unless otherwise specified or required by law</li>
                                        <li>Prices are displayed in the currency specified on the Platform</li>
                                        <li>Payment is processed through our third-party payment processor, Paddle</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">5.2 Subscriptions</h3>
                                    <p>Subscription plans are available for enhanced features and benefits:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Subscriptions are billed on a recurring basis (monthly or annually)</li>
                                        <li>You may cancel your subscription at any time</li>
                                        <li>Cancellation takes effect at the end of the current billing period</li>
                                        <li>No refunds are provided for partial billing periods</li>
                                        <li>We reserve the right to modify subscription pricing with advance notice</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">5.3 Refunds</h3>
                                    <p>Refund policies are as follows:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Model purchases are generally non-refundable unless the model is defective or misrepresented</li>
                                        <li>Refund requests must be submitted within 7 days of purchase</li>
                                        <li>We reserve the right to deny refunds for abuse or fraudulent claims</li>
                                        <li>Subscription fees are non-refundable, but cancellation prevents future charges</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">5.4 Contractor Payments</h3>
                                    <p>For contractors who build automations for the Platform:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>You will receive payments based on your contract terms</li>
                                        <li>Earnings are calculated and credited to your account balance</li>
                                        <li>Withdrawals are subject to approval and processing time</li>
                                        <li>You are responsible for any taxes on your earnings</li>
                                        <li>We may withhold payments if there are disputes or violations</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 6. User Conduct */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">6. User Conduct</h2>
                            <div className="space-y-4 text-lg">
                                <p>You agree not to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Use the Platform for any illegal purpose or in violation of any laws</li>
                                    <li>Impersonate any person or entity or falsely state your affiliation</li>
                                    <li>Interfere with or disrupt the Platform or servers</li>
                                    <li>Attempt to gain unauthorized access to any part of the Platform</li>
                                    <li>Use automated systems to access the Platform without permission</li>
                                    <li>Harass, abuse, or harm other users</li>
                                    <li>Post false, misleading, or deceptive information</li>
                                    <li>Violate any intellectual property rights</li>
                                    <li>Collect or harvest information about other users without consent</li>
                                    <li>Use the Platform to transmit viruses or malicious code</li>
                                </ul>
                            </div>
                        </section>

                        {/* 7. Intellectual Property */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">7. Intellectual Property</h2>
                            <div className="space-y-4 text-lg">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">7.1 Platform Ownership</h3>
                                    <p>The Platform, including its design, features, functionality, and content (excluding User Content), is owned by ModelGrow and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">7.2 User Content Ownership</h3>
                                    <p>You retain ownership of your User Content. However, by submitting content, you grant us the licenses described in Section 4.1. You are responsible for ensuring you have the right to grant such licenses.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">7.3 Copyright Infringement</h3>
                                    <p>If you believe your copyright has been infringed, please contact us with:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>A description of the copyrighted work</li>
                                        <li>The location of the infringing material on the Platform</li>
                                        <li>Your contact information</li>
                                        <li>A statement of good faith belief that the use is not authorized</li>
                                        <li>A statement that the information is accurate and you are authorized to act</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 8. Disclaimers */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">8. Disclaimers</h2>
                            <div className="space-y-4 text-lg">
                                <p><strong>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</strong></p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
                                    <li>Warranties that the Platform will be uninterrupted, secure, or error-free</li>
                                    <li>Warranties regarding the accuracy, reliability, or quality of any content or models</li>
                                    <li>Warranties that defects will be corrected</li>
                                </ul>
                                <p className="mt-4">We do not endorse, guarantee, or assume responsibility for any User Content, models, or services offered by third parties. You use the Platform and any models at your own risk.</p>
                            </div>
                        </section>

                        {/* 9. Limitation of Liability */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">9. Limitation of Liability</h2>
                            <div className="space-y-4 text-lg">
                                <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, MODELGROW SHALL NOT BE LIABLE FOR:</strong></p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Indirect, incidental, special, consequential, or punitive damages</li>
                                    <li>Loss of profits, revenue, data, or use</li>
                                    <li>Damages resulting from your use or inability to use the Platform</li>
                                    <li>Damages resulting from User Content or models purchased through the Platform</li>
                                    <li>Damages resulting from unauthorized access or use of your account</li>
                                </ul>
                                <p className="mt-4">Our total liability to you for any claims arising from or related to the Platform shall not exceed the amount you paid to us in the 12 months preceding the claim, or $100, whichever is greater.</p>
                                <p>Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.</p>
                            </div>
                        </section>

                        {/* 10. Indemnification */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">10. Indemnification</h2>
                            <div className="space-y-4 text-lg">
                                <p>You agree to indemnify, defend, and hold harmless ModelGrow, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or relating to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Your use of the Platform</li>
                                    <li>Your User Content</li>
                                    <li>Your violation of these Terms</li>
                                    <li>Your violation of any rights of another party</li>
                                    <li>Your violation of any applicable laws or regulations</li>
                                </ul>
                            </div>
                        </section>

                        {/* 11. Termination */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">11. Termination</h2>
                            <div className="space-y-4 text-lg">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">11.1 Termination by You</h3>
                                    <p>You may terminate your account at any time by contacting us or using the account deletion feature in your settings. Upon termination, your access to the Platform will cease, but certain provisions of these Terms will survive.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">11.2 Termination by Us</h3>
                                    <p>We may terminate or suspend your account immediately, without prior notice, if you violate these Terms or engage in fraudulent, illegal, or harmful activity. We are not obligated to provide a refund upon termination.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">11.3 Effect of Termination</h3>
                                    <p>Upon termination:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Your right to use the Platform will immediately cease</li>
                                        <li>We may delete your account and User Content</li>
                                        <li>Outstanding payments may be processed or forfeited</li>
                                        <li>Sections 7, 8, 9, 10, and 12 of these Terms will survive</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 12. Dispute Resolution */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">12. Dispute Resolution</h2>
                            <div className="space-y-4 text-lg">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">12.2 Dispute Resolution Process</h3>
                                    <p>In the event of any dispute, you agree to:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>First contact us to attempt to resolve the dispute informally</li>
                                        <li>If informal resolution fails, participate in good faith in mediation or arbitration as required by law</li>
                                        <li>Not file any lawsuit or claim more than one year after the cause of action arises</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">12.3 Class Action Waiver</h3>
                                    <p>You agree that any disputes will be resolved individually and not as part of a class action or consolidated proceeding.</p>
                                </div>
                            </div>
                        </section>

                        {/* 13. General Provisions */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">13. General Provisions</h2>
                            <div className="space-y-4 text-lg">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">13.1 Entire Agreement</h3>
                                    <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and ModelGrow regarding your use of the Platform.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">13.2 Severability</h3>
                                    <p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">13.3 Waiver</h3>
                                    <p>Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or any other provision.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">13.4 Assignment</h3>
                                    <p>You may not assign or transfer these Terms or your account without our prior written consent. We may assign these Terms without restriction.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">13.5 Force Majeure</h3>
                                    <p>We shall not be liable for any failure to perform our obligations due to circumstances beyond our reasonable control, including natural disasters, war, terrorism, or internet failures.</p>
                                </div>
                            </div>
                        </section>

                        {/* 14. Contact Information */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">14. Contact Information</h2>
                            <div className="space-y-4 text-lg">
                                <p>If you have any questions about these Terms of Service, please contact us:</p>
                                <div className="bg-slate-800/50 rounded-lg p-6 mt-4">
                                    <p className="mb-2"><strong className="text-white">ModelGrow</strong></p>
                                    <p className="mb-2">Email: g.dalaqishvili01@gmail.com</p>
                                    <p className="text-sm text-gray-400 mt-4">Please include "Terms of Service Inquiry" in the subject line of your email for faster processing.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-16 pt-8 border-t border-gray-700">
                        <p className="text-center text-gray-400 text-sm">
                            By using ModelGrow, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                        </p>
                    </div>
                </div>
            </div>
        </AdaptiveBackground>
    );
}

