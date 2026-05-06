import { AppBar } from "@/components/AppBar";
import Provider from "./providers";
import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
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
