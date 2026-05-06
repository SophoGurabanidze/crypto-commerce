import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const fontVars: CSSProperties = {
  // Keep Tailwind font tokens available without depending on Google Fonts fetch.
  ["--font-sans" as string]:
    "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  ["--font-geist-mono" as string]:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
};

export const metadata: Metadata = {
  title: "CryptoShop - E-Commerce with Crypto Payments",
  description:
    "Modern e-commerce store with traditional Stripe and crypto payment options including ETH, escrow, and stablecoins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
      style={fontVars}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <ConvexClientProvider>
            {children}
            <Toaster />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
