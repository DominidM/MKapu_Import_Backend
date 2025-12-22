import jwt from "jsonwebtoken";
import { comparePassword, hashPassword } from "../domain/utils/password.js";
import bcrypt from 'bcryptjs';

class AuthService {
  constructor(authRepository) {
    this.authRepository = authRepository;
  }
  async login(username, password) {
    const user = await this.authRepository.findUserByUsername(username);
    if (!user) {
      throw new Error("Credenciales invalidas");
    }
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error("CREDENTIALS_INVALID");
    }
    await this.authRepository.updateLastAccess(user.id);
    const token = jwt.sign({
        id: user.id,
        username: user.username,
        rol_id: user.rol_id,
        rol_nombre: user.rol_nombre,
      },
      process.env.JWT_SECRET || "mkapu_secret_2025",
      { expiresIn: "24h" }
    );
    return {
      token,
      user: {
        id: user.id,
        nombre_completo: user.nombre_completo,
        username: user.username,
        rol: user.rol_nombre,
      },
    };
  }
  async register(userData) {
    const existingUser = await this.authRepository.findUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("El nombre de usuario ya existe");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    const newUser = await this.authRepository.createUser({
      ...userData,
      password: hashedPassword,
    });
    return { newUser, message: "Usuario registrado exitosamente" };
  }
}
export default AuthService;