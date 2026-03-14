'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/supabase-auth-context';

const SidebarContext = createContext({
  isExpanded: false,
  setIsExpanded: () => {},
  isMobileOpen: false,
  setIsMobileOpen: () => {},
  isMobile: false,
});

export function SidebarProvider({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Expand by default for unauthenticated users once auth state is known
  useEffect(() => {
    if (!loading && !isAuthenticated && !isMobile) {
      setIsExpanded(true);
    }
  }, [loading, isAuthenticated, isMobile]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) setIsMobileOpen(false);
  }, [isMobile]);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded, isMobileOpen, setIsMobileOpen, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within SidebarProvider');
  return context;
}
