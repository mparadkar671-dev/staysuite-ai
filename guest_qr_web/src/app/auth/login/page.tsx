"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Lock,
  Phone,
  ShieldCheck,
  User,
  Users,
  ArrowRight,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from "lucide-react";

interface RoleMember {
  id: string;
  name: string;
  role: string;
  roleTitle: string;
  avatar: string;
}

const SAMPLE_ROLES_PER_CAT: Record<string, string[]> = {
  HOMESTAY: ["OWNER", "MANAGER", "STAFF_HOUSEKEEPING", "COOK", "HELPER", "ACCOUNTANT"],
  RESORT: ["OWNER", "MANAGER", "STAFF_HOUSEKEEPING", "WAITER", "COOK", "HELPER", "ACCOUNTANT"],
  HOTEL: ["OWNER", "MANAGER", "STAFF_HOUSEKEEPING", "WAITER", "COOK", "HELPER", "ACCOUNTANT"],
  RESTAURANT: ["OWNER", "MANAGER", "WAITER", "COOK", "HELPER", "ACCOUNTANT"],
  BAR: ["OWNER", "MANAGER", "WAITER", "COOK", "HELPER", "ACCOUNTANT"],
};

const SAMPLE_MEMBERS: Record<string, RoleMember[]> = {
  OWNER: [
    { id: "usr-own-1", name: "Abhijeet Patil", role: "OWNER", roleTitle: "Property Owner & Founder", avatar: "AP" },
  ],
  MANAGER: [
    { id: "usr-mgr-1", name: "Santosh Naik", role: "MANAGER", roleTitle: "General Manager", avatar: "SN" },
  ],
  COOK: [
    { id: "usr-ck-1", name: "Vedika Patil", role: "COOK", roleTitle: "Head Konkan Seafood Chef", avatar: "VP" },
    { id: "usr-ck-2", name: "Suresh Gawde", role: "COOK", roleTitle: "Morning Thali & Breakfast Cook", avatar: "SG" },
  ],
  STAFF_HOUSEKEEPING: [
    { id: "usr-hk-1", name: "Deepak Kadam", role: "STAFF_HOUSEKEEPING", roleTitle: "Room 101-105 Clean Lead", avatar: "DK" },
    { id: "usr-hk-2", name: "Anita Mane", role: "STAFF_HOUSEKEEPING", roleTitle: "Linen & Floor Specialist", avatar: "AM" },
  ],
  WAITER: [
    { id: "usr-wt-1", name: "Ganesh Rane", role: "WAITER", roleTitle: "Deck Table Attendant", avatar: "GR" },
  ],
  HELPER: [
    { id: "usr-hl-1", name: "Pravin Parab", role: "HELPER", roleTitle: "Ground Maintenance & Buyer", avatar: "PP" },
  ],
  ACCOUNTANT: [
    { id: "usr-ac-1", name: "Ketan Shirke", role: "ACCOUNTANT", roleTitle: "Cash & Upaad Ledger Lead", avatar: "KS" },
  ],
};

export default function MultiPersonLoginPage() {
  const [activeMode, setActiveMode] = useState<"login" | "self-signup">("login");
  const [step, setStep] = useState(1);

  // Step 1: Business Code
  const [businessCode, setBusinessCode] = useState("SS-HM-1001");
  const [resolvedCategory, setResolvedCategory] = useState("HOMESTAY");
  const [propertyName, setPropertyName] = useState("Konkan Kinara Beach Homestay");

  // Step 2: Role
  const [selectedRole, setSelectedRole] = useState("COOK");

  // Step 3: Member Profile
  const [selectedMember, setSelectedMember] = useState<RoleMember | null>(null);

  // Step 4: Password & Auth
  const [password, setPassword] = useState("demo1234");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [authError, setAuthError] = useState("");

  // Forgot Password modal
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("staff@konkankinara.in");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotStep, setForgotStep] = useState(1);

  // Self-signup state
  const [signupName, setSignupName] = useState("");
  const [signupRole, setSignupRole] = useState("COOK");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPending, setSignupPending] = useState(false);

  const handleStep1Submit = () => {
    if (!businessCode.trim()) {
      setAuthError("Please enter a valid Business ID");
      return;
    }
    setAuthError("");
    setStep(2);
  };

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setStep(3);
  };

  const handleMemberSelect = (member: RoleMember) => {
    setSelectedMember(member);
    setStep(4);
  };

  const handleFinalLogin = () => {
    if (password.length < 4) {
      setAuthError("Password must be at least 4 characters");
      return;
    }
    setAuthError("");
    setLoginSuccess(true);
  };

  const activeRoles = SAMPLE_ROLES_PER_CAT[resolvedCategory] || SAMPLE_ROLES_PER_CAT["HOMESTAY"];
  const activeMembers = SAMPLE_MEMBERS[selectedRole] || [
    { id: "usr-gen-1", name: "Staff Member 1", role: selectedRole, roleTitle: "Operational Worker", avatar: "SM" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
              SS
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              StaySuite <span className="text-indigo-600">Identity</span>
            </span>
          </Link>
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => {
                setActiveMode("login");
                setStep(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeMode === "login" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
              }`}
            >
              4-Step Login
            </button>
            <button
              onClick={() => setActiveMode("self-signup")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeMode === "self-signup" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Worker Self-Signup
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md sm:max-w-lg mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-10 pb-16 flex-1 flex flex-col">
        {activeMode === "login" ? (
          /* 4-STEP IDENTITY LOGIN */
          <div className="space-y-4">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
              <span className={step >= 1 ? "text-indigo-600 font-extrabold" : ""}>1. Business</span>
              <span>→</span>
              <span className={step >= 2 ? "text-indigo-600 font-extrabold" : ""}>2. Role</span>
              <span>→</span>
              <span className={step >= 3 ? "text-indigo-600 font-extrabold" : ""}>3. Person</span>
              <span>→</span>
              <span className={step >= 4 ? "text-indigo-600 font-extrabold" : ""}>4. Pass</span>
            </div>

            {/* Error banner */}
            {authError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {loginSuccess ? (
              /* Success Redirection Card */
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Authenticated Successfully!</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Logged in as <b>{selectedMember?.name}</b> ({selectedRole})
                  </p>
                  <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mt-2 font-bold">
                    Tenant: {businessCode} | {resolvedCategory}
                  </span>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href={selectedRole === "COOK" ? "/kitchen" : (selectedRole === "OWNER" || selectedRole === "MANAGER") ? "/owner/dashboard" : "/staff/self-service"}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30"
                  >
                    <span>Open {selectedRole} Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/staff/self-service"
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs text-center"
                  >
                    View My Tasks & Salary/Upaad
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                {/* STEP 1: Enter Business ID */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-sm font-black text-slate-900">Step 1: Enter Business Code</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Provided during owner onboarding (e.g., SS-HM-1001)
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Business ID *</label>
                      <input
                        type="text"
                        value={businessCode}
                        onChange={(e) => setBusinessCode(e.target.value)}
                        placeholder="e.g. SS-HM-1001"
                        className="w-full p-3 border border-slate-300 rounded-xl outline-none font-mono text-sm font-bold uppercase tracking-wider text-indigo-600"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Recognized: {propertyName} ({resolvedCategory})
                      </span>
                    </div>

                    <button
                      onClick={handleStep1Submit}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                    >
                      <span>Next: Select Role</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* STEP 2: Select Role */}
                {step === 2 && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-black text-slate-900">Step 2: Select Role</h2>
                        <p className="text-[11px] text-slate-500">
                          Active roles for {resolvedCategory} in {businessCode}
                        </p>
                      </div>
                      <button
                        onClick={() => setStep(1)}
                        className="text-[11px] text-indigo-600 font-bold hover:underline"
                      >
                        Change ID
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {activeRoles.map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleSelect(role)}
                          className="p-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 text-left transition space-y-1"
                        >
                          <span className="text-xs font-black text-slate-900 block">{role.replace("_", " ")}</span>
                          <span className="text-[10px] text-slate-400 block">Tap to select person</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 3: Select Person */}
                {step === 3 && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-black text-slate-900">Step 3: Who is logging in?</h2>
                        <p className="text-[11px] text-slate-500">
                          Verified workers under <b>{selectedRole}</b>
                        </p>
                      </div>
                      <button
                        onClick={() => setStep(2)}
                        className="text-[11px] text-indigo-600 font-bold hover:underline"
                      >
                        Back
                      </button>
                    </div>

                    <div className="space-y-2">
                      {activeMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleMemberSelect(member)}
                          className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 flex items-center justify-between text-left transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                              {member.avatar}
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-900 block">{member.name}</span>
                              <span className="text-[10px] text-slate-500 block">{member.roleTitle}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: Password & Authentication */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                          {selectedMember?.avatar}
                        </div>
                        <div>
                          <h2 className="text-xs font-black text-slate-900">{selectedMember?.name}</h2>
                          <p className="text-[10px] text-slate-500">{selectedRole} • {businessCode}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setStep(3)}
                        className="text-[11px] text-indigo-600 font-bold hover:underline"
                      >
                        Change Person
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Enter Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-xl outline-none font-medium text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Demo password: demo1234</span>
                      <button
                        onClick={() => setShowForgotPw(true)}
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>

                    <button
                      onClick={handleFinalLogin}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authenticate & Open Dashboard</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* WORKER SELF-SIGNUP FLOW B */
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Worker Self-Signup (Flow B)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Join a property team. Your account will be submitted for 1-tap Owner approval.
              </p>
            </div>

            {signupPending ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-amber-600 mx-auto" />
                <h3 className="text-xs font-bold">Registration Submitted!</h3>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Status: <b className="text-amber-900">PENDING_OWNER_APPROVAL</b>. The property owner will receive an in-app notification to activate your account.
                </p>
                <button
                  onClick={() => {
                    setSignupPending(false);
                    setActiveMode("login");
                    setStep(1);
                  }}
                  className="mt-2 text-xs bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Business ID *</label>
                  <input
                    type="text"
                    value={businessCode}
                    onChange={(e) => setBusinessCode(e.target.value)}
                    placeholder="e.g. SS-HM-1001"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Role *</label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-medium bg-white"
                  >
                    <option value="COOK">Cook (Kitchen & Thali Prep)</option>
                    <option value="STAFF_HOUSEKEEPING">Staff / Housekeeping (Rooms)</option>
                    <option value="WAITER">Waiter (Orders & Delivery)</option>
                    <option value="HELPER">Helper (Ground & Maintenance)</option>
                    <option value="ACCOUNTANT">Accountant (Ledger & Cash)</option>
                    <option value="MANAGER">Manager (Check-ins & Approvals)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Vedika Patil"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="e.g. 9820556677"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Set Password *</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none font-medium"
                  />
                </div>

                <button
                  onClick={() => setSignupPending(true)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md shadow-indigo-600/20"
                >
                  Submit for Owner Approval
                </button>
              </div>
            )}
          </div>
        )}

        {/* FORGOT PASSWORD MODAL */}
        {showForgotPw && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-black text-slate-900">Reset Password (Email/OTP)</h3>
                <button
                  onClick={() => setShowForgotPw(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {forgotStep === 1 ? (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500 text-[11px]">
                    Enter your registered email address or mobile number to receive a 6-digit verification code.
                  </p>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Email or Mobile</label>
                    <input
                      type="text"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setForgotOtp("948123");
                      setForgotStep(2);
                    }}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl"
                  >
                    Send 6-Digit OTP
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500 text-[11px]">
                    Enter the OTP sent to <b>{forgotEmail}</b> (Demo code: <b>{forgotOtp}</b>)
                  </p>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">6-Digit Code</label>
                    <input
                      type="text"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      className="w-full p-2.5 border border-indigo-300 bg-indigo-50/30 rounded-xl outline-none font-mono text-center font-black tracking-widest text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowForgotPw(false);
                      setForgotStep(1);
                      alert("Password updated successfully! You can now log in.");
                    }}
                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl"
                  >
                    Confirm & Update Password
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
