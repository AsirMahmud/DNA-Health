"use strict";
/**
 * FHIR AuditEvent Generator and HIPAA Access Logger
 * Records immutable audit trails for clinical safety checks, overrides, and external transmissions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditEventService = exports.AuditEventService = void 0;
const client_js_1 = require("../fhir/client.js");
const env_js_1 = require("../config/env.js");
class AuditEventService {
    /**
     * Logs a Safety Gate evaluation event
     */
    logSafetyGateEvaluation(params) {
        const outcome = params.passed ? "0" : "4";
        const auditEvent = {
            resourceType: "AuditEvent",
            id: `audit-gate-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: {
                system: "http://terminology.hl7.org/CodeSystem/audit-event-type",
                code: "rest",
                display: "RESTful Operation",
            },
            subtype: [
                {
                    system: "http://hl7.org/fhir/restful-interaction",
                    code: "operation",
                    display: "Chemotherapy Safety Gate Evaluation",
                },
            ],
            action: "E", // Execute
            recorded: new Date().toISOString(),
            outcome,
            outcomeDesc: params.passed
                ? `Safety gate evaluation: PASS. Automated clearance issued.`
                : `Safety gate evaluation: ${params.gateStatus}. Reasons: ${params.blockingReasons.join("; ")}`,
            agent: [
                {
                    requestor: false,
                    who: {
                        reference: `Device/AUTOMATED_SAFETY_GATE_SERVICE`,
                        display: "Chemotherapy Infusion Safety Gate v1.0",
                    },
                },
            ],
            source: {
                site: env_js_1.config.hospitalId,
                observer: {
                    reference: "Device/SAFETY_GATE_DAEMON",
                    display: "Inpatient Oncology Clinical Decision Support",
                },
            },
            entity: [
                {
                    what: { reference: `Patient/${params.patientId}` },
                    description: `Patient Oncology Safety Assessment (${params.gateStatus})`,
                },
            ],
        };
        client_js_1.fhirClient.addAuditEvent(params.patientId, auditEvent);
        return auditEvent;
    }
    /**
     * Logs an HL7 bedside administration event or safety interlock violation
     */
    logBedsideAdministrationEvent(params) {
        const outcome = params.interlockViolation ? "8" : "0"; // 8 = Serious failure/security alert
        const auditEvent = {
            resourceType: "AuditEvent",
            id: `audit-hl7-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: {
                system: "http://terminology.hl7.org/CodeSystem/audit-event-type",
                code: "import",
                display: "HL7 Message Ingestion",
            },
            subtype: [
                {
                    system: "http://hl7.org/fhir/restful-interaction",
                    code: "create",
                    display: "RAS^O17 Bedside Pump Telemetry Event",
                },
            ],
            action: "C",
            recorded: new Date().toISOString(),
            outcome,
            outcomeDesc: params.details,
            agent: [
                {
                    requestor: false,
                    who: {
                        reference: "Device/SMART_IV_INFUSION_PUMP",
                        display: "Alaris Smart Pump Infusion Station 4B",
                    },
                },
            ],
            source: {
                site: env_js_1.config.hospitalId,
                observer: { reference: "Device/HL7_V2_LISTENER" },
            },
            entity: [
                {
                    what: { reference: `Patient/${params.patientId}` },
                    description: `Infusion Pump State: ${params.status}`,
                },
            ],
        };
        client_js_1.fhirClient.addAuditEvent(params.patientId, auditEvent);
        return auditEvent;
    }
    /**
     * Logs TEFCA external cancer registry data transmission
     */
    logTefcaTransmission(params) {
        const auditEvent = {
            resourceType: "AuditEvent",
            id: `audit-tefca-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: {
                system: "http://terminology.hl7.org/CodeSystem/audit-event-type",
                code: "export",
                display: "TEFCA Interoperability Data Export",
            },
            action: "R",
            recorded: new Date().toISOString(),
            outcome: "0",
            outcomeDesc: `Compliant export of de-identified oncology record (${params.resourceCount} resources) transmitted to ${params.destinationRegistry} under TEFCA QHIN framework.`,
            agent: [
                {
                    requestor: true,
                    who: {
                        reference: "Practitioner/ONCOLOGY_REGISTRAR",
                        display: "Certified Tumor Registrar (CTR)",
                    },
                },
            ],
            source: {
                site: env_js_1.config.hospitalId,
                observer: { reference: "Device/TEFCA_CONNECTOR" },
            },
            entity: [
                {
                    what: { reference: `Patient/${params.patientId}` },
                    description: `TEFCA Cancer Registry Bundle for ${params.destinationRegistry}`,
                },
            ],
        };
        client_js_1.fhirClient.addAuditEvent(params.patientId, auditEvent);
        return auditEvent;
    }
}
exports.AuditEventService = AuditEventService;
exports.auditEventService = new AuditEventService();
