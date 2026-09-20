import { Router } from "express";
import { integrationsController } from "../controllers/integrations.controller.js";

const router = Router();

router.get("/status", (req, res) => integrationsController.getIntegrationStatus(req, res));
router.get("/rxnav/search", (req, res) => integrationsController.searchRxNav(req, res));
router.get("/rxnav/rxcui/:rxcui", (req, res) => integrationsController.getRxNormDetails(req, res));
router.post("/fhir/sync-to-hapi", (req, res) => integrationsController.syncPatientToHapi(req, res));

export default router;
