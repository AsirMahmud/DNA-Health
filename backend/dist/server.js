"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = __importDefault(require("./app.js"));
const env_js_1 = require("./config/env.js");
const PORT = env_js_1.config.port;
app_js_1.default.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏥 Chemotherapy Infusion Safety Gate Service Online`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 FHIR R4 Sandbox: ${env_js_1.config.fhirServerUrl}`);
    console.log(`🧬 NLM RxNav Endpoint: ${env_js_1.config.rxNavBaseUrl}`);
    console.log(`🛡️  Safety Rules: ANC >= ${env_js_1.config.defaultSafetyThresholds.minANC}, Cr <= ${env_js_1.config.defaultSafetyThresholds.maxSerumCreatinine}`);
    console.log(`=======================================================`);
});
