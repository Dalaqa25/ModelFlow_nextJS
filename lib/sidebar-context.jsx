'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext({
  isExpanded: false,
  setIsExpanded: () => {},
  isMobileOpen: false,
  setIsMobileOpen: () => {},
  isMobile: false,
});

export function SidebarProvider({ children }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileOpen(false);
    }
  }, [isMobile]);

  return (
    <SidebarContext.Provider value={{ 
      isExpanded, 
      setIsExpanded, 
      isMobileOpen, 
      setIsMobileOpen,
      isMobile 
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
}
