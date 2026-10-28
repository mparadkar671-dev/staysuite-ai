"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Sliders,
  Home,
  Waves,
  Utensils,
  Wine,
} from "lucide-react";

export default function PropertyOnboardingPage() {
  const [step, setStep] = useState(1);
  const [propertyName, setPropertyName] = useState("Konkan Kinara Beach Homestay");
  const [category, setCategory] = useState<"HOMESTAY" | "RESORT" | "HOTEL" | "RESTAURANT_BAR">("HOMESTAY");
  const [upiVpa, setUpiVpa] = useState("resort@okhdfcbank");
  const [phone, setPhone] = useState("9820554433");
  const [ownerName, setOwnerName] = useState("Abhijeet Patil");

  // Plugin dynamic toggles
  const [enableFoodCutoffs, setEnableFoodCutoffs] = useState(true);
  const [enableAcNonAc, setEnableAcNonAc] = useState(true);
  const [enableExtraMattress, setEnableExtraMattress] = useState(true);
  const [enableBarLiquor, setEnableBarLiquor] = useState(false);

  return (
    <div className="flex-1 flex flex-col p-5 bg-slate-50 min-h-screen pb-20">
      {/* Header */}
      <div className="space-y-1">
        <Link href="/" className="text-[11px] text-indigo-600 font-bold hover:underline">
          ← Back to Master Hub
        </Link>
        <h1 className="text-xl font-black text-slate-900">List Your Homestay / Resort</h1>
        <p className="text-xs text-slate-500">
          Step {step} of 3: {step === 1 ? "Property & Category" : step === 2 ? "Plugin Rules & Tariffs" : "UPI & Final Launch"}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
        <div
          className="bg-indigo-600 h-full transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* STEP 1: Basic Details & Business Category Selection */}
      {step === 1 && (
        <div className="mt-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Property Name *</label>
              <input
                type="text"
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Sagar Kinara Homestay"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name *</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Phone *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Select Business Category (Activates tailored plugins):
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  id: "HOMESTAY",
                  name: "Coastal Homestay",
                  desc: "24h/4h food cutoffs, family rooms, direct UPI",
                  icon: Home,
                  color: "indigo",
                },
                {
                  id: "RESORT",
                  name: "Beach Resort",
                  desc: "Multi-room groups, 360° panoramas, cottages",
                  icon: Waves,
                  color: "emerald",
                },
                {
                  id: "HOTEL",
                  name: "Boutique Hotel",
                  desc: "Daily walk-ins, Police KYC Form-C, OTA sync",
                  icon: Building2,
                  color: "amber",
                },
                {
                  id: "RESTAURANT_BAR",
                  name: "Restaurant & Bar",
                  desc: "KOT table orders, recipe BOM & liquor stock",
                  icon: Wine,
                  color: "rose",
                },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.id as any)}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/60 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-indigo-600" : "text-slate-500"}`} />
                    <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{cat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
          >
            <span>Next: Configure Plugins & Rules</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Category Plugin Engine & Ground Rules */}
      {step === 2 && (
        <div className="mt-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">
              Active Plugins for {category}
            </h2>

            {/* Plugin 1: Meal Cutoff Gatekeeper */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="pr-2">
                <p className="text-xs font-bold text-slate-900">24-Hr / 4-Hr Meal Cut-Off Gatekeeper</p>
                <p className="text-[11px] text-slate-500">
                  Prevents last-minute fresh seafood waste. Directs late orders to instant snacks.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableFoodCutoffs}
                onChange={(e) => setEnableFoodCutoffs(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>

            {/* Plugin 2: Dynamic AC vs Non-AC Tariffs */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="pr-2">
                <p className="text-xs font-bold text-slate-900">AC vs. Non-AC Dynamic Tariff Switch</p>
                <p className="text-[11px] text-slate-500">
                  Lets guests choose non-AC for ₹1,000 discount. Dispatches staff alert to keep AC off.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableAcNonAc}
                onChange={(e) => setEnableAcNonAc(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>

            {/* Plugin 3: Extra Mattress & Driver Bed Waive */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="pr-2">
                <p className="text-xs font-bold text-slate-900">1-Click Extra Mattress / Driver Waive</p>
                <p className="text-[11px] text-slate-500">
                  Fixed ₹500 mattress fee with 1-click waive button on checkout folio.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableExtraMattress}
                onChange={(e) => setEnableExtraMattress(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3.5 rounded-xl text-xs"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <span>Next: Setup Payments & Launch</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: 0% MDR UPI Configuration & Launch */}
      {step === 3 && (
        <div className="mt-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-700">
              <CreditCard className="w-5 h-5" />
              <h2 className="text-xs font-bold text-slate-900">Direct 0% MDR UPI Payments</h2>
            </div>
            <p className="text-xs text-slate-600">
              Guest advances and bill settlements go directly into your bank account without any aggregator gateway fees.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Property UPI VPA / QR ID *</label>
              <input
                type="text"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                placeholder="e.g. homestay@okhdfcbank or 9820554433@upi"
                className="w-full text-xs p-3 border border-slate-300 rounded-lg outline-none font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Generates <code className="text-indigo-600">upi://pay?pa={upiVpa}...</code> QR codes automatically.
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 30-Day Full Feature Free Trial Active
              </p>
              <p className="text-[11px] text-emerald-800">
                You can add up to 20 rooms, generate infinite thermal KOTs, and print split bills during your trial.
              </p>
            </div>
          </div>

          <Link
            href="/owner/dashboard"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition text-center"
          >
            <span>Launch Property & Open Manager PMS</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
