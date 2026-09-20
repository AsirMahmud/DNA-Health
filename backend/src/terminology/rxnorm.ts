/**
 * RxNorm Terminology and NLM RxNav REST Integration
 * Official National Library of Medicine (NLM) REST API Client
 * Endpoint: https://rxnav.nlm.nih.gov/REST
 */

import { config } from "../config/env.js";

export interface RxNormConcept {
  rxcui: string;
  name: string;
  tty: string; // Term type: IN (Ingredient), PIN (Precise Ingredient), SCD (Semantic Clinical Drug)
  synonym?: string;
  brandName?: string;
  category: "CHEMOTHERAPY" | "CARRIER_FLUID" | "PREMEDICATION" | "RESCUE_AGENT" | "OTHER";
}

export const COMMON_RXNORM_CATALOG: Record<string, RxNormConcept> = {
  // Chemotherapy Antineoplastic Agents
  "32592": {
    rxcui: "32592",
    name: "oxaliplatin",
    tty: "IN",
    synonym: "Eloxatin",
    brandName: "Eloxatin",
    category: "CHEMOTHERAPY",
  },
  "4492": {
    rxcui: "4492",
    name: "fluorouracil",
    tty: "IN",
    synonym: "5-FU / Adrucil",
    brandName: "Adrucil",
    category: "CHEMOTHERAPY",
  },
  "6313": {
    rxcui: "6313",
    name: "leucovorin",
    tty: "IN",
    synonym: "Folinic Acid",
    brandName: "Wellcovorin",
    category: "RESCUE_AGENT",
  },
  "121191": {
    rxcui: "121191",
    name: "rituximab",
    tty: "IN",
    synonym: "Rituxan",
    brandName: "Rituxan",
    category: "CHEMOTHERAPY",
  },
  "2555": {
    rxcui: "2555",
    name: "cyclophosphamide",
    tty: "IN",
    synonym: "Cytoxan",
    brandName: "Cytoxan",
    category: "CHEMOTHERAPY",
  },
  "3639": {
    rxcui: "3639",
    name: "doxorubicin",
    tty: "IN",
    synonym: "Adriamycin",
    brandName: "Adriamycin",
    category: "CHEMOTHERAPY",
  },
  "11289": {
    rxcui: "11289",
    name: "vincristine",
    tty: "IN",
    synonym: "Oncovin",
    brandName: "Oncovin",
    category: "CHEMOTHERAPY",
  },
  "8640": {
    rxcui: "8640",
    name: "prednisone",
    tty: "IN",
    synonym: "Deltasone",
    brandName: "Deltasone",
    category: "PREMEDICATION",
  },
  "2551": {
    rxcui: "2551",
    name: "cisplatin",
    tty: "IN",
    synonym: "Platinol",
    brandName: "Platinol",
    category: "CHEMOTHERAPY",
  },
  "4177": {
    rxcui: "4177",
    name: "etoposide",
    tty: "IN",
    synonym: "Toposar / VP-16",
    brandName: "Toposar",
    category: "CHEMOTHERAPY",
  },

  // Carrier Fluids / Diluents
  "309789": {
    rxcui: "309789",
    name: "dextrose 50 MG/ML injectable solution (D5W)",
    tty: "SCD",
    synonym: "5% Dextrose in Water (D5W)",
    category: "CARRIER_FLUID",
  },
  "313002": {
    rxcui: "313002",
    name: "sodium chloride 9 MG/ML injectable solution (0.9% Normal Saline)",
    tty: "SCD",
    synonym: "0.9% Sodium Chloride (Normal Saline)",
    category: "CARRIER_FLUID",
  },
  "1792612": {
    rxcui: "1792612",
    name: "sodium chloride 4.5 MG/ML injectable solution (0.45% Half Normal Saline)",
    tty: "SCD",
    synonym: "0.45% Sodium Chloride (Half Normal Saline)",
    category: "CARRIER_FLUID",
  },
};

export class RxNavService {
  private cache: Map<string, RxNormConcept> = new Map();
  private baseUrl = config.rxNavBaseUrl || "https://rxnav.nlm.nih.gov/REST";

  constructor() {
    // Prime cache with standard oncology drugs
    Object.values(COMMON_RXNORM_CATALOG).forEach((concept) => {
      this.cache.set(concept.rxcui, concept);
    });
  }

  /**
   * Look up RxNorm concept properties live from NLM RxNav REST API
   * Endpoint: https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}/properties.json
   */
  async getConceptByRxcui(rxcui: string): Promise<RxNormConcept | null> {
    if (this.cache.has(rxcui)) {
      return this.cache.get(rxcui)!;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/rxcui/${rxcui}/properties.json`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any;
        const props = data?.properties;
        if (props) {
          const concept: RxNormConcept = {
            rxcui: props.rxcui,
            name: props.name,
            tty: props.tty,
            category: "CHEMOTHERAPY",
          };
          this.cache.set(rxcui, concept);
          return concept;
        }
      }
    } catch (err) {
      console.warn(`[RxNav] Live query failed for RxCUI ${rxcui}, using fallback:`, err);
    }

    return null;
  }

  /**
   * Searches drugs live by name on NLM RxNav API
   * Endpoint: https://rxnav.nlm.nih.gov/REST/drugs.json?name={name}
   */
  async searchDrugsByName(name: string): Promise<Array<{ rxcui: string; name: string; synonym?: string }>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${this.baseUrl}/drugs.json?name=${encodeURIComponent(name)}`,
        {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any;
        const conceptGroup = data?.drugGroup?.conceptGroup || [];
        const results: Array<{ rxcui: string; name: string; synonym?: string }> = [];

        for (const group of conceptGroup) {
          if (group.conceptProperties) {
            for (const prop of group.conceptProperties) {
              results.push({
                rxcui: prop.rxcui,
                name: prop.name,
                synonym: prop.synonym,
              });
            }
          }
        }

        if (results.length > 0) return results.slice(0, 10);
      }
    } catch (err) {
      console.warn(`[RxNav] Live search failed for ${name}:`, err);
    }

    // Local fallback search
    const query = name.toLowerCase();
    return Object.values(COMMON_RXNORM_CATALOG)
      .filter((c) => c.name.toLowerCase().includes(query) || (c.synonym && c.synonym.toLowerCase().includes(query)))
      .map((c) => ({ rxcui: c.rxcui, name: c.name, synonym: c.synonym }));
  }

  /**
   * Queries related active ingredients live from NLM RxNav API
   * Endpoint: https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}/related.json?tty=IN+PIN
   */
  async getRelatedIngredients(rxcui: string): Promise<Array<{ rxcui: string; name: string }>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${this.baseUrl}/rxcui/${rxcui}/related.json?tty=IN+PIN`,
        {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as any;
        const groups = data?.relatedGroup?.conceptGroup || [];
        const ingredients: Array<{ rxcui: string; name: string }> = [];

        for (const g of groups) {
          if (g.conceptProperties) {
            for (const p of g.conceptProperties) {
              ingredients.push({ rxcui: p.rxcui, name: p.name });
            }
          }
        }
        if (ingredients.length > 0) return ingredients;
      }
    } catch (err) {
      console.warn(`[RxNav] Live related ingredients query failed for RxCUI ${rxcui}:`, err);
    }

    const local = COMMON_RXNORM_CATALOG[rxcui];
    return local ? [{ rxcui: local.rxcui, name: local.name }] : [];
  }
}

export const rxNavService = new RxNavService();
