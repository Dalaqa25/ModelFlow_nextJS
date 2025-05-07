import { Search } from 'lucide-react';

export default function ModelsList() {
    return (
        <div className='mt-25 m-auto w-[85%] max-w-[1200px]'>
                <div className='flex flex-col'>
                    <h1 className='text-6xl font-semibold '>
                        Available AI Models
                    </h1>
                    <p className='text-gray-600 text-[18px] mt-5 mb-7'>Browse and download top pre-trained models</p>
                    <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 w-full max-w-md">
                        <Search className="w-6 h-6 text-gray-600 mr-2" />
                        <input
                            type="text"
                            placeholder="Search for a model..."
                            className="bg-transparent focus:outline-none w-full text-lg text-gray-800 placeholder-gray-600"
                        />
                    </div>
                </div>
                <img src='herolist.png' alt='herolistPng' className='w-[23%] absolute right-[15%] mb-5 top-[10%]' />
        </div>
    )
}