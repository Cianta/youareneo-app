import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond, Poppins, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import '@/components/workspace/workspace.css';
import {AppControls} from '@/components/workspace/AppControls';
import { brandConfig } from '@/lib/brand';
import { BrandProvider } from '@/components/voice/BrandProvider';
import { VoiceLauncher } from '@/components/voice/VoiceLauncher';
import { AppFrame } from '@/components/workspace/AppFrame';
import { AssistantPreferencesProvider } from '@/components/assistant/Preferences';
import '@/components/workspace/restored.css';
import '@/components/workspace/journal.css';
import '@/components/assistant/assistant.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// YOU ARE NEO brand fonts (loaded via next/font for automatic optimization)
const cormorant = Cormorant_Garamond({
  preload: false,
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const poppins = Poppins({
  preload: false,
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  preload: false,
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const dynamic = 'force-dynamic';
export function generateMetadata(): Metadata {
  const { appName } = brandConfig();
  return {title: `${appName} | YOU ARE NEO`, description: `${appName} – dein persönlicher Guiding Space`, robots:'noindex', manifest:'/manifest.webmanifest', appleWebApp:{capable:true,title:appName,statusBarStyle:'black-translucent'}, icons:{icon:[{url:'/pwa/trinity-sun-v2-favicon.ico',sizes:'any'},{url:'/pwa/trinity-sun-v2-32.png',sizes:'32x32',type:'image/png'}],apple:'/pwa/trinity-sun-v2-apple-180.png'}};
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f8f8f7',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable} ${poppins.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-bg antialiased overflow-hidden">
        <BrandProvider brand={brandConfig()}><AssistantPreferencesProvider><AppFrame>{children}</AppFrame><VoiceLauncher /><AppControls /></AssistantPreferencesProvider></BrandProvider>
      </body>
    </html>
  );
}
