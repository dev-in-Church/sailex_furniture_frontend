/**
 * Everything the products page needs to read, validate and build URL params.
 * Used by the server page, the grid, and the client-side filters, so the URL
 * and the API request can never drift apart.
 */

export const PAGE_SIZE = 12;

// Values must match what routes/products.js accepts for ?sort=
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
  { value: "name-desc", label: "Name: Z–A" },
  { value: "discount", label: "Biggest discount" },
] as const;

// Amounts are in KES (the database stores whole shillings, not cents)
export const PRICE_RANGES = [
  { label: "Under KES 25,000", min: "", max: "25000" },
  { label: "KES 25,000 – 50,000", min: "25000", max: "50000" },
  { label: "KES 50,000 – 100,000", min: "50000", max: "100000" },
  { label: "Over KES 100,000", min: "100000", max: "" },
] as const;

export interface ProductQuery {
  page: number;
  category: string;
  search: string;
  minPrice: string;
  maxPrice: string;
  /** "" means the default order (newest first) */
  sort: string;
  sale: boolean;
  inStock: boolean;
  featured: boolean;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

/** Returns a clean non-negative number as a string, or "" if invalid/empty. */
export function normalizePrice(value: string): string {
  if (!value.trim()) return "";
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? String(n) : "";
}

export function parseProductQuery(raw: RawSearchParams): ProductQuery {
  const page = Number.parseInt(first(raw.page), 10);
  const sort = first(raw.sort);
  const knownSort = SORT_OPTIONS.some((option) => option.value === sort);

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    category: first(raw.category).trim(),
    search: first(raw.search).trim().slice(0, 100),
    minPrice: normalizePrice(first(raw.minPrice)),
    maxPrice: normalizePrice(first(raw.maxPrice)),
    sort: knownSort && sort !== "newest" ? sort : "",
    sale: first(raw.sale) === "true",
    inStock: first(raw.inStock) === "true",
    featured: first(raw.featured) === "true",
  };
}

function toParams(query: ProductQuery) {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);
  if (query.minPrice) params.set("minPrice", query.minPrice);
  if (query.maxPrice) params.set("maxPrice", query.maxPrice);
  if (query.sort) params.set("sort", query.sort);
  if (query.sale) params.set("sale", "true");
  if (query.inStock) params.set("inStock", "true");
  if (query.featured) params.set("featured", "true");
  if (query.page > 1) params.set("page", String(query.page));
  return params;
}

/**
 * Builds a /products URL from the current query plus changes.
 * Changing any filter resets to page 1 unless `page` is passed explicitly.
 */
export function productsHref(
  query: ProductQuery,
  overrides: Partial<ProductQuery> = {},
) {
  const qs = toParams({ ...query, page: 1, ...overrides }).toString();
  return qs ? `/products?${qs}` : "/products";
}

/** Query string for GET /products on the API. */
export function toApiQuery(query: ProductQuery) {
  const params = toParams(query);
  params.set("limit", String(PAGE_SIZE));
  return params.toString();
}

/** How many separate filters are active (a price range counts once). */
export function activeFilterCount(query: ProductQuery) {
  return [
    query.category,
    query.search,
    query.minPrice || query.maxPrice,
    query.sale,
    query.inStock,
    query.featured,
  ].filter(Boolean).length;
}
