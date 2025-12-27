import { ErrorMessage } from '../shared/components';

const MAX_NAME_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 1000;

export default function AutomationStep1BasicInfo({ formData, errors, handleInputChange, handleNext }) {
    const nameLength = formData.automationName?.length || 0;
    const descriptionLength = formData.description?.length || 0;

    return (
        <div className="space-y-6">
            {/* Tip banner */}
            <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
                <p className="text-sm text-purple-300">
                    <strong>💡 Tip:</strong> A clear name and detailed description help users find your automation. 
                    Our AI search uses these to match your automation with what users are looking for.
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <label htmlFor="automationName" className="text-sm font-semibold text-slate-200">
                        Automation Name
                    </label>
                    <span className={`text-xs ${nameLength > MAX_NAME_LENGTH ? 'text-red-400' : 'text-slate-400'}`}>
                        {nameLength}/{MAX_NAME_LENGTH}
                    </span>
                </div>
                <input
                    id="automationName"
                    type="text"
                    value={formData.automationName}
                    onChange={handleInputChange}
                    maxLength={MAX_NAME_LENGTH}
                    placeholder="e.g., Google Sheets to Email Campaign Sender"
                    className={`px-4 py-3 rounded-xl bg-slate-800/60 border ${
                        errors.automationName ? 'border-red-500 focus:ring-red-500' : 'border-slate-600/60 focus:ring-purple-500'
                    } text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition`}
                />
                <ErrorMessage error={errors.automationName} />
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <label htmlFor="description" className="text-sm font-semibold text-slate-200">
                        Description
                    </label>
                    <span className={`text-xs ${descriptionLength > MAX_DESCRIPTION_LENGTH ? 'text-red-400' : 'text-slate-400'}`}>
                        {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
                    </span>
                </div>
                <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    placeholder="Describe what your automation does, what tools it connects, and what problem it solves for users..."
                    className={`px-4 py-3 rounded-xl bg-slate-800/60 border ${
                        errors.description ? 'border-red-500 focus:ring-red-500' : 'border-slate-600/60 focus:ring-purple-500'
                    } text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition resize-none`}
                />
                <ErrorMessage error={errors.description} />
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
