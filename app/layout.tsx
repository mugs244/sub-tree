import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ConditionalAnalytics } from "@/components/ConditionalAnalytics";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sub-tree.com"),
  title: "Sub-tree",
  description: "Share everything you create and accept mobile money donations, all from one link.",
  // Shared defaults for link previews (WhatsApp, X, Facebook, iMessage…).
  // Pages that set their own openGraph replace this object, so they repeat
  // siteName/type where it matters.
  openGraph: {
    siteName: "Sub-tree",
    type: "website",
    url: "/",
    title: "Sub-tree — All your links, one page",
    description: "Share everything you create and accept mobile money donations, all from one link.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The dashboard's theme script sets data-dash-mode on <html> before
      // React hydrates; this only silences that one attribute mismatch.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
        <ConditionalAnalytics />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
