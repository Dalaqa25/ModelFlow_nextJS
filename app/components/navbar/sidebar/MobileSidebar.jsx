'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { FaUsers, FaThLarge, FaUser, FaUpload, FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';
import SidebarUploadIcon from './SidebarUploadIcon';

export default function MobileSidebar() {
  const { isAuthenticated } = useAuth();
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);


  const navItems = [
    { icon: FaUsers, path: '/community', label: 'Community' },
    { icon: FaThLarge, path: '/dashboard', label: 'Dashboard' },
    { icon: FaUser, path: '/profile', label: 'Profile' },
  ];

  const handleNavClick = (path) => {
    router.push(path);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900/95 backdrop-blur-md z-[70] transform transition-transform duration-300 ease-out border-r border-purple-500/20 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header - Fixed to match TopBar height perfectly */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-purple-500/20 bg-slate-900">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="text-white font-semibold tracking-tight text-lg">ModelGrow</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 -mr-1.5 rounded-lg hover:bg-slate-800/60 transition-colors text-gray-400 hover:text-white"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col p-3 gap-1 mt-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                pathname === item.path
                  ? 'bg-purple-500/20 text-white'
                  : 'text-gray-400 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Upload Button */}
        <div className="px-4 mt-auto pb-6">
          <MobileUploadButton onClose={() => setIsMobileOpen(false)} />
        </div>
      </div>
    </>
  );
}

// Separate upload button for mobile with expanded styling
function MobileUploadButton({ onClose }) {
  return (
    <div className="pt-4 border-t border-purple-500/20 flex justify-center w-full">
      <SidebarUploadIcon isMobileExpanded={true} className="w-full" />
    </div>
  );
}
