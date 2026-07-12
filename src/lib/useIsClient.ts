'use client';

import { useSyncExternalStore } from 'react';

/** React-recommended client detection — avoids hydration mismatch from useState+useEffect gates. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}