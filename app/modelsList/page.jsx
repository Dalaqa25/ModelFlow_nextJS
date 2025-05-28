import { Search } from 'lucide-react';
import ModelBox from '@/app/components/model/modelBox';

export default function ModelsList() {
    return (
        <div className="mt-15 mx-auto w-[80%] max-w-[1500px]">
            <div className="flex h-full px-4">
                <div className="flex flex-col items-center p-4 w-full">
                    <h1 className="text-2xl mb-4 sm:mb-0 sm:text-5xl md:text-6xl font-semibold">
                        Available <span style={{color:'#6472ef'}}>AI</span> Models
                    </h1>
                    <p className="text-gray-600 hidden sm:text-lg sm:block mt-4 mb-4">
                        Browse and download top pre-trained models
                    </p>
                    <div className="flex items-center bg-gray-100 rounded-xl px-3 p-1.5 sm:p-3 w-[100%] max-w-md mb-3">
                        <Search className="w-6 h-6 text-gray-600 mr-2" />
                        <input
                            type="text"
                            placeholder="Search for a model..."
                            className="bg-transparent focus:outline-none w-full text-lg text-gray-800 placeholder-gray-600"/>
                    </div>
                </div>
            </div>
            <ModelBox />
        </div>
    )
}