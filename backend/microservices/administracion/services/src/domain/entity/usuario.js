class Usuario {
    /**
     * @param {Object} props
     * @param {number} props.id_usuario
     * @param {string} props.nombres
     * @param {string} props.apellidos
     * @param {string} props.dni            
     * @param {string} props.correo       
     * @param {string} props.telefono
     * @param {string} props.direccion
     * @param {Date}   props.fecha_registro
     
     * @param {number|null} props.id_cuenta_usuario
     */
    constructor({ id_usuario, nombres, apellidos, dni, correo, telefono, direccion, fecha_registro, id_cuenta_usuario = null }) {
        this.id_usuario = id_usuario;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.dni = dni;
        this.correo = correo;
        this.telefono = telefono;
        this.direccion = direccion;
        this.fecha_registro = fecha_registro || new Date();
        this.id_cuenta_usuario = id_cuenta_usuario;
    }

    getNombreCompleto() {
        return `${this.nombres} ${this.apellidos}`.trim();
    }

    tieneDniValido() {
        return this.dni && /^\d{8}$/.test(this.dni);
    }

    toDTO() {
        return {
            id: this.id_usuario,
            nombreCompleto: this.getNombreCompleto(),
            nombres: this.nombres,
            apellidos: this.apellidos,
            dni: this.dni,
            contacto: {
                correo: this.correo,
                telefono: this.telefono,
                direccion: this.direccion
            },
            cuentaAsociada: this.id_cuenta_usuario
        };
    }
}

export default Usuario;