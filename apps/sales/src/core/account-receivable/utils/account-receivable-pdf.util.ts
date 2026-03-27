/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as QRCode from 'qrcode';
import axios from 'axios';
import { AccountReceivableOrmEntity } from '../infrastructure/entity/account-receivable-orm.entity';
import { EmpresaPdfData } from '../../quote/utils/quote-pdf.util';

const C = {
  yellow:  '#F6AF33',
  black:   '#1A1A1A',
  gray:    '#555555',
  lgray:   '#F4F4F4',
  white:   '#FFFFFF',
  border:  '#CCCCCC',
  rowAlt:  '#FFFBF4',
  darkBg:  '#2B2B2B',
  green:   '#27AE60',
  red:     '#C0392B',
  orange:  '#E67E22',
};

// ── Medidas A4 ───────────────────────────────────────────────────────
const PW    = 595.28;
const MAR   = 28;
const INNER = PW - MAR * 2;

// ── Helpers ──────────────────────────────────────────────────────────

function box(
  doc: any,
  x: number, y: number, w: number, h: number,
  opts: { fill?: string; stroke?: string; radius?: number } = {},
): void {
  const r = opts.radius ?? 0;
  if (opts.fill) {
    r > 0 ? doc.roundedRect(x, y, w, h, r).fill(opts.fill)
           : doc.rect(x, y, w, h).fill(opts.fill);
  }
  if (opts.stroke) {
    r > 0 ? doc.roundedRect(x, y, w, h, r).stroke(opts.stroke)
           : doc.rect(x, y, w, h).stroke(opts.stroke);
  }
}

function hline(doc: any, x: number, y: number, w: number, color = C.border, lw = 0.5): void {
  doc.save().strokeColor(color).lineWidth(lw)
     .moveTo(x, y).lineTo(x + w, y).stroke().restore();
}

function vline(doc: any, x: number, y1: number, y2: number, color = C.border, lw = 0.5): void {
  doc.save().strokeColor(color).lineWidth(lw)
     .moveTo(x, y1).lineTo(x, y2).stroke().restore();
}

function labelCell(doc: any, text: string, x: number, y: number, w = 90): void {
  doc.fillColor(C.gray).font('Helvetica').fontSize(7.5).text(text, x, y, { width: w });
}

function valueCell(doc: any, text: string, x: number, y: number, w = 140): void {
  doc.fillColor(C.black).font('Helvetica').fontSize(8).text(text, x, y, { width: w, ellipsis: true });
}

// ── Logo desde URL (igual que Sales Receipt) ─────────────────────────

async function loadImageBuffer(url: string): Promise<Buffer | null> {
  if (!url?.trim()) return null;
  try {
    const response = await axios.get<ArrayBuffer>(url.trim(), {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/jpeg,image/png,image/*' },
    });
    return Buffer.from(response.data);
  } catch (err: any) {
    console.error('❌ Error descargando logo:', err.message);
    return null;
  }
}

// ── Color badge estado ────────────────────────────────────────────────

function estadoColor(estado: string): string {
  switch (estado?.toUpperCase()) {
    case 'PAGADO':
    case 'PAGADA':
    case 'COBRADO':   return C.green;
    case 'VENCIDO':
    case 'VENCIDA':   return C.red;
    case 'PARCIAL':   return C.orange;
    default:          return C.gray;   // PENDIENTE u otro
  }
}

// ── QR content ───────────────────────────────────────────────────────

function buildQrContent(entity: AccountReceivableOrmEntity, empresaData?: EmpresaPdfData | null): string {
  const ruc           = empresaData?.ruc ?? '20000000000';
  const nombreEmpresa = (empresaData?.nombre_comercial?.trim() || empresaData?.razon_social) ?? 'MKAPU IMPORT S.A.C.';
  const comp   = entity.salesReceipt;
  const moneda = entity.currency?.codigo ?? entity.currencyCode ?? 'PEN';
  const tipo   = comp?.tipoComprobante?.descripcion ?? 'CUENTA POR COBRAR';
  const serie  = comp?.serie ?? '—';
  const numero = comp
    ? String(comp.numero).padStart(8, '0')
    : String(entity.id).padStart(8, '0');

  return [
    `EMPRESA: ${nombreEmpresa}`,
    `RUC: ${ruc}`,
    `DOCUMENTO: ${tipo} ${serie}-${numero}`,
    `FECHA: ${new Date(entity.issueDate).toLocaleDateString('es-PE')}`,
    `VENCIMIENTO: ${new Date(entity.dueDate).toLocaleDateString('es-PE')}`,
    `TOTAL: ${moneda} ${Number(entity.totalAmount).toFixed(2)}`,
    `SALDO: ${moneda} ${Number(entity.pendingBalance ?? 0).toFixed(2)}`,
    `ESTADO: ${entity.status}`,
  ].join(' | ');
}

// ════════════════════════════════════════════════════════════════════
//  FUNCIÓN PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export async function buildAccountReceivablePdf(
  entity: AccountReceivableOrmEntity,
  empresaData?: EmpresaPdfData | null,
): Promise<Buffer> {
  const PDFDocument = require('pdfkit');
  const chunks: Buffer[] = [];

  const cl     = entity.salesReceipt?.cliente;
  const comp   = entity.salesReceipt;
  const moneda = entity.currency?.codigo ?? entity.currencyCode ?? 'PEN';

  const nombreCliente =
    cl?.razon_social ||
    `${cl?.nombres ?? ''} ${cl?.apellidos ?? ''}`.trim() ||
    'Cliente';

  const tipoDoc = comp?.tipoComprobante?.descripcion ?? 'CUENTA POR COBRAR';
  const serie   = comp?.serie ?? '—';
  const numero  = comp
    ? String(comp.numero).padStart(8, '0')
    : String(entity.id).padStart(8, '0');
  const docRef  = `${serie}-${numero}`;

  // EmpresaPdfData ya viene mapeado con logo_url correcto
  const empresa = {
    nombre:   (empresaData?.nombre_comercial?.trim() || empresaData?.razon_social) ?? 'MKAPU IMPORT S.A.C.',
    ruc:      empresaData?.ruc       ?? '20613016946',
    direccion: empresaData?.direccion ?? 'AV. LAS FLORES DE LA PRIMAVERA 1836',
    ciudad:   empresaData?.ciudad    ?? 'San Juan de Lurigancho - Lima - Perú',
    email:    empresaData?.email     ?? 'mkapu@gmail.com',
    web:      empresaData?.sitio_web ?? 'www.mkapu.com',
    telefono: empresaData?.telefono  ?? '903019610',
    logo_url: empresaData?.logo_url  ?? null,
  };

  // ── Pre-cargar logo desde URL ANTES del Promise síncrono ─────────
  let logoBuffer: Buffer | null = null;
  if (empresa.logo_url?.trim()) {
    logoBuffer = await loadImageBuffer(empresa.logo_url.trim());
  }

  // ── QR ────────────────────────────────────────────────────────────
  const qrDataUrl = await QRCode.toDataURL(buildQrContent(entity, empresaData), {
    width: 120,
    margin: 1,
    color: { dark: C.black, light: C.white },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const details = comp?.details ?? [];

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: MAR, size: 'A4', bufferPages: true });
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 1 – CABECERA
    // ══════════════════════════════════════════════════════════════
    const HDR_H  = 88;
    const LW     = 180;
    const RW     = INNER - LW - 8;
    const xRight = MAR + LW + 8;

    // Logo desde URL con fallback a nombre empresa
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, MAR + 6, 10, {
          fit: [LW - 12, HDR_H - 20],
          align: 'left',
          valign: 'center',
        });
      } catch {
        doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(22)
           .text(empresa.nombre, MAR + 10, 18, { width: LW - 16 });
      }
    } else {
      doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(22)
         .text(empresa.nombre, MAR + 10, 18, { width: LW - 16 });
    }

    // Pill tipo doc
    const pillY = 10;
    box(doc, xRight, pillY, RW, 26, { fill: C.yellow, radius: 4 });
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(12)
       .text(tipoDoc.toUpperCase(), xRight, pillY + 7, { width: RW, align: 'center' });

    // Caja RUC
    const rucY = pillY + 32;
    box(doc, xRight, rucY, RW, 20, { stroke: C.yellow, radius: 3 });
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(8.5)
       .text(`RUC ${empresa.ruc}`, xRight, rucY + 6, { width: RW, align: 'center' });

    // Caja N° documento
    const numY = rucY + 26;
    box(doc, xRight, numY, RW, 20, { stroke: C.yellow, radius: 3 });
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(9)
       .text(docRef, xRight, numY + 6, { width: RW, align: 'center' });

    // ✅ Badge estado en cabecera (igual que Sales Receipt)
    const badgeY = numY + 26;
    box(doc, xRight, badgeY, RW, 18, { fill: estadoColor(entity.status), radius: 3 });
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(8)
       .text(entity.status ?? 'PENDIENTE', xRight, badgeY + 5, { width: RW, align: 'center' });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 2 – DATOS EMPRESA
    // ══════════════════════════════════════════════════════════════
    let y = HDR_H + 4;
    const EH = 66;
    box(doc, MAR, y, INNER, EH, { fill: C.lgray, radius: 3 });
    box(doc, MAR, y, INNER, EH, { stroke: C.border, radius: 3 });

    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(9.5)
       .text(empresa.nombre, MAR + 10, y + 7, { width: INNER - 20 });
    doc.fillColor(C.gray).font('Helvetica').fontSize(7.5)
       .text(`DIRECCIÓN FISCAL: ${empresa.direccion}`, MAR + 10, y + 21, {
         width: INNER - 20, lineBreak: true, lineGap: 1,
       });
    const afterDir = (doc as any).y;
    doc.text(empresa.ciudad, MAR + 10, afterDir + 1, { width: INNER - 20 });
    const afterCity = (doc as any).y;

    const contactoLinea = [
      `TELÉFONO: ${empresa.telefono}`,
      `EMAIL: ${empresa.email}`,
      empresa.web ? `WEB: ${empresa.web}` : null,
    ].filter(Boolean).join('   ');
    doc.text(contactoLinea, MAR + 10, afterCity + 1, { width: INNER - 20 });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 3 – CLIENTE Y FECHAS
    // ══════════════════════════════════════════════════════════════
    y += EH + 6;
    const B3H = 70;
    const CLW = INNER * 0.58;
    const FEW = INNER - CLW - 6;
    const xFec = MAR + CLW + 6;

    box(doc, MAR, y, CLW, B3H, { stroke: C.border, radius: 3 });
    box(doc, MAR, y, CLW, 16, { fill: C.yellow, radius: 3 });
    doc.rect(MAR, y + 8, CLW, 8).fill(C.yellow);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5)
       .text('CLIENTE', MAR + 8, y + 4, { width: CLW - 16 });

    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(9)
       .text(nombreCliente, MAR + 8, y + 22, { width: CLW - 16 });
    if (cl?.valor_doc)
      doc.font('Helvetica').fontSize(8).fillColor(C.black)
         .text(`Doc: ${cl.valor_doc}`, MAR + 8, y + 36, { width: CLW - 16 });
    if (cl?.direccion)
      doc.font('Helvetica').fontSize(7.5).fillColor(C.gray)
         .text(cl.direccion, MAR + 8, y + 48, { width: CLW - 16, ellipsis: true });

    box(doc, xFec, y, FEW, B3H, { stroke: C.border, radius: 3 });
    box(doc, xFec, y, FEW, 16, { fill: C.yellow, radius: 3 });
    doc.rect(xFec, y + 8, FEW, 8).fill(C.yellow);
    doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5)
       .text('FECHAS', xFec + 8, y + 4);

    doc.fillColor(C.gray).font('Helvetica').fontSize(7.5)
       .text('FECHA DE EMISIÓN', xFec + 8, y + 22);
    doc.fillColor(C.black).font('Helvetica').fontSize(8.5)
       .text(
         new Date(entity.issueDate).toLocaleDateString('es-PE', {
           day: '2-digit', month: '2-digit', year: 'numeric',
         }),
         xFec + 8, y + 33, { width: FEW - 16 },
       );
    hline(doc, xFec + 6, y + 46, FEW - 12);
    doc.fillColor(C.gray).font('Helvetica').fontSize(7.5)
       .text('FECHA VENCIMIENTO', xFec + 8, y + 50);
    doc.fillColor(C.black).font('Helvetica').fontSize(8.5)
       .text(
         new Date(entity.dueDate).toLocaleDateString('es-PE'),
         xFec + 8, y + 61, { width: FEW - 16 },
       );

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 4 – COMPROBANTE Y ESTADO
    // ══════════════════════════════════════════════════════════════
    y += B3H + 6;
    const B4H = 72;
    const HW   = (INNER - 6) / 2;
    const xB4R = MAR + HW + 6;

    box(doc, MAR, y, HW, B4H, { stroke: C.border, radius: 3 });
    box(doc, MAR, y, HW, 16, { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 8, HW, 8).fill(C.darkBg);
    doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(7.5)
       .text('DATOS DEL COMPROBANTE', MAR + 8, y + 4);

    const rows4L: [string, string][] = [
      ['Tipo comprobante:', tipoDoc],
      ['Serie - Número:',   docRef],
      ['Observación:',      entity.observation ?? '—'],
    ];
    rows4L.forEach(([lbl, val], i) => {
      const ry = y + 22 + i * 16;
      labelCell(doc, lbl, MAR + 8, ry, 90);
      valueCell(doc, val, MAR + 100, ry, HW - 108);
      if (i < rows4L.length - 1) hline(doc, MAR + 6, ry + 12, HW - 12);
    });

    box(doc, xB4R, y, HW, B4H, { stroke: C.border, radius: 3 });
    box(doc, xB4R, y, HW, 16, { fill: C.darkBg, radius: 3 });
    doc.rect(xB4R, y + 8, HW, 8).fill(C.darkBg);
    doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(7.5)
       .text('ESTADO Y PAGO', xB4R + 8, y + 4);

    const rows4R: [string, string][] = [
      ['Estado:',    entity.status                       ?? '—'],
      ['Tipo Pago:', entity.paymentType?.descripcion     ?? '—'],
      ['Moneda:',    moneda],
    ];
    rows4R.forEach(([lbl, val], i) => {
      const ry = y + 22 + i * 16;
      labelCell(doc, lbl, xB4R + 8, ry, 68);
      valueCell(doc, val, xB4R + 78, ry, HW - 86);
      if (i < rows4R.length - 1) hline(doc, xB4R + 6, ry + 12, HW - 12);
    });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 5 – TABLA DE PRODUCTOS
    // ══════════════════════════════════════════════════════════════
    y += B4H + 8;

    const COLS  = [28, 60, 168, 38, 48, 66, 66];
    const HEADS = ['N°', 'CÓDIGO', 'DESCRIPCIÓN', 'U.M.', 'CANT.', 'P. UNIT.', 'TOTAL'];
    const TH    = 18;

    box(doc, MAR, y, INNER, TH, { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 6, INNER, 12).fill(C.darkBg);

    let xc = MAR + 4;
    HEADS.forEach((h, i) => {
      const align = i >= 4 ? 'right' : i === 0 ? 'center' : 'left';
      doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(7.5)
         .text(h, xc, y + 5, { width: COLS[i] - 4, align });
      xc += COLS[i];
    });

    const tableTopY = y;
    y += TH;

    const rows =
      details.length > 0
        ? details
        : [{
            cod_prod:    '—',
            descripcion: 'Servicio/Producto según comprobante',
            cantidad:    1,
            pre_uni:     entity.totalAmount,
            valor_uni:   entity.totalAmount,
            igv:         0,
          }];

    rows.forEach((det, idx) => {
      const rh       = 20;
      const subtotal = Number(det.cantidad ?? 1) * Number(det.pre_uni ?? 0);

      box(doc, MAR, y, INNER, rh, { fill: idx % 2 === 0 ? C.rowAlt : C.white });
      hline(doc, MAR, y + rh, INNER, C.border, 0.4);

      let xs = MAR;
      COLS.forEach((cw, ci) => {
        xs += cw;
        if (ci < COLS.length - 1) vline(doc, xs, y, y + rh, C.border, 0.3);
      });

      const cells = [
        String(idx + 1),
        det.cod_prod    ?? '—',
        det.descripcion ?? '—',
        'NIU',
        String(det.cantidad ?? 1),
        `${moneda} ${Number(det.pre_uni ?? 0).toFixed(2)}`,
        `${moneda} ${subtotal.toFixed(2)}`,
      ];

      xc = MAR + 4;
      cells.forEach((cell, i) => {
        const align = i >= 4 ? 'right' : i === 0 ? 'center' : 'left';
        doc.fillColor(C.black).font('Helvetica').fontSize(7.8)
           .text(cell, xc, y + 6, { width: COLS[i] - 6, align, ellipsis: true });
        xc += COLS[i];
      });
      y += rh;
    });

    box(doc, MAR, tableTopY, INNER, y - tableTopY, { stroke: C.border, radius: 3 });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 6 – TOTALES (izq) | QR (der)
    // ══════════════════════════════════════════════════════════════
    y += 10;

    // ✅ QR con altura mínima garantizada (igual que Sales Receipt)
    const QR_SIZE  = 80;
    const QR_PAD   = 16;
    const QR_MIN_H = QR_SIZE + QR_PAD * 2;  // 112px mínimo
    const QR_BOX_W = QR_SIZE + 24;

    const totW   = INNER - QR_BOX_W - 6;
    const totX   = MAR;
    const qrBoxX = MAR + totW + 6;

    const totales: [string, string, boolean][] = [
      ['Subtotal:',        `${moneda} ${Number(comp?.subtotal ?? entity.totalAmount).toFixed(2)}`, false],
      ['IGV (18%):',       `${moneda} ${Number(comp?.igv ?? 0).toFixed(2)}`,                      false],
      ['Monto total:',     `${moneda} ${Number(entity.totalAmount).toFixed(2)}`,                   false],
      ['Monto pagado:',    `${moneda} ${Number(entity.paidAmount).toFixed(2)}`,                    false],
      ['Saldo pendiente:', `${moneda} ${Number(entity.pendingBalance ?? 0).toFixed(2)}`,           true],
    ];

    const startTotY = y;
    let ty = startTotY;

    totales.forEach(([lbl, val, highlight], i) => {
      const rh = highlight ? 22 : 17;
      if (highlight) {
        box(doc, totX, ty, totW, rh, { fill: C.yellow, radius: 3 });
      } else {
        box(doc, totX, ty, totW, rh, { fill: i % 2 === 0 ? C.lgray : C.white });
        hline(doc, totX, ty + rh, totW, C.border, 0.4);
      }
      const fc   = highlight ? C.white : C.black;
      const font = highlight ? 'Helvetica-Bold' : 'Helvetica';
      doc.fillColor(fc).font(font).fontSize(highlight ? 10 : 8.5)
         .text(lbl, totX + 8, ty + (highlight ? 6 : 4), { width: totW / 2 - 10 })
         .text(val, totX + totW / 2, ty + (highlight ? 6 : 4), {
           width: totW / 2 - 10, align: 'right',
         });
      ty += rh;
    });

    box(doc, totX, startTotY, totW, ty - startTotY, { stroke: C.border, radius: 3 });

    // Caja QR con altura mínima garantizada
    const qrBoxH = Math.max(ty - startTotY, QR_MIN_H);
    box(doc, qrBoxX, startTotY, QR_BOX_W, qrBoxH, {
      fill: C.lgray, stroke: C.border, radius: 3,
    });

    const qrImgX = qrBoxX + (QR_BOX_W - QR_SIZE) / 2;
    const qrImgY = startTotY + (qrBoxH - QR_SIZE - 10) / 2;
    doc.image(qrBuffer, qrImgX, qrImgY, { width: QR_SIZE, height: QR_SIZE });
    doc.fillColor(C.gray).font('Helvetica').fontSize(6)
       .text('Escanear para verificar', qrBoxX, qrImgY + QR_SIZE + 3, {
         width: QR_BOX_W, align: 'center',
       });

    // y avanza al mayor entre totales y caja QR
    y = startTotY + Math.max(ty - startTotY, qrBoxH) + 10;

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 7 – FIRMA (izq) | REPRESENTACIÓN (der)
    // ══════════════════════════════════════════════════════════════
    const pieH = 68;
    const TW2  = (INNER - 6) / 2;
    const xP2  = MAR + TW2 + 6;

    box(doc, MAR, y, TW2, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });
    box(doc, xP2, y, TW2, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });

    hline(doc, MAR + 16, y + 48, TW2 - 32, C.black, 0.8);
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(8)
       .text(empresa.nombre, MAR + 8, y + 52, { width: TW2 - 16, align: 'center' });
    doc.fillColor(C.gray).font('Helvetica').fontSize(7)
       .text('Firma y Sello Autorizado', MAR + 8, y + 63, { width: TW2 - 16, align: 'center' });

    doc.fillColor(C.gray).font('Helvetica').fontSize(7.5)
       .text('Representación impresa de', xP2 + 8, y + 10, { width: TW2 - 16, align: 'center' });
    doc.fillColor(C.yellow).font('Helvetica-Bold').fontSize(10)
       .text(tipoDoc.toUpperCase(), xP2 + 8, y + 24, { width: TW2 - 16, align: 'center' });
    doc.fillColor(C.black).font('Helvetica-Bold').fontSize(8)
       .text(`N° ${docRef}`, xP2 + 8, y + 40, { width: TW2 - 16, align: 'center' });
    doc.fillColor(C.gray).font('Helvetica').fontSize(7)
       .text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, xP2 + 8, y + 52, {
         width: TW2 - 16, align: 'center',
       })
       .text(`Estado: ${entity.status}`, xP2 + 8, y + 62, {
         width: TW2 - 16, align: 'center',
       });

    // Línea final amarilla
    y += pieH + 10;
    doc.rect(MAR, y, INNER, 3).fill(C.yellow);

    doc.end();
  });
}