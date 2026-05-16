import { promises as fs } from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  (await fs.readFile('.env.local', 'utf8'))
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(line => !line.trim().startsWith('#'))
    .map(line => line.split('=', 2).map(part => part.trim()))
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await supabase.from('profiles').select('id').limit(1);
console.log(JSON.stringify({ data, error }, null, 2));
