/* ═══ TURNOS · cara movil ═══════════════════════════════════════════════════════════
   5 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* El backend sirve el turno con SU forma (fecha ISO, roles:[{rol,miembro}], duracion, momento,
   punto, crucial, nota, principales, secundarios). La pantalla espera {id,f,hora,punto,dur,mio,
   roles:[[nombre,rol]],pasado}. Sin este adaptador se volcaba el objeto crudo y la pantalla salía
   vacía. Aquí se traduce y se conserva TODO lo que da el backend (objetivos, nota, memoria). */
function _normTurnoM_(t, ix){
  var iso=String(t.fecha||'').slice(0,10);
  var f=_isoADMY_(iso) || iso;
  var _yo=(YO&&YO.nombre)||'';
  /* [pila, rol, esYo] — el tercer campo permite RESALTAR tu fila sin repetir el cargo */
  var roles=(t.roles||[]).map(function(r){
    if(Array.isArray(r)) return [r[0], r[1]||'', false];
    var nom=r.miembro||r.nombre||'— libre';
    var m=(DATA.miembros||[]).filter(function(x){ return x.nombre===nom; })[0];
    return [ (m&&m.pila)||nom, r.rol||'', nom===_yo ];
  });
  var yo=(YO&&YO.nombre)||'', mio=null;
  (t.roles||[]).forEach(function(r){ if(!Array.isArray(r) && (r.miembro===yo)) mio=r.rol||'te toca'; });
  var hoyISO=_dmyAISO_(HOY);
  var dur=t.duracion || (t.momento==='tarde'?'tarde':(t.momento==='mañana'?'mañana':'—'));
  /* `hecho` manda sobre la fecha: lo que decide si un turno sale suelto o al cajon es
     su ESTADO en Notion, no que la fecha haya pasado (un turno de ayer sin cerrar sigue vivo). */
  var est=t.estado||'';
  return { id: t.id || ('T-'+(iso||ix)), f:f, iso:iso, hora:t.hora||'—', punto:t.punto||'—', dur:dur,
    lugar:t.lugar||null, estado:est, hecho: est ? (est==='Realizado'||est==='Cancelado') : !!(iso && iso < hoyISO),
    mio:mio, roles:roles, pasado: !!(iso && iso < hoyISO),
    principales:t.principales||[], secundarios:t.secundarios||[],
    nota:t.nota||null, crucial:!!t.crucial, memoria:t.memoria||null, _real:true };
}

/* Solo TUS turnos: aqui no pinta ver los de los demas. (Un boton de 'ver todos'
   queda para mas adelante.) Y el corte no es futuro/pasado sino REALIZADO o no:
   lo que sigue vivo va suelto y visible; lo cerrado, al cajon. */
function _mioTurno_(t){ return !!(t.mio || (t.roles||[]).some(function(r){ return r[2]; })); }

/* La memoria va PLEGADA: la mayoria de las veces se abre la ficha para ver quien va y a
   que hora, no para leer el informe. */
function _memoriaHTML_(t){
  return _visorHTML_({id:_idDrive_(t.memoria), url:t.memoria, titulo:'Memoria de fabricación',
    sub:t.f, queEs:'la memoria', plegado:true});
}

/* Se conserva el nombre porque lo llaman las fichas de turno; por dentro ya es el visor
   unico. Un alias es mas honesto que dejar la copia viva «por si acaso». */
function _cablearMemoria_(){ _cablearVisor_(); }

/* ═══ CUBRIR DISPONIBILIDAD PARA TURNOS ═════════════════════════════════════════════
   La mitad de miembro: ver qué semana se pregunta, cuánto queda de plazo y marcar.
   La mitad de administrador —convocar y ver el mapa con el desglose— es del escritorio.

   ⛔ AQUÍ NO SE CALCULA NINGUNA FECHA DE CALENDARIO. `abre` y `limite` vienen dados; esta
   cara solo los compara. La regla vive en `reglas/convocatoria.py`, una sola vez.
   ⛔ Y el modelo de la celda es el de `reglas/turnos.py`: ausente = no ha contestado ·
   `{s:'no'}` = ha dicho que no puede · `{s:<sitio>|'ambos',c:bool}` = puede, dónde y si
   lleva coche. Los TRES estados, no dos: es el único acierto de diseño del excel que se
   viene a sustituir, y la diferencia importa porque solo al mudo se le puede insistir. */

/* GEMELA de `reglas/turnos.py:clave`. El separador se prueba contra el de Python en
   `rutinas/probar_turnos.py` §12: si alguien cambia uno, el banco lo canta. */
function _convClave_(dia, franja){ return dia+'|'+franja; }

/* La otra mitad de la puerta: DESCOMPONER la clave. Vive pegada a `_convClave_` y el separador
   lo saca de ELLA — escribirlo aquí otra vez sería tener el formato en dos sitios, que es justo
   lo que `_convClave_` existe para impedir: el día que uno cambie, el otro deja de casar y la
   respuesta DESAPARECE sin dar error. */
function _convDeClave_(k){
  var sep=_convClave_('',''), s=String(k), i=s.indexOf(sep);
  return i<0 ? [s, ''] : [s.slice(0,i), s.slice(i+sep.length)];
}

/* `sin_abrir` | `abierta` | `cerrada`. Sin instantes NO se escribe: la frontera cerrada es
   lo que hace que una celda vacía signifique una sola cosa. */
function _convEstado_(cv, ahora){
  var t=ahora?+ahora:Date.now(), a=Date.parse(cv.abre), l=Date.parse(cv.limite);
  if(isNaN(a)||isNaN(l)) return 'cerrada';
  if(t<a) return 'sin_abrir';
  return t<=l ? 'abierta' : 'cerrada';
}

/* Las horas que TE quedan a ti para contestar. Ojo: NO es `ventana_real_h` de Python, que
   contesta a otra pregunta —«si convoco ahora, cuánto le queda a la gente»— y es de quien
   convoca. Misma aritmética, distinta pregunta: por eso son dos y no una. */
function _convQuedan_(cv, ahora){
  var t=ahora?+ahora:Date.now(), l=Date.parse(cv.limite);
  return isNaN(l)||l<=t ? 0 : (l-t)/3600000;
}

/* La convocatoria que hay que enseñar: la primera abierta a la que estás convocado. */
function _convAbierta_(){
  var yo=(YO&&YO.nombre)||'';
  var vivas=(typeof CONVOCATORIAS!=='undefined'?CONVOCATORIAS:[]).filter(function(cv){
    if(_convEstado_(cv)!=='abierta') return false;
    var inv=cv.invitados||[];
    return !inv.length || inv.indexOf(yo)>=0;
  });
  return vivas[0]||null;
}

/* Las clases de estado que puede llevar una celda, sacadas de la convocatoria. Cablearlas
   haría que un sitio nuevo dejara restos de la clase anterior al repintar. */
function _convClases_(cv){ return (cv.sitios||[]).concat(['ambos','no']); }

function _convMias_(cv){
  var yo=(YO&&YO.nombre)||'';
  if(!cv.resp) cv.resp={};
  if(!cv.resp[yo]) cv.resp[yo]={};
  return cv.resp[yo];
}

/* Cuántas celdas has marcado y cuántas has dejado en blanco. El segundo número es el que
   importa: en blanco no es «no puedo», es «no has contestado». */
function _convCuenta_(cv){
  var mias=_convMias_(cv), n=0, no=0, coches=0, total=0;
  (cv.dias||[]).forEach(function(d){
    (cv.franjas||[]).forEach(function(fr){
      total++;
      var v=mias[_convClave_(d,fr.k)];
      if(!v||!v.s) return;
      if(v.s==='no'){ no++; return; }
      n++; if(v.c) coches++;
    });
  });
  return {puedo:n, no:no, coches:coches, total:total, blanco:total-n-no};
}

function _convCelHTML_(cv, dia, franja){
  var v=_convMias_(cv)[_convClave_(dia,franja)]||null;
  var cls=(v&&v.s)?(' '+v.s):'';
  var cch=(v&&v.s&&v.s!=='no'&&v.c)?'<span class="cch">🚗</span>':'';
  var txt=(v&&v.s==='no')?'\u2013':'';
  return '<div class="tcel'+cls+'" data-tk="'+_convClave_(dia,franja)+'" data-p>'+txt+cch+'</div>';
}

/* La tarjeta entera. Va la PRIMERA de la pantalla de turnos: lo que caduca manda sobre lo
   que ya está decidido. */
/* ⛔ SIN CONVOCATORIA, EL HUECO HABLA. Aqui había `if(!cv) return '';`, o sea que la pantalla
   de Turnos **no decía nada** cuando no hay ninguna semana abierta. Daniel (07/08):
   *«¿dónde está para rellenar disponibilidad en turnos? aún no lo hiciste…»* — y estaba hecho
   entero: la rejilla, el pincel, el guardado en el servidor. Lo que fallaba es que **sin una
   convocatoria viva no se ve**, y nadie te dice que eso es lo que falta.

   ⚠️ Y el que tiene que convocar es él, así que la app le escondía justo la acción que lo
   desbloqueaba. Es el mismo patrón del día: **la ausencia de dato es silenciosa**, y un hueco
   mudo se lee como «esto no existe», no como «esto está vacío».

   Se dice a todo el mundo (para que nadie lo busque en balde) y a quien puede convocar se le
   añade **dónde** se hace: convocar vive en el escritorio, no aquí.

   ⚠️ Rango ≥ 3 es el MISMO criterio con el que el escritorio deja convocar. No se reutiliza
   `_novPuedeRegistro_`, que da ese mismo número pero significa otra cosa («esto lo revisa el
   PD»): atar dos reglas porque hoy coinciden es cómo se separan mal el día que una cambie. */
function _puedeConvocarT_(){
  return (typeof _rangoBeta_==='function') && _rangoBeta_() >= 3;
}
function _convHTML_(cv){
  if(!cv) return '<div class="tarj" style="opacity:.85">'+
    '<div class="cab"><span>Disponibilidad para turnos</span></div>'+
    '<p style="margin:6px 0 0;line-height:1.55;font-size:13px">'+
    'Ahora mismo <b>no hay ninguna semana convocada</b>, así que no hay nada que rellenar. '+
    'Cuando se abra un plazo aparece aquí la rejilla para pintar tus ratos.'+
    (_puedeConvocarT_() ? '<br><br><span style="opacity:.75">Convocar una semana se hace desde el '+
      '<b>escritorio</b> → Turnos → «Convocar disponibilidad».</span>' : '')+
    '</p></div>';
  var F=cv.franjas||[], D=cv.dias||[];
  var urge=_convQuedan_(cv)<12;
  var lim=_isoADMY_(String(cv.limite).slice(0,10))||String(cv.limite).slice(0,10);
  var hora=String(cv.limite).slice(11,16);
  var pin=function(k,txt){
    return '<button data-pin="'+k+'" class="'+(CONV_PINCEL===k?'on':'')+'" data-p>'+txt+'</button>';
  };
  /* `_diaTxtM_` espera DD/MM, no ISO: pasarle la fecha ISO devuelve la propia cadena sin
     inventarse un día —hace bien—, así que se convierte antes. Sale «lun 10/08»: el primer
     trozo es el día de la semana y el segundo el número. */
  var cab='<div class="rc rd"></div>'+D.map(function(d){
    var p=String(_diaTxtM_(_isoADMY_(d)||d)||'').split(' ');
    return '<div class="rc">'+esc(p[0]||'')+'<br>'+esc(String(p[1]||'').slice(0,2))+'</div>';
  }).join('');
  var filas=F.map(function(fr){
    return '<div class="rc rd">'+esc(fr.txt)+'</div>'+
      D.map(function(d){ return _convCelHTML_(cv,d,fr.k); }).join('');
  }).join('');
  return '<div class="tarj" id="convC">'+
    _convCabHTML_(cv)+
    '<div class="tpin">'+pin('cuvi','CUVI')+pin('citi','CITI')+pin('ambos','Los dos')+
      pin('no','No puedo')+
      '<button data-pin-coche class="coche '+(CONV_COCHE?'on':'')+'" data-p>🚗 con coche</button>'+
    '</div>'+
    /* 78 px y no 64: «Tarde/noche» no cabe en 64 y, al ser `nowrap` + `flex-end` + `sticky`,
       se sale por la izquierda y SE CORTA. No lo caza ninguna prueba de DOM —el `textContent`
       está entero— sino mirar la pantalla. Con 7 días a 34 px mínimos siguen cabiendo 316 px. */
    '<div class="rejw"><div class="rej" id="convRej" style="grid-template-columns:78px repeat('+
      D.length+',minmax(34px,1fr))">'+cab+filas+'</div></div>'+
    '<div class="tplazo'+(urge?' urge':'')+'" id="convPie">'+_convPieHTML_(cv)+'</div>'+
    '<p class="rnota" style="margin-top:10px">Hasta el <b>'+esc(lim)+'</b> a las '+esc(hora)+
      '. Fuera de plazo no se puede marcar: por eso una casilla en blanco significa una sola '+
      'cosa, que no has contestado.</p>'+
  '</div>';
}

/* La cabecera de la tarjeta: qué semana se pregunta y quién lo pide. */
function _convCabHTML_(cv){
  var ini=_isoADMY_(cv.dias[0])||cv.dias[0], fin=_isoADMY_(cv.dias[cv.dias.length-1])||'';
  return '<div class="mtit" style="margin:0 0 2px">Disponibilidad para turnos</div>'+
    '<div class="msub">Semana del '+esc(ini)+' al '+esc(fin)+
      (cv.convocante?' · lo pide '+esc(cv.convocante.split(' ')[0]):'')+'</div>';
}

function _convPieHTML_(cv){
  var q=_convQuedan_(cv), c=_convCuenta_(cv);
  var t = q<=0 ? 'Plazo cerrado'
        : q<1  ? 'Quedan <b>'+Math.round(q*60)+' min</b>'
               : 'Quedan <b>'+Math.round(q)+' h</b>';
  /* ⛔ CON FRANJAS DE UNA HORA, EL NÚMERO SON HORAS, NO RESPUESTAS. Desde que un toque marca
     el turno entero, «marcadas 4» después de UN gesto se lee como si hubieras contestado cuatro
     veces — cuando has dicho una sola cosa. Se dice en horas, y se añaden los turnos, que es la
     unidad en la que piensa quien reparte. Con dos franjas (`min_h` a 1) se deja como estaba:
     ahí cada casilla sí es una respuesta. */
  var min=_minTurno_(cv);
  var marcadas = min>1
    ? c.puedo+' h'+(c.puedo>=min ? ' ('+Math.floor(c.puedo/min)+(Math.floor(c.puedo/min)===1?' turno':' turnos')+')' : '')
    : ''+c.puedo;
  return t+' · marcadas <b>'+marcadas+'</b>'+(c.no?' · no puedo en '+c.no:'')+
    (c.coches?' · con coche '+c.coches:'')+
    (c.blanco?' · <b>'+c.blanco+'</b> sin contestar':' · todo contestado');
}

/* Pintar una celda con el pincel activo. Volver a pintar lo mismo la BORRA: sin eso no habría
   forma de deshacer una marca, y dejar «no puedo» puesto por error es peor que no marcar. */
function _convPintar_(cv, k){
  var mias=_convMias_(cv), v=mias[k]||null;
  var quiere = CONV_PINCEL==='no' ? {s:'no'} : {s:CONV_PINCEL, c:!!CONV_COCHE};
  var igual = v && v.s===quiere.s && (quiere.s==='no' || !!v.c===!!quiere.c);
  /* ⛔ SE PINTA EL TURNO ENTERO, no la casilla. Con franjas de una hora, marcar a mano las
     cuatro de un turno son cuatro toques y tres ocasiones de dejarse una — y una hora suelta
     marcada no es disponibilidad para nada. El día que la convocatoria venga con dos franjas
     (`min_h` a 1) esto marca UNA, que es lo correcto ahí. */
  var par = _convDeClave_(k), dia = par[0];
  var bloque = _bloqueDesde_(cv.franjas, par[1], _minTurno_(cv));
  if(!bloque.length) bloque = [par[1]];
  bloque.forEach(function(fk){
    var kk = _convClave_(dia, fk);
    if(igual) delete mias[kk]; else mias[kk]=quiere;
  });
  return !igual;
}

/* ═══ LA CONVOCATORIA VIENE DEL SERVIDOR (v64) ═════════════════════════════════════
   Hasta ahora `CONVOCATORIAS` era **semilla**: se pintaba, y al recargar no quedaba nada.

   ⛔ **Con sesión, el servidor MANDA — también cuando dice que no hay ninguna.** Si el
   servidor contesta «ninguna abierta» y la pantalla se quedara con la de demo, estaría
   enseñando un plazo que no existe y recogiendo respuestas que no van a ninguna parte. Eso es
   peor que no enseñar nada, porque nadie lo nota.

   ⛔ **Se guarda AL SOLTAR EL DEDO, no por celda.** Un arrastre sobre una fila entera son 14
   celdas: guardar en cada una serían 14 peticiones para una sola decisión. El trazo es la
   unidad natural — empieza al tocar y acaba al levantar.

   ⚠️ Y **la rejilla se manda ENTERA**, que es lo que el servidor espera: guardar «solo lo que
   cambió» haría imposible **quitar** una marca. */
function _convEstadoSrv_(v){
  if (v !== undefined) window.__convSrvEstado = v;
  return window.__convSrvEstado || 'sin pedir';
}

function _convCargar_(repintar){
  if (_convEstadoSrv_() !== 'sin pedir') return;
  if (typeof SESION==='undefined' || !SESION || typeof api==='undefined' || !api.getConvocatoria) return;
  _convEstadoSrv_('pidiendo');
  api.getConvocatoria().then(function(r){
    _convEstadoSrv_('ok');
    if(!r || !r.convocatoria){
      /* El servidor manda: sin convocatoria abierta, no se enseña la de demo. */
      if(typeof CONVOCATORIAS!=='undefined') CONVOCATORIAS.length=0;
    } else {
      var cv=r.convocatoria, yo=(YO&&YO.nombre)||'';
      cv.resp={}; cv.resp[yo]=r.mias||{};
      if(typeof CONVOCATORIAS!=='undefined'){ CONVOCATORIAS.length=0; CONVOCATORIAS.push(cv); }
    }
    if(typeof repintar==='function') repintar();
  }).catch(function(){ _convEstadoSrv_('error'); });
}

/* Manda la rejilla al servidor. Sin esperar a que llegue para repintar —el dedo ya la vio
   cambiar— pero **avisando si falla**: una disponibilidad que se pierde en silencio es la que
   luego hace que te pongan un turno cuando no puedes. */
function _convGuardar_(cv){
  if(!cv || typeof SESION==='undefined' || !SESION) return;
  if(typeof api==='undefined' || !api.guardarDisponibilidad) return;
  api.guardarDisponibilidad(cv.id, _convMias_(cv)).catch(function(e){
    if(typeof tost==='function') tost('No se pudo guardar tu disponibilidad: '+((e&&e.message)||e));
  });
}

function _engConv_(){
  _convCargar_(function(){ if(typeof pintar==='function') pintar(); });
  var cv=_convAbierta_(); if(!cv) return;
  var rej=$('#convRej'); if(!rej) return;
  var repinta=function(){
    (cv.dias||[]).forEach(function(d){
      (cv.franjas||[]).forEach(function(fr){
        var k=_convClave_(d,fr.k), el=rej.querySelector('[data-tk="'+k+'"]');
        if(!el) return;
        var v=_convMias_(cv)[k]||null;
        /* ⛔ NO se asigna `className` entero: eso borraría las clases que pone OTRO sistema
           —aquí `pulsa`, la animación que la app aplica a todo `data-p`—. Se vio en el
           navegador: la celda acababa con una u otra según quién escribiera el último.
           Y la lista de clases a quitar sale de los DATOS, no cableada: si mañana hay un
           tercer sitio, esto sigue limpiando bien. */
        _convClases_(cv).forEach(function(c){ el.classList.remove(c); });
        if(v&&v.s) el.classList.add(v.s);
        el.innerHTML=((v&&v.s==='no')?'\u2013':'')+
          ((v&&v.s&&v.s!=='no'&&v.c)?'<span class="cch">🚗</span>':'');
      });
    });
    var pie=$('#convPie'); if(pie) pie.innerHTML=_convPieHTML_(cv);
  };
  $$('#convC [data-pin]').forEach(function(b){
    b.onclick=function(){
      CONV_PINCEL=b.dataset.pin;
      $$('#convC [data-pin]').forEach(function(x){ x.classList.toggle('on', x===b); });
    };
  });
  var bc=$('#convC [data-pin-coche]');
  if(bc) bc.onclick=function(){ CONV_COCHE=!CONV_COCHE; bc.classList.toggle('on', CONV_COCHE); };
  /* Pintar a dedo y de arrastre, como en reuniones. ⚠️ `setPointerCapture` LANZA si el puntero
     no es suyo, y al lanzar aborta el resto del manejador: va envuelto (ya pasó en el pintor). */
  var pintando=false;
  rej.addEventListener('pointerdown', function(e){
    var el=e.target.closest('[data-tk]'); if(!el) return;
    if(_convEstado_(cv)!=='abierta') return;
    pintando=true;
    try{ rej.setPointerCapture(e.pointerId); }catch(_){}
    _convPintar_(cv, el.dataset.tk); repinta();
  });
  rej.addEventListener('pointermove', function(e){
    if(!pintando) return;
    var el=document.elementFromPoint(e.clientX, e.clientY);
    el=el&&el.closest?el.closest('[data-tk]'):null;
    if(!el||el._ult===CONV_PINCEL+CONV_COCHE) return;
    el._ult=CONV_PINCEL+CONV_COCHE;
    _convPintar_(cv, el.dataset.tk); repinta();
  });
  var fin=function(){
    /* ⛔ El guardado va AQUI y no en cada celda: el trazo es la unidad de decisión, y una
       fila entera son 14 celdas. `pintando` lo vigila para no guardar en un `pointerup`
       que no venía de pintar nada. */
    if(pintando) _convGuardar_(cv);
    pintando=false;
    $$('#convC [data-tk]').forEach(function(x){ x._ult=null; });
  };
  rej.addEventListener('pointerup', fin);
  rej.addEventListener('pointercancel', fin);
}

function vTurnos(){
  /* Por defecto SOLO LOS TUYOS -decision de Daniel-, con un conmutador para ver los del
     equipo. Los de otros se pintan igual pero sin poder tocarlos: ver quien va a que sirve
     para organizarse; apuntarse en el turno de otro, no. */
  var base=TURNOS_TODOS ? TURNOS.slice() : TURNOS.filter(_mioTurno_);
  var mios=base;
  var prox=mios.filter(function(t){ return !t.hecho; });
  var pas=mios.filter(function(t){ return t.hecho; });
  var nTodos=TURNOS.length, nMios=TURNOS.filter(_mioTurno_).length;
  function tarjeta(t){
    return '<div class="tarj clic" data-turno="'+t.id+'" data-p>'+
      cab(t.f+(t.crucial?' · crucial':''), t.hora)+
      '<div class="fila" style="padding-top:0"><div class="a"><b>'+esc(t.punto)+'</b>'+
      '<small>'+esc(t.hora)+' · '+esc(t.dur)+(t.lugar?' · '+esc(t.lugar):'')+'</small></div>'+
      '<div class="d"><span class="chev">›</span></div></div>'+
      t.roles.map(function(r){
        return '<div class="fila'+(r[2]?' yo':'')+'"><div class="a"><b>'+esc(r[0])+'</b>'+
          '<small>'+esc(r[1])+'</small></div></div>';
      }).join('')+'</div>';
  }
  /* los pasados van en CAJÓN plegable, como en app.html: no estorban pero están */
  pas.sort(function(a,b){ return String(b.iso||'').localeCompare(String(a.iso||'')); });
  /* los vivos van SUELTOS: sin cabecera de seccion ni etiquetas, para que canten */
  /* La convocatoria va la PRIMERA: lo que caduca manda sobre lo que ya está decidido. */
  return '<div class="h1">Turnos</div><p class="h1s">Fabricación · en cuáles estás y quién más va.</p>'+
    _convHTML_(_convAbierta_())+
    /* El conmutador solo aparece si hay algo mas que ver: con todos los turnos siendo tuyos,
       un boton que no cambia nada es ruido que hay que leer igual. */
    (nTodos>nMios
      ? '<div class="modos" id="turnoModo" style="margin-bottom:11px">'+
          '<button data-tt="0" class="'+(TURNOS_TODOS?'':'on')+'" data-p>Los míos · '+nMios+'</button>'+
          '<button data-tt="1" class="'+(TURNOS_TODOS?'on':'')+'" data-p>Todos · '+nTodos+'</button>'+
        '</div>'
      : '')+
    (prox.length? prox.map(tarjeta).join('')
      : '<div class="tarj">'+vacio(TURNOS_TODOS?'Sin turnos por delante':'Sin turnos por delante',
          TURNOS_TODOS
            ? 'No hay ningún turno de fabricación convocado. Cuando alguien convoque uno, aparecerá aquí.'
            : 'No tienes ningún turno de fabricación asignado. Cuando te convoquen a uno, aparecerá aquí.'+
              (nTodos>nMios?' Hay '+nTodos+' del equipo: míralos con «Todos».':''),'',false)+'</div>')+
    (pas.length? '<div class="cajon" data-caj data-p><span>Turnos pasados <b>· '+pas.length+'</b>'+
        (pas[0].f?' <span style="color:var(--ink3)">· el último, '+esc(pas[0].f)+'</span>':'')+'</span>'+
        '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div>'+
        '<div class="cajsec">'+pas.map(tarjeta).join('')+'</div>' : '');
}

