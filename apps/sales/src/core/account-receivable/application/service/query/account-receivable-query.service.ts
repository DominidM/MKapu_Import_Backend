/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import * as nodemailer from 'nodemailer';
import { AccountReceivable } from '../../../domain/entity/account-receivable-domain-entity';
import {
  IAccountReceivableRepository,
  ACCOUNT_RECEIVABLE_REPOSITORY,
  PaginationOptions,
  PaginatedResult,
} from '../../../domain/ports/out/account-receivable-port-out';
import {
  IGetAccountReceivableByIdUseCase,
  IGetAllOpenAccountReceivablesUseCase,
} from '../../../domain/ports/in/account-receivable-port-in';
import { AccountReceivableOrmEntity } from '../../../infrastructure/entity/account-receivable-orm.entity';
import { buildAccountReceivablePdf } from '../../../utils/account-receivable-pdf.util';
import { getWhatsAppStatus, sendWhatsApp } from 'libs/whatsapp.util';
import { buildAccountReceivableThermalPdf } from '../../../utils/account-receivable-thermal.util';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { EmpresaPdfData } from 'apps/sales/src/core/sales-receipt/utils/sales-receipt-pdf.util';
import { SalesReceiptMapper } from 'apps/sales/src/core/sales-receipt/application/mapper/sales-receipt.mapper';
import { AccountReceivablePaymentOrmEntity } from '../../../infrastructure/entity/account-receivable-payment-orm.entity';

@Injectable()
export class AccountReceivableQueryService
  implements
    IGetAccountReceivableByIdUseCase,
    IGetAllOpenAccountReceivablesUseCase
{
  constructor(
    @Inject(ACCOUNT_RECEIVABLE_REPOSITORY)
    private readonly repository: IAccountReceivableRepository,

    @InjectRepository(AccountReceivableOrmEntity)
    private readonly ormRepo: Repository<AccountReceivableOrmEntity>,
      
    @InjectRepository(AccountReceivablePaymentOrmEntity)
    private readonly paymentRepo: Repository<AccountReceivablePaymentOrmEntity>,

    @Inject('ADMIN_SERVICE') private readonly adminClient: ClientProxy,
  ) {}

  // ── Obtener empresa mapeada vía TCP ──────────────────────────────
  // Aplica SalesReceiptMapper.toEmpresaPdfData para garantizar logo_url correcto
  private async getEmpresaData(): Promise<EmpresaPdfData | null> {
    try {
      const response = await firstValueFrom(
        this.adminClient.send('get_empresa_activa', {}),
      );
      const raw = response?.data ? response.data : response;
      return raw ? SalesReceiptMapper.toEmpresaPdfData(raw) : null;
    } catch (error) {
      console.warn('⚠️ No se pudo obtener la empresa por TCP:', error.message);
      return null;
    }
  }

  async getById(id: number): Promise<AccountReceivable> {
    const account = await this.repository.findById(id);
    if (!account)
      throw new NotFoundException(`AccountReceivable #${id} not found`);
    return account;
  }

  async getAllOpen(
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<AccountReceivable>> {
    return this.repository.findAllOpen(pagination);
  }

  private async loadFull(id: number): Promise<AccountReceivableOrmEntity> {
    const entity = await this.ormRepo.findOne({
      where: { id },
      relations: [
        'salesReceipt',
        'salesReceipt.cliente',
        'salesReceipt.tipoComprobante',
        'salesReceipt.moneda',
        'salesReceipt.details',
        'paymentType',
        'currency',
      ],
    });
    if (!entity)
      throw new NotFoundException(`Cuenta por cobrar #${id} no encontrada`);
    return entity;
  }

  async exportPdf(id: number, res: Response): Promise<void> {
    const entity     = await this.loadFull(id);
    const empresa    = await this.getEmpresaData();
    const buffer     = await buildAccountReceivablePdf(entity, empresa);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename=CuentaPorCobrar_${entity.id}.pdf`,
      'Content-Length':      buffer.length,
    });
    res.end(buffer);
  }

  async sendByEmail(id: number): Promise<{ message: string; sentTo: string }> {
    const entity = await this.loadFull(id);

    const email = entity.salesReceipt?.cliente?.email;
    if (!email)
      throw new NotFoundException('El cliente no tiene email registrado');

    const cl = entity.salesReceipt?.cliente;
    const nombreCliente =
      cl?.razon_social ||
      `${cl?.nombres ?? ''} ${cl?.apellidos ?? ''}`.trim() ||
      'Cliente';

    const moneda = entity.currency?.codigo ?? entity.currencyCode ?? 'S/.';
    const saldo  = Number(entity.pendingBalance ?? 0).toFixed(2);

    const empresa = await this.getEmpresaData();
    const buffer  = await buildAccountReceivablePdf(entity, empresa);

    const transporter = nodemailer.createTransport({
      host:   process.env.MAIL_HOST ?? 'smtp.gmail.com',
      port:   Number(process.env.MAIL_PORT ?? 587),
      secure: false,
      auth:   { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });

    await transporter.sendMail({
      from:    `"MKapu Import" <${process.env.MAIL_USER}>`,
      to:      email,
      subject: `Cuenta por Cobrar N° ${entity.id} - MKapu Import`,
      html: `
        <p>Estimado/a <strong>${nombreCliente}</strong>,</p>
        <p>Tiene una cuenta por cobrar pendiente:</p>
        <ul>
          <li><strong>N° Cuenta:</strong> ${entity.id}</li>
          <li><strong>Saldo Pendiente:</strong> ${moneda} ${saldo}</li>
          <li><strong>Vencimiento:</strong> ${new Date(entity.dueDate).toLocaleDateString('es-PE')}</li>
          <li><strong>Estado:</strong> ${entity.status}</li>
        </ul>
        <p>Adjuntamos el detalle en PDF.</p>
        <br/><p>Atentamente,<br/><strong>MKapu Import</strong></p>
      `,
      attachments: [{
        filename:    `CuentaPorCobrar_${entity.id}.pdf`,
        content:     buffer,
        contentType: 'application/pdf',
      }],
    });

    return { message: 'Email enviado correctamente', sentTo: email };
  }

  async whatsAppStatus(): Promise<{ ready: boolean; qr: string | null }> {
    return getWhatsAppStatus();
  }

  async exportThermalVoucher(id: number, res: Response): Promise<void> {
    const entity  = await this.loadFull(id);
    const empresa = await this.getEmpresaData();

    const pagos = await this.paymentRepo.find({
      where: { accountReceivableId: id },
      order: { fecPago: 'ASC' },
      relations: ['paymentType'],
    });

    const buffer = await buildAccountReceivableThermalPdf(entity, empresa, pagos);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename=Ticket_CxC-${id}.pdf`,
      'Content-Length':      buffer.length,
    });
    res.end(buffer);
  }

  async exportPaymentVoucher(id: number, pagoId: number, res: Response): Promise<void> {
    const entity = await this.loadFull(id);
    const empresa = await this.getEmpresaData();

    const pagos = await this.paymentRepo.find({
      where: { accountReceivableId: id },
      order: { fecPago: 'ASC' },
      relations: ['paymentType'],
    });

    // filtra solo hasta ese pago para mostrar el historial acumulado hasta ese momento
    const idx = pagos.findIndex(p => p.id === pagoId);
    const pagosHasta = idx >= 0 ? pagos.slice(0, idx + 1) : pagos;

    const buffer = await buildAccountReceivableThermalPdf(entity, empresa, pagosHasta);

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename=Recibo_Pago-${pagoId}.pdf`,
      'Content-Length':      buffer.length,
    });
    res.end(buffer);
  }
  
  async sendByWhatsApp(id: number): Promise<{ message: string; sentTo: string }> {
    const entity = await this.loadFull(id);

    const telefono = entity.salesReceipt?.cliente?.telefono;
    if (!telefono)
      throw new NotFoundException('El cliente no tiene teléfono registrado');

    const cl = entity.salesReceipt?.cliente;
    const nombreCliente =
      cl?.razon_social ||
      `${cl?.nombres ?? ''} ${cl?.apellidos ?? ''}`.trim() ||
      'Cliente';

    const moneda = entity.currency?.codigo ?? entity.currencyCode ?? 'PEN';
    const saldo  = Number(entity.pendingBalance ?? 0).toFixed(2);
    const venc   = new Date(entity.dueDate).toLocaleDateString('es-PE');

    const empresa = await this.getEmpresaData();
    const buffer  = await buildAccountReceivablePdf(entity, empresa);

    const mensaje = [
      `📄 *Cuenta por Cobrar N° ${entity.id} - MKapu Import*`,
      ``,
      `Estimado/a *${nombreCliente}*,`,
      `Le recordamos que tiene una cuenta pendiente de pago:`,
      ``,
      `💰 *Saldo pendiente:* ${moneda} ${saldo}`,
      `📅 *Fecha de vencimiento:* ${venc}`,
      `📋 *Estado:* ${entity.status}`,
      ``,
      `Adjuntamos el detalle en PDF. Ante cualquier consulta, contáctenos. ✅`,
    ].join('\n');

    await sendWhatsApp(
      telefono,
      mensaje,
      buffer,
      `CuentaPorCobrar_${entity.id}.pdf`,
    );

    return { message: 'WhatsApp enviado correctamente', sentTo: telefono };
  }
}