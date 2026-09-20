/**
 * FHIR Observation Data Access Service
 * Retrieves lab results programmatically using LOINC code matching.
 */

import { fhirClient } from "./client.js";
import { FhirObservation } from "./types.js";
import {
  ANC_LOINC_SET,
  CREATININE_LOINC_SET,
  normalizeAncUnit,
  normalizeCreatinineUnit,
} from "../terminology/loinc.js";

export interface StandardizedLabObservation {
  observationId: string;
  loincCode: string;
  display: string;
  rawNumericValue: number;
  rawUnit: string;
  normalizedValue: number;
  standardUnit: string;
  effectiveDateTime: string;
  ageInHours: number;
  isExpired: boolean;
  status: string;
  interpretation?: string;
  referenceRangeText?: string;
}

export class ObservationService {
  /**
   * Finds the latest observation matching any code in a given set of LOINC codes.
   */
  async getLatestObservationByLoincCodes(
    patientId: string,
    loincSet: Set<string>
  ): Promise<FhirObservation | null> {
    const observations = fhirClient.getObservations(patientId);

    // Filter observations containing any of the target LOINC codes in their codings
    const matchingObs = observations.filter((obs) => {
      return (obs.code.coding || []).some((coding) => {
        const isLoincSystem =
          coding.system.includes("loinc.org") || coding.system === "http://loinc.org";
        return isLoincSystem && loincSet.has(coding.code);
      });
    });

    if (matchingObs.length === 0) return null;

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
  async getLatestANC(patientId: string, maxAgeHours = 24): Promise<StandardizedLabObservation | null> {
    const obs = await this.getLatestObservationByLoincCodes(patientId, ANC_LOINC_SET);
    if (!obs || !obs.valueQuantity?.value) return null;

    const coding = (obs.code.coding || []).find((c) => ANC_LOINC_SET.has(c.code));
    if (!coding) return null;
    const rawVal = obs.valueQuantity.value;
    const rawUnit = obs.valueQuantity.unit || "10*3/uL";
    const normalizedVal = normalizeAncUnit(rawVal, rawUnit);

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
  async getLatestCreatinine(patientId: string, maxAgeHours = 24): Promise<StandardizedLabObservation | null> {
    const obs = await this.getLatestObservationByLoincCodes(patientId, CREATININE_LOINC_SET);
    if (!obs || !obs.valueQuantity?.value) return null;

    const coding = (obs.code.coding || []).find((c) => CREATININE_LOINC_SET.has(c.code));
    if (!coding) return null;
    const rawVal = obs.valueQuantity.value;
    const rawUnit = obs.valueQuantity.unit || "mg/dL";
    const normalizedVal = normalizeCreatinineUnit(rawVal, rawUnit);

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

export const observationService = new ObservationService();
