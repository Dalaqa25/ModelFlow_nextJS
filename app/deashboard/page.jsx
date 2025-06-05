import PurchasedModels from "./purchasedModels"
import UploadedModels from "./uploadedModels"

export default function Profile() {
    return (
        <>
            <div className="mt-20 w-[70%] sm:w-[80%] md:w-[70%] max-w-[1500px] m-auto px-2">
                {/* header section */}
                <h1 className="text-5xl font-semibold">DeashBoard</h1>
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