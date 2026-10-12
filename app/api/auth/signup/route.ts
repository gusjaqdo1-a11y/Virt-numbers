import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Email and password (8+ characters) are required.' } },
        { status: 400 },
      );
    }

    if (!process.env.MONGODB_URI) {
      console.error('[auth/signup] MONGODB_URI is not configured');
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_CONFIG_ERROR', message: 'Authentication is temporarily unavailable. Please configure the database connection in Vercel.' } },
        { status: 503 },
      );
    }

    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      console.error('[auth/signup] JWT_SECRET is not configured');
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_CONFIG_ERROR', message: 'Authentication is temporarily unavailable. Please configure JWT_SECRET in Vercel.' } },
        { status: 503 },
      );
    }

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' } },
        { status: 409 },
      );
    }

    const user = await db.user.create({
      data: {
        email,
        name: name || null,
        passwordHash: await hashPassword(password),
      },
    });

    const token = await signSession(user.id);
    const res = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, balance: user.balance },
    });
    res.cookies.set('numelixa_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    return res;
  } catch (error) {
    console.error('[auth/signup] failed', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to create account. Check the Vercel deployment logs for the server error.' } },
      { status: 500 },
    );
  }
}
