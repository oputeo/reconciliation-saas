// src/components/RoleSwitcher.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/app/providers';
import { toast } from 'sonner';

const availableRoles = [
  { value: "Product Auditor", label: "Product Auditor" },
  { value: "Finance Lead", label: "Finance Lead" },
  { value: "Admin", label: "Administrator" },
  { value: "Viewer", label: "Viewer" },
];

export default function RoleSwitcher() {
  const { profile } = useAuth();
  const currentRole = profile?.role || "Product Auditor";

  const handleRoleSwitch = async (newRole: string) => {
    if (newRole === currentRole) return;

    try {
      // Simulate role switch (you can connect to Supabase later)
      toast.success(`Role switched to ${newRole}`);
      
      // Optional: Refresh page to apply new permissions
      setTimeout(() => {
        window.location.reload();
      }, 800);

    } catch (error) {
      toast.error("Failed to switch role");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {currentRole}
          <span className="text-xs opacity-60">▼</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        <DropdownMenuItem className="font-medium text-slate-500">
          Switch Role
        </DropdownMenuItem>
        
        {availableRoles.map((role) => (
          <DropdownMenuItem
            key={role.value}
            onClick={() => handleRoleSwitch(role.value)}
            className={role.value === currentRole ? "bg-slate-100" : ""}
          >
            {role.label}
            {role.value === currentRole && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}