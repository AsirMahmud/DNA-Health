import { Router } from "express";
import { complianceController } from "../controllers/compliance.controller.js";

const router = Router();

router.get("/tefca-export/:patientId", (req, res) =>
  complianceController.exportTefcaBundle(req, res)
);
router.post("/baa-check", (req, res) => complianceController.checkBaaCompliance(req, res));
router.get("/audit-trail/:patientId", (req, res) =>
  complianceController.getAuditEvents(req, res)
);

export default router;
