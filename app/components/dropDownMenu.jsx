import { AiOutlinePlus } from "react-icons/ai";
import { FaDollarSign } from "react-icons/fa";
import { MdPrivacyTip } from "react-icons/md";
import { useAuth } from "@/lib/supabase-auth-context";
import NavigationLink from "./NavigationLink";
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Notifications from './notifications';
import { toast } from 'react-hot-toast';

export default function DropDownMenu() {
    const { user, signOut } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);

    const { data: userData, isLoading } = useQuery({
        queryKey: ['userData', user?.email],
        queryFn: async () => {
            const response = await fetch('/api/user', { credentials: 'include' });
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
            const response = await fetch('/api/notifications', { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return response.json();
        },
        enabled: !!user?.email,
        // Cache configuration for notifications
        staleTime: 3 * 60 * 1000, // Data considered fresh for 3 minutes
        gcTime: 10 * 60 * 1000, // Cache garbage collected after 10 minutes
        refetchOnWindowFocus: false, // Don't refetch when tab becomes active
        refetchOnReconnect: false, // Don't refetch when reconnecting to internet
        refetchOnMount: false, // Don't refetch when component remounts if data is still fresh
    });

    const unreadCount = notifications.filter(n => !n.read).length;
    const userName = userData?.name || user?.user_metadata?.name || user?.email || 'User';

    const handleSignOut = async () => {
        try {
            const { error } = await signOut();
            if (error) {
                console.error('Error signing out:', error);
                toast.error('Failed to sign out. Please try again.');
            } else {
                toast.success('Successfully signed out');
            }
        } catch (error) {
            console.error('Error signing out:', error);
            toast.error('Failed to sign out. Please try again.');
        }
    };

    return (
        <>
            <div className="flex flex-col bg-white shadow-lg rounded-lg w-[250px] p-3 z-50">
                <NavigationLink
                    href="/profile"
                    className="cursor-pointer flex flex-col hover:bg-gray-100 rounded-lg transition-all p-2"
                >
                    <p className="text-gray-400">Profile</p>
                    <p className="text-xl">{isLoading ? 'Loading...' : userName}</p>
                </NavigationLink>
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
                <NavigationLink href="/dashboard" className="cursor-pointer items-center flex hover:bg-gray-100 rounded-lg transition-all p-2 mt-1.5">
                    <AiOutlinePlus size={20} className="text-gray-400 mr-2" />
                    <p className="text-xl">New Model</p>
                </NavigationLink>
                <NavigationLink href="/billing" className="cursor-pointer items-center flex hover:bg-gray-100 rounded-lg transition-all p-2 mt-1.5">
                    <FaDollarSign size={20} className="text-gray-400 mr-2" />
                    <p className="text-xl">Billing</p>
                </NavigationLink>
                <NavigationLink href="/privacy" className="cursor-pointer items-center flex hover:bg-gray-100 rounded-lg transition-all p-2 mt-1.5 mb-1.5">
                    <MdPrivacyTip size={20} className="text-gray-400 mr-2" />
                    <p className="text-xl">Privacy</p>
                </NavigationLink>
                <hr className="border-gray-200"/>
                <button 
                    onClick={handleSignOut}
                    className="cursor-pointer items-center flex hover:bg-gray-100 rounded-lg transition-all p-2 mt-1.5 text-gray-500 w-full text-left"
                >
                    <p className="text-xl">Sign out</p>
                </button>
            </div>

            <Notifications 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
            />
        </>
    );
}