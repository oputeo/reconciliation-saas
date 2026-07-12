// src/app/access-denied/page.tsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="mx-auto w-20 h-20 bg-red-950 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-zinc-400 text-lg mb-8">
          You do not have the required permissions to access this page.
        </p>

        <div className="flex flex-col gap-4">
          <Button onClick={() => router.push("/")} className="w-full">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Return to Dashboard
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => router.push("/iam")}
            className="w-full"
          >
            Switch Role
          </Button>
        </div>

        <p className="text-xs text-zinc-500 mt-10">
          Contact your System Administrator if you believe this is an error.
        </p>
      </div>
    </div>
  );
}