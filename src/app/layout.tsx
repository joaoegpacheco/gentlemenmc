import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthListener from "@/components/AuthListener";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gentlemen MC",
  description: "Sistema interno do Gentlemen Moto Clube",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <meta name="description" content="" />
        <meta name="author" content="" />

        <title>Gentlemen MC</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />

        <link rel="preconnect" href="https://fonts.gstatic.com" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthListener />
        <main className="flex-1 p-6">{children}</main>
        <footer className="flex items-center justify-center w-full pb-2">
          <span className="text-xs text-gray-500">Copyright © 2025 Gentlemen MC</span> 
        </footer>
        <SpeedInsights />
        <Toaster />
      </body>
    </html>
  );
}
