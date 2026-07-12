'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import SettingsShell from '@/components/settings/SettingsShell';
import { SettingSection } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/button';

export default function FeesSettingsPage() {
  return (
    <SettingsShell
      title="Fee Engine"
      description="Configure fee tiers, recovery rules, and approval workflows."
      actions={
        <Button asChild className="accent-btn">
          <Link href="/fee-engine-settings">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open fee engine
          </Link>
        </Button>
      }
    >
      <SettingSection
        title="Fee recovery configuration"
        description="Fee engine settings are managed in the dedicated module and will be persisted per tenant in a future release."
      >
        <p className="text-sm text-slate-600">
          Use the Fee Engine module to define channel-specific fee percentages, recovery thresholds,
          and approval gates for finance teams.
        </p>
      </SettingSection>
    </SettingsShell>
  );
}