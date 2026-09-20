/**
 * Chemotherapy API Controller
 */

import { Request, Response } from "express";
import { chemotherapyService } from "../services/chemotherapy.service.js";
import { fhirClient } from "../fhir/client.js";

export class ChemotherapyController {
  public async listPatients(req: Request, res: Response): Promise<void> {
    try {
      const patients = fhirClient.getAllPatients();
      res.json({ success: true, count: patients.length, data: patients });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public async getPatient(req: Request, res: Response): Promise<void> {
    try {
      const patientId = String(req.params.patientId);
      const patient = fhirClient.getPatient(patientId);
      if (!patient) {
        res.status(404).json({ success: false, error: `Patient ${patientId} not found` });
        return;
      }
      res.json({ success: true, data: patient });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public async getSafetyAssessment(req: Request, res: Response): Promise<void> {
    try {
      const patientId = String(req.params.patientId);
      const assessment = await chemotherapyService.getSafetyAssessment(patientId);
      res.json({ success: true, data: assessment });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  public async overrideSafetyHold(req: Request, res: Response): Promise<void> {
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

      const assessment = await chemotherapyService.getSafetyAssessment(patientId, {
        authorizedBy,
        reason,
      });

      res.json({
        success: true,
        message: "Clinical safety gate overridden by oncologist authorization",
        data: assessment,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const chemotherapyController = new ChemotherapyController();
