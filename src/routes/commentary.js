import { Router } from "express";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { commentary } from "../db/schema.js";
import { db } from "../db/db.js";
import { eq, desc } from "drizzle-orm";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 100;

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", async (req, res) => {
    const matchParams = matchIdParamSchema.safeParse(req.params);
    if (!matchParams.success) {
        return res.status(400).json({
            error: "Invalid match ID",
            details: matchParams.error.issues,
        });
    }

    const queryData = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryData.success) {
        return res.status(400).json({
            error: "Invalid query parameters",
            details: queryData.error.issues,
        });
    }

    try {
        const limit = Math.min(queryData.data.limit || DEFAULT_LIMIT, MAX_LIMIT);

        const results = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, matchParams.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        res.status(200).json({ data: results });
    } catch (err) {
        res.status(500).json({
            error: "Failed to fetch commentary",
            details: JSON.stringify(err.message),
        });
    }
});

commentaryRouter.post("/", async (req, res) => {
    const matchParams = matchIdParamSchema.safeParse(req.params);
    if (!matchParams.success) {
        return res.status(400).json({
            error: "Invalid match ID",
            details: matchParams.error.issues,
        });
    }

    const commentaryData = createCommentarySchema.safeParse(req.body);
    if (!commentaryData.success) {
        return res.status(400).json({
            error: "Invalid payload",
            details: commentaryData.error.issues,
        });
    }

    try {
        const [result] = await db
            .insert(commentary)
            .values({
                matchId: matchParams.data.id,
                ...commentaryData.data,
            })
            .returning();

        if(res.app.locals.broadcastCommentary) {
            res.app.locals.broadcastCommentary(result.matchId, result);
        }

        res.status(201).json({ data: result });
    } catch (err) {
        res.status(500).json({
            error: "Failed to create commentary",
            details: JSON.stringify(err.message),
        });
    }
});