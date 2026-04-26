// src/lib/supabaseClient.ts
// Clientes de Supabase: uno público (lecturas) y uno admin (escrituras server-side).

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
  );
}

// Cliente público: lecturas, respeta RLS. Seguro para usar tanto en server como client.
export const supabase: SupabaseClient = createClient(url, publishableKey, {
  auth: { persistSession: false },
});

// Cliente admin: bypass RLS. SOLO usar en route handlers / server actions.
let adminClient: SupabaseClient | null = null;
export const getSupabaseAdmin = (): SupabaseClient => {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin no se puede usar en el cliente');
  }
  if (!secretKey) {
    throw new Error('Falta SUPABASE_SECRET_KEY en el entorno del servidor');
  }
  if (!adminClient) {
    adminClient = createClient(url!, secretKey, {
      auth: { persistSession: false },
    });
  }
  return adminClient;
};
