import Image from "next/image"
import { useState, useEffect } from "react"
import DropDownMenu from "./dropDownMenu"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

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

    return (
        <div className="relative">
            <div
                onClick={toggleMenu}
                className="hidden lg:block cursor-pointer bg-purple-100 w-12 h-12 mr-5 rounded-full overflow-hidden border-gray-300"
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
            {showMenu && (
                <div className="fixed right-8 mt-2 z-50">
                    <DropDownMenu />
                </div>
            )}
        </div>
    )
}