import { useSyncExternalStore } from "react";
import Cookies from "js-cookie";
import {
  addToCart as apiAddToCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/api";

/**
 * Tiny shared cart store for the product cards on the home page.
 *
 * All network calls go through the cart functions in lib/api.ts, so request
 * shape, headers and error handling stay in one place. This file only adds a
 * small store so every card for the same product shows the same quantity.
 *
 * ⚠️ These two values MUST match where the rest of the app keeps the guest
 * session id and the login token (your cart/auth providers), otherwise items
 * added here land in a different cart than the one the cart page reads.
 */
const SESSION_KEY = "sessionId"; // localStorage key holding the guest session id
const TOKEN_COOKIE = "token"; // cookie holding the login JWT

export type CartLine = { itemId: string; quantity: number };

/* --------------------------- session / token access --------------------------- */

function readSessionId(): string | undefined {
  try {
    return localStorage.getItem(SESSION_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function saveSessionId(id: string) {
  try {
    localStorage.setItem(SESSION_KEY, id);
  } catch {
    /* storage unavailable (private mode): the cart just won't persist */
  }
}

const readToken = () => Cookies.get(TOKEN_COOKIE) || undefined;

/* ------------------------------- tiny store ------------------------------ */

let lines: ReadonlyMap<string, CartLine> = new Map();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: Map<string, CartLine>) {
  lines = next;
  listeners.forEach((listener) => listener());
}

function setLine(productId: string, line: CartLine | null) {
  const next = new Map(lines);
  if (line) next.set(productId, line);
  else next.delete(productId);
  commit(next);
}

/** Lets the header (or anything else) refresh its cart badge. */
function announce() {
  window.dispatchEvent(new CustomEvent("cart:updated"));
}

/** The current line for a product, or undefined if it isn't in the cart. */
export function useCartLine(productId: string) {
  return useSyncExternalStore(
    subscribe,
    () => lines.get(productId),
    () => undefined,
  );
}

/* --------------------------------- actions -------------------------------- */

let hydration: Promise<void> | null = null;

/** Loads the current cart once so products already in it show their quantity. */
export function hydrateCart(): Promise<void> {
  const sessionId = readSessionId();
  const token = readToken();

  // No session and not logged in: the cart is empty, nothing to fetch
  if (!sessionId && !token) return Promise.resolve();

  if (!hydration) {
    hydration = getCart(sessionId, token)
      .then(({ items }) => {
        const next = new Map<string, CartLine>();
        for (const item of items) {
          next.set(item.product_id, {
            itemId: item.id,
            quantity: item.quantity,
          });
        }
        commit(next);
      })
      .catch(() => {
        hydration = null; // allow a retry on the next mount
      });
  }
  return hydration;
}

export async function addToCart(productId: string): Promise<void> {
  const { item, sessionId } = await apiAddToCart(
    productId,
    1,
    readSessionId(),
    readToken(),
  );
  // First add as a guest: the server creates the session and returns its id
  if (sessionId) saveSessionId(sessionId);

  setLine(productId, { itemId: item.id, quantity: item.quantity });
  announce();
}

export async function setCartQuantity(
  productId: string,
  quantity: number,
): Promise<void> {
  const line = lines.get(productId);
  if (!line) {
    await addToCart(productId);
    return;
  }
  const { item } = await updateCartItem(
    line.itemId,
    quantity,
    readSessionId(),
    readToken(),
  );
  setLine(productId, { itemId: item.id, quantity: item.quantity });
  announce();
}

export async function removeFromCart(productId: string): Promise<void> {
  const line = lines.get(productId);
  if (!line) return;
  await removeCartItem(line.itemId, readSessionId(), readToken());
  setLine(productId, null);
  announce();
}
