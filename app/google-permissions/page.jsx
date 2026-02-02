"use client";
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import Link from 'next/link';

export default function GooglePermissions() {
    return (
        <AdaptiveBackground variant="content" className="pt-24">
            <div className="min-h-screen flex flex-col py-12 px-6">
                <div className="w-[90%] sm:w-[70%] max-w-[1200px] mx-auto">
                    <div className="flex flex-col items-center text-center gap-5 mb-16">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white">Google Permissions Explained</h1>
                        <p className="text-xl sm:text-2xl text-gray-300 font-light">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="text-lg sm:text-xl text-gray-300 font-light max-w-3xl">
                            Understand exactly what Google permissions ModelGrow requests and why we need them for your automations.
                        </p>
                        
                        {/* Prominent Limited Use Callout */}
                        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-2 border-purple-400/60 rounded-xl p-8 mt-6 max-w-5xl shadow-2xl">
                            <div className="flex items-start gap-4">
                                <div className="text-4xl">🔐</div>
                                <div className="text-left">
                                    <h3 className="text-3xl font-bold text-white mb-4">We Only Access What Your Automations Use</h3>
                                    <p className="text-xl text-gray-100 leading-relaxed mb-3">
                                        <strong className="text-purple-300">Important:</strong> While we request comprehensive Google permissions to support various automation types, <strong className="text-white">we ONLY access and use the specific services that your chosen automations require</strong>.
                                    </p>
                                    <p className="text-lg text-gray-200 leading-relaxed">
                                        For example, if you run an automation that only uses Google Drive and Sheets, we will <strong className="text-white">never</strong> access your Gmail, Calendar, YouTube, or any other service. You choose which automations to run, and we only use the permissions those specific automations need.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-12 text-gray-300">
                        {/* Overview */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">Why We Need Google Permissions</h2>
                            <div className="space-y-4 text-lg">
                                <p>ModelGrow is an automation platform that helps you automate business workflows by connecting to your Google services. To make your automations work, we need permission to access specific Google services on your behalf.</p>
                                
                                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-5 my-4">
                                    <p className="text-lg font-semibold text-blue-300 mb-2">💡 Why Request Multiple Permissions?</p>
                                    <p className="text-gray-200">
                                        We request comprehensive permissions upfront because different automations need different services. This way, you can use any automation without reconnecting your account each time. However, <strong>we only use the permissions your active automations actually need</strong> - unused permissions remain dormant.
                                    </p>
                                </div>
                                
                                <p>We use <strong>OAuth 2.0</strong>, Google's secure authorization protocol, which means:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>We never see or store your Google password</li>
                                    <li>You can revoke access at any time</li>
                                    <li>We only access what you explicitly authorize</li>
                                    <li>All data transmission is encrypted</li>
                                    <li><strong>We only use permissions that your chosen automations require</strong></li>
                                </ul>
                            </div>
                        </section>

                        {/* What We Access */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">What Google Services We Access</h2>
                            <div className="space-y-6 text-lg">
                                <div className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-2xl font-semibold text-white mb-3">🗂️ Google Drive</h3>
                                    <p className="mb-2"><strong>What we access:</strong> Your Google Drive files and folders</p>
                                    <p className="mb-2"><strong>Why we need it:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Monitor folders for new files (e.g., invoice PDFs)</li>
                                        <li>Download files for processing</li>
                                        <li>Upload processed files back to Drive</li>
                                        <li>Organize and manage files automatically</li>
                                    </ul>
                                    <p className="mt-2 text-sm text-gray-400"><strong>Example automation:</strong> Watch a folder for invoice PDFs, extract data, and organize files</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-2xl font-semibold text-white mb-3">📊 Google Sheets</h3>
                                    <p className="mb-2"><strong>What we access:</strong> Your Google Sheets spreadsheets</p>
                                    <p className="mb-2"><strong>Why we need it:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Read data from spreadsheets</li>
                                        <li>Write and update spreadsheet data</li>
                                        <li>Create new sheets and rows</li>
                                        <li>Sync data between services</li>
                                    </ul>
                                    <p className="mt-2 text-sm text-gray-400"><strong>Example automation:</strong> Extract invoice data and automatically update your accounting spreadsheet</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-2xl font-semibold text-white mb-3">📧 Gmail</h3>
                                    <p className="mb-2"><strong>What we access:</strong> Your Gmail account</p>
                                    <p className="mb-2"><strong>Why we need it:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Send automated email notifications</li>
                                        <li>Read emails for processing (if needed by automation)</li>
                                        <li>Create draft emails</li>
                                        <li>Manage email labels</li>
                                    </ul>
                                    <p className="mt-2 text-sm text-gray-400"><strong>Example automation:</strong> Send email notifications to your billing team when new invoices are processed</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-2xl font-semibold text-white mb-3">📅 Google Calendar</h3>
                                    <p className="mb-2"><strong>What we access:</strong> Your Google Calendar events</p>
                                    <p className="mb-2"><strong>Why we need it:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Create calendar events automatically</li>
                                        <li>Update existing events</li>
                                        <li>Send meeting reminders</li>
                                        <li>Sync schedules across platforms</li>
                                    </ul>
                                    <p className="mt-2 text-sm text-gray-400"><strong>Example automation:</strong> Automatically schedule meetings based on form submissions</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-2xl font-semibold text-white mb-3">🎥 YouTube</h3>
                                    <p className="mb-2"><strong>What we access:</strong> Your YouTube channel</p>
                                    <p className="mb-2"><strong>Why we need it:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Upload videos automatically</li>
                                        <li>Update video metadata</li>
                                        <li>Manage playlists</li>
                                        <li>Schedule video publishing</li>
                                    </ul>
                                    <p className="mt-2 text-sm text-gray-400"><strong>Example automation:</strong> Automatically upload and publish videos on a schedule</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-2xl font-semibold text-white mb-3">📄 Google Docs</h3>
                                    <p className="mb-2"><strong>What we access:</strong> Your Google Docs documents</p>
                                    <p className="mb-2"><strong>Why we need it:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Create documents from templates</li>
                                        <li>Update document content</li>
                                        <li>Generate reports automatically</li>
                                        <li>Extract data from documents</li>
                                    </ul>
                                    <p className="mt-2 text-sm text-gray-400"><strong>Example automation:</strong> Generate contracts from templates with customer data</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-2xl font-semibold text-white mb-3">📊 Google Slides</h3>
                                    <p className="mb-2"><strong>What we access:</strong> Your Google Slides presentations</p>
                                    <p className="mb-2"><strong>Why we need it:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Create presentations automatically</li>
                                        <li>Update slide content</li>
                                        <li>Generate reports and dashboards</li>
                                    </ul>
                                    <p className="mt-2 text-sm text-gray-400"><strong>Example automation:</strong> Create weekly report presentations from data</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-2xl font-semibold text-white mb-3">📝 Google Forms</h3>
                                    <p className="mb-2"><strong>What we access:</strong> Your Google Forms and responses</p>
                                    <p className="mb-2"><strong>Why we need it:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Create forms automatically</li>
                                        <li>Process form responses</li>
                                        <li>Trigger actions based on submissions</li>
                                    </ul>
                                    <p className="mt-2 text-sm text-gray-400"><strong>Example automation:</strong> Process form submissions and update your CRM</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-2xl font-semibold text-white mb-3">✅ Google Tasks</h3>
                                    <p className="mb-2"><strong>What we access:</strong> Your Google Tasks</p>
                                    <p className="mb-2"><strong>Why we need it:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                        <li>Create tasks automatically</li>
                                        <li>Update task status</li>
                                        <li>Sync tasks with other tools</li>
                                    </ul>
                                    <p className="mt-2 text-sm text-gray-400"><strong>Example automation:</strong> Create tasks from emails or calendar events</p>
                                </div>
                            </div>
                        </section>

                        {/* What We Don't Do */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">What We DON'T Do With Your Data</h2>
                            <div className="space-y-4 text-lg">
                                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6">
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-400 text-xl">✓</span>
                                            <span><strong>We DON'T sell your data</strong> - Your Google data is never sold to third parties</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-400 text-xl">✓</span>
                                            <span><strong>We DON'T use it for advertising</strong> - We don't analyze your data for ads or marketing</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-400 text-xl">✓</span>
                                            <span><strong>We DON'T permanently store it</strong> - We only keep data temporarily to run your automations</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-400 text-xl">✓</span>
                                            <span><strong>We DON'T share it unnecessarily</strong> - Your data stays between you, ModelGrow, and Google</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="text-green-400 text-xl">✓</span>
                                            <span><strong>We DON'T access more than needed</strong> - We only request permissions for services your automations actually use</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* Security */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">How We Keep Your Data Secure</h2>
                            <div className="space-y-4 text-lg">
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li><strong>OAuth 2.0 Authentication:</strong> Industry-standard secure authorization</li>
                                    <li><strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                                    <li><strong>Limited Access:</strong> We only access data needed for your specific automations</li>
                                    <li><strong>No Password Storage:</strong> We never see or store your Google password</li>
                                    <li><strong>Compliance:</strong> We comply with Google API Services User Data Policy</li>
                                    <li><strong>Regular Audits:</strong> Our security practices are regularly reviewed</li>
                                </ul>
                            </div>
                        </section>

                        {/* Your Control */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">You're Always in Control</h2>
                            <div className="space-y-4 text-lg">
                                <p>You have complete control over ModelGrow's access to your Google account:</p>
                                <div className="bg-slate-800/50 rounded-lg p-6">
                                    <h3 className="text-xl font-semibold text-white mb-3">How to Revoke Access</h3>
                                    <ol className="list-decimal list-inside space-y-2 ml-4">
                                        <li>Go to your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Account Permissions page</a></li>
                                        <li>Find "ModelGrow" in the list of connected apps</li>
                                        <li>Click "Remove Access"</li>
                                    </ol>
                                    <p className="mt-4 text-sm text-gray-400">Once you revoke access, your automations will stop working until you reconnect, but your data remains safe.</p>
                                </div>
                            </div>
                        </section>

                        {/* Questions */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
                            <div className="space-y-6 text-lg">
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Why do you need so many permissions?</h3>
                                    <p>As an automation platform, we support many different types of workflows. Different automations need different permissions. For example, an invoice automation needs Drive and Sheets access, while a video automation needs YouTube access. We request comprehensive permissions upfront so you can use any automation without reconnecting your account each time. <strong className="text-purple-300">However, we ONLY use the permissions that your active automations specifically require</strong> - if an automation doesn't need a service, we don't access it.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Can I choose which permissions to grant?</h3>
                                    <p>Google's OAuth system requires you to grant all requested permissions together. However, <strong className="text-purple-300">we only use the permissions that your specific automations actually need</strong>. If you only use Drive automations, we won't access your Gmail or Calendar. You control which automations you run, and we only access the services those automations require.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">Is my data safe?</h3>
                                    <p>Yes. We use industry-standard security measures, including encryption, secure OAuth authentication, and compliance with Google's data policies. We never sell your data or use it for purposes other than running your automations.</p>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-white mb-2">What happens if I revoke access?</h3>
                                    <p>Your automations will stop working until you reconnect your Google account. Your data remains safe in your Google account, and we delete any temporarily stored data from our servers.</p>
                                </div>
                            </div>
                        </section>

                        {/* Contact */}
                        <section>
                            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">Still Have Questions?</h2>
                            <div className="space-y-4 text-lg">
                                <p>If you have any questions about Google permissions or how we use your data, please contact us:</p>
                                <div className="bg-slate-800/50 rounded-lg p-6 mt-4">
                                    <p className="mb-2"><strong className="text-white">ModelGrow</strong></p>
                                    <p className="mb-2">Email: g.dalaqishvili01@gmail.com</p>
                                    <p className="text-sm text-gray-400 mt-4">Please include "Google Permissions Question" in the subject line.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer Links */}
                    <div className="mt-16 pt-8 border-t border-gray-700">
                        <p className="text-center text-gray-400 text-sm">
                            See also: <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link> | <Link href="/terms" className="text-blue-400 hover:underline">Terms of Service</Link>
                        </p>
                    </div>
                </div>
            </div>
        </AdaptiveBackground>
    );
}
