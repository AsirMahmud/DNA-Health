"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || "4000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    fhirServerUrl: process.env.FHIR_SERVER_URL || "https://hapi.fhir.org/baseR4",
    rxNavBaseUrl: process.env.RXNAV_BASE_URL || "https://rxnav.nlm.nih.gov/REST",
    hospitalId: "HOSP-MEMORIAL-CANCER-CTR-982",
    defaultSafetyThresholds: {
        minANC: 1.5, // 10^3 / uL (or 1500 / uL)
        maxSerumCreatinine: 1.5, // mg/dL
        maxLabAgeHours: 24, // Chemotherapy requires same-day labs (within 24h)
    },
};
