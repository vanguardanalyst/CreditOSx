'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithMagicLink } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Use magic link authentication for secure access.');

  const login = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await signInWithMagicLink(email, `${location.origin}/dashboard`);
      setStatus('Check your inbox for a secure sign-in link.');
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Login failed.');
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6">
      <div className="panel w-full rounded-2xl p-8">
        <h1 className="text-2xl font-semibold">Sign in to CreditOS</h1>
        <p className="mt-2 text-sm text-slate-300">Institutional credit intelligence platform access.</p>
        <form className="mt-6 space-y-4" onSubmit={login}>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="analyst@fund.com"
          />
          <button className="w-full rounded-md bg-mutedBlue px-4 py-2 text-sm font-medium text-white" type="submit">
            Send magic link
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-400">{status}</p>
      </div>
    </main>
  );
}
