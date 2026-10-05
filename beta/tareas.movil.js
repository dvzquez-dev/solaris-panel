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
    var v=vence(t.l), i=iDe(t), ac=_tareaAccion_(t.e), des=_puedeDeshacerTarea_(t);
    return '<div class="fila"><div class="a"><b>'+esc(t.n)+'</b>'+
      '<small>'+esc(t.s)+' · '+esc(t.pr)+' · <span style="color:'+(v[1]?'var(--red2)':'var(--ink3)')+'">'+v[0]+'</span></small>'+
      /* ⚠️ El aviso del plazo sale de la PUERTA, no de un número escrito aquí: con el número
         repetido, cambiarlo dejaría la pantalla prometiendo el viejo. */
      (des?'<small style="color:var(--ink3)">puedes deshacerlo durante '+_minDeshacerTarea_()+' min</small>':'')+
      '</div>'+
      '<div class="d"><span class="pil '+(t.e==='Revisando'?'conf':t.e==='En desarrollo'?'pend':'neu')+'">'+esc(t.e)+'</span>'+
      /* ⛔ Los dos marcadores son DISTINTOS (`data-tact` / `data-tdes`): con uno solo, el
         manejador de avanzar cazaría también el de deshacer — la misma lección que `data-pdr`
         frente a `data-pd` en Horas, que ya mordió una vez.
         ⚠️ Y una tarea sin acción —hecha, o en un estado que no está en la cadena— **no pinta
         botón**: la decisión la toma `_tareaAccion_`, no un `if` escrito aquí otra vez. */
      (ac&&i>=0?'<button class="btn mini" data-tact="'+i+'">'+esc(ac.etiqueta)+'</button>':'')+
      (des&&i>=0?'<button class="btn mini no" data-tdes="'+i+'">Deshacer</button>':'')+
      '</div></div>';
  }
  return '<div class="h1">Mis tareas</div><p class="h1s">'+act.length+' activa'+(act.length===1?'':'s')+
    ' · ordenadas por urgencia y fecha límite.</p>'+
    '<div class="tarj">'+(act.length?act.map(fila).join(''):
      vacio('Sin tareas asignadas','No tienes ninguna tarea asignada ahora mismo. Cuando tu coordinador '+
        'te asigne una, aparecerá aquí.','',false))+'</div>'+
    (act.length?'<div class="tarj" style="background:rgba(63,158,214,.05);border-color:rgba(63,158,214,.3)">'+
      '<p class="rnota" style="margin:0">Al fichar puedes imputar tus horas a cualquiera de estas tareas. '+
      /* ⛔ Y DICE DÓNDE SE APELA (762.ª, 02/10). Aquí ponía «puedes apelarla (Art. 34)» a
         secas, y la app NO tramita apelaciones en ninguna capa — medido: `apelac` sale 0
         veces en `Codigo.gs`, no hay `api.apelar*` ni `data-apel*` ni pantalla. O sea que
         la frase mandaba a buscar un botón que no existe, sobre disciplina.
         ⚠️ El derecho NO se borra: es del RRI y existe. Lo que se añade es el destino, y no
         me lo invento: es el que ya decía `navegador/app.html:1534` («en privado al Project
         Director»), que es la app que el equipo venía usando.
         ⛔ Y NO se inventa el PLAZO: el texto del Art. 34 no está en el repo, y un «tienes
         N días» escrito a ojo suena oficial — que es peor que no decirlo. */
      'Si crees que una no te corresponde, el RRI te deja apelarla (Art. 34): '+
      'de momento es <b>fuera de la app</b>, en privado al Project Director.</p></div>':'')+
    /* mismo cajon que en Turnos: cuenta y la ultima, para que las dos pantallas se lean igual */
    (fin.length?'<div class="cajon" data-caj data-p><span>Tareas pasadas <b>· '+fin.length+'</b>'+
        (fin[0]&&fin[0].l?' <span style="color:var(--ink3)">· la última, '+esc(fin[0].l)+'</span>':'')+'</span>'+
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
  $$('[data-tact]',c).forEach(function(b){
    b.onclick=function(){
      var t=TAREAS[+b.dataset.tact]; if(!t) return;
      var ac=_tareaAccion_(t.e);
      /* ⛔ SE VUELVE A PREGUNTAR AL PULSAR, no se fia de lo pintado: entre el pintado y el
         clic puede haber llegado un panel nuevo con otro estado, y avanzar desde el estado
         viejo escribiría un paso que ya no toca. */
      if(!ac){ tost('Esa tarea ya no admite ese paso.'); return; }
      t.e=ac.a; t.desde=(new Date()).getTime();
      pintar(); tost('«'+t.n+'»: '+ac.a+'. Puedes deshacerlo durante '+_minDeshacerTarea_()+' min.');
    };
  });
  $$('[data-tdes]',c).forEach(function(b){
    b.onclick=function(){
      var t=TAREAS[+b.dataset.tdes]; if(!t) return;
      /* ⛔ EL PLAZO SE COMPRUEBA AQUÍ TAMBIÉN, no solo al pintar: la pantalla puede llevar
         media hora abierta sin repintarse, y entonces el botón que se dibujó a tiempo se
         pulsa fuera de plazo. Y se DICE por qué, que un botón que no hace nada se lee como
         pantalla rota. */
      if(!_puedeDeshacerTarea_(t)){
        tost('Ya pasó el plazo para deshacerlo ('+_minDeshacerTarea_()+' min). Habla con tu coordinador.');
        t.desde=null; pintar(); return;
      }
      var a=_tareaAnterior_(t.e);
      if(a===null){ tost('No hay ningún paso que deshacer.'); return; }
      /* `desde` a `null` al deshacer: se vuelve al estado que vino del servidor, y sobre eso
         no se ofrece deshacer — deshacer un deshacer es avanzar, y para eso está el otro botón. */
      t.e=a; t.desde=null;
      pintar(); tost('Deshecho: «'+t.n+'» vuelve a '+a+'.');
    };
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

