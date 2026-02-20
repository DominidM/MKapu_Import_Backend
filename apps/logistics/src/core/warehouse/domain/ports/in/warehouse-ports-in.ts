export interface IWarehouseCommandPort {
  create(dto: any): Promise<any>;
  update(id: number, dto: any): Promise<any>;
  remove(id: number): Promise<void>;
}

export interface IWarehouseQueryPort {
  list(): Promise<any[]>;
  getById(id: number): Promise<any | null>;
  findByCode(code: string): Promise<any | null>;
}