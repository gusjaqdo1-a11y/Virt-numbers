import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signSession } from '@/lib/auth';

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  try {
    const u = new URL(req.url);
    const code = u.searchParams.get('code');
    const state = u.searchParams.get('state');
    const c = await cookies();
    if (!code || !state || state !== c.get('google_oauth_state')?.value) return NextResponse.redirect(`${base}/login?error=google_state`);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID || '', client_secret: process.env.GOOGLE_CLIENT_SECRET || '', redirect_uri: `${base}/api/auth/google/callback`, grant_type: 'authorization_code' }),
    });
    if (!tokenRes.ok) throw new Error('GOOGLE_TOKEN_FAILED');
    const tokens = await tokenRes.json();
    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!infoRes.ok) throw new Error('GOOGLE_USERINFO_FAILED');
    const info = await infoRes.json();
    if (!info.email) throw new Error('GOOGLE_EMAIL_MISSING');

    let user = await db.user.findUnique({ where: { email: String(info.email).toLowerCase() } });
    if (!user) user = await db.user.create({ data: { email: String(info.email).toLowerCase(), name: info.name || null, googleId: info.sub, emailVerified: true } });
    else if (!user.googleId) user = await db.user.update({ where: { id: user.id }, data: { googleId: info.sub, emailVerified: true, name: user.name || info.name || null } });

    const session = await signSession(user.id);
    c.set('numelixa_session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
    c.delete('google_oauth_state');
    return NextResponse.redirect(base);
  } catch {
    return NextResponse.redirect(`${base}/login?error=google_failed`);
  }
}
