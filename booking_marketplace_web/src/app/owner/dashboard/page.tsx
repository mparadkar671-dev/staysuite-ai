"use client";

import { useEffect } from "react";

export default function OwnerDashboardRedirect() {
  useEffect(() => {
    // Port 3003 is the Guest Booking Marketplace.
    // Business OS (PMS, Owner, Kitchen, Staff) is strictly hosted on Port 3002.
    window.location.href = "http://localhost:3002/owner/dashboard";
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans text-center">
      <div className="max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
        <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          ⚡
        </div>
        <h1 className="text-xl font-bold mb-2">Redirecting to StaySuite Business OS</h1>
        <p className="text-sm text-slate-400 mb-6">
          Owner & Staff Operations are strictly isolated on <strong>Port 3002</strong>. Tourists & Guests remain on Port 3003.
        </p>
        <a
          href="http://localhost:3002/owner/dashboard"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/20"
        >
          Open StaySuite Business OS (Port 3002) →
        </a>
      </div>
    </div>
  );
}
