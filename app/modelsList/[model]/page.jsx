import Image from 'next/image'

export default async function Model({ params }) {
    return (
        <section className='mt-17 w-[70%] max-w-[1500px] m-auto'>
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
            <div className='flex justify-between w-[95%] m-auto'>
                <div className='flex w-1/2 gap-2'>
                    <p className='font-light px-3 py-3 bg-gray-100 rounded-xl '>CNN</p>
                    <p className='font-light px-3 py-3 bg-gray-100 rounded-xl '>Vision</p>
                </div>
                <div className='flex gap-4'>
                    <button className='text-white button btn-primary px-8 text-lg py-3 rounded-xl'>Test Model</button>
                    <button className='text-black button bg-white shadow px-8 text-lg py-3 rounded-xl'>Download</button>
                </div>
            </div>
        </section>
    )
}