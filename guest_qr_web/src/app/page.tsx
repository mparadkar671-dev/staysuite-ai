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
} from "lucide-react";

export default function MasterDemoHub() {
  const [activeTab, setActiveTab] = useState<"faces" | "free_hosting" | "features">("faces");

  return (
    <div className="flex-1 flex flex-col p-4 space-y-6 pb-20 bg-slate-50 min-h-screen">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> StaySuite AI v4.0 — One Brain, Three Faces
          </span>
          <h1 className="text-xl font-black tracking-tight">Interactive Homestay & Resort OS</h1>
          <p className="text-xs text-indigo-200/90 leading-relaxed">
            Offline-first platform engineered for coastal homestays and resorts. Explore all live interfaces, test ground-level features, and deploy on 100% free cloud tiers.
          </p>
        </div>
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
        <button
          onClick={() => setActiveTab("faces")}
          className={`py-2 rounded-lg transition ${
            activeTab === "faces" ? "bg-white text-indigo-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          🎭 The 3 Faces
        </button>
        <button
          onClick={() => setActiveTab("features")}
          className={`py-2 rounded-lg transition ${
            activeTab === "features" ? "bg-white text-indigo-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          ⚡ Core Modules
        </button>
        <button
          onClick={() => setActiveTab("free_hosting")}
          className={`py-2 rounded-lg transition ${
            activeTab === "free_hosting" ? "bg-white text-indigo-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          ☁️ Free Hosting
        </button>
      </div>

      {/* TAB 1: THE 3 FACES */}
      {activeTab === "faces" && (
        <div className="space-y-4">
          {/* Face 1: Owner POS & PMS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Face 1 — Flutter Native
              </span>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <Laptop className="w-3.5 h-3.5" /> Windows/Mac + <Smartphone className="w-3.5 h-3.5" /> Android/iOS
              </div>
            </div>
            <h2 className="text-base font-bold text-slate-900">Owner & Manager POS/PMS App</h2>
            <p className="text-xs text-slate-600">
              Native compiled app in <code className="text-indigo-600 font-semibold">pos_app/</code> with local Drift SQLite. Runs 100% offline during coastal power/internet cuts, writes in &lt;5ms, and supports ESC/POS thermal printing.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs">
              <p className="font-semibold text-slate-800">What is inside Face 1:</p>
              <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px]">
                <li><strong>Room Calendar & 1-Click Freeze:</strong> Instantly blocks direct storefront and pushes 0 availability to OTAs.</li>
                <li><strong>AC/Non-AC Dynamic Pricing:</strong> Toggles AC in 1-click and recalculates bills instantly.</li>
                <li><strong>Vyapar++ Partial Checkout:</strong> Checkout 1 room from a group while keeping sibling rooms active.</li>
                <li><strong>Thermal Printing:</strong> Sub-second Bluetooth (mobile) and USB (desktop) KOTs and Bills with Dynamic UPI QR.</li>
              </ul>
            </div>
          </div>

          {/* Face 2: Guest Storefront & Walk-In QR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Face 2 — Zero-Install Web
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">Next.js 15 (Live Now)</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Guest Mobile Web Experience</h2>
            <p className="text-xs text-slate-600">
              Instant mobile links on coastal 3G/4G networks without installing any mobile app.
            </p>

            <div className="space-y-2">
              <Link
                href="/konkan-kinara"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">
                    1. Direct Booking Storefront
                  </p>
                  <p className="text-[11px] text-slate-500">Live AC/Non-AC toggle, 360° panorama & 50% UPI advance</p>
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
                  <p className="text-[11px] text-slate-500">Client-side canvas UIDAI Aadhaar redaction & food policy agreement</p>
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

          {/* Face 3: Staff Door QR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                Face 3 — Door QR Interface
              </span>
              <span className="text-[11px] font-semibold text-amber-700">Audio Voice Supported</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">Behind-the-Door QR Housekeeping</h2>
            <p className="text-xs text-slate-600">
              Laminated sticker behind room doors. Staff scan and tap one giant button to flip owner dashboard from Red to Green in 1 second.
            </p>

            <Link
              href="/q/rm/sample-door"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition group"
            >
              <div>
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                  Open Room 101 Door QR Page
                </p>
                <p className="text-[11px] text-slate-500">Marathi / Hindi Web Speech voice + [🟢 खोली साफ झाली]</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
            </Link>
          </div>
        </div>
      )}

      {/* TAB 2: CORE MODULES */}
      {activeTab === "features" && (
        <div className="space-y-3 text-xs">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" /> 1. Category Plugin System
            </h3>
            <p className="text-slate-600">
              Adapts for Homestay, Resort, Hotel, Restaurant, and Bar without code conflicts via JSON schemas in <code className="text-indigo-600">backend/app/plugins/</code>.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-amber-600" /> 2. Deterministic Recipe BOM Calculator
            </h3>
            <p className="text-slate-600">
              Exact SQL aggregation (<code className="text-indigo-600">Confirmed Orders × BOM Weight - Kitchen Stock</code>) generates a 7 AM morning WhatsApp shopping list for Abhijeet (Fish & Veg Markets).
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" /> 3. Customer Khata (Credit Ledger)
            </h3>
            <p className="text-slate-600">
              Moves unpaid balances of trusted guests to a credit ledger with automated WhatsApp UPI payment reminders.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-600" /> 4. Police KYC & Form-C Compliance
            </h3>
            <p className="text-slate-600">
              Strictly stores <code className="text-indigo-600">[Aadhaar Redacted]</code> for staff roles. 1-click official Police Register PDF export for owners.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" /> 5. Gemini AI Multilingual Copilot
            </h3>
            <p className="text-slate-600">
              Command bar parses natural Marathi, Hindi, and English voice/text commands (&quot;Freeze rooms for Dec 24&quot;) into structured 1-click executable action cards.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: 100% FREE HOSTING BLUEPRINT */}
      {activeTab === "free_hosting" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-indigo-600" /> Zero-Cost Hosting for 1-5 Homestays
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              You can host the entire system permanently on 100% free cloud tiers:
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Supabase */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">1. Cloud PostgreSQL (Supabase)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">₹0 / month</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Create a free project on <strong>Supabase Mumbai (ap-south-1)</strong>. You get 500MB PostgreSQL 16 + daily backups + S3-compatible bucket for guest IDs.
              </p>
            </div>

            {/* Render / Railway */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">2. Core Brain Backend (Render / Railway)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">₹0 / month</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Deploy <code className="text-indigo-600">backend/Dockerfile</code> with 1-click on Render.com Web Service (free tier) or Railway starter tier.
              </p>
            </div>

            {/* Vercel */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">3. Guest Web & Door QR (Vercel)</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">₹0 / month</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Connect your GitHub repo <code className="text-indigo-600">mparadkar671-dev/staysuite-ai</code> to Vercel (Root Directory: <code className="text-indigo-600">guest_qr_web</code>). Deploys to Mumbai edge servers in &lt;50ms.
              </p>
            </div>

            {/* Flutter POS App */}
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
