import Image from "next/image"
import { useState, useEffect } from "react"
import DropDownMenu from "./dropDownMenu"
import { useAuth } from "@/lib/supabase-auth-context"
import { MdDashboard } from "react-icons/md";
import { FaRegCreditCard, FaRegEnvelope, FaCubes, FaRegGem, FaUser } from "react-icons/fa";
import { usePathname } from "next/navigation";

export default function ProfilePic() {
    const [showMenu, setShowMenu] = useState(false)
    const [profileImage, setProfileImage] = useState(null)
    const [imageError, setImageError] = useState(false)
    const { user, loading: isLoading } = useAuth()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                console.log('ProfilePic - Fetching user data for:', user?.email);
                const response = await fetch('/api/user', { credentials: 'include' });
                if (!response.ok) {
                    console.error('ProfilePic - API response not ok:', response.status, response.statusText);
                    throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`)
                }
                const data = await response.json()
                console.log('ProfilePic - User data received:', data ? 'Success' : 'No data');
                if (data.profileImageUrl) {
                    setProfileImage(data.profileImageUrl)
                    setImageError(false)
                }
            } catch (error) {
                console.error("ProfilePic - Error fetching user data:", error)
                setProfileImage(null)
                // Don't throw the error, just log it and continue
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            setLoading(true)
            fetchUserData()
        } else {
            setLoading(false)
        }
    }, [user])

    const toggleMenu = () => {
        setShowMenu(!showMenu)
    }

    const handleImageError = () => {
        setImageError(true)
        setProfileImage(null)
    }

    const pathname = usePathname();

    let IconComponent = MdDashboard;
    if (pathname.startsWith("/modelsList")) {
        IconComponent = FaCubes;
    } else if (pathname.startsWith("/plans")) {
        IconComponent = FaRegGem;
    } else if (pathname.startsWith("/requests")) {
        IconComponent = FaRegEnvelope;
    } else if (pathname.startsWith("/dashboard")) {
        IconComponent = MdDashboard;
    } else if (pathname.startsWith("/profile")) {
        IconComponent = FaUser;
    }

    return (
        <div className="relative hidden lg:flex items-center rounded-2xl px-4 py-2">
            <style jsx>{`
                .glow-animate {
                    position: relative;
                    overflow: hidden;
                }
                .glow-animate::after {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(90deg, rgba(229,231,235,0) 0%, rgba(168,85,247,0.3) 50%, rgba(229,231,235,0) 100%);
                    animation: shimmer 1.2s infinite;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
            <div className="flex items-center gap-4">
                <span className="bg-purple-100 p-2 rounded-full flex items-center justify-center">
                    <IconComponent className="text-purple-500 text-2xl" />
                </span>
                <div
                    onClick={toggleMenu}
                    className="cursor-pointer w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200 hover:scale-105 transition flex items-center justify-center"
                >
                    {(loading || isLoading) ? (
                        <div className="w-full h-full bg-gray-200 rounded-full glow-animate" />
                    ) : profileImage && !imageError ? (
                        <Image
                            width={48}
                            height={48}
                            src={profileImage}
                            alt="Profile Picture"
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                            priority
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 rounded-full" />
                    )}
                </div>
            </div>
            {showMenu && (
                <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] bg-white rounded-xl py-2">
                    <DropDownMenu />
                </div>
            )}
        </div>
    )
}