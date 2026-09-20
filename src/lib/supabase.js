import { createClient } from '@supabase/supabase-js';

// Resolve credenciais tanto das variáveis de ambiente (Vercel/Vite) quanto do localStorage
export function getSupabaseCredentials() {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
    '';

  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
    '';

  let localUrl = '';
  let localKey = '';
  if (typeof window !== 'undefined') {
    try {
      localUrl = localStorage.getItem('gc_supabase_url') || '';
      localKey = localStorage.getItem('gc_supabase_anon_key') || '';
    } catch {}
  }

  const finalUrl = (envUrl || localUrl).trim();
  const finalKey = (envKey || localKey).trim();

  const isConfigured = Boolean(
    finalUrl &&
    finalKey &&
    finalUrl !== 'https://your-project.supabase.co' &&
    !finalUrl.includes('placeholder')
  );

  const source = envUrl ? 'env' : localUrl ? 'local' : 'none';

  return { url: finalUrl, anonKey: finalKey, isConfigured, source };
}

export function saveSupabaseCredentials(url, anonKey) {
  if (typeof window !== 'undefined') {
    if (url && anonKey) {
      localStorage.setItem('gc_supabase_url', url.trim());
      localStorage.setItem('gc_supabase_anon_key', anonKey.trim());
    } else {
      localStorage.removeItem('gc_supabase_url');
      localStorage.removeItem('gc_supabase_anon_key');
    }
  }
}

// Instância singleton do Supabase Client
let clientInstance = null;
let currentKey = null;

export function getSupabaseClient() {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  const cacheKey = `${url}:${anonKey}`;
  if (clientInstance && currentKey === cacheKey) {
    return clientInstance;
  }

  clientInstance = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  currentKey = cacheKey;

  return clientInstance;
}

// Fallback export para compatibilidade
export const supabase = {
  from: (...args) => {
    const client = getSupabaseClient();
    if (!client) {
      return {
        select: () => Promise.resolve({ data: null, error: new Error('Supabase não configurado') }),
        update: () => Promise.resolve({ data: null, error: new Error('Supabase não configurado') }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase não configurado') }),
        delete: () => Promise.resolve({ data: null, error: new Error('Supabase não configurado') }),
      };
    }
    return client.from(...args);
  },
  get storage() {
    const client = getSupabaseClient();
    if (!client) {
      return {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: new Error('Supabase não configurado') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        }),
      };
    }
    return client.storage;
  },
};

export const isSupabaseConfigured = () => getSupabaseCredentials().isConfigured;

export default supabase;
