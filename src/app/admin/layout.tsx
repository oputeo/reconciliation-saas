'use client';

import React from 'react';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { hasPermission, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasPermission('admin')) {
      router.push('/executive');
    }
  }, [hasPermission, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission('admin')) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}