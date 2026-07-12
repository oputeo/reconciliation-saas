import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ClientToaster } from "@/components/ui/client-toaster";
import { AuthProvider } from "./providers";
import { RuleEngineProvider } from "@/contexts/RuleEngineContext";
import AppShell from "@/components/layout/AppShell";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "ReconFlow | AI Reconciliation Platform",
  description: "Bank-grade Financial Reconciliation & Revenue Assurance System",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-slate-50 text-slate-900 font-sans" suppressHydrationWarning>
        
        <AuthProvider>
          <RuleEngineProvider>
            <Suspense fallback={<div className="min-h-screen" />}>
              <AppShell>{children}</AppShell>
            </Suspense>
          </RuleEngineProvider>
        </AuthProvider>

        <ClientToaster
          position="top-right"
          richColors
          closeButton
          theme="light"
        />
      </body>
    </html>
  );
}