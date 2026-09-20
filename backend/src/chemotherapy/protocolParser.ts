/**
 * FHIR Oncology MedicationRequest Protocol Parser
 * Navigates complex nested arrays: multi-drug mixtures, carrier diluents, and IV drip rates.
 */

import { FhirMedicationRequest, FhirMedication } from "../fhir/types.js";
import {
  ParsedChemotherapyProtocol,
  ParsedIngredient,
  ParsedDoseInstruction,
} from "./types.js";
import { COMMON_RXNORM_CATALOG } from "../terminology/rxnorm.js";

export class ProtocolParser {
  /**
   * Parses an HL7 FHIR MedicationRequest representing a chemotherapy protocol.
   */
  public parse(order: FhirMedicationRequest): ParsedChemotherapyProtocol {
    const protocolName =
      order.medicationCodeableConcept?.text ||
      order.medicationCodeableConcept?.coding?.[0]?.display ||
      "Chemotherapy Regimen";

    const rxNormCode = order.medicationCodeableConcept?.coding?.find(
      (c) => c.system.includes("rxnorm") || c.system === "http://hl7.org/fhir/sid/rxnorm"
    )?.code;

    const activeIngredients: ParsedIngredient[] = [];
    const carrierFluids: ParsedIngredient[] = [];

    // 1. Process contained medications (e.g. multi-ingredient IV bags)
    if (order.contained && order.contained.length > 0) {
      for (const item of order.contained) {
        if (item.resourceType === "Medication") {
          const med = item as FhirMedication;
          this.extractIngredientsFromMedication(med, activeIngredients, carrierFluids);
        }
      }
    }

    // 2. Fallback: if no contained medications, check top-level coding
    if (activeIngredients.length === 0 && rxNormCode) {
      const known = COMMON_RXNORM_CATALOG[rxNormCode];
      activeIngredients.push({
        name: known?.name || protocolName,
        rxNormCode,
        isActive: true,
        category: known?.category || "CHEMOTHERAPY",
      });
    }

    // 3. Process dosage instructions (drip rates, durations, carrier volumes)
    const dosageInstructions: ParsedDoseInstruction[] = [];
    if (order.dosageInstruction && order.dosageInstruction.length > 0) {
      order.dosageInstruction.forEach((instr, idx) => {
        const sequence = instr.sequence ?? idx + 1;
        const text = instr.text || `Step ${sequence}`;
        const route = instr.route?.text || instr.route?.coding?.[0]?.display || "Intravenous";

        let rateQuantity = instr.doseAndRate?.[0]?.rateQuantity
          ? {
              value: instr.doseAndRate[0].rateQuantity.value,
              unit: instr.doseAndRate[0].rateQuantity.unit,
            }
          : undefined;

        const durationHours =
          instr.timing?.repeat?.duration && instr.timing.repeat.durationUnit === "h"
            ? instr.timing.repeat.duration
            : undefined;

        // Calculate rate if rateQuantity not explicitly set, but total volume and duration are present
        let calculatedRateMlPerHour: number | undefined = rateQuantity?.value;
        if (!calculatedRateMlPerHour && durationHours && carrierFluids.length > 0) {
          const totalVol = carrierFluids.reduce(
            (acc, cf) => acc + (cf.strengthRatio?.numeratorValue || 0),
            0
          );
          if (totalVol > 0) {
            calculatedRateMlPerHour = Math.round((totalVol / durationHours) * 10) / 10;
          }
        }

        dosageInstructions.push({
          sequence,
          text,
          route,
          rateQuantity,
          durationHours,
          calculatedRateMlPerHour,
        });
      });
    }

    const clinicalNotes = order.note?.map((n) => n.text) || [];
    const requiresCentralLine =
      protocolName.toLowerCase().includes("folfox") ||
      dosageInstructions.some((d) => d.durationHours && d.durationHours > 12);

    return {
      medicationRequestId: order.id,
      protocolName,
      rxNormCode,
      authoredOn: order.authoredOn,
      status: order.status,
      intent: order.intent,
      activeIngredients,
      carrierFluids,
      dosageInstructions,
      clinicalNotes,
      requiresCentralLine,
    };
  }

  private extractIngredientsFromMedication(
    med: FhirMedication,
    activeIngredients: ParsedIngredient[],
    carrierFluids: ParsedIngredient[]
  ): void {
    if (!med.ingredient || med.ingredient.length === 0) {
      // Direct medication
      const code = med.code?.coding?.[0]?.code || "UNKNOWN";
      const name = med.code?.text || med.code?.coding?.[0]?.display || "Medication";
      const known = COMMON_RXNORM_CATALOG[code];
      activeIngredients.push({
        name: known?.name || name,
        rxNormCode: code,
        isActive: true,
        category: known?.category || "CHEMOTHERAPY",
      });
      return;
    }

    for (const ing of med.ingredient) {
      const code = ing.itemCodeableConcept?.coding?.[0]?.code || "UNKNOWN";
      const name = ing.itemCodeableConcept?.text || ing.itemCodeableConcept?.coding?.[0]?.display || "Ingredient";
      const known = COMMON_RXNORM_CATALOG[code];

      const strengthRatio = ing.strength
        ? {
            numeratorValue: ing.strength.numerator.value,
            numeratorUnit: ing.strength.numerator.unit,
            denominatorValue: ing.strength.denominator.value,
            denominatorUnit: ing.strength.denominator.unit,
          }
        : undefined;

      const isCarrier =
        known?.category === "CARRIER_FLUID" ||
        ing.isActive === false ||
        name.toLowerCase().includes("saline") ||
        name.toLowerCase().includes("dextrose") ||
        name.toLowerCase().includes("d5w") ||
        name.toLowerCase().includes("carrier");

      const category = isCarrier ? "CARRIER_FLUID" : known?.category || "CHEMOTHERAPY";

      const parsed: ParsedIngredient = {
        name: known?.name || name,
        brandName: known?.synonym,
        rxNormCode: code,
        isActive: !isCarrier,
        category,
        dose: strengthRatio
          ? { value: strengthRatio.numeratorValue, unit: strengthRatio.numeratorUnit }
          : undefined,
        strengthRatio,
      };

      if (isCarrier) {
        carrierFluids.push(parsed);
      } else {
        activeIngredients.push(parsed);
      }
    }
  }
}

export const protocolParser = new ProtocolParser();
