"use client";

import React, { useState } from "react";
import { Volume2, CheckCircle2, Wrench, ShieldAlert, Sparkles } from "lucide-react";

export default function HousekeepingDoorQrPage({
  params,
}: {
  params: Promise<{ doorQrToken: string }>;
}) {
  const [roomNumber, setRoomNumber] = useState("101");
  const [status, setStatus] = useState<"DIRTY" | "CLEAN" | "ISSUE">("DIRTY");
  const [selectedLanguage, setSelectedLanguage] = useState<"mr" | "hi" | "en">("mr");
  const [issueText, setIssueText] = useState("");
  const [showIssueBox, setShowIssueBox] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Web Speech API: Voice instructions in Marathi, Hindi & English for staff
  const speakAudioPrompt = (text: string, lang: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleMarkCleaned = () => {
    setIsUpdating(true);
    const audioMsg =
      selectedLanguage === "mr"
        ? `खोली क्रमांक ${roomNumber} साफ झाली आहे. डॅशबोर्डवर हिरवा रंग दाखवला आहे.`
        : selectedLanguage === "hi"
        ? `कमरा नंबर ${roomNumber} साफ हो गया है।`
        : `Room ${roomNumber} has been marked cleaned.`;

    speakAudioPrompt(audioMsg, selectedLanguage);

    setTimeout(() => {
      setStatus("CLEAN");
      setIsUpdating(false);
    }, 800);
  };

  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueText.trim()) return;

    setStatus("ISSUE");
    setShowIssueBox(false);
    speakAudioPrompt("तक्रार मालकांकडे पाठवली आहे.", "mr");
  };

  return (
    <div className="flex-1 flex flex-col p-5 justify-between min-h-screen bg-slate-50">
      <div className="space-y-4">
        {/* Language Selector with Voice Prompt Button */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setSelectedLanguage("mr");
                speakAudioPrompt("खोली साफ झाल्यावर खालील हिरवे बटण दाबा.", "mr");
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                selectedLanguage === "mr" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => {
                setSelectedLanguage("hi");
                speakAudioPrompt("कमरा साफ होने पर हरा बटन दबाएं।", "hi");
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                selectedLanguage === "hi" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => setSelectedLanguage("en")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                selectedLanguage === "en" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              English
            </button>
          </div>
          <button
            onClick={() =>
              speakAudioPrompt(
                selectedLanguage === "mr"
                  ? `खोली क्रमांक ${roomNumber} साफ करण्यासाठी हिरवे बटण दाबा.`
                  : `कमरा नंबर ${roomNumber} साफ करने के लिए हरा बटन दबाएं।`,
                selectedLanguage
              )
            }
            className="p-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Room Header & Real-time Status Card */}
        <div className="text-center py-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-400">Door Housekeeping QR</p>
          <h1 className="text-3xl font-black text-slate-900 mt-1">खोली / Room {roomNumber}</h1>
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wide uppercase">
            {status === "CLEAN" && (
              <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> खोली साफ आहे / Room Cleaned
              </span>
            )}
            {status === "DIRTY" && (
              <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> साफ करणे आवश्यक / Needs Cleaning
              </span>
            )}
            {status === "ISSUE" && (
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-600" /> दुरुस्ती नोंदवली / Maintenance Reported
              </span>
            )}
          </div>
        </div>

        {/* Issue Reporter Modal/Card */}
        {showIssueBox && (
          <form onSubmit={handleReportIssue} className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
            <h2 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-700" /> खोलीतील बिघाड नोंदवा / Report Issue
            </h2>
            <textarea
              required
              rows={3}
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder="उदा. AC चालू होत नाही, नळात पाणी नाही, गीझर बंद आहे..."
              className="w-full text-xs p-3 border border-amber-200 rounded-lg outline-none bg-white"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-lg"
              >
                मालकांना पाठवा / Send to Owner
              </button>
              <button
                type="button"
                onClick={() => setShowIssueBox(false)}
                className="px-3 bg-slate-200 text-slate-700 text-xs rounded-lg font-semibold"
              >
                रद्द करा
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2 Giant 1-Tap Action Buttons */}
      <div className="space-y-3 pt-6">
        <button
          onClick={handleMarkCleaned}
          disabled={isUpdating}
          className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold py-5 rounded-2xl shadow-xl shadow-emerald-600/30 text-base flex flex-col items-center justify-center transition"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            <span>🟢 खोली साफ झाली (Room Cleaned)</span>
          </div>
          <span className="text-[11px] font-normal text-emerald-100 mt-0.5">
            १ सेकंदात डॅशबोर्ड हिरवा होईल (1-Sec Dashboard Update)
          </span>
        </button>

        <button
          onClick={() => setShowIssueBox(!showIssueBox)}
          className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
        >
          <Wrench className="w-4 h-4 text-slate-600" />
          <span>🛠️ बिघाड नोंदवा (Report Maintenance / Geyser / AC Issue)</span>
        </button>
      </div>
    </div>
  );
}
