import { AiOutlinePlus } from "react-icons/ai";
import { FaDollarSign } from "react-icons/fa";
import { MdPrivacyTip } from "react-icons/md";
import { LogoutLink, useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import Link from "next/link";
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Notifications from './notifications';

export default function DropDownMenu() {
    const { user } = useKindeAuth();
    const [showNotifications, setShowNotifications] = useState(false);

    const { data: userData, isLoading } = useQuery({
        queryKey: ['userData', user?.email],
        queryFn: async () => {
            const response = await fetch('/api/user');
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }
            const data = await response.json();
            return data;
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const { data: notifications = [] } = useQuery({
        queryKey: ['notifications', user?.email],
        queryFn: async () => {
            if (!user?.email) return [];
            const response = await fetch('/api/notifications');
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return response.json();
        },
        enabled: !!user?.email,
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    const userName = userData?.name || user?.given_name || 'User';

    return (
        <>
            <div className="flex flex-col bg-white shadow-lg rounded-lg w-[250px] p-3 z-50">
                <Link
                    href="/profile"
                    className="cursor-pointer flex flex-col hover:bg-gray-100 rounded-lg transition-all p-2"
                >
                    <p className="text-gray-400">Profile</p>
                    <p className="text-xl">{isLoading ? 'Loading...' : userName}</p>
                </Link>
                <div 
                    onClick={() => setShowNotifications(true)}
                    className="cursor-pointer flex flex-col hover:bg-gray-100 rounded-lg transition-all p-2 mb-1.5"
                >
                    <p className="text-gray-400">Notifications</p>
                    <div className="flex items-center justify-between">
                        <p className="text-xl">Inbox</p>
                        {unreadCount > 0 && (
                            <span className="bg-purple-600 text-white text-sm px-2 py-1 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                </div>
                <hr className="border-gray-200"/>
                <Link href="/dashboard" className="cursor-pointer items-center flex hover:bg-gray-100 rounded-lg transition-all p-2 mt-1.5">
                    <AiOutlinePlus size={20} className="text-gray-400 mr-2" />
                    <p className="text-xl">New Model</p>
                </Link>
                <Link href="/billing" className="cursor-pointer items-center flex hover:bg-gray-100 rounded-lg transition-all p-2 mt-1.5">
                    <FaDollarSign size={20} className="text-gray-400 mr-2" />
                    <p className="text-xl">Billing</p>
                </Link>
                <Link href="/privacy" className="cursor-pointer items-center flex hover:bg-gray-100 rounded-lg transition-all p-2 mt-1.5 mb-1.5">
                    <MdPrivacyTip size={20} className="text-gray-400 mr-2" />
                    <p className="text-xl">Privacy</p>
                </Link>
                <hr className="border-gray-200"/>
                <LogoutLink className="cursor-pointer items-center flex hover:bg-gray-100 rounded-lg transition-all p-2 mt-1.5 text-gray-500">
                    <p className="text-xl">Sign out</p>
                </LogoutLink>
            </div>

            <Notifications 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
            />
        </>
    );
}