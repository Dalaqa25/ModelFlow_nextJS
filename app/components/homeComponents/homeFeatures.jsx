import Image from 'next/image';

export default function HomeSecurity() {
    return (
        <div className="w-[70%] max-w-[1400px] mx-auto flex flex-col gap-20">
            
            {/* Security Section */}
            <div className="w-full bg-[#f4f3fb] flex items-center justify-center-safe gap-25 rounded-3xl">
                <Image
                    src="/security.png"
                    alt="Security Image"
                    width={1024}
                    height={1024}
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-100 md:h-100 object-contain"/>  

                <div className='mr-20'>
                    <h1 className='text-7xl font-semibold'>Built for <br/> Security</h1>
                    <p className='text-3xl text-gray-600 mt-2 font-light'>Security featuers designed <br/>to protect your models</p>
                </div>
            </div>

            {/* middle (ease upload) */}
            <div className='w-full flex items-center justify-between'>
                <div className='ml-15'>
                    <h1 className='text-7xl font-semibold'>Streamlined <br/>Workflow</h1>
                    <p className='text-3xl text-gray-600 mt-2 font-light'>Upload,manage and <br/>deploy models with ease</p>
                </div>
                <Image
                    src="/flyingRobot.png"
                    alt="flyng Robot Image"
                    width={1024}
                    height={1024}
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-100 md:h-100 object-contain"/>
            </div>

            {/* search models */}
            <div className='w-full max-h-[400px] flex bg-[#d3ccfe] items-center justify-between rounded-3xl overflow-y-hidden mb-20 shadow'>
                <Image
                    src="/phone.svg"
                    alt="Phone svg Image"
                    width={1024}
                    height={1024}
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-150 md:h-150 object-contain mt-70"/>

                <div className='mr-15'>
                    <h1 className='text-7xl font-semibold'>Explore<br/>AI Models</h1>
                    <p className='text-3xl text-gray-600 mt-2 font-light'>Upload,manage and <br/>deploy models with ease</p>
                </div>
            </div>

        </div>
    )
}