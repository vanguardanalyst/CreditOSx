import { NextRequest, NextResponse } from 'next/server';

const dashboardPaths = ['/dashboard', '/upload', '/portfolio', '/alerts', '/settings'];
const proOnlyPaths = ['/portfolio', '/alerts'];

async function getUserSession(req: NextRequest) {
  const token = req.cookies.get('sb-access-token')?.value;

  if (!token || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    },
    cache: 'no-store'
  });

  if (!response.ok) return null;
  return response.json();
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isDashboardPath = dashboardPaths.some((route) => path.startsWith(route));
  const session = await getUserSession(req);

  if (isDashboardPath && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (session && proOnlyPaths.some((route) => path.startsWith(route))) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=subscription_status&id=eq.${session.id}`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          Authorization: `Bearer ${req.cookies.get('sb-access-token')?.value || ''}`
        }
      }
    );
    const data = (await response.json()) as { subscription_status: string }[];
    const tier = data?.[0]?.subscription_status ?? 'free';

    if (tier !== 'pro') {
      return NextResponse.redirect(new URL('/settings?upgrade=1', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/upload/:path*', '/portfolio/:path*', '/alerts/:path*', '/settings/:path*']
};
