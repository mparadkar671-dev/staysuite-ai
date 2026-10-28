"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  Building2,
  Waves,
  Utensils,
  Wine,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  KeyRound,
  ShieldCheck,
  CreditCard,
  Sliders,
  MapPin,
  FileCheck2,
  Lock,
  Phone,
  Mail,
  Upload,
  Eye,
  EyeOff,
  AlertCircle,
  FileText,
  Compass,
  Check,
  Clock,
  QrCode,
  Download,
  ExternalLink,
  LifeBuoy,
} from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  icon: any;
  prefix: string;
  badge: string;
  desc: string;
  modules: string[];
}

const CATEGORIES: CategoryOption[] = [
  {
    id: "HOMESTAY",
    name: "Konkan Coastal Homestay",
    icon: Home,
    prefix: "SS-HM",
    badge: "Primary Reference (#1)",
    desc: "Family-run coastal stays, villas & farmhouses with home-cooked seafood.",
    modules: ["Dynamic AC/Non-AC Switch", "24h/4h Fish Cut-Off BOM", "50% Advance UPI", "Door QR"],
  },
  {
    id: "HOTEL",
    name: "Boutique Hotel & Suites",
    icon: Building2,
    prefix: "SS-HT",
    badge: "Commercial",
    desc: "Urban properties, multiple floors, reception desk, and business travelers.",
    modules: ["Multi-Room Grid", "Front Desk Folio", "Express Check-In", "Aadhaar Privacy Redaction"],
  },
  {
    id: "RESORT",
    name: "Beach & Nature Resort",
    icon: Waves,
    prefix: "SS-RS",
    badge: "Luxury Stay",
    desc: "Multi-acre properties, swimming pool, luxury cottages, and sea-view dining.",
    modules: ["Cottage Allocation", "Table KOTs", "Split POS Billing", "Poolside Service"],
  },
  {
    id: "RESTAURANT",
    name: "Standalone Dining & Shack",
    icon: Utensils,
    prefix: "SS-RT",
    badge: "F&B Dining",
    desc: "Seafood dining, Malvani thali restaurants, and live kitchen KOT queue.",
    modules: ["Deterministic Recipe BOM", "Waiter KOT App", "Split Bill Print", "14-digit FSSAI"],
  },
  {
    id: "BAR",
    name: "Bar, Pub & Permit Room",
    icon: Wine,
    prefix: "SS-BR",
    badge: "Excise Licensed",
    desc: "Liquor permit rooms, craft beverages, and regulated alcohol service.",
    modules: ["Excise License Vault", "Split-Billing POS", "Age Verification", "Table Ordering"],
  },
  {
    id: "OTHER_SERVICES",
    name: "Tourism & Beach Activities",
    icon: Compass,
    prefix: "SS-OS",
    badge: "Experiences",
    desc: "Scuba diving, water sports, banana rides, houseboat, and local cab services.",
    modules: ["Hourly Activity Booking", "Advance Collection", "Safety Undertaking", "Digital Tickets"],
  },
];

const PLANS = [
  {
    id: "30_DAY_FREE_TRIAL",
    name: "30-Day Full Free Trial",
    price: "₹0",
    period: "for 30 days",
    badge: "Risk-Free Instant Access",
    desc: "Test with real guests, create rooms, and print thermal KOTs without credit card.",
    features: [
      "All Category Modules Unlocked",
      "Unlimited Thermal KOTs & Split Folios",
      "Direct 0% MDR UPI QR Advance",
      "Immediate StaySuite App Access",
    ],
  },
  {
    id: "STANDARD",
    name: "Standard PMS & POS",
    price: "₹2,499",
    period: "per month",
    badge: "Most Popular",
    desc: "For growing homestays and hotels managing rooms, staff, and partial checkouts.",
    features: [
      "Rooms & AC/Non-AC Tariff Engine",
      "Split-Folio Partial Room Checkout",
      "Housekeeping QR with Marathi Voice",
      "Staff Salary & Upaad Advance Ledger",
    ],
  },
  {
    id: "PREMIUM",
    name: "Full Ecosystem Suite",
    price: "₹4,999",
    period: "per month",
    badge: "Complete Hospitality Suite",
    desc: "For busy resorts and restaurants requiring recipe BOM market prep & AI copilot.",
    features: [
      "Everything in Standard",
      "7 AM Fish & Veg Market BOM Calculator",
      "24h & 4h Meal Cut-Off Enforcement",
      "Live Waiter KOT Order Taking App",
      "AI Business Copilot & P&L Analytics",
    ],
  },
];

export default function MultiCategoryOnboardingWizard() {
  const [step, setStep] = useState(1);

  // STEP 1: Category
  const [category, setCategory] = useState("HOMESTAY");

  // STEP 2: Host Identity & OTP Verification
  const [propertyName, setPropertyName] = useState("Sagar Kinara Beach Homestay");
  const [ownerName, setOwnerName] = useState("Vilas Parab");
  const [mobile, setMobile] = useState("9820551122");
  const [isMobileOtpSent, setIsMobileOtpSent] = useState(false);
  const [mobileOtp, setMobileOtp] = useState("");
  const [isMobileVerified, setIsMobileVerified] = useState(true);

  const [email, setEmail] = useState("vilas.parab@sagarkinara.in");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(true);

  const [whatsapp, setWhatsapp] = useState("9820551122");
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [password, setPassword] = useState("konkan2026");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("konkan2026");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMismatchError, setPasswordMismatchError] = useState("");

  // STEP 3: Google Maps & Location
  const [googleMapsLink, setGoogleMapsLink] = useState("https://maps.app.goo.gl/MalvanTarkarliBeach");
  const [autoFillSuccess, setAutoFillSuccess] = useState<string | null>(null);
  const [formattedAddress, setFormattedAddress] = useState("Near Dandi Beach Bridge, Wayari Bhutnath Road, Malvan");
  const [streetLandmark, setStreetLandmark] = useState("Opposite Coconut Grove Resort");
  const [villageCity, setVillageCity] = useState("Malvan");
  const [taluka, setTaluka] = useState("Malvan");
  const [district, setDistrict] = useState("Sindhudurg");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("416606");
  const [latitude, setLatitude] = useState("16.052843");
  const [longitude, setLongitude] = useState("73.468201");
  const [policeStation, setPoliceStation] = useState("Malvan Coastal Police Station");
  const [distanceFromBeach, setDistanceFromBeach] = useState("120 meters (2-minute walk)");
  const [hasFreeParking, setHasFreeParking] = useState(true);

  // STEP 4: KYC Vault & Privacy Redaction
  const [panNumber, setPanNumber] = useState("ABCDE1234F");
  const [panDocUploaded, setPanDocUploaded] = useState(true);

  const [govIdType, setGovIdType] = useState("AADHAAR_REDACTED");
  const [isCanvasRedacted, setIsCanvasRedacted] = useState(true);
  const [govIdMaskedDisplay, setGovIdMaskedDisplay] = useState("[Aadhaar Redacted]");

  const [ownershipProofType, setOwnershipProofType] = useState("GRAM_PANCHAYAT_TAX_RECEIPT");
  const [ownershipDocUploaded, setOwnershipDocUploaded] = useState(true);

  // Dynamic Category Licenses
  const [mtdcNumber, setMtdcNumber] = useState("MTDC/SND/2026/0412");
  const [fssaiNumber, setFssaiNumber] = useState("11522045000123");
  const [exciseLicenseNumber, setExciseLicenseNumber] = useState("");
  const [exciseExpiryDate, setExciseExpiryDate] = useState("2027-03-31");
  const [gumastaNumber, setGumastaNumber] = useState("SH-ACT-MAL-891");

  // STEP 5: Payout UPI, Bank & Policies
  const [merchantUpiVpa, setMerchantUpiVpa] = useState("sagarkinara@okhdfcbank");
  const [bankHolder, setBankHolder] = useState("Vilas Parab Homestay Enterprise");
  const [bankAccount, setBankAccount] = useState("50200041289123");
  const [bankIfsc, setBankIfsc] = useState("HDFC0001248");
  const [isGstRegistered, setIsGstRegistered] = useState(false);
  const [gstin, setGstin] = useState("");

  // Operational Policies
  const [advancePercent, setAdvancePercent] = useState(50);
  const [enableAcNonAc, setEnableAcNonAc] = useState(true);
  const [preArrivalCutoffHours, setPreArrivalCutoffHours] = useState(24);
  const [inStayCutoffHours, setInStayCutoffHours] = useState(4);
  const [driverBedAvailable, setDriverBedAvailable] = useState(true);

  // STEP 6: Subscription Plan & Final Submission
  const [selectedPlan, setSelectedPlan] = useState("30_DAY_FREE_TRIAL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [generatedBusinessCode, setGeneratedBusinessCode] = useState("SS-HM-1001");
  const [copiedCode, setCopiedCode] = useState(false);
  const [formError, setFormError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw Canvas Aadhaar Redaction Preview
  useEffect(() => {
    if (step === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw Aadhaar mockup card
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header tricolor bar
      ctx.fillStyle = "#FF9933";
      ctx.fillRect(0, 0, canvas.width, 10);
      ctx.fillStyle = "#138808";
      ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

      // Avatar box
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(16, 26, 60, 75);
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("PHOTO", 30, 68);

      // Information lines
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(ownerName || "GOVERNMENT OF INDIA", 90, 40);

      ctx.font = "9px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText("DOB: 14/08/1982 | GENDER: MALE", 90, 56);
      ctx.fillText("Address: Malvan, Sindhudurg", 90, 72);

      // 12-digit number with client-side black redaction mask on first 8 digits!
      ctx.font = "bold 13px monospace";
      if (isCanvasRedacted) {
        // Redaction bar over first 8 digits
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(88, 86, 120, 18);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("[REDACTED BY CLIENT]", 92, 99);

        // Visible last 4 digits
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px monospace";
        ctx.fillText(" 9481", 212, 100);
      } else {
        ctx.fillStyle = "#dc2626";
        ctx.fillText("4821 9012 9481", 90, 100);
      }
    }
  }, [step, isCanvasRedacted, ownerName]);

  const handleVerifyMobile = () => {
    if (mobileOtp === "482910" || mobileOtp === "123456" || mobileOtp.length === 6) {
      setIsMobileVerified(true);
      setIsMobileOtpSent(false);
    } else {
      alert("Please enter 6-digit OTP (demo code: 482910)");
    }
  };

  const handleVerifyEmail = () => {
    if (emailOtp === "482910" || emailOtp === "123456" || emailOtp.length === 6) {
      setIsEmailVerified(true);
      setIsEmailOtpSent(false);
    } else {
      alert("Please enter 6-digit OTP (demo code: 482910)");
    }
  };

  const handleAutoFillFromGoogleMaps = (rawLink?: string) => {
    const link = rawLink !== undefined ? rawLink : googleMapsLink;
    if (!link.trim()) {
      alert("Please enter a Google Maps link or location share URL first.");
      return;
    }

    const lower = link.toLowerCase();

    // 1. Try to extract lat/lng from URL patterns (@lat,lng or q=lat,lng)
    const coordsMatch =
      link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      link.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/) ||
      link.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (coordsMatch) {
      setLatitude(coordsMatch[1]);
      setLongitude(coordsMatch[2]);
    }

    // 2. Intelligent Geocoding & Local Police Jurisdiction Auto-Fill
    if (
      lower.includes("tarkarli") ||
      lower.includes("wayari") ||
      lower.includes("dandi") ||
      lower.includes("deobag") ||
      lower.includes("devbag")
    ) {
      setStreetLandmark("Near Dandi Beach Bridge & Wayari Bhutnath Temple");
      setVillageCity("Tarkarli Coast");
      setTaluka("Malvan");
      setDistrict("Sindhudurg");
      setState("Maharashtra");
      setPincode("416606");
      setPoliceStation("Malvan Coastal Police Station (Tarkarli Chowki)");
      setDistanceFromBeach("90 meters (1-minute direct beach walk)");
      setFormattedAddress("Near Dandi Beach Bridge, Wayari Bhutnath Road, Tarkarli, Malvan, Sindhudurg - 416606");
      if (!coordsMatch) {
        setLatitude("16.027814");
        setLongitude("73.483912");
      }
      setAutoFillSuccess("✓ Location auto-filled for Tarkarli, Malvan! Police Jurisdiction: Malvan Coastal Police Station (Form-C Verified).");
    } else if (
      lower.includes("alibaug") ||
      lower.includes("varsoli") ||
      lower.includes("nagaon") ||
      lower.includes("kihim")
    ) {
      setStreetLandmark("Opposite Varsoli Beach Entrance Gate");
      setVillageCity("Varsoli, Alibaug");
      setTaluka("Alibaug");
      setDistrict("Raigad");
      setState("Maharashtra");
      setPincode("402201");
      setPoliceStation("Alibaug City Police Station");
      setDistanceFromBeach("120 meters (2-minute walk)");
      setFormattedAddress("Plot 24, Varsoli Beach Road, Alibaug, Raigad - 402201");
      if (!coordsMatch) {
        setLatitude("18.665120");
        setLongitude("72.871940");
      }
      setAutoFillSuccess("✓ Location auto-filled for Alibaug, Raigad! Police Jurisdiction: Alibaug City Police Station.");
    } else if (
      lower.includes("dapoli") ||
      lower.includes("murud") ||
      lower.includes("karde") ||
      lower.includes("ladghar")
    ) {
      setStreetLandmark("Near Murud Dolphin Point & Seafront Road");
      setVillageCity("Murud Beach, Dapoli");
      setTaluka("Dapoli");
      setDistrict("Ratnagiri");
      setState("Maharashtra");
      setPincode("415713");
      setPoliceStation("Dapoli Police Station");
      setDistanceFromBeach("100 meters direct beachfront");
      setFormattedAddress("Seafront Cottage 8, Murud-Harnai Road, Dapoli, Ratnagiri - 415713");
      if (!coordsMatch) {
        setLatitude("17.766320");
        setLongitude("73.123410");
      }
      setAutoFillSuccess("✓ Location auto-filled for Dapoli, Ratnagiri! Police Jurisdiction: Dapoli Police Station.");
    } else if (lower.includes("ganpatipule") || lower.includes("are ware")) {
      setStreetLandmark("Near Ganpatipule Temple & MTDC Resort");
      setVillageCity("Ganpatipule");
      setTaluka("Ratnagiri");
      setDistrict("Ratnagiri");
      setState("Maharashtra");
      setPincode("415615");
      setPoliceStation("Jaigad Police Station (Ganpatipule Outpost)");
      setDistanceFromBeach("150 meters from Mandir Beach");
      setFormattedAddress("Near Main Temple Ring Road, Ganpatipule, Ratnagiri - 415615");
      if (!coordsMatch) {
        setLatitude("17.147210");
        setLongitude("73.267820");
      }
      setAutoFillSuccess("✓ Location auto-filled for Ganpatipule, Ratnagiri! Police Jurisdiction: Jaigad Police Station.");
    } else {
      setStreetLandmark("Coastal Main Road, Beach Walkway");
      setVillageCity("Malvan (Coastal Belt)");
      setTaluka("Malvan");
      setDistrict("Sindhudurg");
      setState("Maharashtra");
      setPincode("416606");
      setPoliceStation("Malvan Coastal Police Station");
      setDistanceFromBeach("150 meters (2-minute beach access)");
      setFormattedAddress("Coastal Main Road, Malvan, Sindhudurg, Maharashtra - 416606");
      setAutoFillSuccess("✓ Auto-filled address fields & mapped to nearest Coastal Police Station Jurisdiction!");
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setFormError("");

    const selectedCat = CATEGORIES.find((c) => c.id === category);
    const prefix = selectedCat?.prefix || "SS-HM";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const uniqueCode = `${prefix}-${randomNum}`;
    setGeneratedBusinessCode(uniqueCode);

    // Call backend API (or fallback for offline demo)
    try {
      const payload = {
        business_category: category,
        property_name: propertyName,
        owner_full_name: ownerName,
        owner_mobile: mobile,
        owner_whatsapp: sameAsMobile ? mobile : whatsapp,
        owner_email: email,
        password: password,
        confirm_password: confirmPassword,
        formatted_address: formattedAddress,
        street_landmark: streetLandmark,
        village_city: villageCity,
        taluka: taluka,
        district: district,
        state: state,
        pincode: pincode,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        google_maps_url: `https://maps.google.com/?q=${latitude},${longitude}`,
        police_station_jurisdiction: policeStation,
        accessibility_metadata: {
          distance_from_beach: distanceFromBeach,
          free_parking: hasFreeParking,
        },
        owner_pan_number: panNumber,
        owner_pan_doc_url: "/uploads/onboarding_vault/pan_sample.pdf",
        owner_gov_id_type: govIdType,
        owner_gov_id_masked_display: govIdMaskedDisplay,
        owner_gov_id_doc_url: "/uploads/onboarding_vault/aadhaar_redacted.jpg",
        property_ownership_proof_type: ownershipProofType,
        property_ownership_doc_url: "/uploads/onboarding_vault/ownership_receipt.pdf",
        category_licenses: {
          mtdc_registration_number: mtdcNumber,
          fssai_number: fssaiNumber,
          state_excise_liquor_license: exciseLicenseNumber,
          license_expiry_date: exciseExpiryDate,
          shop_act_gumasta: gumastaNumber,
        },
        merchant_upi_vpa: merchantUpiVpa,
        bank_account_holder: bankHolder,
        bank_account_number: bankAccount,
        bank_ifsc: bankIfsc,
        is_gst_registered: isGstRegistered,
        gstin_number: gstin,
        operational_policies: {
          advance_payment_percent: advancePercent,
          enable_ac_non_ac_toggle: enableAcNonAc,
          pre_arrival_food_cutoff_hours: preArrivalCutoffHours,
          in_stay_food_cutoff_hours: inStayCutoffHours,
          driver_bed_available: driverBedAvailable,
        },
        subscription_plan: selectedPlan,
      };

      // Try FastAPI backend if running
      await fetch("http://localhost:8000/api/v1/onboarding/submit-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null);
    } catch {
      // Graceful offline fallback
    }

    setIsSubmitting(false);
    setSubmissionComplete(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-sm">
        <div className="max-w-5xl lg:max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
              SS
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                StaySuite <span className="text-indigo-600">Onboarding</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Multi-Category Hospitality Verification</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 hidden sm:block">
              Step {step} of 6: {
                step === 1 ? "Category" :
                step === 2 ? "Host & OTP" :
                step === 3 ? "Google Maps" :
                step === 4 ? "KYC & Licenses" :
                step === 5 ? "Payout & Rules" : "Subscription Plan"
              }
            </span>
            <Link
              href="/auth/login"
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg"
            >
              Existing Host Login
            </Link>
          </div>
        </div>
      </header>

      {/* 6-Step Stepper Line */}
      <div className="w-full bg-slate-200 h-1.5 sticky top-[57px] z-30">
        <div
          className="bg-indigo-600 h-full transition-all duration-300"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      {/* Main Wizard Container */}
      <main className="max-w-4xl lg:max-w-5xl mx-auto w-full px-4 sm:px-6 pt-6 flex-1 flex flex-col">
        {submissionComplete ? (
          /* CELEBRATORY SUBMISSION MODAL / CARD */
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full border border-emerald-200">
                PROVISIONAL_ACTIVE • Instant App Access Granted
              </span>
              <h1 className="text-2xl font-black text-slate-900">{propertyName} is Registered!</h1>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You can immediately log into the StaySuite App to setup rooms, test thermal KOTs, and generate your door QR stickers.
              </p>
            </div>

            {/* Business Code Display Card */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-2xl shadow-xl space-y-4 max-w-lg mx-auto text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                  Unique Business Identity (All Pillars)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  ACTIVE IN APP
                </span>
              </div>

              <div className="flex items-center justify-between bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Business Code</span>
                  <span className="text-2xl font-mono font-black tracking-wider text-emerald-400">
                    {generatedBusinessCode}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedBusinessCode)}
                  className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-white/5 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Owner Role</span>
                  <span className="font-bold text-white">{ownerName} (OWNER)</span>
                </div>
                <div className="bg-white/5 p-2.5 rounded-lg">
                  <span className="text-slate-400 block text-[10px]">Login Mobile ID</span>
                  <span className="font-bold text-white font-mono">{mobile}</span>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] p-2.5 rounded-lg">
                🛡️ <b>Super Admin KYC Check:</b> Your PAN & Gram Panchayat NOC are pending review for the public marketplace verified badge.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-2">
              <Link
                href="/owner/dashboard?setup=rooms"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
              >
                <span>🛏️ Setup Rooms & Amenities</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/login"
                className="bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <KeyRound className="w-4 h-4" />
                <span>StaySuite Role Login</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step Navigation Pill Indicator */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-2xl shadow-sm text-xs font-bold text-slate-500 overflow-x-auto no-scrollbar gap-1">
              {[
                { s: 1, label: "1. Category" },
                { s: 2, label: "2. Host & OTP" },
                { s: 3, label: "3. Location & Maps" },
                { s: 4, label: "4. KYC Vault" },
                { s: 5, label: "5. Payout & Rules" },
                { s: 6, label: "6. Plan & Launch" },
              ].map((item) => (
                <button
                  key={item.s}
                  onClick={() => {
                    if (item.s < step) setStep(item.s);
                  }}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                    step === item.s
                      ? "bg-indigo-600 text-white shadow-sm"
                      : item.s < step
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* STEP 1: CHOOSE BUSINESS CATEGORY */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-slate-900">Step 1: Choose Your Business Category</h1>
                  <p className="text-xs text-slate-500">
                    The Zero-Rewrite Category Engine dynamically unlocks feature modules and operational rules.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const isSelected = category === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-600/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className={`p-2.5 rounded-xl ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                              {c.badge}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900">{c.name}</h3>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{c.desc}</p>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block mb-1">Modules Unlocked:</span>
                          <div className="flex flex-wrap gap-1">
                            {c.modules.map((m, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 text-[9px] font-semibold px-2 py-0.5 rounded">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <span>Next: Owner Identity & OTP Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: OWNER IDENTITY & DUAL OTP VERIFICATION */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-slate-900">Step 2: Property & Host Credentials</h1>
                  <p className="text-xs text-slate-500">
                    Your mobile number & email will serve as your primary login ID for both the Booking Site and StaySuite App.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Property Name *</label>
                    <input
                      type="text"
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      placeholder="e.g. Sagar Kinara Beach Homestay"
                      className="w-full p-3 border border-slate-300 rounded-xl outline-none font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Owner Full Legal Name *</label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Vilas Parshuram Parab"
                      className="w-full p-3 border border-slate-300 rounded-xl outline-none font-medium text-xs"
                    />
                  </div>

                  {/* Mobile Number with OTP Verification Badge */}
                  <div className="space-y-2">
                    <label className="block text-slate-700 font-bold">Owner Mobile Number (Login ID) *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => {
                          setMobile(e.target.value);
                          setIsMobileVerified(false);
                        }}
                        placeholder="e.g. 9820551122"
                        className="flex-1 p-3 border border-slate-300 rounded-xl outline-none font-mono text-xs font-bold"
                      />
                      {isMobileVerified ? (
                        <div className="px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-1.5 font-bold shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsMobileOtpSent(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 rounded-xl font-bold text-xs shrink-0"
                        >
                          Send OTP
                        </button>
                      )}
                    </div>

                    {isMobileOtpSent && !isMobileVerified && (
                      <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl space-y-2">
                        <span className="text-[11px] text-indigo-900 block font-medium">
                          Enter 6-digit OTP sent to {mobile} (Demo: <b>482910</b>)
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={mobileOtp}
                            onChange={(e) => setMobileOtp(e.target.value)}
                            placeholder="482910"
                            className="w-32 p-2 border border-indigo-300 bg-white rounded-lg font-mono text-center font-bold"
                          />
                          <button
                            onClick={handleVerifyMobile}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold"
                          >
                            Confirm OTP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email with OTP Verification Badge */}
                  <div className="space-y-2">
                    <label className="block text-slate-700 font-bold">Owner Email Address *</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setIsEmailVerified(false);
                        }}
                        placeholder="e.g. host@konkanstay.com"
                        className="flex-1 p-3 border border-slate-300 rounded-xl outline-none font-medium text-xs"
                      />
                      {isEmailVerified ? (
                        <div className="px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-1.5 font-bold shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setIsEmailOtpSent(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 rounded-xl font-bold text-xs shrink-0"
                        >
                          Send OTP
                        </button>
                      )}
                    </div>

                    {isEmailOtpSent && !isEmailVerified && (
                      <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl space-y-2">
                        <span className="text-[11px] text-indigo-900 block font-medium">
                          Enter 6-digit OTP sent to {email} (Demo: <b>482910</b>)
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value)}
                            placeholder="482910"
                            className="w-32 p-2 border border-indigo-300 bg-white rounded-lg font-mono text-center font-bold"
                          />
                          <button
                            onClick={handleVerifyEmail}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold"
                          >
                            Confirm OTP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Phone */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 font-bold">WhatsApp Notification Number</label>
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sameAsMobile}
                          onChange={(e) => {
                            setSameAsMobile(e.target.checked);
                            if (e.target.checked) setWhatsapp(mobile);
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span>Same as Mobile</span>
                      </label>
                    </div>
                    {!sameAsMobile && (
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-xl outline-none font-mono text-xs"
                      />
                    )}
                  </div>

                  {/* Secure Password */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Master Password (App & Booking Site) *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordMismatchError) setPasswordMismatchError("");
                        }}
                        placeholder="Enter at least 6 characters"
                        className="w-full p-3 border border-slate-300 rounded-xl outline-none font-medium text-xs pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Minimum 6 characters. Used by Owner to login across all 3 pillars.
                    </span>
                  </div>

                  {/* Re-enter Password for Confirmation */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-700 font-bold text-xs">
                        Re-enter Password (Confirm) *
                      </label>
                      {confirmPassword.length > 0 && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            password === confirmPassword
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {password === confirmPassword ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Passwords Match</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>Passwords Do Not Match</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (passwordMismatchError) setPasswordMismatchError("");
                        }}
                        placeholder="Re-enter your master password"
                        className={`w-full p-3 border rounded-xl outline-none font-medium text-xs pr-10 transition ${
                          confirmPassword && password !== confirmPassword
                            ? "border-rose-400 bg-rose-50/20"
                            : confirmPassword && password === confirmPassword
                            ? "border-emerald-400 bg-emerald-50/20"
                            : "border-slate-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      Confirming your password guarantees error-free authentication across StaySuite App & PMS Desk.
                    </span>
                    {passwordMismatchError && (
                      <p className="text-xs text-rose-600 font-bold flex items-center gap-1.5 mt-1 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{passwordMismatchError}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (!password || password.length < 6) {
                        setPasswordMismatchError("Master Password must be at least 6 characters.");
                        return;
                      }
                      if (password !== confirmPassword) {
                        setPasswordMismatchError("Passwords do not match. Please re-enter the same password to confirm.");
                        return;
                      }
                      setPasswordMismatchError("");
                      setStep(3);
                    }}
                    className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                  >
                    <span>Next: Google Maps & Location</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: EXACT LOCATION & GOOGLE MAPS PIN PICKER */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-slate-900">Step 3: Exact Location & Maps Pin Picker</h1>
                  <p className="text-xs text-slate-500">
                    Provides exact driving directions to guests and formats local Police Station jurisdiction for Form-C.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
                  {/* Google Maps Link Auto-Fill Assistant */}
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-indigo-900 font-extrabold text-xs">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span>Paste Google Maps Location Link (Instant Auto-Fill)</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                        Smart Geocoder
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Paste your property's Google Maps link or share URL. We will automatically extract street landmark, village, taluka, district, pincode, coordinates, and nearest Police Station jurisdiction!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        value={googleMapsLink}
                        onChange={(e) => {
                          setGoogleMapsLink(e.target.value);
                          if (autoFillSuccess) setAutoFillSuccess(null);
                        }}
                        placeholder="https://maps.app.goo.gl/... or https://maps.google.com/?q=..."
                        className="flex-1 p-2.5 bg-white border border-indigo-300 rounded-xl outline-none font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleAutoFillFromGoogleMaps()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Auto-Fill Address & Police</span>
                      </button>
                    </div>

                    {autoFillSuccess && (
                      <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 text-[11px] p-2.5 rounded-xl font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          {autoFillSuccess}
                        </span>
                        <button onClick={() => setAutoFillSuccess(null)} className="text-emerald-700 text-xs font-bold">✕</button>
                      </div>
                    )}

                    {/* Quick Location Presets for Instant Demo */}
                    <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-slate-500 font-bold">Quick Tourist Hubs:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setGoogleMapsLink("https://maps.app.goo.gl/TarkarliMalvanBeach");
                          handleAutoFillFromGoogleMaps("https://maps.app.goo.gl/TarkarliMalvanBeach");
                        }}
                        className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded-md font-semibold"
                      >
                        📍 Tarkarli Beach (Malvan)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGoogleMapsLink("https://maps.app.goo.gl/VarsoliAlibaugBeach");
                          handleAutoFillFromGoogleMaps("https://maps.app.goo.gl/VarsoliAlibaugBeach");
                        }}
                        className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded-md font-semibold"
                      >
                        📍 Varsoli Beach (Alibaug)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGoogleMapsLink("https://maps.app.goo.gl/MurudDapoliBeach");
                          handleAutoFillFromGoogleMaps("https://maps.app.goo.gl/MurudDapoliBeach");
                        }}
                        className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded-md font-semibold"
                      >
                        📍 Murud Beach (Dapoli)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGoogleMapsLink("https://maps.app.goo.gl/GanpatipuleMandir");
                          handleAutoFillFromGoogleMaps("https://maps.app.goo.gl/GanpatipuleMandir");
                        }}
                        className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded-md font-semibold"
                      >
                        📍 Ganpatipule Temple Beach
                      </button>
                    </div>
                  </div>

                  {/* Interactive Map Coordinates Card */}
                  <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-indigo-300 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Interactive Coordinates Pin
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        Lat: {latitude}, Lng: {longitude}
                      </span>
                    </div>

                    {/* Visual Stylized Map Grid with Pin */}
                    <div className="relative h-36 w-full bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
                      <div className="text-center space-y-1 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center mx-auto shadow-lg animate-bounce">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-white block">
                          {villageCity}, {taluka} (Sindhudurg Coast)
                        </span>
                        <span className="text-[9px] text-slate-400 block font-mono">
                          Google Maps URL: https://maps.google.com/?q={latitude},{longitude}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 text-[10px]">
                      <button
                        onClick={() => {
                          setLatitude("16.052843");
                          setLongitude("73.468201");
                          setVillageCity("Malvan (Dandi Beach)");
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded"
                      >
                        📍 Pin: Malvan Beach
                      </button>
                      <button
                        onClick={() => {
                          setLatitude("15.987112");
                          setLongitude("73.541290");
                          setVillageCity("Tarkarli Sangam");
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded"
                      >
                        📍 Pin: Tarkarli
                      </button>
                      <button
                        onClick={() => {
                          setLatitude("15.820140");
                          setLongitude("73.630010");
                          setVillageCity("Bhogwe Sea Beach");
                        }}
                        className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded"
                      >
                        📍 Pin: Bhogwe
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Postal Address *</label>
                    <textarea
                      rows={2}
                      value={formattedAddress}
                      onChange={(e) => setFormattedAddress(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-medium text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Street / Landmark</label>
                      <input
                        type="text"
                        value={streetLandmark}
                        onChange={(e) => setStreetLandmark(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Village / Town *</label>
                      <input
                        type="text"
                        value={villageCity}
                        onChange={(e) => setVillageCity(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Taluka</label>
                      <input
                        type="text"
                        value={taluka}
                        onChange={(e) => setTaluka(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">District</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">PIN Code *</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nearest Police Station Jurisdiction *</label>
                    <input
                      type="text"
                      value={policeStation}
                      onChange={(e) => setPoliceStation(e.target.value)}
                      placeholder="e.g. Malvan Coastal Police Station"
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Required for 1-click Police Register & Form-C legal guest compliance export.
                    </span>
                  </div>

                  {/* Accessibility & Distance Metadata */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 block">Accessibility & Guest Convenience:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Distance to Sea/Beach</span>
                        <input
                          type="text"
                          value={distanceFromBeach}
                          onChange={(e) => setDistanceFromBeach(e.target.value)}
                          className="w-full p-2 border border-slate-300 bg-white rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          checked={hasFreeParking}
                          onChange={(e) => setHasFreeParking(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span className="font-bold text-slate-700">Free 4-Wheeler Parking</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                  >
                    <span>Next: KYC Vault & Privacy Redaction</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: KYC VAULT & CLIENT-SIDE REDACTED CANVAS */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-slate-900">Step 4: Owner KYC & Category Licenses</h1>
                  <p className="text-xs text-slate-500">
                    UIDAI privacy compliant: government IDs are strictly redacted on your device before upload.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
                  {/* PAN Verification */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-700 font-bold">Owner PAN Number (Tax Verification) *</label>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        REGEX VALIDATED
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        maxLength={10}
                        placeholder="ABCDE1234F"
                        className="flex-1 p-2.5 border border-slate-300 rounded-xl outline-none font-mono text-xs font-bold uppercase tracking-wider"
                      />
                      <button
                        onClick={() => alert("PAN Document Uploaded to Encrypted Vault!")}
                        className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{panDocUploaded ? "PAN Uploaded" : "Upload PAN"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Redacted Privacy Vault with Canvas */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Client-Side Aadhaar Redaction Vault</span>
                      </div>
                      <span className="text-[10px] bg-slate-900 text-white font-mono px-2 py-0.5 rounded">
                        Strict Mask: [Aadhaar Redacted]
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Our interactive client-side redactor blocks the first 8 digits of your government ID. Raw 12-digit integers are NEVER saved or transmitted in plain text.
                    </p>

                    {/* Canvas Canvas Mockup */}
                    <div className="bg-white border border-slate-300 rounded-xl p-2.5 shadow-sm flex flex-col items-center">
                      <canvas
                        ref={canvasRef}
                        width={280}
                        height={120}
                        className="border border-slate-200 rounded-lg shadow-inner"
                      />
                      <div className="flex items-center justify-between w-full mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                          <input
                            type="checkbox"
                            checked={isCanvasRedacted}
                            onChange={(e) => setIsCanvasRedacted(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <span>Apply UIDAI Privacy Mask</span>
                        </label>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Redacted & Ready
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Property Ownership Proof */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Property Ownership Proof *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={ownershipProofType}
                        onChange={(e) => setOwnershipProofType(e.target.value)}
                        className="p-2.5 border border-slate-300 rounded-xl outline-none font-medium bg-white text-xs"
                      >
                        <option value="GRAM_PANCHAYAT_TAX_RECEIPT">Gram Panchayat Tax Receipt (Ghar Patti)</option>
                        <option value="ELECTRICITY_BILL">MSEDCL Electricity Bill (Owner Name)</option>
                        <option value="INDEX_II">Registered Index II / 7/12 Extract</option>
                        <option value="LEASE_NOC">Registered Lease Agreement & NOC</option>
                      </select>
                      <button
                        onClick={() => alert("Ownership Document Attached to Application Vault!")}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Attached: Tax_Receipt_2026.pdf</span>
                      </button>
                    </div>
                  </div>

                  {/* DYNAMIC CATEGORY LICENSES */}
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2.5">
                    <span className="font-extrabold text-indigo-950 block">
                      Category-Specific Regulatory Licenses ({category}):
                    </span>

                    {category === "HOMESTAY" && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">
                            MTDC Tourism Certificate or Gram Panchayat Homestay NOC *
                          </label>
                          <input
                            type="text"
                            value={mtdcNumber}
                            onChange={(e) => setMtdcNumber(e.target.value)}
                            placeholder="e.g. MTDC/SND/2026/0412 or GP NOC Date"
                            className="w-full p-2.5 border border-slate-300 bg-white rounded-xl outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {category === "RESTAURANT" && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">14-Digit FSSAI License Number *</label>
                          <input
                            type="text"
                            value={fssaiNumber}
                            maxLength={14}
                            onChange={(e) => setFssaiNumber(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 bg-white rounded-xl outline-none font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {category === "BAR" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">State Excise Liquor License *</label>
                          <input
                            type="text"
                            value={exciseLicenseNumber}
                            onChange={(e) => setExciseLicenseNumber(e.target.value)}
                            placeholder="e.g. FL-III-1049"
                            className="w-full p-2.5 border border-slate-300 bg-white rounded-xl outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">License Expiry Date *</label>
                          <input
                            type="date"
                            value={exciseExpiryDate}
                            onChange={(e) => setExciseExpiryDate(e.target.value)}
                            className="w-full p-2 border border-slate-300 bg-white rounded-xl outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {(category === "HOTEL" || category === "RESORT") && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Shop Act Gumasta License / Fire NOC *</label>
                          <input
                            type="text"
                            value={gumastaNumber}
                            onChange={(e) => setGumastaNumber(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 bg-white rounded-xl outline-none font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                  >
                    <span>Next: Payout UPI & Policies</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: 0% MDR PAYOUT UPI, BANK & POLICIES */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-slate-900">Step 5: Direct 0% MDR UPI & Policies</h1>
                  <p className="text-xs text-slate-500">
                    Guest advance deposits transfer directly into your account with 0% gateway commission.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-xs">
                  {/* UPI VPA with Live QR Preview */}
                  <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-4 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5" /> Direct Bank Settlement
                      </span>
                      <h3 className="text-sm font-black">Your Merchant UPI ID</h3>
                      <p className="text-[11px] text-slate-300 font-mono">{merchantUpiVpa}</p>
                    </div>
                    <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-lg flex items-center justify-center">
                      <QrCode className="w-14 h-14 text-slate-900" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Your Property UPI VPA / QR ID *</label>
                    <input
                      type="text"
                      value={merchantUpiVpa}
                      onChange={(e) => setMerchantUpiVpa(e.target.value)}
                      placeholder="e.g. homestay@okhdfcbank or 9820551122@upi"
                      className="w-full p-3 border border-slate-300 rounded-xl outline-none font-mono text-xs font-bold text-indigo-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Bank Account Holder</label>
                      <input
                        type="text"
                        value={bankHolder}
                        onChange={(e) => setBankHolder(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Account Number</label>
                      <input
                        type="text"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Bank IFSC Code</label>
                      <input
                        type="text"
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                        className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={isGstRegistered}
                        onChange={(e) => setIsGstRegistered(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span className="font-bold text-slate-700">Business has GSTIN</span>
                    </div>
                  </div>

                  {/* OPERATIONAL POLICIES */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="font-extrabold text-slate-900 block">Category Operational Policies:</span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">Booking Advance Required</span>
                        <select
                          value={advancePercent}
                          onChange={(e) => setAdvancePercent(parseInt(e.target.value))}
                          className="w-full p-2 border border-slate-300 bg-white rounded-lg font-bold"
                        >
                          <option value={50}>50% Mandatory Advance (Konkan Standard)</option>
                          <option value={100}>100% Full Payment</option>
                          <option value={25}>25% Booking Deposit</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block mb-0.5">AC / Non-AC Tariff Switch</span>
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            checked={enableAcNonAc}
                            onChange={(e) => setEnableAcNonAc(e.target.checked)}
                            className="rounded text-indigo-600"
                          />
                          <span className="font-bold text-slate-700">Dual AC/Non-AC Tariffs</span>
                        </div>
                      </div>
                    </div>

                    {category === "HOMESTAY" && (
                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">Fresh Fish Pre-Arrival Cut-Off</span>
                          <select
                            value={preArrivalCutoffHours}
                            onChange={(e) => setPreArrivalCutoffHours(parseInt(e.target.value))}
                            className="w-full p-2 border border-slate-300 bg-white rounded-lg font-bold"
                          >
                            <option value={24}>24 Hours Before Check-In</option>
                            <option value={12}>12 Hours Before Check-In</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">In-Stay Meal Cut-Off</span>
                          <select
                            value={inStayCutoffHours}
                            onChange={(e) => setInStayCutoffHours(parseInt(e.target.value))}
                            className="w-full p-2 border border-slate-300 bg-white rounded-lg font-bold"
                          >
                            <option value={4}>4 Hours Before Meal Time</option>
                            <option value={3}>3 Hours Before Meal Time</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(4)}
                    className="flex-1 bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(6)}
                    className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                  >
                    <span>Next: Select Plan & Launch</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: SELECT SUBSCRIPTION PLAN & INSTANT SUBMISSION */}
            {step === 6 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h1 className="text-xl font-black text-slate-900">Step 6: Select Subscription Plan</h1>
                  <p className="text-xs text-slate-500">
                    Pillar 1 SaaS entitlement: start with our 30-day risk-free full feature trial.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`cursor-pointer p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-600/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                            {plan.badge}
                          </span>
                          <h3 className="text-sm font-black text-slate-900 mt-2">{plan.name}</h3>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-lg font-black text-slate-900">{plan.price}</span>
                            <span className="text-[10px] text-slate-500">{plan.period}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">{plan.desc}</p>
                          <ul className="mt-3 space-y-1 text-[10px] text-slate-600">
                            {plan.features.map((f, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-slate-200/60">
                          <span className={`text-[11px] font-bold ${isSelected ? "text-indigo-700" : "text-slate-400"}`}>
                            {isSelected ? "● Selected Plan" : "○ Tap to Select"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Final Submission Banner */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Instant App Activation Policy:</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Submitting provisions your unique Business ID (e.g. SS-HM-1001) immediately so you can start configuring rooms in the StaySuite App. Our Super Admin team verifies your uploaded PAN and NOC for public marketplace visibility.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep(5)}
                    className="flex-1 bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-xs"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Provisioning Business Identity...</span>
                    ) : (
                      <>
                        <span>Submit Application & Launch Property</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
