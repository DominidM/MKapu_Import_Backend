import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import * as nodemailer from 'nodemailer';
import { AccountReceivable } from '../../domain/entity/account-receivable-domain-entity';
import {
  IAccountReceivableRepository,
  ACCOUNT_RECEIVABLE_REPOSITORY,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/ports/out/account-receivable-port-out';
import {
  IGetAccountReceivableByIdUseCase,
  IGetAllOpenAccountReceivablesUseCase,
} from '../../domain/ports/in/account-receivable-port-in';
import { AccountReceivableOrmEntity } from '../../infrastructure/entity/account-receivable-orm.entity';

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

@Injectable()
export class AccountReceivableQueryService
  implements IGetAccountReceivableByIdUseCase, IGetAllOpenAccountReceivablesUseCase
{
  constructor(
    @Inject(ACCOUNT_RECEIVABLE_REPOSITORY)
    private readonly repository: IAccountReceivableRepository,

    @InjectRepository(AccountReceivableOrmEntity)
    private readonly ormRepo: Repository<AccountReceivableOrmEntity>,
  ) {}

  async getById(id: number): Promise<AccountReceivable> {
    const account = await this.repository.findById(id);
    if (!account) throw new NotFoundException(`AccountReceivable #${id} not found`);
    return account;
  }

  async getAllOpen(pagination: PaginationOptions): Promise<PaginatedResult<AccountReceivable>> {
    return this.repository.findAllOpen(pagination);
  }

  // ── Cargar entidad completa con relaciones para PDF ───────────────
  private async loadFull(id: number): Promise<AccountReceivableOrmEntity> {
    const entity = await this.ormRepo.findOne({
      where: { id },
      relations: [
        'salesReceipt',
        'salesReceipt.cliente',
        'salesReceipt.tipoComprobante',
        'salesReceipt.moneda',
        'paymentType',
        'currency',
      ],
    });
    if (!entity) throw new NotFoundException(`Cuenta por cobrar #${id} no encontrada`);
    return entity;
  }

  // ── Construir buffer PDF ──────────────────────────────────────────
  private async buildPdfBuffer(id: number): Promise<{ buffer: Buffer; entity: AccountReceivableOrmEntity }> {
    const entity = await this.loadFull(id);
    const PDFDocument = require('pdfkit-table');
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', resolve);
      doc.on('error', reject);

      const cl     = entity.salesReceipt?.cliente;
      const comp   = entity.salesReceipt;
      const moneda = entity.currency?.codigo ?? entity.currencyCode ?? 'S/.';

      const nombreCliente = cl?.razon_social
        || `${cl?.nombres ?? ''} ${cl?.apellidos ?? ''}`.trim()
        || 'Cliente';

      const comprobante = comp
        ? `${comp.tipoComprobante?.descripcion ?? 'Comprobante'} ${comp.serie}-${String(comp.numero).padStart(8, '0')}`
        : `Comprobante #${entity.salesReceiptId}`;

      // ── Encabezado ────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(16)
        .text('CUENTA POR COBRAR', { align: 'center' });
      doc.font('Helvetica').fontSize(10)
        .text(`N° ${entity.id}`, { align: 'center' });
      doc.moveDown(0.8);

      // ── Datos del cliente ─────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(10).text('DATOS DEL CLIENTE');
      doc.font('Helvetica').fontSize(9);
      doc.text(`Nombre:      ${nombreCliente}`);
      if (cl?.valor_doc) doc.text(`Documento:   ${cl.valor_doc}`);
      if (cl?.email)     doc.text(`Email:       ${cl.email}`);
      if (cl?.telefono)  doc.text(`Teléfono:    ${cl.telefono}`);
      if (cl?.direccion) doc.text(`Dirección:   ${cl.direccion}`);
      doc.moveDown(0.6);

      // ── Comprobante de venta ──────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(10).text('COMPROBANTE DE VENTA');
      doc.font('Helvetica').fontSize(9);
      doc.text(`Referencia:      ${comprobante}`);
      doc.text(`Fecha Emisión:   ${new Date(entity.issueDate).toLocaleDateString('es-PE')}`);
      doc.text(`Fecha Venc.:     ${new Date(entity.dueDate).toLocaleDateString('es-PE')}`);
      doc.text(`Estado:          ${entity.status}`);
      if (entity.observation) doc.text(`Observación:     ${entity.observation}`);
      doc.moveDown(0.6);

      // ── Resumen económico ─────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(10).text('RESUMEN ECONÓMICO');
      doc.moveDown(0.3);

      const table = {
        headers: ['Concepto', 'Importe'],
        rows: [
          ['Monto Total',       `${moneda} ${Number(entity.totalAmount).toFixed(2)}`],
          ['Monto Pagado',      `${moneda} ${Number(entity.paidAmount).toFixed(2)}`],
          ['Saldo Pendiente',   `${moneda} ${Number(entity.pendingBalance ?? 0).toFixed(2)}`],
          ['Tipo de Pago',      entity.paymentType?.codSunat ?? '—'],
        ],
      };

      doc.table(table, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9),
        prepareRow:    () => doc.font('Helvetica').fontSize(9),
      }).then(() => {
        doc.moveDown(0.8);
        doc.font('Helvetica').fontSize(8)
          .fillColor('#888888')
          .text('Documento generado automáticamente por MKapu Import', { align: 'center' });
        doc.end();
      });
    });

    return { buffer: Buffer.concat(chunks), entity };
  }

  // ── Exportar PDF como descarga ────────────────────────────────────
  async exportPdf(id: number, res: Response): Promise<void> {
    const { buffer, entity } = await this.buildPdfBuffer(id);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename=CuentaPorCobrar_${entity.id}.pdf`,
      'Content-Length':      buffer.length,
    });
    res.end(buffer);
  }

  // ── Enviar PDF por email al cliente ───────────────────────────────
  async sendByEmail(id: number): Promise<{ message: string; sentTo: string }> {
    const { buffer, entity } = await this.buildPdfBuffer(id);

    const email = entity.salesReceipt?.cliente?.email;
    if (!email) throw new NotFoundException('El cliente no tiene email registrado');

    const cl = entity.salesReceipt?.cliente;
    const nombreCliente = cl?.razon_social
      || `${cl?.nombres ?? ''} ${cl?.apellidos ?? ''}`.trim()
      || 'Cliente';

    const moneda = entity.currency?.codigo ?? entity.currencyCode ?? 'S/.';
    const saldo  = Number(entity.pendingBalance ?? 0).toFixed(2);

    const transporter = nodemailer.createTransport({
      host:   process.env.MAIL_HOST ?? 'smtp.gmail.com',
      port:   Number(process.env.MAIL_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from:    `"MKapu Import" <${process.env.MAIL_USER}>`,
      to:      email,
      subject: `Cuenta por Cobrar N° ${entity.id} - MKapu Import`,
      html: `
        <p>Estimado/a <strong>${nombreCliente}</strong>,</p>
        <p>Le informamos que tiene una cuenta por cobrar pendiente con los siguientes datos:</p>
        <ul>
          <li><strong>N° Cuenta:</strong> ${entity.id}</li>
          <li><strong>Saldo Pendiente:</strong> ${moneda} ${saldo}</li>
          <li><strong>Fecha Vencimiento:</strong> ${new Date(entity.dueDate).toLocaleDateString('es-PE')}</li>
          <li><strong>Estado:</strong> ${entity.status}</li>
        </ul>
        <p>Adjuntamos el detalle completo en el PDF adjunto.</p>
        <br/>
        <p>Atentamente,<br/><strong>MKapu Import</strong></p>
      `,
      attachments: [{
        filename:    `CuentaPorCobrar_${entity.id}.pdf`,
        content:     buffer,
        contentType: 'application/pdf',
      }],
    });

    return { message: 'Email enviado correctamente', sentTo: email };
  }
}