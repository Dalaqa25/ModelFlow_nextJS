'use client';

import { useRouter } from 'next/navigation';
import { FaUsers, FaThLarge, FaUser } from 'react-icons/fa';

export default function SidebarNavIcons() {
  const router = useRouter();

  const navItems = [
    { icon: FaUsers, path: '/community', label: 'Community' },
    { icon: FaThLarge, path: '/dashboard', label: 'Dashboard' },
    { icon: FaUser, path: '/profile', label: 'Profile' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center gap-3 py-4">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => router.push(item.path)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800/60 transition-colors text-gray-400 hover:text-white"
          title={item.label}
        >
          <item.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
