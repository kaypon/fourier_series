import type { Metadata, Viewport } from "next";
import { Archivo_Black } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const description =
  "Spinning circles that add up to a square wave. Change the formula and watch the wave reshape.";

export const metadata: Metadata = {
  title: "FOURIER — Kevin van der Poll",
  description,
  openGraph: {
    title: "FOURIER — Kevin van der Poll",
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@kevdotpng",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2f2f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={archivoBlack.variable}>
      <body>{children}</body>
    </html>
  );
}
