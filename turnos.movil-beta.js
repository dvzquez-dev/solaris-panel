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
  return '<div class="h1">Turnos</div><p class="h1s">Fabricación · en cuáles estás y quién más va.</p>'+
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

