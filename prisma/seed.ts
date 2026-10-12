import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

type CountrySeed = readonly [name: string, iso: string, dialCode: string];
type ServiceSeed = readonly [name: string, price: number];

const countries: CountrySeed[] = [
  ['United States', 'US', '1'],
  ['United Kingdom', 'GB', '44'],
  ['Canada', 'CA', '1'],
  ['Germany', 'DE', '49'],
  ['France', 'FR', '33'],
  ['Ethiopia', 'ET', '251'],
];

const services: ServiceSeed[] = [
  ['Telegram', 1],
  ['WhatsApp', 1.25],
  ['Google', 1.5],
  ['Facebook', 1.1],
];

async function main() {
  for (const [name, iso, dialCode] of countries) {
    const country = await db.country.upsert({
      where: { iso },
      update: { name, dialCode, active: true },
      create: { name, iso, dialCode },
    });

    for (const [serviceName, price] of services) {
      const slug = serviceName.toLowerCase();
      await db.service.upsert({
        where: {
          countryId_slug: {
            countryId: country.id,
            slug,
          },
        },
        update: {
          basePrice: price,
          active: true,
        },
        create: {
          countryId: country.id,
          name: serviceName,
          slug,
          basePrice: price,
        },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
