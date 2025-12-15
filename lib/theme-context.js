'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [themeMode, setThemeMode] = useState('system'); // 'system', 'dark', 'light'
    const [isInitialized, setIsInitialized] = useState(false);

    // Apply theme based on current settings
    const applyTheme = (isDark) => {
        setIsDarkMode(isDark);
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', isDark);
            document.documentElement.classList.toggle('light', !isDark);
        }
    };

    // Load theme from localStorage on mount and listen to system changes
    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const savedMode = window.localStorage.getItem('themeMode') || 'system';
            const savedTheme = window.localStorage.getItem('theme');
            
            setThemeMode(savedMode);

            // Function to get system preference
            const getSystemPreference = () => {
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            };

            if (savedMode === 'system') {
                // Use system preference
                const systemPrefersDark = getSystemPreference();
                applyTheme(systemPrefersDark);

                // Listen for system theme changes
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                const handleSystemThemeChange = (e) => {
                    if (localStorage.getItem('themeMode') === 'system') {
                        applyTheme(e.matches);
                    }
                };
                mediaQuery.addEventListener('change', handleSystemThemeChange);
                
                // Cleanup listener
                return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
            } else {
                // Use saved manual preference
                const isDark = savedTheme === 'dark';
                applyTheme(isDark);
            }
            
            setIsInitialized(true);
        }
    }, [themeMode]);

    // Toggle theme manually
    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        applyTheme(newTheme);
        
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('theme', newTheme ? 'dark' : 'light');
            window.localStorage.setItem('themeMode', newTheme ? 'dark' : 'light');
            setThemeMode(newTheme ? 'dark' : 'light');
        }
    };

    // Set theme to a specific value
    const setTheme = (mode) => {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('themeMode', mode);
            setThemeMode(mode);

            if (mode === 'system') {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                applyTheme(systemPrefersDark);
            } else {
                const isDark = mode === 'dark';
                applyTheme(isDark);
                window.localStorage.setItem('theme', mode);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, themeMode, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
