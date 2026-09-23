import { SEOModule } from '@/components/seo/SEOModule';

export default function SEOPage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-5 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Keyword Research & Content Deployment</p>
        <p className="text-sm text-anth-400">
          Powered by Hermes (GPT-4o) and SERP API. Research keywords, generate SEO content, and deploy across multiple domains automatically.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <SEOModule />
      </div>
    </div>
  );
}
