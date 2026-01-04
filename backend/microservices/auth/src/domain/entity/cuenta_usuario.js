class CuentaUsuario {
    /**
     * @param {Object} data
     * @param {number} data.id
     * @param {string} data.nombre_usuario
     * @param {string} data.contrasenia
     * @param {string} data.email
     * @param {boolean} data.estado
     * @param {number} data.id_rol
     * @param {number|null} data.id_persona
     */
    constructor({ id, nombre_usuario, contrasenia, email, estado = true, id_rol, id_persona = null }) {
        this.id = id;
        this.nombre_usuario = nombre_usuario;
        this.contrasenia = contrasenia;
        this.email = email;
        this.estado = estado;
        
        this.id_rol = id_rol;        
        this.id_persona = id_persona;
    }

    estaActiva() {
        return this.estado === true || this.estado === 1;
    }

    toPublicDTO() {
        return {
            id: this.id,
            nombre_usuario: this.nombre_usuario,
            email: this.email,
            estado: this.estado,
            id_rol: this.id_rol
        };
    }
}

module.exports = CuentaUsuario;