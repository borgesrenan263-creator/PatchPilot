import "dotenv/config";
import { app } from "./app";
import { env } from "./lib/env";
import { runMonitorCycle } from "./services/monitor.service";

app.listen(env.port, "0.0.0.0", () => {
  console.log(`🚀 PatchPilot API running on port ${env.port}`);
});

if (process.env.NODE_ENV !== "test") {
  runMonitorCycle();

  setInterval(() => {
    runMonitorCycle();
  }, 10000);
}
