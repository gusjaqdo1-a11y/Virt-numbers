import crypto from 'node:crypto'; import {db} from '@/lib/db'; import {provider} from '@/lib/providers';
export async function authenticateApi(req:Request){const key=req.headers.get('x-api-key')||req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!key)return null;const hash=crypto.createHash('sha256').update(key).digest('hex');const record=await db.apiKey.findUnique({where:{keyHash:hash}});if(!record?.active)return null;await db.apiKey.update({where:{id:record.id},data:{lastUsedAt:new Date()}});return record.userId}
export async function apiResponse(data:any){return Response.json({success:true,data})}
export async function apiError(code:string,message:string,status=400){return Response.json({success:false,error:{code,message}},{status})}
