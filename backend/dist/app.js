"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const chemotherapy_routes_js_1 = __importDefault(require("./routes/chemotherapy.routes.js"));
const hl7_routes_js_1 = __importDefault(require("./routes/hl7.routes.js"));
const compliance_routes_js_1 = __importDefault(require("./routes/compliance.routes.js"));
const integrations_routes_js_1 = __importDefault(require("./routes/integrations.routes.js"));
const integrations_controller_js_1 = require("./controllers/integrations.controller.js");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Support raw HL7 text/plain post
app.use(express_1.default.text({ type: ["text/plain", "application/hl7-v2"] }));
// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "HEALTHY",
        service: "Chemotherapy Infusion Safety Gate",
        timestamp: new Date().toISOString(),
        standards: [
            "HL7 FHIR R4",
            "LOINC",
            "RxNorm",
            "NLM RxNav REST API",
            "HAPI FHIR Live Sandbox",
            "HL7 v2.5 RAS^O17",
            "TEFCA QTF v1",
            "SMART on FHIR PKCE",
        ],
    });
});
// SMART on FHIR Discovery Configuration
app.get("/.well-known/smart-configuration", (req, res) => integrations_controller_js_1.integrationsController.getSmartConfiguration(req, res));
app.post("/api/auth/token", (req, res) => integrations_controller_js_1.integrationsController.handleSmartToken(req, res));
// API Routes
app.use("/api", chemotherapy_routes_js_1.default);
app.use("/api/hl7", hl7_routes_js_1.default);
app.use("/api/compliance", compliance_routes_js_1.default);
app.use("/api/integrations", integrations_routes_js_1.default);
// 404 Handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: `Endpoint not found: ${req.method} ${req.path}` });
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, error: err.message || "Internal server error" });
});
exports.default = app;
