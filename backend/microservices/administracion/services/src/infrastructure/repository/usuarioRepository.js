import pool from "../../../../../../database/config/database.js";
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
                INSERT INTO usuario (
                    id_usuario, usu_nom, ape_pat, ape_mat, dni, email, celular, direccion, fec_nac, activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `;
            const [ape_pat, ape_mat] = (usuarioEntity.apellidos || "").split(" ");
            await pool.query(query, [
                usuarioEntity.id_usuario,
                usuarioEntity.nombres,      
                ape_pat || "",              
                ape_mat || "",
                usuarioEntity.dni,
                usuarioEntity.correo,
                usuarioEntity.telefono,
                usuarioEntity.direccion,
                new Date()                  
            ]);
            
            return usuarioEntity.id_usuario;
        } catch (error) {
            console.error("[UsuarioRepo] Error guardar:", error);
            if (error.code === 'ER_DUP_ENTRY') throw new Error("DNI o Email ya registrado.");
            throw error;
        }
    }
}
export default new UsuarioRepository;