"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Utensils,
  Plus,
  Minus,
  Send,
  Bell,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  ArrowLeft,
  Coffee,
} from "lucide-react";
import MyWorkspaceTab from "@/components/MyWorkspaceTab";

const MENU_CATALOG = [
  { id: "m1", name: "Special Malvani Surmai Thali", price: 450, category: "SEAFOOD" },
  { id: "m2", name: "Tawa Fry Pomfret (Large)", price: 550, category: "SEAFOOD" },
  { id: "m3", name: "Prawns Masala (Kolambi Sukka)", price: 380, category: "SEAFOOD" },
  { id: "m4", name: "Chilled Solkadhi Glass", price: 60, category: "BEVERAGE" },
  { id: "m5", name: "Crispy Kanda Bhaji", price: 120, category: "SNACKS" },
  { id: "m6", name: "Kombdi Vade Plate (Chicken)", price: 350, category: "CHICKEN" },
];

const LOCATIONS = ["Room 101", "Room 102", "Room 103", "Table T-1 (Garden)", "Table T-2 (Sea View)", "Table T-3 (Veranda)"];

export default function WaiterTerminalPage() {
  const [selectedLocation, setSelectedLocation] = useState("Room 101");
  const [orderItems, setOrderItems] = useState<{ [id: string]: number }>({ m1: 2, m4: 2 });
  const [specialInstruction, setSpecialInstruction] = useState("Medium spicy, extra Solkadhi");
  const [kotSent, setKotSent] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);

  // Live alerts from Cook
  const [alerts, setAlerts] = useState([
    {
      id: "alt-1",
      kotNum: "KOT-081",
      location: "Room 101",
      time: "2 mins ago",
      msg: "KOT-081 (Surmai Thali) is READY! Pick up from Cook Vedika 🔔",
      read: false,
    },
  ]);

  const addItem = (id: string) => {
    setOrderItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeItem = (id: string) => {
    setOrderItems((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const totalBill = Object.entries(orderItems).reduce((sum, [id, qty]) => {
    const item = MENU_CATALOG.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const handleFireKot = () => {
    if (Object.keys(orderItems).length === 0) return;
    setKotSent(true);
    setTimeout(() => setKotSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-amber-400" />
                <h1 className="text-sm font-black tracking-tight">Waiter Mobile KOT Terminal</h1>
              </div>
              <p className="text-[10px] text-slate-400">Staff: Prasad Naik &bull; Konkan Kinara</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWorkspace(!showWorkspace)}
              className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition"
            >
              {showWorkspace ? "Back to Order Pad" : "My Workspace"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {showWorkspace ? (
          <MyWorkspaceTab personName="Prasad Naik" role="WAITER" baseSalary={15000} />
        ) : (
          <>
            {/* Live Kitchen Readiness Alerts */}
            {alerts.length > 0 && (
              <div className="bg-amber-500 text-slate-950 p-3 rounded-2xl shadow-sm flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-black">{alerts[0].msg}</span>
                </div>
                <button
                  onClick={() => setAlerts([])}
                  className="bg-slate-950 text-white text-[10px] font-extrabold px-3 py-1 rounded-lg"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Select Table or Room */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                1. Select Room or Dining Table
              </label>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`text-xs font-black px-3.5 py-1.5 rounded-xl border transition ${
                      selectedLocation === loc
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Dish Quick-Pad */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  2. Tap Dishes To Add
                </h3>
                <span className="text-[10px] font-bold text-indigo-600">Fresh catch synced with Cook Vedika</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {MENU_CATALOG.map((item) => {
                  const qty = orderItems[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className="border border-slate-200 rounded-xl p-3 flex items-center justify-between bg-slate-50/50"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                        <span className="text-xs font-black text-slate-700">₹{item.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {qty > 0 && (
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {qty > 0 && <span className="text-xs font-black text-indigo-700 w-4 text-center">{qty}</span>}
                        <button
                          onClick={() => addItem(item.id)}
                          className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center hover:bg-indigo-700 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Note & Firing Terminal */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                  3. Kitchen Spice / Special Instruction
                </label>
                <input
                  type="text"
                  value={specialInstruction}
                  onChange={(e) => setSpecialInstruction(e.target.value)}
                  placeholder="e.g. Less spicy for toddlers, extra crisp Surmai"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Estimated Folio</span>
                  <span className="text-xl font-black text-slate-900">₹{totalBill}</span>
                </div>

                <button
                  disabled={totalBill === 0}
                  onClick={handleFireKot}
                  className={`px-6 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition active:scale-95 ${
                    totalBill > 0
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{kotSent ? "KOT Fired to Kitchen! ✓" : `Fire KOT for ${selectedLocation}`}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
