import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoLimit | Welcome back",
  description: "Sign in to your NoLimit workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
