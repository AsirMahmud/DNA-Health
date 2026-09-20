import { Router } from "express";
import { chemotherapyController } from "../controllers/chemotherapy.controller.js";

const router = Router();

router.get("/patients", (req, res) => chemotherapyController.listPatients(req, res));
router.get("/patients/:patientId", (req, res) => chemotherapyController.getPatient(req, res));
router.get("/patients/:patientId/safety-check", (req, res) =>
  chemotherapyController.getSafetyAssessment(req, res)
);
router.post("/patients/:patientId/override", (req, res) =>
  chemotherapyController.overrideSafetyHold(req, res)
);

export default router;
