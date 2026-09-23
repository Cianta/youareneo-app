import { ShopifyHub } from '@/components/shopify/ShopifyHub';

export default function ShopifyPage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-5 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Automated Content & Product Publishing</p>
        <p className="text-sm text-anth-400">
          Generate product descriptions, blog posts, and pages with AI. One-click publish directly to your Shopify store via the Admin API.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ShopifyHub />
      </div>
    </div>
  );
}
