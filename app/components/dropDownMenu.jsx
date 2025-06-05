import { AiOutlinePlus } from "react-icons/ai";
import { FaDollarSign } from "react-icons/fa";
import { MdPrivacyTip } from "react-icons/md";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import { useState } from "react";

export default function DropDownMenu() {
    const [darkMode, setDarkMode] = useState(
        typeof window !== "undefined"
            ? document.documentElement.classList.contains("dark")
            : false
    );

    const toggleDarkMode = () => {
        if (typeof window !== "undefined") {
            document.documentElement.classList.toggle("dark");
            setDarkMode(document.documentElement.classList.contains("dark"));
        }
    };

    return (
        <div className="flex flex-col bg-white dark:bg-gray-900 shadow-lg rounded-lg w-[250px] p-3 z-50">
            <div className="cursor-pointer flex flex-col hover:bg-gray-100 rounded-lg transition-all p-2">
                <p className="text-gray-400">Profile</p>
                <p className="text-xl">Dallka</p>
            </div>
            <div className="cursor-pointer flex flex-col hover:bg-gray-100 rounded-lg transition-all p-2 mb-1.5">
                <p className="text-gray-400">Notifications</p>
                <p className="text-xl">Inbox (0)</p>
            </div>
                <hr className="border-gray-200 dark:border-gray-700"/>
            <div className="cursor-pointer items-center flex hover:bg-gray-100 rounded-lg transition-all p-2 mt-1.5">
                <AiOutlinePlus size={20} className="text-gray-400 mr-2" />
                <p className="text-xl">New Model</p>
            </div>
            <div className="cursor-pointer items-center flex hover:bg-gray-100 rounded-lg transition-all p-2 mt-1.5">
                <FaDollarSign size={20} className="text-gray-400 mr-2" />
                <p className="text-xl">Billing</p>
            </div>
            <div className="cursor-pointer items-center flex hover:bg-gray-100 rounded-lg transition-all p-2 mt-1.5 mb-1.5">
                <MdPrivacyTip size={20} className="text-gray-400 mr-2" />
                <p className="text-xl">Privacy</p>
            </div>
                <hr className="border-gray-200 dark:border-gray-700"/>
            <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all p-2 mt-1.5 mb-1.5"
            >
                <span className="text-xl">{darkMode ? "🌙" : "☀️"}</span>
                <span className="text-xl">
                    {darkMode ? "Dark Mode" : "Light Mode"}
                </span>
            </button>
            <hr className="border-gray-200 dark:border-gray-700"/>
            <LogoutLink className="cursor-pointer items-center flex hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all p-2 mt-1.5 text-gray-500">
                <p className="text-xl">Sign out</p>
            </LogoutLink>
        </div>
    )
}