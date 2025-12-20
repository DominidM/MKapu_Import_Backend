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
    } catch (error) {

    }
  }
 async updateLastAccess(userId) {
    await pool.query(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?',
      [userId]
    );
  }
}
module.exports = AuthRepository;