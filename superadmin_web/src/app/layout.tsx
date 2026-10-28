import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StaySuite HQ — SaaS Executive Command Center",
  description: "Enterprise SaaS Governance, Property KYC Verification, Subscription Matrix & Global Kill-Switch Console",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
