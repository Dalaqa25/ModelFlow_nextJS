'use client';

import { createContext, useContext, useState } from 'react';

const SidebarContext = createContext({
  isExpanded: false,
  setIsExpanded: () => {},
});

export function SidebarProvider({ children }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded }}>
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
