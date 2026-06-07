'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Shield, Wallet, Workflow } from 'lucide-react';
import { useAuth } from '@/lib/auth/supabase-auth-context';

const ADMIN_EMAILS = ['modelgrowfinancial01@gmail.com', 'g.dalaqishvili01@gmail.com'];

export default function AdminHomePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-400"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 text-xs font-semibold uppercase tracking-widest mb-4">
            <Shield className="w-3.5 h-3.5" />
            Admin
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Console</h1>
          <p className="text-gray-400 mt-2">Manage payouts and send product updates to your users.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/withdrawals"
            className="group bg-slate-900 border border-slate-700/60 rounded-xl p-6 hover:border-purple-500/40 transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-white">Withdrawal Requests</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Review pending withdrawal requests, verify risk, and approve or reject payouts.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-purple-300 group-hover:text-purple-200">
              Open Withdrawals
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/admin/withdrawals?tab=broadcast"
            className="group bg-slate-900 border border-slate-700/60 rounded-xl p-6 hover:border-purple-500/40 transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-white">Broadcast Email</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Send feature announcements and product updates to all users in your `users` table.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-purple-300 group-hover:text-purple-200">
              Open Broadcast
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/admin/withdrawals?tab=automations"
            className="group bg-slate-900 border border-slate-700/60 rounded-xl p-6 hover:border-purple-500/40 transition-colors"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Workflow className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-white">Automation Reviews</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Review newly published builder flows and approve them for the public marketplace.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-purple-300 group-hover:text-purple-200">
              Open Reviews
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
