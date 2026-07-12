// src/app/ClientLayout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");

    const publicPaths = ["/login", "/sign-in", "/accept-invite"];
    const isPublic = publicPaths.some((p) => pathname.startsWith(p));

    if (!user && !isPublic) {
      router.replace("/login");
    } else if (user && (pathname === "/login" || pathname === "/sign-in")) {
      router.replace("/");
    }
    setChecked(true);
  }, [pathname, router]);

  if (!checked) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return <>{children}</>;
}