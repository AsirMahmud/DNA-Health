"use strict";
/**
 * FHIR Observation Data Access Service
 * Retrieves lab results programmatically using LOINC code matching.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.observationService = exports.ObservationService = void 0;
const client_js_1 = require("./client.js");
const loinc_js_1 = require("../terminology/loinc.js");
class ObservationService {
    /**
     * Finds the latest observation matching any code in a given set of LOINC codes.
     */
    async getLatestObservationByLoincCodes(patientId, loincSet) {
        const observations = client_js_1.fhirClient.getObservations(patientId);
        // Filter observations containing any of the target LOINC codes in their codings
        const matchingObs = observations.filter((obs) => {
            return (obs.code.coding || []).some((coding) => {
                const isLoincSystem = coding.system.includes("loinc.org") || coding.system === "http://loinc.org";
                return isLoincSystem && loincSet.has(coding.code);
            });
        });
        if (matchingObs.length === 0)
            return null;
        // Sort by effectiveDateTime descending
        matchingObs.sort((a, b) => {
            const timeA = a.effectiveDateTime ? new Date(a.effectiveDateTime).getTime() : 0;
            const timeB = b.effectiveDateTime ? new Date(b.effectiveDateTime).getTime() : 0;
            return timeB - timeA;
        });
        return matchingObs[0];
    }
    /**
     * Retrieves the patient's latest Absolute Neutrophil Count (ANC).
     */
    async getLatestANC(patientId, maxAgeHours = 24) {
        const obs = await this.getLatestObservationByLoincCodes(patientId, loinc_js_1.ANC_LOINC_SET);
        if (!obs || !obs.valueQuantity?.value)
            return null;
        const coding = (obs.code.coding || []).find((c) => loinc_js_1.ANC_LOINC_SET.has(c.code));
        if (!coding)
            return null;
        const rawVal = obs.valueQuantity.value;
        const rawUnit = obs.valueQuantity.unit || "10*3/uL";
        const normalizedVal = (0, loinc_js_1.normalizeAncUnit)(rawVal, rawUnit);
        const effTime = obs.effectiveDateTime || new Date().toISOString();
        const ageHours = (Date.now() - new Date(effTime).getTime()) / (1000 * 3600);
        return {
            observationId: obs.id,
            loincCode: coding.code,
            display: coding.display || obs.code.text || "Absolute Neutrophil Count",
            rawNumericValue: rawVal,
            rawUnit,
            normalizedValue: normalizedVal,
            standardUnit: "10*3/uL",
            effectiveDateTime: effTime,
            ageInHours: Math.round(ageHours * 10) / 10,
            isExpired: ageHours > maxAgeHours,
            status: obs.status,
            interpretation: obs.interpretation?.[0]?.coding?.[0]?.code,
            referenceRangeText: obs.referenceRange?.[0]?.text,
        };
    }
    /**
     * Retrieves the patient's latest Serum Creatinine.
     */
    async getLatestCreatinine(patientId, maxAgeHours = 24) {
        const obs = await this.getLatestObservationByLoincCodes(patientId, loinc_js_1.CREATININE_LOINC_SET);
        if (!obs || !obs.valueQuantity?.value)
            return null;
        const coding = (obs.code.coding || []).find((c) => loinc_js_1.CREATININE_LOINC_SET.has(c.code));
        if (!coding)
            return null;
        const rawVal = obs.valueQuantity.value;
        const rawUnit = obs.valueQuantity.unit || "mg/dL";
        const normalizedVal = (0, loinc_js_1.normalizeCreatinineUnit)(rawVal, rawUnit);
        const effTime = obs.effectiveDateTime || new Date().toISOString();
        const ageHours = (Date.now() - new Date(effTime).getTime()) / (1000 * 3600);
        return {
            observationId: obs.id,
            loincCode: coding.code,
            display: coding.display || obs.code.text || "Serum Creatinine",
            rawNumericValue: rawVal,
            rawUnit,
            normalizedValue: normalizedVal,
            standardUnit: "mg/dL",
            effectiveDateTime: effTime,
            ageInHours: Math.round(ageHours * 10) / 10,
            isExpired: ageHours > maxAgeHours,
            status: obs.status,
            interpretation: obs.interpretation?.[0]?.coding?.[0]?.code,
            referenceRangeText: obs.referenceRange?.[0]?.text,
        };
    }
}
exports.ObservationService = ObservationService;
exports.observationService = new ObservationService();
