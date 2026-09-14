import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import StatusBarController from './StatusBarController'
import BackButtonController from './BackButtonController'

export const metadata: Metadata = {
  title: 'Hurry Party Voice Chat Rooms',

  description:
    'Hurry Party Voice Chat Rooms – connect with friends, join voice chat rooms, share moments, and discover new people.',

  robots: {
    index: false,
    follow: false,
  },

  icons: {
    icon: 'https://jb-hm.vercel.app/logo.png',
    apple: 'https://jb-hm.vercel.app/logo.png',
  },

  openGraph: {
    title: 'Hurry Party Voice Chat Rooms',
    description:
      'Join Hurry Party Voice Chat Rooms, connect with friends, and discover new people.',
    url: 'https://jb-hm.vercel.app/HurryOfficial',
    siteName: 'Hurry',
    images: [
      {
        url: 'https://jb-hm.vercel.app/logo.png',
        width: 550,
        height: 550,
        alt: 'Hurry Party Voice Chat Rooms',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Hurry Party Voice Chat Rooms',
    description:
      'Join Hurry Party Voice Chat Rooms, connect with friends, and discover new people.',
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
          content="Hurry Party Voice Chat Rooms"
        />

        <meta
          name="theme-color"
          content="#000000"
        />

        <link
          rel="apple-touch-icon"
          href="https://jb-hm.vercel.app/logo.png"
        />

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
