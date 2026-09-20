import app from "./app.js";
import { config } from "./config/env.js";

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏥 Chemotherapy Infusion Safety Gate Service Online`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 FHIR R4 Sandbox: ${config.fhirServerUrl}`);
  console.log(`🧬 NLM RxNav Endpoint: ${config.rxNavBaseUrl}`);
  console.log(`🛡️  Safety Rules: ANC >= ${config.defaultSafetyThresholds.minANC}, Cr <= ${config.defaultSafetyThresholds.maxSerumCreatinine}`);
  console.log(`=======================================================`);
});
