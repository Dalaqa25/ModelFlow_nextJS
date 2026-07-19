'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, RefreshCw, Workflow } from 'lucide-react';
import AdaptiveBackground from '@/app/components/shared/AdaptiveBackground';
import { useAuth } from '@/lib/auth/supabase-auth-context';
import { useSidebar } from '@/lib/contexts/sidebar-context';

export default function BuilderLaunchPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const { isMobile, isExpanded } = useSidebar();
  const sidebarOffset = !isMobile ? (isExpanded ? 256 : 52) : 0;

  const [status, setStatus] = useState('ready');
  const [error, setError] = useState('');

  const openBuilder = async () => {
    setStatus('opening');
    setError('');

    try {
      const response = await fetch('/api/activepieces/projects/ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const payload = await response.json();

      if (!response.ok || !payload.ready) {
        throw new Error(payload.error || 'Builder workspace is not ready yet');
      }

      const popup = window.open('/api/activepieces/launch', '_blank', 'noopener,noreferrer');
      if (!popup) {
        throw new Error('Your browser blocked the new builder tab. Please allow popups for ModelGrow and try again.');
      }

      setStatus('opened');
    } catch (err) {
      setError(err.message || 'Failed to open builder');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  return (
    <AdaptiveBackground variant="content" className="pt-16" showFloatingElements={false}>
      <div
        className="flex min-h-screen items-center justify-center px-6 transition-[padding-left] duration-300"
        style={{ paddingLeft: sidebarOffset }}
      >
        <div className="w-full max-w-md rounded-3xl border border-purple-400/20 bg-slate-950/65 p-8 text-center shadow-2xl shadow-purple-950/20 backdrop-blur">
          {status === 'error' ? (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-200">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-black text-white">Builder did not open</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">{error}</p>
              <button
                type="button"
                onClick={openBuilder}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-3 font-bold text-white shadow-lg shadow-purple-950/30 transition hover:scale-[1.02]"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </>
          ) : status === 'opened' ? (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-black text-white">Builder opened in a new tab</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Keep this ModelGrow tab open and work in the builder tab when you need the visual editor.
              </p>
              <button
                type="button"
                onClick={openBuilder}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-3 font-bold text-white shadow-lg shadow-purple-950/30 transition hover:scale-[1.02]"
              >
                <ExternalLink className="h-4 w-4" />
                Open Again
              </button>
            </>
          ) : status === 'opening' ? (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
                <Workflow className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-black text-white">Opening your builder</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Preparing your ModelGrow automation workspace in a new tab.
              </p>
              <Loader2 className="mx-auto mt-7 h-6 w-6 animate-spin text-purple-200" />
            </>
          ) : (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
                <Workflow className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-black text-white">Open your builder</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                ModelGrow Builder opens in a separate tab so your main workspace stays here.
              </p>
              <button
                type="button"
                onClick={openBuilder}
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-3 font-bold text-white shadow-lg shadow-purple-950/30 transition hover:scale-[1.02]"
              >
                <ExternalLink className="h-4 w-4" />
                Open Builder in New Tab
              </button>
            </>
          )}
        </div>
      </div>
    </AdaptiveBackground>
  );
}
