import { useState } from 'react';
import LoadingDialog from '../../components/plans/LoadingDialog';

export default function ArchivedModels({ models = [], onModelDeleted }) {
    const [deleting, setDeleting] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState('');

    const handleDelete = async (modelId) => {
        if (!window.confirm('Are you sure you want to permanently delete this model? This action cannot be undone.')) return;
        setDeleteMessage('Deleting model and file from storage...');
        setDeleting(true);
        try {
            const res = await fetch(`/api/models/archived/${modelId}`, { method: 'DELETE' });
            if (res.ok) {
                if (onModelDeleted) onModelDeleted(modelId);
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete model.');
            }
        } catch (err) {
            alert('Error deleting model: ' + err.message);
        } finally {
            setDeleting(false);
            setDeleteMessage('');
        }
    };
    return (
        <>
            <LoadingDialog isOpen={deleting} message={deleteMessage} />
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
                                    className="ml-4 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-semibold"
                                    onClick={() => handleDelete(model._id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}