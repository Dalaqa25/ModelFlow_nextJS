"use client";
import Image from 'next/image'
import ModelDescription from './modelDescription';
import ModelFeatures from './modelFeatures';
import UseCases from './useCases';
import HowToUse from './howToUse';
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";

export default function Model({ params }) {
    const { isAuthenticated } = useKindeAuth();
    const router = useRouter();

    const handlePurchase = () => {
        if (isAuthenticated) {
            router.push(`/purchase/${params.model}`);
        }
    };

    return (
        <section className='mt-4 sm:mt-17 w-[90%] sm:w-[70%] max-w-[1500px] mx-auto px-2 sm:px-6'>
            {/* header section */}
            <div className='flex flex-col sm:flex-row gap-4 sm:gap-0'>
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto sm:mx-0">
                    <Image
                        src="/PlansImg2.png"
                        alt="main/profile image"
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 96px, (max-width: 1024px) 128px, 128px"
                    />
                </div>
                <div className='flex flex-col gap-2 justify-center items-center sm:items-start w-full sm:gap-5'>
                    <h1 className='text-xl sm:text-2xl md:text-4xl lg:text-5xl font-semibold text-center sm:text-left'>
                        ImageNet Model
                    </h1>
                    <div className='flex flex-col sm:flex-row justify-between w-full gap-2 sm:gap-0'>
                        <p className='font-light text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg text-center sm:text-left'>
                            author: <span className='hover:underline cursor-pointer'>janedoe</span>
                        </p>
                        <p className='font-light text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg text-center sm:text-left'>
                            05/12/2024
                        </p>
                    </div>
                </div>
            </div>

            <div className='flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 w-full sm:w-[95%] mx-auto my-6 sm:mb-10'>
                <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                    <p className='font-light px-3 py-2 sm:py-3 bg-gray-100 rounded-xl text-center'>CNN</p>
                    <p className='font-light px-3 py-2 sm:py-3 bg-gray-100 rounded-xl text-center'>Vision</p>
                </div>
                <div className='flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto'>
                    <button className='w-full sm:w-auto text-white button btn-primary px-3 py-2 text-sm sm:text-base lg:text-lg rounded-xl'>
                        Test Model
                    </button>
                    {isAuthenticated ? (
                        <button 
                            onClick={handlePurchase}
                            className='w-full sm:w-auto text-black button bg-white shadow px-3 py-2 text-sm sm:text-base lg:text-lg rounded-xl'
                        >
                            Purchase
                        </button>
                    ) : (
                        <LoginLink className='w-full sm:w-auto text-black button bg-white shadow px-3 py-2 text-sm sm:text-base lg:text-lg rounded-xl text-center'>
                            Sign in to Purchase
                        </LoginLink>
                    )}
                </div>
            </div>

            <div className='space-y-6 sm:space-y-8'>
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                <ModelDescription />
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                <ModelFeatures />
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                <UseCases />
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                <HowToUse />    
            </div>
        </section>
    );
}