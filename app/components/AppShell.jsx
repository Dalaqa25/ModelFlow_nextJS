'use client';

import Sidebar from './navbar/sidebar/Sidebar';
import MobileSidebar from './navbar/sidebar/MobileSidebar';
import TopBar from './navbar/TopBar';
import PublicNavbar from './PublicNavbar';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { usePathname } from 'next/navigation';

export default function AppShell() {
  const { isMobile } = useSidebar();
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return null;

  if (!isAuthenticated) {
    return <PublicNavbar />;
  }

  const usesEditorialShell = ['/explore', '/pricing', '/developers'].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const shellTone = usesEditorialShell ? 'editorial' : 'workspace';

  return (
    <>
      {isMobile ? <MobileSidebar /> : <Sidebar tone={shellTone} />}
      <TopBar tone={shellTone} />
    </>
  );
}
