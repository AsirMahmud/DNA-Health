"use strict";
/**
 * Standard LOINC Laboratory Codes and Clinical Reference Standards
 * Ensures pure code-based querying without fragile string parsing.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CREATININE_LOINC_SET = exports.ANC_LOINC_SET = exports.LOINC_DEFINITIONS = exports.LOINC_CODES = void 0;
exports.normalizeAncUnit = normalizeAncUnit;
exports.normalizeCreatinineUnit = normalizeCreatinineUnit;
exports.LOINC_CODES = {
    // Absolute Neutrophil Count (ANC)
    ANC_AUTOMATED: "26499-4", // Neutrophils [#/volume] in Blood
    ANC_MANUAL: "753-4", // Neutrophils [#/volume] in Blood by Manual count
    ANC_GENERIC: "751-8", // Neutrophils [#/volume] in Blood
    // Serum Creatinine
    CREATININE_SERUM_OR_PLASMA: "2160-0", // Creatinine [Mass/volume] in Serum or Plasma
    CREATININE_BLOOD: "38483-4", // Creatinine [Mass/volume] in Blood
    // Platelet Count (often evaluated in chemo nadir)
    PLATELETS: "777-3", // Platelets [#/volume] in Blood
    // Hemoglobin
    HEMOGLOBIN: "718-7", // Hemoglobin [Mass/volume] in Blood
};
exports.LOINC_DEFINITIONS = {
    [exports.LOINC_CODES.ANC_AUTOMATED]: {
        code: exports.LOINC_CODES.ANC_AUTOMATED,
        display: "Neutrophils [#/volume] in Blood (ANC)",
        standardUnit: "10*3/uL",
        category: "HEMATOLOGY",
        defaultThreshold: { min: 1.5 }, // Hold if < 1.5 x 10^3/uL (1500 /uL)
    },
    [exports.LOINC_CODES.ANC_GENERIC]: {
        code: exports.LOINC_CODES.ANC_GENERIC,
        display: "Neutrophils in Blood (ANC)",
        standardUnit: "10*3/uL",
        category: "HEMATOLOGY",
        defaultThreshold: { min: 1.5 },
    },
    [exports.LOINC_CODES.ANC_MANUAL]: {
        code: exports.LOINC_CODES.ANC_MANUAL,
        display: "Neutrophils [#/volume] Manual (ANC)",
        standardUnit: "10*3/uL",
        category: "HEMATOLOGY",
        defaultThreshold: { min: 1.5 },
    },
    [exports.LOINC_CODES.CREATININE_SERUM_OR_PLASMA]: {
        code: exports.LOINC_CODES.CREATININE_SERUM_OR_PLASMA,
        display: "Creatinine [Mass/volume] in Serum/Plasma",
        standardUnit: "mg/dL",
        category: "RENAL",
        defaultThreshold: { max: 1.5 }, // Hold if > 1.5 mg/dL
    },
    [exports.LOINC_CODES.CREATININE_BLOOD]: {
        code: exports.LOINC_CODES.CREATININE_BLOOD,
        display: "Creatinine [Mass/volume] in Blood",
        standardUnit: "mg/dL",
        category: "RENAL",
        defaultThreshold: { max: 1.5 },
    },
    [exports.LOINC_CODES.PLATELETS]: {
        code: exports.LOINC_CODES.PLATELETS,
        display: "Platelets [#/volume] in Blood",
        standardUnit: "10*3/uL",
        category: "HEMATOLOGY",
        defaultThreshold: { min: 75.0 }, // Hold if < 75 x 10^3/uL
    },
};
exports.ANC_LOINC_SET = new Set([
    exports.LOINC_CODES.ANC_AUTOMATED,
    exports.LOINC_CODES.ANC_GENERIC,
    exports.LOINC_CODES.ANC_MANUAL,
]);
exports.CREATININE_LOINC_SET = new Set([
    exports.LOINC_CODES.CREATININE_SERUM_OR_PLASMA,
    exports.LOINC_CODES.CREATININE_BLOOD,
]);
/**
 * Normalizes ANC to standard 10^3 / uL (e.g. 1500 /uL -> 1.5 x 10^3/uL)
 */
function normalizeAncUnit(value, unit) {
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
function normalizeCreatinineUnit(value, unit) {
    const cleanUnit = unit.trim().toLowerCase();
    if (cleanUnit === "umol/l" || cleanUnit === "µmol/l") {
        // 1 mg/dL = 88.4 umol/L
        return Number((value / 88.4).toFixed(2));
    }
    return value;
}
