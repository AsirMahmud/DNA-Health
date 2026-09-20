import { describe, it, expect } from "vitest";
import { hl7Parser } from "../src/hl7/parser.js";
import { rasO17Handler } from "../src/hl7/rasO17Handler.js";
import { administrationService } from "../src/services/administration.service.js";
import { chemotherapyService } from "../src/services/chemotherapy.service.js";

describe("HL7 v2 AST Parser and RAS^O17 Floor Administration Ingestion", () => {
  const sampleRasMessage = [
    "MSH|^~\\&|ALARIS_PUMP_4B|ONCOLOGY_3E|SAFETY_GATE|MEMORIAL_CANCER|20260920093000||RAS^O17^RAS_O17|MSG-ALARIS-9001|P|2.5",
    "PID|1||MRN-8849201^^^MEMORIAL||Vance^Eleanor^Ruth||19680412|F",
    "ORC|RE|MR-FOLFOX-1001|||IP",
    "RXA|0|1|20260920093000||32592^Oxaliplatin^RxNorm|150|mg^Milligram^UCUM||00^Administered^NCI||||||||||RE",
    "RXR|IV^Intravenous^HL70162|C^Central Line",
  ].join("\r");

  it("should parse HL7 message headers and segments into AST without brittle string regex", () => {
    const parsed = hl7Parser.parse(sampleRasMessage);

    expect(parsed.messageType).toBe("RAS^O17");
    expect(parsed.messageControlId).toBe("MSG-ALARIS-9001");
    expect(parsed.senderApp).toBe("ALARIS_PUMP_4B");
    expect(parsed.segments.length).toBe(5);

    const pid = parsed.segments.find((s) => s.name === "PID")!;
    expect(pid).toBeDefined();

    const mrn = hl7Parser.getFieldComponentValue(pid, 3, 1, parsed.encoding);
    expect(mrn).toBe("MRN-8849201");
  });

  it("should extract structured RAS^O17 event with medication and timing details", () => {
    const event = rasO17Handler.parseRasMessage(sampleRasMessage);

    expect(event.patientMrn).toBe("MRN-8849201");
    expect(event.patientName).toContain("Eleanor Vance");
    expect(event.administeredCode).toBe("32592");
    expect(event.administeredName).toBe("Oxaliplatin");
    expect(event.administeredAmount).toBe(150);
    expect(event.administeredUnit).toBe("mg");
    expect(event.completionStatus).toBe("START");
    expect(event.route).toBe("Intravenous");
  });

  it("should ingest pump administration start and update bed monitor to INFUSING for cleared patient", async () => {
    // Ensure P-1001 safety check is evaluated
    await chemotherapyService.getSafetyAssessment("P-1001");

    const result = administrationService.ingestHl7RasMessage(sampleRasMessage);

    expect(result.success).toBe(true);
    expect(result.pumpStatus.infusionState).toBe("INFUSING");
    expect(result.pumpStatus.activeDrugName).toBe("Oxaliplatin");
    expect(result.pumpStatus.currentRateMlPerHour).toBeGreaterThan(0);
  });

  it("should trigger SAFETY INTERLOCK ALARM if pump start received for patient on HOLD", async () => {
    // P-1002 is on HOLD due to neutropenia (ANC 0.8)
    await chemotherapyService.getSafetyAssessment("P-1002");

    const holdMessage = [
      "MSH|^~\\&|BAXTER_PUMP_1A|ONCOLOGY_3E|SAFETY_GATE|MEMORIAL_CANCER|20260920094500||RAS^O17^RAS_O17|MSG-BAXTER-4412|P|2.5",
      "PID|1||MRN-7738202^^^MEMORIAL||Brody^Marcus^Anthony||19591123|M",
      "ORC|RE|MR-RCHOP-1002|||IP",
      "RXA|0|1|20260920094500||121191^Rituximab^RxNorm|700|mg^Milligram^UCUM||00^Administered^NCI||||||||||RE",
      "RXR|IV^Intravenous^HL70162|P^Peripheral Line",
    ].join("\r");

    const result = administrationService.ingestHl7RasMessage(holdMessage);

    expect(result.success).toBe(false);
    expect(result.pumpStatus.infusionState).toBe("HOLD_INTERLOCKED");
    expect(result.pumpStatus.alarmRaised).toBe(true);
    expect(result.pumpStatus.alarmMessage).toContain("SAFETY INTERLOCK VIOLATION");
  });
});
