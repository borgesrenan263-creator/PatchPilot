import { exec } from "child_process";

export type HealExecutionResult = {
  success: boolean;
  command: string;
  stdout: string;
  stderr: string;
  error: string | null;
  executedAt: string;
};

export function runCommand(command: string): Promise<HealExecutionResult> {
  return new Promise((resolve) => {
    if (!command || !command.trim()) {
      return resolve({
        success: false,
        command: command || "",
        stdout: "",
        stderr: "",
        error: "Comando vazio",
        executedAt: new Date().toISOString(),
      });
    }

    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      resolve({
        success: !error,
        command,
        stdout: stdout?.trim() || "",
        stderr: stderr?.trim() || "",
        error: error ? error.message : null,
        executedAt: new Date().toISOString(),
      });
    });
  });
}
