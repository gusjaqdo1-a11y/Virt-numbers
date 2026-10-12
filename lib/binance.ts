import crypto from 'node:crypto';

// Binance Pay uses the API identity key / Certificate SN in the
// BinancePay-Certificate-SN header. Do not use a normal Spot API key here.
const identityKey =
  process.env.BINANCE_PAY_CERTIFICATE_SN ||
  process.env.BINANCE_PAY_API_KEY ||
  '';
const secret =
  process.env.BINANCE_PAY_API_SECRET ||
  process.env.BINANCE_PAY_PRIVATE_KEY ||
  process.env.BINANCE_PAY_SECRET ||
  '';

export function binanceHeaders(body: string) {
  if (!identityKey || !secret) {
    throw new Error('Binance Pay credentials are not configured');
  }

  const ts = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${ts}\n${nonce}\n${body}\n`;
  const signature = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex')
    .toUpperCase();

  return {
    'Content-Type': 'application/json',
    'BinancePay-Timestamp': ts,
    'BinancePay-Nonce': nonce,
    'BinancePay-Certificate-SN': identityKey,
    'BinancePay-Signature': signature,
  };
}

export async function createBinancePayOrder(
  amount: number,
  merchantTradeNo: string,
  currency = 'USDT',
) {
  const body = JSON.stringify({
    env: { terminalType: 'WEB' },
    merchantTradeNo,
    orderExpireTime: Date.now() + 15 * 60 * 1000,
    orderAmount: amount,
    currency,
    description: 'Numelixa wallet top-up',
    goods: {
      goodsType: '02',
      goodsCategory: 'Z000',
      referenceGoodsId: merchantTradeNo,
      goodsName: 'Numelixa balance',
    },
  });

  const r = await fetch(
    'https://bpay.binanceapi.com/binancepay/openapi/order',
    {
      method: 'POST',
      headers: binanceHeaders(body),
      body,
    },
  );

  return r.json();
}

export async function queryBinancePayOrder(merchantTradeNo: string) {
  const body = JSON.stringify({ merchantTradeNo });
  const r = await fetch(
    'https://bpay.binanceapi.com/binancepay/openapi/order/query',
    {
      method: 'POST',
      headers: binanceHeaders(body),
      body,
    },
  );

  return r.json();
}
