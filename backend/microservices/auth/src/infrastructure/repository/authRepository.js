import pool from "../../../../../database/config/database.js";
import CuentaUsuario from "../../domain/entity/cuenta_usuario.js";
class AuthRepository {
  async findUserByUsername(username) {
    try {
      
      const query = `
        SELECT u.id, u.username, u.password, u.email, u.activo, u.rol_id 
        FROM usuarios u 
        WHERE u.username = ?
      `;
      
      const [rows] = await pool.query(query, [username]);

      if (rows.length === 0) return null;

      const row = rows[0];

      return new CuentaUsuario({
        id_usuario: row.id,
        nombre_usuario: row.username,
        contrasenia: row.password,
        email: row.email,
        estado: row.activo,
        id_rol: row.rol_id,

        id_persona: null 
      });

    } catch (error) {
      console.error("[AuthRepository] Error en findUserByUsername:", error);
      throw new Error("Error de base de datos al buscar el usuario.");
    }
  }

  async createUser(userData) {
    try {
      const { nombre_completo, email, password, rol_id, username } = userData;

      const query = `
        INSERT INTO usuarios (nombre_completo, email, password, rol_id, username, activo) 
        VALUES (?, ?, ?, ?, ?, 1)
      `;

      const [result] = await pool.query(query, [
        nombre_completo, 
        email, 
        password,
        rol_id, 
        username
      ]);

      return result.insertId;

    } catch (error) {
      console.error("[AuthRepository] Error en createUser:", error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error("El nombre de usuario o email ya existe.");
      }
      throw new Error("No se pudo crear el usuario.");
    }
  }

  async updateLastAccess(userId) {
    try {
      await pool.query("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?", [userId]);
    } catch (error) {
      console.error("[AuthRepository] Error actualizando último acceso:", error);
    }
  }

  async updatePassword(newPassword, id) {
    try {
      const [result] = await pool.query("UPDATE usuarios SET password = ? WHERE id = ?", [
        newPassword,
        id,
      ]);

      if (result.affectedRows === 0) {
        throw new Error("El usuario no existe o no se pudo actualizar.");
      }
    } catch (error) {
      console.error("[AuthRepository] Error en updatePassword:", error);
      throw new Error("Error al actualizar la contraseña.");
    }
  }

  async getProfileData(id) {
    try {
      const query = `
        SELECT u.id, u.nombre_completo, u.dni, u.email, u.telefono, 
               u.direccion, u.username, u.ultimo_acceso, r.nombre as rol
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.id
        WHERE u.id = ? AND u.activo = 1
      `;
      
      const [users] = await pool.query(query, [id]);
      
      return users.length > 0 ? users[0] : null; 
      
    } catch (error) {
      console.error("[AuthRepository] Error en getProfileData:", error);
      throw new Error("Error al obtener los datos del perfil.");
    }
  }

  async getPasswordByUser(id) {
    try {
      const [users] = await pool.query("SELECT password FROM usuarios WHERE id = ?", [id]);
      return users.length > 0 ? users[0] : null; 
    } catch (error) {
      console.error("[AuthRepository] Error en getPasswordByUser:", error);
      throw new Error("Error interno al validar credenciales.");
    }
  }
}

export default new AuthRepository();