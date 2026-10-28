"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, MapPin, Star, PhoneCall } from "lucide-react";
import RoomConversionCard, { RoomCategoryData } from "@/components/RoomConversionCard";

const SAMPLE_ROOM_CATEGORIES: RoomCategoryData[] = [
  {
    id: "cat-1",
    category_name: "Sea-Facing Deluxe AC Cottage",
    stay_template_type: "DELUXE_AC",
    has_ac: true,
    base_tariff_ac: 3200,
    allow_guest_non_ac_toggle: true,
    base_tariff_non_ac: 2400,
    base_occupancy_adults: 2,
    max_occupancy: 4,
    extra_mattress_charge: 500,
    driver_stay_free: true,
    amenities_config: {
      bathroom_location: "ATTACHED_INSIDE",
      toilet_type: "WESTERN",
      hot_water_type: "GEYSER_24X7",
      wifi_free: true,
      power_backup_inverter: true,
      parking_car: true,
      tv_smart: true,
      private_balcony: true,
      pet_friendly: false,
      room_view: "SEA_VIEW",
      free_value_perks: [
        "Free Driver Dormitory Stay",
        "Complimentary Welcome Solkadhi Drink",
        "Direct Beach Access (30 seconds walk)",
      ],
    },
    media_config: {
      main_bed_photo_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      bathroom_photo_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
      balcony_photo_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      panorama_360_url: "https://pannellum.org/images/alma.jpg",
    },
    seasonal_offer: {
      offer_title: "Monsoon Beachfront Special",
      badge_tag: "🌧️ 20% OFF TODAY",
      discount_percent: 20,
    },
    available_units: 1,
  },
  {
    id: "cat-2",
    category_name: "Coconut Grove Family Villa",
    stay_template_type: "FAMILY_COTTAGE",
    has_ac: true,
    base_tariff_ac: 4500,
    allow_guest_non_ac_toggle: true,
    base_tariff_non_ac: 3600,
    base_occupancy_adults: 4,
    max_occupancy: 6,
    extra_mattress_charge: 400,
    driver_stay_free: true,
    amenities_config: {
      bathroom_location: "ATTACHED_INSIDE",
      toilet_type: "BOTH",
      hot_water_type: "SOLAR_MORNING",
      wifi_free: true,
      power_backup_inverter: true,
      parking_car: true,
      parking_bus: true,
      private_balcony: true,
      pet_friendly: true,
      room_view: "GARDEN_VIEW",
      free_value_perks: [
        "Private Hammock in Betelnut Orchard",
        "Free Car & Bus Parking",
        "Authentic Chulivarcha Chai included",
      ],
    },
    media_config: {
      main_bed_photo_url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      panorama_360_url: "https://pannellum.org/images/cerro-toco-0.jpg",
    },
    seasonal_offer: {
      offer_title: "Direct Host Discount",
      badge_tag: "⚡ 15% OFF DIRECT",
      discount_percent: 15,
    },
    available_units: 2,
  },
];

export default function DirectStorefrontPage({
  params,
}: {
  params: Promise<{ propertySlug: string }>;
}) {
  const [propertySlug, setPropertySlug] = useState<string>("konkan-kinara");
  const [propertyData, setPropertyData] = useState<any>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    params.then((p) => {
      setPropertySlug(p.propertySlug);
      fetch(`http://127.0.0.1:8000/api/v1/properties/by-slug/${p.propertySlug}`)
        .then(async (r) => {
          if (r.status === 403) {
            setIsSuspended(true);
            return null;
          }
          if (r.ok) return r.json();
          return null;
        })
        .then((data) => {
          if (data) setPropertyData(data);
        })
        .catch((err) => console.warn("Live property load fallback", err))
        .finally(() => setLoading(false));
    });
  }, [params]);

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldCheck className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Property Listing Suspended</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This property listing is currently paused by Super Admin HQ due to administrative review or policy compliance.
          </p>
          <div className="pt-2">
            <Link
              href="/explore"
              className="inline-flex px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              Browse Other Verified Stays
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const propName = propertyData?.name || "Konkan Kinara Homestay & Cottages";
  const propLocation = propertyData?.city
    ? `${propertyData.city}, ${propertyData.state || "Maharashtra"}`
    : "Tarkarli Beach Road, Malvan, Sindhudurg, Maharashtra";
  const isFrozen = propertyData?.is_booking_frozen ?? false;
  const merchantUpi = propertyData?.upi_vpa || "resort@okhdfcbank";

  return (
    <div className="flex-1 flex flex-col pb-24 bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <div className="relative h-64 bg-slate-900 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
          alt="Resort Cover"
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> 0% Middleman Commission
            </span>
            <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 fill-slate-950" /> 4.9 (128 Verified Stays)
            </span>
            {isFrozen && (
              <span className="inline-flex items-center gap-1 bg-cyan-400 text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full animate-pulse">
                ❄️ Bookings Temporarily Frozen
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight">{propName}</h1>
          <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            {propLocation}
          </p>
        </div>
      </div>

      <div className="max-w-5xl lg:max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Booking Frozen Alert Banner */}
        {isFrozen && (
          <div className="bg-cyan-950 text-cyan-100 border border-cyan-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
            <div>
              <p className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                ❄️ Bookings Temporarily Paused by Property Management
              </p>
              <p className="text-[11px] text-cyan-300 mt-0.5">
                Online reservation intake is temporarily paused. Existing bookings and check-ins remain valid. You can call the host directly.
              </p>
            </div>
            <a
              href="tel:+919876543210"
              className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call Host
            </a>
          </div>
        )}

        {/* Direct Host Guarantee Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-bold text-emerald-950">
              Direct Host Booking Advantage
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Pay 50% UPI advance directly to host ({merchantUpi}). 0% convenience fees.
            </p>
          </div>
          <a
            href="tel:+919876543210"
            className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-emerald-700 transition shrink-0"
          >
            <PhoneCall className="w-3.5 h-3.5" /> Call Host
          </a>
        </div>

        {/* Guest Vibes & Malvani Delicacies */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-600" /> Authentic Konkan Experience
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-[4/3] group">
              <img
                src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=500&q=80"
                alt="Malvani Surmai Thali"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                Surmai Fry Thali
              </span>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-[4/3] group">
              <img
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80"
                alt="Tarkarli White Sand Beach"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <span className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                1 Min Beach Walk
              </span>
            </div>
          </div>
        </div>

        {/* Room Categories Section */}
        <div>
          <div className="mb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Select Your Stay Option
            </h2>
            <p className="text-xs text-slate-500">
              Toggle AC on/off to save money. Verified authentic photos and 360° virtual tours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {SAMPLE_ROOM_CATEGORIES.map((category) => (
              <RoomConversionCard
                key={category.id}
                category={category}
                onBookNow={(catId, ac, advance) => {
                  console.log("Booked room:", catId, "AC:", ac, "Advance:", advance);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

