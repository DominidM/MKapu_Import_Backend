import { Router } from "express";
import { registrarEmpleado,listarEmpleados }from "../../application/service/empleadoService.js";

const router = Router();

router.post('/', registrarEmpleado);
router.get('/', listarEmpleados);

export default router;