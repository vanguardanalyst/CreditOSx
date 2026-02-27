'use client';

export async function signInWithMagicLink(email: string, redirectTo: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, create_user: true, data: {}, gotrue_meta_security: {}, redirect_to: redirectTo })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || 'Magic link request failed.');
  }
}
