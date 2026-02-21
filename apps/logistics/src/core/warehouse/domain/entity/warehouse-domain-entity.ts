export class Warehouse {
  constructor(
    public id: number | null,
    public codigo: string,
    public nombre?: string | null,
    public departamento?: string | null,
    public provincia?: string | null,
    public ciudad?: string | null,
    public direccion?: string | null,
    public telefono?: string | null,
    public activo: boolean = true,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}

  validate(): void {
    // CODIGO — obligatorio, max 10, solo alfanumérico y mayúsculas
      if (!this.codigo || !this.codigo.trim()) {
        throw new Error('El código es requerido.');
      }
      if (this.codigo.length > 10) {
        throw new Error('El código no puede exceder 10 caracteres.');
      }
      // Permitir guiones además de letras mayúsculas y números:
      if (!/^[A-Z0-9-]+$/.test(this.codigo.trim())) {
        throw new Error('El código solo puede contener letras mayúsculas, números y guiones.');
      }
    // NOMBRE — opcional, max 50, solo letras y espacios
    if (this.nombre) {
      if (this.nombre.trim().length === 0) {
        throw new Error('El nombre no puede estar vacío si se proporciona.');
      }
      if (this.nombre.length > 50) {
        throw new Error('El nombre no puede exceder 50 caracteres.');
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(this.nombre.trim())) {
        throw new Error('El nombre solo puede contener letras.');
      }
    }

    // DEPARTAMENTO — opcional, max 50
    if (this.departamento) {
      if (this.departamento.trim().length === 0) {
        throw new Error('El departamento no puede estar vacío si se proporciona.');
      }
      if (this.departamento.length > 50) {
        throw new Error('El departamento no puede exceder 50 caracteres.');
      }
    }

    // PROVINCIA — opcional, max 50
    if (this.provincia) {
      if (this.provincia.trim().length === 0) {
        throw new Error('La provincia no puede estar vacía si se proporciona.');
      }
      if (this.provincia.length > 50) {
        throw new Error('La provincia no puede exceder 50 caracteres.');
      }
    }

    // CIUDAD — opcional, max 50
    if (this.ciudad) {
      if (this.ciudad.trim().length === 0) {
        throw new Error('La ciudad no puede estar vacía si se proporciona.');
      }
      if (this.ciudad.length > 50) {
        throw new Error('La ciudad no puede exceder 50 caracteres.');
      }
    }

    // DIRECCION — opcional, max 100
    if (this.direccion) {
      if (this.direccion.trim().length === 0) {
        throw new Error('La dirección no puede estar vacía si se proporciona.');
      }
      if (this.direccion.length > 100) {
        throw new Error('La dirección no puede exceder 100 caracteres.');
      }
    }

    // TELEFONO — opcional, exactamente 9 dígitos numéricos (según regla de negocio peruana)
    if (this.telefono) {
      const telefonoLimpio = this.telefono.trim();
      if (!/^\d{9}$/.test(telefonoLimpio)) {
        throw new Error('El teléfono debe tener exactamente 9 dígitos numéricos.');
      }
    }
  }
}