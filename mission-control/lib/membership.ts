/**
 * Fördermitgliedschaft Shopify product — single Trinity source.
 * Keep in sync with /shared/foerder-membership.ts for other apps.
 */
export const FOERDER_SHOPIFY_PRODUCT_ID = '10560145228103';
export const FOERDER_SHOPIFY_PRODUCT_HANDLE = 'you-are-neo-community-access';
/** Public storefront URL — verified 2026-09-24 (product 3,33 €) */
export const FOERDER_PRODUCT_URL_DEFAULT =
  'https://youareneo.com/products/you-are-neo-community-access';

export function getFoerderProductUrl(envValue?: string | null): string {
  const fromEnv = (envValue ?? '').trim();
  return fromEnv || FOERDER_PRODUCT_URL_DEFAULT;
}

/** Client-safe: prefers NEXT_PUBLIC_FOERDER_PRODUCT_URL */
export const FOERDER_PRODUCT_URL = getFoerderProductUrl(
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_FOERDER_PRODUCT_URL
    : undefined,
);
