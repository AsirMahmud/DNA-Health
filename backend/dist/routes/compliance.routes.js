"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const compliance_controller_js_1 = require("../controllers/compliance.controller.js");
const router = (0, express_1.Router)();
router.get("/tefca-export/:patientId", (req, res) => compliance_controller_js_1.complianceController.exportTefcaBundle(req, res));
router.post("/baa-check", (req, res) => compliance_controller_js_1.complianceController.checkBaaCompliance(req, res));
router.get("/audit-trail/:patientId", (req, res) => compliance_controller_js_1.complianceController.getAuditEvents(req, res));
exports.default = router;
