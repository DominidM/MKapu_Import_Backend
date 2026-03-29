/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const PDFDocument = require('pdfkit');
import * as QRCode from 'qrcode';
import axios from 'axios';
import { AccountReceivableOrmEntity } from '../infrastructure/entity/account-receivable-orm.entity';
import { AccountReceivablePaymentOrmEntity } from '../infrastructure/entity/account-receivable-payment-orm.entity';
import { EmpresaPdfData } from 'apps/sales/src/core/sales-receipt/utils/sales-receipt-pdf.util';

const PAGE_W = 226;
const MARGIN  = 8;
const W       = PAGE_W - MARGIN * 2;

// ── Logo ──────────────────────────────────────────────────────────────────────
async function loadImageBuffer(url: string): Promise<Buffer | null> {
  if (!url?.trim()) return null;
  try {
    const r = await axios.get<ArrayBuffer>(url.trim(), {
      responseType: 'arraybuffer', timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/*' },
    });
    return Buffer.from(r.data);
  } catch { return null; }
}

// ── Altura dinámica ───────────────────────────────────────────────────────────
function calcHeight(
  entity:  AccountReceivableOrmEntity,
  pagos:   AccountReceivablePaymentOrmEntity[],
): number {
  const detalles = entity.salesReceipt?.details ?? [];
  let h = MARGIN;

  h += 38;          // logo
  h += 5 + 5;       // dashed lines
  h += 9 + 8 + 7 + 7 + 8; // empresa
  h += 5 + 5;
  h += 11 + 10;     // titulo + nro
  h += 5 + 5;
  h += 10 * 5;      // info cuenta
  h += 5 + 5;
  h += 9 + 8 + 8 + 8 + 8; // cliente
  h += 5 + 5;
  h += 9 + 6;       // tabla header
  for (const item of detalles) {
    const desc = item.descripcion ?? (item as any).description ?? '';
    h += 8 + Math.max(1, Math.ceil(desc.length / 24)) * 8 + 5 + 5;
  }
  h += 5;
  h += 10 * 3 + 16; // totales + barra total
  if (Number(entity.paidAmount ?? 0) > 0) h += 10;
  h += 10;          // saldo
  h += 5 + 5;

  // barra progreso texto
  h += 10 + 10;
  h += 5 + 5;

  // historial de pagos
  if (pagos.length > 0) {
    h += 10;        // titulo
    h += 9;         // cabecera tabla
    h += pagos.length * 10;
    h += 10;        // total pagado
    h += 5 + 5;
  }

  // observación
  if (entity.observation) h += 9 + 5 + 5;

  // QR + pie
  h += 72 + 8 + 9;
  h += 5 + 5;
  h += 8 * 3 + 14;
  h += MARGIN + 20;
  return h;
}

// ── QR ────────────────────────────────────────────────────────────────────────
function buildQrContent(entity: AccountReceivableOrmEntity, empresa: EmpresaPdfData): string {
  return [
    `EMPRESA: ${empresa.nombre_comercial || empresa.razon_social}`,
    `RUC: ${empresa.ruc}`,
    `CUENTA: N° ${String(entity.id).padStart(6, '0')}`,
    `FECHA: ${new Date(entity.issueDate).toLocaleDateString('es-PE')}`,
    `VENCE: ${new Date(entity.dueDate).toLocaleDateString('es-PE')}`,
    `TOTAL: ${entity.currencyCode} ${Number(entity.totalAmount).toFixed(2)}`,
    `SALDO: ${entity.currencyCode} ${Number(entity.pendingBalance ?? 0).toFixed(2)}`,
    `ESTADO: ${entity.status}`,
  ].join(' | ');
}

// ── Builder ───────────────────────────────────────────────────────────────────
export async function buildAccountReceivableThermalPdf(
  entity:    AccountReceivableOrmEntity,
  empresaData?: EmpresaPdfData,
  pagos:     AccountReceivablePaymentOrmEntity[] = [],
): Promise<Buffer> {

  // pre-cargar logo y QR antes del Promise síncrono
  let logoBuffer: Buffer | null = null;
  if (empresaData?.logo_url?.trim()) {
    logoBuffer = await loadImageBuffer(empresaData.logo_url.trim());
  }

  const empresa = {
    nombre_comercial: empresaData?.nombre_comercial ?? '',
    razon_social:     empresaData?.razon_social     ?? 'MKAPU IMPORT S.A.C.',
    ruc:              empresaData?.ruc               ?? '20613016946',
    direccion:        empresaData?.direccion         ?? 'AV. LAS FLORES DE LA PRIMAVERA 1836',
    ciudad:           empresaData?.ciudad            ?? 'Lima',
    telefono:         empresaData?.telefono          ?? '903019610',
    sitio_web:        empresaData?.sitio_web         ?? 'www.mkapu.com',
    logo_url:         empresaData?.logo_url          ?? '',
  };

  const qrDataUrl = await QRCode.toDataURL(buildQrContent(entity, empresaData ?? empresa as any), {
    width: 120, margin: 1,
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size:          [PAGE_W, calcHeight(entity, pagos)],
      margins:       { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      autoFirstPage: true,
      bufferPages:   false,
    });

    doc.on('data',  (c: Buffer) => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let y = MARGIN;

    // ── Helpers ──────────────────────────────────────────────────────
    const solidLine = (lw = 0.5) => {
      doc.save().strokeColor('#000').lineWidth(lw)
         .moveTo(MARGIN, y).lineTo(MARGIN + W, y).stroke().restore();
      y += 5;
    };
    const dashedLine = (lw = 0.4) => {
      doc.save().strokeColor('#000').lineWidth(lw).dash(2, { space: 2 })
         .moveTo(MARGIN, y).lineTo(MARGIN + W, y).stroke().undash().restore();
      y += 5;
    };
    const cline = (txt: string, opts: { size?: number; bold?: boolean; gap?: number; color?: string } = {}) => {
      doc.fontSize(opts.size ?? 7).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor(opts.color ?? '#000')
         .text(txt, MARGIN, y, { width: W, align: 'center', lineBreak: false });
      y += opts.gap ?? 9;
    };
    const lline = (txt: string, opts: { size?: number; bold?: boolean; gap?: number } = {}) => {
      doc.fontSize(opts.size ?? 7).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor('#000')
         .text(txt, MARGIN, y, { width: W, align: 'left', lineBreak: false });
      y += opts.gap ?? 9;
    };
    const twoCol = (left: string, right: string, opts: { bold?: boolean; size?: number; colorRight?: string } = {}) => {
      const sz = opts.size ?? 7;
      doc.fontSize(sz).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#000')
         .text(left,  MARGIN,           y, { width: W * 0.55, lineBreak: false, align: 'left' });
      doc.fontSize(sz).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(opts.colorRight ?? '#000')
         .text(right, MARGIN + W * 0.55, y, { width: W * 0.45, lineBreak: false, align: 'right' });
      y += sz + 3;
    };

    const cl      = entity.salesReceipt?.cliente;
    const receipt = entity.salesReceipt;
    const moneda  = entity.currency?.codigo ?? entity.currencyCode ?? 'PEN';

    const nombreCliente =
      cl?.razon_social ||
      `${cl?.nombres ?? ''} ${cl?.apellidos ?? ''}`.trim() ||
      'Cliente';

    // ════════════════════════════════════════════
    //  LOGO
    // ════════════════════════════════════════════
    const LOGO_H = 32;
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, MARGIN + (W - 80) / 2, y, { fit: [80, LOGO_H], align: 'center' });
      } catch {
        doc.fontSize(15).font('Helvetica-Bold').fillColor('#000')
           .text('mkapu', MARGIN, y, { width: W, align: 'center', lineBreak: false });
        y += 16;
        doc.fontSize(9).font('Helvetica').fillColor('#000')
           .text('import', MARGIN, y, { width: W, align: 'center', lineBreak: false });
      }
    } else {
      doc.fontSize(15).font('Helvetica-Bold').fillColor('#000')
         .text('mkapu', MARGIN, y, { width: W, align: 'center', lineBreak: false });
      y += 16;
      doc.fontSize(9).font('Helvetica').fillColor('#000')
         .text('import', MARGIN, y, { width: W, align: 'center', lineBreak: false });
    }
    y += LOGO_H + 4;

    dashedLine();

    // ════════════════════════════════════════════
    //  EMPRESA
    // ════════════════════════════════════════════
    const nombreMostrar = empresa.nombre_comercial?.trim() || empresa.razon_social;
    cline(nombreMostrar,                  { bold: true, size: 8, gap: 9 });
    cline(`RUC: ${empresa.ruc}`,          { size: 7, gap: 8 });
    cline(empresa.direccion,              { size: 6, gap: 7 });
    cline(empresa.ciudad,                 { size: 6, gap: 7 });
    cline(`Celular: ${empresa.telefono}`, { size: 6, gap: 8 });

    dashedLine();

    // ════════════════════════════════════════════
    //  TÍTULO
    // ════════════════════════════════════════════
    cline('CUENTA POR COBRAR', { bold: true, size: 9, gap: 11 });
    cline(`N° ${String(entity.id).padStart(6, '0')}`, { bold: true, size: 8, gap: 10 });

    dashedLine();

    // ════════════════════════════════════════════
    //  INFO CUENTA
    // ════════════════════════════════════════════
    twoCol('Emisión:',      new Date(entity.issueDate).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    twoCol('Vencimiento:',  new Date(entity.dueDate).toLocaleDateString('es-PE'));
    twoCol('Estado:',       entity.status, { bold: true });
    twoCol('Tipo pago:',    entity.paymentType?.descripcion ?? '—');
    twoCol('Moneda:',       moneda);

    dashedLine();

    // ════════════════════════════════════════════
    //  CLIENTE
    // ════════════════════════════════════════════
    lline(nombreCliente, { bold: true, size: 7, gap: 9 });
    if (cl?.id_tipo_documento && cl?.valor_doc)
      lline(`${cl.id_tipo_documento}: ${cl.valor_doc}`, { size: 6, gap: 8 });
    if (cl?.direccion) lline(cl.direccion,              { size: 6, gap: 8 });
    if (cl?.email)     lline(`Email: ${cl.email}`,      { size: 6, gap: 8 });
    if (cl?.telefono)  lline(`Tel: ${cl.telefono}`,     { size: 6, gap: 8 });

    dashedLine();

    // ════════════════════════════════════════════
    //  TABLA PRODUCTOS
    // ════════════════════════════════════════════
    doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#000');
    doc.text('#',           MARGIN,       y, { width: 12,             lineBreak: false });
    doc.text('DESCRIPCIÓN', MARGIN + 12,  y, { width: 88,             lineBreak: false });
    doc.text('CANT',        MARGIN + 100, y, { width: 28, align: 'center', lineBreak: false });
    doc.text('P.U.',        MARGIN + 128, y, { width: 32, align: 'right',  lineBreak: false });
    doc.text('TOTAL',       MARGIN + 160, y, { width: W - 160, align: 'right', lineBreak: false });
    y += 9;

    solidLine(0.8);

    const detalles: any[] = receipt?.details ?? [];
    detalles.forEach((item, idx) => {
      const desc    = item.descripcion ?? item.description ?? '';
      const cod     = item.cod_prod    ?? item.codProd     ?? '';
      const cant    = Number(item.cantidad   ?? item.quantity ?? 1);
      const precio  = Number(item.pre_uni ?? item.precio_unit ?? item.precio ?? item.price ?? 0);
      const total   = Number(item.total   ?? cant * precio);

      doc.fontSize(6.5).font('Helvetica-Bold').fillColor('#000')
         .text(`${idx + 1} ${cod}`, MARGIN, y, { width: W, lineBreak: false });
      y += 8;

      doc.fontSize(6.5).font('Helvetica').fillColor('#000')
         .text(desc, MARGIN + 4, y, { width: 96, lineBreak: true });
      const afterDesc = (doc as any).y;
      const midY = y + (afterDesc - y - 7) / 2;

      doc.fontSize(6.5).font('Helvetica').fillColor('#000')
         .text(String(cant),                     MARGIN + 100, midY, { width: 28, align: 'center', lineBreak: false })
         .text(`${moneda} ${precio.toFixed(2)}`, MARGIN + 128, midY, { width: 32, align: 'right',  lineBreak: false })
         .text(`${moneda} ${total.toFixed(2)}`,  MARGIN + 160, midY, { width: W - 160, align: 'right', lineBreak: false });

      y = afterDesc + 1;
      dashedLine(0.3);
    });

    solidLine(0.8);

    // ════════════════════════════════════════════
    //  TOTALES
    // ════════════════════════════════════════════
    const subtotal  = Number(receipt?.subtotal     ?? 0);
    const igv       = Number(receipt?.igv          ?? 0);
    const total     = Number(entity.totalAmount    ?? 0);
    const pagado    = Number(entity.paidAmount     ?? 0);
    const pendiente = Number(entity.pendingBalance ?? 0);

    twoCol('Subtotal:',   `${moneda} ${subtotal.toFixed(2)}`);
    twoCol('IGV (18%):',  `${moneda} ${igv.toFixed(2)}`);
    twoCol('Total:',      `${moneda} ${total.toFixed(2)}`);
    if (pagado > 0) twoCol('A cuenta:', `${moneda} ${pagado.toFixed(2)}`);

    y += 2;
    doc.rect(MARGIN, y, W, 15).fill('#000');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFF')
       .text('SALDO PENDIENTE:', MARGIN + 4, y + 4, { width: W * 0.5, lineBreak: false });
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#FFF')
       .text(`${moneda} ${pendiente.toFixed(2)}`, MARGIN, y + 4, { width: W - 4, align: 'right', lineBreak: false });
    y += 18;

    dashedLine();

    // ════════════════════════════════════════════
    //  BARRA DE PROGRESO (texto)
    // ════════════════════════════════════════════
    const pct = total > 0 ? Math.min(100, Math.round((pagado / total) * 100)) : 0;
    const barW = W - 2;
    const fillW = Math.round((pct / 100) * barW);

    twoCol('Progreso de pago:', `${pct}% completado`, { bold: true, size: 7 });

    // fondo gris
    doc.rect(MARGIN, y, barW, 6).fillColor('#E0E0E0').fill();
    // relleno
    if (fillW > 0) {
      doc.rect(MARGIN, y, fillW, 6).fillColor(pct >= 100 ? '#22C55E' : '#F59E0B').fill();
    }
    doc.fillColor('#000');
    y += 10;

    dashedLine();

    // ════════════════════════════════════════════
    //  HISTORIAL DE PAGOS
    // ════════════════════════════════════════════
    if (pagos.length > 0) {
      lline('HISTORIAL DE ABONOS', { bold: true, size: 7, gap: 10 });

      // cabecera
      doc.fontSize(6).font('Helvetica-Bold').fillColor('#000');
      doc.text('FECHA',   MARGIN,       y, { width: 50, lineBreak: false });
      doc.text('MÉTODO',  MARGIN + 50,  y, { width: 55, lineBreak: false });
      doc.text('MONTO',   MARGIN + 105, y, { width: W - 105, align: 'right', lineBreak: false });
      y += 9;
      solidLine(0.5);

      let totalAbonado = 0;
      for (const p of pagos) {
        const fecha   = new Date(p.fecPago).toLocaleDateString('es-PE');
        const metodo  = p.paymentType?.descripcion ?? String(p.paymentTypeId);
        const monto   = Number(p.amount);
        totalAbonado += monto;

        doc.fontSize(6).font('Helvetica').fillColor('#000');
        doc.text(fecha,  MARGIN,       y, { width: 50, lineBreak: false });
        doc.text(metodo, MARGIN + 50,  y, { width: 55, lineBreak: false });
        doc.text(`${moneda} ${monto.toFixed(2)}`, MARGIN + 105, y, { width: W - 105, align: 'right', lineBreak: false });
        y += 10;
      }

      solidLine(0.5);
      twoCol('Total abonado:', `${moneda} ${totalAbonado.toFixed(2)}`, { bold: true, size: 7 });

      dashedLine();
    }

    // ════════════════════════════════════════════
    //  OBSERVACIÓN
    // ════════════════════════════════════════════
    if (entity.observation) {
      lline(`Obs: ${entity.observation}`, { size: 6, gap: 9 });
      dashedLine();
    }

    // ════════════════════════════════════════════
    //  QR
    // ════════════════════════════════════════════
    const QR_SIZE = 68;
    doc.image(qrBuffer, MARGIN + (W - QR_SIZE) / 2, y, { width: QR_SIZE, height: QR_SIZE });
    y += QR_SIZE + 4;
    cline('Escanee para verificar la cuenta', { size: 5.5, gap: 9 });

    dashedLine();

    // ════════════════════════════════════════════
    //  PIE
    // ════════════════════════════════════════════
    cline('Consulte su cuenta en:',              { size: 5.5, gap: 7 });
    cline(empresa.sitio_web,                     { size: 5.5, bold: true, gap: 7 });
    cline('Conserve este comprobante de pago.',  { size: 5.5, gap: 8 });

    solidLine(0.8);
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#000')
       .text('** GRACIAS POR SU PREFERENCIA **', MARGIN, y, { width: W, align: 'center', lineBreak: false });

    doc.end();
  });
}