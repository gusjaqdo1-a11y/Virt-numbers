import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return NextResponse.redirect(new URL('/login?error=google_config', req.url));

  const state = randomBytes(24).toString('hex');
  const c = await cookies();
  c.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  const base = (process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(req.url).origin).replace(/\/$/, '');
  const redirectUri = `${base}/api/auth/google/callback`;
  const p = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  p.searchParams.set('client_id', clientId);
  p.searchParams.set('redirect_uri', redirectUri);
  p.searchParams.set('response_type', 'code');
  p.searchParams.set('scope', 'openid email profile');
  p.searchParams.set('state', state);
  return NextResponse.redirect(p);
}
