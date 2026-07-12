'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROLE_LABELS, normalizeRole } from '@/lib/settings/permissions';
import { useAuth } from '@/app/providers';
import { toast } from 'sonner';

const availableRoles = [
  { value: 'Product Auditor', label: 'Product Auditor' },
  { value: 'Finance Lead', label: 'Finance Lead' },
  { value: 'Admin', label: 'Administrator' },
  { value: 'Viewer', label: 'Viewer' },
];

export default function RoleSwitcher() {
  const { profile } = useAuth();
  const normalized = normalizeRole(profile?.role);
  const currentRole = ROLE_LABELS[normalized] ?? 'Viewer';

  const handleRoleSwitch = (newRole: string) => {
    if (newRole === currentRole) return;
    toast.success(`Role switched to ${newRole}`);
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <Select value={currentRole} onValueChange={handleRoleSwitch}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Switch role" />
      </SelectTrigger>
      <SelectContent>
        <SelectLabel>Switch role</SelectLabel>
        {availableRoles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}