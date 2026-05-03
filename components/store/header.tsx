"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  Search,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Sofa,
  BedDouble,
  UtensilsCrossed,
  Briefcase,
  Lamp,
  DoorOpen,
  Zap,
  LogOut,
  Package,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

const categories = [
  { name: "Living Room", slug: "living-room", icon: Sofa },
  { name: "Bedroom", slug: "bedroom", icon: BedDouble },
  { name: "Dining", slug: "dining", icon: UtensilsCrossed },
  { name: "Office", slug: "office", icon: Briefcase },
  { name: "Outdoor", slug: "outdoor", icon: DoorOpen },
  { name: "Storage", slug: "storage", icon: Lamp },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const { itemCount, total } = useCart();
  const router = useRouter();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-primary shadow-md">
        {/* Top Bar */}
        <div className="hidden md:block bg-accent border-b border-primary-foreground/10">
          <div className="mx-auto max-w-7xl px-4 flex items-center justify-between h-8 text-xs text-primary-foreground/80">
            <div className="flex items-center gap-4">
              <span>+254 706 169 006</span>
              <span className="h-3 w-px bg-primary-foreground/30" />
              <Link
                href="/help"
                className="hover:text-primary-foreground flex items-center gap-1"
              >
                <HelpCircle className="h-3 w-3" />
                Help Center
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/track-order"
                className="hover:text-primary-foreground"
              >
                Track Order
              </Link>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <nav className="mx-auto max-w-7xl bg-white px-4">
          <div className="flex h-16 items-center gap-4 lg:gap-8">
            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 text-primary"
              onClick={() => setMobileMenuOpen(true)}
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
                className="h-10 md:h-16 w-auto"
              />
            </Link>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="flex-1 max-w-2xl hidden md:flex"
            >
              <div className="flex w-full gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for furniture, sofas, beds..."
                  className="flex-1 px-4 py-2 bg-white text-foreground placeholder:text-muted-foreground rounded-sm border focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button
                  type="submit"
                  className="rounded-sm bg-accent hover:bg-accent/90 px-6 h-full"
                >
                  <Search className="h-5 w-5" />
                  <span className="">Search</span>
                </Button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2 lg:gap-4 ml-auto">
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
                      <div className="hidden lg:block text-left">
                        <p className="text-xs">Welcome</p>
                        <p className="text-sm font-medium">
                          {user.name.split(" ")[0]}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 hidden lg:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/account">My Account</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/orders">My Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account/wishlist">Wishlist</Link>
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
                      className="flex items-center gap-2 text-primary hover:bg-primary/10 hover:text-primary px-3 py-2 rounded-lg h-full"
                    >
                      <User className="h-5 w-5" />
                      <div className="hidden lg:block text-left">
                        <p className="text-xs">Sign In</p>
                        <p className="text-sm font-medium">Account</p>
                      </div>
                      <ChevronDown className="h-4 w-4 hidden lg:block" />
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
              <Link
                href="/help"
                className="hidden lg:flex items-center gap-2 text-primary hover:bg-primary/10 px-3 py-2 rounded-lg"
              >
                <HelpCircle className="h-5 w-5" />
                <div className="text-left">
                  <p className="text-xs">Need Help?</p>
                  <p className="text-sm font-medium">Contact Us</p>
                </div>
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="flex items-center gap-2 text-primary hover:bg-primary/10 px-3 py-2 rounded-lg"
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs opacity-80">Cart</p>
                  <p className="text-sm font-medium">
                    KES {total.toLocaleString()}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="flex w-full gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search furniture..."
                className="flex-1 px-4 py-2 bg-white text-foreground placeholder:text-muted-foreground rounded-sm border focus:outline-none"
              />
              <Button
                type="submit"
                className="rounded-sm bg-accent hover:bg-accent/90 px-5 h-full"
              >
                <Search className="h-5 w-5" />
                <span className="">Search</span>
              </Button>
            </div>
          </form>
        </nav>

        {/* Category Navigation - Desktop */}
        <div className="hidden lg:block bg-primary-foreground/5 border-t border-primary-foreground/10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-center gap-6 h-10">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="flex items-center gap-1.5 text-sm text-primary-foreground/90 hover:text-primary-foreground transition-colors"
                >
                  <category.icon className="h-4 w-4" />
                  {category.name}
                </Link>
              ))}
              {/* <Link
                href="/products?sale=true"
                className="text-sm font-semibold text-accent hover:text-accent/90 ml-auto"
              >
                FLASH SALES
              </Link> */}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Side Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Side Menu */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[300px] max-w-[85vw] bg-card shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 p-1.5 bg-primary-foreground/20 rounded-full" />
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
            onClick={closeMobileMenu}
            className="p-2 hover:bg-primary-foreground/10 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Content */}
        <div className="overflow-y-auto h-[calc(100%-72px)]">
          {/* Quick Links */}
          {user && (
            <div className="p-4 border-b border-border">
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
              <Link
                href="/account/wishlist"
                onClick={closeMobileMenu}
                className="flex items-center justify-between py-2 text-foreground"
              >
                <span className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  Wishlist
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          )}

          {/* Categories */}
          <div className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Categories
            </p>
            <div className="flex flex-col gap-1">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between py-3 px-3 text-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <category.icon className="h-5 w-5 text-muted-foreground" />
                    {category.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>

          {/* Flash Sales */}
          <div className="px-4 pb-4">
            <Link
              href="/products?sale=true"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 py-3 px-3 bg-accent/10 text-accent font-semibold rounded-lg"
            >
              <Zap className="h-5 w-5" />
              Flash Sales
            </Link>
          </div>

          {/* Help & Support */}
          <div className="p-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Help & Support
            </p>
            <Link
              href="/help"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 py-3 px-3 text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              Help Center
            </Link>
            <Link
              href="/track-order"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 py-3 px-3 text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              <Package className="h-5 w-5 text-muted-foreground" />
              Track Order
            </Link>
          </div>

          {/* Sign Out */}
          {user && (
            <div className="p-4 border-t border-border">
              <button
                onClick={() => {
                  logout();
                  closeMobileMenu();
                }}
                className="flex items-center gap-3 py-3 px-3 w-full text-left text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
