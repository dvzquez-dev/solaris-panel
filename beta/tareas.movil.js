/* ═══ TAREAS · cara movil ═══════════════════════════════════════════════════════════
   2 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

function vTareas(){
  var hoy=new Date(_dmyAISO_(HOY)+'T00:00:00');   // mismo origen que HOY, no una fecha aparte
  /* ⛔ POR LA PUERTA (05/10): este predicado vivía copiado **cinco veces** en `ronda3`
     —tres aquí— y con tres tratamientos distintos del nulo. Ahora es `_tareaHecha_`. */
  /* ⛔⛔ LAS TUYAS, NO LAS DE LAS 32. Esta pantalla se titula «Mis tareas» y filtraba
     **sólo por estado**: el backend sirve todas a la cuenta admin, así que en el teléfono
     del PD salían las de todo el equipo — y la fila no pintaba el responsable, o sea que
     no había forma de notarlo.
     ⛔ Con la pantalla de sólo lectura eso era un rótulo que engaña; **desde que hay
     botones es que cualquiera mueve la tarea de otro**. Lo cazó el auditor de
     rótulo↔cuenta el 05/10, con los botones ya escritos.
     ✅ `_tareasResp_` ya existía: es la puerta que usa el desplegable de fichar desde que
     la MISMA avería mordió allí (`horas.movil.js:628`, con su lección al lado). */
  var MIAS=_tareasResp_(TAREAS, _fichaYo_());
  var fin=MIAS.filter(function(t){return _tareaHecha_(t&&t.e);})
    /* por FECHA real: comparar 'DD/MM/AAAA' como texto pone 12/06 por delante de 03/07 */
    .sort(function(a,b){ return String(_dmyAISO_(b.l)||'').localeCompare(String(_dmyAISO_(a.l)||'')); });
  var act=MIAS.filter(function(t){return !_tareaHecha_(t&&t.e);})
    /* sin fecha limite van al final; `a.l.localeCompare` sobre null tumbaba la pantalla */
    .sort(function(a,b){
      var d=(TK_ORD[a.u]-TK_ORD[b.u]); if(d) return d;
      if(!a.l) return 1; if(!b.l) return -1;
      return String(_dmyAISO_(a.l)).localeCompare(String(_dmyAISO_(b.l)));
    });
  /* Una tarea puede no tener fecha limite: el backend manda `l:null` y es legitimo.
     Antes `l.split` reventaba y la pantalla entera se quedaba en blanco. */
  function vence(l){
    if(!l) return ['sin fecha límite',false];
    /* ⛔ LOS DOS FORMATOS, Y LA PREMISA DE AQUI DEBAJO ERA FALSA. Ponia «la fecha
       `DD/MM/AAAA` que manda Notion» y Notion **no manda eso**: `Codigo.gs` emite
       `l: date.start`, que es **ISO `AAAA-MM-DD`**. Con `split('/')`, `'2026-07-27'`
       daba un array de UNO, caia por `length<3` y la tarea salia como
       **«sin fecha limite»** — y nunca en rojo, porque el segundo elemento es `false`.
       ⛔ O sea: en cuanto entra el token, TODAS las tareas con plazo lo escondian. La
       pantalla que existe para que no se te pase un plazo era la que te lo tapaba, y de
       ahi sale el **Art. 30c** en un expediente de una persona real.
       ⚠️ Solo funcionaba con la semilla de demostracion, que si es `DD/MM/AAAA`.
       ✅ `_dmyAISO_` es la puerta que ya acepta los dos — la misma que usa `_plazoTxt_`,
       donde esta leccion ya estaba escrita. Se aplico donde se enuncio y no aqui, que es
       donde se citaba (§3c-19).
       ⚠️ Y la CUENTA sigue saliendo de `_diasHasta_` (`comun.js`), la misma que usa
       Reuniones: el corte de «corre prisa» y el redondeo tienen que ser UNO. */
    var iso=_dmyAISO_(String(l));
    if(!/^\d{4}-\d{2}-\d{2}/.test(iso)) return ['sin fecha límite',false];
    var d=_diasHasta_(Date.parse(iso));
    if(d===null) return ['sin fecha límite',false];
    if(d<0) return ['venció hace '+(-d)+' día'+(-d===1?'':'s'),true];
    if(d===0) return ['vence hoy',true];
    return ['vence en '+d+' día'+(d===1?'':'s'),d<=_DIAS_PRISA_];
  }
  /* ⛔ EL ÍNDICE SE BUSCA POR IDENTIDAD, no por la posición en la lista pintada. `act` y `fin`
     son **filtros** de `TAREAS`, así que el índice del `map` es el de la lista filtrada: usarlo
     movera la tarea equivocada en cuanto haya una hecha por encima. Las dos listas guardan las
     MISMAS referencias, así que `===` las encuentra. */
  function iDe(t){ var k; for(k=0;k<TAREAS.length;k++){ if(TAREAS[k]===t) return k; } return -1; }
  function fila(t){
    /* ⛔ 20/10 (auditoría): una tarea HECHA no «venció»: se dice su plazo, neutro (salía en rojo «venció hace 49 días»). */
    var v=_tareaHecha_(t&&t.e) ? [_plazoDMY_(t.l) ? 'plazo '+_plazoDMY_(t.l) : 'sin fecha límite', false] : vence(t.l),
        i=iDe(t), ac=_tareaAccion_(t.e), des=_puedeDeshacerTarea_(t),
        ap=_apelDeTarea_(t), apelar=_puedeApelarTarea_(_fichaYo_(), t);
    return '<div class="fila"><div class="a"><b>'+esc(t.n)+'</b>'+
      '<small>'+esc(t.s)+' · '+esc(t.pr)+' · <span style="color:'+(v[1]?'var(--red2)':'var(--ink3)')+'">'+v[0]+'</span></small>'+
      /* ⚠️ El aviso del plazo sale de la PUERTA, no de un número escrito aquí: con el número
         repetido, cambiarlo dejaría la pantalla prometiendo el viejo. */
      (des?'<small style="color:var(--ink3)">puedes deshacerlo durante '+_minDeshacerTarea_()+' min</small>':'')+
      /* 31/10: la apelación (RRI Art. 34) en la propia tarea: abierta, o la respuesta si se resolvió hace poco. */
      (ap&&(ap.estado==='abierta'||_apelReciente_(ap))?'<small class="apelada" style="color:'+
        (ap.estado==='desestimada'?'var(--red2)':ap.estado==='estimada'?'var(--ok)':'var(--warn)')+'">'+esc(_apelEstadoTxt_(ap))+'</small>':'')+
      /* el botón va DEBAJO del texto, no en la columna de la derecha: con «Entregada» y el estado al lado, el título se quedaba en 8 renglones */
      (apelar&&i>=0?'<button class="btn mini" style="margin-top:7px;align-self:flex-start" data-tapel="'+i+'">Apelar</button>':'')+
      /* 04/11: pasados 3 días desde que te la asignan ya no se apela: se dice, con el día en que caducó */
      (!apelar&&!ap&&_apelFueraDePlazo_(t)&&_tareasResp_([t],_fichaYo_()).length&&!_tareaHecha_(t.e)&&!_esVoluntaria_(t)?'<small style="color:var(--ink3)">Ya no se puede apelar: caducó el '+_isoADMY_(_apelHastaTarea_(t))+'</small>':'')+
      '</div>'+
      '<div class="d"><span class="pil '+(t.e==='Revisando'?'conf':t.e==='En desarrollo'?'pend':'neu')+'">'+esc(t.e)+'</span>'+
      /* ⛔ Los dos marcadores son DISTINTOS (`data-tact` / `data-tdes`): con uno solo, el
         manejador de avanzar cazaría también el de deshacer — la misma lección que `data-pdr`
         frente a `data-pd` en Horas, que ya mordió una vez.
         ⚠️ Y una tarea sin acción —hecha, o en un estado que no está en la cadena— **no pinta
         botón**: la decisión la toma `_tareaAccion_`, no un `if` escrito aquí otra vez. */
      (ac&&i>=0?'<button class="btn mini" data-tact="'+i+'">'+esc(ac.etiqueta)+'</button>':'')+
      (des&&i>=0?'<button class="btn mini no" data-tdes="'+i+'">Deshacer</button>':'')+
      _tareaBotonHoras_(t, i)+
      '</div></div>';
  }
  return '<div class="h1">Mis tareas</div><p class="h1s">'+act.length+' activa'+(act.length===1?'':'s')+
    ' · ordenadas por urgencia y fecha límite.</p>'+
    _nuevaTareaBotonHTML_()+
    '<div class="tarj">'+(act.length?act.map(fila).join(''):
      /* 957.ª: «cuando te asignen», no «cuando tu coordinador»: el PD y los coordinadores no tienen coordinador. */
      vacio('Sin tareas asignadas','Cuando te asignen una, saldrá aquí.','',false))+'</div>'+
    /* tareas-1 (12/11): aquí había una tarjeta azul fija con 3 frases (fichar puedes imputar · Apelar Art. 34 · las voluntarias no se apelan). Fuera: cada tarea trae su botón
       «Apelar» (la voluntaria no lo trae) y el formulario (`_formApelar_`) ya dice el Art. 34 y a quién le llega; imputar horas lo enseña el desplegable de tareas de Fichar. */
    /* mismo cajon que en Turnos: cuenta y la ultima, para que las dos pantallas se lean igual */
    (fin.length?'<div class="cajon" data-caj data-p><span>Tareas pasadas <b>· '+fin.length+'</b>'+
        (fin[0]&&_plazoDMY_(fin[0].l)?' <span style="color:var(--ink3)">· la última, '+_plazoDMY_(fin[0].l)+'</span>':'')+'</span>'+
      '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div>'+
      '<div class="cajsec"><div class="tarj">'+fin.map(fila).join('')+'</div></div>':'');
}

/* ══ EL CABLEADO DE LOS DOS BOTONES ═════════════════════════════════════
   Lo llama `enganchar()`, que corre **al final de cada `pintar()`**: `_pintar_` reemplaza el
   `innerHTML` de la vista, así que un manejador puesto una sola vez al arrancar se perdería en
   el primer repintado — y el botón se quedaría ahí, visible y muerto.
   ⛔ **Acotado a `#v-tareas`**: las dos vistas conviven en el DOM (la otra oculta), y un
   selector global volvería a cablear botones de pantallas que no son esta.
   ⚠️ **Y ESTO NO PERSISTE TODAVÍA, a propósito y medido**: el estado se mueve en memoria, como
   la pantalla de Documentos. Llevarlo a Notion pide una **acción nueva del backend**: `setControl`
   —la vía que no necesita desplegar— exige la cuenta de administración, y esto lo pulsa un
   miembro raso. Está escrito en `docs/pendientes.md` con lo que falta exactamente. */
function _engTareas_(){
  var c=document.getElementById('v-tareas'); if(!c) return;
  _tareaHorasCablear_(c);
  $$('[data-tact]',c).forEach(function(b){
    b.onclick=function(){
      var t=TAREAS[+b.dataset.tact]; if(!t) return;
      var ac=_tareaAccion_(t.e);
      /* ⛔ SE VUELVE A PREGUNTAR AL PULSAR, no se fia de lo pintado: entre el pintado y el
         clic puede haber llegado un panel nuevo con otro estado, y avanzar desde el estado
         viejo escribiría un paso que ya no toca. */
      if(!ac){ tost('Esa tarea ya no admite ese paso.'); return; }
      /* ⛔ 20/10 — EL PASO SE GUARDA ANTES DE DARLO POR HECHO. Hasta hoy esto sólo cambiaba la memoria del móvil y el
         siguiente refresco lo deshacía en silencio, con el aviso prometiendo «puedes deshacerlo» (§3c-8: una escritura
         que no ocurre, contada como hecha). Daniel, 15/10: no se ocultan, se guardan. */
      /* 01/11 (tareaparte): al «Entregada» se pregunta cuántas horas le dedicaste, y se le proponen al coordinador como parte */
      if(b.disabled) return;   /* con la pregunta abierta un segundo toque no abre otra */
      b.disabled=true;
      _tareaPedirHorasEntrega_(t, ac).then(function(h){
        b.disabled=false;
        if(h===null) return;
        _guardarPasoTarea_(t, ac.a, b, function(r){
          t.e=ac.a; t.desde=(new Date()).getTime(); _anotarPasoTarea_(TAREA_PASOS, t);
          pintar(); tost('«'+t.n+'»: '+ac.a+'. Puedes deshacerlo durante '+_minDeshacerTarea_()+' min.');
          _tareaToastParte_(t, h, _tareaEnMaqueta_() ? null : (r || {}));
        }, h);
      });
    };
  });
  $$('[data-tapel]',c).forEach(function(b){
    b.onclick=function(){ var t=TAREAS[+b.dataset.tapel]; if(t) _formApelar_(t); };
  });
  $$('[data-tdes]',c).forEach(function(b){
    b.onclick=function(){
      var t=TAREAS[+b.dataset.tdes]; if(!t) return;
      /* ⛔ EL PLAZO SE COMPRUEBA AQUÍ TAMBIÉN, no solo al pintar: la pantalla puede llevar
         media hora abierta sin repintarse, y entonces el botón que se dibujó a tiempo se
         pulsa fuera de plazo. Y se DICE por qué, que un botón que no hace nada se lee como
         pantalla rota. */
      if(!_puedeDeshacerTarea_(t)){
        tost('Ya pasó el plazo para deshacerlo ('+_minDeshacerTarea_()+' min). Habla con quien te la asignó.');
        t.desde=null; pintar(); return;
      }
      var a=_tareaAnterior_(t.e);
      if(a===null){ tost('No hay ningún paso que deshacer.'); return; }
      /* `desde` a `null` al deshacer: se vuelve al estado que vino del servidor, y sobre eso
         no se ofrece deshacer — deshacer un deshacer es avanzar, y para eso está el otro botón. */
      _guardarPasoTarea_(t, a, b, function(r){
        t.e=a; t.desde=null; _anotarPasoTarea_(TAREA_PASOS, t);
        pintar(); tost('Deshecho: «'+t.n+'» vuelve a '+a+'.'+_tareaToastRetirados_(r));
      });
    };
  });
}

/* ⛔ 20/10 — UNA puerta para los dos botones: guarda el paso `t.e → a` en el servidor y sólo entonces llama a `hecho`.
   Si no se puede, el botón revive y se DICE por qué, con la tarea como estaba. En la maqueta (`DEMO`) no hay servidor:
   el paso se da en memoria, sin aviso propio (taparía el de «puedes deshacerlo», que es lo que se prueba ahí). */
function _guardarPasoTarea_(t, a, b, hecho, h){
  if(_tareaEnMaqueta_()){ hecho(); return; }
  if(!t.url){ tost('Esa tarea no trae su ficha de Notion: no se puede guardar el paso.'); return; }
  if(b) b.disabled=true;
  api.moverEstadoTarea(t.url, t.e, a, h).then(function(r){ hecho(r); }).catch(function(e){
    if(b) b.disabled=false;
    tost('No se pudo guardar el paso de «'+t.n+'»: '+((e&&e.message)||e)+'. La tarea sigue como estaba.');
  });
}

/* ¿Tienes tareas vivas? Mismo criterio que usa la pantalla para separar «en curso» de
   «hechas»: si divergieran habria una pestaña que al pulsarla no tiene nada, que es justo
   el fallo que reporto Adrian con Documentos. */
function _tareasRelevantes_(){
  /* ⛔ Y LA PESTAÑA SE DECIDE CON LA MISMA LISTA. Si ésta mirara `TAREAS` y la pantalla
     las tuyas, habría una pestaña que al pulsarla no tiene nada — que es justo el fallo
     que Adrián reportó con Documentos y que esta misma función cita abajo. */
  return _tareasResp_(TAREAS||[], _fichaYo_())
    .some(function(t){ return !_tareaHecha_(t&&t.e); });
}


/* ¿La respuesta a una apelación es de estos días? Pasado el plazo de vista, la tarea deja de contarlo. */
function _apelReciente_(ap){
  var f=Date.parse(ap && ap.decidido_at);
  return f > 0 && (Date.now() - f) < APEL_DIAS_VISTA * 86400000;
}

/* ══ APELAR UNA TAREA (RRI Art. 34) ═════════════════════════════════════════════════════════════════
   El formulario: las cláusulas en una línea, una elegida, y el motivo OBLIGATORIO. «Enviar» no se enciende hasta que
   hay las dos cosas. Se vuelve a mirar al enviar (§ la tarea pudo cambiar con un refresco): el servidor manda. */
function _formApelar_(t){
  var cl='', op=nxElige('apelCl', APEL_CLAUSULAS.map(function(c){ return [c.k, c.t]; }), '');
  abrirModal('<div class="h1" style="font-size:18px">Apelar «'+esc(t.n)+'»</div>'+
    '<p class="h1s">Es tu derecho (Art. 34 del RRI). Lo ve tu coordinador y el Project Director. Si no apelas y no la haces, resta 1 punto.</p>'+
    '<div class="tarj" style="padding:4px 12px">'+op+'</div>'+
    '<label class="campo" style="margin-top:12px"><span class="sc">Cuéntanos qué pasa <span class="req">*</span></span>'+
      '<textarea id="apelMotivo" data-borr="apel-tarea-'+esc(t.url||t.titulo||'')+'" placeholder="Qué te lo impide o por qué no te corresponde."></textarea></label>'+
    '<div style="display:flex;gap:8px;margin-top:12px"><button class="btn" id="apelNo" style="flex:1">Cancelar</button>'+
      '<button class="btn pri" id="apelSi" style="flex:1" disabled>Enviar apelación</button></div>');
  var si=$('#apelSi'), mo=$('#apelMotivo');
  function mira(){
    cl=$('#apelCl').value;
    si.disabled=!(cl && mo.value.trim());
  }
  $('#apelCl').onchange=mira;
  mo.oninput=mira;
  $('#apelNo').onclick=cerrarModal;
  si.onclick=function(){
    mira(); if(si.disabled) return;
    si.disabled=true;
    _apelarTarea_(t, cl, mo.value.trim()).then(function(){
      cerrarModal(); pintar(); tost('Apelación enviada. Te avisamos cuando respondan.');
    }).catch(function(e){
      si.disabled=false; tostErr('No se pudo enviar la apelación: ', e);
    });
  };
}


/* ═══ CREAR UNA TAREA DESDE EL MÓVIL (01/11/2026) ═══════════════════════════════════════════
   🗣️ Daniel: «las tareas se crean en la app, y tiene que ser tan cómodo como Notion». Es la MISMA hoja que el panel del
   escritorio: el estado (`NUEVA_TAREA`), los campos (`_nuevaTareaCampos_`), la IA, la vista previa, las fotos, el cableado y
   lo que se manda (`_nuevaTareaArmar_`) son de `comun.js`. Aquí sólo hay: quién ve el botón (`_unidadesNuevaTarea_`, la
   MISMA puerta que el escritorio: el PD en todas, un coordinador en las suyas, un miembro en ninguna), el envoltorio de la
   hoja y qué pasa cuando el servidor ya la guardó. El servidor vuelve a mirar el permiso (`e_crear_tarea`). */
function _nuevaTareaBotonHTML_(){
  if(!_unidadesNuevaTarea_().length) return '';
  return '<button class="btn pri full" data-nuevatarea data-p style="margin-bottom:12px">＋ Nueva tarea</button>';
}
function _nuevaTareaPanel_(){
  var us=_unidadesNuevaTarea_();
  if(!us.length) return '';
  _nuevaTareaUnidadValida_(us);
  return '<div id="ntPanel"><div class="mtit">Nueva tarea</div>'+
    '<p class="rnota" style="margin:-4px 0 10px">En el tablero de '+esc(NUEVA_TAREA.u)+'. Les llega a los responsables y queda en Notion.</p>'+
    _nuevaTareaCampos_(us)+'</div>';
}
function nuevaTareaAbrir(){
  if(!_unidadesNuevaTarea_().length) return;
  NUEVA_TAREA.ok='';
  abrirModal(_nuevaTareaPanel_());
  _cablearNuevaTarea_();
}
/* El servidor ya la guardó: la hoja se cierra, la lista se repinta con la tarea nueva y se dice. */
function _nuevaTareaCreada_(){
  var m=NUEVA_TAREA.ok;
  cerrarModal(); pintar(); tost(m);
}
