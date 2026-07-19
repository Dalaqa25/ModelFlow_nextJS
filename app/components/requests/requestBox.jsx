'use client';
import { useState } from 'react';
import { FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useQueryClient } from '@tanstack/react-query';

export default function RequestBox({ onClose, onRequestPublished }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState(['']);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const addTag = () => {
        setTags([...tags, '']);
    };

    const removeTag = (index) => {
        if (tags.length > 1) {
            setTags(tags.filter((_, i) => i !== index));
        }
    };

    const handleTagChange = (index, value) => {
        const newTags = [...tags];
        newTags[index] = value;
        setTags(newTags);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('You must be logged in to publish a suggestion.');
            return;
        }

        setLoading(true);

        const requestData = {
            title: name,
            description,
            tags: tags.filter(tag => tag.trim() !== ''),
            author_email: user.email || 'anonymous@example.com',
        };

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to publish suggestion: ${res.status} ${errorText}`);
            }

            await res.json();

            toast.success('Suggestion published successfully!');
            setName('');
            setDescription('');
            setTags(['']);
            // Refresh the requests list
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            if (onClose) onClose();
            if (onRequestPublished) onRequestPublished();
        } catch (err) {
            toast.error(err.message || 'Failed to publish suggestion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/45 backdrop-blur-md"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose && onClose();
                }}
            />

            {/* Modal */}
            <motion.div
                className="community-surface relative w-full max-w-lg rounded-lg p-6 sm:p-7"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose && onClose();
                    }}
                    className="absolute top-4 right-4 z-10 rounded-lg p-2 text-[var(--landing-muted)] transition-all duration-200 hover:bg-white/35 hover:text-[var(--landing-ink)] focus:outline-none dark:hover:bg-white/[0.07]"
                >
                    <FaTimes size={14} />
                </button>

                <form className="w-full flex flex-col gap-5 text-left" onSubmit={handleSubmit}>
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-[var(--landing-yellow)]/20 border border-[var(--landing-border)] flex items-center justify-center">
                                <HiSparkles className="text-[var(--landing-accent)] text-sm" />
                            </div>
                            <h2 className="text-xl font-black text-[var(--landing-ink)]">Suggest an Automation</h2>
                        </div>
                        <p className="text-[var(--landing-muted)] text-sm font-semibold">Describe the automation you'd like to see built by the community.</p>
                    </motion.div>

                    {/* Title Field */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                    >
                        <label htmlFor="name" className="text-xs font-black text-[var(--landing-muted)] uppercase tracking-wider mb-2 block">
                            Title <span className="text-[var(--landing-accent)]">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            placeholder="e.g. Email Auto-Reply Bot"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-3 bg-white/35 border border-[var(--landing-border)] rounded-lg text-[var(--landing-ink)] text-sm font-semibold placeholder:text-[var(--landing-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent-2)]/25 focus:border-[var(--landing-accent-2)] transition-all duration-200 dark:bg-white/[0.05]"
                        />
                    </motion.div>

                    {/* Description Field */}
                    <motion.div
                        className="flex flex-col gap-2"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.1 }}
                    >
                        <label htmlFor="description" className="text-xs font-black text-[var(--landing-muted)] uppercase tracking-wider">
                            Description <span className="text-[var(--landing-accent)]">*</span>
                        </label>
                        <textarea
                            id="description"
                            rows={4}
                            placeholder="Describe what this automation should do, who it's for, and how it should work..."
                            required
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full p-3 bg-white/35 border border-[var(--landing-border)] rounded-lg text-[var(--landing-ink)] text-sm font-semibold placeholder:text-[var(--landing-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent-2)]/25 focus:border-[var(--landing-accent-2)] transition-all duration-200 resize-none dark:bg-white/[0.05]"
                        />
                    </motion.div>

                    {/* Tags Field */}
                    <motion.div
                        className="flex flex-col gap-2.5"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.15 }}
                    >
                        <label className="text-xs font-black text-[var(--landing-muted)] uppercase tracking-wider">Tags</label>
                        <div className="space-y-2">
                            {tags.map((tag, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--landing-muted)] text-sm">#</span>
                                        <input
                                            type="text"
                                            value={tag}
                                            onChange={(e) => handleTagChange(index, e.target.value)}
                                            required
                                            className="w-full p-3 pl-7 bg-white/35 border border-[var(--landing-border)] rounded-lg text-[var(--landing-ink)] text-sm font-semibold placeholder:text-[var(--landing-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-accent-2)]/25 focus:border-[var(--landing-accent-2)] transition-all duration-200 dark:bg-white/[0.05]"
                                            placeholder={`e.g. ${['email', 'social-media', 'marketing', 'analytics'][index] || 'tag'}`}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeTag(index)}
                                        className="p-3 text-red-400/70 hover:text-red-300 bg-red-500/8 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/20 rounded-lg transition-all duration-200"
                                    >
                                        <FaTrash className="text-xs" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addTag}
                            className="text-xs text-[var(--landing-accent-3)] hover:text-[var(--landing-ink)] flex items-center gap-1.5 w-fit font-black transition-colors duration-200"
                        >
                            <FaPlus className="text-[10px]" />
                            Add another tag
                        </button>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.button
                        className="auth-primary-button w-full py-3 px-4 rounded-lg font-black text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                        type="submit"
                        disabled={loading}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: 0.2 }}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Publishing...
                            </span>
                        ) : (
                            'Publish Suggestion'
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}
