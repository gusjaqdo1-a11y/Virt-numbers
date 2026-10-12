import { authenticateApi, apiError, apiResponse } from '@/lib/developer';
import { db } from '@/lib/db';
export async function GET(req: Request) {
  const uid = await authenticateApi(req);
  if (!uid) return apiError('INVALID_API_KEY', 'API key is invalid or inactive.', 401);
  const orders = await db.order.findMany({ where: { userId: uid }, orderBy: { createdAt: 'desc' }, take: 100 });
  return apiResponse(orders.map(o => ({ id: o.id, number: o.phoneNumber, status: o.status, smsCode: o.smsCode, expiresAt: o.expiresAt })));
}
