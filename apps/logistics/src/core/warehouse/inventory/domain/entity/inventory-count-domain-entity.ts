/* eslint-disable @typescript-eslint/no-unsafe-return */
export enum ConteoEstado {
  PENDIENTE = 'PENDIENTE',
  CONTADO = 'CONTADO',
  AJUSTADO = 'AJUSTADO',
  ANULADO = 'ANULADO',
}

export class InventoryCountDetailDomainEntity {
  constructor(
    public idDetalle: number,
    public idProducto: number,
    public idStock: number,
    public idAlmacen: number,
    public idSedeRef: number,
    public stockSistema: number,
    public stockConteo: number | null,
    public diferencia: number,
    public estado: number,
  ) {}

  registrarConteoFisico(cantidadFisica: number): void {
    this.stockConteo = cantidadFisica;
    this.diferencia = this.stockConteo - this.stockSistema;
    this.estado = 2; // 2 = Contado
  }

  tieneDiferencia(): boolean {
    return this.diferencia !== 0;
  }
}

export class InventoryCountDomainEntity {
  constructor(
    public idConteo: number,
    public codSede: string,
    public nomSede: string,
    public usuarioCreacionRef: number,
    public estado: ConteoEstado,
    public totalItems: number,
    public totalDiferencias: number,
    public fechaIni: Date,
    public fechaFin: Date | null,
    public detalles: InventoryCountDetailDomainEntity[],
  ) {}

  // Lógica de negocio: El Conteo sabe cómo ajustarse a sí mismo
  finalizarAjuste(
    datosIngresados: { id_detalle: number; stock_conteo: number }[],
  ) {
    if (this.estado === ConteoEstado.AJUSTADO) {
      throw new Error(
        'Este conteo ya fue ajustado anteriormente y no puede modificarse.',
      );
    }
    if (!datosIngresados || datosIngresados.length === 0) {
      throw new Error('Debe enviar el arreglo de productos contados.');
    }

    const ajustesParaKardex = [];
    const conteoMap = new Map(
      datosIngresados.map((item) => [item.id_detalle, item.stock_conteo]),
    );

    for (const detalle of this.detalles) {
      const cantidadFisica = conteoMap.get(detalle.idDetalle);

      if (cantidadFisica !== undefined) {
        detalle.registrarConteoFisico(cantidadFisica);

        if (detalle.tieneDiferencia()) {
          ajustesParaKardex.push({
            productId: detalle.idProducto,
            warehouseId: detalle.idAlmacen,
            sedeId: detalle.idSedeRef,
            difference: detalle.diferencia,
          });
        }
      }
    }

    this.estado = ConteoEstado.AJUSTADO;
    this.fechaFin = new Date();

    return ajustesParaKardex;
  }

  anularConteo(): void {
    if (this.estado === ConteoEstado.AJUSTADO) {
      throw new Error('No se puede anular un conteo que ya fue consolidado.');
    }
    this.estado = ConteoEstado.ANULADO;
    this.fechaFin = new Date();
  }
}
