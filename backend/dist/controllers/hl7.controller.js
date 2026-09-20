"use strict";
/**
 * HL7 v2 Message API Controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hl7Controller = exports.Hl7Controller = void 0;
const administration_service_js_1 = require("../services/administration.service.js");
class Hl7Controller {
    async ingestAdministration(req, res) {
        try {
            let rawHl7 = "";
            if (typeof req.body === "string") {
                rawHl7 = req.body;
            }
            else if (req.body?.rawHl7) {
                rawHl7 = req.body.rawHl7;
            }
            else {
                res.status(400).json({
                    success: false,
                    error: "Request body must contain raw HL7 v2 string or JSON { rawHl7: string }",
                });
                return;
            }
            const result = administration_service_js_1.administrationService.ingestHl7RasMessage(rawHl7);
            if (!result.success) {
                res.status(422).json({
                    success: false,
                    interlockAlert: result.interlockAlert,
                    event: result.event,
                    pumpStatus: result.pumpStatus,
                });
                return;
            }
            res.json({
                success: true,
                message: "HL7 RAS^O17 administration event processed successfully",
                data: result,
            });
        }
        catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
    async getPumpStatus(req, res) {
        try {
            const patientId = String(req.params.patientId);
            const status = administration_service_js_1.administrationService.getPumpStatus(patientId);
            res.json({ success: true, data: status });
        }
        catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}
exports.Hl7Controller = Hl7Controller;
exports.hl7Controller = new Hl7Controller();
