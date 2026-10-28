"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";

export default function SuperAdminRedirectPage() {
  useEffect(() => {
    // Auto-redirect to SuperAdmin SaaS HQ on Port 3001
    const timer = setTimeout(() => {
      window.location.href = "http://localhost:3001";
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-purple-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-black tracking-tight text-white">
            SuperAdmin SaaS HQ Is Isolated
          </h1>
          <p className="text-xs text-purple-200/80 leading-relaxed">
            All tenant governance, KYC queues, kill-switches, and database tools are strictly restricted to the SuperAdmin Panel on <strong>Port 3001</strong>.
          </p>
        </div>
        <div className="pt-2">
          <a
            href="http://localhost:3001"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg shadow-purple-600/30"
          >
            <span>Go to SuperAdmin SaaS HQ (Port 3001)</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <p className="text-[11px] text-slate-500">Redirecting automatically in 2 seconds...</p>
      </div>
    </div>
  );
}
