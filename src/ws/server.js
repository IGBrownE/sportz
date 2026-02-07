import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";
import { ERRORS } from "../constants.js";

function sendJJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    for (let i = 0; i < wss.clients.length; i++) {
        const client = wss.clients[i];

        if (client.readyState !== WebSocket.OPEN) continue;

        client.send(JSON.stringify(payload));
    }
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024,
    });

    wss.on("connection", async (socket, req) => {
        if (wsArcjet) {
            try {
                const decision = await wsArcjet.protect(req);

                if (decision.isDenied()) {
                    const { code, text } = decision.reason.isRateLimit() ? ERRORS.RATE_LIMIT : ERRORS.ACCESS_DENIED;
                    socket.close(code, text);
                    return;
                }
            } catch (err) {
                console.error('WS connection error', err);
                socket.close(ERRORS.SECURITY_ERROR.code, ERRORS.SECURITY_ERROR.text);
                return;
            }
        }

        socket.isAlive = true;
        socket.on("pong", () => { socket.isAlive = true; });

        const interval = setInterval(() => {

            wss.clients.forEach((ws) => {
                if (!ws.isAlive) return ws.terminate();

                ws.isAlive = false;
                ws.ping();
            });

        }, 30000);

        wss.on("close", () => clearInterval(interval));

        sendJJson(socket, { type: "welcome", message: "Connected to WebSocket server", });

        socket.on("error", (err) => console.error("WebSocket error:", err));

    });

    function broadcastMatchCreated(match) {
        broadcast(wss, { type: "matchCreated", data: match });
    }

    return { broadcastMatchCreated };
}
