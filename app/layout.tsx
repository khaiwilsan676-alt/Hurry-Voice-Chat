import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import StatusBarController from './StatusBarController'
import BackButtonController from './BackButtonController'

export const metadata: Metadata = {
  title: 'Hurry – Official Website',
  description:
    'Hurry is a social app to chat, connect with friends, share moments, and discover popular content.',

  verification: {
    google: 'uezQIpYhfc4_N7IFIu-iJ6wATwJ1pj8L51prETGgGeo',
  },

  icons: {
    icon: '/logo.png?v=2',
    apple: '/logo.png?v=2',
  },

  openGraph: {
    title: 'Hurry – Official Website',
    description:
      'Chat, connect, share moments, and discover popular content on Hurry.',
    url: 'https://jb-hm.vercel.app/',
    siteName: 'Hurry',
    images: [
      {
        url: 'https://jb-hm.vercel.app/logo.png',
        width: 512,
        height: 512,
        alt: 'Hurry',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Hurry – Official Website',
    description:
      'Chat, connect, share moments, and discover popular content on Hurry.',
    images: ['https://jb-hm.vercel.app/logo.png'],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />

        <meta
          name="apple-mobile-web-app-capable"
          content="yes"
        />

        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <meta
          name="apple-mobile-web-app-title"
          content="Hurry"
        />

        <meta name="theme-color" content="#000000" />

        <link rel="apple-touch-icon" href="/logo.png" />

        <meta
          name="mobile-web-app-capable"
          content="yes"
        />
      </head>

      <body className="antialiased app-root bg-transparent">
        <StatusBarController />
        <BackButtonController />

        {children}

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
