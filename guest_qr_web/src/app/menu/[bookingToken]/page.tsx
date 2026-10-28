"use client";

import React, { useEffect, use } from "react";
import { Utensils, ExternalLink } from "lucide-react";

export default function GuestMenuPort3002Redirect({
  params,
}: {
  params: Promise<{ bookingToken: string }>;
}) {
  const unwrappedParams = use(params);
  const token = unwrappedParams.bookingToken;

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = `http://localhost:3003/menu/${token}`;
    }, 1500);
    return () => clearTimeout(timer);
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <Utensils className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-black tracking-tight text-slate-900">
            Guest Pre-Order Menu on Port 3003
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The Tourist Food Pre-Order Menu with 24h &amp; 4h fresh market cut-off validation is hosted on the public <strong>Booking Marketplace (Port 3003)</strong>.
          </p>
        </div>
        <div className="pt-2">
          <a
            href={`http://localhost:3003/menu/${token}`}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-amber-600/30"
          >
            <span>Open Pre-Order Menu on Port 3003</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <p className="text-[11px] text-slate-400">Redirecting automatically...</p>
      </div>
    </div>
  );
}
