import { ArrowUpTrayIcon, PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ErrorMessage } from '../../shared/components';

export default function AutomationStep3JsonUpload({
    formData,
    errors,
    handleBack,
    handleSubmit,
    onJsonSelect,
    onRemoveJson,
    jsonInputRef,
    isSubmitting,
    buttonText = 'Publish Automation'
}) {
    const handleJsonChange = (event) => {
        const file = event.target.files?.[0];
        if (file) onJsonSelect(file);
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-5">
                <h3 className="text-white font-semibold mb-2">Automation Summary</h3>
                <ul className="text-sm text-slate-300 space-y-1">
                    <li><span className="text-slate-400">Name:</span> {formData.automationName || '—'}</li>
                    <li><span className="text-slate-400">Price:</span> ${(Number(formData.price) / 100).toFixed(2)}</li>
                    <li><span className="text-slate-400">Video:</span> {formData.videoLink ? 'Provided' : 'Not provided'}</li>
                    <li><span className="text-slate-400">Image:</span> {formData.imageFile ? formData.imageFile.name : 'Not uploaded'}</li>
                </ul>
            </div>

            <div className="flex flex-col gap-3">
                <label className="text-sm font-semibold text-slate-200">n8n JSON Export</label>
                <div
                    className={`rounded-2xl border-2 border-dashed p-6 flex flex-col items-center text-center transition ${
                        errors.jsonFile ? 'border-red-500 bg-red-500/10' : 'border-slate-600/70 hover:border-purple-400 hover:bg-slate-800/60'
                    }`}
                    onClick={() => jsonInputRef.current?.click()}
                >
                    {formData.jsonFile ? (
                        <div className="flex flex-col items-center gap-3 text-slate-200">
                            <PaperClipIcon className="h-8 w-8 text-purple-300" />
                            <p className="text-base font-medium">{formData.jsonFile.name}</p>
                            <p className="text-xs text-slate-400">
                                {(formData.jsonFile.size / 1024).toFixed(0)} KB · {formData.jsonFile.type || 'application/json'}
                            </p>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onRemoveJson();
                                }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
                                disabled={isSubmitting}
                            >
                                <TrashIcon className="h-4 w-4" />
                                Remove file
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <ArrowUpTrayIcon className="h-8 w-8" />
                            <p className="text-white font-medium">Drop your n8n export or click to browse</p>
                            <p className="text-xs">Only .json files up to 3MB</p>
                        </div>
                    )}
                    <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        ref={jsonInputRef}
                        onChange={handleJsonChange}
                        disabled={isSubmitting}
                    />
                </div>
                <ErrorMessage error={errors.jsonFile} />
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
                    onClick={handleSubmit}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 transition disabled:opacity-60"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Uploading...' : buttonText}
                </button>
            </div>
        </div>
    );
}

