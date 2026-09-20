/**
 * FHIR MedicationRequest Data Access Service
 */

import { fhirClient } from "./client.js";
import { FhirMedicationRequest } from "./types.js";

export class MedicationRequestService {
  /**
   * Retrieves all active chemotherapy MedicationRequest resources for a patient.
   */
  async getActiveChemotherapyOrders(patientId: string): Promise<FhirMedicationRequest[]> {
    const orders = fhirClient.getMedicationRequests(patientId);
    return orders.filter((order) => order.status === "active");
  }
}

export const medicationRequestService = new MedicationRequestService();
