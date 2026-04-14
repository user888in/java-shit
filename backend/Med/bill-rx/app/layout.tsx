import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ShieldCheck } from 'lucide-react';

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "BillRx | Medical Bill Auditor",
  description: "Stop overpaying for medical care. Detect errors and generate disputes automatically.",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased h-screen font-sans bg-slate-950 text-slate-200`}
      >
        {children}
      </body>
    </html>
  );
}
