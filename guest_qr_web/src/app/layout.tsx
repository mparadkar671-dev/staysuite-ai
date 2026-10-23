import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StaySuite AI — Direct Guest Experience & Reception QR",
  description: "Fast zero-install guest storefront, self check-in, and dining pre-ordering.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-indigo-500 selection:text-white">
        <main className="max-w-md mx-auto min-h-screen bg-white shadow-xl flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
