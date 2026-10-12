import bcrypt from 'bcryptjs'; import { SignJWT, jwtVerify } from 'jose';
const secret=new TextEncoder().encode(process.env.JWT_SECRET||'development-secret-change-me');
export async function hashPassword(p:string){return bcrypt.hash(p,12)}
export async function verifyPassword(p:string,h:string){return bcrypt.compare(p,h)}
export async function signSession(id:string){return new SignJWT({sub:id}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(secret)}
export async function readSession(token?:string){if(!token)return null;try{return (await jwtVerify(token,secret)).payload.sub||null}catch{return null}}
