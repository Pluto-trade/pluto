import "./globals.css";
import { AppBar } from "../components/AppBar";

export const metadata = {
  title: "galaxyExchange · MPE Leaderboard",
  description:
    "Top traders protected by the Matching Pre-Engine: orders saved, dollars rescued.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AppBar />
        {children}
      </body>
    </html>
  );
}
