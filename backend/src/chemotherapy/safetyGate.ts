/**
 * Automated Lab Safety Gate Rule Engine
 * Evaluates ANC and Creatinine LOINC results against oncological safety thresholds.
 */

import {
  SafetyGateAssessment,
  SafetyRuleEvaluation,
  SafetyGateStatus,
  ParsedChemotherapyProtocol,
} from "./types.js";
import { StandardizedLabObservation } from "../fhir/observations.js";
import { LOINC_CODES } from "../terminology/loinc.js";

export interface SafetyGateThresholds {
  minANC: number; // 10^3 / uL
  maxSerumCreatinine: number; // mg/dL
  maxLabAgeHours: number;
}

export const DEFAULT_SAFETY_THRESHOLDS: SafetyGateThresholds = {
  minANC: 1.5,
  maxSerumCreatinine: 1.5,
  maxLabAgeHours: 24,
};

export class SafetyGateEngine {
  private thresholds: SafetyGateThresholds;

  constructor(thresholds: Partial<SafetyGateThresholds> = {}) {
    this.thresholds = { ...DEFAULT_SAFETY_THRESHOLDS, ...thresholds };
  }

  /**
   * Evaluates patient's lab observations and chemotherapy order to determine if infusion may proceed.
   */
  public evaluate(params: {
    patientId: string;
    protocol: ParsedChemotherapyProtocol | null;
    ancObservation: StandardizedLabObservation | null;
    creatinineObservation: StandardizedLabObservation | null;
    override?: {
      authorizedBy: string;
      reason: string;
    };
  }): SafetyGateAssessment {
    const { patientId, protocol, ancObservation, creatinineObservation, override } = params;
    const evaluations: SafetyRuleEvaluation[] = [];
    const blockingReasons: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // 1. Evaluate Absolute Neutrophil Count (ANC)
    const ancEval = this.evaluateANC(ancObservation);
    evaluations.push(ancEval);
    if (!ancEval.passed) {
      blockingReasons.push(ancEval.reason);
      recommendations.push("Consider G-CSF support (filgrastim) or dose delay until ANC recovers >= 1.5 x 10^3/uL.");
    }

    // 2. Evaluate Serum Creatinine
    const crEval = this.evaluateCreatinine(creatinineObservation);
    evaluations.push(crEval);
    if (!crEval.passed) {
      blockingReasons.push(crEval.reason);
      recommendations.push("Order renal ultrasound, 24h urine creatinine clearance, and nephrology consult prior to infusion.");
    }

    // Check lab freshness
    if (ancObservation && ancObservation.isExpired) {
      warnings.push(`ANC lab specimen is ${ancObservation.ageInHours} hours old (threshold: ${this.thresholds.maxLabAgeHours}h).`);
    }
    if (creatinineObservation && creatinineObservation.isExpired) {
      warnings.push(`Creatinine lab specimen is ${creatinineObservation.ageInHours} hours old (threshold: ${this.thresholds.maxLabAgeHours}h).`);
    }

    // Overall Status
    const allRulesPassed = evaluations.every((e) => e.passed);
    let gateStatus: SafetyGateStatus = allRulesPassed ? "PASS" : "HOLD";
    let bedsidePumpAllowed = allRulesPassed;

    if (!allRulesPassed && override) {
      gateStatus = "OVERRIDE";
      bedsidePumpAllowed = true;
      warnings.push(`CLINICAL OVERRIDE applied by ${override.authorizedBy}. Reason: ${override.reason}`);
    }

    return {
      patientId,
      timestamp: new Date().toISOString(),
      gateStatus,
      overallPassed: allRulesPassed,
      activeProtocol: protocol,
      evaluations,
      blockingReasons,
      warnings,
      recommendations,
      labsEvaluated: {
        anc: ancObservation,
        creatinine: creatinineObservation,
      },
      canOverride: !allRulesPassed,
      bedsidePumpAllowed,
    };
  }

  private evaluateANC(obs: StandardizedLabObservation | null): SafetyRuleEvaluation {
    const loincCode = obs?.loincCode || LOINC_CODES.ANC_AUTOMATED;

    if (!obs) {
      return {
        ruleId: "RULE-ANC-PRESENCE",
        ruleName: "Absolute Neutrophil Count (ANC) Verification",
        loincCode,
        labName: "Absolute Neutrophil Count",
        measuredValue: null,
        unit: "10*3/uL",
        safeThreshold: { min: this.thresholds.minANC },
        passed: false,
        reason: "Missing ANC laboratory result within active 24-hour cycle. Chemotherapy cannot proceed without bone marrow safety verification.",
        severity: "CRITICAL",
      };
    }

    if (obs.isExpired) {
      return {
        ruleId: "RULE-ANC-FRESHNESS",
        ruleName: "ANC Specimen Validity Window",
        loincCode,
        labName: "Absolute Neutrophil Count",
        measuredValue: obs.normalizedValue,
        unit: obs.standardUnit,
        safeThreshold: { min: this.thresholds.minANC },
        passed: false,
        reason: `ANC lab specimen is expired (${obs.ageInHours}h old). Same-day lab verification (< ${this.thresholds.maxLabAgeHours}h) is required.`,
        severity: "CRITICAL",
      };
    }

    const passed = obs.normalizedValue >= this.thresholds.minANC;
    return {
      ruleId: "RULE-ANC-THRESHOLD",
      ruleName: "Absolute Neutrophil Count (ANC) Safe Margin",
      loincCode,
      labName: "Absolute Neutrophil Count",
      measuredValue: obs.normalizedValue,
      unit: obs.standardUnit,
      safeThreshold: { min: this.thresholds.minANC },
      passed,
      reason: passed
        ? `ANC is ${obs.normalizedValue} 10^3/uL (safe threshold: >= ${this.thresholds.minANC} 10^3/uL). Bone marrow function adequate.`
        : `ANC is ${obs.normalizedValue} 10^3/uL, below safety cutoff of ${this.thresholds.minANC} 10^3/uL. High risk of severe neutropenic fever.`,
      severity: passed ? "INFO" : "CRITICAL",
    };
  }

  private evaluateCreatinine(obs: StandardizedLabObservation | null): SafetyRuleEvaluation {
    const loincCode = obs?.loincCode || LOINC_CODES.CREATININE_SERUM_OR_PLASMA;

    if (!obs) {
      return {
        ruleId: "RULE-CREATININE-PRESENCE",
        ruleName: "Serum Creatinine Verification",
        loincCode,
        labName: "Serum Creatinine",
        measuredValue: null,
        unit: "mg/dL",
        safeThreshold: { max: this.thresholds.maxSerumCreatinine },
        passed: false,
        reason: "Missing Serum Creatinine laboratory result within active 24-hour cycle. Renal safety gate cannot be confirmed.",
        severity: "CRITICAL",
      };
    }

    if (obs.isExpired) {
      return {
        ruleId: "RULE-CREATININE-FRESHNESS",
        ruleName: "Creatinine Specimen Validity Window",
        loincCode,
        labName: "Serum Creatinine",
        measuredValue: obs.normalizedValue,
        unit: obs.standardUnit,
        safeThreshold: { max: this.thresholds.maxSerumCreatinine },
        passed: false,
        reason: `Serum Creatinine lab specimen is expired (${obs.ageInHours}h old). Same-day lab verification is required.`,
        severity: "CRITICAL",
      };
    }

    const passed = obs.normalizedValue <= this.thresholds.maxSerumCreatinine;
    return {
      ruleId: "RULE-CREATININE-THRESHOLD",
      ruleName: "Serum Creatinine Safe Renal Clearance",
      loincCode,
      labName: "Serum Creatinine",
      measuredValue: obs.normalizedValue,
      unit: obs.standardUnit,
      safeThreshold: { max: this.thresholds.maxSerumCreatinine },
      passed,
      reason: passed
        ? `Serum Creatinine is ${obs.normalizedValue} mg/dL (safe threshold: <= ${this.thresholds.maxSerumCreatinine} mg/dL). Renal clearance adequate.`
        : `Serum Creatinine is ${obs.normalizedValue} mg/dL, exceeding safety cutoff of ${this.thresholds.maxSerumCreatinine} mg/dL. High risk of cytotoxic nephrotoxicity and drug accumulation.`,
      severity: passed ? "INFO" : "CRITICAL",
    };
  }
}

export const safetyGateEngine = new SafetyGateEngine();
