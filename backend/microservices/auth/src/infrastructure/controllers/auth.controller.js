import pool from "../../../../../database/config/database.js";
import { comparePassword, hashPassword } from "../../domain/utils/password.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }
  try {
    const data = await authService.login(username, password);

    return res.json({
      success: true,
      message: "Login exitoso",
      ...data,
    });
  } catch (error) {
    if (error.message === "CREDENTIALS_INVALID") {
      return res
        .status(401)
        .json({ success: false, message: "Usuario o contraseña incorrectos" });
    }
    res.status(500).json({ success: false, message: "Error interno" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.nombre_completo, u.dni, u.email, u.telefono, 
              u.direccion, u.username, u.ultimo_acceso, r.nombre as rol
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?  AND u.activo = 1`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// CAMBIAR CONTRASEÑA
export const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({
      success: false,
      message: "Se requiere contraseña actual y nueva contraseña",
    });
  }

  if (new_password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "La nueva contraseña debe tener al menos 6 caracteres",
    });
  }

  try {
    // Obtener contraseña actual
    const [users] = await pool.query(
      "SELECT password FROM usuarios WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Verificar contraseña actual
    const isValid = await comparePassword(current_password, users[0].password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "La contraseña actual es incorrecta",
      });
    }

    // Encriptar nueva contraseña
    const hashedPassword = await hashPassword(new_password);

    // Actualizar contraseña
    await pool.query("UPDATE usuarios SET password = ? WHERE id = ? ", [
      hashedPassword,
      req.user.id,
    ]);

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
