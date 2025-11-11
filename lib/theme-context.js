'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Load theme from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const savedTheme = window.localStorage.getItem('theme');
            if (savedTheme) {
                const isDark = savedTheme === 'dark';
                setIsDarkMode(isDark);
                // Apply theme to document
                document.documentElement.classList.toggle('dark', isDark);
                document.documentElement.classList.toggle('light', !isDark);
            } else {
                // Default to dark mode
                document.documentElement.classList.add('dark');
            }
        }
    }, []);

    // Save theme to localStorage and apply to document
    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('theme', newTheme ? 'dark' : 'light');
        }
        
        // Apply theme classes to document
        document.documentElement.classList.toggle('dark', newTheme);
        document.documentElement.classList.toggle('light', !newTheme);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
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
