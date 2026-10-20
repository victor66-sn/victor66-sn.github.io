/* Port de app.py (UI Streamlit) a JS vanilla */
'use strict';

const PRESET_PERSONALIZADA = 'Personalizada';
const NOTE_COLOR_MAP = { C: '#FF0000', D: '#FFA500', E: '#FFFF00', F: '#008000', G: '#0000FF', A: '#4B0082', B: '#8A2BE2' };
const MODOS = ['Tríada', 'Escala', 'Acordes típicos', 'Acordes Full', 'Terceras', 'Tercera-Full', 'Sextas', 'Sexta-Full'];
const NOTAS_TERCERA_FULL = ['C', 'D', 'E', 'F', 'G', 'A', 'B']; // escalas disponibles en los CSV (terceras y sextas)
const esModoFull = (m) => m === 'Tercera-Full' || m === 'Sexta-Full';
const CUERDAS_NOMBRES = ['6ª', '5ª', '4ª', '3ª', '2ª', '1ª'];
const CUERDAS_MAP = {
  '1ra-2da': [5, 4], '2da-3ra': [4, 3], '3ra-4ta': [3, 2], '4ta-5ta': [2, 1], '5ta-6ta': [1, 0],
  '1ra-3ra': [5, 3], '2da-4ta': [4, 2], '3ra-5ta': [3, 1], '4ta-6ta': [2, 0],
};
const OPC_TERCERAS = ['1ra-2da', '2da-3ra', '3ra-4ta', '4ta-5ta', '5ta-6ta'];
const OPC_SEXTAS = ['1ra-3ra', '2da-4ta', '3ra-5ta', '4ta-6ta'];
const STORAGE_KEY = 'configuracion_guitarraia';

const $ = (id) => document.getElementById(id);
const state = {
  preset_selector: 'Estándar (EADGBE)',
  afinacion_notas: [...PRESETS_AFINACION['Estándar (EADGBE)'].notas],
  afinacion_octavas: [...PRESETS_AFINACION['Estándar (EADGBE)'].octavas],
  modo_vista: 'Tríada',
  nota_raiz: 'C',
  tipo: 'Mayor',
  cuerdas: '1ra-2da',
  traste_rango: [0, 5],
  pos_idx: 0,
};
let ultimoSVG = null;

function fillSelect(sel, opciones, valor) {
  sel.innerHTML = '';
  for (const o of opciones) sel.add(new Option(o, o));
  sel.value = opciones.includes(valor) ? valor : opciones[0];
  return sel.value;
}

/* ---------- Sidebar ---------- */
function construirSidebar() {
  const presets = [...Object.keys(PRESETS_AFINACION), ...Object.keys(PRESETS_POPULARES), PRESET_PERSONALIZADA];
  const sel = $('preset-selector');
  presets.forEach((p) => sel.add(new Option(p, p)));
  sel.value = state.preset_selector;
  sel.addEventListener('change', () => {
    state.preset_selector = sel.value;
    if (sel.value !== PRESET_PERSONALIZADA) {
      const p = PRESETS_AFINACION[sel.value];
      state.afinacion_notas = [...p.notas];
      state.afinacion_octavas = [...p.octavas];
    }
    sincronizarCuerdas();
    render();
  });

  const grid = $('cuerdas-grid');
  CUERDAS_NOMBRES.forEach((nombre, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    wrap.innerHTML = `<label for="cuerda_${i}">Cuerda ${nombre}</label><select id="cuerda_${i}"></select>`;
    grid.appendChild(wrap);
    const s = wrap.querySelector('select');
    NOTAS.forEach((n) => s.add(new Option(n, n)));
    s.addEventListener('change', () => { state.afinacion_notas[i] = s.value; render(); });
  });
  sincronizarCuerdas();
}

function sincronizarCuerdas() {
  // Los presets en bemol (Half Step Down) se muestran como su enarmónico en sostenido
  state.afinacion_notas.forEach((n, i) => { $(`cuerda_${i}`).value = normalizarNota(n); });
  $('preset-selector').value = state.preset_selector;
}

/* ---------- Búsqueda ---------- */
function construirBusqueda() {
  const cont = $('modo-vista');
  MODOS.forEach((m) => {
    const id = `modo-${m.replace(/\s/g, '-')}`;
    const lab = document.createElement('label');
    lab.className = 'radio';
    lab.innerHTML = `<input type="radio" name="modo" id="${id}" value="${m}"><span>${m}</span>`;
    cont.appendChild(lab);
    lab.querySelector('input').addEventListener('change', () => { state.modo_vista = m; actualizarTipo(); render(); });
  });

  fillSelect($('nota-raiz'), NOTAS, state.nota_raiz);
  $('nota-raiz').addEventListener('change', (e) => { state.nota_raiz = e.target.value; state.pos_idx = 0; render(); });
  $('tipo-seleccionado').addEventListener('change', (e) => { state.tipo = e.target.value; state.pos_idx = 0; render(); });
  $('btn-pos-prev').addEventListener('click', () => { state.pos_idx = Math.max(0, state.pos_idx - 1); render(); });
  $('btn-pos-next').addEventListener('click', () => { state.pos_idx += 1; render(); });
  $('cuerdas-intervalo').addEventListener('change', (e) => { state.cuerdas = e.target.value; render(); });

  const ini = $('traste-ini'), fin = $('traste-fin');
  const onRange = (src) => {
    let a = +ini.value, b = +fin.value;
    if (a > b) { if (src === ini) fin.value = b = a; else ini.value = a = b; }
    state.traste_rango = [a, b];
    render();
  };
  ini.addEventListener('input', () => onRange(ini));
  fin.addEventListener('input', () => onRange(fin));
  actualizarTipo();
}

function actualizarTipo() {
  document.querySelector(`input[name="modo"][value="${state.modo_vista}"]`).checked = true;
  const m = state.modo_vista;
  const cfg = {
    'Tríada': ['Tipo de Tríada', Object.keys(TRIADAS)],
    'Escala': ['Tipo de Escala', Object.keys(ESCALAS)],
    'Acordes típicos': ['Tipo de Acorde', Object.keys(ACORDES_TIPICOS)],
    'Acordes Full': ['Tipo de Acorde', Object.keys(ACORDES_FULL[state.nota_raiz] || ACORDES_FULL.C)],
    'Terceras': ['Tipo de Tercera', ['Mayor', 'Menor']],
    'Tercera-Full': ['Escala', ['Mayor', 'Menor']],
    'Sexta-Full': ['Escala', ['Mayor', 'Menor']],
    'Sextas': ['Tipo de Séxta', ['Mayor', 'Menor']],
  }[m];
  $('tipo-label').textContent = cfg[0];
  state.tipo = fillSelect($('tipo-seleccionado'), cfg[1], state.tipo);
  state.pos_idx = 0;
  $('rango-field').classList.toggle('hidden', m === 'Acordes Full' || esModoFull(m));
  // Tercera-Full / Sexta-Full solo tienen datos para escalas de raíz natural (C D E F G A B)
  state.nota_raiz = fillSelect($('nota-raiz'), esModoFull(m) ? NOTAS_TERCERA_FULL : NOTAS, state.nota_raiz);

  const esIntervalo = m === 'Terceras' || m === 'Sextas' || esModoFull(m);
  $('cuerdas-field').classList.toggle('hidden', !esIntervalo);
  if (esIntervalo) {
    const sexta = m === 'Sextas' || m === 'Sexta-Full';
    $('cuerdas-label').textContent = sexta ? 'Cuerdas para Séxta' : 'Cuerdas para Tercera';
    state.cuerdas = fillSelect($('cuerdas-intervalo'), sexta ? OPC_SEXTAS : OPC_TERCERAS, state.cuerdas);
  }
}

/* ---------- Render ---------- */
function render() {
  let [ini, fin] = state.traste_rango;
  $('traste-ini').value = ini; $('traste-fin').value = fin;
  $('rango-text').textContent = `${ini} – ${fin}`;
  $('range-fill').style.left = `${(ini / 19) * 100}%`;
  $('range-fill').style.width = `${((fin - ini) / 19) * 100}%`;

  const afinacionMidi = crearAfinacionDesdeNombres(state.afinacion_notas, state.afinacion_octavas);
  const mapper = new FretboardMapper(afinacionMidi);

  const info = mapper.obtenerInfoAfinacion();
  $('info-afinacion').innerHTML =
    `<div><b>Notas:</b>${info.afinacion_notas.map((n, i) => `<p>Cuerda ${6 - i}ª: ${n}</p>`).join('')}</div>` +
    `<div><b>Detalles:</b><p>- ${info.num_cuerdas} cuerdas</p><p>- ${info.num_trastes + 1} trastes (0-${info.num_trastes})</p></div>`;

  let resultados = [], tituloTipo = '', cuerdasSel = null, opcionesVis = {}, full = null, sinMapaNotas = false;
  $('posicion-nav').classList.add('hidden');
  const { nota_raiz: raiz, tipo } = state;
  $('error').classList.add('hidden');
  try {
    switch (state.modo_vista) {
      case 'Tríada':
        resultados = mapper.buscarTriadaEnSeccion(raiz, tipo, ini, fin);
        tituloTipo = `Tríada ${raiz} ${tipo}`; break;
      case 'Escala':
        resultados = mapper.buscarEscalaEnSeccion(raiz, tipo, ini, fin);
        tituloTipo = `Escala ${raiz} ${tipo}`; break;
      case 'Acordes típicos':
        resultados = mapper.buscarAcordeEnSeccion(raiz, tipo, ini, fin);
        tituloTipo = `Acorde ${raiz} ${tipo}`; break;
      case 'Acordes Full': {
        full = mapper.buscarAcordeFull(raiz, tipo, state.pos_idx);
        state.pos_idx = full.indice;
        resultados = full.notas;
        // Ventana de trastes que contiene la digitación (mínimo 5 trastes)
        const usados = full.trastes.filter((t) => t !== null);
        const mx = Math.max(...usados), pisados = usados.filter((t) => t > 0);
        ini = mx <= 5 || !pisados.length ? 0 : Math.min(...pisados) - 1;
        fin = Math.min(mapper.numTrastes, Math.max(ini + 4, mx));
        if (fin - ini < 4) ini = Math.max(0, fin - 4);
        opcionesVis = { mudas: full.trastes.map((t, k) => (t === null ? 5 - k : -1)).filter((c) => c >= 0) };
        tituloTipo = `Acorde Full ${raiz} ${tipo}`;
        $('posicion-nav').classList.remove('hidden');
        $('posicion-texto').textContent = `Posición ${full.posicion} / ${full.total}`;
        $('posicion-detalle').textContent = `${full.descripcion || ''} · notación ${full.notacion}`;
        $('btn-pos-prev').disabled = full.indice === 0;
        $('btn-pos-next').disabled = full.indice === full.total - 1;
        break;
      }
      case 'Tercera-Full':
      case 'Sexta-Full': {
        // Escala (CSV) + par de cuerdas: todos los grados como terceras/sextas en todo el mástil
        const [aguda, grave] = CUERDAS_MAP[state.cuerdas];
        ini = 0; fin = mapper.numTrastes;
        resultados = state.modo_vista === 'Tercera-Full'
          ? mapper.buscarTerceraFull(raiz, tipo, aguda, grave, ini, fin)
          : mapper.buscarSextaFull(raiz, tipo, aguda, grave, ini, fin);
        cuerdasSel = [aguda, grave];
        sinMapaNotas = true;
        tituloTipo = `${state.modo_vista} ${raiz} ${tipo} ${state.cuerdas}`; break;
      }
      case 'Terceras':
      case 'Sextas':
        // Igual que app.py: escala mayor/menor filtrada por par de cuerdas
        resultados = mapper.buscarEscalaEnSeccion(raiz, tipo === 'Mayor' ? 'Mayor' : 'Menor', ini, fin);
        cuerdasSel = CUERDAS_MAP[state.cuerdas];
        resultados = resultados.filter((r) => cuerdasSel.includes(r.cuerda));
        tituloTipo = `${state.modo_vista} ${tipo} ${state.cuerdas}`; break;
    }
  } catch (e) {
    $('error').textContent = `Error al buscar: ${e.message}`;
    $('error').classList.remove('hidden');
    resultados = []; tituloTipo = 'Error en la búsqueda';
  }
  state.resultados = resultados;

  const svg = visualizarMastil(mapper.matriz, resultados, ini, fin, `${tituloTipo} — ${state.preset_selector}`, cuerdasSel, sinMapaNotas ? null : NOTE_COLOR_MAP, opcionesVis);
  $('chart').replaceChildren(svg);
  ultimoSVG = svg;
}

/* ---------- Tooltip (hover como Plotly) ---------- */
function initTooltip() {
  const tip = $('tooltip');
  $('chart').addEventListener('pointermove', (e) => {
    const g = e.target.closest('.nota');
    if (!g) { tip.classList.add('hidden'); return; }
    tip.innerHTML = `<b>${g.dataset.titulo}</b><br>${g.dataset.info}<br>${g.dataset.tipo}`;
    tip.style.left = `${e.clientX + 14}px`;
    tip.style.top = `${e.clientY + 14}px`;
    tip.classList.remove('hidden');
  });
  $('chart').addEventListener('pointerleave', () => tip.classList.add('hidden'));
}

/* ---------- Acciones ---------- */
function mensaje(texto, tipo = 'success') {
  const m = $('mensaje');
  m.className = `alert ${tipo}`;
  m.textContent = texto;
  clearTimeout(mensaje._t);
  mensaje._t = setTimeout(() => m.classList.add('hidden'), 4000);
}

function descargar(blob, nombre) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function exportarPNG() {
  if (!state.resultados || !state.resultados.length) return mensaje('Primero genere una visualización para exportar', 'warning');
  const xml = new XMLSerializer().serializeToString(ultimoSVG);
  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const c = document.createElement('canvas');
    c.width = FIG_W * scale; c.height = FIG_H * scale;
    const ctx = c.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, FIG_W, FIG_H);
    c.toBlob((b) => descargar(b, `guitarraia_${state.nota_raiz}_${state.tipo}.png`), 'image/png');
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
}

function estadoActual() {
  return {
    afinacion_notas: state.afinacion_notas,
    afinacion_octavas: state.afinacion_octavas,
    preset_selector: state.preset_selector,
    modo_vista: state.modo_vista,
    nota_raiz: state.nota_raiz,
    [state.modo_vista === 'Tríada' ? 'tipo_triada' : 'tipo_escala']: state.tipo,
    cuerdas: state.cuerdas,
    traste_rango: state.traste_rango,
  };
}

function guardar() {
  const json = JSON.stringify(estadoActual(), null, 2);
  localStorage.setItem(STORAGE_KEY, json);
  descargar(new Blob([json], { type: 'application/json' }), 'configuracion_guitarraia.json');
  mensaje('Configuración guardada en configuracion_guitarraia.json (y en el navegador)');
}

function aplicarEstado(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('formato inválido');
  if (Array.isArray(cfg.afinacion_notas) && cfg.afinacion_notas.length === 6) state.afinacion_notas = [...cfg.afinacion_notas];
  if (Array.isArray(cfg.afinacion_octavas) && cfg.afinacion_octavas.length === 6) state.afinacion_octavas = [...cfg.afinacion_octavas];
  if (cfg.preset_selector) state.preset_selector = cfg.preset_selector;
  if (MODOS.includes(cfg.modo_vista)) state.modo_vista = cfg.modo_vista;
  if (NOTAS.includes(cfg.nota_raiz)) state.nota_raiz = cfg.nota_raiz;
  state.tipo = cfg.tipo_triada || cfg.tipo_escala || state.tipo;
  if (cfg.cuerdas) state.cuerdas = cfg.cuerdas;
  if (Array.isArray(cfg.traste_rango)) state.traste_rango = cfg.traste_rango.map(Number);
  sincronizarCuerdas();
  $('nota-raiz').value = state.nota_raiz;
  actualizarTipo();
  render();
}

function cargar() {
  const local = localStorage.getItem(STORAGE_KEY);
  if (local && confirm('Se encontró una configuración guardada en el navegador.\nAceptar = usarla · Cancelar = elegir archivo JSON')) {
    try { aplicarEstado(JSON.parse(local)); mensaje('Configuración cargada correctamente'); }
    catch { mensaje('Configuración con formato inválido', 'warning'); }
    return;
  }
  $('file-config').click();
}

function initAcciones() {
  $('btn-exportar').addEventListener('click', exportarPNG);
  $('btn-guardar').addEventListener('click', guardar);
  $('btn-cargar').addEventListener('click', cargar);
  $('file-config').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { aplicarEstado(JSON.parse(await f.text())); mensaje('Configuración cargada correctamente'); }
    catch { mensaje('No se encontró el archivo de configuración o tiene formato inválido', 'warning'); }
    e.target.value = '';
  });
  $('btn-sidebar').addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
}

document.addEventListener('DOMContentLoaded', () => {
  construirSidebar();
  construirBusqueda();
  initTooltip();
  initAcciones();
  render();
});
