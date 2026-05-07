import "./globals.css";
import { AppBar } from "../components/AppBar";
import Provider from "./providers";

export const metadata = {
  title: "galaxyExchange · MPE Dashboard",
  description:
    "Matching Pre-Engine: orders protected, money saved, and decisions in real time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Provider>
          <AppBar />
          {children}
        </Provider>
      </body>
    </html>
  );
}
