"use client";

import React, { useState } from "react";
import { Sparkles, Wind, Eye, Compass, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function DirectStorefrontPage({
  params,
}: {
  params: Promise<{ propertySlug: string }>;
}) {
  const [propertySlug, setPropertySlug] = useState<string>("konkan-kinara");
  const [acRequired, setAcRequired] = useState(true);
  const [showPanorama, setShowPanorama] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("sea-view-deluxe");

  React.useEffect(() => {
    params.then((p) => setPropertySlug(p.propertySlug));
  }, [params]);

  const baseAcPrice = 3800;
  const baseNonAcPrice = 2800;
  const currentPrice = acRequired ? baseAcPrice : baseNonAcPrice;
  const advanceAmount = currentPrice * 0.5;

  return (
    <div className="flex-1 flex flex-col pb-24">
      {/* Hero Header */}
      <div className="relative h-56 bg-slate-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
          alt="Resort Cover"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1">
            <ShieldCheck className="w-3 h-3" /> 0% Commission Direct Booking
          </span>
          <h1 className="text-xl font-bold capitalize">Konkan Kinara Beach Resort</h1>
          <p className="text-xs text-slate-300">Tarkarli Beach Road, Malvan, Maharashtra</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Dynamic Tariff Toggle: AC vs Non-AC */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Wind className={`w-5 h-5 ${acRequired ? "text-indigo-600" : "text-slate-400"}`} />
            <div>
              <p className="text-xs font-semibold text-slate-900">
                {acRequired ? "❄️ Air Conditioning Included" : "🌿 Natural Sea Breeze (Non-AC)"}
              </p>
              <p className="text-[11px] text-slate-500">
                {acRequired ? "Save ₹1,000/night if AC not needed" : "Economical Konkan homestay tariff"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAcRequired(!acRequired)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              acRequired ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
            }`}
          >
            {acRequired ? "Switch to Non-AC" : "Switch to AC"}
          </button>
        </div>

        {/* Plan-Gated 360° Panorama Viewer */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 text-white">
          <div className="p-3 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Compass className="w-4 h-4 text-amber-400 animate-spin" />
              <span>360° Interactive Virtual Room Tour</span>
            </div>
            <button
              onClick={() => setShowPanorama(!showPanorama)}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded-md font-medium transition"
            >
              {showPanorama ? "Close 360°" : "Launch 360° View"}
            </button>
          </div>
          {showPanorama ? (
            <div className="relative h-60 bg-black flex items-center justify-center">
              <iframe
                title="Pannellum 360 Viewer"
                src="https://pannellum.org/images/alma.jpg"
                className="w-full h-full border-0 pointer-events-auto"
              />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px]">
                Drag to rotate 360°
              </div>
            </div>
          ) : (
            <div
              onClick={() => setShowPanorama(true)}
              className="h-32 bg-slate-800/80 hover:bg-slate-800 cursor-pointer flex flex-col items-center justify-center p-4 text-center transition"
            >
              <Eye className="w-7 h-7 text-amber-400 mb-1" />
              <p className="text-xs font-semibold">Click to inspect Sea-Facing room in 360°</p>
              <p className="text-[10px] text-slate-400">Verified authentic room panorama</p>
            </div>
          )}
        </div>

        {/* Instagram Reel Embed Showcase */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <h2 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-600" /> Guest Vibes & Local Seafood Thalis
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative rounded-lg overflow-hidden bg-slate-200 aspect-[9/14]">
              <img
                src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80"
                alt="Malvani Thali"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                Surmai Fry Reel
              </span>
            </div>
            <div className="relative rounded-lg overflow-hidden bg-slate-200 aspect-[9/14]">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80"
                alt="Beach Sunset"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                Sunset Beach Walk
              </span>
            </div>
          </div>
        </div>

        {/* Room Highlights & Booking Card */}
        <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex justify-between items-baseline">
            <h3 className="font-bold text-slate-900 text-sm">Deluxe Sea-Facing Cottage</h3>
            <div className="text-right">
              <span className="text-lg font-black text-indigo-600">₹{currentPrice}</span>
              <span className="text-[10px] text-slate-500"> / night</span>
            </div>
          </div>
          <ul className="text-xs text-slate-600 space-y-1">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Direct balcony view of the Arabian Sea
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Complimentary home-style Malvani breakfast
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> High-speed Wi-Fi & 24/7 solar hot water
            </li>
          </ul>
        </div>
      </div>

      {/* Fixed Sticky Footer for Instant 50% UPI Advance Booking */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 p-3 shadow-2xl flex items-center justify-between z-50">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">50% Advance Required</p>
          <p className="text-base font-extrabold text-slate-900">
            ₹{advanceAmount.toFixed(0)} <span className="text-[10px] font-normal text-slate-500">(0% MDR via UPI)</span>
          </p>
        </div>
        <a
          href={`upi://pay?pa=resort@okhdfcbank&pn=Konkan%20Kinara&am=${advanceAmount}&cu=INR`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
        >
          Pay 50% via UPI & Confirm
        </a>
      </div>
    </div>
  );
}
