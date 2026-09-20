"use strict";
/**
 * Chemotherapy API Controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.chemotherapyController = exports.ChemotherapyController = void 0;
const chemotherapy_service_js_1 = require("../services/chemotherapy.service.js");
const client_js_1 = require("../fhir/client.js");
class ChemotherapyController {
    async listPatients(req, res) {
        try {
            const patients = client_js_1.fhirClient.getAllPatients();
            res.json({ success: true, count: patients.length, data: patients });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async getPatient(req, res) {
        try {
            const patientId = String(req.params.patientId);
            const patient = client_js_1.fhirClient.getPatient(patientId);
            if (!patient) {
                res.status(404).json({ success: false, error: `Patient ${patientId} not found` });
                return;
            }
            res.json({ success: true, data: patient });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async getSafetyAssessment(req, res) {
        try {
            const patientId = String(req.params.patientId);
            const assessment = await chemotherapy_service_js_1.chemotherapyService.getSafetyAssessment(patientId);
            res.json({ success: true, data: assessment });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async overrideSafetyHold(req, res) {
        try {
            const patientId = String(req.params.patientId);
            const { authorizedBy, reason } = req.body;
            if (!authorizedBy || !reason) {
                res.status(400).json({
                    success: false,
                    error: "Clinical override requires 'authorizedBy' (MD credential) and 'reason'",
                });
                return;
            }
            const assessment = await chemotherapy_service_js_1.chemotherapyService.getSafetyAssessment(patientId, {
                authorizedBy,
                reason,
            });
            res.json({
                success: true,
                message: "Clinical safety gate overridden by oncologist authorization",
                data: assessment,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.ChemotherapyController = ChemotherapyController;
exports.chemotherapyController = new ChemotherapyController();
