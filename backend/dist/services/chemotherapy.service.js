"use strict";
/**
 * Chemotherapy Service
 * Coordinates FHIR data retrieval, protocol parsing, and safety gate assessments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.chemotherapyService = exports.ChemotherapyService = void 0;
const medicationRequest_js_1 = require("../fhir/medicationRequest.js");
const observations_js_1 = require("../fhir/observations.js");
const protocolParser_js_1 = require("../chemotherapy/protocolParser.js");
const safetyGate_js_1 = require("../chemotherapy/safetyGate.js");
const audit_js_1 = require("../compliance/audit.js");
const administration_service_js_1 = require("./administration.service.js");
const client_js_1 = require("../fhir/client.js");
class ChemotherapyService {
    /**
     * Retrieves full safety gate assessment for an inpatient.
     */
    async getSafetyAssessment(patientId, override) {
        const patient = client_js_1.fhirClient.getPatient(patientId);
        if (!patient) {
            throw new Error(`Patient ${patientId} not found`);
        }
        // 1. Fetch active chemotherapy orders
        const orders = await medicationRequest_js_1.medicationRequestService.getActiveChemotherapyOrders(patientId);
        const primaryOrder = orders[0] || null;
        // 2. Parse protocol if order exists
        const parsedProtocol = primaryOrder ? protocolParser_js_1.protocolParser.parse(primaryOrder) : null;
        // 3. Fetch latest LOINC-coded lab results
        const ancObservation = await observations_js_1.observationService.getLatestANC(patientId);
        const creatinineObservation = await observations_js_1.observationService.getLatestCreatinine(patientId);
        // 4. Evaluate Safety Gate Rules
        const assessment = safetyGate_js_1.safetyGateEngine.evaluate({
            patientId,
            protocol: parsedProtocol,
            ancObservation,
            creatinineObservation,
            override,
        });
        // 5. Update bedside pump interlock status
        administration_service_js_1.administrationService.updateSafetyGateStatus(patientId, assessment);
        // 6. Log AuditEvent
        audit_js_1.auditEventService.logSafetyGateEvaluation({
            patientId,
            passed: assessment.overallPassed || assessment.gateStatus === "OVERRIDE",
            gateStatus: assessment.gateStatus,
            blockingReasons: assessment.blockingReasons,
            requestor: override?.authorizedBy || "SYSTEM_SAFETY_GATE",
        });
        return assessment;
    }
}
exports.ChemotherapyService = ChemotherapyService;
exports.chemotherapyService = new ChemotherapyService();
