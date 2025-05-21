import { FaRegComment,FaRegUser } from 'react-icons/fa';

export default function Request() { 
    return (
        <div className="w-[60%] border-1 rounded-2xl border-gray-200 rounded-xgap-2.5 cursor-pointer hover:shadow transition-all duration-300 ease-in-out">
            <div className="p-5 flex flex-col gap-3">
                <h1 className="text-2xl font-semibold">Chatpot with Personality</h1>
                <p className="font-light text-gray-600">A AI chatbot can engange users with unique patterns and moods</p>
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        <p className="text-purple-800 rounded-xl font-light px-3 py-0.5 bg-[rgba(78,96,255,0.14)]">Chatbot</p>
                        <p className="text-purple-800 rounded-xl px-3 py-0.5 bg-[rgba(78,96,255,0.14)]">NLP</p>
                    </div>
                    <div className='flex gap-2'>
                        <FaRegComment className="cursor-pointer text-gray-500 hover:text-blue-500 text-xl" /><span className='text-gray-500'>12</span>
                    </div>
                </div>
                <div className='flex mt-1 items-center text-sm'>
                    <div className=' flex items-center gap-2 text-gray-500'>
                        <FaRegUser/>
                        <p>Giorgi Dalakishvili</p>
                    </div>
                    <div className='flex items-center gap-2 text-gray-500 font-light ml-auto'>
                        <p>Created on</p>
                        <p className='text-gray-500'>12/12/2023</p>
                    </div>
                </div>
            </div>
        </div>
    )
}