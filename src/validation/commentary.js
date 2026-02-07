import { z } from "zod";

// List commentary query schema
export const listCommentaryQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
});

// Create commentary schema
export const createCommentarySchema = z.object({
    minute: z.number().int().nonnegative().optional(),
    sequence: z.number().int().nonnegative().optional(),
    period: z.string().optional(),
    eventType: z.string().optional(),
    actor: z.string().optional(),
    team: z.string().optional(),
    message: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    tags: z.array(z.string()).optional(),
});
