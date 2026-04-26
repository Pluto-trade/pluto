import { AppBar } from "../components/AppBar";
import Provider from "./providers";

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
          {children}
        </Provider>
      </body>
    </html>
  );
}
