import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readSession } from '@/lib/auth';
async function uid(req:NextRequest){ const bearer=req.headers.get('authorization')?.replace(/^Bearer\s+/i,''); if(bearer)return readSession(bearer); return readSession((await cookies()).get('numelixa_session')?.value); }
export async function POST(req:NextRequest){
 const userId=await uid(req); if(!userId)return NextResponse.json({success:false,error:{code:'UNAUTHORIZED',message:'Sign in required'}},{status:401});
 const b=await req.json(); const token=String(b.token||'').trim(); if(!token)return NextResponse.json({success:false,error:{code:'INVALID_REQUEST',message:'Device token required'}},{status:400});
 await db.pushToken.upsert({where:{token},create:{userId,token,platform:String(b.platform||'android')},update:{userId,platform:String(b.platform||'android')}});
 return NextResponse.json({success:true});
}
