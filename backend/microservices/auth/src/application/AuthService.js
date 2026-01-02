import jwt from "jsonwebtoken";
import { comparePassword, hashPassword } from "../domain/utils/password.js";

class AuthService {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }
  async login(username, password) {
    const cuentaUsuario = await this.authRepository.findUserByUsername(username);
    if (!cuentaUsuario) {
      throw new Error("Credenciales inválidas");
    }
    if (!cuentaUsuario.estaActiva()) {
      throw new Error("La cuenta está desactivada o bloqueada");
    }

    const isValidPassword = await comparePassword(password, cuentaUsuario.contrasenia);

    if (!isValidPassword) {
      throw new Error("Credenciales inválidas");
    }

    await this.authRepository.updateLastAccess(cuentaUsuario.id_usuario);

    const userPayload = cuentaUsuario.toPublicDTO();

    const token = jwt.sign(
      userPayload,
      process.env.JWT_SECRET || "mkapu_secret_2025",
      { expiresIn: "24h" }
    );

    return {
      token,
      user: userPayload,
    };
  }

  async register(userData) {
    const existingUser = await this.authRepository.findUserByUsername(userData.username);
    
    if (existingUser) {
      throw new Error("El nombre de usuario ya existe");
    }

    const hashedPassword = await hashPassword(userData.password);

    const newUserId = await this.authRepository.createUser({
      ...userData,
      password: hashedPassword,
    });

    return { 
      id: newUserId, 
      message: "Usuario registrado exitosamente" 
    };
  }
}

export default AuthService;