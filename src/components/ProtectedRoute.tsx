// src/components/ProtectedRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

type Props = {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
};

export default function ProtectedRoute({ children, allowedRoles, fallbackPath = "/" }: Props) {
  const { currentUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!allowedRoles.includes(currentUser.role) && !allowedRoles.includes("all")) {
      alert("⛔ Access Denied: Insufficient permissions for this page.");
      router.push(fallbackPath);
    }
  }, [currentUser.role, router, allowedRoles, fallbackPath]);

  if (!allowedRoles.includes(currentUser.role) && !allowedRoles.includes("all")) {
    return null;
  }

  return <>{children}</>;
}