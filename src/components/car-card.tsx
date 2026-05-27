import Image from "next/image";
import Link from "next/link";

import { formatCurrency } from "@/lib/utils";

type CarCardProps = {
  car: {
    slug: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    dailyPrice: number;
    thumbnailUrl: string;
  };
};

export function CarCard({ car }: CarCardProps) {
  return (
    <article className="card">
      <Image
        src={car.thumbnailUrl}
        alt={`${car.brand} ${car.model}`}
        width={960}
        height={620}
        className="car-image"
      />
      <div className="card-content">
        <h2 className="card-title">{car.name}</h2>
        <p className="card-subtitle">
          {car.year} {car.brand}
        </p>
        <div className="price-row">
          <strong>{formatCurrency(car.dailyPrice)} / day</strong>
          <Link className="btn" href={`/cars/${car.slug}`}>
            View & Book
          </Link>
        </div>
      </div>
    </article>
  );
}
