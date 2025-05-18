import Image from 'next/image'
import { FiBookOpen } from 'react-icons/fi';

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
                <div className='flex flex-col gap-5 justify-center items-start w-full '>
                    <h1 className='text-5xl font-semibold'>ImageNet Model</h1>
                    <div className='flex justify-between w-full'>
                        <p className='font-light text-gray-400 text-lg'>author: <span className='hover:underline cursor-pointer'>janedoe</span></p>
                        <p className='font-light text-gray-400 text-lg'>05/12/2024</p>
                    </div>
                </div>
            </div>
            <div className='flex justify-between w-[95%] m-auto mb-10'>
                <div className='flex w-1/2 gap-2'>
                    <p className='font-light px-3 py-3 bg-gray-100 rounded-xl '>CNN</p>
                    <p className='font-light px-3 py-3 bg-gray-100 rounded-xl '>Vision</p>
                </div>
                <div className='flex gap-4'>
                    <button className='text-white button btn-primary px-8 text-lg py-3 rounded-xl'>Test Model</button>
                    <button className='text-black button bg-white shadow px-8 text-lg py-3 rounded-xl'>Download</button>
                </div>
            </div>
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
            {/* model description */}
            <div className='mt-10 mb-10 w-full flex flex-col gap-5'>
                <h2 className='text-4xl font-semibold'>Model Description</h2>
                <p className='font-light text-lg text-gray-600'>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
            </div>
            {/* model features */}
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
            <div className='mt-10 mb-10 w-full flex flex-col gap-5'>
                <h2 className='text-4xl font-semibold'>Key Features</h2>
                <div className='flex justify-between w-full'>
                    <ul className='list-disc pl-6 flex flex-col gap-3'>
                        <li className='font-light text-lg text-gray-600'>feature 1</li>
                        <li className='font-light text-lg text-gray-600'>feature 1</li>
                        <li className='font-light text-lg text-gray-600'>feature 1</li>
                        <li className='font-light text-lg text-gray-600'>feature 1</li>
                    </ul>
                    <FiBookOpen className="text-9xl text-gray-700" />
                </div>
            </div>
            {/* model features */}

        </section>
    )
}