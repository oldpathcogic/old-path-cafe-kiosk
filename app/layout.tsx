import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "She Brews Cafe",
  description: "Order coffee, follow cafe orders, and view the live She Brews menu at Old Path.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "She Brews Cafe",
    description: "Coffee, connection, and community at Old Path.",
    type: "website",
    images: ["https://she-brews-cafe.oldpathcogic.chatgpt.site/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "She Brews Cafe",
    description: "Coffee, connection, and community at Old Path.",
    images: ["https://she-brews-cafe.oldpathcogic.chatgpt.site/og.png"],
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
