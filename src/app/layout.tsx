import type { Metadata } from "next";
import "./globals.css";
import { ClientToaster } from "@/components/ui/client-toaster";
import { AuthProvider } from "./providers";
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
          <AppShell>{children}</AppShell>
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