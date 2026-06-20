import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Polymarket Sentiment Lens - Prediction Market Context Analyser',
  description: 'Correlate and explain prediction market odds using real-time global news streams and FinBERT Financial Sentiment Analysis.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-800" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
