"use client";

import React, { useState } from "react";
import { X, Utensils, Clock, Printer, Tag, CheckCircle2, Plus } from "lucide-react";

export interface ServiceItemPayload {
  name: string;
  category: "FOOD" | "BEVERAGE" | "ACTIVITY" | "SPA";
  price: number;
  preparation_time_mins: number;
  dietary: "VEG" | "NON_VEG" | "SEAFOOD" | "JAIN";
  kot_printer_route: string;
  description: string;
}

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveService: (service: ServiceItemPayload) => void;
  businessCategory?: string;
}

export default function AddServiceModal({
  isOpen,
  onClose,
  onSaveService,
  businessCategory = "RESTAURANT",
}: AddServiceModalProps) {
  const isActivity = businessCategory === "ACTIVITY";

  const [name, setName] = useState(isActivity ? "Scuba Diving & Island Snorkeling" : "Malvani Surmai Fish Thali");
  const [category, setCategory] = useState<"FOOD" | "BEVERAGE" | "ACTIVITY" | "SPA">(
    isActivity ? "ACTIVITY" : "FOOD"
  );
  const [price, setPrice] = useState(isActivity ? 1800 : 380);
  const [prepTime, setPrepTime] = useState(isActivity ? 120 : 25);
  const [dietary, setDietary] = useState<"VEG" | "NON_VEG" | "SEAFOOD" | "JAIN">(
    isActivity ? "VEG" : "SEAFOOD"
  );
  const [printerRoute, setPrinterRoute] = useState("KITCHEN_THERMAL_1");
  const [description, setDescription] = useState(
    isActivity
      ? "Guided scuba session with certified PADI diver and underwater video footage."
      : "Authentic coastal Malvani thali with Surmai fry, solkadhi, rice bhakri, and tisriya masala."
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) {
      alert("Please enter a valid service name and price.");
      return;
    }
    onSaveService({
      name,
      category,
      price,
      preparation_time_mins: prepTime,
      dietary,
      kot_printer_route: printerRoute,
      description,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white sm:rounded-3xl rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden sm:my-6 my-auto flex flex-col max-h-[96vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {isActivity ? "🏄" : "🍽️"}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight">
                {isActivity ? "Add Tourist Activity / Experience" : "Add Dining Menu Item / KOT Dish"}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">Zero-Rewrite Dynamic Category Service Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs font-bold text-slate-700 overflow-y-auto flex-1">
          <div>
            <label className="block mb-1 text-slate-800">{isActivity ? "Activity Name *" : "Item / Dish Name *"}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Tarkarli Banana Ride or Bombil Rava Fry"
              className="w-full p-3 rounded-xl border border-slate-300 font-bold text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-800">Tariff / Price (₹) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-slate-900 text-sm"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-800">
                {isActivity ? "Duration (Minutes)" : "Prep Time (Minutes)"}
              </label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
              />
            </div>
          </div>

          {!isActivity && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-slate-800">Dietary Classification</label>
                <select
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                >
                  <option value="SEAFOOD">🐟 Fresh Seafood</option>
                  <option value="NON_VEG">🍗 Non-Vegetarian</option>
                  <option value="VEG">🥦 Pure Vegetarian</option>
                  <option value="JAIN">🌿 Jain Friendly</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-slate-800">KOT Printer Route</label>
                <select
                  value={printerRoute}
                  onChange={(e) => setPrinterRoute(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                >
                  <option value="KITCHEN_THERMAL_1">Kitchen Thermal (Station 1)</option>
                  <option value="BAR_DISPENSE">Bar Dispense Printer</option>
                  <option value="BBQ_DECK">Outdoor BBQ Station</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block mb-1 text-slate-800">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-900 font-normal"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isActivity ? "Save Activity" : "Save Menu Item"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
