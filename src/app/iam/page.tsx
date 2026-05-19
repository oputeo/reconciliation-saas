// src/app/iam/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Shield, Plus, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

type Role = {
  id: string;
  name: string;
  description: string;
  template: string;
};

export default function IAMPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [roles, setRoles] = useState<Role[]>([
    { id: "admin", name: "System Administrator", description: "Full system access", template: "Full Access" },
    { id: "finance", name: "Finance Approver", description: "Financial approvals", template: "Finance" },
    { id: "senior-recon", name: "Senior Reconciliation Officer", description: "Senior reconciliation operations", template: "Reconciliation" },
  ]);

  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRole, setNewRole] = useState({ 
    name: "", 
    description: "", 
    template: "Reconciliation" 
  });

  // Role Protection
  const allowedRoles = ["System Administrator", "Senior Reconciliation Officer"];

  useEffect(() => {
    if (!allowedRoles.includes(currentUser.role)) {
      alert("⛔ Access Denied: You don't have permission to access IAM & Access Control.");
      router.push("/");
    }
  }, [currentUser.role, router]);

  // Only render if authorized
  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-slate-600 mt-2">Only System Administrators and Senior Reconciliation Officers can access this page.</p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const createRole = () => {
    if (!newRole.name.trim()) return;

    const role: Role = {
      id: `role-${Date.now()}`,
      name: newRole.name,
      description: newRole.description || "Custom role",
      template: newRole.template,
    };

    setRoles([...roles, role]);
    setNewRole({ name: "", description: "", template: "Reconciliation" });
    setShowCreateRole(false);

    alert(`✅ Role "${newRole.name}" created successfully with ${newRole.template} template!`);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">IAM & Access Control</h1>
              <p className="text-slate-600">Role Management with Smart Templates</p>
            </div>

            <Dialog open={showCreateRole} onOpenChange={setShowCreateRole}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Role
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Role Name (e.g. Compliance Manager)"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  />
                  <Input
                    placeholder="Description"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  />

                  <div>
                    <label className="text-sm font-medium block mb-2">Permission Template</label>
                    <Select 
                      value={newRole.template} 
                      onValueChange={(val) => setNewRole({ ...newRole, template: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Reconciliation">Reconciliation Focused</SelectItem>
                        <SelectItem value="Finance">Finance Focused</SelectItem>
                        <SelectItem value="Full Access">Full Access (Admin-like)</SelectItem>
                        <SelectItem value="Read Only">Read-Only Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={createRole} className="w-full">
                    Create Role
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Roles List */}
          <Card className="fin-card">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Available Roles ({roles.length})</h2>
            </div>
            <div className="divide-y">
              {roles.map(role => (
                <div key={role.id} className="p-6 flex justify-between items-center hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{role.name}</p>
                      <p className="text-sm text-slate-500">{role.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{role.template}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}