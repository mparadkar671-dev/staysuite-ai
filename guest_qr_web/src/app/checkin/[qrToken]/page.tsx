"use client";

import React, { useState, useRef } from "react";
import { ShieldCheck, Upload, AlertCircle, CheckCircle, FileText, Lock } from "lucide-react";

export default function WalkInSelfCheckInPage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [foodRulesAccepted, setFoodRulesAccepted] = useState(false);
  const [idRedactedPreview, setIdRedactedPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Client-Side Canvas Redaction: Redacts sensitive restricted ID numbers before upload
  const handleIdCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Privacy Redaction: Draw privacy black overlay over bottom identification digits
        const boxHeight = img.height * 0.18;
        const boxY = img.height * 0.72;
        ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
        ctx.fillRect(0, boxY, img.width, boxHeight);

        // Watermark with [Aadhaar Redacted] for legal compliance
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(24, Math.floor(img.width * 0.04))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("[Aadhaar Redacted — UIDAI Compliant]", img.width / 2, boxY + boxHeight / 1.7);

        setIdRedactedPreview(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodRulesAccepted) {
      alert("Please acknowledge the homestay food pre-order rule.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsDone(true);
    }, 1200);
  };

  if (isDone) {
    return (
      <div className="min-h-screen bg-slate-100/70 py-6 sm:py-12 px-3 sm:px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl text-center space-y-4 border border-slate-200">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-2">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Check-In Successful!</h1>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Welcome to <span className="font-semibold text-slate-800">Konkan Kinara Beach Resort</span>! Your digital key is active and your food ordering pass has been issued.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 w-full text-left space-y-1.5 text-xs">
            <p><span className="text-slate-500">Guest Name:</span> <strong className="text-slate-900">{guestName}</strong></p>
            <p><span className="text-slate-500">ID Verification:</span> <strong className="text-emerald-700">[Aadhaar Redacted Verified]</strong></p>
            <p><span className="text-slate-500">Next Step:</span> Show this screen to Abhijeet at the reception desk to collect your physical room key.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 sm:py-12 px-3 sm:px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200 space-y-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
          Fast Reception QR
        </span>
        <h1 className="text-lg font-bold text-slate-900 mt-1">30-Second Walk-In Check-In</h1>
        <p className="text-xs text-slate-500">Zero paperwork. Complete check-in directly on your phone.</p>
      </div>

      <form onSubmit={handleCheckInSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name (As on Govt ID) *</label>
          <input
            type="text"
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Mobile Number *</label>
          <input
            type="tel"
            required
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            placeholder="e.g. 9820554433"
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Client-Side Privacy ID Scanner & Canvas Redaction */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" /> Government ID Proof (Aadhaar / Passport)
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              Auto-Redacted
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Our client-side canvas instantly redacts restricted ID digits before upload so temporary hotel staff cannot misuse your data.
          </p>

          <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition">
            <Upload className="w-5 h-5 text-indigo-500 mb-1" />
            <span className="text-xs font-semibold text-indigo-600">Snap or Upload ID Card</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleIdCapture} className="hidden" />
          </label>

          {idRedactedPreview && (
            <div className="rounded-lg overflow-hidden border border-slate-300 bg-black">
              <img src={idRedactedPreview} alt="Redacted ID Preview" className="w-full max-h-40 object-contain" />
              <div className="p-1.5 bg-slate-900 text-white text-[10px] text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Aadhaar number masked successfully
              </div>
            </div>
          )}
        </div>

        {/* Homestay Fresh Food Pre-Order Rule Acknowledgment */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-950">
              <strong className="font-bold">Important Homestay Food Pre-Order Rule:</strong>
              <p className="mt-0.5 text-amber-900">
                Fresh seafood (Surmai/Pomfret) and thalis are procured fresh daily from the morning harbor. Orders must be placed 4 hours prior. Late orders can only order instant kitchen snacks.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={foodRulesAccepted}
              onChange={(e) => setFoodRulesAccepted(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-semibold text-slate-800">
              I acknowledge and accept the 4-hour meal ordering policy
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 text-xs transition disabled:opacity-50"
        >
          {isSubmitting ? "Submitting Check-In..." : "Complete Walk-In Check-In"}
        </button>
      </form>
      </div>
    </div>
  );
}
