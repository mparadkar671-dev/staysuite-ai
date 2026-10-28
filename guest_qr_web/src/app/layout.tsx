import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StaySuite AI — Direct Guest Experience & Reception QR",
  description: "Fast zero-install guest storefront, self check-in, owner PMS desk, and property setup.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-indigo-500 selection:text-white flex flex-col w-full text-slate-900">
        {children}
      </body>
    </html>
  );
}
