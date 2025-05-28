import Image from "next/image"

export default function HomeBoxes() {
    return (
        <div className="w-[80%] sm:w-[90%] md:w-[80%] max-w-[1000px] h-[250px] sm:h-[350px] md:h-[500px] bg-gradient-to-l from-[#5c6bf0] to-gray-200 rounded-4xl shadow-2xl mx-auto mb-10 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
                <Image 
                    width={1024} 
                    height={1024} 
                    src="/cloud.png" 
                    alt="Home Boxes" 
                    className="w-full h-full object-cover object-center opacity-20"
                />
            </div>
            <div className="relative z-10 flex items-center justify-center p-3 sm:p-5 h-full text-center">
                <div className="flex flex-col items-center justify-center w-full">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
                        Built by developers, for businesses.
                    </h2>
                    <p className="text-gray-200 mt-2 text-sm sm:text-base md:text-lg">
                        Find, test, and implement AI models — fast and free.
                    </p>
                </div>
            </div>
        </div>
    )
}