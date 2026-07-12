'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  viewer: 'Viewer',
  auditor: 'Auditor',
  approver: 'Finance Approver',
  admin: 'Admin',
};

function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawEmail = searchParams.get('email') || '';
  const email = rawEmail.trim().toLowerCase();

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setChecking(false);
      return;
    }

    const checkInvite = async () => {
      try {
        const { data, error } = await supabase
          .from('access_requests')
          .select('full_name, role')
          .eq('email', email)
          .eq('status', 'pending')
          .order('requested_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
          console.error(error);
        }

        if (data) {
          setFullName(data.full_name || email.split('@')[0] || '');
          setInviteRole(data.role || 'viewer');
        } else {
          // Allow signup even without pending invite (common case)
          setFullName(email.split('@')[0] || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    };

    checkInvite();
  }, [email]);

  const handleSubmit = async () => {
    if (!password || password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (!fullName.trim()) {
      return toast.error("Please enter your full name");
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          toast.error('This email already has an account. Please sign in.');
          router.push(`/login?email=${encodeURIComponent(email)}`);
          return;
        }
        throw error;
      }

      if (data.session?.access_token) {
        const { error: onboardError } = await supabase.functions.invoke('complete-onboarding', {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        if (onboardError) {
          console.error('Onboarding error:', onboardError);
        }
      }

      toast.success('Account created successfully!', {
        description: 'You can now sign in to ReconFlow',
      });

      setTimeout(() => router.push(`/login?email=${encodeURIComponent(email)}`), 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Verifying invitation...
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-10 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 font-medium">Invalid invitation link</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600 mb-4" />
          <CardTitle className="text-3xl font-bold">Join ReconFlow</CardTitle>
          <p className="text-slate-600 mt-2">Complete your account setup</p>
          {inviteRole && (
            <Badge variant="secondary" className="mt-3">
              Invited as {ROLE_LABELS[inviteRole] || inviteRole}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <Label>Email Address</Label>
            <div className="mt-1.5 p-4 bg-slate-50 rounded-lg font-mono text-sm break-all">
              {email}
            </div>
          </div>

          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-1.5"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !password || !fullName.trim()}
            className="w-full py-6 text-lg font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account & Join ReconFlow'
            )}
          </Button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => router.push(`/login?email=${encodeURIComponent(email)}`)}
              className="text-emerald-700 hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading invite...</div>}>
      <AcceptInvitePage />
    </Suspense>
  );
}