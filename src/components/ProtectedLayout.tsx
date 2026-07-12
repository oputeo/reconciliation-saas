// src/components/ProtectedLayout.tsx
'use client';

import { useAuth } from "@/app/providers";
import Sidebar from "@/components/layout/Sidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-72 p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}