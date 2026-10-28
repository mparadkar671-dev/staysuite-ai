"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  CreditCard,
  Users,
  Utensils,
  AlertCircle,
  CheckCircle2,
  Receipt,
  QrCode,
  DollarSign,
  ShieldCheck,
  Search,
  Sparkles,
  Wind,
  Phone,
  Printer,
  ChevronRight,
  Sliders,
  Plus,
  Edit3,
  Flame,
  Bed,
  Layers,
  Tag,
  Eye,
  Compass,
  Gift,
  X,
  KeyRound,
} from "lucide-react";
import RoomSetupWizardModal, { RoomCategoryPayload } from "@/components/RoomSetupWizardModal";
import AddServiceModal, { ServiceItemPayload } from "@/components/AddServiceModal";

interface DashboardRoomCategory {
  id: string;
  category_name: string;
  stay_template_type: string;
  has_ac: boolean;
  base_tariff_ac: number;
  allow_guest_non_ac_toggle: boolean;
  base_tariff_non_ac: number;
  room_units: string[];
  has_seasonal_offer: boolean;
  offer_badge: string;
  offer_discount: number;
  amenities: string[];
  media: {
    main_bed_photo_url: string;
    bathroom_photo_url?: string;
    balcony_photo_url?: string;
    panorama_360_url?: string;
    instagram_reel_url?: string;
  };
}

export default function OwnerManagerDashboard() {
  const [activeTab, setActiveTab] = useState<"pms" | "pnl" | "compliance">("pms");
  const [userRole, setUserRole] = useState<"OWNER" | "MANAGER">("OWNER");
  const [twoFactorUnlocked, setTwoFactorUnlocked] = useState(false);
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [isEmergencyFrozen, setIsEmergencyFrozen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any | null>(null);
  const [waiveExtraMattress, setWaiveExtraMattress] = useState(false);
  const [checkoutCompleteMessage, setCheckoutCompleteMessage] = useState<string | null>(null);

  // Business Category & Dynamic Setup Engine
  const [propertyCategory, setPropertyCategory] = useState<
    "HOMESTAY" | "HOTEL" | "RESORT" | "RESTAURANT" | "BAR" | "ACTIVITY"
  >("HOMESTAY");
  const isAccommodation = ["HOMESTAY", "HOTEL", "RESORT"].includes(propertyCategory);

  const [showRoomWizard, setShowRoomWizard] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingTariffCategory, setEditingTariffCategory] = useState<any | null>(null);

  // Check URL query param for setup=rooms
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("setup") === "rooms") {
        setShowRoomWizard(true);
      }
    }
  }, []);

  // Room Categories & Cloned Units State
  const [roomCategories, setRoomCategories] = useState<DashboardRoomCategory[]>([
    {
      id: "cat-1",
      category_name: "Sea-Facing Deluxe AC Cottage",
      stay_template_type: "DELUXE_AC",
      has_ac: true,
      base_tariff_ac: 3200,
      allow_guest_non_ac_toggle: true,
      base_tariff_non_ac: 2400,
      room_units: ["101", "102", "103"],
      has_seasonal_offer: true,
      offer_badge: "🌧️ 20% OFF MONSOON",
      offer_discount: 20,
      amenities: ["Attached Western Bath", "24x7 Geyser", "Inverter Backup", "Free Wi-Fi", "Car Parking", "Sea View"],
      media: {
        main_bed_photo_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
        bathroom_photo_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
        balcony_photo_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        panorama_360_url: "https://pannellum.org/images/alma.jpg",
      },
    },
    {
      id: "cat-2",
      category_name: "Coconut Grove Family Villa",
      stay_template_type: "FAMILY_COTTAGE",
      has_ac: true,
      base_tariff_ac: 4500,
      allow_guest_non_ac_toggle: true,
      base_tariff_non_ac: 3600,
      room_units: ["201", "202"],
      has_seasonal_offer: false,
      offer_badge: "",
      offer_discount: 0,
      amenities: ["Attached Western Bath", "Solar Morning", "Inverter Backup", "Free Wi-Fi", "Garden View", "Pet Friendly"],
      media: {
        main_bed_photo_url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      },
    },
  ]);

  // Restaurant / Bar / Activity Services State
  const [services, setServices] = useState([
    {
      id: "srv-1",
      name: "Malvani Surmai Fish Thali",
      category: "FOOD",
      price: 380,
      preparation_time_mins: 25,
      dietary: "SEAFOOD",
      kot_printer_route: "KITCHEN_THERMAL_1",
      description: "Authentic coastal Malvani thali with Surmai fry, solkadhi, rice bhakri, and tisriya masala.",
    },
    {
      id: "srv-2",
      name: "Tarkarli Deep Sea Scuba Diving",
      category: "ACTIVITY",
      price: 1800,
      preparation_time_mins: 120,
      dietary: "VEG",
      kot_printer_route: "BEACH_DESK",
      description: "Guided scuba session with certified PADI diver and underwater video footage.",
    },
  ]);

  // 1-Click "Add Similar Room No." Bulk Cloner
  const handleCloneRoomUnit = (catId: string) => {
    setRoomCategories((prev) =>
      prev.map((c) => {
        if (c.id === catId) {
          const units = [...c.room_units];
          let nextUnit = "104";
          if (units.length > 0) {
            const numbers = units.map((u) => parseInt(u.replace(/\D/g, ""), 10)).filter((n) => !isNaN(n));
            const maxNum = numbers.length > 0 ? Math.max(...numbers) : 100;
            nextUnit = (maxNum + 1).toString();
          }
          units.push(nextUnit);

          setRooms((currRooms) => [
            ...currRooms,
            {
              id: nextUnit,
              name: c.category_name,
              tariffAc: c.base_tariff_ac,
              tariffNonAc: c.base_tariff_non_ac,
              status: "AVAILABLE",
              guest: null,
              phone: null,
              housekeeping: "CLEAN",
              acOpted: false,
              extraPerson: 0,
              foodCharge: 0,
              roomCharge: 0,
            },
          ]);

          setCheckoutCompleteMessage(
            `Room Unit ${nextUnit} cloned in 1 second under "${c.category_name}"! Unique Door QR Code token generated.`
          );
          return { ...c, room_units: units };
        }
        return c;
      })
    );
  };

  // Toggle Seasonal Offer on Room Category
  const handleToggleSeasonalOffer = (catId: string) => {
    setRoomCategories((prev) =>
      prev.map((c) => {
        if (c.id === catId) {
          const newHas = !c.has_seasonal_offer;
          setCheckoutCompleteMessage(
            newHas
              ? `Seasonal Offer "🌧️ 20% OFF MONSOON" activated on ${c.category_name}! Live on Booking Site.`
              : `Seasonal Offer deactivated for ${c.category_name}.`
          );
          return {
            ...c,
            has_seasonal_offer: newHas,
            offer_badge: newHas ? "🌧️ 20% OFF MONSOON" : "",
            offer_discount: newHas ? 20 : 0,
          };
        }
        return c;
      })
    );
  };

  // Save New Category from 5-Step Visual Wizard
  const handleSaveNewCategory = (payload: RoomCategoryPayload) => {
    const newCat = {
      id: `cat-${Date.now()}`,
      category_name: payload.category_name,
      stay_template_type: payload.stay_template_type,
      has_ac: payload.has_ac,
      base_tariff_ac: payload.base_tariff_ac,
      allow_guest_non_ac_toggle: payload.allow_guest_non_ac_toggle,
      base_tariff_non_ac: payload.base_tariff_non_ac,
      room_units: payload.room_numbers,
      has_seasonal_offer: false,
      offer_badge: "",
      offer_discount: 0,
      amenities: [
        `${payload.amenities_config.bathroom_location} Bath`,
        `${payload.amenities_config.toilet_type} Commode`,
        `${payload.amenities_config.hot_water_type}`,
        payload.amenities_config.power_backup_inverter ? "Inverter Backup" : "",
        payload.amenities_config.wifi_free ? "Free Wi-Fi" : "",
        payload.amenities_config.parking_car ? "Car Parking" : "",
        payload.amenities_config.room_view !== "NONE" ? payload.amenities_config.room_view : "",
      ].filter(Boolean),
      media: payload.media_config,
    };

    setRoomCategories((prev) => [...prev, newCat]);

    const newRooms = payload.room_numbers.map((num) => ({
      id: num,
      name: payload.category_name,
      tariffAc: payload.base_tariff_ac,
      tariffNonAc: payload.base_tariff_non_ac,
      status: "AVAILABLE",
      guest: null,
      phone: null,
      housekeeping: "CLEAN",
      acOpted: false,
      extraPerson: 0,
      foodCharge: 0,
      roomCharge: 0,
    }));

    setRooms((prev) => [...prev, ...newRooms]);
    setCheckoutCompleteMessage(
      `Room Category "${payload.category_name}" created with ${payload.room_numbers.length} cloned units!`
    );
  };

  // Save Service / Menu Item
  const handleSaveNewService = (payload: ServiceItemPayload) => {
    const newSrv = {
      id: `srv-${Date.now()}`,
      ...payload,
    };
    setServices((prev) => [...prev, newSrv]);
    setCheckoutCompleteMessage(
      `Service "${payload.name}" (₹${payload.price}) added to ${payload.category} catalog!`
    );
  };

  // Super Admin Onboarding Applications Pipeline
  const [applications, setApplications] = useState([
    {
      id: "app-hm-1001",
      businessCode: "SS-HM-1001",
      propertyName: "Konkan Kinara Beach Homestay",
      category: "HOMESTAY",
      ownerName: "Sunil Gavaskar Kadam",
      ownerMobile: "+91 9820554433",
      ownerEmail: "sunil.kadam@saguntara.com",
      taluka: "Malvan",
      district: "Sindhudurg",
      policeStation: "Malvan Coastal Police Station",
      distanceBeach: "150 meters",
      panNumber: "ABCDE1234F",
      govIdMasked: "[Aadhaar Redacted]",
      ownershipProof: "Gram Panchayat Property Tax Receipt 2025-26",
      categoryLicense: "MTDC Homestay Registration Cert #MH/MLV/2024/09",
      subscriptionPlan: "30_DAY_FREE_TRIAL",
      verificationStatus: "PROVISIONAL_ACTIVE",
      advancePaymentPercent: 50,
      upiVpa: "sunilkadam@okhdfcbank",
    },
    {
      id: "app-ht-1002",
      businessCode: "SS-HT-1002",
      propertyName: "Malvan Pearl Boutique Hotel",
      category: "HOTEL",
      ownerName: "Rajesh Ramesh Prabhu",
      ownerMobile: "+91 9422384910",
      ownerEmail: "rajesh@malvanpearl.in",
      taluka: "Malvan",
      district: "Sindhudurg",
      policeStation: "Malvan Police Station",
      distanceBeach: "500 meters",
      panNumber: "BKRPP8821K",
      govIdMasked: "[Aadhaar Redacted]",
      ownershipProof: "Index II Land Record Registration",
      categoryLicense: "Shop & Establishment Act (Gumasta) + Fire Safety NOC",
      subscriptionPlan: "STANDARD",
      verificationStatus: "PUBLIC_VERIFIED",
      advancePaymentPercent: 50,
      upiVpa: "malvanpearl@icici",
    },
  ]);

  const handleVerifyProperty = async (appId: string, businessCode: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/onboarding/applications/${appId}/verify`, {
        method: "PATCH",
      });
    } catch (e) {
      // Local fallback
    }
    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId ? { ...app, verificationStatus: "PUBLIC_VERIFIED" } : app
      )
    );
    setCheckoutCompleteMessage(
      `Property ${businessCode} has been KYC-Verified & Published! Verified Property Badge is now live on the public Booking Site.`
    );
  };

  // Sample Property Rooms & Allocations Data for Demo
  const [rooms, setRooms] = useState([
    {
      id: "101",
      name: "Deluxe Sea-Facing AC",
      tariffAc: 3500,
      tariffNonAc: 2500,
      status: "CHECKED_IN",
      guest: "Rahul Sharma",
      phone: "9820554433",
      housekeeping: "CLEAN",
      acOpted: true,
      extraPerson: 500,
      foodCharge: 1250,
      roomCharge: 7000, // 2 nights
    },
    {
      id: "102",
      name: "Family Coconut Suite AC",
      tariffAc: 5000,
      tariffNonAc: 3800,
      status: "CHECKED_IN",
      guest: "Rahul Sharma (Sibling Room)",
      phone: "9820554433",
      housekeeping: "CLEAN",
      acOpted: true,
      extraPerson: 1000,
      foodCharge: 1800,
      roomCharge: 10000,
    },
    {
      id: "103",
      name: "Standard Konkani Cottage",
      tariffAc: 2200,
      tariffNonAc: 1800,
      status: "AVAILABLE",
      guest: null,
      phone: null,
      housekeeping: "CLEAN",
      acOpted: false,
      extraPerson: 0,
      foodCharge: 0,
      roomCharge: 0,
    },
    {
      id: "104",
      name: "Beachfront Machan Wooden Hut",
      tariffAc: 4200,
      tariffNonAc: 3200,
      status: "NEEDS_CLEANING",
      guest: null,
      phone: null,
      housekeeping: "DIRTY",
      acOpted: false,
      extraPerson: 0,
      foodCharge: 0,
      roomCharge: 0,
    },
  ]);

  // Calculations for Split Checkout Modal
  const discountAmount = waiveExtraMattress && selectedAllocation ? selectedAllocation.extraPerson : 0;
  const grossTotal = selectedAllocation
    ? selectedAllocation.roomCharge + selectedAllocation.foodCharge + selectedAllocation.extraPerson
    : 0;
  const netPayable = grossTotal - discountAmount;
  const upiQrString = `upi://pay?pa=resort@okhdfcbank&pn=Konkan%20Kinara&am=${netPayable}&cu=INR`;

  const handleExecuteCheckout = (statusType: "SETTLED" | "MOVED_TO_KHATA") => {
    if (!selectedAllocation) return;
    const roomNum = selectedAllocation.id;

    // Update room status
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomNum
          ? { ...r, status: "NEEDS_CLEANING", housekeeping: "DIRTY", guest: null, phone: null }
          : r
      )
    );

    const msg =
      statusType === "MOVED_TO_KHATA"
        ? `Room ${roomNum} checked out! ₹${netPayable} moved to Customer Khata ledger. Sibling rooms remain ACTIVE.`
        : `Room ${roomNum} checkout complete! ₹${netPayable} settled via UPI. Room marked DIRTY for housekeeping.`;

    setCheckoutCompleteMessage(msg);
    setSelectedAllocation(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-24 w-full">
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
        {/* Top Navigation & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
              activeTab === "pms" ? "text-indigo-700 bg-indigo-100" : "text-purple-700 bg-purple-100"
            }`}>
              {activeTab === "pms" ? "Pillar 3: Owner & Manager PMS Desk" : "Pillar 1: Super Admin Control Plane"}
            </span>
            <span className="text-xs text-slate-500">• Sindhudurg, Maharashtra</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-0.5">
            {activeTab === "pms" ? "Konkan Kinara Beach Homestay" : activeTab === "pnl" ? "Property Profit & Loss (P&L)" : "Police Register & Statutory Form-C"}
          </h1>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveTab("pms")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "pms" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🏨 Front Desk &amp; Rooms
            </button>
            <button
              onClick={() => setActiveTab("pnl")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "pnl" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📈 Property P&amp;L
            </button>
            <button
              onClick={() => setActiveTab("compliance")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                activeTab === "compliance" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Police Register (2FA)</span>
            </button>
          </div>

          <Link
            href="/"
            className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            Exit to Hub
          </Link>
        </div>
      </div>

      {/* Tab 1: PMS Desk View */}
      {activeTab === "pms" && (
        <>
          {/* Dynamic Business Category Switcher & Primary Action Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Zero-Rewrite Category Engine
                </span>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <span>Current Business Model:</span>
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                    {propertyCategory}
                  </span>
                </h2>
              </div>

              {/* Dynamic Action Button according to Category */}
              <div>
                {isAccommodation ? (
                  <button
                    onClick={() => setShowRoomWizard(true)}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Rooms / Setup Categories</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Services / Menu Items</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Selector Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
              {[
                { id: "HOMESTAY", label: "🏡 Homestay" },
                { id: "HOTEL", label: "🏨 Hotel" },
                { id: "RESORT", label: "🌴 Resort" },
                { id: "RESTAURANT", label: "🍽️ Restaurant" },
                { id: "BAR", label: "🍻 Bar" },
                { id: "ACTIVITY", label: "🏄 Activity" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setPropertyCategory(c.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap text-[11px] ${
                    propertyCategory === c.id
                      ? "bg-slate-900 text-white shadow-sm font-extrabold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* ACCOMMODATION: Room Categories, Cloned Units & Seasonal Offers */}
          {isAccommodation && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Room Categories & Cloned Physical Units</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Shared specs (tariffs, amenities, 360° tour) separated from physical room numbers. Clone units in 1 tap.
                  </p>
                </div>
                <button
                  onClick={() => setShowRoomWizard(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {roomCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 hover:bg-slate-50 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900">{cat.category_name}</h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                            {cat.stay_template_type}
                          </span>
                          {cat.has_seasonal_offer && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-pink-600" />
                              <span>{cat.offer_badge}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">AC: ₹{cat.base_tariff_ac}</span>
                          <span>•</span>
                          <span className="text-slate-600">Non-AC: ₹{cat.base_tariff_non_ac}</span>
                          <span className="text-[11px] text-emerald-600 font-semibold">
                            (Guest Saves ₹{cat.base_tariff_ac - cat.base_tariff_non_ac}!)
                          </span>
                        </div>
                      </div>

                      {/* Quick Edit Tariff button */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setEditingTariffCategory(cat)}
                          className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                        >
                          <Edit3 className="w-3 h-3 text-indigo-600" />
                          <span>Edit Tariff</span>
                        </button>
                      </div>
                    </div>

                    {/* Amenities Badges */}
                    <div className="flex flex-wrap gap-1 text-[10px] text-slate-600">
                      {cat.amenities.map((a, i) => (
                        <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          {a}
                        </span>
                      ))}
                    </div>

                    {/* Physical Room Units & 1-Click Cloner Button */}
                    <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">Units:</span>
                      {cat.room_units.map((u) => (
                        <span
                          key={u}
                          className="bg-white border border-indigo-200 text-indigo-900 text-xs font-mono font-black px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1"
                        >
                          <Bed className="w-3 h-3 text-indigo-600" />
                          <span>Room {u}</span>
                        </span>
                      ))}

                      {/* 1-Click "+ Add Similar Room No." */}
                      <button
                        onClick={() => handleCloneRoomUnit(cat.id)}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black px-3 py-1 rounded-lg transition flex items-center gap-1"
                        title="Clones next sequential room number under this category in 1 second"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+ Add Similar Room No.</span>
                      </button>

                      {/* Seasonal Offer Switch Bar */}
                      <div className="ml-auto flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200 text-xs">
                        <span className="text-[11px] font-bold text-slate-700">Seasonal Offer:</span>
                        <button
                          onClick={() => handleToggleSeasonalOffer(cat.id)}
                          className={`w-8 h-4 rounded-full transition-colors relative ${
                            cat.has_seasonal_offer ? "bg-pink-600" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                              cat.has_seasonal_offer ? "right-0.5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NON-ACCOMMODATION: Restaurant & Activity Services List */}
          {!isAccommodation && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-emerald-600" />
                    <span>{propertyCategory === "ACTIVITY" ? "Tourist Activities & Equipment" : "Dining Menu & KOT Routing"}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Zero-Rewrite operational menu. KOTs route to thermal printer; guests can order directly from table QR.
                  </p>
                </div>
                <button
                  onClick={() => setShowServiceModal(true)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((srv) => (
                  <div key={srv.id} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{srv.name}</h4>
                        <span className="text-[10px] text-slate-500">{srv.description}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900 bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                        ₹{srv.price}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>⏱️ {srv.preparation_time_mins} mins</span>
                      <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        🖨️ {srv.kot_printer_route}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1-Click Master Emergency Room Freeze Switch */}
          <div
            className={`p-4 rounded-2xl border transition shadow-sm flex items-center justify-between ${
              isEmergencyFrozen ? "bg-rose-50 border-rose-300" : "bg-white border-slate-200"
            }`}
          >
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${isEmergencyFrozen ? "bg-rose-600 animate-ping" : "bg-emerald-500"}`}
                />
                <p className="text-xs font-black text-slate-900">
                  {isEmergencyFrozen ? "EMERGENCY ROOM FREEZE ACTIVE" : "Direct Storefront & OTA Availability: LIVE"}
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                {isEmergencyFrozen
                  ? "Zero rooms open for booking on staysuite.in and connected OTAs."
                  : "1-Click toggle immediately freezes all rooms during private events or holidays."}
              </p>
            </div>
            <button
              onClick={() => setIsEmergencyFrozen(!isEmergencyFrozen)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-sm ${
                isEmergencyFrozen ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-slate-200 text-slate-800 hover:bg-slate-300"
              }`}
            >
              {isEmergencyFrozen ? "Unfreeze Rooms" : "Freeze All Rooms"}
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Occupancy</p>
              <p className="text-base font-black text-indigo-700">50%</p>
              <p className="text-[10px] text-slate-400">2 / 4 Occupied</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Today Revenue</p>
              <p className="text-base font-black text-emerald-700">₹17,000</p>
              <p className="text-[10px] text-slate-400">0% MDR UPI</p>
            </div>
            <Link
              href="/kitchen"
              className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 shadow-sm hover:bg-amber-100 transition flex flex-col justify-center"
            >
              <p className="text-[10px] text-amber-800 font-bold uppercase">Market List</p>
              <p className="text-xs font-extrabold text-amber-900">7 AM Fish & Veg</p>
              <p className="text-[10px] text-amber-700 underline">View BOM →</p>
            </Link>
          </div>

          {/* Room Grid with Live Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Room Inventory & Group Folios
              </h2>
              <span className="text-[11px] text-slate-500">Tap room to perform Partial Checkout</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {rooms.map((room) => {
                const isOccupied = room.status === "CHECKED_IN";
                const isDirty = room.housekeeping === "DIRTY";

                return (
                  <div
                    key={room.id}
                    onClick={() => {
                      if (isOccupied) setSelectedAllocation(room);
                    }}
                    className={`bg-white border-2 rounded-2xl p-4 transition shadow-sm ${
                      isOccupied
                        ? "border-indigo-300 hover:border-indigo-500 cursor-pointer"
                        : isDirty
                        ? "border-rose-200"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-900">Room {room.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOccupied
                            ? "bg-indigo-100 text-indigo-800"
                            : isDirty
                            ? "bg-rose-100 text-rose-800 animate-pulse"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isOccupied ? "OCCUPIED" : isDirty ? "NEEDS CLEANING" : "AVAILABLE"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{room.name}</p>

                    {isOccupied ? (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-xs">
                        <p className="font-semibold text-slate-900 flex items-center justify-between">
                          <span>👤 {room.guest}</span>
                          <span className="text-[11px] text-indigo-600 font-bold">Partial Checkout →</span>
                        </p>
                        <p className="text-[11px] text-slate-500">📞 {room.phone} • AC Tariff: ₹{room.tariffAc}</p>
                        <div className="flex justify-between items-center text-[11px] pt-1 text-slate-700 font-medium">
                          <span>Food: ₹{room.foodCharge}</span>
                          <span>Extra Mattress: ₹{room.extraPerson}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
                        <span>AC: ₹{room.tariffAc} / Non-AC: ₹{room.tariffNonAc}</span>
                        <Link
                          href={`/checkin/sample-qr`}
                          className="text-indigo-600 font-bold hover:underline"
                        >
                          Walk-In QR
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Property Profit & Loss (P&L) Revenue Dashboard */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-emerald-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full">
                  Monthly Financial Statement &bull; October 2026
                </span>
                <h2 className="text-xl font-black mt-1">Konkan Kinara Homestay &bull; P&amp;L Overview</h2>
                <p className="text-xs text-slate-300">
                  Real-time revenue computed from room folios, dining BOM sales, kirana stock, and staff payroll.
                </p>
              </div>
              <button
                onClick={() => alert("Downloading Property P&L Statement (Excel/PDF)...")}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5 shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>Export P&amp;L Report (Excel)</span>
              </button>
            </div>

            {/* High-level Revenue vs Cost cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <span className="text-[10px] text-slate-300 font-bold uppercase block">Total Gross Revenue</span>
                <span className="text-2xl font-black text-white mt-1 block">₹6,20,000</span>
                <span className="text-[10px] text-emerald-300 font-semibold">+18% vs Last Month</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <span className="text-[10px] text-slate-300 font-bold uppercase block">Cost of Goods (BOM)</span>
                <span className="text-2xl font-black text-rose-300 mt-1 block">- ₹1,42,000</span>
                <span className="text-[10px] text-slate-300 font-medium">Fish &amp; Veg Markets</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <span className="text-[10px] text-slate-300 font-bold uppercase block">Operating Expenses</span>
                <span className="text-2xl font-black text-rose-300 mt-1 block">- ₹1,84,000</span>
                <span className="text-[10px] text-slate-300 font-medium">Payroll, Gas, Electricity</span>
              </div>

              <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-4 border border-emerald-400/30">
                <span className="text-[10px] text-emerald-300 font-bold uppercase block">Net Operating Profit</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">+ ₹2,94,000</span>
                <span className="text-[10px] text-emerald-300 font-bold">47.4% Net Margin</span>
              </div>
            </div>
          </div>

          {/* Detailed Financial Breakdown Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Revenue Sources */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  1. Revenue Streams Breakdown
                </h3>
                <span className="text-xs font-black text-emerald-700">₹6,20,000</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">Room Tariffs (Deluxe AC &amp; Chira Cottage)</span>
                  <span className="font-bold text-slate-900">₹4,20,000</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">Fresh Seafood &amp; Thali Dining Orders</span>
                  <span className="font-bold text-slate-900">₹1,65,000</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-600">Extra Mattress, Scuba &amp; Driver Dormitory</span>
                  <span className="font-bold text-slate-900">₹35,000</span>
                </div>
              </div>
            </div>

            {/* 2. Direct Costs & OPEX */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  2. 10-Category Expense Ledger (BOM + OPEX)
                </h3>
                <span className="text-xs font-black text-rose-700">- ₹3,26,000</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">Fish Harbor Purchases (Surmai, Pomfret, Prawns)</span>
                  <span className="font-bold text-rose-700">- ₹95,000</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">Staff Wages &amp; Net Payroll (Minus Upaad)</span>
                  <span className="font-bold text-rose-700">- ₹98,000</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">Vegetable Market &amp; Kirana Pantry Supplies</span>
                  <span className="font-bold text-rose-700">- ₹47,000</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">Electricity, Inverter Distilled Water &amp; Wi-Fi</span>
                  <span className="font-bold text-rose-700">- ₹44,000</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-600">LPG Commercial Cylinders &amp; Cleaning Supplies</span>
                  <span className="font-bold text-rose-700">- ₹42,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Statutory Police Register & Form-C (2FA Protected) */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-black text-slate-900">
                    Official Maharashtra Police Register &amp; Form-C
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Malvan Police Station Jurisdiction &bull; Full PII access strictly restricted to Owner via 2FA.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!twoFactorUnlocked ? (
                  <button
                    onClick={() => setShowTwoFactorModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>[ 🔒 Unlock 2FA for Police Export ]</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      2FA Unlocked (Owner Verified)
                    </span>
                    <button
                      onClick={() => alert("Exporting certified Police Register PDF...")}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm"
                    >
                      Export PDF / Excel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Role Notice */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-600">
                Current Access Level: <strong className="text-slate-900">{twoFactorUnlocked ? "Owner 2FA Full View" : "Manager / Staff Redacted View"}</strong>
              </span>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                UIDAI Section 29 Compliant
              </span>
            </div>

            {/* Guest Inspection Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Room</th>
                    <th className="p-3">Guest Full Name</th>
                    <th className="p-3">Nationality</th>
                    <th className="p-3">Government ID Number</th>
                    <th className="p-3">Check-in Time</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Room 101</td>
                    <td className="p-3 font-bold text-slate-900">Vikramaditya Shinde</td>
                    <td className="p-3 text-slate-600">Indian</td>
                    <td className="p-3 font-mono font-bold">
                      {twoFactorUnlocked ? (
                        <span className="text-slate-900">4829-1092-4820</span>
                      ) : (
                        <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                          [Aadhaar Redacted]
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">2026-10-24 12:15 PM</td>
                    <td className="p-3">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        Verified Checked-In
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-slate-900">Room 102</td>
                    <td className="p-3 font-bold text-slate-900">Sophie Dubois</td>
                    <td className="p-3 text-amber-700 font-bold">French (Form-C Alert)</td>
                    <td className="p-3 font-mono font-bold">
                      {twoFactorUnlocked ? (
                        <span className="text-slate-900">FR-94829104</span>
                      ) : (
                        <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                          [Passport Redacted]
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">2026-10-24 02:30 PM</td>
                    <td className="p-3">
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        Form-C Submitted
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2FA Modal */}
          {showTwoFactorModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                <div className="flex items-center gap-2 text-slate-900">
                  <KeyRound className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black">Owner 2FA Authentication</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your 6-digit authenticator code or SMS OTP to decrypt legal identification records for police inspection.
                </p>
                <div>
                  <input
                    type="text"
                    value={twoFactorOtp}
                    onChange={(e) => setTwoFactorOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    className="w-full text-center text-lg font-mono font-black tracking-widest border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 text-center block mt-1">
                    Demo OTP: any 6 digits (e.g. 123456)
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowTwoFactorModal(false)}
                    className="flex-1 py-2 text-xs font-bold border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setTwoFactorUnlocked(true);
                      setShowTwoFactorModal(false);
                    }}
                    className="flex-1 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                  >
                    Authorize Decryption
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PARTIAL ROOM CHECKOUT MODAL (Vyapar++ Group Split Billing) */}
      {selectedAllocation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-2">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">
                  Vyapar++ Split Billing
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Partial Checkout: Room {selectedAllocation.id}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Guest: {selectedAllocation.guest} (Sibling rooms remain ACTIVE)
                </p>
              </div>
              <button
                onClick={() => setSelectedAllocation(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Folio Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Room Nights (AC Prorated):</span>
                <span className="font-semibold text-slate-900">₹{selectedAllocation.roomCharge}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Dining KOT Orders (Vedika's Kitchen):</span>
                <span className="font-semibold text-slate-900">₹{selectedAllocation.foodCharge}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Extra Mattress / Driver Bed Charge:</span>
                <span className="font-semibold text-slate-900">₹{selectedAllocation.extraPerson}</span>
              </div>

              {/* 1-Click Mattress Fee Waive Toggle */}
              {selectedAllocation.extraPerson > 0 && (
                <div className="pt-2 border-t border-slate-200 mt-2 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-[11px]">1-Click Waive Mattress Fee</p>
                    <p className="text-[10px] text-slate-500">Discounts ₹{selectedAllocation.extraPerson} from total</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={waiveExtraMattress}
                    onChange={(e) => setWaiveExtraMattress(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Net Payable Balance:</span>
                <span className="text-indigo-600">₹{netPayable}</span>
              </div>
            </div>

            {/* Dynamic UPI QR Code */}
            <div className="border border-slate-200 rounded-xl p-3 text-center space-y-2">
              <p className="text-[11px] font-bold text-slate-800">Direct Dynamic UPI QR (0% MDR)</p>
              <div className="w-36 h-36 mx-auto bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                <QrCode className="w-28 h-28 text-slate-800" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">resort@okhdfcbank • ₹{netPayable}</p>
            </div>

            {/* Actions: Settle vs Customer Khata */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => handleExecuteCheckout("SETTLED")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Receive ₹{netPayable} via UPI & Settle Room</span>
              </button>

              <button
                onClick={() => handleExecuteCheckout("MOVED_TO_KHATA")}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>Move ₹{netPayable} to Customer Khata (Credit Ledger)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5-Step Low-Irritation Room Setup & Cloner Wizard Modal */}
      <RoomSetupWizardModal
        isOpen={showRoomWizard}
        onClose={() => setShowRoomWizard(false)}
        onSaveCategory={handleSaveNewCategory}
        initialTemplate={propertyCategory === "HOMESTAY" ? "DELUXE_AC" : "STANDARD_ROOM"}
      />

      {/* Add Services / Menu Items Modal for Dining & Activities */}
      <AddServiceModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSaveService={handleSaveNewService}
        businessCategory={propertyCategory}
      />

      {/* Quick Tariff Edit Modal */}
      {editingTariffCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                Edit Tariff: {editingTariffCategory.category_name}
              </h3>
              <button
                onClick={() => setEditingTariffCategory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Base AC Tariff (₹/night)</label>
                <input
                  type="number"
                  defaultValue={editingTariffCategory.base_tariff_ac}
                  id="editAcTariff"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Base Non-AC Tariff (₹/night)</label>
                <input
                  type="number"
                  defaultValue={editingTariffCategory.base_tariff_non_ac}
                  id="editNonAcTariff"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingTariffCategory(null)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const acInput = document.getElementById("editAcTariff") as HTMLInputElement;
                  const nonAcInput = document.getElementById("editNonAcTariff") as HTMLInputElement;
                  const ac = acInput ? Number(acInput.value) : editingTariffCategory.base_tariff_ac;
                  const nonAc = nonAcInput ? Number(nonAcInput.value) : editingTariffCategory.base_tariff_non_ac;
                  setRoomCategories((prev) =>
                    prev.map((c) =>
                      c.id === editingTariffCategory.id
                        ? { ...c, base_tariff_ac: ac, base_tariff_non_ac: nonAc }
                        : c
                    )
                  );
                  setEditingTariffCategory(null);
                  setCheckoutCompleteMessage(
                    `Tariff updated for "${editingTariffCategory.category_name}": AC ₹${ac} / Non-AC ₹${nonAc}!`
                  );
                }}
                className="bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-indigo-700 shadow-md"
              >
                Save Tariff
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
