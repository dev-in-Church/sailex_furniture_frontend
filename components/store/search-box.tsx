"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProducts, type Product } from "@/lib/api";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 5;
const PLACEHOLDER_IMAGE = "/placeholder.png";

type SearchBoxProps = {
  placeholder: string;
  className?: string;
  /** Called after navigating, e.g. to close the mobile menu */
  onNavigate?: () => void;
};

const formatKES = (value: string | number) =>
  `KES ${Number(value).toLocaleString("en-KE")}`;

export function SearchBox({
  placeholder,
  className = "",
  onNavigate,
}: SearchBoxProps) {
  const router = useRouter();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const term = query.trim();
  const showDropdown = open && term.length >= MIN_CHARS;

  // Debounced suggestions; stale responses are ignored via requestId
  useEffect(() => {
    const id = ++requestId.current;

    if (term.length < MIN_CHARS) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await getProducts({
          search: term,
          limit: String(MAX_SUGGESTIONS),
        });
        if (id === requestId.current) setResults(data.products ?? []);
      } catch {
        if (id === requestId.current) setResults([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [term]);

  // Close the dropdown when clicking elsewhere
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const finishNavigation = () => {
    setOpen(false);
    setActiveIndex(-1);
    onNavigate?.();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const active = results[activeIndex];
    if (active) {
      finishNavigation();
      router.push(`/products/${active.slug}`);
      return;
    }
    if (!term) return;
    finishNavigation();
    router.push(`/products?search=${encodeURIComponent(term)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        onSubmit={handleSubmit}
        role="search"
        className="flex w-full items-center rounded-full border border-gray-200 bg-[#f1f1f2] py-1 pl-4 pr-1"
      >
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-label="Search products"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          className="flex-1 bg-transparent py-1.5 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none"
        />
        <Button
          type="submit"
          className="h-9 rounded-full border-none bg-[#f68b1e] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#e07b1a] md:px-8"
        >
          <Search className="h-5 w-5" />
          <span>Search</span>
        </Button>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {loading && results.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-4 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-gray-500">
              No products found for &ldquo;{term}&rdquo;
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Search suggestions">
              {results.map((product, index) => {
                const image = product.images?.[0];
                return (
                  <li
                    key={product.id}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                  >
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={finishNavigation}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 ${
                        index === activeIndex ? "bg-gray-100" : ""
                      }`}
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                        <Image
                          src={
                            typeof image === "string" && image
                              ? image
                              : PLACEHOLDER_IMAGE
                          }
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-sm font-medium text-gray-900">
                          {product.name}
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {formatKES(product.price)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {term && (
            <button
              type="button"
              onClick={() => {
                finishNavigation();
                router.push(`/products?search=${encodeURIComponent(term)}`);
              }}
              className="w-full border-t border-gray-100 px-4 py-3 text-left text-sm font-semibold text-[#f68b1e] transition-colors hover:bg-gray-50"
            >
              See all results for &ldquo;{term}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
