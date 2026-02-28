/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Inject, Injectable } from '@nestjs/common';
import { IInventoryCountQueryPort } from '../../../domain/ports/in/inventory-count-ports-in';
import { ListInventoryCountFilterDto } from '../../dto/in/list-inventory-count-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConteoInventarioOrmEntity } from '../../../infrastructure/entity/inventory-count-orm.entity';
import * as ExcelJS from 'exceljs';
import { IInventoryCountRepository } from '../../../domain/ports/out/inventory-count-port-out';

@Injectable()
export class InventoryCountQueryService implements IInventoryCountQueryPort {
  constructor(
    @InjectRepository(ConteoInventarioOrmEntity)
    private readonly conteoRepo: Repository<ConteoInventarioOrmEntity>,
    @Inject('IInventoryCountRepository')
    private readonly countRepository: IInventoryCountRepository,
  ) {}
  async obtenerConteoConDetalles(idConteo: number) {
    const data = await this.conteoRepo.findOne({
      where: { idConteo },
      relations: ['detalles'],
      order: {
        detalles: { idDetalle: 'ASC' },
      },
    });
    if (!data) {
      throw new Error(`No se encontró el conteo con ID ${idConteo}`);
    }

    return data;
  }
  async listarConteosPorSede(filtros: ListInventoryCountFilterDto) {
    const query = this.conteoRepo.createQueryBuilder('conteo');

    // 1. Cálculos de paginación
    const page = Number(filtros.page) || 1;
    const limit = Number(filtros.limit) || 10;
    const skip = (page - 1) * limit;

    // 2. Filtros base
    query.where('conteo.codSede = :idSede', { idSede: filtros.id_sede });

    if (filtros.fecha_inicio) {
      query.andWhere('DATE(conteo.fechaIni) >= :inicio', {
        inicio: filtros.fecha_inicio,
      });
    }
    if (filtros.fecha_fin) {
      query.andWhere('DATE(conteo.fechaIni) <= :fin', {
        fin: filtros.fecha_fin,
      });
    }

    query.orderBy('conteo.fechaIni', 'DESC');
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      status: 200,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async exportarConteoExcel(idConteo: number): Promise<ExcelJS.Buffer> {
    const conteo =
      await this.countRepository.obtenerConteoParaReporte(idConteo);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Conteo_${idConteo}`);

    worksheet.mergeCells('A1:F1');
    const titulo = worksheet.getCell('A1');
    titulo.value = `REPORTE DE CONTEO DE INVENTARIO - ${conteo.nomSede}`;
    titulo.font = { size: 14, bold: true };
    titulo.alignment = { horizontal: 'center' };

    worksheet.addRow(['ID Conteo:', conteo.idConteo, 'Estado:', conteo.estado]);
    worksheet.addRow([
      'Fecha Inicio:',
      conteo.fechaIni,
      'Fecha Fin:',
      conteo.fechaFin || 'En Proceso',
    ]);
    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      'CÓDIGO',
      'PRODUCTO',
      'SISTEMA',
      'FÍSICO',
      'DIFERENCIA',
      'ESTADO',
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF000000' },
      };
      cell.alignment = { horizontal: 'center' };
    });

    conteo.detalles.forEach((det) => {
      let textoEstado = '';
      if (det.estado === 2) {
        textoEstado = 'Contado';
      } else {
        textoEstado =
          conteo.estado === 'AJUSTADO' || conteo.estado === 'ANULADO'
            ? 'Sin Contar'
            : 'Pendiente';
      }
      const row = worksheet.addRow([
        det.codProd,
        det.descripcion,
        Number(det.stockSistema),
        det.stockConteo !== null ? Number(det.stockConteo) : '-',
        det.diferencia !== null ? Number(det.diferencia) : 0,
        textoEstado,
      ]);

      const diferencia = Number(det.diferencia);
      if (det.stockConteo !== null && diferencia !== 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: diferencia < 0 ? 'FFFFC7CE' : 'FFC6EFCE' },
          };
        });
      }
    });

    worksheet.columns.forEach((col) => {
      col.width = 15;
    });
    worksheet.getColumn(2).width = 40;

    return await workbook.xlsx.writeBuffer();
  }
  async exportarConteoPdf(idConteo: number): Promise<Buffer> {
    const conteo =
      await this.countRepository.obtenerConteoParaReporte(idConteo);
    const PDFDocument = require('pdfkit-table');

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .text(`REPORTE DE CONTEO DE INVENTARIO - ${conteo.nomSede}`, {
            align: 'center',
          });
        doc.moveDown(1);

        doc.fontSize(10);
        doc
          .font('Helvetica-Bold')
          .text(`ID Conteo: `, { continued: true })
          .font('Helvetica')
          .text(`${conteo.idConteo}`);
        doc
          .font('Helvetica-Bold')
          .text(`Estado: `, { continued: true })
          .font('Helvetica')
          .text(`${conteo.estado}`);
        doc
          .font('Helvetica-Bold')
          .text(`Fecha Inicio: `, { continued: true })
          .font('Helvetica')
          .text(`${conteo.fechaIni.toLocaleString()}`);
        doc
          .font('Helvetica-Bold')
          .text(`Fecha Fin: `, { continued: true })
          .font('Helvetica')
          .text(
            `${conteo.fechaFin ? conteo.fechaFin.toLocaleString() : 'En Proceso'}`,
          );
        doc.moveDown(2);
        const table = {
          headers: [
            { label: 'CÓDIGO', property: 'codigo', width: 60 },
            { label: 'PRODUCTO', property: 'producto', width: 220 },
            {
              label: 'SISTEMA',
              property: 'sistema',
              width: 60,
              align: 'center',
            },
            { label: 'FÍSICO', property: 'fisico', width: 60, align: 'center' },
            {
              label: 'DIFERENCIA',
              property: 'diferencia',
              width: 70,
              align: 'center',
            },
            { label: 'ESTADO', property: 'estado', width: 65, align: 'center' },
          ],
          datas: [] as any[],
        };
        conteo.detalles.forEach((det) => {
          // eslint-disable-next-line prefer-const
          let textoEstado =
            det.estado === 2
              ? 'Contado'
              : conteo.estado === 'AJUSTADO' || conteo.estado === 'ANULADO'
                ? 'Sin Contar'
                : 'Pendiente';
          const diff = Number(det.diferencia);

          table.datas.push({
            codigo: det.codProd,
            producto: det.descripcion,
            sistema: Number(det.stockSistema).toString(),
            fisico:
              det.stockConteo !== null
                ? Number(det.stockConteo).toString()
                : '-',
            diferencia: diff !== null ? diff.toString() : '0',
            estado: textoEstado,
          });
        });

        doc.table(table, {
          prepareHeader: () =>
            doc.font('Helvetica-Bold').fontSize(9).fillColor('black'),
          prepareRow: (row, indexColumn, indexRow, rectRow) => {
            doc.font('Helvetica').fontSize(9);

            const diff = Number(row.diferencia);
            if (row.fisico !== '-' && diff !== 0) {
              doc.fillColor(diff < 0 ? '#d32f2f' : '#28a745');
            } else {
              doc.fillColor('black');
            }
          },
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
