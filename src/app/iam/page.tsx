'use client';

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, UserPlus, Search, Shield, Clock, CheckCircle, XCircle 
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive" | "Pending";
  lastLogin: string;
  emailConfirmed: boolean;
}

const iamTabs = [
  { id: "users", label: "👥 Users" },
  { id: "roles", label: "🛡️ Roles & Permissions" },
  { id: "audit", label: "📋 Audit Log" },
];

export default function IAMPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const [users, setUsers] = useState<User[]>([
    { id: "u1", name: "Eric Opute", email: "eric.opute@moniepoint.com", role: "Admin", status: "Active", lastLogin: "2 hours ago", emailConfirmed: true },
    { id: "u2", name: "Aisha Bello", email: "aisha.bello@moniepoint.com", role: "Auditor", status: "Active", lastLogin: "Yesterday", emailConfirmed: true },
    { id: "u3", name: "Tunde Adeyemi", email: "tunde.adeyemi@moniepoint.com", role: "Finance Lead", status: "Pending", lastLogin: "Never", emailConfirmed: false },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Auditor");

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const inviteUser = () => {
    if (!inviteEmail) return toast.error("Please enter email");

    const newUser: User = {
      id: "u" + Date.now(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "Pending",
      lastLogin: "Never",
      emailConfirmed: false
    };

    setUsers([newUser, ...users]);
    setShowInviteModal(false);
    setInviteEmail("");
    toast.success(`Invitation sent to ${inviteEmail}`);
  };

  const resendConfirmation = (email: string) => {
    toast.success(`Confirmation email resent to ${email}`);
  };

  const activateUser = (id: string) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, status: "Active", emailConfirmed: true } : user
    ));
    toast.success("User activated successfully");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-bold">IAM & Role Management</h1>
            <p className="text-muted-foreground">User Access Control • Permissions • Compliance</p>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">Demo sample data only</p>
          <p className="mt-1 text-amber-900">
            The users below (Moniepoint names) are placeholders for UI rehearsal — they are not your live ReconFlow account.
            To switch workspace for the SmartDelta demo, use{" "}
            <a href="/settings/tenants" className="underline font-medium">Settings → Workspaces</a>.
            To manage real invites and roles, use{" "}
            <a href="/settings/users" className="underline font-medium">Settings → Users &amp; Teams</a>{" "}
            or <a href="/admin/roles" className="underline font-medium">Role Management</a>.
          </p>
        </div>

        {/* Top Clickable Buttons */}
        <div className="flex flex-wrap gap-3 mb-10 justify-center">
          {iamTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className="px-8 py-6 text-lg font-medium min-w-[200px]"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* ==================== USERS SECTION ==================== */}
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Team Members ({filteredUsers.length})</CardTitle>
                
                <div className="flex gap-3">
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Roles</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Auditor">Auditor</SelectItem>
                      <SelectItem value="Finance Lead">Finance Lead</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => setShowInviteModal(true)} className="gap-2">
                  <UserPlus size={18} /> Invite New User
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-4 px-6">Name</th>
                      <th className="text-left py-4 px-6">Email</th>
                      <th className="text-left py-4 px-6">Role</th>
                      <th className="text-left py-4 px-6">Status</th>
                      <th className="text-left py-4 px-6">Email Confirmation</th>
                      <th className="text-left py-4 px-6">Last Login</th>
                      <th className="text-right py-4 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="py-4 px-6 font-medium">{user.name}</td>
                        <td className="py-4 px-6">{user.email}</td>
                        <td className="py-4 px-6"><Badge variant="outline">{user.role}</Badge></td>
                        <td className="py-4 px-6">
                          <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                        </td>
                        <td className="py-4 px-6">
                          {user.emailConfirmed ? (
                            <Badge variant="default" className="gap-1"><CheckCircle size={14} /> Confirmed</Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1"><XCircle size={14} /> Pending</Badge>
                          )}
                        </td>
                        <td className="py-4 px-6 text-sm text-muted-foreground">{user.lastLogin}</td>
                        <td className="py-4 px-6 text-right space-x-2">
                          {!user.emailConfirmed && (
                            <Button variant="outline" size="sm" onClick={() => resendConfirmation(user.email)}>
                              Resend
                            </Button>
                          )}
                          {user.status === "Pending" && (
                            <Button size="sm" onClick={() => activateUser(user.id)}>
                              Activate
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ROLES & PERMISSIONS */}
        {activeTab === "roles" && (
          <Card>
            <CardContent className="p-20 text-center">
              <Shield className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
              <h2 className="text-4xl font-bold mb-4">Roles & Permissions</h2>
              <p className="text-xl text-muted-foreground">Advanced Role-Based Access Control (RBAC) coming soon</p>
            </CardContent>
          </Card>
        )}

        {/* AUDIT LOG */}
        {activeTab === "audit" && (
          <Card>
            <CardContent className="p-20 text-center">
              <Clock className="mx-auto h-20 w-20 text-muted-foreground mb-6" />
              <h2 className="text-4xl font-bold mb-4">Audit Log</h2>
              <p className="text-xl text-muted-foreground">Complete activity & compliance audit trail coming soon</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="new.user@moniepoint.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Initial Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auditor">Auditor</SelectItem>
                  <SelectItem value="Finance Lead">Finance Lead</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={inviteUser} className="w-full">Send Invitation</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}