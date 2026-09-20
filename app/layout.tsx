import type { Metadata, Viewport } from 'next'
import './globals.css'

// 1. Separate Viewport configuration (Next.js 14+ / React 19 Standard)
export const viewport: Viewport = {
  themeColor: '#09090b', // Matches --color-canvas perfectly to prevent white flashes
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

// 2. Peak SEO Metadata Matrix
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://squatchnap.vercel.app'
  ),
  title: {
    default: 'SquatchNap AI | B2B Lead Qualification & Verification Engine',
    template: '%s | SquatchNap AI',
  },
  description:
    'Automated B2B deal qualification for Caprae Capital. Live HTTP status handshakes, intelligent business model classification, and explainable AI acquisition scoring.',
  applicationName: 'SquatchNap AI',
  authors: [{ name: 'Zurriyatt', url: 'https://github.com/Zurriyatt' }],
  generator: 'Next.js',
  keywords: [
    'B2B Lead Generation',
    'Private Equity Sourcing',
    'ETA Deal Flow',
    'Lead Verification',
    'Automated Web Scraping',
    'AI Deal Qualification',
    'Caprae Capital',
    'SaaSQuatch Leads',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Zurriyatt',
  publisher: 'Caprae Capital Partners',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Social Media Sharing Cards (Slack, LinkedIn, Twitter, Discord)
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://squatchnap.vercel.app',
    siteName: 'SquatchNap AI',
    title: 'SquatchNap AI — Clean, Verify & Score Deal Targets',
    description:
      'Turn dirty scraped data into qualified, outreach-ready acquisition leads with automated telemetry and explainable AI scoring.',
    images: [
      {
        url: '/og-image.png', // Resolves against metadataBase
        width: 1200,
        height: 630,
        alt: 'SquatchNap AI Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SquatchNap AI | B2B Deal Qualification',
    description:
      'Live HTTP validation, bot-shield detection, and explainable acquisition scoring for M&A and outbound sales.',
    images: ['/og-image.png'],
    creator: '@squatchnap',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 3. Schema.org JSON-LD Structured Data (Elite SEO for Software Applications)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SquatchNap AI',
    operatingSystem: 'Web-based',
    applicationCategory: 'BusinessApplication',
    description:
      'High-velocity B2B lead enrichment, verification, and deal-scoring engine.',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Person',
      name: 'Zurriyatt',
    },
  }

  return (
    <html lang="en" className="dark">
      <head>
        {/* Inject Structured Data into the Document Head */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-canvas text-zinc-100 antialiased selection:bg-amber-500/20 selection:text-amber-200">
        {children}
      </body>
    </html>
  )
}