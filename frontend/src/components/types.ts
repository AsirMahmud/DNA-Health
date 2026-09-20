export interface PatientOverview {
  id: string;
  name: Array<{ family: string; given: string[] }>;
  gender: string;
  birthDate: string;
  identifier?: Array<{ system: string; value: string }>;
}

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
  gateStatus: "PASS" | "HOLD" | "OVERRIDE";
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

export interface BedsidePumpStatus {
  patientId: string;
  mrn: string;
  infusionState: "IDLE" | "READY_ARMED" | "INFUSING" | "HOLD_INTERLOCKED" | "COMPLETED";
  currentRateMlPerHour: number;
  totalVolumeDeliveredMl: number;
  activeDrugName: string;
  startTime: string | null;
  endTime: string | null;
  lastRasEvent: any;
  safetyInterlocked: boolean;
  alarmRaised: boolean;
  alarmMessage: string | null;
}

export interface FhirAuditEvent {
  resourceType: "AuditEvent";
  id: string;
  type?: { code: string; display?: string };
  subtype?: Array<{ code: string; display?: string }>;
  action: string;
  recorded: string;
  outcome: string;
  outcomeDesc?: string;
  agent: any[];
  entity?: any[];
}
