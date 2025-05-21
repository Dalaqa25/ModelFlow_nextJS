'use client'
import Request from "../components/request"
import RequestBox from "../components/requestBox"
import { useState } from "react"

export default function Requests() { 
    const [ isClicked, setIsClicked ] = useState(false)
    return (
        <>
            {/* Overlay with transition */}
            <div
                className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${isClicked ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsClicked(false)}
                style={{ transitionProperty: 'opacity' }}>
            </div>
            <div className="mt-27 w-[80%] mx-auto">
                <div className="flex flex-col items-center justify-center">
                    <h1 className="text-5xl font-semibold">Requests</h1>
                    <p className="text-xl font-light text-gray-500 mt-3">Suggest and discuss AI models to be created</p>
                    <button onClick={() => setIsClicked(true)} className="btn-primary text-white py-3 text-lg px-10 rounded-xl mt-5 hover:shadow-lg hover:scale-105">New Request</button>
                    {isClicked && <RequestBox/>}
                </div>
                <div className="flex flex-col items-center justify-center mt-20 gap-5">
                    <Request />
                    <Request />
                    <Request />
                    <Request />
                </div>
            </div>
        </>
    )
}