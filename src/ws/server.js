import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";
import { ERRORS } from "../constants.js";

const matchSubscribers = new Map();

function subscribe(matchId, socket) {
    if (!matchSubscribers.has(matchId)) {
        matchSubscribers.set(matchId, new Set());
    }
    matchSubscribers.get(matchId).add(socket);
}

function unsubscribe(matchId, socket) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers) return;

    subscribers.delete(socket);

    if (subscribers.size === 0) {
        matchSubscribers.delete(matchId);
    }
}

function cleanupSubscriptions(socket) {
    for (const matchId of socket.subscriptions) {
        unsubscribe(matchId, socket);
    }
}

function sendJJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss, payload) {
    for (const client of wss.clients) {
        if (client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

function broadcastToMatch(matchId, payload) {
    const subscribers = matchSubscribers.get(matchId);
    if (!subscribers || subscribers.size === 0) return;

    const message = JSON.stringify(payload);

    for (const client of subscribers) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

function handleMessage(socket, data) {
    let message;
    try {
        message = JSON.parse(data.toString());
    } catch (err) {
        sendJJson(socket, { type: "error", message: "Invalid JSON" });
        return;
    }

    if (message?.type === "subscribe" && Number.isInteger(message.matchId)) {
        subscribe(message.matchId, socket);
        socket.subscriptions.add(message.matchId);
        sendJJson(socket, { type: "subscribed", matchId: message.matchId });
        return;
    }
    if (message?.type === "unsubscribe" && Number.isInteger(message.matchId)) {
        unsubscribe(message.matchId, socket);
        socket.subscriptions.delete(message.matchId);
        sendJJson(socket, { type: "unsubscribed", matchId: message.matchId });
        return;
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024,
    });

    server.on("upgrade", async (req, socket, head) => {
        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);

                if (decision.isDenied()) {
                    const { code, text } = decision.reason.isRateLimit() ? ERRORS.RATE_LIMIT : ERRORS.ACCESS_DENIED;
                    socket.write(`HTTP/1.1 ${code} ${text}\r\n\r\n`);
                    socket.destroy();
                    return;
                }
            } catch (err) {
                console.error('WS connection error', err);
                socket.write(`HTTP/1.1 ${ERRORS.SECURITY_ERROR.code} ${ERRORS.SECURITY_ERROR.text}\r\n\r\n`);
                socket.destroy();
                return;
            }
        }
    });

    wss.on("connection", async (socket, req) => {
        socket.isAlive = true;
        socket.on("pong", () => { socket.isAlive = true; });

        socket.subscriptions = new Set();

        sendJJson(socket, { type: "welcome", message: "Connected to WebSocket server", });

        socket.on("message", (data) => handleMessage(socket, data));

        socket.on("error", () => { socket.terminate(); });

        socket.on("close", () => { cleanupSubscriptions(socket); });

        socket.on("error", (err) => console.error("WebSocket error:", err));

    });
    const interval = setInterval(() => {

        wss.clients.forEach((ws) => {
            if (!ws.isAlive) return ws.terminate();

            ws.isAlive = false;
            ws.ping();
        });

    }, 30000);

    wss.on("close", () => clearInterval(interval));

    function broadcastMatchCreated(match) {
        broadcastToAll(wss, { type: "matchCreated", data: match });
    }

    function broadcastCommentary(matchId, commentary) {
        broadcastToMatch(matchId, { type: "commentary", data: commentary });
    }

    return { broadcastMatchCreated, broadcastCommentary };
}
