/* ═══ NOTIS · cara movil ═══════════════════════════════════════════════════════════
   8 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

function _esIOS_(){ return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1); }

function _esStandalone_(){ return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone===true; }

function _notisMsg(t){ var b=$('#notisMsg'); if(b) b.textContent=t; }

/* ¿PUEDE ESTA APP FUNCIONAR SIN NOTIFICACIONES? No (Daniel, 28/07): «las notificaciones han
   de ser obligatorias de tener activadas, es decir, que si no estan activadas directamente que
   no te permita usar la aplicacion».

   Devuelve el motivo por el que NO se puede pasar, o `null` si se pasa:
     · `'imposible'` — el navegador no admite push. **Se deja pasar**: exigir algo que el
       aparato no puede dar no consigue notificaciones, solo un panel inservible.
     · `'ios'`       — iPhone fuera de la pantalla de inicio. SI se bloquea: aqui si se puede
       cumplir, instalandola, y es justo lo que hay que empujar.
     · `'pedir'`     — el permiso no esta dado y todavia se puede pedir.
     · `'denegado'`  — se denego. El navegador no vuelve a preguntar solo: hay que ir a los
       ajustes del sistema, y la pantalla dice donde. */
function _faltanNotis_(){
  if(!_pushSoportado_()) return null;                       // no puede: se pasa
  if(_esIOS_() && !_esStandalone_()) return 'ios';
  if(Notification.permission==='granted') return null;
  return (Notification.permission==='denied') ? 'denegado' : 'pedir';
}

/* La pantalla del gate. No es un aviso que se pueda cerrar: es la unica pantalla que hay
   hasta que el permiso este dado. El boton reintenta y, si cuela, arranca la app de verdad. */
function _gateNotis_(motivo, seguir){
  /* Al volver de los ajustes del telefono la pagina no se recarga: sigue viva y con el
     gate puesto. Sin esto habria que recargar a mano justo despues de hacer lo que se te
     acaba de pedir, que es la peor manera de terminar. */
  if(!_gateNotis_._mirando){
    _gateNotis_._mirando=true;
    document.addEventListener('visibilitychange', function(){
      if(document.hidden || !document.getElementById('loginGate')) return;
      if(!_faltanNotis_() && _gateNotis_._seguir){ var f=_gateNotis_._seguir; _gateNotis_._seguir=null; f(); }
    });
  }
  _gateNotis_._seguir=seguir;
  var cuerpo, boton='';
  if(motivo==='ios'){
    cuerpo='Para recibir los avisos en <b>iPhone</b> hay que abrir el panel desde la pantalla '+
      'de inicio.<br><br>Pulsa <b>Compartir</b> → <b>Añadir a pantalla de inicio</b>, y entra '+
      'desde ese icono.';
  } else if(motivo==='denegado'){
    cuerpo='Has denegado las notificaciones y <b>el navegador ya no vuelve a preguntar</b>: '+
      'hay que activarlas a mano en el teléfono.<br><br>'+
      '<b>Ajustes → Solaris</b> (o tu navegador) <b>→ Notificaciones → Permitir</b>.<br>'+
      'Vuelve aquí después: se comprueba solo.';
    boton='Ya las he activado';
  } else {
    cuerpo='<b>Antes de entrar</b>, activa las notificaciones.<br><br>El panel avisa de tus '+
      'turnos, de las reuniones y de las decisiones sobre tus documentos y tus horas. '+
      '<b>Sin ellas no se puede usar</b>: los avisos llegan tarde y de eso salen faltas.';
    boton='Activar notificaciones';
  }
  var g=_gate_(SPLASH+'<div style="max-width:330px;line-height:1.6">'+cuerpo+'</div>'+
    (boton?'<button id="btnGateNotis" style="border:1px solid #463E40;background:none;'+
      'color:#F4F3F3;border-radius:9px;padding:10px 16px;cursor:pointer">'+boton+'</button>':'')+
    '<div id="gateNotisMsg" style="opacity:.75;font-size:13px;max-width:330px"></div>');
  var b=g.querySelector('#btnGateNotis');
  if(b) b.onclick=async function(){
    b.disabled=true; b.textContent='Un momento…';
    var msg=g.querySelector('#gateNotisMsg');
    try{
      if(Notification.permission!=='granted') await Notification.requestPermission();
      if(Notification.permission==='granted'){
        /* Y se suscribe de verdad, no solo el permiso: un permiso sin suscripcion no
           entrega ni un aviso, y el gate habria dejado pasar a alguien que no recibe nada. */
        var reg=_swReg || await _registrarSW_();
        /* ⛔ SIN SERVICE WORKER NO SE PASA. Antes se llamaba a `seguir()` igual, o sea que
           quien no pudiera registrarlo entraba **sin ninguna suscripcion** -- justo lo que
           este gate existe para impedir. */
        if(!reg){
          if(msg) msg.textContent='No se pudo preparar el aviso en este navegador. '+
            'Prueba a abrir el panel desde el icono de la pantalla de inicio.';
          b.disabled=false; b.textContent=boton; return;
        }
        await navigator.serviceWorker.ready;
        var sub=await reg.pushManager.getSubscription();
        if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:_urlB64_(VAPID_PUBLIC)});
        /* ⛔ Y EL ERROR DE `guardarPush` NO SE TRAGA. Es la llamada que le dice al SERVIDOR
           donde mandar: una suscripcion que el servidor no conoce **no entrega nada**. Con
           `catch(_){}` se pasaba el gate creyendo estar cubierto, que es el agujero que el
           comentario de arriba dice cerrar. Ya mordio en el escritorio: faltaba esta misma
           llamada y el fallo se lo tragaba un catch vacio, roto desde siempre y sin señal. */
        if(typeof SESION!=='undefined' && SESION){
          try{ await api.guardarPush(sub.toJSON()); }
          catch(err){
            if(msg) msg.textContent='El permiso esta dado, pero no se pudo registrar el aviso '+
              'en el servidor, asi que NO te llegaria nada: '+((err&&err.message)||err);
            b.disabled=false; b.textContent=boton; return;
          }
        }
        seguir(); return;
      }
      if(msg) msg.textContent='Sigue sin permiso. Hay que darlo en los ajustes del móvil.';
    }catch(e){ if(msg) msg.textContent='No se pudo: '+((e&&e.message)||e); }
    b.disabled=false; b.textContent=boton;
  };
}

/* EQUIVALENTE (no GEMELA): el movil pide el permiso en el gate de arranque y tiene el panel de preferencias; el escritorio lo pide con un boton y distingue 'denied'. Divergen por la cara, y esta escrito. */
function _notisHTML_(){
  /* ⛔ SI EL ULTIMO REGISTRO FALLO, SE DICE AQUI. La suscripcion se re-guarda en cada
     apertura porque el navegador la rota; si eso falla y nadie lo cuenta, los avisos dejan
     de llegar **en silencio** y quien se pierde un turno cree que no le avisaron por otra
     cosa. Va arriba del todo: debajo de los interruptores no lo lee nadie. */
  var _fp=(typeof _pushFallo_==='function') ? _pushFallo_() : null;
  var _avisoFallo = _fp ? '<div class="tarj"><p class="rnota" style="margin:0;color:var(--warn)">'+
    '<b>No se pudo confirmar tu registro de avisos</b> la ultima vez que abriste el panel, '+
    'asi que puede que no te lleguen: '+esc(String(_fp))+'.<br>Cierra y vuelve a abrir; si '+
    'sigue, avisa.</p></div>' : '';
  if(!_pushSoportado_())
    return _avisoFallo+'<div class="tarj"><p class="rnota" style="margin:0;color:var(--warn)">Este navegador '+
      'no admite notificaciones. El panel las da por <b>obligatorias</b>, así que aquí te '+
      'estás perdiendo los avisos de turnos, reuniones y decisiones. Ábrelo en el móvil.</p></div>';
  if(_esIOS_() && !_esStandalone_())
    return _avisoFallo+'<div class="tarj"><p class="rnota" style="margin:0;line-height:1.6">Para recibir avisos en <b>iPhone</b>: '+
      'pulsa <b>Compartir</b> → <b>Añadir a pantalla de inicio</b> y abre la app desde ese icono.</p></div>';
  /* El botón de «activar» se fue: para llegar hasta aquí ya has pasado el gate del arranque.
     Lo que queda es elegir QUÉ te llega. */
  return _avisoFallo+'<div class="tarj"><div class="plg"><div class="plgh" data-plg data-p>'+
      '<b>Qué avisos quieres recibir</b><small>Se aplica en el servidor, antes de enviarlos</small>'+
      '<svg viewBox="0 0 24 24" style="margin-left:auto;width:15px;height:15px;fill:none;'+
        'stroke:currentColor;stroke-width:2.4;transition:transform .3s"><path d="M6 9l6 6 6-6"/></svg></div>'+
    '<div class="plgc" hidden id="notisLista">'+
      '<p class="rnota" style="margin:0 0 10px">Cargando tus preferencias…</p>'+
    '</div></div>'+
    '<p class="rnota" id="notisMsg" style="margin:8px 0 0"></p></div>';
}

/* Pinta la lista con lo que diga el SERVIDOR. Si no se puede leer se dice y no se enseñan
   interruptores: unos interruptores con un valor inventado son peores que no tenerlos, porque
   se tocan creyendo que hacen algo. */
function _pintarNotisLista_(){
  var c=$('#notisLista'); if(!c) return;
  if(!NOTIS_PREF){ c.innerHTML='<p class="rnota" style="margin:0;color:var(--warn)">No se pudieron '+
    'leer tus preferencias. Vuelve a abrir Ajustes.</p>'; return; }
  var filas='';
  for(var k in NOTIS_ETI){
    if(!(k in NOTIS_PREF)) continue;        // el servidor manda: si no lo lista, no existe
    var e=NOTIS_ETI[k], on=NOTIS_PREF[k]!==false, fijo=NOTIS_FIJOS.indexOf(k)>=0;
    /* ⛔ Y SI HOY NO LO EMITE NADIE, SE DICE. Es el mismo argumento de tres lineas mas
       abajo, aplicado al otro lado: encender «documentos» y creer que te avisaran de una
       revision pendiente es la misma promesa vacia que un interruptor que no apaga.
       ⚠️ Sin la lista se calla en vez de inventar: `true` = «se manda», que es lo que se
       venia haciendo, y asi un fallo al cargarla no llena la pantalla de avisos falsos. */
    var vivo=(typeof _notisVivos_==='function') ? (_notisVivos_().indexOf(k)>=0) : true;
    /* LOS FIJOS NO LLEVAN INTERRUPTOR (Daniel, 03/08). Ensenar uno que no hace nada es peor
       que no ensenarlo: lo apagas, crees que lo apagaste, te llegan igual — y a partir de ahi
       no te fias tampoco de los dos que si funcionan. */
    filas+='<div class="fila"><div class="a"><b>'+e[0]+'</b><small>'+e[1]+
      (fijo?' · <b>no se puede desactivar</b>':'')+
      ((!fijo && !vivo)?' · <b>hoy no se manda ninguno de este tipo</b>':'')+'</small></div>'+
      '<div class="d">'+(fijo
        ? '<span class="pil otor">siempre</span>'
        : '<button class="btn" data-noti="'+k+'" data-p>'+(on?'Sí':'No')+'</button>')+
      '</div></div>';
  }
  c.innerHTML=filas+'<p class="rnota" style="margin:10px 0 0"><b>Turnos</b>, <b>reuniones</b> y '+
    '<b>avisos y sanciones</b> llegan siempre: llevan plazo y consecuencias, y perdérselos no '+
    'es una molestia, es una sanción. Lo demás lo eliges tú.</p>';
  $$('[data-noti]',c).forEach(function(b){
    b.onclick=async function(){
      var k=b.dataset.noti, antes=NOTIS_PREF[k]!==false;
      /* Se pinta el cambio YA y se revierte solo si el servidor dice que no: dejar el dedo
         esperando una ida y vuelta a Apps Script se siente roto. */
      NOTIS_PREF[k]=!antes; b.textContent=(!antes)?'Sí':'No'; b.disabled=true;
      try{ var r=await api.guardarNotis(NOTIS_PREF); if(r && r.tipos) NOTIS_PREF=r.tipos; _notisMsg(''); }
      catch(e){ NOTIS_PREF[k]=antes; b.textContent=antes?'Sí':'No';
        _notisMsg('No se pudo guardar: '+((e&&e.message)||e)); }
      b.disabled=false;
    };
  });
}

async function _cargarNotis_(){
  if(typeof backendOK==='undefined' || !backendOK || !SESION){
    NOTIS_PREF=null; _pintarNotisLista_(); return; }
  try{ var r=await api.getNotis(); NOTIS_PREF=(r&&r.tipos)||null; }
  catch(_){ NOTIS_PREF=null; }
  _pintarNotisLista_();
}

