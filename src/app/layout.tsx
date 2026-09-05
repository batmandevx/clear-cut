import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetMono = JetBrains_Mono({
  variable: "--font-jet-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ClearCut — The Self-Resolving Finance Controller",
  description:
    "Agentic AI that autonomously reconciles merchant orders against Razorpay settlements and bank statements. Multi-leg graph resolution, honest exception dossiers, zero hallucination.",
  keywords: [
    "Razorpay",
    "AI",
    "Reconciliation",
    "Finance Controller",
    "ClearCut",
    "Buildathon",
    "Multi-leg Settlement",
    "Forensic Audit",
  ],
  authors: [{ name: "ClearCut AI" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "ClearCut — Self-Resolving Finance Controller",
    description:
      "Agentic AI that proves a financial match mathematically — or honestly admits it cannot resolve.",
    siteName: "ClearCut",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
