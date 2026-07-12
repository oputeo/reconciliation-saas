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
const tid = '8f3e2a1b-4c5d-6e7f-8a9b-0c1d2e3f4a5b';

const { data: tenant } = await sb.from('tenants').select('id,name,slug').eq('id', tid).single();
console.log('Tenant:', tenant);

const { data: roles, error: rolesErr } = await sb.from('user_roles')
  .select('user_id, role')
  .eq('tenant_id', tid);
console.log('user_roles for SmartDelta:', rolesErr?.message || roles);

const { data: authUsers } = await sb.auth.admin.listUsers({ perPage: 200 });
const admin = authUsers?.users?.find((u) => u.email === 'admin@oeosolution.com');
console.log('admin auth user:', admin ? { id: admin.id, email: admin.email } : null);

if (admin?.id) {
  const { data: adminRoles, error: arErr } = await sb.from('user_roles')
    .select('tenant_id, role')
    .eq('user_id', admin.id);
  console.log('admin roles:', arErr?.message || adminRoles);
  if (adminRoles?.length) {
    const { data: names } = await sb.from('tenants').select('id,name').in('id', adminRoles.map((r) => r.tenant_id));
    const map = new Map((names || []).map((t) => [t.id, t.name]));
    for (const r of adminRoles) console.log('  -', map.get(r.tenant_id) || r.tenant_id, `(${r.role})`);
  }
}