"use client";
import { use } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import ModelDescription from "./modelDescription";
import ModelFeatures from "./modelFeatures";
import UseCases from "./useCases";
import HowToUse from "./howToUse";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";
import DefaultModelImage from "@/app/components/model/defaultModelImage";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { toast } from "react-hot-toast";
import ConfirmationDialog from "@/app/components/confirmationDialog/ConfirmationDialog";

export default function Model(props) {
    const params = use(props.params);
    const { isAuthenticated, user } = useKindeAuth();
    const router = useRouter();
    const [model, setModel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

    useEffect(() => {
        const fetchModel = async () => {
            try {
                const res = await fetch(`/api/models/${params.model}`);
                const data = await res.json();
                setModel(data);
                setLikeCount(data.likes || 0);
                if (isAuthenticated && data.likedBy?.includes(user?.email)) {
                    setIsLiked(true);
                }
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch model:", error);
            }
        };
        fetchModel();
    }, [params.model, isAuthenticated, user]);

    const handleLike = async () => {
        if (!isAuthenticated) {
            toast.error("Please sign in to like models");
            return;
        }

        try {
            const res = await fetch(`/api/models/${params.model}/like`, {
                method: 'POST',
            });

            if (res.ok) {
                const data = await res.json();
                setLikeCount(data.likes);
                setIsLiked(true);
                toast.success("Model liked successfully!");
            } else {
                const error = await res.json();
                if (error.error === "Already liked") {
                    toast.error("You've already liked this model");
                } else {
                    toast.error("Failed to like model");
                }
            }
        } catch (error) {
            console.error("Error liking model:", error);
            toast.error("Failed to like model");
        }
    };

    const handlePurchase = () => {
        if (isAuthenticated) {
            setIsPurchaseDialogOpen(true);
        }
    };

    const handleConfirmPurchase = async () => {
        try {
            const res = await fetch(`/api/models/${params.model}/purchase`, {
                method: 'POST',
            });

            if (res.ok) {
                const data = await res.json();
                toast.success("Model purchased successfully!");
                setIsPurchaseDialogOpen(false);
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to purchase model");
            }
        } catch (error) {
            console.error("Error purchasing model:", error);
            toast.error("Failed to purchase model");
        }
    };

    if (loading) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    if (!model) {
        return <div className="text-center mt-10 text-red-500">Model not found.</div>;
    }

    return (
        <section className='mt-4 sm:mt-17 w-[90%] sm:w-[70%] max-w-[1500px] mx-auto px-2 sm:px-6'>
            {/* header section */}
            <div className='flex flex-col sm:flex-row gap-4 sm:gap-8'>
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto sm:mx-0 rounded-xl overflow-hidden">
                    {model.imgUrl ? (
                        <img 
                            src={model.imgUrl} 
                            alt={model.name} 
                            className='w-full h-full object-cover rounded-xl'
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full">
                            <DefaultModelImage size="large" />
                        </div>
                    )}
                </div>
                <div className='flex flex-col gap-2 justify-center items-center sm:items-start w-full sm:gap-5'>
                    <h1 className='text-xl sm:text-2xl md:text-4xl lg:text-5xl font-semibold text-center sm:text-left'>
                        {model.name}
                    </h1>
                    <div className='flex flex-col sm:flex-row justify-between w-full gap-2 sm:gap-0'>
                        <p className='font-light text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg text-center sm:text-left'>
                            author: <span 
                                onClick={() => router.push(`/profile/${model.authorEmail || model.author?.name}`)}
                                className='hover:underline cursor-pointer'
                            >
                                {model.authorEmail || model.author?.name}
                            </span>
                        </p>
                        <div className='flex items-center gap-2'>
                            <button
                                onClick={handleLike}
                                disabled={isLiked}
                                className={`flex items-center gap-1.5 ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-purple-500'} transition-colors`}
                            >
                                {isLiked ? <FaHeart /> : <FaRegHeart />}
                                <span>{likeCount}</span>
                            </button>
                            <span className='text-gray-400'>•</span>
                            <p className='text-gray-500 text-sm'>Created at {new Date(model.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 w-full sm:w-[100%] mx-auto my-6 sm:mb-10'>
                <div className='flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start'>
                    {model.tags.map((tag, index) => (
                        <p key={index} className='px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm font-medium border border-purple-100 hover:bg-purple-100 transition-colors text-center min-w-[80px] flex items-center justify-center'>
                            {tag}
                        </p>
                    ))}
                </div>
                <div className='flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto'>
                    <button className='w-full sm:w-auto text-white button btn-primary px-3 py-2 text-sm sm:text-base lg:text-lg rounded-xl hover:bg-purple-700 transition-colors duration-200'>
                        Test Model
                    </button>
                    {isAuthenticated ? (
                        <button 
                            onClick={handlePurchase}
                            className='w-full sm:w-auto text-black button bg-white shadow px-3 py-2 text-sm sm:text-base lg:text-lg rounded-xl hover:bg-gray-100 transition-colors duration-200'
                        >
                            Purchase
                        </button>
                    ) : (
                        <LoginLink className='w-full sm:w-auto text-black button bg-white shadow px-3 py-2 text-sm sm:text-base lg:text-lg rounded-xl text-center hover:bg-gray-100 transition-colors duration-200'>
                            Sign in to Purchase
                        </LoginLink>
                    )}
                </div>
            </div>

            <div className='space-y-6 sm:space-y-8'>
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                <ModelDescription description={model.description} />
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                <ModelFeatures features={model.features} />
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                <UseCases useCases={model.useCases} />
                <hr className='w-full bg-gray-100 border-0.5 border-gray-300' />
                <HowToUse setup={model.setup} />    
            </div>

            <ConfirmationDialog
                isOpen={isPurchaseDialogOpen}
                onClose={() => setIsPurchaseDialogOpen(false)}
                onConfirm={handleConfirmPurchase}
                title="Confirm Purchase"
                description={`Are you sure you want to purchase ${model.name}? This action will redirect you to the payment page.`}
            />
        </section>
    );
}