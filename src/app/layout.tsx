
import type {Metadata} from 'next';
import { GoogleTagManager, GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';

export const metadata: Metadata = {
  title: 'UdayScripts | Premium IPTV Experience',
  description: 'A modern, immersive IPTV streaming player built with Next.js.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        {children}
        {/* Update these IDs with your actual Google Tag Manager and Analytics IDs */}
        <GoogleTagManager gtmId="GTM-T2G4BG68" />
        <GoogleAnalytics gaId="G-YP6V9PBL7G" />
      </body>
    </html>
  );
}
