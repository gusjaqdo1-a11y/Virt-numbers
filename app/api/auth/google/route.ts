import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
export async function GET(){const state=randomBytes(24).toString('hex');const c=await cookies();c.set('google_oauth_state',state,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:600,path:'/'});const p=new URL('https://accounts.google.com/o/oauth2/v2/auth');p.searchParams.set('client_id',process.env.GOOGLE_CLIENT_ID||'');p.searchParams.set('redirect_uri',`${process.env.NEXT_PUBLIC_APP_URL||'https://numelixa.com'}/api/auth/google/callback`);p.searchParams.set('response_type','code');p.searchParams.set('scope','openid email profile');p.searchParams.set('state',state);return NextResponse.redirect(p)}
