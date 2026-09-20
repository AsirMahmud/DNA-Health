import { Router } from "express";
import { hl7Controller } from "../controllers/hl7.controller.js";

const router = Router();

router.post("/administration", (req, res) => hl7Controller.ingestAdministration(req, res));
router.get("/pump-status/:patientId", (req, res) => hl7Controller.getPumpStatus(req, res));

export default router;
