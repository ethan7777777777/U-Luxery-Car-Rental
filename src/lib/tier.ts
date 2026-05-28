type TierMeta = {
  key: "classic" | "modern" | "ultra";
  label: string;
  summary: string;
};

export function getTierMeta(car: {
  slug: string;
  year: number;
  dailyPrice: number;
}): TierMeta {
  if (car.slug.includes("spectre") || car.dailyPrice >= 300000 || car.year >= 2025) {
    return {
      key: "ultra",
      label: "Ultra Premium Luxury",
      summary: "Brand-new flagship experience for top-tier executive demand.",
    };
  }

  if (car.slug.includes("series-ii") || car.dailyPrice >= 170000 || car.year >= 2020) {
    return {
      key: "modern",
      label: "Modern Luxury",
      summary: "Newer generation executive comfort with elevated in-cabin technology.",
    };
  }

  return {
    key: "classic",
    label: "Classic Luxury",
    summary: "Entry-level heritage Rolls-Royce tier for value-focused luxury demand.",
  };
}
