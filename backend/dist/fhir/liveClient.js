"use strict";
/**
 * Live HL7 FHIR R4 Remote Server Client
 * Connects directly to HAPI FHIR (https://hapi.fhir.org/baseR4) or configured hospital EHR endpoint.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveFhirClient = exports.LiveFhirClient = void 0;
const env_js_1 = require("../config/env.js");
const client_js_1 = require("./client.js");
class LiveFhirClient {
    baseUrl = env_js_1.config.fhirServerUrl || "https://hapi.fhir.org/baseR4";
    /**
     * Pings the live FHIR server capability statement (metadata)
     */
    async checkServerHealth() {
        const start = Date.now();
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(`${this.baseUrl}/metadata`, {
                signal: controller.signal,
                headers: { Accept: "application/fhir+json" },
            });
            clearTimeout(timeoutId);
            const latencyMs = Date.now() - start;
            if (res.ok) {
                const statement = (await res.json());
                return {
                    online: true,
                    url: this.baseUrl,
                    fhirVersion: statement.fhirVersion || "4.0.1",
                    software: statement.software?.name || "HAPI FHIR Server",
                    latencyMs,
                };
            }
            else {
                return {
                    online: false,
                    url: this.baseUrl,
                    error: `HTTP ${res.status} ${res.statusText}`,
                    latencyMs,
                };
            }
        }
        catch (err) {
            return {
                online: false,
                url: this.baseUrl,
                error: err.message,
                latencyMs: Date.now() - start,
            };
        }
    }
    /**
     * Uploads/Syncs a local clinical cohort directly into the live HAPI FHIR server
     * via an HL7 FHIR R4 transaction bundle (POST /)
     */
    async syncPatientToLiveHapiServer(patientId) {
        const patient = client_js_1.fhirClient.getPatient(patientId);
        if (!patient) {
            throw new Error(`Patient ${patientId} not found in local sandbox`);
        }
        const medRequests = client_js_1.fhirClient.getMedicationRequests(patientId);
        const observations = client_js_1.fhirClient.getObservations(patientId);
        // Build FHIR Transaction Bundle
        const entries = [];
        // 1. Patient entry
        entries.push({
            fullUrl: `urn:uuid:patient-${patientId}`,
            resource: {
                ...patient,
                id: undefined, // Let server assign or update
                identifier: [
                    ...(patient.identifier || []),
                    { system: "http://hospital.memorial.org/cohort-sync", value: patientId },
                ],
            },
            request: {
                method: "POST",
                url: "Patient",
            },
        });
        // 2. MedicationRequest entries
        medRequests.forEach((mr) => {
            entries.push({
                fullUrl: `urn:uuid:mr-${mr.id}`,
                resource: {
                    ...mr,
                    id: undefined,
                    subject: { reference: `urn:uuid:patient-${patientId}` },
                },
                request: {
                    method: "POST",
                    url: "MedicationRequest",
                },
            });
        });
        // 3. Observations (ANC, Creatinine)
        observations.forEach((obs) => {
            entries.push({
                fullUrl: `urn:uuid:obs-${obs.id}`,
                resource: {
                    ...obs,
                    id: undefined,
                    subject: { reference: `urn:uuid:patient-${patientId}` },
                },
                request: {
                    method: "POST",
                    url: "Observation",
                },
            });
        });
        const transactionBundle = {
            resourceType: "Bundle",
            id: `bundle-sync-${Date.now()}`,
            type: "transaction",
            entry: entries,
        };
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);
            const response = await fetch(this.baseUrl, {
                method: "POST",
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/fhir+json",
                    Accept: "application/fhir+json",
                },
                body: JSON.stringify(transactionBundle),
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    serverUrl: this.baseUrl,
                    patientId,
                    uploadedResources: [],
                    error: `HAPI FHIR rejected bundle: ${response.status} - ${errorText.slice(0, 200)}`,
                };
            }
            const bundleResult = (await response.json());
            const uploadedResources = (bundleResult.entry || []).map((e) => ({
                type: e.response?.location?.split("/")[0] || "Resource",
                id: e.response?.location?.split("/")[1] || "unknown",
                location: e.response?.location,
            }));
            return {
                success: true,
                serverUrl: this.baseUrl,
                patientId,
                uploadedResources,
                bundleResponse: bundleResult,
            };
        }
        catch (err) {
            return {
                success: false,
                serverUrl: this.baseUrl,
                patientId,
                uploadedResources: [],
                error: `Network error connecting to ${this.baseUrl}: ${err.message}`,
            };
        }
    }
    /**
     * Queries live observations by LOINC code directly from remote FHIR server
     */
    async queryLiveObservations(patientMrn) {
        try {
            const response = await fetch(`${this.baseUrl}/Observation?identifier=${encodeURIComponent(patientMrn)}&_count=10`, { headers: { Accept: "application/fhir+json" } });
            if (!response.ok)
                return [];
            const data = (await response.json());
            return (data.entry || []).map((e) => e.resource);
        }
        catch {
            return [];
        }
    }
}
exports.LiveFhirClient = LiveFhirClient;
exports.liveFhirClient = new LiveFhirClient();
