import {NextResponse} from 'next/server'; export async function POST(){return NextResponse.json({success:true,message:'If the email exists, password reset instructions will be sent.'})}
