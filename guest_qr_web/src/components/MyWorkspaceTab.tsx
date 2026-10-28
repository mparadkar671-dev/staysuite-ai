"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  ListTodo,
  Send,
  Plus,
  AlertCircle,
  Receipt,
  User,
} from "lucide-react";

export interface MyWorkspaceProps {
  personName: string;
  role: string;
  baseSalary?: number;
}

export default function MyWorkspaceTab({
  personName,
  role,
  baseSalary = 18000,
}: MyWorkspaceProps) {
  const [subTab, setSubTab] = useState<"tasks" | "upaad" | "leaves">("tasks");

  // Tasks state
  const [tasks, setTasks] = useState([
    {
      id: "tsk-1",
      title: "Clean & Sanitize Room 102",
      description: "Replace bed linens, scrub bathroom tiles, verify Western geyser",
      priority: "URGENT",
      status: "PENDING",
      due: "Today 11:30 AM",
    },
    {
      id: "tsk-2",
      title: "Inspect Inverter Battery Water Level",
      description: "Check distilled water levels in battery bank before sunset",
      priority: "NORMAL",
      status: "COMPLETED",
      due: "Today 4:00 PM",
    },
    {
      id: "tsk-3",
      title: "Prep Fresh Solkadhi for Dinner Guests",
      description: "Extract coconut milk and steep Kokum petals for 6 rooms",
      priority: "NORMAL",
      status: "PENDING",
      due: "Today 5:00 PM",
    },
  ]);

  // Upaad & Salary state
  const [upaadList, setUpaadList] = useState([
    {
      id: "up-1",
      type: "ADVANCE",
      amount: 3000,
      date: "2026-10-12",
      note: "Family festival shopping (Approved by Owner)",
    },
    {
      id: "up-2",
      type: "ADVANCE",
      amount: 1500,
      date: "2026-10-20",
      note: "Emergency bike petrol & medicines",
    },
  ]);

  // Leave Requests state
  const [leaves, setLeaves] = useState([
    {
      id: "lv-1",
      start: "2026-11-02",
      end: "2026-11-04",
      reason: "Village Temple Jatra (Kuldevta Puja)",
      status: "APPROVED",
    },
    {
      id: "lv-2",
      start: "2026-11-18",
      end: "2026-11-19",
      reason: "Cousin Wedding in Kankavli",
      status: "PENDING",
    },
  ]);

  const [newLeaveStart, setNewLeaveStart] = useState("");
  const [newLeaveEnd, setNewLeaveEnd] = useState("");
  const [newLeaveReason, setNewLeaveReason] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Quick Upaad Request Modal
  const [showUpaadModal, setShowUpaadModal] = useState(false);
  const [requestedUpaadAmount, setRequestedUpaadAmount] = useState(1000);
  const [requestedUpaadNote, setRequestedUpaadNote] = useState("");

  const totalAdvanceTaken = upaadList.reduce((acc, u) => acc + u.amount, 0);
  const netPayableWage = baseSalary - totalAdvanceTaken;

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, status: t.status === "PENDING" ? "COMPLETED" : "PENDING" } : t
      )
    );
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveStart || !newLeaveReason) return;
    setLeaves([
      ...leaves,
      {
        id: `lv-${Date.now()}`,
        start: newLeaveStart,
        end: newLeaveEnd || newLeaveStart,
        reason: newLeaveReason,
        status: "PENDING",
      },
    ]);
    setNewLeaveStart("");
    setNewLeaveEnd("");
    setNewLeaveReason("");
    setShowLeaveModal(false);
  };

  const handleRequestUpaad = (e: React.FormEvent) => {
    e.preventDefault();
    setUpaadList([
      ...upaadList,
      {
        id: `up-${Date.now()}`,
        type: "ADVANCE",
        amount: Number(requestedUpaadAmount),
        date: new Date().toISOString().split("T")[0],
        note: `${requestedUpaadNote || "Mid-month advance"} (Pending Approval)`,
      },
    ]);
    setShowUpaadModal(false);
    setRequestedUpaadNote("");
  };

  return (
    <div className="space-y-4">
      {/* Universal Workspace Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center font-black text-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight">{personName}</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                {role.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Universal Employee Self-Service &bull; Personal Tasks, Upaad Ledger &amp; Leave Portal
            </p>
          </div>
        </div>

        {/* Quick Upaad Pulse Widget */}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-right">
          <span className="text-[10px] text-slate-300 block font-bold uppercase tracking-wider">
            Net Monthly Payout Due
          </span>
          <span className="text-lg font-black text-emerald-400">₹{netPayableWage}</span>
          <span className="text-[10px] text-slate-400 block">
            Base ₹{baseSalary} - Upaad ₹{totalAdvanceTaken}
          </span>
        </div>
      </div>

      {/* 3 Core Workspace Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab("tasks")}
          className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition ${
            subTab === "tasks"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>My Assigned Tasks ({tasks.filter((t) => t.status === "PENDING").length})</span>
        </button>

        <button
          onClick={() => setSubTab("upaad")}
          className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition ${
            subTab === "upaad"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Salary &amp; Upaad Ledger</span>
        </button>

        <button
          onClick={() => setSubTab("leaves")}
          className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition ${
            subTab === "leaves"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>My Leave Requests ({leaves.length})</span>
        </button>
      </div>

      {/* TAB 1: Assigned Tasks */}
      {subTab === "tasks" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tap checkbox to mark any daily duty complete in real-time</span>
            <span className="text-emerald-700 font-bold">
              {tasks.filter((t) => t.status === "COMPLETED").length} of {tasks.length} Completed
            </span>
          </div>

          <div className="space-y-2">
            {tasks.map((task) => {
              const isDone = task.status === "COMPLETED";
              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 cursor-pointer select-none ${
                    isDone
                      ? "bg-slate-50 border-slate-200 opacity-60"
                      : "bg-white border-slate-200 hover:border-indigo-300 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs font-extrabold ${
                            isDone ? "line-through text-slate-400" : "text-slate-900"
                          }`}
                        >
                          {task.title}
                        </h4>
                        {task.priority === "URGENT" && (
                          <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2 py-0.2 rounded-full">
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-semibold block">{task.due}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-1 ${
                        isDone ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isDone ? "Done ✓" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Salary & Upaad Ledger */}
      {subTab === "upaad" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
                Monthly Gross Salary
              </span>
              <span className="text-xl font-black text-slate-900 mt-1 block">₹{baseSalary}</span>
              <span className="text-[10px] text-slate-500">Fixed + Monthly Attendance</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase text-rose-600 block tracking-wider">
                Total Mid-Month Upaad Taken
              </span>
              <span className="text-xl font-black text-rose-700 mt-1 block">- ₹{totalAdvanceTaken}</span>
              <span className="text-[10px] text-rose-600 font-semibold">Deducted from final salary</span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-800 block tracking-wider">
                  Net Balance To Be Received
                </span>
                <span className="text-xl font-black text-emerald-900 mt-1 block">₹{netPayableWage}</span>
              </div>
              <button
                onClick={() => setShowUpaadModal(true)}
                className="mt-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request Cash Upaad</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 font-black text-xs text-slate-800 flex items-center justify-between">
              <span>Recorded Advance (Upaad) Cash Slips</span>
              <span className="text-[11px] text-slate-400 font-medium">Automatic payroll sync</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {upaadList.map((entry) => (
                <div key={entry.id} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900 block">{entry.note}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{entry.date}</span>
                  </div>
                  <span className="font-black text-rose-700 text-sm">- ₹{entry.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Leave Requests */}
      {subTab === "leaves" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800">My Leave History &amp; Balances</h3>
              <p className="text-[10px] text-slate-500">Apply for time-off with instant owner/manager review</p>
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply For Leave</span>
            </button>
          </div>

          <div className="space-y-2">
            {leaves.map((leave) => (
              <div
                key={leave.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900">
                      {leave.start} {leave.end !== leave.start ? `to ${leave.end}` : ""}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        leave.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : leave.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{leave.reason}</p>
                </div>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900">Apply For Leave</h3>
            <form onSubmit={handleApplyLeave} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block">From Date</label>
                <input
                  type="date"
                  required
                  value={newLeaveStart}
                  onChange={(e) => setNewLeaveStart(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block">To Date (Optional)</label>
                <input
                  type="date"
                  value={newLeaveEnd}
                  onChange={(e) => setNewLeaveEnd(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Reason</label>
                <textarea
                  required
                  value={newLeaveReason}
                  onChange={(e) => setNewLeaveReason(e.target.value)}
                  placeholder="e.g. Village temple festival, medical visit"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 text-xs font-bold py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs font-bold py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upaad Cash Request Modal */}
      {showUpaadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900">Request Mid-Month Upaad (Cash Advance)</h3>
            <form onSubmit={handleRequestUpaad} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Advance Amount (₹)</label>
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="500"
                  required
                  value={requestedUpaadAmount}
                  onChange={(e) => setRequestedUpaadAmount(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Purpose / Reason</label>
                <input
                  type="text"
                  required
                  value={requestedUpaadNote}
                  onChange={(e) => setRequestedUpaadNote(e.target.value)}
                  placeholder="e.g. Urgent family medical expense"
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUpaadModal(false)}
                  className="flex-1 text-xs font-bold py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs font-bold py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Submit Upaad Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
