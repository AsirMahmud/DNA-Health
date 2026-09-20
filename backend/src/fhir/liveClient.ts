/**
 * Live HL7 FHIR R4 Remote Server Client
 * Connects directly to HAPI FHIR (https://hapi.fhir.org/baseR4) or configured hospital EHR endpoint.
 */

import { config } from "../config/env.js";
import { fhirClient } from "./client.js";
import { FhirPatient, FhirObservation, FhirMedicationRequest, FhirBundle } from "./types.js";

export class LiveFhirClient {
  private baseUrl = config.fhirServerUrl || "https://hapi.fhir.org/baseR4";

  /**
   * Pings the live FHIR server capability statement (metadata)
   */
  public async checkServerHealth(): Promise<{
    online: boolean;
    url: string;
    fhirVersion?: string;
    software?: string;
    latencyMs?: number;
    error?: string;
  }> {
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
        const statement = (await res.json()) as any;
        return {
          online: true,
          url: this.baseUrl,
          fhirVersion: statement.fhirVersion || "4.0.1",
          software: statement.software?.name || "HAPI FHIR Server",
          latencyMs,
        };
      } else {
        return {
          online: false,
          url: this.baseUrl,
          error: `HTTP ${res.status} ${res.statusText}`,
          latencyMs,
        };
      }
    } catch (err: any) {
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
  public async syncPatientToLiveHapiServer(patientId: string): Promise<{
    success: boolean;
    serverUrl: string;
    patientId: string;
    uploadedResources: Array<{ type: string; id: string; location?: string }>;
    bundleResponse?: any;
    error?: string;
  }> {
    const patient = fhirClient.getPatient(patientId);
    if (!patient) {
      throw new Error(`Patient ${patientId} not found in local sandbox`);
    }

    const medRequests = fhirClient.getMedicationRequests(patientId);
    const observations = fhirClient.getObservations(patientId);

    // Build FHIR Transaction Bundle
    const entries: any[] = [];

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

    const transactionBundle: FhirBundle = {
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

      const bundleResult = (await response.json()) as any;
      const uploadedResources = (bundleResult.entry || []).map((e: any) => ({
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
    } catch (err: any) {
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
  public async queryLiveObservations(patientMrn: string): Promise<FhirObservation[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/Observation?identifier=${encodeURIComponent(patientMrn)}&_count=10`,
        { headers: { Accept: "application/fhir+json" } }
      );
      if (!response.ok) return [];
      const data = (await response.json()) as any;
      return (data.entry || []).map((e: any) => e.resource);
    } catch {
      return [];
    }
  }
}

export const liveFhirClient = new LiveFhirClient();
