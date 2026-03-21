import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TABBED - hackclub ysws",
  description: "build something keyboard-only, get a keyboard grant.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800,900&f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
