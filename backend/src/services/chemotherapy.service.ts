/**
 * Chemotherapy Service
 * Coordinates FHIR data retrieval, protocol parsing, and safety gate assessments.
 */

import { medicationRequestService } from "../fhir/medicationRequest.js";
import { observationService } from "../fhir/observations.js";
import { protocolParser } from "../chemotherapy/protocolParser.js";
import { safetyGateEngine } from "../chemotherapy/safetyGate.js";
import { auditEventService } from "../compliance/audit.js";
import { administrationService } from "./administration.service.js";
import { SafetyGateAssessment } from "../chemotherapy/types.js";
import { fhirClient } from "../fhir/client.js";

export class ChemotherapyService {
  /**
   * Retrieves full safety gate assessment for an inpatient.
   */
  async getSafetyAssessment(
    patientId: string,
    override?: { authorizedBy: string; reason: string }
  ): Promise<SafetyGateAssessment> {
    const patient = fhirClient.getPatient(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found`);
    }

    // 1. Fetch active chemotherapy orders
    const orders = await medicationRequestService.getActiveChemotherapyOrders(patientId);
    const primaryOrder = orders[0] || null;

    // 2. Parse protocol if order exists
    const parsedProtocol = primaryOrder ? protocolParser.parse(primaryOrder) : null;

    // 3. Fetch latest LOINC-coded lab results
    const ancObservation = await observationService.getLatestANC(patientId);
    const creatinineObservation = await observationService.getLatestCreatinine(patientId);

    // 4. Evaluate Safety Gate Rules
    const assessment = safetyGateEngine.evaluate({
      patientId,
      protocol: parsedProtocol,
      ancObservation,
      creatinineObservation,
      override,
    });

    // 5. Update bedside pump interlock status
    administrationService.updateSafetyGateStatus(patientId, assessment);

    // 6. Log AuditEvent
    auditEventService.logSafetyGateEvaluation({
      patientId,
      passed: assessment.overallPassed || assessment.gateStatus === "OVERRIDE",
      gateStatus: assessment.gateStatus,
      blockingReasons: assessment.blockingReasons,
      requestor: override?.authorizedBy || "SYSTEM_SAFETY_GATE",
    });

    return assessment;
  }
}

export const chemotherapyService = new ChemotherapyService();
