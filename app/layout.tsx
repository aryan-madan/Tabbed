import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tabbed",
  description: "build something keyboard-only. get a keyboard grant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.cdnfonts.com" />
        <link href="https://fonts.cdnfonts.com/css/made-waffle-slab" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
