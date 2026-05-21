'use client';

import { createContext, useCallback, useContext, useState } from 'react';

const MessagesDockContext = createContext(null);

export function MessagesDockProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('chats');
  const [activeThreadId, setActiveThreadId] = useState(null);

  const openDock = useCallback(({ threadId = null, tab: nextTab = null } = {}) => {
    if (nextTab) setTab(nextTab);
    setActiveThreadId(threadId);
    setIsOpen(true);
  }, []);

  const closeDock = useCallback(() => {
    setIsOpen(false);
    setActiveThreadId(null);
  }, []);

  const openThread = useCallback((threadId, options = {}) => {
    const { tab: nextTab } = options;
    if (nextTab) setTab(nextTab);
    setActiveThreadId(threadId);
    setIsOpen(true);
  }, []);

  const clearThread = useCallback(() => {
    setActiveThreadId(null);
  }, []);

  const value = {
    isOpen,
    setIsOpen,
    tab,
    setTab,
    activeThreadId,
    setActiveThreadId,
    openDock,
    closeDock,
    openThread,
    clearThread,
  };

  return (
    <MessagesDockContext.Provider value={value}>
      {children}
    </MessagesDockContext.Provider>
  );
}

export function useMessagesDock() {
  const ctx = useContext(MessagesDockContext);
  if (!ctx) {
    throw new Error('useMessagesDock must be used within MessagesDockProvider');
  }
  return ctx;
}

export function useMessagesDockOptional() {
  return useContext(MessagesDockContext);
}
