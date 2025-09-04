'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../lib/supabase-auth-context';

export default function LemonSqueezyAdminPage() {
    const router = useRouter();
    const { user, loading: isLoading } = useAuth();
    const [isConfigured, setIsConfigured] = useState(false);
    const [configError, setConfigError] = useState('');

    // Price to variant mapping (same as in server.ts)
    const PRICE_TO_VARIANT_MAP = {
        500: "874721",  // $5.00
        1000: "877785", // $10.00
        1500: "877790", // $15.00
        2000: "886672", // $20.00
    };

    useEffect(() => {
        if (!isLoading && user?.email !== 'g.dalaqishvili01@gmail.com') {
            toast.error('Access denied - Admin privileges required');
            router.push('/');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const checkConfiguration = async () => {
            try {
                const response = await fetch('/api/lemon/check-config');
                const data = await response.json();
                setIsConfigured(data.isConfigured);
                setConfigError(data.error || '');
            } catch (error) {
                console.error('Error checking configuration:', error);
                setConfigError('Failed to check configuration');
            }
        };

        if (user?.email === 'g.dalaqishvili01@gmail.com') {
            checkConfiguration();
        }
    }, [user]);

    const testWebhook = async () => {
        try {
            const response = await fetch('/api/lemon/test-webhook', {
                method: 'POST',
            });
            const data = await response.json();
            if (response.ok) {
                toast.success('Webhook test successful!');
            } else {
                toast.error(`Webhook test failed: ${data.error}`);
            }
        } catch (error) {
            toast.error('Failed to test webhook');
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (user?.email !== 'g.dalaqishvili01@gmail.com') {
        return null;
    }

    return (
        <div className="container mx-auto p-4 mt-15">
            <h1 className="text-2xl font-bold mb-6">Lemon Squeezy Integration Management</h1>
            
            {/* Configuration Status */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
                <div className={`p-4 rounded-lg ${isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {isConfigured ? (
                        <div>
                            <p className="font-semibold">✅ Lemon Squeezy is properly configured</p>
                            <p className="text-sm mt-1">All required environment variables are set</p>
                        </div>
                    ) : (
                        <div>
                            <p className="font-semibold">❌ Lemon Squeezy is not properly configured</p>
                            <p className="text-sm mt-1">{configError}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Price to Variant Mapping */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Price to Variant Mapping</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">
                        This mapping determines which Lemon Squeezy variant is used for each price tier.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(PRICE_TO_VARIANT_MAP).map(([priceCents, variantId]) => (
                            <div key={variantId} className="bg-white p-3 rounded border">
                                <div className="font-semibold">${(Number(priceCents) / 100).toFixed(2)}</div>
                                <div className="text-sm text-gray-600">Variant ID: {variantId}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Required Environment Variables */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Required Environment Variables</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">LEMONSQUEEZY_API_KEY</span>
                            <span className="text-sm text-gray-600">Your Lemon Squeezy API key</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">LEMONSQUEEZY_STORE_ID</span>
                            <span className="text-sm text-gray-600">Your Lemon Squeezy store ID</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">LEMONSQUEEZY_WEBHOOK_SECRET</span>
                            <span className="text-sm text-gray-600">Webhook secret for verifying webhooks</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">NEXT_PUBLIC_APP_URL</span>
                            <span className="text-sm text-gray-600">Your app's public URL (e.g., https://yourapp.com)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Webhook URL */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Webhook Configuration</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                        Configure this webhook URL in your Lemon Squeezy dashboard:
                    </p>
                    <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                        {typeof window !== 'undefined' ? `${window.location.origin}/api/lemon/webhooks` : '/api/lemon/webhooks'}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Events to listen for: <code className="bg-gray-200 px-1 rounded">order_created</code>
                    </p>
                </div>
            </div>

            {/* Test Webhook Button */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Testing</h2>
                <button
                    onClick={testWebhook}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    Test Webhook
                </button>
                <p className="text-sm text-gray-600 mt-2">
                    This will send a test webhook to verify your endpoint is working correctly.
                </p>
            </div>

            {/* Instructions */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Create products in your Lemon Squeezy dashboard with the variant IDs listed above</li>
                        <li>Set the required environment variables in your .env file</li>
                        <li>Configure the webhook URL in your Lemon Squeezy dashboard</li>
                        <li>Test the webhook using the button above</li>
                        <li>Upload models and approve them through the admin panel</li>
                    </ol>
                </div>
            </div>
        </div>
    );
} 