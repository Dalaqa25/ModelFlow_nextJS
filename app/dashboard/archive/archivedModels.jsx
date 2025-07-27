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
                <div className="text-gray-400 text-center">No archived models yet.</div>
            ) : (
                models.map((model, idx) => (
                    <div key={idx} className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-sm">
                        <div>
                            <div className="text-lg font-semibold text-purple-800">{model.name}</div>
                            <div className="text-sm text-gray-500">By: {model.authorEmail}</div>
                        </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-0">
                                <div className="text-sm text-gray-600">Archived on: {new Date(model.createdAt).toLocaleDateString()}</div>
                                <button
                                    className="ml-4 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-semibold"
                                    onClick={() => handleNotify(model._id)}
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