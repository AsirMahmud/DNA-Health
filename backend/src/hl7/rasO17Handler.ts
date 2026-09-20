/**
 * HL7 v2 RAS^O17 Administration Message Handler
 * Translates floor IV pump telemetry into bed monitor states and FHIR MedicationAdministration records.
 */

import { hl7Parser } from "./parser.js";
import { ParsedRasO17Event } from "./types.js";
import { fhirClient } from "../fhir/client.js";
import { FhirMedicationAdministration } from "../fhir/types.js";

export class RasO17Handler {
  /**
   * Parses raw HL7 v2 message and extracts structured RAS^O17 administration event.
   */
  public parseRasMessage(rawHl7: string): ParsedRasO17Event {
    const parsed = hl7Parser.parse(rawHl7);
    const enc = parsed.encoding;

    const msh = parsed.segments.find((s) => s.name === "MSH");
    const pid = parsed.segments.find((s) => s.name === "PID");
    const orc = parsed.segments.find((s) => s.name === "ORC");
    const rxa = parsed.segments.find((s) => s.name === "RXA");
    const rxr = parsed.segments.find((s) => s.name === "RXR");

    if (!rxa) {
      throw new Error("Invalid RAS^O17 message: missing required RXA (Pharmacy Administration) segment");
    }

    // PID-3: Patient Identifier List (MRN)
    const patientMrn = pid ? hl7Parser.getFieldComponentValue(pid, 3, 1, enc) : "";

    // PID-5: Patient Name
    let patientName = "";
    if (pid) {
      const family = hl7Parser.getFieldComponentValue(pid, 5, 1, enc);
      const given = hl7Parser.getFieldComponentValue(pid, 5, 2, enc);
      patientName = [given, family].filter(Boolean).join(" ");
    }

    // ORC-2: Placer Order Number
    const orderNumber = orc ? hl7Parser.getFieldComponentValue(orc, 2, 1, enc) : undefined;

    // RXA-3: Date/Time Start of Administration
    const adminStartTime = hl7Parser.getFieldComponentValue(rxa, 3, 1, enc) || new Date().toISOString();

    // RXA-4: Date/Time End of Administration
    const adminEndTime = hl7Parser.getFieldComponentValue(rxa, 4, 1, enc) || undefined;

    // RXA-5: Administered Code
    const administeredCode = hl7Parser.getFieldComponentValue(rxa, 5, 1, enc);
    const administeredName = hl7Parser.getFieldComponentValue(rxa, 5, 2, enc) || "Chemotherapy Infusion";
    const codingSystem = hl7Parser.getFieldComponentValue(rxa, 5, 3, enc) || "RxNorm";

    // RXA-6: Administered Amount
    const amountStr = hl7Parser.getFieldComponentValue(rxa, 6, 1, enc);
    const administeredAmount = amountStr ? parseFloat(amountStr) : 0;

    // RXA-7: Administered Units
    const administeredUnit = hl7Parser.getFieldComponentValue(rxa, 7, 1, enc) || "mg";

    // RXA-20: Completion Status (RE = Recorded/Start, CP = Complete, PA = Paused)
    const rawStatus = hl7Parser.getFieldComponentValue(rxa, 20, 1, enc);
    let completionStatus: ParsedRasO17Event["completionStatus"] = "START";
    if (rawStatus === "CP" || rawStatus === "COMPLETED") {
      completionStatus = "COMPLETED";
    } else if (rawStatus === "PA" || rawStatus === "INTERRUPTED") {
      completionStatus = "INTERRUPTED";
    } else if (rawStatus === "IP" || rawStatus === "IN_PROGRESS") {
      completionStatus = "IN_PROGRESS";
    }

    // RXR-1: Route
    const route = rxr ? hl7Parser.getFieldComponentValue(rxr, 1, 2, enc) || hl7Parser.getFieldComponentValue(rxr, 1, 1, enc) : "Intravenous";

    return {
      messageControlId: parsed.messageControlId,
      timestamp: parsed.timestamp || new Date().toISOString(),
      sendingApplication: parsed.senderApp || "INFUSION_PUMP",
      patientMrn,
      patientName,
      orderNumber,
      adminStartTime,
      adminEndTime,
      administeredCode,
      administeredName,
      codingSystem,
      administeredAmount,
      administeredUnit,
      completionStatus,
      route,
      rawHl7,
    };
  }

  /**
   * Generates a FHIR MedicationAdministration resource from the parsed RAS event.
   */
  public toFhirMedicationAdministration(
    event: ParsedRasO17Event,
    patientId: string
  ): FhirMedicationAdministration {
    return {
      resourceType: "MedicationAdministration",
      id: `admin-${event.messageControlId}-${Date.now()}`,
      status: event.completionStatus === "COMPLETED" ? "completed" : "in-progress",
      subject: { reference: `Patient/${patientId}` },
      effectiveDateTime: event.adminStartTime,
      medicationCodeableConcept: {
        coding: [
          {
            system: "http://hl7.org/fhir/sid/rxnorm",
            code: event.administeredCode,
            display: event.administeredName,
          },
        ],
        text: event.administeredName,
      },
      dosage: {
        route: {
          text: event.route || "Intravenous",
        },
        dose: {
          value: event.administeredAmount,
          unit: event.administeredUnit,
          system: "http://unitsofmeasure.org",
          code: event.administeredUnit,
        },
      },
    };
  }
}

export const rasO17Handler = new RasO17Handler();
