import express from "express";
import cors from "cors";
import chemotherapyRoutes from "./routes/chemotherapy.routes.js";
import hl7Routes from "./routes/hl7.routes.js";
import complianceRoutes from "./routes/compliance.routes.js";
import integrationsRoutes from "./routes/integrations.routes.js";
import { integrationsController } from "./controllers/integrations.controller.js";

const app = express();

app.use(cors());
app.use(express.json());
// Support raw HL7 text/plain post
app.use(express.text({ type: ["text/plain", "application/hl7-v2"] }));

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
app.get("/.well-known/smart-configuration", (req, res) =>
  integrationsController.getSmartConfiguration(req, res)
);
app.post("/api/auth/token", (req, res) =>
  integrationsController.handleSmartToken(req, res)
);

// API Routes
app.use("/api", chemotherapyRoutes);
app.use("/api/hl7", hl7Routes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/integrations", integrationsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Endpoint not found: ${req.method} ${req.path}` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: err.message || "Internal server error" });
});

export default app;
