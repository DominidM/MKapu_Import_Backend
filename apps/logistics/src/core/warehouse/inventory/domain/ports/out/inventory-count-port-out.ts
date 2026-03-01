export interface IInventoryCountRepository {
  findHeaderById(idConteo: number);
  listAllHeadersBySede(codSede: string);
  findDetailById(idDetalle: number);
  obtenerStockParaSnapshot(
    idSede: string,
    idCategoria?: number,
    transactionManager?: any,
  ): Promise<any[]>;
  obtenerConteoParaReporte(idConteo: number): Promise<any>;
}
