import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { IQuoteQueryPort } from '../../domain/ports/in/quote-ports-in';
import { IQuoteRepositoryPort } from '../../domain/ports/out/quote-ports-out';
import { ICustomerRepositoryPort } from '../../../customer/domain/ports/out/customer-port-out';
import { ISedeProxy } from '../../domain/ports/out/sede-proxy.port';
import { QuoteResponseDto, QuotePagedResponseDto } from '../dto/out/quote-response.dto';
import { QuoteMapper } from '../mapper/quote.mapper';
import { QuoteQueryFiltersDto } from '../dto/in/quote-query-filters.dto';
import * as nodemailer from 'nodemailer';

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

@Injectable()
export class QuoteQueryService implements IQuoteQueryPort {
  constructor(
    @Inject('IQuoteRepositoryPort')
    private readonly repository: IQuoteRepositoryPort,
    @Inject('ICustomerRepositoryPort')
    private readonly customerRepository: ICustomerRepositoryPort,
    @Inject('ISedeProxy')
    private readonly sedeProxy: ISedeProxy,
  ) {}

  // ── tus métodos existentes sin cambios ────────────────────────────────────

  async getById(id: number): Promise<QuoteResponseDto | null> {
    const quote = await this.repository.findById(id);
    if (!quote) return null;
    const customer = await this.customerRepository.findById(quote.id_cliente);
    const sede = await this.sedeProxy.getSedeById(quote.id_sede);
    return QuoteMapper.toResponseDto(quote, customer, sede);
  }

  async getByCustomerDocument(valor_doc: string): Promise<QuoteResponseDto[]> {
    const customer = await this.customerRepository.findByDocument(valor_doc);
    if (!customer) return [];
    const quotes = await this.repository.findByCustomerId(customer.id_cliente);
    return Promise.all(
      quotes.map(async quote => {
        const sede = await this.sedeProxy.getSedeById(quote.id_sede);
        return QuoteMapper.toResponseDto(quote, customer, sede);
      })
    );
  }

  async findAllPaged(filters: QuoteQueryFiltersDto): Promise<QuotePagedResponseDto> {
    const { data, total } = await this.repository.findAllPaged(filters);
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;

    const sedeIds = [...new Set(data.map(q => q.id_sede))];
    const clienteIds = [...new Set(data.map(q => q.id_cliente))];

    const [sedes, clientes] = await Promise.all([
      Promise.all(sedeIds.map(id => this.sedeProxy.getSedeById(id).then(s => ({ id, data: s })))),
      Promise.all(clienteIds.map(id => this.customerRepository.findById(id).then(c => ({ id, data: c })))),
    ]);

    const sedeMap = new Map(sedes.map(s => [s.id, s.data]));
    const clienteMap = new Map(clientes.map(c => [c.id, c.data]));

    const mapped = data.map(quote => {
      const sede = sedeMap.get(quote.id_sede);
      const cliente = clienteMap.get(quote.id_cliente);
      const cliente_nombre = cliente?.razon_social
        || `${cliente?.nombres ?? ''} ${cliente?.apellidos ?? ''}`.trim()
        || quote.id_cliente;
      return QuoteMapper.toListItemDto(quote, sede?.nombre ?? '', cliente_nombre);
    });

    return { data: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── NUEVO: generar buffer PDF (reutilizable por export y email) ───────────

  private async buildPdfBuffer(id: number): Promise<{ buffer: Buffer; quote: QuoteResponseDto }> {
    const quote = await this.getById(id);
    if (!quote) throw new NotFoundException(`Cotización ${id} no encontrada`);

    const PDFDocument = require('pdfkit-table');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', resolve);
      doc.on('error', reject);

      // ── Encabezado ──────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(16)
        .text('COTIZACIÓN', { align: 'center' });

      const codigo = (quote as any).codigo ?? `COT-${quote.id_cotizacion}`;
      doc.fontSize(11).text(codigo, { align: 'center' });
      doc.moveDown(0.5);

      // ── Info general ────────────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(10).text('INFORMACIÓN GENERAL');
      doc.font('Helvetica').fontSize(9);
      doc.text(`Estado:          ${quote.estado}`);
      doc.text(`Fecha Emisión:   ${new Date(quote.fec_emision).toLocaleDateString('es-PE')}`);
      doc.text(`Fecha Venc.:     ${new Date(quote.fec_venc).toLocaleDateString('es-PE')}`);
      if (quote.sede) {
        doc.text(`Sede:            ${quote.sede.nombre_sede}`);
      }
      doc.moveDown(0.5);

      // ── Cliente ─────────────────────────────────────────────────────────
      if (quote.cliente) {
        const cl = quote.cliente;
        const nombre = cl.razon_social
          || `${cl.nombre_cliente ?? ''} ${cl.apellidos_cliente ?? ''}`.trim();
        doc.font('Helvetica-Bold').fontSize(10).text('DATOS DEL CLIENTE');
        doc.font('Helvetica').fontSize(9);
        doc.text(`Nombre:     ${nombre}`);
        doc.text(`Documento:  ${cl.valor_doc}`);
        if (cl.email)    doc.text(`Email:      ${cl.email}`);
        if (cl.telefono) doc.text(`Teléfono:   ${cl.telefono}`);
        if (cl.direccion) doc.text(`Dirección:  ${cl.direccion}`);
        doc.moveDown(0.5);
      }

      // ── Tabla de productos ───────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(10).text('PRODUCTOS COTIZADOS');
      doc.moveDown(0.3);

      const table = {
        headers: ['Código', 'Descripción', 'Cant.', 'Precio Unit.', 'Importe'],
        rows: (quote.detalles ?? []).map((d: any) => [
          d.cod_prod ?? '—',
          d.descripcion,
          String(d.cantidad),
          `S/. ${Number(d.precio).toFixed(2)}`,
          `S/. ${Number(d.importe ?? d.cantidad * d.precio).toFixed(2)}`,
        ]),
      };

      doc.table(table, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
        prepareRow: () => doc.font('Helvetica').fontSize(8),
      }).then(() => {
        // ── Totales ───────────────────────────────────────────────────────
        doc.moveDown(0.5);
        const rightX = doc.page.width - doc.page.margins.right;
        doc.font('Helvetica').fontSize(9)
          .text(`Subtotal: S/. ${Number(quote.subtotal).toFixed(2)}`, { align: 'right', width: rightX - 40 });
        doc.text(`IGV (18%): S/. ${Number(quote.igv).toFixed(2)}`, { align: 'right', width: rightX - 40 });
        doc.font('Helvetica-Bold').fontSize(10)
          .text(`TOTAL: S/. ${Number(quote.total).toFixed(2)}`, { align: 'right', width: rightX - 40 });

        doc.end();
      });
    });

    return { buffer: Buffer.concat(chunks), quote };
  }

  // ── NUEVO: exportar PDF como descarga ─────────────────────────────────────

  async exportPdf(id: number, res: Response): Promise<void> {
    const { buffer, quote } = await this.buildPdfBuffer(id);
    const codigo = (quote as any).codigo ?? `COT-${quote.id_cotizacion}`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Cotizacion_${codigo}.pdf`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ── NUEVO: enviar PDF por email al cliente ────────────────────────────────

  async sendByEmail(id: number): Promise<{ message: string; sentTo: string }> {
    const { buffer, quote } = await this.buildPdfBuffer(id);

    const email = quote.cliente?.email;
    if (!email) throw new NotFoundException('El cliente no tiene email registrado');

    const codigo = (quote as any).codigo ?? `COT-${quote.id_cotizacion}`;

    const nombre = quote.cliente?.razon_social
      || `${quote.cliente?.nombre_cliente ?? ''} ${quote.cliente?.apellidos_cliente ?? ''}`.trim()
      || 'Cliente';

    // Configura con tus credenciales SMTP (o usa variables de entorno)
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"MKapu Import" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `Cotización ${codigo} - MKapu Import`,
      html: `
        <p>Estimado/a <strong>${nombre}</strong>,</p>
        <p>Adjuntamos la cotización <strong>${codigo}</strong> para su revisión.</p>
        <p>Ante cualquier consulta, no dude en contactarnos.</p>
        <br/>
        <p>Atentamente,<br/><strong>MKapu Import</strong></p>
      `,
      attachments: [
        {
          filename: `Cotizacion_${codigo}.pdf`,
          content: buffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return { message: 'Email enviado correctamente', sentTo: email };
  }
}