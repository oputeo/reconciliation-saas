'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';

function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const [requestMode, setRequestMode] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [requestName, setRequestName] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Login successful!');
      window.location.href = '/executive';
    }
    setLoading(false);
  };

  const submitAccessRequest = async () => {
    if (!requestEmail || !requestName) {
      toast.error('Email and Name are required');
      return;
    }

    setRequestSubmitting(true);
    try {
      const { error } = await supabase
        .from('access_requests')
        .insert({
          full_name: requestName,
          email: requestEmail,
          phone: requestPhone,
          status: 'pending',
          requested_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Access request submitted successfully! Admin will review it shortly.');
      setRequestMode(false);
      setRequestName('');
      setRequestEmail('');
      setRequestPhone('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit request';
      toast.error(message);
    } finally {
      setRequestSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-[420px] min-w-0">
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg ring-4 ring-emerald-600/10">
            <span className="text-2xl font-bold text-white">R</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome to ReconFlow
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Sign in to continue
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>Revenue Assurance Platform</span>
          </div>
        </div>

        <Card className="w-full overflow-visible border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm py-0">
          <CardContent className="px-5 py-6 sm:px-8 sm:py-8 space-y-6">
            {!requestMode ? (
              <>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 w-full min-w-0"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 w-full min-w-0"
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full bg-emerald-600 text-base font-semibold hover:bg-emerald-700"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                <div className="border-t border-slate-100 pt-4 text-center">
                  <Button
                    variant="link"
                    onClick={() => setRequestMode(true)}
                    className="h-auto whitespace-normal px-2 py-1 text-sm text-emerald-700 hover:text-emerald-800"
                  >
                    Don&apos;t have an account? Request Access
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-slate-900">Request Access</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Your request will be reviewed by an administrator
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="request-name">Full Name</Label>
                  <Input
                    id="request-name"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    placeholder="John Doe"
                    className="h-11 w-full min-w-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-email">Work Email</Label>
                  <Input
                    id="request-email"
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-11 w-full min-w-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-phone">Phone Number (Optional)</Label>
                  <Input
                    id="request-phone"
                    value={requestPhone}
                    onChange={(e) => setRequestPhone(e.target.value)}
                    placeholder="+234 801 234 5678"
                    className="h-11 w-full min-w-0"
                  />
                </div>

                <Button
                  onClick={submitAccessRequest}
                  className="h-11 w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={requestSubmitting || !requestEmail || !requestName}
                >
                  {requestSubmitting ? 'Submitting Request...' : 'Submit Access Request'}
                </Button>

                <Button
                  variant="link"
                  onClick={() => setRequestMode(false)}
                  className="h-auto w-full whitespace-normal text-slate-600"
                >
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-500">
          OEO Solutions · ReconFlow · Secure invite-only access
        </p>
      </div>
    </div>
  );
}

export default function LoginPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center text-slate-500">
          Loading...
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}