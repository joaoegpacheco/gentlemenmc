import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./gentlemen.css";

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
    <meta name="viewport" content="width=device-width, initial-scale=1"/>

    <meta name="description" content=""/>
    <meta name="author" content=""/>

    <title>Gentlemen MC</title>

    <link rel="preconnect" href="https://fonts.googleapis.com"/>

    <link rel="preconnect" href="https://fonts.gstatic.com"/>

</head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
