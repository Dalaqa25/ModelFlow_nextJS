'use client';

import { motion } from 'framer-motion';
import { useThemeAdaptive } from '@/lib/theme-adaptive-context';
import { FaFileInvoice, FaEnvelope, FaRobot, FaChartLine, FaCalendarAlt, FaDatabase } from 'react-icons/fa';

const popularAutomations = [
    {
        icon: FaFileInvoice,
        title: 'Invoice Generator',
        description: 'Auto-create and send invoices from spreadsheet data',
        category: 'Finance'
    },
    {
        icon: FaEnvelope,
        title: 'Email Outreach',
        description: 'Personalized cold emails with AI-written content',
        category: 'Marketing'
    },
    {
        icon: FaRobot,
        title: 'Lead Enrichment',
        description: 'Enrich leads with company data automatically',
        category: 'Sales'
    },
    {
        icon: FaChartLine,
        title: 'Report Generator',
        description: 'Weekly analytics reports sent to Slack',
        category: 'Analytics'
    },
    {
        icon: FaCalendarAlt,
        title: 'Meeting Scheduler',
        description: 'Auto-schedule meetings based on availability',
        category: 'Productivity'
    },
    {
        icon: FaDatabase,
        title: 'Data Sync',
        description: 'Sync data between CRM and spreadsheets',
        category: 'Operations'
    }
];

export default function DevelopersSection() {
    const { isDarkMode } = useThemeAdaptive();

    return (
        <section className="pt-8 sm:pt-12 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        Ready-Made Automations
                    </h2>
                    <p className={`text-base sm:text-lg max-w-2xl mx-auto ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                        Our team builds the automations. Our AI finds the right one for you.
                    </p>
                </motion.div>

                {/* Automation cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {popularAutomations.map((automation, index) => (
                        <motion.div
                            key={automation.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.4 }}
                            className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${
                                isDarkMode
                                    ? 'bg-slate-800/50 border-slate-700/50 hover:border-purple-500/50'
                                    : 'bg-white/70 border-purple-100 hover:border-purple-300'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                                }`}>
                                    <automation.icon className={`w-5 h-5 ${
                                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                    }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`font-semibold truncate ${
                                            isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                            {automation.title}
                                        </h3>
                                    </div>
                                    <p className={`text-sm mb-2 ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                        {automation.description}
                                    </p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        isDarkMode
                                            ? 'bg-purple-500/20 text-purple-300'
                                            : 'bg-purple-100 text-purple-700'
                                    }`}>
                                        {automation.category}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className={`text-center mt-8 text-sm ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}
                >
                    And many more being added to the platform regularly
                </motion.p>
            </div>
        </section>
    );
}
