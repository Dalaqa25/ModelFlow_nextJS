import { useState } from "react";

export default function EditProfile({ onClose, onSave }) {
    const [about, setAbout] = useState("");
    const [website, setWebsite] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSave) onSave({ about, website, email });
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-lg w-[90%] max-w-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-center">Edit Profile</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <label className="block text-gray-700 font-medium mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}