import type { Metadata } from "next";
import "./globals.css";
import "./ux-polish.css";
import "./usbooth-visual-system.css";
import AppShell from "../components/AppShell";

export const metadata: Metadata = {
  title: "UsBooth",
  description:
    "Two phones. One moment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
