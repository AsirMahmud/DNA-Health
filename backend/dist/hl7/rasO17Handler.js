"use strict";
/**
 * HL7 v2 RAS^O17 Administration Message Handler
 * Translates floor IV pump telemetry into bed monitor states and FHIR MedicationAdministration records.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rasO17Handler = exports.RasO17Handler = void 0;
const parser_js_1 = require("./parser.js");
class RasO17Handler {
    /**
     * Parses raw HL7 v2 message and extracts structured RAS^O17 administration event.
     */
    parseRasMessage(rawHl7) {
        const parsed = parser_js_1.hl7Parser.parse(rawHl7);
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
        const patientMrn = pid ? parser_js_1.hl7Parser.getFieldComponentValue(pid, 3, 1, enc) : "";
        // PID-5: Patient Name
        let patientName = "";
        if (pid) {
            const family = parser_js_1.hl7Parser.getFieldComponentValue(pid, 5, 1, enc);
            const given = parser_js_1.hl7Parser.getFieldComponentValue(pid, 5, 2, enc);
            patientName = [given, family].filter(Boolean).join(" ");
        }
        // ORC-2: Placer Order Number
        const orderNumber = orc ? parser_js_1.hl7Parser.getFieldComponentValue(orc, 2, 1, enc) : undefined;
        // RXA-3: Date/Time Start of Administration
        const adminStartTime = parser_js_1.hl7Parser.getFieldComponentValue(rxa, 3, 1, enc) || new Date().toISOString();
        // RXA-4: Date/Time End of Administration
        const adminEndTime = parser_js_1.hl7Parser.getFieldComponentValue(rxa, 4, 1, enc) || undefined;
        // RXA-5: Administered Code
        const administeredCode = parser_js_1.hl7Parser.getFieldComponentValue(rxa, 5, 1, enc);
        const administeredName = parser_js_1.hl7Parser.getFieldComponentValue(rxa, 5, 2, enc) || "Chemotherapy Infusion";
        const codingSystem = parser_js_1.hl7Parser.getFieldComponentValue(rxa, 5, 3, enc) || "RxNorm";
        // RXA-6: Administered Amount
        const amountStr = parser_js_1.hl7Parser.getFieldComponentValue(rxa, 6, 1, enc);
        const administeredAmount = amountStr ? parseFloat(amountStr) : 0;
        // RXA-7: Administered Units
        const administeredUnit = parser_js_1.hl7Parser.getFieldComponentValue(rxa, 7, 1, enc) || "mg";
        // RXA-20: Completion Status (RE = Recorded/Start, CP = Complete, PA = Paused)
        const rawStatus = parser_js_1.hl7Parser.getFieldComponentValue(rxa, 20, 1, enc);
        let completionStatus = "START";
        if (rawStatus === "CP" || rawStatus === "COMPLETED") {
            completionStatus = "COMPLETED";
        }
        else if (rawStatus === "PA" || rawStatus === "INTERRUPTED") {
            completionStatus = "INTERRUPTED";
        }
        else if (rawStatus === "IP" || rawStatus === "IN_PROGRESS") {
            completionStatus = "IN_PROGRESS";
        }
        // RXR-1: Route
        const route = rxr ? parser_js_1.hl7Parser.getFieldComponentValue(rxr, 1, 2, enc) || parser_js_1.hl7Parser.getFieldComponentValue(rxr, 1, 1, enc) : "Intravenous";
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
    toFhirMedicationAdministration(event, patientId) {
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
exports.RasO17Handler = RasO17Handler;
exports.rasO17Handler = new RasO17Handler();
