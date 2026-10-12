import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readAdminSession } from '@/lib/auth';
import { audit } from '@/lib/security';
import { pushToTokens } from '@/lib/firebase';

async function admin() {
  const email = await readAdminSession((await cookies()).get('numelixa_admin')?.value);
  return email ? db.user.findFirst({ where: { email, role: 'ADMIN' } }) : null;
}
export async function GET() {
  const a = await admin(); if (!a) return NextResponse.json({ success:false,error:{code:'FORBIDDEN',message:'Admin sign-in required'}},{status:403});
  const [users,orders,payments,tickets,tx] = await Promise.all([
    db.user.findMany({orderBy:{createdAt:'desc'},take:100,select:{id:true,email:true,name:true,role:true,balance:true,suspended:true,createdAt:true}}),
    db.order.findMany({orderBy:{createdAt:'desc'},take:100,include:{user:{select:{email:true}},service:{include:{country:true}}}}),
    db.payment.findMany({orderBy:{createdAt:'desc'},take:100,include:{user:{select:{email:true}}}}),
    db.supportTicket.findMany({orderBy:{createdAt:'desc'},take:100,include:{user:{select:{email:true}}}}),
    db.transaction.findMany({orderBy:{createdAt:'desc'},take:100,include:{user:{select:{email:true}}}})
  ]);
  return NextResponse.json({success:true,users,orders,payments,tickets,transactions:tx,settings:await db.setting.findMany()});
}
export async function POST(req:NextRequest) {
  const a=await admin(); if(!a)return NextResponse.json({success:false,error:{code:'FORBIDDEN',message:'Admin sign-in required'}},{status:403});
  const b=await req.json(); try {
    if(b.action==='user_update'){const u=await db.user.update({where:{id:b.userId},data:{suspended:Boolean(b.suspended),role:b.role||undefined,name:b.name}});await audit(a.id,'USER_UPDATE',u.id,{suspended:u.suspended,role:u.role});return NextResponse.json({success:true,user:u});}
    if(b.action==='balance'){const amount=Number(b.amount);if(!Number.isFinite(amount)||amount===0)throw new Error('INVALID_AMOUNT');const u=await db.user.update({where:{id:b.userId},data:{balance:{increment:amount}}});await db.transaction.create({data:{userId:u.id,type:amount>0?'ADJUSTMENT':'REFUND',amount,currency:'USD',reference:`ADMIN-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,note:b.note||'Admin balance adjustment'}});await audit(a.id,'BALANCE_ADJUSTMENT',u.id,{amount,note:b.note});return NextResponse.json({success:true,balance:u.balance});}
    if(b.action==='push'){const rows=b.userId?await db.pushToken.findMany({where:{userId:b.userId}}):await db.pushToken.findMany({select:{token:true}});const result=await pushToTokens(rows.map(x=>x.token),String(b.title||'NUMELIXA'),String(b.body||''));await audit(a.id,'PUSH_NOTIFICATION',b.userId||'ALL',{title:b.title,body:b.body,result});return NextResponse.json({success:true,result});}
    if(b.action==='ticket'){const t=await db.supportTicket.update({where:{id:b.ticketId},data:{status:b.status||'IN_PROGRESS',adminReply:b.reply}});await audit(a.id,'SUPPORT_TICKET_UPDATE',t.id,{status:t.status});return NextResponse.json({success:true,ticket:t});}
    if(b.action==='setting'){const s=await db.setting.upsert({where:{key:b.key},create:{key:b.key,value:String(b.value)},update:{value:String(b.value)}});await audit(a.id,'SETTING_UPDATE',s.key,{value:s.value});return NextResponse.json({success:true,setting:s});}
    return NextResponse.json({success:false,error:{code:'INVALID_REQUEST',message:'Unknown admin action'}},{status:400});
  } catch(e) { return NextResponse.json({success:false,error:{code:'ADMIN_ACTION_FAILED',message:e instanceof Error?e.message:'Admin action failed'}},{status:400}); }
}
