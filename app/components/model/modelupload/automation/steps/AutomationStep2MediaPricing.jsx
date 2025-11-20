import { Fragment } from 'react';
import { PRICE_TIERS } from '../../shared/constants';
import { ErrorMessage } from '../../shared/components';
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function AutomationStep2MediaPricing({
    formData,
    errors,
    handleBack,
    handleNext,
    onPriceChange,
    onImageSelect,
    onRemoveImage,
    imageInputRef,
    isSubmitting
}) {
    const handleImageClick = () => imageInputRef.current?.click();

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) onImageSelect(file);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-slate-200">Price Tier</label>
                <div className="grid gap-3 sm:grid-cols-2">
                    {PRICE_TIERS.map((tier) => (
                        <button
                            key={tier.value}
                            type="button"
                            onClick={() => onPriceChange(tier.value)}
                            className={`rounded-2xl border p-4 text-left transition ${
                                Number(formData.price) === tier.value
                                    ? 'border-purple-500 bg-purple-500/10 text-white shadow-lg shadow-purple-500/30'
                                    : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-purple-400/60'
                            }`}
                            disabled={isSubmitting}
                        >
                            <div className="text-lg font-semibold">{tier.label}</div>
                            <p className="text-sm text-slate-400 mt-1">{tier.description?.trim() || 'Preset Lemon Squeezy price.'}</p>
                        </button>
                    ))}
                </div>
                <ErrorMessage error={errors.price} />
            </div>

            <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-slate-200">Cover Image</label>
                <div
                    className={`rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                        errors.imageFile ? 'border-red-500 bg-red-500/10' : 'border-slate-600/70 hover:border-purple-400 hover:bg-slate-800/60'
                    }`}
                    onClick={handleImageClick}
                >
                    {formData.imagePreview ? (
                        <Fragment>
                            <img
                                src={formData.imagePreview}
                                alt="Automation cover"
                                className="h-40 w-full object-cover rounded-xl mb-4 border border-slate-700/50"
                            />
                            <p className="text-sm text-slate-300">{formData.imageFile?.name}</p>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onRemoveImage();
                                }}
                                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
                                disabled={isSubmitting}
                            >
                                <TrashIcon className="h-4 w-4" />
                                Remove image
                            </button>
                        </Fragment>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <PhotoIcon className="h-10 w-10" />
                            <p className="font-medium text-white">Drop an image or click to browse</p>
                            <p className="text-xs text-slate-400">PNG/JPG up to 2MB</p>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        ref={imageInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                    />
                </div>
                <ErrorMessage error={errors.imageFile} />
            </div>

            <div className="flex justify-between pt-2">
                <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-2 rounded-lg bg-slate-200 text-slate-900 font-medium hover:bg-white transition disabled:opacity-60"
                    disabled={isSubmitting}
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-500 text-white font-semibold hover:from-purple-700 hover:to-violet-600 transition disabled:opacity-60"
                    disabled={isSubmitting}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}

