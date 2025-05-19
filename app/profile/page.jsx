export default function Profile() {
    return (
        <>
            <div className="mt-30 w-[70%] max-w-[1500px] m-auto">
                <h1 className="text-5xl font-semibold">Profile</h1>
                <div className="flex flex-col gap-5 mt-25">
                    {/* purchaesed models */}
                    <div className="flex flex-col">
                        <h2 className="text-4xl mb-8">Purchased Models</h2>
                        <div className="flex flex-col gap-5">
                            <div className="border-1 border-gray-200 rounded-2xl">
                                <div className="flex justify-between w-full items-center py-5 px-10">
                                    <div className="flex gap-5">
                                        <img
                                            src="logo.png"
                                            alt="model"
                                            className="w-[100px] h-[100px] object-cover rounded-xl"
                                            sizes="(max-width: 1000px) 100vw, 500px"
                                        />
                                        <div className="flex flex-col gap-0.5">
                                            <h1 className="text-3xl">ImageNet Model</h1>
                                            <p className="font-light text-gray-400 text-lg">author: janedoe</p>
                                            <p className="font-light text-gray-400 text-lg">purchaesed: 05/12/2025</p>
                                        </div>
                                    </div>
                                    <button className="text-white button btn-primary px-8 text-xl py-4 rounded-xl">
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}