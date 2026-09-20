/**
 * HL7 FHIR R4 Typed Definitions for Oncology Regimens and Safety Gates
 */

export interface FhirCoding {
  system: string;
  code: string;
  display?: string;
}

export interface FhirCodeableConcept {
  coding?: FhirCoding[];
  text?: string;
}

export interface FhirQuantity {
  value: number;
  unit: string;
  system?: string;
  code?: string;
}

export interface FhirRatio {
  numerator: FhirQuantity;
  denominator: FhirQuantity;
}

export interface FhirReference {
  reference: string;
  display?: string;
  type?: string;
}

export interface FhirHumanName {
  use?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  text?: string;
}

export interface FhirIdentifier {
  use?: string;
  system?: string;
  value: string;
}

export interface FhirPatient {
  resourceType: "Patient";
  id: string;
  identifier?: FhirIdentifier[];
  active?: boolean;
  name?: FhirHumanName[];
  telecom?: Array<{ system: string; value: string; use?: string }>;
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
}

export interface FhirDosageInstruction {
  sequence?: number;
  text?: string;
  timing?: {
    repeat?: {
      duration?: number;
      durationUnit?: string;
      frequency?: number;
      period?: number;
      periodUnit?: string;
    };
  };
  route?: FhirCodeableConcept;
  doseAndRate?: Array<{
    type?: FhirCodeableConcept;
    doseQuantity?: FhirQuantity;
    rateRatio?: FhirRatio;
    rateQuantity?: FhirQuantity;
  }>;
}

export interface FhirMedicationIngredient {
  itemCodeableConcept?: FhirCodeableConcept;
  itemReference?: FhirReference;
  isActive?: boolean;
  strength?: FhirRatio;
}

export interface FhirMedication {
  resourceType: "Medication";
  id: string;
  code?: FhirCodeableConcept;
  status?: string;
  ingredient?: FhirMedicationIngredient[];
}

export interface FhirMedicationRequest {
  resourceType: "MedicationRequest";
  id: string;
  identifier?: FhirIdentifier[];
  status: "active" | "on-hold" | "cancelled" | "completed" | "entered-in-error" | "stopped" | "draft";
  intent: "order" | "proposal" | "plan" | "original-order" | "reflex-order" | "filler-order" | "instance-order";
  category?: FhirCodeableConcept[];
  medicationCodeableConcept?: FhirCodeableConcept;
  medicationReference?: FhirReference;
  contained?: Array<FhirMedication | any>;
  subject: FhirReference;
  authoredOn?: string;
  requester?: FhirReference;
  dosageInstruction?: FhirDosageInstruction[];
  dispenseRequest?: {
    validityPeriod?: { start?: string; end?: string };
    numberOfRepeatsAllowed?: number;
    quantity?: FhirQuantity;
    expectedSupplyDuration?: FhirQuantity;
  };
  note?: Array<{ text: string; time?: string }>;
}

export interface FhirObservation {
  resourceType: "Observation";
  id: string;
  identifier?: FhirIdentifier[];
  status: "registered" | "preliminary" | "final" | "amended" | "corrected" | "cancelled" | "entered-in-error" | "unknown";
  category?: FhirCodeableConcept[];
  code: FhirCodeableConcept;
  subject: FhirReference;
  effectiveDateTime?: string;
  issued?: string;
  valueQuantity?: FhirQuantity;
  valueString?: string;
  interpretation?: FhirCodeableConcept[];
  referenceRange?: Array<{
    low?: FhirQuantity;
    high?: FhirQuantity;
    text?: string;
  }>;
}

export interface FhirMedicationAdministration {
  resourceType: "MedicationAdministration";
  id: string;
  identifier?: FhirIdentifier[];
  status: "in-progress" | "not-done" | "on-hold" | "completed" | "entered-in-error" | "stopped" | "unknown";
  medicationCodeableConcept?: FhirCodeableConcept;
  subject: FhirReference;
  effectiveDateTime?: string;
  effectivePeriod?: { start: string; end?: string };
  performer?: Array<{ actor: FhirReference }>;
  dosage?: {
    text?: string;
    route?: FhirCodeableConcept;
    rateQuantity?: FhirQuantity;
    rateRatio?: FhirRatio;
    dose?: FhirQuantity;
  };
  device?: FhirReference[];
}

export interface FhirAuditEvent {
  resourceType: "AuditEvent";
  id: string;
  type: FhirCoding;
  subtype?: FhirCoding[];
  action: "C" | "R" | "U" | "D" | "E";
  recorded: string;
  outcome: "0" | "4" | "8" | "12"; // 0 = Success, 4 = Minor failure, 8 = Serious failure, 12 = Major failure
  outcomeDesc?: string;
  agent: Array<{
    type?: FhirCodeableConcept;
    who?: FhirReference;
    requestor: boolean;
  }>;
  source: {
    site?: string;
    observer: FhirReference;
    type?: FhirCoding[];
  };
  entity?: Array<{
    what?: FhirReference;
    type?: FhirCoding;
    role?: FhirCoding;
    description?: string;
  }>;
}

export interface FhirBundleEntry {
  fullUrl?: string;
  resource: any;
}

export interface FhirBundle {
  resourceType: "Bundle";
  id: string;
  type: "document" | "message" | "transaction" | "transaction-response" | "batch" | "batch-response" | "history" | "searchset" | "collection";
  timestamp?: string;
  total?: number;
  entry?: FhirBundleEntry[];
}
