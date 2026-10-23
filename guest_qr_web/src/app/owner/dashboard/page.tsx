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
} from "lucide-react";

export default function OwnerManagerDashboard() {
  const [activeTab, setActiveTab] = useState<"pms" | "superadmin">("pms");
  const [isEmergencyFrozen, setIsEmergencyFrozen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any | null>(null);
  const [waiveExtraMattress, setWaiveExtraMattress] = useState(false);
  const [checkoutCompleteMessage, setCheckoutCompleteMessage] = useState<string | null>(null);

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
    <div className="flex-1 flex flex-col p-4 space-y-5 bg-slate-50 min-h-screen pb-24">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
              activeTab === "pms" ? "text-indigo-700 bg-indigo-100" : "text-purple-700 bg-purple-100"
            }`}>
              {activeTab === "pms" ? "Pillar 3: Owner PMS Desk" : "Pillar 1: Super Admin Control Plane"}
            </span>
            <span className="text-xs text-slate-500">• Sindhudurg, Maharashtra</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-0.5">
            {activeTab === "pms" ? "Konkan Kinara Beach Resort" : "StaySuite Ecosystem Control Plane"}
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
              🏨 Property PMS
            </button>
            <button
              onClick={() => setActiveTab("superadmin")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === "superadmin" ? "bg-purple-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Super Admin KYC ({applications.filter(a => a.verificationStatus === "PROVISIONAL_ACTIVE").length} Pending)</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* Tab 2: Super Admin KYC Verification Pipeline (Pillar 1) */}
      {activeTab === "superadmin" && (
        <div className="space-y-5">
          {/* Super Admin SaaS Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Total Tenants</p>
              <p className="text-lg font-black text-purple-700">{applications.length}</p>
              <p className="text-[10px] text-slate-400">Multi-Category SaaS</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Pending KYC</p>
              <p className="text-lg font-black text-amber-600">
                {applications.filter((a) => a.verificationStatus === "PROVISIONAL_ACTIVE").length}
              </p>
              <p className="text-[10px] text-slate-400">Provisional Active</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Verified Marketplace</p>
              <p className="text-lg font-black text-emerald-600">
                {applications.filter((a) => a.verificationStatus === "PUBLIC_VERIFIED").length}
              </p>
              <p className="text-[10px] text-slate-400">Live on Booking Site</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Platform MRR</p>
              <p className="text-lg font-black text-slate-900">₹44,970</p>
              <p className="text-[10px] text-purple-600 font-semibold">100% Retained</p>
            </div>
          </div>

          {/* Verification Pipeline List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Property Onboarding & KYC Approval Queue
                </h2>
                <p className="text-xs text-slate-500">
                  Instant App Access (Provisional Active) allows hosts to configure rooms; Super Admin verification publishes to Public Booking Site.
                </p>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">
                Super Admin Gatekeeper
              </span>
            </div>

            <div className="space-y-4">
              {applications.map((app) => {
                const isPending = app.verificationStatus === "PROVISIONAL_ACTIVE";

                return (
                  <div
                    key={app.id}
                    className={`bg-white border-2 rounded-2xl p-5 shadow-sm space-y-4 transition ${
                      isPending ? "border-amber-300" : "border-slate-200"
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                            {app.businessCode}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {app.category}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                            Plan: {app.subscriptionPlan}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1">{app.propertyName}</h3>
                        <p className="text-xs text-slate-500">
                          {app.taluka}, {app.district} • Police Jurisdiction: <span className="font-semibold text-slate-700">{app.policeStation}</span> • Beach: {app.distanceBeach}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="text-right shrink-0">
                        {isPending ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="text-[11px] font-black text-amber-700 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              PROVISIONAL_ACTIVE
                            </span>
                            <span className="text-[10px] text-slate-500 mt-1">App: Live | Marketplace: Hidden</span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-end">
                            <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              PUBLIC_VERIFIED
                            </span>
                            <span className="text-[10px] text-emerald-700 font-bold mt-1">Live on Public Marketplace</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Owner & Location Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Host Identity (OTP Verified)</span>
                        <p className="font-bold text-slate-900">{app.ownerName}</p>
                        <p className="text-slate-600">{app.ownerMobile} • {app.ownerEmail}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">0% MDR Payout Config</span>
                        <p className="font-mono font-bold text-emerald-700">{app.upiVpa}</p>
                        <p className="text-slate-500">Advance Policy: {app.advancePaymentPercent}%</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Police Station Jurisdiction</span>
                        <p className="font-semibold text-slate-800">{app.policeStation}</p>
                        <p className="text-[10px] text-slate-400">Used for Form-C & Local Police Register</p>
                      </div>
                    </div>

                    {/* KYC Vault & Document Compliance Review */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        KYC Document Vault & Statutory Audit
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
                          <span className="text-[10px] text-slate-400 font-bold block">1. Owner PAN</span>
                          <span className="font-mono font-black text-slate-800">{app.panNumber}</span>
                          <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">✓ Regex Validated</span>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
                          <span className="text-[10px] text-slate-400 font-bold block">2. Govt ID (Redacted)</span>
                          <span className="font-mono font-bold text-indigo-700">{app.govIdMasked}</span>
                          <span className="text-[9px] text-slate-500 font-bold block mt-0.5">✓ UIDAI Privacy Compliant</span>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
                          <span className="text-[10px] text-slate-400 font-bold block">3. Property Ownership Proof</span>
                          <span className="font-semibold text-slate-800 line-clamp-1">{app.ownershipProof}</span>
                          <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">✓ File Uploaded</span>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-white">
                          <span className="text-[10px] text-slate-400 font-bold block">4. Category License</span>
                          <span className="font-semibold text-slate-800 line-clamp-1">{app.categoryLicense}</span>
                          <span className="text-[9px] text-indigo-600 font-bold block mt-0.5">✓ Tourism / Municipal NOC</span>
                        </div>
                      </div>
                    </div>

                    {/* Super Admin Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="text-[11px] text-slate-500">
                        {isPending ? (
                          <span>
                            ⚠️ Owner currently has <strong className="text-slate-800">Provisional App Access</strong>. Review documents and click verify to publish on public marketplace.
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">
                            ✓ This property is public, verified, and eligible for verified guest reviews.
                          </span>
                        )}
                      </div>

                      {isPending ? (
                        <button
                          onClick={() => handleVerifyProperty(app.id, app.businessCode)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition shrink-0"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>[ ✅ Verify & Publish ]</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Verified & Published
                          </span>
                          <Link
                            href="/explore"
                            className="text-xs font-bold text-indigo-600 hover:underline"
                          >
                            View on Marketplace →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
    </div>
  );
}
