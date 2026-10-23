"use client";

import React, { useState } from "react";
import { Clock, AlertTriangle, CheckCircle, Utensils, Coffee, HelpCircle } from "lucide-react";

export default function GuestMenuPreOrderPage({
  params,
}: {
  params: Promise<{ bookingToken: string }>;
}) {
  // Toggle between in-window vs late after cutoff for demonstration
  const [isPastCutoff, setIsPastCutoff] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "INSTANT">("ALL");
  const [overrideRequested, setOverrideRequested] = useState(false);

  const menuItems = [
    {
      id: "surmai-thali",
      name: "Special Malvani Surmai Thali",
      nameLocal: "सुरमई थाळी",
      price: 450,
      isFreshPrep: true,
      category: "THALI",
      desc: "Fresh morning catch, Surmai fry, Tisrya masala, Solkadhi & 2 Vade",
    },
    {
      id: "pomfret-fry",
      name: "Tawa Fry Pomfret (Large)",
      nameLocal: "पापलेट फ्राय",
      price: 550,
      isFreshPrep: true,
      category: "SEAFOOD",
      desc: "Marinated in authentic Malvani coastal spices and semolina crust",
    },
    {
      id: "kanda-bhaji",
      name: "Crispy Kanda Bhaji & Chai",
      nameLocal: "गरमागरम कांदा भजी आणि चहा",
      price: 120,
      isFreshPrep: false,
      isInstantSnack: true,
      category: "SNACKS",
      desc: "Freshly fried onion pakoras served with Konkan green chutney (Ready in 10 mins)",
    },
    {
      id: "maggi",
      name: "Masala Vegetable Maggi",
      nameLocal: "मसाला मॅगी",
      price: 80,
      isFreshPrep: false,
      isInstantSnack: true,
      category: "SNACKS",
      desc: "Instant snack available 24/7",
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
            Vedika's Kitchen
          </span>
          <button
            onClick={() => setIsPastCutoff(!isPastCutoff)}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium"
          >
            Simulate: {isPastCutoff ? "Past 4h Cutoff" : "Within 4h Window"}
          </button>
        </div>
        <h1 className="text-lg font-bold text-slate-900 mt-1">Homestay Meal Pre-Order</h1>
        <p className="text-xs text-slate-500">Authentic Malvani dining freshly prepared to your order.</p>
      </div>

      {/* Cutoff Warning Banner if past cutoff */}
      {isPastCutoff && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-rose-950">
                Fresh Kitchen Prep is Closed for this Slot (4-Hr Cut-Off Enforced)
              </h2>
              <p className="text-[11px] text-rose-900 mt-0.5">
                Our morning fish market procurement and fresh cook preparation for this meal slot have closed.
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setActiveTab("INSTANT")}
              className="flex-1 bg-rose-600 text-white font-bold text-xs py-2 rounded-lg hover:bg-rose-700 transition"
            >
              View Instant Snacks 🍟
            </button>
            <button
              onClick={() => setOverrideRequested(true)}
              className="flex-1 bg-white border border-rose-300 text-rose-700 font-bold text-xs py-2 rounded-lg hover:bg-rose-50 transition"
            >
              {overrideRequested ? "Override Sent to Manager ✓" : "Request Manager Override"}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
            activeTab === "ALL" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Full Menu
        </button>
        <button
          onClick={() => setActiveTab("INSTANT")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
            activeTab === "INSTANT" ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Instant Snacks (Always Open) ☕
        </button>
      </div>

      {/* Menu Cards */}
      <div className="space-y-3">
        {menuItems
          .filter((item) => (activeTab === "INSTANT" ? item.isInstantSnack : true))
          .map((item) => {
            const isBlockedByCutoff = isPastCutoff && item.isFreshPrep;
            return (
              <div
                key={item.id}
                className={`border rounded-xl p-3.5 flex flex-col justify-between transition ${
                  isBlockedByCutoff ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                    <p className="text-xs text-indigo-700 font-medium">{item.nameLocal}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                  </div>
                  <span className="text-sm font-black text-slate-900 shrink-0">₹{item.price}</span>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      item.isFreshPrep
                        ? "bg-blue-50 text-blue-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {item.isFreshPrep ? "🐟 Fresh Daily Market Prep" : "⚡ Instant Kitchen Snack"}
                  </span>
                  <button
                    disabled={isBlockedByCutoff}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                      isBlockedByCutoff
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {isBlockedByCutoff ? "Slot Closed" : "+ Add to Pre-Order"}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
