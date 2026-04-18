import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Use local fonts only — avoids build-time Google Fonts network requests
const inter = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-inter",
  weight: "100 900",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const robotoMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-roboto-mono",
  weight: "100 700",
});

export const metadata: Metadata = {
  title: "Open Lovable v3",
  description: "Re-imagine any website in seconds with AI-powered website builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${robotoMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
