"use strict";
/**
 * FHIR MedicationRequest Data Access Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.medicationRequestService = exports.MedicationRequestService = void 0;
const client_js_1 = require("./client.js");
class MedicationRequestService {
    /**
     * Retrieves all active chemotherapy MedicationRequest resources for a patient.
     */
    async getActiveChemotherapyOrders(patientId) {
        const orders = client_js_1.fhirClient.getMedicationRequests(patientId);
        return orders.filter((order) => order.status === "active");
    }
}
exports.MedicationRequestService = MedicationRequestService;
exports.medicationRequestService = new MedicationRequestService();
