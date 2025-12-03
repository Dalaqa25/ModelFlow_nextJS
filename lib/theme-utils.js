/**
 * Theme-aware utility classes and helpers
 * Use these utilities to easily apply theme-adaptive styles throughout your app
 */

// Common text color patterns
export const themeText = {
  // Primary text (headings, important text)
  primary: (isDarkMode) => isDarkMode ? 'text-white' : 'text-gray-900',
  
  // Secondary text (body text, descriptions)
  secondary: (isDarkMode) => isDarkMode ? 'text-gray-300' : 'text-gray-700',
  
  // Tertiary text (less important text)
  tertiary: (isDarkMode) => isDarkMode ? 'text-gray-400' : 'text-gray-600',
  
  // Muted text (placeholders, hints)
  muted: (isDarkMode) => isDarkMode ? 'text-gray-500' : 'text-gray-500',
  
  // Gradient text
  gradient: (isDarkMode) => isDarkMode 
    ? 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'
    : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent',
};

// Common background patterns
export const themeBg = {
  // Card backgrounds
  card: (isDarkMode) => isDarkMode 
    ? 'bg-slate-800/90 border-slate-700/50'
    : 'bg-white/90 border-gray-300/50',
  
  // Input backgrounds
  input: (isDarkMode) => isDarkMode 
    ? 'bg-slate-800/90 border-purple-500/30 focus:border-purple-500/70'
    : 'bg-white/90 border-purple-300/40 focus:border-purple-500/80',
  
  // Button backgrounds (secondary)
  button: (isDarkMode) => isDarkMode 
    ? 'bg-slate-800/60 border-slate-700/50 text-gray-300 hover:bg-slate-700/60'
    : 'bg-white/60 border-gray-300 text-gray-700 hover:bg-white/80',
  
  // Disabled state
  disabled: (isDarkMode) => isDarkMode 
    ? 'bg-gray-700/50 text-gray-500'
    : 'bg-gray-200/50 text-gray-400',
};

// Shadow patterns
export const themeShadow = {
  card: (isDarkMode) => isDarkMode 
    ? 'shadow-xl shadow-purple-900/20'
    : 'shadow-xl shadow-purple-200/30',
  
  hover: (isDarkMode) => isDarkMode 
    ? 'hover:shadow-2xl hover:shadow-purple-500/30'
    : 'hover:shadow-2xl hover:shadow-purple-300/40',
};

// Border patterns
export const themeBorder = {
  default: (isDarkMode) => isDarkMode 
    ? 'border-purple-500/30'
    : 'border-purple-300/40',
  
  hover: (isDarkMode) => isDarkMode 
    ? 'hover:border-purple-500/50'
    : 'hover:border-purple-400/60',
  
  focus: (isDarkMode) => isDarkMode 
    ? 'focus:border-purple-500/70'
    : 'focus:border-purple-500/80',
};

/**
 * Helper function to combine theme-aware classes
 * @param {boolean} isDarkMode - Current theme mode
 * @param {string} darkClasses - Classes for dark mode
 * @param {string} lightClasses - Classes for light mode
 * @returns {string} Combined class string
 */
export function themeClass(isDarkMode, darkClasses, lightClasses) {
  return isDarkMode ? darkClasses : lightClasses;
}

/**
 * Get all theme-aware text color classes
 * @param {boolean} isDarkMode - Current theme mode
 * @returns {object} Object with all text color classes
 */
export function getThemeTextColors(isDarkMode) {
  return {
    primary: themeText.primary(isDarkMode),
    secondary: themeText.secondary(isDarkMode),
    tertiary: themeText.tertiary(isDarkMode),
    muted: themeText.muted(isDarkMode),
    gradient: themeText.gradient(isDarkMode),
  };
}

