import Request from "../components/request"

export default function Requests() { 
    return (
        <div className="mt-27 w-[80%] mx-auto">
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-5xl font-semibold">Requests</h1>
                <p className="text-xl font-light text-gray-500 mt-3">Suggest and discuss AI models to be created</p>
                <button className="btn-primary text-white py-3 text-lg px-10 rounded-xl mt-5">New Request</button>
            </div>
            <div className="flex flex-col items-center justify-center mt-20">
                <Request />
            </div>
        </div>
    )
}