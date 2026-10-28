export type PackPricing = {
  price_cents?: number | null;
  stars_price?: number | null;
};

/**
 * A pack is free only when no supported payment method assigns it a price.
 * Stars pricing is independent of fiat pricing; a zero `price_cents` must not bypass a configured Stars price.
 */
export function isPackFree(pack: PackPricing): boolean {
  return (pack.price_cents ?? 0) === 0 && (pack.stars_price ?? 0) === 0;
}
