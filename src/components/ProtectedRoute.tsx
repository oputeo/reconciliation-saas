"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { hasMinRole, type AppRole } from "@/lib/settings/permissions";

type Props = {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
};

export default function ProtectedRoute({ children, allowedRoles, fallbackPath = "/" }: Props) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const isAllowed =
    allowedRoles.includes("all") ||
    allowedRoles.some((role) => hasMinRole(profile?.role, role as AppRole));

  useEffect(() => {
    if (!loading && !isAllowed) {
      router.push(fallbackPath);
    }
  }, [loading, isAllowed, router, fallbackPath]);

  if (loading || !isAllowed) {
    return null;
  }

  return <>{children}</>;
}