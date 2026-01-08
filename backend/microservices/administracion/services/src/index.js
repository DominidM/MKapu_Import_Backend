import express from "express";
import cors from "cors";
import usuarioRoutes from "./infrastructure/routes/usuarios.routes.js";
import pool from "../../../../database/config/database.js";
import EmpleadoService from "./application/service/empleadoService.js";
import usuarioRepository from "./infrastructure/repository/usuarioRepository.js";
import { SocketServer } from "../../../../shared/infrastructure/web-socket/SocketServer.js";
import { createServer } from "http";
import { handleSocketConnection } from "./infrastructure/controllers/ws/usuario.socket.controller.js";
const app = express();
const PORT = process.env.ADMIN_PORT || 3002;
const httpServer = createServer(app);
const socketServer = new SocketServer(httpServer);

const empleadoService = new EmpleadoService(usuarioRepository);

app.use(cors());
app.use(express.json());

app.use("/users", usuarioRoutes);

socketServer.wss.on("connection", (ws) => {
  console.log("[WS] Cliente conectado");
  handleSocketConnection(ws);
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "OK", service: "Administration" });
  } catch (error) {
    res.status(500).json({ status: "Error", db: error.message });
  }
});

httpServer.listen(PORT, () => {
  console.log(`[Admin Service] Ejecutándose en puerto ${PORT}`);
});
