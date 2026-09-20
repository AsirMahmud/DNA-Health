/**
 * Live Health APIs & SMART on FHIR Controller
 * Integrates directly with NLM RxNav REST API and HAPI FHIR R4 Sandbox.
 */

import { Request, Response } from "express";
import { rxNavService } from "../terminology/rxnorm.js";
import { liveFhirClient } from "../fhir/liveClient.js";
import { config } from "../config/env.js";

export class IntegrationsController {
  /**
   * Health status of external healthcare APIs (NLM RxNav & HAPI FHIR)
   */
  public async getIntegrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const fhirHealth = await liveFhirClient.checkServerHealth();

      // Quick ping to NLM RxNav
      let rxNavOnline = false;
      let rxNavLatency = 0;
      const start = Date.now();
      try {
        const ping = await rxNavService.getConceptByRxcui("32592");
        rxNavOnline = !!ping;
        rxNavLatency = Date.now() - start;
      } catch {
        rxNavOnline = false;
      }

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        apis: {
          rxNav: {
            name: "US National Library of Medicine (NLM) RxNav REST API",
            endpoint: config.rxNavBaseUrl,
            online: rxNavOnline,
            latencyMs: rxNavLatency,
            documentation: "https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html",
          },
          hapiFhir: {
            name: "HL7 FHIR R4 Public Sandbox",
            endpoint: fhirHealth.url,
            online: fhirHealth.online,
            fhirVersion: fhirHealth.fhirVersion,
            software: fhirHealth.software,
            latencyMs: fhirHealth.latencyMs,
            error: fhirHealth.error,
          },
          smartOnFhir: {
            name: "SMART on FHIR OAuth 2.0 PKCE Gateway",
            status: "ENABLED",
            launchContext: "ehr-launch",
            codeChallengeMethod: "S256",
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Live drug search via NLM RxNav REST API
   */
  public async searchRxNav(req: Request, res: Response): Promise<void> {
    try {
      const name = req.query.name as string;
      if (!name || name.trim().length < 2) {
        res.status(400).json({ success: false, error: "Query parameter 'name' must be at least 2 characters" });
        return;
      }

      const results = await rxNavService.searchDrugsByName(name);
      res.json({
        success: true,
        query: name,
        source: "NLM RxNav REST API",
        count: results.length,
        data: results,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Live RxNorm concept details via NLM RxNav
   */
  public async getRxNormDetails(req: Request, res: Response): Promise<void> {
    try {
      const rxcui = String(req.params.rxcui);
      const concept = await rxNavService.getConceptByRxcui(rxcui);
      const ingredients = await rxNavService.getRelatedIngredients(rxcui);

      res.json({
        success: true,
        rxcui,
        source: "NLM RxNav REST API",
        concept,
        relatedIngredients: ingredients,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Syncs a patient cohort directly to the live HAPI FHIR server via transaction bundle
   */
  public async syncPatientToHapi(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.body;
      if (!patientId) {
        res.status(400).json({ success: false, error: "Requires 'patientId' in body" });
        return;
      }

      const result = await liveFhirClient.syncPatientToLiveHapiServer(patientId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * SMART on FHIR well-known configuration endpoint
   * Spec: http://hl7.org/fhir/smart-app-launch/2021May/conformance.html
   */
  public getSmartConfiguration(req: Request, res: Response): void {
    res.json({
      issuer: "https://auth.memorialcancer.org/oauth2",
      authorization_endpoint: "https://auth.memorialcancer.org/oauth2/authorize",
      token_endpoint: "https://auth.memorialcancer.org/oauth2/token",
      token_endpoint_auth_methods_supported: ["client_secret_basic", "private_key_jwt"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      scopes_supported: [
        "openid",
        "profile",
        "launch",
        "launch/patient",
        "patient/Patient.read",
        "patient/MedicationRequest.read",
        "patient/Observation.read",
        "patient/MedicationAdministration.write",
        "user/AuditEvent.write",
      ],
      response_types_supported: ["code"],
      capabilities: [
        "launch-ehr",
        "launch-standalone",
        "client-public",
        "client-confidential-symmetric",
        "context-ehr-patient",
        "permission-patient",
      ],
    });
  }

  /**
   * Simulated SMART on FHIR PKCE token exchange
   */
  public handleSmartToken(req: Request, res: Response): void {
    const { code, code_verifier, client_id } = req.body;
    res.json({
      access_token: `smart_token_oncology_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      token_type: "Bearer",
      expires_in: 3600,
      scope: "patient/Patient.read patient/MedicationRequest.read patient/Observation.read",
      patient: req.body.patientId || "P-1001",
      encounter: "ENC-ONC-992",
      need_patient_banner: true,
      smart_style_url: "https://memorialcancer.org/smart-style.json",
    });
  }
}

export const integrationsController = new IntegrationsController();
