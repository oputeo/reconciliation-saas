// src/app/teams/page.tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Mail, Phone, Edit3, X } from "lucide-react";

const initialTeam = [
  { id: 1, name: "Eric Opute", role: "Product Auditor", email: "eric@moniepoint.com", phone: "+234 803 123 4567", status: "Active", department: "Audit & Assurance" },
  { id: 2, name: "Aisha Bello", role: "Senior Reconciliation Officer", email: "aisha@moniepoint.com", phone: "+234 809 987 6543", status: "Active", department: "Operations" },
  { id: 3, name: "David Okon", role: "Finance Lead", email: "david@moniepoint.com", phone: "+234 708 555 1234", status: "Active", department: "Finance" },
  { id: 4, name: "Fatima Yusuf", role: "Compliance Officer", email: "fatima@moniepoint.com", phone: "+234 803 222 9876", status: "On Leave", department: "Risk & Compliance" },
];

export default function TeamsPage() {
  const [teamMembers, setTeamMembers] = useState(initialTeam);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const [newMember, setNewMember] = useState({
    name: "", email: "", role: "", department: ""
  });

  const inviteNewMember = () => {
    if (!newMember.name || !newMember.email) return;
    
    const newPerson = {
      id: Date.now(),
      name: newMember.name,
      role: newMember.role || "New Member",
      email: newMember.email,
      phone: "+234 000 000 0000",
      status: "Pending",
      department: newMember.department || "General"
    };

    setTeamMembers([newPerson, ...teamMembers]);
    setNewMember({ name: "", email: "", role: "", department: "" });
    setShowInviteForm(false);
    alert("✅ Invitation sent successfully!");
  };

  const resetPassword = (name: string) => {
    alert(`✅ Password reset link has been sent to ${name}'s email.`);
  };

  const closeExpanded = () => {
    setExpandedId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Team Management</h1>
          <p className="text-zinc-400 text-lg mt-1">Manage users • Roles • Access</p>
        </div>
        <Button size="lg" onClick={() => setShowInviteForm(!showInviteForm)}>
          <Plus className="mr-2 h-5 w-5" />
          Invite New Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3"><CardTitle className="text-sm text-zinc-400">Total Members</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold">{teamMembers.length}</p></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3"><CardTitle className="text-sm text-zinc-400">Active Now</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-emerald-500">19</p></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3"><CardTitle className="text-sm text-zinc-400">Pending Invites</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-amber-500">5</p></CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>All Team Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">

            {/* Invite Form */}
            {showInviteForm && (
              <div className="p-8 bg-zinc-950 border-b border-emerald-900">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-lg">Invite New Team Member</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowInviteForm(false)}>
                    <X size={20} />
                  </Button>
                </div>
                {/* Form fields same as before */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div>
                    <Label>Full Name</Label>
                    <Input value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} />
                  </div>
                  <div>
                    <Label>Email Address</Label>
                    <Input type="email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Input value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})} />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input value={newMember.department} onChange={(e) => setNewMember({...newMember, department: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <Button onClick={inviteNewMember}>Send Invitation</Button>
                  <Button variant="outline" onClick={() => setShowInviteForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* Team Members */}
            {teamMembers.map((member) => {
              const isExpanded = expandedId === member.id;
              return (
                <React.Fragment key={member.id}>
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-950/50">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-emerald-900 text-emerald-300">
                          {member.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-lg">{member.name}</p>
                        <p className="text-zinc-400 text-sm">{member.role}</p>
                        <p className="text-xs text-zinc-500">{member.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xs text-zinc-500">Email</p>
                        <p className="text-sm">{member.email}</p>
                      </div>
                      <Badge variant={member.status === "Active" ? "default" : "secondary"} className={member.status === "Active" ? "bg-emerald-600" : ""}>
                        {member.status}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : member.id)}
                      >
                        {isExpanded ? "Hide" : "Manage"}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Section with Close Button */}
                  {isExpanded && (
                    <div className="bg-zinc-950 border-y border-emerald-900 p-8 relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-4 right-4"
                        onClick={closeExpanded}
                      >
                        <X size={20} />
                      </Button>

                      <div className="max-w-3xl mx-auto">
                        <h4 className="font-semibold mb-6 flex items-center gap-2">
                          <Edit3 className="text-emerald-500" /> Manage {member.name}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>Role</Label>
                            <Input defaultValue={member.role} className="mt-2" />
                          </div>
                          <div>
                            <Label>Department</Label>
                            <Input defaultValue={member.department} className="mt-2" />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input defaultValue={member.email} className="mt-2" />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input defaultValue={member.phone} className="mt-2" />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 mt-8">
                          <Button>Save Changes</Button>
                          <Button 
                            variant="outline"
                            onClick={() => resetPassword(member.name)}
                          >
                            Reset Password
                          </Button>
                          <Button variant="destructive" className="ml-auto">
                            Deactivate User
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}