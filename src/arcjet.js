import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";
import { ERRORS } from "./constants.js";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_ENV === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey) throw new Error("ARCJET_KEY is missing");

export const httpArcjet = arcjetKey
    ? arcjet({
        key: arcjetKey,
        rules: [
            shield({
                mode: arcjetMode,
            }),
            // detectBot({ mode: arcjetMode, allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: "10s", max: 50 }),
        ],
    }) : null;

export const wsArcjet = arcjetKey
    ? arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            // detectBot({ mode: arcjetMode, allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: "2s", max: 5 }),
        ],
    }) : null;


export function securityMiddlware() {
    return async (req, res, next) => {
        if (!httpArcjet) return next();

        try {
            const decision = await httpArcjet.protect(req);
            if (decision.isDenied()) {
                if (decision.reason.isRateLimit()) {
                    return res.status(ERRORS.TOO_MANY.code).json({ error: ERRORS.TOO_MANY.text });
                }
                return res.status(ERRORS.FORBIDDEN.code).json({ error: ERRORS.FORBIDDEN.text });
            }
        } catch (err) {
            console.error("Arcjet middleware error", err);
            return res.status(ERRORS.UNAVAILABLE.code).json({ error: ERRORS.UNAVAILABLE.text });
        }
        next();
    }
}