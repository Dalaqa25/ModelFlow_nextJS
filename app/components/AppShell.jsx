'use client';

import Sidebar from './navbar/sidebar/Sidebar';
import MobileSidebar from './navbar/sidebar/MobileSidebar';
import TopBar from './navbar/TopBar';
import { useSidebar } from '@/lib/sidebar-context';

export default function AppShell() {
  const { isMobile } = useSidebar();

  return (
    <>
      {isMobile ? <MobileSidebar /> : <Sidebar />}
      <TopBar />
    </>
  );
}
