import { Search } from 'lucide-react';

export default function ModelsList() {
    return (
        <div className="mt-15 mx-auto w-[85%] shadow rounded max-w-[1200px] h-90">
            <div className="flex justify-between items-center h-full px-4">
                {/* Text and Search Section */}
                <div className="flex flex-col p-4 ">
                    <h1 className="text-6xl font-semibold">
                        Available AI Models
                    </h1>
                    <p className="text-gray-600 text-lg mt-5 mb-7">
                        Browse and download top pre-trained models
                    </p>
                    <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 w-full max-w-md">
                        <Search className="w-6 h-6 text-gray-600 mr-2" />
                        <input
                            type="text"
                            placeholder="Search for a model..."
                            className="bg-transparent focus:outline-none w-full text-lg text-gray-800 placeholder-gray-600"
                        />
                    </div>
                </div>
                {/* Image Section */}
                <div className="w-1/3 flex justify-center h-full ">
                    <img
                        src="herolist.png"
                        alt="herolist"
                        className="w-full min-w-[350px] h-ful object-cover"
                    />
                </div>
            </div>
        </div>

    )
}