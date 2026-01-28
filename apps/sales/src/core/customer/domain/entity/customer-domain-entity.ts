/* sales/src/core/customer/domain/entity/customer-domain-entity.ts */


export interface CustomerProps {
  id_cliente?: string;
  tipo_doc?: 'DNI' | 'RUC' | 'PASAPORTE' | 'CE';
  num_doc?: string;
  razon_social?: string;
  nombres?: string;
  direccion?: string;
  email?: string;
  telefono?: string;
  estado?: boolean;
}

export class Customer {
  private constructor(private readonly props: CustomerProps) {}

  static create(props: CustomerProps): Customer {
    return new Customer({
      ...props,
      estado: props.estado ?? true,
    });
  }

  // Getters
  get id_cliente() {
    return this.props.id_cliente;
  }

  get tipo_doc() {
    return this.props.tipo_doc;
  }

  get num_doc() {
    return this.props.num_doc;
  }

  get razon_social() {
    return this.props.razon_social;
  }

  get nombres() {
    return this.props.nombres;
  }

  get direccion() {
    return this.props.direccion;
  }

  get email() {
    return this.props.email;
  }

  get telefono() {
    return this.props.telefono;
  }

  get estado() {
    return this.props.estado;
  }

  // Métodos de negocio
  isActive(): boolean {
    return this.props.estado === true;
  }

  isCompany(): boolean {
    return this.props.tipo_doc === 'RUC';
  }

  isPerson(): boolean {
    return this.props.tipo_doc === 'DNI' || 
           this.props.tipo_doc === 'PASAPORTE' || 
           this.props.tipo_doc === 'CE';
  }

  getDisplayName(): string {
    if (this.isCompany()) {
      return this.props.razon_social || 'Sin razón social';
    }
    return this.props.nombres || 'Sin nombre';
  }

  hasCompleteInfo(): boolean {
    return !!(
      this.props.num_doc &&
      (this.isCompany() ? this.props.razon_social : this.props.nombres) &&
      this.props.direccion &&
      this.props.telefono
    );
  }

  isValidDocument(): boolean {
    if (!this.props.num_doc || !this.props.tipo_doc) return false;

    switch (this.props.tipo_doc) {
      case 'DNI':
        return this.props.num_doc.length === 8 && /^\d+$/.test(this.props.num_doc);
      case 'RUC':
        return this.props.num_doc.length === 11 && /^\d+$/.test(this.props.num_doc);
      case 'PASAPORTE':
        return this.props.num_doc.length >= 6 && this.props.num_doc.length <= 12;
      case 'CE':
        return this.props.num_doc.length === 9 && /^\d+$/.test(this.props.num_doc);
      default:
        return false;
    }
  }

  getInvoiceType(): 'BOLETA' | 'FACTURA' {
    return this.isCompany() ? 'FACTURA' : 'BOLETA';
  }
}