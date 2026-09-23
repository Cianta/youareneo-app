import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond, Poppins, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// YOU ARE NEO brand fonts (loaded via next/font for automatic optimization)
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TRINITY OS | Powered by YOU ARE NEO',
  description: 'TRINITY OS — Hybrid Enterprise Agent Operating System · Powered by YOU ARE NEO Academy',
  robots: 'noindex',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A110D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable} ${poppins.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="bg-bg antialiased overflow-hidden">
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(function(reg) { console.log('[TrinityOS] SW registered:', reg.scope); })
                .catch(function(err) { console.warn('[TrinityOS] SW registration failed:', err); });
            });
          }
        `}} />
      </body>
    </html>
  );
}
