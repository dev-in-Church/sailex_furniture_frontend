import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import type { SingleProductResponse } from "@/lib/api";
import { fetchJson } from "@/lib/server-fetch";
import { ProductCard } from "@/components/home/product-card";
import { ProductDetails } from "./product-details";

// Optional, e.g. https://www.sailexfurniture.com. Used for structured data only.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// generateMetadata and the page both call this; Next dedupes identical fetches
const loadProduct = (slug: string) =>
  fetchJson<SingleProductResponse>(`/products/${encodeURIComponent(slug)}`, 60);

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data, status } = await loadProduct(slug);

  if (!data) {
    return {
      title:
        status === 404
          ? "Product not found | Sailex Furnitures"
          : "Product | Sailex Furnitures",
    };
  }

  const { product } = data;
  const image = product.images?.find(
    (src): src is string => typeof src === "string" && isAbsoluteUrl(src),
  );

  return {
    title: `${product.name} | Sailex Furnitures`,
    description: product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) ?? undefined,
      ...(image && { images: [image] }),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { data, status } = await loadProduct(slug);

  // A missing product is a real 404; anything else is a temporary problem
  if (status === 404) notFound();

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <TriangleAlert className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 text-xl font-semibold text-foreground">
          We couldn&apos;t load this product
        </h1>
        <p className="mb-6 text-muted-foreground">
          Something went wrong on our side. Please try again in a moment.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href={`/products/${encodeURIComponent(slug)}`}
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary"
          >
            Try again
          </Link>
          <Link
            href="/products"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const { product, relatedProducts } = data;

  // Structured data so search engines can show price and availability
  const absoluteImages = (product.images ?? [])
    .filter((src): src is string => typeof src === "string" && src.length > 0)
    .map((src) =>
      isAbsoluteUrl(src) ? src : SITE_URL ? `${SITE_URL}${src}` : null,
    )
    .filter((src): src is string => Boolean(src));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    sku: product.sku ?? undefined,
    image: absoluteImages.length > 0 ? absoluteImages : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "KES",
      price: product.price,
      availability:
        Number(product.stock_quantity) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      ...(SITE_URL && { url: `${SITE_URL}/products/${product.slug}` }),
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <script
        type="application/ld+json"
        // "<" is escaped so product text can never close the script tag
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <ProductDetails product={product} />

      {relatedProducts.length > 0 && (
        <section className="mt-16 lg:mt-24" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="mb-8 font-serif text-2xl font-medium text-foreground md:text-3xl"
          >
            You May Also Like
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <li key={related.id}>
                <ProductCard product={related} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
