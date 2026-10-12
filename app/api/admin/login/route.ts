import { NextRequest, NextResponse } from 'next/server';
import { signAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredEmail || !configuredPassword) {
    return NextResponse.json(
      { success: false, error: { code: 'ADMIN_NOT_CONFIGURED', message: 'Admin credentials are not configured.' } },
      { status: 503 },
    );
  }

  if (
    String(email || '').trim().toLowerCase() !== configuredEmail ||
    String(password || '') !== configuredPassword
  ) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid admin credentials.' } },
      { status: 401 },
    );
  }

  const token = await signAdminSession(configuredEmail);
  const res = NextResponse.json({ success: true });
  res.cookies.set('numelixa_admin', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 12,
    path: '/',
  });
  return res;
}
