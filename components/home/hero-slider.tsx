"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Banner = {
  id: number;
  image: string;
  alt: string;
  href: string;
};

const AUTOPLAY_MS = 5000;

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  // Autoplay, paused on hover/focus and skipped for reduced-motion users
  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(
      () => setCurrent((prev) => (prev + 1) % count),
      AUTOPLAY_MS,
    );
    return () => clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;

  const go = (delta: number) =>
    setCurrent((prev) => (prev + delta + count) % count);

  const arrowClass =
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-md ring-1 ring-border transition-colors hover:bg-muted";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      className="relative mb-6 h-[170px] overflow-hidden rounded-2xl bg-muted sm:h-[250px] lg:h-[380px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {banners.map((banner, index) => {
        const active = index === current;
        return (
          <Link
            key={banner.id}
            href={banner.href}
            aria-hidden={!active}
            tabIndex={active ? 0 : -1}
            className={`absolute inset-0 transition-opacity duration-500 ${
              active ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={banner.image}
              alt={banner.alt}
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
              priority={index === 0}
            />
          </Link>
        );
      })}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className={`${arrowClass} left-3`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className={`${arrowClass} right-3`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Pill-style indicators, like Jumia */}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-3 py-1.5">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === current}
                className={`h-2 rounded-full transition-all ${
                  index === current ? "w-6 bg-white" : "w-2 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
