export function getAppUrl(req?: Request) {
  const normalize = (value: string) => {
    const raw = value.trim();
    if (!raw) return '';
    return (raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`).replace(/\/$/, '');
  };

  // Preview deployments must use the Vercel branch/deployment hostname rather
  // than the production NEXT_PUBLIC_APP_URL. This keeps OAuth callbacks on the
  // same host that started the login flow.
  if (process.env.VERCEL_ENV === 'preview') {
    const branchUrl = normalize(process.env.VERCEL_BRANCH_URL || '');
    if (branchUrl) return branchUrl;

    const deploymentUrl = normalize(process.env.VERCEL_URL || '');
    if (deploymentUrl) return deploymentUrl;
  }

  const configured = normalize(process.env.NEXT_PUBLIC_APP_URL || '');
  if (configured) return configured;

  const vercelUrl = normalize(process.env.VERCEL_URL || '');
  if (vercelUrl) return vercelUrl;

  if (req) return new URL(req.url).origin.replace(/\/$/, '');
  return 'http://localhost:3000';
}
