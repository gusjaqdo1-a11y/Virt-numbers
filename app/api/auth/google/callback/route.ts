import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signSession } from '@/lib/auth';
import { getAppUrl } from '@/lib/app-url';

export async function GET(req: Request) {
  const base = getAppUrl(req);
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) throw new Error('GOOGLE_CONFIG_MISSING');

    const u = new URL(req.url);
    const code = u.searchParams.get('code');
    const state = u.searchParams.get('state');
    const oauthError = u.searchParams.get('error');
    const c = await cookies();

    if (oauthError) return NextResponse.redirect(`${base}/login?error=google_denied`);
    if (!code || !state || state !== c.get('google_oauth_state')?.value) {
      return NextResponse.redirect(`${base}/login?error=google_state`);
    }

    const redirectUri = `${base}/api/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    });
    if (!tokenRes.ok) {
      console.error('[auth/google/callback] token exchange failed', await tokenRes.text());
      throw new Error('GOOGLE_TOKEN_FAILED');
    }

    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error('GOOGLE_ACCESS_TOKEN_MISSING');

    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: 'no-store',
    });
    if (!infoRes.ok) throw new Error('GOOGLE_USERINFO_FAILED');

    const info = await infoRes.json();
    if (!info.email) throw new Error('GOOGLE_EMAIL_MISSING');

    const email = String(info.email).trim().toLowerCase();
    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: info.name || null,
          googleId: info.sub,
          emailVerified: true,
        },
      });
    } else if (!user.googleId) {
      user = await db.user.update({
        where: { id: user.id },
        data: { googleId: info.sub, emailVerified: true, name: user.name || info.name || null },
      });
    }

    if (user.suspended) return NextResponse.redirect(`${base}/login?error=suspended`);

    const session = await signSession(user.id);
    c.set('numelixa_session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    c.delete('google_oauth_state');
    return NextResponse.redirect(base);
  } catch (error) {
    console.error('[auth/google/callback] failed', error);
    return NextResponse.redirect(`${base}/login?error=google_failed`);
  }
}
