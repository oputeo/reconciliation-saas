// src/app/providers.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchTenantMeta } from '@/lib/settings/tenant';
import { hasMinRole, type AppRole } from '@/lib/settings/permissions';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  signOut: () => Promise<void>;
  hasPermission: (role: string) => boolean;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, authUser?: User | null) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, tenant_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) console.warn('Failed to load user role:', error.message);

    let tenantName: string | null = null;
    let tenantPlan: string | null = null;
    if (data?.tenant_id) {
      const tenant = await fetchTenantMeta(data.tenant_id);
      tenantName = tenant.name;
      tenantPlan = tenant.plan;
    }

    setProfile({
      role: data?.role || 'viewer',
      tenant_id: data?.tenant_id,
      tenant_name: tenantName,
      tenant_plan: tenantPlan,
      full_name:
        authUser?.user_metadata?.full_name ||
        authUser?.email?.split('@')[0] ||
        'User',
      email: authUser?.email,
    });
  };

  const refreshRole = async () => {
    if (user) await fetchProfile(user.id, user);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      else setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('reconflow_active_tenant_id');
    }
    await supabase.auth.signOut();
  };

  const hasPermission = (requiredRole: string): boolean => {
    if (!profile?.role) return false;
    return hasMinRole(profile.role, requiredRole as AppRole);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, hasPermission, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};