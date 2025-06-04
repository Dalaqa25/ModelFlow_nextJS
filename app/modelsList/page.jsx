import { Search } from 'lucide-react';
import ModelBox from '@/app/components/model/modelBox';

export default function ModelsList() {
    return (
        <div className="mt-20 mx-auto w-[85%] max-w-[1500px]">
            <div className="flex w-ful mb-7 h-[55px] px-4">
                <div className="flex w-full items-center justify-center">
                    <div className="flex items-center bg-gray-100 rounded-xl px-3 p-1.5 sm:p-3 w-[100%] max-w-md mb-3 h-full">
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