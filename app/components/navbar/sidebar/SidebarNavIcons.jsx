'use client';

import { useRouter } from 'next/navigation';
import { FaUsers, FaThLarge, FaUser, FaCoins } from 'react-icons/fa';
import { useSidebar } from '@/lib/contexts/sidebar-context';

export default function SidebarNavIcons() {
  const router = useRouter();
  const { isExpanded } = useSidebar();

  const navItems = [
    { icon: FaUsers, path: '/community', label: 'Community' },
    { icon: FaThLarge, path: '/dashboard', label: 'Dashboard' },
    { icon: FaCoins, path: '/pricing', label: 'Buy Credits' },
    { icon: FaUser, path: '/profile', label: 'Profile' },
  ];

  return (
    <div className={`flex flex-col gap-2 ${isExpanded ? 'px-3 py-4' : 'items-center py-4'}`}>
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          className={`flex items-center gap-3 rounded-lg hover:bg-slate-800/60 transition-colors text-gray-400 hover:text-white ${
            isExpanded ? 'w-full px-3 py-2' : 'w-8 h-8 justify-center'
          }`}
          title={item.label}
        >
          <item.icon className="w-4 h-4" />
          {isExpanded && <span className="text-sm">{item.label}</span>}
        </button>
      ))}
    </div>
  );
}
