"use client"
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";

export default function Profile() { 
    return (
        <div className="min-h-screen mt-10 bg-gradient-to-b from-white to-blue-50 py-12 px-6">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-3xl p-8">
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <img
                        src="/default-image.png"
                        alt="User Avatar"
                        className="w-28 h-28 rounded-full border-4 border-indigo-300 shadow-md"
                    />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Jane Cooper</h2>
                        <p className="text-sm text-gray-500">@janecooper</p>
                    </div>
                    <div className="flex justify-center gap-4">
                        <button className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition">
                            Edit Profile
                        </button>
                        <LogoutLink className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
                            Sign Out
                        </LogoutLink>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="flex justify-around text-center mt-10">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700">12</h3>
                        <p className="text-sm text-gray-500">Models Uploaded</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700">5</h3>
                        <p className="text-sm text-gray-500">Models Sold</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700">$240</h3>
                        <p className="text-sm text-gray-500">Revenue</p>
                    </div>
                </div>

                {/* About Me Section */}
                <div className="mt-12">
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">About Me</h4>
                    <p className="text-gray-600 text-base">
                        Hi! I'm Jane, a passionate machine learning engineer with a love for building and sharing AI models. 
                        I enjoy working on NLP and computer vision projects, and I'm always eager to collaborate and learn new things!
                    </p>
                </div>

                {/* Uploaded Models Section */}
                <div className="mt-12">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Your Models</h4>
                    <div className="space-y-4">
                        {/* Single model box */}
                        <div className="p-4 border border-gray-100 rounded-xl shadow-sm flex justify-between items-center">
                            <div>
                                <h5 className="font-medium text-gray-800">Text Summarizer</h5>
                                <p className="text-sm text-gray-500">NLP / Transformer</p>
                            </div>
                            <button className="text-sm px-4 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
                                Remove
                            </button>
                        </div>
                        {/* Add more model items similarly */}
                    </div>
                </div>

                {/* Contact Section */}
                <div className="mt-12">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Contact</h4>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-10">
                        <div>
                            <span className="font-medium text-gray-600">Website: </span>
                            <a
                                href="https://yourwebsite.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:underline"
                            >
                                yourwebsite.com
                            </a>
                        </div>
                        <div>
                            <span className="font-medium text-gray-600">Email: </span>
                            <a
                                href="mailto:janecooper@email.com"
                                className="text-indigo-600 hover:underline"
                            >
                                janecooper@email.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}