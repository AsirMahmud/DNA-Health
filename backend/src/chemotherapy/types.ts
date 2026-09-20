/**
 * Chemotherapy Protocol and Safety Gate Domain Types
 */

import { StandardizedLabObservation } from "../fhir/observations.js";

export interface ParsedIngredient {
  name: string;
  brandName?: string;
  rxNormCode: string;
  isActive: boolean;
  category: "CHEMOTHERAPY" | "CARRIER_FLUID" | "RESCUE_AGENT" | "PREMEDICATION" | "OTHER";
  dose?: {
    value: number;
    unit: string;
  };
  strengthRatio?: {
    numeratorValue: number;
    numeratorUnit: string;
    denominatorValue: number;
    denominatorUnit: string;
  };
}

export interface ParsedDoseInstruction {
  sequence: number;
  text: string;
  route: string;
  rateQuantity?: {
    value: number;
    unit: string;
  };
  durationHours?: number;
  totalVolumeMl?: number;
  calculatedRateMlPerHour?: number;
}

export interface ParsedChemotherapyProtocol {
  medicationRequestId: string;
  protocolName: string;
  rxNormCode?: string;
  authoredOn?: string;
  status: string;
  intent: string;
  activeIngredients: ParsedIngredient[];
  carrierFluids: ParsedIngredient[];
  dosageInstructions: ParsedDoseInstruction[];
  clinicalNotes: string[];
  requiresCentralLine: boolean;
}

export type SafetyGateStatus = "PASS" | "HOLD" | "OVERRIDE";

export interface SafetyRuleEvaluation {
  ruleId: string;
  ruleName: string;
  loincCode: string;
  labName: string;
  measuredValue: number | null;
  unit: string;
  safeThreshold: {
    min?: number;
    max?: number;
  };
  passed: boolean;
  reason: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
}

export interface SafetyGateAssessment {
  patientId: string;
  timestamp: string;
  gateStatus: SafetyGateStatus;
  overallPassed: boolean;
  activeProtocol: ParsedChemotherapyProtocol | null;
  evaluations: SafetyRuleEvaluation[];
  blockingReasons: string[];
  warnings: string[];
  recommendations: string[];
  labsEvaluated: {
    anc: StandardizedLabObservation | null;
    creatinine: StandardizedLabObservation | null;
  };
  canOverride: boolean;
  bedsidePumpAllowed: boolean;
}
