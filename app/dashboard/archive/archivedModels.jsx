export default function ArchivedModels({ models = [] }) {
    return (
        <div className="space-y-4">
            {models.length === 0 ? (
                <div className="text-gray-400 text-center">No archived models yet.</div>
            ) : (
                models.map((model, idx) => (
                    <div key={idx} className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-sm">
                        <div>
                            <div className="text-lg font-semibold text-purple-800">{model.name}</div>
                            <div className="text-sm text-gray-500">By: {model.authorEmail}</div>
                        </div>
                        <div className="text-sm text-gray-600 mt-2 sm:mt-0">
                            Archived on: {new Date(model.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}