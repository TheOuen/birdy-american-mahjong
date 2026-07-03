import type { Metadata } from "next";
import { CartProvider } from "@/components/shop/CartProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "American Mahjong | London — Learn it once, love it forever",
    template: "%s — American Mahjong | London",
  },
  description:
    "American Mahjong lessons in London with Andrew — private sessions, official NMJL cards and scorecards, and Birdy, our free online game. Learn it once, love it forever!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Poppins:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-[var(--bg)]">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
