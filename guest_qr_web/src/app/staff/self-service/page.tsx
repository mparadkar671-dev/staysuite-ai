"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  ListTodo,
  LogOut,
  Send,
  ShieldCheck,
  UserCheck,
  XCircle,
  Plus,
} from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: "NORMAL" | "URGENT";
  status: "PENDING" | "COMPLETED";
  due: string;
}

interface UpaadEntry {
  id: string;
  type: "ADVANCE" | "DEDUCTION";
  amount: number;
  date: string;
  note: string;
}

interface LeaveItem {
  id: string;
  start: string;
  end: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface PendingStaff {
  id: string;
  name: string;
  role: string;
  phone: string;
  appliedDate: string;
}

export default function EmployeeSelfServicePage() {
  const [activeTab, setActiveTab] = useState<"tasks" | "upaad" | "leaves" | "approvals">("tasks");

  // Current Staff Profile
  const [staffRole, setStaffRole] = useState<string>("COOK");
  const [staffName, setStaffName] = useState<string>("Vedika Patil");
  const baseSalary = 16000;

  // Tasks state
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: "tsk-1",
      title: "Prep Fresh Surmai & Pomfret Thali for Dinner (8 Guests)",
      description: "Clean fresh catch delivered at 4 PM harbor cutoff. Marinate with Malvani masala.",
      priority: "URGENT",
      status: "PENDING",
      due: "Today, 6:00 PM",
    },
    {
      id: "tsk-2",
      title: "Check Coconut & Kirana Spices Stock in Dry Store",
      description: "Note required ingredients for 7 AM morning fish/veg market run.",
      priority: "NORMAL",
      status: "COMPLETED",
      due: "Today, 3:00 PM",
    },
    {
      id: "tsk-3",
      title: "Sanitize Prep Counters & Cooking Utensils",
      description: "Follow Konkan coastal hygiene checklist before dinner rush.",
      priority: "NORMAL",
      status: "PENDING",
      due: "Today, 9:30 PM",
    },
  ]);

  // Upaad / Cash Advance ledger state
  const [upaadEntries, setUpaadEntries] = useState<UpaadEntry[]>([
    { id: "up-1", type: "ADVANCE", amount: 3000, date: "2026-10-12", note: "Family festival expenses (Diwali advance)" },
    { id: "up-2", type: "ADVANCE", amount: 1500, date: "2026-10-18", note: "Medical prescription medicine" },
  ]);

  // Leave Requests state
  const [leaves, setLeaves] = useState<LeaveItem[]>([
    { id: "lv-1", start: "2026-11-02", end: "2026-11-04", reason: "Family wedding at Kankavli", status: "APPROVED" },
    { id: "lv-2", start: "2026-11-18", end: "2026-11-19", reason: "Village festival (Jatra)", status: "PENDING" },
  ]);

  // Leave Form
  const [leaveStart, setLeaveStart] = useState("2026-11-25");
  const [leaveEnd, setLeaveEnd] = useState("2026-11-26");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);

  // Pending Staff Approvals (for Owner / Manager)
  const [pendingStaffList, setPendingStaffList] = useState<PendingStaff[]>([
    { id: "stf-app-1", name: "Pooja Sawant", role: "COOK", phone: "+91 9820443322", appliedDate: "2026-10-23" },
    { id: "stf-app-2", name: "Sachin Kadam", role: "STAFF_HOUSEKEEPING", phone: "+91 9820551100", appliedDate: "2026-10-23" },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === "PENDING" ? "COMPLETED" : "PENDING" } : t))
    );
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;
    const newLeave: LeaveItem = {
      id: `lv-${Date.now()}`,
      start: leaveStart,
      end: leaveEnd,
      reason: leaveReason,
      status: "PENDING",
    };
    setLeaves([newLeave, ...leaves]);
    setLeaveReason("");
    setLeaveSubmitted(true);
    setTimeout(() => setLeaveSubmitted(false), 3000);
  };

  const handleStaffApproval = (id: string, approve: boolean) => {
    setPendingStaffList((prev) => prev.filter((p) => p.id !== id));
    alert(`Staff account ${approve ? "APPROVED and ACTIVE" : "REJECTED"}!`);
  };

  const totalAdvance = upaadEntries.reduce((sum, e) => (e.type === "ADVANCE" ? sum + e.amount : sum - e.amount), 0);
  const netPendingWages = baseSalary - totalAdvance;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-20">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
            SS
          </div>
          <span className="font-extrabold text-base tracking-tight text-slate-900">
            Employee <span className="text-indigo-600">Self-Service</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-black text-slate-900 block">{staffName}</span>
            <span className="text-[10px] text-slate-500 font-mono">{staffRole} • Konkan Kinara</span>
          </div>
          <Link
            href="/auth/login"
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Switch Role</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-5 flex-1 space-y-4">
        {/* Profile / Role Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
              Universal Employee Portal
            </span>
            <h1 className="text-base font-extrabold mt-0.5">{staffName}</h1>
            <p className="text-[11px] text-indigo-200/80">Role: {staffRole.replace("_", " ")} | Konkan Kinara (SS-HM-1001)</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={staffRole}
              onChange={(e) => {
                setStaffRole(e.target.value);
                if (e.target.value === "OWNER") setStaffName("Abhijeet Patil");
                else if (e.target.value === "COOK") setStaffName("Vedika Patil");
                else setStaffName("Deepak Kadam");
              }}
              className="bg-white/10 border border-white/20 text-white text-xs font-bold p-2 rounded-xl outline-none"
            >
              <option value="COOK" className="text-slate-900">Cook (Vedika)</option>
              <option value="STAFF_HOUSEKEEPING" className="text-slate-900">Staff / Housekeeping (Deepak)</option>
              <option value="WAITER" className="text-slate-900">Waiter (Ganesh)</option>
              <option value="OWNER" className="text-slate-900">Owner / Manager (Abhijeet)</option>
            </select>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 py-2 px-3 rounded-lg whitespace-nowrap transition ${
              activeTab === "tasks" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            My Tasks ({tasks.filter((t) => t.status === "PENDING").length})
          </button>
          <button
            onClick={() => setActiveTab("upaad")}
            className={`flex-1 py-2 px-3 rounded-lg whitespace-nowrap transition ${
              activeTab === "upaad" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            Salary & Upaad
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`flex-1 py-2 px-3 rounded-lg whitespace-nowrap transition ${
              activeTab === "leaves" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
            }`}
          >
            Leave Requests
          </button>
          {(staffRole === "OWNER" || staffRole === "MANAGER") && (
            <button
              onClick={() => setActiveTab("approvals")}
              className={`flex-1 py-2 px-3 rounded-lg whitespace-nowrap transition ${
                activeTab === "approvals" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600"
              }`}
            >
              Staff Approvals ({pendingStaffList.length})
            </button>
          )}
        </div>

        {/* TAB 1: My Tasks */}
        {activeTab === "tasks" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Operational Tasks
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">1-tap to mark completed</span>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => {
                const isDone = task.status === "COMPLETED";
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`cursor-pointer p-4 rounded-2xl border transition flex items-start gap-3 ${
                      isDone
                        ? "bg-slate-100/70 border-slate-200 opacity-60"
                        : "bg-white border-slate-200 hover:border-indigo-400 shadow-sm"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-indigo-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-xs font-extrabold ${isDone ? "line-through text-slate-500" : "text-slate-900"}`}>
                          {task.title}
                        </h3>
                        {task.priority === "URGENT" && !isDone && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded-full">
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-tight">{task.description}</p>
                      <div className="text-[10px] text-slate-400 font-medium pt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Due: {task.due}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Salary & Upaad Ledger */}
        {activeTab === "upaad" && (
          <div className="space-y-4">
            {/* Ledger Summary Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
                <span className="text-[10px] text-slate-400 block font-bold">Base Monthly</span>
                <span className="text-sm font-black text-slate-900">₹{baseSalary.toLocaleString()}</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl shadow-sm">
                <span className="text-[10px] text-rose-600 block font-bold">Advances (Upaad)</span>
                <span className="text-sm font-black text-rose-700">-₹{totalAdvance.toLocaleString()}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl shadow-sm">
                <span className="text-[10px] text-emerald-700 block font-bold">Net Pending Payout</span>
                <span className="text-sm font-black text-emerald-800">₹{netPendingWages.toLocaleString()}</span>
              </div>
            </div>

            {/* Append-Only Ledger History */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900">Recent Upaad / Cash Advance Entries</h3>
              <div className="divide-y divide-slate-100">
                {upaadEntries.map((e) => (
                  <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{e.note}</span>
                      <span className="text-[10px] text-slate-400">{e.date} • Recorded by Owner</span>
                    </div>
                    <span className="font-black text-rose-700 font-mono">-₹{e.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Leave Requests */}
        {activeTab === "leaves" && (
          <div className="space-y-4">
            {/* 1-Tap Leave Form */}
            <form onSubmit={handleApplyLeave} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 text-xs">
              <h3 className="font-extrabold text-slate-900">Request Time Off</h3>

              {leaveSubmitted && (
                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Leave request submitted! Status: PENDING review.</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none font-medium text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none font-medium text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Leave *</label>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="e.g. Family festival, medical appointment"
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-medium text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Leave Request</span>
              </button>
            </form>

            {/* Leave History */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-900">My Leave History</h3>
              <div className="space-y-2">
                {leaves.map((l) => (
                  <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 block">{l.reason}</span>
                      <span className="text-[10px] text-slate-500">{l.start} to {l.end}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        l.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : l.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Owner/Manager Staff Approval Queue */}
        {activeTab === "approvals" && (
          <div className="space-y-3">
            <div>
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Staff Self-Signup Approval Queue (Flow B)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Workers who self-signed up via the StaySuite App require 1-tap Owner activation.
              </p>
            </div>

            {pendingStaffList.length === 0 ? (
              <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <span>No pending staff signups. All workers verified!</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingStaffList.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{p.name}</span>
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                          {p.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Phone: {p.phone} • Applied: {p.appliedDate}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStaffApproval(p.id, false)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Reject</span>
                      </button>
                      <button
                        onClick={() => handleStaffApproval(p.id, true)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Staff</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
