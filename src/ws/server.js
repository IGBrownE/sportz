import { WebSocket, WebSocketServer } from "ws";

function sendJJson(socket, payload) {
    if (socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) return;

        client.send(JSON.stringify(payload));
    });
}

export function attachWebSocketServer(server) {
    const wss = new WebSocketServer({
        server,
        path: "/ws",
        maxPayload: 1024 * 1024, // 1MB
    });
    wss.on("connection", (socket) => {
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
