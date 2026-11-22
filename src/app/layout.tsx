import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { brand } from "@config/brand";
import { config } from "@config/env";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const description =
  "Shield, transfer and unshield USDG through allowlisted contracts on Robinhood Chain, and prepare a disclosure package for your auditor. Interface preview: mock mode, mainnet gated.";

export const metadata: Metadata = {
  metadataBase: config.siteUrl ? new URL(config.siteUrl) : undefined,
  title: { default: `${brand.name}: compliance-first interface for the USDG privacy pool`, template: `%s · ${brand.name}` },
  description,
  applicationName: brand.name,
  /* Open Graph images need an absolute URL. Until SITE_URL is configured they are left out rather than pointing at localhost. */
  openGraph: { type: "website", siteName: brand.name, title: brand.name, description, ...(config.siteUrl ? { images: [{ url: "/og.png", width: 1200, height: 630, alt: `${brand.name} interface preview` }] } : {}) },
  twitter: { card: config.siteUrl ? "summary_large_image" : "summary", title: brand.name, description, ...(config.siteUrl ? { images: ["/og.png"] } : {}) },
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#0f1110",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <ToastProvider>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 focus-visible:outline-none">
            {children}
          </main>
          <SiteFooter />
        </ToastProvider>
      </body>
    </html>
  );
}
