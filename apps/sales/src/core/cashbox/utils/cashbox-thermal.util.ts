/* eslint-disable @typescript-eslint/no-var-requires */
const PDFDocument = require('pdfkit');

export interface CashboxResumen {
  totalVentas:    number;
  totalMonto:     number;
  ticketPromedio: number;
  gananciaBruta:  number;
  cantProductos:  number;
  montoInicial:   number;
  dineroEnCaja:   number;
  saldoVirtual:   number;
  ventasPorHora:  { hora: string; total: number }[];
}

const PAGE_W  = 226;   // 80mm en puntos aprox.
const MARGIN  = 10;
const INNER_W = PAGE_W - MARGIN * 2;

function calcHeight(r: CashboxResumen): number {
  // cabecera + KPIs + tabla horas + footer
  return 60 + 30 + 10 + (7 * 20) + 10 + 20 + (r.ventasPorHora.length * 13) + 60;
}

function fmt(n: number): string {
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function now(): string {
  return new Date().toLocaleString('es-PE', {
    timeZone:     'America/Lima',
    day:   '2-digit', month: '2-digit', year: 'numeric',
    hour:  '2-digit', minute: '2-digit',
  });
}

export function buildCashboxThermalPdf(resumen: CashboxResumen): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size:    [PAGE_W, calcHeight(resumen)],
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    });

    const chunks: Buffer[] = [];
    doc.on('data',  (c: Buffer) => chunks.push(c));
    doc.on('end',   ()          => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const bold    = 'Helvetica-Bold';
    const regular = 'Helvetica';

    let y = MARGIN;

    // ── Cabecera ─────────────────────────────────────────────────────
    doc.font(bold).fontSize(9).text('RESUMEN DE CAJA', MARGIN, y, { width: INNER_W, align: 'center' });
    y += 12;
    doc.font(regular).fontSize(7).text(now(), MARGIN, y, { width: INNER_W, align: 'center' });
    y += 10;

    // ── Separador ────────────────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).dash(2, { space: 2 }).stroke(); y += 8;
    doc.undash();

    // ── KPIs principales ─────────────────────────────────────────────
    const kpis: [string, string][] = [
      ['Monto inicial',    `S/ ${fmt(resumen.montoInicial)}`],
      ['Total ventas',     String(resumen.totalVentas)],
      ['Total ingresos',   `S/ ${fmt(resumen.totalMonto)}`],
      ['Ticket promedio',  `S/ ${fmt(resumen.ticketPromedio)}`],
      ['Ganancia bruta',   `S/ ${fmt(resumen.gananciaBruta)}`],
      ['Cant. productos',  String(resumen.cantProductos)],
    ];

    for (const [label, value] of kpis) {
      doc.font(regular).fontSize(7).text(label, MARGIN, y, { width: INNER_W * 0.6, lineBreak: false });
      doc.font(bold).fontSize(7).text(value, MARGIN + INNER_W * 0.6, y, { width: INNER_W * 0.4, align: 'right', lineBreak: false });
      y += 13;
    }

    // ── Separador ────────────────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).dash(2, { space: 2 }).stroke(); y += 8;
    doc.undash();

    // ── Dinero en caja y saldo virtual ───────────────────────────────
    doc.font(bold).fontSize(8).text('DINERO EN CAJA:', MARGIN, y, { lineBreak: false });
    doc.font(bold).fontSize(8).text(`S/ ${fmt(resumen.dineroEnCaja)}`, MARGIN, y, { width: INNER_W, align: 'right', lineBreak: false });
    y += 14;
    doc.font(regular).fontSize(7).text('Saldo virtual (transferencias):', MARGIN, y, { lineBreak: false });
    doc.font(bold).fontSize(7).text(`S/ ${fmt(resumen.saldoVirtual)}`, MARGIN, y, { width: INNER_W, align: 'right', lineBreak: false });
    y += 10;

    // ── Separador ────────────────────────────────────────────────────
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).dash(2, { space: 2 }).stroke(); y += 8;
    doc.undash();

    // ── Ventas por hora ───────────────────────────────────────────────
    doc.font(bold).fontSize(7).text('VENTAS POR HORA', MARGIN, y, { width: INNER_W, align: 'center' });
    y += 11;

    // encabezado tabla
    doc.font(bold).fontSize(6.5)
      .text('Hora', MARGIN, y, { width: 40, lineBreak: false })
      .text('Monto', MARGIN + 40, y, { width: INNER_W - 40, align: 'right', lineBreak: false });
    y += 10;

    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(0.5).stroke(); y += 4;

    // filas solo con ventas > 0 (o todas si quieres)
    const filas = resumen.ventasPorHora.filter(v => v.total > 0);
    if (filas.length === 0) {
      doc.font(regular).fontSize(6.5).text('Sin movimientos registrados', MARGIN, y, { width: INNER_W, align: 'center' });
      y += 12;
    } else {
      for (const fila of filas) {
        doc.font(regular).fontSize(6.5)
          .text(fila.hora, MARGIN, y, { width: 40, lineBreak: false })
          .text(`S/ ${fmt(fila.total)}`, MARGIN + 40, y, { width: INNER_W - 40, align: 'right', lineBreak: false });
        y += 11;
      }
    }

    // ── Footer ────────────────────────────────────────────────────────
    y += 4;
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).dash(2, { space: 2 }).stroke(); y += 8;
    doc.undash();
    doc.font(regular).fontSize(6).text('MKapu Import — Sistema de Gestión', MARGIN, y, { width: INNER_W, align: 'center' });

    doc.end();
  });
}