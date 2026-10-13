# Numelixa Virtual Numbers

Production-oriented foundation for Numelixa.com: virtual-number marketplace, provider adapters, wallet/payments, admin operations, developer API, documentation, and Android client architecture.

## Database configuration

MongoDB is the only application database. Prisma is configured with the MongoDB connector and reads **only** `MONGODB_URI` from the environment. Do not configure or use `DATABASE_URL`.

Example:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
```

## Authentication

Email/password authentication and Google Sign-In use the same MongoDB database and Numelixa session cookie.

Required server variables:

```env
MONGODB_URI=...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://YOUR-PRODUCTION-DOMAIN
```

### Vercel Preview + Google Sign-In

Preview deployments do **not** use the production `NEXT_PUBLIC_APP_URL` for OAuth. The app automatically uses Vercel's preview branch/deployment hostname, so the callback stays on the same preview host that started the login flow.

For the Google OAuth Web client, add the exact preview callback shown by the Vercel deployment as an **Authorized redirect URI**:

```text
https://YOUR-PREVIEW-HOST/api/auth/google/callback
```

Google requires the redirect URI to match the registered URI exactly, including HTTPS, host, path, and trailing slash.

For production, register the production callback separately:

```text
https://YOUR-PRODUCTION-DOMAIN/api/auth/google/callback
```

Never commit provider/API/payment secrets. Copy `.env.example` to `.env.local` for local development and configure production/preview secrets in Vercel/server environment variables.

## Planned modules

- Authentication and account recovery
- User wallet and transactions
- Countries, services, numbers, orders and SMS codes
- Provider adapters for 5SIM and SMS-Tiger with normalized Numelixa errors
- Admin provider selection/fallback and pricing rules
- Per-user and developer pricing
- Payment invoices with expiry handling
- Developer API and API keys
- Firebase push notification integration
- Terms, Privacy, FAQ and Rules
- Lightweight Android client

This repository intentionally ships a secure foundation first; provider/payment credentials and production configuration are environment-specific.
