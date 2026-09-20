import { describe, it, expect } from "vitest";
import { safetyGateEngine } from "../src/chemotherapy/safetyGate.js";
import { chemotherapyService } from "../src/services/chemotherapy.service.js";

describe("Automated Lab Safety Gate Engine (LOINC)", () => {
  it("should evaluate PASS when ANC >= 1.5 and Creatinine <= 1.5 (P-1001)", async () => {
    const assessment = await chemotherapyService.getSafetyAssessment("P-1001");

    expect(assessment.gateStatus).toBe("PASS");
    expect(assessment.overallPassed).toBe(true);
    expect(assessment.bedsidePumpAllowed).toBe(true);
    expect(assessment.blockingReasons.length).toBe(0);

    // Verify LOINC labs evaluated
    expect(assessment.labsEvaluated.anc).toBeDefined();
    expect(assessment.labsEvaluated.anc?.loincCode).toBe("26499-4");
    expect(assessment.labsEvaluated.anc?.normalizedValue).toBe(2.4);

    expect(assessment.labsEvaluated.creatinine).toBeDefined();
    expect(assessment.labsEvaluated.creatinine?.loincCode).toBe("2160-0");
    expect(assessment.labsEvaluated.creatinine?.normalizedValue).toBe(0.9);
  });

  it("should evaluate HOLD when ANC < 1.5 (Neutropenia - P-1002)", async () => {
    const assessment = await chemotherapyService.getSafetyAssessment("P-1002");

    expect(assessment.gateStatus).toBe("HOLD");
    expect(assessment.overallPassed).toBe(false);
    expect(assessment.bedsidePumpAllowed).toBe(false);
    expect(assessment.blockingReasons.some((r) => r.toLowerCase().includes("anc"))).toBe(true);
    expect(assessment.labsEvaluated.anc?.normalizedValue).toBe(0.8);
  });

  it("should evaluate HOLD when Creatinine > 1.5 (Renal Impairment - P-1003)", async () => {
    const assessment = await chemotherapyService.getSafetyAssessment("P-1003");

    expect(assessment.gateStatus).toBe("HOLD");
    expect(assessment.overallPassed).toBe(false);
    expect(assessment.bedsidePumpAllowed).toBe(false);
    expect(assessment.blockingReasons.some((r) => r.toLowerCase().includes("creatinine"))).toBe(true);
    expect(assessment.labsEvaluated.creatinine?.normalizedValue).toBe(2.4);
  });

  it("should evaluate HOLD when labs are expired > 24 hours (P-1004)", async () => {
    const assessment = await chemotherapyService.getSafetyAssessment("P-1004");

    expect(assessment.gateStatus).toBe("HOLD");
    expect(assessment.overallPassed).toBe(false);
    expect(assessment.blockingReasons.some((r) => r.toLowerCase().includes("expired"))).toBe(true);
  });

  it("should allow OVERRIDE with credentialed oncologist authorization", async () => {
    const assessment = await chemotherapyService.getSafetyAssessment("P-1002", {
      authorizedBy: "Dr. Gregory House, MD (Oncology Chief)",
      reason: "Patient received Pegfilgrastim 48h prior; nadir expected to recover, proceeding with 20% dose reduction per tumor board.",
    });

    expect(assessment.gateStatus).toBe("OVERRIDE");
    expect(assessment.bedsidePumpAllowed).toBe(true);
    expect(assessment.warnings.some((w) => w.includes("CLINICAL OVERRIDE"))).toBe(true);
  });
});
