/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IClaimQueryPort } from '../../domain/ports/in/claim-port-in';
import { Claim } from '../../domain/entity/claim-domain-entity';
import {
  CLAIM_PORT_OUT,
  ClaimPortOut,
} from '../../domain/ports/out/claim-port-out';
import { ClaimResponseDto } from '../dto/out/claim-response-dto';
import { ClaimMapper } from '../mapper/claim.mapper';
import { EmpresaTcpProxy } from '../../../sales-receipt/infrastructure/adapters/out/TCP/empresa-tcp.proxy';
import { buildClaimPdf } from '../../infrastructure/utils/claim-pdf.util';
import { getWhatsAppStatus, sendWhatsApp } from 'libs/whatsapp.util';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesReceiptOrmEntity } from '../../../sales-receipt/infrastructure/entity/sales-receipt-orm.entity';

@Injectable()
export class ClaimQueryService implements IClaimQueryPort {

  private readonly transporter = nodemailer.createTransport({
    host:   process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port:   Number(process.env.MAIL_PORT ?? 587),
    secure: false,
    auth:   { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
  });

  constructor(
    @InjectRepository(SalesReceiptOrmEntity)
    private readonly receiptRepo: Repository<SalesReceiptOrmEntity>,
    @Inject(CLAIM_PORT_OUT)
    private readonly claimRepository: ClaimPortOut,
    @Inject('IEmpresaProxy')
    private readonly empresaProxy: EmpresaTcpProxy,
  ) {}

  // ── Helper: cliente desde comprobante ────────────────────────────
  private async getClienteFromReceipt(idComprobante: number): Promise<{
    email:    string | null;
    telefono: string | null;
    nombre:   string;
  }> {
    const receipt = await this.receiptRepo.findOne({
      where:     { id_comprobante: idComprobante },
      relations: ['cliente'],
    });
    const cl = receipt?.cliente;
    return {
      email:    cl?.email    ?? null,
      telefono: cl?.telefono ?? null,
      nombre: (cl?.razon_social
                ?? `${cl?.nombres ?? ''} ${cl?.apellidos ?? ''}`.trim())
                || 'Cliente',
    };
  }

  // ── Queries ───────────────────────────────────────────────────────

  async getById(id: number): Promise<Claim> {
    const claim = await this.claimRepository.findById(id);
    if (!claim)
      throw new NotFoundException(`El reclamo con ID ${id} no fue encontrado.`);
    return claim;
  }

  async listBySalesReceipt(receiptId: number): Promise<Claim[]> {
    const claims = await this.claimRepository.findByReceiptId(receiptId);
    return claims || [];
  }

  async listBySede(sedeId: number): Promise<ClaimResponseDto[]> {
    const claims = await this.claimRepository.findBySedeId(sedeId);
    if (!claims || claims.length === 0) return [];
    return claims.map((claim) => ClaimMapper.toResponseDto(claim));
  }

  async exportPdf(id: number): Promise<Buffer> {
    const claim   = await this.getById(id);
    const empresa = await this.empresaProxy.getEmpresaActiva();
    return buildClaimPdf(claim, empresa);
  }

  // ── WhatsApp ──────────────────────────────────────────────────────

  async whatsAppStatus(): Promise<{ ready: boolean; qr: string | null }> {
    return getWhatsAppStatus();
  }

  async sendByWhatsApp(id: number): Promise<{ message: string; sentTo: string }> {
    const claim   = await this.getById(id);
    const cliente = await this.getClienteFromReceipt(claim.id_comprobante);

    if (!cliente.telefono)
      throw new NotFoundException('El cliente no tiene teléfono registrado');

    const empresa = await this.empresaProxy.getEmpresaActiva();
    const buffer  = await buildClaimPdf(claim, empresa);

    const mensaje = [
      `📋 *Reclamo REC-${id} - MKapu Import*`,
      ``,
      `Estimado/a *${cliente.nombre}*,`,
      `Le informamos que su reclamo ha sido registrado:`,
      ``,
      `🔖 *N° Reclamo:* REC-${String(id).padStart(6, '0')}`,
      `📋 *Estado:* ${claim.estado}`,
      `📅 *Fecha:* ${new Date().toLocaleDateString('es-PE')}`,
      ``,
      `Adjuntamos el detalle en PDF. Ante cualquier consulta, contáctenos. ✅`,
    ].join('\n');

    await sendWhatsApp(
      cliente.telefono,
      mensaje,
      buffer,
      `Reclamo_REC-${id}.pdf`,
    );

    return { message: 'WhatsApp enviado correctamente', sentTo: cliente.telefono };
  }

  // ── Email ─────────────────────────────────────────────────────────

  async sendByEmail(
    id: number,
    emailOverride?: string,
  ): Promise<{ message: string; sentTo: string }> {
    const claim   = await this.getById(id);
    const cliente = await this.getClienteFromReceipt(claim.id_comprobante);

    const email = emailOverride?.trim() || cliente.email;

    if (!email)
      throw new NotFoundException('El cliente no tiene email registrado');

    const empresa = await this.empresaProxy.getEmpresaActiva();
    const buffer  = await buildClaimPdf(claim, empresa);

    await this.transporter.sendMail({
      from:    process.env.MAIL_FROM ?? `"MKapu Import" <${process.env.MAIL_USER}>`,
      to:      email,
      subject: `Reclamo REC-${String(id).padStart(6, '0')} - MKapu Import`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #1A1A1A; padding: 16px;">
          <p>Estimado/a <strong>${cliente.nombre}</strong>,</p>
          <p>Le informamos que su reclamo <strong>REC-${String(id).padStart(6, '0')}</strong>
             ha sido registrado correctamente.</p>
          <p>Adjuntamos el detalle en PDF para su referencia.</p>
          <p>Ante cualquier consulta adicional, no dude en contactarnos.</p>
          <br/>
          <p>Atentamente,<br/><strong>MKapu Import</strong></p>
        </div>
      `,
      attachments: [{
        filename:    `Reclamo_REC-${id}.pdf`,
        content:     buffer,
        contentType: 'application/pdf',
      }],
    });

    return { message: 'Email enviado correctamente', sentTo: email };
  }
}