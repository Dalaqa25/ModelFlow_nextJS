import PurchasedModels from "./purchasedModels"
import UploadedModels from "./uploadedModels"
import Image from "next/image"

export default function Profile() {
    return (
        <>
            <div className="mt-20 w-[70%] sm:w-[80%] md:w-[70%] max-w-[1500px] m-auto px-2">
                {/* header section */}
                <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-8 md:gap-0">
                    <div className="w-full hidden sm:block md:w-auto">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-3 sm:mb-5">Profile</h1>
                        <p className="text-base sm:text-lg">Username: <span className="text-gray-400">@Dalakka25</span></p>
                        <p className="text-base sm:text-lg">Status: <span className="text-gray-400">Active</span></p>
                        <p className="text-base sm:text-lg">Plan: <span className="text-gray-400">Free</span></p>
                    </div>
                    <div className="w-full text-center block sm:hidden md:w-auto">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-3 sm:mb-5">Profile</h1>
                        <p className="text-lg font-semibold">Giorgi Dalakishvili</p>
                    </div>
                    <div className="relative flex items-center justify-center w-40 h-40 sm:w-40 sm:h-40 md:w-40 md:h-40 border border-gray-300 rounded-full">
                        <Image
                            src="/plansImg2.png"
                            alt="main/profile image"
                            fill
                            className="object-contain rounded-full"
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 160px"
                        />
                    </div>
                </div>
                <hr className="border border-gray-300 mt-5"/>
                <div className="flex flex-col gap-5 mt-10 sm:mt-16 md:mt-20">
                    {/* Purchased models */}
                    <PurchasedModels />
                    {/* Uploaded Models */}
                    <UploadedModels />
                </div>
            </div>
        </>
    )
}