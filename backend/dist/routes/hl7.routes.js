"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hl7_controller_js_1 = require("../controllers/hl7.controller.js");
const router = (0, express_1.Router)();
router.post("/administration", (req, res) => hl7_controller_js_1.hl7Controller.ingestAdministration(req, res));
router.get("/pump-status/:patientId", (req, res) => hl7_controller_js_1.hl7Controller.getPumpStatus(req, res));
exports.default = router;
