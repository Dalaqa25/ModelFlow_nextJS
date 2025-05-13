import { Search } from 'lucide-react';
import ModelBox from 'app/components/modelBox';

export default function ModelsList() {
    return (
        <div className="mt-15 mx-auto w-[80%] max-w-[1500px] ">
            <div className="flex justify-between items-center h-full px-4">
                <div className="flex flex-col p-4 w-full">
                    <h1 className="text-6xl font-semibold">
                        Available AI Models
                    </h1>
                    <p className="text-gray-600 text-lg mt-5 mb-7">
                        Browse and download top pre-trained models
                    </p>
                    <div className="flex items-center bg-gray-100 rounded-xl px-3 py-3 w-[75%] max-w-md">
                        <Search className="w-6 h-6 text-gray-600 mr-2" />
                        <input
                            type="text"
                            placeholder="Search for a model..."
                            className="bg-transparent focus:outline-none w-full text-lg text-gray-800 placeholder-gray-600"
                        />
                    </div>
                </div>
            </div>
            <ModelBox />
        </div>
    )
}