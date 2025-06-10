import { AiOutlinePlus } from "react-icons/ai";
import { FaDollarSign } from "react-icons/fa";
import { MdPrivacyTip } from "react-icons/md";
import { LogoutLink, useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function DropDownMenu() {
    const [userName, setUserName] = useState("Loading...");
    const { user } = useKindeAuth();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/user');
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const data = await response.json();
                setUserName(data.name || user?.given_name || 'User');
            } catch (error) {
                console.error("Error fetching user data:", error);
                setUserName(user?.given_name || 'User');
            }
        };

        if (user) {
            fetchUserData();
        }
    }, [user]);

    return (
        <div className="flex flex-col bg-white shadow-lg rounded-lg w-[250px] p-3 z-50">
            <Link
                href="/profile"
                className="cursor-pointer flex flex-col hover:bg-gray-100 rounded-lg transition-all p-2"
            >
                <p className="text-gray-400">Profile</p>
                <p className="text-xl">{userName}</p>
            </Link>
            <div className="cursor-pointer flex flex-col hover:bg-gray-100 rounded-lg transition-all p-2 mb-1.5">
                <p className="text-gray-400">Notifications</p>
                <p className="text-xl">Inbox (0)</p>
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
    )
}