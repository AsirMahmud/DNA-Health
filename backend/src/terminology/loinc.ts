/**
 * Standard LOINC Laboratory Codes and Clinical Reference Standards
 * Ensures pure code-based querying without fragile string parsing.
 */

export interface LoincDefinition {
  code: string;
  display: string;
  standardUnit: string;
  category: "HEMATOLOGY" | "RENAL" | "HEPATIC";
  defaultThreshold: {
    min?: number;
    max?: number;
  };
}

export const LOINC_CODES = {
  // Absolute Neutrophil Count (ANC)
  ANC_AUTOMATED: "26499-4", // Neutrophils [#/volume] in Blood
  ANC_MANUAL: "753-4",     // Neutrophils [#/volume] in Blood by Manual count
  ANC_GENERIC: "751-8",    // Neutrophils [#/volume] in Blood

  // Serum Creatinine
  CREATININE_SERUM_OR_PLASMA: "2160-0", // Creatinine [Mass/volume] in Serum or Plasma
  CREATININE_BLOOD: "38483-4",          // Creatinine [Mass/volume] in Blood

  // Platelet Count (often evaluated in chemo nadir)
  PLATELETS: "777-3", // Platelets [#/volume] in Blood

  // Hemoglobin
  HEMOGLOBIN: "718-7", // Hemoglobin [Mass/volume] in Blood
} as const;

export const LOINC_DEFINITIONS: Record<string, LoincDefinition> = {
  [LOINC_CODES.ANC_AUTOMATED]: {
    code: LOINC_CODES.ANC_AUTOMATED,
    display: "Neutrophils [#/volume] in Blood (ANC)",
    standardUnit: "10*3/uL",
    category: "HEMATOLOGY",
    defaultThreshold: { min: 1.5 }, // Hold if < 1.5 x 10^3/uL (1500 /uL)
  },
  [LOINC_CODES.ANC_GENERIC]: {
    code: LOINC_CODES.ANC_GENERIC,
    display: "Neutrophils in Blood (ANC)",
    standardUnit: "10*3/uL",
    category: "HEMATOLOGY",
    defaultThreshold: { min: 1.5 },
  },
  [LOINC_CODES.ANC_MANUAL]: {
    code: LOINC_CODES.ANC_MANUAL,
    display: "Neutrophils [#/volume] Manual (ANC)",
    standardUnit: "10*3/uL",
    category: "HEMATOLOGY",
    defaultThreshold: { min: 1.5 },
  },
  [LOINC_CODES.CREATININE_SERUM_OR_PLASMA]: {
    code: LOINC_CODES.CREATININE_SERUM_OR_PLASMA,
    display: "Creatinine [Mass/volume] in Serum/Plasma",
    standardUnit: "mg/dL",
    category: "RENAL",
    defaultThreshold: { max: 1.5 }, // Hold if > 1.5 mg/dL
  },
  [LOINC_CODES.CREATININE_BLOOD]: {
    code: LOINC_CODES.CREATININE_BLOOD,
    display: "Creatinine [Mass/volume] in Blood",
    standardUnit: "mg/dL",
    category: "RENAL",
    defaultThreshold: { max: 1.5 },
  },
  [LOINC_CODES.PLATELETS]: {
    code: LOINC_CODES.PLATELETS,
    display: "Platelets [#/volume] in Blood",
    standardUnit: "10*3/uL",
    category: "HEMATOLOGY",
    defaultThreshold: { min: 75.0 }, // Hold if < 75 x 10^3/uL
  },
};

export const ANC_LOINC_SET: Set<string> = new Set([
  LOINC_CODES.ANC_AUTOMATED,
  LOINC_CODES.ANC_GENERIC,
  LOINC_CODES.ANC_MANUAL,
]);

export const CREATININE_LOINC_SET: Set<string> = new Set([
  LOINC_CODES.CREATININE_SERUM_OR_PLASMA,
  LOINC_CODES.CREATININE_BLOOD,
]);

/**
 * Normalizes ANC to standard 10^3 / uL (e.g. 1500 /uL -> 1.5 x 10^3/uL)
 */
export function normalizeAncUnit(value: number, unit: string): number {
  const cleanUnit = unit.trim().toLowerCase();
  if (cleanUnit === "/ul" || cleanUnit === "cells/ul" || cleanUnit === "/mm3" || cleanUnit === "cells/mm3") {
    return Number((value / 1000).toFixed(2));
  }
  if (cleanUnit === "10*9/l" || cleanUnit === "10^9/l" || cleanUnit === "g/l") {
    // 1 x 10^9/L == 1 x 10^3/uL
    return value;
  }
  return value;
}

/**
 * Normalizes Creatinine to mg/dL (e.g. from umol/L)
 */
export function normalizeCreatinineUnit(value: number, unit: string): number {
  const cleanUnit = unit.trim().toLowerCase();
  if (cleanUnit === "umol/l" || cleanUnit === "µmol/l") {
    // 1 mg/dL = 88.4 umol/L
    return Number((value / 88.4).toFixed(2));
  }
  return value;
}
