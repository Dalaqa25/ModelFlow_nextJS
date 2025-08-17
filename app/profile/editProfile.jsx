"use client";
import { useState, useEffect } from "react";

export default function EditProfile({ onClose, onSave, initialData }) {
    const [about, setAbout] = useState("");
    const [website, setWebsite] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setAbout(initialData.about_me || "");
            setWebsite(initialData.website_link || "");
            setContactEmail(initialData.contact_email || "");
            setPreviewUrl(initialData.profile_image_url || "");
        }
    }, [initialData]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            let profileImageUrl = initialData?.profile_image_url || "";

            // Upload image if a new one was selected
            if (profileImage) {
                const formData = new FormData();
                formData.append('file', profileImage);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Failed to upload image');
                }

                const data = await response.json();
                profileImageUrl = data.filePath;
            }

            if (onSave) {
                await onSave({
                    aboutMe: about,
                    websiteLink: website,
                    contactEmail: contactEmail,
                    profileImageUrl: profileImageUrl
                });
            }
            if (onClose) onClose();
        } catch (error) {
            console.error('Error uploading profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-center">Edit Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Profile Image</label>
                        <div className="flex flex-col items-center space-y-2">
                            {previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt="Profile preview"
                                    className="w-24 h-24 rounded-full object-cover"
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-violet-50 file:text-violet-700
                                    hover:file:bg-violet-100"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">About Me</label>
                        <textarea
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            rows={3}
                            value={about}
                            onChange={e => setAbout(e.target.value)}
                            placeholder="Tell us about yourself..."
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Website</label>
                        <input
                            type="url"
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                            placeholder="https://yourwebsite.com"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-1">Contact Email</label>
                        <input
                            type="email"
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            value={contactEmail}
                            onChange={e => setContactEmail(e.target.value)}
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
                            disabled={isUploading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
                            disabled={isUploading}
                        >
                            {isUploading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}