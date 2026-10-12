import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createHash } from 'crypto';

export async function POST(req:NextRequest){const b=await req.json();if(!b.token||!b.password||String(b.password).length<8)return NextResponse.json({success:false,error:{code:'INVALID_REQUEST',message:'Valid token and password (8+ characters) are required.'}},{status:400});const h=createHash('sha256').update(String(b.token)).digest('hex');const r=await db.passwordReset.findFirst({where:{tokenHash:h,usedAt:null,expiresAt:{gt:new Date()}}});if(!r)return NextResponse.json({success:false,error:{code:'INVALID_TOKEN',message:'This reset link is invalid or expired.'}},{status:400});const u=await db.user.findUnique({where:{email:r.email}});if(!u)return NextResponse.json({success:false,error:{code:'INVALID_TOKEN',message:'This reset link is invalid.'}},{status:400});await db.user.update({where:{id:u.id},data:{passwordHash:await hashPassword(String(b.password))}});await db.passwordReset.update({where:{id:r.id},data:{usedAt:new Date()}});return NextResponse.json({success:true})}
