/**
 * HL7 v2 Message AST Types
 */

export interface Hl7EncodingCharacters {
  fieldSeparator: string;      // typically '|'
  componentSeparator: string;  // typically '^'
  repetitionSeparator: string; // typically '~'
  escapeCharacter: string;     // typically '\'
  subcomponentSeparator: string; // typically '&'
}

export interface Hl7Component {
  value: string;
  subcomponents: string[];
}

export interface Hl7Field {
  raw: string;
  repetitions: Hl7Component[][];
}

export interface Hl7Segment {
  name: string;
  raw: string;
  fields: Hl7Field[];
}

export interface ParsedHl7Message {
  raw: string;
  encoding: Hl7EncodingCharacters;
  segments: Hl7Segment[];
  messageType: string; // e.g. "RAS^O17"
  triggerEvent: string; // e.g. "O17"
  messageControlId: string;
  timestamp: string;
  senderApp: string;
}

export interface ParsedRasO17Event {
  messageControlId: string;
  timestamp: string;
  sendingApplication: string;
  patientMrn: string;
  patientName?: string;
  orderNumber?: string;
  adminSubIdCounter?: string;
  adminStartTime: string;
  adminEndTime?: string;
  administeredCode: string;
  administeredName: string;
  codingSystem: string;
  administeredAmount: number;
  administeredUnit: string;
  completionStatus: "START" | "IN_PROGRESS" | "COMPLETED" | "INTERRUPTED";
  route?: string;
  rawHl7: string;
}

export interface BedsidePumpStatus {
  patientId: string;
  mrn: string;
  infusionState: "IDLE" | "READY_ARMED" | "INFUSING" | "HOLD_INTERLOCKED" | "COMPLETED";
  currentRateMlPerHour: number;
  totalVolumeDeliveredMl: number;
  activeDrugName: string;
  startTime: string | null;
  endTime: string | null;
  lastRasEvent: ParsedRasO17Event | null;
  safetyInterlocked: boolean;
  alarmRaised: boolean;
  alarmMessage: string | null;
}
