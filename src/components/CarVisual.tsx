"use client";

import { useState } from "react";
import { carImageUrl, type CarView } from "@/lib/carImages";
import { getModel } from "@/lib/data/models";
import { CarArt } from "./CarArt";

/** Real studio photo from the image CDN when configured, SVG art otherwise (or on error). */
export function CarVisual({
  modelId,
  year,
  color,
  colorName,
  view,
  className = "",
  width,
}: {
  modelId: string;
  year?: number;
  color: string;
  colorName?: string;
  view?: CarView;
  className?: string;
  width?: number;
}) {
  const url = carImageUrl(modelId, { year, colorName, view, width });
  const [failed, setFailed] = useState(false);
  if (url && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} className={`object-contain ${className}`} />;
  }
  return <CarArt color={color} body={getModel(modelId)?.bodyType} className={className} />;
}
