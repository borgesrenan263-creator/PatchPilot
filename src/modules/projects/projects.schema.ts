import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(3),
  repoUrl: z.string().url(),
  healthcheckUrl: z.string().url(),
  autoHealCommand: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
