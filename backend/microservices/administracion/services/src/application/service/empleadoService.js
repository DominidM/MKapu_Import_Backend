class EmpleadoService {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }
    async registrarEmpleado(datosEmpleado, datosCuenta) {
        // 1. Crear el Usuario (Persona) PRIMERO para obtener su ID
        const uuidUsuario = uuidv4();
        const uuidCuenta = uuidv4();

        const nuevoUsuario = new Usuario({
            id_usuario: uuidUsuario,
            nombres: datosEmpleado.nombres,
            apellidos: datosEmpleado.apellidos,
            dni: datosEmpleado.dni,
            correo: datosEmpleado.correo,
            telefono: datosEmpleado.telefono,
            direccion: datosEmpleado.direccion
        });

        const idUsuarioCreado = await this.usuarioRepository.save(nuevoUsuario);

        const hashedPassword = await hashPassword(datosCuenta.password);

        try {
            await authRepository.createAccount({
                id_cuenta: uuidCuenta,
                username: datosCuenta.username,
                password: hashedPassword,
                email: datosEmpleado.correo,
                id_usuario: idUsuarioCreado,
                id_rol: datosCuenta.rolId,
                id_sede: 1
            });
        } catch (error) {
            // TODO: Deberías borrar el usuario creado si falla la cuenta (Rollback manual)
            throw new Error("Error al crear credenciales: " + error.message);
        }

        return {
            mensaje: "Empleado registrado correctamente",
            id_usuario: idUsuarioCreado,
            id_cuenta: idCuentaUUID
        };
    }
    async listarEmpleados() {
        const empleados = await this.usuarioRepository.findAll();
        return empleados.map(emp => emp.toDTO());
    }
}
export default EmpleadoService;