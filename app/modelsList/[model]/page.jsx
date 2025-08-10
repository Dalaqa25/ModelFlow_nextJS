"use client";
import { use } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import ModelDescription from "./modelDescription";
import ModelFeatures from "./modelFeatures";
import UseCases from "./useCases";
import HowToUse from "./howToUse";
import { useRouter } from "next/navigation";
import DefaultModelImage from "@/app/components/model/defaultModelImage";
import { FaHeart, FaRegHeart, FaPlay, FaShoppingCart } from "react-icons/fa";
import { toast } from "react-hot-toast";
import ConfirmationDialog from "@/app/components/confirmationDialog/ConfirmationDialog";
import { useAuth } from "@/lib/supabase-auth-context";

import { createCheckoutUrl } from "@/lib/lemon/server";

export default function Model(props) {
    const params = use(props.params);
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [model, setModel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
    const [isOwned, setIsOwned] = useState(false);
    const [isAuthor, setIsAuthor] = useState(false);
    const [checkoutURL, setCheckoutURL] = useState(null);

    useEffect(() => {
        const fetchModel = async () => {
            try {
                const res = await fetch(`/api/models/${params.model}`);
                const data = await res.json();
                setModel(data);
                setLikeCount(data.likes || 0);
                // Check if user is the author
                setIsAuthor(isAuthenticated && user?.email === data.authorEmail);
                // Check if user owns the model (only if authenticated)
                if (isAuthenticated) {
                    const purchasedRes = await fetch('/api/user/purchased-models');
                    if (purchasedRes.ok) {
                        const purchasedModels = await purchasedRes.json();
                        setIsOwned(purchasedModels.some(m => m.id === data.id));
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch model:", error);
            }
        };
        fetchModel();
    }, [params.model, isAuthenticated, user]);

    // Generate checkout URL when component mounts and user is authenticated
    useEffect(() => {
        const generateCheckoutURL = async () => {
            if (isAuthenticated && !isOwned && !isAuthor && model) {
                try {
                    const url = await createCheckoutUrl({
                        price: model.price,
                        userEmail: user?.email || null,
                        userId: user?.id || null,
                        modelId: model.id,
                        modelName: model.name,
                        authorEmail: model.authorEmail,
                        embed: false
                    });
                    setCheckoutURL(url);
                } catch (error) {
                    console.error("Failed to generate checkout URL:", error);
                }
            }
        };
        
        generateCheckoutURL();
    }, [isOwned, isAuthor, model, isAuthenticated, user]);

    const handleLike = async () => {
        if (!isAuthenticated) {
            toast.error("Please sign in to like models");
            return;
        }
        // Add like functionality here if needed
    };

    const handlePurchase = () => {
        if (!isAuthenticated) {
            toast.error("Please sign in to purchase models");
            return;
        }
        setIsPurchaseDialogOpen(true);
    };

    const handleConfirmPurchase = () => {
                setIsPurchaseDialogOpen(false);
        if (checkoutURL) {
            window.location.href = checkoutURL;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
                <svg className="animate-spin h-12 w-12 text-purple-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span className="text-lg text-purple-500 font-semibold">Loading...</span>
            </div>
        );
    }

    if (!model) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                </svg>
                <span className="text-lg text-red-500 font-semibold">Sorry, this model could not be found.</span>
                <span className="text-gray-500 mt-2">It may have been removed or the link is incorrect.</span>
            </div>
        );
    }

    return (
        <section className='mt-10 sm:mt-17 w-[90%] sm:w-[70%] max-w-[1500px] mx-auto px-2 sm:px-6'>
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
                                disabled={!isAuthenticated}
                                className={`flex items-center gap-1.5 ${isAuthenticated ? 'text-gray-500 hover:text-purple-500' : 'text-gray-400 cursor-not-allowed'} transition-colors`}
                                title={!isAuthenticated ? "Please sign in to like models" : ""}
                            >
                                <FaRegHeart />
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
                    <button
                        onClick={() => {
                            if (!isAuthenticated) {
                                toast.error("Please sign in to test models");
                                return;
                            }
                            // Add test model functionality here
                        }}
                        disabled={!isAuthenticated}
                        className={`group w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 text-sm sm:text-base lg:text-lg rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 active:scale-95 shadow-md ${
                            isAuthenticated
                                ? 'text-white button btn-primary hover:bg-purple-700'
                                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        }`}
                        title={!isAuthenticated ? "Please sign in to test models" : "Test this model"}
                    >
                        <FaPlay className="transition-transform duration-200 group-hover:scale-125 group-hover:text-purple-200" />
                        Test Model
                    </button>
                    {isAuthor ? (
                        <button 
                            disabled
                            className='w-full sm:w-auto text-gray-400 button bg-gray-100 shadow px-3 py-2 text-sm sm:text-base lg:text-lg rounded-xl cursor-not-allowed'
                            title="You are the author of this model."
                        >
                            Your Model
                        </button>
                    ) : isOwned ? (
                        <button 
                            disabled
                            className='w-full sm:w-auto text-gray-400 button bg-gray-100 shadow px-3 py-2 text-sm sm:text-base lg:text-lg rounded-xl cursor-not-allowed'
                            title="You have already purchased this model."
                        >
                            Already Purchased
                        </button>
                    ) : (
                        <button
                            onClick={handlePurchase}
                            disabled={!isAuthenticated || !checkoutURL}
                            className={`group w-full sm:w-auto flex items-center justify-center gap-2 text-black button bg-white shadow px-3 py-2 text-sm sm:text-base lg:text-lg rounded-xl hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 active:scale-95 ${(!isAuthenticated || !checkoutURL) ? 'cursor-not-allowed text-gray-400 bg-gray-100' : ''}`}
                            title={
                                !isAuthenticated
                                    ? "Please sign in to purchase models"
                                    : checkoutURL
                                        ? "Purchase this model"
                                        : "Loading checkout..."
                            }
                        >
                            <FaShoppingCart className="transition-transform duration-200 group-hover:scale-125 group-hover:text-purple-500" />
                            {!isAuthenticated ? 'Sign in to Purchase' : checkoutURL ? 'Purchase' : 'Loading...'}
                        </button>
                    )}
                
                </div>
            </div>

            <div className='space-y-6 sm:space-y-8'>
                <ModelDescription description={model.description} />
                <ModelFeatures features={model.features} />
                <UseCases useCases={model.useCases} />
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