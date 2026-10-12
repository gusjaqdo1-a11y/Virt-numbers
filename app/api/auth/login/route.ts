import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signSession, verifyPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'Email and password are required.' } },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user || user.suspended || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid email or password.' } },
        { status: 401 },
      );
    }

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
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to sign in.' } },
      { status: 500 },
    );
  }
}
