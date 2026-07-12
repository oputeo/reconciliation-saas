'use client';

import { useEffect, useState } from 'react';
import type { ToasterProps } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

/**
 * Sonner portals toast UI into document.body on the client. Rendering it during
 * SSR / first paint causes React hydration mismatch (#418).
 */
export function ClientToaster(props: ToasterProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Toaster {...props} />;
}