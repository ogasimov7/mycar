import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingDetail } from "@/components/views/ListingDetail";
import { generationInfo, getModel } from "@/lib/data/models";
import { azn, km } from "@/lib/format";
import { cachedListing } from "@/lib/server/cached";

export async function generateMetadata({ params }: PageProps<"/elan/[id]">): Promise<Metadata> {
  const { id } = await params;
  const l = await cachedListing(id);
  if (!l) return { title: "Elan — MyCar" };
  const m = getModel(l.modelId);
  const title = `${m?.make} ${m?.model} ${l.year} — ${azn(l.price)} | MyCar`;
  const description = `${l.city}, ${km(l.mileage)}, ${l.engine}, ${l.gearbox}, ${l.fuel}. ${generationInfo(l.modelId, l.year).name} nəslinin xroniki problemləri və bazar qiyməti ilə müqayisə.`;
  const images = l.photos.slice(0, 1);
  return {
    title,
    description,
    alternates: { canonical: `/elan/${id}` },
    openGraph: { title, description, images, type: "website", url: `/elan/${id}` },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description, images },
    robots: l.status === "sold" ? { index: false } : undefined,
  };
}

/** Structured data so search engines can show price, year and mileage */
async function ListingJsonLd({ id }: { id: string }) {
  const l = await cachedListing(id);
  if (!l) return null;
  const m = getModel(l.modelId);
  const data = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${m?.make} ${m?.model} ${l.year}`,
    brand: { "@type": "Brand", name: m?.make },
    model: m?.model,
    vehicleModelDate: String(l.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: l.mileage, unitCode: "KMT" },
    fuelType: l.fuel,
    vehicleTransmission: l.gearbox,
    color: l.colorName,
    image: l.photos,
    offers: {
      "@type": "Offer",
      price: l.price,
      priceCurrency: "AZN",
      availability: l.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      areaServed: l.city,
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export default function Page({ params }: PageProps<"/elan/[id]">) {
  return (
    <Suspense fallback={<div className="aspect-[4/3] animate-pulse bg-surface" />}>
      {params.then(({ id }) => (
        <>
          <ListingJsonLd id={id} />
          <ListingDetail id={id} />
        </>
      ))}
    </Suspense>
  );
}
