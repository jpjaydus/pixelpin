import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "PixelPin - Visual Feedback Tool for Design Teams",
  description: "Streamline your design review process with PixelPin. Add comments, annotations, and collaborate in real-time on images, PDFs, and websites. Start free today.",
  keywords: "visual feedback, design review, collaboration, annotations, design tools, team collaboration",
  authors: [{ name: "PixelPin Team" }],
  creator: "PixelPin",
  publisher: "PixelPin",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pixelpin.com",
    siteName: "PixelPin",
    title: "PixelPin - Visual Feedback Tool for Design Teams",
    description: "Streamline your design review process with PixelPin. Add comments, annotations, and collaborate in real-time on images, PDFs, and websites.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PixelPin - Visual Feedback Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelPin - Visual Feedback Tool for Design Teams",
    description: "Streamline your design review process with PixelPin. Add comments, annotations, and collaborate in real-time.",
    images: ["/og-image.png"],
    creator: "@pixelpin",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          <QueryProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
