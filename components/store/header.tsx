"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type ElementType } from "react";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import {
  Armchair,
  BedDouble,
  Briefcase,
  ChevronDown,
  ChevronRight,
  DoorOpen,
  HelpCircle,
  Lamp,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Phone,
  ShoppingCart,
  Sofa,
  User,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, type Category } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { SearchBox } from "./search-box";

const PHONE_DISPLAY = "+254 706 169 006";
const PHONE_HREF = "tel:+254706169006";
const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(
  /\D/g,
  "",
);
const WHATSAPP_HREF = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}`
  : null;

// "Contact us" opens WhatsApp when configured, otherwise dials the shop
const CONTACT_HREF = WHATSAPP_HREF ?? PHONE_HREF;
const CONTACT_LINK_PROPS = WHATSAPP_HREF
  ? { target: "_blank", rel: "noopener noreferrer" }
  : {};

const MAX_NAV_CATEGORIES = 8;

const categoryIcons: Record<string, ElementType> = {
  "living-room": Sofa,
  bedroom: BedDouble,
  dining: UtensilsCrossed,
  office: Briefcase,
  outdoor: DoorOpen,
  storage: Lamp,
};

const iconFor = (slug: string): ElementType => categoryIcons[slug] ?? Armchair;

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { itemCount, total } = useCart();
  const pathname = usePathname();

  // Categories come from the API so the header never links to a missing page
  const { data: allCategories } = useSWR<Category[]>(
    "header-categories",
    () => api.categories.getAll(),
    { revalidateOnFocus: false },
  );
  const categories = (allCategories ?? [])
    .filter((category) => !category.parent_id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, MAX_NAV_CATEGORIES);

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll and allow Escape to close while the mobile menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* On desktop the top bar scrolls away (md:-top-8) while the rest stays pinned */}
      <header className="sticky top-0 z-50 bg-primary shadow-md md:-top-8">
        {/* Top Bar */}
        <div className="hidden border-b border-primary-foreground/10 bg-accent md:block">
          <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs text-primary-foreground/80">
            <div className="flex items-center gap-4">
              <a
                href={PHONE_HREF}
                className="flex items-center gap-1 hover:text-primary-foreground"
              >
                <Phone className="h-3 w-3" />
                {PHONE_DISPLAY}
              </a>
              {WHATSAPP_HREF && (
                <>
                  <span className="h-3 w-px bg-primary-foreground/30" />
                  <a
                    href={WHATSAPP_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary-foreground"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Chat on WhatsApp
                  </a>
                </>
              )}
            </div>
            <Link href="/track-order" className="hover:text-primary-foreground">
              Track Order
            </Link>
          </div>
        </div>

        {/* Main Header */}
        <nav className="mx-auto max-w-7xl bg-white px-4" aria-label="Main">
          <div className="flex h-16 items-center gap-4 lg:gap-8">
            {/* Mobile Menu Button */}
            <button
              type="button"
              className="-ml-2 p-2 text-primary lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="h-8 w-8" />
              <span className="sr-only">Open menu</span>
            </button>

            {/* Logo */}
            <Link href="/" className="shrink-0">
              <Image
                src="/logo.png"
                alt="Sailex Furnitures"
                width={100}
                height={50}
                priority
                className="h-10 w-auto md:h-16"
              />
            </Link>

            {/* Search Bar - Desktop */}
            <SearchBox
              placeholder="Search for furniture, sofas, beds..."
              className="hidden max-w-2xl flex-1 md:block"
            />

            {/* Right Actions */}
            <div className="ml-auto flex items-center gap-2 lg:gap-4">
              {/* Account */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="lg"
                      className="gap-2 text-primary hover:bg-primary/10"
                    >
                      <User className="h-5 w-5" />
                      <div className="hidden text-left lg:block">
                        <p className="text-xs">Welcome</p>
                        <p className="text-sm font-medium">
                          {user.name.split(" ")[0]}
                        </p>
                      </div>
                      <ChevronDown className="hidden h-4 w-4 lg:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/account">My Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex h-full items-center gap-2 rounded-lg px-3 py-2 text-primary hover:bg-primary/10 hover:text-primary"
                    >
                      <User className="h-5 w-5" />
                      <div className="hidden text-left lg:block">
                        <p className="text-xs">Sign In</p>
                        <p className="text-sm font-medium">Account</p>
                      </div>
                      <ChevronDown className="hidden h-4 w-4 lg:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/auth/login">Sign In</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/auth/register">Create Account</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Help - Desktop */}
              <a
                href={CONTACT_HREF}
                {...CONTACT_LINK_PROPS}
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-primary hover:bg-primary/10 lg:flex"
              >
                <HelpCircle className="h-5 w-5" />
                <div className="text-left">
                  <p className="text-xs">Need Help?</p>
                  <p className="text-sm font-medium">Contact Us</p>
                </div>
              </a>

              {/* Cart */}
              <Link
                href="/cart"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-primary hover:bg-primary/10"
                aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </div>
                <div className="hidden text-left lg:block">
                  <p className="text-xs opacity-80">Cart</p>
                  <p className="text-sm font-medium">
                    KES {total.toLocaleString("en-KE")}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Search Bar - Mobile */}
          <SearchBox
            placeholder="Search furniture..."
            className="pb-3 md:hidden"
          />
        </nav>

        {/* Category Navigation - Desktop */}
        <div className="hidden border-t border-primary-foreground/10 bg-primary-foreground/5 lg:block">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex h-10 items-center gap-6">
              {categories.map((category) => {
                const Icon = iconFor(category.slug);
                const active = pathname === `/categories/${category.slug}`;
                return (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-1.5 text-sm transition-colors hover:text-primary-foreground ${
                      active
                        ? "font-semibold text-primary-foreground"
                        : "text-primary-foreground/90"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category.name}
                  </Link>
                );
              })}
              <Link
                href="/products?sale=true"
                className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent/90"
              >
                <Zap className="h-4 w-4" />
                Hot Deals
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Side Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Side Menu */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!mobileMenuOpen}
        className={`fixed left-0 top-0 z-50 h-full w-[300px] max-w-[85vw] transform bg-card shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 rounded-full bg-primary-foreground/20 p-1.5" />
            {user ? (
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs opacity-80">{user.email}</p>
              </div>
            ) : (
              <div>
                <Link
                  href="/auth/login"
                  onClick={closeMobileMenu}
                  className="font-medium hover:underline"
                >
                  Sign In
                </Link>
                <p className="text-xs opacity-80">or Create Account</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={closeMobileMenu}
            aria-label="Close menu"
            className="rounded-lg p-2 hover:bg-primary-foreground/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Content */}
        <div className="h-[calc(100%-72px)] overflow-y-auto">
          {user && (
            <div className="border-b border-border p-4">
              <Link
                href="/account/orders"
                onClick={closeMobileMenu}
                className="flex items-center justify-between py-2 text-foreground"
              >
                <span className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  My Orders
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          )}

          {/* Categories */}
          <div className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categories
            </p>
            <div className="flex flex-col gap-1">
              {categories.map((category) => {
                const Icon = iconFor(category.slug);
                return (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-secondary"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      {category.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Hot Deals */}
          <div className="px-4 pb-4">
            <Link
              href="/products?sale=true"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-lg bg-accent/10 px-3 py-3 font-semibold text-accent"
            >
              <Zap className="h-5 w-5" />
              Hot Deals
            </Link>
          </div>

          {/* Help & Support */}
          <div className="border-t border-border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Help &amp; Support
            </p>
            {WHATSAPP_HREF && (
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-secondary"
              >
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                Chat on WhatsApp
              </a>
            )}
            <a
              href={PHONE_HREF}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-secondary"
            >
              <Phone className="h-5 w-5 text-muted-foreground" />
              Call {PHONE_DISPLAY}
            </a>
            <Link
              href="/track-order"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-colors hover:bg-secondary"
            >
              <Package className="h-5 w-5 text-muted-foreground" />
              Track Order
            </Link>
          </div>

          {/* Sign Out */}
          {user && (
            <div className="border-t border-border p-4">
              <button
                type="button"
                onClick={() => {
                  logout();
                  closeMobileMenu();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
