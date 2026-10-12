import { createHash, randomBytes } from 'crypto';
import { db } from './db';

export function hashToken(token:string){return createHash('sha256').update(token).digest('hex')}
export function newToken(){return randomBytes(32).toString('hex')}
export async function audit(userId:string|undefined,action:string,target?:string,metadata?:unknown){await db.auditLog.create({data:{userId,action,target,metadata:metadata?JSON.stringify(metadata):undefined}})}
