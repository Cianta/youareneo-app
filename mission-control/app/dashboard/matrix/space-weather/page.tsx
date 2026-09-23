'use client';
import { IframeView } from '@/components/iframe/IframeView';

const URL = process.env.NEXT_PUBLIC_NOAA_URL ?? 'https://www.swpc.noaa.gov';

export default function SpaceWeatherPage() {
  return (
    <div className="h-full flex flex-col fade-in">
      <div className="mb-3 shrink-0">
        <p className="text-xs text-anth-500 uppercase tracking-widest mb-1">Space Weather</p>
        <h1 className="text-lg font-bold text-forest-100">NOAA Space Weather Center</h1>
      </div>
      <div className="flex-1 min-h-0">
        <IframeView src={URL} title="Space Weather (NOAA)" configKey="NEXT_PUBLIC_NOAA_URL"
          fallbackMessage="Set NEXT_PUBLIC_NOAA_URL in .env.local." />
      </div>
    </div>
  );
}
