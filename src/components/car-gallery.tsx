import Image from "next/image";

type CarGalleryProps = {
  name: string;
  images: { id: string; url: string }[];
};

export function CarGallery({ name, images }: CarGalleryProps) {
  return (
    <section className="panel">
      <h2>Gallery</h2>
      <div className="gallery-grid">
        {images.map((image) => (
          <Image
            key={image.id}
            src={image.url}
            alt={name}
            width={1400}
            height={900}
            className="car-image"
          />
        ))}
      </div>
    </section>
  );
}
