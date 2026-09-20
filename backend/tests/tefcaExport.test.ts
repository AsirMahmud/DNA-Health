import { describe, it, expect } from "vitest";
import { tefcaComplianceService } from "../src/compliance/tefca.js";
import { baaComplianceService } from "../src/compliance/baa.js";
import { fhirClient } from "../src/fhir/client.js";

describe("TEFCA Cancer Registry Export and BAA Compliance Pipeline", () => {
  it("should de-identify patient data according to HIPAA Safe Harbor", () => {
    const rawPatient = fhirClient.getPatient("P-1001")!;
    expect(rawPatient).toBeDefined();

    const deIdPatient = baaComplianceService.deIdentifyPatient(rawPatient);

    // Verifications
    expect(deIdPatient.isDeIdentified).toBe(true);
    expect(deIdPatient.name?.[0].family).toBe("REDACTED");
    expect(deIdPatient.name?.[0].given?.[0]).toBe("PATIENT");
    expect(deIdPatient.birthDate).toBe("1968-01-01"); // Year-only safe harbor
    expect(deIdPatient.birthYear).toBe("1968");
    expect(deIdPatient.id).toBe("ANON-P-1001");
  });

  it("should detect BAA policy violations on cleartext PHI", () => {
    const dirtyPayload = {
      patientName: "Eleanor Vance",
      ssn: "902-11-4829",
      telecom: [{ value: "555-019-2831" }],
      address: { line: ["742 Evergreen Terrace"] },
    };

    const result = baaComplianceService.verifyBaaCompliance(dirtyPayload);
    expect(result.compliant).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("should assemble a valid TEFCA FHIR R4 Bundle for national cancer registries", () => {
    const bundle = tefcaComplianceService.generateCancerRegistryBundle({
      patientId: "P-1001",
      destinationRegistry: "CDC-NHSN-CANCER-REGISTRY",
      deIdentify: true,
    });

    expect(bundle.resourceType).toBe("Bundle");
    expect(bundle.type).toBe("collection");
    expect(bundle.total).toBeGreaterThan(0);
    expect(bundle.entry).toBeDefined();

    // Check that first entry is the de-identified patient
    const patientEntry = bundle.entry?.[0];
    expect(patientEntry?.resource.resourceType).toBe("Patient");
    expect(patientEntry?.resource.name[0].family).toBe("REDACTED");

    // Check that clinical oncology protocols and lab observations are preserved
    const resourceTypes = bundle.entry?.map((e) => e.resource.resourceType);
    expect(resourceTypes).toContain("Patient");
    expect(resourceTypes).toContain("MedicationRequest");
    expect(resourceTypes).toContain("Observation");

    // Check that an AuditEvent was recorded for this TEFCA export
    const audits = fhirClient.getAuditEvents("P-1001");
    expect(audits.some((a) => a.type.code === "export")).toBe(true);
  });
});
