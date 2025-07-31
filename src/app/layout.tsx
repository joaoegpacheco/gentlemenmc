import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConfigProvider } from "antd";
import "./globals.css";
import AuthListener from "@/components/AuthListener";

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
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#171717",
        },
        components: {
          Calendar: {
            colorBgContainer: "#f0f2f5",
            colorText: "#000000",
            colorTextDisabled: "#d9d9d9",
            colorPrimary: "#C69749",
          },
          Badge: {
            colorFillContent: "#C69749",
            colorText: "#ffffff",
          },
        },
      }}
    >
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
        <body className={inter.className} style={{ display: "flex", flexDirection: "column", minHeight: "100vh", margin: 0 }}>
          <AuthListener />
          <div style={{ flex: 1 }}>{children}</div>
          <footer style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", paddingBottom: 10 }}>
            <span style={{ fontSize: 12, color: "#888" }}>Copyright © 2025 Gentlemen MC</span> 
          </footer>
        </body>
      </html>
    </ConfigProvider>
  );
}
