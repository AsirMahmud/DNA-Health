"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileKey,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Info,
} from "lucide-react";
import { SafetyGateAssessment } from "./types";

interface SafetyStatusProps {
  assessment: SafetyGateAssessment;
  onOverride: (authorizedBy: string, reason: string) => Promise<void>;
  isOverriding?: boolean;
}

export const SafetyStatus: React.FC<SafetyStatusProps> = ({
  assessment,
  onOverride,
  isOverriding = false,
}) => {
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [authorizedBy, setAuthorizedBy] = useState("Dr. Julian Bashir, MD (Attending Oncologist)");
  const [reason, setReason] = useState(
    "Patient received prophylactic G-CSF; ANC recovery anticipated. Verified with tumor board to proceed at 80% dose."
  );

  const isPass = assessment.gateStatus === "PASS";
  const isHold = assessment.gateStatus === "HOLD";
  const isOverride = assessment.gateStatus === "OVERRIDE";

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorizedBy.trim() || !reason.trim()) return;
    await onOverride(authorizedBy, reason);
    setShowOverrideModal(false);
  };

  return (
    <div className="w-full">
      {/* High-Impact Clinical Gate Banner */}
      <div
        className={`rounded-2xl p-5 border transition-all ${
          isPass
            ? "status-banner-pass"
            : isHold
            ? "status-banner-hold"
            : "status-banner-override"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${
                isPass
                  ? "bg-emerald-600 text-white"
                  : isHold
                  ? "bg-rose-600 text-white"
                  : "bg-amber-500 text-white"
              }`}
            >
              {isPass ? (
                <ShieldCheck className="w-8 h-8" />
              ) : isHold ? (
                <ShieldAlert className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">
                  Infusion Safety Gate
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-white/60 border border-current">
                  {isPass ? "Pharmacy Release Authorized" : isHold ? "Bedside Pump Locked" : "Physician Override"}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                {isPass && "SAFETY STATUS: PASS — Safe to Administer"}
                {isHold && "SAFETY STATUS: HOLD — Infusion Prohibited"}
                {isOverride && "SAFETY STATUS: OVERRIDE — Authorized by MD"}
              </h2>

              <p className="text-xs sm:text-sm mt-1 opacity-90 max-w-2xl font-normal">
                {isPass &&
                  "All required laboratory values (ANC and Creatinine) meet oncological safety criteria. You may proceed with bedside pump verification."}
                {isHold &&
                  "Patient laboratory results fall below required safety thresholds. The smart pump is locked to prevent chemotherapy toxicity."}
                {isOverride &&
                  "Attending oncologist has approved administration under special protocol. Audit record created."}
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
            {isHold && (
              <button
                onClick={() => setShowOverrideModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm bg-rose-700 hover:bg-rose-800 text-white shadow-sm transition-all cursor-pointer"
              >
                <FileKey className="w-4 h-4" />
                <span>Oncologist Override</span>
              </button>
            )}
          </div>
        </div>

        {/* Blocking Reasons List */}
        {assessment.blockingReasons.length > 0 && (
          <div className="mt-4 pt-3 border-t border-rose-200/80 text-xs">
            <div className="font-bold text-rose-900 mb-1 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Contraindications Detected:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-rose-800 font-medium">
              {assessment.blockingReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Override Dialog Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl relative text-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Oncologist Override
                </h3>
                <p className="text-xs text-slate-500">
                  Authorize infusion with clinical documentation
                </p>
              </div>
            </div>

            <form onSubmit={handleApplyOverride} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Authorizing Physician & NPI
                </label>
                <input
                  type="text"
                  required
                  value={authorizedBy}
                  onChange={(e) => setAuthorizedBy(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Justification
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOverriding}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isOverriding ? "Saving..." : "Confirm Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
