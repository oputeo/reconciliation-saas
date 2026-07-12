#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sb = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const TENANT_ID = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';
const email = process.argv[2] || 'admin@oeosolution.com';

const { data: authUsers } = await sb.auth.admin.listUsers({ perPage: 200 });
const user = authUsers?.users?.find((u) => u.email === email);
if (!user) {
  console.error('User not found:', email);
  process.exit(1);
}

const { error } = await sb.from('user_roles').upsert(
  { user_id: user.id, tenant_id: TENANT_ID, role: 'admin' },
  { onConflict: 'user_id,tenant_id' },
);
if (error) {
  console.error('Failed:', error.message);
  process.exit(1);
}

console.log(`Granted admin on SmartDelta to ${email} (${user.id})`);