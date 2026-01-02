import EmpleadoService from "../../application/service/empleadoService";
import usuarioRepository from "../repository/usuarioRepository.js";

const empleadoService = new EmpleadoService(usuarioRepository);
export const crearEmpleado = async (req, res) => {
  try {
    const { personal, cuenta } = req.body;

    if (!personal || !cuenta) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos personales o de cuenta.",
      });
    }

    const result = await employeeService.registrarEmpleado(personal, cuenta);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    const status = error.message.includes("ya existe") ? 409 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};
export const listarEmpleados = async (req, res) => {
  try {
    const empleados = await employeeService.listarEmpleados();
    res.json({ success: true, data: empleados });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
