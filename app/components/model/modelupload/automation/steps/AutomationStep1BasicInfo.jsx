import { ErrorMessage } from '../../shared/components';

export default function AutomationStep1BasicInfo({ formData, errors, handleInputChange, handleNext }) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <label htmlFor="automationName" className="text-sm font-semibold text-slate-200">
                    Automation Name
                </label>
                <input
                    id="automationName"
                    type="text"
                    value={formData.automationName}
                    onChange={handleInputChange}
                    placeholder="Give your automation a short memorable title"
                    className={`px-4 py-3 rounded-xl bg-slate-800/60 border ${
                        errors.automationName ? 'border-red-500 focus:ring-red-500' : 'border-slate-600/60 focus:ring-purple-500'
                    } text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition`}
                />
                <ErrorMessage error={errors.automationName} />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="description" className="text-sm font-semibold text-slate-200">
                    Description
                </label>
                <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Explain what the automation does, prerequisites, and what problem it solves."
                    className={`px-4 py-3 rounded-xl bg-slate-800/60 border ${
                        errors.description ? 'border-red-500 focus:ring-red-500' : 'border-slate-600/60 focus:ring-purple-500'
                    } text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition resize-none`}
                />
                <ErrorMessage error={errors.description} />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="videoLink" className="text-sm font-semibold text-slate-200">
                    Demo Video URL <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                    id="videoLink"
                    type="url"
                    value={formData.videoLink}
                    onChange={handleInputChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`px-4 py-3 rounded-xl bg-slate-800/60 border ${
                        errors.videoLink ? 'border-red-500 focus:ring-red-500' : 'border-slate-600/60 focus:ring-purple-500'
                    } text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition`}
                />
                <ErrorMessage error={errors.videoLink} />
            </div>

            <div className="flex justify-end pt-2">
                <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-500 text-white font-medium hover:from-purple-700 hover:to-violet-600 transition"
                >
                    Continue
                </button>
            </div>
        </div>
    );
}

