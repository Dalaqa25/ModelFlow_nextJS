import Image from "next/image"

export default function ProfilePic() {
    return (
        <div className="hidden lg:block cursor-pointer bg-purple-100 w-15 h-15 mr-5 rounded-full overflow-hidden border-gray-300">
            <Image
                width={1024}
                height={1024}
                src="/default-image.png"
                alt="Profile Picture"
                className="w-full h-full object-cover"
            />
        </div>
    )
}