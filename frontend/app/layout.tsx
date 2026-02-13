import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Escape Rooms Near Me | Discover Your Next Adventure in London",
  description: "Find the best escape rooms in London. Connect through shared experiences—filter by difficulty, theme, and book your next adventure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
