import pool from "../../../../../database/config/database.js";
class AuthRepository {
  async findUserByUsername(username) {
    try {
      const [rows] = await pool.query(
        "SELECT u.*, r.nombre as rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.username = ?",
        [username]
      );
      return rows.length > 0 ? rows[0] : null;
      // return new User({}) Aún no hay un dominio de usuario xd'nt
    } catch (error) {}
  }
  async updateLastAccess(userId) {
    await pool.query("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?", [
      userId,
    ]);
  }
  async getProfileData(id) {
    try {
      const [users] = await pool.query(
        `SELECT u.id, u.nombre_completo, u.dni, u.email, u.telefono, 
              u.direccion, u.username, u.ultimo_acceso, r.nombre as rol
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.id
       WHERE u.id = ?  AND u.activo = 1`,
        [id]
      );
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw new Error("Error al obtener los datos del perfil");
    }
  }
  async getPasswordByUser(id) {
    try {
      const [users] = await pool.query(
        "SELECT password FROM usuarios WHERE id = ?",
        [id]
      );
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw new Error("Error al obtener la contraseña del usuario");
    }
  }
  async updatePassword(newPassword, id) {
    try {
      await pool.query("UPDATE usuarios SET password = ? WHERE id = ? ", [
        newPassword,
        id,
      ]);
    } catch (error) {
      throw new Error("Error al actualizar la contraseña");
    }
  }
  async createUser(userData) {
    try {
      const { nombre_completo, email, password, rol_id, username } = userData;
      const [result] = await pool.query(
        "INSERT INTO usuarios (nombre_completo, email, password, rol_id, username) VALUES (?, ?, ?, ?, ?)",
        [nombre_completo, email, password, rol_id, username]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error en DB:", error);
      throw error;
    }
  }
}
export default AuthRepository;
