/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RemissionPortOut } from '../../domain/ports/out/remission-port-out';
import { ListRemissionFilterDto } from '../dto/in/list-remission-filter.dto';
import {
  RemissionListResponseDto,
  RemissionResponseDto,
} from '../dto/out/remission-response.dto';
import {
  RemissionDetailResponseDto,
  RemissionItemResponseDto,
} from '../dto/out/remission-detail-response.dto';
import { RemissionSummaryResponseDto } from '../dto/out/remission-summary-response.dto';
import { RemissionQueryPortIn } from '../../domain/ports/in/remission-query-port-in';

@Injectable()
export class RemissionQueryService implements RemissionQueryPortIn {
  constructor(
    // Inyectamos la interfaz del repositorio, no la implementación directa
    @Inject('RemissionPortOut')
    private readonly remissionRepository: RemissionPortOut,
  ) {}

  async executeList(
    filter: ListRemissionFilterDto,
  ): Promise<RemissionListResponseDto> {
    const { data, total } = await this.remissionRepository.findAll(filter);

    const dtos = data.map((domain) => {
      const dto = new RemissionDetailResponseDto();
      dto.id_guia = domain.id_guia;
      dto.motivo_traslado = domain.motivo_traslado;
      ((dto.estado = domain.estado),
        (dto.fecha_emision = domain.fecha_emision),
        (dto.fecha_inicio = domain.fecha_inicio),
        (dto.motivo_traslado = domain.motivo_traslado),
        (dto.unidad_peso = domain.unidad_peso),
        (dto.peso_total = domain.peso_total),
        (dto.id_comprobante_ref = domain.id_comprobante_ref),
        (dto.tipo_guia = domain.tipo_guia),
        (dto.modalidad = domain.modalidad),
        (dto.cantidad = domain.cantidad));
      dto.items = domain.getDetalles().map((detalle) => {
        const itemDto = new RemissionItemResponseDto();
        itemDto.id_producto = detalle.id_producto;
        itemDto.cod_prod = detalle.cod_prod;
        itemDto.cantidad = detalle.cantidad;
        itemDto.peso_total = detalle.peso_total;
        itemDto.peso_unitario = detalle.peso_unitario;
        return itemDto;
      });
      return dto;
    });

    return {
      data: dtos,
      total,
    };
  }

  async executeFindById(id: string): Promise<RemissionResponseDto> {
    const domain = await this.remissionRepository.findById(id);

    if (!domain) {
      throw new NotFoundException(`Remission con ID ${id} no encontrada`);
    }

    const dto = new RemissionResponseDto();
    dto.id_guia = domain.id_guia;
    dto.serie = domain.serie;
    dto.numero = domain.numero;
    dto.estado = domain.estado;
    dto.tipo_guia = domain.tipo_guia;
    dto.fecha_emision = domain.fecha_emision;
    dto.fecha_inicio = domain.fecha_inicio;
    dto.motivo_traslado = domain.motivo_traslado;
    dto.peso_total = domain.peso_total;
    dto.unidad_peso = domain.unidad_peso;
    dto.cantidad = domain.cantidad;
    dto.items = domain.getDetalles().map((detalle) => {
      return {
        id_producto: detalle.id_producto,
        cod_prod: detalle.cod_prod,
        cantidad: detalle.cantidad,
        peso_total: detalle.peso_total,
        peso_unitario: detalle.peso_unitario,
      };
    });
    return dto;
  }
  async executeGetSummary(): Promise<RemissionSummaryResponseDto> {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    const summary = await this.remissionRepository.getSummaryInfo(
      firstDay,
      lastDay,
    );

    const dto = new RemissionSummaryResponseDto();
    dto.totalMes = summary.totalMes;
    dto.enTransito = summary.enTransito;
    dto.entregadas = summary.entregadas;
    dto.observadas = summary.observadas;

    return dto;
  }
}
