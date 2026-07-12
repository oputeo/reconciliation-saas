'use client';

import { RuleEngineProvider } from '@/contexts/RuleEngineContext';

export default function RulesLayout({ children }: { children: React.ReactNode }) {
  return <RuleEngineProvider>{children}</RuleEngineProvider>;
}