'use client'
import Request from "../components/requests/request"
import RequestBox from "../components/requests/requestBox"
import { useState } from "react"

export default function Requests() { 
    const [ isClicked, setIsClicked ] = useState(false)
    return (
        <>
            <div
                className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${isClicked ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsClicked(false)}
                style={{ transitionProperty: 'opacity' }}>
            </div>
            <div className="mt-20 sm:mt-27 w-[92%] sm:w-[85%] mx-auto">
                <div className="flex flex-col items-center justify-center">
                    <h1 className="text-3xl sm:text-5xl font-semibold text-center">Requests</h1>
                    <p className="text-sm sm:text-lg font-light text-gray-500 mt-2 sm:mt-3 px-4 text-center">
                        Suggest and discuss AI models to be created
                    </p>
                    <button 
                        onClick={() => setIsClicked(true)} 
                        className="btn-primary text-white py-2.5 sm:py-3 text-base sm:text-lg px-8 sm:px-10 rounded-xl mt-4 sm:mt-5 hover:shadow-lg hover:scale-105"
                    >
                        New Request
                    </button>
                    {isClicked && <RequestBox/>}
                </div>
                <div className="flex flex-col items-center justify-center mt-12 sm:mt-20 gap-3 sm:gap-5">
                    <Request />
                    <Request />
                    <Request />
                    <Request />
                </div>
            </div>
        </>
    )
}