"use strict";
/**
 * FHIR Client with In-Memory Clinical Cohorts
 * Adheres strictly to HL7 FHIR R4 schema for oncology protocols and lab observations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fhirClient = exports.FhirClient = void 0;
const loinc_js_1 = require("../terminology/loinc.js");
class FhirClient {
    patientData = new Map();
    constructor() {
        this.seedClinicalCohorts();
    }
    seedClinicalCohorts() {
        const now = new Date();
        const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
        const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000).toISOString();
        const fourHoursAgo = new Date(now.getTime() - 4 * 3600 * 1000).toISOString();
        const thirtySixHoursAgo = new Date(now.getTime() - 36 * 3600 * 1000).toISOString();
        // ==========================================
        // Cohort 1: P-1001 (Eleanor Vance) - PASS
        // FOLFOX6, ANC 2.4 (Normal), Cr 0.9 (Normal)
        // ==========================================
        const p1001 = {
            resourceType: "Patient",
            id: "P-1001",
            identifier: [
                { use: "usual", system: "http://hospital.smarthealth.org/mrn", value: "MRN-8849201" },
                { use: "official", system: "http://hl7.org/fhir/sid/us-ssn", value: "902-11-4829" },
            ],
            active: true,
            name: [{ use: "official", family: "Vance", given: ["Eleanor", "Ruth"] }],
            gender: "female",
            birthDate: "1968-04-12",
            telecom: [{ system: "phone", value: "555-019-2831", use: "home" }],
            address: [{ line: ["742 Evergreen Terrace"], city: "Springfield", state: "IL", postalCode: "62704" }],
        };
        const folfoxMedRequest = {
            resourceType: "MedicationRequest",
            id: "MR-FOLFOX-1001",
            status: "active",
            intent: "order",
            subject: { reference: "Patient/P-1001", display: "Eleanor Vance" },
            authoredOn: twoHoursAgo,
            category: [
                {
                    coding: [
                        {
                            system: "http://terminology.hl7.org/CodeSystem/medicationrequest-category",
                            code: "inpatient",
                            display: "Inpatient",
                        },
                    ],
                },
            ],
            medicationCodeableConcept: {
                coding: [
                    {
                        system: "http://hl7.org/fhir/sid/rxnorm",
                        code: "32592",
                        display: "oxaliplatin / leucovorin / fluorouracil (FOLFOX6 Regimen)",
                    },
                ],
                text: "mFOLFOX6 Chemotherapy Protocol Cycle 3",
            },
            contained: [
                {
                    resourceType: "Medication",
                    id: "med-oxaliplatin-carrier",
                    code: {
                        coding: [
                            { system: "http://hl7.org/fhir/sid/rxnorm", code: "32592", display: "Oxaliplatin" },
                        ],
                        text: "Oxaliplatin 85 mg/m2 in D5W",
                    },
                    ingredient: [
                        {
                            itemCodeableConcept: {
                                coding: [
                                    { system: "http://hl7.org/fhir/sid/rxnorm", code: "32592", display: "Oxaliplatin" },
                                ],
                                text: "Oxaliplatin active ingredient",
                            },
                            isActive: true,
                            strength: {
                                numerator: { value: 150, unit: "mg", system: "http://unitsofmeasure.org", code: "mg" },
                                denominator: { value: 250, unit: "mL", system: "http://unitsofmeasure.org", code: "mL" },
                            },
                        },
                        {
                            itemCodeableConcept: {
                                coding: [
                                    { system: "http://hl7.org/fhir/sid/rxnorm", code: "309789", display: "5% Dextrose in Water (D5W)" },
                                ],
                                text: "D5W Carrier Fluid",
                            },
                            isActive: false,
                            strength: {
                                numerator: { value: 250, unit: "mL", system: "http://unitsofmeasure.org", code: "mL" },
                                denominator: { value: 250, unit: "mL", system: "http://unitsofmeasure.org", code: "mL" },
                            },
                        },
                    ],
                },
                {
                    resourceType: "Medication",
                    id: "med-5fu-infusion",
                    code: {
                        coding: [
                            { system: "http://hl7.org/fhir/sid/rxnorm", code: "4492", display: "Fluorouracil" },
                        ],
                        text: "Fluorouracil 2400 mg/m2 continuous infusion",
                    },
                    ingredient: [
                        {
                            itemCodeableConcept: {
                                coding: [
                                    { system: "http://hl7.org/fhir/sid/rxnorm", code: "4492", display: "Fluorouracil" },
                                ],
                                text: "5-Fluorouracil",
                            },
                            isActive: true,
                            strength: {
                                numerator: { value: 4200, unit: "mg", system: "http://unitsofmeasure.org", code: "mg" },
                                denominator: { value: 1000, unit: "mL", system: "http://unitsofmeasure.org", code: "mL" },
                            },
                        },
                        {
                            itemCodeableConcept: {
                                coding: [
                                    { system: "http://hl7.org/fhir/sid/rxnorm", code: "313002", display: "0.9% Sodium Chloride (Normal Saline)" },
                                ],
                                text: "Normal Saline Carrier Fluid",
                            },
                            isActive: false,
                            strength: {
                                numerator: { value: 1000, unit: "mL", system: "http://unitsofmeasure.org", code: "mL" },
                                denominator: { value: 1000, unit: "mL", system: "http://unitsofmeasure.org", code: "mL" },
                            },
                        },
                    ],
                },
            ],
            dosageInstruction: [
                {
                    sequence: 1,
                    text: "Oxaliplatin 150 mg in 250 mL D5W IV over 2 hours",
                    timing: {
                        repeat: {
                            duration: 2,
                            durationUnit: "h",
                        },
                    },
                    route: {
                        coding: [{ system: "http://snomed.info/sct", code: "47625008", display: "Intravenous route" }],
                        text: "IV Infusion",
                    },
                    doseAndRate: [
                        {
                            doseQuantity: { value: 150, unit: "mg", system: "http://unitsofmeasure.org", code: "mg" },
                            rateQuantity: { value: 125, unit: "mL/h", system: "http://unitsofmeasure.org", code: "mL/h" },
                        },
                    ],
                },
                {
                    sequence: 2,
                    text: "Fluorouracil 4200 mg in 1000 mL 0.9% NS IV continuous infusion over 46 hours",
                    timing: {
                        repeat: {
                            duration: 46,
                            durationUnit: "h",
                        },
                    },
                    route: {
                        coding: [{ system: "http://snomed.info/sct", code: "47625008", display: "Intravenous route" }],
                        text: "IV Continuous Infusion",
                    },
                    doseAndRate: [
                        {
                            doseQuantity: { value: 4200, unit: "mg", system: "http://unitsofmeasure.org", code: "mg" },
                            rateQuantity: { value: 21.7, unit: "mL/h", system: "http://unitsofmeasure.org", code: "mL/h" },
                        },
                    ],
                },
            ],
            note: [{ text: "Patient BSA: 1.76 m2. Pre-medicated with Ondansetron 16mg + Dexamethasone 12mg." }],
        };
        const p1001Labs = [
            {
                resourceType: "Observation",
                id: "obs-1001-anc",
                status: "final",
                category: [
                    {
                        coding: [
                            {
                                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                                code: "laboratory",
                                display: "Laboratory",
                            },
                        ],
                    },
                ],
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: loinc_js_1.LOINC_CODES.ANC_AUTOMATED,
                            display: "Neutrophils [#/volume] in Blood",
                        },
                    ],
                    text: "Absolute Neutrophil Count (ANC)",
                },
                subject: { reference: "Patient/P-1001" },
                effectiveDateTime: threeHoursAgo,
                valueQuantity: {
                    value: 2.4,
                    unit: "10*3/uL",
                    system: "http://unitsofmeasure.org",
                    code: "10*3/uL",
                },
                referenceRange: [
                    {
                        low: { value: 1.5, unit: "10*3/uL" },
                        high: { value: 8.0, unit: "10*3/uL" },
                        text: "Normal: >= 1.5 x 10^3/uL for chemotherapy clearance",
                    },
                ],
            },
            {
                resourceType: "Observation",
                id: "obs-1001-cr",
                status: "final",
                category: [
                    {
                        coding: [
                            {
                                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                                code: "laboratory",
                                display: "Laboratory",
                            },
                        ],
                    },
                ],
                code: {
                    coding: [
                        {
                            system: "http://loinc.org",
                            code: loinc_js_1.LOINC_CODES.CREATININE_SERUM_OR_PLASMA,
                            display: "Creatinine [Mass/volume] in Serum or Plasma",
                        },
                    ],
                    text: "Serum Creatinine",
                },
                subject: { reference: "Patient/P-1001" },
                effectiveDateTime: threeHoursAgo,
                valueQuantity: {
                    value: 0.9,
                    unit: "mg/dL",
                    system: "http://unitsofmeasure.org",
                    code: "mg/dL",
                },
                referenceRange: [
                    {
                        low: { value: 0.5, unit: "mg/dL" },
                        high: { value: 1.2, unit: "mg/dL" },
                        text: "Normal: <= 1.5 mg/dL for chemotherapy clearance",
                    },
                ],
            },
            {
                resourceType: "Observation",
                id: "obs-1001-plt",
                status: "final",
                code: {
                    coding: [
                        { system: "http://loinc.org", code: loinc_js_1.LOINC_CODES.PLATELETS, display: "Platelets [#/volume] in Blood" },
                    ],
                    text: "Platelet Count",
                },
                subject: { reference: "Patient/P-1001" },
                effectiveDateTime: threeHoursAgo,
                valueQuantity: { value: 185, unit: "10*3/uL", system: "http://unitsofmeasure.org", code: "10*3/uL" },
            },
        ];
        this.patientData.set("P-1001", {
            patient: p1001,
            medicationRequests: [folfoxMedRequest],
            observations: p1001Labs,
            administrations: [],
            auditEvents: [],
        });
        // ==========================================
        // Cohort 2: P-1002 (Marcus Brody) - HOLD (Neutropenia)
        // R-CHOP, ANC = 0.8 (< 1.5 -> HOLD), Cr = 1.0 (Normal)
        // ==========================================
        const p1002 = {
            resourceType: "Patient",
            id: "P-1002",
            identifier: [
                { use: "usual", system: "http://hospital.smarthealth.org/mrn", value: "MRN-7738202" },
            ],
            active: true,
            name: [{ use: "official", family: "Brody", given: ["Marcus", "Anthony"] }],
            gender: "male",
            birthDate: "1959-11-23",
            telecom: [{ system: "phone", value: "555-017-9912", use: "mobile" }],
            address: [{ line: ["1204 University Blvd"], city: "Chicago", state: "IL", postalCode: "60601" }],
        };
        const rchopMedRequest = {
            resourceType: "MedicationRequest",
            id: "MR-RCHOP-1002",
            status: "active",
            intent: "order",
            subject: { reference: "Patient/P-1002", display: "Marcus Brody" },
            authoredOn: twoHoursAgo,
            medicationCodeableConcept: {
                coding: [
                    { system: "http://hl7.org/fhir/sid/rxnorm", code: "121191", display: "Rituximab / Cyclophosphamide / Doxorubicin / Vincristine / Prednisone (R-CHOP)" },
                ],
                text: "R-CHOP Immunochemotherapy Protocol Cycle 2",
            },
            contained: [
                {
                    resourceType: "Medication",
                    id: "med-rituximab",
                    code: {
                        coding: [{ system: "http://hl7.org/fhir/sid/rxnorm", code: "121191", display: "Rituximab" }],
                        text: "Rituximab 375 mg/m2 in 500 mL 0.9% NS",
                    },
                    ingredient: [
                        {
                            itemCodeableConcept: {
                                coding: [{ system: "http://hl7.org/fhir/sid/rxnorm", code: "121191", display: "Rituximab" }],
                                text: "Rituximab",
                            },
                            isActive: true,
                            strength: {
                                numerator: { value: 700, unit: "mg", system: "http://unitsofmeasure.org", code: "mg" },
                                denominator: { value: 500, unit: "mL", system: "http://unitsofmeasure.org", code: "mL" },
                            },
                        },
                        {
                            itemCodeableConcept: {
                                coding: [{ system: "http://hl7.org/fhir/sid/rxnorm", code: "313002", display: "0.9% Sodium Chloride" }],
                                text: "Normal Saline Carrier",
                            },
                            isActive: false,
                            strength: {
                                numerator: { value: 500, unit: "mL", system: "http://unitsofmeasure.org", code: "mL" },
                                denominator: { value: 500, unit: "mL", system: "http://unitsofmeasure.org", code: "mL" },
                            },
                        },
                    ],
                },
            ],
            dosageInstruction: [
                {
                    sequence: 1,
                    text: "Rituximab 700 mg in 500 mL 0.9% NS IV at 50 mL/h titrated up to 400 mL/h",
                    timing: { repeat: { duration: 4, durationUnit: "h" } },
                    route: {
                        coding: [{ system: "http://snomed.info/sct", code: "47625008", display: "Intravenous route" }],
                        text: "IV Infusion",
                    },
                    doseAndRate: [
                        {
                            doseQuantity: { value: 700, unit: "mg", code: "mg" },
                            rateQuantity: { value: 100, unit: "mL/h", code: "mL/h" },
                        },
                    ],
                },
            ],
            note: [{ text: "Patient diagnosed with Diffuse Large B-cell Lymphoma." }],
        };
        const p1002Labs = [
            {
                resourceType: "Observation",
                id: "obs-1002-anc",
                status: "final",
                code: {
                    coding: [{ system: "http://loinc.org", code: loinc_js_1.LOINC_CODES.ANC_AUTOMATED, display: "Neutrophils [#/volume] in Blood" }],
                    text: "Absolute Neutrophil Count (ANC)",
                },
                subject: { reference: "Patient/P-1002" },
                effectiveDateTime: twoHoursAgo,
                valueQuantity: {
                    value: 0.8, // CRITICAL: Below 1.5 threshold
                    unit: "10*3/uL",
                    system: "http://unitsofmeasure.org",
                    code: "10*3/uL",
                },
                interpretation: [
                    {
                        coding: [
                            {
                                system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                                code: "L",
                                display: "Low",
                            },
                        ],
                    },
                ],
                referenceRange: [{ low: { value: 1.5, unit: "10*3/uL" }, high: { value: 8.0, unit: "10*3/uL" } }],
            },
            {
                resourceType: "Observation",
                id: "obs-1002-cr",
                status: "final",
                code: {
                    coding: [{ system: "http://loinc.org", code: loinc_js_1.LOINC_CODES.CREATININE_SERUM_OR_PLASMA, display: "Creatinine Serum" }],
                    text: "Serum Creatinine",
                },
                subject: { reference: "Patient/P-1002" },
                effectiveDateTime: twoHoursAgo,
                valueQuantity: { value: 1.0, unit: "mg/dL", system: "http://unitsofmeasure.org", code: "mg/dL" },
                referenceRange: [{ low: { value: 0.5, unit: "mg/dL" }, high: { value: 1.2, unit: "mg/dL" } }],
            },
        ];
        this.patientData.set("P-1002", {
            patient: p1002,
            medicationRequests: [rchopMedRequest],
            observations: p1002Labs,
            administrations: [],
            auditEvents: [],
        });
        // ==========================================
        // Cohort 3: P-1003 (Sarah Connor) - HOLD (Renal Failure)
        // Cisplatin/Etoposide, ANC = 2.9 (Normal), Cr = 2.4 (> 1.5 -> HOLD)
        // ==========================================
        const p1003 = {
            resourceType: "Patient",
            id: "P-1003",
            identifier: [
                { use: "usual", system: "http://hospital.smarthealth.org/mrn", value: "MRN-6541093" },
            ],
            active: true,
            name: [{ use: "official", family: "Connor", given: ["Sarah", "Jean"] }],
            gender: "female",
            birthDate: "1974-02-28",
            telecom: [{ system: "phone", value: "555-014-4321", use: "mobile" }],
            address: [{ line: ["88 Skyway Dr"], city: "Los Angeles", state: "CA", postalCode: "90001" }],
        };
        const cisplatinMedRequest = {
            resourceType: "MedicationRequest",
            id: "MR-CIS-1003",
            status: "active",
            intent: "order",
            subject: { reference: "Patient/P-1003", display: "Sarah Connor" },
            authoredOn: fourHoursAgo,
            medicationCodeableConcept: {
                coding: [
                    { system: "http://hl7.org/fhir/sid/rxnorm", code: "2551", display: "Cisplatin / Etoposide Regimen" },
                ],
                text: "Cisplatin + Etoposide Protocol Day 1",
            },
            contained: [
                {
                    resourceType: "Medication",
                    id: "med-cisplatin",
                    code: {
                        coding: [{ system: "http://hl7.org/fhir/sid/rxnorm", code: "2551", display: "Cisplatin" }],
                        text: "Cisplatin 75 mg/m2 in 500 mL 0.9% NS",
                    },
                    ingredient: [
                        {
                            itemCodeableConcept: {
                                coding: [{ system: "http://hl7.org/fhir/sid/rxnorm", code: "2551", display: "Cisplatin" }],
                                text: "Cisplatin",
                            },
                            isActive: true,
                            strength: {
                                numerator: { value: 125, unit: "mg", code: "mg" },
                                denominator: { value: 500, unit: "mL", code: "mL" },
                            },
                        },
                        {
                            itemCodeableConcept: {
                                coding: [{ system: "http://hl7.org/fhir/sid/rxnorm", code: "313002", display: "0.9% Sodium Chloride" }],
                                text: "Normal Saline Carrier",
                            },
                            isActive: false,
                            strength: {
                                numerator: { value: 500, unit: "mL", code: "mL" },
                                denominator: { value: 500, unit: "mL", code: "mL" },
                            },
                        },
                    ],
                },
            ],
            dosageInstruction: [
                {
                    sequence: 1,
                    text: "Cisplatin 125 mg in 500 mL 0.9% NS IV over 2 hours with aggressive hydration",
                    timing: { repeat: { duration: 2, durationUnit: "h" } },
                    route: {
                        coding: [{ system: "http://snomed.info/sct", code: "47625008", display: "Intravenous route" }],
                        text: "IV Infusion",
                    },
                    doseAndRate: [
                        {
                            doseQuantity: { value: 125, unit: "mg", code: "mg" },
                            rateQuantity: { value: 250, unit: "mL/h", code: "mL/h" },
                        },
                    ],
                },
            ],
            note: [{ text: "Pre-hydration 1L NS required prior to Cisplatin initiation." }],
        };
        const p1003Labs = [
            {
                resourceType: "Observation",
                id: "obs-1003-anc",
                status: "final",
                code: {
                    coding: [{ system: "http://loinc.org", code: loinc_js_1.LOINC_CODES.ANC_AUTOMATED, display: "Neutrophils in Blood" }],
                    text: "Absolute Neutrophil Count",
                },
                subject: { reference: "Patient/P-1003" },
                effectiveDateTime: fourHoursAgo,
                valueQuantity: { value: 3.2, unit: "10*3/uL", system: "http://unitsofmeasure.org", code: "10*3/uL" },
                referenceRange: [{ low: { value: 1.5, unit: "10*3/uL" }, high: { value: 8.0, unit: "10*3/uL" } }],
            },
            {
                resourceType: "Observation",
                id: "obs-1003-cr",
                status: "final",
                code: {
                    coding: [{ system: "http://loinc.org", code: loinc_js_1.LOINC_CODES.CREATININE_SERUM_OR_PLASMA, display: "Creatinine Serum" }],
                    text: "Serum Creatinine",
                },
                subject: { reference: "Patient/P-1003" },
                effectiveDateTime: fourHoursAgo,
                valueQuantity: {
                    value: 2.4, // CRITICAL: Elevated > 1.5 -> Renal Impairment
                    unit: "mg/dL",
                    system: "http://unitsofmeasure.org",
                    code: "mg/dL",
                },
                interpretation: [
                    {
                        coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "H", display: "High" }],
                    },
                ],
                referenceRange: [{ low: { value: 0.5, unit: "mg/dL" }, high: { value: 1.2, unit: "mg/dL" } }],
            },
        ];
        this.patientData.set("P-1003", {
            patient: p1003,
            medicationRequests: [cisplatinMedRequest],
            observations: p1003Labs,
            administrations: [],
            auditEvents: [],
        });
        // ==========================================
        // Cohort 4: P-1004 (James Chen) - HOLD (Expired Labs > 24h)
        // ==========================================
        const p1004 = {
            resourceType: "Patient",
            id: "P-1004",
            identifier: [{ use: "usual", system: "http://hospital.smarthealth.org/mrn", value: "MRN-3312904" }],
            active: true,
            name: [{ use: "official", family: "Chen", given: ["James", "Wei"] }],
            gender: "male",
            birthDate: "1963-08-15",
            address: [{ line: ["450 Market St"], city: "San Francisco", state: "CA", postalCode: "94105" }],
        };
        const p1004MedRequest = {
            resourceType: "MedicationRequest",
            id: "MR-FOLFOX-1004",
            status: "active",
            intent: "order",
            subject: { reference: "Patient/P-1004", display: "James Chen" },
            authoredOn: thirtySixHoursAgo,
            medicationCodeableConcept: {
                coding: [{ system: "http://hl7.org/fhir/sid/rxnorm", code: "32592", display: "FOLFOX6 Protocol" }],
                text: "FOLFOX6 Protocol Cycle 4",
            },
            dosageInstruction: [
                {
                    sequence: 1,
                    text: "Oxaliplatin 150 mg in 250 mL D5W IV over 2 hours",
                    doseAndRate: [{ rateQuantity: { value: 125, unit: "mL/h", code: "mL/h" } }],
                },
            ],
        };
        const p1004Labs = [
            {
                resourceType: "Observation",
                id: "obs-1004-anc",
                status: "final",
                code: {
                    coding: [{ system: "http://loinc.org", code: loinc_js_1.LOINC_CODES.ANC_AUTOMATED, display: "Neutrophils in Blood" }],
                    text: "Absolute Neutrophil Count",
                },
                subject: { reference: "Patient/P-1004" },
                effectiveDateTime: thirtySixHoursAgo, // EXPIRED: > 24 hours ago
                valueQuantity: { value: 2.1, unit: "10*3/uL", code: "10*3/uL" },
            },
            {
                resourceType: "Observation",
                id: "obs-1004-cr",
                status: "final",
                code: {
                    coding: [{ system: "http://loinc.org", code: loinc_js_1.LOINC_CODES.CREATININE_SERUM_OR_PLASMA, display: "Creatinine Serum" }],
                    text: "Serum Creatinine",
                },
                subject: { reference: "Patient/P-1004" },
                effectiveDateTime: thirtySixHoursAgo, // EXPIRED: > 24 hours ago
                valueQuantity: { value: 1.0, unit: "mg/dL", code: "mg/dL" },
            },
        ];
        this.patientData.set("P-1004", {
            patient: p1004,
            medicationRequests: [p1004MedRequest],
            observations: p1004Labs,
            administrations: [],
            auditEvents: [],
        });
    }
    // --- Clinical Data Retrieval ---
    getAllPatients() {
        return Array.from(this.patientData.values()).map((ctx) => ctx.patient);
    }
    getPatient(patientId) {
        return this.patientData.get(patientId)?.patient || null;
    }
    getMedicationRequests(patientId) {
        return this.patientData.get(patientId)?.medicationRequests || [];
    }
    getObservations(patientId) {
        return this.patientData.get(patientId)?.observations || [];
    }
    getAdministrations(patientId) {
        return this.patientData.get(patientId)?.administrations || [];
    }
    getAuditEvents(patientId) {
        return this.patientData.get(patientId)?.auditEvents || [];
    }
    addMedicationAdministration(patientId, admin) {
        const ctx = this.patientData.get(patientId);
        if (ctx) {
            ctx.administrations.push(admin);
        }
    }
    addAuditEvent(patientId, audit) {
        const ctx = this.patientData.get(patientId);
        if (ctx) {
            ctx.auditEvents.unshift(audit); // Most recent first
        }
    }
}
exports.FhirClient = FhirClient;
exports.fhirClient = new FhirClient();
