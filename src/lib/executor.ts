import { exec } from "child_process";

export function runFix(command: string) {
  return new Promise((resolve) => {
    if (!command) return resolve("No command");

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return resolve(`Erro: ${error.message}`);
      }
      if (stderr) {
        return resolve(`STDERR: ${stderr}`);
      }
      resolve(stdout || "OK");
    });
  });
}
