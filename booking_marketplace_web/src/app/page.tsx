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
  Search,
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  Star,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Compass,
  Zap,
  Bath,
  Car,
  Wind,
  Flame,
  Check,
} from "lucide-react";
import RoomConversionCard, { RoomCategoryData } from "@/components/RoomConversionCard";

const CATEGORIES = [
  { id: "HOMESTAY", name: "Homestays", icon: Home, badge: "Primary Konkan Deep-Dive", active: true },
  { id: "RESORT", name: "Beach Resorts", icon: Waves, badge: "Oceanfront Luxury" },
  { id: "HOTEL", name: "Boutique Hotels", icon: Building2, badge: "Business & Suites" },
  { id: "RESTAURANT", name: "Coastal Dining", icon: Utensils, badge: "Fresh Seafood & KOT" },
  { id: "BAR", name: "Bars & Pubs", icon: Wine, badge: "Nightlife & Microbrews" },
  { id: "OTHER_SERVICES", name: "Agro & Experiences", icon: Sparkles, badge: "Water Sports & Tours" },
];

const SUB_TAGS = [
  "All Stays",
  "Konkan Beach Stays",
  "Heritage Homestays",
  "Agro-Tourism & Orchards",
  "Luxury Sea-Facing Villas",
  "Fresh Seafood Thali Included",
];

const SAMPLE_ROOM_CATEGORIES: RoomCategoryData[] = [
  {
    id: "cat-1",
    category_name: "Sea-Facing Deluxe AC Cottage",
    stay_template_type: "HOMESTAY_DELUXE",
    has_ac: true,
    base_tariff_ac: 3500,
    allow_guest_non_ac_toggle: true,
    base_tariff_non_ac: 2800, // ₹700 saving
    base_occupancy_adults: 2,
    max_occupancy: 4,
    extra_mattress_charge: 500,
    driver_stay_free: true,
    available_units: 2,
    amenities_config: {
      bathroom_location: "ATTACHED_INSIDE",
      toilet_type: "WESTERN",
      hot_water_type: "GEYSER_24X7",
      wifi_free: true,
      power_backup_inverter: true,
      parking_car: true,
      parking_bus: true,
      room_view: "SEA_VIEW",
      free_value_perks: [
        "Free Driver Dormitory Stay",
        "Traditional Konkan Solkadhi Welcome Drink",
        "Morning Poha/Upma Breakfast Included",
      ],
    },
    media_config: {
      main_bed_photo_url:
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
      panorama_360_url: "https://pannellum.org/images/alma.jpg",
    },
    seasonal_offer: {
      offer_title: "Konkan Coastal Monsoon Saver",
      badge_tag: "Monsoon Saver 15% OFF",
      discount_percent: 15,
    },
  },
  {
    id: "cat-2",
    category_name: "Authentic Chira-Stone Garden Room",
    stay_template_type: "HERITAGE_HOMESTAY",
    has_ac: true,
    base_tariff_ac: 2900,
    allow_guest_non_ac_toggle: true,
    base_tariff_non_ac: 2200, // ₹700 saving
    base_occupancy_adults: 2,
    max_occupancy: 3,
    extra_mattress_charge: 400,
    driver_stay_free: true,
    available_units: 1,
    amenities_config: {
      bathroom_location: "ATTACHED_INSIDE",
      toilet_type: "WESTERN",
      hot_water_type: "GEYSER_24X7",
      wifi_free: true,
      power_backup_inverter: true,
      parking_car: true,
      parking_bus: false,
      room_view: "GARDEN_VIEW",
      free_value_perks: [
        "Fresh Surmai/Pomfret Thali Priority Booking",
        "Free High-Speed Wi-Fi for Work-from-Konkan",
        "Private Courtyard Sitting",
      ],
    },
    media_config: {
      main_bed_photo_url:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      panorama_360_url: "https://pannellum.org/images/alma.jpg",
    },
    seasonal_offer: null,
  },
];

export default function MarketplaceHomePage() {
  const [selectedCategory, setSelectedCategory] = useState("HOMESTAY");
  const [selectedSubTag, setSelectedSubTag] = useState("All Stays");
  const [locationSearch, setLocationSearch] = useState("Tarkarli Beach, Malvan");
  const [guestCount, setGuestCount] = useState("2 Adults");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-base shadow-md shadow-indigo-500/20">
              SS
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-slate-900 block leading-none">
                StaySuite <span className="text-indigo-600">Marketplace</span>
              </span>
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                Direct Stays &bull; 0% Commission
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <Link href="/explore" className="hover:text-indigo-600 transition flex items-center gap-1">
              <span>Explore All Stays</span>
            </Link>
            <Link href="/customer/dashboard" className="hover:text-indigo-600 transition flex items-center gap-1">
              <span>My Trips &amp; Receipts</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </Link>
            <Link
              href="/host/portal"
              className="hover:text-indigo-600 transition bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1"
            >
              <span>Host Profile &amp; Room Studio</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/list-your-property"
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <span>List Your Property</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Psychology-Driven Direct Booking Search */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white pt-12 pb-16 px-4 sm:px-8 overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-6 relative z-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold px-3.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Konkan &amp; Maharashtra Direct Homestay Marketplace</span>
            <span className="bg-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.2 rounded-full font-bold">
              0% Guest MDR
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Book Authentic Homestays Direct. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300">
                Fresh Cooked Food &bull; 50% UPI Advance
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Skip OTA middleman markups. Direct contact with verified local hosts, guaranteed room AC/Non-AC price choice, and fresh morning-catch seafood meals.
            </p>
          </div>

          {/* Interactive Search Bar */}
          <div className="bg-white text-slate-900 rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
            <div className="p-2 sm:p-2.5 border-b sm:border-b-0 sm:border-r border-slate-200">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                Destination / Beach
              </label>
              <div className="flex items-center gap-2 mt-0.5">
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 focus:outline-none"
                  placeholder="e.g. Malvan, Tarkarli, Alibaug"
                />
              </div>
            </div>

            <div className="p-2 sm:p-2.5 border-b sm:border-b-0 sm:border-r border-slate-200">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                Check-in &bull; Check-out
              </label>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">This Weekend (2 Nights)</span>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 border-b sm:border-b-0 sm:border-r border-slate-200">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                Guests &amp; Rooms
              </label>
              <div className="flex items-center gap-2 mt-0.5">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <input
                  type="text"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <Link
                href="/explore"
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs sm:text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition active:scale-95 text-center"
              >
                <Search className="w-4 h-4" />
                <span>Search Stays</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8 flex-1">
        {/* Core Multi-Category Switcher */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              1. Explore by Core Business Category
            </h2>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Homestay Architecture #1 Primary Deep-Dive
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-5 h-5 ${isSelected ? "text-amber-300" : "text-indigo-600"}`} />
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-black">{cat.name}</h3>
                    <p className={`text-[10px] leading-tight ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                      {cat.badge}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-tag quick filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-500 mr-1">Konkan Focus:</span>
          {SUB_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedSubTag(tag)}
              className={`text-xs font-bold px-3 py-1 rounded-full transition ${
                selectedSubTag === tag
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Behavioral Psychology Feature Callout */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              🌿 Price Anchoring &amp; Control Bias Active
            </span>
            <h3 className="text-base font-black">
              Guests Save ₹700/Night with 1-Tap Non-AC Switch
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Enjoy coastal sea breezes and save money. All rooms feature verified attached western bathrooms, 24x7 geyser hot water, inverter battery backup, and 50% UPI advance confirmation.
            </p>
          </div>
          <Link
            href="/explore"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition shrink-0 shadow-md"
          >
            Explore Konkan Homestays &rarr;
          </Link>
        </div>

        {/* Featured Stays & Room Conversion Cards with 50% Advance & AC Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Featured Konkan Beach Homestays
              </h2>
              <p className="text-xs text-slate-500">
                Direct booking with Abhijeet &amp; Vedika Gawde &bull; Konkan Kinara Beach Homestay (SS-HM-1001)
              </p>
            </div>
            <Link
              href="/konkan-kinara"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View Full Property Storefront</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SAMPLE_ROOM_CATEGORIES.map((room) => (
              <RoomConversionCard
                key={room.id}
                category={room}
                propertyName="Konkan Kinara Beach Homestay"
                upiVpa="homestay@okhdfcbank"
              />
            ))}
          </div>
        </div>

        {/* 24-Hour & 4-Hour Fresh Catch Food Rules Explainer */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              🐟
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-950">
                Authentic Konkan Fresh Food Preparation Rules
              </h3>
              <p className="text-xs text-amber-800">
                Why our homestays enforce 24-Hour Pre-Arrival &amp; 4-Hour In-Stay food order cut-offs:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-amber-950">
            <div className="bg-white/80 p-3 rounded-2xl border border-amber-200/60 space-y-1">
              <span className="font-extrabold text-amber-900 block">1. Morning Harbor Fish Catch</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                The host purchases fresh Surmai and Pomfret directly from the local fishing harbor based strictly on confirmed pre-orders.
              </p>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-amber-200/60 space-y-1">
              <span className="font-extrabold text-amber-900 block">2. Zero Refrigerated Food</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                No frozen fish or leftover curries. Meals are ground and cooked fresh using local Malvani coconut masala.
              </p>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl border border-amber-200/60 space-y-1">
              <span className="font-extrabold text-amber-900 block">3. 24/7 Instant Snacks Open</span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                If you arrive late without pre-ordering, instant hot snacks (Kanda Bhaji, Maggi, Tea) are always available anytime.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 px-4 sm:px-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              SS
            </div>
            <span className="font-extrabold text-white">StaySuite Direct Marketplace</span>
            <span className="text-slate-500">&bull; Port 3003 Public Guest Gateway</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <Link href="/explore" className="hover:text-white transition">
              Explore Stays
            </Link>
            <Link href="/customer/dashboard" className="hover:text-white transition">
              Guest Bookings
            </Link>
            <Link href="/host/portal" className="hover:text-white transition">
              Host Studio
            </Link>
            <Link href="/list-your-property" className="hover:text-white transition text-indigo-400 font-bold">
              List Your Homestay
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
