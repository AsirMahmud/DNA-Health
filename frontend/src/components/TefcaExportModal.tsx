"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Lock,
  Download,
  CheckCircle2,
  X,
  FileJson,
  Shield,
  Building,
  RefreshCw,
} from "lucide-react";

interface TefcaExportModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TefcaExportModal: React.FC<TefcaExportModalProps> = ({
  patientId,
  isOpen,
  onClose,
}) => {
  const [deIdentify, setDeIdentify] = useState(true);
  const [bundleData, setBundleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBundle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:4000/api/compliance/tefca-export/${patientId}?deIdentify=${deIdentify}`
      );
      const data = await res.json();
      if (data.success) {
        setBundleData(data.data);
      } else {
        setError(data.error || "Failed to generate TEFCA bundle");
      }
    } catch (err: any) {
      setError(err.message || "Could not connect to backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBundle();
    }
  }, [isOpen, deIdentify, patientId]);

  const handleDownload = () => {
    if (!bundleData) return;
    const blob = new Blob([JSON.stringify(bundleData, null, 2)], {
      type: "application/fhir+json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TEFCA_CANCER_REGISTRY_${patientId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-wider text-sky-700 font-bold">
                  TEFCA QTF / CDC National Cancer Registry Gateway
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  QHIN Certified
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Chemotherapy Discharge Payload Export
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BAA Safe Harbor De-identification Switch */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-sm font-bold text-slate-900">
                HIPAA Safe Harbor & Business Associate Agreement (BAA) Policy
              </div>
              <div className="text-xs text-slate-500">
                Strips direct patient identifiers (Names, SSN, Street Address, Phone) while preserving LOINC labs and RxNorm oncology regimens.
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer self-start sm:self-center bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-slate-700">
              {deIdentify ? "Safe Harbor Active" : "Full PHI Payload"}
            </span>
            <div
              onClick={() => setDeIdentify(!deIdentify)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                deIdentify ? "bg-sky-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                  deIdentify ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </label>
        </div>

        {/* Payload Preview */}
        <div className="flex-1 min-h-0 bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-800">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-sky-600" />
              <span>Generating TEFCA Cancer Registry Bundle...</span>
            </div>
          ) : error ? (
            <div className="text-rose-600 p-4">{error}</div>
          ) : (
            <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-800 font-mono">
              {JSON.stringify(bundleData, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 shrink-0">
          <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
            <FileJson className="w-4 h-4 text-sky-600" />
            <span>HL7 FHIR R4 Bundle ({bundleData?.total || 0} Clinical Resources)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>

            <button
              onClick={handleDownload}
              disabled={!bundleData}
              className="px-4 py-2 rounded-lg font-semibold text-xs md:text-sm bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export FHIR Bundle JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
