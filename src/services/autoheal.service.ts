import { exec } from "child_process";
import { logAutoHeal } from "./autoheal-log.service";
import { buildHealStrategy } from "./heal-strategy.service";

type FailureType =
  | "healthy"
  | "connection_refused"
  | "unreachable"
  | "timeout"
  | "http_404"
  | "http_500"
  | "http_502_503_504"
  | "http_error"
  | "unknown";

type AutoHealContext = {
  project: any;
  failureType: FailureType;
  statusCode?: number;
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCommand(projectId: number, command: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log("🧪 Running command:", command);

    exec(command, async (err, stdout, stderr) => {
      const success = !err;
      const output = err
        ? (stderr || err.message || "").trim()
        : (stdout || "").trim();

      if (success) {
        console.log("✅ Auto-heal output:", output || "ok");
      } else {
        console.log("❌ Auto-heal failed:", output || "unknown error");
      }

      await logAutoHeal({
        projectId,
        command,
        success,
        output,
      });

      resolve(success);
    });
  });
}

export async function tryAutoHeal(ctx: AutoHealContext) {
  const strategyQueue = buildHealStrategy(ctx);

  console.log("🛠 Attempting auto-heal for:", ctx.project.name);
  console.log("🧠 Failure type:", ctx.failureType);

  for (const command of strategyQueue) {
    const success = await runCommand(ctx.project.id, command);

    if (success) {
      console.log("⏳ Waiting before retry...");
      await delay(3000); // tempo para subir serviço
      return true;
    }
  }

  return false;
}
