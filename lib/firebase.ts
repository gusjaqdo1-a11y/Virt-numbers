import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export function firebaseReady(){return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)}
function app(){
  if(!firebaseReady()) throw new Error('FIREBASE_NOT_CONFIGURED');
  const existing=getApps()[0];
  if(existing) return existing;
  return initializeApp({credential:cert({projectId:process.env.FIREBASE_PROJECT_ID!,clientEmail:process.env.FIREBASE_CLIENT_EMAIL!,privateKey:process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g,'\n')})});
}
export async function pushToTokens(tokens:string[],title:string,body:string,data:Record<string,string>={}){
  if(!tokens.length) return {successCount:0,failureCount:0};
  const r=await getMessaging(app()).sendEachForMulticast({tokens,notification:{title,body},data});
  return {successCount:r.successCount,failureCount:r.failureCount};
}
