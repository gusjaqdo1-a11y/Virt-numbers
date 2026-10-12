# Numelixa Virtual Numbers

Production-oriented foundation for Numelixa.com: virtual-number marketplace, provider adapters, wallet/payments, admin operations, developer API, documentation, and Android client architecture.

## Security

Never commit provider/API/payment secrets. Copy `.env.example` to `.env.local` for local development and configure production secrets in Vercel/server environment variables.

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
