'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useSidebar } from '@/lib/contexts/sidebar-context';

export default function SidebarToggle() {
  const { isExpanded, setIsExpanded } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const isMainPage = pathname === '/main';

  const handleLogoClick = () => {
    if (!isExpanded) {
      router.push('/main');
    } else {
      setIsExpanded(false);
    }
  };

  return (
    <div className="p-1">
      <button
        onClick={handleLogoClick}
        className="w-full flex items-center justify-center p-1 rounded-lg hover:bg-slate-800/60 transition-colors text-white focus:outline-none"
      >
        {isExpanded ? (
          <div className="flex items-center gap-2 w-full px-1">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
          </div>
        ) : (
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={30} 
            height={30} 
            className="pt-1" 
          />
        )}
      </button>
    </div>
  );
}
