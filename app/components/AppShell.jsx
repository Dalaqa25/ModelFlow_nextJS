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

  // Admin surfaces own their layout. Keeping the consumer sidebar/top bar out
  // prevents the review workspace from being clipped and accidentally inheriting
  // consumer navigation controls.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return null;

  // Marketing pages are pitches, not product surfaces. They must look identical
  // to a signed-out visitor and a signed-in one — wrapping a pitch in the app
  // sidebar, credit balance and notification bell makes it read as an internal
  // screen rather than a page selling the product.
  const isMarketingRoute = ['/', '/developers'].some(
    (route) => pathname === route || (route !== '/' && pathname.startsWith(`${route}/`))
  );

  if (!isAuthenticated || isMarketingRoute) {
    return <PublicNavbar />;
  }

  const usesEditorialShell = ['/explore', '/pricing'].some(
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
