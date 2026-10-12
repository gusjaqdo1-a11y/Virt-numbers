import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, signSession } from '@/lib/auth';
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const user = await db.user.findUnique({ where: { email: String(email || '').toLowerCase() } });
    if (!user || !user.passwordHash || !(await verifyPassword(String(password || ''), user.passwordHash))) return NextResponse.json({ success:false, error:{ code:'UNAUTHORIZED', message:'Invalid email or password.' } }, { status:401 });
    if (user.suspended) return NextResponse.json({ success:false, error:{ code:'ACCOUNT_SUSPENDED', message:'Your account is suspended.' } }, { status:403 });
    const accessToken = await signSession(user.id);
    return NextResponse.json({ success:true, accessToken, user:{ id:user.id, email:user.email, name:user.name, balance:user.balance } });
  } catch { return NextResponse.json({ success:false, error:{ code:'INTERNAL_ERROR', message:'Unable to sign in.' } }, { status:500 }); }
}
