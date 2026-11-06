import { PrismaClient, ProductStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import "dotenv/config";

// 1. Setup the adapter
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing in .env");
}
const adapter = new PrismaPg({ connectionString });

// 2. Pass the adapter to the client
const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin user
  await prisma.user.upsert({
    where: { email: "admin@shop.com" },
    update: {},
    create: {
      email: "admin@shop.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      name: "Admin",
      role: "ADMIN",
    },
  });

  // Category
  const electronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { slug: "electronics", name: "Electronics" },
  });

  // Products
  const products = [
    { slug: "wireless-headphones", title: "Wireless Headphones", price: 12999, sku: "WH-001" },
    { slug: "mechanical-keyboard", title: "Mechanical Keyboard", price: 8999, sku: "MK-001" },
    { slug: "usb-c-hub", title: "USB-C Hub", price: 4999, sku: "UC-001" },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue;

    await prisma.product.create({
      data: {
        slug: p.slug,
        title: p.title,
        description: `A great ${p.title.toLowerCase()}.`,
        status: ProductStatus.ACTIVE,
        variants: {
          create: {
            sku: p.sku,
            name: "Default",
            priceCents: p.price,
            stockQty: 100,
          },
        },
        images: {
          create: {
            url: `https://picsum.photos/seed/${p.slug}/600/600`,
            position: 0,
          },
        },
        categories: {
          create: { categoryId: electronics.id },
        },
      },
    });
  }

  console.log("✅ Seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());