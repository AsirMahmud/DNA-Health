/**
 * HL7 v2 Message API Controller
 */

import { Request, Response } from "express";
import { administrationService } from "../services/administration.service.js";

export class Hl7Controller {
  public async ingestAdministration(req: Request, res: Response): Promise<void> {
    try {
      let rawHl7 = "";
      if (typeof req.body === "string") {
        rawHl7 = req.body;
      } else if (req.body?.rawHl7) {
        rawHl7 = req.body.rawHl7;
      } else {
        res.status(400).json({
          success: false,
          error: "Request body must contain raw HL7 v2 string or JSON { rawHl7: string }",
        });
        return;
      }

      const result = administrationService.ingestHl7RasMessage(rawHl7);

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
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  public async getPumpStatus(req: Request, res: Response): Promise<void> {
    try {
      const patientId = String(req.params.patientId);
      const status = administrationService.getPumpStatus(patientId);
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const hl7Controller = new Hl7Controller();
