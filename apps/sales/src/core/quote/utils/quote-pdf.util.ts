/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as QRCode from 'qrcode';
import axios from 'axios';

const C = {
  yellow: '#F6AF33',
  black: '#1A1A1A',
  gray: '#555555',
  lgray: '#F4F4F4',
  white: '#FFFFFF',
  border: '#CCCCCC',
  rowAlt: '#FFFBF4',
  darkBg: '#2B2B2B',
};

const PW = 595.28;
const MAR = 28;
const INNER = PW - MAR * 2;

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface EmpresaPdfData {
  razon_social: string;
  nombre_comercial?: string | null;
  ruc: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  logo_url?: string | null;
  sitio_web?: string | null;
  banco?: string | null;
}

export interface QuotePdfData {
  id_cotizacion: number;
  codigo?: string | null;
  tipo?: string | null;           // 'VENTA' | 'COMPRA'
  fec_emision: string | Date;
  fec_venc: string | Date;
  estado: string;
  subtotal: number;
  igv: number;
  total: number;
  observacion?: string | null;

  cliente?: {
    razon_social?: string | null;
    nombre_cliente?: string | null;
    apellidos_cliente?: string | null;
    valor_doc?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
  } | null;

  proveedor?: {
    id?: string | null;
    razon_social?: string | null;
    ruc?: string | null;
    contacto?: string | null;
    email?: string | null;
    telefono?: string | null;
  } | null;

  detalles: {
    cod_prod?: string | null;
    descripcion?: string | null;
    cantidad: number;
    precio: number;
  }[];
}

// ── Helpers ──────────────────────────────────────────────────────────

function box(
  doc: any,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { fill?: string; stroke?: string; radius?: number } = {},
): void {
  const r = opts.radius ?? 0;
  if (opts.fill) {
    r > 0
      ? doc.roundedRect(x, y, w, h, r).fill(opts.fill)
      : doc.rect(x, y, w, h).fill(opts.fill);
  }
  if (opts.stroke) {
    r > 0
      ? doc.roundedRect(x, y, w, h, r).stroke(opts.stroke)
      : doc.rect(x, y, w, h).stroke(opts.stroke);
  }
}

function hline(
  doc: any,
  x: number,
  y: number,
  w: number,
  color = C.border,
  lw = 0.5,
): void {
  doc
    .save()
    .strokeColor(color)
    .lineWidth(lw)
    .moveTo(x, y)
    .lineTo(x + w, y)
    .stroke()
    .restore();
}

function vline(
  doc: any,
  x: number,
  y1: number,
  y2: number,
  color = C.border,
  lw = 0.5,
): void {
  doc
    .save()
    .strokeColor(color)
    .lineWidth(lw)
    .moveTo(x, y1)
    .lineTo(x, y2)
    .stroke()
    .restore();
}

function labelCell(doc: any, text: string, x: number, y: number, w = 90): void {
  doc
    .fillColor(C.gray)
    .font('Helvetica')
    .fontSize(7.5)
    .text(text, x, y, { width: w });
}

function valueCell(
  doc: any,
  text: string,
  x: number,
  y: number,
  w = 140,
): void {
  doc
    .fillColor(C.black)
    .font('Helvetica')
    .fontSize(8)
    .text(text, x, y, { width: w, ellipsis: true });
}

// ── Logo desde URL (igual que Sales Receipt) ─────────────────────────

async function loadImageBuffer(url: string): Promise<Buffer | null> {
  if (!url?.trim()) return null;
  try {
    const response = await axios.get<ArrayBuffer>(url.trim(), {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'image/jpeg,image/png,image/*',
      },
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
    case 'APROBADA':
      return '#27AE60';
    case 'VENCIDA':
      return '#C0392B';
    case 'RECHAZADA':
      return '#E67E22';
    default:
      return C.gray;
  }
}

// ════════════════════════════════════════════════════════════════════
//  FUNCIÓN PRINCIPAL — recibe quote y empresa por separado
// ════════════════════════════════════════════════════════════════════
export async function buildQuotePdf(
  quote: QuotePdfData & { empresa?: Partial<EmpresaPdfData> & Record<string, any> },
  empresaArg?: EmpresaPdfData,
): Promise<Buffer> {
  const empresa: EmpresaPdfData = empresaArg ?? {
    razon_social: quote.empresa?.razon_social ?? 'MKAPU IMPORT S.A.C.',
    nombre_comercial: quote.empresa?.nombre_comercial ?? null,
    ruc: quote.empresa?.ruc ?? '20613016946',
    direccion: quote.empresa?.direccion ?? 'AV. LAS FLORES DE LA PRIMAVERA NRO. 1838',
    ciudad: quote.empresa?.ciudad ?? 'San Juan de Lurigancho - Lima - Perú',
    telefono: quote.empresa?.telefono ?? '903019610',
    email: quote.empresa?.email ?? 'mkapu@gmail.com',
    logo_url: quote.empresa?.logo_url ?? null,
    sitio_web: quote.empresa?.sitio_web ?? quote.empresa?.web ?? null,
    banco: quote.empresa?.banco ?? null,
  };
  // shadowing para el resto de la función
  return _buildQuotePdfInner(quote, empresa);
}

async function _buildQuotePdfInner(
  quote: QuotePdfData,
  empresa: EmpresaPdfData,
): Promise<Buffer> {
  const PDFDocument = require('pdfkit');
  const chunks: Buffer[] = [];

  const esCompra = (quote.tipo ?? 'VENTA').toUpperCase() === 'COMPRA';
  const cl   = quote.cliente;
  const prov = quote.proveedor;
  const codigo =
    quote.codigo ?? `COT-${String(quote.id_cotizacion).padStart(8, '0')}`;

  // Nombre y campos del participante según tipo
  const nombreParticipante = esCompra
    ? (prov?.razon_social ?? 'Proveedor')
    : (cl?.razon_social ||
       `${cl?.nombre_cliente ?? ''} ${cl?.apellidos_cliente ?? ''}`.trim() ||
       'Cliente');

  const labelParticipante    = esCompra ? 'PROVEEDOR' : 'CLIENTE';
  const participanteDocLabel = esCompra ? 'RUC'       : 'Doc';
  const participanteDoc      = esCompra ? (prov?.ruc       ?? null) : (cl?.valor_doc  ?? null);
  const participanteTel      = esCompra ? (prov?.telefono  ?? null) : (cl?.telefono   ?? null);
  const participanteEmail    = esCompra ? (prov?.email     ?? null) : (cl?.email      ?? null);
  const participanteDir      = esCompra ? (prov?.contacto  ?? null) : (cl?.direccion  ?? null);

  const nombreEmpresa =
    empresa.nombre_comercial?.trim() || empresa.razon_social;

  // Pre-cargar logo desde URL ANTES del Promise síncrono
  let logoBuffer: Buffer | null = null;
  if (empresa.logo_url?.trim()) {
    logoBuffer = await loadImageBuffer(empresa.logo_url.trim());
  }

  // QR
  const qrContent = [
    `EMPRESA: ${nombreEmpresa}`,
    `RUC: ${empresa.ruc}`,
    `COTIZACIÓN: ${codigo}`,
    `FECHA: ${new Date(quote.fec_emision).toLocaleDateString('es-PE')}`,
    `VENCE: ${new Date(quote.fec_venc).toLocaleDateString('es-PE')}`,
    `TOTAL: S/ ${Number(quote.total).toFixed(2)}`,
    `ESTADO: ${quote.estado}`,
  ].join(' | ');

  const qrDataUrl = await QRCode.toDataURL(qrContent, {
    width: 120,
    margin: 1,
    color: { dark: C.black, light: C.white },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const detalles = quote.detalles ?? [];

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: MAR, size: 'A4', bufferPages: true });
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 1 – CABECERA
    // ══════════════════════════════════════════════════════════════
    const HDR_H = 88;
    const LW = 180;
    const RW = INNER - LW - 8;
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
        doc
          .fillColor(C.yellow)
          .font('Helvetica-Bold')
          .fontSize(22)
          .text(nombreEmpresa, MAR + 10, 18, { width: LW - 16 });
      }
    } else {
      doc
        .fillColor(C.yellow)
        .font('Helvetica-Bold')
        .fontSize(22)
        .text(nombreEmpresa, MAR + 10, 18, { width: LW - 16 });
    }

    // Pill tipo doc
    const pillY = 10;
    box(doc, xRight, pillY, RW, 26, { fill: C.yellow, radius: 4 });
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('COTIZACIÓN', xRight, pillY + 7, { width: RW, align: 'center' });

    // Caja RUC
    const rucY = pillY + 32;
    box(doc, xRight, rucY, RW, 20, { stroke: C.yellow, radius: 3 });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(`RUC ${empresa.ruc}`, xRight, rucY + 6, {
        width: RW,
        align: 'center',
      });

    // Caja N° cotización
    const numY = rucY + 26;
    box(doc, xRight, numY, RW, 20, { stroke: C.yellow, radius: 3 });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(codigo, xRight, numY + 6, { width: RW, align: 'center' });

    // Badge estado en cabecera
    const badgeY = numY + 26;
    box(doc, xRight, badgeY, RW, 18, {
      fill: estadoColor(quote.estado),
      radius: 3,
    });
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(quote.estado ?? 'PENDIENTE', xRight, badgeY + 5, {
        width: RW,
        align: 'center',
      });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 2 – DATOS EMPRESA
    // ══════════════════════════════════════════════════════════════
    let y = HDR_H + 4;
    const EH = 66;
    box(doc, MAR, y, INNER, EH, { fill: C.lgray, radius: 3 });
    box(doc, MAR, y, INNER, EH, { stroke: C.border, radius: 3 });

    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .text(nombreEmpresa, MAR + 10, y + 7, { width: INNER - 20 });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7.5)
      .text(`DIRECCIÓN FISCAL: ${empresa.direccion}`, MAR + 10, y + 21, {
        width: INNER - 20,
        lineBreak: true,
        lineGap: 1,
      });
    const afterDir = (doc as any).y;
    doc.text(empresa.ciudad, MAR + 10, afterDir + 1, { width: INNER - 20 });
    const afterCity = (doc as any).y;

    const contactoLinea = [
      `TELÉFONO: ${empresa.telefono}`,
      `EMAIL: ${empresa.email}`,
      empresa.sitio_web ? `WEB: ${empresa.sitio_web}` : null,
    ]
      .filter(Boolean)
      .join('   ');
    doc.text(contactoLinea, MAR + 10, afterCity + 1, { width: INNER - 20 });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 3 – CLIENTE (60%) | FECHAS (40%)
    // ══════════════════════════════════════════════════════════════
    y += EH + 6;
    const B3H = 96;
    const CLW = INNER * 0.58;
    const FEW = INNER - CLW - 6;
    const xFec = MAR + CLW + 6;

    // Caja participante (CLIENTE o PROVEEDOR según tipo)
    box(doc, MAR, y, CLW, B3H, { stroke: C.border, radius: 3 });
    box(doc, MAR, y, CLW, 16, { fill: C.yellow, radius: 3 });
    doc.rect(MAR, y + 8, CLW, 8).fill(C.yellow);
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text(labelParticipante, MAR + 8, y + 4, { width: CLW - 16 });

    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text(nombreParticipante, MAR + 8, y + 22, { width: CLW - 16 });
    if (participanteDoc)
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(C.black)
        .text(`${participanteDocLabel}: ${participanteDoc}`, MAR + 8, y + 36, { width: CLW - 16 });
    if (participanteTel)
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(C.gray)
        .text(`Tel: ${participanteTel}`, MAR + 8, y + 48, { width: CLW - 16 });
    if (participanteEmail)
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(C.gray)
        .text(`Email: ${participanteEmail}`, MAR + 8, y + 58, {
          width: CLW - 16,
          ellipsis: true,
        });
    if (participanteDir)
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(C.gray)
        .text(participanteDir, MAR + 8, y + 68, {
          width: CLW - 16,
          ellipsis: true,
        });

    // Caja fechas
    box(doc, xFec, y, FEW, B3H, { stroke: C.border, radius: 3 });
    box(doc, xFec, y, FEW, 16, { fill: C.yellow, radius: 3 });
    doc.rect(xFec, y + 8, FEW, 8).fill(C.yellow);
    doc
      .fillColor(C.white)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('FECHAS', xFec + 8, y + 4);

    const fechaRows: [string, string][] = [
      [
        'Emisión:',
        new Date(quote.fec_emision).toLocaleDateString('es-PE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
      ],
      ['Válido hasta:', new Date(quote.fec_venc).toLocaleDateString('es-PE')],
    ];
    fechaRows.forEach(([lbl, val], i) => {
      const ry = y + 22 + i * 28;
      labelCell(doc, lbl, xFec + 8, ry, 62);
      valueCell(doc, val, xFec + 72, ry, FEW - 80);
      if (i < fechaRows.length - 1) hline(doc, xFec + 6, ry + 20, FEW - 12);
    });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 4 – CONDICIONES DE PAGO (izq) | BANCO (der)
    // ══════════════════════════════════════════════════════════════
    y += B3H + 6;
    const B4H = 50;
    const HW = (INNER - 6) / 2;
    const xB4R = MAR + HW + 6;

    box(doc, MAR, y, HW, B4H, { stroke: C.border, radius: 3 });
    box(doc, MAR, y, HW, 16, { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 8, HW, 8).fill(C.darkBg);
    doc
      .fillColor(C.yellow)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('CONDICIONES DE PAGO', MAR + 8, y + 4);

    const condRows: [string, string][] = [
      ['Forma de pago:', 'Transferencia / Depósito bancario'],
      [
        'Validez oferta:',
        `Hasta ${new Date(quote.fec_venc).toLocaleDateString('es-PE')}`,
      ],
    ];
    condRows.forEach(([lbl, val], i) => {
      const ry = y + 22 + i * 14;
      labelCell(doc, lbl, MAR + 8, ry, 82);
      valueCell(doc, val, MAR + 94, ry, HW - 102);
    });

    box(doc, xB4R, y, HW, B4H, { stroke: C.border, radius: 3 });
    box(doc, xB4R, y, HW, 16, { fill: C.darkBg, radius: 3 });
    doc.rect(xB4R, y + 8, HW, 8).fill(C.darkBg);
    doc
      .fillColor(C.yellow)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('DATOS BANCARIOS', xB4R + 8, y + 4);

    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7.5)
      .text('Banco / Cuenta:', xB4R + 8, y + 22);
    doc
      .fillColor(C.black)
      .font('Helvetica')
      .fontSize(8)
      .text(empresa.banco ?? '—', xB4R + 8, y + 34, { width: HW - 16 });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 5 – TABLA DE PRODUCTOS
    // ══════════════════════════════════════════════════════════════
    y += B4H + 8;

    const COLS = [28, 70, 196, 40, 60, 70];
    const HEADS = ['N°', 'CÓDIGO', 'DESCRIPCIÓN', 'CANT.', 'P. UNIT.', 'IMPORTE'];
    const TH = 18;

    box(doc, MAR, y, INNER, TH, { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 6, INNER, 12).fill(C.darkBg);

    let xc = MAR + 4;
    HEADS.forEach((h, i) => {
      const align = i >= 3 ? 'right' : i === 0 ? 'center' : 'left';
      doc
        .fillColor(C.yellow)
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(h, xc, y + 5, { width: COLS[i] - 4, align });
      xc += COLS[i];
    });

    const tableStartY = y;
    y += TH;

    const rows =
      detalles.length > 0
        ? detalles
        : [{ cod_prod: '—', descripcion: 'Sin productos registrados', cantidad: 0, precio: 0 }];

    rows.forEach((det, idx) => {
      const rh = 20;
      const importe = Number(det.cantidad ?? 0) * Number(det.precio ?? 0);

      box(doc, MAR, y, INNER, rh, { fill: idx % 2 === 0 ? C.rowAlt : C.white });
      hline(doc, MAR, y + rh, INNER, C.border, 0.4);

      let xs = MAR;
      COLS.forEach((cw, ci) => {
        xs += cw;
        if (ci < COLS.length - 1) vline(doc, xs, y, y + rh, C.border, 0.3);
      });

      const cells = [
        String(idx + 1),
        det.cod_prod ?? '—',
        det.descripcion ?? '—',
        String(det.cantidad ?? 0),
        `S/ ${Number(det.precio ?? 0).toFixed(2)}`,
        `S/ ${importe.toFixed(2)}`,
      ];

      xc = MAR + 4;
      cells.forEach((cell, i) => {
        const align = i >= 3 ? 'right' : i === 0 ? 'center' : 'left';
        doc
          .fillColor(C.black)
          .font('Helvetica')
          .fontSize(7.8)
          .text(cell, xc, y + 6, { width: COLS[i] - 6, align, ellipsis: true });
        xc += COLS[i];
      });
      y += rh;
    });

    box(doc, MAR, tableStartY, INNER, y - tableStartY, {
      stroke: C.border,
      radius: 3,
    });

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 6 – TOTALES (izq) | QR (der)
    // ══════════════════════════════════════════════════════════════
    y += 10;

    const QR_SIZE = 80;
    const QR_PAD = 16;
    const QR_MIN_H = QR_SIZE + QR_PAD * 2; // 112px mínimo
    const QR_BOX_W = QR_SIZE + 24;

    const totW = INNER - QR_BOX_W - 6;
    const totX = MAR;
    const qrBoxX = MAR + totW + 6;

    const totales: [string, string, boolean][] = [
      ['Subtotal:', `S/ ${Number(quote.subtotal).toFixed(2)}`, false],
      ['IGV (18%):', `S/ ${Number(quote.igv).toFixed(2)}`, false],
      ['TOTAL:', `S/ ${Number(quote.total).toFixed(2)}`, true],
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
      const fc = highlight ? C.white : C.black;
      const font = highlight ? 'Helvetica-Bold' : 'Helvetica';
      doc
        .fillColor(fc)
        .font(font)
        .fontSize(highlight ? 10 : 8.5)
        .text(lbl, totX + 8, ty + (highlight ? 6 : 4), { width: totW / 2 - 10 })
        .text(val, totX + totW / 2, ty + (highlight ? 6 : 4), {
          width: totW / 2 - 10,
          align: 'right',
        });
      ty += rh;
    });

    box(doc, totX, startTotY, totW, ty - startTotY, {
      stroke: C.border,
      radius: 3,
    });

    // Caja QR con altura mínima garantizada
    const qrBoxH = Math.max(ty - startTotY, QR_MIN_H);
    box(doc, qrBoxX, startTotY, QR_BOX_W, qrBoxH, {
      fill: C.lgray,
      stroke: C.border,
      radius: 3,
    });

    const qrImgX = qrBoxX + (QR_BOX_W - QR_SIZE) / 2;
    const qrImgY = startTotY + (qrBoxH - QR_SIZE - 10) / 2;
    doc.image(qrBuffer, qrImgX, qrImgY, { width: QR_SIZE, height: QR_SIZE });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(6)
      .text('Escanear para verificar', qrBoxX, qrImgY + QR_SIZE + 3, {
        width: QR_BOX_W,
        align: 'center',
      });

    y = startTotY + Math.max(ty - startTotY, qrBoxH) + 10;

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 7 – OBSERVACIONES (ancho completo)
    // ══════════════════════════════════════════════════════════════
    const obsH = 52;
    box(doc, MAR, y, INNER, obsH, { stroke: C.border, radius: 3 });
    box(doc, MAR, y, INNER, 16, { fill: C.darkBg, radius: 3 });
    doc.rect(MAR, y + 8, INNER, 8).fill(C.darkBg);
    doc
      .fillColor(C.yellow)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('OBSERVACIONES', MAR + 8, y + 4);
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(8)
      .text(
        quote.observacion ??
          'Precios incluyen IGV. Cotización válida hasta la fecha de vencimiento indicada.',
        MAR + 8,
        y + 22,
        { width: INNER - 16, lineBreak: true },
      );

    // ══════════════════════════════════════════════════════════════
    //  BLOQUE 8 – FIRMA (izq) | REPRESENTACIÓN (der)
    // ══════════════════════════════════════════════════════════════
    y += obsH + 10;
    const pieH = 68;
    const TW2 = (INNER - 6) / 2;
    const xP2 = MAR + TW2 + 6;

    box(doc, MAR, y, TW2, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });
    box(doc, xP2, y, TW2, pieH, { fill: C.lgray, stroke: C.border, radius: 3 });

    hline(doc, MAR + 16, y + 48, TW2 - 32, C.black, 0.8);
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(nombreEmpresa, MAR + 8, y + 52, { width: TW2 - 16, align: 'center' });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7)
      .text('Firma y Sello Autorizado', MAR + 8, y + 63, {
        width: TW2 - 16,
        align: 'center',
      });

    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7.5)
      .text('Documento generado por', xP2 + 8, y + 10, {
        width: TW2 - 16,
        align: 'center',
      });
    doc
      .fillColor(C.yellow)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('COTIZACIÓN', xP2 + 8, y + 22, { width: TW2 - 16, align: 'center' });
    doc
      .fillColor(C.black)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(codigo, xP2 + 8, y + 38, { width: TW2 - 16, align: 'center' });
    doc
      .fillColor(C.gray)
      .font('Helvetica')
      .fontSize(7)
      .text(
        `Generado: ${new Date().toLocaleDateString('es-PE')}`,
        xP2 + 8,
        y + 50,
        { width: TW2 - 16, align: 'center' },
      )
      .text(`Estado: ${quote.estado}`, xP2 + 8, y + 60, {
        width: TW2 - 16,
        align: 'center',
      });

    y += pieH + 10;
    doc.rect(MAR, y, INNER, 3).fill(C.yellow);

    doc.end();
  });
}