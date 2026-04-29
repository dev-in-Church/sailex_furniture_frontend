"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import Cookies from "js-cookie";

// Types
export interface LocalCartItem {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  price: string;
  quantity: number;
  images: string[];
  stock_quantity: number;
}

export interface CartItem extends LocalCartItem {
  subtotal: number;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
  addToCart: (
    productId: string,
    quantity?: number,
    productData?: Partial<LocalCartItem>,
  ) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  refresh: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_COOKIE_KEY = "sailex_cart";
const CART_STORAGE_KEY = "sailex_cart";

// Helper to get cart from storage (cookies first, then localStorage)
function getStoredCart(): LocalCartItem[] {
  if (typeof window === "undefined") return [];

  // Try cookies first
  const cookieCart = Cookies.get(CART_COOKIE_KEY);
  if (cookieCart) {
    try {
      return JSON.parse(cookieCart);
    } catch {
      // Invalid JSON, clear it
      Cookies.remove(CART_COOKIE_KEY);
    }
  }

  // Fall back to localStorage
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // localStorage not available or invalid
  }

  return [];
}

// Helper to save cart to storage
function saveCart(items: LocalCartItem[]): void {
  if (typeof window === "undefined") return;

  const cartJson = JSON.stringify(items);

  // Save to cookies (expires in 30 days)
  try {
    Cookies.set(CART_COOKIE_KEY, cartJson, { expires: 30, sameSite: "lax" });
  } catch {
    // Cookie might be too large, fall back to localStorage only
  }

  // Also save to localStorage as backup
  try {
    localStorage.setItem(CART_STORAGE_KEY, cartJson);
  } catch {
    // localStorage not available
  }
}

// Helper to clear cart from storage
function clearStoredCart(): void {
  if (typeof window === "undefined") return;
  Cookies.remove(CART_COOKIE_KEY);
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// API functions with error handling
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function fetchCartAPI<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {},
): Promise<T | null> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    // API not available
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate totals
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Convert LocalCartItem to CartItem
  const toCartItem = (item: LocalCartItem): CartItem => ({
    ...item,
    subtotal: parseFloat(item.price) * item.quantity,
  });

  // Load cart on mount and when auth changes
  const loadCart = useCallback(async () => {
    setIsLoading(true);

    if (token && user) {
      // User is logged in - try to fetch from API
      const apiCart = await fetchCartAPI<{ items: CartItem[]; total: number }>(
        "/cart",
        { token },
      );

      if (apiCart && apiCart.items) {
        // Merge local cart with server cart
        const localItems = getStoredCart();

        if (localItems.length > 0) {
          // Merge local items to server
          for (const localItem of localItems) {
            await fetchCartAPI("/cart/items", {
              method: "POST",
              body: JSON.stringify({
                productId: localItem.product_id,
                quantity: localItem.quantity,
              }),
              token,
            });
          }
          // Clear local storage after merge
          clearStoredCart();

          // Refetch merged cart
          const mergedCart = await fetchCartAPI<{
            items: CartItem[];
            total: number;
          }>("/cart", { token });
          if (mergedCart) {
            setItems(mergedCart.items || []);
          }
        } else {
          setItems(apiCart.items);
        }
      } else {
        // API not available, use local storage
        const localItems = getStoredCart();
        setItems(localItems.map(toCartItem));
      }
    } else {
      // Not logged in - use local storage
      const localItems = getStoredCart();
      setItems(localItems.map(toCartItem));
    }

    setIsLoading(false);
    setIsInitialized(true);
  }, [token, user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Add to cart
  const addToCart = useCallback(
    async (
      productId: string,
      quantity = 1,
      productData?: Partial<LocalCartItem>,
    ) => {
      if (token && user) {
        // Logged in - use API
        const result = await fetchCartAPI<{ item: CartItem }>("/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId, quantity }),
          token,
        });

        if (result) {
          // Refresh cart from server
          loadCart();
          return;
        }
      }

      // Not logged in or API failed - use local storage
      const currentItems = getStoredCart();
      const existingIndex = currentItems.findIndex(
        (item) => item.product_id === productId,
      );

      if (existingIndex >= 0) {
        // Update quantity
        currentItems[existingIndex].quantity += quantity;
      } else {
        // Add new item - we need product data
        const newItem: LocalCartItem = {
          id: `local_${Date.now()}_${productId}`,
          product_id: productId,
          name: productData?.name || "Product",
          slug: productData?.slug || productId,
          price: productData?.price || "0",
          quantity,
          images: productData?.images || [],
          stock_quantity: productData?.stock_quantity || 99,
        };
        currentItems.push(newItem);
      }

      saveCart(currentItems);
      setItems(currentItems.map(toCartItem));
    },
    [token, user, loadCart],
  );

  // Update quantity
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        return removeItem(itemId);
      }

      if (token && user && !itemId.startsWith("local_")) {
        // Logged in - use API
        const result = await fetchCartAPI<{ item: CartItem }>(
          `/cart/items/${itemId}`,
          {
            method: "PUT",
            body: JSON.stringify({ quantity }),
            token,
          },
        );

        if (result) {
          loadCart();
          return;
        }
      }

      // Use local storage
      const currentItems = getStoredCart();
      const itemIndex = currentItems.findIndex(
        (item) => item.id === itemId || item.product_id === itemId,
      );

      if (itemIndex >= 0) {
        currentItems[itemIndex].quantity = quantity;
        saveCart(currentItems);
        setItems(currentItems.map(toCartItem));
      }
    },
    [token, user, loadCart],
  );

  // Remove item
  const removeItem = useCallback(
    async (itemId: string) => {
      if (token && user && !itemId.startsWith("local_")) {
        // Logged in - use API
        const result = await fetchCartAPI<{ message: string }>(
          `/cart/items/${itemId}`,
          {
            method: "DELETE",
            token,
          },
        );

        if (result) {
          loadCart();
          return;
        }
      }

      // Use local storage
      const currentItems = getStoredCart();
      const filtered = currentItems.filter(
        (item) => item.id !== itemId && item.product_id !== itemId,
      );
      saveCart(filtered);
      setItems(filtered.map(toCartItem));
    },
    [token, user, loadCart],
  );

  // Clear cart
  const clearCart = useCallback(() => {
    clearStoredCart();
    setItems([]);
  }, []);

  // Refresh cart
  const refresh = useCallback(() => {
    loadCart();
  }, [loadCart]);

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        isLoading: isLoading || !isInitialized,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
