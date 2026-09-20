import { describe, it, expect } from "vitest";
import { protocolParser } from "../src/chemotherapy/protocolParser.js";
import { fhirClient } from "../src/fhir/client.js";

describe("Chemotherapy Protocol Parser (FHIR MedicationRequest)", () => {
  it("should correctly parse FOLFOX6 multi-drug protocol with nested carrier fluids", () => {
    const orders = fhirClient.getMedicationRequests("P-1001");
    expect(orders.length).toBeGreaterThan(0);

    const folfoxOrder = orders[0];
    const parsed = protocolParser.parse(folfoxOrder);

    expect(parsed.protocolName).toContain("mFOLFOX6");
    expect(parsed.rxNormCode).toBe("32592");

    // Check active antineoplastic ingredients
    const oxaliplatin = parsed.activeIngredients.find((i) => i.rxNormCode === "32592");
    expect(oxaliplatin).toBeDefined();
    expect(oxaliplatin?.isActive).toBe(true);
    expect(oxaliplatin?.dose?.value).toBe(150);
    expect(oxaliplatin?.dose?.unit).toBe("mg");

    const fu = parsed.activeIngredients.find((i) => i.rxNormCode === "4492");
    expect(fu).toBeDefined();
    expect(fu?.dose?.value).toBe(4200);

    // Check carrier fluids (D5W & Normal Saline)
    expect(parsed.carrierFluids.length).toBeGreaterThan(0);
    const d5w = parsed.carrierFluids.find((c) => c.rxNormCode === "309789");
    expect(d5w).toBeDefined();
    expect(d5w?.category).toBe("CARRIER_FLUID");

    // Check dosage instructions & drip rates
    expect(parsed.dosageInstructions.length).toBe(2);
    expect(parsed.dosageInstructions[0].rateQuantity?.value).toBe(125);
    expect(parsed.dosageInstructions[0].rateQuantity?.unit).toBe("mL/h");
    expect(parsed.dosageInstructions[0].durationHours).toBe(2);

    expect(parsed.dosageInstructions[1].durationHours).toBe(46);
    expect(parsed.requiresCentralLine).toBe(true);
  });

  it("should extract R-CHOP protocol with rituximab and normal saline diluent", () => {
    const orders = fhirClient.getMedicationRequests("P-1002");
    const rchop = orders[0];
    const parsed = protocolParser.parse(rchop);

    expect(parsed.protocolName).toContain("R-CHOP");
    expect(parsed.activeIngredients[0].name.toLowerCase()).toContain("rituximab");
    expect(parsed.activeIngredients[0].rxNormCode).toBe("121191");
    expect(parsed.carrierFluids[0].name.toLowerCase()).toContain("sodium chloride");
  });
});
