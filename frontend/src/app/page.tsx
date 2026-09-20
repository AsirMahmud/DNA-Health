"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Hospital,
  User,
  Share2,
  RefreshCw,
  ShieldCheck,
  Radio,
  X,
} from "lucide-react";
import {
  PatientOverview,
  SafetyGateAssessment,
} from "@/components/types";
import { SafetyStatus } from "@/components/SafetyStatus";
import { LabResults } from "@/components/LabResults";
import { ChemotherapyProtocol } from "@/components/ChemotherapyProtocol";
import { Hl7Simulator } from "@/components/Hl7Simulator";
import { TefcaExportModal } from "@/components/TefcaExportModal";

const API_BASE = "http://localhost:4000";

interface CohortMeta {
  id: string;
  name: string;
  scenario: string;
  statusBadge: "pass" | "hold" | "expired";
  diagnosis: string;
  allergies: string;
  bsa: string;
  attending: string;
}

const COHORT_METADATA: Record<string, CohortMeta> = {
  "P-1001": {
    id: "P-1001",
    name: "Eleanor Vance",
    scenario: "Normal Labs",
    statusBadge: "pass",
    diagnosis: "Colon Adenocarcinoma (Stage IIIc)",
    allergies: "NKDA",
    bsa: "1.76 m² (68 kg / 165 cm)",
    attending: "Dr. Julian Bashir, MD (Oncology Chief)",
  },
  "P-1002": {
    id: "P-1002",
    name: "Marcus Brody",
    scenario: "Neutropenia",
    statusBadge: "hold",
    diagnosis: "Diffuse Large B-Cell Lymphoma (DLBCL)",
    allergies: "Sulfa Drugs (Rash)",
    bsa: "1.92 m² (82 kg / 178 cm)",
    attending: "Dr. Beverly Crusher, MD (Hematology)",
  },
  "P-1003": {
    id: "P-1003",
    name: "Sarah Connor",
    scenario: "Renal Failure",
    statusBadge: "hold",
    diagnosis: "Small Cell Lung Cancer",
    allergies: "Penicillin (Anaphylaxis)",
    bsa: "1.65 m² (58 kg / 160 cm)",
    attending: "Dr. Leonard McCoy, MD (Oncology)",
  },
  "P-1004": {
    id: "P-1004",
    name: "James Chen",
    scenario: "Expired Labs >24h",
    statusBadge: "expired",
    diagnosis: "Colorectal Carcinoma (Cycle 4)",
    allergies: "NKDA",
    bsa: "1.85 m² (75 kg / 172 cm)",
    attending: "Dr. Julian Bashir, MD (Oncology Chief)",
  },
};

export default function ClinicalWorkstation() {
  const [patients, setPatients] = useState<PatientOverview[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("P-1001");
  const [assessment, setAssessment] = useState<SafetyGateAssessment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOverriding, setIsOverriding] = useState(false);
  const [showTefcaModal, setShowTefcaModal] = useState(false);
  const [showHl7Modal, setShowHl7Modal] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    const t = setInterval(
      () => setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      1000
    );
    return () => clearInterval(t);
  }, []);

  // Fetch all patients
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/patients`);
        const json = await res.json();
        if (json.success) {
          setPatients(json.data);
        }
      } catch (err) {
        console.error("Failed to load patients", err);
      }
    };
    loadPatients();
  }, []);

  // Load Safety Assessment
  const loadPatientData = useCallback(async (patientId: string) => {
    setIsRefreshing(true);
    try {
      const assessRes = await fetch(`${API_BASE}/api/patients/${patientId}/safety-check`);
      const assessData = await assessRes.json();

      if (assessData.success) {
        setAssessment(assessData.data);
      }
    } catch (err) {
      console.error("Failed to load clinical data", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPatientData(selectedPatientId);
  }, [selectedPatientId, loadPatientData]);

  // Handle Oncologist Override
  const handleOverride = async (authorizedBy: string, reason: string) => {
    setIsOverriding(true);
    try {
      const res = await fetch(`${API_BASE}/api/patients/${selectedPatientId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorizedBy, reason }),
      });
      const data = await res.json();
      if (data.success) {
        setAssessment(data.data);
      }
    } catch (err) {
      console.error("Failed to submit override", err);
    } finally {
      setIsOverriding(false);
    }
  };

  // Handle HL7 Message Ingestion
  const handleIngestHl7 = async (rawHl7: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/hl7/administration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawHl7 }),
      });
      const data = await res.json();
      await loadPatientData(selectedPatientId);
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const currentPatient = patients.find((p) => p.id === selectedPatientId);
  const currentMeta = COHORT_METADATA[selectedPatientId] || COHORT_METADATA["P-1001"];
  const patientDisplayName = currentPatient
    ? `${currentPatient.name[0].given.join(" ")} ${currentPatient.name[0].family}`
    : currentMeta.name;
  const patientMrn =
    currentPatient?.identifier?.find((i) => i.value.startsWith("MRN"))?.value || "MRN-8849201";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Hospital App Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-5 py-3 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Hospital className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-sky-800">
                  Memorial Oncology
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold border border-sky-100">
                  Infusion Suite 4B
                </span>
              </div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Inpatient Chemotherapy Infusion Safety Gate
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Action 1: Simulate HL7 v2 Bedside Message */}
            <button
              onClick={() => setShowHl7Modal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Test HL7 v2 RAS^O17 Bedside Pump Message"
            >
              <Radio className="w-3.5 h-3.5 text-sky-600" />
              <span>Simulate HL7 Pump Event</span>
            </button>

            {/* Action 2: TEFCA Cancer Registry Export */}
            <button
              onClick={() => setShowTefcaModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-600" />
              <span>TEFCA Registry Export</span>
            </button>

            <button
              onClick={() => loadPatientData(selectedPatientId)}
              disabled={isRefreshing}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-sky-600" : ""}`} />
            </button>

            <div className="text-xs font-medium text-slate-500 pl-2 border-l border-slate-200 font-mono">
              {currentTime}
            </div>
          </div>
        </div>
      </header>

      {/* Clean Patient Selector Bar */}
      <div className="bg-white border-b border-slate-200 px-5 py-2.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-600" />
            <span>Select Patient Cohort:</span>
          </span>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "P-1001", name: "Eleanor Vance", scenario: "Normal (PASS)", color: "bg-emerald-500" },
              { id: "P-1002", name: "Marcus Brody", scenario: "Neutropenia (HOLD)", color: "bg-rose-500" },
              { id: "P-1003", name: "Sarah Connor", scenario: "Renal Failure (HOLD)", color: "bg-rose-500" },
              { id: "P-1004", name: "James Chen", scenario: "Expired Labs (HOLD)", color: "bg-amber-500" },
            ].map((p) => {
              const isSelected = selectedPatientId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? "bg-sky-600 text-white border-sky-700 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-white" : p.color}`} />
                  <span>{p.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                      isSelected ? "bg-sky-700/80 text-sky-100" : "bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    {p.scenario}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Patient Demographics Banner */}
      <div className="bg-white border-b border-slate-200 px-5 py-3.5 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-800 border border-sky-200 flex items-center justify-center font-bold text-sm">
              {patientDisplayName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-bold text-slate-900">{patientDisplayName}</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {patientMrn}
                </span>
                <span className="text-slate-500">
                  Room 412-B • {currentPatient?.birthDate || "1968-04-12"} (58 yo, Female)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-slate-600 mt-1">
                <span>
                  <strong>Diagnosis:</strong> {currentMeta.diagnosis}
                </span>
                <span>•</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded ${
                    currentMeta.allergies === "NKDA"
                      ? "bg-slate-100 text-slate-700"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  Allergies: {currentMeta.allergies}
                </span>
                <span>•</span>
                <span>
                  <strong>BSA:</strong> {currentMeta.bsa}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right hidden md:block">
            <div className="text-slate-400 font-medium text-[11px]">Attending Oncologist</div>
            <div className="font-bold text-slate-800">{currentMeta.attending}</div>
          </div>
        </div>
      </div>

      {/* Unified Single-Screen Safety Gate Workstation */}
      <main className="max-w-6xl mx-auto w-full p-5 flex-1 space-y-5">
        {/* Hero Banner: Automated Safety Gate Status */}
        {assessment && (
          <SafetyStatus
            assessment={assessment}
            onOverride={handleOverride}
            isOverriding={isOverriding}
          />
        )}

        {/* 2-Column Clinical Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (7 cols): Lab Safety Gate & Chemotherapy Protocol */}
          <div className="lg:col-span-7 space-y-5">
            {assessment && (
              <LabResults assessment={assessment} />
            )}
            <ChemotherapyProtocol protocol={assessment?.activeProtocol || null} />
          </div>

          {/* Right Column (5 cols): Clinical Administration Checklist & Audit Trail */}
          <div className="lg:col-span-5 space-y-5">
            {/* Bedside Administration Safety Checklist */}
            <div className="hospital-card p-4 space-y-3 bg-white border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Bedside Administration Checklist</span>
              </h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>Patient identity & wristband barcode verified</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>Pre-medications (Dexamethasone / Ondansetron) completed</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                    ✓
                  </span>
                  <span>Dual RN independent double-check confirmed</span>
                </div>
              </div>
            </div>

            {/* Clinical Decision Support Safety Guidelines */}
            <div className="hospital-card p-4 space-y-3 bg-white border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Oncology Infusion Safety Rules</span>
              </h4>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">ANC Threshold:</strong> Minimum 1.5 × 10³/µL required to prevent severe neutropenic sepsis.
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Renal Clearance:</strong> Serum Creatinine must be ≤ 1.5 mg/dL to prevent nephrotoxic acute tubular necrosis.
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Specimen Validity:</strong> Blood draws older than 24 hours trigger an automatic safety hold.
                  </div>
                </div>
                <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-slate-800">Dual RN Verification:</strong> Two licensed oncology nurses must independently confirm dose and line clearance.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* HL7 v2 Ingestion Modal */}
      {showHl7Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-5 h-5 text-sky-600" />
                <span>Simulate Bedside HL7 v2 Pump Message</span>
              </h3>
              <button
                onClick={() => setShowHl7Modal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Hl7Simulator onIngest={handleIngestHl7} />
          </div>
        </div>
      )}

      {/* TEFCA Export Modal */}
      <TefcaExportModal
        patientId={selectedPatientId}
        isOpen={showTefcaModal}
        onClose={() => setShowTefcaModal(false)}
      />

      {/* Clean Hospital Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-5 py-3 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>Memorial Cancer Center • Oncology Clinical Decision Support Gate</div>
          <div className="flex items-center gap-3">
            <span className="text-sky-700 font-semibold">HIPAA BAA Compliant</span>
            <span>•</span>
            <span>TEFCA QTF Certified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
