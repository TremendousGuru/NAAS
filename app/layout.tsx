import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NAASCONNECT Nigeria",
  description: "Connecting NAAS, Adventist Students Fellowships, churches and members across Nigeria.",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/brand/naasconnect-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
