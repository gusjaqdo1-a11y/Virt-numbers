import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json().catch(() => ({}));
    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!configuredEmail || !configuredPassword) return NextResponse.json({ success: false, error: { code: 'ADMIN_NOT_CONFIGURED', message: 'Admin credentials are not configured in Vercel.' } }, { status: 503 });
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: false, error: { code: 'AUTH_CONFIG_ERROR', message: 'MONGODB_URI is not configured in Vercel.' } }, { status: 503 });
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') return NextResponse.json({ success: false, error: { code: 'AUTH_CONFIG_ERROR', message: 'JWT_SECRET is not configured in Vercel.' } }, { status: 503 });

    if (String(email || '').trim().toLowerCase() !== configuredEmail || String(password || '') !== configuredPassword) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid admin credentials.' } }, { status: 401 });
    }

    // Keep the env credentials authoritative, while also provisioning the
    // corresponding MongoDB user so the admin console can resolve its owner.
    await db.user.upsert({
      where: { email: configuredEmail },
      create: { email: configuredEmail, passwordHash: await hashPassword(configuredPassword), role: 'ADMIN', emailVerified: true },
      update: { role: 'ADMIN', emailVerified: true },
    });

    const token = await signAdminSession(configuredEmail);
    const res = NextResponse.json({ success: true });
    res.cookies.set('numelixa_admin', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 12, path: '/' });
    return res;
  } catch (error) {
    console.error('[admin/login] failed', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Admin login could not reach the database.' } }, { status: 500 });
  }
}
