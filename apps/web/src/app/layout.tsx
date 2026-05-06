import { AppBar } from "@/components/AppBar";
import Provider from "./providers";
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "plut0x Exchange",
  description: "Exchange for trading cryptocurrencies",
  icons: {
    icon: "/favicon2.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>
        <Provider>
          <AppBar />
          <div>
            {children}
          </div>
        </Provider>
      </body>
    </html>
  );
}
