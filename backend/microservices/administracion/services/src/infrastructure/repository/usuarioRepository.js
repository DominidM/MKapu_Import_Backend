import pool from "../../../../../shared/database/config.js"; // Config compartida
import Usuario from "../../domain/entity/usuario.js";
import UsuarioMapper from "../../application/mapper/usuarioMapper.js";

const usuarioMapper = new UsuarioMapper();
class UsuarioRepository {
    
    async findByDni(dni) {
        try {
            const query = "SELECT * FROM usuarios_data WHERE dni = ?";
            const [rows] = await pool.query(query, [dni]);
            
            if (rows.length === 0) return null;
            return this._mapRowToEntity(rows[0]);
        } catch (error) {
            console.error("[UsuarioRepo] Error buscar por DNI:", error);
            throw new Error("Error de base de datos al buscar empleado.");
        }
    }

    async findAll() {
        try {
            const query = "SELECT * FROM usuarios_data ORDER BY apellidos ASC";
            const [rows] = await pool.query(query);
            return rows.map(row => usuarioMapper.mapRowToEntity(row));
        } catch (error) {
            console.error("[UsuarioRepo] Error listar:", error);
            throw new Error("Error al obtener la lista de empleados.");
        }
    }

    async save(usuarioEntity) {
        try {
            const query = `
                INSERT INTO usuarios_data (nombres, apellidos, dni, correo, telefono, direccion, id_cuenta_usuario, fecha_registro)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            const [result] = await pool.query(query, [
                usuarioEntity.nombres,
                usuarioEntity.apellidos,
                usuarioEntity.dni,
                usuarioEntity.correo,
                usuarioEntity.telefono,
                usuarioEntity.direccion,
                usuarioEntity.id_cuenta_usuario
            ]);
            return result.insertId;
        } catch (error) {
            console.error("[UsuarioRepo] Error guardar:", error);
            if (error.code === 'ER_DUP_ENTRY') throw new Error("Ya existe un empleado con ese DNI o Correo.");
            throw error;
        }
    }
}
export default new UsuarioRepository;