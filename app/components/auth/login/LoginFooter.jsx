'use client';

import { useRouter } from 'next/navigation';
import { clearAuthAndReload } from '@/lib/clear-auth-data';

export default function LoginFooter() {
  const router = useRouter();

  return (
    <div className="text-center mt-4">
      <p className="text-gray-300">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => router.push('/auth/signup')}
          className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
        >
          Sign up
        </button>
      </p>
      
      {/* Debug button to clear auth data */}
      <button
        type="button"
        onClick={clearAuthAndReload}
        className="text-xs text-gray-500 hover:text-red-400 transition-colors duration-200 underline"
      >
        Clear Auth Data & Reload
      </button>
    </div>
  );
}