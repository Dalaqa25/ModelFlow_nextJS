// Small UI components for Model Upload functionality

export const ErrorMessage = ({ error }) => {
    if (!error) return null;
    return (
        <p className="text-red-400 text-sm mt-1">
            {error}
        </p>
    );
};

export const LoadingOverlay = ({ isVisible }) => {
    if (!isVisible) return null;
    return (
        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
    );
};