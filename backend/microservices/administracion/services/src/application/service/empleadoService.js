class EmpleadoService {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }
    async registrarEmpleado(datosEmpleado, datosCuenta) {
        const dniExistente = await this.usuarioRepository.findByDni(datosEmpleado.dni);
        if (dniExistente) throw new Error("El DNI ya está registrado en el sistema.");
        const hashedPassword = await hashPassword(datosCuenta.password);
        
        let idCuentaCreada;
        try {
            idCuentaCreada = await authRepository.createUser({
                username: datosCuenta.username,
                password: hashedPassword,
                rol_id: datosCuenta.rolId,
            });
        } catch (error) {
            throw new Error("Error al crear la cuenta de usuario: " + error.message);
        }

        const nuevoEmpleado = new Usuario({
            nombres: datosEmpleado.nombres,
            apellidos: datosEmpleado.apellidos,
            dni: datosEmpleado.dni,
            correo: datosEmpleado.correo,
            telefono: datosEmpleado.telefono,
            direccion: datosEmpleado.direccion,

            id_cuenta_usuario: idCuentaCreada 
        });

        const idEmpleado = await this.usuarioRepository.save(nuevoEmpleado);

        return {
            id_empleado: idEmpleado,
            id_cuenta: idCuentaCreada,
            mensaje: "Empleado y cuenta creados exitosamente."
        };
    }

    async listarEmpleados() {
        const empleados = await this.usuarioRepository.findAll();
        return empleados.map(emp => emp.toDTO());
    }
}
export default EmpleadoService;