/* Port de src/guitarraia/visualization.py: dibuja el mástil en SVG
   con la misma geometría que la figura Plotly original. */
'use strict';

const COLOR_MASTIL = '#c4a574';
const COLOR_PUNTOS = '#e8dcc8';
const COLOR_CEJUELA = '#f5f0e6';
const COLOR_TRASTE = '#9a9a9a';
const COLOR_CUERDA = '#d4cfc4';
const TRASTES_INCRUSTACION = [3, 5, 7, 9, 12, 15, 17, 19];
const TRASTES_PUNTO_DOBLE = [12];
const GROSORES_CUERDA = [3.6, 3.1, 2.6, 2.1, 1.6, 1.2];

const FIG_W = 1000, FIG_H = 420;
const MARGIN = { l: 80, r: 40, t: 60, b: 50 };
const SVGNS = 'http://www.w3.org/2000/svg';

// Posición vertical de cada cuerda: la 1ª (índice más alto) arriba y la 6ª abajo
const yInv = (cuerda, _total) => cuerda;

function el(tag, attrs = {}, parent = null) {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

/**
 * visualizarMastil(matriz, notasMarcadas, ini, fin, titulo, cuerdasSel, noteColorMap)
 * Devuelve un elemento <svg>.
 */
function visualizarMastil(matriz, notas, ini = 0, fin = 19, titulo = 'Mapa del Mástil de Guitarra', _cuerdasSel = null, noteColorMap = null, opciones = {}) {
  const total = matriz.numCuerdas;
  const pw = FIG_W - MARGIN.l - MARGIN.r;
  const ph = FIG_H - MARGIN.t - MARGIN.b;
  const xr0 = ini - 0.55, xr1 = fin + 0.55;
  // eje Y invertido: rango [total-0.5 (abajo), -0.5 (arriba)]
  const X = (x) => MARGIN.l + ((x - xr0) / (xr1 - xr0)) * pw;
  const Y = (y) => MARGIN.t + ((total - 0.5 - y) / total) * ph;
  const sx = pw / (xr1 - xr0);

  const svg = el('svg', { viewBox: `0 0 ${FIG_W} ${FIG_H}`, xmlns: SVGNS, class: 'fretboard-svg', role: 'img', 'aria-label': titulo });
  el('rect', { x: 0, y: 0, width: FIG_W, height: FIG_H, fill: '#1a1410' }, svg);
  el('rect', { x: MARGIN.l, y: MARGIN.t, width: pw, height: ph, fill: '#2b2118' }, svg);

  const defs = el('defs', {}, svg);
  const clip = el('clipPath', { id: 'plotclip' }, defs);
  el('rect', { x: MARGIN.l, y: MARGIN.t, width: pw, height: ph }, clip);
  const g = el('g', { 'clip-path': 'url(#plotclip)' }, svg);

  // Madera del mástil
  const yMin = -0.45, yMax = total - 0.55;
  el('rect', { x: X(ini - 0.5), y: Y(yMax), width: X(fin + 0.5) - X(ini - 0.5), height: Y(yMin) - Y(yMax), fill: COLOR_MASTIL }, g);

  // Incrustaciones (centradas entre trastes)
  for (const t of TRASTES_INCRUSTACION) {
    if (t < ini || t > fin) continue;
    const xp = t - 0.5;
    const ys = TRASTES_PUNTO_DOBLE.includes(t) ? [total - 1 - 1, total - 1 - 3] : [total - 1 - Math.floor((total - 1) / 2)];
    for (const y of ys) el('circle', { cx: X(xp), cy: Y(y), r: 7, fill: COLOR_PUNTOS }, g);
  }

  // Trastes
  for (let t = ini; t <= fin; t++) {
    el('line', {
      x1: X(t), x2: X(t), y1: Y(yInv(0, total)), y2: Y(yInv(total - 1, total)),
      stroke: t === 0 ? COLOR_CEJUELA : COLOR_TRASTE, 'stroke-width': t === 0 ? 5 : 1.5,
    }, g);
  }

  // Cuerdas
  for (let c = 0; c < total; c++) {
    const y = Y(yInv(c, total));
    el('line', { x1: X(ini), x2: X(fin), y1: y, y2: y, stroke: COLOR_CUERDA, 'stroke-width': GROSORES_CUERDA[c] ?? 2 }, g);
  }

  // Notas
  const leyenda = [];
  const dibujarNota = (n, color) => {
    const cx = X(n.traste - 0.5), cy = Y(yInv(n.cuerda, total));
    const grp = el('g', {
      class: 'nota',
      'data-titulo': n.nota_nombre_completo,
      'data-info': `Cuerda: ${total - n.cuerda}ª | Traste: ${n.traste - 0.5}`,
      'data-tipo': n.tipo,
    }, g);
    el('circle', { cx, cy, r: 11, fill: color, stroke: '#1a1410', 'stroke-width': 2 }, grp);
    const tx = el('text', {
      x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': 10, 'font-family': 'Arial Black, Arial, sans-serif', 'font-weight': 900, fill: 'white',
    }, grp);
    tx.textContent = n.nota_nombre;
  };

  if (notas && notas.length) {
    if (noteColorMap) {
      notas.forEach((n) => dibujarNota(n, noteColorMap[(n.nota_nombre || 'C')[0].toUpperCase()] || '#888888'));
      leyenda.push({ nombre: 'Notas', color: noteColorMap[(notas[0].nota_nombre || 'C')[0].toUpperCase()] || '#888888' });
    } else {
      const tipos = [...new Set(notas.map((n) => n.tipo))];
      for (const tipo of tipos) {
        const nt = notas.filter((n) => n.tipo === tipo);
        nt.forEach((n) => dibujarNota(n, nt[0].color));
        leyenda.push({ nombre: tipo[0].toUpperCase() + tipo.slice(1), color: nt[0].color });
      }
    }
  }

  // Cuerdas no tocadas (Acordes Full): ✕ en el primer hueco visible
  for (const c of opciones.mudas || []) {
    const t = el('text', {
      x: X(ini - 0.5), y: Y(yInv(c, total)), 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': 18, 'font-weight': 900, 'font-family': 'Arial, sans-serif', fill: '#ff4d4d',
    }, g);
    t.textContent = '✕';
  }

  // Ejes: ticks X
  const axisFont = { fill: '#f3eee6', 'font-family': 'Inter, Arial, sans-serif', 'font-size': 12 };
  const step = sx < 18 ? 2 : 1;
  for (let t = ini; t <= fin; t += step) {
    const tx = el('text', { ...axisFont, x: X(t - 0.5), y: MARGIN.t + ph + 18, 'text-anchor': 'middle' }, svg);
    tx.textContent = t;
  }
  // Ticks Y: etiquetas de cuerdas (1ª arriba)
  for (let i = 0; i < total; i++) {
    const label = total === NUM_CUERDAS ? `${total - i}ª ${midiANota(matriz.afinacion[i])}` : `${total - i}ª`;
    const ty = el('text', { ...axisFont, x: MARGIN.l - 8, y: Y(yInv(i, total)), 'text-anchor': 'end', 'dominant-baseline': 'central' }, svg);
    ty.textContent = label;
  }
  const xt = el('text', { ...axisFont, 'font-size': 14, x: MARGIN.l + pw / 2, y: FIG_H - 8, 'text-anchor': 'middle' }, svg);
  xt.textContent = 'Traste';
  const yt = el('text', { ...axisFont, 'font-size': 14, x: 18, y: MARGIN.t + ph / 2, 'text-anchor': 'middle', transform: `rotate(-90 18 ${MARGIN.t + ph / 2})` }, svg);
  yt.textContent = 'Cuerda';
  const tt = el('text', { ...axisFont, 'font-size': 17, x: MARGIN.l, y: 34 }, svg);
  tt.textContent = titulo;

  // Leyenda (esquina superior derecha, como Plotly)
  if (leyenda.length > 3) {
    // Fila horizontal bajo el título (p. ej. los 7 grados de Tercera-Full)
    const iw = Math.min(100, (pw - 10) / leyenda.length);
    leyenda.forEach((it, i) => {
      const lx = MARGIN.l + 10 + i * iw, ly = 50;
      el('circle', { cx: lx + 6, cy: ly, r: 6, fill: it.color, stroke: '#1a1410', 'stroke-width': 1 }, svg);
      const t = el('text', { ...axisFont, 'font-size': 11, x: lx + 16, y: ly, 'dominant-baseline': 'central' }, svg);
      t.textContent = it.nombre;
    });
  } else if (leyenda.length) {
    const lw = 120, lh = 10 + leyenda.length * 20;
    const lx = FIG_W - MARGIN.r - lw, ly = 8;
    el('rect', { x: lx, y: ly, width: lw, height: lh, fill: '#2b2118', stroke: '#c4a574', 'stroke-width': 1 }, svg);
    leyenda.forEach((it, i) => {
      el('circle', { cx: lx + 16, cy: ly + 15 + i * 20, r: 6, fill: it.color, stroke: '#1a1410', 'stroke-width': 1 }, svg);
      const t = el('text', { ...axisFont, x: lx + 30, y: ly + 15 + i * 20, 'dominant-baseline': 'central' }, svg);
      t.textContent = it.nombre;
    });
  }
  return svg;
}
