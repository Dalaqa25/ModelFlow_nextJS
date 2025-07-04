import Image from "next/image"
import { useState, useEffect } from "react"
import DropDownMenu from "./dropDownMenu"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"
import { MdDashboard } from "react-icons/md";
import { FaRegCreditCard, FaRegEnvelope, FaCubes, FaRegGem, FaUser } from "react-icons/fa";
import { usePathname } from "next/navigation";

export default function ProfilePic() {
    const [showMenu, setShowMenu] = useState(false)
    const [profileImage, setProfileImage] = useState("/default-image.png")
    const [imageError, setImageError] = useState(false)
    const { user } = useKindeAuth()

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/user')
                if (!response.ok) {
                    throw new Error('Failed to fetch user data')
                }
                const data = await response.json()
                if (data.profileImageUrl) {
                    setProfileImage(data.profileImageUrl)
                    setImageError(false)
                }
            } catch (error) {
                console.error("Error fetching user data:", error)
                setProfileImage("/default-image.png")
            }
        }

        if (user) {
            fetchUserData()
        }
    }, [user])

    const toggleMenu = () => {
        setShowMenu(!showMenu)
    }

    const handleImageError = () => {
        setImageError(true)
        setProfileImage("/default-image.png")
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
            <div className="flex items-center gap-4">
                <span className="bg-purple-100 p-2 rounded-full flex items-center justify-center">
                    <IconComponent className="text-purple-500 text-2xl" />
                </span>
                <div
                    onClick={toggleMenu}
                    className="cursor-pointer w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200 hover:scale-105 transition"
                >
                    <Image
                        width={48}
                        height={48}
                        src={imageError ? "/default-image.png" : profileImage}
                        alt="Profile Picture"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        priority
                    />
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