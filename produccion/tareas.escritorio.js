/* tareas.escritorio.js — la pantalla Tareas del escritorio (01/11, servconv): lo que antes vivía suelto en `escritorio.html`, como el
   resto de pantallas (`turnos.escritorio.js`, `equipo.escritorio.js`…). Aquí: el envoltorio de «Nueva tarea», el paso de una tarea,
   el filtro por unidad y la tabla. ⚠️ `V.tareas` (la vista) se queda en el HTML: `V` se declara allí, DESPUÉS de cargar los módulos. */
/* 01/11 (tareamovil): el estado, los campos, la IA, la vista previa y el cableado de «Nueva tarea» viven en `comun.js`
   (`NUEVA_TAREA`, `_nuevaTareaCampos_`, `_cablearNuevaTarea_`…): el móvil abre la MISMA hoja. Aquí sólo queda el envoltorio
   del escritorio (plegado + panel) y qué hacer al crearla. */
function _nuevaTareaCreada_(){ pintar(); }
function _nuevaTareaPanel_(){
  var us = _unidadesNuevaTarea_();
  if(!us.length) return '';
  /* 31/10 (feosesc): PLEGADO por defecto — abierto empujaba la lista bajo el pliegue. Lo escrito vive en `NUEVA_TAREA`. */
  if(!NUEVA_TAREA.ab) return '<div id="ntPanel" class="nt-plegado"><button type="button" class="btn sm pri" data-ntab="1">+ Nueva tarea</button>'+
    (NUEVA_TAREA.ok ? '<span class="nota">'+esc(NUEVA_TAREA.ok)+'</span>' : '')+'</div>';
  _nuevaTareaUnidadValida_(us);
  return '<div id="ntPanel">'+pan('Nueva tarea', 'en el tablero de '+NUEVA_TAREA.u+' · <button type="button" class="btn sm" data-ntab="0">Cerrar</button>', '<div class="pb">'+
    (NUEVA_TAREA.ok ? '<div class="nota" style="margin-bottom:9px">'+esc(NUEVA_TAREA.ok)+'</div>' : '')+
    _nuevaTareaCampos_(us)+'</div>')+'</div>';
}
/* 31/10 (A1/A2): el paso de una tarea, su deshacer y el cajón de las pasadas, como en el móvil (`tareas.movil.js`). Quién
   puede lo dice `_tareaOfertaPaso_` (comun.js): el responsable, el PD y el coordinador o subcoordinador de la unidad; el
   servidor vuelve a decidirlo (`e_mover_estado_tarea`). El estado sólo cambia en pantalla cuando el servidor ya lo guardó. */
var TAREA_PASOS = {}, TAREAS_PASADAS_AB = false, _PASO_TAREA_EN_CURSO_ = {};
/* 31/10 (tareasvista): UNA lista con todas las tareas y chips de filtro por subsistema (multi). Daniel: «aparecer todo
   junto, porque están unificadas, y poder filtrarlas por subsistema: ver las de uno, las de otro, las de varios». Antes
   había una tabla por unidad con su ancho y la unidad sin tareas (Propulsión) no salía. El filtro se recuerda en la
   sesión del navegador; vacío = «Todas». */
var TAREAS_FILTRO = null, TAREAS_FILTRO_CLAVE = 'solaris.tareasFiltro';
var COLORES_UNIDAD_TAREA = ['#3f9ed6','#3EB489','#F2C94C','#B58AE8','#E8912E','#4FC3C8','#E86FA5','#9AA64B'];
function _tareasFiltro_(){
  if(TAREAS_FILTRO) return TAREAS_FILTRO;
  TAREAS_FILTRO = {u:{}, mias:false};
  try{
    var g = JSON.parse(sessionStorage.getItem(TAREAS_FILTRO_CLAVE) || 'null');
    if(g && typeof g === 'object'){ TAREAS_FILTRO.u = (g.u && typeof g.u === 'object') ? g.u : {}; TAREAS_FILTRO.mias = !!g.mias; }
  }catch(e){}
  return TAREAS_FILTRO;
}
function _tareasFiltroGuardar_(){
  try{ sessionStorage.setItem(TAREAS_FILTRO_CLAVE, JSON.stringify(_tareasFiltro_())); }catch(e){}
}
/* Todas las unidades de `DATA.subsistemas` (tengan tareas o no) y, al final, las que traigan las tareas y no estén ahí. */
function _unidadesTareasE_(lista){
  var us = ((DATA && DATA.subsistemas) || []).map(function(x){ return x && x.u; }).filter(Boolean);
  (lista || []).forEach(function(t){ if(t && t.s && us.indexOf(t.s) < 0) us.push(t.s); });
  return us;
}
function _colorUnidadTareaE_(u){
  var i = _unidadesTareasE_([]).indexOf(u);
  if(i < 0){ i = 0; String(u || '').split('').forEach(function(c){ i += c.charCodeAt(0); }); }
  return COLORES_UNIDAD_TAREA[i % COLORES_UNIDAD_TAREA.length];
}
function _chipUnidadTareaE_(u){
  var c = _colorUnidadTareaE_(u);
  return '<span class="chip tuni" title="'+esc(u || '—')+'" aria-label="'+esc(u || '—')+'" style="color:'+c+';border-color:'+c+'66;background:'+c+'14">'+esc(u || '—')+'</span>';
}
/* Orden: fecha límite (sin fecha, al final), luego urgencia (alta antes), luego el nombre. */
function _ordenTareasE_(a, b){
  var fa = String(_dmyAISO_(a.l) || ''), fb = String(_dmyAISO_(b.l) || ''), ur = {alta:0, media:1, baja:2};
  if(fa !== fb) return !fa ? 1 : !fb ? -1 : fa.localeCompare(fb);
  var ua = a.u in ur ? ur[a.u] : 3, ub = b.u in ur ? ur[b.u] : 3;
  return ua !== ub ? ua - ub : String(a.n).localeCompare(String(b.n));
}
/* Aplica el filtro de la sesión a una lista (viva o pasada); `sinUnidad` lo salta para contar por chip. */
function _tareasFiltradasE_(lista, yo, sinUnidad){
  var f = _tareasFiltro_(), sel = Object.keys(f.u).filter(function(k){ return f.u[k]; });
  var out = (lista || []).filter(function(t){ return t; });
  if(f.mias && yo) out = _tareasResp_(out, yo);
  if(!sinUnidad && sel.length) out = out.filter(function(t){ return sel.indexOf(t.s) >= 0; });
  return out.sort(_ordenTareasE_);
}
var TAREAS_COLS_E = [['Tarea'],['Unidad'],['Responsable'],['Urgencia'],['Estado'],['Vence',1],['']];
function _chipsFiltroTareasE_(vivas, yo, conMias){
  var f = _tareasFiltro_(), us = _unidadesTareasE_(vivas), base = _tareasFiltradasE_(vivas, yo, true),
      sel = us.filter(function(u){ return f.u[u]; });
  return '<div class="chips tfil">'+
    '<button type="button" class="pick'+(sel.length ? '' : ' on')+'" data-tfu="">Todas <b>'+base.length+'</b></button>'+
    us.map(function(u){
      var n = base.filter(function(t){ return t.s === u; }).length;
      return '<button type="button" class="pick'+(f.u[u] ? ' on' : '')+'" data-tfu="'+esc(u)+'"><i class="tdot" style="background:'+
        _colorUnidadTareaE_(u)+'"></i>'+esc(u)+' <b>'+n+'</b></button>'; }).join('')+
    (conMias ? '<button type="button" class="pick'+(f.mias ? ' on' : '')+'" data-tfmias="1">Sólo las mías</button>' : '')+'</div>';
}
/* La fila de una tarea (viva o pasada): los botones van en la última celda, sólo para quien puede moverla. */
function _filaTareaE_(t, yo){
  var resp = Array.isArray(t.r) ? t.r.map(function(x){return String(x).split(' ')[0];}).join(', ') : (t.r||'—'),
      of = _tareaOfertaPaso_(t, yo), i = TAREAS.indexOf(t);
  /* 01/11: «Proponer mis horas» va DEBAJO del título: la celda de los botones es estrecha y lo recortaba con «…» */
  var bh = _tareaBotonHoras_(t, i, '');
  return '<tr><td>'+esc(t.n)+'<span class="tresp">'+esc(resp)+'</span>'+(bh ? '<div style="margin-top:6px">'+bh+'</div>' : '')+'</td><td>'+_chipUnidadTareaE_(t.s)+'</td><td style="color:var(--ink2)">'+esc(resp)+'</td>'+
    '<td><span class="chip '+(t.u==='alta'?'no':t.u==='media'?'wa':'')+'">'+t.u+'</span></td>'+
    /* ⛔ 20/10 (auditoría): el plazo en DD/MM/AAAA y, sin plazo, «—» (salía el ISO crudo y la palabra «null»).
       En rojo si ya venció. */
    '<td style="color:var(--ink3)">'+esc(t.e)+'</td><td class="r mono'+(_venciaTarea_(t.l)?' dn':'')+'">'+
      (_plazoDMY_(t.l)||'—')+'</td>'+
    '<td class="r" style="white-space:nowrap">'+(i < 0 ? '' :
      (of.des ? '<button class="btn" data-tdes="'+i+'" title="Puedes deshacerlo durante '+_minDeshacerTarea_()+' min">Deshacer</button> ' : '')+
      (of.ac ? '<button class="btn pri" data-tpaso="'+i+'">'+esc(of.ac.etiqueta)+'</button>' : ''))+'</td></tr>';
}
/* «Tareas pasadas · N», plegable, con la fecha de la última (la misma cuenta que el cajón del móvil). Por FECHA real. */
function _tareasPasadasE_(lista, yo){
  var fin = _tareasFiltradasE_(lista, yo).filter(function(t){ return _tareaHecha_(t.e); })
    .sort(function(a, b){ return String(_dmyAISO_(b.l)||'').localeCompare(String(_dmyAISO_(a.l)||'')); });
  if(!fin.length) return '';
  return '<div class="acord'+(TAREAS_PASADAS_AB?' ab':'')+'"><div class="hh" data-tpas><span class="tx"><b>Tareas pasadas <span style="color:var(--ink3)">· '+
      fin.length+'</span></b>'+(_plazoDMY_(fin[0].l)?'<small>la última, '+_plazoDMY_(fin[0].l)+'</small>':'')+'</span>'+
    '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div>'+
    '<div class="bb tarl">'+tabla(TAREAS_COLS_E,
      fin.map(function(t){ return _filaTareaE_(t, yo); }).join(''))+'</div></div>';
}
/* UNA puerta para avanzar y deshacer: guarda `t.e → a` y sólo entonces llama a `hecho`. Una sola escritura por tarea a la
   vez (el doble clic no manda dos) y, si falla, el botón revive, la tarea queda como estaba y se dice por qué. */
function _darPasoTareaE_(t, a, b, hecho, h){
  var k = t.url;
  if(_PASO_TAREA_EN_CURSO_[k]) return Promise.resolve();
  _PASO_TAREA_EN_CURSO_[k] = true;
  if(b) b.disabled = true;
  return api.moverEstadoTarea(t.url, t.e, a, h).then(function(r){
    delete _PASO_TAREA_EN_CURSO_[k];
    hecho(r);
  }, function(e){
    delete _PASO_TAREA_EN_CURSO_[k];
    if(b) b.disabled = false;
    tostErr('No se pudo guardar el paso de \u00ab'+t.n+'\u00bb: ', e);
  });
}
function _cablearPasoTarea_(){
  _tareaHorasCablear_();
  $$('[data-tpaso]').forEach(function(b){
    b.onclick = function(){
      var t = TAREAS[+b.dataset.tpaso], of = t && _tareaOfertaPaso_(t, _actorSanc_());
      /* se vuelve a preguntar al pulsar: entre el pintado y el clic puede haber llegado otro estado, o otra cuenta */
      if(!of || !of.ac){ tost('Esa tarea ya no admite ese paso.'); return; }
      /* 01/11 (tareaparte): al «Entregada» se pregunta cuántas horas le dedicaste, y se le proponen al coordinador como parte */
      if(b.disabled) return Promise.resolve();   /* con la pregunta abierta un segundo clic no abre otra */
      b.disabled = true;
      return _tareaPedirHorasEntrega_(t, of.ac).then(function(h){
        b.disabled = false;
        if(h === null) return;
        return _darPasoTareaE_(t, of.ac.a, b, function(r){
          t.e = of.ac.a; t.desde = (new Date()).getTime(); _anotarPasoTarea_(TAREA_PASOS, t);
          pintar(); tost('«'+t.n+'»: '+of.ac.a+'. Puedes deshacerlo durante '+_minDeshacerTarea_()+' min.');
          _tareaToastParte_(t, h, _tareaEnMaqueta_() ? null : (r || {}));
        }, h);
      });
    };
  });
  $$('[data-tdes]').forEach(function(b){
    b.onclick = function(){
      var t = TAREAS[+b.dataset.tdes], a, of;
      if(!t) return;
      of = _tareaOfertaPaso_(t, _actorSanc_());
      if(!of.ac && !_puedeMoverEstadoTarea_(_actorSanc_(), t)){ tost('Esa tarea ya no es tuya para moverla.'); return; }
      /* el plazo se comprueba AQUÍ también: la pantalla puede llevar media hora sin repintarse */
      if(!_puedeDeshacerTarea_(t)){
        tost('Ya pasó el plazo para deshacerlo ('+_minDeshacerTarea_()+' min). Habla con quien te la asignó.');
        t.desde = null; _anotarPasoTarea_(TAREA_PASOS, t); pintar(); return;
      }
      a = _tareaAnterior_(t.e);
      if(a === null){ tost('No hay ningún paso que deshacer.'); return; }
      return _darPasoTareaE_(t, a, b, function(r){
        t.e = a; t.desde = null; _anotarPasoTarea_(TAREA_PASOS, t);
        pintar(); tost('Deshecho: «'+t.n+'» vuelve a '+a+'.'+_tareaToastRetirados_(r));
      });
    };
  });
  $$('[data-tfu]').forEach(function(b){
    b.onclick = function(){
      var f = _tareasFiltro_(), u = b.dataset.tfu;
      if(!u) f.u = {}; else f.u[u] = !f.u[u];
      _tareasFiltroGuardar_(); pintar();
    };
  });
  $$('[data-tfmias]').forEach(function(b){
    b.onclick = function(){ var f = _tareasFiltro_(); f.mias = !f.mias; _tareasFiltroGuardar_(); pintar(); };
  });
  $$('[data-tpas]').forEach(function(h){
    h.onclick = function(){ TAREAS_PASADAS_AB = h.parentNode.classList.toggle('ab'); };
  });
}
