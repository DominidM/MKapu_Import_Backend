import EmpleadoService from "../../../application/service/empleadoService.js";
import usuarioRepository from "../../repository/usuarioRepository.js";

const empleadoService = new EmpleadoService(usuarioRepository);
export const handleSocketConnection = (ws) => {
    ws.on("message", async (data) => {
        try {
            const message = JSON.parse(data);
            if (message.action === 'LISTAR_EMPLEADOS') {
                const empleados = await empleadoService.listarEmpleados();
                ws.send(JSON.stringify({
                    event: 'LISTA_EMPLEADOS',
                    payload: empleados
                }));
            }
        } catch (error) {
            console.error("Error en mensaje WS:", error.message);
        }
    });
}