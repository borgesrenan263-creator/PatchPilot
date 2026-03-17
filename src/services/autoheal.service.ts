import { exec } from "child_process";
import { logAutoHeal } from "./autoheal-log.service";
import { FailureType } from "./health.service";

type AutoHealContext = {
  project: any;
  failureType: FailureType;
  statusCode?: number | null;
};

function buildCommandQueue(ctx: AutoHealContext): string[] {
  const queue: string[] = [];

  const custom = ctx.project.autoHealCommand;
  if (custom && typeof custom === "string" && custom.trim().length > 0) {
    queue.push(custom.trim());
  }

  if (ctx.failureType === "timeout") {
    queue.push("echo strategy-timeout-retry");
    queue.push("echo strategy-timeout-wait-and-recheck");
    return queue;
  }

  if (ctx.failureType === "dns_error") {
    queue.push("echo strategy-dns-check");
    queue.push("echo strategy-dns-retry");
    return queue;
  }

  if (ctx.failureType === "connection_refused" || ctx.failureType === "unreachable") {
    queue.push("echo strategy-restart-for-unreachable");
    queue.push("echo strategy-network-retry");
    queue.push("echo strategy-generic-restart");
    return queue;
  }

  if (ctx.failureType === "http_500") {
    queue.push("echo strategy-restart-for-500");
    queue.push("echo strategy-clear-runtime-state");
    queue.push("echo strategy-generic-restart");
    return queue;
  }

  if (ctx.failureType === "http_502_503_504") {
    queue.push("echo strategy-restart-upstream");
    queue.push("echo strategy-retry-proxy-layer");
    queue.push("echo strategy-generic-restart");
    return queue;
  }

  if (ctx.failureType === "http_404") {
    queue.push("echo strategy-check-route-config");
    return queue;
  }

  if (ctx.failureType === "http_401_403") {
    queue.push("echo strategy-check-auth-config");
    return queue;
  }

  if (ctx.failureType === "http_error") {
    queue.push("echo strategy-generic-http-recovery");
    return queue;
  }

  queue.push("echo strategy-fallback-no-action");
  return queue;
}

async function execCommand(command: string) {
  return new Promise<{
    success: boolean;
    output: string;
  }>((resolve) => {
    exec(command, (err, stdout, stderr) => {
      const output = err
        ? err.message
        : (stdout || stderr || "").trim();

      resolve({
        success: !err,
        output: output.trim(),
      });
    });
  });
}

export async function tryAutoHeal(ctx: AutoHealContext) {
  const commands = buildCommandQueue(ctx);

  console.log("🛠️ Attempting auto-heal for:", ctx.project.name);
  console.log("🧠 Failure type:", ctx.failureType);
  console.log("🧠 Strategy queue:", commands);

  for (const command of commands) {
    console.log("🧪 Running command:", command);

    const result = await execCommand(command);

    if (result.success) {
      console.log("✅ Auto-heal output:", result.output);

      await logAutoHeal({
        projectId: ctx.project.id,
        command,
        success: true,
        output: result.output,
        failureType: ctx.failureType,
        statusCode: ctx.statusCode ?? null,
      });

      return true;
    }

    console.log("❌ Auto-heal failed:", result.output);

    await logAutoHeal({
      projectId: ctx.project.id,
      command,
      success: false,
      output: result.output,
      failureType: ctx.failureType,
      statusCode: ctx.statusCode ?? null,
    });
  }

  return false;
}
