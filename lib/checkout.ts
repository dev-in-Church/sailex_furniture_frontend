/**
 * Shared by the cart and checkout pages.
 *
 * ⚠️ The shipping numbers must match routes/orders.js on the server
 * (FREE_SHIPPING_THRESHOLD / SHIPPING_FEE). The server always has the final say
 * on the real total; these only power the preview shown before the order exists.
 */
export const FREE_SHIPPING_THRESHOLD = 50000;
export const SHIPPING_FEE = 500;

export const calculateShipping = (subtotal: number) =>
  subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

/** The checkout stores the just-placed order here so the success page can load it. */
export const LAST_ORDER_STORAGE_KEY = "sailex_last_order";

export const KENYA_COUNTIES = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans-Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
] as const;

/**
 * Accepts 0712345678, 712345678, +254712345678, 254 712 345 678, 0112345678 ...
 * and returns the 2547XXXXXXXX / 2541XXXXXXXX format M-Pesa expects, or null.
 */
export function normalizeKenyanPhone(input: string): string | null {
  const compact = input.replace(/[\s\-()]/g, "");
  const match = compact.match(/^(?:\+?254|0)?([17]\d{8})$/);
  return match ? `254${match[1]}` : null;
}
