import { Router } from "express";
import { crearEmpleado, listarEmpleados } from "../controllers/rest/usuario.controller.js";
import { handleSocketConnection } from "../controllers/ws/usuario.socket.controller.js";
const router = Router();

router.post('/', crearEmpleado);
// router.get('/', listarEmpleados);

export default router;