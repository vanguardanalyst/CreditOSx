import { cookies } from 'next/headers';

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getSessionFromCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  if (!token || !baseUrl || !anonKey) {
    return null;
  }

  const response = await fetch(`${baseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function fetchSupabaseTable(
  table: string,
  query: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: unknown
) {
  if (!baseUrl || !anonKey) {
    throw new Error('Supabase env vars not configured.');
  }

  const token = cookies().get('sb-access-token')?.value;
  const response = await fetch(`${baseUrl}/rest/v1/${table}?${query}`, {
    method,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token ?? anonKey}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : 'return=minimal'
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });

  return response;
}
