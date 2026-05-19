// src/app/(main)/layout.tsx
import Sidebar from "@/components/layout/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 overflow-auto min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}