/* ═══ DIAGRAMAS SOLARIS — PROYECTOS (26/10/2026) ═══════════════════════════════════════════════════════════════
   Lo que pidió Daniel, con sus citas en docs/decisiones-app.md (26/10, de ~15:10 a ~16:05):
   · Un proyecto es un ÁRBOL: arriba HITOS y COMPONENTES; dentro de cada componente, sus PASOS. Las flechas son
     dependencias: Y por defecto (espera a todas), la pieza «O» (basta una) y la decisión (condicional).
   · «El Gantt […] una vez se hagan los diagramas, es algo matemático»: el CALENDARIO no se dibuja, se CALCULA, y se
     mira por NIVELES (1 pasos · 2 componentes · 3 hitos).
   · Tiempos en las DOS direcciones: de abajo arriba (los pasos dan la duración; si arriba le pones menos, se deja con
     ALERTA) y de arriba abajo (le das tiempo a un hito o componente y se REPARTE hacia dentro). Lo que se compara es
     la CADENA MÁS LARGA, no la suma: dos pasos en paralelo de 3 y 5 caben en 5.
   · STRL (Solaris Technology Readiness Level), 6 niveles; el 6 sólo volando. Herencia de vuelo: como mucho STRL 4,
     la aprueba el dueño del diagrama (o el PD).
   · Un color por unidad: el de Notion.
   Se carga DESPUÉS de diagramas.js (amplía PIEZAS y arranca la app al final).
   ═════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
'use strict';

// ══ Colores de unidad: los de Notion ══════════════════════════════════════════════════════════════════════════
// Leídos el 26/10/2026 del desplegable «Subsistema/Unidad» del Panel de Rendimientos (collection://11fb0e3a-…-000b777989cd).
// Los hex son los del texto de color de Notion en modo oscuro. Una unidad sin color en Notion sale en gris: no se inventa.
const NOTION_HEX = { default: '#9B9B9B', gray: '#9B9B9B', brown: '#BA856F', orange: '#C77D48', yellow: '#CA9849', green: '#529E72', blue: '#379AD3', purple: '#9D68D3', pink: '#D15796', red: '#DF5452' };
const UNIDAD_NOTION = { 'Aviónica': 'green', 'GNC': 'purple', 'Aeroestructuras': 'blue', 'Propulsión': 'red', 'Org&Mark': 'yellow', 'Project Director': 'orange' };
function colorUnidad(u){ return NOTION_HEX[UNIDAD_NOTION[u] || 'default']; }
// El selector de unidad, propio: el <datalist> lo dibuja el sistema (barra blanca de Windows, sin colores) — Daniel,
// 26/10, con captura: «fea la barra así». `que`: 'doc' (la unidad del documento) o 'nodo' (la del componente elegido).
function selectorUnidad(v, que){
  return selector([['', 'Sin unidad', '']].concat(UNIDADES.map(u => [u, u, colorUnidad(u)])), v || '', `data-p="${que === 'doc' ? 'doc.unidad' : 'unidad'}"`);
}

// ══ STRL ═════════════════════════════════════════════════════════════════════════════════════════════════════════
// 26/10 ~17:35: 4 y 5 CAMBIADOS. Un compañero de Aviónica (WhatsApp): «para o noso nivel creo que o útil é cambiar 4<->5»;
// Daniel: «vale y pongo en vez de componente en entorno relevante, subsistema en entorno relevante».
const STRL = ['Sin nivel', 'Concepto y CAD', 'Maqueta: forma y encaje', 'El componente funciona en laboratorio', 'Integrado en su subsistema, en laboratorio', 'El subsistema funciona en entorno relevante', 'Probado en vuelo'];
const STRL_HERENCIA_MAX = 4;   // Daniel, 26/10: «Solaris Technology Readiness Level 4 máximo»
function strlDe(n){   // el nivel que cuenta y de dónde sale
  const g = Number(n.strl) || 0;
  const h = n.herencia && n.herencia.aprobada ? Math.min(Number(n.herencia.nivel) || 0, STRL_HERENCIA_MAX) : 0;
  return h > g ? { nivel: h, heredado: true } : { nivel: g, heredado: false };
}

// ══ La TARJETA (Daniel, 11/11; decisiones-app 2i) ══════════════════════════════════════════════════════════════
// El «componente» de antes: varias UNIDADES, lo que PRODUCE y lo que NECESITA. Lo que necesita se elige de lo que producen
// otras tarjetas y viaja en la flecha (`c.items`); lo que nadie produce aún queda PENDIENTE (`n.pide`) y es un aviso.
// Internamente sigue siendo `t: 'componente'`: los documentos guardados y la EuRoC importada se abren igual.
function unidadesDe(n){ return Array.isArray(n.unidades) ? n.unidades : (n.unidad ? [n.unidad] : []); }
function colorDe(n){ return colorUnidad(unidadesDe(n)[0]); }
function nodoDe(d, id){ return d.datos.nodos.find(x => x.id === id); }
function itemsDe(d, c){ const a = nodoDe(d, c.de), ps = (a && a.produce) || []; return (c.items || []).map(id => ps.find(p => p.id === id)).filter(Boolean); }
function etiquetaItems(its){
  if (!its.length) return '';
  const t = its[0].txt.length > 20 ? its[0].txt.slice(0, 19) + '…' : its[0].txt;
  return its.length > 1 ? t + ' +' + (its.length - 1) : t;
}
function anadirProduce(n, txt){
  txt = String(txt || '').trim(); if (!txt) return null;
  n.produce = n.produce || [];
  let p = n.produce.find(x => x.txt.toLowerCase() === txt.toLowerCase());
  if (!p) { p = { id: uid('i'), txt }; n.produce.push(p); }
  return p;
}
function quitarProduce(d, n, id){
  n.produce = (n.produce || []).filter(p => p.id !== id); if (!n.produce.length) delete n.produce;
  d.datos.conectores.forEach(c => { if (c.de === n.id && c.items) alternarItem(c, id, false); });
}
function alternarItem(c, id, poner){
  c.items = c.items || [];
  const i = c.items.indexOf(id), quiere = poner == null ? i < 0 : poner;
  if (quiere && i < 0) c.items.push(id); if (!quiere && i >= 0) c.items.splice(i, 1);
  if (!c.items.length) delete c.items;
}
// Una flecha del plan. Desde el asa IZQUIERDA va al revés: lo soltado va ANTES (planificar hacia atrás, 2i-2).
function enlazarPlan(d, de, a, lado){
  let rev = false;
  if (lado === 'w') { [de, a] = [a, de]; rev = true; }
  if (!de || !a || de === a) return null;
  let c = d.datos.conectores.find(k => k.de === de && k.a === a);
  if (!c) { c = { id: uid('c'), de, a }; if (rev) c.la = 'w'; else if (lado) c.ld = lado; d.datos.conectores.push(c); }
  if (rev) { const nn = nodoDe(d, de); if (nn && !d.datos.conectores.some(k => k !== c && (k.de === de || k.a === de))) nn.atras = true; }
  return c;
}
function necesitar(d, n, deId, itemId){
  const c = enlazarPlan(d, deId, n.id); if (!c) return;
  alternarItem(c, itemId, true);
  const it = ((nodoDe(d, deId) || {}).produce || []).find(p => p.id === itemId);
  if (it && n.pide) { n.pide = n.pide.filter(p => p.txt.toLowerCase() !== it.txt.toLowerCase()); if (!n.pide.length) delete n.pide; }
}
// «← Antes» / «Después →»: una pieza nueva al lado, ya enlazada, con el nombre listo para escribir (en directo, en la reunión).
function crearAlLado(d, n, antes){
  const t = n.padre ? 'paso' : 'componente', P = PIEZAS[t], g = geoNodo(n);
  const cx = antes ? g.x - 100 - P.w / 2 : g.x + g.w + 100 + P.w / 2;
  const otras = planVisible(d).nodos.map(geoNodo), libre = cy => !otras.some(o => cx - P.w / 2 < o.x + o.w + 20 && cx + P.w / 2 > o.x - 20 && cy - P.h / 2 < o.y + o.h + 20 && cy + P.h / 2 > o.y - 20);
  let cy = g.y + g.h / 2;
  for (let i = 1; i < 30 && !libre(cy); i++) cy = g.y + g.h / 2 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 120;
  instantanea();
  const m = anadirNodo(t, cx, cy);
  if (antes) { enlazarPlan(d, m.id, n.id); if (t === 'componente') m.atras = true; }
  else { enlazarPlan(d, n.id, m.id); if (t === 'componente' && n.atras) m.atras = true; }
  confirmar();
  setTimeout(() => abrirEditorTexto(m.id), 0);
}

// ══ ÁREAS: a qué parte del cohete (o del taller) aporta cada tarjeta ════════════════════════════════════════════
// Daniel, 11/11: «tener bien identificadas todas las posibles aportaciones, en plan categorías que caigan en la EuRoC, por
// ejemplo, recovery, aviónica hasta la estación terrena, está el software de vuelo […] También cosas que no sean de la
// propia EuRoC, pero sí sean de fabricación […] Facilities para facilitar la fabricación, y hacerla más precisa».
// Y corrigiendo: *«EuRoC no es una categoría […] Es un objetivo […] Categoría sería aviónica, propulsión, estructuras,
// aerodinámica […] la categoría de aerofrenos, podría estar dentro de aerodinámica o fuera. Eso depende del criterio […] son
// clasificaciones de los subsistemas del cohete y de básicamente la infraestructura necesaria para avanzar»*. Así que: el
// OBJETIVO (EuRoC) es el proyecto y sus hitos; el ÁREA es el desglose del cohete + la infraestructura, con SUBÁREAS
// ([nombre, madre]). Filtrar por una madre incluye a sus hijas. La lista es propuesta mía (decisiones-app 2j) y el criterio
// (p. ej. dónde cuelgan los aerofrenos) es suyo: se cambia AQUÍ y en ningún otro sitio.
const AREAS = [
  ['Propulsión'], ['Aeroestructuras'], ['Aerodinámica'], ['Aerofrenos', 'Aerodinámica'], ['GNC: dinámica y control'],
  ['Aviónica'], ['Software de vuelo', 'Aviónica'], ['Estación terrena', 'Aviónica'], ['Recovery'], ['Carga útil'],
  ['Fabricación', null, 'infra'], ['Utillaje y facilities', null, 'infra'], ['Ensayos', null, 'infra'],
];
function areaOps(){ return AREAS.map(a => [a[0], a[1] ? a[1] + ' › ' + a[0] : a[0]]); }
function enArea(area, filtro){ if (!filtro) return true; for (let a = area; a; a = (AREAS.find(x => x[0] === a) || [])[1]) if (a === filtro) return true; return false; }
let FILTRO_AREA = '';   // en la barra: atenúa en el mapa (y quita del calendario) lo que no es de esa área
function atenuar(d, vp){
  if (!FILTRO_AREA) return;
  d.datos.nodos.forEach(n => { if (n.t === 'componente' && !enArea(n.area, FILTRO_AREA)) { const g = vp.querySelector(`[data-n="${n.id}"]`); if (g) g.classList.add('fuera'); } });
}

// ══ CAPAS: definir una cosa cada vez ══════════════════════════════════════════════════════════════════════════
// Daniel, 11/11: «debería de haber una habilitación de estar en modo planning, modo fijar fechas, modo definir TRLs […] o
// todo a la vez, pero que sea opcional y voluntario, para que a la gente que esté definiendo solo a nivel operacional qué es
// lo que hay que hacer, que no le aparezca todo a la vez […] que puedan ir definiendo cada capa del diagrama una cosa a la
// vez». Lo operacional (qué, quién, área, produce/necesita, flechas, hitos) se ve siempre; FECHAS y STRL se encienden.
// Con una capa apagada no se ven sus campos, sus chips ni sus avisos; validar pide las dos encendidas (que se vea todo).
// Es una preferencia de quien mira (se guarda en este navegador), no del documento: el documento descargado lleva todo.
function capasDe(d){
  if (!d || d.tipo !== 'proyecto') return { fechas: true, strl: true };
  BIB.capas = BIB.capas || {};
  if (!BIB.capas[d.id]) {   // por defecto, lo que el documento ya usa
    const ns = d.datos.nodos;
    BIB.capas[d.id] = { fechas: ns.some(n => n.dur || n.presupuesto || n.fija || n.dl || n.ns), strl: ns.some(n => n.strl || n.strlFin || n.subeA || n.herencia) };
  }
  return BIB.capas[d.id];
}
function todasCapas(d){ const c = capasDe(d); return c.fechas && c.strl; }
function avisosVisibles(d, calc){ const c = capasDe(d); return (calc || calcularPlan(d)).avisos.filter(a => !a.capa || c[a.capa]); }

// ══ Piezas del plan ═════════════════════════════════════════════════════════════════════════════════════════════
Object.assign(PIEZAS, {
  componente: { nombre: 'Tarjeta', w: 200, h: 80, tw: 168, peso: 600, def: 'Tarjeta', dy: -4 },
  paso:       { nombre: 'Paso', w: 160, h: 60, tw: 136, def: 'Paso', dy: -6 },
  hito:       { nombre: 'Hito', w: 160, h: 48, tw: 120, peso: 600, def: 'Hito', dy: -5 },
  o:          { nombre: 'O', w: 44, h: 40, tw: 30, def: 'O' },
});
const PALETA_ARRIBA = ['componente', 'hito', 'o'];
const PALETA_DENTRO = ['paso', 'hito', 'o'];
const PROYECTO_CSS = `
.e.der .r{stroke-dasharray:5 4;opacity:.75}
.campo.candado{grid-template-columns:auto 1fr;align-items:center;gap:8px}.campo.candado input{width:auto}.campo.candado span{font-size:12px}
.deps.fuera{max-height:240px}.deps.fuera details{border-bottom:1px solid var(--line);padding:3px 0}.deps.fuera summary{cursor:pointer;font-size:12.5px;color:var(--ink);display:flex;align-items:center;gap:6px}
.deps.fuera summary i{width:8px;height:8px;border-radius:2px;display:inline-block}.deps.fuera label{padding-left:14px}
.pieza svg .f,.pieza svg .pila,.leyenda-mini svg .f,.leyenda-mini svg .pila,h3 svg .f,h3 svg .pila,.ley svg .f{vector-effect:non-scaling-stroke}
.n-componente .f{fill:var(--d-sur2);stroke:var(--d-ink3);stroke-width:1.5}
.n-componente .pila{fill:var(--d-sur);stroke:var(--d-line2);stroke-width:1.2}
.n-paso .f{fill:var(--d-sur2);stroke:var(--d-line2)}
.n-hito .f{fill:var(--d-bg);stroke:var(--d-red);stroke-width:1.8}
svg.dg .n-hito text{font-weight:600}
.n-o .f{fill:var(--d-bg);stroke:var(--d-ink2);stroke-width:1.5}
svg.dg .n-o text{font:700 13px ui-monospace,Consolas,monospace}
svg.dg .chip-d{font:600 10.5px ui-monospace,Consolas,monospace;fill:var(--d-ink2)}
svg.dg .chip-d.mal{fill:var(--d-red)}
svg.dg .chip-d.vacio{fill:var(--d-ink3)}
.strl-b{fill:var(--d-ink)}.strl-b.her{fill:none;stroke:var(--d-ink2);stroke-dasharray:2 2}
svg.dg .strl-t{font:700 9px ui-monospace,Consolas,monospace;letter-spacing:.06em;fill:var(--d-bg)}
svg.dg .strl-t.her{fill:var(--d-ink2)}
.n.critico .f{stroke:var(--d-red)}
.g-bar.crit{fill:var(--d-red);stroke:var(--d-red)}
.g-holg{stroke:var(--d-ink3);stroke-width:1.5;stroke-dasharray:1 3}
.g-hito.tarde{stroke:var(--d-red);stroke-width:2;fill:var(--d-bg)}
.kpis{display:flex;gap:28px;flex-wrap:wrap;padding:14px 16px 10px}
.kpi b{display:block;font:650 22px/1.1 ${FUENTE};font-variant-numeric:tabular-nums;color:var(--d-ink)}
.kpi b.mal{color:var(--d-red)}
.kpi span{font-size:11.5px;color:var(--d-ink3)}
.chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
svg.dg .n.fuera{opacity:.22}
.barra .selu{width:200px}
.chip-u{display:inline-flex;align-items:center;gap:6px;min-height:28px;padding:0 10px;border-radius:14px;border:1px solid var(--line2);background:transparent;color:var(--ink2);font:inherit;font-size:12.5px;cursor:pointer}
.chip-u i{width:8px;height:8px;border-radius:50%;flex:none}
.chip-u:hover{border-color:var(--ink3)}
.chip-u.on{border-color:var(--red);background:rgba(228,30,37,.16);color:var(--ink)}
.chip-u.tag{cursor:default;padding-right:2px}
.chip-u.pend{border-style:dashed;border-color:var(--warn);color:var(--warn);cursor:default;padding-right:2px}
.chip-u .q{min-width:24px;min-height:24px;border-radius:12px;color:var(--ink3);font-size:15px;line-height:1}
.chip-u .q:hover{color:var(--ink);background:var(--line)}
.add-in{flex:1;min-width:110px;min-height:28px;background:var(--sur2);border:1px solid var(--line);border-radius:14px;padding:0 10px;color:var(--ink);font:inherit;font-size:12.5px}
.nec{display:grid;gap:6px;padding:6px 0;border-bottom:1px solid var(--line)}
.nec-de{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink2)}
.nec-de i{width:8px;height:8px;border-radius:2px}
`;

// ══ Estado del editor de proyectos ══════════════════════════════════════════════════════════════════════════════
let PEST = 'plan';     // 'plan' | 'calendario'
let DENTRO = null;     // el componente abierto (null = arriba del todo)
let NIVEL = 1;         // nivel del calendario: 1 pasos · 2 componentes · 3 hitos

function planVisible(d, dentro){
  const aqui = dentro === undefined ? DENTRO : dentro;
  const ns = d.datos.nodos.filter(n => (n.padre || null) === aqui);
  const ids = new Set(ns.map(n => n.id));
  const cs = d.datos.conectores.filter(c => ids.has(c.de) && ids.has(c.a));
  if (aqui === null) {   // EuRoC: 51 de sus 146 dependencias van de un paso de una unidad a otro de OTRA
    const por = {}; d.datos.nodos.forEach(n => { por[n.id] = n; });
    const arriba = id => { let n = por[id]; while (n && n.padre && por[n.padre]) n = por[n.padre]; return n ? n.id : null; };
    const vistos = new Set(cs.map(c => c.de + '>' + c.a));
    d.datos.conectores.forEach(c => {
      if (ids.has(c.de) && ids.has(c.a)) return;
      const a = arriba(c.de), b = arriba(c.a);
      if (!a || !b || a === b || !ids.has(a) || !ids.has(b) || vistos.has(a + '>' + b)) return;
      vistos.add(a + '>' + b); cs.push({ id: 'der:' + a + '>' + b, de: a, a: b, derivado: true });
    });
  }
  return { nodos: ns, conectores: cs.map(c => { if (!(c.items && c.items.length)) return c; const its = itemsDe(d, c); return Object.assign({}, c, { txt: etiquetaItems(its), partes: its.map(p => p.txt) }); }) };
}
// Coloca solas las piezas de un nivel: columnas por la cadena más larga que llega a cada una, y dentro de cada
// columna, cerca de lo que tienen delante (menos cruces). Se usa con «Ordenar» y al abrir algo sin posiciones.
function ordenar(d, dentro){
  const v = planVisible(d, dentro), ns = v.nodos; if (!ns.length) return;
  const pre = {}; ns.forEach(n => { pre[n.id] = []; });
  v.conectores.forEach(c => { if (pre[c.a] && pre[c.de]) pre[c.a].push(c.de); });
  const nivel = {}, enCurso = new Set();
  const f = id => { if (nivel[id] != null) return nivel[id]; if (enCurso.has(id)) return 0; enCurso.add(id); nivel[id] = pre[id].length ? 1 + Math.max(...pre[id].map(f)) : 0; return nivel[id]; };
  ns.forEach(n => f(n.id));
  const cols = {}; ns.forEach(n => { (cols[nivel[n.id]] = cols[nivel[n.id]] || []).push(n); });
  const fila = {};
  Object.keys(cols).map(Number).sort((a, b) => a - b).forEach(k => {
    const c = cols[k], peso = {};
    c.forEach((n, i) => { const ps = pre[n.id].filter(p => fila[p] != null); peso[n.id] = ps.length ? ps.reduce((s, p) => s + fila[p], 0) / ps.length : i; });
    c.sort((a, b) => peso[a.id] - peso[b.id]);
    c.forEach((n, i) => { fila[n.id] = i; const g = geoNodo(n); n.x = 140 + k * 260 - g.w / 2; n.y = ajustar(70 + i * 120) - g.h / 2; });
  });
}
function ordenarSiFalta(d){
  if (d.tipo !== 'proyecto') return;
  const sitios = [null].concat(d.datos.nodos.filter(n => n.t === 'componente').map(n => n.id));
  sitios.forEach(s => { if (planVisible(d, s).nodos.some(n => typeof n.x !== 'number' || typeof n.y !== 'number')) ordenar(d, s); });
}
function prepararNodoPlan(n){
  n.padre = DENTRO;
  if (n.t === 'o') n.txt = 'O';
  if (n.t === 'componente') { const p = docActual(); n.unidades = p && p.unidad ? [p.unidad] : []; }
}

// ══ EL CÁLCULO: fechas, cadena crítica y avisos ═════════════════════════════════════════════════════════════════
// Todo en DÍAS desde `inicio` (enteros). Una tarea de duración N ocupa [es, es+N).
function calcularPlan(d){
  const D = d.datos, ns = D.nodos, por = {};
  const inicio = D.inicio || hoyISO();
  ns.forEach(n => { por[n.id] = n; });
  const hijos = {};
  ns.forEach(n => { const p = n.padre || null; (hijos[p] = hijos[p] || []).push(n); });
  const tieneHijos = id => !!(hijos[id] && hijos[id].length);
  const internos = id => { const s = new Set((hijos[id] || []).map(x => x.id)); return D.conectores.filter(c => s.has(c.de) && s.has(c.a)); };
  // una flecha que entra en un componente entra en sus pasos SIN nada delante; una que sale, sale de los que no tienen nada detrás
  const bordes = (id, lado) => {
    if (!tieneHijos(id)) return [id];
    const usados = new Set(internos(id).map(c => lado === 'entra' ? c.a : c.de));
    return hijos[id].filter(h => !usados.has(h.id)).reduce((a, h) => a.concat(bordes(h.id, lado)), []);
  };
  const hojas = ns.filter(n => !tieneHijos(n.id));
  const preds = {}, succs = {};
  hojas.forEach(n => { preds[n.id] = []; succs[n.id] = []; });
  D.conectores.forEach(c => {
    if (!por[c.de] || !por[c.a]) return;
    bordes(c.de, 'sale').forEach(a => bordes(c.a, 'entra').forEach(b => {
      if (a === b || preds[b].includes(a)) return;
      preds[b].push(a); succs[a].push(b);
    }));
  });
  const dur = n => n.t === 'paso' ? Math.max(0, Math.round(Number(n.dur) || 0))
    : n.t === 'componente' ? Math.max(0, Math.round(Number(n.presupuesto) || 0)) : 0;
  // orden topológico; lo que queda fuera está en un círculo
  const entran = {}; hojas.forEach(n => { entran[n.id] = preds[n.id].length; });
  const cola = hojas.filter(n => !entran[n.id]).map(n => n.id), orden = [];
  while (cola.length) { const id = cola.shift(); orden.push(id); succs[id].forEach(s => { if (--entran[s] === 0) cola.push(s); }); }
  const enCirculo = hojas.filter(n => !orden.includes(n.id)).map(n => n.id);
  const r = {};
  orden.forEach(id => {
    const n = por[id], ps = preds[id].filter(p => r[p]);
    let es = 0;
    if (ps.length) es = n.t === 'o' ? Math.min(...ps.map(p => r[p].ef)) : Math.max(...ps.map(p => r[p].ef));
    if (n.ns) { const f = diasEntre(inicio, n.ns); if (es < f) es = f; }   // «no antes de»
    let tarde = 0;
    if (n.t === 'hito' && n.fija) {
      const f = diasEntre(inicio, n.fija);
      if (es <= f) es = f; else tarde = es - f;
    }
    r[id] = { es, ef: es + dur(n), dur: dur(n), tarde };
    if (n.dl) { const ult = r[id].ef > es ? r[id].ef - 1 : es, lim = diasEntre(inicio, n.dl); if (ult > lim) r[id].pasado = ult - lim; }   // plazo
  });
  const fin = orden.length ? Math.max(...orden.map(id => r[id].ef)) : 0;
  const trabajo = orden.filter(id => r[id].dur > 0);
  const finTrabajo = trabajo.length ? Math.max(...trabajo.map(id => r[id].ef)) : 0;   // lo que de verdad acaba el trabajo
  for (let i = orden.length - 1; i >= 0; i--) {
    const id = orden[i], ss = succs[id].filter(s => r[s]);
    let lf = ss.length ? Math.min(...ss.map(s => r[s].ls)) : fin;
    const n = por[id];
    if (n.t === 'hito' && n.fija) lf = Math.min(lf, diasEntre(inicio, n.fija));
    if (n.dl) lf = Math.min(lf, diasEntre(inicio, n.dl) + 1);
    r[id].lf = lf; r[id].ls = lf - r[id].dur; r[id].holg = r[id].ls - r[id].es;
  }
  // Crítico = la cadena con MENOS margen, no «margen cero»: con un hito de fecha fija todo tiene margen, y lo que importa
  // es qué cadena se lo come antes (como en el «Camino a la EuRoC» que pasó Daniel).
  const minHolg = trabajo.length ? Math.min(...trabajo.map(id => r[id].holg)) : 0;
  orden.forEach(id => { r[id].crit = r[id].holg === minHolg && (r[id].dur > 0 || (por[id].t === 'hito' && !por[id].fija)); });
  // componentes con pasos: su tramo, su cadena más larga y si cuadra con su presupuesto
  const avisos = [];
  const agregar = id => {
    const hs = (hijos[id] || []).map(h => tieneHijos(h.id) ? agregar(h.id) : r[h.id]).filter(Boolean);
    if (!hs.length) return null;
    const es = Math.min(...hs.map(x => x.es)), ef = Math.max(...hs.map(x => x.ef));
    r[id] = { es, ef, dur: ef - es, est: ef - es, crit: (hijos[id] || []).some(h => r[h.id] && r[h.id].crit), agregado: true,
      ls: Math.min(...hs.map(x => x.ls != null ? x.ls : x.es)), lf: Math.max(...hs.map(x => x.lf != null ? x.lf : x.ef)) };
    return r[id];
  };
  ns.filter(n => n.t === 'componente' && tieneHijos(n.id)).forEach(n => {
    const a = agregar(n.id); if (!a) return;
    const p = Math.round(Number(n.presupuesto) || 0);
    if (p > 0 && a.est > p) { a.mal = true; avisos.push({ id: n.id, capa: 'fechas', txt: `«${n.txt}»: sus pasos piden ${a.est} días y le has dado ${p}` }); }
  });
  ns.filter(n => n.t === 'componente' && Number(n.strlFin) > 0).forEach(n => {
    const llega = Math.max(strlDe(n).nivel, ...(hijos[n.id] || []).map(h => Number(h.subeA) || 0));
    if (llega < Number(n.strlFin)) avisos.push({ id: n.id, capa: 'strl', txt: `«${n.txt}»: se espera STRL ${n.strlFin} y ningún paso lo lleva más allá de STRL ${llega || '—'}` });
  });
  ns.filter(n => r[n.id] && r[n.id].pasado > 0).forEach(n => avisos.push({ id: n.id, capa: 'fechas', txt: `«${n.txt}» se pasa de su plazo (${dmy(n.dl)}) por ${r[n.id].pasado} días` }));
  ns.filter(n => n.t === 'hito' && r[n.id] && r[n.id].tarde > 0).forEach(n => avisos.push({ id: n.id, capa: 'fechas', txt: `«${n.txt}» no llega: cae el ${dmy(sumaDias(inicio, r[n.id].es))}, ${r[n.id].tarde} días después de su fecha` }));
  if (enCirculo.length) avisos.push({ id: enCirculo[0], txt: `Círculo de dependencias: ${enCirculo.map(id => '«' + por[id].txt + '»').join(', ')}` });
  ns.forEach(n => (n.pide || []).forEach(p => avisos.push({ id: n.id, txt: `«${n.txt}» necesita «${p.txt}» y nadie lo produce` })));
  // colocar: «desde hoy» (lo antes posible) o «desde el final» (lo más tarde posible; los pasos siguen a su tarjeta)
  const atrasDe = n => !!(n && (n.atras || (n.padre && por[n.padre] && por[n.padre].atras)));
  const colocar = id => { const x = r[id]; if (!x) return [0, 0]; return atrasDe(por[id]) && x.ls != null && por[id].t !== 'hito' ? [x.ls, x.lf] : [x.es, x.ef]; };
  ns.filter(n => n.t === 'componente' && !n.padre && n.atras && r[n.id] && r[n.id].ls < 0).forEach(n => avisos.push({ id: n.id, capa: 'fechas', txt: `«${n.txt}» tendría que haber empezado el ${dmy(sumaDias(inicio, r[n.id].ls))}` }));
  const sinDur = ns.filter(n => n.t === 'paso' && !(Number(n.dur) > 0));
  if (sinDur.length) avisos.push({ id: sinDur[0].id, capa: 'fechas', txt: `${sinDur.length === 1 ? 'Un paso no tiene' : sinDur.length + ' pasos no tienen'} duración (cuentan como 0 días)` });
  // Daniel, 26/10: «cada proyecto tiene que terminar en un hito» · «o varios». Lo que tiene duración y no desemboca en
  // ningún hito es un callejón sin salida: se busca hacia atrás desde los hitos por el grafo de pasos.
  const llegaAHito = new Set(), pilaH = hojas.filter(n => n.t === 'hito').map(n => n.id);
  while (pilaH.length) { const x = pilaH.pop(); if (llegaAHito.has(x)) continue; llegaAHito.add(x); (preds[x] || []).forEach(p => pilaH.push(p)); }
  const sinHito = new Set(hojas.filter(n => (n.t === 'paso' || n.t === 'componente') && !llegaAHito.has(n.id)).map(n => n.id));
  ns.filter(n => n.t === 'componente' && tieneHijos(n.id) && (hijos[n.id] || []).some(h => sinHito.has(h.id))).forEach(n => sinHito.add(n.id));
  if (ns.some(n => n.t === 'paso' || n.t === 'componente')) {
    if (!ns.some(n => n.t === 'hito')) avisos.push({ id: null, txt: 'Falta un hito final', bloquea: true });
    else ns.filter(n => sinHito.has(n.id) && !(n.padre && sinHito.has(n.padre))).forEach(n => avisos.push({ id: n.id, txt: `«${n.txt}» no desemboca en ningún hito`, bloquea: true }));
  }
  const externos = {};   // cuántas flechas le llegan a cada pieza desde OTRO componente
  D.conectores.forEach(c => { const a = por[c.de], b = por[c.a]; if (a && b && (a.padre || null) !== (b.padre || null)) externos[b.id] = (externos[b.id] || 0) + 1; });
  return { r, fin, finTrabajo, minHolg, inicio, avisos, preds, hijos, por, externos, sinHito, colocar, atrasDe, fecha: off => sumaDias(inicio, off) };
}

// ══ REPARTIR: de arriba abajo ══════════════════════════════════════════════════════════════════════════════════
// Cada pieza que cuenta recibe tiempo / (nº de piezas de la cadena más larga que pasa por ella): así ninguna cadena se
// pasa del tiempo dado y la más larga lo llena. Lo de duración cero (O, decisiones, hitos) no cuenta.
function _cadenas(nodos, conectores, pesa){
  const ids = nodos.map(n => n.id), pre = {}, suc = {};
  ids.forEach(i => { pre[i] = []; suc[i] = []; });
  conectores.forEach(c => { if (pre[c.a] && suc[c.de]) { pre[c.a].push(c.de); suc[c.de].push(c.a); } });
  const w = {}; nodos.forEach(n => { w[n.id] = pesa(n) ? 1 : 0; });
  const memo = (dir) => { const m = {}, vis = new Set(); const f = i => { if (m[i] != null) return m[i]; if (vis.has(i)) return 0; vis.add(i); const v = w[i] + Math.max(0, ...(dir[i]).map(f)); m[i] = v; return v; }; ids.forEach(f); return m; };
  const arriba = memo(pre), abajo = memo(suc);
  const k = {}; ids.forEach(i => { k[i] = arriba[i] + abajo[i] - w[i]; });
  return k;
}
// Daniel, 26/10: «una opcion para bloquear la duracion de un paso, componente o lo q sea […] para que solo se amolde el
// resto». Por cada pieza: cuántas piezas LIBRES tiene la cadena más larga que pasa por ella y cuántos días FIJOS hay en la
// cadena más cargada de fijos; su parte = (tiempo − fijos) / libres. Puede quedarse algo corto, nunca se pasa.
function _cadenasFijas(nodos, conectores, libre, fijo){
  const ids = nodos.map(n => n.id), pre = {}, suc = {};
  ids.forEach(i => { pre[i] = []; suc[i] = []; });
  conectores.forEach(c => { if (pre[c.a] && suc[c.de]) { pre[c.a].push(c.de); suc[c.de].push(c.a); } });
  const w = {}, fx = {}; nodos.forEach(n => { w[n.id] = libre(n) ? 1 : 0; fx[n.id] = fijo(n); });
  const memo = (dir, peso) => { const m = {}, vis = new Set(); const f = i => { if (m[i] != null) return m[i]; if (vis.has(i)) return 0; vis.add(i); m[i] = peso[i] + Math.max(0, ...dir[i].map(f)); return m[i]; }; ids.forEach(f); return m; };
  const ka = memo(pre, w), kb = memo(suc, w), fa = memo(pre, fx), fb = memo(suc, fx);
  const r = {}; ids.forEach(i => { r[i] = { libres: ka[i] + kb[i] - w[i], fijos: fa[i] + fb[i] - fx[i] }; });
  return r;
}
function repartirComponente(d, id){
  const n = d.datos.nodos.find(x => x.id === id);
  const P = Math.round(Number(n.presupuesto) || 0); if (!(P > 0)) return 0;
  const v = planVisible(d, id);
  const k = _cadenasFijas(v.nodos, v.conectores, x => x.t === 'paso' && !x.fijo, x => x.t === 'paso' && x.fijo ? Math.round(Number(x.dur) || 0) : 0);
  let hechos = 0;
  v.nodos.forEach(x => { if (x.t === 'paso' && !x.fijo) { x.dur = Math.max(1, Math.floor((P - k[x.id].fijos) / Math.max(1, k[x.id].libres))); hechos++; } });
  return hechos;
}
function repartirHito(d, id){
  const h = d.datos.nodos.find(x => x.id === id);
  const inicio = d.datos.inicio || hoyISO();
  const W = diasEntre(inicio, h.fija); if (!(W > 0)) return 0;
  const v = planVisible(d, h.padre || null);
  const delante = new Set(), pila = [id];   // todo lo que hay que acabar antes de este hito
  while (pila.length) { const x = pila.pop(); v.conectores.filter(c => c.a === x).forEach(c => { if (!delante.has(c.de)) { delante.add(c.de); pila.push(c.de); } }); }
  const sub = v.nodos.filter(x => delante.has(x.id));
  const cuenta = x => x.t === 'paso' || x.t === 'componente';
  const suyo = x => Math.round(Number(x.t === 'paso' ? x.dur : x.presupuesto) || 0);
  const k = _cadenasFijas(sub, v.conectores, x => cuenta(x) && !x.fijo, x => cuenta(x) && x.fijo ? suyo(x) : 0);
  let hechos = 0;
  sub.forEach(x => {
    if (x.t === 'componente' && x.fijo) { repartirComponente(d, x.id); return; }   // su tiempo no se toca; dentro sí se reparte
    const parte = Math.max(1, Math.floor((W - k[x.id].fijos) / Math.max(1, k[x.id].libres)));
    if (x.t === 'paso' && !x.fijo) { x.dur = parte; hechos++; }
    if (x.t === 'componente') { x.presupuesto = parte; hechos++; repartirComponente(d, x.id); }
  });
  return hechos;
}

// ══ DIBUJO: lo que el plan añade encima de cada pieza ═══════════════════════════════════════════════════════════
function decoPlan(calc, cp){
  cp = cp || { fechas: true, strl: true };
  return (n, g) => {
    const x = calc.r[n.id];
    let s = calc.sinHito.has(n.id) ? `<rect class="mal-marco" x="-7" y="-7" width="${g.w + 14}" height="${g.h + 14}" rx="8"/><text class="mal-t" x="${g.w / 2}" y="-13" text-anchor="middle">⚠ no llega a un hito</text>` : '';
    if (n.t === 'componente') {
      const cs = (unidadesDe(n).length ? unidadesDe(n) : ['']).map(colorUnidad), hs = g.h / cs.length;
      s += cs.map((c, i) => `<rect x="0" y="${i * hs}" width="5" height="${hs}" style="fill:${c}"/>`).join('');
      const st = strlDe(n);
      const fin = Number(n.strlFin) || 0;
      if (cp.strl && (st.nivel || fin)) {
        const txt = `STRL ${st.nivel || '–'}${st.heredado ? ' · H' : ''}${fin ? ' → ' + fin : ''}`;
        s += `<rect class="strl-b${st.heredado ? ' her' : ''}" x="12" y="7" width="${txt.length * 6.2 + 8}" height="14" rx="3"/><text class="strl-t${st.heredado ? ' her' : ''}" x="16" y="17.5">${txt}</text>`;
      }
      if (n.area) s += `<text class="chip-d vacio" x="${g.w - 10}" y="17" text-anchor="end">${esc(recorta(n.area, cp.strl && (st.nivel || fin) ? 96 : 170, 600))}</text>`;
      const npasos = (calc.hijos[n.id] || []).filter(h => h.t === 'paso').length;
      const p = Math.round(Number(n.presupuesto) || 0);
      let t, cls = '';
      if (x && x.agregado) { t = p ? `${x.est} / ${p} d` : `${x.est} d`; if (x.mal) cls = ' mal'; }
      else if (p) t = `${p} d`;
      else { t = '— d'; cls = ' vacio'; }
      if (cp.fechas) s += `<text class="chip-d${cls}" x="${g.w - 10}" y="${g.h - 9}" text-anchor="end">${n.fijo ? '🔒 ' : ''}${t}</text>`;
      if (npasos) s += `<text class="chip-d vacio" x="12" y="${g.h - 9}">${npasos} paso${npasos > 1 ? 's' : ''} ▸</text>`;
    } else if (n.t === 'paso') {
      const dd = Math.round(Number(n.dur) || 0);
      if (cp.fechas) s += `<text class="chip-d${dd ? '' : ' vacio'}" x="${g.w - 9}" y="${g.h - 8}" text-anchor="end">${n.fijo ? '🔒 ' : ''}${dd ? dd + ' d' : '— d'}</text>`;
      if (cp.strl && n.subeA) s += `<text class="chip-d vacio" x="9" y="${g.h - 8}">→ STRL ${n.subeA}</text>`;
      const ext = (calc.externos[n.id] || 0);
      if (ext) s += `<text class="chip-d" x="${g.w - 9}" y="14" text-anchor="end">↤ ${ext}</text>`;
      if (cp.fechas && x && x.pasado) s += `<text class="chip-d mal" x="9" y="14">plazo +${x.pasado} d</text>`;
    } else if (n.t === 'hito' && x && cp.fechas) {
      const f = calc.fecha(x.es);
      s += `<text class="chip-d${x.tarde ? ' mal' : n.fija ? '' : ' vacio'}" x="${g.w / 2}" y="${g.h - 7}" text-anchor="middle">${n.fija ? dmy(n.fija).slice(0, 5) : '≈ ' + dmy(f).slice(0, 5)}${x.tarde ? ' · +' + x.tarde + ' d' : ''}</text>`;
    }
    return s;
  };
}

// ══ EL CALENDARIO: las filas para `ganttPartes`, según el nivel ═════════════════════════════════════════════════
function filasCalendario(d, calc, nivel){
  const { r, por, hijos, fecha } = calc;
  const finIncl = x => x.ef > x.es ? fecha(x.ef - 1) : fecha(x.es);
  const visibles = new Set();
  const fila = n => {
    const x = r[n.id]; if (!x) return null;
    const [a, b] = calc.colocar(n.id), atras = calc.atrasDe(n);
    const f = { id: n.id, nombre: n.txt, resp: n.resp || '', ini: fecha(a), crit: x.crit };
    if (n.t === 'hito') { f.t = 'hito'; f.tarde = x.tarde; }
    else { f.t = 'tarea'; f.fin = b > a ? fecha(b - 1) : fecha(a); if (!atras && x.lf != null && x.lf > x.ef) f.holgFin = fecha(x.lf - 1); }
    if (n.t === 'componente') { f.color = colorDe(n); if (x.mal) f.mal = true; }
    visibles.add(n.id);
    return f;
  };
  const porFecha = (a, b) => ((r[a.id] || {}).es || 0) - ((r[b.id] || {}).es || 0);
  const arriba = (hijos[null] || []).filter(n => n.t !== 'o' && n.t !== 'decision' && !(n.t === 'componente' && !enArea(n.area, FILTRO_AREA))).sort(porFecha);
  const filas = [];
  if (nivel === 3) {
    d.datos.nodos.filter(n => n.t === 'hito').sort(porFecha).forEach(n => { const f = fila(n); if (f) filas.push(f); });
  } else if (nivel === 2) {
    arriba.forEach(n => { const f = fila(n); if (f) filas.push(f); });
  } else {
    arriba.forEach(n => {
      const hs = (hijos[n.id] || []).filter(h => h.t !== 'o' && h.t !== 'decision').sort(porFecha);
      if (n.t === 'componente' && hs.length) {
        const [a, b] = calc.colocar(n.id);
        filas.push({ id: n.id, t: 'fase', nombre: n.txt, ini: fecha(a), fin: b > a ? fecha(b - 1) : fecha(a), color: colorDe(n) });
        visibles.add(n.id);
        hs.forEach(h => { const f = fila(h); if (f) filas.push(f); });
      } else { const f = fila(n); if (f) filas.push(f); }
    });
  }
  // dependencias entre lo que se ve, atravesando lo que no (O, decisiones, pasos de dentro)
  const resolver = (id, vistos) => {
    if (visibles.has(id)) return [id];
    if (vistos.has(id)) return []; vistos.add(id);
    const n = por[id]; if (!n) return [];
    const ps = calc.preds[id] || [];
    let out = ps.reduce((a, p) => a.concat(resolver(p, vistos)), []);
    if (n.padre && visibles.has(n.padre)) out = out.filter(x => x !== n.padre);
    return out;
  };
  filas.forEach(f => {
    if (f.t === 'fase') return;
    let ps = [];
    const n = por[f.id];
    const hojasDe = id => (hijos[id] && hijos[id].length) ? hijos[id].reduce((a, h) => a.concat(hojasDe(h.id)), []) : [id];
    hojasDe(n.id).forEach(h => (calc.preds[h] || []).forEach(p => { ps = ps.concat(resolver(p, new Set())); }));
    f.deps = Array.from(new Set(ps)).filter(x => x !== f.id && !(hijos[f.id] || []).some(h => h.id === x));
  });
  return filas;
}
function kpisHTML(calc){
  const fin = calc.fin, crit = Object.keys(calc.r).filter(id => calc.r[id].crit && calc.por[id] && calc.por[id].t === 'paso').length;
  const hfijos = calc.hijos && Object.values(calc.por).filter(n => n.t === 'hito' && n.fija);
  const ultimo = hfijos.sort((a, b) => a.fija < b.fija ? 1 : -1)[0];
  const k = [[dmy(calc.fecha(Math.max(0, calc.finTrabajo - 1))), 'fin del trabajo', '']];
  if (ultimo && calc.r[ultimo.id]) {
    const margen = diasEntre(calc.fecha(calc.finTrabajo), ultimo.fija);
    const dias = x => x === 1 ? '1 día' : x + ' días';
    k.push([margen >= 0 ? dias(margen) : dias(-margen) + ' tarde', 'de margen hasta «' + ultimo.txt + '»', margen < 0 ? 'mal' : '']);
  }
  k.push([fin === 1 ? '1 día' : fin + ' días', 'duración', '']);
  k.push([String(crit), crit === 1 ? 'paso crítico' : 'pasos críticos', '']);
  return `<div class="kpis">${k.map(x => `<div class="kpi"><b class="${x[2]}">${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('')}</div>`;
}

// ══ PINTAR ══════════════════════════════════════════════════════════════════════════════════════════════════════
function barraProyecto(d){
  const cp = capasDe(d);
  const pest = (cp.fechas ? `<span class="seg"><button data-pest="plan" class="${PEST === 'plan' ? 'on' : ''}">Plan</button><button data-pest="calendario" class="${PEST === 'calendario' ? 'on' : ''}">Calendario</button></span><span class="sep"></span>` : '')
    + `<span class="seg capas" role="group" aria-label="Capas">${[['fechas', 'Fechas'], ['strl', 'STRL']].map(([k, t]) => `<button type="button" data-capa="${k}" class="${cp[k] ? 'on' : ''}" aria-pressed="${!!cp[k]}">${t}</button>`).join('')}</span><span class="sep"></span>`;
  if (PEST === 'calendario') {
    return pest + `<span class="seg">${[[1, 'Pasos'], [2, 'Tarjetas'], [3, 'Hitos']].map(([k, t]) => `<button data-nivel="${k}" class="${NIVEL === k ? 'on' : ''}">${k} · ${t}</button>`).join('')}</span>
      <span class="sep"></span><span class="seg">${Object.keys(ESCALAS).map(k => `<button data-escala-p="${k}" class="${(d.datos.escala || 'semana') === k ? 'on' : ''}">${ESCALAS[k].nombre}</button>`).join('')}</span>` + filtroArea(d);
  }
  const dentro = DENTRO && d.datos.nodos.find(n => n.id === DENTRO);
  const miga = dentro ? `<button class="btn" data-subir="1" title="Volver arriba (Esc)">↑ Proyecto</button><span class="miga">› ${esc(dentro.txt)}</span><span class="sep"></span>` : '';
  const pal = (dentro ? PALETA_DENTRO : PALETA_ARRIBA).map(k => `<div class="pieza" data-pieza="${k}">${iconoPieza(k).replace('width="34"', 'width="30"')}${esc(PIEZAS[k].nombre)}</div>`).join('');
  return pest + miga + pal + `<span class="sep"></span><button class="btn" data-ordenar="1">Ordenar</button>` + filtroArea(d);
}
function filtroArea(d){
  const usadas = d.datos.nodos.filter(n => n.t === 'componente' && n.area).map(n => n.area);
  if (!usadas.length && !FILTRO_AREA) return '';
  const vale = a => a === FILTRO_AREA || usadas.some(u => enArea(u, a));   // una madre sale si alguna hija se usa
  return `<span class="sep"></span>` + selector([['', 'Todas las áreas']].concat(areaOps().filter(o => vale(o[0]))), FILTRO_AREA, 'data-filtro="1"');
}
function pintarCalendario(d){
  const barra = $('#barra');
  barra.dataset.modo = 'cal'; barra.innerHTML = barraProyecto(d);
  const calc = calcularPlan(d);
  const filas = filasCalendario(d, calc, NIVEL);
  const lz = $('#lienzo'); lz.classList.add('gantt');
  const p = ganttPartes({ escala: d.datos.escala || 'semana', filas }, {});
  lz.innerHTML = `<div class="dgv" style="min-width:max-content">${kpisHTML(calc)}<div class="gwrap"><svg class="dg gtabla" width="${G_TW}" height="${p.H}" viewBox="0 0 ${G_TW} ${p.H}">${p.defs}${p.tabla}</svg><svg class="dg glinea" width="${p.LW}" height="${p.H}" viewBox="0 0 ${p.LW} ${p.H}">${p.defs}${p.linea}</svg></div></div>`;
  lz._g = p;
}

// ══ INSPECTOR ═══════════════════════════════════════════════════════════════════════════════════════════════════
function inspectorProyecto(d){
  const calc = calcularPlan(d), r = calc.r, cp = capasDe(d);
  const fechas = (n, x) => {
    if (!x) return '';
    const [a, b] = calc.colocar(n.id);
    const t = x.dur > 0 || x.agregado ? `${dmy(calc.fecha(a))} → ${dmy(calc.fecha(Math.max(a, b - 1)))}` : dmy(calc.fecha(a));
    const extra = x.crit ? ' · <b style="color:var(--red2)">crítica</b>' : x.holg > 0 ? ` · ${x.holg} d de margen` : '';
    return `<p class="ayuda" style="padding:0">${t}${extra}</p>`;
  };
  const uni = (v, que) => `<div class="campo"><span>Unidad</span>${selectorUnidad(v, que)}</div>`;
  if (SEL && SEL.k === 'n') {
    const n = d.datos.nodos.find(x => x.id === SEL.id); if (!n) return '';
    const x = r[n.id];
    const lado = n.t === 'o' || n.t === 'decision' ? '' : `<button class="btn" data-antes="1" title="Alt+←">← Antes</button><button class="btn" data-despues="1" title="Alt+→">Después →</button>`;
    const borrar = `<div class="botones">${lado}${n.t === 'componente' ? '<button class="btn" data-entrar="1">Abrir</button>' : ''}<button class="btn peligro" id="i-borrar">Borrar</button></div>`;
    if (n.t === 'o') return `<h3>${iconoPieza('o')}O</h3>${borrar}`;
    let h = `<h3>${iconoPieza(n.t)}${esc(PIEZAS[n.t].nombre)}</h3>${campo('Nombre', `<input type="text" data-p="txt" value="${esc(n.txt)}">`)}`;
    if (n.t === 'decision') return h + borrar;
    if (n.t === 'paso') {
      const comp = n.padre && d.datos.nodos.find(c => c.id === n.padre);
      h += campo('Responsable', `<input type="text" data-p="resp" value="${esc(n.resp || '')}">`);
      if (cp.fechas) {
        h += campo('Duración (días)', `<input type="number" min="0" step="1" data-p="dur" value="${n.dur || ''}" placeholder="—">`) + candado(n, 'su duración') + fechas(n, x);
        h += `<div class="fila2">${campo('No antes de', `<input type="date" data-p="ns" value="${n.ns || ''}">`)}${campo('Plazo', `<input type="date" data-p="dl" value="${n.dl || ''}">`)}</div>`;
        if (x && x.pasado) h += `<div class="aviso">Se pasa de su plazo por ${x.pasado} días.</div>`;
      }
      h += necesitaDeFuera(d, n);
      if (comp && cp.strl) h += campoSel(`Lleva «${esc(comp.txt)}» a`, selector([['', '— no cambia su STRL —']].concat(STRL.slice(1).map((t, i) => [String(i + 1), `STRL ${i + 1} · ${t}`])), n.subeA ? String(n.subeA) : '', 'data-p="subeA"'));
    }
    if (n.t === 'hito' && cp.fechas) {
      h += campo('Fecha fija', `<input type="date" data-p="fija" value="${n.fija || ''}">`) + fechas(n, x);
      if (x && x.tarde) h += `<div class="aviso">No llega por ${x.tarde} días.</div>`;
      if (n.fija) h += `<button class="btn" data-repartir-hito="1">Repartir el tiempo hasta aquí</button>`;
    }
    if (n.t === 'componente') {
      const est = x && x.agregado ? x.est : null, p = Math.round(Number(n.presupuesto) || 0);
      h += campoSel('Área', selector([['', 'Sin área']].concat(areaOps()), n.area || '', 'data-p="area"'));
      h += unidadesHTML(n) + campo('Responsable', `<input type="text" data-p="resp" value="${esc(n.resp || '')}">`);
      h += produceHTML(n) + necesitaHTML(d, n);
      if (cp.fechas) {
      h += campo('Tiempo (días)', `<input type="number" min="0" step="1" data-p="presupuesto" value="${p || ''}" placeholder="—">`) + candado(n, 'su tiempo');
      h += `<div class="campo"><span>Colocar</span><span class="seg">${[['', 'Desde hoy'], ['1', 'Desde el final']].map(([v, t]) => `<button type="button" data-atras="${v}" class="${!!n.atras === !!v ? 'on' : ''}" aria-pressed="${!!n.atras === !!v}">${t}</button>`).join('')}</span></div>`;
      if (est != null) h += `<p class="ayuda" style="padding:0">Sus pasos piden <b>${est} días</b></p>`;
      if (x && x.mal) h += `<div class="aviso">Le das ${p} días y sus pasos piden ${est}.</div>`;
      if (p && est != null) h += `<button class="btn" data-repartir="1">Repartir ${p} días entre sus pasos</button>`;
      h += fechas(n, x);
      }
      const st = strlDe(n), her = n.herencia || {};
      if (cp.strl) h += `<div class="sc" style="margin-top:6px">STRL</div>
        <div class="fila2">${campoSel('Inicial', selector(STRL.map((t, i) => [String(i), i ? `STRL ${i} · ${t}` : t]), String(Number(n.strl) || 0), 'data-p="strl"'))}
        ${campoSel('Final esperado', selector(STRL.map((t, i) => [String(i), i ? `STRL ${i} · ${t}` : t]), String(Number(n.strlFin) || 0), 'data-p="strlFin"'))}</div>
        ${campoSel('Herencia de vuelo', selector([['', '— sin herencia —']].concat([1, 2, 3, 4].map(i => [String(i), `STRL ${i} · ${STRL[i]}`])), her.nivel ? String(her.nivel) : '', 'data-p="her.nivel"'))}
        ${her.nivel ? campo('Viene de', `<input type="text" data-p="her.de" value="${esc(her.de || '')}">`) + campo('Justificación', `<textarea data-p="her.porque" rows="2">${esc(her.porque || '')}</textarea>`)
          + `<label class="campo" style="grid-template-columns:auto 1fr;align-items:center;gap:8px"><input type="checkbox" data-p="her.aprobada" style="width:auto"${her.aprobada ? ' checked' : ''}><span>Aprobada por el dueño o el PD</span></label>` : ''}
        ${st.nivel ? `<p class="ayuda" style="padding:0">Cuenta como <b>STRL ${st.nivel}</b>${st.heredado ? ' · heredado' : ''}</p>` : ''}`;
    }
    return h + borrar;
  }
  if (SEL && SEL.k === 'c') {
    const c = d.datos.conectores.find(x => x.id === SEL.id); if (!c) return '';
    const a = nodoDe(d, c.de), b = nodoDe(d, c.a); if (!a || !b) return '';
    let h = `<h3>${esc(a.txt)} → ${esc(b.txt)}</h3>`;
    if (a.t === 'componente') h += `<div class="campo"><span>Pasa</span><div class="chips">${(a.produce || []).map(p => chipItem(c, p)).join('')}<input class="add-in" data-add-prod-c="1" placeholder="Añadir…" aria-label="Añadir lo que pasa por la flecha"></div></div>`;
    return h + `<div class="botones"><button class="btn" id="i-invertir">Invertir</button><button class="btn peligro" id="i-borrar">Borrar</button></div>`;
  }
  // nada seleccionado: el proyecto
  return `<h3>Proyecto</h3>
    <div class="fila2">${uni(d.unidad, 'doc')}${campo('Empieza', `<input type="date" data-p="doc.inicio" value="${d.datos.inicio || hoyISO()}">`)}</div>
    <div class="sc">Coherencia</div>${avisosVisibles(d, calc).length ? avisosVisibles(d, calc).map(a => `<div class="aviso" data-ir="${a.id}" style="cursor:pointer">${esc(a.txt)}</div>`).join('') : '<p class="ayuda ok-txt" style="padding:0">✓ Coherente</p>'}`;
}
function unidadesHTML(n){
  const us = unidadesDe(n);
  const resto = UNIDADES.filter(u => !us.includes(u));
  return `<div class="campo"><span>Unidades</span><div class="chips">${us.map(u => `<span class="chip-u tag"><i style="background:${colorUnidad(u)}"></i>${esc(u)}<button type="button" class="q" data-uni="${esc(u)}" aria-label="Quitar ${esc(u)}">×</button></span>`).join('')}${resto.length ? `<div style="flex:1;min-width:140px">${selector([['', 'Añadir…']].concat(resto.map(u => [u, u, colorUnidad(u)])), '', 'data-p="uni-add"')}</div>` : ''}</div></div>`;
}
function produceHTML(n){
  return `<div class="campo"><span>Produce</span><div class="chips">${(n.produce || []).map(p => `<span class="chip-u tag">${esc(p.txt)}<button type="button" class="q" data-quita-prod="${p.id}" aria-label="Quitar ${esc(p.txt)}">×</button></span>`).join('')}<input class="add-in" data-add-prod="1" placeholder="Añadir…" aria-label="Añadir lo que produce"></div></div>`;
}
function chipItem(c, p){
  const on = (c.items || []).includes(p.id);
  return `<button type="button" class="chip-u${on ? ' on' : ''}" data-item="${p.id}" data-con="${c.id}" aria-pressed="${on}">${esc(p.txt)}</button>`;
}
function necesitaHTML(d, n){
  const entra = d.datos.conectores.filter(c => c.a === n.id).map(c => ({ c, de: nodoDe(d, c.de) })).filter(o => o.de && o.de.t === 'componente');
  const filas = entra.map(o => `<div class="nec"><div class="nec-de"><i style="background:${colorDe(o.de)}"></i>${esc(o.de.txt)}</div>${(o.de.produce || []).length ? `<div class="chips">${o.de.produce.map(p => chipItem(o.c, p)).join('')}</div>` : ''}</div>`).join('');
  const pend = (n.pide || []).map(p => `<span class="chip-u pend">${esc(p.txt)}<button type="button" class="q" data-quita-pide="${p.id}" aria-label="Quitar ${esc(p.txt)}">×</button></span>`).join('');
  const ya = new Set(entra.reduce((s, o) => s.concat((o.c.items || []).map(i => o.de.id + '|' + i)), []));
  const ops = d.datos.nodos.filter(m => m.t === 'componente' && m.id !== n.id && (m.padre || null) === (n.padre || null))
    .reduce((s, m) => s.concat((m.produce || []).filter(p => !ya.has(m.id + '|' + p.id)).map(p => [m.id + '|' + p.id, `${p.txt} · ${m.txt}`, colorDe(m)])), []);
  return `<div class="campo"><span>Necesita</span>${filas}${pend ? `<div class="chips">${pend}</div>` : ''}<div class="fila2">${ops.length ? selector([['', 'De otra tarjeta…']].concat(ops), '', 'data-p="necesita"') : ''}<input class="add-in" data-add-pide="1" placeholder="Otra cosa…" aria-label="Añadir algo que necesita y nadie produce aún"></div></div>`;
}
// Las dependencias que cruzan de un componente a otro se ponen aquí: dibujarlas exigiría ver dos componentes a la vez.
function necesitaDeFuera(d, n){
  const comps = d.datos.nodos.filter(c => c.t === 'componente' && c.id !== n.padre);
  const grupos = comps.map(c => {
    const ms = d.datos.nodos.filter(m => m.padre === c.id && (m.t === 'paso' || m.t === 'hito'));
    if (!ms.length) return '';
    const marcadas = ms.filter(m => d.datos.conectores.some(k => k.de === m.id && k.a === n.id)).length;
    return `<details${marcadas ? ' open' : ''}><summary><i style="background:${colorUnidad(c.unidad)}"></i>${esc(c.txt)}${marcadas ? ` · ${marcadas}` : ''}</summary>${ms.map(m => `<label><input type="checkbox" data-ext="${m.id}"${d.datos.conectores.some(k => k.de === m.id && k.a === n.id) ? ' checked' : ''}>${esc(m.txt)}</label>`).join('')}</details>`;
  }).join('');
  // un <div> y no `campo()`: dentro de un <label>, pinchar el título marcaría la primera casilla
  return grupos ? `<div class="campo"><span>Necesita también (de otros componentes)</span><div class="deps fuera">${grupos}</div></div>` : '';
}
function candado(n, que){
  return `<label class="campo candado"><input type="checkbox" data-p="fijo"${n.fijo ? ' checked' : ''}><span>🔒 Fijar ${que}</span></label>`;
}
function _ponerCampo(d, n, campoP, v){
  if (campoP === 'fijo') { if (v) n.fijo = true; else delete n.fijo; return; }
  if (campoP === 'doc.unidad') { d.unidad = v; return; }
  if (campoP === 'doc.inicio') { d.datos.inicio = v || hoyISO(); return; }
  if (campoP.startsWith('her.')) {
    n.herencia = n.herencia || {};
    const k = campoP.slice(4);
    if (k === 'nivel') { if (!v) { delete n.herencia; return; } n.herencia.nivel = Math.min(Number(v), STRL_HERENCIA_MAX); n.herencia.aprobada = false; return; }   // cambiar el nivel retira la aprobación
    n.herencia[k] = v; return;
  }
  if (campoP === 'dur' || campoP === 'presupuesto' || campoP === 'strl' || campoP === 'strlFin' || campoP === 'subeA') { const num = Math.max(0, Math.round(Number(v) || 0)); if (num) n[campoP] = num; else delete n[campoP]; return; }
  if (v === '' || v == null) delete n[campoP]; else n[campoP] = v;
}
function engancharProyecto(){
  const ins = $('#inspector');
  const nodoSel = d => SEL && SEL.k === 'n' ? d.datos.nodos.find(x => x.id === SEL.id) : null;
  const esProy = () => { const d = docActual(); return d && d.tipo === 'proyecto' ? d : null; };
  ins.addEventListener('input', ev => {
    const d = esProy(); if (!d) return;
    const t = ev.target; if (!t.dataset.p || !t.matches('input[type=text],textarea')) return;
    if (!t.dataset.snap) { instantanea(); t.dataset.snap = '1'; }
    _ponerCampo(d, nodoSel(d), t.dataset.p, t.value);
    d.editado = Date.now(); clearTimeout(_guardaT); _guardaT = setTimeout(guardarBib, 400); pintarEstado('cambios');
    if (PEST === 'plan') pintarFlujo(d); else pintarCalendario(d);
  });
  ins.addEventListener('change', ev => {
    const d = esProy(); if (!d) return;
    const t = ev.target;
    if (t.dataset.ext && SEL) {   // una dependencia desde otro componente
      instantanea();
      const ya = d.datos.conectores.find(k => k.de === t.dataset.ext && k.a === SEL.id);
      if (t.checked && !ya) d.datos.conectores.push({ id: uid('c'), de: t.dataset.ext, a: SEL.id });
      if (!t.checked && ya) d.datos.conectores = d.datos.conectores.filter(k => k !== ya);
      confirmar(); return;
    }
    if (!t.dataset.p) return;
    if (t.dataset.p === 'uni-add') { if (!t.value) return; instantanea(); const n = nodoSel(d); n.unidades = unidadesDe(n).concat([t.value]); delete n.unidad; confirmar(); return; }
    if (t.dataset.p === 'necesita') { if (!t.value) return; instantanea(); const [de, it] = t.value.split('|'); necesitar(d, nodoSel(d), de, it); confirmar(); return; }
    if (t.matches('input[type=text],textarea')) { delete t.dataset.snap; pintarLista(); pintarInspector(d); return; }
    instantanea();
    _ponerCampo(d, nodoSel(d), t.dataset.p, t.type === 'checkbox' ? t.checked : t.value);
    confirmar();
  });
  // Intro en las cajas de «Añadir…»: se añade y el foco se queda en la caja, para seguir escribiendo
  ins.addEventListener('keydown', ev => {
    const d = esProy(); if (!d || ev.key !== 'Enter') return;
    const t = ev.target, cual = t.dataset.addProd ? 'add-prod' : t.dataset.addProdC ? 'add-prod-c' : t.dataset.addPide ? 'add-pide' : null;
    if (!cual) return;
    ev.preventDefault(); ev.stopPropagation();
    const txt = t.value.trim(); if (!txt) return;
    instantanea();
    if (cual === 'add-prod') anadirProduce(nodoSel(d), txt);
    if (cual === 'add-prod-c') { const c = d.datos.conectores.find(k => k.id === SEL.id), a = c && nodoDe(d, c.de); if (a) { const p = anadirProduce(a, txt); alternarItem(c, p.id, true); } }
    if (cual === 'add-pide') { const n = nodoSel(d); n.pide = n.pide || []; if (!n.pide.some(p => p.txt.toLowerCase() === txt.toLowerCase())) n.pide.push({ id: uid('i'), txt }); }
    t.value = ''; t.blur(); confirmar();
    const otra = $(`#inspector [data-${cual}]`); if (otra) otra.focus();
  });
  ins.addEventListener('click', ev => {
    const d = esProy(); if (!d) return;
    const b = ev.target.closest('[data-entrar],[data-repartir],[data-repartir-hito],[data-ir],[data-uni],[data-quita-prod],[data-quita-pide],[data-item],[data-atras],[data-antes],[data-despues]'); if (!b) return;
    const n = nodoSel(d);
    if (b.dataset.entrar) entrar(SEL.id);
    if (b.dataset.repartir) { instantanea(); repartirComponente(d, SEL.id); confirmar(); }
    if (b.dataset.repartirHito) { instantanea(); repartirHito(d, SEL.id); confirmar(); }
    if (b.dataset.ir) { const m = d.datos.nodos.find(x => x.id === b.dataset.ir); if (m) { PEST = 'plan'; DENTRO = m.padre || null; SEL = { k: 'n', id: m.id }; pintar(); requestAnimationFrame(encajar); } }
    if (b.dataset.uni && n) { instantanea(); const us = unidadesDe(n).slice(), u = b.dataset.uni, i = us.indexOf(u); if (i >= 0) us.splice(i, 1); else us.push(u); n.unidades = us; delete n.unidad; confirmar(); }
    if (b.dataset.quitaProd && n) { instantanea(); quitarProduce(d, n, b.dataset.quitaProd); confirmar(); }
    if (b.dataset.quitaPide && n) { instantanea(); n.pide = (n.pide || []).filter(p => p.id !== b.dataset.quitaPide); if (!n.pide.length) delete n.pide; confirmar(); }
    if (b.dataset.item) { const c = d.datos.conectores.find(k => k.id === b.dataset.con); if (c) { instantanea(); alternarItem(c, b.dataset.item); confirmar(); } }
    if (b.dataset.atras != null && n) { instantanea(); if (b.dataset.atras) n.atras = true; else delete n.atras; confirmar(); }
    if (b.dataset.antes && n) crearAlLado(d, n, true);
    if (b.dataset.despues && n) crearAlLado(d, n, false);
  });
  // Alt+← / Alt+→ con una pieza elegida: lo que va antes / después. Va antes que las flechas que mueven la pieza.
  document.addEventListener('keydown', ev => {
    const d = esProy(); if (!d || PEST !== 'plan' || !ev.altKey || (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight')) return;
    if (ev.target.matches && ev.target.matches('input,textarea')) return;
    const n = SEL && SEL.k === 'n' && nodoDe(d, SEL.id); if (!n || n.t === 'o' || n.t === 'decision') return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    crearAlLado(d, n, ev.key === 'ArrowLeft');
  });
  $('#barra').addEventListener('change', ev => {
    const d = esProy(); if (!d || !ev.target.dataset.filtro) return;
    FILTRO_AREA = ev.target.value; $('#barra').dataset.modo = ''; pintar();
  });
  $('#barra').addEventListener('click', ev => {
    const d = esProy(); if (!d) return;
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.pest) { cerrarEditorTexto(true); PEST = b.dataset.pest; SEL = null; $('#lienzo').innerHTML = ''; pintar(); if (PEST === 'plan') requestAnimationFrame(encajar); }
    if (b.dataset.capa) { const cp = capasDe(d); cp[b.dataset.capa] = !cp[b.dataset.capa]; if (!cp.fechas && PEST === 'calendario') PEST = 'plan'; guardarBib(); $('#barra').dataset.modo = ''; pintar(); return; }
    if (b.dataset.nivel) { NIVEL = Number(b.dataset.nivel); pintar(); }
    if (b.dataset.escalaP) { instantanea(); d.datos.escala = b.dataset.escalaP; confirmar(); }
    if (b.dataset.subir) subir();
    if (b.dataset.ordenar) { instantanea(); ordenar(d, DENTRO); confirmar(); requestAnimationFrame(encajar); }
  });
}
// Daniel, 11/11: «que no estés pisando los requisitos de otra persona o los plazos de otra persona sin avisar […] que te
// ponga el aviso para que lo hables con esa otra persona». Tras cada cambio se compara con la instantánea de justo antes:
// si una tarjeta de OTRA unidad acaba más tarde o se queda sin algo que recibía, se dice en el momento. (Notificar a esa
// persona necesita el backend: decisiones-app 2i-3.)
function recibeDe(datos, id){
  const por = {}; datos.nodos.forEach(n => { por[n.id] = n; });
  const s = new Set();
  datos.conectores.forEach(c => { if (c.a !== id || !c.items) return; const a = por[c.de]; (a && a.produce || []).forEach(p => { if (c.items.includes(p.id)) s.add(p.txt); }); });
  return s;
}
function trasCambio(d){
  if (_deshaciendo || !HIST.atras.length) return;
  let antes; try { antes = Object.assign({}, d, { datos: JSON.parse(HIST.atras[HIST.atras.length - 1]) }); } catch (_) { return; }
  let quien = null;   // las unidades de lo que se ha tocado; sin saberlo (p. ej. al borrar) se mira todo
  if (SEL && SEL.k === 'n') { let n = nodoDe(d, SEL.id); if (n && n.padre) n = nodoDe(d, n.padre); if (n && n.t === 'componente') quien = unidadesDe(n); }
  if (SEL && SEL.k === 'c') { const c = d.datos.conectores.find(k => k.id === SEL.id), a = c && nodoDe(d, c.de); if (a && a.t === 'componente') quien = unidadesDe(a); }
  if (typeof NUBE !== 'undefined') NUBE.quien = quien;   // el servidor avisa con esto (diagramas_srv.afectados)
  if (quien && !quien.length) return;
  const k0 = calcularPlan(antes), k1 = calcularPlan(d), lineas = [];
  d.datos.nodos.filter(n => n.t === 'componente' && !n.padre).forEach(n => {
    const us = unidadesDe(n); if (!us.length || (quien && us.some(u => quien.includes(u)))) return;
    const a = k0.r[n.id], b = k1.r[n.id], cosas = [];
    if (a && b && b.ef > a.ef) { cosas.push(`${b.ef - a.ef} d más tarde`); if (typeof NUBE !== 'undefined') NUBE.retrasos[n.id] = Math.max(NUBE.retrasos[n.id] || 0, b.ef - a.ef); }
    const r0 = recibeDe(antes.datos, n.id), r1 = recibeDe(d.datos, n.id), sin = [...r0].filter(x => !r1.has(x));
    if (sin.length) cosas.push('sin «' + sin.join('», «') + '»');
    if (cosas.length) lineas.push(`«${esc(n.txt)}» · ${esc(us.join(', '))}${n.resp ? ' · ' + esc(n.resp) : ''}: ${esc(cosas.join(', '))}`);
  });
  if (lineas.length) mensaje(`<b>Afecta a otra unidad</b><br>${lineas.join('<br>')}`, 9000);
}
function entrar(id){ cerrarEditorTexto(true); DENTRO = id; SEL = null; pintar(); requestAnimationFrame(encajar); }
function subir(){ const d = docActual(); const sale = DENTRO; DENTRO = null; SEL = sale ? { k: 'n', id: sale } : null; pintar(); requestAnimationFrame(encajar); void d; }

// ══ LA DESCARGA de un proyecto: calendario + el plan, componente a componente ═══════════════════════════════════
function proyectoEstatico(doc){
  const calc = calcularPlan(doc);
  const p = ganttPartes({ escala: doc.datos.escala || 'semana', filas: filasCalendario(doc, calc, 1) }, {});
  const W = G_TW + p.LW;
  const cal = `<svg class="dg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${p.H}" width="${W}" height="${p.H}">${p.defs}<rect width="${W}" height="${p.H}" fill="var(--d-bg)"/><g transform="translate(${G_TW},0)">${p.linea}</g><rect x="0" y="0" width="${G_TW}" height="${p.H}" fill="var(--d-bg)"/>${p.tabla}<line class="g-mes" x1="${G_TW}" x2="${G_TW}" y1="0" y2="${p.H}"/></svg>`;
  const deco = decoPlan(calc);
  let plan = `<h2>Plan</h2>${flujoEstatico(planVisible(doc, null), { deco })}`;
  doc.datos.nodos.filter(n => n.t === 'componente' && (calc.hijos[n.id] || []).length).forEach(n => {
    plan += `<h3><i style="background:${colorDe(n)}"></i>${esc(n.txt)}${unidadesDe(n).length ? ` <span>· ${esc(unidadesDe(n).join(' · '))}</span>` : ''}</h3>${flujoEstatico(planVisible(doc, n.id), { deco })}`;
  });
  return kpisHTML(calc) + `<h2>Calendario</h2>` + cal + plan;
}

// ══ EJEMPLO (una plantilla, sin personas ni fechas reales) ══════════════════════════════════════════════════════
function ejemploProyecto(){
  const h = hoyISO();
  const d = nuevoDoc('proyecto', 'Ejemplo — Aerofrenos', { inicio: h, escala: 'semana', nodos: [
    { id: 'c1', t: 'componente', padre: null, x: 60, y: 60, txt: 'Diseño del aerofreno', area: 'Aerofrenos', unidades: ['Aeroestructuras'], presupuesto: 25, strl: 1, produce: [{ id: 'i1', txt: 'Geometría' }, { id: 'i4', txt: 'Masa' }] },
    { id: 'c2', t: 'componente', padre: null, x: 60, y: 220, txt: 'Electrónica del servo', area: 'Aviónica', unidades: ['Aviónica'], presupuesto: 20, produce: [{ id: 'i2', txt: 'Servo y driver' }] },
    { id: 'c3', t: 'componente', padre: null, x: 360, y: 140, txt: 'Control de aerofrenos', area: 'Software de vuelo', unidades: ['GNC', 'Aviónica'], presupuesto: 15, produce: [{ id: 'i3', txt: 'Ley de control' }] },
    { id: 'h1', t: 'hito', padre: null, x: 680, y: 156, txt: 'Ensayo en banco', fija: sumaDias(h, 49) },
    { id: 'p1', t: 'paso', padre: 'c1', x: 40, y: 60, txt: 'Requisitos', dur: 5 },
    { id: 'p2', t: 'paso', padre: 'c1', x: 260, y: 60, txt: 'CAD', dur: 10 },
    { id: 'p3', t: 'paso', padre: 'c1', x: 480, y: 0, txt: 'Maqueta impresa en 3D', dur: 4, subeA: 2 },
    { id: 'p4', t: 'paso', padre: 'c1', x: 480, y: 120, txt: 'Cálculo de cargas', dur: 6 },
    { id: 'p5', t: 'paso', padre: 'c1', x: 700, y: 60, txt: 'Revisión de encaje', dur: 2 },
  ], conectores: [
    { id: 'k1', de: 'c1', a: 'c3', items: ['i1'] }, { id: 'k2', de: 'c2', a: 'c3', items: ['i2'] }, { id: 'k3', de: 'c3', a: 'h1', items: ['i3'] },
    { id: 'k4', de: 'p1', a: 'p2' }, { id: 'k5', de: 'p2', a: 'p3' }, { id: 'k6', de: 'p2', a: 'p4' }, { id: 'k7', de: 'p3', a: 'p5' }, { id: 'k8', de: 'p4', a: 'p5' },
  ] });
  return d;
}

// ══ ARRANQUE ════════════════════════════════════════════════════════════════════════════════════════════════════
(function(){
  const st = document.createElement('style'); st.textContent = PROYECTO_CSS; document.head.appendChild(st);
  engancharProyecto();
  iniciar();
})();
