export type ProviderResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

export interface NumberProvider {
  name: string;
  getCountries(): Promise<ProviderResult<unknown>>;
  getServices(country: string): Promise<ProviderResult<unknown>>;
  buyNumber(service: string, country: string): Promise<ProviderResult<{ id: string; phone: string; price: number }>>;
  getSms(id: string): Promise<ProviderResult<{ code?: string; text?: string; status: string }>>;
  cancel(id: string): Promise<ProviderResult<unknown>>;
}

const headers = (key: string) => ({
  Authorization: key,
  Accept: 'application/json',
  'Content-Type': 'application/json',
});

async function json(r: Response): Promise<unknown> {
  return r.json().catch(() => null);
}

export class FiveSimProvider implements NumberProvider {
  name = '5sim';
  private key = process.env.FIVESIM_API_KEY || '';

  async getCountries(): Promise<ProviderResult<unknown>> {
    const r = await fetch('https://5sim.net/v1/guest/countries', { cache: 'no-store' });
    if (r.ok) return { ok: true, data: await json(r) };
    return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'Provider temporarily unavailable.' };
  }

  async getServices(c: string): Promise<ProviderResult<unknown>> {
    const r = await fetch(`https://5sim.net/v1/guest/products/${encodeURIComponent(c)}/any`, { cache: 'no-store' });
    if (r.ok) return { ok: true, data: await json(r) };
    return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'Services temporarily unavailable.' };
  }

  async buyNumber(s: string, c: string): Promise<ProviderResult<{ id: string; phone: string; price: number }>> {
    const r = await fetch(`https://5sim.net/v1/user/buy/activation/${encodeURIComponent(c)}/any/${encodeURIComponent(s)}`, {
      headers: headers(this.key),
    });
    const d = await json(r) as { id?: unknown; phone?: unknown; price?: unknown } | null;
    if (r.ok) {
      return {
        ok: true,
        data: {
          id: String(d?.id ?? ''),
          phone: String(d?.phone ?? ''),
          price: Number(d?.price || 0),
        },
      };
    }
    return {
      ok: false,
      code: r.status === 400 ? 'NUMBER_UNAVAILABLE' : 'PROVIDER_UNAVAILABLE',
      message: 'This number is currently unavailable.',
    };
  }

  async getSms(id: string): Promise<ProviderResult<{ code?: string; text?: string; status: string }>> {
    const r = await fetch(`https://5sim.net/v1/user/check/${id}`, {
      headers: headers(this.key),
      cache: 'no-store',
    });
    const d = await json(r) as { sms?: Array<{ code?: unknown; text?: unknown }>; status?: unknown } | null;
    if (r.ok) {
      const sms = d?.sms?.[0];
      return {
        ok: true,
        data: {
          code: sms?.code == null ? undefined : String(sms.code),
          text: sms?.text == null ? undefined : String(sms.text),
          status: String(d?.status || 'PENDING'),
        },
      };
    }
    return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'SMS status unavailable.' };
  }

  async cancel(id: string): Promise<ProviderResult<unknown>> {
    const r = await fetch(`https://5sim.net/v1/user/cancel/${id}`, { headers: headers(this.key) });
    if (r.ok) return { ok: true, data: await json(r) };
    return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'Cancellation failed.' };
  }
}

export class SmsTigerProvider implements NumberProvider {
  name = 'sms-tiger';
  private key = process.env.SMS_TIGER_API_KEY || '';

  async getCountries(): Promise<ProviderResult<unknown>> {
    return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'SMS-Tiger integration requires its current API endpoint configuration.' };
  }

  async getServices(_c: string): Promise<ProviderResult<unknown>> {
    return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'Services temporarily unavailable.' };
  }

  async buyNumber(_s: string, _c: string): Promise<ProviderResult<{ id: string; phone: string; price: number }>> {
    return { ok: false, code: 'NUMBER_UNAVAILABLE', message: 'No number is currently available.' };
  }

  async getSms(_id: string): Promise<ProviderResult<{ code?: string; text?: string; status: string }>> {
    return { ok: false, code: 'PROVIDER_UNAVAILABLE', message: 'SMS status unavailable.' };
  }

  async cancel(_id: string): Promise<ProviderResult<unknown>> {
    return { ok: true, data: {} };
  }
}

function instances(): NumberProvider[] {
  return (process.env.PRIMARY_PROVIDER || '5sim').toLowerCase() === 'sms-tiger'
    ? [new SmsTigerProvider(), new FiveSimProvider()]
    : [new FiveSimProvider(), new SmsTigerProvider()];
}

export function provider(): NumberProvider {
  const ps = instances();
  const primary = ps[0];
  const fallback = ps[1];

  return {
    name: primary.name,
    buyNumber: async (s, c) => {
      for (const p of ps) {
        const r = await p.buyNumber(s, c);
        if (r.ok) return r;
      }
      return { ok: false, code: 'NUMBER_UNAVAILABLE', message: 'No provider currently has this number available.' };
    },
    getSms: primary.getSms.bind(primary),
    cancel: primary.cancel.bind(primary),
    getCountries: primary.getCountries.bind(primary),
    getServices: primary.getServices.bind(primary),
  };
}
