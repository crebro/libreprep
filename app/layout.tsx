import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LibrePrep — Free SAT Practice",
  description:
    "Practice SAT questions in a Bluebook-style test interface with mark-for-review, answer eliminator, highlighter, math reference, and Desmos.",
  authors: [{ name: "LibrePrep" }],
  openGraph: {
    title: "LibrePrep — Free SAT Practice",
    description:
      "Custom SAT practice sets in a Bluebook-style test interface.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif4.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
