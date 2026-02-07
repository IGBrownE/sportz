import { WebSocket, WebSocketServer } from "ws";

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

    wss.on("connection", (socket) => {
        socket.isAlive = true;
        socket.on("pong", () => {
            socket.isAlive = true;
        });
        const interval = setInterval(() => {
            wss.clients.forEach((ws) => {
                if (!ws.isAlive) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);

        wss.on("close", () => {
            clearInterval(interval);
        });
        
        sendJJson(socket, {
            type: "welcome",
            message: "Connected to WebSocket server",
        });

        socket.on("error", (err) => {
            console.error("WebSocket error:", err);
        });

        socket.on("message", (message) => {
            console.log("Received message:", message.toString());
            // Handle incoming messages if needed
        });
        socket.on("close", () => {
            console.log("WebSocket client disconnected");
        });
    });
    function broadcastMatchCreated(match) {
        broadcast(wss, { type: "matchCreated", data: match });
    }
    return { broadcastMatchCreated };
}
