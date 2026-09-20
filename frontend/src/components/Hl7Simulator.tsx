"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  Terminal,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Radio,
  Layers,
} from "lucide-react";

interface Hl7SimulatorProps {
  onIngest: (rawHl7: string) => Promise<{ success: boolean; data?: any; interlockAlert?: string }>;
}

export const Hl7Simulator: React.FC<Hl7SimulatorProps> = ({ onIngest }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>("oxaliplatinStart");
  const [rawHl7, setRawHl7] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const presets: Record<string, { label: string; description: string; hl7: string }> = {
    oxaliplatinStart: {
      label: "Alaris Pump: Start Oxaliplatin (P-1001 / Vance)",
      description: "Normal labs (PASS); transitions smart pump to INFUSING status.",
      hl7: [
        "MSH|^~\\&|ALARIS_PUMP_4B|ONCOLOGY_3E|SAFETY_GATE|MEMORIAL_CANCER|20260920093000||RAS^O17^RAS_O17|MSG-ALARIS-9001|P|2.5",
        "PID|1||MRN-8849201^^^MEMORIAL||Vance^Eleanor^Ruth||19680412|F",
        "ORC|RE|MR-FOLFOX-1001|||IP",
        "RXA|0|1|20260920093000||32592^Oxaliplatin^RxNorm|150|mg^Milligram^UCUM||00^Administered^NCI||||||||||RE",
        "RXR|IV^Intravenous^HL70162|C^Central Line",
      ].join("\r"),
    },
    rituximabHoldAttempt: {
      label: "Baxter Pump: Start Rituximab on Neutropenic Patient (P-1002 / Brody)",
      description: "Patient on HOLD (ANC 0.8); MUST trigger Safety Interlock Alarm!",
      hl7: [
        "MSH|^~\\&|BAXTER_PUMP_1A|ONCOLOGY_3E|SAFETY_GATE|MEMORIAL_CANCER|20260920094500||RAS^O17^RAS_O17|MSG-BAXTER-4412|P|2.5",
        "PID|1||MRN-7738202^^^MEMORIAL||Brody^Marcus^Anthony||19591123|M",
        "ORC|RE|MR-RCHOP-1002|||IP",
        "RXA|0|1|20260920094500||121191^Rituximab^RxNorm|700|mg^Milligram^UCUM||00^Administered^NCI||||||||||RE",
        "RXR|IV^Intravenous^HL70162|P^Peripheral Line",
      ].join("\r"),
    },
    infusionComplete: {
      label: "Alaris Pump: Mark Infusion Complete (P-1001)",
      description: "Records completed administration in FHIR MedicationAdministration.",
      hl7: [
        "MSH|^~\\&|ALARIS_PUMP_4B|ONCOLOGY_3E|SAFETY_GATE|MEMORIAL_CANCER|20260920113000||RAS^O17^RAS_O17|MSG-ALARIS-9002|P|2.5",
        "PID|1||MRN-8849201^^^MEMORIAL||Vance^Eleanor^Ruth||19680412|F",
        "ORC|RE|MR-FOLFOX-1001|||CP",
        "RXA|0|1|20260920093000|20260920113000|32592^Oxaliplatin^RxNorm|150|mg^Milligram^UCUM||00^Administered^NCI||||||||||CP",
        "RXR|IV^Intravenous^HL70162|C^Central Line",
      ].join("\r"),
    },
  };

  useEffect(() => {
    if (presets[selectedPreset]) {
      setRawHl7(presets[selectedPreset].hl7);
    }
  }, [selectedPreset]);

  const handleSend = async () => {
    if (!rawHl7.trim()) return;
    setIsSending(true);
    try {
      const res = await onIngest(rawHl7);
      setLastResult(res);
    } catch (err: any) {
      setLastResult({ success: false, error: err.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="ehr-card rounded-xl p-5 space-y-4 bg-white border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Floor HL7 v2 Pump Telemetry Interface
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                RAS^O17
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Ingest bedside smart infusion pump start/stop messages
            </p>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={isSending}
          className="px-4 py-2 rounded-lg font-semibold text-xs md:text-sm bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 self-start sm:self-center"
        >
          {isSending ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Transmit Message</span>
        </button>
      </div>

      {/* Preset Scenario Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Select HL7 Test Message Preset
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {Object.entries(presets).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setSelectedPreset(key)}
              className={`p-2.5 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                selectedPreset === key
                  ? "bg-sky-50 border-sky-300 text-sky-950 font-medium"
                  : "bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <div className="font-bold text-slate-900">{item.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                {item.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Raw HL7 Stream */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Raw HL7 v2.5 Message (Segments: MSH | PID | ORC | RXA | RXR)</span>
          <span>Delimiters: |^~\&</span>
        </div>

        <textarea
          rows={4}
          value={rawHl7}
          onChange={(e) => setRawHl7(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white leading-relaxed"
          placeholder="Paste raw MSH|^~\&|... message"
        />
      </div>

      {/* Result Alert */}
      {lastResult && (
        <div
          className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
            lastResult.success
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
            {lastResult.success ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>HL7 Ingestion Succeeded — Pump State: INFUSING</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>SAFETY INTERLOCK ACTIVATED — Infusion Blocked</span>
              </>
            )}
          </div>

          <div className="font-mono text-[11px] leading-relaxed">
            {lastResult.interlockAlert ||
              lastResult.data?.message ||
              JSON.stringify(lastResult, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
};
