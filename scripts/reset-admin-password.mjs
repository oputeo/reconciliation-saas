import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.local');

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      const key = l.slice(0, i).trim();
      let val = l.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      return [key, val];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing SUPABASE URL or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = process.argv[2] || 'admin@oeosolution.com';
const tempPassword =
  process.argv[3] ||
  `ReconFlow-${Math.random().toString(36).slice(2, 10)}-Tmp1!`;

let user = null;
let page = 1;
while (!user && page <= 20) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
  if (error) {
    console.error('LIST_ERROR', error.message);
    process.exit(1);
  }
  user =
    data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase()) ||
    null;
  if (!data.users.length || data.users.length < 100) break;
  page += 1;
}

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: 'OEO Admin' },
  });
  if (error) {
    console.error('CREATE_ERROR', error.message);
    process.exit(1);
  }
  user = data.user;
  console.log('ACTION=created');
} else {
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: tempPassword,
    email_confirm: true,
  });
  if (error) {
    console.error('UPDATE_ERROR', error.message);
    process.exit(1);
  }
  console.log('ACTION=password_reset');
}

const tenantId = '0771c1a1-4ff0-46a1-9f98-c6b30fdff049';
const { error: roleErr } = await admin.from('user_roles').upsert(
  {
    user_id: user.id,
    tenant_id: tenantId,
    role: 'admin',
  },
  { onConflict: 'user_id,tenant_id' },
);

if (roleErr) {
  console.log('ROLE_WARNING=' + roleErr.message);
} else {
  console.log('ROLE=admin_ok');
}

console.log('EMAIL=' + email);
console.log('TEMP_PASSWORD=' + tempPassword);
console.log('USER_ID=' + user.id);
console.log('LOGIN_URL=https://reconciliation-stable-saas.vercel.app/login');
