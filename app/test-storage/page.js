
'use client';

import { useState } from 'react';

export default function ScheduleTestPage() {
    const [automationId, setAutomationId] = useState('');
    const [userId, setUserId] = useState('');
    const [prefix, setPrefix] = useState('');
    const [cronExpression, setCronExpression] = useState('*/5 * * * *');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Auto-generate prefix when automation_id or user_id changes
    const handleAutomationIdChange = (val) => {
        setAutomationId(val);
        if (val && userId) setPrefix(`${userId}_${val}/`);
    };
    const handleUserIdChange = (val) => {
        setUserId(val);
        if (automationId && val) setPrefix(`${val}_${automationId}/`);
    };

    const handleSchedule = async () => {
        if (!automationId || !userId || !prefix || !cronExpression) return;

        setLoading(true);
        setResult(null);
        setError(null);

        const payload = {
            automation_id: automationId,
            user_id: userId,
            config: {
                prefix: prefix,
            },
            cronExpression: cronExpression,
        };

        try {
            const response = await fetch('http://localhost:3001/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to schedule');
            }

            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const allFilled = automationId && userId && prefix && cronExpression;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Schedule Automation</h1>

            <div className="space-y-4 mb-8 p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
                <div>
                    <label className="block text-sm font-medium mb-1">Automation ID</label>
                    <input
                        type="text"
                        value={automationId}
                        onChange={(e) => handleAutomationIdChange(e.target.value)}
                        placeholder="e.g. b7c6d3ac-270b-415b-bd47-af905fff448c"
                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">User ID</label>
                    <input
                        type="text"
                        value={userId}
                        onChange={(e) => handleUserIdChange(e.target.value)}
                        placeholder="e.g. user-uuid"
                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Config Prefix</label>
                    <input
                        type="text"
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder="USER_ID_AUTOMATION_ID/"
                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Auto-filled as USER_ID_AUTOMATION_ID/</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Cron Expression</label>
                    <input
                        type="text"
                        value={cronExpression}
                        onChange={(e) => setCronExpression(e.target.value)}
                        placeholder="*/5 * * * *"
                        className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Default: every 5 minutes</p>
                </div>

                <button
                    onClick={handleSchedule}
                    disabled={loading || !allFilled}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                    {loading ? 'Scheduling...' : 'Schedule Automation'}
                </button>
            </div>

            {/* Payload Preview */}
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded border">
                <h3 className="text-sm font-medium mb-2 text-gray-600 dark:text-gray-400">Request Preview → POST http://localhost:3001/schedule</h3>
                <pre className="text-xs overflow-auto">{JSON.stringify({
                    automation_id: automationId || 'AUTOMATION_ID',
                    user_id: userId || 'USER_ID',
                    config: { prefix: prefix || 'USER_ID_AUTOMATION_ID/' },
                    cronExpression: cronExpression || '*/5 * * * *',
                }, null, 2)}</pre>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-200 rounded">
                    <h3 className="font-bold mb-1">Error:</h3>
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="p-6 bg-green-50 text-green-800 border border-green-200 rounded">
                    <h3 className="font-bold mb-2">Success!</h3>
                    <div className="bg-white p-4 rounded border border-green-100 overflow-auto">
                        <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}
