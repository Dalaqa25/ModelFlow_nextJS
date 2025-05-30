export default function PurchasedModels() {
    return (
        <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between w-full gap-2 sm:gap-0 mb-4 sm:mb-0">
                <h2 className="text-xl mb-4 sm:mb-8 sm:text-2xl md:text-4xl">Purchased Models</h2>
                <h2 className="text-sm font-light text-gray-400 sm:text-base md:text-lg">
                    Purchased: <span>1</span>
                </h2>
            </div>
            <div className="flex flex-col gap-5">
                <div className="border-1 border-gray-200 rounded-2xl">
                    <div className="flex flex-col sm:flex-row justify-between w-full items-center py-4 px-4 sm:py-5 sm:px-10 gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center">
                            <img
                                src="logo.png"
                                alt="model"
                                className="w-20 h-20 sm:w-[80px] sm:h-[80px] md:w-[100px] md:h-[100px] object-cover rounded-xl"
                                sizes="(max-width: 640px) 80px, (max-width: 768px) 100px, 100px"
                            />
                            <div className="flex flex-col gap-0.5 text-center sm:text-left">
                                <h1 className="text-lg sm:text-xl md:text-3xl">ImageNet Model</h1>
                                <p className="font-light text-gray-400 text-sm sm:text-base md:text-lg">author: janedoe</p>
                                <p className="font-light text-gray-400 text-sm sm:text-base md:text-lg">purchased: 05/12/2025</p>
                            </div>
                        </div>
                        <button className="text-white button btn-primary px-4 py-2 text-base rounded-xl sm:px-6 sm:py-3 sm:text-lg md:px-8 md:py-4 md:text-xl mt-4 sm:mt-0">
                            Download
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}