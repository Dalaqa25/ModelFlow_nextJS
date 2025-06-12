"use client"
import { useState, useEffect } from "react";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import EditProfile from "./editProfile";
import Link from "next/link";

export default function Profile() { 
    const [showEdit, setShowEdit] = useState(false);
    const [userName, setUserName] = useState("Loading...");
    const [userData, setUserData] = useState({
        name: "",
        aboutMe: "",
        websiteLink: "",
        contactEmail: "",
        email: ""
    });
    const [userModels, setUserModels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/user');
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const data = await response.json();
                console.log('User data received:', data);
                setUserName(data.name);
                setUserData(data);
                return data; // Return the data so we can use it
            } catch (error) {
                console.error("Error fetching user data:", error);
                setUserName("User");
                return null;
            }
        };

        const fetchUserModels = async () => {
            try {
                // First get user data
                const userData = await fetchUserData();
                if (!userData || !userData.email) {
                    console.error('No user data or email available');
                    return;
                }
                
                console.log('Fetching models for email:', userData.email);
                const response = await fetch(`/api/models/user-models?email=${userData.email}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('API Error:', errorData);
                    throw new Error('Failed to fetch user models');
                }
                const data = await response.json();
                console.log('Models data received:', data);
                setUserModels(data);
            } catch (error) {
                console.error("Error fetching user models:", error);
            } finally {
                setIsLoading(false);
            }
        };

        // Call fetchUserModels directly since it now handles fetching user data
        fetchUserModels();
    }, []);

    // Pagination state for models
    const [currentPage, setCurrentPage] = useState(1);
    const modelsPerPage = 3;
    const totalPages = Math.ceil(userModels.length / modelsPerPage);
    const indexOfLastModel = currentPage * modelsPerPage;
    const indexOfFirstModel = indexOfLastModel - modelsPerPage;
    const currentModels = userModels.slice(indexOfFirstModel, indexOfLastModel);

    const handleSave = async (data) => {
        try {
            const response = await fetch('/api/user', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedData = await response.json();
            setUserData(updatedData);
            setShowEdit(false);
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    return (
        <div className="min-h-screen mt-10 bg-gradient-to-b from-white to-blue-50 py-12 px-6">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-3xl p-8">
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <img
                        src={userData.profileImageUrl || "/default-image.png"}
                        alt="User Avatar"
                        className="w-28 h-28 rounded-full border-4 border-indigo-300 shadow-md object-cover"
                    />
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{userName}</h2>
                        <p className="text-sm text-gray-500">@{userName.toLowerCase().replace(/\s+/g, '')}</p>
                    </div>
                    <div className="flex justify-center gap-4">
                        <button
                            className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
                            onClick={() => setShowEdit(true)}
                        >
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
                        <h3 className="text-xl font-semibold text-gray-700">{userModels.length}</h3>
                        <p className="text-sm text-gray-500">Models Uploaded</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700">
                            {userModels.filter(model => model.sold).length}
                        </h3>
                        <p className="text-sm text-gray-500">Models Sold</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700">
                            ${userModels.reduce((total, model) => total + (model.sold ? model.price : 0), 0)}
                        </h3>
                        <p className="text-sm text-gray-500">Revenue</p>
                    </div>
                </div>

                {/* About Me Section */}
                <div className="mt-12">
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">About Me</h4>
                    <p className="text-gray-600 text-base">
                        {userData.aboutMe || "No description provided yet."}
                    </p>
                </div>

                {/* Uploaded Models Section with Pagination */}
                <div className="mt-12">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Uploaded Models</h4>
                    {isLoading ? (
                        <div className="text-center py-4">
                            <p className="text-gray-500">Loading models...</p>
                        </div>
                    ) : userModels.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-gray-500">No models uploaded yet.</p>
                            <Link href="/dashboard" className="text-indigo-600 hover:underline mt-2 inline-block">
                                Upload your first model
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {currentModels.map(model => (
                                    <Link
                                        key={model._id}
                                        href={`/modelsList/${model._id}`}
                                        className="block"
                                    >
                                        <div className="p-4 border border-gray-100 rounded-xl shadow-sm flex justify-between items-center hover:bg-gray-50 transition">
                                            <div>
                                                <h5 className="font-medium text-gray-800">{model.name}</h5>
                                                <p className="text-sm text-gray-500">{model.tags.join(' / ')}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-600">${model.price}</p>
                                                <p className="text-xs text-gray-500">{model.sold ? 'Sold' : 'Available'}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        Prev
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Contact Section */}
                <div className="mt-12">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Contact</h4>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-10">
                        {userData.websiteLink && (
                            <div>
                                <span className="font-medium text-gray-600">Website: </span>
                                <a
                                    href={userData.websiteLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:underline"
                                >
                                    {userData.websiteLink}
                                </a>
                            </div>
                        )}
                        <div>
                            <span className="font-medium text-gray-600">Email: </span>
                            <a
                                href={`mailto:${userData.contactEmail || userData.email}`}
                                className="text-indigo-600 hover:underline"
                            >
                                {userData.contactEmail || userData.email}
                            </a>
                        </div>
                    </div>
                </div>

                {/* Edit Profile Dialog */}
                {showEdit && (
                    <EditProfile
                        onClose={() => setShowEdit(false)}
                        onSave={handleSave}
                        initialData={userData}
                    />
                )}
            </div>
        </div>
    )
}