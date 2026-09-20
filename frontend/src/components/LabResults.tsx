"use client";

import React from "react";
import {
  TestTube2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { SafetyGateAssessment } from "./types";

interface LabResultsProps {
  assessment: SafetyGateAssessment;
}

export const LabResults: React.FC<LabResultsProps> = ({ assessment }) => {
  const { anc, creatinine } = assessment.labsEvaluated;
  const ancEval = assessment.evaluations.find((e) => e.labName.includes("Neutrophil"));
  const crEval = assessment.evaluations.find((e) => e.labName.includes("Creatinine"));

  return (
    <div className="hospital-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
            <TestTube2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Laboratory Safety Gate Results
            </h3>
            <p className="text-xs text-slate-500">
              Same-day verified labs matched via universal LOINC codes
            </p>
          </div>
        </div>

        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Valid for 24 hours</span>
        </span>
      </div>

      {/* Lab Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Absolute Neutrophil Count (ANC) */}
        <div
          className={`rounded-xl p-4 border transition-all ${
            ancEval?.passed
              ? "bg-slate-50/50 border-slate-200"
              : "bg-rose-50/70 border-rose-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Hematology
              </span>
              <h4 className="text-sm font-bold text-slate-900">
                Absolute Neutrophils (ANC)
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                LOINC: {anc?.loincCode || "26499-4"}
              </span>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                ancEval?.passed
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {ancEval?.passed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Normal</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Critical Low</span>
                </>
              )}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                ancEval?.passed ? "text-slate-900" : "text-rose-700"
              }`}
            >
              {anc?.normalizedValue !== undefined ? anc.normalizedValue : "N/A"}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {anc?.standardUnit || "10*3/uL"}
            </span>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
            <span>Safety Cutoff:</span>
            <span className="font-bold text-slate-800">≥ 1.5 10*3/uL</span>
          </div>
        </div>

        {/* Serum Creatinine */}
        <div
          className={`rounded-xl p-4 border transition-all ${
            crEval?.passed
              ? "bg-slate-50/50 border-slate-200"
              : "bg-rose-50/70 border-rose-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Renal Function
              </span>
              <h4 className="text-sm font-bold text-slate-900">Serum Creatinine</h4>
              <span className="text-[11px] font-mono text-slate-400">
                LOINC: {creatinine?.loincCode || "2160-0"}
              </span>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                crEval?.passed
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {crEval?.passed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Normal</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Elevated</span>
                </>
              )}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                crEval?.passed ? "text-slate-900" : "text-rose-700"
              }`}
            >
              {creatinine?.normalizedValue !== undefined ? creatinine.normalizedValue : "N/A"}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {creatinine?.standardUnit || "mg/dL"}
            </span>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
            <span>Safety Cutoff:</span>
            <span className="font-bold text-slate-800">≤ 1.5 mg/dL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
