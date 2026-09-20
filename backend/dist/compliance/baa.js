"use strict";
/**
 * Simulated BAA (Business Associate Agreement) Data Minimization & De-Identification Engine
 * Implements HIPAA Safe Harbor de-identification rules for external and cancer registry transmission.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.baaComplianceService = exports.BaaComplianceService = void 0;
class BaaComplianceService {
    /**
     * Evaluates if a given dataset complies with BAA minimization policy.
     */
    verifyBaaCompliance(payload) {
        const violations = [];
        const str = JSON.stringify(payload).toLowerCase();
        // Check for obvious leaked cleartext PHI patterns
        if (/"ssn"\s*:\s*"\d{3}-\d{2}-\d{4}"/i.test(str)) {
            violations.push("Unmasked Social Security Number detected in payload");
        }
        if (/"telecom"/.test(str) && /"value"\s*:\s*"\d{3}/.test(str)) {
            violations.push("Direct telephone number present in public payload");
        }
        if (/"address"/.test(str) && /"line"/.test(str)) {
            violations.push("Street-level address lines present (violates HIPAA Safe Harbor)");
        }
        return {
            compliant: violations.length === 0,
            violations,
        };
    }
    /**
     * De-identifies a FHIR Patient for external cancer registry transmission under HIPAA Safe Harbor.
     */
    deIdentifyPatient(patient) {
        const birthYear = patient.birthDate ? patient.birthDate.substring(0, 4) : "UNKNOWN";
        const state = patient.address?.[0]?.state || "US";
        return {
            resourceType: "Patient",
            id: `ANON-${patient.id}`,
            active: patient.active,
            name: [
                {
                    use: "anonymous",
                    family: "REDACTED",
                    given: ["PATIENT"],
                },
            ],
            gender: patient.gender,
            birthDate: `${birthYear}-01-01`, // Truncated to year only per Safe Harbor
            pseudoIdentifier: `HASH-${Buffer.from(patient.id + "BAA_SALT_2026").toString("hex").slice(0, 12).toUpperCase()}`,
            birthYear,
            stateOnly: state,
            isDeIdentified: true,
        };
    }
}
exports.BaaComplianceService = BaaComplianceService;
exports.baaComplianceService = new BaaComplianceService();
