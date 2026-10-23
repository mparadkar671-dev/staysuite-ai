"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Home,
  Building2,
  Waves,
  Utensils,
  Wine,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  KeyRound,
  ShieldCheck,
  CreditCard,
  Sliders,
} from "lucide-react";

const CATEGORIES = [
  { id: "HOMESTAY", name: "Homestay / Villa", icon: Home, desc: "Coastal beach houses & farm stays with home-cooked seafood." },
  { id: "RESORT", name: "Beach Resort", icon: Waves, desc: "Multi-acre properties, swimming pools, multiple cottages." },
  { id: "HOTEL", name: "Boutique Hotel", icon: Building2, desc: "Urban/town center properties with floor rooms & banquet." },
  { id: "RESTAURANT", name: "Restaurant & Dining", icon: Utensils, desc: "Standalone dining, beach shacks, and live KOT kitchen." },
  { id: "BAR", name: "Bar & Pub", icon: Wine, desc: "Beverages, liquor permit room with split-billing POS." },
];

const PLANS = [
  {
    id: "TRIAL",
    name: "30-Day Free Trial",
    price: "₹0",
    period: "for 30 days",
    badge: "Risk Free",
    features: ["All Modules Enabled", "Unlimited Thermal KOTs", "50% Advance UPI QR", "Up to 15 Rooms/Tables"],
  },
  {
    id: "STANDARD",
    name: "Standard PMS",
    price: "₹2,499",
    period: "per month",
    badge: "Popular",
    features: ["Rooms & AC Switch", "Split Checkout Folio", "Housekeeping QR", "Staff Upaad & Payroll"],
  },
  {
    id: "PREMIUM",
    name: "Full Ecosystem Suite",
    price: "₹4,999",
    period: "per month",
    badge: "Complete Suite",
    features: ["Everything in Standard", "24h/4h Fresh Recipe BOM", "Deterministic Market Prep", "Live Waiter KOT App", "AI Business Copilot"],
  },
];

export default function ListYourPropertyPage() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("HOMESTAY");
  const [propertyName, setPropertyName] = useState("Konkan Breeze Coastal Homestay");
  const [ownerName, setOwnerName] = useState("Siddhesh Sawant");
  const [phone, setPhone] = useState("9820541122");
  const [email, setEmail] = useState("siddhesh@konkanbreeze.in");
  const [city, setCity] = useState("Malvan, Sindhudurg");
  const [selectedPlan, setSelectedPlan] = useState("TRIAL");
  const [generatedCode, setGeneratedCode] = useState("SS-HM-1092");
  const [copied, setCopied] = useState(false);

  const handleNextToCredentials = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const catCode = category === "HOMESTAY" ? "HM" : category.slice(0, 2).toUpperCase();
    setGeneratedCode(`SS-${catCode}-${randomNum}`);
    setStep(3);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
            SS
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            StaySuite <span className="text-indigo-600">Onboarding</span>
          </span>
        </Link>
        <span className="text-xs text-slate-500 font-medium">Step {step} of 3</span>
      </header>

      {/* Progress Line */}
      <div className="w-full bg-slate-200 h-1.5">
        <div
          className="bg-indigo-600 h-full transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 pt-6 flex-1 flex flex-col">
        {/* STEP 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-black text-slate-900">Select Your Business Category</h1>
              <p className="text-xs text-slate-500 mt-1">
                Zero-rewrite conditional capabilities configure rooms, KOTs, and fresh meal cut-offs automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const isSelected = category === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900">{c.name}</h3>
                        <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{c.desc}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Basic Property Form */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-900">Property & Host Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Property Name *</label>
                  <input
                    type="text"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Number (Login ID) *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Location / Beach Town *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <span>Continue to Subscription Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Subscription Plan Selection */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl font-black text-slate-900">Select Your SaaS Subscription Plan</h1>
              <p className="text-xs text-slate-500 mt-1">
                Pillar 1 entitlement matrix activates modules according to your tier.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`cursor-pointer p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-600/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                        {plan.badge}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 mt-2">{plan.name}</h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-900">{plan.price}</span>
                        <span className="text-[10px] text-slate-500">{plan.period}</span>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                        {plan.features.map((f, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60">
                      <span className={`text-[11px] font-bold ${isSelected ? "text-indigo-700" : "text-slate-500"}`}>
                        {isSelected ? "● Selected Plan" : "○ Tap to Select"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3.5 rounded-xl text-xs"
              >
                Back
              </button>
              <button
                onClick={handleNextToCredentials}
                className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <span>Activate Account & Get Credentials</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Business Code & Shared Credentials */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black text-slate-900">Your Property is Live!</h1>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use this unique human-readable Business Code to login on both the Booking Site and the StaySuite App.
              </p>
            </div>

            {/* Business Code Display Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                  Unique Business Identity (Pillar 2 & 3)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Business Code</span>
                  <span className="text-xl font-mono font-black tracking-wider text-emerald-400">
                    {generatedCode}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedCode)}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-white/5 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Owner Role</span>
                  <span className="font-bold text-white">{ownerName} (OWNER)</span>
                </div>
                <div className="bg-white/5 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Mobile ID</span>
                  <span className="font-bold text-white font-mono">{phone}</span>
                </div>
              </div>
            </div>

            {/* Launch Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href="/owner/dashboard"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-center"
              >
                <span>Open Owner PMS Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/login"
                className="bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg text-center"
              >
                <KeyRound className="w-4 h-4" />
                <span>Test 4-Step App Login</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
