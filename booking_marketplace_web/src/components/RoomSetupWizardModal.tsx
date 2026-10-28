"use client";

import React, { useState } from "react";
import {
  X,
  Bed,
  Wind,
  Bath,
  Wifi,
  Zap,
  Car,
  Tv,
  Eye,
  Camera,
  Compass,
  Settings,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Flame,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldCheck,
  Gift,
} from "lucide-react";

export interface RoomCategoryPayload {
  id?: string;
  category_name: string;
  stay_template_type: string;
  has_ac: boolean;
  base_tariff_ac: number;
  allow_guest_non_ac_toggle: boolean;
  base_tariff_non_ac: number;
  weekend_surge_percent: number;
  base_occupancy_adults: number;
  max_occupancy: number;
  extra_mattress_charge: number;
  driver_stay_free: boolean;
  amenities_config: {
    bathroom_location: string;
    toilet_type: string;
    hot_water_type: string;
    wifi_free: boolean;
    power_backup_inverter: boolean;
    parking_car: boolean;
    parking_bus: boolean;
    tv_smart: boolean;
    private_balcony: boolean;
    mini_fridge: boolean;
    pet_friendly: boolean;
    room_view: string;
    free_value_perks: string[];
  };
  media_config: {
    main_bed_photo_url: string;
    bathroom_photo_url: string;
    balcony_photo_url: string;
    panorama_360_url?: string;
    instagram_reel_url?: string;
  };
  room_numbers: string[];
}

interface RoomSetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCategory: (category: RoomCategoryPayload) => void;
  initialTemplate?: string;
}

const TEMPLATES = [
  { id: "STANDARD_ROOM", name: "Standard Room", icon: "🛏️", defaultName: "Standard Konkani Room", acPrice: 2200, nonAcPrice: 1800 },
  { id: "DELUXE_AC", name: "Deluxe AC Cottage", icon: "❄️", defaultName: "Sea-Facing Deluxe AC Cottage", acPrice: 3200, nonAcPrice: 2400 },
  { id: "FAMILY_COTTAGE", name: "Family Villa", icon: "🏡", defaultName: "Coconut Grove Family Villa", acPrice: 4500, nonAcPrice: 3600 },
  { id: "DORM_BED", name: "Dormitory / Hostel", icon: "👥", defaultName: "Backpacker AC Dorm Bed", acPrice: 800, nonAcPrice: 600 },
  { id: "LUXURY_TENT", name: "Glamping Tent", icon: "⛺", defaultName: "Luxury Beachfront Safari Tent", acPrice: 3800, nonAcPrice: 3000 },
  { id: "VILLA", name: "Private Estate", icon: "🌴", defaultName: "Exclusive 3BHK Heritage Wada", acPrice: 8500, nonAcPrice: 7000 },
];

export default function RoomSetupWizardModal({
  isOpen,
  onClose,
  onSaveCategory,
  initialTemplate = "DELUXE_AC",
}: RoomSetupWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Template & Room Numbers
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
  const [categoryName, setCategoryName] = useState("Sea-Facing Deluxe AC Cottage");
  const [roomNumbers, setRoomNumbers] = useState<string[]>(["101", "102", "103"]);
  const [roomInput, setRoomInput] = useState("");

  // Step 2: Pricing & Smart Non-AC Toggle
  const [hasAc, setHasAc] = useState(true);
  const [baseTariffAc, setBaseTariffAc] = useState(3200);
  const [allowGuestNonAcToggle, setAllowGuestNonAcToggle] = useState(true);
  const [baseTariffNonAc, setBaseTariffNonAc] = useState(2400);
  const [extraMattressCharge, setExtraMattressCharge] = useState(500);
  const [driverStayFree, setDriverStayFree] = useState(true);
  const [baseOccupancy, setBaseOccupancy] = useState(2);
  const [maxOccupancy, setMaxOccupancy] = useState(4);

  // Step 3: Amenities & Bathroom Specs
  const [bathroomLocation, setBathroomLocation] = useState("ATTACHED_INSIDE");
  const [toiletType, setToiletType] = useState("WESTERN");
  const [hotWaterType, setHotWaterType] = useState("GEYSER_24X7");
  const [wifiFree, setWifiFree] = useState(true);
  const [powerBackupInverter, setPowerBackupInverter] = useState(true);
  const [parkingCar, setParkingCar] = useState(true);
  const [parkingBus, setParkingBus] = useState(false);
  const [tvSmart, setTvSmart] = useState(true);
  const [privateBalcony, setPrivateBalcony] = useState(true);
  const [miniFridge, setMiniFridge] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [roomView, setRoomView] = useState("SEA_VIEW");
  const [freePerks, setFreePerks] = useState<string[]>([
    "Free Driver Dormitory Stay",
    "Complimentary Welcome Solkadhi Drink",
    "Direct Beach Access (30 seconds walk)",
  ]);
  const [newPerkInput, setNewPerkInput] = useState("");

  // Step 4: Media & 360 Tour
  const [bedPhotoUrl, setBedPhotoUrl] = useState(
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
  );
  const [bathroomPhotoUrl, setBathroomPhotoUrl] = useState(
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"
  );
  const [balconyPhotoUrl, setBalconyPhotoUrl] = useState(
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
  );
  const [panorama360Url, setPanorama360Url] = useState("https://pannellum.org/images/alma.jpg");
  const [instagramReelUrl, setInstagramReelUrl] = useState("");

  // Step 5: Advanced Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [weekendSurgePercent, setWeekendSurgePercent] = useState(15);
  const [minNights, setMinNights] = useState(1);
  const [managerRateEditAllowed, setManagerRateEditAllowed] = useState(true);
  const [childStayFreeUnder6, setChildStayFreeUnder6] = useState(true);

  if (!isOpen) return null;

  const guestSavings = baseTariffAc - baseTariffNonAc;

  const handleAddRoomNumber = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !roomNumbers.includes(trimmed)) {
      setRoomNumbers([...roomNumbers, trimmed]);
      setRoomInput("");
    }
  };

  const handleRemoveRoomNumber = (tag: string) => {
    setRoomNumbers(roomNumbers.filter((r) => r !== tag));
  };

  const handleAddPerk = (p: string) => {
    const trimmed = p.trim();
    if (trimmed && !freePerks.includes(trimmed)) {
      setFreePerks([...freePerks, trimmed]);
      setNewPerkInput("");
    }
  };

  const handleRemovePerk = (index: number) => {
    setFreePerks(freePerks.filter((_, i) => i !== index));
  };

  const handleTemplateSelect = (tmpl: typeof TEMPLATES[0]) => {
    setSelectedTemplate(tmpl.id);
    setCategoryName(tmpl.defaultName);
    setBaseTariffAc(tmpl.acPrice);
    setBaseTariffNonAc(tmpl.nonAcPrice);
  };

  const handleFinalSave = () => {
    if (roomNumbers.length === 0) {
      alert("Please assign at least one room number (e.g. 101).");
      return;
    }

    const payload: RoomCategoryPayload = {
      category_name: categoryName,
      stay_template_type: selectedTemplate,
      has_ac: hasAc,
      base_tariff_ac: baseTariffAc,
      allow_guest_non_ac_toggle: allowGuestNonAcToggle,
      base_tariff_non_ac: baseTariffNonAc,
      weekend_surge_percent: weekendSurgePercent,
      base_occupancy_adults: baseOccupancy,
      max_occupancy: maxOccupancy,
      extra_mattress_charge: extraMattressCharge,
      driver_stay_free: driverStayFree,
      amenities_config: {
        bathroom_location: bathroomLocation,
        toilet_type: toiletType,
        hot_water_type: hotWaterType,
        wifi_free: wifiFree,
        power_backup_inverter: powerBackupInverter,
        parking_car: parkingCar,
        parking_bus: parkingBus,
        tv_smart: tvSmart,
        private_balcony: privateBalcony,
        mini_fridge: miniFridge,
        pet_friendly: petFriendly,
        room_view: roomView,
        free_value_perks: freePerks,
      },
      media_config: {
        main_bed_photo_url: bedPhotoUrl,
        bathroom_photo_url: bathroomPhotoUrl,
        balcony_photo_url: balconyPhotoUrl,
        panorama_360_url: panorama360Url,
        instagram_reel_url: instagramReelUrl,
      },
      room_numbers: roomNumbers,
    };

    onSaveCategory(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white sm:rounded-3xl rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden sm:my-6 my-auto flex flex-col max-h-[96vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              🛏️
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight">Sequential Room Setup & Bulk Cloner</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">Step {currentStep} of 5 • Zero-Irritation Setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Step Stepper Progress Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 sm:px-6 sm:py-2.5 flex items-center justify-between text-xs font-bold text-slate-600 shrink-0 overflow-x-auto gap-2 no-scrollbar">
          {[
            { step: 1, label: "Template & Numbers" },
            { step: 2, label: "Smart Pricing" },
            { step: 3, label: "1-Tap Amenities" },
            { step: 4, label: "Photos & 360°" },
            { step: 5, label: "Advanced" },
          ].map((s) => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition whitespace-nowrap text-[11px] ${
                currentStep === s.step
                  ? "bg-indigo-600 text-white shadow-sm"
                  : currentStep > s.step
                  ? "bg-emerald-100 text-emerald-800 font-semibold"
                  : "hover:bg-slate-200 text-slate-500"
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === s.step ? "bg-white text-indigo-700 font-black" : "bg-slate-300 text-slate-700"
              }`}>
                {s.step}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-900">
          {/* STEP 1: CATEGORY TEMPLATE & ASSIGN ROOM NUMBERS */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-900">Step 1: Choose Template & Assign Room Numbers</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tap a pre-configured template to set smart defaults. Enter room numbers to clone physical units in one click.
                </p>
              </div>

              {/* Template Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleTemplateSelect(tmpl)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/80 shadow-md ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xl mb-1">{tmpl.icon}</div>
                      <div className="text-xs font-bold text-slate-900">{tmpl.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">From ₹{tmpl.acPrice}/night</div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Category Name Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Display Name (Shown to Guests) *
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g., Sea-Facing Deluxe AC Cottage"
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Bulk Physical Room Numbers Tag Input */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>Physical Room Units to Create</span>
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded-full">
                        {roomNumbers.length} Rooms
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Each room gets a unique signed Door QR code automatically.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRoomNumber(roomInput);
                      }
                    }}
                    placeholder="Enter room no (e.g. 104) and tap Add"
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddRoomNumber(roomInput)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Render Tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {roomNumbers.map((num) => (
                    <span
                      key={num}
                      className="inline-flex items-center gap-1.5 bg-white border border-indigo-200 text-indigo-900 text-xs font-black px-3 py-1.5 rounded-xl shadow-sm"
                    >
                      <span>Room {num}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRoomNumber(num)}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: AC / NON-AC SMART PRICING CARDS */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-900">Step 2: AC / Non-AC Smart Pricing</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Konkan guests love the option to switch off AC to save money. This boosts direct booking conversion by up to 34%.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* AC Tariff Card */}
                <div className="bg-indigo-50/70 border-2 border-indigo-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <Wind className="w-4 h-4 text-indigo-600" />
                      <span>❄️ With Air Conditioning</span>
                    </span>
                    <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded font-bold">Standard</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Base AC Tariff (₹ / Night)</span>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        value={baseTariffAc}
                        onChange={(e) => setBaseTariffAc(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-indigo-300 bg-white font-black text-base text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Non-AC Tariff Card */}
                <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>🌿 Non-AC Sea Breeze</span>
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowGuestNonAcToggle}
                        onChange={(e) => setAllowGuestNonAcToggle(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Allow Guest Toggle</span>
                    </label>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">Base Non-AC Tariff (₹ / Night)</span>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        disabled={!allowGuestNonAcToggle}
                        value={baseTariffNonAc}
                        onChange={(e) => setBaseTariffNonAc(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-emerald-300 bg-white font-black text-base text-slate-900 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Psychological Guest Savings Callout */}
              {allowGuestNonAcToggle && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
                    💰
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-amber-950">
                      Live Conversion Preview: Guests save ₹{guestSavings}/night when switching to Non-AC!
                    </p>
                    <p className="text-[11px] text-amber-800">
                      This will be displayed as a psychological savings badge right on your public room card.
                    </p>
                  </div>
                </div>
              )}

              {/* Extra Bed & Driver Policy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Extra Mattress Charge (₹)</label>
                  <input
                    type="number"
                    value={extraMattressCharge}
                    onChange={(e) => setExtraMattressCharge(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="driverFree"
                    checked={driverStayFree}
                    onChange={(e) => setDriverStayFree(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <label htmlFor="driverFree" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Complimentary Driver Dormitory Included
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 1-TAP AMENITIES & BATHROOM SPECS */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-900">Step 3: 1-Tap Amenities & Bathroom Specs</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bathroom cleanliness, hot water, and inverter backup eliminate guest anxiety before booking.
                </p>
              </div>

              {/* Bathroom Location */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 block">Bathroom Location *</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "ATTACHED_INSIDE", label: "🚿 Attached Inside" },
                    { id: "PRIVATE_OUTSIDE", label: "🚪 Private Outside" },
                    { id: "SHARED_COMMON", label: "🤝 Shared Common" },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setBathroomLocation(loc.id)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition ${
                        bathroomLocation === loc.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toilet Type & Hot Water */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 block mb-1.5">Toilet Type *</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "WESTERN", label: "Western" },
                      { id: "INDIAN", label: "Indian" },
                      { id: "BOTH", label: "Both" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setToiletType(t.id)}
                        className={`p-2 rounded-lg text-xs font-bold border transition ${
                          toiletType === t.id
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-800 block mb-1.5">Hot Water Type *</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "GEYSER_24X7", label: "24x7 Geyser" },
                      { id: "SOLAR_MORNING", label: "Solar Morning" },
                      { id: "BUCKET_HOT_WATER", label: "Bucket Water" },
                    ].map((hw) => (
                      <button
                        key={hw.id}
                        type="button"
                        onClick={() => setHotWaterType(hw.id)}
                        className={`p-2 rounded-lg text-[11px] font-bold border transition text-center ${
                          hotWaterType === hw.id
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200"
                        }`}
                      >
                        {hw.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 1-Tap Feature Toggles */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">Key Guest Comfort Toggles</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Free Wi-Fi", val: wifiFree, set: setWifiFree, icon: "📶" },
                    { label: "Inverter Backup", val: powerBackupInverter, set: setPowerBackupInverter, icon: "🔋" },
                    { label: "Car Parking", val: parkingCar, set: setParkingCar, icon: "🚗" },
                    { label: "Bus Parking", val: parkingBus, set: setParkingBus, icon: "🚌" },
                    { label: "Smart TV", val: tvSmart, set: setTvSmart, icon: "📺" },
                    { label: "Private Balcony", val: privateBalcony, set: setPrivateBalcony, icon: "🌅" },
                    { label: "Mini Fridge", val: miniFridge, set: setMiniFridge, icon: "🧊" },
                    { label: "Pet Friendly", val: petFriendly, set: setPetFriendly, icon: "🐾" },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => item.set(!item.val)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                        item.val
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Free Value Perks Tag List */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-800 block">
                  🎁 Included Free Value Perks (Displayed in Golden Stack Box)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPerkInput}
                    onChange={(e) => setNewPerkInput(e.target.value)}
                    placeholder="e.g., Free Chulivarcha Chai & Poha"
                    className="flex-1 p-2 rounded-xl border border-slate-300 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPerk(newPerkInput)}
                    className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl"
                  >
                    Add Perk
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {freePerks.map((p, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-950 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                    >
                      <span>{p}</span>
                      <button type="button" onClick={() => handleRemovePerk(i)}>
                        <X className="w-3 h-3 text-amber-700" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: GUIDED PHOTO UPLOADER & 360° TOUR */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-900">Step 4: Guided Photos & 360° Virtual Tour</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real photos of Bed, Bathroom, and Balcony eliminate 90% of guest call inquiries.
                </p>
              </div>

              {/* 3 Guided Photo Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Slot 1: Main Bed */}
                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-indigo-600" />
                    <span>1. Bed & Room</span>
                  </span>
                  <div className="aspect-[4/3] rounded-xl bg-slate-200 overflow-hidden relative border border-slate-300">
                    <img src={bedPhotoUrl} alt="Bed Preview" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={bedPhotoUrl}
                    onChange={(e) => setBedPhotoUrl(e.target.value)}
                    placeholder="Bed Image URL"
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-[10px]"
                  />
                </div>

                {/* Slot 2: Bathroom */}
                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5 text-indigo-600" />
                    <span>2. Clean Bathroom</span>
                  </span>
                  <div className="aspect-[4/3] rounded-xl bg-slate-200 overflow-hidden relative border border-slate-300">
                    <img src={bathroomPhotoUrl} alt="Bath Preview" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={bathroomPhotoUrl}
                    onChange={(e) => setBathroomPhotoUrl(e.target.value)}
                    placeholder="Bathroom Image URL"
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-[10px]"
                  />
                </div>

                {/* Slot 3: Balcony */}
                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>3. Balcony / View</span>
                  </span>
                  <div className="aspect-[4/3] rounded-xl bg-slate-200 overflow-hidden relative border border-slate-300">
                    <img src={balconyPhotoUrl} alt="Balcony Preview" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={balconyPhotoUrl}
                    onChange={(e) => setBalconyPhotoUrl(e.target.value)}
                    placeholder="Balcony Image URL"
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white text-[10px]"
                  />
                </div>
              </div>

              {/* 360 Panorama URL Slot */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400 animate-spin" />
                  <span className="text-xs font-bold text-amber-300">360° Interactive Virtual Room Tour URL</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Allows guests to rotate 360° on the booking site via Pannellum viewer.
                </p>
                <input
                  type="text"
                  value={panorama360Url}
                  onChange={(e) => setPanorama360Url(e.target.value)}
                  placeholder="https://pannellum.org/images/alma.jpg"
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* STEP 5: COLLAPSIBLE ADVANCED SETTINGS */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-black text-slate-900">Step 5: Review & Advanced Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm your room category setup before publishing.
                </p>
              </div>

              {/* Summary Review Card */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-indigo-950">{categoryName}</h4>
                  <span className="text-[10px] bg-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded">
                    {selectedTemplate}
                  </span>
                </div>
                <div className="text-xs text-indigo-900 space-y-1">
                  <p>• Room Units: <b>{roomNumbers.join(", ")}</b> ({roomNumbers.length} cloned units)</p>
                  <p>• AC Tariff: <b>₹{baseTariffAc}</b> / night • Non-AC: <b>₹{baseTariffNonAc}</b></p>
                  <p>• Bathroom: <b>{bathroomLocation}</b> with <b>{toiletType}</b> commode & <b>{hotWaterType}</b></p>
                </div>
              </div>

              {/* Collapsible Advanced Settings Tile */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full p-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">⚙️ Advanced Settings (Weekend Surge, Child Policy)</span>
                  </div>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvanced && (
                  <div className="p-4 space-y-4 bg-white border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Weekend Surge (%)</label>
                        <input
                          type="number"
                          value={weekendSurgePercent}
                          onChange={(e) => setWeekendSurgePercent(Number(e.target.value))}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Minimum Stay (Nights)</label>
                        <input
                          type="number"
                          value={minNights}
                          onChange={(e) => setMinNights(Number(e.target.value))}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={childStayFreeUnder6}
                          onChange={(e) => setChildStayFreeUnder6(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                        <span>Children under 6 stay free with existing bedding</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={managerRateEditAllowed}
                          onChange={(e) => setManagerRateEditAllowed(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600"
                        />
                        <span>Allow authorized Manager to override tariff at POS</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between shrink-0 gap-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Create Category & Deploy Cloned Rooms</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
