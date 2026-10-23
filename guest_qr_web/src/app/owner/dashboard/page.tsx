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
  const [isEmergencyFrozen, setIsEmergencyFrozen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any | null>(null);
  const [waiveExtraMattress, setWaiveExtraMattress] = useState(false);
  const [checkoutCompleteMessage, setCheckoutCompleteMessage] = useState<string | null>(null);

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
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
              Owner PMS Desk
            </span>
            <span className="text-xs text-slate-500">• Malvan, Maharashtra</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-0.5">Konkan Kinara Beach Resort</h1>
        </div>
        <Link
          href="/"
          className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"
        >
          Exit to Hub
        </Link>
      </div>

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

      {checkoutCompleteMessage && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-900">
          <p className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {checkoutCompleteMessage}
          </p>
          <button onClick={() => setCheckoutCompleteMessage(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ✕
          </button>
        </div>
      )}

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
