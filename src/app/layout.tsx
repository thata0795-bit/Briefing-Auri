import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { BarraDemo } from "@/components/demo/barra-demo";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Portal do Cliente", template: "%s · Portal do Cliente" },
  description: "Acompanhe em tempo real o trabalho da agência na sua marca.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#5F3C26",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${cormorant.variable} ${inter.variable} antialiased`}>
        <BarraDemo />
        {children}
      </body>
    </html>
  );
}
