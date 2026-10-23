"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Utensils, ShoppingBag, Clock, CheckCircle, Printer, ArrowRight, Fish, Carrot } from "lucide-react";

export default function KitchenAndMarketBOMPage() {
  const [mealSlot, setMealSlot] = useState<"LUNCH" | "DINNER">("LUNCH");

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

  const activeKots = [
    {
      kotNum: "KOT-081",
      room: "Room 101",
      slot: "LUNCH (1:30 PM)",
      items: ["2x Special Malvani Surmai Thali", "1x Solkadhi"],
      note: "Less spicy for child",
      status: "COOKING",
    },
    {
      kotNum: "KOT-082",
      room: "Room 102",
      slot: "LUNCH (1:45 PM)",
      items: ["1x Tawa Fry Pomfret", "2x Surmai Thali", "4x Extra Vade"],
      note: "Extra crispy fish fry",
      status: "PREPPING",
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 space-y-5 bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
            Vedika's Kitchen & Market BOM
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-1">7 AM Morning Market Calculator</h1>
        </div>
        <Link
          href="/"
          className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"
        >
          Exit to Hub
        </Link>
      </div>

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

      {/* Fish Market Procurement (Harbor Buyer WhatsApp List) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-black text-slate-900">1. Malvan Fish Harbor Shopping List</h2>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded">
            Auto-Calculated
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Formula: <code className="text-indigo-600">Confirmed Orders × Recipe Weight - Kitchen Stock</code>
        </p>

        <div className="space-y-2">
          {fishMarketItems.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            >
              <div>
                <p className="font-bold text-slate-900">{f.item}</p>
                <p className="text-[10px] text-slate-500">
                  {f.orderQty} orders • Stock in kitchen: {f.stock}
                </p>
              </div>
              <span className="font-black text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                BUY {f.needed}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => alert("WhatsApp text shopping list dispatched to buyer Abhijeet!")}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
        >
          <span>📲 Send 7 AM WhatsApp List to Buyer (Abhijeet)</span>
        </button>
      </div>

      {/* Veg Market & Kirana List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Carrot className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-black text-slate-900">2. Vegetable & Kirana Market List</h2>
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

      {/* Live Kitchen Order Tickets (KOT) for Vedika */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-amber-600" />
            <h2 className="text-sm font-black text-slate-900">Active Kitchen Tickets (KOT)</h2>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
            Vedika's Stove
          </span>
        </div>

        <div className="space-y-3">
          {activeKots.map((kot, idx) => (
            <div key={idx} className="border-2 border-amber-200 rounded-xl p-3 bg-amber-50/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-black text-slate-900">{kot.kotNum} • {kot.room}</span>
                <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                  {kot.slot}
                </span>
              </div>
              <ul className="text-xs space-y-0.5 font-semibold text-slate-800 list-disc list-inside">
                {kot.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
              {kot.note && (
                <p className="text-[11px] text-amber-900 bg-amber-100/70 p-1.5 rounded font-medium">
                  ⚠️ Note: {kot.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
