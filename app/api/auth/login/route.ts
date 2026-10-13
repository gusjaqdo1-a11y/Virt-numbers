import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signSession, verifyPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Email and password are required.' } }, { status: 400 });
    }
    if (!process.env.MONGODB_URI) {
      console.error('[auth/login] MONGODB_URI is not configured');
      return NextResponse.json({ success: false, error: { code: 'AUTH_CONFIG_ERROR', message: 'Authentication is temporarily unavailable. Please configure MONGODB_URI in Vercel.' } }, { status: 503 });
    }
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      console.error('[auth/login] JWT_SECRET is not configured');
      return NextResponse.json({ success: false, error: { code: 'AUTH_CONFIG_ERROR', message: 'Authentication is temporarily unavailable. Please configure JWT_SECRET in Vercel.' } }, { status: 503 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.suspended || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' } }, { status: 401 });
    }
    if (!user.emailVerified) {
      return NextResponse.json({ success: false, error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email with the 6-digit code before signing in.' } }, { status: 403 });
    }

    const token = await signSession(user.id);
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, balance: user.balance } });
    res.cookies.set('numelixa_session', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
    return res;
  } catch (error) {
    console.error('[auth/login] failed', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to sign in. The server could not complete the database/authentication request.' } }, { status: 500 });
  }
}
