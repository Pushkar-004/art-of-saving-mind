import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'

import './globals.css'
import { Toaster } from 'sonner'
import Header from '@/components/layout/Header'
import { LanguageProvider } from '@/lib/context/LanguageContext'
import { AuthProvider } from '@/lib/context/AuthContext'

const geistMono = localFont({
  src: [
    { path: '../public/fonts/geist-mono/geist-mono-latin-wght-normal.woff2', style: 'normal' },
  ],
  variable: '--font-geist-mono',
  display: 'swap',
})

const playfairDisplay = localFont({
  src: [
    { path: '../public/fonts/playfair/playfair-display-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/playfair/playfair-display-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/playfair/playfair-display-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/playfair/playfair-display-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = localFont({
  src: [
    { path: '../public/fonts/inter/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/inter/inter-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansDevanagari = localFont({
  src: [
    { path: '../public/fonts/noto-devanagari/noto-sans-devanagari-devanagari-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/noto-devanagari/noto-sans-devanagari-devanagari-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/noto-devanagari/noto-sans-devanagari-devanagari-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/noto-devanagari/noto-sans-devanagari-devanagari-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-devanagari',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Art of Saving Mind - Therapy with Miss Pooja Sunil Ghadge',
  description:
    'Premium online and offline therapy with Miss Pooja Sunil Ghadge, M.A. Clinical Psychology.',
  generator: 'v0.app',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8BA888' },
    { media: '(prefers-color-scheme: dark)', color: '#7FA57A' },
  ],
  userScalable: true,
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistMono.variable} ${playfairDisplay.variable} ${inter.variable} ${notoSansDevanagari.variable} bg-background`}
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var t = localStorage.getItem('theme');
                  var m = window.matchMedia('(prefers-color-scheme: dark)').matches;

                  if (t === 'dark' || (!t && m)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>

      <body className="font-sans antialiased bg-background text-foreground">
        <LanguageProvider>
          <AuthProvider>
            <Header />
            {children}
            <Toaster position="bottom-right" />
          </AuthProvider>
        </LanguageProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
