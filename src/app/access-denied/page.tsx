"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Building2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { hasMinRole } from "@/lib/settings/permissions";

export default function AccessDeniedPage() {
  const router = useRouter();
  const { profile, loading } = useAuth();
  const isAdmin = hasMinRole(profile?.role, "admin");

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center max-w-lg px-6">
        <div className="mx-auto w-20 h-20 bg-red-950 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-zinc-400 text-lg mb-4">
          You do not have the required permissions to access this page.
        </p>

        {!loading && (
          <p className="text-sm text-zinc-500 mb-8">
            Signed in as <span className="text-zinc-300">{profile?.email || "unknown"}</span>
            {" · "}
            Role: <span className="text-zinc-300 capitalize">{profile?.role || "viewer"}</span>
            {profile?.tenant_name && (
              <>
                {" · "}
                Workspace: <span className="text-zinc-300">{profile.tenant_name}</span>
              </>
            )}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push("/")} className="w-full">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Return to Dashboard
          </Button>

          {isAdmin ? (
            <Button
              variant="outline"
              onClick={() => router.push("/settings/tenants")}
              className="w-full border-emerald-700 text-emerald-400 hover:bg-emerald-950"
            >
              <Building2 className="mr-2 h-5 w-5" />
              Switch Workspace (SmartDelta)
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
              className="w-full"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Sign in with Admin Account
            </Button>
          )}
        </div>

        <p className="text-xs text-zinc-500 mt-8 leading-relaxed">
          For the Delta State demo, use{" "}
          <span className="text-zinc-400">admin@oeosolution.com</span>, then go to{" "}
          <span className="text-zinc-400">Settings → Workspaces</span> and select{" "}
          <span className="text-zinc-400">SmartDelta Waste - Delta State</span>.
          The IAM screen with Moniepoint sample users is demo-only and does not change your access.
        </p>
      </div>
    </div>
  );
}