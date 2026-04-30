// Tool handler functions for AI chat
// This file re-exports all handlers from their respective modules.

export { handleSearchAutomations, handleShowUserAutomations } from './handlers/search.js';
export { handleStartSetup, handleAutoSetup, handleAutoSetupWithExisting, explainRequirements } from './handlers/setup.js';
export { handleCollectTextInput, handleConfirmFileSelection, handleRequestFileUpload } from './handlers/collect.js';
export { handleSearchUserFiles, handleListUserFiles, handleListAutomationFiles, handleDeleteAutomationFile, handlePreviewAutomationFile } from './handlers/files.js';
export { handleExecuteAutomation, handleSaveBackgroundConfig, handleScheduleAutomation } from './handlers/execute.js';
