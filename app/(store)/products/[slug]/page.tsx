import { notFound } from "next/navigation";
import { ProductDetails } from "./product-details";
import { ProductCard } from "@/components/store/product-card";
import { getProduct, type Product } from "@/lib/api";

// Mock product for demo
const mockProduct: Product = {
  id: "1",
  name: "Milano Leather Sofa",
  slug: "milano-leather-sofa",
  description: "Luxurious Italian-inspired leather sofa with premium craftsmanship. Features deep cushioning and solid wood frame for lasting comfort and durability. The Milano Leather Sofa combines timeless elegance with modern comfort, making it the perfect centerpiece for your living room.",
  price: "89999",
  compare_at_price: "109999",
  sku: "SOF-MIL-001",
  stock_quantity: 15,
  category_id: "1",
  category_name: "Living Room",
  category_slug: "living-room",
  images: ["/images/hero-living-room.jpg", "/images/hero-living-room.jpg", "/images/hero-living-room.jpg"],
  specifications: {
    material: "Genuine Leather",
    color: "Cognac Brown",
    dimensions: "220cm x 95cm x 85cm",
    seating: "3-seater",
    frame: "Solid Oak Wood"
  },
  featured: true,
  status: "active",
  created_at: new Date().toISOString(),
};

const mockRelatedProducts: Product[] = Array.from({ length: 4 }, (_, i) => ({
  ...mockProduct,
  id: String(i + 10),
  name: ["Nordic Oak Coffee Table", "Velvet Accent Chair", "Modern Floor Lamp", "Decorative Cushion Set"][i],
  slug: ["nordic-oak-coffee-table", "velvet-accent-chair", "modern-floor-lamp", "decorative-cushion-set"][i],
  price: String([24999, 19999, 8999, 5999][i]),
  compare_at_price: null,
}));

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  
  let product = mockProduct;
  try {
    const response = await getProduct(slug);
    product = response.product;
  } catch {}

  return {
    title: product.name,
    description: product.description?.slice(0, 160),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  let product: Product = mockProduct;
  let relatedProducts: Product[] = mockRelatedProducts;

  try {
    const response = await getProduct(slug);
    product = response.product;
    relatedProducts = response.relatedProducts;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    // Use mock data if slug doesn't match
    if (slug !== "milano-leather-sofa") {
      notFound();
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <ProductDetails product={product} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 lg:mt-24">
          <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-8">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
