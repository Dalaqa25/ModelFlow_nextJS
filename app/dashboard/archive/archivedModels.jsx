import { useState } from 'react';
import LoadingDialog from '../../components/plans/LoadingDialog';
import DeleteSuccessDialog from '../../components/model/DeleteSuccessDialog';
import PendingDeletionDialog from '../../components/model/PendingDeletionDialog';

export default function ArchivedModels({ models = [], onModelDeleted }) {
    const [notifying, setNotifying] = useState(false);
    const [notifyMessage, setNotifyMessage] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPending, setShowPending] = useState(false);

    const handleNotify = async (modelId) => {
        setNotifyMessage('Notifying all purchasers...');
        setNotifying(true);
        try {
            const res = await fetch(`/api/models/archived/${modelId}`, { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.message && data.message.includes('deleted')) {
                setShowSuccess(true);
                // Remove the model from UI and update storage calculation
                if (onModelDeleted) onModelDeleted();
            } else if (res.ok && data.message && data.message.includes('purchasers')) {
                setShowPending(true);
            } else if (res.ok) {
                alert(data.message || 'Notification emails sent!');
            } else {
                alert(data.error || 'Failed to send notifications.');
            }
        } catch (err) {
            alert('Error sending notifications: ' + err.message);
        } finally {
            setNotifying(false);
            setNotifyMessage('');
        }
    };

    return (
        <>
            <LoadingDialog isOpen={notifying} message={notifyMessage} />
            <DeleteSuccessDialog isOpen={showSuccess} onClose={() => setShowSuccess(false)} />
            <PendingDeletionDialog isOpen={showPending} onClose={() => setShowPending(false)} />
        <div className="space-y-4">
            {models.length === 0 ? (
                <div className="text-slate-400 text-center">No archived models yet.</div>
            ) : (
                models.map((model, idx) => (
                    <div key={idx} className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-lg hover:shadow-purple-500/25 transition-all duration-200">
                        <div>
                            <div className="text-lg font-semibold text-white">{model.name}</div>
                            <div className="text-sm text-slate-300">
                                Created: {model.created_at
                                    ? new Date(model.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })
                                    : 'Unknown date'
                                }
                            </div>
                        </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-0">
                                <div className="text-sm text-slate-400">
                                    Archived: {model.archived_at || model.createdAt
                                        ? new Date(model.archived_at || model.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })
                                        : 'Unknown date'
                                    }
                                </div>
                                <button
                                    className="ml-4 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-xs font-semibold shadow-lg hover:shadow-blue-500/25"
                                    onClick={() => handleNotify(model.id)}
                                    disabled={notifying}
                                >
                                    Notify Purchasers
                                </button>
                        </div>
                    </div>
                ))
            )}
        </div>
        </>
    );
}