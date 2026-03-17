import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  repoUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value || value.trim() === "") return null;
      return value.trim();
    }),
  healthcheckUrl: z.string().url("Healthcheck URL inválida"),
  autoHealCommand: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value || value.trim() === "") return null;
      return value.trim();
    }),
});
