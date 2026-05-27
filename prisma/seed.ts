import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cars = [
  {
    slug: "lamborghini-aventador-svj",
    name: "Aventador SVJ",
    brand: "Lamborghini",
    model: "SVJ",
    year: 2023,
    dailyPrice: 299900,
    description:
      "V12 flagship with extreme aero, savage acceleration, and signature Italian drama.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1611821064430-0d40291d0f0b?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1611821064430-0d40291d0f0b?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    slug: "ferrari-sf90-stradale",
    name: "SF90 Stradale",
    brand: "Ferrari",
    model: "SF90",
    year: 2024,
    dailyPrice: 339900,
    description:
      "Plug-in hybrid hypercar power with razor-sharp handling and timeless Ferrari style.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1622194993926-6b8df98d2f8f?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1622194993926-6b8df98d2f8f?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1600&q=80",
    ],
  },
  {
    slug: "mclaren-765lt-spider",
    name: "765LT Spider",
    brand: "McLaren",
    model: "765LT Spider",
    year: 2024,
    dailyPrice: 279900,
    description:
      "Lightweight longtail aggression with race-car feedback and open-air carbon-fiber theater.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1544829099-b9a0c5303bea?auto=format&fit=crop&w=1600&q=80",
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
