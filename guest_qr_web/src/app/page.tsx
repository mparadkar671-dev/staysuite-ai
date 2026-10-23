"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  QrCode,
  Utensils,
  DoorClosed,
  Laptop,
  Smartphone,
  Cloud,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sliders,
  DollarSign,
  FileText,
  Volume2,
  Building2,
  CookingPot,
  Receipt,
  Layers,
} from "lucide-react";

export default function MasterDemoHub() {
  const [activeTab, setActiveTab] = useState<"faces" | "free_hosting" | "features">("faces");

  return (
    <div className="flex-1 flex flex-col p-4 space-y-6 pb-20 bg-slate-50 min-h-screen">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> StaySuite AI v4.0 — One Brain, Three Faces
          </span>
          <h1 className="text-xl font-black tracking-tight">Interactive Homestay & Resort OS</h1>
          <p className="text-xs text-indigo-200/90 leading-relaxed">
            All roles and interfaces are connected. Click below to experience how owners, guests, cooks, and cleaning staff use the system.
          </p>
        </div>
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
      </div>

      {/* Quick Launch Buttons for Homestay Demo */}
      <div className="space-y-2">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          🚀 Instant Demo Switchboard (Choose Role to Test)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/owner/dashboard"
            className="p-3 bg-white border-2 border-indigo-200 hover:border-indigo-600 rounded-xl flex flex-col justify-between shadow-sm transition group"
          >
            <div>
              <span className="text-[10px] font-black text-indigo-700 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                Role 1: Owner
              </span>
              <p className="font-extrabold text-xs text-slate-900 mt-1 group-hover:text-indigo-600">
                🏨 Manager PMS Desk
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Calendar, Split Billing, Freeze & UPI</p>
            </div>
            <span className="text-[11px] font-bold text-indigo-600 mt-2 flex items-center gap-1">
              Open PMS →
            </span>
          </Link>

          <Link
            href="/kitchen"
            className="p-3 bg-white border-2 border-amber-200 hover:border-amber-600 rounded-xl flex flex-col justify-between shadow-sm transition group"
          >
            <div>
              <span className="text-[10px] font-black text-amber-800 uppercase bg-amber-50 px-2 py-0.5 rounded">
                Role 2: Kitchen
              </span>
              <p className="font-extrabold text-xs text-slate-900 mt-1 group-hover:text-amber-700">
                🧑‍🍳 7 AM Market BOM
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Fish & Veg list + Cook tickets</p>
            </div>
            <span className="text-[11px] font-bold text-amber-700 mt-2 flex items-center gap-1">
              Open Kitchen →
            </span>
          </Link>

          <Link
            href="/onboarding"
            className="p-3 bg-white border-2 border-slate-200 hover:border-indigo-500 rounded-xl flex flex-col justify-between shadow-sm transition group"
          >
            <div>
              <span className="text-[10px] font-black text-slate-700 uppercase bg-slate-100 px-2 py-0.5 rounded">
                Setup Wizard
              </span>
              <p className="font-extrabold text-xs text-slate-900 mt-1 group-hover:text-indigo-600">
                ⚙️ List New Property
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Categories, plugins, tariffs & UPI</p>
            </div>
            <span className="text-[11px] font-bold text-indigo-600 mt-2 flex items-center gap-1">
              Start Wizard →
            </span>
          </Link>

          <Link
            href="/q/rm/sample-door"
            className="p-3 bg-white border-2 border-emerald-200 hover:border-emerald-600 rounded-xl flex flex-col justify-between shadow-sm transition group"
          >
            <div>
              <span className="text-[10px] font-black text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                Role 3: Staff
              </span>
              <p className="font-extrabold text-xs text-slate-900 mt-1 group-hover:text-emerald-700">
                🧹 Room Door QR
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Marathi voice + [🟢 खोली साफ झाली]</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 mt-2 flex items-center gap-1">
              Scan Door QR →
            </span>
          </Link>
        </div>
      </div>

      {/* Guest Zero-Install Web Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            Role 4: Guest (Zero-Install Web)
          </span>
          <span className="text-[11px] font-semibold text-emerald-700">Fast on 3G/4G</span>
        </div>
        <h2 className="text-base font-bold text-slate-900">Guest Experience Flow</h2>

        <div className="space-y-2">
          <Link
            href="/konkan-kinara"
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition group"
          >
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                1. Direct Booking Storefront
              </p>
              <p className="text-[11px] text-slate-500">Live AC/Non-AC switch, 360° panorama & 50% UPI advance</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </Link>

          <Link
            href="/checkin/sample-qr"
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition group"
          >
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                2. 30-Sec Reception Walk-In Self-Check-in
              </p>
              <p className="text-[11px] text-slate-500">Client-side canvas UIDAI Aadhaar redaction & food rules</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </Link>

          <Link
            href="/menu/sample-booking"
            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition group"
          >
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                3. Cut-Off Enforced Meal Pre-Order Menu
              </p>
              <p className="text-[11px] text-slate-500">24h/4h seafood cut-off rules with instant snacks fallback</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
        <button
          onClick={() => setActiveTab("faces")}
          className={`py-2 rounded-lg transition ${
            activeTab === "faces" ? "bg-white text-indigo-900 shadow-sm" : "text-slate-600"
          }`}
        >
          📱 Architecture & App
        </button>
        <button
          onClick={() => setActiveTab("free_hosting")}
          className={`py-2 rounded-lg transition ${
            activeTab === "free_hosting" ? "bg-white text-indigo-900 shadow-sm" : "text-slate-600"
          }`}
        >
          ☁️ 100% Free Cloud Hosting
        </button>
      </div>

      {/* TAB: FREE HOSTING BLUEPRINT */}
      {activeTab === "free_hosting" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-indigo-600" /> Zero-Cost Hosting for 1-5 Homestays
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow these exact steps to host the entire system permanently on free cloud tiers:
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">1. Cloud PostgreSQL (Supabase Mumbai)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">₹0 / month</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Create a free project on <strong>Supabase (Region: Mumbai ap-south-1)</strong>. You get 500MB PostgreSQL 16 + daily backups + S3-compatible encrypted bucket for guest IDs.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">2. Core Brain Backend (Render / Railway)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">₹0 / month</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Deploy <code className="text-indigo-600">backend/Dockerfile</code> with 1-click on Render.com Web Service (free tier) or Railway.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">3. Guest Web & Door QR (Vercel)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">₹0 / month</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Connect your GitHub repo <code className="text-indigo-600">mparadkar671-dev/staysuite-ai</code> to Vercel (Root Directory: <code className="text-indigo-600">guest_qr_web</code>). Deploys to Mumbai edge servers in &lt;50ms.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">4. Flutter POS App (Windows EXE + Android APK)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">₹0 / Free</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                The GitHub Action workflow <code className="text-indigo-600">deploy-all.yml</code> automatically compiles the Android APK and Windows installer on every push for direct download.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-center text-[11px] text-slate-400 pt-2">
        StaySuite AI • Offline-First Hospitality Operating System • Konkan Homestays Pilot
      </div>
    </div>
  );
}
