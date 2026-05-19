"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { 
  User, Shield, CreditCard, Bell, Link, Clock, Building2, Users, Globe 
} from "lucide-react";

type Tenant = {
  id: string;
  name: string;
  subdomain: string;
  status: "Active" | "Inactive";
  users: number;
  plan: string;
};

export default function SettingsPage() {
  const { currentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("company");
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: "OEOS-001", name: "OEO Solutions Ltd", subdomain: "recon.oeosolution.com", status: "Active", users: 47, plan: "Professional" },
    { id: "DELTA-001", name: "Delta State Revenue", subdomain: "delta.oeosolution.com", status: "Active", users: 18, plan: "Enterprise" },
    { id: "AQUA-001", name: "Aquatrack Limited", subdomain: "aquatrack.oeosolution.com", status: "Inactive", users: 9, plan: "Starter" },
  ]);

  const [currentTenant, setCurrentTenant] = useState(tenants[0]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-slate-600 dark:text-slate-400">Multi-Tenant Management & Organization Control</p>
            </div>
            <Badge variant="outline">Super Admin</Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex gap-10">
              {/* Left Navigation */}
              <div className="w-72 flex-shrink-0">
                <Card className="p-3 sticky top-8">
                  <TabsList className="flex flex-col w-full bg-transparent h-auto gap-1">
                    <TabsTrigger value="profile" className="justify-start w-full py-3">👤 Profile</TabsTrigger>
                    <TabsTrigger value="company" className="justify-start w-full py-3">🏢 Company & Tenants</TabsTrigger>
                    <TabsTrigger value="security" className="justify-start w-full py-3">🔒 Security</TabsTrigger>
                    <TabsTrigger value="billing" className="justify-start w-full py-3">💳 Billing</TabsTrigger>
                    <TabsTrigger value="notifications" className="justify-start w-full py-3">🛎️ Notifications</TabsTrigger>
                    <TabsTrigger value="integrations" className="justify-start w-full py-3">🔗 Integrations</TabsTrigger>
                    <TabsTrigger value="audit" className="justify-start w-full py-3">📋 Audit Log</TabsTrigger>
                  </TabsList>
                </Card>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <Card className="fin-card p-8">

                  {/* ==================== COMPANY & MULTI-TENANT ==================== */}
                  <TabsContent value="company">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold flex items-center gap-3">
                        <Building2 className="w-6 h-6" /> Company & Multi-Tenant Management
                      </h2>
                      <Button>+ Add New Tenant</Button>
                    </div>

                    <div className="mb-8 p-6 border rounded-2xl bg-slate-50 dark:bg-slate-900">
                      <h3 className="font-semibold mb-4">Current Active Tenant</h3>
                      <div className="flex items-center gap-4">
                        <Avatar className="w-14 h-14">
                          <AvatarFallback>{currentTenant.name.substring(0,2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-lg">{currentTenant.name}</p>
                          <p className="text-sm text-slate-500">{currentTenant.subdomain}</p>
                        </div>
                        <Badge className="ml-auto">{currentTenant.plan}</Badge>
                      </div>
                    </div>

                    <h3 className="font-semibold mb-4">All Tenants ({tenants.length})</h3>
                    <div className="space-y-4">
                      {tenants.map((tenant) => (
                        <Card key={tenant.id} className="p-6 hover:border-slate-400 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarFallback>{tenant.name.substring(0,2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{tenant.name}</p>
                                <p className="text-sm text-slate-500 font-mono">{tenant.subdomain}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div>
                                <p className="text-xs text-slate-500">Users</p>
                                <p className="font-semibold">{tenant.users}</p>
                              </div>
                              <Badge variant={tenant.status === "Active" ? "default" : "secondary"}>
                                {tenant.status}
                              </Badge>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setCurrentTenant(tenant)}
                              >
                                Switch Tenant
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-10">
                      <h3 className="font-semibold mb-4">Tenant Configuration</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label>Custom Domain / Subdomain</Label>
                          <Input defaultValue={currentTenant.subdomain} className="mt-2" />
                        </div>
                        <div>
                          <Label>Logo URL (Branding)</Label>
                          <Input placeholder="https://..." className="mt-2" />
                        </div>
                        <div>
                          <Label>Data Retention (Days)</Label>
                          <Input type="number" defaultValue="1095" className="mt-2" />
                        </div>
                        <div className="flex items-center gap-3 mt-8">
                          <Switch defaultChecked />
                          <div>
                            <p>Enable AI Auto-Reconciliation</p>
                            <p className="text-xs text-slate-500">For this tenant</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Other tabs remain the same as previous version */}
                  {/* ... (Profile, Security, Billing, etc.) */}

                </Card>
              </div>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}