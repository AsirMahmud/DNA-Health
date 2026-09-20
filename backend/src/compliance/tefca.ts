/**
 * TEFCA National Data Sharing & Cancer Registry Export Engine
 * Bundles chemotherapy infusion encounter data into an interoperable FHIR R4 document/collection
 * compliant with ONC TEFCA QHIN Technical Framework (QTF) and CDC NHSN/NAACCR standards.
 */

import { FhirBundle, FhirBundleEntry } from "../fhir/types.js";
import { fhirClient } from "../fhir/client.js";
import { baaComplianceService } from "./baa.js";
import { auditEventService } from "./audit.js";

export interface TefcaExportOptions {
  patientId: string;
  destinationRegistry?: string;
  deIdentify?: boolean;
}

export class TefcaComplianceService {
  /**
   * Builds an interoperable FHIR R4 Bundle for national cancer registry transmission.
   */
  public generateCancerRegistryBundle(options: TefcaExportOptions): FhirBundle {
    const { patientId, destinationRegistry = "CDC-NHSN-CANCER-REGISTRY", deIdentify = true } = options;

    const rawPatient = fhirClient.getPatient(patientId);
    if (!rawPatient) {
      throw new Error(`Patient ${patientId} not found in clinical database`);
    }

    const patientResource = deIdentify
      ? baaComplianceService.deIdentifyPatient(rawPatient)
      : rawPatient;

    const medRequests = fhirClient.getMedicationRequests(patientId);
    const observations = fhirClient.getObservations(patientId);
    const administrations = fhirClient.getAdministrations(patientId);

    const entries: FhirBundleEntry[] = [];

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
    const bundle: FhirBundle = {
      resourceType: "Bundle",
      id: bundleId,
      type: "collection",
      timestamp: new Date().toISOString(),
      total: entries.length,
      entry: entries,
    };

    // Log the TEFCA transmission event
    auditEventService.logTefcaTransmission({
      patientId,
      destinationRegistry,
      resourceCount: entries.length,
    });

    return bundle;
  }
}

export const tefcaComplianceService = new TefcaComplianceService();
