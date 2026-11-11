/* ═══ DIAGRAMAS SOLARIS — LA NUBE (11/11/2026) ════════════════════════════════════════════════════════════════════
   Daniel, 11/11: «haré que se sincronice en la nube, flow draw.io, y que podamos estar todos en el mismo documento a la vez».
   Contrato de la arquitecta (decisiones-app 2i): misma sesión que el panel (`localStorage['sol_sess'].token`), mismo
   `fetch` (`text/plain`, sin preflight; `idem` en cada escritura; 3 intentos), `var BACKEND_URL` en index.html que la
   publicación sustituye. Sin BACKEND_URL o sin sesión, la app sigue como antes: guarda en este navegador.
   · Guardar POR PIEZA: se manda sólo lo que cambió respecto a lo último que se vio del servidor (`nube.base`), con
     `revBase`. Si otro cambió esa misma pieza, el servidor no la pisa: se queda la suya y se dice.
   · Ver lo de los demás: cada 2,5 s se pregunta con el `rev`; si hay algo nuevo se funde pieza a pieza (lo que tú tienes
     sin guardar no se toca).
   Servidor: `rutinas/diagramas_srv.py`. Se carga DESPUÉS de diagramas.js y ANTES de proyecto.js.
   ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
'use strict';
const NUBE = { url: (typeof BACKEND_URL === 'string' && BACKEND_URL) || '', activa: false, enviando: false, pendiente: false,
  estado: '', quien: null, retrasos: {}, sondeo: null };
const NUBE_SONDEO_MS = 2500, NUBE_ESPERA_MS = 15000;

function nubeToken(){ try { const s = JSON.parse(localStorage.getItem('sol_sess') || 'null'); return (s && s.token) || null; } catch (_) { return null; } }
function nubeIdem(){ return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); }
function esErrorSesion(e){ return /token|sesi[oó]n|identidad|no est[aá] en el equipo/i.test(String(e && e.message)); }
// La llamada, con el contrato de comun.js:3036-3070 en pequeño.
async function nubeLlamar(action, cuerpo, escribe){
  const body = Object.assign({ action, token: nubeToken() }, cuerpo || {});
  if (escribe) body.idem = nubeIdem();   // UNA por llamada, la misma en los reintentos
  let ultimo = null;
  for (let i = 0; i < 3; i++) {
    if (i) await new Promise(ok => setTimeout(ok, 600 + i * 800));
    const ctl = new AbortController(), reloj = setTimeout(() => ctl.abort(), NUBE_ESPERA_MS);
    try {
      const r = await fetch(NUBE.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body), signal: ctl.signal });
      const j = JSON.parse(await r.text());
      if (!j.ok) { const e = new Error(String(j.error || 'error').replace(/^Error: /, '')); e.servidor = true; throw e; }
      return j.data;
    } catch (e) {
      if (e.servidor) throw e;   // un «no» del servidor no se reintenta
      ultimo = e;
    } finally { clearTimeout(reloj); }
  }
  throw ultimo || new Error('sin red');
}
function nubeFallo(e){
  if (esErrorSesion(e)) {
    NUBE.activa = false; clearInterval(NUBE.sondeo);
    pintarEstadoNube('sesion');
  } else pintarEstadoNube('sinred');
}

// ── la foto de lo último que se vio del servidor, y la diferencia con lo que hay aquí ─────────────────────────────
function nubeFoto(d){ return JSON.stringify({ titulo: d.titulo, unidad: d.unidad || '', datos: d.datos }); }
function nubeCambios(d){
  const base = JSON.parse(d.nube.base), c = { nodos: {}, conectores: {}, doc: {} };
  let n = 0;
  ['nodos', 'conectores'].forEach(k => {
    const B = new Map((base.datos[k] || []).map(x => [x.id, JSON.stringify(x)]));
    const A = new Map((d.datos[k] || []).map(x => [x.id, x]));
    A.forEach((x, id) => { if (B.get(id) !== JSON.stringify(x)) { c[k][id] = x; n++; } });
    B.forEach((_, id) => { if (!A.has(id)) { c[k][id] = null; n++; } });
  });
  [['titulo', d.titulo, base.titulo], ['unidad', d.unidad || '', base.unidad || ''], ['inicio', d.datos.inicio, base.datos.inicio], ['escala', d.datos.escala, base.datos.escala]]
    .forEach(([k, a, b]) => { if (a !== b && a !== undefined) { c.doc[k] = a; n++; } });
  return n ? c : null;
}
// Funde lo del servidor con lo de aquí, pieza a pieza: lo que aquí NO ha cambiado desde la base se toma del servidor.
function nubeFundir(d, srv){
  const base = JSON.parse(d.nube.base);
  let cambio = false;
  ['nodos', 'conectores'].forEach(k => {
    const B = new Map((base.datos[k] || []).map(x => [x.id, JSON.stringify(x)]));
    const L = new Map((d.datos[k] || []).map(x => [x.id, x]));
    const S = srv.datos[k] || [], fuera = [];
    S.forEach(s => {
      const l = L.get(s.id), mio = l ? JSON.stringify(l) !== B.get(s.id) : B.has(s.id);   // cambiado o borrado aquí
      if (mio) { if (l) fuera.push(l); }
      else { fuera.push(s); if (!l || JSON.stringify(l) !== JSON.stringify(s)) cambio = true; }
      L.delete(s.id);
    });
    L.forEach((l, id) => { if (!B.has(id)) fuera.push(l); else cambio = true; });   // nuevo aquí: se queda; borrado allí: se va
    d.datos[k] = fuera;
  });
  [['titulo', 'd'], ['unidad', 'd'], ['inicio', 'x'], ['escala', 'x']].forEach(([k, donde]) => {
    const aqui = donde === 'd' ? d[k] : d.datos[k], b = donde === 'd' ? base[k] : base.datos[k], s = donde === 'd' ? srv[k] : srv.datos[k];
    if ((aqui || '') === (b || '') && (s || '') !== (aqui || '')) { if (donde === 'd') d[k] = s; else d.datos[k] = s; cambio = true; }
  });
  d.nube.base = JSON.stringify({ titulo: srv.titulo, unidad: srv.unidad || '', datos: srv.datos });
  d.nube.rev = srv.rev; d.nube.validado = srv.validado || null;
  return cambio;
}

// ── guardar ─────────────────────────────────────────────────────────────────────────────────────────────────────
let _nubeT = null;
function nubeTrasCambio(d){
  if (!d || !d.nube || !NUBE.activa) return;
  clearTimeout(_nubeT); _nubeT = setTimeout(() => { _nubeT = null; nubeGuardar(d.id); }, 500);
}
async function nubeGuardar(id){
  const d = BIB.docs.find(x => x.id === id); if (!d || !d.nube || !NUBE.activa) return;
  if (NUBE.enviando) { NUBE.pendiente = true; return; }
  const cambios = nubeCambios(d); if (!cambios) { pintarEstadoNube('ok'); return; }
  NUBE.enviando = true; pintarEstadoNube('guardando');
  const enviado = JSON.parse(nubeFoto(d)), retrasos = NUBE.retrasos; NUBE.retrasos = {};
  try {
    const revBase = d.nube.rev;
    const r = await nubeLlamar('diagGuardar', { id, revBase, cambios, unidades: NUBE.quien, retrasos, devolver: false }, true);
    // Si entre medias guardó otro, el rev nuevo salta por encima de lo suyo: se deja el viejo para que el próximo sondeo lo traiga.
    d.nube.rev = r.rev - (r.aplicados ? 1 : 0) === revBase ? r.rev : revBase;
    if (r.conflictos && r.conflictos.length) {   // lo del otro se queda, aquí y en la base
      r.conflictos.forEach(cf => {
        if (cf.clase === 'doc') { if (cf.id === 'titulo' || cf.id === 'unidad') { d[cf.id] = cf.servidor; enviado[cf.id] = cf.servidor; } else { d.datos[cf.id] = cf.servidor; enviado.datos[cf.id] = cf.servidor; } return; }
        [d.datos, enviado.datos].forEach(ds => {
          ds[cf.clase] = ds[cf.clase].filter(x => x.id !== cf.id);
          if (cf.servidor) ds[cf.clase].push(JSON.parse(JSON.stringify(cf.servidor)));
        });
      });
      mensaje(`<b>Alguien cambió lo mismo a la vez.</b> Se queda lo suyo en ${r.conflictos.length === 1 ? 'una pieza' : r.conflictos.length + ' piezas'}.`, 7000);
      pintar();
    }
    d.nube.base = JSON.stringify(enviado);
    pintarEstadoNube('ok');
    try { localStorage.setItem(CLAVE, JSON.stringify(BIB)); } catch (_) {}
  } catch (e) { NUBE.retrasos = Object.assign(retrasos, NUBE.retrasos); nubeFallo(e); }
  finally {
    NUBE.enviando = false;
    if (NUBE.pendiente) { NUBE.pendiente = false; nubeGuardar(id); }
  }
}

// ── ver lo de los demás ─────────────────────────────────────────────────────────────────────────────────────────
async function nubeSondear(){
  const d = docActual();
  if (!NUBE.activa || !d || !d.nube || !d.nube.base || NUBE.enviando || _nubeT || document.hidden) return;
  try {
    const r = await nubeLlamar('diagLeer', { id: d.id, rev: d.nube.rev });
    if (r.igual || NUBE.enviando || _nubeT || docActual() !== d) return;
    const editando = (typeof _edTexto !== 'undefined' && _edTexto) || (document.activeElement && document.activeElement.matches('#inspector input,#inspector textarea,#titulo'));
    if (nubeFundir(d, r.doc) && !editando) { pintarLista(); pintar(); }
    pintarEstadoNube('ok');
  } catch (e) { nubeFallo(e); }
}

// ── abrir, crear, borrar, listar ────────────────────────────────────────────────────────────────────────────────
// Un documento de la nube que aún no se ha bajado entero: se baja y se abre. Devuelve true si se encarga él.
function nubeAlAbrir(id){
  const d = BIB.docs.find(x => x.id === id);
  if (!NUBE.activa || !d || !d.nube || d.nube.base) return false;
  pintarEstadoNube('guardando');
  nubeLlamar('diagLeer', { id }).then(r => {
    const s = r.doc;
    Object.assign(d, { tipo: s.tipo, titulo: s.titulo, unidad: s.unidad || '', autor: s.autor || '', datos: s.datos });
    d.nube = { rev: s.rev, base: JSON.stringify({ titulo: s.titulo, unidad: s.unidad || '', datos: s.datos }), validado: s.validado || null };
    d.datos = JSON.parse(JSON.stringify(s.datos));
    if (typeof ordenarSiFalta === 'function') ordenarSiFalta(d);   // lo que se coloque aquí se subirá como cambio
    abrirDoc(id);
    pintarEstadoNube('ok');
  }).catch(nubeFallo);
  return true;
}
function nubeCrear(d){
  if (!NUBE.activa) return;
  d.nube = { rev: 0, base: JSON.stringify({ titulo: d.titulo, unidad: d.unidad || '', datos: d.datos }), validado: null };
  nubeLlamar('diagCrear', { id: d.id, tipo: d.tipo, titulo: d.titulo, datos: d.datos }, true)
    .then(r => { d.nube.rev = r.doc.rev; d.nube.base = JSON.stringify({ titulo: r.doc.titulo, unidad: r.doc.unidad || '', datos: r.doc.datos }); nubeTrasCambio(d); pintarEstadoNube('ok'); })
    .catch(e => { if (/ya existe/.test(e.message)) return; nubeFallo(e); });
}
function nubeSubir(d){ if (d && !d.nube) { nubeCrear(d); pintarLista(); pintar(); } }
function nubeBorrar(d){ if (NUBE.activa && d && d.nube) nubeLlamar('diagBorrar', { id: d.id }, true).catch(e => mensaje('<b>No se pudo borrar en la nube:</b> ' + esc(e.message))); }
async function nubeListar(){
  const r = await nubeLlamar('diagListar', {});
  const vistos = new Set();
  r.docs.forEach(s => {
    vistos.add(s.id);
    let d = BIB.docs.find(x => x.id === s.id);
    if (!d) { d = { id: s.id, tipo: s.tipo, titulo: s.titulo, unidad: s.unidad || '', autor: s.autor || '', creado: Date.now(), editado: Date.now(), datos: { nodos: [], conectores: [] }, nube: { rev: 0, base: null } }; BIB.docs.push(d); }
    else if (d.nube && d.nube.rev !== s.rev && !nubeCambios(d)) d.nube.base = null;   // cambió fuera y aquí no hay nada pendiente: se rebaja al abrir
    if (d.nube) d.titulo = s.titulo;
  });
  BIB.docs = BIB.docs.filter(d => !d.nube || vistos.has(d.id) || d.nube.rev === 0);   // borrado por otro: fuera (lo recién creado aquí, no)
}

// ── el sello de validación, en la nube lo pone el servidor ──────────────────────────────────────────────────────
function nubeValidacion(d){
  const v = d.nube && d.nube.validado;
  return v && v.rev === d.nube.rev && !nubeCambios(d) ? { por: v.por, fecha: v.fecha } : null;
}
function nubeValidar(d, quitar){
  nubeLlamar('diagValidar', { id: d.id, rev: d.nube.rev, quitar: !!quitar }, true)
    .then(r => { d.nube.rev = r.validado ? r.validado.rev : d.nube.rev + 1; d.nube.validado = r.validado || null; pintar(); })   // validar sube el rev
    .catch(e => mensaje('<b>No se pudo validar:</b> ' + esc(e.message), 7000));
}

// ── el estado, arriba ───────────────────────────────────────────────────────────────────────────────────────────
function pintarEstadoNube(que){
  if (que) NUBE.estado = que;
  const e = $('#estado'); if (!e) return;
  const d = docActual();
  if (NUBE.estado === 'sesion') { e.innerHTML = 'Sesión caducada · <a href="../" class="enlace">Entrar</a>'; e.style.color = 'var(--warn)'; return; }
  if (!NUBE.activa || !d) return false;
  if (!d.nube) { e.innerHTML = 'En este navegador · <button class="enlace" data-subir-nube>Subir</button>'; e.style.color = ''; return; }
  e.style.color = NUBE.estado === 'sinred' ? 'var(--warn)' : '';
  e.textContent = NUBE.estado === 'guardando' ? 'Guardando…' : NUBE.estado === 'sinred' ? 'Sin conexión: se guardará al volver' : 'Guardado';
}

function nubeIniciar(){
  if (!NUBE.url || !nubeToken()) return;
  NUBE.activa = true;
  document.addEventListener('click', ev => { if (ev.target.closest('[data-subir-nube]')) nubeSubir(docActual()); });
  nubeListar().then(() => {
    pintarLista();
    const d = docActual();
    if (d && d.nube && !d.nube.base) nubeAlAbrir(d.id); else pintarEstadoNube('ok');
    NUBE.sondeo = setInterval(nubeSondear, NUBE_SONDEO_MS);
    window.addEventListener('online', () => { const x = docActual(); if (x) nubeTrasCambio(x); });
  }).catch(nubeFallo);
}
