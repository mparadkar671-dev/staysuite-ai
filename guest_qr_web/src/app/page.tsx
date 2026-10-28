"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Building2,
  Users,
  CheckCircle2,
  Utensils,
  CookingPot,
  Receipt,
  Layers,
  ArrowRight,
  LogOut,
  Sparkles,
  Zap,
  KeyRound,
  FileText,
  AlertTriangle,
  QrCode,
  Calendar,
  DollarSign,
  Coffee,
} from "lucide-react";
import MyWorkspaceTab from "@/components/MyWorkspaceTab";

// 7 Staff Roles and Pre-Registered People Identities
const ROLE_IDENTITIES: { [role: string]: { name: string; title: string; defaultSalary: number }[] } = {
  OWNER: [
    { name: "Abhijeet Gawde", title: "Property Owner & Host", defaultSalary: 50000 },
  ],
  ACCOUNTANT: [
    { name: "Neha Joshi", title: "Chartered Accountant & Tax Lead", defaultSalary: 28000 },
  ],
  MANAGER: [
    { name: "Suresh Kadam", title: "Front Desk & Operations Manager", defaultSalary: 22000 },
  ],
  WAITER: [
    { name: "Prasad Naik", title: "Head Waiter & Captain", defaultSalary: 15000 },
  ],
  COOK: [
    { name: "Vedika Gawde", title: "Head Coastal Cook", defaultSalary: 20000 },
    { name: "Sunita Patil", title: "Assistant Cook (Breakfast & Snacks)", defaultSalary: 14000 },
  ],
  STAFF_HOUSEKEEPING: [
    { name: "Ramesh Pawar", title: "Housekeeping Lead", defaultSalary: 13000 },
    { name: "Dattaram", title: "Room & Linen Attendant", defaultSalary: 12000 },
  ],
  HELPER: [
    { name: "Mahesh Shinde", title: "General Helper & Baggage", defaultSalary: 11000 },
  ],
};

const ROLES = [
  { id: "OWNER", label: "Owner & Partner", icon: "👑", desc: "Full P&L, Room Freeze, UTR Approvals & Police Register" },
  { id: "ACCOUNTANT", label: "Accountant", icon: "📊", desc: "GST Invoices, Customer Khata, Kirana P&L Audit" },
  { id: "MANAGER", label: "Manager", icon: "📋", desc: "Desk Check-In, F4 Partial Split Checkout, Leave Approval" },
  { id: "WAITER", label: "Waiter / Captain", icon: "🍽️", desc: "Mobile KOT Punching & Kitchen Pick-Up Alerts" },
  { id: "COOK", label: "Cook / Chef", icon: "🐟", desc: "Live KOT Screen & 7 AM BOM Market Calculator" },
  { id: "STAFF_HOUSEKEEPING", label: "Housekeeping Staff", icon: "🧹", desc: "1-Tap Room Cleaned, Audio Prompts, Maintenance" },
  { id: "HELPER", label: "General Helper", icon: "🧳", desc: "Luggage, Laundry & Property Upkeep" },
];

export default function StaySuiteBusinessOSMain() {
  // Session Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"LOGIN" | "SELF_SIGNUP">("LOGIN");

  // 4-Step Multi-Person Role Login State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [businessId, setBusinessId] = useState("SS-HM-1001");
  const [selectedRole, setSelectedRole] = useState("OWNER");
  const [selectedPerson, setSelectedPerson] = useState("Abhijeet Gawde");
  const [password, setPassword] = useState("admin123");
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Worker Self-Signup State
  const [signupBusinessId, setSignupBusinessId] = useState("SS-HM-1001");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupRole, setSignupRole] = useState("STAFF_HOUSEKEEPING");
  const [signupSubmitted, setSignupSubmitted] = useState(false);

  // Active workspace tab for logged in user
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"MAIN" | "MY_WORKSPACE">("MAIN");

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const identities = ROLE_IDENTITIES[roleId] || [];
    if (identities.length > 0) {
      setSelectedPerson(identities[0].name);
    }
    setStep(3);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
  };

  const handleSelfSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupSubmitted(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setStep(1);
    setActiveWorkspaceTab("MAIN");
  };

  // If NOT authenticated, render the 4-Step Multi-Person Role Login Flow & Dual Onboarding
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl mx-auto shadow-lg shadow-indigo-600/30">
              SS
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">StaySuite Business OS</h1>
            <p className="text-xs text-slate-400">
              Internal Property Operating System &bull; Port 3002
            </p>
          </div>

          {/* Dual Onboarding Mode Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setAuthMode("LOGIN")}
              className={`flex-1 py-2 rounded-lg transition ${
                authMode === "LOGIN" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              1. 4-Step Staff Login
            </button>
            <button
              onClick={() => setAuthMode("SELF_SIGNUP")}
              className={`flex-1 py-2 rounded-lg transition ${
                authMode === "SELF_SIGNUP" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              2. Worker Self-Signup
            </button>
          </div>

          {/* MODE 1: 4-Step Multi-Person Role Login */}
          {authMode === "LOGIN" && (
            <div className="space-y-5">
              {/* Step Indicator Progress Bar */}
              <div className="flex items-center justify-between text-[11px] font-extrabold uppercase text-slate-400 border-b border-slate-800 pb-2">
                <span className={step >= 1 ? "text-indigo-400" : ""}>1. Business ID</span>
                <span>&rarr;</span>
                <span className={step >= 2 ? "text-indigo-400" : ""}>2. Role</span>
                <span>&rarr;</span>
                <span className={step >= 3 ? "text-indigo-400" : ""}>3. Identity</span>
                <span>&rarr;</span>
                <span className={step >= 4 ? "text-indigo-400" : ""}>4. Password</span>
              </div>

              {/* STEP 1: Enter Business ID */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block">
                      Step 1: Enter Property Business ID (SS-XXXX)
                    </label>
                    <input
                      type="text"
                      value={businessId}
                      onChange={(e) => setBusinessId(e.target.value.toUpperCase())}
                      placeholder="e.g. SS-HM-1001"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 mt-1.5 text-sm font-mono font-black text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Default Homestay ID: <code className="text-indigo-400">SS-HM-1001</code> (Konkan Kinara)
                    </span>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
                  >
                    <span>Proceed to Select Role</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Select Exact Role */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Step 2: Select Your Staff Role ({businessId})
                    </span>
                    <button
                      onClick={() => setStep(1)}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Change Business ID
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {ROLES.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleRoleSelect(r.id)}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition ${
                          selectedRole === r.id
                            ? "bg-indigo-600/30 border-indigo-500 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <span className="text-xl">{r.icon}</span>
                        <div className="flex-1">
                          <h4 className="text-xs font-black">{r.label}</h4>
                          <p className="text-[10px] text-slate-400 leading-tight">{r.desc}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: Select Exact Person Identity */}
              {step === 3 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Step 3: Select Exact Person Identity ({selectedRole})
                    </span>
                    <button
                      onClick={() => setStep(2)}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Change Role
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(ROLE_IDENTITIES[selectedRole] || []).map((p) => (
                      <button
                        key={p.name}
                        onClick={() => {
                          setSelectedPerson(p.name);
                          setStep(4);
                        }}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                          selectedPerson === p.name
                            ? "bg-indigo-600/30 border-indigo-500 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div>
                          <h4 className="text-xs font-black text-white">{p.name}</h4>
                          <span className="text-[10px] text-slate-400">{p.title}</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-400">Select &rarr;</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: Password & Authentication */}
              {step === 4 && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-400 block tracking-wider">
                      Selected Persona:
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{selectedPerson}</span>
                      <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                        {selectedRole}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 mt-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex items-center justify-between mt-1.5 text-[10px]">
                      <span className="text-slate-500">Default dev pass: <code className="text-indigo-400">admin123</code></span>
                      <button
                        type="button"
                        onClick={() => setForgotPasswordModal(true)}
                        className="text-indigo-400 hover:underline"
                      >
                        Forgot Password (Email OTP)?
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="text-xs font-bold py-3 px-4 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition"
                    >
                      <span>Authorize &amp; Launch {selectedRole} Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 2: Worker Self-Signup */}
          {authMode === "SELF_SIGNUP" && (
            <div className="space-y-4">
              {signupSubmitted ? (
                <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-5 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-black text-white">Self-Signup Submitted!</h3>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    Status: <strong className="text-white">PENDING_OWNER_APPROVAL</strong>.
                    Owner Abhijeet Gawde has received your request. You can log in once approved.
                  </p>
                  <button
                    onClick={() => {
                      setSignupSubmitted(false);
                      setAuthMode("LOGIN");
                    }}
                    className="mt-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSelfSignup} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Property Business ID</label>
                    <input
                      type="text"
                      required
                      value={signupBusinessId}
                      onChange={(e) => setSignupBusinessId(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 mt-1 text-xs font-mono font-bold text-white uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Dattaram Parab"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 mt-1 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Mobile Number (For WhatsApp Alerts)</label>
                    <input
                      type="tel"
                      required
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="e.g. 9820123456"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 mt-1 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Applying Role</label>
                    <select
                      value={signupRole}
                      onChange={(e) => setSignupRole(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 mt-1 text-xs text-white focus:outline-none"
                    >
                      <option value="STAFF_HOUSEKEEPING">Housekeeping Staff</option>
                      <option value="HELPER">General Helper</option>
                      <option value="WAITER">Waiter / Captain</option>
                      <option value="COOK">Assistant Cook</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition mt-2"
                  >
                    Submit for Owner Approval (Pending Status)
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Forgot Password OTP Modal */}
          {forgotPasswordModal && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-3">
                <h3 className="text-sm font-black text-white">Reset Staff Password via Email OTP</h3>
                <p className="text-xs text-slate-400">
                  We will send a 6-digit OTP code to the registered email for {selectedPerson}.
                </p>
                {otpSent ? (
                  <div className="space-y-2">
                    <span className="text-xs text-emerald-400 font-bold block">OTP code sent to email!</span>
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white"
                    />
                    <button
                      onClick={() => {
                        alert("Password reset verified!");
                        setForgotPasswordModal(false);
                      }}
                      className="w-full bg-indigo-600 text-white font-bold text-xs py-2 rounded-xl"
                    >
                      Verify OTP &amp; Reset
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setForgotPasswordModal(false)}
                      className="flex-1 border border-slate-700 text-slate-300 text-xs py-2 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setOtpSent(true)}
                      className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2 rounded-xl"
                    >
                      Send OTP
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If AUTHENTICATED: Render StaySuite Business OS Workspaces tailored to Role
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col pb-20">
      {/* Top Operations Executive Pulse Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white px-4 sm:px-6 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
              SS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">{businessId} &bull; Konkan Kinara</span>
                <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                  {selectedRole}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Active Identity: {selectedPerson}</span>
            </div>
          </div>

          {/* Fitts's Law Oversized High-Frequency Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveWorkspaceTab("MAIN")}
              className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition ${
                activeWorkspaceTab === "MAIN" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              Operational Desk
            </button>
            <button
              onClick={() => setActiveWorkspaceTab("MY_WORKSPACE")}
              className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition ${
                activeWorkspaceTab === "MY_WORKSPACE" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              My Workspace (Self-Service)
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* If user clicked "My Workspace", show the Universal Self-Service for EVERY role */}
        {activeWorkspaceTab === "MY_WORKSPACE" ? (
          <MyWorkspaceTab
            personName={selectedPerson}
            role={selectedRole}
            baseSalary={(ROLE_IDENTITIES[selectedRole] || [])[0]?.defaultSalary || 18000}
          />
        ) : (
          /* Role-Specific Workspaces according to Hick's Law */
          <div className="space-y-6">
            {/* WORKSPACE 1: OWNER & ACCOUNTANT */}
            {(selectedRole === "OWNER" || selectedRole === "ACCOUNTANT") && (
              <div className="space-y-6">
                {/* Executive Pulse Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                      Today's Revenue
                    </span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">₹28,500</span>
                    <span className="text-[10px] text-emerald-700 font-bold">100% Occupancy (6/6 Rooms)</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                      Pending UTR Verifications
                    </span>
                    <span className="text-xl font-black text-amber-600 mt-1 block">1 Booking</span>
                    <span className="text-[10px] text-slate-500">₹3,500 50% Advance UTR #482910</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                      Daily Cash Expenses (BOM)
                    </span>
                    <span className="text-xl font-black text-rose-700 mt-1 block">- ₹4,200</span>
                    <span className="text-[10px] text-slate-500">Fish Market ₹3,100 + Kirana ₹1,100</span>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-800 block tracking-wider">
                      Estimated Net P&amp;L Today
                    </span>
                    <span className="text-xl font-black text-emerald-900 mt-1 block">+ ₹24,300</span>
                    <span className="text-[10px] text-emerald-700 font-bold">85.2% Operating Margin</span>
                  </div>
                </div>

                {/* Direct Action Hub */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-black text-slate-900">
                        {selectedRole === "OWNER" ? "Owner Full Control Center" : "Accountant Financial Workspace"}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Room Grid, Decoupled Split Billing, Khata Credit Ledger, Expense Tracker &amp; Police Register
                      </p>
                    </div>
                    <Link
                      href="/owner/dashboard"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-md shadow-indigo-600/20"
                    >
                      <span>Open Full Interactive Desk</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-xs font-bold text-slate-800 block">📊 Property P&amp;L Statement</span>
                      <p className="text-[11px] text-slate-500">
                        Real-time revenue minus fish procurement, kirana, LPG and staff payroll.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-xs font-bold text-slate-800 block">⚡ Decoupled Split Billing</span>
                      <p className="text-[11px] text-slate-500">
                        Partial checkout room-by-room when large groups depart on different days.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                      <span className="text-xs font-bold text-slate-800 block">
                        🛡️ Legal Police Register {selectedRole === "OWNER" ? "(2FA Unlocked)" : "(PII Redacted)"}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Foreign Form-C &amp; Indian guest registers compliant with local law.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 2: MANAGER */}
            {selectedRole === "MANAGER" && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-black text-slate-900">
                        Front Desk Manager Operations &bull; Suresh Kadam
                      </h2>
                      <p className="text-xs text-slate-500">
                        Walk-In Check-In, UTR Verification, F4 Partial Split Billing, and Staff Duty Management
                      </p>
                    </div>
                    <Link
                      href="/owner/dashboard"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-md"
                    >
                      <span>Open Desk &rarr;</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                      <h4 className="text-xs font-black text-blue-950">Reception Walk-In QR</h4>
                      <p className="text-[11px] text-blue-800 mt-1">
                        Guests scan reception standee to auto-fill registration in 30 seconds.
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                      <h4 className="text-xs font-black text-amber-950">F4 Partial Split Checkout</h4>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Check out 1 room from a multi-room group booking without disturbing others.
                      </p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl">
                      <h4 className="text-xs font-black text-purple-950">Staff Leave Approvals</h4>
                      <p className="text-[11px] text-purple-800 mt-1">
                        Review leave applications from Cook Vedika and Housekeeping Ramesh.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 3: WAITER */}
            {selectedRole === "WAITER" && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-black text-slate-900">
                        Waiter Mobile KOT Pad &bull; Prasad Naik
                      </h2>
                      <p className="text-xs text-slate-500">
                        Punch food orders for room dining or garden tables, fire tickets directly to Cook Vedika.
                      </p>
                    </div>
                    <Link
                      href="/waiter"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-md shadow-emerald-600/20"
                    >
                      <span>Open Waiter Terminal &rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 4: COOK */}
            {selectedRole === "COOK" && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-black text-slate-900">
                        Cook Kitchen KOT &amp; 7 AM Market BOM &bull; Vedika Gawde
                      </h2>
                      <p className="text-xs text-slate-500">
                        Color-coded prep timers (Green/Amber/Red) + exact morning fish &amp; veg market procurement list.
                      </p>
                    </div>
                    <Link
                      href="/kitchen"
                      className="bg-amber-600 hover:bg-amber-500 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-md shadow-amber-600/20"
                    >
                      <span>Open Kitchen Screen &rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE 5: STAFF_HOUSEKEEPING & HELPER */}
            {(selectedRole === "STAFF_HOUSEKEEPING" || selectedRole === "HELPER") && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-black text-slate-900">
                        Housekeeping &amp; Room Cleaned Queue &bull; {selectedPerson}
                      </h2>
                      <p className="text-xs text-slate-500">
                        1-Tap [🟢 Room Cleaned] button, Behind-the-Door QR scanner, and Marathi/Hindi/English voice audio playback.
                      </p>
                    </div>
                    <Link
                      href="/staff/self-service"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-md"
                    >
                      <span>Open Cleaning Queue &rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
