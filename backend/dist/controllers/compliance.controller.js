"use strict";
/**
 * Compliance, BAA, and TEFCA Controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.complianceController = exports.ComplianceController = void 0;
const tefca_js_1 = require("../compliance/tefca.js");
const baa_js_1 = require("../compliance/baa.js");
const client_js_1 = require("../fhir/client.js");
class ComplianceController {
    async exportTefcaBundle(req, res) {
        try {
            const patientId = String(req.params.patientId);
            const deIdentify = req.query.deIdentify !== "false"; // default true
            const destination = req.query.destination || "CDC-NHSN-CANCER-REGISTRY";
            const bundle = tefca_js_1.tefcaComplianceService.generateCancerRegistryBundle({
                patientId,
                destinationRegistry: destination,
                deIdentify,
            });
            res.json({
                success: true,
                message: "Generated TEFCA-compliant cancer registry FHIR R4 Bundle",
                data: bundle,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async checkBaaCompliance(req, res) {
        try {
            const payload = req.body;
            const verification = baa_js_1.baaComplianceService.verifyBaaCompliance(payload);
            res.json({ success: true, data: verification });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
    async getAuditEvents(req, res) {
        try {
            const patientId = String(req.params.patientId);
            const events = client_js_1.fhirClient.getAuditEvents(patientId);
            res.json({ success: true, count: events.length, data: events });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.ComplianceController = ComplianceController;
exports.complianceController = new ComplianceController();
