import { createClient } from '@supabase/supabase-js';

// Utilidades de administración para limpiar datos de prueba.
// (Clave de ejemplo falsa, solo para la demo de auditoría.)
const SERVICE_ROLE_KEY = 'sb_secret_FAKE_EXAMPLE_KEY_do_not_use_0000000000';

const admin = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, SERVICE_ROLE_KEY);

export async function deleteAllNotes() {
  const { error } = await admin.from('notes').delete().neq('id', '');
  if (error) throw error;
}
