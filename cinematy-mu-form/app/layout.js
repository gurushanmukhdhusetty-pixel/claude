import localFont from 'next/font/local';
import './globals.css';

const serif = localFont({
  src: [
    { path: './fonts/instrument-serif-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--f-serif',
  display: 'swap',
});
const sans = localFont({
  src: [
    { path: './fonts/geist-sans-latin-400-normal.woff2', weight: '400' },
    { path: './fonts/geist-sans-latin-500-normal.woff2', weight: '500' },
    { path: './fonts/geist-sans-latin-600-normal.woff2', weight: '600' },
  ],
  variable: '--f-sans',
  display: 'swap',
});
const mono = localFont({ src: './fonts/geist-mono-latin-400-normal.woff2', variable: '--f-mono', display: 'swap' });

export const metadata = {
  title: 'Cinematy @ MU · Join the Content Unit',
  description: 'Calling all writers, directors, actors, editors, shoot managers, line producers and planners at Mahindra University. Join the Cinematy Content Unit.',
  icons: { icon: '/logo.svg' },
  openGraph: {
    title: 'Cinematy @ MU · Join the Content Unit',
    description: 'Calling all writers, directors, actors, editors and producers at Mahindra University.',
  },
};

export const viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
