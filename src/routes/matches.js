import { Router } from "express";
import {
    createMatchSchema,
    listMatchesQuerySchema,
} from "../validation/matches.js";
import { matches } from "../db/schema.js";
import { db } from "../db/db.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";

export const matchesRouter = Router();

const MAX_LIMIT = 100;

matchesRouter.get("/", async (req, res) => {
    const matchData = listMatchesQuerySchema.safeParse(req.query);
    if (!matchData.success) {
        return res.status(400).json({
            error: "Invalid query",
            details: matchData.error.issues,
        });
    }
    const limit = Math.min(matchData.data.limit || 20, MAX_LIMIT); // Cap at 100
    try {
        const data = await db
            .select()
            .from(matches)
            .orderBy(desc(matches.createdAt))
            .limit(limit);
        res.status(200).json({ data });
    } catch (err) {
        res.status(500).json({
            error: "Failed to fetch matches",
            details: JSON.stringify(err.message),
        });
    }
});

matchesRouter.post("/", async (req, res) => {
    const matchData = createMatchSchema.safeParse(req.body);

    if (!matchData.success) {
        return res.status(400).json({
            error: "Invalid payload",
            details: matchData.error.issues,
        });
    }
    const {
        data: { startTime, endTime, homeScore, awayScore },
    } = matchData;
    try {
        const [event] = await db
            .insert(matches)
            .values({
                ...matchData.data,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                homeScore: homeScore ?? 0,
                awayScore: awayScore ?? 0,
                score: getMatchStatus(startTime, endTime),
            })
            .returning();
        res.status(201).json({ message: "Match created", data: event });
    } catch (err) {
        res.status(500).json({
            error: "Failed to create match",
            details: JSON.stringify(err.message),
        });
    }
});
