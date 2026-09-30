import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_INTERESTS = [
  "Texnologiya",
  "Startap",
  "Karyera",
  "AI",
  "Biznes",
  "Ta'lim",
  "Dasturlash",
  "Kripto & Moliya",
  "Marketing",
];

async function main() {
  console.log("🌱 Seeding default Uzbek interests...");

  for (const name of DEFAULT_INTERESTS) {
    const interest = await prisma.interest.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(` - Upserted interest: ${interest.name} (${interest.id})`);
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
