"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { useAuth, getSessionId } from "./auth-context";
import {
  addToCart as apiAddToCart,
  getCart,
  removeCartItem,
  updateCartItem,
  type CartItem as ApiCartItem,
} from "./api";

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
  /** Each action shows its own error toast and resolves to true on success. */
  addToCart: (
    productId: string,
    quantity?: number,
    productData?: Partial<LocalCartItem>,
  ) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => void;
  refresh: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// The cart used to live in a cookie/localStorage. It now lives on the server
// (guests via their session id, customers via their account), so the old
// browser copy is removed.
const LEGACY_CART_KEY = "sailex_cart";

const toCartItem = (item: ApiCartItem): CartItem => {
  const price = String(item.price);
  const quantity = Number(item.quantity);
  return {
    id: item.id,
    product_id: item.product_id,
    name: item.name,
    slug: item.slug,
    price,
    quantity,
    images: item.images ?? [],
    stock_quantity: item.stock_quantity,
    subtotal: Number.isFinite(item.subtotal)
      ? item.subtotal
      : parseFloat(price) * quantity,
  };
};

const upsertLine = (items: CartItem[], line: CartItem): CartItem[] => {
  const index = items.findIndex((i) => i.product_id === line.product_id);
  if (index === -1) return [line, ...items];
  const next = [...items];
  next[index] = line;
  return next;
};

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Couldn't update your cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const { token, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items],
  );
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  // Who owns the cart: the logged-in customer, or this browser's guest session
  const credentials = useCallback(
    () =>
      token
        ? { token, sessionId: undefined }
        : { token: undefined, sessionId: getSessionId() || undefined },
    [token],
  );

  const load = useCallback(
    async (silent = false) => {
      const id = ++requestId.current;
      if (!silent) setIsLoading(true);
      try {
        const { token: t, sessionId } = credentials();
        const data = await getCart(sessionId, t);
        if (id === requestId.current) setItems(data.items.map(toCartItem));
      } catch (err) {
        console.error("Failed to load cart:", err);
      } finally {
        if (id === requestId.current) setIsLoading(false);
      }
    },
    [credentials],
  );

  // One-time cleanup of the old browser-stored cart
  useEffect(() => {
    Cookies.remove(LEGACY_CART_KEY);
    try {
      localStorage.removeItem(LEGACY_CART_KEY);
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Load once auth has settled, and again whenever the user logs in or out
  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  const addToCart = useCallback(
    async (
      productId: string,
      quantity = 1,
      productData?: Partial<LocalCartItem>,
    ) => {
      try {
        const { token: t, sessionId } = credentials();
        const { item } = await apiAddToCart(productId, quantity, sessionId, t);

        if (
          productData?.name &&
          productData.slug &&
          productData.price !== undefined
        ) {
          // We know enough to update the cart instantly without another request
          const price = String(productData.price);
          setItems((prev) =>
            upsertLine(prev, {
              id: item.id,
              product_id: productId,
              name: productData.name!,
              slug: productData.slug!,
              price,
              quantity: item.quantity,
              images: productData.images ?? [],
              stock_quantity: productData.stock_quantity ?? 99,
              subtotal: parseFloat(price) * item.quantity,
            }),
          );
        } else {
          await load(true);
        }
        return true;
      } catch (err) {
        toast.error(errorMessage(err));
        return false;
      }
    },
    [credentials, load],
  );

  // itemId can be the cart item's id or its product id
  const removeItem = useCallback(
    async (itemId: string) => {
      const line = items.find(
        (i) => i.id === itemId || i.product_id === itemId,
      );
      if (!line) return false;
      try {
        const { token: t, sessionId } = credentials();
        await removeCartItem(line.id, sessionId, t);
        setItems((prev) => prev.filter((i) => i.id !== line.id));
        return true;
      } catch (err) {
        toast.error(errorMessage(err));
        return false;
      }
    },
    [items, credentials],
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      const line = items.find(
        (i) => i.id === itemId || i.product_id === itemId,
      );
      if (!line) return false;
      if (quantity <= 0) return removeItem(line.id);

      try {
        const { token: t, sessionId } = credentials();
        const { item } = await updateCartItem(line.id, quantity, sessionId, t);
        setItems((prev) =>
          prev.map((i) =>
            i.id === line.id
              ? {
                  ...i,
                  quantity: item.quantity,
                  subtotal: parseFloat(i.price) * item.quantity,
                }
              : i,
          ),
        );
        return true;
      } catch (err) {
        toast.error(errorMessage(err));
        return false;
      }
    },
    [items, credentials, removeItem],
  );

  // The server empties the cart when an order is created; this just resets the UI
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  const value = useMemo<CartContextType>(
    () => ({
      items,
      total,
      itemCount,
      isLoading,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refresh,
    }),
    [
      items,
      total,
      itemCount,
      isLoading,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      refresh,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
