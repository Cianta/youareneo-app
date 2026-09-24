/**
 * Shared YOU ARE NEO Fördermitgliedschaft (Shopify) config.
 * Reuse from Trinity and future room/portal apps.
 * Override with NEXT_PUBLIC_FOERDER_PRODUCT_URL when needed.
 */
export const FOERDER_SHOPIFY_PRODUCT_ID = '10560145228103';
export const FOERDER_SHOPIFY_PRODUCT_HANDLE = 'you-are-neo-community-access';
/** Public storefront URL — verified 2026-09-24, product 3,33 € */
export const FOERDER_PRODUCT_URL_DEFAULT =
  'https://youareneo.com/products/you-are-neo-community-access';

export function getFoerderProductUrl(
  envValue?: string | null,
): string {
  const fromEnv = (envValue ?? '').trim();
  return fromEnv || FOERDER_PRODUCT_URL_DEFAULT;
}
