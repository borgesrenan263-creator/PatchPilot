import { db } from "../lib/db";

export async function logAutoHeal({
  projectId,
  command,
  success,
  output,
  failureType,
  statusCode,
}: {
  projectId: number;
  command: string;
  success: boolean;
  output: string;
  failureType?: string | null;
  statusCode?: number | null;
}) {
  await db.query(
    `INSERT INTO "AutoHealLog"
      ("projectId", command, success, output, "failureType", "statusCode")
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [projectId, command, success, output, failureType ?? null, statusCode ?? null]
  );
}
