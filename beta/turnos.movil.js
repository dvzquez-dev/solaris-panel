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

/* ⚠️ `_convEstado_`, `_convQuedan_` y `_convClases_` SE MUDARON A `comun.js` el 14/08,
   cuando el escritorio necesito contestar la convocatoria: esta cara no carga
   `turnos.movil.js`, asi que la alternativa era una segunda copia -- y cinco copias de
   la misma funcion acaban siendo cinco funciones distintas, con las diferencias
   haciendo de bugs. `_convAbierta_` se queda AQUI: usa `YO`, que es global del movil. */

/* La convocatoria que hay que enseñar: la primera abierta a la que estás convocado. */
function _convAbierta_(){
  var yo=(YO&&YO.nombre)||'';
  var vivas=(typeof CONVOCATORIAS!=='undefined'?CONVOCATORIAS:[]).filter(function(cv){
    /* ⛔⛔ TRES ESTADOS, NO DOS (456.ª). Esto preguntaba `!=='abierta'` a una función
       que devuelve `sin_abrir | abierta | cerrada`, así que durante `sin_abrir` —la
       convocatoria está montada, sus días existen, su plazo abre el jueves a las 22:00—
       esta cara devolvía `null` y `_convHTML_` escribía *«Ahora mismo no hay ninguna
       semana convocada»*. Al PD, además, le ofrecía **convocar otra**.
       ⛔ La ventana no es un borde: `abre = limite - 48 h` (`reglas/convocatoria.py:46`)
       y el gate monta la convocatoria en cuanto se encola, así que por la vía
       automática (`cal.proxima()`) dura **hasta 7 días** diciendo que no hay nada.
       ⚠️ `cerrada` SÍ se queda fuera: ahí no hay nada que enseñar ni que contestar.
       ⚠️ Esta función devuelve la convocatoria; **quién puede tocarla lo deciden
       `_convHTML_` (que pinta la rejilla en `off`) y el guardia del `pointerdown`**.
       Mezclarlo aquí dejaría a `_engConv_` sin nada que enganchar y el pie sin repintar. */
    var _e=_convEstado_(cv);
    if(_e!=='abierta' && _e!=='sin_abrir') return false;
    var inv=cv.invitados||[];
    return !inv.length || inv.indexOf(yo)>=0;
  });
  return vivas[0]||null;
}

/* (`_convClases_` tambien vive ahora en `comun.js` — ver la nota de arriba.) */

function _convMias_(cv){
  /* ⛔ LA FILA QUE SE LEE ES LA QUE SE VA A ESCRIBIR. Aquí ponía `YO.nombre`, y con
     «Ver como» eso pintaba la rejilla del suplantado -- que no está cargada, o sea **en
     blanco** -- mientras el servidor, que identifica por TOKEN, escribía la tuya. Y la
     rejilla viaja entera: tu disponibilidad real quedaba sustituida por esa rejilla
     vacía, bajo el nombre de otra persona y sin forma de verlo. */
  var yo=(typeof _actorSanc_==='function') ? _actorSanc_() : ((YO&&YO.nombre)||'');
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

/* ⛔⛔ LA PUERTA DE AVISOS QUE ESTA CARA NO TENIA (578.ª). El escritorio la tiene desde la
   466.ª (`_dispAviso_`); aqui el estado del servidor se mantenía con cuidado y **no lo leía
   nadie que dibujara**. 📏 Medido antes de escribir esto: `_convEstadoSrv_` salía **5 veces en
   todo el repo** — la declaracion y cuatro escrituras — y **ninguna era un pintado**.
   ⛔ EL DAÑO: con el servidor caido, o sin sesion, `CONVOCATORIAS` se queda como estaba y
   `_convHTML_(null)` escribe «Ahora mismo **no hay ninguna semana convocada**». Eso es una
   afirmacion sobre el mundo, y la verdad es *no lo se*. A quien lo lee le dice que no tiene
   nada que rellenar — y el plazo corre igual: no contestar es exactamente lo que hace que te
   pongan un turno cuando no puedes. Es §3c-24 en la cara donde contestan los 32.
   ⚠️ Y `'sin pedir'` SIGUE MUDO A PROPOSITO: es el instante normal antes de la primera
   carga, porque `_engConv_` corre DESPUES de pintar. Avisar ahi taparia la pantalla en cada
   pintado, que es el falso positivo que acaba apagando el guardia (§3c-22). */
function _convAviso_(){
  var e = (typeof _convEstadoSrv_==='function') ? _convEstadoSrv_() : 'sin pedir';
  if(e === 'error') return '<div class="tarj" style="opacity:.85">'+
    '<div class="cab"><span>Disponibilidad para turnos</span></div>'+
    '<p style="margin:6px 0 0;line-height:1.55;font-size:13px">'+
    '<b>No se pudo preguntar al servidor</b>, as\u00ed que <b>no se sabe</b> si hay una semana '+
    'convocada. Esto <b>no</b> quiere decir que no la haya, y el plazo corre igual.'+
    '<br><br><button class="btn" data-convreint>Reintentar</button></p></div>';
  if(e === 'sin sesion') return '<div class="tarj" style="opacity:.85">'+
    '<div class="cab"><span>Disponibilidad para turnos</span></div>'+
    '<p style="margin:6px 0 0;line-height:1.55;font-size:13px">'+
    'No se pudo preguntar: <b>no hay sesi\u00f3n</b>. Sin identidad el servidor no dice qu\u00e9 semana '+
    'est\u00e1 convocada, as\u00ed que <b>no se sabe</b> si tienes algo que rellenar. Entra con tu '+
    'cuenta y vuelve a esta pantalla.</p></div>';
  return '';
}
function _convHTML_(cv){
  /* ⛔ EL AVISO VA ANTES DE AFIRMAR QUE NO HAY NADA (578.ª): si se pregunta despues, el
     `return` de abajo se lo lleva por delante y la pantalla vuelve a decir «no hay
     ninguna semana convocada» sobre un servidor que no ha contestado. Es la misma nota
     que tiene `_dispPanel_` en el escritorio, y por la misma razon. */
  if(!cv){ var _av=_convAviso_(); if(_av) return _av; }
  if(!cv) return '<div class="tarj" style="opacity:.85">'+
    '<div class="cab"><span>Disponibilidad para turnos</span></div>'+
    '<p style="margin:6px 0 0;line-height:1.55;font-size:13px">'+
    'Ahora mismo <b>no hay ninguna semana convocada</b>, así que no hay nada que rellenar. '+
    'Cuando se abra un plazo aparece aquí la rejilla para pintar tus ratos.'+
    (_puedeConvocarT_() ? '<br><br><span style="opacity:.75">Convocar una semana se hace desde el '+
      '<b>escritorio</b> → Turnos → «Convocar disponibilidad».</span>' : '')+
    '</p></div>';
  /* ⛔ EL ESTADO SE PREGUNTA UNA VEZ Y ARRIBA. `_convAbierta_` ya deja pasar `sin_abrir`,
     así que aquí llega una convocatoria de verdad a la que **todavía no se puede
     contestar**. Se saca a `_convPreHTML_` en vez de sembrar `if`s por el cuerpo: metida
     dentro no habría forma de ejecutarla en el arnés y su mutación saldría ciega — es la
     misma razón por la que `_convPieHTML_` vive fuera de esta función. */
  if(_convEstado_(cv)==='sin_abrir') return _convPreHTML_(cv);
  var F=cv.franjas||[], D=cv.dias||[];
  var urge=_convQuedan_(cv)<12;
  /* ⛔ POR `_normLimite_` (465.ª): aquí se cortaba `cv.limite` **en crudo** por las
     posiciones 10 y 11 —el cableado por posición que la 463.ª quitó de
     `_isoFechaHora_`, vivo una línea más abajo—. 📏 Medido sobre 5 formas: **2 de 5**
     dejaban la hora VACÍA —las peladas, que es lo que manda un `<input type="date">`—
     y la nota decía *«Hasta el 14/09/2026 a las »*. La puerta le pone `23:59`, que es
     lo que significa «cierra ese día» y lo que ya decide `_plazoAbierto_`. */
  var _li=_normLimite_(cv.limite);
  var lim=_isoADMY_(_li.slice(0,10))||_li.slice(0,10);
  var hora=_li.slice(11,16);
  /* ⛔ LOS SITIOS SALEN DE LA CONVOCATORIA, NO CABLEADOS (290.ª, 23/08). Aquí estaban
     tecleados los cuatro en la **única cara donde contestan los 32**, mientras el
     escritorio —escrito después— ya sacaba la lista de `_convClases_(cv)` y lo dejaba
     escrito: *«los sitios NO se cablean … para que las dos caras no acaben con dos listas
     distintas»*. Y doce líneas más abajo (`_engConv_`), `_convClases_(cv)` **ya** limpiaba
     las clases sacándolas de los datos: pintar con una lista y limpiar con otra deja la
     celda marcada de un sitio que el repintado no conoce.
     ⛔ Y EL PINCEL ELEGIDO SE NORMALIZA CONTRA ESTA convocatoria: nace en `movil.html`
     valiendo `'cuvi'` —la tercera copia de la misma lista—, así que una semana sin CUVI
     venía con un sitio inexistente marcado y el primer trazo escribía `{s:'cuvi'}`. */
  var clases=_convClases_(cv);
  if(clases.indexOf(CONV_PINCEL)<0) CONV_PINCEL=clases[0]||'no';
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
    '<div class="tpin">'+clases.map(function(k){ return pin(k, esc(_convEtiq_(k))); }).join('')+
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

/* La tarjeta de una convocatoria que EXISTE y todavía NO ABRE (456.ª).

   ⛔ SE ENSEÑA LA SEMANA, NO UN ANUNCIO. El dato útil aquí no es «puedes contestar» sino
   **qué te van a preguntar**: qué días, qué franjas y qué sitios. Eso se lee de un vistazo en
   la rejilla y no se lee en prosa — y una tarjeta sin rejilla vuelve a esconder la forma de
   la semana, que es la versión suave del hueco mudo del 07/08.
   ⛔ Y NO SE PUEDE TOCAR: sin `data-tk`, sin `id="convRej"` y sin la fila de pinceles. El
   pincel y el botón de coche **son la promesa de poder pintar**; dejarlos puestos y confiar
   en el guardia del `pointerdown` sería un rótulo que miente. Son tres capas y a propósito:
   (1) sin `data-tk` no hay celda que encontrar, (2) sin `#convRej` `_engConv_` sale solo y no
   engancha ni un manejador, (3) el guardia del `pointerdown`.
   ⚠️ `off` no es una clase nueva: es la de `.ecel.off` (`movil.css`), la celda «fuera del
   horario de ese día» de las encuestas — la misma situación exacta, y la decisión ya tomada.
   ⚠️ `data-abre` es un asidero **ASCII** para el banco: anclar en la frase la ata a una tilde
   que `cscript` destroza, y a prosa que el propio comentario puede repetir. */
function _convPreHTML_(cv){
  var D=cv.dias||[], F=cv.franjas||[];
  /* ⛔ POR `_normAbre_` (463.ª): con `_dmyAISO_` a pelo, un `abre` sin hora —o en
     `DD/MM/AAAA`— dejaba `abH` VACÍO y la tarjeta rotulaba *«Se abre el 09/09/2026 a
     las **.**»*. La puerta le pone `00:00`, que es lo que significa «se abre ese día». */
  var ab=_normAbre_(cv.abre);
  var abD=_isoADMY_(ab.slice(0,10))||ab.slice(0,10), abH=ab.slice(11,16);
  /* ⚠️ Y aquí también (465.ª), aunque sólo se pinte la fecha: dos criterios para el
     mismo campo en la misma pantalla es como empiezan las divergencias. */
  var lim=_isoADMY_(_normLimite_(cv.limite).slice(0,10))
          ||_normLimite_(cv.limite).slice(0,10);
  var cab='<div class="rc rd"></div>'+D.map(function(d){
    var p=String(_diaTxtM_(_isoADMY_(d)||d)||'').split(' ');
    return '<div class="rc">'+esc(p[0]||'')+'<br>'+esc(String(p[1]||'').slice(0,2))+'</div>';
  }).join('');
  var filas=F.map(function(fr){
    return '<div class="rc rd">'+esc(fr.txt)+'</div>'+
      D.map(function(){ return '<div class="tcel off"></div>'; }).join('');
  }).join('');
  return '<div class="tarj" id="convC" data-abre="'+esc(ab)+'">'+
    _convCabHTML_(cv)+
    '<div class="rejw"><div class="rej" style="grid-template-columns:78px repeat('+
      D.length+',minmax(34px,1fr))">'+cab+filas+'</div></div>'+
    '<div class="tplazo">Se abre el <b>'+esc(abD)+'</b> a las '+esc(abH)+
      '. Entonces podr\u00e1s pintar tus ratos.</div>'+
    '<p class="rnota" style="margin-top:10px">Hasta que se abra no se puede marcar nada: el '+
      'plazo empieza cuando el equipo recibe el aviso, y cierra el <b>'+esc(lim)+'</b>.</p>'+
  '</div>';
}

/* La cabecera de la tarjeta: qué semana se pregunta y quién lo pide. */
function _convCabHTML_(cv){
  var ini=_isoADMY_(cv.dias[0])||cv.dias[0], fin=_isoADMY_(cv.dias[cv.dias.length-1])||'';
  return '<div class="mtit" style="margin:0 0 2px">Disponibilidad para turnos</div>'+
    '<div class="msub">Semana del '+esc(ini)+' al '+esc(fin)+
      (cv.convocante?' · lo pide '+esc(cv.convocante.split(' ')[0]):'')+'</div>';
}

/* La unidad del pie: horas (y sus turnos) cuando un turno son varias franjas.

   ⛔⛔ EXISTE PORQUE LA CONVERSION SE ESCRIBIO EN LINEA PARA UNO SOLO DE LOS CUATRO
      CONTADORES (327.ª, 23/08). El comentario de `_convPieHTML_` explica por que se paso a
      horas -- «"marcadas 4" despues de UN gesto se lee como si hubieras contestado cuatro
      veces» -- y esa razon vale IGUAL para los otros tres. Con `min_h = 4`, un solo «no
      puedo» sobre un turno entero pinta 4 celdas y salia «no puedo en 4»: el mismo
      malentendido, dos operandos mas alla. Y con la convocatoria horaria (09:00-22:00 x 7 =
      91 celdas) quien no habia tocado nada leia «91 sin contestar», bajando de 4 en 4.
   ✅ Se saca a funcion, no se copia tres veces: lo que fallo aqui no fue la conversion,
      fue que vivia PEGADA a uno de los cuatro sitios que la necesitan.
   ⚠️ Con dos franjas (`min_h` a 1) se cuenta en CASILLAS, que ahi es lo correcto: cada
      celda es una respuesta y ponerle «h» seria inventarse una unidad. */
function _convUnid_(n, min){
  if(!(min>1)) return ''+n;
  var t=Math.floor(n/min);
  return n+' h'+(t>=1 ? ' ('+t+(t===1?' turno':' turnos')+')' : '');
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
  return t+' · marcadas <b>'+_convUnid_(c.puedo,min)+'</b>'+
    (c.no?' · no puedo en '+_convUnid_(c.no,min):'')+
    (c.coches?' · con coche '+_convUnid_(c.coches,min):'')+
    (c.blanco?' · <b>'+_convUnid_(c.blanco,min)+'</b> sin contestar':' · todo contestado');
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
  /* ⛔⛔ NO SE SALE MUDO (578.ª). Dejar el estado en `'sin pedir'` mete *todavia no he
     preguntado* y *no PUEDO preguntar* en el mismo valor, y el de arriba — que es quien
     pinta — no puede distinguirlos. Curado en la gemela del escritorio en la 577.ª; esta
     es la misma FORMA en la otra cara, que es lo que hay que buscar y no el fichero. */
  if (typeof SESION==='undefined' || !SESION || typeof api==='undefined' || !api.getConvocatoria){ _convEstadoSrv_('sin sesion'); return; }
  _convEstadoSrv_('pidiendo');
  api.getConvocatoria().then(function(r){
    _convEstadoSrv_('ok');
    if(!r || !r.convocatoria){
      /* El servidor manda: sin convocatoria abierta, no se enseña la de demo. */
      if(typeof CONVOCATORIAS!=='undefined') CONVOCATORIAS.length=0;
    } else {
      /* ⛔ LA MISMA PUERTA QUE `_convMias_`, QUE ES QUIEN LO LEE. `cv.resp` tiene **un
         solo escritor** (esta línea) y **un solo lector**, así que la llave ES el contrato
         entero. El lector se curó el 30/07 —su comentario cuenta el fallo completo— y esta
         línea se quedó con `YO.nombre`, que **no es la sesión**: «Ver como» reasigna `YO`
         entero (`movil.html:507`, `YO=m`) y `_actorSanc_()` sigue dando la de la sesión.
         📏 Alcance **1 de 32**, el PD — y medido, no supuesto: el `YO` de maqueta de
         `:206` **no llega a usarse aquí**, porque la «UNICA pintada del arranque» (`:876`)
         va **después** del gate que exige `_YO_REAL_` (`:817`).
         ⚠️ Y esto se pide **UNA sola vez por carga** (`_convEstadoSrv_() !== 'sin
         pedir'`), así que no se corrige solo: lo que baja del servidor son TUS celdas
         —te identifica por TOKEN— y caían bajo el nombre de otra persona, dejando la
         rejilla **en blanco** y el pie diciendo que no habías contestado nada. */
      var cv=r.convocatoria,
          yo=(typeof _actorSanc_==='function') ? _actorSanc_() : ((YO&&YO.nombre)||'');
      cv.resp={}; cv.resp[yo]=r.mias||{};
      /* ⛔⛔ Y EL VEREDICTO DEL PLAZO SE COPIA (308.ª). `getConvocatoria` lo manda en
         `r.abierta` —`Codigo.gs:2923`— y aquí se **tiraba**: se copiaba `resp` y nada
         más, así que esta cara —la que usan los 32 para contestar— decidía el plazo con
         **el reloj del teléfono**. El escritorio ya lo leía desde la 295.ª: es la
         lección curada en una cara y no en su gemela. Lo consume `_convEstado_`. */
      cv.abierta = r.abierta;
      if(typeof CONVOCATORIAS!=='undefined'){ CONVOCATORIAS.length=0; CONVOCATORIAS.push(cv); }
    }
    if(typeof repintar==='function') repintar();
  }).catch(function(){
    /* ⛔ UN FALLO NO DEJA PUESTA LA SEMILLA DE DEMOSTRACIÓN. Marcar el estado no es vaciar:
       `_convAbierta_` mira la lista y **no consulta `__convSrvEstado` en ningún punto**, así
       que con el backend caído esta cara seguía pintando una convocatoria entera —con sus días,
       su rejilla y **su plazo**— y quien contestaba mandaba su disponibilidad a algo que no
       existe. Un plazo de mentira es peor que un hueco, porque nadie lo nota.
       ⛔ Y LA LECCIÓN YA ESTABA ESCRITA A SEIS LÍNEAS DE AQUÍ, en la rama del «no hay ninguna»,
       y otra vez en el gemelo del escritorio (`_dispCargar_`, `turnos.escritorio.js`), cuyo
       comentario describe **este** fallo. Se cablea la que existe, no se escribe otra.
       ⚠️ Y se REPINTA: vaciar sin repintar deja en pantalla lo que se dibujó con la semilla. */
    if(typeof CONVOCATORIAS!=='undefined') CONVOCATORIAS.length=0;
    _convEstadoSrv_('error');
    if(typeof repintar==='function') repintar();
  });
}

/* Manda la rejilla al servidor. Sin esperar a que llegue para repintar —el dedo ya la vio
   cambiar— pero **avisando si falla**: una disponibilidad que se pierde en silencio es la que
   luego hace que te pongan un turno cuando no puedes. */
function _convGuardar_(cv){
  if(!cv || typeof SESION==='undefined' || !SESION) return;
  /* ⛔ Y NO SE CONTESTA POR NADIE: el arrastre dispara esto solo, en `pointerup` y sin
     confirmación, así que mirando como otra persona bastaba rozar la rejilla. */
  if(typeof _identidadPrestada_==='function' && _identidadPrestada_(yoNombre())){
    if(typeof tost==='function') tost('Est\u00e1s viendo la app como otra persona: tus turnos no se tocan desde aqu\u00ed.');
    return;
  }
  if(typeof api==='undefined' || !api.guardarDisponibilidad) return;
  api.guardarDisponibilidad(cv.id, _convMias_(cv)).catch(function(e){
    if(typeof tost==='function') tostErr('No se pudo guardar tu disponibilidad: ', e);
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
    /* ⛔ ESTE GUARDIA ES LA TERCERA CAPA, NO LA PRIMERA (456.ª — corregido MIDIENDO).
       Escribí aquí que «ahora manda» y era **falso**: `_convPreHTML_` no pinta
       `id="convRej"`, así que `_engConv_` sale dos líneas antes (`var rej=$('#convRej');
       if(!rej) return;`) y durante `sin_abrir` este `if` **no lo ejecuta nadie**.
       📏 Lo destapó su mutación saliendo **CIEGA**, no releerlo. Por eso la línea se
       queda **sin mutación y con el descarte escrito** en `mutar.py`: dejar una
       equivalente sería peor que no tener ninguna.
       ⚠️ Donde SÍ manda es en `cerrada` **con un DOM viejo**: la tarjeta se pintó con el
       plazo abierto —o sea con `#convRej` y sus manejadores enganchados— y el plazo
       venció con la pestaña abierta. `fin` sólo llama a `_convGuardar_` si `pintando`, y
       `pintando` sólo se pone aquí.
       ⛔⛔ Y LA CARA ES MÁS ESTRICTA QUE EL BACKEND A PROPÓSITO — NO SE ABRE.
       · La autoridad es `reglas/convocatoria.py:175 admite_respuesta`, que devuelve
         `estado_en(…) == "abierta"`, y su docstring dice por qué: *«Fuera de la ventana
         NO se escribe — y por eso una celda vacía pasa a significar una sola cosa: "no
         ha contestado", que es perseguible»*. `mutar.py` ya trae la mutación que la
         relaja a `!= "cerrada"` y la clasifica como **defecto**.
       · Quien diverge es el BACKEND: `Codigo.gs:2938` decide con
         `_plazoAbierto_(c.limite)`, que sólo conoce el cierre; y `_convVigente_`
         selecciona igual, así que durante `sin_abrir` te manda `abierta:true`. O sea que
         el servidor te está diciendo que sí. **Aun así no.**
       · Motivo, no doctrina: `abre` es el instante en que se le dice al equipo que ya
         puede (`avisar_convocatoria.texto('abrir')`: *«Ya puedes decir cuándo puedes»*).
         Escribir antes significa que quien casualmente abrió la app contesta días antes
         de que a nadie se le pregunte, y **el plazo deja de tener principio**.
       ⛔ Abrir esto es la «cura» que va a intentar el siguiente. Antes de tocarlo hay que
       cerrar `Codigo.gs:_guardarDisponibilidad_`, no al revés. Ficha en `pendientes.md`. */
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

