import app from "./app";
import { startAutoHealMonitor } from "./services/autoheal.service";

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 PatchPilot rodando na porta " + PORT);
  startAutoHealMonitor();
});
