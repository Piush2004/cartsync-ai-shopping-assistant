import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GrainOverlay } from "@/components/effects/GrainOverlay";
import { AnalyticsProvider } from "@/lib/analytics/provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CartSync — AI-Powered Personal Stylist",
  description: "Stop guessing your size. CartSync uses AI to match your exact body measurements to brand size charts, eliminating returns and finding your perfect fit.",
  keywords: ["AI stylist", "fashion", "sizing", "personalized shopping", "virtual fitting"],
  openGraph: {
    title: "CartSync — AI-Powered Personal Stylist",
    description: "Stop guessing your size. Find your perfect fit with AI.",
    url: "https://cartsync.ai",
    siteName: "CartSync",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CartSync Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CartSync — AI-Powered Personal Stylist",
    description: "Stop guessing your size. Find your perfect fit with AI.",
    images: ["/images/twitter-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen bg-bg-primary text-text-primary font-sans antialiased">
        <AnalyticsProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "CartSync",
                "applicationCategory": "ShoppingApplication",
                "operatingSystem": "Web",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                },
                "description": "AI-powered personal stylist that maps your body measurements to brand size charts.",
              }),
            }}
          />
          <GrainOverlay />
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
