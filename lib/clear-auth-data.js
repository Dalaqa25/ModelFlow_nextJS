// Utility function to clear all authentication-related data from browser storage
export const clearAllAuthData = () => {
  try {
    // Clear localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('session'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => window.localStorage.removeItem(key));
    }

    // Clear sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const sessionKeysToRemove = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('session'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => window.sessionStorage.removeItem(key));
    }

    console.log('Cleared auth data from browser storage');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// Function to clear auth data and reload the page
export const clearAuthAndReload = () => {
  if (typeof window !== 'undefined') {
    clearAllAuthData();
    window.location.reload();
  }
};


