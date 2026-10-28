"use client";

import React, { useState } from "react";
import {
  Wind,
  ShieldCheck,
  Zap,
  Bath,
  Wifi,
  Car,
  Tv,
  Compass,
  CheckCircle2,
  Sparkles,
  Flame,
  ArrowRight,
  Eye,
  Gift,
  X,
} from "lucide-react";

export interface RoomCategoryData {
  id: string;
  category_name: string;
  stay_template_type?: string;
  has_ac: boolean;
  base_tariff_ac: number;
  allow_guest_non_ac_toggle: boolean;
  base_tariff_non_ac: number;
  base_occupancy_adults: number;
  max_occupancy: number;
  extra_mattress_charge: number;
  driver_stay_free: boolean;
  amenities_config?: {
    bathroom_location?: string;
    toilet_type?: string;
    hot_water_type?: string;
    wifi_free?: boolean;
    power_backup_inverter?: boolean;
    parking_car?: boolean;
    parking_bus?: boolean;
    tv_smart?: boolean;
    private_balcony?: boolean;
    mini_fridge?: boolean;
    pet_friendly?: boolean;
    room_view?: string;
    free_value_perks?: string[];
  };
  media_config?: {
    main_bed_photo_url?: string;
    bathroom_photo_url?: string;
    balcony_photo_url?: string;
    panorama_360_url?: string;
    gallery_urls?: string[];
    instagram_reel_url?: string;
  };
  rooms_count?: number;
  available_units?: number;
  seasonal_offer?: {
    offer_title: string;
    badge_tag: string;
    discount_percent: number;
  } | null;
}

interface RoomConversionCardProps {
  category: RoomCategoryData;
  upiVpa?: string;
  propertyName?: string;
  onBookNow?: (categoryId: string, withAc: boolean, payableAdvance: number) => void;
}

export default function RoomConversionCard({
  category,
  upiVpa = "resort@okhdfcbank",
  propertyName = "Konkan Kinara Beach Resort",
  onBookNow,
}: RoomConversionCardProps) {
  const [withAc, setWithAc] = useState<boolean>(category.has_ac);
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [foodRulesAcknowledged, setFoodRulesAcknowledged] = useState(true);

  const priceAc = category.base_tariff_ac || 3200;
  const priceNonAc = category.base_tariff_non_ac || 2400;
  const savingAmount = priceAc - priceNonAc;

  // Active base price depending on AC toggle
  const currentBasePrice = withAc ? priceAc : priceNonAc;

  // Apply seasonal offer if present
  const discountPercent = category.seasonal_offer ? category.seasonal_offer.discount_percent : 0;
  const discountAmount = Math.round((currentBasePrice * discountPercent) / 100);
  const finalNightlyPrice = currentBasePrice - discountAmount;
  const advancePayable = Math.round(finalNightlyPrice * 0.5);

  const unitsLeft = category.available_units !== undefined ? category.available_units : 1;

  const defaultPhoto =
    category.media_config?.main_bed_photo_url ||
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80";

  const panoramaUrl =
    category.media_config?.panorama_360_url || "https://pannellum.org/images/alma.jpg";

  const perks = category.amenities_config?.free_value_perks || [
    "Free Driver Dormitory Stay",
    "Welcome Solkadhi Drink",
    "Traditional Morning Breakfast",
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Image & Badges Container */}
        <div className="relative h-56 sm:h-64 w-full overflow-hidden bg-slate-900">
          <img
            src={defaultPhoto}
            alt={category.category_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

          {/* Top Ribbons: Seasonal Offer & Scarcity */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            {category.seasonal_offer ? (
              <span className="bg-rose-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse pointer-events-auto">
                <Flame className="w-3.5 h-3.5 fill-current" />
                {category.seasonal_offer.badge_tag}
              </span>
            ) : (
              <span className="bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full pointer-events-auto">
                {category.stay_template_type || "Deluxe Stay"}
              </span>
            )}

            {unitsLeft <= 2 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 pointer-events-auto">
                <Sparkles className="w-3 h-3" />
                Only {unitsLeft} {unitsLeft === 1 ? "room" : "rooms"} left!
              </span>
            )}
          </div>

          {/* 360° Virtual Tour Launch Button */}
          <button
            onClick={() => setIs360ModalOpen(true)}
            className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-lg transition active:scale-95"
          >
            <Compass className="w-4 h-4 text-amber-400 animate-spin" />
            <span>View 360° Room Tour</span>
          </button>

          {/* Room Name on Photo */}
          <div className="absolute bottom-3 left-3 text-white max-w-[65%]">
            <h3 className="text-base sm:text-lg font-black leading-tight drop-shadow-md">
              {category.category_name}
            </h3>
            <p className="text-[11px] text-slate-300 drop-shadow">
              Up to {category.max_occupancy} Guests ({category.base_occupancy_adults} Adults base)
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Anxiety-Elimination Trust Badges */}
          <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {category.amenities_config?.bathroom_location === "ATTACHED_INSIDE" || !category.amenities_config
                  ? "Attached Western Bath"
                  : "Private Bathroom"}
              </span>
            </span>

            <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Inverter Power Backup</span>
            </span>

            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-blue-600" />
              <span>Free Parking</span>
            </span>

            {category.amenities_config?.room_view === "SEA_VIEW" && (
              <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                🌊 Sea Facing
              </span>
            )}
          </div>

          {/* Interactive AC / Non-AC Money-Saver Switch */}
          {category.has_ac && category.allow_guest_non_ac_toggle && (
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Choose Room Climate Mode:</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full">
                  Save ₹{savingAmount}/night!
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWithAc(true)}
                  className={`p-2 rounded-xl text-xs font-black transition flex flex-col items-center justify-center border ${
                    withAc
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-[11px] flex items-center gap-1">
                    ❄️ With AC Active
                  </span>
                  <span className="text-sm">₹{priceAc}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWithAc(false)}
                  className={`p-2 rounded-xl text-xs font-black transition flex flex-col items-center justify-center border ${
                    !withAc
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-[11px] flex items-center gap-1">
                    🌿 Non-AC Breeze
                  </span>
                  <span className="text-sm">₹{priceNonAc}</span>
                </button>
              </div>
            </div>
          )}

          {/* Value Stack Box: Included Perks */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1">
              <Gift className="w-3.5 h-3.5 text-emerald-700" />
              <span>Free Included Perks (₹1,200 Value):</span>
            </span>
            <ul className="grid grid-cols-1 gap-1 text-[11px] text-emerald-950 font-medium">
              {perks.map((p, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Card Footer: Live Tariff & Instant 50% Advance Booking CTA */}
      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-slate-900">₹{finalNightlyPrice}</span>
              <span className="text-xs text-slate-500 font-semibold">/ night</span>
              {discountPercent > 0 && (
                <span className="text-xs line-through text-slate-400 font-medium ml-1">
                  ₹{currentBasePrice}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              Includes {withAc ? "Air Conditioning" : "Natural Breeze"} + all taxes
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">50% Advance</span>
            <span className="text-sm font-black text-emerald-700">₹{advancePayable}</span>
          </div>
        </div>

        {/* High-Visibility Anxiety-Elimination Trust Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px] font-extrabold text-slate-700 bg-white p-2 rounded-xl border border-slate-200">
          <span className="flex items-center gap-1 text-emerald-800">
            <Bath className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Attached Western Bath</span>
          </span>
          <span className="flex items-center gap-1 text-amber-800">
            <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>24x7 Hot Geyser</span>
          </span>
          <span className="flex items-center gap-1 text-blue-800">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Inverter Backup</span>
          </span>
          <span className="flex items-center gap-1 text-slate-800">
            <Car className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>Free Parking</span>
          </span>
          <span className="flex items-center gap-1 text-indigo-800 col-span-2 sm:col-span-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Driver Stay Free</span>
          </span>
        </div>

        {/* Mandatory Homestay Fresh Food Acknowledgment */}
        <label className="flex items-start gap-2 bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={foodRulesAcknowledged}
            onChange={(e) => setFoodRulesAcknowledged(e.target.checked)}
            className="w-4 h-4 rounded border-amber-400 text-indigo-600 focus:ring-indigo-500 mt-0.5 shrink-0"
          />
          <span className="text-[11px] font-semibold text-amber-950 leading-tight">
            I acknowledge that this is an authentic homestay with fresh, locally cooked meals prepared on pre-order (50% UPI advance confirms room).
          </span>
        </label>

        {/* CTA Button */}
        <a
          href={
            foodRulesAcknowledged
              ? `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(
                  propertyName
                )}&am=${advancePayable}&cu=INR`
              : "#"
          }
          onClick={(e) => {
            if (!foodRulesAcknowledged) {
              e.preventDefault();
              alert("Please check the fresh meal pre-order acknowledgment box to proceed.");
              return;
            }
            onBookNow?.(category.id, withAc, advancePayable);
          }}
          className={`w-full font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 text-center ${
            foodRulesAcknowledged
              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30"
              : "bg-slate-300 text-slate-500 cursor-not-allowed"
          }`}
        >
          <span>Reserve Room (Pay 50% Advance ₹{advancePayable} via 0% MDR UPI)</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* 360° Virtual Tour Interactive Modal */}
      {is360ModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400 animate-spin" />
                <div>
                  <h4 className="text-sm font-black">{category.category_name} — 360° Virtual Tour</h4>
                  <p className="text-[10px] text-slate-400">Drag finger or mouse to pan 360 degrees</p>
                </div>
              </div>
              <button
                onClick={() => setIs360ModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative h-80 sm:h-96 w-full bg-black">
              <iframe
                title="Pannellum 360 View"
                src={panoramaUrl}
                className="w-full h-full border-0 pointer-events-auto"
              />
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-amber-300 font-bold border border-amber-400/30">
                🔄 Authentic Room 360° Panorama
              </div>
            </div>

            <div className="p-3 bg-slate-900 text-center">
              <button
                onClick={() => setIs360ModalOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-2 rounded-xl"
              >
                Close 360° Tour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
