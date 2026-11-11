/* ═══ DIAGRAMAS SOLARIS — prototipo (26/10/2026) ═══════════════════════════════════════════════════════════
   Encargo: docs/encargo-diagramas.md. App APARTE del panel: diagramas de FLUJO y GANTT, piezas y estética fijas,
   descargables como un HTML autocontenido.

   ⛔ UNA SOLA FUNCIÓN DIBUJA, Y LA USAN EL EDITOR Y LA DESCARGA (`flujoSVG`, `ganttPartes`). Es lo que hace que
   «se vea igual en la app que en el fichero»: el editor sólo añade asas y selección encima (`ed:true`).
   ⛔ NO carga `comun.js` del panel a propósito: es otro producto, y lo que descarga tiene que abrirse sin red ni
   servidor. Las cuatro utilidades de fecha de abajo (ISO local) son por eso propias — indexadas en el mapa.
   ⛔ Hoy guarda en localStorage (prototipo). El almacén del mini PC, el login y la puerta llegan después.
   ═════════════════════════════════════════════════════════════════════════════════════════════════════════ */
'use strict';

// ══ UTILIDADES ══════════════════════════════════════════════════════════════════════════════════════════════
const $ = (s, r) => (r || document).querySelector(s);
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function uid(p){ return (p || 'x') + Math.random().toString(36).slice(2, 9); }
function copia(o){ return JSON.parse(JSON.stringify(o)); }
// Fechas como 'AAAA-MM-DD' en hora LOCAL: un Gantt cuenta días de calendario, no instantes.
function isoDe(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function deISO(s){ const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function sumaDias(iso, n){ const d = deISO(iso); d.setDate(d.getDate() + n); return isoDe(d); }
function diasEntre(a, b){ return Math.round((deISO(b) - deISO(a)) / 864e5); }   // round: un cambio de hora no resta un día
function dmy(iso){ return iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : ''; }
function hoyISO(){ return isoDe(new Date()); }
function semanaISO(iso){   // nº de semana ISO-8601 (la que se usa en España)
  const d = deISO(iso); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const s1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - s1) / 864e5 - 3 + ((s1.getDay() + 6) % 7)) / 7);
}
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS1 = ['D','L','M','X','J','V','S'];

// Medir texto con la MISMA fuente que el SVG, para partir líneas igual en el editor y en la descarga.
const FUENTE = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
const _ctx = document.createElement('canvas').getContext('2d');
function anchoTexto(t, peso){ _ctx.font = (peso || 400) + ' 13px ' + FUENTE; return _ctx.measureText(t).width; }
function partir(txt, max, peso){
  const out = [];
  String(txt || '').split('\n').forEach(par => {
    let linea = '';
    par.split(/\s+/).filter(Boolean).forEach(pal => {
      const prueba = linea ? linea + ' ' + pal : pal;
      if (anchoTexto(prueba, peso) <= max || !linea) linea = prueba; else { out.push(linea); linea = pal; }
    });
    out.push(linea);
  });
  return out.length ? out : [''];
}
function recorta(t, max, peso){
  t = String(t || ''); if (anchoTexto(t, peso) <= max) return t;
  while (t.length > 1 && anchoTexto(t + '…', peso) > max) t = t.slice(0, -1);
  return t + '…';
}

// ══ ESTILO DEL DIBUJO (viaja tal cual dentro del HTML descargado) ═══════════════════════════════════════════
// Oscuro en pantalla; al IMPRIMIR, la variante clara con los mismos tres colores de la insignia.
const CLARO = '--d-bg:#FFFFFF;--d-sur:#F4F3F3;--d-sur2:#ECE9EA;--d-gris:#231F20;--d-line:#DAD5D6;--d-line2:#B2A8AB;--d-ink3:#7C6E72;--d-ink2:#463E40;--d-ink:#231F20;--d-sel:rgba(228,30,37,.10)';
const DIAG_CSS = `
.dgv{--d-bg:#0C0B0B;--d-sur:#181616;--d-sur2:#221E1F;--d-gris:#231F20;--d-line:#322C2E;--d-line2:#463E40;--d-ink3:#7C6E72;--d-ink2:#B2A8AB;--d-ink:#F4F3F3;--d-red:#E41E25;--d-onred:#FFFFFF;--d-sel:rgba(228,30,37,.16)}
.dgv.claro{${CLARO}}
svg.dg{display:block;font-family:${FUENTE}}
svg.dg text{fill:var(--d-ink);font-size:13px}
svg.dg .mono{font-family:ui-monospace,"SF Mono","Cascadia Mono",Consolas,monospace}
svg.dg .sc{font-family:ui-monospace,"SF Mono","Cascadia Mono",Consolas,monospace;font-size:9px;letter-spacing:.14em;fill:var(--d-ink3);text-transform:uppercase}
.n .f{stroke-width:1.5}
.n-inicio .f{fill:var(--d-red);stroke:none}svg.dg .n-inicio text{fill:var(--d-onred);font-weight:600}
.n-proceso .f{fill:var(--d-sur2);stroke:var(--d-line2)}
.n-decision .f{fill:var(--d-sur2);stroke:var(--d-red)}
.n-documento .f{fill:var(--d-sur);stroke:var(--d-ink2);stroke-width:1.2}
.n-datos .f{fill:var(--d-sur);stroke:var(--d-line2)}
.n-subproceso .f{fill:var(--d-sur2);stroke:var(--d-line2)}.n-subproceso .l{stroke:var(--d-line2);stroke-width:1.5}
.n-nota .f{fill:none;stroke:var(--d-ink3);stroke-dasharray:4 3;stroke-width:1.2}svg.dg .n-nota text{fill:var(--d-ink2);font-style:italic}
.e .r{fill:none;stroke:var(--d-ink2);stroke-width:1.6;stroke-linejoin:round}
.e .lb rect{fill:var(--d-bg);stroke:var(--d-line2)}
svg.dg .e .lb text{font:600 10.5px ui-monospace,"SF Mono",Consolas,monospace;letter-spacing:.06em;fill:var(--d-ink)}
.flecha{fill:var(--d-ink2)}
.g-cab{fill:var(--d-sur)}
.g-lin{stroke:var(--d-line);stroke-width:1}
.g-mes{stroke:var(--d-line2);stroke-width:1}
.g-finde{fill:var(--d-sur);opacity:.6}
.g-fase-fondo{fill:var(--d-sur2)}
.g-sel{fill:var(--d-sel)}
.g-bar{fill:var(--d-line2);stroke:var(--d-ink3);stroke-width:1}
.g-fase{fill:var(--d-ink)}
.g-hito{fill:var(--d-red)}
.g-hoy{stroke:var(--d-red);stroke-width:1.5}
.g-hoy-txt{fill:var(--d-onred)!important;font:700 9px ui-monospace,Consolas,monospace!important;letter-spacing:.12em}
.g-hoy-pill{fill:var(--d-red)}
.g-dep{fill:none;stroke:var(--d-ink2);stroke-width:1.2;stroke-linejoin:round}
.g-dep.mal{stroke:var(--d-red);stroke-dasharray:4 3}
.g-num{fill:var(--d-ink3)!important;font-size:11px!important}
.g-txt2{fill:var(--d-ink3)!important;font-size:11.5px!important}
.g-fecha{fill:var(--d-ink2)!important;font-size:11.5px!important}
.g-fase-txt{font-weight:650}
@media print{.dgv{${CLARO}}}
`;
const ESTRELLA = 'M12 1Q13.4 10.6 23 12 13.4 13.4 12 23 10.6 13.4 1 12 10.6 10.6 12 1Z';

// ══ FLUJO: las piezas (tamaños FIJOS: es lo que hace que dos coordinadores dibujen igual) ═══════════════════
const REJILLA = 20, LH = 17;
const PIEZAS = {
  inicio:     { nombre: 'Inicio / fin',     w: 140, h: 40,  tw: 112, peso: 600, def: 'Inicio' },
  proceso:    { nombre: 'Proceso',          w: 160, h: 60,  tw: 136, def: 'Proceso' },
  decision:   { nombre: 'Decisión',         w: 180, h: 100, tw: 104, def: '¿Decisión?' },
  documento:  { nombre: 'Documento',        w: 160, h: 60,  tw: 136, def: 'Documento' },
  datos:      { nombre: 'Entrada / salida', w: 160, h: 60,  tw: 116, def: 'Entrada' },
  subproceso: { nombre: 'Subproceso',       w: 160, h: 60,  tw: 112, def: 'Subproceso' },
  nota:       { nombre: 'Nota',             w: 160, h: 60,  tw: 140, def: 'Nota' },
};
const PROCESO_PIEZAS = ['inicio', 'proceso', 'decision', 'documento', 'datos', 'subproceso', 'nota'];
function geoNodo(n){
  const P = PIEZAS[n.t] || PIEZAS.proceso;
  const lineas = partir(n.txt, P.tw, P.peso);
  let h = P.h;
  const necesita = lineas.length * LH + (n.t === 'decision' ? 54 : 22);
  if (necesita > h) h = Math.ceil(necesita / REJILLA) * REJILLA;
  return { x: n.x, y: n.y, w: P.w, h, lineas };
}
function formaNodo(t, w, h){
  switch (t) {
    case 'inicio': return `<rect class="f" width="${w}" height="${h}" rx="${h / 2}"/>`;
    case 'decision': return `<path class="f" d="M${w / 2} 0L${w} ${h / 2}L${w / 2} ${h}L0 ${h / 2}Z"/>`;
    case 'documento': return `<path class="f" d="M0 0H${w}V${h - 8}Q${w * .75} ${h - 20} ${w / 2} ${h - 8}T0 ${h - 8}Z"/>`;
    case 'datos': return `<path class="f" d="M16 0H${w}L${w - 16} ${h}H0Z"/>`;
    case 'subproceso': return `<rect class="f" width="${w}" height="${h}" rx="3"/><path class="l" d="M12 0V${h}M${w - 12} 0V${h}"/>`;
    case 'nota': return `<path class="f" d="M0 0H${w - 14}L${w} 14V${h}H0Z"/>`;
    case 'componente': return `<rect class="pila" x="6" y="6" width="${w}" height="${h}" rx="6"/><rect class="f" width="${w}" height="${h}" rx="6"/>`;
    case 'hito': return `<path class="f" d="M14 0H${w - 14}L${w} ${h / 2}L${w - 14} ${h}H14L0 ${h / 2}Z"/>`;
    case 'o': return `<ellipse class="f" cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}"/>`;
    default: return `<rect class="f" width="${w}" height="${h}" rx="4"/>`;
  }
}
function puerto(g, lado){
  return { n: [g.x + g.w / 2, g.y], s: [g.x + g.w / 2, g.y + g.h], e: [g.x + g.w, g.y + g.h / 2], w: [g.x, g.y + g.h / 2] }[lado];
}
function ladoHacia(g, p){   // el lado de g que mira hacia el punto p
  const dx = (p[0] - (g.x + g.w / 2)) / g.w, dy = (p[1] - (g.y + g.h / 2)) / g.h;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
}
const DIR = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
function ruta(a, sa, b, sb, carril){
  const S = 18;
  carril = carril || 0;   // desplaza el tramo de en medio: dos flechas paralelas no comparten el mismo carril
  const a1 = [a[0] + DIR[sa][0] * S, a[1] + DIR[sa][1] * S], b1 = [b[0] + DIR[sb][0] * S, b[1] + DIR[sb][1] * S];
  const va = sa === 'n' || sa === 's', vb = sb === 'n' || sb === 's';
  let medio;
  if (va && vb) { const my = (a1[1] + b1[1]) / 2 + carril; medio = [[a1[0], my], [b1[0], my]]; }
  else if (!va && !vb) { const mx = (a1[0] + b1[0]) / 2 + carril; medio = [[mx, a1[1]], [mx, b1[1]]]; }
  else if (va) medio = [[a1[0], b1[1]]];
  else medio = [[b1[0], a1[1]]];
  const pts = [a, a1].concat(medio, [b1, b]);
  const limpio = [];   // fuera duplicados y puntos en línea recta
  pts.forEach(p => {
    const u = limpio[limpio.length - 1];
    if (u && Math.abs(u[0] - p[0]) < .5 && Math.abs(u[1] - p[1]) < .5) return;
    limpio.push(p);
  });
  for (let i = limpio.length - 2; i > 0; i--) {
    const [p, q, r] = [limpio[i - 1], limpio[i], limpio[i + 1]];
    if ((Math.abs(p[0] - q[0]) < .5 && Math.abs(q[0] - r[0]) < .5) || (Math.abs(p[1] - q[1]) < .5 && Math.abs(q[1] - r[1]) < .5)) limpio.splice(i, 1);
  }
  return limpio;
}
function trazo(pts, radio){   // polilínea con esquinas redondeadas
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [p, q, r] = [pts[i - 1], pts[i], pts[i + 1]];
    const l1 = Math.hypot(q[0] - p[0], q[1] - p[1]), l2 = Math.hypot(r[0] - q[0], r[1] - q[1]);
    const k = Math.min(radio, l1 / 2, l2 / 2);
    const a = [q[0] - (q[0] - p[0]) / l1 * k, q[1] - (q[1] - p[1]) / l1 * k];
    const b = [q[0] + (r[0] - q[0]) / l2 * k, q[1] + (r[1] - q[1]) / l2 * k];
    d += `L${a[0]} ${a[1]}Q${q[0]} ${q[1]} ${b[0]} ${b[1]}`;
  }
  const u = pts[pts.length - 1];
  return d + `L${u[0]} ${u[1]}`;
}
function ladosConector(c, geos){
  const ga = geos[c.de], gb = geos[c.a];
  if (!ga || !gb) return null;
  const sa = c.ld || ladoHacia(ga, [gb.x + gb.w / 2, gb.y + gb.h / 2]);
  return { sa, sb: c.la || ladoHacia(gb, puerto(ga, sa)) };
}
// Daniel, 26/10: «que automaticamente intente evitar la fusion de flechas, aunq si hay demasiadas no lo haga».
// Las flechas que salen o llegan por el MISMO lado de una pieza se reparten a lo largo de ese lado, ordenadas por dónde
// está la otra punta (para que no se crucen al salir). Con más de MAX_POR_LADO en un lado, no se reparte: se fundirían
// igual y sólo se ensuciaría. Rombos y «O» no: sus puertos son vértices, desplazarlos sacaría la flecha de la forma.
const MAX_POR_LADO = 5, SIN_REPARTO = { decision: 1, o: 1 };
function repartoPuertos(datos, geos){
  const grupos = {}, lados = {}, off = {};
  const tipo = {}; datos.nodos.forEach(n => { tipo[n.id] = n.t; });
  datos.conectores.forEach(c => {
    const l = ladosConector(c, geos); if (!l) return;
    lados[c.id] = l; off[c.id] = { a: 0, b: 0 };
    [[c.de, l.sa, 'a', c.a], [c.a, l.sb, 'b', c.de]].forEach(([n, lado, punta, otro]) => {
      const k = n + '|' + lado; (grupos[k] = grupos[k] || []).push({ c, punta, otro, lado, n });
    });
  });
  Object.keys(grupos).forEach(k => {
    const g = grupos[k]; if (g.length < 2 || g.length > MAX_POR_LADO || SIN_REPARTO[tipo[g[0].n]]) return;
    const geo = geos[g[0].n], horiz = g[0].lado === 'n' || g[0].lado === 's';
    const largo = (horiz ? geo.w : geo.h) * (tipo[g[0].n] === 'inicio' && !horiz ? 0.5 : 0.7);
    const paso = Math.min(18, largo / (g.length - 1));
    g.sort((p, q) => { const a = geos[p.otro], b = geos[q.otro]; return horiz ? (a.x + a.w / 2) - (b.x + b.w / 2) : (a.y + a.h / 2) - (b.y + b.h / 2); });
    g.forEach((e, i) => { off[e.c.id][e.punta] = (i - (g.length - 1) / 2) * paso; });
  });
  return { lados, off };
}
function geoConector(c, geos, rep){
  const ga = geos[c.de], gb = geos[c.a];
  if (!ga || !gb) return null;
  const l = (rep && rep.lados[c.id]) || ladosConector(c, geos), o = (rep && rep.off[c.id]) || { a: 0, b: 0 };
  const sa = l.sa, sb = l.sb;
  const mover = (p, lado, d) => (lado === 'n' || lado === 's') ? [p[0] + d, p[1]] : [p[0], p[1] + d];
  const pa = mover(puerto(ga, sa), sa, o.a), pb = mover(puerto(gb, sb), sb, o.b);
  const pts = ruta(pa, sa, pb, sb, (o.a + o.b) * 0.5);
  let mejor = 0, mi = 0;   // la etiqueta, en el tramo más largo
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    if (l > mejor) { mejor = l; mi = i; }
  }
  const et = [(pts[mi][0] + pts[mi + 1][0]) / 2, (pts[mi][1] + pts[mi + 1][1]) / 2];
  return { pts, et, largo: mejor };
}

// Dibuja el flujo entero. `ed`: añade asas, selección y zonas de clic (sólo en el editor).
function flujoSVG(datos, opc){
  const ed = !!(opc && opc.ed), sel = opc && opc.sel;
  const geos = {};
  datos.nodos.forEach(n => { geos[n.id] = geoNodo(n); });
  let cs = '';
  const rep = repartoPuertos(datos, geos);
  datos.conectores.forEach(c => {
    const g = geoConector(c, geos, rep); if (!g) return;
    const d = trazo(g.pts, 8);
    const es = sel && sel.k === 'c' && sel.id === c.id;
    let lb = '';
    const anchoEt = t => Math.max(26, anchoTexto(t.toUpperCase(), 600) * .86 + 14);
    // Daniel, 11/11: «que aparezcan ambas […] las dos etiquetillas con una coma y no solo una». Con varias cosas (`c.partes`)
    // se escriben todas las que quepan en el tramo, separadas por coma, y lo que no cabe se cuenta: «GEOMETRÍA, MASA +2».
    let txtEt = c.txt || '';
    if (c.partes && c.partes.length) {
      txtEt = '';
      for (let k = c.partes.length; k >= 1; k--) {
        const t = c.partes.slice(0, k).join(', ') + (k < c.partes.length ? ' +' + (c.partes.length - k) : '');
        if (anchoEt(t) <= g.largo - 8) { txtEt = t; break; }
      }
      if (!txtEt) txtEt = recorta(c.partes[0], Math.max(40, (g.largo - 30) / .86 * .8), 600) + (c.partes.length > 1 ? ' +' + (c.partes.length - 1) : '');
    }
    const wEt = txtEt ? anchoEt(txtEt) : 0;
    if (txtEt && (wEt <= g.largo - 8 || txtEt.length <= 8)) {
      c = Object.assign({}, c, { txt: txtEt });
      const w = wEt;
      lb = `<g class="lb" transform="translate(${g.et[0]},${g.et[1]})"><rect x="${-w / 2}" y="-10" width="${w}" height="20" rx="10"/><text text-anchor="middle" dy="3.8">${esc(c.txt.toUpperCase())}</text></g>`;
    }
    cs += `<g class="e${es ? ' sel' : ''}${c.derivado ? ' der' : ''}"${c.derivado ? '' : ` data-c="${c.id}"`}>${ed && !c.derivado ? `<path class="hit" d="${d}"/>` : ''}<path class="r" d="${d}" marker-end="url(#dg-flecha)"/>${lb}</g>`;
  });
  let ns = '';
  datos.nodos.forEach(n => {
    const g = geos[n.id];
    const es = sel && sel.k === 'n' && sel.id === n.id;
    const y0 = g.h / 2 - (g.lineas.length - 1) * LH / 2 + (n.t === 'documento' ? -4 : 0) + ((PIEZAS[n.t] || {}).dy || 0);
    const txt = g.lineas.map((l, i) => `<text x="${g.w / 2}" y="${y0 + i * LH}" text-anchor="middle" dominant-baseline="central">${esc(l)}</text>`).join('');
    const asas = ed ? ['n', 's', 'e', 'w'].map(l => { const p = puerto({ x: 0, y: 0, w: g.w, h: g.h }, l); return `<circle class="port" data-port="${l}" cx="${p[0]}" cy="${p[1]}" r="6"/>`; }).join('') : '';
    const marco = es ? `<rect class="marco" x="-5" y="-5" width="${g.w + 10}" height="${g.h + 10}" rx="6"/>` : '';
    const deco = opc && opc.deco ? opc.deco(n, g) : '';
    ns += `<g class="n n-${n.t}${es ? ' sel' : ''}" data-n="${n.id}" transform="translate(${g.x},${g.y})">${marco}${formaNodo(n.t, g.w, g.h)}${txt}${deco}${asas}</g>`;
  });
  const defs = `<defs><marker id="dg-flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="flecha" d="M0 0L10 5L0 10Z"/></marker></defs>`;
  return { defs, cuerpo: cs + ns, geos };
}
function cajaFlujo(geos){
  const v = Object.values(geos);
  if (!v.length) return { x: 0, y: 0, w: 400, h: 200 };
  const x0 = Math.min(...v.map(g => g.x)), y0 = Math.min(...v.map(g => g.y));
  const x1 = Math.max(...v.map(g => g.x + g.w)), y1 = Math.max(...v.map(g => g.y + g.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
function flujoEstatico(datos, opc){
  const r = flujoSVG(datos, opc || {});
  const c = cajaFlujo(r.geos), m = 40;
  return `<svg class="dg" xmlns="http://www.w3.org/2000/svg" viewBox="${c.x - m} ${c.y - m} ${c.w + 2 * m} ${c.h + 2 * m}" width="${c.w + 2 * m}" height="${c.h + 2 * m}">${r.defs}${r.cuerpo}</svg>`;
}

// ══ GANTT ═══════════════════════════════════════════════════════════════════════════════════════════════════
const ESCALAS = { dia: { px: 28, nombre: 'Días' }, semana: { px: 12, nombre: 'Semanas' }, mes: { px: 4, nombre: 'Meses' } };
const G_FILA = 30, G_CAB = 52;
const G_COLS = [{ k: 'num', w: 34, t: '#' }, { k: 'nombre', w: 236, t: 'Nombre' }, { k: 'resp', w: 128, t: 'Responsable' }, { k: 'ini', w: 82, t: 'Inicio' }, { k: 'fin', w: 82, t: 'Fin' }];
const G_TW = G_COLS.reduce((s, c) => s + c.w, 0);

// Las filas con lo calculado: a qué fase pertenece cada una (la fase de arriba más cercana) y las fechas de las fases.
function ganttFilas(datos){
  const out = []; let fase = null;
  datos.filas.forEach((f, i) => {
    if (f.t === 'fase') { fase = { f, i, ini: f.ini, fin: f.fin, hijos: [] }; out.push(fase); return; }
    const o = { f, i, ini: f.ini, fin: f.t === 'hito' ? f.ini : f.fin, fase: fase ? fase.f.id : null };
    if (fase) fase.hijos.push(o);
    out.push(o);
  });
  out.forEach(o => {
    if (o.f.t === 'fase' && o.hijos.length) {
      o.ini = o.hijos.reduce((m, h) => h.ini < m ? h.ini : m, o.hijos[0].ini);
      o.fin = o.hijos.reduce((m, h) => h.fin > m ? h.fin : m, o.hijos[0].fin);
    }
  });
  return out;
}
function depMal(pred, suc){   // ¿el sucesor empieza antes de que acabe lo que necesita?
  return pred.f.t === 'hito' ? suc.ini < pred.fin : suc.ini <= pred.fin;
}
function ganttRango(filas){
  const hoy = hoyISO();
  if (!filas.length) return { lo: sumaDias(hoy, -7), hi: sumaDias(hoy, 56) };
  let lo = filas.reduce((m, o) => o.ini < m ? o.ini : m, filas[0].ini);
  let hi = filas.reduce((m, o) => o.fin > m ? o.fin : m, filas[0].fin);
  lo = sumaDias(lo, -4); hi = sumaDias(hi, 10);
  const lun = (deISO(lo).getDay() + 6) % 7; lo = sumaDias(lo, -lun);   // empieza en lunes
  if (diasEntre(lo, hi) < 42) hi = sumaDias(lo, 42);
  return { lo, hi };
}
// Dos piezas de la misma altura: la TABLA (columnas) y la LÍNEA de tiempo. El editor las pone lado a lado con la
// tabla fija; la descarga las junta en un solo SVG. `ed`: zonas de arrastre y selección.
function ganttPartes(datos, opc){
  const ed = !!(opc && opc.ed), sel = opc && opc.sel;
  const px = (ESCALAS[datos.escala] || ESCALAS.semana).px;
  const filas = ganttFilas(datos);
  const { lo, hi } = ganttRango(filas);
  const ndias = diasEntre(lo, hi) + 1, LW = ndias * px, H = G_CAB + Math.max(filas.length, 1) * G_FILA + 8;
  const X = iso => diasEntre(lo, iso) * px;
  const porId = {}; filas.forEach(o => { porId[o.f.id] = o; });
  const hoy = hoyISO();

  // ── tabla
  let t = `<rect class="g-cab" x="0" y="0" width="${G_TW}" height="${G_CAB}"/>`;
  let x = 0;
  G_COLS.forEach(c => { t += `<text class="sc" x="${x + 10}" y="${G_CAB - 13}">${c.t}</text>`; x += c.w; });
  t += `<line class="g-mes" x1="0" x2="${G_TW}" y1="${G_CAB}" y2="${G_CAB}"/>`;
  // ── línea de tiempo: cabecera
  let l = `<rect class="g-cab" x="0" y="0" width="${LW}" height="${G_CAB}"/>`;
  let fondo = '', rej = '';
  for (let i = 0; i < ndias; i++) {
    const iso = sumaDias(lo, i), d = deISO(iso), xx = i * px, dow = d.getDay();
    if (d.getDate() === 1 || i === 0) {
      const nombre = px >= 10 ? MESES[d.getMonth()] + ' ' + d.getFullYear() : MESES[d.getMonth()].slice(0, 3) + ' ' + String(d.getFullYear()).slice(2);
      const sitio = i === 0 ? diasEntre(iso, isoDe(new Date(d.getFullYear(), d.getMonth() + 1, 1))) * px : Infinity;
      if (i > 0) rej += `<line class="g-mes" x1="${xx}" x2="${xx}" y1="0" y2="${H}"/>`;
      if (sitio >= anchoTexto(nombre, 600) + 16) l += `<text x="${xx + 8}" y="17" style="font-size:12px;font-weight:600">${esc(nombre)}</text>`;
    }
    if ((dow === 0 || dow === 6) && px >= 10) fondo += `<rect class="g-finde" x="${xx}" y="${G_CAB}" width="${px}" height="${H - G_CAB}"/>`;
    if (dow === 1 && i > 0) rej += `<line class="g-lin" x1="${xx}" x2="${xx}" y1="${px >= 10 ? 26 : 26}" y2="${H}"/>`;
    if (px >= 24) l += `<text class="mono" x="${xx + px / 2}" y="${G_CAB - 20}" text-anchor="middle" style="font-size:10.5px;fill:var(--d-ink2)">${d.getDate()}</text><text class="sc" x="${xx + px / 2}" y="${G_CAB - 7}" text-anchor="middle">${DIAS1[dow]}</text>`;
    else if (dow === 1 && px >= 10) l += `<text class="mono" x="${xx + 6}" y="${G_CAB - 12}" style="font-size:10px;fill:var(--d-ink2)">S${semanaISO(iso)} · ${dmy(iso).slice(0, 5)}</text>`;
    else if (dow === 1) l += `<text class="mono" x="${xx + 3}" y="${G_CAB - 12}" style="font-size:9px;fill:var(--d-ink3)">${semanaISO(iso)}</text>`;
  }
  l += `<line class="g-mes" x1="0" x2="${LW}" y1="${G_CAB}" y2="${G_CAB}"/>`;

  // ── filas
  let barras = '', deps = '';
  filas.forEach((o, i) => {
    const y = G_CAB + i * G_FILA, cy = y + G_FILA / 2, f = o.f;
    const es = sel && sel.id === f.id;
    const zonaT = ed ? ` data-fila="${f.id}"` : '';
    if (f.t === 'fase') { t += `<rect class="g-fase-fondo" x="0" y="${y}" width="${G_TW}" height="${G_FILA}"/>`; fondo += `<rect class="g-fase-fondo" x="0" y="${y}" width="${LW}" height="${G_FILA}" opacity=".55"/>`; }
    if (es) { t += `<rect class="g-sel" x="0" y="${y}" width="${G_TW}" height="${G_FILA}"/>`; fondo += `<rect class="g-sel" x="0" y="${y}" width="${LW}" height="${G_FILA}"/>`; }
    t += `<line class="g-lin" x1="0" x2="${G_TW}" y1="${y + G_FILA}" y2="${y + G_FILA}"/>`;
    // columnas
    let cx = 0;
    const sangria = o.fase ? 16 : 0;
    const marca = f.t === 'hito' ? `<path class="g-hito" transform="translate(${G_COLS[0].w + 10 + sangria + 4},${cy})" d="M0 -5L5 0L0 5L-5 0Z"/>` : '';
    const nombreX = G_COLS[0].w + 10 + sangria + (f.t === 'hito' ? 14 : 0);
    t += `<text class="mono g-num" x="${cx + 10}" y="${cy}" dominant-baseline="central">${i + 1}</text>`; cx += G_COLS[0].w;
    if (f.color) t += `<rect x="${cx - 2}" y="${y + 7}" width="3" height="${G_FILA - 14}" rx="1.5" style="fill:${f.color}"/>`;   // la unidad, con su color de Notion
    t += marca + `<text class="${f.t === 'fase' ? 'g-fase-txt' : ''}" x="${nombreX}" y="${cy}" dominant-baseline="central">${esc(recorta(f.nombre || '(sin nombre)', G_COLS[1].w - 18 - sangria - (f.t === 'hito' ? 14 : 0), f.t === 'fase' ? 650 : 400))}</text>`; cx += G_COLS[1].w;
    t += `<text class="g-txt2" x="${cx + 10}" y="${cy}" dominant-baseline="central">${esc(recorta(f.resp || '', G_COLS[2].w - 16, 400))}</text>`; cx += G_COLS[2].w;
    t += `<text class="mono g-fecha" x="${cx + 10}" y="${cy}" dominant-baseline="central">${dmy(o.ini).slice(0, 5)}${o.ini.slice(0, 4) !== hoy.slice(0, 4) ? '/' + o.ini.slice(2, 4) : ''}</text>`; cx += G_COLS[3].w;
    t += `<text class="mono g-fecha" x="${cx + 10}" y="${cy}" dominant-baseline="central">${f.t === 'hito' ? '—' : dmy(o.fin).slice(0, 5) + (o.fin.slice(0, 4) !== hoy.slice(0, 4) ? '/' + o.fin.slice(2, 4) : '')}</text>`;
    if (ed) t += `<rect class="zona" x="0" y="${y}" width="${G_TW}" height="${G_FILA}" fill="transparent"${zonaT}/>`;
    // barra
    const x0 = X(o.ini), x1 = X(o.fin) + px;
    const lineaH = `<line class="g-lin" x1="0" x2="${LW}" y1="${y + G_FILA}" y2="${y + G_FILA}"/>`;
    rej += lineaH;
    if (f.t === 'fase') {
      barras += `<g data-fila="${f.id}" data-arr="mover"><path class="g-fase"${f.color ? ` style="fill:${f.color}"` : ''} d="M${x0} ${cy - 5}H${x1}V${cy + 3}L${x1 - 6} ${cy + 9}L${x1 - 12} ${cy + 3}H${x0 + 12}L${x0 + 6} ${cy + 9}L${x0} ${cy + 3}Z"/>${ed ? `<rect x="${x0}" y="${y + 4}" width="${x1 - x0}" height="${G_FILA - 8}" fill="transparent"/>` : ''}</g>`;
    } else if (f.t === 'hito') {
      const hx = x0 + px / 2;
      barras += `<g data-fila="${f.id}" data-arr="mover"><path class="g-hito${f.tarde ? ' tarde' : ''}" transform="translate(${hx},${cy})" d="M0 -8L8 0L0 8L-8 0Z"/>${ed ? `<rect x="${hx - 11}" y="${y + 3}" width="22" height="${G_FILA - 6}" fill="transparent"/>` : ''}</g>`;
      barras += `<text class="g-txt2" x="${hx + 13}" y="${cy}" dominant-baseline="central">${esc(f.nombre || '')}${f.resp ? ' · ' + esc(f.resp) : ''}</text>`;
    } else {
      if (f.holgFin) barras += `<line class="g-holg" x1="${x1 + 2}" x2="${X(f.holgFin) + px}" y1="${cy}" y2="${cy}"/>`;   // hasta dónde puede retrasarse
      barras += `<g data-fila="${f.id}" data-arr="mover"><rect class="g-bar${f.crit ? ' crit' : ''}" x="${x0 + 1}" y="${cy - 7}" width="${Math.max(x1 - x0 - 2, 3)}" height="14" rx="3"/>`;
      if (ed) barras += `<rect x="${x0}" y="${y + 3}" width="${x1 - x0}" height="${G_FILA - 6}" fill="transparent"/><rect data-arr="ini" x="${x0 - 4}" y="${y + 3}" width="9" height="${G_FILA - 6}" fill="transparent" style="cursor:ew-resize"/><rect data-arr="fin" x="${x1 - 5}" y="${y + 3}" width="9" height="${G_FILA - 6}" fill="transparent" style="cursor:ew-resize"/>`;
      barras += `</g>`;
      if (f.resp) barras += `<text class="g-txt2" x="${x1 + 7}" y="${cy}" dominant-baseline="central">${esc(f.resp)}</text>`;
    }
    // dependencias (fin → inicio)
    (f.deps || []).forEach(did => {
      const p = porId[did]; if (!p) return;
      const j = filas.indexOf(p);
      const ax = X(p.fin) + (p.f.t === 'hito' ? px / 2 + 8 : px), ay = G_CAB + j * G_FILA + G_FILA / 2;
      const bx = x0 + (f.t === 'hito' ? px / 2 - 8 : 0), by = cy;
      const mal = depMal(p, o);
      let pts;
      if (bx - ax >= 16) pts = [[ax, ay], [ax + 8, ay], [ax + 8, by], [bx, by]];
      else { const yy = by + (by > ay ? -G_FILA / 2 : G_FILA / 2); pts = [[ax, ay], [ax + 8, ay], [ax + 8, yy], [bx - 10, yy], [bx - 10, by], [bx, by]]; }
      deps += `<path class="g-dep${mal ? ' mal' : ''}" d="${trazo(pts, 4)}" marker-end="url(#dg-flecha-g${mal ? '-mal' : ''})"/>`;
    });
  });
  if (!filas.length) t += `<text class="g-txt2" x="12" y="${G_CAB + 19}">Añade una fase o una tarea</text>`;
  // hoy
  let hoyM = '';
  if (hoy >= lo && hoy <= hi) {
    const hx = X(hoy) + px / 2;
    hoyM = `<line class="g-hoy" x1="${hx}" x2="${hx}" y1="${G_CAB - 6}" y2="${H}"/><rect class="g-hoy-pill" x="${hx - 17}" y="${G_CAB - 15}" width="34" height="13" rx="6.5"/><text class="g-hoy-txt" x="${hx}" y="${G_CAB - 6}" text-anchor="middle">HOY</text>`;
  }
  const defs = `<defs><marker id="dg-flecha-g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path class="flecha" d="M0 0L10 5L0 10Z"/></marker><marker id="dg-flecha-g-mal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path class="g-hito" d="M0 0L10 5L0 10Z"/></marker></defs>`;
  return { tabla: t, linea: l + fondo + rej + deps + barras + hoyM, defs, LW, H, lo, px, filas };
}
function ganttEstatico(datos){
  const p = ganttPartes(datos, {});
  const W = G_TW + p.LW;
  return `<svg class="dg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${p.H}" width="${W}" height="${p.H}">${p.defs}<rect width="${W}" height="${p.H}" fill="var(--d-bg)"/><g transform="translate(${G_TW},0)">${p.linea}</g><rect x="0" y="0" width="${G_TW}" height="${p.H}" fill="var(--d-bg)"/>${p.tabla}<line class="g-mes" x1="${G_TW}" x2="${G_TW}" y1="0" y2="${p.H}"/></svg>`;
}

// ══ LA DESCARGA: un solo .html, todo dentro, sin JS ═════════════════════════════════════════════════════════
const PAGINA_CSS = `
*{box-sizing:border-box}html,body{margin:0}
body{background:var(--d-bg);color:var(--d-ink);font:14px/1.5 ${FUENTE};-webkit-font-smoothing:antialiased}
.cab{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;padding:28px 32px 18px;border-bottom:2px solid var(--d-red)}
.marca{display:flex;align-items:center;gap:8px;font:600 10px ui-monospace,Consolas,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--d-ink3)}
h1{margin:8px 0 0;font-size:24px;line-height:1.2;font-weight:650}
.meta{display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:var(--d-ink3)}
.meta b{display:block;font:600 9px ui-monospace,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--d-ink3);margin-bottom:2px}
.meta span{color:var(--d-ink)}
.hoja{padding:24px 32px;overflow:auto}
.hoja svg{max-width:none}
.ley{display:flex;gap:18px;flex-wrap:wrap;padding:0 32px 18px;font-size:12px;color:var(--d-ink2)}
.ley div{display:flex;align-items:center;gap:7px}
.pie{padding:14px 32px 26px;border-top:1px solid var(--d-line);font-size:11px;color:var(--d-ink3);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
h2{font-size:17px;margin:26px 0 10px;font-weight:650}h3{font-size:14px;margin:22px 0 8px;font-weight:600;display:flex;align-items:center;gap:8px}h3 i{width:10px;height:10px;border-radius:2px;display:inline-block}h3 span{color:var(--d-ink3);font-weight:400}.hoja h2:first-of-type{margin-top:6px}.kpis{padding-left:0}
@media (max-width:600px){.cab,.hoja,.ley,.pie{padding-left:16px;padding-right:16px}}
@media print{.hoja{overflow:visible;padding:12px 0}.hoja svg{max-width:100%;height:auto}.cab{padding:0 0 12px}.ley,.pie{padding-left:0;padding-right:0}@page{size:landscape;margin:12mm}}
`;
function leyendaHTML(doc){
  const usados = doc.tipo !== 'gantt' ? Object.keys(PIEZAS).filter(k => doc.datos.nodos.some(n => n.t === k)) : [];
  if (doc.tipo === 'proyecto') {
    const us = Array.from(new Set(doc.datos.nodos.filter(n => n.t === 'componente' && n.unidad).map(n => n.unidad)));
    return usados.map(k => `<div>${iconoPieza(k)}${esc(PIEZAS[k].nombre)}</div>`).join('') + `<div>${iconoGantt('tarea').replace('g-bar', 'g-bar crit')}Cadena crítica</div><div>${iconoGantt('hoy')}Hoy</div>`
      + us.map(u => `<div><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${colorUnidad(u)}"></i>${esc(u)}</div>`).join('');
  }
  if (doc.tipo === 'flujo') return usados.map(k => `<div>${iconoPieza(k)}${esc(PIEZAS[k].nombre)}</div>`).join('');
  const ts = new Set(doc.datos.filas.map(f => f.t));
  const r = [];
  if (ts.has('fase')) r.push(`<div>${iconoGantt('fase')}Fase</div>`);
  if (ts.has('tarea')) r.push(`<div>${iconoGantt('tarea')}Tarea</div>`);
  if (ts.has('hito')) r.push(`<div>${iconoGantt('hito')}Hito</div>`);
  if (doc.datos.filas.some(f => (f.deps || []).length)) r.push(`<div>${iconoGantt('dep')}Dependencia</div>`);
  r.push(`<div>${iconoGantt('hoy')}Hoy</div>`);
  return r.join('');
}
function iconoPieza(k){
  const P = PIEZAS[k], s = 34 / P.w;
  return `<svg class="dg dgv" width="34" height="${Math.round(P.h * s) + 2}" viewBox="-1 -1 ${P.w + 2} ${P.h + 2}"><g class="n n-${k}">${formaNodo(k, P.w, P.h)}</g></svg>`;
}
function iconoGantt(k){
  const c = { fase: '<path class="g-fase" d="M2 6H32V12L28 16L24 12H10L6 16L2 12Z"/>', tarea: '<rect class="g-bar" x="2" y="5" width="30" height="10" rx="3"/>', hito: '<path class="g-hito" d="M17 3L24 10L17 17L10 10Z"/>', dep: '<path class="g-dep" d="M2 5H14V15H30" /><path class="flecha" d="M28 12L33 15L28 18Z"/>', hoy: '<line class="g-hoy" x1="17" x2="17" y1="0" y2="20"/>' }[k];
  return `<svg class="dg dgv" width="34" height="20" viewBox="0 0 34 20">${c}</svg>`;
}
function documentoHTML(doc){
  const svg = doc.tipo === 'flujo' ? flujoEstatico(doc.datos) : doc.tipo === 'proyecto' ? proyectoEstatico(doc) : ganttEstatico(doc.datos);
  const json = JSON.stringify({ formato: 'solaris-diagrama', version: 1, doc }).replace(/</g, '\\u003c');
  const tipo = doc.tipo === 'flujo' ? 'Proceso' : 'Proyecto';   // 'proyecto' y el 'gantt' a mano de antes
  const nProb = doc.tipo === 'gantt' ? 0 : doc.tipo === 'proyecto' ? calcularPlan(doc).avisos.length : problemasDe(doc).length, val = validacionDe(doc);   // el documento, con TODAS las capas
  const meta = [['Tipo', tipo], ['Unidad', doc.unidad || '—'], ['Autor', doc.autor || '—'], ['Actualizado', dmy(isoDe(new Date(doc.editado)))],
    ['Coherencia', nProb ? `${nProb} por resolver` : 'Coherente'], ['Validación', val ? `Project Director · ${dmy(val.fecha)}` : 'Sin validar']];
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="generator" content="Diagramas Solaris">
<title>${esc(doc.titulo)} · Solaris</title>
<style>${DIAG_CSS}${doc.tipo === 'proyecto' ? PROYECTO_CSS : ''}${PAGINA_CSS}</style></head>
<body class="dgv">
<header class="cab"><div><div class="marca"><svg width="14" height="14" viewBox="0 0 24 24"><path fill="#E41E25" d="${ESTRELLA}"/></svg>UVigo Aerotech · Solaris</div><h1>${esc(doc.titulo)}</h1></div>
<div class="meta">${meta.map(m => `<div><b>${m[0]}</b><span>${esc(m[1])}</span></div>`).join('')}</div></header>
<main class="hoja">${svg}</main>
<section class="ley">${leyendaHTML(doc)}</section>
<footer class="pie"><span>Diagramas Solaris</span><span>Exportado el ${dmy(hoyISO())}</span></footer>
<script type="application/json" id="solaris-diagrama">${json}</script>
</body></html>`;
}
function nombreFichero(doc){
  const slug = String(doc.titulo || 'diagrama').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'diagrama';
  return (doc.tipo === 'flujo' ? 'process' : 'project') + '_' + slug + '_' + hoyISO() + '.html';
}
// Lee un HTML descargado (o un .json) y devuelve el documento que lleva dentro, o null si no es nuestro.
function leerDescargado(texto){
  let j = null;
  try { j = JSON.parse(texto); } catch (_) {
    const m = /<script type="application\/json" id="solaris-diagrama">([\s\S]*?)<\/script>/.exec(texto);
    if (m) { try { j = JSON.parse(m[1]); } catch (_) { j = null; } }
  }
  if (!j || j.formato !== 'solaris-diagrama' || !j.doc || !j.doc.datos) return null;
  const d = j.doc;
  if (d.tipo === 'flujo' && !(Array.isArray(d.datos.nodos) && Array.isArray(d.datos.conectores))) return null;
  if (d.tipo === 'gantt' && !Array.isArray(d.datos.filas)) return null;
  if (d.tipo === 'proyecto' && !(Array.isArray(d.datos.nodos) && Array.isArray(d.datos.conectores))) return null;
  if (d.tipo !== 'flujo' && d.tipo !== 'gantt' && d.tipo !== 'proyecto') return null;
  return d;
}

// ══ BIBLIOTECA (prototipo: este navegador) ═════════════════════════════════════════════════════════════════
const CLAVE = 'solaris-diagramas-v1';
let BIB = { docs: [], actual: null }, persistente = true;
function cargarBib(){
  try { const s = localStorage.getItem(CLAVE); if (s) { const b = JSON.parse(s); if (b && Array.isArray(b.docs)) BIB = b; } }
  catch (_) { persistente = false; }
}
function guardarBib(){
  try { localStorage.setItem(CLAVE, JSON.stringify(BIB)); persistente = true; }
  catch (_) { persistente = false; }
  if (typeof nubeTrasCambio === 'function') nubeTrasCambio(docActual());   // en la nube, además, se sube lo cambiado (nube.js)
  pintarEstado();
}
function docActual(){ return BIB.docs.find(d => d.id === BIB.actual) || null; }
function nuevoDoc(tipo, titulo, datos){
  const ahora = Date.now();
  const d = { id: uid('d'), tipo, titulo: titulo || (tipo === 'flujo' ? 'Proceso sin título' : 'Proyecto sin título'),
    unidad: '', autor: '', creado: ahora, editado: ahora,
    datos: datos || (tipo === 'flujo' ? { nodos: [], conectores: [] } : tipo === 'proyecto' ? { inicio: hoyISO(), escala: 'semana', nodos: [], conectores: [] } : { escala: 'semana', filas: [] }) };
  BIB.docs.unshift(d);
  return d;
}
function ejemplos(){
  // Un proceso REAL del equipo (el ciclo de un documento, ARRANQUE §2d) y un Gantt de plantilla sin personas.
  const fl = nuevoDoc('flujo', 'Ejemplo — Ciclo de un documento', { nodos: [
    { id: 'a', t: 'inicio', x: 300, y: 40, txt: 'El autor sube el documento' },
    { id: 'b', t: 'datos', x: 290, y: 140, txt: 'Formulario de documentos' },
    { id: 'c', t: 'proceso', x: 290, y: 240, txt: 'Análisis y referencia' },
    { id: 'd', t: 'decision', x: 280, y: 340, txt: '¿El revisor lo aprueba?' },
    { id: 'e', t: 'documento', x: 290, y: 500, txt: 'Publicado en Notion' },
    { id: 'f', t: 'proceso', x: 560, y: 360, txt: 'El autor corrige y reenvía' },
    { id: 'g', t: 'inicio', x: 300, y: 620, txt: 'Fin' },
    { id: 'h', t: 'nota', x: 40, y: 340, txt: 'Revisa el coordinador de la unidad del autor' },
  ], conectores: [
    { id: 'c1', de: 'a', a: 'b' }, { id: 'c2', de: 'b', a: 'c' }, { id: 'c3', de: 'c', a: 'd' },
    { id: 'c4', de: 'd', a: 'e', ld: 's', txt: 'Sí' }, { id: 'c5', de: 'd', a: 'f', ld: 'e', txt: 'Cambios' },
    { id: 'c6', de: 'f', a: 'c', la: 'e' }, { id: 'c7', de: 'e', a: 'g' },
  ] });
  BIB.actual = fl.id;
}

// ══ ESTADO DEL EDITOR ═══════════════════════════════════════════════════════════════════════════════════════
let SEL = null;                       // {k:'n'|'c'|'f', id}
let VISTA = { x: 40, y: 20, k: 1 };   // sólo flujo
const HIST = { atras: [], adelante: [] };
let _guardaT = null;
function confirmar(){   // tras cada cambio con significado: deshacer, guardar y repintar
  const d = docActual(); if (!d) return;
  d.editado = Date.now();
  clearTimeout(_guardaT); _guardaT = setTimeout(guardarBib, 250);
  pintarEstado('cambios');
  if (d.tipo === 'proyecto' && typeof trasCambio === 'function') trasCambio(d);
  pintarLista(); pintar();
}
function instantanea(){   // ANTES de cambiar algo
  const d = docActual(); if (!d) return;
  HIST.atras.push(JSON.stringify(d.datos)); if (HIST.atras.length > 120) HIST.atras.shift();
  HIST.adelante.length = 0; pintarHist();
}
let _deshaciendo = false;
function deshacer(){ const d = docActual(); if (!d || !HIST.atras.length) return; HIST.adelante.push(JSON.stringify(d.datos)); d.datos = JSON.parse(HIST.atras.pop()); SEL = null; _deshaciendo = true; confirmar(); _deshaciendo = false; pintarHist(); }
function rehacer(){ const d = docActual(); if (!d || !HIST.adelante.length) return; HIST.atras.push(JSON.stringify(d.datos)); d.datos = JSON.parse(HIST.adelante.pop()); SEL = null; _deshaciendo = true; confirmar(); _deshaciendo = false; pintarHist(); }
function pintarHist(){ $('#b-deshacer').disabled = !HIST.atras.length; $('#b-rehacer').disabled = !HIST.adelante.length; }
function pintarEstado(que){
  if (typeof NUBE !== 'undefined' && (NUBE.activa || NUBE.estado === 'sesion')
      && pintarEstadoNube(que === 'cambios' && docActual() && docActual().nube ? 'guardando' : null) !== false) return;
  const e = $('#estado');
  if (!persistente) { e.textContent = 'No se puede guardar en este navegador: descárgalo para no perderlo'; e.style.color = 'var(--warn)'; return; }
  e.style.color = '';
  e.textContent = que === 'cambios' ? 'Guardando…' : 'Guardado en este navegador';
}

// ══ PINTAR ══════════════════════════════════════════════════════════════════════════════════════════════════
function pintarLista(){
  ['flujo', 'gantt'].forEach(tipo => {
    const ds = BIB.docs.filter(d => tipo === 'flujo' ? d.tipo === 'flujo' : d.tipo !== 'flujo');
    $('#lista-' + tipo).innerHTML = ds.map(d => `<li data-doc="${d.id}" tabindex="0" role="button" class="${d.id === BIB.actual ? 'activo' : ''}" title="${esc(d.titulo)}"><span class="nom">${esc(d.titulo)}</span><button class="x" data-borrar="${d.id}" title="Borrar">×</button></li>`).join('')
      || '<li class="vacia">Aún no hay ninguno</li>';
  });
}
function pintar(){
  const d = docActual();
  const tit = $('#titulo');
  if (document.activeElement !== tit) tit.value = d ? d.titulo : '';
  $('#tipo-chip').textContent = d ? (d.tipo === 'flujo' ? 'Proceso' : 'Proyecto') : '';
  $('#b-bajar').disabled = $('#b-ver').disabled = !d;
  pintarSellos(d);
  if (!d) { $('#barra').innerHTML = ''; $('#lienzo').innerHTML = ''; $('#inspector').innerHTML = ''; return; }
  if (d.tipo === 'flujo' || (d.tipo === 'proyecto' && PEST === 'plan')) pintarFlujo(d);
  else if (d.tipo === 'proyecto') pintarCalendario(d);
  else pintarGantt(d);
  pintarInspector(d);
}

// ── FLUJO
// ══ PROCESOS: todo camino acaba en un FIN ═══════════════════════════════════════════════════════════════════════
// Daniel, 26/10, con captura: «necesito que este prohibido que suceda algo asi (dead end sin nodo de final)».
// Mientras se dibuja se MARCA (un diagrama a medias siempre tiene cabos sueltos); al descargar se BLOQUEA.
// Inicio = una pieza «Inicio / fin» de la que sólo salen flechas; Fin = una de la que no sale ninguna. Las notas no cuentan.
function revisarProceso(datos){
  const ns = datos.nodos.filter(n => n.t !== 'nota'), ids = new Set(ns.map(n => n.id));
  const sal = {}, ent = {};
  ns.forEach(n => { sal[n.id] = []; ent[n.id] = []; });
  datos.conectores.forEach(c => { if (ids.has(c.de) && ids.has(c.a)) { sal[c.de].push(c.a); ent[c.a].push(c.de); } });
  const prob = [];
  if (!ns.length) return prob;
  const term = n => n.t === 'inicio';
  const inicios = ns.filter(n => term(n) && !ent[n.id].length && sal[n.id].length);
  const fines = ns.filter(n => term(n) && !sal[n.id].length && ent[n.id].length);
  if (!inicios.length) prob.push({ id: null, txt: 'Falta el inicio' });
  if (!fines.length) prob.push({ id: null, txt: 'Falta el fin' });
  const recorre = (desde, sig) => { const v = new Set(), pila = desde.map(n => n.id); while (pila.length) { const x = pila.pop(); if (v.has(x)) continue; v.add(x); sig[x].forEach(y => pila.push(y)); } return v; };
  const alcanzables = recorre(inicios, sal), llevanAlFin = recorre(fines, ent);
  ns.forEach(n => {
    const q = n.txt ? '«' + n.txt + '»' : 'Una pieza';
    if (!ent[n.id].length && !sal[n.id].length) { prob.push({ id: n.id, corto: 'suelta', txt: `${q} está suelta: no le entra ni le sale ninguna flecha` }); return; }
    if (!term(n) && !sal[n.id].length) { prob.push({ id: n.id, corto: 'sin salida', txt: `${q} es un callejón sin salida: no lleva a ningún sitio y no es un Fin` }); return; }
    if (n.t === 'decision' && sal[n.id].length < 2) prob.push({ id: n.id, corto: 'una sola salida', txt: `${q} es una decisión con una sola salida` });
    if (inicios.length && !alcanzables.has(n.id)) prob.push({ id: n.id, corto: 'no se llega', txt: `A ${q} no se llega desde ningún Inicio` });
    else if (fines.length && !llevanAlFin.has(n.id)) prob.push({ id: n.id, corto: 'no llega al fin', txt: `Desde ${q} no se puede llegar a ningún Fin (un bucle sin salida)` });
  });
  return prob;
}
function decoProceso(prob){
  const por = {}; prob.forEach(p => { if (p.id && !por[p.id]) por[p.id] = p.corto; });
  return (n, g) => por[n.id] ? `<rect class="mal-marco" x="-7" y="-7" width="${g.w + 14}" height="${g.h + 14}" rx="8"/><text class="mal-t" x="${g.w / 2}" y="-13" text-anchor="middle">⚠ ${por[n.id]}</text>` : '';
}
function tostadaEl(){
  let t = document.getElementById('tostada');
  if (!t) { t = document.createElement('div'); t.id = 'tostada'; t.className = 'tostada'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.classList.remove('pide'); return t;
}
function mensaje(html, ms){
  const t = tostadaEl(); t.innerHTML = html;
  t.classList.add('ver'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('ver'), ms || 6000);
}
// Lo destructivo pide un sí con Cancelar al lado (HIG: «Destructive, irreversible actions get a warning and a Cancel»).
function pedirSi(html, si, alSi){
  const t = tostadaEl(); clearTimeout(t._t);
  t.innerHTML = html + `<div class="tostada-bot"><button class="btn" data-no>Cancelar</button><button class="btn rojo" data-si>${si}</button></div>`;
  t.classList.add('ver', 'pide');
  const fuera = () => t.classList.remove('ver', 'pide');
  t.querySelector('[data-no]').onclick = fuera;
  t.querySelector('[data-si]').onclick = () => { fuera(); alSi(); };
  t.onkeydown = e => { if (e.key === 'Escape') { e.stopPropagation(); fuera(); } };
  t.querySelector('[data-no]').focus();
}
// Daniel, 31/10: «check de coherencia, y check de validación. Serían diferentes». La COHERENCIA la da la app sola (no queda
// ningún problema); la VALIDACIÓN la da el Project Director, sólo sobre algo coherente, y se cae con cualquier cambio.
function problemasDe(d){
  if (!d) return [];
  if (d.tipo === 'flujo') return revisarProceso(d.datos);
  if (d.tipo === 'proyecto') return avisosVisibles(d);
  return [];
}
function huella(d){
  const s = JSON.stringify([d.titulo || '', d.unidad || '', d.datos]); let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function validacionDe(d){ if (d && d.nube && typeof nubeValidacion === 'function') return nubeValidacion(d); return d && d.validado && d.validado.huella === huella(d) ? d.validado : null; }
function pintarSellos(d){
  const el = $('#sellos'); if (!el) return;
  if (!d || d.tipo === 'gantt') { el.innerHTML = ''; return; }
  const prob = problemasDe(d), v = validacionDe(d);
  // en estrecho sólo queda el símbolo (.larga se oculta); el nombre entero va en aria-label
  const coh = prob.length ? `${prob.length} por resolver` : 'Coherente', val = v ? `Validado · ${dmy(v.fecha)}` : 'Validar';
  el.innerHTML = `<button class="sello ${prob.length ? 'mal' : 'ok'}" id="b-coh" aria-label="${coh}" ${prob.length ? 'title="Ir al primero"' : ''}>${prob.length ? `✕ ${prob.length}<span class="larga"> por resolver</span>` : '✓<span class="larga"> Coherente</span>'}</button>`
    + `<button class="sello${v ? ' ok' : ''}" id="b-val" aria-label="${val}"${!v && prob.length ? ' disabled title="Primero tiene que ser coherente"' : !v && d.tipo === 'proyecto' && !todasCapas(d) ? ' disabled title="Con las capas Fechas y STRL encendidas"' : ''}>${v ? `✓<span class="larga"> ${val}</span>` : 'Validar'}</button>`;
}
function validar(){
  const d = docActual(); if (!d) return;
  if (validacionDe(d)) { pedirSi('<b>¿Quitar la validación?</b>', 'Quitar', () => { if (d.nube) return nubeValidar(d, true); delete d.validado; guardarBib(); pintar(); }); return; }
  if (problemasDe(d).length || (d.tipo === 'proyecto' && !todasCapas(d))) return;
  pedirSi('<b>¿Validar como Project Director?</b>', 'Validar', () => { if (d.nube) return nubeValidar(d); d.validado = { por: 'Project Director', fecha: hoyISO(), huella: huella(d) }; guardarBib(); pintar(); });
}
function irAProblema(prob){
  const p = prob.find(x => x.id);
  if (p && typeof DENTRO !== 'undefined' && docActual().tipo === 'proyecto') { const n = docActual().datos.nodos.find(x => x.id === p.id); PEST = 'plan'; DENTRO = n ? n.padre || null : null; }
  SEL = p ? { k: 'n', id: p.id } : null; pintar();
}
const ED_CSS = `
svg.edit .mal-marco{fill:none;stroke:var(--d-red);stroke-width:1.5;stroke-dasharray:5 3}
svg.edit text.mal-t{font:700 10px ui-monospace,Consolas,monospace;letter-spacing:.06em;fill:var(--d-red)}
svg.edit .n{cursor:move}
svg.edit .port{fill:var(--d-bg);stroke:var(--d-red);stroke-width:1.5;opacity:0;cursor:crosshair;transition:opacity .12s}
svg.edit .n:hover .port,svg.edit .n.sel .port{opacity:1}
svg.edit .port:hover{fill:var(--d-red)}
svg.edit .marco{fill:none;stroke:var(--d-red);stroke-width:1.2;stroke-dasharray:3 3}
svg.edit .e{cursor:pointer}
svg.edit .e .hit{fill:none;stroke:transparent;stroke-width:14}
svg.edit .e.sel .r,svg.edit .e:hover .r{stroke:var(--d-red)}
svg.edit .n.destino .f{stroke:var(--d-red);stroke-width:2.5}
svg.edit .tmp{fill:none;stroke:var(--d-red);stroke-width:1.5;stroke-dasharray:5 4}
svg.edit [data-fila]{cursor:pointer}
svg.edit [data-arr="mover"]{cursor:grab}
`;
function pintarFlujo(d){
  const barra = $('#barra'), esPlan = d.tipo === 'proyecto';
  const modo = esPlan ? 'plan:' + (DENTRO || '') + ':' + d.id + ':' + JSON.stringify(capasDe(d)) : 'flujo';   // otro documento u otras capas: otra barra
  if (esPlan && barra.dataset.modo !== modo) { barra.dataset.modo = modo; barra.innerHTML = barraProyecto(d); }
  if (!esPlan && barra.dataset.modo !== 'flujo') {
    barra.dataset.modo = 'flujo';
    barra.innerHTML = PROCESO_PIEZAS.map(k => `<div class="pieza" data-pieza="${k}">${iconoPieza(k).replace('width="34"', 'width="30"')}${esc(PIEZAS[k].nombre)}</div>`).join('');
  }
  const lz = $('#lienzo');
  lz.classList.remove('gantt');
  let svg = lz.querySelector('#fl');
  if (!svg) {
    lz.innerHTML = `<svg id="fl" class="dg edit dgv" xmlns="http://www.w3.org/2000/svg"><g id="vp"></g><g id="tmp"></g></svg>
      <div class="zoom"><button data-z="-" title="Alejar">−</button><span class="pct" id="pct"></span><button data-z="+" title="Acercar">+</button><button data-z="ajustar" title="Encajar todo">⤢</button></div>`;
    svg = lz.querySelector('#fl');
    engancharFlujo(svg);
  }
  const r = flujoSVG(esPlan ? planVisible(d) : d.datos, { ed: true, sel: SEL, deco: esPlan ? decoPlan(calcularPlan(d), capasDe(d)) : decoProceso(revisarProceso(d.datos)) });
  const vp = svg.querySelector('#vp');
  vp.setAttribute('transform', `translate(${VISTA.x},${VISTA.y}) scale(${VISTA.k})`);
  vp.innerHTML = r.defs + r.cuerpo;
  if (esPlan && typeof atenuar === 'function') atenuar(d, vp);
  svg.querySelector('#tmp').setAttribute('transform', vp.getAttribute('transform'));
  $('#pct').textContent = Math.round(VISTA.k * 100) + '%';
}
function aMundo(svg, ev){
  const b = svg.getBoundingClientRect();
  return [(ev.clientX - b.left - VISTA.x) / VISTA.k, (ev.clientY - b.top - VISTA.y) / VISTA.k];
}
const ajustar = v => Math.round(v / REJILLA) * REJILLA;
const ajustarC = (v, lado) => ajustar(v + lado / 2) - lado / 2;   // v es el borde; se ajusta su centro
function nodoBajo(ev){
  const el = document.elementFromPoint(ev.clientX, ev.clientY);
  const g = el && el.closest && el.closest('[data-n]');
  return g ? g.dataset.n : null;
}
function anadirNodo(t, x, y, conectarDesde, lado){
  const d = docActual(); const P = PIEZAS[t];
  const n = { id: uid('n'), t, x: ajustar(x) - P.w / 2, y: ajustar(y) - P.h / 2, txt: P.def };
  if (d.tipo === 'proyecto') prepararNodoPlan(n);
  d.datos.nodos.push(n);
  if (conectarDesde) d.datos.conectores.push(nuevoConector(d, conectarDesde, n.id, lado));
  SEL = { k: 'n', id: n.id };
  return n;
}
function nuevoConector(d, de, a, lado){
  const c = { id: uid('c'), de, a };
  if (lado) c.ld = lado;
  const origen = d.datos.nodos.find(n => n.id === de);
  if (origen && origen.t === 'decision') {   // de una decisión salen «Sí» y «No» por defecto
    const ya = d.datos.conectores.filter(x => x.de === de).length;
    c.txt = ya === 0 ? 'Sí' : ya === 1 ? 'No' : '';
  }
  return c;
}
let ARR = null;   // arrastre en curso
// Pinchar el lienzo no quita el foco hasta DESPUÉS del pointerdown; sin esto el inspector se cree que alguien escribe
// y se queda con la pieza anterior. El `change` que dispara el blur guarda lo escrito, que es lo que se quiere.
function soltarFoco(){ const a = document.activeElement; if (a && a !== document.body && a.matches('input,textarea,select')) a.blur(); }
let _toque = null; // el último toque, para el doble toque
function engancharFlujo(svg){
  svg.addEventListener('pointerdown', ev => {
    if (ev.button !== 0 && ev.pointerType === 'mouse') return;
    cerrarEditorTexto(true);
    soltarFoco();
    const d = docActual(); const p = aMundo(svg, ev);
    const port = ev.target.closest('.port'), gn = ev.target.closest('[data-n]'), gc = ev.target.closest('[data-c]');
    if (port && gn) {
      ARR = { tipo: 'enlace', de: gn.dataset.n, lado: port.dataset.port, p0: p };
    } else if (gn) {
      const n = d.datos.nodos.find(x => x.id === gn.dataset.n);
      if (_toque && _toque.id === n.id && Date.now() - _toque.t < 380) {   // doble toque: abrir un componente, o escribir
        _toque = null; setTimeout(() => { if (d.tipo === 'proyecto' && n.t === 'componente') entrar(n.id); else if (n.t !== 'o') abrirEditorTexto(n.id); }, 0); return;
      }
      _toque = { id: n.id, t: Date.now() };
      SEL = { k: 'n', id: n.id };
      ARR = { tipo: 'mover', n, dx: p[0] - n.x, dy: p[1] - n.y, x0: n.x, y0: n.y, movido: false };
      pintar();
    } else if (gc) {
      const doble = _toque && _toque.id === gc.dataset.c && Date.now() - _toque.t < 380;
      _toque = { id: gc.dataset.c, t: Date.now() };
      SEL = { k: 'c', id: gc.dataset.c }; ARR = null; pintar();
      if (doble) { const i = $('#i-etq'); if (i) { i.focus(); i.select(); } }
      return;
    } else {
      if (SEL) { SEL = null; pintar(); }
      ARR = { tipo: 'pan', sx: ev.clientX, sy: ev.clientY, vx: VISTA.x, vy: VISTA.y };
      svg.style.cursor = 'grabbing';
    }
    svg.setPointerCapture(ev.pointerId);
  });
  svg.addEventListener('pointermove', ev => {
    if (!ARR) return;
    const p = aMundo(svg, ev);
    if (ARR.tipo === 'pan') {
      VISTA.x = ARR.vx + ev.clientX - ARR.sx; VISTA.y = ARR.vy + ev.clientY - ARR.sy;
      const t = `translate(${VISTA.x},${VISTA.y}) scale(${VISTA.k})`;
      svg.querySelector('#vp').setAttribute('transform', t); svg.querySelector('#tmp').setAttribute('transform', t);
    } else if (ARR.tipo === 'mover') {
      const gm = geoNodo(ARR.n), nx = ajustarC(p[0] - ARR.dx, gm.w), ny = ajustarC(p[1] - ARR.dy, gm.h);
      if (nx !== ARR.n.x || ny !== ARR.n.y) {
        if (!ARR.movido) { ARR.movido = true; ARR.n.x = ARR.x0; ARR.n.y = ARR.y0; instantanea(); }
        ARR.n.x = nx; ARR.n.y = ny; pintarFlujo(docActual());
      }
    } else if (ARR.tipo === 'enlace') {
      const d = docActual();
      const ga = geoNodo(d.datos.nodos.find(n => n.id === ARR.de));
      const a = puerto(ga, ARR.lado);
      svg.querySelector('#tmp').innerHTML = `<path class="tmp" d="M${a[0]} ${a[1]}L${p[0]} ${p[1]}"/>`;
      const bajo = nodoBajo(ev);
      svg.querySelectorAll('.destino').forEach(x => x.classList.remove('destino'));
      if (bajo && bajo !== ARR.de) { const g = svg.querySelector(`[data-n="${bajo}"]`); if (g) g.classList.add('destino'); }
    }
  });
  const fin = ev => {
    if (!ARR) return;
    const a = ARR; ARR = null; svg.style.cursor = '';
    svg.querySelector('#tmp').innerHTML = '';
    if (a.tipo === 'mover' && a.movido) confirmar();
    if (a.tipo === 'enlace') {
      const d = docActual(); const p = aMundo(svg, ev);
      const bajo = nodoBajo(ev);
      if (bajo && bajo !== a.de) {
        if (!d.datos.conectores.some(c => c.de === a.de && c.a === bajo)) {
          instantanea();
          if (d.tipo === 'proyecto') { const c = enlazarPlan(d, a.de, bajo, a.lado); if (c) SEL = { k: 'c', id: c.id }; }
          else { const c = nuevoConector(d, a.de, bajo, a.lado); d.datos.conectores.push(c); SEL = { k: 'c', id: c.id }; }
          confirmar();
        }
      } else if (!bajo && Math.hypot(p[0] - a.p0[0], p[1] - a.p0[1]) > 30) {
        // soltar en vacío crea un PROCESO ahí, ya conectado: el gesto más rápido para seguir el flujo
        instantanea();
        if (d.tipo === 'proyecto') { const n = anadirNodo(DENTRO ? 'paso' : 'componente', p[0], p[1]); enlazarPlan(d, a.de, n.id, a.lado); }
        else anadirNodo('proceso', p[0], p[1], a.de, a.lado);
        confirmar();
      } else { if (Math.hypot(p[0] - a.p0[0], p[1] - a.p0[1]) < 6) SEL = { k: 'n', id: a.de }; pintar(); }   // un toque en el asa, sin arrastrar: selecciona la pieza
    }
  };
  svg.addEventListener('pointerup', fin);
  svg.addEventListener('pointercancel', fin);
  svg.addEventListener('wheel', ev => {
    ev.preventDefault();
    if (ev.ctrlKey || ev.metaKey) zoomEn(svg, Math.exp(-ev.deltaY * 0.01), ev.clientX, ev.clientY);
    else { VISTA.x -= ev.deltaX; VISTA.y -= ev.deltaY; pintarFlujo(docActual()); }
  }, { passive: false });
}
function zoomEn(svg, f, cx, cy){
  const b = svg.getBoundingClientRect();
  const k = Math.min(2.5, Math.max(0.25, VISTA.k * f));
  const px = (cx == null ? b.width / 2 : cx - b.left), py = (cy == null ? b.height / 2 : cy - b.top);
  VISTA.x = px - (px - VISTA.x) * k / VISTA.k; VISTA.y = py - (py - VISTA.y) * k / VISTA.k; VISTA.k = k;
  pintarFlujo(docActual());
}
function encajar(){
  const d = docActual(); const svg = $('#fl'); if (!d || !svg) return;
  const vis = d.tipo === 'proyecto' ? planVisible(d).nodos : d.datos.nodos;
  const geos = {}; vis.forEach(n => { geos[n.id] = geoNodo(n); });
  if (!vis.length) { VISTA = { x: 40, y: 20, k: 1 }; pintarFlujo(d); return; }
  const c = cajaFlujo(geos), b = svg.getBoundingClientRect(), m = 50;
  const k = Math.min(1.25, Math.max(0.25, Math.min((b.width - 2 * m) / c.w, (b.height - 2 * m) / c.h)));
  VISTA = { k, x: (b.width - c.w * k) / 2 - c.x * k, y: (b.height - c.h * k) / 2 - c.y * k };
  pintarFlujo(d);
}
let _edTexto = null;
function abrirEditorTexto(id){
  const d = docActual(); const n = d.datos.nodos.find(x => x.id === id); if (!n) return;
  SEL = { k: 'n', id }; pintar();
  const g = geoNodo(n), lz = $('#lienzo');
  const ta = document.createElement('textarea');
  ta.className = 'editor-texto'; ta.value = n.txt;
  const P = PIEZAS[n.t], w = P.tw + 12;
  Object.assign(ta.style, { left: (VISTA.x + (n.x + (g.w - w) / 2) * VISTA.k) + 'px', top: (VISTA.y + (n.y + 6) * VISTA.k) + 'px',
    width: w * VISTA.k + 'px', height: (g.h - 12) * VISTA.k + 'px', fontSize: 13 * VISTA.k + 'px', lineHeight: LH * VISTA.k + 'px' });
  lz.appendChild(ta); ta.focus(); ta.select();
  _edTexto = { ta, id, antes: n.txt };
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); cerrarEditorTexto(true); }
    else if (e.key === 'Escape') { e.preventDefault(); cerrarEditorTexto(false); }
    e.stopPropagation();
  });
  ta.addEventListener('blur', () => cerrarEditorTexto(true));
}
function cerrarEditorTexto(guardar){
  if (!_edTexto) return;
  const { ta, id, antes } = _edTexto; _edTexto = null;
  const n = docActual().datos.nodos.find(x => x.id === id);
  const nuevo = ta.value.trim();
  ta.remove();
  if (guardar && n && nuevo !== antes) { instantanea(); n.txt = nuevo; confirmar(); } else pintar();
}

// Las piezas de la barra: arrastrar al lienzo, o pulsar para añadir debajo de la seleccionada (y conectarla).
function engancharBarra(){
  $('#barra').addEventListener('pointerdown', ev => {
    const pz = ev.target.closest('[data-pieza]'); if (!pz) return;
    ev.preventDefault();
    const t = pz.dataset.pieza, x0 = ev.clientX, y0 = ev.clientY;
    let fant = null;
    const mov = e => {
      if (!fant && Math.hypot(e.clientX - x0, e.clientY - y0) > 6) { fant = document.createElement('div'); fant.className = 'fantasma'; fant.innerHTML = iconoPieza(t).replace('width="34"', 'width="80"').replace(/height="\d+"/, 'height="40"'); document.body.appendChild(fant); }
      if (fant) { fant.style.left = e.clientX - 40 + 'px'; fant.style.top = e.clientY - 20 + 'px'; }
    };
    const sube = e => {
      document.removeEventListener('pointermove', mov); document.removeEventListener('pointerup', sube);
      const svg = $('#fl'); const d = docActual();
      if (fant) {
        fant.remove();
        const b = svg.getBoundingClientRect();
        if (e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom) { instantanea(); anadirNodo(t, ...aMundo(svg, e)); confirmar(); }
        return;
      }
      // un toque: debajo de la seleccionada y conectada; si no hay, en el centro de la vista
      instantanea();
      const s = SEL && SEL.k === 'n' && d.datos.nodos.find(n => n.id === SEL.id);
      if (s) { const g = geoNodo(s); anadirNodo(t, g.x + g.w / 2, g.y + g.h + 60 + PIEZAS[t].h / 2, s.id); }
      else { const b = svg.getBoundingClientRect(); anadirNodo(t, (b.width / 2 - VISTA.x) / VISTA.k, (b.height / 2 - VISTA.y) / VISTA.k); }
      confirmar();
    };
    document.addEventListener('pointermove', mov); document.addEventListener('pointerup', sube);
  });
  $('#barra').addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    const d = docActual(); if (!d || d.tipo !== 'gantt') return;
    if (b.dataset.escala) { instantanea(); d.datos.escala = b.dataset.escala; confirmar(); }
    if (b.dataset.add) { instantanea(); anadirFila(d, b.dataset.add); confirmar(); }
  });
  $('#lienzo').addEventListener('click', ev => {
    const z = ev.target.closest('[data-z]'); if (!z) return;
    const svg = $('#fl');
    if (z.dataset.z === '+') zoomEn(svg, 1.2); else if (z.dataset.z === '-') zoomEn(svg, 1 / 1.2); else encajar();
  });
}

// ── GANTT
function pintarGantt(d){
  const barra = $('#barra');
  if (barra.dataset.modo !== 'gantt') barra.dataset.modo = 'gantt';
  barra.innerHTML = `<button class="btn" data-add="fase">+ Fase</button><button class="btn" data-add="tarea">+ Tarea</button><button class="btn" data-add="hito">+ Hito</button>
    <span class="sep"></span><span class="seg">${Object.keys(ESCALAS).map(k => `<button data-escala="${k}" class="${(d.datos.escala || 'semana') === k ? 'on' : ''}">${ESCALAS[k].nombre}</button>`).join('')}</span>`;
  const lz = $('#lienzo');
  lz.classList.add('gantt');
  const scroll = [lz.scrollLeft, lz.scrollTop];
  const p = ganttPartes(d.datos, { ed: true, sel: SEL && SEL.k === 'f' ? SEL : null });
  lz.innerHTML = `<div class="gwrap dgv"><svg class="dg edit gtabla" width="${G_TW}" height="${p.H}" viewBox="0 0 ${G_TW} ${p.H}">${p.defs}${p.tabla}</svg><svg class="dg edit glinea" width="${p.LW}" height="${p.H}" viewBox="0 0 ${p.LW} ${p.H}">${p.defs}${p.linea}</svg></div>`;
  if (!lz.dataset.enganchado) { engancharGantt(lz); lz.dataset.enganchado = '1'; }
  lz.scrollLeft = scroll[0]; lz.scrollTop = scroll[1];
  lz._g = p;
  if (lz._irA) { ganttVer(lz, lz._irA); lz._irA = null; }
}
// Desplaza la línea de tiempo para que se vea una fecha (o la barra de una fila) si ahora cae fuera.
function ganttVer(lz, que){
  const p = lz._g; if (!p) return;
  let iso = que;
  if (!/^\d{4}-\d\d-\d\d$/.test(que)) { const o = p.filas.find(x => x.f.id === que); if (!o) return; iso = o.ini; }
  const x = diasEntre(p.lo, iso) * p.px;
  const visto0 = lz.scrollLeft, visto1 = lz.scrollLeft + lz.clientWidth - G_TW;
  if (x < visto0 + 20 || x > visto1 - 60) lz.scrollLeft = Math.max(0, x - 80);
}
function anadirFila(d, t){
  const fs = d.datos.filas, hoy = hoyISO();
  const filas = ganttFilas(d.datos);
  const s = SEL && SEL.k === 'f' ? filas.find(o => o.f.id === SEL.id) : null;
  let pos = fs.length, ini = hoy;
  if (t !== 'fase' && s) {
    if (s.f.t === 'fase') { pos = s.i + 1 + s.hijos.length; ini = s.hijos.length ? sumaDias(s.fin, 1) : s.ini; }
    else { pos = s.i + 1; ini = s.f.t === 'hito' ? s.fin : sumaDias(s.fin, 1); }
  } else if (t !== 'fase' && filas.length) ini = sumaDias(filas.reduce((m, o) => o.fin > m ? o.fin : m, filas[0].fin), 1);
  const nombres = { fase: 'Fase nueva', tarea: 'Tarea nueva', hito: 'Hito' };
  const f = { id: uid('g'), t, nombre: nombres[t], ini, fin: t === 'hito' ? undefined : sumaDias(ini, t === 'fase' ? 13 : 4) };
  if (t !== 'fase') { f.resp = ''; f.deps = (s && s.f.t !== 'fase') ? [s.f.id] : []; }
  if (t === 'hito') delete f.fin;
  fs.splice(pos, 0, f);
  SEL = { k: 'f', id: f.id };
}
function engancharGantt(lz){
  const esGantt = () => { const d = docActual(); return d && d.tipo === 'gantt'; };
  lz.addEventListener('pointerdown', ev => {
    if (!esGantt()) return;
    if (!ev.target.closest('svg')) return;   // la barra de desplazamiento no deselecciona
    soltarFoco();
    const g = ev.target.closest('[data-fila]'); if (!g) { if (SEL) { SEL = null; pintar(); } return; }
    const d = docActual(); const id = g.dataset.fila;
    SEL = { k: 'f', id };
    if (ev.target.closest('svg.gtabla')) lz._irA = id;   // elegida en la tabla: que se vea su barra
    const arr = ev.target.closest('[data-arr]');
    if (arr && ev.target.closest('svg.glinea')) {
      const modo = ev.target.dataset.arr || arr.dataset.arr;
      const f = d.datos.filas.find(x => x.id === id);
      const filas = ganttFilas(d.datos); const o = filas.find(x => x.f.id === id);
      const mueve = f.t === 'fase' ? [f].concat(o.hijos.map(h => h.f)) : [f];
      ARR = { tipo: 'gantt', modo, x0: ev.clientX, orig: mueve.map(x => [x, x.ini, x.fin]), hecho: false, f };
      document.addEventListener('pointermove', mueveG); document.addEventListener('pointerup', finG); document.addEventListener('pointercancel', finG);
      ev.preventDefault();
    }
    pintar();
  });
  function mueveG(ev){
    if (!ARR || ARR.tipo !== 'gantt') return;
    const px = lz._g.px; const dd = Math.round((ev.clientX - ARR.x0) / px);
    if (!ARR.hecho && dd === 0) return;
    const d = docActual();
    if (!ARR.hecho) { ARR.hecho = true; instantanea(); }   // aún sin tocar nada: la instantánea es el ANTES
    ARR.orig.forEach(([x, i, f]) => {
      if (ARR.modo === 'mover') { x.ini = sumaDias(i, dd); if (f) x.fin = sumaDias(f, dd); }
      else if (ARR.modo === 'ini') { const n = sumaDias(i, dd); if (n <= x.fin) x.ini = n; }
      else if (ARR.modo === 'fin') { const n = sumaDias(f, dd); if (n >= x.ini) x.fin = n; }
    });
    pintarGantt(d);
  }
  function finG(){
    document.removeEventListener('pointermove', mueveG); document.removeEventListener('pointerup', finG); document.removeEventListener('pointercancel', finG);
    if (ARR && ARR.tipo === 'gantt') { const h = ARR.hecho; ARR = null; if (h) confirmar(); }
  }
  lz.addEventListener('dblclick', ev => { if (esGantt() && ev.target.closest('[data-fila]')) { const i = $('#i-nombre'); if (i) { i.focus(); i.select(); } } });
}

// ── INSPECTOR
function campo(et, html){ return `<label class="campo"><span>${et}</span>${html}</label>`; }
// Un campo con un SELECTOR dentro va en <div>: un <label> reenvía el clic a su primer botón y reabriría la lista.
function campoSel(et, html){ return `<div class="campo"><span>${et}</span>${html}</div>`; }
// El desplegable PROPIO (Daniel, 26/10: «y el selector hacer uno custom casi mejor»). El de sistema no se deja pintar.
// `ops`: [[valor, texto, color?]]. Guarda el valor en un <input hidden> con `attrs` y dispara `change` sobre él, así que
// los manejadores del inspector lo tratan igual que al <select> que sustituye.
function selector(ops, valor, attrs){
  const cur = ops.find(o => String(o[0]) === String(valor == null ? '' : valor)) || ops[0];
  const punto = o => o.length > 2 ? `<i style="background:${o[2] || 'transparent'}"></i>` : '';
  return `<div class="selu"><input type="hidden" ${attrs} value="${esc(cur[0])}"><button type="button" class="selu-b">${punto(cur)}<span class="${cur[0] === '' ? 'vacio' : ''}">${esc(cur[1])}</span><b>▾</b></button>`
    + `<div class="selu-l">${ops.map(o => `<button type="button" data-v="${esc(o[0])}" class="${o === cur ? 'on' : ''}">${punto(o)}${esc(o[1])}</button>`).join('')}</div></div>`;
}
document.addEventListener('click', ev => {
  document.querySelectorAll('.selu.abierto').forEach(x => { if (!x.contains(ev.target)) x.classList.remove('abierto'); });
  const b = ev.target.closest('.selu-b'); if (b) { b.parentElement.classList.toggle('abierto'); return; }
  const op = ev.target.closest('.selu-l [data-v]'); if (!op) return;
  const s = op.closest('.selu'), inp = s.querySelector('input[type=hidden]');
  s.classList.remove('abierto');
  if (inp.value === op.dataset.v) return;
  inp.value = op.dataset.v;
  inp.dispatchEvent(new Event('change', { bubbles: true }));
});
document.addEventListener('keydown', ev => {   // Esc cierra la lista sin deseleccionar la pieza
  const ab = document.querySelector('.selu.abierto');
  if (ev.key === 'Escape' && ab) { ab.classList.remove('abierto'); ev.stopPropagation(); }
}, true);
// Primero las seis que tienen color en Notion; luego las que no (salen en gris). Recovery: la unidad nueva de la EuRoC.
const UNIDADES = ['Aviónica', 'GNC', 'Propulsión', 'Aeroestructuras', 'Org&Mark', 'Project Director', 'Recovery', 'Logística', 'Patrocinios', 'UCT'];
function pintarInspector(d){
  const ins = $('#inspector');
  if (ins.contains(document.activeElement) && document.activeElement.matches('input[type=text],textarea')) return;   // no le quites el foco a quien escribe
  if (d.tipo === 'proyecto') { const hp = inspectorProyecto(d); if (hp !== null) { ins.innerHTML = hp; return; } }
  let h = '';
  if (d.tipo === 'flujo' && SEL && SEL.k === 'n') {
    const n = d.datos.nodos.find(x => x.id === SEL.id);
    if (n) h = `<h3>${iconoPieza(n.t)}${esc(PIEZAS[n.t].nombre)}</h3>
      ${campoSel('Pieza', selector(PROCESO_PIEZAS.map(k => [k, PIEZAS[k].nombre]), n.t, 'id="i-pieza"'))}
      ${campo('Texto', `<textarea id="i-texto" rows="3">${esc(n.txt)}</textarea>`)}
      <div class="botones"><button class="btn" id="i-dup">Duplicar</button><button class="btn peligro" id="i-borrar">Borrar</button></div>`;
  } else if (d.tipo !== 'gantt' && SEL && SEL.k === 'c') {
    const c = d.datos.conectores.find(x => x.id === SEL.id);
    if (c) {
      const a = d.datos.nodos.find(n => n.id === c.de), b = d.datos.nodos.find(n => n.id === c.a);
      h = `<h3>Conector</h3><p class="ayuda" style="padding:0">${esc(a ? a.txt : '')} → ${esc(b ? b.txt : '')}</p>
        ${campo('Etiqueta', `<input type="text" id="i-etq" value="${esc(c.txt || '')}" placeholder="Sin etiqueta" maxlength="24">`)}
        <div class="rapidas">${['Sí', 'No', 'Cambios'].map(x => `<button data-etq="${x}">${x}</button>`).join('')}<button data-etq="">Quitar</button></div>
        <div class="botones"><button class="btn" id="i-invertir">Invertir sentido</button><button class="btn peligro" id="i-borrar">Borrar</button></div>`;
    }
  } else if (d.tipo === 'gantt' && SEL && SEL.k === 'f') {
    const filas = ganttFilas(d.datos); const o = filas.find(x => x.f.id === SEL.id);
    if (o) {
      const f = o.f, calcFase = f.t === 'fase' && o.hijos.length;
      const cand = filas.filter(x => x.f.t !== 'fase' && x.f.id !== f.id);
      const malas = (f.deps || []).map(id => filas.find(x => x.f.id === id)).filter(p => p && depMal(p, o));
      h = `<h3>${iconoGantt(f.t === 'fase' ? 'fase' : f.t === 'hito' ? 'hito' : 'tarea')}${f.t === 'fase' ? 'Fase' : f.t === 'hito' ? 'Hito' : 'Tarea'} <span class="mono" style="color:var(--ink3);font-weight:400">#${o.i + 1}</span></h3>
        ${campo('Nombre', `<input type="text" id="i-nombre" value="${esc(f.nombre || '')}">`)}
        ${f.t !== 'fase' ? campo('Responsable', `<input type="text" id="i-resp" value="${esc(f.resp || '')}" placeholder="Quién lo lleva">`) : ''}
        ${f.t === 'hito' ? campo('Fecha', `<input type="date" id="i-ini" value="${o.ini}">`)
          : `<div class="fila2">${campo('Inicio', `<input type="date" id="i-ini" value="${o.ini}"${calcFase ? ' disabled' : ''}>`)}${campo('Fin', `<input type="date" id="i-fin" value="${o.fin}"${calcFase ? ' disabled' : ''}>`)}</div>
             <p class="ayuda" style="padding:0">${diasEntre(o.ini, o.fin) + 1} días${calcFase ? ' · las fechas de la fase salen de sus tareas' : ''}</p>`}
        ${f.t !== 'fase' ? campo('Depende de', `<div class="deps">${cand.length ? cand.map(x => `<label><input type="checkbox" data-dep="${x.f.id}"${(f.deps || []).includes(x.f.id) ? ' checked' : ''}><span class="mono" style="color:var(--ink3)">${x.i + 1}</span> ${esc(x.f.nombre || '')}</label>`).join('') : '<span class="ayuda" style="padding:0">No hay otras tareas</span>'}</div>`) : ''}
        ${malas.length ? `<div class="aviso">Empieza antes de que acabe ${malas.map(p => '«' + esc(p.f.nombre) + '»').join(', ')}. <button class="btn" id="i-encajar" style="margin-top:6px">Moverla detrás</button></div>` : ''}
        <div class="botones"><button class="btn" id="i-subir" title="Subir">↑</button><button class="btn" id="i-bajar" title="Bajar">↓</button><button class="btn peligro" id="i-borrar">Borrar</button></div>`;
    }
  }
  if (!h) {
    h = `<h3>Documento</h3>
      <div class="campo"><span>Unidad</span>${selectorUnidad(d.unidad, 'doc')}</div>
      ${d.tipo === 'flujo' ? revisionHTML(revisarProceso(d.datos)) : ''}`;
  }
  ins.innerHTML = h;
}
function engancharInspector(){
  const ins = $('#inspector');
  ins.addEventListener('input', ev => {
    const d = docActual(); if (!d) return;
    const t = ev.target;
    const editar = fn => { if (!t.dataset.snap) { instantanea(); t.dataset.snap = '1'; } fn(); d.editado = Date.now(); clearTimeout(_guardaT); _guardaT = setTimeout(guardarBib, 400); pintarEstado('cambios'); if (d.tipo === 'flujo') pintarFlujo(d); else pintarGantt(d); };
    if (t.id === 'i-texto') editar(() => { d.datos.nodos.find(n => n.id === SEL.id).txt = t.value; });
    if (t.id === 'i-etq') editar(() => { d.datos.conectores.find(c => c.id === SEL.id).txt = t.value; });
    if (t.id === 'i-nombre') editar(() => { d.datos.filas.find(f => f.id === SEL.id).nombre = t.value; });
    if (t.id === 'i-resp') editar(() => { d.datos.filas.find(f => f.id === SEL.id).resp = t.value; });
  });
  ins.addEventListener('change', ev => {
    const d = docActual(); if (!d) return;
    const t = ev.target;
    if (t.matches('input[type=text],textarea')) { delete t.dataset.snap; pintarLista(); return; }
    if (t.dataset.p === 'doc.unidad' && d.tipo !== 'proyecto') { instantanea(); d.unidad = t.value; confirmar(); }   // la de un proceso
    if (t.id === 'i-pieza') { instantanea(); d.datos.nodos.find(n => n.id === SEL.id).t = t.value; confirmar(); }
    if (t.id === 'i-ini' || t.id === 'i-fin') {
      if (!t.value) return;
      const f = d.datos.filas.find(x => x.id === SEL.id);
      instantanea();
      if (t.id === 'i-ini') { const dur = f.fin ? diasEntre(f.ini, f.fin) : 0; f.ini = t.value; if (f.fin) f.fin = sumaDias(t.value, dur); }   // mover el inicio conserva la duración
      else { f.fin = t.value < f.ini ? f.ini : t.value; }
      confirmar();
    }
    if (t.dataset.dep) {
      const f = d.datos.filas.find(x => x.id === SEL.id); instantanea();
      f.deps = (f.deps || []).filter(x => x !== t.dataset.dep); if (t.checked) f.deps.push(t.dataset.dep);
      confirmar();
    }
  });
  ins.addEventListener('click', ev => {
    const d = docActual(); if (!d) return;
    const ir = ev.target.closest('[data-ir-n]');   // un problema de la comprobación: ir a la pieza
    if (ir) { SEL = { k: 'n', id: ir.dataset.irN }; pintar(); return; }
    const b = ev.target.closest('button'); if (!b) return;
    if (b.id === 'i-borrar') borrarSel();
    if (b.id === 'i-dup') duplicarSel();
    if (b.dataset.etq != null && SEL && SEL.k === 'c') { instantanea(); d.datos.conectores.find(c => c.id === SEL.id).txt = b.dataset.etq; confirmar(); }
    if (b.id === 'i-invertir') { instantanea(); const c = d.datos.conectores.find(x => x.id === SEL.id); [c.de, c.a] = [c.a, c.de]; delete c.ld; delete c.la; confirmar(); }
    if (b.id === 'i-subir' || b.id === 'i-bajar') {
      const fs = d.datos.filas, i = fs.findIndex(f => f.id === SEL.id), j = i + (b.id === 'i-subir' ? -1 : 1);
      if (j < 0 || j >= fs.length) return;
      instantanea(); [fs[i], fs[j]] = [fs[j], fs[i]]; confirmar();
    }
    if (b.id === 'i-encajar') {
      const filas = ganttFilas(d.datos); const o = filas.find(x => x.f.id === SEL.id);
      const tope = (o.f.deps || []).map(id => filas.find(x => x.f.id === id)).filter(Boolean).reduce((m, p) => { const n = p.f.t === 'hito' ? p.fin : sumaDias(p.fin, 1); return n > m ? n : m; }, o.ini);
      instantanea(); const dd = diasEntre(o.f.ini, tope); o.f.ini = tope; if (o.f.fin) o.f.fin = sumaDias(o.f.fin, dd); confirmar();
    }
  });
}
function borrarSel(){
  const d = docActual(); if (!d || !SEL) return;
  instantanea();
  if (SEL.k === 'n') {   // con un componente se van también sus pasos
    const fuera = new Set([SEL.id]); let crece = true;
    while (crece) { crece = false; d.datos.nodos.forEach(n => { if (n.padre && fuera.has(n.padre) && !fuera.has(n.id)) { fuera.add(n.id); crece = true; } }); }
    d.datos.nodos = d.datos.nodos.filter(n => !fuera.has(n.id)); d.datos.conectores = d.datos.conectores.filter(c => !fuera.has(c.de) && !fuera.has(c.a));
  }
  if (SEL.k === 'c') d.datos.conectores = d.datos.conectores.filter(c => c.id !== SEL.id);
  if (SEL.k === 'f') { d.datos.filas = d.datos.filas.filter(f => f.id !== SEL.id); d.datos.filas.forEach(f => { if (f.deps) f.deps = f.deps.filter(x => x !== SEL.id); }); }
  SEL = null; confirmar();
}
function duplicarSel(){
  const d = docActual(); if (!d || !SEL || SEL.k !== 'n') return;
  const n = d.datos.nodos.find(x => x.id === SEL.id); if (!n) return;
  instantanea(); const m = Object.assign(copia(n), { id: uid('n'), x: n.x + 40, y: n.y + 40 });
  d.datos.nodos.push(m); SEL = { k: 'n', id: m.id }; confirmar();
}

// ══ ARRANQUE ════════════════════════════════════════════════════════════════════════════════════════════════
function abrirDoc(id){ if (typeof nubeAlAbrir === 'function' && nubeAlAbrir(id)) { BIB.actual = id; pintarLista(); return; } cerrarEditorTexto(true); $('#lienzo')._irA = hoyISO(); PEST = 'plan'; DENTRO = null; BIB.actual = id; SEL = null; HIST.atras.length = HIST.adelante.length = 0; pintarHist(); guardarBib(); pintarLista(); pintar(); if (docActual() && docActual().tipo !== 'gantt') requestAnimationFrame(encajar); $('#lateral').classList.remove('abierto'); }
function revisionHTML(prob){
  return `<div class="sc">Coherencia</div>` + (prob.length
    ? prob.map(p => `<div class="aviso"${p.id ? ` data-ir-n="${p.id}" style="cursor:pointer"` : ''}>${esc(p.txt)}</div>`).join('')
    : `<p class="ayuda ok-txt" style="padding:0">✓ Coherente</p>`);
}
function descargar(){
  const d = docActual(); if (!d) return;
  if (window.self !== window.top) { mensaje('<b>Desde aquí no se puede descargar.</b>', 5000); return; }
  const blob = new Blob([documentoHTML(d)], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombreFichero(d);
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function vistaPrevia(){
  const d = docActual(); if (!d) return;
  const html = documentoHTML(d);
  const u = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const w = window.self === window.top ? window.open(u, '_blank') : null; setTimeout(() => URL.revokeObjectURL(u), 60000);
  if (!w) vistaEnCapa(html);   // sin ventana nueva (página publicada): la misma vista, en una capa
}
function vistaEnCapa(html){
  let c = document.getElementById('capa-vista');
  if (!c) {
    c = document.createElement('div'); c.id = 'capa-vista'; c.className = 'capa-vista';
    c.innerHTML = '<div class="capa-cab"><b>Vista previa</b><span></span><button class="btn" data-cerrar>Cerrar</button></div><iframe title="Vista previa del documento"></iframe>';
    document.body.appendChild(c);
    c.querySelector('[data-cerrar]').onclick = () => { c.hidden = true; };
    c.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); c.hidden = true; } });
  }
  c.querySelector('iframe').srcdoc = html; c.hidden = false; c.querySelector('[data-cerrar]').focus();
}
// HIG (escritorio): todo alcanzable con teclado. Con el foco en el lienzo o una pieza elegida, Tab / Mayús+Tab pasa a la
// siguiente pieza en orden de lectura (arriba→abajo, izquierda→derecha); al salir de la última, Tab sigue su camino normal.
function tabPiezas(atras){
  const d = docActual(), lz = $('#lienzo');
  if (!d || d.tipo === 'gantt' || (d.tipo === 'proyecto' && PEST !== 'plan')) return false;
  if (document.activeElement !== lz && !(SEL && SEL.k === 'n')) return false;
  const nivel = d.tipo === 'proyecto' ? (DENTRO || null) : undefined;
  const lista = d.datos.nodos.filter(n => nivel === undefined || (n.padre || null) === nivel).slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const i = SEL && SEL.k === 'n' ? lista.findIndex(n => n.id === SEL.id) : -1;
  const j = atras ? (i < 0 ? lista.length - 1 : i - 1) : i + 1;
  if (j < 0 || j >= lista.length) { SEL = null; pintar(); return false; }
  SEL = { k: 'n', id: lista[j].id }; pintar(); lz.focus({ preventScroll: true });
  return true;
}
function iniciar(){
  const st = document.createElement('style'); st.textContent = DIAG_CSS + ED_CSS; document.head.appendChild(st);
  cargarBib();
  if (!BIB.docs.length) { ejemplos(); guardarBib(); }
  // el ejemplo con tarjetas (11/11), también a quien ya tenía el viejo
  if (!BIB.docs.some(d => d.titulo === 'Ejemplo — Aerofrenos')) { const a = BIB.actual; ejemploProyecto(); BIB.actual = a; guardarBib(); }
  if (!docActual()) BIB.actual = BIB.docs[0] && BIB.docs[0].id;
  $('#b-nuevo-flujo').onclick = () => { const d = nuevoDoc('flujo'); if (typeof nubeCrear === 'function') nubeCrear(d); abrirDoc(d.id); };
  $('#b-nuevo-gantt').onclick = () => { const d = nuevoDoc('proyecto'); if (typeof nubeCrear === 'function') nubeCrear(d); abrirDoc(d.id); };
  $('#b-bajar').onclick = descargar;
  $('#sellos').addEventListener('click', ev => {
    if (ev.target.closest('#b-val')) return validar();
    if (ev.target.closest('#b-coh')) { const pr = problemasDe(docActual()); if (pr.length) irAProblema(pr); }
  });
  $('#b-ver').onclick = vistaPrevia;
  $('#b-deshacer').onclick = deshacer; $('#b-rehacer').onclick = rehacer;
  $('#b-menu').onclick = () => $('#lateral').classList.toggle('abierto');
  $('#titulo').addEventListener('input', e => { const d = docActual(); if (!d) return; d.titulo = e.target.value; d.editado = Date.now(); clearTimeout(_guardaT); _guardaT = setTimeout(guardarBib, 400); pintarLista(); pintarSellos(d); });
  $('#titulo').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
  $('#lateral').addEventListener('click', ev => {
    const x = ev.target.closest('[data-borrar]');
    if (x) {
      ev.stopPropagation();
      const d = BIB.docs.find(y => y.id === x.dataset.borrar);
      if (d) pedirSi(`<b>¿Borrar «${esc(d.titulo)}»?</b> Si no lo has descargado, se pierde.`, 'Borrar', () => {
        if (typeof nubeBorrar === 'function') nubeBorrar(d);
        BIB.docs = BIB.docs.filter(y => y.id !== d.id);
        if (BIB.actual === d.id) BIB.actual = BIB.docs[0] ? BIB.docs[0].id : null;
        abrirDoc(BIB.actual);
      });
      return;
    }
    const li = ev.target.closest('[data-doc]'); if (li) abrirDoc(li.dataset.doc);
  });
  $('#lateral').addEventListener('keydown', ev => {
    const li = ev.target.matches && ev.target.matches('[data-doc]') ? ev.target : null;
    if (li && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); abrirDoc(li.dataset.doc); const otra = document.querySelector(`[data-doc="${li.dataset.doc}"]`); if (otra) otra.focus(); }
  });
  $('#f-abrir').addEventListener('change', ev => {
    const f = ev.target.files[0]; if (!f) return;
    f.text().then(txt => {
      const d = leerDescargado(txt);
      if (!d) { mensaje('<b>Ese fichero no es un diagrama de esta app.</b> Elige un .html descargado con «Descargar HTML».'); return; }
      const nd = nuevoDoc(d.tipo, d.titulo, d.datos); nd.unidad = d.unidad || ''; nd.autor = d.autor || ''; if (d.validado) nd.validado = d.validado;
      if (typeof ordenarSiFalta === 'function') ordenarSiFalta(nd);
      abrirDoc(nd.id);
    });
    ev.target.value = '';
  });
  document.addEventListener('keydown', ev => {
    const enCampo = ev.target.matches && ev.target.matches('input,textarea,select');
    const mod = ev.ctrlKey || ev.metaKey;
    if (mod && ev.key.toLowerCase() === 'z' && !enCampo) { ev.preventDefault(); ev.shiftKey ? rehacer() : deshacer(); return; }
    if (mod && ev.key.toLowerCase() === 'y' && !enCampo) { ev.preventDefault(); rehacer(); return; }
    if (enCampo) return;
    if (ev.key === 'Tab' && !mod && !ev.altKey && tabPiezas(ev.shiftKey)) { ev.preventDefault(); return; }
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && SEL) { ev.preventDefault(); borrarSel(); }
    if (mod && ev.key.toLowerCase() === 'd') { ev.preventDefault(); duplicarSel(); }
    if (ev.key === 'Escape') { if (SEL) { SEL = null; pintar(); } else if (DENTRO) subir(); }
    if (ev.key === 'Enter' && SEL && SEL.k === 'n') {
      ev.preventDefault(); const id = SEL.id, dd = docActual(), nn = dd && dd.datos.nodos && dd.datos.nodos.find(x => x.id === id);
      if (dd.tipo === 'proyecto' && nn && nn.t === 'componente') entrar(id); else setTimeout(() => abrirEditorTexto(id), 0);
    }
    const d = docActual();
    if (d && (d.tipo === 'flujo' || (d.tipo === 'proyecto' && PEST === 'plan')) && SEL && SEL.k === 'n' && ev.key.startsWith('Arrow')) {
      ev.preventDefault();
      const n = d.datos.nodos.find(x => x.id === SEL.id); instantanea();
      n.x += ev.key === 'ArrowLeft' ? -REJILLA : ev.key === 'ArrowRight' ? REJILLA : 0;
      n.y += ev.key === 'ArrowUp' ? -REJILLA : ev.key === 'ArrowDown' ? REJILLA : 0;
      confirmar();
    }
  });
  engancharBarra(); engancharInspector();
  window.addEventListener('resize', () => { const d = docActual(); if (d && (d.tipo === 'flujo' || (d.tipo === 'proyecto' && PEST === 'plan'))) pintarFlujo(d); });
  pintarHist(); pintarLista(); pintar(); pintarEstado();
  if (docActual() && docActual().tipo !== 'gantt') requestAnimationFrame(encajar);
  else { $('#lienzo')._irA = hoyISO(); pintar(); }
  if (typeof nubeIniciar === 'function') nubeIniciar();
}
// arranca proyecto.js, que va detrás y amplía las piezas
