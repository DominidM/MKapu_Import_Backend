import { Router } from "express";
import { crearEmpleado, listarEmpleados } from "../controller/usuario.controller.js";
const router = Router();

router.post('/', crearEmpleado);
router.get('/', listarEmpleados);

export default router;