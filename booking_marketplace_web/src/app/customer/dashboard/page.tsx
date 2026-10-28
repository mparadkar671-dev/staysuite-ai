"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  QrCode,
  ShieldCheck,
  Star,
  UtensilsCrossed,
  ArrowRight,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function CustomerDashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [phoneOrEmail, setPhoneOrEmail] = useState("9820123456");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("482910");
  const [activeTab, setActiveTab] = useState<"bookings" | "receipt" | "review">("bookings");

  // Review state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState(
    "Amazing authentic Malvani Surmai thali! The AC room was super clean and checking in took under 30 seconds."
  );
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Mock booking data
  const currentBooking = {
    bookingId: "BK-KK-8921",
    bookingToken: "tok_konkan_sample_456",
    propertyName: "Konkan Kinara Beach Homestay",
    businessCode: "SS-HM-1001",
    roomType: "Deluxe Sea-Facing AC (Room 101)",
    checkIn: "2026-10-24 12:00 PM",
    checkOut: "2026-10-26 10:00 AM",
    guestsCount: 2,
    totalTariff: 7000,
    advancePaid: 3500, // 50% UPI advance
    balanceDue: 3500,
    upiVpa: "resort@okhdfcbank",
    status: "CONFIRMED_50_PERCENT_ADVANCE",
    foodCutoffHoursRemaining: 18,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
              SS
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              Guest <span className="text-indigo-600">Portal</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/explore"
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 px-3 py-1.5"
            >
              Explore Stays
            </Link>
            {isLoggedIn ? (
              <button
                onClick={() => setIsLoggedIn(false)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => setIsLoggedIn(true)}
                className="text-xs bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-lg"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl lg:max-w-5xl mx-auto w-full px-4 sm:px-6 pt-5 pb-16 flex-1 space-y-5">
        {!isLoggedIn ? (
          /* Customer Login Card */
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 mt-6">
            <div className="text-center space-y-1">
              <h1 className="text-lg font-black text-slate-900">Access Your Bookings</h1>
              <p className="text-xs text-slate-500">
                Enter your mobile number or email to receive instant 1-tap OTP login.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mobile Number or Email</label>
                <input
                  type="text"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  placeholder="e.g. 9820123456"
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none font-medium"
                />
              </div>

              {otpSent && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-3 border border-indigo-300 bg-indigo-50/30 rounded-xl outline-none font-mono text-center tracking-widest font-black text-sm"
                  />
                  <span className="text-[10px] text-emerald-600 block mt-1">
                    Demo OTP: <b>{otp}</b> (auto-filled)
                  </span>
                </div>
              )}

              <button
                onClick={() => {
                  if (!otpSent) setOtpSent(true);
                  else setIsLoggedIn(true);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md shadow-indigo-600/20"
              >
                {otpSent ? "Verify OTP & View Booking" : "Send 6-Digit OTP"}
              </button>
            </div>
          </div>
        ) : (
          /* Logged In Customer Dashboard */
          <div className="space-y-4">
            {/* Header Greeting */}
            <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                  Verified Guest Portal
                </span>
                <h1 className="text-base font-extrabold mt-0.5">Welcome, Rahul Deshmukh</h1>
                <p className="text-[11px] text-indigo-200/80">Booking Reference: {currentBooking.bookingId}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-black border border-white/20">
                RD
              </div>
            </div>

            {/* Sub-Tabs */}
            <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold gap-1">
              <button
                onClick={() => setActiveTab("bookings")}
                className={`flex-1 py-2 rounded-lg transition ${
                  activeTab === "bookings" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
                }`}
              >
                Live Booking Status
              </button>
              <button
                onClick={() => setActiveTab("receipt")}
                className={`flex-1 py-2 rounded-lg transition ${
                  activeTab === "receipt" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
                }`}
              >
                Booking Receipt
              </button>
              <button
                onClick={() => setActiveTab("review")}
                className={`flex-1 py-2 rounded-lg transition ${
                  activeTab === "review" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
                }`}
              >
                Verified Review
              </button>
            </div>

            {/* TAB 1: Live Booking Status */}
            {activeTab === "bookings" && (
              <div className="space-y-3.5">
                {/* Confirmation Badge Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 50% ADVANCE CONFIRMED
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 font-bold">
                      {currentBooking.businessCode}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900">{currentBooking.propertyName}</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{currentBooking.roomType}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Check-In</span>
                      <span className="font-bold text-slate-800">{currentBooking.checkIn}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Check-Out</span>
                      <span className="font-bold text-slate-800">{currentBooking.checkOut}</span>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Room Charge</span>
                      <span className="font-bold">₹{currentBooking.totalTariff}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>50% Advance Paid (Direct UPI)</span>
                      <span>-₹{currentBooking.advancePaid}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-extrabold pt-1 border-t border-slate-200">
                      <span>Balance Due at Check-In</span>
                      <span>₹{currentBooking.balanceDue}</span>
                    </div>
                  </div>
                </div>

                {/* Fresh Food Pre-Order Card (Homestay Special Condition) */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm space-y-2.5 text-amber-950">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-amber-700" />
                      <h3 className="text-xs font-black text-amber-900">24-Hr Fresh Fish Pre-Order Rule</h3>
                    </div>
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {currentBooking.foodCutoffHoursRemaining}h cut-off left
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Our homestay buys fresh catch directly from Malvan harbor based on confirmed guest orders. Please submit your dinner meal selection before the cut-off.
                  </p>
                  <Link
                    href={`/menu/${currentBooking.bookingToken}`}
                    className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition"
                  >
                    <span>Pre-Order Seafood & Veg Thali</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Walk-in QR Fast Check-in */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 shadow-sm flex items-center justify-between text-xs">
                  <div>
                    <h3 className="font-bold text-indigo-900">Express 30-Sec Digital Check-in</h3>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      Upload your Aadhaar with automatic on-device privacy masking before arriving.
                    </p>
                  </div>
                  <Link
                    href={`/checkin/${currentBooking.bookingToken}`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow-sm shrink-0"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Check-In</span>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB 2: Downloadable Booking Receipt */}
            {activeTab === "receipt" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      Official Booking Receipt
                    </span>
                    <h2 className="text-sm font-black text-slate-900">{currentBooking.bookingId}</h2>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Host Business</span>
                    <span className="font-bold">{currentBooking.propertyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Host UPI VPA</span>
                    <span className="font-mono font-bold text-indigo-600">{currentBooking.upiVpa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Accommodation</span>
                    <span className="font-bold">{currentBooking.roomType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Check-in / Check-out</span>
                    <span className="font-medium">24 Oct - 26 Oct 2026 (2 Nights)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Status</span>
                    <span className="text-emerald-700 font-bold">50% Advance Verified (₹3,500)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-900">Homestay Policy Summary:</p>
                  <p>• Check-in time: 12:00 PM | Check-out time: 10:00 AM</p>
                  <p>• Driver bed available at ₹300/night (on request).</p>
                  <p>• Homestay is 100% compliant with local Police Form-C / Aadhaar KYC.</p>
                </div>
              </div>
            )}

            {/* TAB 3: Post-Checkout Verified Review */}
            {activeTab === "review" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-extrabold text-slate-900">Submit a Verified Guest Review</h2>
                  <p className="text-xs text-slate-500">
                    Only guests with confirmed checkouts on StaySuite AI can submit reviews.
                  </p>
                </div>

                {reviewSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl text-center space-y-1.5">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold">Thank you for your review!</p>
                    <p className="text-[11px] text-emerald-700">
                      Your verified review is now live on the public marketplace storefront.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">Overall Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="p-1 hover:scale-110 transition"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= rating ? "text-amber-500 fill-amber-500" : "text-slate-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Your Experience & Food Feedback</label>
                      <textarea
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-xl outline-none font-medium text-xs"
                      />
                    </div>

                    <button
                      onClick={() => setReviewSubmitted(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md shadow-indigo-600/20"
                    >
                      Post Verified Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
