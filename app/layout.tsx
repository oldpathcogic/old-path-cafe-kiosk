import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Old Path Cafe",
  description: "Order coffee and follow cafe orders at Old Path Miracle Cathedral.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Old Path Cafe",
    description: "Coffee, connection, and community at Old Path.",
    type: "website",
    images: ["https://old-path-cafe.oldpathcogic.chatgpt.site/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Old Path Cafe",
    description: "Coffee, connection, and community at Old Path.",
    images: ["https://old-path-cafe.oldpathcogic.chatgpt.site/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
