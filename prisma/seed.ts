import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cars = [
  // Old supercar seed fleet retained for rollback reference:
  // {
  //   slug: "lamborghini-aventador-svj",
  //   ...
  // },
  {
    slug: "rolls-royce-ghost-series-i",
    name: "Ghost Series I",
    brand: "Rolls-Royce",
    model: "Ghost",
    year: 2016,
    dailyPrice: 129900,
    description:
      "Classic luxury tier with heritage styling, serene cabin space, and accessible executive experience.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1631295868785-6ea97a2df7f1?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1631295868785-6ea97a2df7f1?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1800&q=80",
    ],
  },
  {
    slug: "rolls-royce-ghost-series-ii",
    name: "Ghost Series II",
    brand: "Rolls-Royce",
    model: "Ghost Series II",
    year: 2022,
    dailyPrice: 199900,
    description:
      "Modern luxury tier with refreshed design, digital comfort controls, and elevated executive travel standards.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1592853625601-bb9d23da12fc?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1592853625601-bb9d23da12fc?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1580274455191-1c62238fa333?auto=format&fit=crop&w=1800&q=80",
    ],
  },
  {
    slug: "rolls-royce-spectre-signature",
    name: "Spectre Signature",
    brand: "Rolls-Royce",
    model: "Spectre",
    year: 2026,
    dailyPrice: 349900,
    description:
      "Ultra premium luxury tier featuring brand-new flagship craftsmanship, silent electric power, and full bespoke presence.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1800&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1800&q=80",
    ],
  },
];

async function main() {
  for (const car of cars) {
    await prisma.car.upsert({
      where: { slug: car.slug },
      update: {
        name: car.name,
        brand: car.brand,
        model: car.model,
        year: car.year,
        dailyPrice: car.dailyPrice,
        description: car.description,
        thumbnailUrl: car.thumbnailUrl,
      },
      create: {
        slug: car.slug,
        name: car.name,
        brand: car.brand,
        model: car.model,
        year: car.year,
        dailyPrice: car.dailyPrice,
        description: car.description,
        thumbnailUrl: car.thumbnailUrl,
      },
    });

    const persistedCar = await prisma.car.findUniqueOrThrow({
      where: { slug: car.slug },
    });

    await prisma.carImage.deleteMany({ where: { carId: persistedCar.id } });

    await prisma.carImage.createMany({
      data: car.images.map((url, index) => ({
        carId: persistedCar.id,
        url,
        sortOrder: index,
      })),
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
