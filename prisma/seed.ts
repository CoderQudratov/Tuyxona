import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Doston To'yxonasi ma'lumotlar bazasini to'ldirish (seed) boshlandi...");

  try {
    // 1. Venue
    const venue = await prisma.venue.upsert({
      where: { id: "default-venue" },
      update: {},
      create: {
        id: "default-venue",
        name: "Doston To'yxonasi",
        address: "Toshkent shahri, Chilonzor tumani, Bunyodkor ko'chasi 42-uy",
        phone: "+998 90 123 45 67",
        mainHallPrice: 12000000,
        capacity: 500,
        depositPercent: 10,
        cardNumber: "8600 5500 1234 5678",
        cardHolder: "Doston To'yxonasi",
        holdDurationMinutes: 60,
      },
    });

    // 2. Hall
    await prisma.hall.upsert({
      where: { id: "default-hall" },
      update: {},
      create: {
        id: "default-hall",
        venueId: venue.id,
        name: "Asosiy Zal",
        capacity: 500,
        basePrice: 12000000,
        description: "500 kishilik hashamatli asosiy to'yxona zali",
      },
    });

    // 3. Services
    const services = [
      {
        id: "srv-decor",
        name: "Zal bezaklari",
        description: "Kelin-kuyov stoli va zalning gullar bilan bezatilishi",
        price: 1000000,
        icon: "Flower2",
      },
      {
        id: "srv-music",
        name: "Musiqa xizmati",
        description: "Professional ovoz apparaturasi va DJ xizmati",
        price: 700000,
        icon: "Music",
      },
      {
        id: "srv-media",
        name: "Foto va video",
        description: "2 ta 4K kamera va montaj qilingan to'y diski",
        price: 1200000,
        icon: "Camera",
      },
    ];

    for (const s of services) {
      await prisma.service.upsert({
        where: { id: s.id },
        update: { price: s.price, name: s.name, description: s.description },
        create: s,
      });
    }

    console.log("✅ Bazani to'ldirish (seed) muvaffaqiyatli bajarildi!");
  } catch (err) {
    console.warn("⚠️ Prisma DB seed ogohlantirish (Neon ulanishi yo'q bo'lsa in-memory ishlatiladi):", err);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Seed skriptida xatolik:", e);
  process.exit(0);
});
