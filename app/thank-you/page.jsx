'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaDownload, FaHome, FaBook } from 'react-icons/fa';

export default function ThankYouPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to dashboard after 50 seconds
        const timer = setTimeout(() => {
            router.push('/dashboard');
        }, 50000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {/* Success Animation */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                    }}
                    className="mb-8"
                >
                    <FaCheckCircle className="w-24 h-24 text-green-500 mx-auto" />
                </motion.div>

                {/* Thank You Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        Thank You for Your Purchase!
                    </h1>
                    <p className="text-lg text-gray-600 mb-8">
                        Your model has been successfully added to your account. You can now access it from your dashboard.
                    </p>
                </motion.div>

                {/* Next Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
                >
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <FaDownload className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <h3 className="font-semibold text-gray-800">Download Model</h3>
                        <p className="text-sm text-gray-600">Access your model from the dashboard</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <FaBook className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <h3 className="font-semibold text-gray-800">Read Documentation</h3>
                        <p className="text-sm text-gray-600">Check setup instructions</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <FaHome className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <h3 className="font-semibold text-gray-800">Go to Dashboard</h3>
                        <p className="text-sm text-gray-600">View your purchased models</p>
                    </div>
                </motion.div>

                {/* Auto-redirect Message */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-sm text-gray-500"
                >
                    You will be redirected to the dashboard in 50 seconds...
                </motion.div>

                {/* Manual Navigation Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    onClick={() => router.push('/dashboard')}
                    className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300"
                >
                    Go to Dashboard
                </motion.button>
            </div>
        </div>
    );
}