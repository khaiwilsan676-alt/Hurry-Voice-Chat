import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import StatusBarController from './StatusBarController'
import BackButtonController from './BackButtonController'

export const metadata: Metadata = {
  title: 'Hurry',

  description:
    'Hurry – connect with friends, join voice chat rooms, share moments, and discover new people.',

  robots: {
    index: false,
    follow: false,
  },

  icons: {
    icon: 'https://hurry-voice-chat.vercel.app/logo.png',
    apple: 'https://hurry-voice-chat.vercel.app/logo.png',
  },

  openGraph: {
    title: 'Hurry',
    description:
      'Join Hurry, connect with friends, and discover new people.',
    url: 'https://hurry-voice-chat.vercel.app/HurryOfficial',
    siteName: 'Hurry',
    images: [
      {
        url: 'https://hurry-voice-chat.vercel.app/logo.png',
        width: 550,
        height: 550,
        alt: 'Hurry',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Hurry',
    description:
      'Join Hurry, connect with friends, and discover new people.',
    images: ['https://hurry-voice-chat.vercel.app/logo.png'],
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
          content="Hurry"
        />

        <meta
          name="theme-color"
          content="#000000"
        />

        <link
          rel="apple-touch-icon"
          href="https://hurry-voice-chat.vercel.app/logo.png"
        />

        <meta
          name="mobile-web-app-capable"
          content="yes"
        />

        {/* 🐛 Debug Page Loader — sirf /debug URL pe, sirf allowed email
            Normal app me koi Eruda nahi aayega */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  if (window.location.pathname !== '/debug') return;
                  var ALLOWED = ['hurry.in@gmail.com'];
                  var keys = ['userEmail', 'email', 'emailPhone', 'user_email', 'emailOrPhone'];
                  var email = '';
                  for (var i = 0; i < keys.length; i++) {
                    var v = localStorage.getItem(keys[i]);
                    if (v && v.trim()) { email = v.trim().toLowerCase(); break; }
                  }
                  if (!email || ALLOWED.indexOf(email) === -1) return;

                  var s = document.createElement('script');
                  s.src = 'https://cdn.jsdelivr.net/npm/eruda';
                  s.async = true;
                  s.onload = function () {
                    if (window.eruda) {
                      window.eruda.init();
                      console.log('%c✅ Eruda ready for /debug', 'color:#00ff00;font-weight:bold;font-size:14px');
                    }
                  };
                  s.onerror = function () {
                    console.warn('[Hurry Debug] Eruda CDN load failed');
                  };
                  document.head.appendChild(s);
                } catch (e) {}
              })();
            `,
          }}
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
