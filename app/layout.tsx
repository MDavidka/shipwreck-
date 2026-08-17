import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Order tracker", description: "A quiet, simple way to check your order." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><div className="site-shell">{children}</div></body></html>;
}
