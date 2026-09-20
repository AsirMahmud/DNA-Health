import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Chemotherapy Safety Gate REST API Endpoints", () => {
  it("GET /health should return service status and healthcare standards", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("HEALTHY");
    expect(res.body.standards).toContain("HL7 FHIR R4");
    expect(res.body.standards).toContain("LOINC");
    expect(res.body.standards).toContain("RxNorm");
    expect(res.body.standards).toContain("HL7 v2.5 RAS^O17");
  });

  it("GET /api/patients should list clinical cohort patients", async () => {
    const res = await request(app).get("/api/patients");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(3);
    const p1001 = res.body.data.find((p: any) => p.id === "P-1001");
    expect(p1001).toBeDefined();
    expect(p1001.name[0].family).toBe("Vance");
  });

  it("GET /api/patients/:id/safety-check should return PASS for P-1001", async () => {
    const res = await request(app).get("/api/patients/P-1001/safety-check");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.gateStatus).toBe("PASS");
    expect(res.body.data.bedsidePumpAllowed).toBe(true);
    expect(res.body.data.activeProtocol.protocolName).toContain("FOLFOX6");
  });

  it("GET /api/patients/:id/safety-check should return HOLD for P-1002 (Neutropenia)", async () => {
    const res = await request(app).get("/api/patients/P-1002/safety-check");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.gateStatus).toBe("HOLD");
    expect(res.body.data.bedsidePumpAllowed).toBe(false);
    expect(res.body.data.blockingReasons.length).toBeGreaterThan(0);
  });

  it("POST /api/hl7/administration should process raw RAS^O17 message", async () => {
    const sampleRas = [
      "MSH|^~\\&|ALARIS_PUMP_4B|ONCOLOGY_3E|SAFETY_GATE|MEMORIAL_CANCER|20260920093000||RAS^O17^RAS_O17|MSG-TEST-001|P|2.5",
      "PID|1||MRN-8849201^^^MEMORIAL||Vance^Eleanor^Ruth||19680412|F",
      "ORC|RE|MR-FOLFOX-1001|||IP",
      "RXA|0|1|20260920093000||32592^Oxaliplatin^RxNorm|150|mg^Milligram^UCUM||00^Administered^NCI||||||||||RE",
      "RXR|IV^Intravenous^HL70162|C^Central Line",
    ].join("\r");

    const res = await request(app)
      .post("/api/hl7/administration")
      .send({ rawHl7: sampleRas });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pumpStatus.infusionState).toBe("INFUSING");
  });

  it("GET /api/compliance/tefca-export/:id should return de-identified FHIR R4 Bundle", async () => {
    const res = await request(app).get("/api/compliance/tefca-export/P-1001?deIdentify=true");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resourceType).toBe("Bundle");
    expect(res.body.data.entry[0].resource.name[0].family).toBe("REDACTED");
  });

  it("POST /api/compliance/baa-check should validate BAA compliance", async () => {
    const res = await request(app)
      .post("/api/compliance/baa-check")
      .send({ patientId: "ANON-1001", birthYear: "1968" });

    expect(res.status).toBe(200);
    expect(res.body.data.compliant).toBe(true);
  });
});
