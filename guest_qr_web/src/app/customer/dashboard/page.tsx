"use client";

import React, { useEffect } from "react";
import { ArrowRight, Sparkles, ExternalLink } from "lucide-react";

export default function CustomerDashboardPort3002Redirect() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "http://localhost:3003/customer/dashboard";
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-black tracking-tight text-slate-900">
            Guest Portal Moved to Marketplace
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The Tourist Dashboard, OTP login, downloadable receipts, and stay reviews are hosted on the public <strong>Booking Marketplace (Port 3003)</strong>.
          </p>
        </div>
        <div className="pt-2">
          <a
            href="http://localhost:3003/customer/dashboard"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/30"
          >
            <span>Open Guest Dashboard on Port 3003</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <p className="text-[11px] text-slate-400">Redirecting automatically...</p>
      </div>
    </div>
  );
}
