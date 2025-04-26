import React from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Druli Leasing | Arrendamiento de equipos médicos y dentales",
  description: "Druli es una arrendadora de equipos dentales y médicos. Nuestra misión es empoderar a los dentistas y médicos mexicanos para seguir creciendo.",
  openGraph: {
    title: "Druli Leasing | Arrendamiento de equipos médicos y dentales",
    description: "Arrendamiento de equipos médicos y dentales en México",
    url: "https://druli.mx",
    locale: "es_MX",
    type: "website",
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
