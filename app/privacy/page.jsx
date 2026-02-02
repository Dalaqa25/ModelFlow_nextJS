"use client";
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';

export default function Privacy() {
    return (
        <AdaptiveBackground variant="content" className="pt-24">
            <div className="min-h-screen flex flex-col py-12 px-6">
                <div className="w-[90%] sm:w-[70%] max-w-[1200px] mx-auto">
                    <div className="flex flex-col items-center text-center gap-5 mb-16">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white">Privacy Policy</h1>
                        <p className="text-xl sm:text-2xl text-gray-300 font-light">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="text-lg sm:text-xl text-gray-300 font-light max-w-3xl">Your privacy is important to us. This Privacy Policy explains how ModelGrow ("we," "our," or "us") collects, uses, discloses, and protects your personal information when you use our AI automation platform.</p>
                        
                        {/* Limited Use Clarification */}
                        <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-xl p-6 mt-4 max-w-4xl">
                            <h3 className="text-2xl font-semibold text-white mb-3">🔒 We Only Use What Your Automations Need</h3>
                            <p className="text-lg text-gray-200">
                                While we request access to multiple Google services, <strong className="text-purple-300">we ONLY use the permissions that your specific automations require</strong>. If an automation doesn't need Gmail, we don't access your Gmail. If it doesn't need Drive, we don't access your Drive. You're always in control of which automations you run.
                            </p>
                        </div>
                    </div>   
                    
                    <div className="flex flex-col gap-12 text-gray-300">
                        {/* 1. Information We Collect */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">1. Information We Collect</h2>
                            <div className="space-y-4 text-lg">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">1.1 Information You Provide to Us</h3>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li><strong>Account Information:</strong> When you create an account, we collect your email address, name or username, and profile information (including profile images, "About Me" descriptions, website links, and contact email addresses).</li>
                                        <li><strong>Automation Information:</strong> When automations are added to our platform, we collect automation names, descriptions, use cases, setup instructions, features, tags, and associated files.</li>
                                        <li><strong>Payment Information:</strong> When you make purchases or subscribe to our services, payment information is processed through our third-party payment processor, Paddle. We do not store your full payment card details on our servers.</li>
                                        <li><strong>Communication Data:</strong> When you participate in community requests, comments, or contact us, we collect the content of your communications.</li>
                                        <li><strong>Withdrawal Information:</strong> When you request withdrawals, we collect payment method details and related information necessary to process your withdrawal.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">1.2 Automatically Collected Information</h3>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li><strong>Usage Data:</strong> We collect information about how you interact with our platform, including pages visited, features used, models viewed, downloaded, or purchased, and time spent on the platform.</li>
                                        <li><strong>Device Information:</strong> We may collect information about your device, including browser type, operating system, IP address, and device identifiers.</li>
                                        <li><strong>Transaction Data:</strong> We collect information about transactions, including purchase history, earnings, and subscription status.</li>
                                        <li><strong>Authentication Data:</strong> We use OTP (One-Time Password) email authentication via Supabase, which requires your email address for verification purposes.</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* 2. How We Use Your Information */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">2. How We Use Your Information</h2>
                            <div className="space-y-4 text-lg">
                                <p>We use the information we collect for the following purposes:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>Service Provision:</strong> To provide, maintain, and improve our AI automation platform, including processing transactions, managing subscriptions, and delivering automation services.</li>
                                    <li><strong>User Authentication:</strong> To authenticate your identity and secure your account using OTP-based email verification.</li>
                                    <li><strong>Payment Processing:</strong> To process payments, manage subscriptions, calculate earnings, and facilitate withdrawals through our payment processor.</li>
                                    <li><strong>Communication:</strong> To send you notifications about model approvals, rejections, purchases, comments, and other platform activities. We may also send you service-related emails and updates.</li>
                                    <li><strong>Community Features:</strong> To enable community features such as requests, comments, and user interactions.</li>
                                    <li><strong>Analytics and Improvement:</strong> To analyze usage patterns, improve our services, develop new features, and enhance user experience.</li>
                                    <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes, and to protect our rights and the rights of our users.</li>
                                    <li><strong>Fraud Prevention:</strong> To detect, prevent, and address fraud, security issues, and other potentially prohibited or illegal activities.</li>
                                </ul>
                            </div>
                        </section>

                        {/* 3. Information Sharing and Disclosure */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">3. Information Sharing and Disclosure</h2>
                            <div className="space-y-4 text-lg">
                                <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">3.1 Service Providers</h3>
                                    <p className="mb-2">We share information with third-party service providers who perform services on our behalf:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li><strong>Supabase:</strong> We use Supabase for authentication, database storage, and user management. Supabase processes your authentication data and stores your account information.</li>
                                        <li><strong>Paddle:</strong> We use Paddle as our payment processor for subscriptions and credit purchases. Paddle processes payment information in accordance with their privacy policy.</li>
                                        <li><strong>Resend:</strong> We use Resend to send transactional and notification emails. Resend processes your email address for email delivery purposes.</li>
                                        <li><strong>Google APIs:</strong> When you connect your Google account to use automations, we access Google services on your behalf using OAuth 2.0. We only access the data necessary for your automations to function and do not store your Google credentials. See Section 3.6 for detailed information about Google data usage.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">3.2 Public Information</h3>
                                    <p>When you upload models or create public profiles, certain information becomes publicly visible, including your username, profile information, model listings, and public comments.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">3.3 Legal Requirements</h3>
                                    <p>We may disclose your information if required by law, court order, or government regulation, or if we believe disclosure is necessary to protect our rights, property, or safety, or that of our users or others.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">3.5 Business Transfers</h3>
                                    <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">3.6 Google API Services User Data</h3>
                                    <p className="mb-2">ModelGrow's use of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements. Specifically:</p>
                                    
                                    {/* Prominent Limited Use Notice */}
                                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-5 my-4">
                                        <p className="text-lg font-semibold text-green-300 mb-2">✓ Limited Use Commitment</p>
                                        <p className="text-gray-200">
                                            <strong>We only access and use the Google services that your chosen automations specifically require.</strong> While we request comprehensive permissions to support various automation types, we never access services that your active automations don't need. For example, if your automation only uses Drive and Sheets, we will not access your Gmail, Calendar, or any other service.
                                        </p>
                                    </div>
                                    
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li><strong>What We Access:</strong> When you connect your Google account, we request access to specific Google services (such as Drive, Gmail, Sheets, Calendar, YouTube, Docs, Slides, Forms, and Tasks) only as needed for your automations to function.</li>
                                        <li><strong>How We Use It:</strong> We use your Google data solely to provide the automation services you request. For example, if you create an automation that processes invoices from Google Drive and updates a Google Sheet, we only access those specific files and sheets.</li>
                                        <li><strong>Limited Use:</strong> We do not use Google user data for any purpose other than providing and improving the automation features you explicitly request. We do not use it for advertising, analytics unrelated to your automations, or any other purpose.</li>
                                        <li><strong>No Sharing:</strong> We do not share your Google data with third parties except as necessary to provide the automation service (e.g., processing data through our secure servers) or as required by law.</li>
                                        <li><strong>Data Storage:</strong> We only store Google data temporarily as needed to execute your automations. We do not permanently store your Google files, emails, or other content unless explicitly required for the automation's functionality.</li>
                                        <li><strong>Security:</strong> All Google data is transmitted and processed using industry-standard encryption and security measures.</li>
                                        <li><strong>Your Control:</strong> You can revoke ModelGrow's access to your Google account at any time through your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Account permissions page</a>.</li>
                                    </ul>
                                    <p className="mt-4">The specific Google services we may access include:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li><strong>Google Drive:</strong> To read, create, update, and manage files for file-based automations</li>
                                        <li><strong>Google Sheets:</strong> To read and write spreadsheet data for data processing automations</li>
                                        <li><strong>Gmail:</strong> To send emails and read messages for email automation workflows</li>
                                        <li><strong>Google Calendar:</strong> To create and manage calendar events for scheduling automations</li>
                                        <li><strong>YouTube:</strong> To upload videos and manage your YouTube content for video automations</li>
                                        <li><strong>Google Docs:</strong> To create and edit documents for document automation workflows</li>
                                        <li><strong>Google Slides:</strong> To create and edit presentations for presentation automations</li>
                                        <li><strong>Google Forms:</strong> To create forms and access responses for form automations</li>
                                        <li><strong>Google Tasks:</strong> To create and manage tasks for productivity automations</li>
                                    </ul>
                                    <p className="mt-4">We only request access to the services that your specific automations require. You will see exactly which permissions are requested when you connect your Google account.</p>
                                </div>
                            </div>
                        </section>

                        {/* 4. Cookies and Tracking Technologies */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">4. Cookies and Tracking Technologies</h2>
                            <div className="space-y-4 text-lg">
                                <p>We use cookies and similar tracking technologies to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>Authentication:</strong> Supabase uses cookies to maintain your authentication session and remember your login state.</li>
                                    <li><strong>Functionality:</strong> We use cookies to remember your preferences and settings to provide a personalized experience.</li>
                                    <li><strong>Analytics:</strong> We may use analytics tools to understand how users interact with our platform.</li>
                                </ul>
                                <p>You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our platform.</p>
                            </div>
                        </section>

                        {/* 5. Data Security */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">5. Data Security</h2>
                            <div className="space-y-4 text-lg">
                                <p>We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Encryption of data in transit and at rest</li>
                                    <li>Secure authentication mechanisms (OTP-based email verification)</li>
                                    <li>Regular security assessments and updates</li>
                                    <li>Access controls and authentication requirements</li>
                                    <li>Secure payment processing through certified third-party providers</li>
                                </ul>
                                <p className="mt-4">However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
                            </div>
                        </section>

                        {/* 6. Your Rights and Choices */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">6. Your Rights and Choices</h2>
                            <div className="space-y-4 text-lg">
                                <p>Depending on your location, you may have the following rights regarding your personal information:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>Access:</strong> You can access and review your personal information through your account settings.</li>
                                    <li><strong>Correction:</strong> You can update or correct your personal information at any time through your profile settings.</li>
                                    <li><strong>Deletion:</strong> You can request deletion of your account and associated data by contacting us. Note that some information may be retained for legal or legitimate business purposes.</li>
                                    <li><strong>Data Portability:</strong> You can request a copy of your personal data in a structured, machine-readable format.</li>
                                    <li><strong>Opt-Out:</strong> You can opt out of certain communications by adjusting your notification preferences or unsubscribing from marketing emails.</li>
                                    <li><strong>Account Deletion:</strong> You can delete your account at any time, which will remove your personal information from our active systems, subject to retention requirements.</li>
                                </ul>
                                <p className="mt-4">To exercise these rights, please contact us using the information provided in the "Contact Us" section below.</p>
                            </div>
                        </section>

                        {/* 7. Data Retention */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">7. Data Retention</h2>
                            <div className="space-y-4 text-lg">
                                <p>We retain your personal information for as long as necessary to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Provide our services to you</li>
                                    <li>Comply with legal obligations</li>
                                    <li>Resolve disputes and enforce our agreements</li>
                                    <li>Maintain security and prevent fraud</li>
                                </ul>
                                <p className="mt-4">When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal, regulatory, or legitimate business purposes (such as transaction records for tax compliance).</p>
                            </div>
                        </section>

                        {/* 8. Children's Privacy */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">8. Children's Privacy</h2>
                            <div className="space-y-4 text-lg">
                                <p>Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child under 18, we will take steps to delete such information promptly.</p>
                                <p>If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.</p>
                            </div>
                        </section>

                        {/* 9. International Data Transfers */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">9. International Data Transfers</h2>
                            <div className="space-y-4 text-lg">
                                <p>Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our services, you consent to the transfer of your information to these countries.</p>
                                <p>We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy, regardless of where it is processed.</p>
                            </div>
                        </section>

                        {/* 10. California Privacy Rights */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">10. California Privacy Rights</h2>
                            <div className="space-y-4 text-lg">
                                <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>The right to know what personal information we collect, use, disclose, and sell</li>
                                    <li>The right to delete personal information we have collected from you</li>
                                    <li>The right to opt-out of the sale of personal information (we do not sell personal information)</li>
                                    <li>The right to non-discrimination for exercising your privacy rights</li>
                                </ul>
                                <p className="mt-4">To exercise your California privacy rights, please contact us using the information provided in the "Contact Us" section.</p>
                            </div>
                        </section>

                        {/* 11. European Privacy Rights (GDPR) */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">11. European Privacy Rights (GDPR)</h2>
                            <div className="space-y-4 text-lg">
                                <p>If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have additional rights under the General Data Protection Regulation (GDPR):</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>The right to access your personal data</li>
                                    <li>The right to rectify inaccurate or incomplete data</li>
                                    <li>The right to erasure ("right to be forgotten")</li>
                                    <li>The right to restrict processing</li>
                                    <li>The right to data portability</li>
                                    <li>The right to object to processing</li>
                                    <li>The right to withdraw consent at any time</li>
                                </ul>
                                <p className="mt-4">You also have the right to lodge a complaint with a supervisory authority if you believe we have violated your privacy rights.</p>
                            </div>
                        </section>

                        {/* 12. Changes to This Privacy Policy */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">12. Changes to This Privacy Policy</h2>
                            <div className="space-y-4 text-lg">
                                <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Posting the updated Privacy Policy on this page</li>
                                    <li>Updating the "Last Updated" date at the top of this policy</li>
                                    <li>Sending you an email notification for significant changes (if you have provided an email address)</li>
                                </ul>
                                <p className="mt-4">Your continued use of our services after the effective date of any changes constitutes your acceptance of the updated Privacy Policy.</p>
                            </div>
                        </section>

                        {/* 13. Contact Us */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">13. Contact Us</h2>
                            <div className="space-y-4 text-lg">
                                <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
                                <div className="bg-slate-800/50 rounded-lg p-6 mt-4">
                                    <p className="mb-2"><strong className="text-white">ModelGrow</strong></p>
                                    <p className="mb-2">Email: g.dalaqishvili01@gmail.com</p>
                                    <p className="text-sm text-gray-400 mt-4">Please include "Privacy Policy Inquiry" in the subject line of your email for faster processing.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer Note */}
                    <div className="mt-16 pt-8 border-t border-gray-700">
                        <p className="text-center text-gray-400 text-sm">
                            By using ModelGrow, you acknowledge that you have read and understood this Privacy Policy and agree to the collection, use, and disclosure of your information as described herein.
                        </p>
                    </div>
                </div>
            </div>
        </AdaptiveBackground>
    );
}