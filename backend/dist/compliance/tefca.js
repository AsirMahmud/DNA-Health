"use strict";
/**
 * TEFCA National Data Sharing & Cancer Registry Export Engine
 * Bundles chemotherapy infusion encounter data into an interoperable FHIR R4 document/collection
 * compliant with ONC TEFCA QHIN Technical Framework (QTF) and CDC NHSN/NAACCR standards.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tefcaComplianceService = exports.TefcaComplianceService = void 0;
const client_js_1 = require("../fhir/client.js");
const baa_js_1 = require("./baa.js");
const audit_js_1 = require("./audit.js");
class TefcaComplianceService {
    /**
     * Builds an interoperable FHIR R4 Bundle for national cancer registry transmission.
     */
    generateCancerRegistryBundle(options) {
        const { patientId, destinationRegistry = "CDC-NHSN-CANCER-REGISTRY", deIdentify = true } = options;
        const rawPatient = client_js_1.fhirClient.getPatient(patientId);
        if (!rawPatient) {
            throw new Error(`Patient ${patientId} not found in clinical database`);
        }
        const patientResource = deIdentify
            ? baa_js_1.baaComplianceService.deIdentifyPatient(rawPatient)
            : rawPatient;
        const medRequests = client_js_1.fhirClient.getMedicationRequests(patientId);
        const observations = client_js_1.fhirClient.getObservations(patientId);
        const administrations = client_js_1.fhirClient.getAdministrations(patientId);
        const entries = [];
        // 1. Patient entry
        entries.push({
            fullUrl: `urn:uuid:${patientResource.id}`,
            resource: patientResource,
        });
        // 2. MedicationRequest entries (Prescribed protocols)
        medRequests.forEach((mr) => {
            entries.push({
                fullUrl: `urn:uuid:${mr.id}`,
                resource: {
                    ...mr,
                    subject: { reference: `Patient/${patientResource.id}` },
                },
            });
        });
        // 3. Observation entries (LOINC lab results)
        observations.forEach((obs) => {
            entries.push({
                fullUrl: `urn:uuid:${obs.id}`,
                resource: {
                    ...obs,
                    subject: { reference: `Patient/${patientResource.id}` },
                },
            });
        });
        // 4. MedicationAdministration entries (IV Pump execution)
        administrations.forEach((admin) => {
            entries.push({
                fullUrl: `urn:uuid:${admin.id}`,
                resource: {
                    ...admin,
                    subject: { reference: `Patient/${patientResource.id}` },
                },
            });
        });
        const bundleId = `TEFCA-CANCER-REG-${patientId}-${Date.now()}`;
        const bundle = {
            resourceType: "Bundle",
            id: bundleId,
            type: "collection",
            timestamp: new Date().toISOString(),
            total: entries.length,
            entry: entries,
        };
        // Log the TEFCA transmission event
        audit_js_1.auditEventService.logTefcaTransmission({
            patientId,
            destinationRegistry,
            resourceCount: entries.length,
        });
        return bundle;
    }
}
exports.TefcaComplianceService = TefcaComplianceService;
exports.tefcaComplianceService = new TefcaComplianceService();
