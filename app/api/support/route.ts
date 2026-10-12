import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readSession } from '@/lib/auth';
import { sendEmail, emailLayout } from '@/lib/email';

export async function POST(req:NextRequest){const uid=await readSession((await cookies()).get('numelixa_session')?.value);if(!uid)return NextResponse.json({success:false,error:{code:'UNAUTHORIZED',message:'Please sign in.'}},{status:401});const u=await db.user.findUnique({where:{id:uid}});if(!u)return NextResponse.json({success:false,error:{code:'UNAUTHORIZED',message:'Please sign in.'}},{status:401});const b=await req.json();if(!b.subject||!b.message)return NextResponse.json({success:false,error:{code:'INVALID_REQUEST',message:'Subject and message are required.'}},{status:400});const t=await db.supportTicket.create({data:{userId:uid,email:u.email,subject:String(b.subject),message:String(b.message)}});await sendEmail(process.env.SUPPORT_EMAIL||'info@numelixa.com',`Support ticket: ${t.subject}`,emailLayout(`New support ticket`,`<p><b>From:</b> ${u.email}</p><p><b>Subject:</b> ${t.subject}</p><p>${t.message.replace(/</g,'&lt;')}</p><p>Ticket ID: ${t.id}</p>`)).catch(()=>null);return NextResponse.json({success:true,ticket:{id:t.id,status:t.status}})}
