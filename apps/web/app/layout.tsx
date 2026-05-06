import { AppBar } from "../components/AppBar";
import Provider from "./providers";
import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-ubuntu",
});

export const metadata: Metadata = {
  title: "plut0x Exchange",
  description: "Exchange for trading cryptocurrencies",
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
          <AppBar/>
          {children}
        </Provider>
      </body>
    </html>
  );
}
