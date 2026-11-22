import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "NAASCONNECT Nigeria", description: "Connecting NAAS, Adventist Students Fellowships, churches and members across Nigeria.", icons: { icon: "/Favicon%20(1).ico" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
