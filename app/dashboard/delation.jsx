'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function DeletionDialog({ isOpen, onClose, modelId, modelName, onDeleteSuccess }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    if (!isOpen) return null;

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const response = await fetch(`/api/models/${modelId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete model');
            }

            onClose();
            toast.success(`"${modelName}" has been successfully deleted`);
            onDeleteSuccess();
        } catch (error) {
            console.error('Error deleting model:', error);
            toast.error('Failed to delete model. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur-xs z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <h2 className="text-2xl font-semibold mb-4">Delete Model</h2>
                <p className="text-gray-600 mb-6">
                    Are you sure you want to delete "{modelName}"? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-4 py-2 btn-primary text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}