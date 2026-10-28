"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Utensils,
  ShoppingBag,
  Clock,
  CheckCircle,
  Printer,
  ArrowRight,
  Fish,
  Carrot,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import MyWorkspaceTab from "@/components/MyWorkspaceTab";

export default function KitchenAndMarketBOMPage() {
  const [mealSlot, setMealSlot] = useState<"LUNCH" | "DINNER">("LUNCH");
  const [showWorkspace, setShowWorkspace] = useState(false);

  const fishMarketItems = [
    { item: "Surmai (King Fish)", orderQty: 8, bomWeight: "0.25 kg", stock: "0.5 kg", needed: "1.5 kg" },
    { item: "White Pomfret (Medium)", orderQty: 5, bomWeight: "1 fish", stock: "1 fish", needed: "4 fish" },
    { item: "Kolambi (Prawns Medium)", orderQty: 6, bomWeight: "0.20 kg", stock: "0 kg", needed: "1.2 kg" },
  ];

  const vegMarketItems = [
    { item: "Fresh Grated Coconut (खोबरे)", needed: "5 nos" },
    { item: "Red Onions (कांदा)", needed: "3.5 kg" },
    { item: "Kokum (कोकम / सोलकढी)", needed: "500 gm" },
    { item: "Coriander & Green Chilies", needed: "1 bundle" },
  ];

  const [activeKots, setActiveKots] = useState([
    {
      kotNum: "KOT-081",
      room: "Room 101",
      slot: "LUNCH",
      items: ["2x Special Malvani Surmai Thali", "1x Solkadhi"],
      note: "Less spicy for child",
      elapsedMins: 12, // Green (< 15 mins)
      status: "COOKING",
    },
    {
      kotNum: "KOT-082",
      room: "Room 102",
      slot: "LUNCH",
      items: ["1x Tawa Fry Pomfret", "2x Surmai Thali", "4x Extra Vade"],
      note: "Extra crispy fish fry",
      elapsedMins: 22, // Amber (15-30 mins)
      status: "PREPPING",
    },
    {
      kotNum: "KOT-083",
      room: "Table T-1 (Garden)",
      slot: "LUNCH",
      items: ["1x Prawns Masala Sukka", "2x Bhakri"],
      note: "Priority rush order",
      elapsedMins: 34, // Red (> 30 mins)
      status: "DELAYED",
    },
  ]);

  const handleMarkKotReady = (kotNum: string) => {
    setActiveKots(activeKots.filter((k) => k.kotNum !== kotNum));
    alert(`Alert sent to Waiter Prasad Naik: ${kotNum} is ready for pickup! 🔔`);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-24 w-full">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Cook Vedika Gawde &bull; Kitchen Screen
              </span>
              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                Thermal KOTs Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              7 AM Market Calculator &amp; Live KOT Timers
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWorkspace(!showWorkspace)}
              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              {showWorkspace ? "Back to Stove KOTs" : "Cook Workspace (Upaad)"}
            </button>
            <Link
              href="/"
              className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              Exit to Desk
            </Link>
          </div>
        </div>

        {showWorkspace ? (
          <MyWorkspaceTab personName="Vedika Gawde" role="COOK" baseSalary={20000} />
        ) : (
          <>
            {/* Slot Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setMealSlot("LUNCH")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                  mealSlot === "LUNCH" ? "bg-amber-600 text-white" : "bg-white text-slate-700 border border-slate-200"
                }`}
              >
                ☀️ Lunch Procurement (Slot 1)
              </button>
              <button
                onClick={() => setMealSlot("DINNER")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                  mealSlot === "DINNER" ? "bg-amber-600 text-white" : "bg-white text-slate-700 border border-slate-200"
                }`}
              >
                🌙 Dinner Procurement (Slot 2)
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Column 1: Procurement */}
              <div className="space-y-5">
                {/* Fish Market Procurement */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fish className="w-5 h-5 text-blue-600" />
                      <h2 className="text-sm font-black text-slate-900">1. Malvan Fish Harbor Shopping List</h2>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded">
                      Deterministic Arithmetic
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Formula: <code className="text-indigo-600">Confirmed Orders &times; Recipe BOM Weight - Current Kitchen Stock</code>
                  </p>

                  <div className="space-y-2">
                    {fishMarketItems.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{f.item}</p>
                          <p className="text-[10px] text-slate-500">
                            {f.orderQty} orders &bull; Stock: {f.stock}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-blue-700 text-sm">{f.needed}</span>
                          <span className="text-[9px] text-slate-400 block font-semibold">Buy at Harbor</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => alert("Copied Fish Market WhatsApp Text for Harbor Buyer Abhijeet!")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Send Fish List to WhatsApp Buyer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Veg Market Procurement */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Carrot className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-sm font-black text-slate-900">2. Vegetable &amp; Kirana Market List</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {vegMarketItems.map((v, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="font-bold text-slate-900">{v.item}</p>
                        <p className="text-emerald-700 font-bold text-xs mt-0.5">{v.needed}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Live Color-Coded Kitchen Order Tickets (KOT) */}
              <div className="space-y-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-amber-600" />
                      <h2 className="text-sm font-black text-slate-900">Live KOT Timers (Color-Coded)</h2>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                      {activeKots.length} Active Tickets
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeKots.map((kot) => {
                      // Color coding: Green (<15m), Amber (15-30m), Red (>30m)
                      const isGreen = kot.elapsedMins < 15;
                      const isAmber = kot.elapsedMins >= 15 && kot.elapsedMins <= 30;
                      const isRed = kot.elapsedMins > 30;

                      return (
                        <div
                          key={kot.kotNum}
                          className={`border-2 rounded-2xl p-3.5 space-y-2.5 transition ${
                            isGreen
                              ? "bg-emerald-50/60 border-emerald-300"
                              : isAmber
                              ? "bg-amber-50/70 border-amber-300"
                              : "bg-rose-50/80 border-rose-300 animate-pulse"
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <span className="font-black text-slate-900 text-sm">{kot.kotNum}</span>
                              <span className="text-slate-600 ml-2 font-bold">&bull; {kot.room}</span>
                            </div>
                            <span
                              className={`font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                                isGreen
                                  ? "bg-emerald-600 text-white"
                                  : isAmber
                                  ? "bg-amber-600 text-white"
                                  : "bg-rose-600 text-white"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{kot.elapsedMins} mins ({isGreen ? "< 15m Fresh" : isAmber ? "15-30m Prep" : "> 30m Overdue"})</span>
                            </span>
                          </div>

                          <ul className="text-xs space-y-1 font-extrabold text-slate-900 list-disc list-inside">
                            {kot.items.map((it, i) => (
                              <li key={i}>{it}</li>
                            ))}
                          </ul>

                          {kot.note && (
                            <p className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-xl font-medium border border-slate-200">
                              ⚠️ Note: {kot.note}
                            </p>
                          )}

                          <button
                            onClick={() => handleMarkKotReady(kot.kotNum)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Mark Food Ready &bull; Alert Waiter Prasad</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
