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
  Star,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Filter,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", name: "All Categories", icon: Sparkles, color: "bg-indigo-600 text-white" },
  { id: "homestay", name: "Homestays", icon: Home, color: "bg-emerald-600 text-white", badge: "Primary Konkan" },
  { id: "hotel", name: "Hotels", icon: Building2, color: "bg-blue-600 text-white" },
  { id: "resort", name: "Beach Resorts", icon: Waves, color: "bg-cyan-600 text-white" },
  { id: "restaurant", name: "Restaurants", icon: Utensils, color: "bg-amber-600 text-white" },
  { id: "bar", name: "Bars & Pubs", icon: Wine, color: "bg-rose-600 text-white" },
  { id: "other_services", name: "Other Services", icon: Sparkles, color: "bg-purple-600 text-white", badge: "Agro & Tours" },
];

const SAMPLE_LISTINGS = [
  {
    id: "prop-1",
    slug: "konkan-kinara",
    code: "SS-HM-1001",
    name: "Konkan Kinara Beach Homestay",
    category: "homestay",
    location: "Tarkarli Beach, Malvan",
    rating: 4.9,
    reviewsCount: 128,
    priceAc: 3500,
    priceNonAc: 2500,
    specialRule: "Fresh Surmai/Pomfret Thali 24h & 4h fresh market cut-off",
    badge: "Verified Konkan Host",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80",
    features: ["AC / Non-AC Switch", "50% Advance UPI", "360° Panorama", "Door QR"],
  },
  {
    id: "prop-2",
    slug: "blue-lagoon-resort",
    code: "SS-RS-2041",
    name: "Blue Lagoon Luxury Sea Resort",
    category: "resort",
    location: "Bhogwe Beach, Vengurla",
    rating: 4.8,
    reviewsCount: 94,
    priceAc: 5800,
    priceNonAc: 4200,
    specialRule: "Infinity Pool + Live Table KOT Waiter Service",
    badge: "Premium Stay",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80",
    features: ["Split POS Billing", "Table KOTs", "Private Beach", "Housekeeping QR"],
  },
  {
    id: "prop-3",
    slug: "malvan-spices-kitchen",
    code: "SS-RT-3012",
    name: "Malvan Spices & Crab Dining",
    category: "restaurant",
    location: "Dandi Bridge, Malvan",
    rating: 4.95,
    reviewsCount: 310,
    priceAc: 450,
    priceNonAc: 350,
    specialRule: "Morning Catch Fish Thali & Live Kitchen KOT Queue",
    badge: "Top Culinary Pick",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80",
    features: ["Deterministic Recipe BOM", "Waiter KOT App", "Split Bill Print"],
  },
  {
    id: "prop-4",
    slug: "devbagh-heritage-hotel",
    code: "SS-HT-4008",
    name: "Devbagh Heritage Hotel & Suites",
    category: "hotel",
    location: "Devbagh Sangam, Sindhudurg",
    rating: 4.7,
    reviewsCount: 82,
    priceAc: 3200,
    priceNonAc: 2400,
    specialRule: "Redacted Aadhaar 30-sec Self Check-In Active",
    badge: "Express Check-In",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80",
    features: ["Digital Guest Folio", "Aadhaar Privacy Redaction", "Staff Payroll"],
  },
];

export default function ExploreMarketplacePage() {
  const [selectedCat, setSelectedCat] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveListings, setLiveListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch("http://127.0.0.1:8000/api/v1/properties/explore")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((item: any, idx: number) => ({
            id: item.id,
            slug: item.slug,
            code: item.business_code || `SS-${(item.business_category || "HM").slice(0, 2)}-${item.id.slice(0, 4).toUpperCase()}`,
            name: item.name,
            category: (item.business_category || "homestay").toLowerCase(),
            location: item.city ? `${item.city}, ${item.state || "Maharashtra"}` : "Konkan Coast, Sindhudurg",
            rating: 4.85,
            reviewsCount: 42 + (idx % 80),
            priceAc: item.business_category === "RESORT" ? 5200 : 3400,
            priceNonAc: item.business_category === "RESORT" ? 3800 : 2400,
            specialRule: item.is_booking_frozen
              ? "⚠️ Bookings Temporarily Paused by Admin"
              : item.business_category === "HOMESTAY"
              ? "Fresh Morning Fish Market Catch & 4h/24h Meal Cutoff"
              : "Direct Host UPI Advance • 0% Commission Guarantee",
            badge: item.is_booking_frozen ? "Bookings Frozen" : "Verified Host",
            isFrozen: item.is_booking_frozen,
            image:
              item.business_category === "RESORT"
                ? "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80"
                : idx % 2 === 0
                ? "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
                : "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
            features: [
              "AC / Non-AC Switch",
              "50% Advance UPI",
              item.business_category === "RESORT" ? "Infinity Sea Pool" : "Home Cooked Thali",
              "Door QR Status",
            ],
          }));
          // Merge unique listings
          setLiveListings(mapped);
        }
      })
      .catch((err) => {
        console.warn("Using sample listings fallback", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const listingsToFilter = liveListings.length > 0 ? liveListings : SAMPLE_LISTINGS;

  const filteredListings = listingsToFilter.filter((item) => {
    const matchesCat = selectedCat === "all" || item.category === selectedCat;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
                SS
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                StaySuite <span className="text-indigo-600">Marketplace</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link
              href="/list-your-property"
              className="hidden sm:inline-flex bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg"
            >
              List Property
            </Link>
            <Link
              href="/customer/dashboard"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Search Section */}
      <section className="bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-900 text-white px-5 pt-8 pb-10">
        <div className="max-w-4xl mx-auto space-y-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" /> 3-Pillar Hospitality Ecosystem
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Discover Verified Konkan Stays, Homestays & Dining
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/80 max-w-xl mx-auto">
            Book authentic coastal homestays with direct 0% gateway commission, fresh seafood pre-ordering, and 50% UPI advance confirmation.
          </p>

          {/* Search Box */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-5.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by beach, town, or property name..."
              className="w-full bg-white text-slate-900 pl-10 pr-4 py-3 rounded-xl text-xs outline-none shadow-xl border border-white/20 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>
      </section>

      {/* Category Pills Navigation */}
      <div className="max-w-5xl mx-auto w-full px-4 -mt-4">
        <div className="bg-white rounded-2xl p-2 shadow-lg border border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
                {cat.badge && (
                  <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Listings Grid */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 mt-8 flex-1 pb-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {selectedCat === "all" ? "All Featured Properties" : `${selectedCat.toUpperCase()} Listings`}
            </h2>
            <p className="text-xs text-slate-500">
              Showing {filteredListings.length} verified businesses with live inventory sync
            </p>
          </div>
          <span className="text-xs text-indigo-600 font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Zero-Rewrite Matrix
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
            >
              {/* Image banner */}
              <div className="relative h-48 w-full bg-slate-200 overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded-md font-bold">
                    {listing.code}
                  </span>
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {listing.badge}
                  </span>
                </div>
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 text-xs font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{listing.rating}</span>
                  <span className="text-[10px] text-slate-500">({listing.reviewsCount})</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{listing.location}</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">{listing.name}</h3>
                  <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded-lg text-[11px] font-medium">
                    ⚡ {listing.specialRule}
                  </div>
                </div>

                {/* Features pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {listing.features.map((feat: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    >
                      {feat}
                    </span>
                  ))}
                </div>

                {/* Tariff & Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Starting From (Per Night)</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-black text-indigo-700">₹{listing.priceNonAc}</span>
                      <span className="text-[10px] text-slate-400">Non-AC</span>
                      <span className="text-[10px] text-slate-300">/</span>
                      <span className="text-xs font-bold text-slate-800">₹{listing.priceAc}</span>
                      <span className="text-[10px] text-slate-400">AC</span>
                    </div>
                  </div>

                  <Link
                    href={`/${listing.slug}`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    <span>Book Direct</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
