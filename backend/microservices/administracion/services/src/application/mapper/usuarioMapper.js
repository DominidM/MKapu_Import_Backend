class UsuarioMapper {
  mapRowToEntity(row) {
    return new Usuario({
      id_usuario: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      dni: row.dni,
      correo: row.correo,
      telefono: row.telefono,
      direccion: row.direccion,
      fecha_registro: row.fecha_registro,
      id_cuenta_usuario: row.id_cuenta_usuario,
    });
  }
}
export default UsuarioMapper;