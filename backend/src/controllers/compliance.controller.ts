/**
 * Compliance, BAA, and TEFCA Controller
 */

import { Request, Response } from "express";
import { tefcaComplianceService } from "../compliance/tefca.js";
import { baaComplianceService } from "../compliance/baa.js";
import { fhirClient } from "../fhir/client.js";

export class ComplianceController {
  public async exportTefcaBundle(req: Request, res: Response): Promise<void> {
    try {
      const patientId = String(req.params.patientId);
      const deIdentify = req.query.deIdentify !== "false"; // default true
      const destination = (req.query.destination as string) || "CDC-NHSN-CANCER-REGISTRY";

      const bundle = tefcaComplianceService.generateCancerRegistryBundle({
        patientId,
        destinationRegistry: destination,
        deIdentify,
      });

      res.json({
        success: true,
        message: "Generated TEFCA-compliant cancer registry FHIR R4 Bundle",
        data: bundle,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public async checkBaaCompliance(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const verification = baaComplianceService.verifyBaaCompliance(payload);
      res.json({ success: true, data: verification });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public async getAuditEvents(req: Request, res: Response): Promise<void> {
    try {
      const patientId = String(req.params.patientId);
      const events = fhirClient.getAuditEvents(patientId);
      res.json({ success: true, count: events.length, data: events });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const complianceController = new ComplianceController();
