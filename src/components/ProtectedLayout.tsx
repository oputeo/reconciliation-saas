'use client';

import { useAuth } from '@/app/providers';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** @deprecated AppShell in root layout handles sidebar + main offset. Use plain page content only. */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading ReconFlow...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}