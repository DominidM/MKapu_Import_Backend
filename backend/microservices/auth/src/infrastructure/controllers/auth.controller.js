import { comparePassword, hashPassword } from "../../domain/utils/password.js";
import AuthService from "../../application/AuthService.js";
import AuthRepository from "../repository/authRepository.js";

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
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
    const { id } = req.user;
    const data = await authRepository.getProfileData(id);
    if (data.length === 0) {
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
    const { id } = req.body
    const data = getPasswordByUser (id);
    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }
    const isValid = await comparePassword(current_password, users[0].password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "La contraseña actual es incorrecta",
      });
    }
    const hashedPassword = await hashPassword(new_password);
    await authRepository.updatePassword(hashedPassword, id);
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
export const register = async (req, res) => {
  try {
    const { nombre_completo, email, password, rol_id, username } = req.body;
    const createdUser = await authService.register({ 
        nombre_completo, 
        email, 
        password, 
        rol_id, 
        username 
    });
    res.status(201).json({ success: true, createdUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};