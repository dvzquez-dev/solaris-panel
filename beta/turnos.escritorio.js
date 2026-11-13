/* ═══ TURNOS · cara escritorio ═══════════════════════════════════════════════════════════
   3 funciones sacadas de `escritorio.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* ⛔ UNA SOLA PUERTA para desasignar. Se necesita en DOS sitios — al desmarcar el chip
   de una persona y al pulsar su «quita»— y con tres cargos son tres lineas cada vez.
   Dos copias de esto acaban siendo dos reglas distintas en cuanto alguien añada un
   cuarto cargo: una lo limpiaria y la otra no, y quedaria un cargo asignado a alguien
   que ya no esta en el turno. */
/* ═══ PESTAÑAS DEL ESCRITORIO (01/11, escm2) ════════════════════════════════════════
   🗣️ Daniel: «el escritorio […] muy mal optimizado y poco ergonomico». Turnos apilaba 6 paneles (~2.000 px) y Convocatorias 4:
   lo frecuente (cerrar un turno, convocar) quedaba al final. Ahora cada grupo es una fila de chips (`.pick`, lo elegido en rojo,
   sin tick) y un cuerpo por pestaña.
   ⛔ LOS CUERPOS SE PINTAN TODOS y los inactivos van con `hidden`: cambiar de pestaña NO repinta la página (`pintar()` la
   reescribe entera), así que lo que llevas escrito en «Convocar» sobrevive a mirar «Cerrar». Y todos los `id` existen, que
   es lo que el cableado de cada panel busca. `PEST` (escritorio.html) guarda la elegida por grupo. */
function _pestanaActiva_(lista, quiere, defecto){
  var ks = lista.map(function(p){ return p[0]; });
  if(ks.indexOf(quiere) >= 0) return quiere;
  return ks.indexOf(defecto) >= 0 ? defecto : (ks[0] || '');
}
/* `lista` = [[clave, rótulo, htmlDelCuerpo]]. Un cuerpo vacío no tiene pestaña: no se enseña un chip que lleva a nada. */
function _pestanasE_(grupo, lista, defecto){
  lista = lista.filter(function(p){ return p[2]; });
  if(!lista.length) return '';
  var act = _pestanaActiva_(lista, PEST[grupo], defecto);
  if(lista.length === 1) return lista[0][2];
  return '<div class="chips pest" role="tablist">'+lista.map(function(p){
      return '<button type="button" role="tab" class="pick'+(p[0]===act?' on':'')+'" data-pest="'+grupo+'" data-pk="'+p[0]+'">'+esc(p[1])+'</button>';
    }).join('')+'</div>'+
    lista.map(function(p){
      return '<div data-pestc="'+grupo+'" data-pk="'+p[0]+'"'+(p[0]===act ? '' : ' hidden')+'>'+p[2]+'</div>';
    }).join('');
}
/* Las dos pantallas con pestañas: qué panel va en cuál. Un panel que hoy no se pinta (sin rango) devuelve '' y se queda sin chip. */
function _turnosPest_(tabla){
  var mio = _miTurnoPanel_();
  return _pestanasE_('tur', [
    ['convocar', 'Convocar turno', convocarPanel()],
    ['disp', 'Disponibilidad', _convocarDispPanel_()+mio+_dispPanel_(mio)],
    ['cerrar', 'Cerrar un turno', _cierreTurnoPanel_()],
    ['turnos', 'Historial de turnos', tabla]
  ], mio ? 'disp' : 'convocar');   /* 03/11 (Daniel): el historial NO es lo primero; lo importante es convocar */   /* ⛔ lo tuyo va antes: si tienes que contestar, se abre ahí */
}
function _abrirPestana_(grupo, clave){
  var b = document.querySelector('[data-pest="'+grupo+'"][data-pk="'+clave+'"]');
  if(b) b.click();
}
function _cablearPestanas_(){
  $$('[data-pest]').forEach(function(b){
    b.onclick=function(){
      var g=b.dataset.pest;
      PEST[g]=b.dataset.pk;
      $$('[data-pest="'+g+'"]').forEach(function(x){ x.classList.toggle('on', x===b); });
      $$('[data-pestc="'+g+'"]').forEach(function(c){ c.hidden = (c.dataset.pk!==b.dataset.pk); });
    };
  });
}

function _quitarDeCargos_(n){
  var k; for(k in TUR_CARGOS){ if(TUR_CARGOS[k] === n) TUR_CARGOS[k] = null; }
}

/* ⛔ EL BOTON SE ACTUALIZA AL PINTAR, no al pulsar. Daniel: «el boton de convocar no
   vale». Vive fuera del contenedor del reparto -lo pinta `convocarPanel()` una sola
   vez-, asi que se busca en el documento en vez de reconstruirlo.
   ⚠️ Si no esta en pantalla no pasa nada: esta funcion tambien corre en pantallas donde
   no hay formulario de convocar. */
function _pintarBotonConvocar_(){
  var b = document.querySelector('[data-convocar]');
  if(!b) return '';
  /* ⛔ Y LOS COCHES TAMBIEN: `_pegasDelCoche_` llevaba desde el 11/08 escrita, con banco y
     sin llamador, asi que se podia convocar con un «Coche 1» a medias. */
  var v=function(id){ return (document.getElementById(id)||{}).value||''; };
  /* refuta6: la regla del consejo con lo escrito a mano manda sobre lo demás (la misma frase y el mismo orden que `_porQueNoSeProgramaTurno_`). */
  var motivo = _porQueSinConsejo_(_convocarCv_(), v('tuFecha'), v('tuHora'), v('tuDur')) || ((typeof _porQueNoSeConvoca_==='function')
    ? _porQueNoSeConvoca_(TUR_CARGOS, Object.keys(TUR_SEL).length, TUR_COCHES, Object.keys(TUR_SEL)) : '');
  b.disabled = !!motivo;
  b.textContent = motivo ? motivo : 'Convocar el turno';
  b.title = motivo || '';
  return motivo;
}

/* ⛔ EL RECUADRO DE RESPONSABILIDADES PENDIENTES (764.a, 02/10). Daniel: *«un recuadrito que
   ponga responsabilidades pendientes a asignar»*. Hasta hoy lo que faltaba solo se decia en el
   AVISO DEL BOTON (`_porQueNoSeConvoca_`), o sea **cuando ya intentabas convocar**: esto lo pone
   delante mientras reparte.
   ⛔ Sale de `_cargosQueFaltan_`, que es LA MISMA puerta que usa el boton. Dos criterios para
   «que falta» acaban diciendo cosas distintas en la misma pantalla.
   ⚠️ Y NO DESAPARECE al completarse, al contrario que los paneles: son un conjunto FIJO de
   tres, no una lista de trabajo que crece. Ver «las tres asignadas» es la confirmacion de que ya
   se puede convocar -- y la regla de «si no hay nada, no existe» es para lo otro.
   ⚠️ El nombre LARGO, igual que en el aviso: un «falta AV» no le dice nada a quien convoca por
   primera vez. */
function _cajaCargosPend_(cargos){
  var faltan = _cargosQueFaltan_(cargos || TUR_CARGOS), nombres = [], i, j;
  for(i=0;i<faltan.length;i++)
    for(j=0;j<CARGOS_TURNO.length;j++)
      if(CARGOS_TURNO[j].k === faltan[i]) nombres.push(CARGOS_TURNO[j].et);
  if(!nombres.length)
    return '<div class="nota" style="margin:0 0 9px"><b>Responsabilidades '+
      'asignadas.</b></div>';
  return '<div class="nota" style="margin:0 0 9px;border-color:rgba(232,145,46,.35)">'+
    '<b>Pendientes de asignar:</b> '+esc(_unirY_(nombres))+'.</div>';
}

function pintarReparto(){
  var c=document.getElementById('tuLista'); if(!c) return;
  var nn=Object.keys(TUR_SEL);
  if(!nn.length){
    c.innerHTML='<p style="margin:0;font-size:12px;color:var(--ink3)">Nadie marcado todav\u00eda. '+
      'Pulsa arriba a qui\u00e9n convocas y aqu\u00ed le pones su papel.</p>';
    return;
  }
  /* ⛔ EL RECUADRO VA DELANTE de las fichas: lo que falta se lee antes de repartir, no
     despues. Y se recompone en cada `pintarReparto()`, que es lo que lo vacia solo. */
  c.innerHTML=_cajaCargosPend_()+nn.map(function(n){
    var e=TUR_SEL[n], m=_m(n);
    return '<div class="repf">'+
      '<b>'+esc((m&&m.pila)||n)+'</b>'+
      '<input data-rol="'+esc(n)+'" value="'+esc(e.rol||'')+'" placeholder="su papel (opcional)">'+
      /* ⛔ UN BOTON POR CARGO. Antes habia uno solo -«responsable»- y los otros dos se
         escribian a mano en el texto libre, donde nadie los podia exigir ni leer.
         ✅ Y una misma persona PUEDE llevar dos: si se prohibiera, un turno de tres
         personas no se podria convocar -hay tres cargos- y la pantalla se plantaria.
         Se avisa, no se impide. */
      CARGOS_TURNO.filter(function(cg){ return _cargoOfrecidoA_(cg.k, n); }).map(function(cg){
        return '<button type="button" class="mini'+(TUR_CARGOS[cg.k]===n?' on':'')+
          '" data-cargo="'+cg.k+'" data-quien="'+esc(n)+'" title="'+esc(cg.et)+
          '">'+esc(cg.corto)+'</button>'; }).join('')+
      '<button type="button" class="mini'+(e.coche?' on':'')+'" data-coche="'+esc(n)+'">coche</button>'+
      '<button type="button" class="mini x" data-quita="'+esc(n)+'">quitar</button>'+
    '</div>';
  }).join('');
  cablearReparto();
}

/* ⚠️ Se llama DESPUES de cablear, no antes: `cablearReparto()` corre justo detras de
   `pintarReparto()` en cada cambio, y asi el estado del boton se recalcula con el
   reparto ya puesto. */
function cablearReparto(){
  _pintarBotonConvocar_();
  $$('#tuLista [data-rol]').forEach(function(i){
    i.oninput=function(){ if(TUR_SEL[i.dataset.rol]) TUR_SEL[i.dataset.rol].rol=i.value; };
  });
  $$('#tuLista [data-cargo]').forEach(function(b){
    b.onclick=function(){
      var k=b.dataset.cargo, n=b.dataset.quien;
      /* ⚠️ Un cargo lo lleva UNA persona: asignarlo a otra se lo quita a la anterior
         sola. Volver a pulsar sobre quien ya lo tiene lo deja vacante. */
      TUR_CARGOS[k] = (TUR_CARGOS[k]===n ? null : n);
      pintarReparto();
    };
  });
  $$('#tuLista [data-coche]').forEach(function(b){
    b.onclick=function(){ var n=b.dataset.coche; TUR_SEL[n].coche=!TUR_SEL[n].coche; pintarReparto(); };
  });
  $$('#tuLista [data-quita]').forEach(function(b){
    b.onclick=function(){
      var n=b.dataset.quita; delete TUR_SEL[n]; _quitarDeCargos_(n);
      var chip=document.querySelector('#tuPool [data-tu="'+n.replace(/"/g,'&quot;')+'"]');
      if(chip) chip.classList.remove('on');
      pintarReparto();
    };
  });
}

/* El mapa de calor de turnos (`_calorTurnos_`, `_consejoDe_`, `_dispDetalle_`…) vive en `comun.js` desde el 02/11: lo pintan
   el escritorio (Disponibilidad y Convocar) y el móvil (Programar turno). Aquí quedan sólo las dos lecturas del panel. */

/* La convocatoria que se está mirando. Sin filtrar por invitado: aquí manda quien convoca. */
function _dispViva_(){
  var L=(typeof CONVOCATORIAS!=='undefined'?CONVOCATORIAS:[]);
  return L.length ? L[0] : null;
}

/* (`_dispMudos_` vive en `comun.js` desde refutar33: el móvil también dice quién falta por contestar.) */

/* ── CONTESTAR TU DISPONIBILIDAD DE TURNOS, DESDE EL ESCRITORIO ───────────────────
   ⛔ EL HUECO QUE CIERRA: `api.guardarDisponibilidad` estaba declarada en `escritorio.html`
   y **no la llamaba nadie**. Esta cara SI lee la convocatoria y pinta el mapa agregado de
   arriba; lo unico que no podia era **contestarla**. Y quien abre el escritorio tambien hace
   turnos: para decir cuando puede tenia que sacar el movil, cada semana.
   ⚠️ MISMO CONTRATO QUE EL MOVIL, a proposito: clave `dia|franja` (`_convClave_` alli,
   `_dispClave_` aqui, identicas) y valor `{s:'no'}` o `{s:<sitio>|'ambos', c:<coche>}`. Los
   sitios NO se cablean: salen de `_convClases_(cv)`, que es la funcion que bajo a `comun.js`
   justo para que las dos caras no acaben con dos listas distintas.
   ⚠️ Y AQUI SE GUARDA CON BOTON, no a cada clic como en el movil. No es un descuido: alli
   el dedo pinta y suelta, aqui se arrastra el raton por veinte celdas -- guardar en cada una
   son veinte escrituras para una sola decision. A cambio hay que decir claramente que queda
   algo sin guardar, y por eso el boton lo dice. */
var MIT_PIN = null;        /* el pincel elegido; null = todavia no ha tocado nada */
var MIT_COCHE = false;
var MIT_CC = null;         /* 04/11 (los 4 pinceles): el coche POR SITIO ({cuvi:bool,citi:bool}); null = el unico MIT_COCHE. Misma terna que CONV_* del movil. */
var MIT_CELDAS = null;     /* lo marcado sin guardar; null = no ha tocado nada */

/* La convocatoria que TE toca contestar: abierta y con tu nombre dentro. ⚠️ `_dispViva_` no
   vale aqui -- esa coge la primera y sin filtrar, porque el mapa de arriba es de quien
   convoca y ve la de todos. */
function _miTurnoCv_(){
  /* ⛔ LA SESION, NO `ACTOR`: «Actuas como» reescribe `ACTOR`, y este panel escribe.
     Con `ACTOR` se te ofrecia la convocatoria a la que esta invitada OTRA persona. */
  var yo = (typeof _actorSanc_==='function') ? _actorSanc_() : ((typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '');
  if(!yo) return null;
  var L = (typeof CONVOCATORIAS!=='undefined'?CONVOCATORIAS:[]);
  for(var i=0;i<L.length;i++){
    var cv=L[i];
    /* ⛔⛔ TRES ESTADOS, NO DOS (459.ª) — la gemela de `_convAbierta_` del móvil, y con
       un síntoma DISTINTO: aquí `_miTurnoPanel_` devolvía `''`, o sea que el panel
       **desaparecía sin una palabra** —ni siquiera el aviso de `_dispAviso_`, que sólo
       habla de fallos de red— mientras `_dispPanel_`, que llega por `_dispViva_` y **no
       filtra por estado**, pintaba al lado «semana del … · el plazo vence el …». Dos
       paneles de la misma pantalla contradiciéndose.
       ⛔⛔ Y CURAR ESTO SOLO ABRE UNA ESCRITURA QUE NO EXISTÍA: `_cablearMiTurno_` cuelga
       el `onclick` de `[data-mtk]` y el botón llama a `api.guardarDisponibilidad`, que
       `Codigo.gs:2938` **acepta** en `sin_abrir` porque sólo mira `limite`. Por eso va
       con `_miTurnoPreHTML_` (que no pinta `data-mtk`) y con el guardia de
       `[data-mtguardar]`. El móvil ya tenía el suyo escrito; ésta **no**. */
    var _e=_convEstado_(cv);
    if(_e!=='abierta' && _e!=='sin_abrir') continue;
    var inv=cv.invitados||[];
    if(!inv.length || inv.indexOf(yo)>=0) return cv;
  }
  return null;
}

function _misCeldas_(cv){
  if(MIT_CELDAS) return MIT_CELDAS;
  /* ⛔ LA FILA QUE SE LEE ES LA QUE SE VA A ESCRIBIR. Aqui `cv.resp` trae a las 32, asi
     que con `ACTOR` el panel pintaba la disponibilidad REAL de otra persona rotulada «Tu
     disponibilidad» -- y al guardar, `guardarDisponibilidad` no manda nombre: el backend
     resuelve por TOKEN y sustituia la TUYA por la de ese otro. */
  var yo = (typeof _actorSanc_==='function') ? _actorSanc_() : ((typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '');
  var r = (cv.resp && cv.resp[yo]) || {};
  var out = {}; for(var k in r) if(r.hasOwnProperty(k)) out[k]=r[k];
  return out;
}

/* Lo que pinta el pincel de ahora. Copiado del movil (`turnos.movil.js`): el «no puedo» va
   SIN `c`, porque un no-puedo con coche no significa nada y Python lo lee por `s`. */
function _mitQuiere_(){
  return _pincelValor_(MIT_PIN, MIT_COCHE, MIT_CC);
}

/* Marcar una celda, o DESMARCARLA si ya llevaba justo lo mismo. ⚠️ Va aparte del
   cableado a proposito: es una DECISION, y metida dentro del `onclick` no habia forma
   de ejecutarla en el arnes -- su mutacion salia ciega. El movil hace lo mismo y por
   eso compara tambien el coche: cambiar solo el coche es un cambio, no un deshacer. */
function _mitToggle_(cv, mias, k, q){
  var v = mias[k];
  var igual = _celdaIgual_(v, q);
  /* ⛔ SE MARCA EL TURNO ENTERO, NO LA CASILLA — y esto es lo que la cabecera de arriba ya
     prometía («MISMO CONTRATO QUE EL MÓVIL, a propósito») sin cumplirlo. El móvil lo hace en
     `_convPintar_` con `_bloqueDesde_` y `_minTurno_`, que viven en `comun.js` porque las
     cargan las dos caras; aquí no las referenciaba nadie.
     ⚠️ La clave se parte y se arma con lo de ESTA cara (`String(k).split('|')` y
     `_dispClave_`): `_convClave_`/`_convDeClave_` son de `turnos.movil.js` y este bundle **no
     las tiene** — usarlas aquí sería un `ReferenceError` en la pantalla.
     ⛔ Y no es un detalle de comodidad: quien contesta desde el escritorio hacía clic, veía la
     celda pintada, pulsaba «Guardar mi disponibilidad»… y había declarado **una hora**.
     `reglas/turnos.MIN_HORAS_TURNO` es **4**, y su docstring dice lo que pasa entonces: *«no
     daría ningún error, saldría un turno corto en el reparto»*. Encima la propia pantalla le
     dice que *«no contestar es lo que hace que te pongan un turno cuando no puedes»* — marcó,
     no contó, y le cae el turno igual.
     ✅ NO-OP EXACTO donde hoy acierta: `_bloqueDesde_` devuelve `[k]` si el mínimo no es >1 o
     si la convocatoria tiene menos franjas que el mínimo. Con `min_h:1` marca una, que es lo
     correcto ahí. */
  var partes = String(k).split('|'), dia = partes[0];
  var bloque = _bloqueDesde_((cv&&cv.franjas)||[], partes[1], _minTurno_(cv));
  if(!bloque.length) bloque = [partes[1]];
  bloque.forEach(function(fk){
    var kk = _dispClave_(dia, fk);
    if(igual) delete mias[kk]; else mias[kk]=q;
  });
  return mias;
}

/* El rótulo del plazo, en TRES ramas. ⛔ Aquí había `Math.round(_convQuedan_(cv))` a secas, así
   que durante los últimos ~30 minutos la tarjeta rotulaba «te quedan **0 h** para contestar»
   con la rejilla VIVA y el botón de guardar activo. Eso se lee como plazo cerrado: se deja de
   contestar, y el turno lo reparte quien no sabe que podías — que es justo el fallo que toda
   esta pantalla existe para evitar. Y un plazo ya vencido decía **la misma frase**, o sea la
   misma frase para dos estados distintos.
   ✅ El móvil ya tenía las tres (`_convPieHTML_`, `turnos.movil.js`): esto trae ese criterio,
   no inventa otro.
   ⚠️ VA FUERA DE `_miTurnoPanel_` A PROPÓSITO, como `_mitToggle_`: metido dentro del panel no
   hay forma de ejecutarlo en el arnés y su mutación sale **ciega**. El instante entra por
   argumento para que el caso sea determinista.
   ⚠️ Y la rama del plazo vencido no es adorno aunque hoy `_miTurnoCv_` no deje llegar a ella:
   lo que se fija es el CONTRATO de la función, no lo que su único llamador usa hoy. */
function _mitPlazoTxt_(cv, ahora){
  /* ⛔⛔ SI EL SERVIDOR YA CONTESTÓ, MANDA ÉL (295.ª, 23/08). `cv.abierta` llegó con
     **1 escritura y 0 lecturas**: `_dispCargar_` lo guardaba y nadie lo miraba, mientras
     el rótulo rotulaba lo que le diera el reloj del navegador. El backend lo manda **a
     propósito** y lo dice en su propio comentario: *«quien mira el mapa necesita saber si
     lo que ve es definitivo o todavía puede cambiar, y deducirlo comparando fechas en la
     cara sería escribir la regla del plazo por segunda vez»*. Se estaba escribiendo por
     segunda vez, y salía distinta.
     ✅ Y el reloj que decide **es el suyo**: es el que acepta o rechaza lo que mandes.
     ⚠️ Pero sólo manda para CERRAR. Un `abierta:true` con el reloj local vencido no se
     convierte en horas inventadas: no sabemos cuántas quedan, sólo que no está cerrado.
     ⚠️ Y se compara con `=== false`, no `!cv.abierta`: una convocatoria vieja que no trae
     el campo daría `undefined`, y eso es «no lo sé», no «cerrado» — se quedaría sin
     rótulo el mapa entero. */
  if(cv && cv.abierta === false) return 'plazo cerrado';
  var q=_convQuedan_(cv, ahora);
  return q<=0 ? 'plazo cerrado'
       : q<1  ? 'te quedan '+Math.round(q*60)+' min para contestar'
              : 'te quedan '+Math.round(q)+' h para contestar';
}
/* «Tu disponibilidad» cuando la convocatoria existe y el plazo TODAVÍA NO ABRE (459.ª).

   ⛔ MISMO CRITERIO QUE EL MÓVIL (`_convPreHTML_`), y no es cosmética: la cabecera de este
   bloque promete *«MISMO CONTRATO QUE EL MÓVIL, a propósito»*, y dos caras contestando
   distinto a «¿qué se ve en `sin_abrir`?» es exactamente la divergencia que ese contrato
   existe para impedir.
   ⛔ SIN `data-mtk` Y SIN PINCELES: `_cablearMiTurno_` engancha por `[data-mtk]`, así que una
   celda sin el atributo **no tiene manejador**. El guardia del botón de guardar es la segunda
   capa, no la primera — y el botón no se pinta.
   ⚠️ `_mitPlazoTxt_` NO vale de subtítulo: mide contra `limite`, y en `sin_abrir` rotula «te
   quedan N h para contestar» cuando **no se puede contestar nada**. */
/* ⛔ EL RÓTULO DE UNA FRANJA DE LA REJILLA DE TURNOS (19/10). 🗣️ Daniel, 14/10: *«las horas… tanto
   en reuniones como en turnos como en lo que sea, han de aparecer justo en el medio de dos slots …
   No están ni para arriba ni para abajo»*. El móvil lo cumple desde ese día (`.rc.rd span`); aquí
   `.dmc` centraba «10:00» DENTRO de su casilla de 36 px, que es justo lo que rechazó.
   Sólo una HORA (`HH:MM`) se sube a la línea: un rótulo que no es una hora («Mañana») nombra la
   franja entera y se queda centrado en ella. Una puerta y no tres copias: la rejilla sale en tres
   pantallas (antes de abrir, la tuya y la del coordinador). */
/* El hueco de la comida en las rejillas `.dmapa` (la tuya y la de espera): una fila de ancho completo donde la convocatoria no ofrece horas. */
function _huecoFilaE_(a, b){
  var h = _huecoEntreFranjas_(a, b);
  return h ? _huecoHTML_(h) : '';
}
function _rotFranjaE_(txt){
  var t = String(txt == null ? '' : txt);
  return /^\d{1,2}:\d{2}$/.test(t)
    ? '<div class="dmc dml dmh"><span>' + esc(t) + '</span></div>'
    : '<div class="dmc dml">' + esc(t) + '</div>';
}

function _miTurnoPreHTML_(cv){
  var D=cv.dias||[], F=cv.franjas||[];
  /* ⛔ POR `_normAbre_` (463.ª): con `_dmyAISO_` a pelo, un `abre` sin hora —o en
     `DD/MM/AAAA`— dejaba `abH` VACÍO y la tarjeta rotulaba *«Se abre el 09/09/2026 a
     las **.**»*. La puerta le pone `00:00`, que es lo que significa «se abre ese día». */
  var ab=_normAbre_(cv.abre);
  var abD=_isoADMY_(ab.slice(0,10))||ab.slice(0,10), abH=ab.slice(11,16);
  var cab='<div class="dmc dml"></div>'+D.map(function(d){
    var p=String(_diaCorto_(d)).split(' ');
    return '<div class="dmc">'+esc(p[0]||'')+'<br>'+esc(p[1]||String(d).slice(8,10))+'</div>';
  }).join('');
  var filas=F.map(function(fr, i){
    return (i ? _huecoFilaE_(F[i-1], fr) : '')+_rotFranjaE_(_rotuloTramo_(fr))+
      D.map(function(){ return '<div class="dcel off"></div>'; }).join('');
  }).join('');
  return pan('Tu disponibilidad', 'se abre el '+esc(abD)+' a las '+esc(abH),
    '<div class="pb" data-abre="'+esc(ab)+'">'+
    '<p style="margin:0 0 10px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
      'Se abre el '+esc(abD)+' a las '+esc(abH)+', cuando el equipo '+
      'recibe el aviso. Hasta entonces no se puede marcar.</p>'+
    '<div class="dmapa" style="grid-template-columns:104px repeat('+D.length+
      ',minmax(44px,1fr))">'+cab+filas+'</div>'+
    '</div>');
}

function _miTurnoPanel_(){
  /* ⚠️ Misma guarda y por el mismo motivo que en `_dispPanel_`: esta es la mitad que le
     cuesta la semana a quien iba a contestar. */
  var av=_dispAviso_('Tu disponibilidad'); if(av) return av;
  var cv=_miTurnoCv_(); if(!cv) return '';
  /* ⛔ Fuera del panel a propósito, como `_mitPlazoTxt_`: metida dentro no hay forma de
     ejecutarla en el arnés y su mutación sale ciega. */
  if(_convEstado_(cv)==='sin_abrir') return _miTurnoPreHTML_(cv);
  var mias=_misCeldas_(cv), D=cv.dias||[], F=cv.franjas||[];
  /* ⛔ LA TABLA DE ROTULOS SE FUE A `comun.js` (290.a, 23/08), por el mismo motivo por el
     que se fue `_convClases_`: la lista y su etiqueta son LA MISMA decision, y tenerlas
     separadas es como la cara del movil acabo sacando la lista de los datos y tecleando
     el rotulo. Esta copia era la buena de las dos, y aun asi sobraba. */
  if(MIT_PIN===null) MIT_PIN=(_pincelesDe_(cv)[0]||{sitio:'no'}).sitio;
  var cab='<div class="dmc dml"></div>'+D.map(function(d){
    var p=String(_diaCorto_(d)).split(' ');
    return '<div class="dmc">'+esc(p[0]||'')+'<br>'+esc(p[1]||String(d).slice(8,10))+'</div>';
  }).join('');
  var filas=F.map(function(fr, i){
    return (i ? _huecoFilaE_(F[i-1], fr) : '')+_rotFranjaE_(_rotuloTramo_(fr))+D.map(function(d){
      var k=_dispClave_(d,fr.k), v=mias[k];
      var st = (v && v.s && v.s!=='no') ? ('background:'+_celdaFondo_(v)) : '';
      return '<div class="dcel'+((v&&v.s&&v.s!=='no')?'':' v0')+'" data-mtk="'+k+'" '+
        'style="cursor:pointer;'+st+'">'+
        ((v&&v.s==='no')?'\u2013':((v&&v.c)?'\uD83D\uDE97':''))+'</div>';
    }).join('');
  }).join('');
  var sucio=!!MIT_CELDAS;
  return pan('Tu disponibilidad',
    _mitPlazoTxt_(cv),
    '<div class="pb">'+
    '<p style="margin:0 0 10px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
      'Marca d\u00f3nde puedes. Si no contestas, te pueden poner un turno '+
      'cuando no puedes.</p>'+
    '<button class="btn" data-mtreusar style="display:block;margin:0 0 12px">↺ Reutilizar la disponibilidad del turno anterior</button>'+
    /* 04/11 (los 4 pinceles): CUVI/CITI × con/sin coche, varios a la vez, mínimo uno. Cada combinación, su color (la leyenda es la de abajo). */
    '<div class="chips" data-mtpinceles style="margin:0 0 9px">'+_pincelChipsHTML_(cv, _pincelSelDe_(MIT_PIN, MIT_COCHE, MIT_CC), 'data-mtpin2')+'</div>'+
    '<div class="dmapa" style="grid-template-columns:104px repeat('+D.length+',minmax(44px,1fr))">'+
      cab+filas+'</div>'+
    '<div data-mtley style="margin-top:8px;font-size:11.5px;color:var(--ink2)">'+_pincelLeyendaHTML_(cv)+'</div>'+
    '<div style="margin-top:11px;display:flex;gap:9px;align-items:center">'+
      '<button class="btn pri" data-mtguardar'+(sucio?'':' disabled')+'>Guardar mi disponibilidad</button>'+
      '<small style="color:var(--ink2)">'+(sucio?'tienes cambios sin guardar':'sin cambios')+'</small>'+
    '</div>'+
    /* 02/11: contestar A MEDIAS no cuenta (`_convFalta_`, comun.js); lo mismo se pregunta al guardar. */
    (_convFaltaTxt_(cv, mias) ? '<div class="tfalta" style="margin-top:8px">'+esc(_convFaltaTxt_(cv, mias))+'</div>' : '')+
    '</div>');
}

/* ⭐ REUTILIZAR LA SEMANA ANTERIOR, TAMBIÉN AQUÍ (949.ª). La petición de Daniel (14/10) no nombró cara y el móvil
   ya lo tenía (932.ª); esta cara contesta la misma convocatoria. Lo copiado entra como CAMBIO SIN GUARDAR
   (`MIT_CELDAS`): aquí nada se guarda hasta pulsar «Guardar mi disponibilidad», y copiar no es la excepción. */
async function _reusarMiTurno_(cv){
  if(!cv) return;
  if(typeof _identidadPrestada_==='function' && _identidadPrestada_(
       (typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '')){
    tost('Estás actuando como otra persona: tus turnos no se tocan desde aquí.'); return;
  }
  if(_convEstado_(cv)!=='abierta'){ tost('El plazo no está abierto: no hay nada que contestar.'); return; }
  var res=await _traerSemanaAnterior_(cv); if(!res) return;
  var mias=_misCeldas_(cv);
  if(Object.keys(mias).length &&
     !(await dialogoSiNo('Se sustituye lo que llevas marcado esta semana por lo de la anterior. No se guarda hasta que pulses «Guardar». ¿Seguir?'))) return;
  MIT_CELDAS=res.mapa;
  pintar();
  tost('Copiada '+(res.rotulo||'la semana anterior')+': revísala y pulsa «Guardar mi disponibilidad».'+
       (res.fuera ? ' ('+res.fuera+' casilla'+(res.fuera===1?' no cabía':'s no cabían')+'.)' : ''));
}

function _cablearMiTurno_(){
  $$('[data-mtreusar]').forEach(function(b){
    b.onclick=function(){ _reusarMiTurno_(_miTurnoCv_()); };
  });
  $$('[data-mtpin2]').forEach(function(b){
    b.onclick=function(){
      var d=_pincelDe_(_pincelToggle_(_pincelSelDe_(MIT_PIN, MIT_COCHE, MIT_CC), b.dataset.mtpin2));
      MIT_PIN=d.pincel; MIT_COCHE=d.coche; MIT_CC=d.cc; pintar();
    };
  });
  $$('[data-mtk]').forEach(function(c){
    c.onclick=function(){
      var cv=_miTurnoCv_(); if(!cv) return;
      MIT_CELDAS=_mitToggle_(cv, _misCeldas_(cv), c.dataset.mtk, _mitQuiere_());
      pintar();
    };
  });
  $$('[data-mtguardar]').forEach(function(b){
    b.onclick=async function(){
      if(b.disabled) return;
      /* ⛔ Y NO SE CONTESTA POR NADIE. */
      if(typeof _identidadPrestada_==='function' && _identidadPrestada_(
           (typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '')){
        tost('Est\u00e1s actuando como otra persona: tus turnos no se tocan desde aqu\u00ed.');
        return;
      }
      var cv=_miTurnoCv_(); if(!cv) return;
      /* ⛔⛔ EL GUARDIA QUE EL MÓVIL YA TENÍA Y ÉSTA NO (459.ª). Desde que
         `_miTurnoCv_` deja pasar `sin_abrir`, este manejador es alcanzable con el plazo
         sin abrir — y `api.guardarDisponibilidad` lo **ACEPTA**: `Codigo.gs:2938` sólo
         mira `limite`. La primera capa es que `_miTurnoPreHTML_` no pinta `data-mtk` ni
         el botón; ésta es la segunda, **para un DOM viejo** en una pestaña que lleva
         días abierta — que es el caso que el propio backend cita.
         ⛔ La autoridad es `reglas/convocatoria.py:175 admite_respuesta`
         (`estado_en(…) == "abierta"`), y `mutar.py` ya tiene clasificada como defecto la
         mutación que la relaja a `!= "cerrada"`. Ver el porqué entero en
         `turnos.movil.js`, en el guardia del `pointerdown`. */
      if(_convEstado_(cv)!=='abierta'){
        tost('El plazo todav\u00eda no est\u00e1 abierto: tu disponibilidad no se guarda.');
        return;
      }
      var mias=_misCeldas_(cv);
      /* 02/11: A MEDIAS NO CUENTA. Se dice antes de enviar, y se puede seguir rellenando o guardar igual (`_convFalta_`). */
      var _fl=_convFaltaTxt_(cv, mias);
      if(_fl && !(await dialogoSiNo(_fl, {si:'Guardar igual', no:'Seguir rellenando'}))) return;
      b.disabled=true; var t=b.textContent; b.textContent='Guardando\u2026';
      try{
        await api.guardarDisponibilidad(cv.id, mias);
        /* ⚠ El eco local va a la fila de la SESION, que es la que el servidor acaba de
           escribir: con `ACTOR` la pantalla enseñaba el cambio bajo el nombre equivocado
           y nunca se contradecia a si misma. */
        var yo=(typeof _actorSanc_==='function') ? _actorSanc_() : ((typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '');
        if(!cv.resp) cv.resp={};
        cv.resp[yo]=mias;
        MIT_CELDAS=null;                       /* ya no queda nada pendiente */
        tost('Disponibilidad guardada.'); pintar();
      }catch(e){
        /* ⛔ UNA DISPONIBILIDAD QUE SE PIERDE EN SILENCIO es la que luego hace que te pongan
           un turno cuando no puedes. Se avisa, se deja el boton vivo y `MIT_CELDAS` NO se
           borra: lo marcado sigue en pantalla para reintentar sin volver a pintarlo. */
        b.disabled=false; b.textContent=t;
        tostErr('No se pudo guardar tu disponibilidad: ', e);
      }
    };
  });
}
/* ═══ UN PANEL QUE NO SABE NO PUEDE QUEDARSE MUDO ════════════════════════
   ⛔⛔ Vaciar `CONVOCATORIAS` evita el mapa de mentira —y eso hay que conservarlo— pero deja
   los dos paneles **en blanco y sin una palabra**: `_dispPanel_` y `_miTurnoPanel_` devuelven
   `''` en cuanto no hay convocatoria, y **`DISP_SRV` no lo leia nadie**; su unico lector era
   su propio setter. Asi que un fallo de `getDisponibilidad` los hacia desaparecer **para toda
   la sesion**, porque `_dispCargar_` es de un solo disparo y nada devolvia el estado a
   'sin pedir' — ni `_refrescoVivo_`, que si refresca turnos, tareas, panel, sanciones, partes,
   documentos y reuniones.
   ⛔ El danyo va por los DOS lados: quien iba a contestar su disponibilidad pierde la semana
   entera —y la tarjeta de al lado dice que *no contestar es lo que hace que te pongan un turno
   cuando no puedes*—, y quien reparte turnos se queda sin mapa **sin saber por que**.
   ✅ Y NO SE INVENTA NADA: `V.curso` resuelve esto mismo con el MISMO patron --un disparo y su
   estado-- y **si** lo consulta; `_notisCargar_` ademas ofrece Reintentar. Eran tres puertas
   para la misma pregunta y esta era la unica muda. Se copia la que ya estaba bien.
   ⚠️ Una sola puerta para los dos paneles, no una guarda en cada uno: con dos copias, uno de
   los dos se queda mudo el dia que alguien toque solo el otro — que es exactamente lo que
   acaba de pasar aqui.
   ⚠️ Y devuelve `''` cuando el estado es 'ok': avisar siempre taparia la pantalla entera, que
   es peor que el fallo que esto cura. */
function _dispAviso_(titulo){
  var e = _dispEstadoSrv_();
  if(e === 'error') return pan(titulo, 'sin datos',
    vacioSimple('No se pudo cargar el mapa de disponibilidad',
      '<button class="btn" data-dreint>Reintentar</button>'));
  if(e === 'pidiendo') return pan(titulo, '\u2026',
    vacioSimple('Preguntando al servidor', 'Un momento.'));
  /* ⛔⛔ Y EL QUE FALTABA (577.ª): sin sesion no es que no se haya preguntado todavia --
     eso es `'sin pedir'` y sigue mudo a proposito --, es que **no se puede preguntar**.
     Sin esta rama, lo que se pintaba era el mapa de la SEMILLA sin una palabra.
     ⚠️ Y NOMBRA EL MOTIVO: «no se pudo preguntar» a secas manda a buscar un fallo del
     servidor cuando lo que falta es la identidad, que se arregla de otra manera.
     ⚠️ Ofrece Reintentar igual que el de `'error'`: la sesion puede llegar tarde (el
     login es asincrono), y entonces ese boton es lo unico que vuelve a abrir la puerta --
     `_dispCargar_` es de un solo disparo y `_refrescoVivo_` no lo toca. */
  /* 11/11 (refutar8): SIN CONVOCATORIA NO ES UNA AVERÍA. Entre una semana y otra el servidor contesta «no hay ninguna convocatoria» a la
     puerta del mapa y `null` (con éxito) a la de `getConvocatoria`; esto último se pintaba «No se pudo cargar el mapa» + Reintentar. */
  if(e === 'sin convocatoria') return pan(titulo, 'sin convocatoria',
    vacioSimple('No hay ninguna disponibilidad convocada',
      'La abre el Project Director cuando toca repartir los turnos.'));
  if(e === 'sin accion') return pan(titulo, 'sin datos',
    vacioSimple('Esta versi\u00f3n no puede consultar la disponibilidad',
      'Recarga la p\u00e1gina y, si sigue igual, av\u00edsalo desde el buz\u00f3n.'));
  if(e === 'sin sesion') return pan(titulo, 'sin sesi\u00f3n',
    vacioSimple('No hay sesi\u00f3n',
      'Entra con tu cuenta y vuelve a esta pesta\u00f1a. '+
      '<button class="btn" data-dreint>Reintentar</button>'));
  return '';
}


function _dispPanel_(yaHablo){
  /* ⚠️ ANTES de `_dispViva_()`: si se pone despues, el `return ''` de abajo se lleva el
     aviso por delante y el panel vuelve a quedarse mudo. */
  var av=_dispAviso_('Disponibilidad para turnos');
  /* turnos-1 (12/11): «sin convocatoria» lo dice ya «Tu disponibilidad» (`yaHablo` = su HTML, que no está vacío): decirlo dos veces seguidas
     es ruido. Sólo ese estado — en `error` y `sin sesion` cada panel lleva su propio Reintentar y duplicarlo sí tiene sentido. */
  if(av && yaHablo && _dispEstadoSrv_()==='sin convocatoria') return '';
  if(av) return av;
  /* ⛔⛔ CON `'solo mio'` NO SE PINTA EL MAPA (466.ª). Por esa puerta llega la
     convocatoria y **solo las respuestas de quien mira**, asi que el calor saldria de
     UNA persona y se leeria como el del equipo -- que es exactamente el «mapa de
     mentira» que la carga ya evita en su rama de error, *porque con uno de mentira se
     reparte gente de verdad*. Se dice de quien es la pantalla, y «Tu disponibilidad»
     --que si es suya-- sigue funcionando debajo. */
  if(_dispEstadoSrv_() === 'solo mio') return pan('Disponibilidad para turnos',
    'no es tu pantalla',
    vacioSimple('El mapa de todo el equipo es para quien reparte los turnos',
      'Tu disponibilidad sí la puedes contestar, aquí debajo.'));
  var cv=_dispViva_(); if(!cv) return '';
  var calor=_calorTurnos_(cv, DISP_SITIO, DISP_COCHE);
  var mudos=_dispMudos_(cv);
  var nInv=(cv.invitados||[]).length;
  var D=cv.dias||[];
  var sit=function(k,txt){
    return '<button data-dsit="'+k+'" class="'+(DISP_SITIO===k?'on':'')+'">'+txt+'</button>';
  };
  return pan('Disponibilidad para turnos','semana del '+esc(_isoADMY_(D[0])||D[0]),
    '<div class="pb">'+
    '<p style="margin:0 0 10px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
      'Cuánta gente puede en cada hueco. Toca una casilla para ver quién. '+
      /* ⛔ POR `_normLimite_` (465.ª), igual que su gemela del móvil: con un `limite`
         **pelado** —lo que manda un `<input type="date">`— esto rotulaba *«vence el
         14/09/2026 a las .»*. Curar una cara y no la otra es el error caro de aquí. */
      'El plazo vence el '+esc(_isoADMY_(_normLimite_(cv.limite).slice(0,10))||'')+
      ' a las '+esc(_normLimite_(cv.limite).slice(11,16))+'.</p>'+
    '<div class="dsit">'+sit('','Los dos sitios')+sit('cuvi','Solo CUVI')+sit('citi','Solo CITI')+'</div>'+
    '<div class="chips" data-d-filtro style="margin:0 0 8px">'+_turnoFiltroCocheChips_(DISP_COCHE, 'd')+'</div>'+
    /* 03/11: EL MISMO MAPA QUE CONVOCAR (`_turnoCalorHTML_`), no un segundo diseño (Daniel: «en disponibilidad sigue la cosa vieja»). */
    _turnoCalorHTML_(cv, calor, 'dMapa')+
    '<div class="nota">'+
      (nInv ? (nInv-mudos.length)+' de '+nInv+' han contestado'+
              (mudos.length ? ' · sin contestar: '+mudos.map(_dispPila_).map(esc).join(', ') : '')
            : 'Nadie convocado todavía.')+
    '</div>'+
    '</div>');
}

/* ═══ EL MAPA PINTA LO QUE HA CONTESTADO LA GENTE ═══════════════════════════════════════
   Hasta hoy `_dispViva_()` leia `CONVOCATORIAS` **de memoria**, o sea los datos de demostracion:
   se abria el escritorio, se veia un mapa de calor con nombres y horas... y no era de nadie.
   `api.getDisponibilidad` estaba declarada en las dos caras y **no la llamaba nadie**.

   ⛔ Una ida y vuelta, no dos: la accion devuelve la convocatoria Y las respuestas, y desde hoy
   sin `id` sirve la vigente. Pedir primero cual es y luego sus respuestas serian dos viajes para
   una pantalla que se abre en el movil de alguien.
   ⚠️ Y el estado se guarda para no repreguntar en cada repintado: `pintar()` corre muchas veces
   por interaccion, y sin esto el mapa dispararia una peticion por cada raton que pasa. */
function _dispEstadoSrv_(v){
  if(v!==undefined) DISP_SRV=v;
  return (typeof DISP_SRV==='undefined') ? 'sin pedir' : DISP_SRV;
}

function _dispCargar_(repintar){
  if(_dispEstadoSrv_() !== 'sin pedir') return;
  /* ⛔⛔ SALIR MUDO AQUI DEJABA EL ESTADO EN `'sin pedir'`, Y ESO SIGNIFICA OTRA COSA
     (577.ª). `'sin pedir'` es *todavia no he preguntado* -- el instante normal antes de
     la primera carga, porque `_dispPanel_` se pinta ANTES de que `_pinDisp_` dispare la
     peticion --, asi que `_dispAviso_` lo deja pasar en silencio **con razon**. Esto es
     *no PUEDO preguntar*, que es un estado distinto y hay que decirlo: lo que se pinta
     entonces es el mapa de la SEMILLA, y con un mapa de mentira se reparte gente de
     verdad.
     ⚠️ Y el arreglo ingenuo -- hacer que `_dispAviso_` cubra `'sin pedir'` -- ROMPE la
     pantalla normal: sacaria el aviso en cada primer pintado. Por eso la cura va aqui, en
     quien sabe POR QUE no se pregunto, y no en quien lo pinta (§3c-24). */
  /* ⛔ 20/10 · DOS CAUSAS, DOS ESTADOS (como `_convCargar_` en el móvil). Juntas en `'sin sesion'`, a quien SÍ ha
     entrado y le falta la ACCIÓN (una cara de otra versión que el backend) se le decía «Entra con tu cuenta»: le culpaba
     a él de algo que no arregla volviendo a entrar. La sesión se mira PRIMERO: sin ella no se sabe nada más. */
  if(typeof SESION==='undefined' || !SESION){ _dispEstadoSrv_('sin sesion'); return; }
  if(typeof api==='undefined' || !api.getDisponibilidad){ _dispEstadoSrv_('sin accion'); return; }
  _dispEstadoSrv_('pidiendo');
  /* El interruptor se lee EN PARALELO con el mapa, no encadenado: son dos preguntas
     independientes y encadenarlas sumaria las dos esperas para pintar la misma pantalla.
     ⚠️ Y su fallo NO tumba el mapa (`catch` propio): que no se sepa si los avisos estan
     encendidos no es motivo para dejar sin disponibilidad a quien reparte turnos. */
  if(api.getControl){
    /* Se pide el CONTROL ENTERO porque es lo único que sabe hacer `api.getControl`, y
       la clave se saca aquí. ⛔ Cada entrada es `{valor, actualizado_at, por, nota}`,
       **no el valor a secas**: leer la entrada directamente daría un OBJETO —que es
       cierto— y el interruptor saldría encendido siempre, incluido el día que esté
       apagado. Es el mismo fallo que tuvo el gate meses con `calcular_cierre`. */
    AVISOS_EST='leyendo';
    /* 🟡 R4 (refutador 26): con tiempo límite — un `getControl` colgado dejaba la casilla en «Leyendo…» para siempre. */
    Promise.race([api.getControl(), new Promise(function(_, no){ setTimeout(function(){ no(new Error('tiempo')); }, 15000); })])
    .then(function(c){
      var e = c && c[INTERRUPTOR_AVISOS];
      var val = (e && typeof e==='object' && 'valor' in e) ? e.valor : e;
      AVISOS_ON = (val===true || val==='true' || val===1 || val==='1');
      AVISOS_EST='ok';
      _dispBorrDe_(c);
      _dispColaDe_(c);
      if(typeof repintar==='function') repintar();
    }).catch(function(){
      /* ⛔ 22/10 (auditor 26, 🟡 11): «no se pudo leer» NO es «apagado» — se pinta como lo que es. */
      AVISOS_EST='error';
      if(typeof repintar==='function') repintar();
    });
  } else {
    /* 🟡 R4 (refutador 26): sin la acción no se puede leer — y nacía 'leyendo'. En diferido: esto corre DENTRO de `pintar`. */
    AVISOS_EST='error';
    if(typeof repintar==='function') setTimeout(repintar, 0);
  }
  api.getDisponibilidad().then(function(r){
    _dispEstadoSrv_('ok');
    if(typeof CONVOCATORIAS==='undefined') return;
    /* ⛔ EL SERVIDOR MANDA. Sin convocatoria no se deja la de demostracion puesta: un mapa de
       mentira es peor que un hueco, porque se reparte gente con el. */
    CONVOCATORIAS.length=0;
    if(r && r.convocatoria){
      var cv=r.convocatoria;
      cv.resp = r.cv || {};
      /* ⛔⛔ SIN `!!` (447.ª, 05/09). El guardia que lo lee tiene escrito su porque:
         `_convEstado_` usa `cv.abierta === false` y NO `!cv.abierta` porque *«una
         convocatoria vieja sin el campo es «no lo se», y cerrarla seria inventar»*.
         Con `!!`, un `undefined` se volvia `false` AQUI, antes de que el guardia lo
         mirara: el productor decidia por el, y el panel de contestar desaparecia sin
         una palabra. El movil ya lo copiaba asi (`turnos.movil.js`): dos criterios
         para el mismo campo son el bug.
         ⚠️ Hoy es LATENTE -- el backend manda `abierta` por las dos puertas
         (`Codigo.gs:2922` y `:2968`)--, y se cura por el mismo motivo que la 295.a:
         porque son dos criterios, no porque sangre.
         ⚠️ Y no basta un `in` sobre el fuente para vigilarlo: `!!r.abierta` conserva
         los dos literales que el `ok` de `probar_mi_turno.py` buscaba. Por eso el caso
         EJECUTA esta expresion. */
      cv.abierta = r.abierta;
      CONVOCATORIAS.push(cv);
    }
    if(typeof repintar==='function') repintar();
  }).catch(function(){
    /* ⛔ Un fallo NO deja el mapa de demostracion pintado: se marca el estado y se repinta, que
       es como la pantalla puede decir que no lo sabe en vez de enseñar algo inventado.
       ⛔ Y ESO LO DECIA EL COMENTARIO Y NO LO HACIA EL CODIGO. `CONVOCATORIAS.length=0` solo
       estaba en la rama de EXITO, asi que con el backend caido quedaba puesta la semilla de
       demostracion — una convocatoria entera, **con los nombres reales del consejo** y su
       plazo— y quien reparte turnos veia un mapa de calor perfecto y **repartia un turno
       real con el**. Un mapa de mentira es peor que un hueco, que es justo lo que dice la
       rama de arriba: la leccion estaba escrita a seis lineas de aqui.
       ⚠️ Y `DISP_SRV` no lo lee nadie mas: `_dispPanel_` no consulta el estado en ningun
       punto, asi que marcarlo no basta — hay que VACIAR. */
    /* ⛔⛔ ANTES DE DARLO POR CAIDO, LA OTRA PUERTA (466.ª). `getDisponibilidad` esta
       gateada a rango >= 1 (`Codigo.gs:2999`), asi que lo que recibe un miembro RASO no
       es un fallo del servidor: es que **no le dejan ver el mapa de los demas**. Sin
       esto la pantalla le decia *«No se pudo preguntar al servidor»* --falso-- y se
       quedaba **sin poder contestar**, cuando `_guardarDisponibilidad_` NO esta gateado
       y guardar si le dejarian. Medido ejecutando: `pedida=0`, `panel=MIENTE`,
       `rejilla=notoca`.
       ⛔ NO SE MIRA EL MENSAJE DEL ERROR para decidir si reintentar: se **intenta la
       otra puerta**, y si tambien falla se cae al error de verdad. Distinguir por el
       texto ataria la cara a una cadena del servidor, que es la clase de acuerdo que se
       rompe en silencio el dia que alguien la reescribe.
       ⚠️ Y por aqui llega SOLO LO SUYO (`getConvocatoria` devuelve `mias`, no `cv`):
       el mapa de todos sigue sin estar, asi que el estado lo dice y `_dispPanel_` no
       pinta un calor de UNA persona -- un mapa de mentira es peor que un hueco, que es
       lo que ya dice la rama de arriba. */
    if(typeof api!=='undefined' && api.getConvocatoria){
      api.getConvocatoria().then(function(r){
        if(r && r.convocatoria && typeof CONVOCATORIAS!=='undefined'){
          var cv=r.convocatoria,
              yo=(typeof _actorSanc_==='function') ? _actorSanc_()
                 : ((typeof SESION!=='undefined' && SESION && SESION.nombre) || '');
          /* La misma puerta que usa el movil al cargar: la fila que se LEE es la que se
             va a ESCRIBIR, y sale del actor de la sesion, no de `YO`. */
          cv.resp={}; cv.resp[yo]=r.mias||{};
          cv.abierta = r.abierta;
          CONVOCATORIAS.length=0; CONVOCATORIAS.push(cv);
          _dispEstadoSrv_('solo mio');
        } else {
          if(typeof CONVOCATORIAS!=='undefined') CONVOCATORIAS.length=0;
          _dispEstadoSrv_(r===null ? 'sin convocatoria' : 'error');       // `null` con éxito = no hay ninguna (refutar8)
        }
        if(typeof repintar==='function') repintar();
      })['catch'](function(){
        /* Las dos puertas caidas si es un fallo de verdad. */
        if(typeof CONVOCATORIAS!=='undefined') CONVOCATORIAS.length=0;
        _dispEstadoSrv_('error');
        if(typeof repintar==='function') repintar();
      });
      return;
    }
    if(typeof CONVOCATORIAS!=='undefined') CONVOCATORIAS.length=0;
    _dispEstadoSrv_('error');
    if(typeof repintar==='function') repintar();
  });
}

function _pinDisp_(){
  /* Se pide AQUI y no en el arranque: el mapa vive en una pestaña que puede no abrirse en
     toda la sesion, y cargarlo siempre seria una peticion de mas para todo el mundo. */
  _dispCargar_(typeof pintar==='function' ? pintar : null);
  /* ⛔⛔ EL «REINTENTAR» SE CABLEA AQUÍ ARRIBA, ANTES DE LAS DOS GUARDAS. Estaba al final
     de esta función, y ahí **no llega nunca cuando hace falta**: el botón solo lo pinta
     `_dispAviso_` en los estados `error` y `sin sesion`, y en los dos se sale antes — en
     `error` porque `CONVOCATORIAS` se acaba de vaciar y `_dispViva_()` da falsy, y en los
     dos porque el panel del aviso **no pinta `#dMapa`**.
     📏 O sea: el manejador se colgaba **exactamente cuando el botón no está en pantalla**,
     y no se colgaba cuando sí. «No se pudo preguntar al servidor · Reintentar» y el botón
     no hacía nada, para siempre.
     ⛔ Y el precio no es el botón: `DISP_SRV` **solo** vuelve a `'sin pedir'` desde ese
     manejador, así que una caída de red dejaba muertos el mapa Y «Tu disponibilidad»
     **toda la sesión**. Quien iba a contestar pierde la semana — y la tarjeta de al lado
     le recuerda que *no contestar es lo que hace que te pongan un turno cuando no puedes*.
     ⚠️ Su guardia estaba VERDE y no podía cazarlo: `"data-dreint" in _PIN` mira el FUENTE,
     no si se alcanza — y el propio texto de esa comprobación dice *«un `Reintentar` sin
     manejador es un rótulo»*. Lo era. */
  $$('[data-dreint]').forEach(function(b){
    b.onclick=function(){ _dispEstadoSrv_('sin pedir'); _dispCargar_(pintar); pintar(); };
  });
  var cv=_dispViva_(); if(!cv) return;
  var mapa=document.getElementById('dMapa'); if(!mapa) return;
  var calor=_calorTurnos_(cv, DISP_SITIO, DISP_COCHE);
  $$('[data-d-coche]').forEach(function(b){ b.onclick=function(){ DISP_COCHE=_cocheDeFiltro_(b.dataset.dCoche); DISP_SEL=''; pintar(); }; });
  /* 03/11: el MISMO cableado que Convocar (`_turnoCalorCablear_`), sin formulario al que rellenar: tocar una casilla la marca y cuenta
     quién puede en la caja de debajo (una caja fija, no un globo: tres cestas de nombres no caben sobre una casilla). */
  _turnoCalorCablear_(mapa, cv, calor, null);
  $$('.dsit [data-dsit]').forEach(function(b){
    b.onclick=function(){ DISP_SITIO=b.dataset.dsit; DISP_SEL=''; pintar(); };
  });
  /* ⛔ EL BOTON SIN MANEJADOR ES UN ROTULO. `_dispCargar_` es de un solo disparo, asi que
     devolver el estado a 'sin pedir' es lo UNICO que vuelve a abrir esa puerta — sin
     esto, un fallo de red dura hasta que alguien recarga la pagina a mano.
     ⛔⛔ Y AQUI ESTABA EL CABLE, QUE ES DONDE NO LLEGA. Movido ARRIBA el 11/09 (605.ª):
     este punto está **debajo** de `if(!cv) return;` y de `if(!mapa) return;`, y los dos
     disparan justo en los estados donde el botón existe. La premisa de la línea de arriba
     era correcta —*el aviso se pinta en el sitio del mapa*— y el SITIO elegido, el
     equivocado. ⚠️ Se deja escrito porque un cable que vuelva aquí se lee igual de bien. */
}

/* ═══ CONVOCAR DISPONIBILIDAD ═══════════════════════════════════════════════════════
   Abre el plazo para una semana. **Solo rango ≥ 3** — Daniel, §3.11 del plan: *«eso solo lo
   puedo hacer yo, eso sí que no va a cambiar»*.

   ⛔ AQUÍ NO SE CALCULA NINGUNA FECHA. Se encola **qué semana** se quiere y el servidor
   —`rutinas/calcular_convocatoria.py`, con la regla de `reglas/convocatoria.py`— resuelve la
   apertura y el límite. Es el patrón de la casa: **el escritorio encola, Python calcula**,
   igual que el cierre mensual y el de temporada.
   ⛔ Y por eso esta pantalla **no promete horas**: decir aquí «se abre el jueves a las 22:00»
   sería escribir la regla por segunda vez, en prosa, donde nadie la va a actualizar. */

/* ⛔⛔ DOS PUERTAS QUE NO SE TOCABAN, Y NINGUNA CUENTA PASABA LAS DOS (643.ª, 14/09).
   La cara pedía rango >= 3 sobre `ACTOR`, y el servidor, para `setControl`, la cuenta ADMIN
   (`Codigo.gs`, `case 'setControl'`). 📏 Medido, 2 de 2: el correo admin sale UNA vez en
   `Codigo.gs` —su declaración—, o sea que no está en `CORREOS`, su nombre de sesión ES el
   correo y `rangoNom` le da 0: sin panel y sin una palabra. La cuenta del PD, al revés: panel
   entero y al pulsar «No se pudo encolar: solo admin o clave». Lo único que funcionaba era
   entrar como admin y elegir «Project Director» en «Actúas como», un clic que nada anunciaba
   y que además escribe con identidad PRESTADA — lo que `probar_identidad_prestada.py` ya
   cerró para la disponibilidad.
   ✅ Por eso pregunta a la SESIÓN, como `_puedeCerrarMes_`: la cuenta admin —la que el
   servidor acepta hoy— o el rango >= 3 de quien ha entrado. Mirar como otro no hereda el
   permiso ni lo quita. Y quien no puede encolar lo LEE en el panel (abajo), no al pulsar.
   ⛔ NO se cambió la llamada a `crearConvocatoria`, aunque su gate sea el de esta cara: hace
   OTRA cosa. Crea el registro ya calculado y exige `dias`, `franjas` y `limite`, que salen de
   `calcular_convocatoria.py` con `reglas/convocatoria.py`. Llamarla desde aquí sería escribir
   el calendario en la cara, justo lo que este panel dice no hacer.
   ⚠️ La mitad que falta es del BACKEND, y hoy no se puede desplegar: que `setControl` acepte
   rango >= 3 para `convocar_disponibilidad` y `avisos_convocatoria`. */
function _puedeConvocarDisp_(){
  var yo = (typeof _actorSanc_==='function') ? _actorSanc_() : ((typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '');
  return _puedeImpersonar_() || rangoNom(yo) >= 3;
}

/* ═══ LA DISPONIBILIDAD DE LA SEMANA, PREPARADA POR LA RUTINA Y LANZADA POR EL PD (31/10) ═══════════════════════════
   🗣️ Daniel: *«Sola, la apruebo yo»*. `rutinas/convocar_semana.py` deja un BORRADOR en el CONTROL
   `disponibilidad_borrador` ({semana_ini, abre, limite, estado: preparada|lanzada|descartada}) y avisa al PD. Aquí se ve y
   se decide: **Lanzar** encola `convocar_disponibilidad` por `_encolarConvDisp_` —la MISMA puerta del botón de convocar
   a mano, no una segunda forma de montarla— y **Descartar** lo quita para esa semana. El plazo es el del calendario:
   lanzada tarde, abre al momento y NO se mueve. Sólo rango >= 3 (`_puedeConvocarDisp_`), como el botón. */
var CLAVE_DISP_BORR='disponibilidad_borrador';
var DISP_BORR=null;                    /* el borrador de la semana, o `null` (no hay / no se leyó) */

function _dispBorrDe_(c){
  /* ⛔ Cada entrada del control es `{valor, …}`, no el valor a secas (ver `AVISOS_ON`); y el valor puede llegar como cadena JSON. */
  var e=c && c[CLAVE_DISP_BORR], v=(e && typeof e==='object' && 'valor' in e) ? e.valor : e;
  if(typeof v==='string'){ try{ v=JSON.parse(v); }catch(x){ v=null; } }
  DISP_BORR=(v && typeof v==='object' && v.semana_ini) ? v : null;
}

/* La maqueta (`?demo`, sin sesión): un borrador cuya apertura es HOY a las 22:00, derivado del reloj de la app. Los
   rótulos «hoy HH:MM» van puestos a mano: en lo real los pone Python (`abre_txt`/`limite_txt`) — la cara no nombra días. */
function _borradorDemo_(){
  var w=_semanaDemo_(new Date(+new Date(_ahoraApp_().slice(0,10)+'T12:00')+86400000));
  return {semana_ini:w.dias[0], semana_fin:w.dias[6], abre:w.abre, limite:w.limite, estado:'preparada', avisado_at:null,
          abre_txt:'hoy '+w.abre.slice(11,16), limite_txt:'pasado mañana '+w.limite.slice(11,16)};
}

function _dispBorrFecha_(iso){ return new Date(String(iso||'').slice(0,16)); }
/* «jue 22:00»: lo dice Python (`convocatoria.dia_hora`), que es quien sabe el calendario; sin él, sólo la hora. */
function _dispDiaHora_(txt, iso){ return txt || String(iso).slice(11,16); }
function _dispDM_(iso){ var t=String(iso).slice(0,10).split('-'); return t[2]+'/'+t[1]; }
/* «31 h», «1 h 36 min», «10 min»: como `reglas/convocatoria.py:cuanto_queda` — por encima de 3 h se TRUNCA (equivocarse hacia
   «queda menos» cuesta darse prisa; hacia «queda más», llegar tarde). */
function _quedaTxt_(horas){
  var mins=Math.round(horas*60);
  if(mins<60) return Math.max(1,mins)+' min';
  if(horas<3) return Math.floor(mins/60)+' h'+(mins%60?' '+(mins%60)+' min':'');
  return Math.floor(horas)+' h';
}

/* `{tipo, horas}`: `preparada` (aún no abre), `abierta` (la hora de apertura ya pasó: se abre al lanzarla) o `caducada`. */
function _dispBorrEstado_(b, ahoraISO){
  var ahora=_dispBorrFecha_(ahoraISO), abre=_dispBorrFecha_(b.abre), lim=_dispBorrFecha_(b.limite);
  if(ahora>lim) return {tipo:'caducada', horas:0};
  if(ahora>=abre) return {tipo:'abierta', horas:(lim-ahora)/3600000};
  return {tipo:'preparada', horas:(lim-abre)/3600000};
}

/* La puerta ÚNICA que encola una convocatoria: el botón de convocar a mano y «Lanzar» de la tarjeta. */
function _encolarConvDisp_(o){
  var carga={
    semana:o.semana, tarde_partida:!!o.tarde_partida, horaria:!!o.horaria,
    /* ⛔ LA SESIÓN, NO `ACTOR` (643.ª): la cuenta admin ve este panel aunque «Actúe como» otra persona, y con `ACTOR`
       la convocatoria saldría pedida por quien está mirando — el «lo pide …» que leen en el móvil las personas convocadas. */
    por:(typeof _actorSanc_==='function') ? _actorSanc_() : ACTOR,
    at:new Date().toISOString()
  };
  if(o.sitios) carga.sitios=o.sitios;
  return api.setControl('convocar_disponibilidad', carga, 'convocatoria de disponibilidad para turnos');
}

function _borradorDispPanel_(){
  if(!_puedeConvocarDisp_()){ return ''; }
  if(DISP_BORR===null && !SESION && _demoLocal_()) DISP_BORR=_borradorDemo_();
  var b=DISP_BORR;
  if(!b || b.estado!=='preparada') return '';
  var st=_dispBorrEstado_(b, _ahoraApp_()), sem=_dispDM_(b.semana_ini);
  var chip=function(t,c){ return '<span class="chip"'+(c?' style="color:'+c+'"':'')+'>'+t+'</span>'; };
  var txt = st.tipo==='caducada'
    ? 'El plazo ya cerró y no se puede lanzar. Si todavía hace falta, convócala a mano más abajo.'
    : st.tipo==='abierta'
      ? 'Ya pasó la hora de apertura: se abre en cuanto la lances y el plazo no se mueve: quedan '+_quedaTxt_(st.horas)+' para contestar.'
      : 'Para todo el equipo. Se abre a su hora, con '+_quedaTxt_(st.horas)+' de plazo. Nadie la ve hasta que la lances.';
  return pan('Disponibilidad de la semana del '+sem,'espera tu visto bueno',
    '<div class="pb" data-dispborr="'+esc(b.semana_ini)+'">'+
      '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:11px">'+
        chip(st.tipo==='caducada'?'caducada':'preparada', st.tipo==='caducada'?'var(--warn)':'')+
        chip('abre '+_dispDiaHora_(b.abre_txt, b.abre))+chip('plazo '+_dispDiaHora_(b.limite_txt, b.limite))+'</div>'+
      '<p style="margin:0 0 12px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+txt+'</p>'+
      (st.tipo==='caducada' ? '' :
        '<div style="display:flex;gap:8px"><button class="btn pri" data-dispborr-lanzar>Lanzar</button>'+
        '<button class="btn" data-dispborr-descartar>Descartar</button></div>')+
    '</div>');
}

function _pinBorradorDisp_(m){
  var raiz=(m||document).querySelector('[data-dispborr]'); if(!raiz) return;
  var bl=raiz.querySelector('[data-dispborr-lanzar]'), bd=raiz.querySelector('[data-dispborr-descartar]');
  var sem=raiz.getAttribute('data-dispborr'), local=(!SESION && _demoLocal_());
  var puede=function(){
    if(!local && (typeof backendOK==='undefined' || !backendOK || !SESION)){ tost('Sin conexión no se puede.'); return false; }
    return true;
  };
  var marcar=function(estado){
    var nb=Object.assign({}, DISP_BORR, {estado:estado, decidido_por:(typeof _actorSanc_==='function') ? _actorSanc_() : ACTOR,
      decidido_at:new Date().toISOString()});
    return local ? Promise.resolve(nb) : api.setControl(CLAVE_DISP_BORR, nb, 'borrador '+estado).then(function(){ return nb; });
  };
  if(bl) bl.onclick=async function(){
    if(bl.disabled || !puede()) return;
    if(!(await dialogoSiNo('¿Lanzar la disponibilidad de la semana del '+_dispDM_(sem)+'? Se abre a todo el equipo.'))) return;
    bl.disabled=bd.disabled=true;
    try{
      if(!local) await _encolarConvDisp_({semana:sem, horaria:true});
    }catch(e){ bl.disabled=bd.disabled=false; tostErr('No se pudo lanzar: ', e); return; }
    try{
      DISP_BORR=await marcar('lanzada');
      tost('Lanzada. La rutina la monta en la siguiente pasada.');
    }catch(e){
      /* La convocatoria YA está encolada: sólo falló apuntar el borrador, y se dice (no se vuelve a encolar). */
      tostErr('Se lanzó, pero no se pudo apuntar: ', e);
    }
    pintar();
  };
  if(bd) bd.onclick=async function(){
    if(bd.disabled || !puede()) return;
    if(!(await dialogoSiNo('¿Descartar la disponibilidad de la semana del '+_dispDM_(sem)+'? No se volverá a preparar esa semana.'))) return;
    bl.disabled=bd.disabled=true;
    try{ DISP_BORR=await marcar('descartada'); tost('Descartada.'); }
    catch(e){ bl.disabled=bd.disabled=false; tostErr('No se pudo descartar: ', e); return; }
    pintar();
  };
}

/* ═══ LA COLA: SEMANAS MARCADAS POR ADELANTADO (31/10) ══════════════════════════════════════════════════════════════
   🗣️ Daniel: *«que semanas quiero que se pida fabricación por adelantado, sin necesidad de ir cada jueves a decidirlo [...]
   y si no quisiera podría haber quitado esa solicitud encolada antes»*. El PD marca/desmarca semanas (por su lunes) en el
   CONTROL `disponibilidad_cola` ({semanas:[{semana_ini, por, at, estado: marcada|enviada, enviada_at}]}); la rutina
   (`convocar_semana.py`) lanza sola las marcadas el día de su apertura y las apunta `enviada` (en pantalla, «mandada»).
   ⛔ MARCAR Y DESMARCAR LO DECIDE EL SERVIDOR (`marcarSemanaDisp`, rango 3, `convocar_semana.marcar_semana`): lee el control
   él mismo, no deja quitar una mandada ni pisa lo que apuntó la rutina, y devuelve la lista entera. La cara no escribe el
   control (sólo la maqueta `?demo`, que no tiene servidor). */
var CLAVE_DISP_COLA='disponibilidad_cola';
var DISP_COLA=null;                    /* {semanas:[…]}, o `null` (no hay / no se leyó) */
/* Cuándo abre cada semana lo DICE el servidor (`reglas/convocatoria.py`, calculado al servir): llega en el mismo control,
   como `disponibilidad_cola_aperturas` = {valor:{'AAAA-MM-DD (lunes)': {abre, txt}}}. La cara no sabe qué día ni a qué hora
   abre una semana: pinta `txt`. ⛔ Sin él (backend viejo, demo) NO inventa una hora. */
var CLAVE_DISP_APERT='disponibilidad_cola_aperturas';
var DISP_APERT=null;
var COLA_SEMANAS=10;

function _dispColaVal_(c){
  var e=c && c[CLAVE_DISP_COLA], v=(e && typeof e==='object' && 'valor' in e) ? e.valor : e;
  if(typeof v==='string'){ try{ v=JSON.parse(v); }catch(x){ v=null; } }
  return (v && typeof v==='object' && Array.isArray(v.semanas)) ? v : null;
}
function _dispColaDe_(c){
  var e=c && c[CLAVE_DISP_APERT], v=(e && typeof e==='object' && 'valor' in e) ? e.valor : e;
  DISP_COLA=_dispColaVal_(c);
  DISP_APERT=(v && typeof v==='object' && !Array.isArray(v)) ? v : null;
}
function _colaMarca_(cola, sem){
  var l=(cola && cola.semanas) || [], i;
  for(i=0;i<l.length;i++) if(l[i] && l[i].semana_ini===sem) return l[i];
  return null;
}
/* «el jueves 05/11 a las 22:00»: la apertura de la semana que empieza el lunes `sem`, tal como la rotula el servidor. */
function _colaAbreTxt_(sem){
  var a=DISP_APERT && DISP_APERT[sem], t=(a && typeof a==='object') ? a.txt : '';
  return (typeof t==='string' && t) ? t : 'el día que abra';
}
/* La maqueta: una semana ya enviada y dos marcadas, derivadas del reloj de la app. */
function _colaDemo_(){
  var l=_lunesDesde_(_ahoraApp_().slice(0,10), COLA_SEMANAS), p=function(s,e){ return {semana_ini:s, por:'Daniel', at:'2026-10-20T10:00', estado:e}; };
  DISP_APERT={}; DISP_APERT[l[2]]={txt:'el día de su apertura (maqueta)'}; DISP_APERT[l[4]]={txt:'el día de su apertura (maqueta)'};
  return {semanas:[p(l[0],'enviada'), p(l[2],'marcada'), p(l[4],'marcada')]};
}

function _colaDispPanel_(){
  if(!_puedeConvocarDisp_()){ return ''; }
  if(DISP_COLA===null && !SESION && _demoLocal_()) DISP_COLA=_colaDemo_();
  var lunes=_lunesDesde_(_ahoraApp_().slice(0,10), COLA_SEMANAS), cola=DISP_COLA, marcadas=[], chips='';
  lunes.forEach(function(sem){
    var m=_colaMarca_(cola, sem), env=!!(m && m.estado==='enviada'), on=!!m;
    if(on && !env) marcadas.push(sem);
    var col=env ? 'var(--ok)' : on ? 'var(--red2)' : 'var(--ink2)';
    chips+='<button class="btn" data-dispcola="'+esc(sem)+'"'+(env?' disabled':'')+' aria-pressed="'+(on?'true':'false')+'" style="'+
      'min-width:112px;padding:9px 12px;display:flex;flex-direction:column;align-items:center;gap:3px;'+
      'color:'+col+';border-color:'+(on ? col : 'var(--line2)')+';background:'+(env ? 'rgba(62,180,137,.08)' : on ? 'rgba(228,30,37,.09)' : 'transparent')+'">'+
      '<span style="font-size:13px;font-weight:600">del '+esc(_dispDM_(sem))+' al '+esc(_dispDM_(_isoMasDias_(sem, 6)))+'</span>'+
      '<span style="font-family:var(--mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase">'+(env ? 'mandada' : on ? 'marcada' : 'sin marcar')+'</span></button>';
  });
  var lineas=marcadas.map(function(sem){
    return '<div style="font-size:12.5px;color:var(--ink2);line-height:1.7">Semana del <b>'+esc(_dispDM_(sem))+'</b> · se pedirá sola '+esc(_colaAbreTxt_(sem))+'</div>';
  }).join('');
  return pan('Semanas por adelantado','se piden solas',
    '<div class="pb" data-dispcola-panel>'+
      '<p style="margin:0 0 12px;font-size:12.5px;color:var(--ink2);line-height:1.6">Las semanas que marques se piden solas, sin esperar tu visto bueno. '+
      'Puedes quitarlas hasta que salgan.</p>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'+chips+'</div>'+
      (lineas || '<div style="font-size:12.5px;color:var(--ink3)">Ninguna marcada: cada semana te espera como borrador.</div>')+
    '</div>');
}

function _pinColaDisp_(m){
  var raiz=(m||document).querySelector('[data-dispcola-panel]'); if(!raiz) return;
  var local=(!SESION && _demoLocal_());
  raiz.querySelectorAll('[data-dispcola]').forEach(function(b){
    b.onclick=async function(){
      if(b.disabled) return;
      if(!local && (typeof backendOK==='undefined' || !backendOK || !SESION)){ tost('Sin conexión no se puede.'); return; }
      var sem=b.getAttribute('data-dispcola'), yo=(typeof _actorSanc_==='function') ? _actorSanc_() : ACTOR;
      raiz.querySelectorAll('[data-dispcola]').forEach(function(x){ x.disabled=true; });
      try{
        var m0=_colaMarca_(DISP_COLA, sem), nueva;
        if(local){                          /* la maqueta no tiene servidor: sólo ella marca a mano */
          var lista=((DISP_COLA && DISP_COLA.semanas) || []).filter(function(e){ return e && e.semana_ini!==sem; });
          if(!m0) lista.push({semana_ini:sem, por:yo, at:_ahoraApp_().slice(0,16), estado:'marcada'});
          lista.sort(function(a,c){ return a.semana_ini<c.semana_ini ? -1 : 1; });
          nueva={semanas:lista};
        }else{
          var r=await api.marcarSemanaDisp(sem, !m0);
          nueva={semanas:(r && Array.isArray(r.semanas)) ? r.semanas : []};
        }
        DISP_COLA=nueva;
        tost(m0 ? 'Quitada: no se pedirá sola.' : 'Marcada: se pedirá sola.');
      }catch(e){
        tostErr('No se pudo guardar: ', e);
        /* una mandada o un cambio ajeno: se vuelve a mirar lo que hay para no seguir pintando algo que ya no es verdad */
        if(!local){ try{ _dispColaDe_(await api.getControl()); }catch(x){ /* sin releer, lo que hay */ } }
      }
      pintar();
    };
  });
}

function _convocarDispPanel_(){
  if(!_puedeConvocarDisp_()) return '';
  /* 🟡 R4 (refutador 26): lo que se PINTA del interruptor. 'leyendo' sin sesión no es «leyendo»: nadie va a preguntar. */
  var _ae = (AVISOS_EST==='leyendo' && (typeof SESION==='undefined' || !SESION)) ? 'sinsesion' : AVISOS_EST;
  /* ⛔⛔ AQUÍ HABÍA UNA SEGUNDA GUARDA, Y SE RETIRA PORQUE YA NO ES VERDAD (643.ª → 758.ª).
     Decía «solo con la cuenta admin» y era cierta: `setControl` exigía `admin` para cualquier
     control, así que con la cuenta del PD el botón siempre fallaba y se avisaba antes de
     pulsarlo. El 02/10 la 758.ª abrió esa puerta —`CONTROLES_PD` + `_rangoEscritorio_() >= 3`,
     y `convocar_disponibilidad` está en la lista—, pero **se hizo sólo la mitad de servidor**:
     esta guarda siguió tapando el formulario a la única persona a la que el permiso nuevo iba
     dirigido. Desplegar no habría bastado. *Una guarda ciega puede proteger algo YA IMPOSIBLE.*
     ⚠️ No se abre a nadie más: `_puedeConvocarDisp_` ya exige **rango >= 3**, que es la misma
     condición que mira el servidor. José (2) y los coordinadores (1) siguen sin ver el panel.
     ⛔ ORDEN: esta cara sólo puede llegar a producción **después** de desplegar el backend. Al
     revés, el botón sale y el servidor lo rechaza, que es el defecto de partida del revés. */
  var E=CAMPO_CSS;
  /* 01/11 (escergo): un texto que empieza por «?» es una pregunta Sí/No: en legible (sans, sin mayúsculas) y en rejilla, cada una sobre su Sí/No, no una fila de
     etiquetas mono a lo largo de 1.500 px con la más larga empujando a las demás. */
  var lab=function(t){ return t.charAt(0)==='?' ? '<span style="display:block;margin-bottom:6px;color:var(--ink2);font-size:12.5px">'+t.slice(1)+'</span>'
    : '<span class="sc" style="display:block;margin-bottom:5px">'+t+'</span>'; };
  return _borradorDispPanel_()+_colaDispPanel_()+pan('Convocar disponibilidad','abre el plazo · solo dirección',
    '<div class="pb">'+
    '<p style="margin:0 0 12px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
      'Elige cualquier día de la semana que quieras preguntar: se pregunta de lunes a domingo. '+
      'El plazo se calcula solo.</p>'+
    '<div style="margin-bottom:14px">'+
      '<div>'+lab('Semana (cualquier día)')+nxFecha('cdSemana', '')+'</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px 24px;align-items:start;margin-bottom:13px">'+
      '<div style="font-size:12.5px">'+lab('?CUVI')+nxSiNo('cdCuvi', true)+'</div>'+
      '<div style="font-size:12.5px">'+lab('?CITI')+nxSiNo('cdCiti', true)+'</div>'+
      '<div style="font-size:12.5px">'+lab('?La tarde va partida (16:00 / 18:00)')+nxSiNo('cdTarde', false)+'</div>'+
      /* ⛔ EL MODO LO ELIGE QUIEN CONVOCA, no quien programa. Era `horaria=False` en la
         firma de `montar`: una constante en Python, o sea que preguntar por horas
         dependia de que alguien tocara el codigo. La etiqueta dice lo que CAMBIA
         -«un toque marca 4 h»- y no el nombre del modo, que no le dice nada a nadie. */
      '<div style="font-size:12.5px">'+lab('?Preguntar por horas (09:00–14:00 y 15:00–23:00); un toque marca el turno de 4 h')+
        nxSiNo('cdHoraria', true)+'</div>'+
    '</div>'+
    '<button class="btn" data-convdisp>Convocar disponibilidad</button>'+
    '<div class="nota" id="cdNota">Se encola y la rutina lo recoge en la siguiente pasada. '+
      'Lo que salga —los días, el plazo y a quién se convoca— aparecerá arriba.</div>'+
    /* ⛔ EL INTERRUPTOR DE LOS AVISOS, aquí y no en un fichero de Python. Estos avisos
       llegan al MÓVIL de 23 personas: encenderlos no es decisión de quien programa —
       pero tampoco tiene por qué ser un mensaje pidiéndolo, que convierte una decisión
       suya en una espera. Nace APAGADO.
       ⚠️ Y la nota dice qué pasa mientras está apagado: la rutina **sigue calculando**
       y dejando en la bitácora el texto exacto que mandaría. Encenderlo no es un salto
       a ciegas. */
    '<div class="sep"></div>'+
    '<div style="font-size:12.5px"><b style="display:block;margin-bottom:5px">Mandar los avisos al móvil</b>'+
      nxSiNo('cdAvisos', AVISOS_ON, {off:_ae!=='ok'})+'</div>'+
    /* 22/10 (auditor 26, 🟡 11): sin saber lo que hay guardado, la casilla no se toca y se dice por qué. */
    (_ae==='error' ? '<div class="nota" data-avisosest="error">'+ico('aviso')+' No se pudo leer si están encendidos: '+
       'la casilla vacía no quiere decir que estén apagados. Recarga para volver a mirar.</div>' :
     _ae==='sinsesion' ? '<div class="nota" data-avisosest="sinsesion">Sin sesión no se puede saber si están encendidos.</div>' :
     _ae==='leyendo' ? '<div class="nota" data-avisosest="leyendo">Leyendo si están encendidos…</div>' : '')+
    '<div class="nota" id="cdAvNota">Apagado, la rutina sigue calculando y deja escrito '+
      'lo que mandaría, pero no sale nada. Encendido, avisa al abrir, a las 24 h, '+
      'a las 3 h y a los 10 min (el recordatorio, solo a quien no ha contestado) y '+
      'al cerrarse el plazo, a todo el equipo.</div>'+
    '</div>');
}

function _engAvisosConv_(m){
  var c=(m||document).querySelector('#cdAvisos'); if(!c) return;
  c.onchange=async function(){
    var on=nxSi(c);
    /* ⛔ SE CONFIRMA AL ENCENDER, no al apagar. Encender manda notificaciones al movil de 23
       personas; apagar no le llega a nadie. Preguntar en los dos casos entrena a decir que si
       sin leer, que es como se acaba mandando algo sin querer. */
    if(on && !(await dialogoSiNo('Vas a ENCENDER los avisos de la convocatoria.'+String.fromCharCode(10,10)+
      'A partir de ahora salen notificaciones al movil del equipo: al abrir la disponibilidad, '+
      'a las 24 h, a las 3 h y a los 10 minutos del cierre.'+String.fromCharCode(10,10)+
      'El recordatorio solo le llega a quien no ha contestado. Y al cerrarse el plazo sale otro a todo el equipo. '+
      'Sigo?'))){ nxPon('cdAvisos','0'); return; }
    _nxOff_(c, true);
    try{
      await api.setControl(INTERRUPTOR_AVISOS, on, on?'avisos ENCENDIDOS':'avisos apagados');
      AVISOS_ON=on;
      tost(on?'Avisos encendidos.':'Avisos apagados. La rutina sigue calculando sin mandar.');
    }catch(e){
      /* ⛔ Si no se pudo guardar, la casilla VUELVE a donde estaba: dejarla marcada diria que
         los avisos estan encendidos cuando el servidor no se ha enterado. */
      nxPon('cdAvisos', on?'0':'1'); tostErr('No se pudo: ', e);       // 🟠 2 (auditor 19)
    }finally{ _nxOff_(c, false); }
  };
}

function _pinConvDisp_(m){
  _engAvisosConv_(m);
  _pinBorradorDisp_(m);
  _pinColaDisp_(m);
  var b=(m||document).querySelector('[data-convdisp]'); if(!b) return;
  b.onclick=async function(){
    if(b.disabled) return;
    var sem=(document.getElementById('cdSemana')||{}).value||'';
    if(!sem){ tost('Elige una semana.'); return; }
    var sitios=[];
    if(nxSi('cdCuvi')) sitios.push('cuvi');
    if(nxSi('cdCiti')) sitios.push('citi');
    /* ⛔ Sin sitio no se convoca: una convocatoria sin dónde no se puede contestar, y dejarla
       salir vacía sería el mismo fallo mudo de siempre. */
    if(!sitios.length){ tost('Marca al menos un sitio (CUVI o CITI).'); return; }
    /* 31/10 (pasada de usuario, fila 6): primero lo que FALTA (semana, sitio) y sólo después la conexión: el aviso de «sin
       conexión» tapaba que no habías puesto fecha. */
    if(typeof backendOK==='undefined' || !backendOK || !SESION){
      tost('Sin conexión no se puede convocar.'); return; }
    if(!(await dialogoSiNo('¿Abrir la disponibilidad de la semana del '+_isoADMY_(sem)+'?'))) return;   /* refutar5: prosa en DD/MM/AAAA */
    b.disabled=true; var prev=b.textContent; b.textContent='Encolando…';
    try{
      await _encolarConvDisp_({semana:sem, tarde_partida:nxSi('cdTarde'),
        /* ⛔ EL MODO LO ELIGE QUIEN CONVOCA. Era `horaria=False` en la firma de `montar`,
           o sea una constante que solo se podia cambiar tocando el codigo — y si la
           próxima semana se pregunta por horas o por medias tardes no es una decisión de quien
           programa. Aquí es una casilla y viaja en el encargo. */
        horaria:nxSi('cdHoraria'), sitios:sitios});
      tost('Encolado. La rutina lo recoge en la siguiente pasada.');
      var n=document.getElementById('cdNota');
      if(n) n.innerHTML='Encolado para la semana del '+esc(_isoADMY_(sem))+'. El plazo lo calcula '+
        'el servidor; cuando lo procese, la convocatoria aparece arriba.';
    }catch(e){
      tostErr('No se pudo encolar: ', e);       // 🟠 2 (auditor 19)
    }finally{
      b.disabled=false; b.textContent=prev;
    }
  };
}

/* ⛔ UN COCHE ES UN TRAYECTO. Se pinta «Coche 1», «Coche 2»... con `_etiquetaCoche_`, que va
   en base 1 porque nadie dice «Coche 0».
   ⚠️ La casilla de la vuelta sale APAGADA por defecto y eso no es un detalle: un interruptor
   encendido de fabrica se acaba dejando puesto, y entonces la mitad de los turnos tendrian una
   vuelta inventada. Solo cuando se enciende aparecen sus dos campos. */
/* Nombre corto para el chip: «Enfrente del Politécnico (parada de autobús)» ocupaba dos filas. El catálogo
   (`PUNTOS_TURNO`) no se toca: son tres copias idénticas (navegador, Python, servidor) y esto es sólo de la pantalla. */
var _PUNTO_CORTO_ = {'poli-ou':'Politécnico (parada)'};
function _opcionesPunto_(sel){
  return PUNTOS_TURNO.map(function(p){ return [p.id, (_PUNTO_CORTO_[p.id] || p.nombre)+' · '+p.ciudad]; });
}

/* Un lugar del trayecto: su rótulo y sus chips, en una columna de la fila de dos. */
function _cocheLugar_(rotulo, attr, i, val){
  return '<div class="coche-c"><span class="coche-r">'+rotulo+'</span>'+
    nxElige('', _opcionesPunto_(), val||'', {attrs:attr+'="'+i+'"'})+'</div>';
}

function pintarCoches(){
  var c = document.getElementById('tuCoches');
  if(!c) return;
  if(!TUR_COCHES.length){
    c.innerHTML = '<p style="margin:0;font-size:12px;color:var(--ink3)">Sin coches. '+
      'Un turno en Vigo no suele necesitar ninguno.</p>';
    return;
  }
  c.innerHTML = TUR_COCHES.map(function(co, i){
    /* ⚠️ Se avisa si el trayecto NO cruza de ciudad: no se impide -puede haber un coche
       dentro de la misma ciudad- pero conviene verlo, porque es lo que decide si el turno
       «contempla el trayecto Ourense-Vigo». */
    var cruza = _trayectoCruzaCiudad_(co.origen, co.destino);
    var nota = (cruza === false)
      ? '<span class="chip">mismo municipio</span>' : '';
    /* 01/11 (Daniel: «esta estetica es horripilante»): cada coche es UNA TARJETA con su cabecera; ida y vuelta en
       fila de dos; y la pregunta lleva su Sí/No pegado. ⛔ «Igual que la ida» = Sí por defecto: sólo si dice No
       aparecen «Vuelve desde / Vuelve a» (el dato guardado sigue siendo `vueltaDistinta`). */
    return '<div class="coche" data-coche-i="'+i+'">'+
      '<div class="coche-cab">'+
        '<b>'+esc(_etiquetaCoche_(i))+'</b>'+nota+
        '<button type="button" class="mini" data-quitacoche="'+i+'">quitar</button>'+
      '</div>'+
      '<div class="coche-par">'+
        _cocheLugar_('Sale de', 'data-co-org', i, co.origen)+
        _cocheLugar_('Va a', 'data-co-dst', i, co.destino)+
      '</div>'+
      '<div class="coche-pre"><span>¿La vuelta es igual que la ida?</span>'+
        nxSiNo('', !co.vueltaDistinta, {attrs:'data-co-vd="'+i+'"'})+'</div>'+
      (co.vueltaDistinta
        ? '<div class="coche-par">'+
            _cocheLugar_('Vuelve desde', 'data-co-vorg', i, co.vueltaOrigen)+
            _cocheLugar_('Vuelve a', 'data-co-vdst', i, co.vueltaDestino)+
          '</div>'
        : '')+
      _gentePorCoche_(co, i)+
    '</div>';
  }).join('');
  cablearCoches();
}


/* ═══ QUIEN CONDUCE Y QUIEN VA (754.ª, 01/10) ════════════════════════════════════
   Daniel: *«que haya una opción de poner quién es el que conduce, quién lleva el coche. Y
   luego sumarle pasajeros»*, *«que puedas arrastrarlos de un coche a otro, ¿sabes? Y que sea
   fácil»*.

   ⛔ EL DUEÑO ES EL CONDUCTOR — *«se supone q el conductor es el dueño del coche»* —, así que
   NO hay un campo `conductor` aparte: el coche es de alguien y ese alguien conduce.
   ⛔ Y SOLO SALE GENTE DEL TURNO: la lista de candidatos es `TUR_SEL`, que es quien va. El
   servidor filtra igual (`_cochesDeTurno_` valida contra el reparto), así que ofrecer a quien
   no va sería prometer algo que el backend va a tirar.
   ⚠️ Quien ya va en OTRO coche no se ofrece: estar en dos coches a la vez no es un estado
   posible, y dejarlo elegir obliga a decidir después cuál vale. */
function _enOtroCoche_(nombre, salvo){
  var k, co;
  for(k = 0; k < TUR_COCHES.length; k++){
    if(k === salvo) continue;
    co = TUR_COCHES[k] || {};
    if(co.dueno === nombre) return true;
    if(_llevaA_(co.pasajeros, nombre)) return true;
  }
  return false;
}

/* Sin `Array.indexOf` por lo mismo que el backend: el arnés de los bancos corre bajo
   JScript (ES3) y no lo lleva. Usarlo dejaría esto sin poder probarse. */
function _llevaA_(lista, nombre){
  var k, L = lista || [];
  for(k = 0; k < L.length; k++) if(L[k] === nombre) return true;
  return false;
}

function _gentePorCoche_(co, i){
  var libres = [], n, nn = Object.keys(TUR_SEL);
  for(n = 0; n < nn.length; n++){
    if(nn[n] === co.dueno) continue;
    if(_llevaA_(co.pasajeros, nn[n])) continue;
    if(_enOtroCoche_(nn[n], i)) continue;
    libres.push(nn[n]);
  }
  /* 01/11: «Lo lleva» es el selector de personas de la casa (el de «Convocados», con «Ver lista»): uno solo, y vacío
     es «Sin conductor todavía» en gris. ⛔ Nunca un chip «– nadie –» marcado, que parecía una opción elegida. */
  var cand = co.dueno ? [co.dueno].concat(libres) : libres;
  var idSel = 'cochedue'+i;

  /* ⚠️ Cada pasajero es `draggable` Y lleva su botón de quitar: arrastrar es el ATAJO, no el
     único camino. En un móvil o con el teclado no hay arrastre, y una función que sólo se
     alcanza arrastrando no la tiene quien no puede arrastrar. */
  var chips = '';
  var ps = co.pasajeros || [];
  for(n = 0; n < ps.length; n++)
    chips += '<span class="chip" draggable="true" data-pas-de="'+i+'" '+
             'data-pas-quien="'+esc(ps[n])+'" style="cursor:grab">'+esc(ps[n])+
             ' <button type="button" class="mini" data-quitapas="'+i+'" '+
             'data-quien="'+esc(ps[n])+'">×</button></span>';
  if(!ps.length) chips = '<span class="coche-vacio">nadie todavía</span>';

  var sobran = [];
  for(n = 0; n < libres.length; n++) sobran.push([libres[n], libres[n]]);

  /* Sin clase propia: `cochegente` no existe en `escritorio.css` y una clase que llega
     sin regla no da error -- el elemento sale, ocupa sitio y no se parece a nada. Lo
     canto `probar_clases_escritorio.py`. El gancho es `data-coche-caja`, que ya esta. */
  return '<div data-coche-caja="'+i+'" class="coche-gente">'+
    '<div class="coche-c" data-coche-due="'+i+'"><span class="coche-r">Lo lleva</span>'+
      elegirPersonas(idSel, {universo:cand, marcadas:co.dueno ? [co.dueno] : [], multi:false, titulo:'Quién lleva el coche',
        vacio:'Sin conductor todavía', alCambiar:function(m){ _cocheDuenoPoner_(i, m[0]); }})+'</div>'+
    '<div class="coche-c"><span class="coche-r">Van con él</span>'+
      '<div data-coche-pas="'+i+'" class="coche-pas">'+chips+'</div></div>'+
    (libres.length
      ? '<div class="coche-c"><span class="coche-r">Añadir a alguien</span>'+nxElige('', sobran, '', {attrs:'data-coche-add="'+i+'"'})+'</div>'
      : '')+
  '</div>';
}
/* Quien lleva el coche cambió (el selector de personas avisa): se guarda y se repinta, que los demás coches recalculan
   a quién ofrecen. ⛔ Si el nuevo dueño iba de pasajero en SU PROPIO coche, se le quita de la lista: el servidor lo filtra
   igual, y dejarlo aquí enseñaría a alguien dos veces en el mismo coche hasta convocar. */
function _cocheDuenoPoner_(i, quien){
  var co = TUR_COCHES[i]; if(!co) return;
  co.dueno = quien || null;
  if(co.dueno) co.pasajeros = (co.pasajeros || []).filter(function(p){ return p !== co.dueno; });
  pintarCoches();
}

function cablearCoches(){
  $$('#tuCoches [data-co-org]').forEach(function(el){
    el.onchange = function(){ TUR_COCHES[+el.dataset.coOrg].origen = el.value; pintarCoches(); }; });
  $$('#tuCoches [data-co-dst]').forEach(function(el){
    el.onchange = function(){ TUR_COCHES[+el.dataset.coDst].destino = el.value; pintarCoches(); }; });
  $$('#tuCoches [data-co-vorg]').forEach(function(el){
    el.onchange = function(){ TUR_COCHES[+el.dataset.coVorg].vueltaOrigen = el.value; }; });
  $$('#tuCoches [data-co-vdst]').forEach(function(el){
    el.onchange = function(){ TUR_COCHES[+el.dataset.coVdst].vueltaDestino = el.value; }; });
  $$('#tuCoches [data-co-vd]').forEach(function(el){
    el.onchange = function(){
      var co = TUR_COCHES[+el.dataset.coVd];
      co.vueltaDistinta = !nxSi(el);       /* la pregunta es «¿igual que la ida?»: Sí = no distinta */
      /* ⚠️ Al APAGARLA se borran sus campos: dejarlos puestos manda una vuelta que la
         casilla dice que no existe, y el backend no sabria cual de las dos creer. */
      if(!co.vueltaDistinta){ co.vueltaOrigen = null; co.vueltaDestino = null; }
      pintarCoches();
    }; });
  /* ═══ QUIEN CONDUCE Y QUIEN VA (754.ª) ══════════════════════════════════════
     ⚠️ Todo repinta al final: `pintarCoches` recalcula quién queda libre en CADA coche, y
     sin repintar los desplegables de los demás seguirían ofreciendo a alguien que acaba de
     subirse a otro. */
  $$('#tuCoches [data-coche-add]').forEach(function(el){
    el.onchange = function(){
      if(!el.value) return;
      var co = TUR_COCHES[+el.dataset.cocheAdd];
      co.pasajeros = co.pasajeros || [];
      if(!_llevaA_(co.pasajeros, el.value)) co.pasajeros.push(el.value);
      pintarCoches();
    }; });
  $$('#tuCoches [data-quitapas]').forEach(function(b){
    b.onclick = function(ev){
      ev.stopPropagation();          // el chip entero es arrastrable; el botón no arrastra
      var co = TUR_COCHES[+b.dataset.quitapas];
      co.pasajeros = (co.pasajeros || []).filter(function(p){ return p !== b.dataset.quien; });
      pintarCoches();
    }; });

  /* ⛔ EL ARRASTRE, que él pidió dos veces («y que sea fácil»). Es el ATAJO: lo mismo se hace
     con el desplegable y la ✕, porque en un móvil no hay `dragstart` y una función que sólo
     se alcanza arrastrando no la tiene quien no puede arrastrar.
     ⚠️ Se mueve, no se copia: se quita del coche de origen ANTES de meterlo en el destino, y
     soltar en el mismo coche no hace nada. */
  $$('#tuCoches [data-pas-de]').forEach(function(el){
    el.ondragstart = function(ev){
      try { ev.dataTransfer.setData('text/plain',
              el.dataset.pasDe + '|' + el.dataset.pasQuien); } catch(_e){}
    }; });
  $$('#tuCoches [data-coche-caja]').forEach(function(caja){
    caja.ondragover = function(ev){ ev.preventDefault(); };
    caja.ondrop = function(ev){
      ev.preventDefault();
      var dato = ''; try { dato = ev.dataTransfer.getData('text/plain') || ''; } catch(_e){}
      var corte = dato.indexOf('|');
      if(corte < 0) return;
      var de = +dato.slice(0, corte), quien = dato.slice(corte + 1);
      var a = +caja.dataset.cocheCaja;
      if(de === a || !quien) return;
      var orig = TUR_COCHES[de], dest = TUR_COCHES[a];
      if(!orig || !dest) return;
      orig.pasajeros = (orig.pasajeros || []).filter(function(p){ return p !== quien; });
      dest.pasajeros = dest.pasajeros || [];
      /* ⚠️ Nadie va de pasajero en el coche que conduce: si lo sueltas en el suyo, se queda
         fuera en vez de aparecer dos veces. El servidor aplica la misma regla. */
      if(dest.dueno !== quien && !_llevaA_(dest.pasajeros, quien)) dest.pasajeros.push(quien);
      pintarCoches();
    }; });
  $$('#tuCoches [data-quitacoche]').forEach(function(b){
    b.onclick = function(){ TUR_COCHES.splice(+b.dataset.quitacoche, 1); pintarCoches(); }; });
}

/* ═══ CERRAR UN TURNO Y DECLARAR EL TIEMPO EXTRA ═════════════════════════════════
   Daniel (15/08): *«el responsable de turno le da a un boton, se valida, y hay un campo para
   rellenar si hubo tiempo extra a partir de las cuatro horas»*.

   ⛔ DOS GESTOS EN UNA PANTALLA, y es a proposito: **confirmar quien fue de verdad** (el papel
   que `CARGOS_TURNO` ya le daba al responsable) y **repartir el extra**. Separarlos obligaria a
   entrar dos veces al mismo turno para decir cosas sobre las mismas personas.
   ⛔ Y EL EXTRA SE EDITA FILA A FILA porque el ejemplo de Daniel lo exige: *«a lo mejor es
   tiempo extra que no le cuenta a alguien que vive cerca, pero si a alguien que vive lejos»*.
   Un solo campo por turno reparte a partes iguales, que es justo lo que ese ejemplo descarta.
   ⚠️ NO ESCRIBE EN NOTION. Deja la propuesta a la vista para aplicarla: escribir en Notion
   exige el visto bueno de Daniel **cada vez**, y son los puntos de personas reales. */
/* 26/10 (refutador 37, 🟡 4): la misma puerta que `e_estado_turno` para «Cancelado»: el PD siempre; el resto, sólo un
   turno de hoy (los de la lista ya no son futuros). Sin fecha legible, no: el servidor tampoco lo sabría. */
function _puedeCancelarTurno_(t){
  if(typeof rangoNom === 'function' && typeof _actorSanc_ === 'function' && rangoNom(_actorSanc_()) >= 3) return true;
  var iso = t ? String(_dmyAISO_(t.f || t.fecha || '') || '') : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso >= String(_ahoraApp_()).slice(0,10);
}
function _turnosCerrables_(){
  /* 21/10 (auditor 20, 🟡 5): el reloj de la APP; en real es el mismo día local que antes. */
  var out = [], hoy = String(_ahoraApp_()).slice(0,10);
  /* ⛔ CLAVES, NO POSICIONES. `escritorio.html` rellena `TURNOS` EN SITIO en sus dos
     cargas (`TURNOS.length=0; t.forEach(push)`), asi que un indice guardado sobrevive al
     refresco apuntando a OTRO turno -- y esto es justo lo que viaja al `value` del
     `<option>` y vuelve por el `onchange`. */
  (typeof TURNOS !== 'undefined' ? TURNOS : []).forEach(function(t){
    if(_puedeCerrarTurno_(t, ACTOR) && _turnoCerrable_(t, hoy)) out.push(_claveTurno_(t));
  });
  return out;
}

/* El turno que lleva esa clave, o `null`. Si dos la comparten se devuelve el primero:
   el desplegable pinta esos mismos tres campos, asi que la persona tampoco puede
   distinguirlos -- y elegir el primero es lo unico que se puede hacer sin inventar. */
function _turnoDeClave_(k){
  var l = (typeof TURNOS !== 'undefined' ? TURNOS : []);
  if(k == null) return null;
  for(var i=0;i<l.length;i++) if(_claveTurno_(l[i]) === k) return l[i];
  return null;
}

/* ⛔⛔ EL TURNO QUE SE ESTA CERRANDO, BUSCADO POR CLAVE Y VUELTO A AUTORIZAR.
   Antes esto era `l[CIERRE_TUR.i]`: la POSICION guardada. Con el refresco rellenando
   `TURNOS` en sitio, esa posicion pasa a apuntar a otro turno mientras `quien`, `extra` y
   `dur` siguen con lo tecleado para el anterior -- y el reparto de horas se manda contra
   quien no era, sin un solo error a la vista.
   ⛔ Y SE VUELVE A PREGUNTAR `_puedeCerrarTurno_`: entre dos refrescos el responsable
   puede cambiar, y un turno que ya no es tuyo no se cierra. Preguntarlo solo al pintar la
   lista deja la decision congelada en el momento del primer render. */
function _cierreTurSel_(){
  var l = (typeof TURNOS !== 'undefined' ? TURNOS : []);
  if(CIERRE_TUR.k == null) return null;
  for(var i=0;i<l.length;i++){
    if(_claveTurno_(l[i]) === CIERRE_TUR.k)
      return _puedeCerrarTurno_(l[i], ACTOR) ? l[i] : null;
  }
  return null;
}

/* El techo, el tramo y el «falta la duración» son de `comun.js` (`_cierreTope_`, `_cierreSinDur_`; el tramo, `_cierreTramo_`, lo manda `_cierreEnviar_`): el móvil cierra con las mismas. */
function _cierreTurTope_(){ return _cierreTope_(CIERRE_TUR); }
function _cierreTurSinDur_(){ return _cierreSinDur_(CIERRE_TUR); }

/* Lo que se mandaría: `_cierreMapa_` (comun.js), con el estado de esta pantalla. */
function _cierreTurMapa_(){ return _cierreMapa_(_cierreTurSel_(), CIERRE_TUR); }

/* 26/10 (triaje C4a/C4b): lo que queda a la vista tras cerrar o cancelar — el turno ya NO es cerrable y saldría de la
   lista, pero la propuesta para Compensaciones es lo que se aplica: no puede desaparecer con él. */
function _cierreTurListoHTML_(){
  var l = CIERRE_TUR.listo;
  if(!l) return '';
  return '<div class="nota" style="margin-bottom:11px"><b>'+esc(l.titulo)+'</b>'+
    (l.aviso ? '<div>'+esc(l.aviso)+'</div>' : '')+
    (l.txt ? '<pre class="mono" style="white-space:pre-wrap;font-size:12px;margin:8px 0 0">'+esc(l.txt)+'</pre>' : '')+
    '</div>';
}

function _cierreTurnoPanel_(){
  var cerrables = _turnosCerrables_(), listo = _cierreTurListoHTML_();
  if(!cerrables.length) return listo ? pan('Cerrar un turno', 'hecho', listo) : '';
  if(CIERRE_TUR.k == null || cerrables.indexOf(CIERRE_TUR.k) < 0) CIERRE_TUR.k = cerrables[0];

  var t = _cierreTurSel_(), firmes = _asistentesTurno_(t), tope = _cierreTurTope_();
  var resp = _responsableTurno_(t);
  /* ⛔ LOS DUDOSOS TAMBIEN SALEN. `_asistentesTurno_` filtra por `_esFirmeRol_`, asi que
     quien figuraba como `Posible` o `Reserva` **y al final fue** no tenia fila: el
     responsable no podia darle ni su hora extra ni su turno. `comun.js` ya lo dice —«no
     se les quita de la lista: el responsable es quien sabe si al final vinieron»—, y
     `_dudososTurno_` existe desde el 17/08 **sin que la llamara nadie**.
     ⚠️ `_cierreTurnoInicial_` NO se usa a proposito: recibe `durH` y congela el tope de
     ese instante, pero aqui la duracion empieza VACIA y se teclea despues — sembrar con
     ella daria todo a 0 en la primera pintada. Este panel recalcula el tope en cada
     render, y eso es lo que hay que conservar. */
  var dud = _dudososTurno_(t), esDud = {};
  dud.forEach(function(n){ esDud[n] = 1; });
  var asis = firmes.concat(dud);
  /* Primera vez sobre este turno: los firmes se dan por idos; los dudosos NO.
     ⛔ Y la direccion importa: marcarlos por defecto le sumaria **un turno** a quien quiza
     no fue —lo dice el comentario de `_cierreTurMapa_` dos funciones mas arriba—, mientras
     que dejarlos sin marcar solo cuesta un clic a quien sabe la respuesta. */
  /* La siembra (firmes sí, dudosos no, coche del reparto, y el reloj si el turno está empezado) es de `comun.js`: el móvil la comparte. */
  _cierreSembrar_(t, CIERRE_TUR, new Date(_ahoraApp_()).toISOString());
  tope = _cierreTurTope_();
  var ini0 = CIERRE_TUR.ini || String((t && t.hora) || '').slice(0,5);   /* el turno suele salir a su hora: de ahi se parte */
  var mapa = _cierreTurMapa_(), sinDur = _cierreTurSinDur_(),
      falta = sinDur ? 'Di cu\u00e1nto dur\u00f3 el turno' : _cierreTurnoFalta_(mapa, tope);

  /* ⚠️ EL `value` VA POR `esc`: la clave lleva el `punto`, que es texto libre del
     Discord y puede traer comillas -- sin escapar, romperia el atributo y el `<option>`
     dejaria de tener valor. */
  var opciones = cerrables.map(function(k){
    var x = _turnoDeClave_(k), f = (x && (x.fecha_txt || x.fecha || x.f)) || '?';
    if(!x) return null;
    return [k, f + (x.hora ? ' · '+String(x.hora).slice(0,5) : '') + (x.punto ? ' · '+x.punto : '')];
  }).filter(Boolean);

  var filas = asis.map(function(n){
    var on = !!CIERRE_TUR.quien[n];
    var v = CIERRE_TUR.extra[n];
    /* ⛔ EL DUDOSO ARRANCA A CERO, NO AL TOPE. De estos **no se sabe si fueron**, asi que
       el defecto tiene que ser «lo que se sabe»: si el responsable lo marca, decide el
       extra a mano. Al reves habria que acordarse de bajarlo. Es la regla que
       `_cierreTurnoInicial_` dejo escrita el 17/08 y que nadie ejecutaba. */
    var val = (typeof v === 'number' && isFinite(v)) ? v : (esDud[n] ? 0 : tope);
    if(!CIERRE_TUR.pers) val = tope;   /* 01/11: horas por persona apagadas = todos los que fueron llevan lo mismo */
    return '<tr'+(on?'':' style="opacity:.45"')+'>'+
      '<td><div style="display:flex;align-items:center;gap:7px">'+
        nxSiNo('', on, {attrs:'data-ct-fue="'+esc(n)+'"'})+
        esc((miembro(n)||{}).pila || n)+
        (n===resp?' <span class="chip">responsable</span>':'')+
        (_esSuplenteTurno_(t, n)?' <span class="chip">suplente</span>':'')+'</div>'+
        /* 26/10 (C4b): «llevó coche» va al ACTA (Notion `Coche`, almacén `coche_confirmado`). ⚠️ La cuota aún cuenta el
           coche del REPARTO (espejo): que cuente sólo el confirmado es la 2.ª mitad de C4b, ficha abierta. */
        ' <div style="display:flex;align-items:center;gap:6px;font-size:12px;opacity:.85">'+
        nxSiNo('', CIERRE_TUR.coche[n], {attrs:'data-ct-coche="'+esc(n)+'"', off:!on})+' llev\u00f3 coche</div></td>'+
      '<td class="r">'+(CIERRE_TUR.pers
        ? nxNum('', val, {min:0, max:tope, paso:0.25, sufijo:'h', attrs:'data-ct-extra="'+esc(n)+'"', off:!on})
        : '<span class="mono">'+(on ? h1(val) : '—')+'</span>')+'</td></tr>';
  }).join('');

  var aviso = sinDur
    ? '<div class="nota">Di primero cu\u00e1nto dur\u00f3 de verdad: de eso sale el tiempo extra que se '+
      'reparte por encima de la base de '+_horasTurnoBase_()+' h.</div>'
    : (tope <= 0)
    ? '<div class="nota">El turno no ha pasado de las '+_horasTurnoBase_()+' h de base, '+
      'as\u00ed que no hay tiempo extra que repartir. Cerrarlo sigue valiendo: confirma qui\u00e9n fue.</div>'
    : '<div class="nota">El turno dio '+h1(tope)+' por encima de la base de '+
      _horasTurnoBase_()+' h. Ese es el m\u00e1ximo por persona, y se baja a quien no le '+
      'corresponda: no todo el mundo se qued\u00f3 lo mismo.</div>';

  var salida = CIERRE_TUR.hecho
    ? '<div class="nota" style="margin-top:11px"><b>Propuesta lista.</b> A\u00fan no est\u00e1 en '+
      'Notion: la aplica Daniel. Va a Compensaciones y el turno suma '+
      '1 al contador.<pre class="mono" style="white-space:pre-wrap;'+
      'font-size:12px;margin:8px 0 0">'+esc(CIERRE_TUR.hecho)+'</pre></div>'
    : '';

  return pan('Cerrar un turno', cerrables.length+' por cerrar', '<div class="pb">'+
    listo+
    '<div class="campo"><span class="sc">Qu\u00e9 turno</span>'+
      nxElige('ctSel', opciones, CIERRE_TUR.k||'')+'</div>'+
    (t && t.empezado_at
      ? '<div class="nota" id="ctReloj">En curso desde las '+esc(_hhmmDe_(t.empezado_at))+'. Al acabar, \u00abCerrar el turno\u00bb toma de ah\u00ed el inicio y ahora como fin; c\u00e1mbialos si no fue as\u00ed.</div>'
      : (t && t.id ? '<button class="btn" id="ctEmpezar" style="margin:0 0 11px">Empezar turno</button>' : ''))+
    /* 01/11 (Daniel, suplente): las horas salen de cuando empezo y cuando acabo, CONTANDO EL TRANSPORTE */
    '<div class="campo"><span class="sc">Cu\u00e1ndo empez\u00f3 (saliendo de casa)</span>'+
      nxHora('ctIni', ini0)+'</div>'+
    '<div class="campo"><span class="sc">Cu\u00e1ndo acab\u00f3 (ya de vuelta)</span>'+
      nxHora('ctFin', CIERRE_TUR.fin || ini0)+'</div>'+
    '<div class="campo"><span class="sc">Cu\u00e1nto dur\u00f3 de verdad (horas)</span>'+
      nxNum('ctDur', CIERRE_TUR.dur, {min:0, paso:0.25, sufijo:'h'})+'</div>'+
    aviso+
    '<div class="campo"><span class="sc">Horas distintas por persona</span>'+
      nxSiNo('ctPers', CIERRE_TUR.pers)+'</div>'+
    (asis.length
      ? '<table class="tb" style="margin-top:9px"><thead><tr><th>Qui\u00e9n fue de verdad</th>'+
        '<th class="r">Extra</th></tr></thead><tbody>'+filas+'</tbody></table>'
      : '<div class="nota">Este turno no tiene a nadie resuelto en el roster.</div>')+
    '<button class="btn pri" id="ctEnviar"'+(falta?' disabled':'')+' style="margin-top:11px">'+
      'Cerrar el turno</button>'+_porQueApagado_(falta ? falta+'.' : '')+   /* 31/10: el motivo al lado, no en el rótulo */
    /* 26/10 (triaje C4a): cancelar = «Cancelado»; no cuenta como turno para nadie, ni su coche */
    /* ⛔ (refutador 37, 🟡 4): un turno YA PASADO sólo lo cancela el PD (el servidor se lo niega al resto) */
    (_puedeCancelarTurno_(t) ? ' <button class="btn" id="ctCancelar" style="margin-top:11px">Cancelar este turno</button>' : '')+
    '</div>');
}

/* ⛔⛔ ESTE PANEL ESTUVO ROTO 5 DE 5, POR DOS CAUSAS DISTINTAS (23/08).
   (1) Los cinco manejadores repintaban con una funcion que **no existe en esta cara**: era
       la de `app.html`, otra app que este bundle no carga. Aqui se repinta con `pintar()`
       (`escritorio.html:3239`), y el HTML declara `"use strict"`. 📏 5 llamadas, 0
       declaraciones. Cada manejador MUTABA EL ESTADO y lanzaba justo despues, asi que
       «Cerrar el turno» componia la propuesta entera --el unico producto de esta pantalla,
       el que va a Compensaciones-- y **no la pintaba nunca**: el boton no hacia nada.
       ⚠️ Y la consola esta denegada en este dominio: no dejaba rastro ni depurando.
   (2) Dos de los cinco ni se enganchaban: colgaban de `#s-turnos`, que es el convenio de
       ids de `app.html`. 📏 `id="s-` sale 7 veces alli y **0 en `escritorio.html`**, asi
       que `$$` devolvia `[]` SIEMPRE -- las casillas de «quien fue» y los campos de «extra»
       no recibian manejador, y con ellos el **reparto fila a fila** que Daniel pidio el
       15/08 (*«a lo mejor es tiempo extra que no le cuenta a alguien que vive cerca, pero
       si a alguien que vive lejos»*) era **inalcanzable**: a todos les caia el mismo tope.
       Y un dudoso que si fue **no podia confirmarse nunca**, porque su casilla es una de
       las dos que no se cableaban.
   ⛔ Es REINCIDENCIA: `escritorio.html:3290` dice haber curado que «ni un control
   respondia». Se arreglo el cable, y los controles pasaron a **responder lanzando**.
   ✅ Lo vigila `rutinas/probar_bundle_caras.py`, que pregunta lo unico preciso: **si un
   nombre llamado aqui es una funcion del proyecto que vive en OTRO bundle**. */
function _cablearCierreTurno_(){
  var sel = document.getElementById('ctSel');
  if(sel) sel.onchange = function(){
    /* ⛔ Al cambiar de turno se BORRA el reparto: si se conservara, las horas escritas para
       una persona de un turno saldrian sembradas en otro turno distinto, con su nombre y con
       cara de haber sido tecleadas ahi. */
    /* ⚠️ SIN `+`: el valor es una CLAVE, no un numero. Con `+` daba `NaN` y el panel
       se quedaba sin turno elegido. */
    CIERRE_TUR.k = sel.value; CIERRE_TUR.quien = {}; CIERRE_TUR.extra = {}; CIERRE_TUR.coche = {}; CIERRE_TUR.ini = ''; CIERRE_TUR.fin = ''; CIERRE_TUR.pers = false;
    CIERRE_TUR.dur = ''; CIERRE_TUR.hecho = null; pintar();
  };
  /* 01/11: inicio/fin -> duracion. Si falta una o son iguales (`null`) no se toca la duracion: «no lo se» no es 0. */
  var ci = document.getElementById('ctIni'), cf = document.getElementById('ctFin');
  var porHoras = function(){
    _cierrePonHoras_(CIERRE_TUR, ci.value, cf.value);
    CIERRE_TUR.hecho = null; pintar();
  };
  if(ci && cf){ ci.onchange = porHoras; cf.onchange = porHoras; }
  var cp = document.getElementById('ctPers');
  if(cp) cp.onchange = function(){
    CIERRE_TUR.pers = nxSi(cp);
    /* Al encenderlo se parte de lo que ya llevaban (el tope), no de los ceros de los dudosos. */
    if(CIERRE_TUR.pers){ var tp = _cierreTurTope_();
      Object.keys(CIERRE_TUR.quien).forEach(function(n){ if(CIERRE_TUR.extra[n] == null) CIERRE_TUR.extra[n] = tp; }); }
    CIERRE_TUR.hecho = null; pintar();
  };
  var dur = document.getElementById('ctDur');
  if(dur) dur.onchange = function(){
    CIERRE_TUR.dur = dur.value;
    _cierreRecortar_(CIERRE_TUR);
    CIERRE_TUR.hecho = null; pintar();
  };
  $$('[data-ct-fue]').forEach(function(el){
    el.onchange = function(){ CIERRE_TUR.quien[el.dataset.ctFue] = nxSi(el); pintar(); }; });
  $$('[data-ct-coche]').forEach(function(el){
    el.onchange = function(){ CIERRE_TUR.coche[el.dataset.ctCoche] = nxSi(el); }; });
  $$('[data-ct-extra]').forEach(function(el){
    el.onchange = function(){
      var v = parseFloat(String(el.value).replace(',', '.'));
      CIERRE_TUR.extra[el.dataset.ctExtra] = isFinite(v) ? v : 0;
      CIERRE_TUR.hecho = null; pintar();
    }; });
  var b = document.getElementById('ctEnviar');
  if(b) b.onclick = async function(){
    var falta = _cierreTurnoFalta_(_cierreTurMapa_(), _cierreTurTope_());
    if(falta){ b.textContent = falta; return; }
    var t = _cierreTurSel_();
    /* ⛔ 26/10 (triaje C4a/C4b): y el turno queda «Realizado», con el acta — quién fue y, de ellos, quién llevó coche.
       La llamada (tramo real + reparto del extra) es `_cierreEnviar_` de `comun.js`, la misma del móvil. Sin `id` (un turno del
       espejo de Discord) no hay a qué página ir: la propuesta sale igual y se dice. */
    b.disabled = true; b.textContent = 'Cerrando\u2026';
    try{
      var en = await _cierreEnviar_(t, CIERRE_TUR), txt = en.txt, r = en.r;
      if(en.sinId){ b.disabled = false; b.textContent = 'Cerrar el turno'; CIERRE_TUR.hecho = txt + '\n(Este turno no trae su ID de Notion: m\u00e1rcalo \u00abRealizado\u00bb a mano.)'; pintar(); return; }
      var se = (r && r.sinEtiquetar) || [];
      var nx = (r && r.extras) || [];
      CIERRE_TUR.listo = {titulo:'Turno cerrado: queda «Realizado». ' + (nx.length ? 'El tiempo extra ya está en sus partes de compensación:' : 'Sin tiempo extra que repartir:'), txt:txt,
        aviso: se.length ? ('Sin usuario de Notion, no entran en Asistentes: ' + se.join(', ')) : ''};
      CIERRE_TUR.k = null; CIERRE_TUR.quien = {}; CIERRE_TUR.extra = {}; CIERRE_TUR.coche = {}; CIERRE_TUR.ini = ''; CIERRE_TUR.fin = ''; CIERRE_TUR.pers = false;
      CIERRE_TUR.dur = ''; CIERRE_TUR.hecho = null; pintar();
    }catch(e){ b.disabled = false; b.textContent = 'No se pudo cerrar: ' + ((e && e.message) || e); }
  };
  var be = document.getElementById('ctEmpezar');
  if(be) be.onclick = async function(){
    var te = _cierreTurSel_();
    if(!te || !te.id) return;
    be.disabled = true; be.textContent = 'Empezando\u2026';
    try{
      await _cierreEmpezar_(te);
      pintar();
    }catch(e){ be.disabled = false; be.textContent = 'No se pudo empezar: ' + ((e && e.message) || e); }
  };
  var bc = document.getElementById('ctCancelar');
  if(bc) bc.onclick = async function(){
    var t = _cierreTurSel_(), f = (t && (t.fecha_txt || t.fecha || t.f)) || '?';
    if(!t || !t.id){ bc.textContent = 'Este turno no trae su ID de Notion: cancélalo allí'; return; }
    if(!(await dialogoSiNo('Cancelar el turno del ' + f + '. No contará como turno para nadie, ni su coche. ¿Seguro?'))) return;
    bc.disabled = true; bc.textContent = 'Cancelando\u2026';
    try{
      await api.estadoTurno({id:t.id, estado:'Cancelado'});
      t.estado = 'Cancelado';
      CIERRE_TUR.listo = {titulo:'Turno del ' + f + ' cancelado: no cuenta como turno ni su coche.', txt:'', aviso:''};
      CIERRE_TUR.k = null; CIERRE_TUR.quien = {}; CIERRE_TUR.extra = {}; CIERRE_TUR.coche = {}; CIERRE_TUR.ini = ''; CIERRE_TUR.fin = ''; CIERRE_TUR.pers = false;
      CIERRE_TUR.dur = ''; CIERRE_TUR.hecho = null; pintar();
    }catch(e){ bc.disabled = false; bc.textContent = 'No se pudo cancelar: ' + ((e && e.message) || e); }
  };
}

/* ═══ CONVOCAR TURNO: EL MAPA, LA CONVOCATORIA QUE SE ELIGE Y QUIÉN VA (03/11/2026) ═══════════════════════════════════════════
   🗣️ Daniel: *«debería dejar convocar turnos para todas las convocatorias que estén abiertas y cerradas […] siempre va a ser
   seguramente de sábado en adelante poder convocarlos de la semana que viene»* · *«aquí pone quién va al turno. Y debería aparecer los
   que pueden. Y los que no pueden. Y yo poder seleccionar igual a los que no puedan a la fuerza […] porque igual me han dicho que sí
   después»* · *«los botones + y − no hacen nada»*.
   ⛔ El mapa es `_turnoCalorHTML_` (comun.js, el mismo que Disponibilidad y el móvil). Lo que el formulario escribe (fecha, hora,
   duración) se lee DE VUELTA (`_convocarSync_`): marca el bloque en el mapa y reparte a la gente en «pueden» / «no pueden». Los botones
   +/− de la hora disparan `change` sobre el campo oculto, y antes SÓLO el botón de convocar los oía.
   ⛔ La zona `#tuZona` se repinta SOLA (no con `pintar()`, que borraría lo escrito en el formulario).
   Las globales (`CONV_LISTA`, `CONV_ELEGIDA`, `CONV_CV`) son de `escritorio.html`. */

/* La convocatoria con las respuestas de TODOS que el formulario usa: la ELEGIDA en los chips o, si no hay, la vigente que carga
   `_dispCargar_`. `null` = no se sabe (no bloquea). SÓLO con el estado `ok`: con `'solo mio'` el calor saldría de UNA persona. */
function _convocarCvElegida_(){
  if(CONV_ELEGIDA){ return (CONV_CV && String(CONV_CV.id)===String(CONV_ELEGIDA) && !CONV_CV.fallo) ? CONV_CV : null; }
  return _dispEstadoSrv_()==='ok' ? _dispViva_() : null;
}
/* La convocatoria con las respuestas de TODOS que el formulario puede usar para la regla del consejo, o `null` (no se sabe: no bloquea). */
function _convocarCv_(){ return _convocarCvElegida_(); }

/* Los chips para ELEGIR de qué convocatoria sale el mapa (abiertas Y cerradas) y, para quien puede, empezar una nueva. */
function _convocarEligeHTML_(){
  var L=CONV_LISTA||[], cv=_convocarCvElegida_(), act=cv ? String(cv.id) : '';
  var chips=L.map(function(c){
    return '<button type="button" class="pick'+(String(c.id)===act?' on':'')+'" data-convsel="'+esc(c.id)+'">'+esc(_convEtiqueta_(c))+'</button>';
  }).join('');
  if(_puedeConvocarDisp_()) chips+='<button type="button" class="pick" data-convnueva="1">Pedir disponibilidad nueva</button>';
  return chips ? '<span class="sc" style="display:block;margin-bottom:5px">De qué convocatoria</span><div class="chips" data-conv-lista style="margin:0 0 12px">'+chips+'</div>' : '';
}

/* 04/11 (los 4 pinceles): el FILTRO del mapa de Convocar y la persona a la que se mira, de esta cara. */
var CONV_FIL = {sitio:'', coche:null};
var CONV_PERS = '';

/* La disponibilidad de UNA persona con sus pinceles: la misma rejilla que contesta, sólo lectura. `''` si no hay nada que enseñar. */
function _convocarPersonaHTML_(cv, nombre){
  var r = (cv && cv.resp && nombre) ? cv.resp[nombre] : null; if(!r) return '';
  var D=cv.dias||[], F=cv.franjas||[];
  var cab='<div class="dmc dml"></div>'+D.map(function(d){
    var p=String(_diaCorto_(d)).split(' ');
    return '<div class="dmc">'+esc(p[0]||'')+'<br>'+esc(p[1]||String(d).slice(8,10))+'</div>';
  }).join('');
  var filas=F.map(function(fr, i){
    return (i ? _huecoFilaE_(F[i-1], fr) : '')+_rotFranjaE_(_rotuloTramo_(fr))+D.map(function(d){
      var v=r[_dispClave_(d,fr.k)], pue=(v && v.s && v.s!=='no');
      return '<div class="dcel'+(pue?'':' v0')+'" data-pers-k="'+esc(_dispClave_(d,fr.k))+'"'+(pue?' style="background:'+_celdaFondo_(v)+'"':'')+'>'+
        ((v&&v.s==='no')?'\u2013':(pue&&_celdaCoche_(v)?ico('coche'):''))+'</div>';
    }).join('');
  }).join('');
  return '<div data-conv-persona style="margin:10px 0 0"><span class="sc" style="display:block;margin-bottom:5px">'+esc(_dispPila_(nombre))+' \u00b7 sus pinceles</span>'+
    '<div class="dmapa" style="grid-template-columns:104px repeat('+D.length+',minmax(44px,1fr))">'+cab+filas+'</div></div>';
}
/* Los chips para elegir a quién mirar: quien ha contestado algo. Pulsar al elegido lo suelta. */
function _convocarPersonasHTML_(cv){
  var quienes = Object.keys((cv && cv.resp) || {}).filter(function(n){ return Object.keys(cv.resp[n]||{}).length; }).sort();
  if(!quienes.length) return '';
  return '<span class="sc" style="display:block;margin:10px 0 5px">Ver a una persona</span><div class="chips" data-conv-personas>'+
    quienes.map(function(n){ return '<button type="button" class="pick'+(n===CONV_PERS?' on':'')+'" data-convpers="'+esc(n)+'">'+esc(_dispPila_(n))+'</button>'; }).join('')+'</div>'+
    (CONV_PERS && quienes.indexOf(CONV_PERS)>=0 ? _convocarPersonaHTML_(cv, CONV_PERS) : '');
}

function _convocarCalorHTML_(){
  var st=_dispEstadoSrv_(), cv=_convocarCvElegida_(), T='<span class="sc" style="display:block;margin-bottom:5px">Cuándo pueden · toca un hueco</span>';
  var nota=function(t){ return '<div style="margin:0 0 14px">'+T+'<div class="nadie" data-tcal-nota style="font-size:12.5px;color:var(--ink2)">'+t+'</div></div>'; };
  if(CONV_ELEGIDA && !cv) return nota(CONV_CV && CONV_CV.fallo && String(CONV_CV.id)===String(CONV_ELEGIDA) ? 'No se pudo leer esa convocatoria: elige otra, o la fecha y la hora a mano.' : 'Mirando la disponibilidad…');
  if(!CONV_ELEGIDA && st==='ok' && !cv) return nota('No hay convocatoria de disponibilidad abierta para esa semana: elige la fecha y la hora a mano.');
  if(!cv) return nota(st==='sin pedir'||st==='pidiendo' ? 'Mirando la disponibilidad…'
    : 'No se ve la disponibilidad de la semana: elige la fecha y la hora a mano.');
  return '<div style="margin:0 0 14px">'+T+_turnoFiltroHTML_(cv, CONV_FIL, 'convf')+
    _turnoCalorHTML_(cv, _calorTurnos_(cv, CONV_FIL.sitio, CONV_FIL.coche), 'tuMapa')+
    '<div data-conv-ley style="margin-top:5px;font-size:11.5px;color:var(--ink2)">'+_pincelLeyendaHTML_(cv)+'</div>'+
    _convocarPersonasHTML_(cv)+'</div>';
}

function _convocarZonaHTML_(){ return _convocarEligeHTML_()+_convocarCalorHTML_(); }

/* «Quién va»: con un bloque en el mapa, DOS grupos —los que pueden TODAS sus horas y los que no— y los dos se pueden marcar (quien
   «no puede» puede haber dicho que sí después). Sin bloque, una lista. ⛔ La regla del consejo sigue contando sólo con los que pueden
   (`_turnoConsejoAguanta_` lee las respuestas, no a quién se marca aquí). */
function _convocarPoolHTML_(b){
  var cv=_convocarCvElegida_(), pool=_activos_().slice().sort(function(a,c){ return String(a.pila).localeCompare(String(c.pila)); });
  var chip=function(m, no){
    return '<button type="button" class="pick'+(TUR_SEL[m.nombre]?' on':'')+'" data-tu="'+esc(m.nombre)+'"'+
      (no?' title="No ha dicho que pueda: se añade igual" style="opacity:.78"':'')+'>'+esc(m.pila)+'</button>';
  };
  if(!cv || !b || !b.claves || !b.claves.length) return pool.map(function(m){ return chip(m, false); }).join('');
  var pueden=_turnoBloqueQuien_(_calorTurnos_(cv, ''), b.dia, b.claves), si=[], no=[];
  pool.forEach(function(m){ (pueden.indexOf(m.nombre)>=0 ? si : no).push(m); });
  var grupo=function(k, tit, l){
    return '<div data-tu-grupo="'+k+'" style="width:100%;margin:0 0 6px"><span class="sc" style="display:block;margin-bottom:4px">'+tit+' ('+l.length+')</span>'+
      '<div class="chips">'+(l.length ? l.map(function(m){ return chip(m, k==='no'); }).join('') : '<span class="nadie">nadie</span>')+'</div></div>';
  };
  return grupo('si', 'Pueden', si)+grupo('no', 'No pueden · márcalos si han dicho que sí', no);
}
/* Los chips de «Quién va» responden al clic: marcan / quitan a la persona y repintan el reparto. Corre cada vez que se repinta `#tuPool`. */
function _cablearPoolTu_(){
  $$('#tuPool .pick').forEach(function(c){
    c.onclick=function(){
      var n=c.dataset.tu;
      if(TUR_SEL[n]){ delete TUR_SEL[n]; _quitarDeCargos_(n); c.classList.remove('on'); }
      else { TUR_SEL[n]={rol:'',coche:false}; c.classList.add('on'); }
      pintarReparto();
    };
  });
}

/* Lee el formulario (fecha, hora, duración) y lo lleva al mapa, al botón y a «Quién va». Es el camino de VUELTA del mapa. */
function _convocarSync_(){
  var v=function(id){ return (document.getElementById(id)||{}).value||''; }, raiz=document.getElementById('tuMapa'), cv=_convocarCvElegida_(), b=null;
  if(raiz && raiz._tcalMarca) raiz._tcalMarca(v('tuFecha'), v('tuHora'), v('tuDur'));
  if(cv && (cv.dias||[]).indexOf(v('tuFecha'))>=0){
    var cl=_clavesDeHoras_(cv, v('tuHora'), v('tuDur'), 1);
    if(cl.length) b={dia:v('tuFecha'), claves:cl};
  }
  _convocarPoolPinta_(b);
  _pintarBotonConvocar_();
}
function _convocarPoolPinta_(b){
  var pool=document.getElementById('tuPool'); if(!pool) return;
  pool.innerHTML=_convocarPoolHTML_(b);
  _cablearPoolTu_();
}

/* Pide UNA VEZ la lista de convocatorias (abiertas y cerradas); cuando llega, repinta sólo la zona. */
function _convocarListar_(){
  if(CONV_LISTA!==null) return;
  if(typeof api==='undefined' || !api.listarConvocatorias || typeof SESION==='undefined' || !SESION) return;
  CONV_LISTA=[];
  api.listarConvocatorias().then(function(r){
    CONV_LISTA=(r && r.lista) || [];
    _convocarRepintarZona_();
  }).catch(function(){ /* sin lista: queda el mapa de la vigente, como antes */ });
}
function _convocarRepintarZona_(){
  var z=document.getElementById('tuZona'); if(!z) return;
  z.innerHTML=_convocarZonaHTML_();
  _convocarCablear_();
  _convocarSync_();
}
function _convocarElige_(id){
  CONV_ELEGIDA=String(id);
  if(typeof api==='undefined' || !api.getDisponibilidad) return;
  _convocarRepintarZona_();
  api.getDisponibilidad(id).then(function(r){
    if(String(CONV_ELEGIDA)!==String(id)) return;     /* mientras tanto eligió otra */
    var cv=r && r.convocatoria; if(!cv) throw new Error('vacía');
    cv.resp=r.cv||{}; CONV_CV=cv; _convocarRepintarZona_();
  }).catch(function(){
    if(String(CONV_ELEGIDA)!==String(id)) return;
    CONV_CV={id:id, fallo:true}; _convocarRepintarZona_();
  });
}

/* Cablea la zona de arriba: los chips de convocatoria y el mapa; lo que se elige cae en Fecha, Hora y Duración del formulario. */
function _convocarCablear_(){
  $$('#tuZona [data-convsel]').forEach(function(b){ b.onclick=function(){ _convocarElige_(b.dataset.convsel); }; });
  $$('#tuZona [data-convnueva]').forEach(function(b){ b.onclick=function(){ _abrirPestana_('tur', 'disp'); }; });
  $$('#tuZona [data-convf-sitio]').forEach(function(b){ b.onclick=function(){ CONV_FIL.sitio=b.dataset.convfSitio; _convocarRepintarZona_(); }; });
  $$('#tuZona [data-convf-coche]').forEach(function(b){ b.onclick=function(){ CONV_FIL.coche=_cocheDeFiltro_(b.dataset.convfCoche); _convocarRepintarZona_(); }; });
  $$('#tuZona [data-convpers]').forEach(function(b){ b.onclick=function(){ CONV_PERS=(CONV_PERS===b.dataset.convpers)?'':b.dataset.convpers; _convocarRepintarZona_(); }; });
  var raiz=document.getElementById('tuMapa'), cv=_convocarCvElegida_(); if(!raiz || !cv) return;
  _turnoCalorCablear_(raiz, cv, _calorTurnos_(cv, CONV_FIL.sitio, CONV_FIL.coche), function(b){
    nxPon('tuFecha', b.dia);
    if(b.hora) nxPon('tuHora', b.hora);
    var d=document.getElementById('tuDur'); if(d && b.horas) d.value=_duracionTurnoTxt_(b.horas);
    _convocarPoolPinta_(b);
    _pintarBotonConvocar_();
  });
}

/* Corre en cada `pintar()` (como `_pinDisp_`). */
function _pinConvocarCalor_(){
  ['tuFecha','tuHora','tuDur'].forEach(function(id){
    var e=document.getElementById(id); if(e) e.addEventListener('change', _convocarSync_);
    if(e && id==='tuDur') e.addEventListener('input', _convocarSync_);
  });
  _convocarListar_();
  _convocarCablear_();
  _convocarSync_();
}

function convocarPanel(){
  if(!_puedeProgramarTurno_(ACTOR)) return '';           // solo coordinaci\u00f3n o superior
  delete SOLP.tu; delete SOLTXT.tu;   /* el panel se pinta de nuevo con las cajas vacías: sin propuesta de SolarIA de antes */
  var E=CAMPO_CSS;
  var lab=function(t){ return '<span class="sc" style="display:block;margin-bottom:5px">'+t+'</span>'; };
  /* las bajas no se convocan: siguen en el roster por su historia, no para turnos nuevos (`_convocarPoolHTML_` las deja fuera) */
  var chips=_convocarPoolHTML_(null);
  return pan('Convocar turno','queda escrito en Notion',
    '<div class="pb">'+
    '<p style="margin:0 0 12px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
      'El turno les llega a los convocados y queda publicado en Notion. Marca qui\u00e9n va, ponle a cada uno '+
      'su papel y di qu\u00e9 hay que sacar. No se puede convocar m\u00e1s de un turno el mismo d\u00eda.</p>'+
    '<div id="tuZona">'+_convocarZonaHTML_()+'</div>'+

    /* 01/11 (escm2): REJILLA, no una fila que se parte: cuándo (fecha · hora · duración · crucial) y dónde (se trabaja · se queda),
       cada pregunta sobre su control y todas con la misma etiqueta. */
    '<div class="rejf">'+
      '<div>'+lab('Fecha')+nxFecha('tuFecha', '', {min:_hoyNxISO_()})+'</div>'+
      '<div>'+lab('Hora')+nxHora('tuHora', '16:00')+'</div>'+
      '<label>'+lab('Duraci\u00f3n')+
        '<input id="tuDur" placeholder="~ 3 horas" style="'+E+'"></label>'+
      '<div>'+lab('Crucial')+nxSiNo('tuCrucial', false)+'</div>'+
    '</div>'+
    '<div class="rejf rejf2">'+
      '<div>'+lab('D\u00f3nde se trabaja')+
        /* 22/10 (auditor 25, 🟡 9): SIN elegir por defecto — antes todo turno salía «CITI» aunque nadie lo dijera, y
           de este campo saldría el descuento de Vigo. Vacío = no se escribe en Notion (`_verdad(lugar)`). */
        nxElige('tuLugar', [['','Sin decir'],['CITI','CITI'],['Vigo','Vigo'],['Coasa','Coasa'],['Otro','Otro']], '')+'</div>'+
      '<label>'+lab('D\u00f3nde se queda')+
        '<input id="tuPunto" placeholder="enfrente del polit\u00e9cnico" style="'+E+'"></label>'+
    '</div>'+

    lab('Qui\u00e9n va')+
    '<div class="chips" id="tuPool" style="margin:0 0 10px">'+chips+'</div>'+
    '<div id="tuLista" style="margin-bottom:12px"></div>'+

    /* ⛔ LOS COCHES VAN AQUI, DETRAS DE LA GENTE, y el orden lo pidio Daniel:
       «lo clasico despues de disposicion de personas: Coche 1, Coche ...». Tiene
       sentido: no puedes repartir a gente que aun no has convocado. */
    lab('Coches · opcional')+
    '<div id="tuCoches" style="margin-bottom:6px"></div>'+
    '<div style="margin-bottom:12px">'+
      '<button type="button" class="btn mini" data-addcoche>+ añadir coche</button>'+
    '</div>'+

    _solIAHTML_('tu', _solTurnoCfg_('tu'))+
    '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:11px">'+
      '<label style="flex:1;min-width:230px">'+lab('Objetivos principales \u00b7 uno por l\u00ednea')+
        '<textarea id="tuObj1" rows="3" placeholder="Lijado del tramo 2&#10;Pegado de aletas" '+
        'style="'+E+';resize:vertical"></textarea></label>'+
      '<label style="flex:1;min-width:230px">'+lab('Objetivos secundarios \u00b7 si sobra tiempo')+
        '<textarea id="tuObj2" rows="3" placeholder="Ordenar el z\u00falo" '+
        'style="'+E+';resize:vertical"></textarea></label>'+
    '</div>'+

    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end">'+
      '<label style="flex:1;min-width:230px">'+lab('Aviso para los convocados')+
        '<input id="tuNota" placeholder="traed guantes y mascarilla" style="'+E+'"></label>'+
      '<button class="btn pri" data-convocar>Convocar el turno</button>'+
    '</div></div>');
}


/* ═══ LA FICHA DEL TURNO · PARIDAD A3 (31/10/2026) ═══════════════════════════════════
   🗣️ Daniel: «llevar al escritorio todo lo que hay en el movil». Pulsar una fila de «Turnos convocados» abre
   su ficha debajo de la tabla: reparto con roles, coches, objetivos, nota y memoria. Antes la cara PEDIA
   objetivos y nota al convocar y no los ensenaba en ningun sitio.
   ⛔ Se guarda la CLAVE del turno (`_claveTurno_`), no su posicion: `TURNOS` se rellena en sitio y una
   posicion apuntaria a otro turno tras el refresco. `FICHA_TUR` es global DECLARADA (⚠️ `TUR_SEL` ya existe: son los convocados) en `escritorio.html`. */
function _turnoPorClave_(k){
  if(!k) return null;
  return TURNOS.filter(function(t){ return _claveTurno_(t)===k; })[0] || null;
}
/* Pulsar la fila abierta la cierra; pulsar otra cambia a ella. */
function _turSelAlternar_(actual, k){ return (actual && actual===k) ? null : k; }

/* El rol es texto libre y acumula papeles («Coche, Responsable de turno»): un chip por papel. */
function _chipsRolE_(roles){
  var vistos = {}, out = [];
  roles.forEach(function(x){
    String(x||'').split(/[,·]/).forEach(function(p){
      p = p.replace(/^\s+|\s+$/g,'');
      if(!p || vistos[p.toLowerCase()]) return;
      vistos[p.toLowerCase()] = 1;
      var l = p.toLowerCase();
      var cl = l.indexOf('responsable')>=0 ? ' ok' : (l.indexOf('coche')>=0 ? ' tel' : (_esFirmeRol_(p) ? '' : ' wa'));
      out.push('<span class="chip'+cl+'">'+esc(p)+'</span>');
    });
  });
  return out.join('');
}

function _fichaTurnoE_(t){
  var k = _claveTurno_(t);
  var f = _isoADMY_(_dmyAISO_(String(t.fecha||t.f||'')));
  var vac = function(txt){ return '<div class="ftu-vac">'+txt+'</div>'; };
  var pers = function(n){
    var roles = (t.roles||[]).filter(function(r){ return r && r.miembro===n; }).map(function(r){ return r.rol; });
    return '<div class="ftu-pers'+(n===ACTOR?' yo':'')+'"><span class="av">'+esc(ini(n))+'</span>'+
      '<b>'+esc(n)+'</b><span class="ftu-roles">'+_chipsRolE_(roles)+'</span></div>';
  };
  var firmes = _asistentesTurno_(t), dudosos = _dudososTurno_(t);
  var reparto = (firmes.length||dudosos.length)
    ? firmes.map(pers).join('')+(dudosos.length ? '<div class="ftu-sub">Por confirmar</div>'+dudosos.map(pers).join('') : '')
    : vac('Nadie apuntado todavía');
  var cl = _cochesTurnoLineas_(t.coches);
  var coches = cl.length ? cl.map(function(l){
    return '<div class="ftu-coche"><b>'+ico('coche')+' Coche '+l.n+' · '+esc(l.conduce||'sin conductor')+'</b>'+
      '<span>'+esc(l.ida)+(l.vuelta ? ' · vuelta: '+esc(l.vuelta) : '')+'</span>'+
      '<span class="ftu-van">'+(l.pasajeros.length ? 'Van: '+esc(l.pasajeros.join(', ')) : 'Sin pasajeros')+'</span></div>';
  }).join('') : vac('Sin coches organizados');
  var obj = function(a, vacio){
    return (a && a.length) ? a.map(function(o){ return '<div class="ftu-obj">'+esc(o)+'</div>'; }).join('') : vac(vacio);
  };
  var sec = function(tit, cuerpo){ return '<section class="ftu-sec"><h5>'+tit+'</h5>'+cuerpo+'</section>'; };
  return '<div id="ficha-turno">'+pan('Ficha del turno · '+esc(_refTurno_(t)), '<button class="btn sm" data-tursel="'+esc(k)+'">Cerrar</button>',
    '<div class="pb"><div class="ftu-cab"><b>'+esc(t.punto||'—')+'</b>'+
      (t.estado==='Cancelado' ? '<span class="chip no">cancelado</span>' : '')+
      '<span class="mono">'+esc(f)+' · '+esc(t.hora||'—')+' · '+esc(t.duracion||t.dur||'—')+'</span></div>'+
    '<div class="ftu-rej">'+
      sec('Quién va', reparto)+sec('Coches', coches)+
      sec('Objetivos principales', obj(t.principales, 'Sin objetivos principales'))+
      sec('Objetivos secundarios', obj(t.secundarios, 'Sin objetivos secundarios'))+
    '</div>'+
    sec('Nota', t.nota ? '<div class="ftu-nota">'+esc(t.nota)+'</div>' : vac('Sin nota'))+
    _ftHTML_(t)+   /* 04/11: las fotos del turno (hueco: vacío hasta que el servidor diga que hay algo que enseñar) */
    _mtHTML_(t)+   /* 09/11: la memoria del turno, escrita desde la app (hueco: sólo lo ve quien puede escribirla) */
    /* la memoria se incrusta como DOCUMENTO (igual que en el movil), no como un enlace suelto */
    sec('Memoria', t.memoria ? _memoriaHTML_(t) : vac('Memoria del turno · aún no subida'))+'</div>',
    'ftu destaca')+'</div>';
}

/* La fila lleva `data-tursel`; el enlace «ver» de la memoria NO abre la ficha. */
function _engFichaTurno_(){
  $$('[data-tursel]').forEach(function(el){
    el.onclick=function(ev){
      if(ev.target && ev.target.closest && ev.target.closest('a')) return;
      FICHA_TUR = _turSelAlternar_(FICHA_TUR, el.dataset.tursel);
      pintar();
      if(FICHA_TUR){ var c=document.getElementById('ficha-turno'); if(c) c.scrollIntoView({block:'nearest',behavior:redu()?'auto':'smooth'}); }
    };
  });
  _cablearMemoria_();
  _ftEnganchar_(document);   /* 04/11: las fotos del turno */
  _mtEnganchar_(document);   /* 09/11: la memoria del turno */
}
