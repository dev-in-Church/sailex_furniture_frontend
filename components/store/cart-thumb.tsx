"use client";

import Image from "next/image";
import { useState } from "react";

const PLACEHOLDER = "/placeholder.png";

/** Fills its parent, which must be `relative` and have a size. */
export function CartThumb({
  src,
  alt,
  sizes,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <Image
      src={!failed && src ? src : PLACEHOLDER}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}
