import { WebSocketServer } from "ws";

export class SocketServer {
    constructor(server) {
        if (server || !SocketServer.instance) {
            this.wss = new WebSocketServer({ server });
            this.clients = new Set();
            this.init();
            SocketServer.instance = this;
        }
        return SocketServer.instance;
    }
    init(){
        this.wss.on("connection", (ws) => {
            this.clients.add(ws);
            console.log("Nueva conexión WebSocket establecida.");
            ws.on("close", () => {
                this.clients.delete(ws);
                console.log("Conexión WebSocket cerrada.");
            });
            ws.on("error", (message) => {
                console.error("Error en la conexión WebSocket:", message);
            });
        });
    }
    broadcast(event,payload) {
        const message = JSON.stringify({ event, payload });
        this.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                client.send(message);
            }
        });
    }
}