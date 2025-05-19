import Image from 'next/image'
import ModelDescription from './modelDescription';
import ModelFeatures from './modelFeatures';
import UseCases from './useCases';
import HowToUse from './howToUse';

export default async function Model({ params }) {
    return (
        <section className='mt-17 w-[70%] max-w-[1500px] m-auto bor'>
            {/* header section */}
            <div className='flex'>
                <div className="relative w-32 h-32 sm:w-70 sm:h-50">
                    <Image
                        src="/PlansImg2.png"
                        alt="main/profile image"
                        fill
                        className="object-contain"
                        sizes="(max-width: 1000px) 100vw, 500px"
                    />
                </div>
                <div className='flex flex-col gap-2 justify-center items-start w-full sm:gap-5'>
                    <h1 className='text-2xl lg:text-5xl md:text-4xl sm:text-3xl font-semibold'>ImageNet Model</h1>
                    <div className='flex justify-between w-full'>
                        <p className='font-light text-gray-400 text-sm lg:text-lg md:text-base sm:text-sm'>author: <span className='hover:underline cursor-pointer'>janedoe</span></p>
                        <p className='font-light text-gray-400 text-sm lg:text-lg md:text-base sm:text-sm'>05/12/2024</p>
                    </div>
                </div>
            </div>
            <div className='flex justify-between w-[95%] m-auto mb-10 '>
                <div className='flex flex-col gap-2 sm:flex-row'>
                    <p className='font-light px-3 py-3 bg-gray-100 rounded-xl '>CNN</p>
                    <p className='font-light px-3 py-3 bg-gray-100 rounded-xl '>Vision</p>
                </div>
                <div className='flex flex-col gap-4 sm:flex-row'>
                    <button className='text-white button btn-primary px-3 text-lg py-2 rounded-xl lg:text-lg md:text-base sm:text-sm lg:px-8 md:px-5 sm:px-2'>Test Model</button>
                    <button className='text-black button bg-white shadow px-3 text-lg py-2 rounded-xl lg:text-lg md:text-base sm:text-sm'>Purchase</button>
                </div>
            </div>
            <div>
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                {/* model description */}
                <ModelDescription />
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                {/* model features */}
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                <ModelFeatures />
                {/* use cases */}
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                <UseCases />
                {/* How to use */}
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                <HowToUse />    
            </div>
        </section>
    )
}