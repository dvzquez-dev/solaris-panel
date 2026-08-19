/* ═══ NOTIS · cara escritorio ═══════════════════════════════════════════════════════════
   3 funciones sacadas de `escritorio.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* ⛔⛔ EL MENSAJE SE GUARDA, PORQUE `pintar()` SE LO LLEVABA POR DELANTE.
   `activarNotis` acaba en `finally{ ... pintar(); }`, y `pintar()` reconstruye
   `_notisHTML_()`, que emitia el `<span id="notisMsg">` **vacio**. O sea que los cinco
   mensajes de esa funcion -permiso denegado, sin service worker, sin sesion, el error del
   navegador y hasta el «Notificaciones activadas»- se destruian **en el mismo tick**, y la
   pantalla quedaba EXACTAMENTE igual que si todo hubiera ido bien.
   ⚠️ La regla ya estaba escrita en este mismo fichero, en `_engNotisPrefs_`: «Y no se
   repinta: `pintar()` se llevaria por delante este mensaje». Escrita para un mensaje y no
   aplicada al otro. */
var _NOTIS_MSG='';
function _notisMsg(t){ _NOTIS_MSG = t || '';
  var b=document.getElementById('notisMsg'); if(b) b.textContent=_NOTIS_MSG; }

async function activarNotis(btn){
  if(!_pushSoportado_()){ _notisMsg('Este navegador no admite notificaciones.'); return; }
  if(btn){ btn.disabled=true; btn.textContent='Activando…'; }
  try{
    var perm=await Notification.requestPermission();
    if(perm!=='granted'){ _notisMsg('Permiso denegado. Puedes darlo en los ajustes del navegador.'); return; }
    var reg=_swReg || await _registrarSW_();
    if(!reg){ _notisMsg('No se pudo preparar el service worker.'); return; }
    await navigator.serviceWorker.ready;
    var sub=await reg.pushManager.getSubscription();
    if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:_urlB64_(VAPID_PUBLIC)});
    if(typeof SESION!=='undefined' && SESION) await api.guardarPush(sub.toJSON());
    else { _notisMsg('Permiso dado, pero sin sesión no se puede registrar el aviso en el servidor.'); return; }
    _notisMsg('Notificaciones activadas.');
  }catch(e){ _notisMsg('No se pudo activar: '+((e&&e.message)||e)); }
  finally{ if(btn){ btn.disabled=false; btn.textContent='Activar notificaciones'; } pintar(); }
}

/* EQUIVALENTE (no GEMELA): el movil pide el permiso en el gate de arranque y tiene el panel de preferencias; el escritorio lo pide con un boton y distingue 'denied'. Divergen por la cara, y esta escrito. */
function _notisHTML_(){
  if(!_pushSoportado_())
    return '<div class="nota" style="border-top:0">Este navegador no admite notificaciones.</div>';
  if(Notification.permission==='denied')
    return '<div class="nota" style="border-top:0">Las tienes <b>bloqueadas</b> en este navegador. '+
      'Hay que desbloquearlas en el candado de la barra de direcciones; desde aquí no se puede.</div>';
  if(Notification.permission==='granted'){
    /* ⛔⛔ «ACTIVADAS» ES UN HECHO, NO UN PERMISO. Este chip dependia SOLO de
       `Notification.permission`, o sea de lo que dijo el navegador — no de que el
       servidor conozca tu suscripcion. Con el permiso dado y el registro caido, la
       pantalla decia «activadas» en verde para siempre y los avisos no llegaban.
       ⛔ Y en esta rama **no se pinta `#btnNotis`**, asi que `activarNotis` es
       inalcanzable: el temporizador de `_pushInit_` es la UNICA via, y es justo la que
       fallaba callada. Por eso el aviso tiene que salir aqui.
       ⚠️ `_pushFallo_` lo escribe `comun.js`, que cargan las dos caras, y hasta hoy
       **solo lo leia el movil**: la constancia se guardaba para nadie. */
    var _fp=(typeof _pushFallo_==='function') ? _pushFallo_() : null;
    return '<div class="pb"><span class="chip '+(_fp?'wa':'ok')+'">'+
      (_fp?'sin confirmar':'activadas')+'</span>'+
      '<span class="sc" id="notisMsg" style="margin-left:10px">'+esc(_NOTIS_MSG)+'</span></div>'+
      (_fp?'<div class="nota">El permiso est\u00e1 dado, pero <b>no se pudo confirmar tu '+
        'registro en el servidor</b>, as\u00ed que los avisos pueden no llegar. '+
        'Vuelve a entrar; si sigue, av\u00edsale al Project Director. <span class="sc">('+
        esc(_fp)+')</span></div>':'')+
      /* ⛔ Y DEBAJO, QUÉ AVISOS QUIERES — sólo en esta rama. Con el permiso sin dar, denegado
         o no admitido, elegir el tipo no cambia nada: no llega ninguno. */
      _notisPrefsHTML_();
  }
  return '<div class="nota" style="border-top:0">Avisos de turnos, reuniones, partes de horas '+
    'y decisiones sobre documentos.</div>'+
    '<div class="pb"><button class="btn pri" id="btnNotis">Activar notificaciones</button>'+
    '<span class="sc" id="notisMsg" style="margin-left:10px">'+esc(_NOTIS_MSG)+'</span></div>';
}

/* ═══ QUÉ AVISOS QUIERES RECIBIR ═══════════════════════════════════════════════════════════
   Paridad con el móvil (`_pintarNotisLista_`), pero a la manera de esta cara: devuelve HTML y
   lo repinta `pintar()`, en vez de parchear el DOM a mano.

   ⛔ Y NO ES LA MISMA PANTALLA, PORQUE LA MEDICIÓN NO DA LO MISMO. De los cinco tipos, tres
   son FIJOS (no se apagan, y lo impide el servidor) y los otros dos —`documentos` y `horas`—
   **no los emite ningún sitio todavía**: enumeradas todas las llamadas a
   `enviarPush`/`_encolarPush_` del repositorio, las cuatro que hay producen `turno`,
   `reunion`, `sancion` y `aviso`. Un panel de cinco interruptores sería, hoy, **cero mandos y
   cinco promesas**. Lo que se ofrece: los tres fijos con su porqué, y los dos apagables con
   interruptor de verdad —el servidor guarda y respeta la preferencia— **marcados con que hoy
   no se manda ninguno de ese tipo**. La marca sale de `NOTIS_VIVOS`, que tiene banco. */
function _notisPrefsHTML_(){
  /* ⛔ SI FALTAN LAS CONSTANTES SE DICE, no se devuelve ''. Un `typeof` que se calla deja la
     pantalla igual que si el panel no existiera, y eso no se puede depurar desde fuera; y un
     `ReferenceError` aquí aborta `pintar()` entero —ya pasó el 11/08 con `CURSO_CONECTADO`— y
     deja la cara EN BLANCO. */
  if(typeof NOTIS_ETI==='undefined' || typeof NOTIS_FIJOS==='undefined')
    return '<div class="nota">No se pudo montar el panel de preferencias (faltan sus '+
      'constantes). Los avisos obligatorios te siguen llegando.</div>';
  if(NOTIS_SRV==='error')
    /* ⛔ NI UN INTERRUPTOR SI NO SE PUDO LEER. Uno con un valor inventado es peor que ninguno:
       se toca creyendo que hace algo, y a partir de ahí tampoco te fías de los que sí
       funcionan. Se dice qué falló y se ofrece reintentar. */
    return '<div class="nota">No se pudieron leer tus preferencias de aviso'+
      (NOTIS_ERR?': '+esc(String(NOTIS_ERR)):'')+'. Los obligatorios (turnos, reuniones y '+
      'avisos) te llegan igual. <button class="btn" data-notisreint>Reintentar</button></div>';
  if(NOTIS_SRV!=='ok' || !NOTIS_PREF)
    return '<div class="nota">Preguntando al servidor qué avisos tienes activados…</div>';
  var filas='', k, e, on, fijo, vivo, hayApagable=false;
  for(k in NOTIS_ETI){
    if(!(k in NOTIS_PREF)) continue;        // el servidor manda: si no lo lista, no existe
    e=NOTIS_ETI[k]; on=NOTIS_PREF[k]!==false; fijo=NOTIS_FIJOS.indexOf(k)>=0;
    vivo=(typeof NOTIS_VIVOS!=='undefined') ? (NOTIS_VIVOS.indexOf(k)>=0) : true;
    if(!fijo) hayApagable=true;
    /* ⛔ EL PORQUÉ VA PEGADO A LA FILA, no en una nota al pie: es la única respuesta a «¿por
       qué éste no tiene botón?», y al pie no la lee nadie. */
    filas+='<div class="dec" style="cursor:default"><span class="tx"><b>'+esc(e[0])+'</b>'+
      '<small>'+esc(e[1])+
      (fijo?' · <b>no se puede desactivar</b>: lleva plazo y consecuencias':'')+
      (vivo?'':' · <b>hoy no se manda ninguno de este tipo</b>: se guarda tu elección y '+
        'valdrá en cuanto exista')+
      '</small></span><span class="der">'+(fijo
        ? '<span class="chip ok">siempre</span>'
        : '<button class="btn" data-noti="'+esc(k)+'">'+(on?'Sí':'No')+'</button>')+
      '</span></div>';
  }
  if(!filas) return '<div class="nota">El servidor no ha listado ningún tipo de aviso.</div>';
  return '<div class="pan" style="border:0;margin:0">'+filas+'</div>'+
    '<div class="nota"><b>Turnos</b>, <b>reuniones</b> y <b>avisos y sanciones</b> llegan '+
    'siempre: llevan plazo y consecuencias, y perdérselos no es una molestia, es una sanción. '+
    'Lo decide el servidor, no esta pantalla.'+
    (hayApagable?' Lo demás lo eliges tú, y se aplica antes de enviarlo.':'')+
    '</div><p class="sc" id="notisMsgPref" style="padding:0 13px 11px"></p>';
}

/* ⛔ SE PIDE UNA VEZ, no en cada repintado: `pintar()` corre en cada interacción de la
   pantalla. Mismo patrón que `_cursoCargar_`. Y un fallo NO se lee como «todo activado»: se
   marca 'error' y el panel deja de enseñar interruptores. */
async function _notisCargar_(repintar){
  if(NOTIS_SRV!=='sin pedir') return;
  if(typeof backendOK==='undefined' || !backendOK || !SESION || !api.getNotis){
    NOTIS_SRV='error'; NOTIS_ERR='sin conexión'; return; }
  NOTIS_SRV='pidiendo';
  try{
    var r=await api.getNotis();
    /* ⛔ `r.tipos` O NADA. Un `{}` silencioso pintaría CERO filas y se leería como «no tienes
       ningún aviso», que es lo contrario de lo que pasa. */
    if(r && r.tipos){ NOTIS_PREF=r.tipos; NOTIS_SRV='ok'; NOTIS_ERR=null; }
    else { NOTIS_SRV='error'; NOTIS_ERR='el servidor no devolvió tus tipos'; }
  }catch(e){ NOTIS_SRV='error'; NOTIS_ERR=(e&&e.message)||String(e); }
  if(typeof repintar==='function') repintar();
}

function _engNotisPrefs_(m){
  var _r=m.querySelector('[data-notisreint]');
  if(_r) _r.onclick=function(){ NOTIS_SRV='sin pedir'; NOTIS_ERR=null; _notisCargar_(pintar); };
  $$('[data-noti]',m).forEach(function(b){
    b.onclick=async function(){
      if(b.disabled) return;
      var k=b.dataset.noti, antes=NOTIS_PREF[k]!==false;
      /* Se pinta el cambio YA y se deshace sólo si el servidor dice que no: dejar el dedo
         esperando una ida y vuelta a Apps Script se siente roto. */
      NOTIS_PREF[k]=!antes; b.textContent=(!antes)?'Sí':'No'; b.disabled=true;
      _notisMsgPref('');
      try{
        /* ⛔ El `await` va DENTRO del `try`: un `try/catch` alrededor de una llamada `async`
           sin esperarla no captura nada — el fallo sale como promesa rechazada y nadie lo ve. */
        var r=await api.guardarNotis(NOTIS_PREF);
        if(r && r.tipos) NOTIS_PREF=r.tipos;
        b.textContent=(NOTIS_PREF[k]!==false)?'Sí':'No';
      }catch(e){
        /* ⛔ EL ERROR DE UNA ESCRITURA NO SE TRAGA, y el control se deja VIVO. Si esto cayera
           en silencio, el interruptor se quedaría en pantalla diciendo «No» con el servidor
           guardando «Sí»: la persona creería haber apagado algo que le sigue llegando. Se
           deshace, se dice, y se puede volver a pulsar.
           ⚠️ Y no se repinta: `pintar()` se llevaría por delante este mensaje. */
        NOTIS_PREF[k]=antes; b.textContent=antes?'Sí':'No';
        _notisMsgPref('No se pudo guardar: '+((e&&e.message)||e));
      }
      b.disabled=false;
    };
  });
}

/* Su propio hueco, y no el `#notisMsg` de arriba: ese lo pisa `activarNotis` con el resultado
   del permiso, y dos mensajes distintos en la misma línea se leen como uno. */
function _notisMsgPref(t){ var b=document.getElementById('notisMsgPref'); if(b) b.textContent=t; }

