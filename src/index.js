import express from "express";
import { createServer } from "http"
import { matchesRouter } from "./routes/matches.js";
import { attachWebSocketServer } from "./ws/server.js";

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
const server = createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello! Welcome to the Sportz server.");
});

app.use("/matches", matchesRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated; // Make it available in routes via req.app.locals 

server.listen(PORT, HOST, () => {
    const baseUrl = HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running on ${baseUrl}`);
    console.log(`WebSocket Server is running on ${baseUrl.replace("http", "ws")}/ws`);
});
// ...existing code...
