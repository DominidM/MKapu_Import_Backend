import pool from "../../../../../database/config/database.js";
import CuentaUsuario from "../../domain/entity/cuenta_usuario.js";
class AuthRepository {
  async findUserByUsername(username) {
    const query = `
    SELECT u.id, u.username, u.password, u.email, u.activo, u.rol_id, r.nombre as rol_nombre
    FROM usuarios u
    INNER JOIN roles r ON u.rol_id = r.id
    WHERE u.username = ?
  `;
    const [rows] = await pool.query(query, [username]);
    if (rows.length === 0) return null;

    const row = rows[0];

    return new CuentaUsuario({
      id: row.id,
      nombre_usuario: row.username,
      contrasenia: row.password,
      email: row.email,
      estado: row.activo,
      id_rol: row.rol_id,
      rol_nombre: row.rol_nombre,
    });
  }

  async createAccount({
    id_cuenta,
    username,
    password,
    email,
    id_usuario,
    id_rol,
    id_sede,
  }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `
        INSERT INTO cuenta_usuario (id_cuenta, username, password, email_emp, id_usuario, id_sede, ultimo_acceso, estado) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), 'ACTIVO')
      `,
        [id_cuenta, username, password, email, id_usuario, id_sede || 1]
      );

      await connection.query(
        `
        INSERT INTO cuenta_rol (id_cuenta, id_rol) VALUES (?, ?)
      `,
        [id_cuenta, id_rol]
      );

      await connection.commit();
      return id_cuenta;
    } catch (error) {
      await connection.rollback();
      console.error("[AuthRepository] Error creando cuenta:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateLastAccess(userId) {
    try {
      await pool.query(
        "UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?",
        [userId]
      );
    } catch (error) {
      console.error(
        "[AuthRepository] Error actualizando último acceso:",
        error
      );
    }
  }

  async updatePassword(newPassword, id) {
    try {
      const [result] = await pool.query(
        "UPDATE usuarios SET password = ? WHERE id = ?",
        [newPassword, id]
      );

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
      const [users] = await pool.query(
        "SELECT password FROM usuarios WHERE id = ?",
        [id]
      );
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error("[AuthRepository] Error en getPasswordByUser:", error);
      throw new Error("Error interno al validar credenciales.");
    }
  }
}

export default new AuthRepository();
