'use client';

import { useState, useEffect, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaBell, FaTimes, FaCheck, FaExclamationTriangle, FaComment, FaShoppingCart } from 'react-icons/fa';
import { Dialog, Transition } from '@headlessui/react';

export default function Notifications({ isOpen, onClose }) {
    const [selectedNotifications, setSelectedNotifications] = useState([]);

    const { data: notifications = [], isLoading, refetch } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await fetch('/api/notifications');
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return response.json();
        },
        enabled: true,
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
            refetch();
        } catch (error) {
            console.error('Error deleting notifications:', error);
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
                    <div className="fixed inset-0 bg-gray-400/30 backdrop-blur-sm" />
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all flex flex-col">
                                <Dialog.Title
                                    as="h3"
                                    className="text-xl font-semibold leading-6 text-gray-900 border-b pb-4 mb-4 flex justify-between items-center"
                                >
                                    Notifications
                                    <button 
                                        onClick={onClose}
                                        className="text-gray-500 hover:text-gray-700"
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
                                        <div className="text-center py-8 text-gray-500">
                                            No notifications
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {notifications.map((notification) => (
                                                <div 
                                                    key={notification._id}
                                                    className={`p-4 rounded-lg border ${
                                                        notification.read ? 'bg-gray-50' : 'bg-white'
                                                    } ${
                                                        selectedNotifications.includes(notification._id)
                                                            ? 'border-purple-500'
                                                            : 'border-gray-200'
                                                    }`}
                                                    onClick={() => {
                                                        setSelectedNotifications(prev =>
                                                            prev.includes(notification._id)
                                                                ? prev.filter(id => id !== notification._id)
                                                                : [...prev, notification._id]
                                                        );
                                                    }}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1">
                                                            {getNotificationIcon(notification.type)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-medium text-gray-900">
                                                                {notification.title}
                                                            </h3>
                                                            <p className="text-gray-600 mt-1">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-sm text-gray-500 mt-2">
                                                                {new Date(notification.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <button
                                            onClick={handleMarkAsRead}
                                            disabled={selectedNotifications.length === 0}
                                            className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Delete Selected
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