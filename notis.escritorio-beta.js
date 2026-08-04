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

function _notisMsg(t){ var b=document.getElementById('notisMsg'); if(b) b.textContent=t; }

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

function _notisHTML_(){
  if(!_pushSoportado_())
    return '<div class="nota" style="border-top:0">Este navegador no admite notificaciones.</div>';
  if(Notification.permission==='denied')
    return '<div class="nota" style="border-top:0">Las tienes <b>bloqueadas</b> en este navegador. '+
      'Hay que desbloquearlas en el candado de la barra de direcciones; desde aquí no se puede.</div>';
  if(Notification.permission==='granted')
    return '<div class="pb"><span class="chip ok">activadas</span>'+
      '<span class="sc" id="notisMsg" style="margin-left:10px"></span></div>';
  return '<div class="nota" style="border-top:0">Avisos de turnos, reuniones, partes de horas '+
    'y decisiones sobre documentos.</div>'+
    '<div class="pb"><button class="btn pri" id="btnNotis">Activar notificaciones</button>'+
    '<span class="sc" id="notisMsg" style="margin-left:10px"></span></div>';
}

