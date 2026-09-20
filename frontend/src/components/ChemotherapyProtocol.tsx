"use client";

import React from "react";
import {
  Pill,
  Droplets,
  Gauge,
  FileText,
  Clock,
  Layers,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
import { ParsedChemotherapyProtocol } from "./types";

interface ChemotherapyProtocolProps {
  protocol: ParsedChemotherapyProtocol | null;
}

export const ChemotherapyProtocol: React.FC<ChemotherapyProtocolProps> = ({ protocol }) => {
  if (!protocol) {
    return (
      <div className="hospital-card p-6 text-center text-slate-400">
        <Pill className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">No active chemotherapy prescription found for this patient.</p>
      </div>
    );
  }

  return (
    <div className="hospital-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{protocol.protocolName}</h3>
              {protocol.rxNormCode && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  RxNorm: {protocol.rxNormCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              HL7 FHIR R4 MedicationRequest Order
            </p>
          </div>
        </div>

        {protocol.requiresCentralLine && (
          <span className="text-xs px-2.5 py-1 rounded-lg font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Central Line Required</span>
          </span>
        )}
      </div>

      {/* Active Cytotoxic Drugs Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
            <tr>
              <th className="py-2.5 px-3.5">Active Chemotherapy Agent</th>
              <th className="py-2.5 px-3.5 font-mono">RxNorm</th>
              <th className="py-2.5 px-3.5">Prescribed Dose</th>
              <th className="py-2.5 px-3.5">Therapeutic Class</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {protocol.activeIngredients.map((ing, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="py-2.5 px-3.5 font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>{ing.name}</span>
                    {ing.brandName && (
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({ing.brandName})
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3.5 font-mono text-sky-700">{ing.rxNormCode}</td>
                <td className="py-2.5 px-3.5 font-bold text-slate-900">
                  {ing.dose ? `${ing.dose.value} ${ing.dose.unit}` : "Protocol Standard"}
                </td>
                <td className="py-2.5 px-3.5 text-slate-600">{ing.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Diluent & Infusion Rate Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Carrier Fluids */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-600" />
            <span>Carrier Diluent Fluids</span>
          </span>

          <div className="space-y-1.5">
            {protocol.carrierFluids.map((carrier, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs"
              >
                <span className="font-semibold text-slate-800">{carrier.name}</span>
                <span className="font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                  {carrier.strengthRatio?.numeratorValue || 250} mL
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Infusion Rates */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5 space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-sky-600" />
            <span>Target Pump Drip Rates</span>
          </span>

          <div className="space-y-1.5">
            {protocol.dosageInstructions.map((instr, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-800">
                    Step {instr.sequence}: {instr.route}
                  </span>
                  <div className="text-[11px] text-slate-500">{instr.text}</div>
                </div>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  {instr.rateQuantity
                    ? `${instr.rateQuantity.value} ${instr.rateQuantity.unit}`
                    : `${instr.calculatedRateMlPerHour || 100} mL/h`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
