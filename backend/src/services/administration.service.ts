/**
 * Bedside Administration and IV Pump Telemetry Service
 * Manages bedside infusion pump states, interlocks with safety gates, and handles HL7 RAS^O17 messages.
 */

import { BedsidePumpStatus, ParsedRasO17Event } from "../hl7/types.js";
import { rasO17Handler } from "../hl7/rasO17Handler.js";
import { auditEventService } from "../compliance/audit.js";
import { fhirClient } from "../fhir/client.js";
import { SafetyGateAssessment } from "../chemotherapy/types.js";

export class AdministrationService {
  private pumpStates: Map<string, BedsidePumpStatus> = new Map();
  private patientGateStatuses: Map<string, { status: string; allowed: boolean; reasons: string[] }> = new Map();

  constructor() {
    this.initDefaultPumps();
  }

  private initDefaultPumps(): void {
    // Seed initial pump states for test patients
    this.pumpStates.set("P-1001", {
      patientId: "P-1001",
      mrn: "MRN-8849201",
      infusionState: "READY_ARMED",
      currentRateMlPerHour: 0,
      totalVolumeDeliveredMl: 0,
      activeDrugName: "Oxaliplatin (FOLFOX6)",
      startTime: null,
      endTime: null,
      lastRasEvent: null,
      safetyInterlocked: false,
      alarmRaised: false,
      alarmMessage: null,
    });

    this.pumpStates.set("P-1002", {
      patientId: "P-1002",
      mrn: "MRN-7738202",
      infusionState: "HOLD_INTERLOCKED",
      currentRateMlPerHour: 0,
      totalVolumeDeliveredMl: 0,
      activeDrugName: "Rituximab (R-CHOP)",
      startTime: null,
      endTime: null,
      lastRasEvent: null,
      safetyInterlocked: true,
      alarmRaised: true,
      alarmMessage: "SAFETY GATE HOLD: ANC < 1.5. Infusion prohibited.",
    });

    this.pumpStates.set("P-1003", {
      patientId: "P-1003",
      mrn: "MRN-6541093",
      infusionState: "HOLD_INTERLOCKED",
      currentRateMlPerHour: 0,
      totalVolumeDeliveredMl: 0,
      activeDrugName: "Cisplatin",
      startTime: null,
      endTime: null,
      lastRasEvent: null,
      safetyInterlocked: true,
      alarmRaised: true,
      alarmMessage: "SAFETY GATE HOLD: Serum Creatinine > 1.5 mg/dL. Infusion prohibited.",
    });

    this.pumpStates.set("P-1004", {
      patientId: "P-1004",
      mrn: "MRN-3312904",
      infusionState: "HOLD_INTERLOCKED",
      currentRateMlPerHour: 0,
      totalVolumeDeliveredMl: 0,
      activeDrugName: "FOLFOX6",
      startTime: null,
      endTime: null,
      lastRasEvent: null,
      safetyInterlocked: true,
      alarmRaised: true,
      alarmMessage: "SAFETY GATE HOLD: Missing same-day labs.",
    });
  }

  public getPumpStatus(patientId: string): BedsidePumpStatus {
    let status = this.pumpStates.get(patientId);
    if (!status) {
      status = {
        patientId,
        mrn: "MRN-UNKNOWN",
        infusionState: "IDLE",
        currentRateMlPerHour: 0,
        totalVolumeDeliveredMl: 0,
        activeDrugName: "No Active Order",
        startTime: null,
        endTime: null,
        lastRasEvent: null,
        safetyInterlocked: false,
        alarmRaised: false,
        alarmMessage: null,
      };
      this.pumpStates.set(patientId, status);
    }
    return status;
  }

  public updateSafetyGateStatus(patientId: string, assessment: SafetyGateAssessment): void {
    this.patientGateStatuses.set(patientId, {
      status: assessment.gateStatus,
      allowed: assessment.bedsidePumpAllowed,
      reasons: assessment.blockingReasons,
    });

    const pump = this.getPumpStatus(patientId);
    if (!assessment.bedsidePumpAllowed) {
      pump.safetyInterlocked = true;
      if (pump.infusionState === "INFUSING") {
        pump.infusionState = "HOLD_INTERLOCKED";
        pump.alarmRaised = true;
        pump.alarmMessage = `EMERGENCY INTERLOCK: Chemotherapy gate changed to HOLD (${assessment.blockingReasons[0] || "Safety violation"})`;
        pump.currentRateMlPerHour = 0;
      } else if (pump.infusionState === "READY_ARMED" || pump.infusionState === "IDLE") {
        pump.infusionState = "HOLD_INTERLOCKED";
        pump.alarmRaised = true;
        pump.alarmMessage = `SAFETY HOLD: ${assessment.blockingReasons[0] || "Clinical contraindication"}`;
      }
    } else {
      pump.safetyInterlocked = false;
      pump.alarmRaised = false;
      pump.alarmMessage = null;
      if (pump.infusionState === "HOLD_INTERLOCKED" || pump.infusionState === "IDLE") {
        pump.infusionState = "READY_ARMED";
      }
    }
  }

  /**
   * Ingests an HL7 v2 RAS^O17 message from the bedside infusion pump.
   */
  public ingestHl7RasMessage(rawHl7: string): {
    success: boolean;
    event: ParsedRasO17Event;
    pumpStatus: BedsidePumpStatus;
    interlockAlert?: string;
  } {
    const event = rasO17Handler.parseRasMessage(rawHl7);

    // Match patient by MRN or ID
    const patients = fhirClient.getAllPatients();
    const matchedPatient = patients.find((p) =>
      p.identifier?.some((id) => id.value === event.patientMrn)
    );

    const patientId = matchedPatient ? matchedPatient.id : "P-1001";
    const pump = this.getPumpStatus(patientId);
    const gateInfo = this.patientGateStatuses.get(patientId);

    // CHECK SAFETY INTERLOCK:
    // If gate status is HOLD and the message signals start of infusion
    if (gateInfo && !gateInfo.allowed && event.completionStatus !== "COMPLETED") {
      pump.infusionState = "HOLD_INTERLOCKED";
      pump.safetyInterlocked = true;
      pump.alarmRaised = true;
      pump.alarmMessage = `SAFETY INTERLOCK VIOLATION: Ingested RAS^O17 pump start event for patient on HOLD (${gateInfo.reasons.join(", ")})`;
      pump.lastRasEvent = event;

      auditEventService.logBedsideAdministrationEvent({
        patientId,
        status: "HOLD_INTERLOCKED",
        interlockViolation: true,
        details: pump.alarmMessage,
      });

      return {
        success: false,
        event,
        pumpStatus: pump,
        interlockAlert: pump.alarmMessage,
      };
    }

    // Process valid administration event
    pump.lastRasEvent = event;
    pump.activeDrugName = event.administeredName;

    if (event.completionStatus === "COMPLETED") {
      pump.infusionState = "COMPLETED";
      pump.currentRateMlPerHour = 0;
      pump.endTime = event.adminEndTime || new Date().toISOString();
      pump.totalVolumeDeliveredMl += event.administeredAmount || 250;
    } else {
      pump.infusionState = "INFUSING";
      pump.startTime = event.adminStartTime;
      pump.currentRateMlPerHour = 125; // Standard infusion rate for initial step
      pump.totalVolumeDeliveredMl = 35; // initial volume delivered
    }

    // Persist as FHIR MedicationAdministration
    const fhirAdmin = rasO17Handler.toFhirMedicationAdministration(event, patientId);
    fhirClient.addMedicationAdministration(patientId, fhirAdmin);

    // Audit log
    auditEventService.logBedsideAdministrationEvent({
      patientId,
      status: pump.infusionState,
      interlockViolation: false,
      details: `Bedside pump status updated to ${pump.infusionState} via RAS^O17 event (RxNorm: ${event.administeredCode})`,
    });

    return {
      success: true,
      event,
      pumpStatus: pump,
    };
  }
}

export const administrationService = new AdministrationService();
