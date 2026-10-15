import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CartSyncAI | Multi-Agent Virtual Fitting Room & Catalog Discovery",
  description: "Experience the next generation of e-commerce with real-time biometric fit predictions, compliance guardrails, and virtual try-ons powered by autonomous AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-[#F5F5F5] font-sans selection:bg-[#00FFCC] selection:text-black">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
