'use client';

import { useState, useEffect, Fragment } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FaBell, FaTimes, FaCheck, FaExclamationTriangle, FaComment, FaShoppingCart } from 'react-icons/fa';
import { Dialog, Transition } from '@headlessui/react';

export default function Notifications({ isOpen, onClose }) {
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading, refetch } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await fetch('/api/notifications');
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return response.json();
        },
        enabled: isOpen, // Only fetch when modal is open
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    const handleMarkAsRead = async () => {
        if (selectedNotifications.length === 0) return;

        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationIds: selectedNotifications }),
            });

            if (!response.ok) throw new Error('Failed to delete notifications');

            setSelectedNotifications([]);

            // Invalidate all notification queries to update the red badge
            queryClient.invalidateQueries({ queryKey: ['notifications'] });

            // Also refetch this component's data
            refetch();
        } catch (error) {
            // Error handled silently
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'model_rejection':
                return <FaExclamationTriangle className="text-red-500" />;
            case 'model_approval':
                return <FaCheck className="text-green-500" />;
            case 'comment':
                return <FaComment className="text-blue-500" />;
            case 'purchase':
                return <FaShoppingCart className="text-purple-500" />;
            default:
                return <FaBell className="text-gray-500" />;
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-800/90 backdrop-blur-md border border-slate-700/60 p-6 text-left align-middle shadow-2xl transition-all flex flex-col">
                                <Dialog.Title
                                    as="h3"
                                    className="text-xl font-semibold leading-6 text-white border-b border-slate-700 pb-4 mb-4 flex justify-between items-center"
                                >
                                    Notifications
                                    <button 
                                        onClick={onClose}
                                        className="rounded-lg p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 transition-all duration-200"
                                    >
                                        <FaTimes />
                                    </button>
                                </Dialog.Title>
                                <div className="overflow-y-auto flex-1">
                                    {isLoading ? (
                                        <div className="text-center py-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                                        </div>
                                    ) : notifications.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            No notifications
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {notifications.map((notification) => (
                                                <div 
                                                    key={notification.id}
                                                    className={`p-4 rounded-xl border transition-all duration-200 ${
                                                        notification.read ? 'bg-slate-700/30' : 'bg-slate-700/50'
                                                    } ${
                                                        selectedNotifications.includes(notification.id)
                                                            ? 'border-purple-500 shadow-lg shadow-purple-500/25'
                                                            : 'border-slate-600/50'
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedNotifications(prev =>
                                                            prev.includes(notification.id)
                                                                ? prev.filter(id => id !== notification.id)
                                                                : [...prev, notification.id]
                                                        );
                                                    }}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1">
                                                            {getNotificationIcon(notification.type)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-medium text-white">
                                                                {notification.title}
                                                            </h3>
                                                            <p className="text-slate-300 mt-1">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-sm text-slate-400 mt-2">
                                                                {notification.created_at ? new Date(notification.created_at).toLocaleDateString() : 'Date unavailable'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-700">
                                        <button
                                            onClick={handleMarkAsRead}
                                            disabled={selectedNotifications.length === 0}
                                            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                                        >
                                            Mark as Read ({selectedNotifications.length})
                                        </button>
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}