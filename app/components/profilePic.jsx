import Image from "next/image"
import { useState } from "react"
import DropDownMenu from "./dropDownMenu"

export default function ProfilePic() {
    const [showMenu, setShowMenu] = useState(false)
    const toggleMenu = () => {
        setShowMenu(!showMenu)
    }
    return (
        <div className="relative">
            <div
                onClick={toggleMenu}
                className="hidden lg:block cursor-pointer bg-purple-100 w-13 h-13 mr-5 rounded-full overflow-hidden border-gray-300"
            >
                <Image
                    width={1024}
                    height={1024}
                    src="/default-image.png"
                    alt="Profile Picture"
                    className="w-full h-full object-cover"
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