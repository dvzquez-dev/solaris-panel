/* ═══ HORAS · cara escritorio ═══════════════════════════════════════════════════════════
   8 funciones sacadas de `escritorio.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* enrutado de un parte: coordinador de la unidad del autor; si el autor ES el
   coordinador, ESCALA al revisor de más rango. Nadie firma lo suyo **salvo el PD**.

   ⛔ Y EL PD VA PRIMERO, ANTES DE MIRAR LA UNIDAD. Su unidad es «Project Director» y de esa
   no es coordinador nadie, así que la rama de abajo escalaba a `[PD_NOM,REV2_NOM]` menos el
   autor — o sea, a **José**. Y el servidor rechaza a José ahí («sin potestad sobre este
   parte»: pide rango ≥ 3 o ser el coordinador de esa unidad). La pantalla le pintaba a José
   unos botones que la llamada no iba a admitir. Ahora dicen los dos lo mismo.
   (Daniel, 15/08: «si son partes míos, como si el Project Director me los tengo que aprobar
   yo mismo. O sea, no hay nadie más.») */
function revisoresDeParte(p){
  if(p.autor===PD_NOM) return [PD_NOM];
  var c=coordinadorDe(p.unidad);
  if(c!==p.autor) return [c];
  /* ⛔ 20/10 (auditor de partes): el de un coordinador, SÓLO el PD. Aquí escalaba también a José, y el servidor
     (`_puede_sobre_parte`: rango ≥ 3 o coordinar esa unidad) le rechaza: «Lo firma Daniel o José» prometía una firma
     que no existe. */
  return [PD_NOM];
}

function puedeDecidirParte(p,quien){
  /* ⛔ La excepción es SOLO del rango 3, igual que en `_decidirParte_`. Si esto y el backend
     divergen manda el backend, que es donde no se puede hacer trampa. */
  if(quien===p.autor && rangoNom(quien)<3) return false;
  /* ⛔⛔ 20/10 (auditor de partes): LA MISMA PUERTA QUE EL SERVIDOR (`_puede_sobre_parte`) — el PD (rango 3), o quien
     coordina ESA unidad. Antes escalaba «por rango» (`rangoNom(quien)>maxR`), y eso sólo cambiaba algo para José
     (rango 2): le pintaba Aprobar/Rechazar en partes que el servidor le niega, y con «Actúas como José» el PD los veía
     y la llamada salía con SU token, firmada como suya. El rango 2 es documental; en horas no manda. */
  return rangoNom(quien)>=3 || (rangoNom(quien)>=1 && coordinadorDe(p.unidad)===quien);
}

/* ⛔ 20/10 (auditor de partes): un parte en `detalle` es SIN DECIDIR — así lo cuenta el servidor (`bloqueos_cierre`,
   no deja cerrar el mes) y así lo pone el móvil en «Esperan tu decisión». Con sólo `'pend'` quedaba fuera del KPI, del
   globo y de «Horas en el aire», y caía en el Histórico como si estuviera decidido. */
function pendientes(){return PARTES.filter(function(p){return p.estado==='pend' || p.estado==='detalle';});}

/* 31/10 · Daniel: el parte del PD de una unidad que coordina OTRO se enruta a ese coordinador: al PD no le sale como «suyo por
   aprobar» (cola y globo) aunque siga pudiendo decidirlo. Misma regla que el móvil (`_cargarPartesDec_`); el servidor ya
   fijó en el parte la unidad de la TAREA. */
function porAprobar(){return pendientes().filter(function(p){
  return puedeDecidirParte(p,ACTOR) && !(p.autor===ACTOR && coordinadorDe(p.unidad)!==ACTOR);});}

function parteCard(p){
  var m=_m(p.autor), rev=revisoresDeParte(p), puede=puedeDecidirParte(p,ACTOR);
  var esc2=(coordinadorDe(p.unidad)===p.autor);
  return '<div class="parte" id="parte-'+p.id+'">'+
    '<div class="h"><b>'+esc(m.pila)+'</b><span class="u">'+esc(p.unidad)+'</span>'+
      '<span class="u">'+p.fecha+' · '+p.ini+'–'+p.fin+'</span>'+
      /* ⛔ `nf2`, NO `nf(...,1)`. Daniel, 18/08: «ya te dije bien claro que nada de
         redondeos a la decima». El fichaje redondea a CUARTOS (.25/.50/.75), asi que una
         sola decimal los falsea: 0,75 se enseñaba como «0,8» en la tarjeta donde se FIRMA.
         ⚠️ `h1()` (`comun.js:30`) ya lo hacia bien y la usan la cola y el movil: eran dos
         criterios para la misma pregunta, y el escritorio era el que iba atrasado. */
      '<span class="q">'+nf2(p.horas)+'<small> h</small></span></div>'+
    /* ⛔ La caja SOLO si aporta algo: `_justUtil_` devuelve '' cuando la justificacion
       repite la tarea o esta vacia -- los dos casos que Daniel senalo el 18/08. */
    (function(_j){ return '<div class="just"><span class="sc">'+esc(p.tarea)+'</span>'+
      (_j?esc(_j):'')+'</div>'; })(_justUtil_(p.tarea, p.just))+
    '<div class="fl">'+(p.flags||[]).map(function(f){   /* 20/10: un parte sin avisos (la semilla, un `detalle`) no revienta la cola */
      return '<span class="chip '+(f[0]==='ok'?'ok':'wa')+'">'+esc(f[1])+'</span>';}).join('')+
      (p.origen==='fichaje'?'<span class="chip ok">con fichaje</span>':'')+
      /* 20/10: lo devuelto se DICE — está en la cola esperando al autor, y se ve qué se le pidió. */
      (p.estado==='detalle'?'<span class="chip wa">devuelto · falta detalle'+(p.motivo?' — «'+esc(p.motivo)+'»':'')+'</span>':'')+
      /* 21/10 (auditor 8, 🟡 6): y si ya lo CONTESTÓ, qué se le había preguntado */
      (p.estado==='pend' && p.pedido?'<span class="chip">contestó a lo que se le pidió — «'+esc(p.pedido)+'»</span>':'')+
      /* 26/10 · «Sí, mientras no esté firmado»: las horas que vas a firmar las corrigió su autor — y de cuánto eran */
      (_txtCorreccion_(p.corr)?'<span class="chip wa">'+esc(_txtCorreccion_(p.corr))+'</span>':'')+'</div>'+
    /* 31/10 (textos): si puedes decidir, los botones ya lo dicen; s\u00f3lo se avisa cuando NO es tuyo */
    (puede?'':'<div class="ruta">Lo firma '+esc(rev.map(function(n){return _m(n).pila;}).join(' o '))+', no t\u00fa.</div>')+
    (puede?'<textarea data-motivo placeholder="Motivo — obligatorio para rechazar o pedir detalle…"></textarea>'+
      '<div class="acts">'+
        '<button class="btn pri" data-parte="'+p.id+'" data-acc="si">Aprobar</button>'+
        '<button class="btn" data-parte="'+p.id+'" data-acc="det">Pedir detalle</button>'+
        '<button class="btn no" data-parte="'+p.id+'" data-acc="no">Rechazar</button>'+
      '</div>':'')+
  '</div>';
}

function bloquePanel(){
  if(rangoNom(ACTOR)<1) return '';
  /* ⛔⛔ `>=3`, NO `>=2`. Esto decia `esPD = rangoNom(ACTOR)>=2`, y con eso el SEGUNDO
     REVISOR entraba en la rama del Project Director: el pool entero del equipo en los
     chips y el selector «Subsistema -> Todos». Su rango 2 es DOCUMENTAL -- es el segundo
     revisor del pipeline--, y aqui no significa nada.
     MEDIDO contra `_puedeSobreParte_` del servidor sobre el roster real: veia 18 y
     el servidor le aceptaba 4, o sea 14 rechazos por bloque -- y el aviso final acababa
     diciendo «Ya cuentan en sus horas del mes» aunque no se otorgara ninguna (hasta la 647.ª:
     hoy `_engBloqueHoras_` dice cuantas si y a cuantas no, y con 0 no lo canta como hecho).
     ⛔ Y `m.nombre!==ACTOR` no es de mas: el filtro `!m.cargo` saca al PD y a los
     coordinadores, que tienen cargo, pero un SUBCOORDINADOR tiene rango 1 y `cargo` nulo
     -- se ofrecia horas a SI MISMO, y el servidor tiene una guarda explicita contra eso. */
  var actor=_m(ACTOR), mandaEnTodo=rangoNom(ACTOR)>=3, unidad=(actor&&actor.unidad)||'';
  var reg=_activos_().filter(function(m){ return !m.cargo && m.nombre!==ACTOR; }); // de subsistema, sin bajas, sin uno mismo
  /* ⛔ 21/10 (auditor 8, 🟠 3): A QUIEN EL SERVIDOR DEJA, por la misma puerta que decidir un parte (`puedeDecidirParte`
     = `_puede_sobre_parte`: el PD, o quien coordina ESA unidad). Con «misma unidad que el actor», al subcoordinador
     (rango 1, sin ser el coordinador) se le ofrecía su unidad entera —su propio coordinador incluido— y el servidor
     rechazaba cada uno («sin potestad»). */
  var pool=mandaEnTodo?reg:reg.filter(function(m){ return puedeDecidirParte({autor:m.nombre, unidad:m.unidad}, ACTOR); });
  if(!pool.length) return pan('Bloque de horas','a varios de tu subsistema de golpe',
    '<div class="pb"><p style="margin:0;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
    (coordinadorDe(unidad)===ACTOR ? 'No hay nadie de tu subsistema a quien otorgar horas en bloque.'
      : 'Otorgar horas es del coordinador de la unidad y del Project Director: el servidor no lo deja a nadie más.')+
    '</p></div>');
  var subs=[]; reg.forEach(function(m){ if(subs.indexOf(m.unidad)<0) subs.push(m.unidad); });
  var filtro = mandaEnTodo
    ? '<label style="display:block;margin-bottom:10px"><span class="sc" style="display:block;margin-bottom:5px">Subsistema</span>'+
      '<select id="bloSub" style="width:100%;max-width:260px;background:#0A0909;border:1px solid var(--line);border-radius:8px;padding:8px 10px;color:var(--ink);font:inherit;font-size:12.5px">'+
      '<option value="">Todos</option>'+subs.map(function(u){ return '<option>'+esc(u)+'</option>'; }).join('')+'</select></label>'
    : '<div class="chips" style="margin-bottom:10px"><span class="chip">'+esc(unidad)+'</span></div>';
  var chips=pool.map(function(m){
    return '<button type="button" class="pick" data-nom="'+esc(m.nombre)+'" data-unidad="'+esc(m.unidad)+'">'+esc(m.pila)+'</button>';
  }).join('');
  return pan('Bloque de horas','a varios de tu subsistema de golpe',
    '<div class="pb"><p style="margin:0 0 12px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
    'Para un traslado, un montaje o una feria: <b>marca a quienes fueron</b> y ponles las mismas '+
    'horas de una vez. No se otorga nada hasta que pulses el botón.</p>'+
    filtro+
    '<div class="chips" id="bloPool" style="margin-bottom:12px">'+chips+'</div>'+
    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end">'+
      '<label style="min-width:150px"><span class="sc" style="display:block;margin-bottom:5px">Categoría</span>'+'<select id="bloCat" style="width:100%;background:#0A0909;border:1px solid var(--line);border-radius:8px;padding:8px 10px;color:var(--ink);font:inherit;font-size:12.5px">'+'<option value="reunion">Reunión</option><option value="tareas">Tarea</option>'+'<option value="turno">Turno</option><option value="compensacion" selected>Compensación</option></select></label>'+'<label style="width:120px"><span class="sc" style="display:block;margin-bottom:5px">Horas c/u</span>'+
      '<input class="mono" id="bloH" value="2,0" style="width:100%;background:#0A0909;border:1px solid var(--line);border-radius:8px;padding:8px 10px;color:var(--ink);font-family:var(--mono);font-size:12.5px"></label>'+
      '<label style="flex:2;min-width:200px"><span class="sc" style="display:block;margin-bottom:5px">Concepto</span>'+
      '<input id="bloC" placeholder="p. ej. Traslado a campo de pruebas" style="width:100%;background:#0A0909;border:1px solid var(--line);border-radius:8px;padding:8px 10px;color:var(--ink);font:inherit;font-size:12.5px"></label>'+
      '<button class="btn pri" data-bloque>Otorgar el bloque</button>'+
    '</div></div>');
}

function normParte(p){
  var fl=[];
  if(p.autocierre) fl.push(['wa','autocerrado al tope de 14 h']);
  /* ⛔ UNA ETIQUETA, NO DOS. Aqui habia un `if` por el booleano y otro por el origen, y un
     parte OTORGADO cumplia los dos: salia con «declarado sin fichaje» en ambar Y «otorgada por
     X» al lado. `_etiOrigenParte_` (comun.js) decide una sola vez, y la misma que el movil. */
  var _eo=_etiOrigenParte_(p);
  if(_eo) fl.push([_eo.tono==='ok'?'ok':'wa', _eo.txt]);
  return { id:p.id, autor:p.autor, unidad:p.subsistema||'—', fecha:_isoADMY_(p.fecha),
    ini:p.ini||'—', fin:p.fin||'—', horas:Number(p.horas)||0, tarea:p.tarea||'',
    /* ⛔ EL ORIGEN SE PASA TAL CUAL, sin traducirlo a `bloque`/`turno`. Ese par era un
       TERCER vocabulario para el mismo hecho, y ademas mentia: llamaba «bloque» a lo que
       alguien declaraba a mano y a lo que otorgaba la coordinacion.
       ⛔⛔ Y NO SE INVENTA `'fichaje'` CUANDO NO CONSTA. Un parte anterior al 04/08 -cuando el
       backend empezo a mandar `origen`- y sin `sinFichaje` salia con `origen:'fichaje'`
       fabricado aqui, y `parteCard` le pinta un chip VERDE «con fichaje». O sea que a quien lo
       FIRMA se le afirma que la persona ficho, cuando lo unico que consta es que **no consta** —
       y el chip verde es lo unico que se pinta en ese parte, asi que el hueco honesto se
       rellenaba con una afirmacion.
       ⚠️ `'manual'` SI se deduce, y no es lo mismo: `sinFichaje:true` es un hecho que el backend
       manda, no una ausencia. Es la misma linea que traza `_etiOrigenParte_` en `comun.js`
       («no se le inventa procedencia»), y la que el MOVIL ya cumplia (`horas.movil.js:78`:
       `origen:p.origen||null`). Esta cara era la unica que la rompia. */
    origen:p.origen||(p.sinFichaje?'manual':null), just:p.justificacion||'', flags:fl,
    /* ⛔ 20/10 (auditor de partes): un estado que no conocemos NO es «pendiente» (§3c-24). Con `||'pend'` salía en
       la cola con Aprobar/Rechazar —que el servidor rechaza— y sumaba en «Horas en el aire». 'raro' no lo recoge
       `pendientes()` y el Histórico lo dice tal cual. */
    estado:_EST_PARTE_[p.estado]||'raro',
    /* ⛔⛔ 635.ª LOS CAMPOS CRUDOS, con su nombre del backend, y no `decisor`/`dec`. `dec` salía ya
       recortado a la fecha UTC y `decisor` era un TERCER nombre para el mismo dato; el «Histórico»
       los leía con `p.decisor||PD_NOM`, o sea un nombre de relleno donde no consta nadie. Ahora los
       lee `_selloAprobado_`/`_firmaParte_` (comun.js), la misma puerta que el móvil, y `creado_at`
       viaja porque de él sale A QUÉ MES cuenta. */
    decidido_por:p.decidido_por||null, decidido_at:p.decidido_at||null, creado_at:p.creado_at||null,
    periodo:p.periodo||null,   /* 20/10: el mes que grabó el servidor al aplicarlo */
    motivo:p.motivo||null, pedido:p.detalle_pedido||null,   /* 21/10 (auditor 8, 🟡 6): la pregunta ya contestada */
    corr:p.correcciones||null,   /* 26/10 («Sí, mientras no esté firmado»): las horas las corrigió su autor */
    /* 31/10 («Lo tuyo»: tus partes que no cuentan y tu histórico): `iso` es la fecha del trabajo SIN voltear —la que
       lee `_esDeMesPasado_` cuando no hay `periodo` ni `creado_at`—; `cat` reparte las horas por categoría (como `cat`
       del móvil); `ret`/`revmot` dicen si un revertido lo retiraste tú y por qué se revirtió. */
    iso:String(p.fecha||''), cat:p.categoria||null, ret:!!p.retirado_at, revmot:p.revertido_motivo||null,
    bloque:p.bloque||null, reunion_id:p.reunion_id==null?null:p.reunion_id, resumen:p.resumen||'',   /* 29/10: el parte de bloque */
    _real:true };
}

/* ⛔⛔ 635.ª UNA FILA DEL «HISTÓRICO» DE PARTES. Vivía dentro de `V.partes` (escritorio.html), donde
   ningún banco la podía ejecutar, y ahí estaba el invento: «decidió <el PD> el —» con
   `p.decisor||PD_NOM` sobre un parte SIN decisor, y también sobre un `sin_declarar` o un
   `caducada`, que nadie decidió (medido en 6872510f).
   ✅ Lo aprobado lleva el sello de `_selloAprobado_` —el mismo texto que el móvil—; lo rechazado o
   devuelto, quién y cuándo (`_firmaParte_`); y lo que NO es una decisión no afirma ninguna.
   ⚠️ La etiqueta de la derecha se deja como estaba: un `sin_declarar`/`caducada` sigue saliendo
   «devuelto · falta detalle». Está apuntado aparte: esta pieza no decide qué entra en el Histórico. */
function _escHistFilaHTML_(p, per, uc){
  var et=p.estado==='aprobado'?'<span class="chip ok">aprobado</span>'
        :p.estado==='rechazado'?'<span class="chip no">rechazado</span>'
        :p.estado==='raro'?'<span class="chip">estado desconocido</span>'
        /* ⛔ 21/10 (auditor 8, 🟡 5): cada estado por su nombre. Todo lo que no era aprobado/rechazado caía a «devuelto ·
           falta detalle»: un REVERTIDO (o anulado), un CADUCADO y un SIN DECLARAR se leían como un parte devuelto. */
        :p.estado==='rev'?'<span class="chip">revertido</span>'
        :p.estado==='cad'?'<span class="chip no">caducado</span>'
        :p.estado==='sindecl'?'<span class="chip wa">sin declarar</span>'
        :'<span class="chip wa">devuelto · falta detalle</span>';
  var dec=p.estado==='aprobado' ? _selloAprobado_(p, per, uc)
        : (p.estado==='rechazado' || p.estado==='detalle') ? 'decidido '+_firmaParte_(p) : '';
  return '<div class="dec" style="cursor:default"><span class="tx"><b>'+esc(_m(p.autor).pila)+' · '+
    h1(p.horas)+' · '+esc(p.tarea)+'</b><small>'+p.fecha+(dec?' · '+esc(dec):'')+
    (p.motivo?' · «'+esc(p.motivo)+'»':'')+'</small></span><span class="der">'+et+'</span></div>';
}

/* Vuelca la cola real de partes sobre PARTES (que si no se queda con la semilla). */
function _partesReal_(){
  if(!Array.isArray(PART_BACK)) return;                 // sin backend: semilla
  PARTES=PART_BACK.map(normParte);
}

/* ⛔ GEMELA de `_cargarSanciones_`, y por el mismo motivo: `null` es **semilla ficticia**, asi
   que borrarlo en el `catch` cambia la cola real de partes por la de ejemplo cuando falla un
   refresco. Se conserva lo que hubiera. */
async function _cargarPartes_(){
  try{ var arr=await api.getPartes({}); if(Array.isArray(arr)) PART_BACK=arr; }
  catch(e){ if(!Array.isArray(PART_BACK)) PART_BACK=null; }
  _partesReal_();
}

/* ═══ «YA FIRMASTE» · REVERTIR UN PARTE DECIDIDO ═══════════════════════════════════════════
   Paridad con el móvil, donde existe desde el 07/08 (Daniel: «un sitio donde
   revisar/modificar/revertir los partes aprobados, como las sanciones»). Y lo sufre justo
   quien firma —coordinadores y PD—, que es la población de ESTA cara: hasta hoy, desde el
   ordenador, una firma equivocada se quedaba firmada para siempre.

   ⛔ LA LISTA SALE DE `PART_BACK` (crudo del backend), NO DE `PARTES`, y no es preferencia.
   `normParte` COLAPSA `otorgada` y `aplicada` en `'aprobado'` (`_EST_PARTE_`) y tira
   `aplicado_at`, `origen` y `revierte`: sobre un parte normalizado esta pantalla **no puede
   saber si revertir resta horas de la ficha de alguien**, que es lo único que cambia lo que
   hace el botón. Y peor: `_mesCerradoParte_` lee `p.fin`/`p.ini`/`p.creado_at` **en ISO** y
   `normParte` los deja en `DD/MM/AAAA`, así que devolvería `null` SIEMPRE — el guardia del
   mes cerrado no existiría y nadie se enteraría, porque `null` significa «no lo sé» y un «no
   lo sé» no bloquea.
   ✅ Y de regalo: con la semilla de demo `PART_BACK` es `null`, la lista sale vacía y el panel
   no aparece — aquí no hay forma de «revertir» un parte inventado. */

/* Cómo quedó el parte, en las palabras de quien lo mira: «aplicada» no le dice nada a nadie,
   «ya cuenta en su mes» sí. GEMELA de `PD_EST` (móvil), pero como FUNCIÓN — un módulo sólo
   lleva declaraciones `function` (ARRANQUE §5b), igual que `_maxHorasParte_`. */
function _escEstParte_(e){
  return ({aprobada:'aprobada', aplicada:'ya cuenta en su mes', otorgada:'otorgada',
           rechazada:'rechazada', detalle:'devuelto · falta detalle'})[e] || String(e||'');
}

/* ⛔ QUÉ SE PUEDE REVERTIR, EN UN SOLO SITIO. Es la lista que acepta `_revertirParte_` en el
   backend; el día que admita uno más, se toca una línea.
   ⚠️ `pendiente` NO está y no es un olvido: no hay ninguna decisión que deshacer y el servidor
   lo rechaza — sería un botón que sólo sabe dar error.
   ⚠️ `detalle` SÍ está (el servidor lo admite), pero desde el 20/10 la LISTA de revertir no lo enseña: está en la
   cola de `pendientes()`, como en el móvil, y desde ahí se vuelve a decidir — que es como se deshace un «pedir
   detalle». Listarlo en los dos sitios era enseñar el mismo parte dos veces (lo vio el auditor de partes).
   ⚠️ `revertida`, `anulada`, `sin_declarar` y `caducada` tampoco: el backend las niega. */
function _escRevertible_(p){
  var e = p && p.estado;
  /* ⛔⛔ LA CONTRAPARTE DE UNA REVERSION NO SE LISTA (563.ª), y esta guarda vive AQUI y
     no solo en `_escRevBloqueo_`. La contraparte nace `estado:'aprobada'` con
     `horas: -(h)` (`Codigo.gs`), asi que pasaba este filtro y entraba en
     `_escRevertibles_` -- y `_escRevPanel_` **suma** las horas de lo que lista:
     `h+=Number(lista[i].horas)||0`.
     📏 El resultado, en el titulo del panel: al revertir un parte de 3 h quedaba
     **«Ya firmaste · 2 · 0 h»** -- dos tarjetas que se anulan --, y si era el unico,
     **«· 1 · -3 h»**: un total NEGATIVO encima de una tarjeta que ademas no se puede
     revertir. Es justo lo que prohibe el comentario de `_escRevPanel_`: *un panel que
     anuncia trabajo que no hay*.
     ✅ **La cura estaba escrita en la gemela** (`horas.movil.js`, `_pdRevertible_`):
     `if(p && p.origen==='reversion') return false;`. Aqui se quedo sin aplicar -- una
     leccion curada en un fichero y no en su gemela.
     ⚠️ `_escRevBloqueo_` SE QUEDA con su texto: son **dos escalones**. Este decide si
     la tarjeta existe; aquel explica por que no hay boton si alguna vez vuelve a
     listarse. Una guarda cubre un escalon, no la escalera. */
  if(p && p.origen==='reversion') return false;
  /* ⛔ Misma puerta que el movil: `_estadosRevertibles_` (`comun.js`). Esta cara
     tenia los cinco y la otra cuatro, y nada lo decia. */
  return _esEstadoRevertible_(e);
}

/* ⛔ «YA ESTÁ EN LA FICHA» NO ES SÓLO `estado==='aplicada'` — es el MISMO predicado que usa
   `_revertirParte_` para decidir si emite contraparte. La rutina escribe en Notion y SÓLO
   DESPUÉS sella el parte: en esa ventana dice `'aprobada'` con `aplicado_at` puesto. Con sólo
   el estado, la tarjeta diría «aún no cuenta» justo cuando revertir SÍ resta de la ficha de
   una persona — el único caso en que el aviso importa.
   ⚠️ El móvil se quedó en `p.estado==='aplicada'` (`_pdRevFichaHTML_`): mismo hueco, otra
   cara. Aquí no se copia. */
/* ⛔ LA REGLA VIVE EN `comun.js` desde el 14/08: la necesitan LAS DOS caras, y tenerla
   aqui sola es como el movil se quedo tres semanas mirando solo el estado. */
function _escRevYaCuenta_(p){ return _yaCuentaEnSuMes_(p); }

/* Por qué NO se puede revertir éste, o `null` si se puede. ⛔ Devuelve TEXTO y no un booleano
   a propósito: un botón que desaparece sin explicación manda a preguntar y, en el mejor de los
   casos, se lee como que la pantalla está rota. Cada «esto no se puede» viene con su «…pero
   esto sí». */
function _escRevBloqueo_(p){
  /* ⛔ UNA CONTRAPARTE DE REVERSIÓN NO SE REVIERTE DESDE AQUÍ, y es lo único de esta pieza que
     el móvil no hace. Medido en `_revertirParte_`: la contraparte nace `estado:'aprobada'` con
     `aplicado_at:null`, así que mientras la rutina no la aplique cae por la rama «sin aplicar»
     y el backend la deja en **`pendiente`** — un parte de horas NEGATIVAS en la cola de
     decisión de alguien, que nadie pidió y que al aprobarse vuelve a restar. Y si ya está
     aplicada sí se compensa bien (la contraparte es `-(h)`, arreglado el 13/08), pero deja una
     cadena P←R←R2 que no hay quien lea en una ficha.
     ✅ La salida está al lado y la tarjeta la nombra: volver a poner las horas con «Otorgar
     horas directamente», con el concepto diciendo de dónde vienen. */
  if(p && p.origen==='reversion')
    return 'Es la contraparte de una reversión: no se revierte. Si te pasaste revirtiendo, '+
      'vuelve a poner las horas con <b>Otorgar horas directamente</b>, aquí al lado.';
  /* ⛔ MES CERRADO. Sus horas ya están en Notion y de ahí salió la cuota; la contraparte
     negativa se restaría del mes EN CURSO — horas de otro mes, a alguien que no ha hecho nada,
     y sin dar error. El servidor ya se planta (v68): esto es cortesía, para no ofrecer un
     botón que va a fallar.
     ⚠️ `_mesCerradoParte_` devuelve `null` cuando no lo sabe —y `CIERRE` es `null` hasta que
     alguien abre el cierre—, y un «no lo sé» NO bloquea: fallar hacia «esconder» quitaría una
     acción legítima sin decir por qué, y eso no se depura desde fuera. */
  /* ⛔ El tercer argumento es el ULTIMO CIERRE APLICADO, dato durable: la ranura del plan
     la pisa un calculo nuevo y con ella se va el instante. Es esta la cara desde la que
     de verdad se revierte, y la que tenia el boton prometiendo lo que el servidor niega. */
  var _ce=(typeof CIERRE!=='undefined' && CIERRE) || null;
  var cer=_mesCerradoParte_(p, (_ce && _ce.plan) || null, (_ce && _ce.ultimo_cierre) || null, true);   /* 26/10: para revertir */
  if(cer)
    return 'Mes cerrado ('+esc(cer)+'): ya no se revierte. Esas horas ya cuentan y de ahí salió '+
      'la cuota. Si hay que corregirlo, se hace en la ficha.';
  return null;
}

/* ⛔ REVERTIR ES DECIDIR **MENOS** LA EXCEPCION DEL PD -- y no es un matiz: es la diferencia
   entre ofrecer un boton y ofrecer uno que el servidor va a rechazar.

   Las dos lineas del backend, una al lado de la otra:
     decidir  (`Codigo.gs:3037`): `... && p.autor === nom && _rangoNom_(nom) < 3` -> el PD SI
     revertir (`Codigo.gs:3192`): `... && p.autor === nom`                        -> el PD NO

   `puedeDecidirParte` esta escrita para DECIDIR -lo dice su propio comentario: «la excepcion es
   SOLO del rango 3, igual que en `_decidirParte_`»-, asi que reusarla tal cual para REVERTIR le
   regalaba al PD una puerta que el servidor no tiene. Consecuencia medida: el PD veia
   «Revertir» sobre SUS PROPIOS partes, escribia el motivo, confirmaba un dialogo que le decia
   «se le RESTA N h de su ficha», y recibia `no puedes revertir tu propio parte`.

   ⛔ Es «dos preguntas, una funcion»: la puerta contestaba «¿puede DECIDIR?» y se le preguntaba
   «¿puede REVERTIR?». Por eso NO se copia la regla -- se ESTRECHA la que hay, en un sitio.
   ⚠️ Y el MOVIL ya lo hacia bien (`horas.movil.js`, `p.autor!==yo`, sin excepcion): dos de tres
   puntas coincidian, asi que esto es una asimetria y no una decision de producto. La pregunta
   de producto -¿deberia el PD poder revertir lo suyo, como puede decidirlo?- esta apuntada en
   `docs/pendientes.md` y NO bloquea: mande lo que mande, las dos puntas dicen lo mismo. */
/* ✅ 26/10 · Daniel (25/10), a «¿te dejo revertir tu propio parte?»: *«Sí, como lo firmo»*. El servidor ya lleva la
   excepción de rango 3 también al revertir, así que la puerta vuelve a ser la de decidir. Se queda como función
   aparte para que, si un día las dos puertas vuelven a separarse, haya UN sitio donde se separan. */
function _escPuedeRevertir_(p, quien){
  return puedeDecidirParte(p, quien);
}

function _escRevertibles_(){
  var out=[], i, p;
  if(!Array.isArray(PART_BACK)) return out;    // semilla de demo: aquí no se revierte nada
  for(i=0;i<PART_BACK.length;i++){
    p=PART_BACK[i];
    if(!_escRevertible_(p)) continue;
    if(p.estado==='detalle') continue;   /* 20/10: ya está en la cola (`pendientes()`); allí se vuelve a decidir */
    /* ⛔ LA MISMA PUERTA QUE DECIDIR, ESTRECHADA -- no una segunda copia de la regla:
       cinco copias de una autoridad acaban siendo cinco autoridades, y las diferencias son los
       bugs. Se le pasa la forma que entiende (`unidad`), que en el crudo del backend se llama
       `subsistema`.
       ⛔ Y hace falta AQUÍ aunque `getPartes` ya sirva sólo lo tuyo, porque el conmutador
       «Actúas como» cambia `ACTOR` **sin cambiar el token**: sin esto, el PD mirando la
       pantalla «como» un coordinador se ofrecería a revertir partes de todo el equipo.
       ⛔⛔ AQUÍ PONÍA que «de la misma puerta sale *nadie revierte lo suyo*, igual que el
       backend». **Era falso, y justo para el PD**: `puedeDecidirParte` solo corta al autor
       cuando su rango es < 3, porque está escrita para DECIDIR — y revertir en el backend NO
       tiene esa excepción (`Codigo.gs:3192` frente a `:3037`). Esa frase, escrita para explicar
       por qué el código era correcto, es lo que impidió verlo durante semanas (§3c-20).
       ✅ Ahora la puerta es `_escPuedeRevertir_`, que es esta misma MENOS la excepción. */
    if(!_escPuedeRevertir_({autor:p.autor, unidad:p.subsistema||'—'}, ACTOR)) continue;
    out.push(p);
  }
  return out;
}

/* ⛔ `data-revid`/`data-rev`/`[data-revmot]`, NO `data-parte`/`[data-motivo]`: las dos listas
   conviven en la MISMA pantalla y `_engPartes_` engancha por `$$('[data-parte]')` sin acotar.
   Reutilizar el marcador haría que el manejador de decidir cazara también estas tarjetas. Es
   la misma lección que el móvil aprendió con `data-pdr`/`.pdrm`. */
function _escRevCard_(p){
  var m=_m(p.autor), bloq=_escRevBloqueo_(p), cuenta=_escRevYaCuenta_(p);
  var eti=_etiOrigenParte_(p);
  var cab='<div class="parte" data-revid="'+esc(p.id)+'">'+
    '<div class="h"><b>'+esc((m&&m.pila)||p.autor)+'</b>'+
      '<span class="u">'+esc(p.subsistema||'—')+'</span>'+
      '<span class="u">'+esc(_isoADMY_(String(p.fecha||'').slice(0,10)))+' · '+
        esc(_escEstParte_(p.estado))+'</span>'+
      /* Misma regla que `parteCard`: a la CENTESIMA. Estaban las dos con `nf(...,1)` -- una
         sola no arregla nada, porque el mismo parte se ve por las dos tarjetas. */
      '<span class="q">'+nf2(Number(p.horas)||0)+'<small> h</small></span></div>'+
    /* Misma regla que `parteCard`. Aqui el campo se llama `justificacion`: el mismo parte
       se ve por las dos tarjetas, asi que arreglar una sola deja el duplicado a la vista. */
    (function(_j){ return '<div class="just"><span class="sc">'+esc(p.tarea||'')+'</span>'+
      (_j?esc(_j):'')+'</div>'; })(_justUtil_(p.tarea, p.justificacion))+
    (eti?'<div class="fl"><span class="chip '+(eti.tono==='ok'?'ok':'wa')+'">'+
      esc(eti.txt)+'</span></div>':'');
  if(bloq) return cab+'<div class="ruta">'+bloq+'</div></div>';
  /* ⛔ EL AVISO CAMBIA SEGÚN SI LAS HORAS YA CUENTAN. Un solo texto para los dos casos
     escondería justo el que importa: que revertir RESTA de la ficha de una persona. */
  return cab+
    '<div class="ruta">'+(cuenta
      ? 'Esas horas <b>ya cuentan</b>: revertir emite un apunte que le RESTA '+h1(p.horas)+
        ' de su ficha.'
      : (p.estado==='otorgada'
        /* ⛔ 21/10 (auditor 8, 🟡 12): el servidor manda una `otorgada` a `anulada` (terminal), no a `pendiente`. */
        ? 'Todavía no cuentan: revertir ANULA estas horas otorgadas (no vuelven a ninguna cola).'
        : 'Todavía no cuentan: revertir deshace la decisión y el parte vuelve a la cola.'))+'</div>'+
    '<textarea data-revmot placeholder="Motivo — obligatorio, al menos 8 caracteres…"></textarea>'+
    '<div class="acts"><button class="btn no" data-rev="'+esc(p.id)+'">Revertir</button></div>'+
  '</div>';
}

/* ⛔ SI NO HAY NADA, NO EXISTE. Un panel «Ya firmaste · 0 · 0 h» en cada visita anuncia trabajo
   que no hay y compite por la atención con la cola de verdad.
   ⛔ Y VA DEBAJO de «Requieren tu decisión» (lo coloca `V.partes`): lo que hay que hacer va
   antes que lo ya hecho, igual que en el móvil. */
function _escRevPanel_(){
  var lista=_escRevertibles_(), i, h=0, cuerpo='', vivos=0;
  if(!lista.length) return '';
  /* ⛔ 21/10 (auditor 8, 🟡 11): el número dice cuántos AÚN se pueden revertir — la lista trae también los de meses
     cerrados (con su «ya no se revierte») y lo otorgado por el sistema: 53 para el PD con 8 vivos. */
  for(i=0;i<lista.length;i++){ h+=Number(lista[i].horas)||0; cuerpo+=_escRevCard_(lista[i]);
    if(!_escRevBloqueo_(lista[i])) vivos++; }
  /* ⛔ `nf2`, NO `nf(...,1)` (20/08, 130.ª). Era el ULTIMO redondeo a la decima sobre
     horas que quedaba, y estaba en el panel que CONTIENE las tarjetas -- que ya usaban
     `nf2` desde el 18/08. El fichaje redondea a CUARTOS, asi que la mitad de los totales
     salian falseados: tres partes de 0,75 daban «3 · 2,3 h» encima de tres tarjetas que
     dicen 0,75. El titular no cuadraba con lo que hay debajo. */
  return pan('Ya firmaste', vivos+' aún revertibles · '+lista.length+' en total · '+nf2(h)+' h',
    '<div class="pb"><p style="margin:0;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
    'Lo ya decidido en tu ámbito —también lo que otorgó el sistema—; lo de un mes ya cerrado sale, pero ya no se '+
    'deshace. <b>Revertir exige un motivo</b>; si las '+
    'horas ya contaban, se emite un apunte que se las resta de su ficha. <b>Nadie revierte lo '+
    'suyo.</b></p></div>'+cuerpo);
}

function _engPartesRev_(){
  $$('[data-rev]').forEach(function(b){
    b.onclick=async function(){
      if(b.disabled) return;
      var caja=b.closest('[data-revid]'); if(!caja) return;
      var ta=caja.querySelector('[data-revmot]'), mot=ta?ta.value.trim():'';
      /* El mismo mínimo que el servidor (8): comerse un viaje de red para que te digan lo que
         ya se sabía es una pantalla que te hace perder el rato. */
      if(mot.length<8){
        if(ta){ ta.focus(); ta.style.borderColor='rgba(232,145,46,.6)';
          setTimeout(function(){ ta.style.borderColor=''; },1600); }
        tost('Revertir exige un motivo de al menos 8 caracteres. Sin él no se envía.');
        return;
      }
      if(typeof backendOK==='undefined' || !backendOK || !SESION || !Array.isArray(PART_BACK)){
        tost('Sin conexión no se puede revertir: no se ha guardado nada.'); return; }
      var p=null, i;
      for(i=0;i<PART_BACK.length;i++)
        if(String(PART_BACK[i].id)===String(caja.dataset.revid)) p=PART_BACK[i];
      if(!p){ tost('Ese parte ya no está en la cola: recarga la pantalla.'); return; }
      if(!confirm('Revertir este parte.'+String.fromCharCode(10,10)+
        (_escRevYaCuenta_(p)
          ? 'Las horas YA cuentan: se emite un apunte que le RESTA '+h1(p.horas)+' de su ficha.'
          : 'Todavía no contaban: la decisión se deshace y el parte vuelve a la cola.')+
        String.fromCharCode(10,10)+'¿Sigo?')) return;
      b.disabled=true; var prev=b.textContent; b.textContent='Revirtiendo…';
      try{
        /* ⛔ EL `await` VA DENTRO DEL `try`. Un `try/catch` alrededor de una llamada `async`
           sin esperarla no captura nada: el fallo sale como promesa rechazada, nadie lo ve, y
           el botón se queda diciendo «Revirtiendo…» para siempre. */
        var r=await api.revertirParte(p.id, mot);
        /* ⛔ SE ESCRIBE LO QUE DEVUELVE EL SERVIDOR, no lo que suponemos: `revertirParte`
           contesta `{parte, reversion}` y la contraparte es un parte NUEVO que tiene que entrar
           en la lista, o el panel seguiría sin ella hasta el siguiente refresco.
           ⚠️ Y `repetida:true` es un camino NORMAL, no un error: `_post` reintenta hasta tres
           veces y la clave de un solo uso hace que el 2.º intento devuelva la contraparte que
           ya existía. Pintarlo como fallo sería decir que no se hizo algo que sí se hizo. */
        if(r && r.parte)
          for(i=0;i<PART_BACK.length;i++)
            if(String(PART_BACK[i].id)===String(r.parte.id)) PART_BACK[i]=r.parte;
        if(r && r.reversion){
          var hay=false;
          for(i=0;i<PART_BACK.length;i++)
            if(String(PART_BACK[i].id)===String(r.reversion.id)){ PART_BACK[i]=r.reversion; hay=true; }
          if(!hay) PART_BACK.push(r.reversion);
        }
        _partesReal_();
        tost((r && r.reversion)
          ? 'Revertido: se le restan '+h1(Math.abs(Number(r.reversion.horas)||0))+' de su ficha.'
          : 'Revertido: la decisión se deshace y el parte vuelve a la cola.');
        caja.classList.add('asienta'); setTimeout(pintar,420);
      }catch(e){
        /* ⛔ EL ERROR NO SE TRAGA Y EL BOTÓN VUELVE A ESTAR VIVO. Es una ESCRITURA: si esto
           cayera en silencio, el coordinador creería haber revertido y las horas seguirían
           contando en la ficha de alguien. */
        b.disabled=false; b.textContent=prev; tostErr('No se pudo revertir: ', e);
      }
    };
  });
}

/* ═══ FICHAR DESDE EL ESCRITORIO ══════════════════════════════════════════════════════════
   Daniel fijo la v1.0 para el 1 de septiembre «con todo lo importante implementado tanto en
   ordenador como en telefono». Esta cara VEIA los fichajes de todos (`V.curso`) y **no podia
   abrir el suyo**: las cinco acciones del fichaje tenian CERO apariciones aqui. El acto mas
   frecuente de la app —y el origen de todas las horas— obligaba a sacar el movil, a diario, a
   la decena que gobierna.

   ⛔ VA DENTRO DE «LO TUYO» (`V.libros`), NO EN UNA VISTA NUEVA, y por el mismo motivo por el
   que esa vista existe: *«un coordinador ve la cola de todos, pero no su propio libro»*.
   Fichar es esa misma frase — el que gobierna tambien es miembro—, y el reloj queda **encima
   del libro que alimenta**, que es donde se comprueba que la hora ha caido. Una vista nueva
   serian dos sitios para «tu como miembro» en una cara que ya tiene 24 vistas en 6 grupos, y
   ademas «Lo tuyo» YA es la primera entrada del grupo Horas: no se gana ni un clic.

   ⛔ LA IDENTIDAD ES LA SESION (`_actorSanc_`), NUNCA `ACTOR`. `ACTOR` lo reescribe el
   conmutador «actuas como», y el backend ficha SIEMPRE a quien va en el token: con `ACTOR` la
   pantalla ofreceria los perfiles de otra persona y mandaria un `perfil` que no es de quien
   ficha. Mismo fallo que ya se corrigio en sanciones el 28/07 y en el libro de horas.

   ⛔ SIN BACKEND NO SE FICHA, y no hay reloj de mentira. El movil mantiene una sesion local
   para que la maqueta sea demostrable; aqui no: un cronometro que el servidor no conoce es una
   SEGUNDA fuente de «tus horas», y en esta cara la semilla ya ha mentido antes.

   ✅ Y LO QUE FALTABA YA ESTA, DEBAJO (14/08): declarar un bloque a posteriori (`pushParte`)
   y responder a un parte al que le han pedido detalle (`declararParte`). Van en su propio
   panel -- ver la cabecera de `_bloqPanel_`-- y NO dentro de este, que se va por `return`
   en dos ramas: un fallo al preguntar por TU sesion no puede llevarse por delante la unica
   forma de recuperar unas horas olvidadas.
   ═════════════════════════════════════════════════════════════════════════════════════════ */

/* La cuenta que ficha. ⛔ `_actorSanc_` y no `ACTOR`: ver la cabecera.
   ⛔⛔ Y ES LA ÚNICA PUERTA DE «¿QUIÉN ERES?» DE ESTA CARA (D-c, 20/10). La disponibilidad
   tenía la suya (`_yoDisp_`, en `reuniones.escritorio.js`), con la misma pregunta y un vacío
   distinto (`''` allí, `undefined` aquí). El móvil ya lo dejó escrito en su `_fichaYo_`: dos
   nombres para la misma pregunta acaban siendo dos respuestas. ✅ El vacío se decide AQUÍ y
   es `''`, como en el móvil: nadie compara un nombre contra `undefined` sin querer. */
function _fichaYo_(){
  var n = (typeof _actorSanc_==='function') ? _actorSanc_() : null;
  return String(n || '');
}

/* El fichaje vive en el servidor: sin sesion no hay nada que abrir ni que cerrar. */
function _fichaHayBack_(){ return !!(typeof backendOK!=='undefined' && backendOK && SESION); }

/* Con que perfil se ficha. Hace el MISMO PAPEL que `_perfilElegido_` (horas.movil.js) y **no
   es una copia**: lee OTRO estado (`FICHA_FORM` + la sesion, no `ST.form` + `YO`). Las tres
   reglas de verdad —que perfiles hay, cual va por defecto y si el elegido vale— salen de
   `comun.js`, que es la puerta unica; esto es el adaptador de cuatro lineas que las une al
   estado de esta cara.
   ⚠️ Y AQUI NO VA LA ETIQUETA DE PARENTESCO de `gemelas.py`, ni escrita de pasada: esa
   herramienta la cosecha del comentario que hay ENCIMA de una declaracion —cualquier mencion
   vale— y lo que promete son **cuerpos identicos**, que es lo unico que sabe contrastar. Estos
   dos no lo son ni pueden serlo: seria una promesa rota permanente, y un vigilante que se pone
   rojo por algo correcto se aprende a ignorar. */
function _perfilFormE_(p){
  /* ⛔ `miembro()` Y NO `_m()`: `_m()` FABRICA una ficha con `unidad:'\u2014'` cuando no
     encuentra a la persona, y de ahi saldria un perfil «\u2014» que el backend rechaza con un
     mensaje que no explica nada. Sin ficha se devuelve '' = «no lo se», no se manda perfil y
     decide el servidor con la unidad de quien ficha. */
  var yo=miembro(_fichaYo_());
  if(p && _perfilValido_(yo,p)) return p;
  var d=_perfilDefecto_(yo), ps=_perfilesDe_(yo);
  return d ? d.unidad : (ps[0] ? ps[0].unidad : '');
}
/* ⛔ DOS FORMULARIOS, DOS CAMPOS, Y POR ESO LA DE ARRIBA RECIBE EL ELEGIDO en vez de
   leerlo de un global. El reloj y el bloque atrasado son actos distintos: si compartieran
   el campo, elegir «coordinador de X» para justificar un rato de la semana pasada
   enrutaria ademas TODOS los fichajes en vivo siguientes a ese cargo -- y como nadie firma
   lo suyo, escalarian al Project Director sin que nadie lo pidiera. Es el mismo fallo que
   ya se corrigio dos veces en el movil, un piso mas arriba. */
function _fichaPerfil_(){ return _perfilFormE_(FICHA_FORM.perfil); }
function _bloqPerfil_(){ return _perfilFormE_(BLOQ_FORM.perfil); }

/* Retoma la sesion que hubiera abierta en el servidor. Mismo patron que `_cursoCargar_`: se
   pide desde la vista, se marca el estado ANTES de llamar y no se dispara una peticion por
   repintado (`pintar()` corre en cada interaccion de la pantalla).

   ⛔ `sabido` SE PONE CUANDO LA RESPUESTA LLEGO, no en un `finally`. Sin saber si YA tienes un
   fichaje abierto, la pantalla dice «SIN SESION ABIERTA» a alguien cuyo reloj esta corriendo
   en el servidor — o sea, le dice que no cuenta nada mientras cuenta. (Abrir dos sesiones no
   puede: `_ficharEntrada_` devuelve la que ya hubiera. Lo que se rompe es la pantalla, no el
   dato: el dano es que dejas de fichar creyendo que no estabas fichado.)

   ⚠️ Y SE REPREGUNTA cada 2 min mientras miras la vista, porque la sesion se puede cerrar
   DESDE EL MOVIL: sin esto, esta pantalla ensenaria un reloj corriendo sobre una sesion que ya
   no existe. Un refresco fallido NO borra lo que ya se sabia — el reloj corre desde la hora
   del servidor, no desde esta pestana. */
function _fichaCargar_(repintar){
  if(FICHA_SRV.estado==='pidiendo') return;
  if(FICHA_SRV.at && (Date.now()-FICHA_SRV.at) < 120000) return;
  if(!_fichaHayBack_() || !api.getFichajeAbierto) return;
  FICHA_SRV.estado='pidiendo';
  api.getFichajeAbierto().then(function(f){
    FICHA_SRV.estado='ok'; FICHA_SRV.at=Date.now(); FICHA_SRV.sabido=true;
    FICHA=(f && f.ini) ? f : null;
    if(typeof repintar==='function') repintar();
  }).catch(function(){
    FICHA_SRV.estado='error'; FICHA_SRV.at=Date.now();
    if(typeof repintar==='function') repintar();
  });
}

/* En pausa AHORA MISMO: el ultimo tramo de `pausas` sin `fin`. La misma lectura que hacen el
   backend en `_getFichajesAbiertos_` y el movil al retomar. */
function _fichaEnPausa_(){
  var ps=(FICHA&&FICHA.pausas)||[], ult=ps[ps.length-1];
  return !!(ult && !ult.fin);
}
/* Cuándo caduca un parte que se cierra SIN declarar, dicho con el plazo de verdad: a mano, 7 días; si lo cierras ya
   pasado el tope el servidor lo trata como autocierre y vive `_caducaAutocierreH_()` h. `min` = minutos de la sesión. */
function _plazoSinDeclarar_(min){
  return min>=_maxHorasParte_()*60 ? 'a las '+_caducaAutocierreH_()+' h (ya pasó del tope)' : 'a los 7 d\u00edas'; }
function _fichaMin_(){ return FICHA ? _minSesion_(FICHA.ini, FICHA.pausas) : 0; }
function _fichaHM_(m){ return pad(Math.floor(m/60))+':'+pad(m%60); }

/* TUS tareas, para imputarles el rato. ⛔ SE FILTRAN POR RESPONSABLE: `getTareas` le sirve al
   admin las de TODO el equipo (v52), asi que sin filtro esta cara te ofreceria imputar tu
   fichaje a la tarea de otra persona. `r` llega como lista de nombres completos; la semilla de
   demo trae una cadena con el nombre corto y no casa con nadie — y eso es lo correcto: mejor
   ninguna que una inventada. */
function _fichaTareas_(){
  /* ⚠️ El filtro vive en `comun.js` desde el 18/08: el móvil lo necesitaba igual y no lo
     tenía. Dos copias de esto acaban siendo dos criterios de a quién es tuya una tarea. */
  return _tareasResp_(typeof TAREAS==='undefined'?[]:TAREAS, _fichaYo_());
}

/* Que falta para DECLARAR al cerrar, o `null` si no falta nada.
   ⛔ LA DURACION NO SE VALIDA AQUI: la calcula el servidor al cerrar (de la entrada al envio,
   menos pausas, en cuartos y con tope). Escribirla en la cara seria la segunda copia de esa
   regla, y la segunda copia siempre acaba diciendo otra cosa. */
function _fichaFalta_(){
  var f=FICHA_FORM;
  if(!_imputacion_(f)) return 'Falta a que imputarlas';
  var n=f.just.trim().length;
  if(n<25) return 'Falta la justificacion ('+n+'/25 caracteres)';
  return null;
}

function _fichaPanel_(){
  if(!_fichaHayBack_()) return pan('Tu sesi\u00f3n de trabajo','sin conexi\u00f3n',
    vacioSimple('Sin sesi\u00f3n no se puede fichar','Entra con tu cuenta.'));
  _fichaCargar_(typeof _repintarSuave_==='function'?_repintarSuave_:pintar);
  if(!FICHA_SRV.sabido && FICHA_SRV.estado==='error') return pan('Tu sesi\u00f3n de trabajo','sin datos',
    vacioSimple('No se pudo comprobar si tienes un fichaje abierto','Recarga e int\u00e9ntalo otra vez.'));

  var sabido=FICHA_SRV.sabido, abierta=!!FICHA, pausa=_fichaEnPausa_();
  var min=_fichaMin_(), largo=min>=600;
  var estado = !abierta ? 'parada' : (pausa?'pausada':'corriendo');
  var perf=_fichaPerfil_(), yo=_fichaYo_();
  var firma=perf?_firmaDe_(perf,yo):null, firmaP=firma?((miembro(firma)||{}).pila||firma):null;

  var linea = estado==='corriendo' ? (largo?'M\u00c1S DE 10 H ABIERTA \u00b7 CI\u00c9RRALA':('CONTANDO DESDE LAS '+esc(_hhmmDe_(FICHA.ini))))
            : estado==='pausada'   ? 'EN PAUSA \u00b7 EL RELOJ EST\u00c1 PARADO'
            : sabido               ? 'SIN SESI\u00d3N ABIERTA'
            : 'COMPROBANDO SI YA TIENES UN FICHAJE ABIERTO\u2026';

  var botones = !abierta
    /* ⛔ Sin saber si ya hay una sesion abierta no se ofrece «fichar entrada»: la pantalla
       estaria diciendo «parado» a quien esta fichando. */
    ? (sabido ? '<button class="btn pri" data-fichaini>Fichar entrada</button>'
              : '<button class="btn" disabled>Comprobando si ya tienes un fichaje abierto\u2026</button>')
    : '<button class="btn" data-fichapausa>'+(pausa?'Reanudar':'Pausar')+'</button>'+
      '<button class="btn no" id="fichaSal" data-fichafin>'+
        (_fichaFalta_()?'Fichar salida (sin declarar)':'Fichar salida y declarar')+'</button>';

  var reloj='<div class="pb" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">'+
      '<div class="mono" id="fichaRel" style="font-size:38px;line-height:1;font-weight:600;color:'+
        (estado==='corriendo'?(largo?'var(--warn)':'var(--ink)'):'var(--ink3)')+'">'+_fichaHM_(min)+'</div>'+
      '<div style="flex:1;min-width:220px">'+
        '<div class="sc" id="fichaEst">'+linea+'</div>'+
        '<p style="margin:7px 0 0;font-size:11.5px;color:var(--ink3);line-height:1.6">'+
        (abierta
          ? 'Corre en el <b>servidor</b>: puedes cerrar esta pesta\u00f1a. A las <b>14 h</b> se cierra sola '+
            /* ⛔ 633.ª el barrido cierra en entrada + 14 h y graba eso menos las pausas: la
               «última actividad» no la mira nadie. 21/10 (auditor 8): y nace SIN DECLARAR, con 24 h de vida
               (decisión del 09/09); aquí no se decía. */
            'con el tope: 14 h desde tu entrada, menos las pausas, y queda <b>sin declarar</b>: decl\u00e1ralo antes de '+
            _caducaAutocierreH_()+' h.'
          : 'Tus horas no cuentan hasta que las firma quien te corresponde.')+'</p>'+
      '</div>'+
      '<div style="display:flex;gap:9px;flex-wrap:wrap">'+botones+'</div>'+
    '</div>';

  /* El formulario SOLO con sesion abierta: rellenarlo sin nada corriendo no declara nada. */
  var form='';
  if(abierta){
    var opts=_fichaTareas_().map(function(t){
      return '<option value="'+esc(t.n)+'"'+(FICHA_FORM.tarea===t.n?' selected':'')+'>'+esc(t.n)+'</option>';
    }).join('');
    var ps=_perfilesDe_(miembro(_fichaYo_()));
    var selPerfil = ps.length>1
      ? '<label style="min-width:210px"><span class="sc" style="display:block;margin-bottom:5px">Fichas como</span>'+
        '<select id="fichaPerfil" style="'+CAMPO_CSS+'">'+ps.map(function(p){
          return '<option value="'+esc(p.unidad)+'"'+(p.unidad===perf?' selected':'')+'>'+esc(p.txt)+'</option>';
        }).join('')+'</select></label>'
      : '';
    var etiDet = FICHA_FORM.cat==='reunion' ? 'Nombre de la reuni\u00f3n'
               : FICHA_FORM.cat==='turno'   ? 'Qu\u00e9 turno' : 'Concepto';
    var campoImput = FICHA_FORM.cat==='tareas'
      ? '<label style="flex:2;min-width:240px"><span class="sc" style="display:block;margin-bottom:5px">Imputar a</span>'+
        '<select id="fichaTarea" style="'+CAMPO_CSS+'">'+
          '<option value="">\u2014 elige una de tus tareas \u2014</option>'+opts+
          '<option value="Trabajo de subsistema"'+(FICHA_FORM.tarea==='Trabajo de subsistema'?' selected':'')+
            '>Trabajo de subsistema \u00b7 '+esc(perf)+'</option>'+
          '<option value="__otro__"'+(FICHA_FORM.tarea==='__otro__'?' selected':'')+'>Otro (lo escribo)</option>'+
        '</select></label>'+
        (FICHA_FORM.tarea==='__otro__'
          ? '<label style="flex:2;min-width:200px"><span class="sc" style="display:block;margin-bottom:5px">Cu\u00e1l</span>'+
            '<input id="fichaDet" value="'+esc(FICHA_FORM.detalle)+'" placeholder="nombre de la tarea" style="'+CAMPO_CSS+'"></label>'
          : '')
      : '<label style="flex:2;min-width:240px"><span class="sc" style="display:block;margin-bottom:5px">'+etiDet+'</span>'+
        '<input id="fichaDet" value="'+esc(FICHA_FORM.detalle)+'" placeholder="p. ej. Integraci\u00f3n motor / estructura" style="'+CAMPO_CSS+'"></label>';

    form='<div class="pb" style="border-top:1px solid var(--line)">'+
      '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end;margin-bottom:11px">'+
        selPerfil+
        '<label style="min-width:170px"><span class="sc" style="display:block;margin-bottom:5px">Categor\u00eda</span>'+
        '<select id="fichaCat" style="'+CAMPO_CSS+'">'+
          '<option value="tareas"'+(FICHA_FORM.cat==='tareas'?' selected':'')+'>Tarea</option>'+
          '<option value="reunion"'+(FICHA_FORM.cat==='reunion'?' selected':'')+'>Reuni\u00f3n no convocada</option>'+
          '<option value="turno"'+(FICHA_FORM.cat==='turno'?' selected':'')+'>Turno no convocado</option>'+
          '<option value="compensacion"'+(FICHA_FORM.cat==='compensacion'?' selected':'')+'>Compensaci\u00f3n</option>'+
        '</select></label>'+
        campoImput+
      '</div>'+
      '<label style="display:block"><span class="sc" style="display:block;margin-bottom:5px">Qu\u00e9 estuviste haciendo</span>'+
      '<textarea id="fichaJust" rows="3" placeholder="Qu\u00e9 hiciste, con qui\u00e9n y d\u00f3nde. M\u00ednimo 25 caracteres." '+
        'style="'+CAMPO_CSS+';resize:vertical;font-size:12.5px">'+esc(FICHA_FORM.just)+'</textarea></label>'+
      '<p class="sc" id="fichaFalta" style="margin:8px 0 0;letter-spacing:.08em">'+
        esc(_fichaFalta_()||'Todo listo: al fichar salida se declara.')+'</p>'+
      '<div class="nota" style="margin-top:11px">La <b>duraci\u00f3n</b> sale de la entrada al env\u00edo, menos pausas. '+
        'Si lo cierras sin declarar, caduca a los <b>7 d\u00edas</b>; si se cierra solo al tope, a las <b>'+_caducaAutocierreH_()+' h</b>. '+
        'Lo declaras <b>aqu\u00ed abajo</b> o desde el m\u00f3vil.'+
        (firmaP?' Lo firma <b>'+esc(firmaP)+'</b>.':'')+'</div>'+
    '</div>';
  }

  return pan('Tu sesi\u00f3n de trabajo',
    estado==='corriendo'?'en curso':estado==='pausada'?'en pausa':'parada',
    reloj+form, abierta?'destaca':'');
}

/* Actualiza SOLO los rotulos, sin repintar. ⛔ `pintar()` reconstruye `#main`, asi que llamarlo
   desde un `oninput` te quita el foco y el cursor a media justificacion. */
function _fichaAviso_(){
  var falta=_fichaFalta_();
  var t=document.getElementById('fichaFalta'), b=document.getElementById('fichaSal');
  if(t) t.textContent = falta || 'Todo listo: al fichar salida se declara.';
  if(b) b.textContent = falta ? 'Fichar salida (sin declarar)' : 'Fichar salida y declarar';
}

/* El reloj, y por lo mismo: se toca SOLO el texto. Y no hace nada si no esta en pantalla, ni
   con la sesion en pausa —ahi el reloj tiene que quedarse quieto, que es lo que significa. */
function _fichaTic_(){
  var el=document.getElementById('fichaRel');
  if(!el || !FICHA || _fichaEnPausa_()) return;
  var min=_fichaMin_();
  el.textContent=_fichaHM_(min);
  el.style.color = min>=600 ? 'var(--warn)' : 'var(--ink)';
  var e2=document.getElementById('fichaEst');
  if(e2 && min>=600) e2.textContent='M\u00c1S DE 10 H ABIERTA \u00b7 CI\u00c9RRALA';
}

function _engFicharE_(){
  /* ⛔ UN reloj para toda la pagina, no uno por repintado: `enganchar()` corre en cada
     `pintar()`, y sin el cerrojo a la decima pintada el reloj iria a diez tics por segundo. */
  if(!FICHA_TIC) FICHA_TIC=setInterval(_fichaTic_,1000);

  var bi=document.querySelector('[data-fichaini]');
  if(bi) bi.onclick=async function(){
    /* ⛔ EL CANDADO VA ANTES DEL `await`, y son dos cosas: `if(b.disabled) return` corta el
       segundo clic que ya venia en camino, y `b.disabled=true` corta los siguientes. */
    if(bi.disabled) return;
    bi.disabled=true; var prev=bi.textContent; bi.textContent='Fichando\u2026';
    try{
      var rec=await api.ficharEntrada(_fichaPerfil_()||null);
      /* ⛔ SE CREE AL SERVIDOR, NO A LA PANTALLA. Si ya tenias una sesion abierta,
         `ficharEntrada` devuelve ESA —con su hora y sus pausas—: fabricar aqui un
         `{ini:ahora}` pondria el reloj a cero encima de una sesion de tres horas. */
      if(!rec || !rec.ini) throw new Error('el servidor no devolvi\u00f3 la sesi\u00f3n');
      FICHA=rec; FICHA_SRV.estado='ok'; FICHA_SRV.at=Date.now(); FICHA_SRV.sabido=true;
      tost('Fichando. Corre en el servidor: aunque cierres esta pesta\u00f1a, sigue contando.');
      pintar();
    }catch(e){
      /* ⛔ Y EL BOTON VUELVE A ESTAR VIVO. Una escritura que se traga su error deja a alguien
         creyendo que ficho: son horas que no existen y que nadie echa en falta hasta el cierre. */
      bi.disabled=false; bi.textContent=prev; tostErr('No se pudo fichar entrada: ', e);
    }
  };

  var bp=document.querySelector('[data-fichapausa]');
  if(bp) bp.onclick=async function(){
    if(bp.disabled || !FICHA) return;
    var eraPausa=_fichaEnPausa_();
    bp.disabled=true; var prev=bp.textContent; bp.textContent='\u2026';
    try{
      var s=eraPausa ? await api.reanudarFichaje() : await api.pausarFichaje();
      /* El servidor devuelve la sesion entera; si viniera pelada se conservan las pausas que
         ya habia en vez de dejar el tramo a medias. */
      if(s && s.ini) FICHA=s; else if(s && s.pausas) FICHA.pausas=s.pausas;
      tost(_fichaEnPausa_()?'En pausa. El reloj se queda donde est\u00e1.':'Reanudada.');
      pintar();
    }catch(e){ bp.disabled=false; bp.textContent=prev; tostErr('No se pudo: ', e); }
  };

  var bf=document.querySelector('[data-fichafin]');
  if(bf) bf.onclick=async function(){
    if(bf.disabled || !FICHA) return;
    var f=FICHA_FORM, falta=_fichaFalta_(), declara=!falta;
    /* ⛔ CERRAR SIN DECLARAR SE AVISA, Y CON LA CONSECUENCIA EXACTA. El parte queda «sin
       declarar», caduca a los 7 dias y hoy solo se declara desde el movil: cerrar y que se
       pierda en silencio es justo lo que esta pantalla viene a quitar. */
    if(!declara && !confirm('Vas a cerrar la sesi\u00f3n SIN declararla.'+String.fromCharCode(10,10)+
        falta+'.'+String.fromCharCode(10)+'El parte quedar\u00e1 «sin declarar» y caduca '+_plazoSinDeclarar_(_fichaMin_())+'. '+
        'Lo declaras aqu\u00ed mismo, en el panel de abajo.'+String.fromCharCode(10,10)+
        '\u00bfCerrar igualmente?')) return;
    bf.disabled=true; var prev=bf.textContent; bf.textContent='Cerrando\u2026';
    /* ⛔ EL PERFIL SE CONGELA ANTES DE ENVIAR, y el firmante SALE DE EL. Calcularlo despues
       —que es como estaba— lo leia con `f.perfil` ya puesto a `null` por la limpieza del
       formulario: el aviso nombraba al coordinador del perfil POR DEFECTO cuando habias
       elegido otro, o sea que la pantalla te decia que lo firma quien no lo firma. */
    var _perfEnvio=_fichaPerfil_()||null;
    var _firmaP=_perfEnvio?((miembro(_firmaDe_(_perfEnvio,_fichaYo_()))||{}).pila||''):'';
    try{
      /* ⛔ CON EL FORMULARIO A MEDIAS SE MANDA VACIO, no a medias. El backend decide
         `declarado = !!(tarea || categoria)`: mandar la categoria con la tarea y la
         justificacion en blanco meteria el parte en la cola del coordinador **sin nada que
         juzgar** — y de paso le quitaria al autor los 7 dias que tiene para justificarlo. */
      var r=await api.ficharSalida(declara?_imputacion_(f):'', declara?f.just.trim():'',
                                   declara?f.cat:null, _perfEnvio);
      /* La sesion queda cerrada pase lo que pase con la lista de partes: el parte ya existe en
         el servidor. Se mete en `PART_BACK` por la MISMA puerta que otorgar (`_partesReal_`,
         que es quien deriva `PARTES`), y si esa lista todavia no ha llegado NO se inventa
         nada — la trae el refresco de 90 s. */
      if(r && r.parte && Array.isArray(PART_BACK)){ PART_BACK.push(r.parte); _partesReal_(); }
      FICHA=null; FICHA_SRV.at=Date.now();
      f.just=''; f.tarea=''; f.detalle=''; f.perfil=null;
      /* ⚠️ `h = null` es «no lo se», y CERO seria un dato: sin las horas de vuelta se
         confirma el envio sin inventarse un numero. */
      var h=(r&&r.parte&&typeof r.parte.horas==='number')?r.parte.horas:null;
      var _ac=_tostAutocierre_(r);
      if(_ac) tost(_ac); else tost(declara
        ? ('Fichaje declarado'+(h==null?'':' \u00b7 '+nf2(h)+' h')+' \u00b7 a la cola de '+(_firmaP||'tu coordinador')+'.')
        : 'Fichaje cerrado SIN declarar. Decl\u00e1ralo en el panel de abajo antes de 7 d\u00edas.');  /* cierre a mano: el tope ya lo contesta `_tostAutocierre_` arriba */
      pintar();
    }catch(e){ bf.disabled=false; bf.textContent=prev; tostErr('No se pudo cerrar: ', e); }
  };

  var fp=document.getElementById('fichaPerfil');
  /* `pintar()` y no un repintado del select: al cambiar de perfil cambian TAMBIEN el rotulo de
     «Trabajo de subsistema» y la linea de quien firma. Repintar solo lo que se toco dejaria a
     las otras dos diciendo lo de antes, que es peor que no decir nada. */
  if(fp) fp.onchange=function(){ FICHA_FORM.perfil=fp.value; pintar(); };
  var fc=document.getElementById('fichaCat');
  if(fc) fc.onchange=function(){ FICHA_FORM.cat=fc.value; FICHA_FORM.tarea=''; FICHA_FORM.detalle=''; pintar(); };
  var ft=document.getElementById('fichaTarea');
  if(ft) ft.onchange=function(){ FICHA_FORM.tarea=ft.value;
    if(ft.value==='__otro__'){ FICHA_FORM.detalle=''; pintar(); } else _fichaAviso_(); };
  var fd=document.getElementById('fichaDet');
  if(fd) fd.oninput=function(){ FICHA_FORM.detalle=fd.value; _fichaAviso_(); };
  var fj=document.getElementById('fichaJust');
  if(fj) fj.oninput=function(){ FICHA_FORM.just=fj.value; _fichaAviso_(); };
}


/* ═══ DECLARAR HORAS QUE NO FICHASTE ══════════════════════════════════════
   La otra mitad de fichar, y la UNICA via para recuperar horas: el reloj cuenta lo que se
   ficha y esto declara lo que se trabajo sin ficharlo. Hasta hoy esta cara solo sabia OTORGAR
   horas a OTROS (`otorgarHoras`, `otorgarBloque`), que es justo lo contrario. Y desde que
   ficha desde aqui, el hueco se nota mas: la pantalla te deja cerrar «sin declarar» y acto
   seguido te manda a sacar el movil.

   Son DOS actos con el MISMO formulario y distinta duracion, y por eso van en UN panel:
     · `pushParte`     — un bloque a posteriori: la duracion la escribes tu (entrada -> salida).
     · `declararParte` — un fichaje cerrado SIN declarar, o uno al que te han pedido detalle:
                         la duracion YA la fijo el servidor al cerrar y aqui no se toca.
   Partirlo en dos paneles duplicaria el formulario entero (perfil, categoria, imputacion,
   justificacion), que es exactamente lo que las dos copias del movil tampoco hacen.

   ⛔ VA EN «Lo tuyo» (`V.libros`), DEBAJO DEL RELOJ, Y FUERA DE `_fichaPanel_`.
   · En «Lo tuyo» por lo mismo que el reloj: es la vista de «tu como miembro» -- *un
     coordinador ve la cola de todos pero no su propio libro*--, y una vista nueva seria un
     TERCER sitio donde buscar lo mismo en una cara que ya tiene 24 vistas.
   · DEBAJO y no encima: el reloj es el camino normal y esto el de recuperacion. Ponerlo
     primero invita a declarar a mano lo que el cronometro habria contado solo, y un bloque
     escrito a mano es justo lo que el coordinador tiene que juzgar sin evidencia.
   · Y FUERA de `_fichaPanel_`, que se va por `return` en DOS ramas -sin backend y con
     `getFichajeAbierto` fallado-. Declarar un bloque NO depende de saber si tienes una sesion
     abierta: metido dentro, un fallo al preguntar por TU SESION se llevaria por delante la
     unica forma de recuperar unas horas olvidadas, y sin decir por que.

   ⛔ NADIE DECLARA POR OTRO, y la identidad es la SESION (`_fichaYo_`), nunca `ACTOR`: el
   conmutador «actuas como» reescribe `ACTOR` sin tocar el token, y el backend apunta el parte
   a quien va en el token. Con `ACTOR` la pantalla ofreceria los perfiles de otra persona.
   ════════════════════════════════════════════════════════════════════════════ */

/* La duracion tecleada, en cuartos de hora. El PARSEO va por la puerta unica (`_minHM_` de
   `comun.js`), que es lo que de verdad divergia: la copia a mano usaba `+p[0]` y con basura
   daba `NaN`, que se propaga a las horas del parte sin dar ningun error.
   ⚠️ Y la aritmetica NO se funde con `durForm` (`horas.movil.js`) a proposito, con el numero
   delante: `probar_minhm.py` la lee por nombre desde ese fichero (§2) y la EJECUTA con cinco
   casos (§4), asi que moverla pondria rojo un banco sano por un traslado que no es de esta
   pieza. Lo que las ata es una comprobacion de SIMETRIA -- `probar_curso.py` §8d corre las dos
   con los mismos cinco casos y exige el mismo resultado--, que es lo que caza que divergan. */
function _bloqDur_(){
  var d=_minutosReales_(BLOQ_FORM.fecha, BLOQ_FORM.ini, BLOQ_FORM.fin);   // medianoche y cambio de hora (auditor 34)
  return Math.round(d/15)/4;                           // a cuartos de hora
}

/* Los TUYOS que esperan declaracion: un fichaje cerrado sin justificar (`sin_declarar`) o uno
   al que el coordinador le ha pedido detalle (`detalle`).

   ⛔ SALEN DE `PART_BACK` (crudo del backend), NO DE `PARTES`, y por el mismo motivo que la
   lista de «Ya firmaste»: `normParte` TIRA `categoria`, `justificacion` y `caduca_at`, que es
   justo lo que hace falta para (a) precargar lo que ya mandaste cuando te piden detalle y (b)
   decir CUANDO caduca. Sobre un parte normalizado, «Responder» te obligaria a reescribir de
   memoria lo que el coordinador esta mirando -- e invitaria a mandar algo distinto de lo que
   te pregunto.
   ⛔ Y SOLO LOS TUYOS. `_getPartes_` sirve los `sin_declarar` ajenos unicamente a la cuenta
   admin, y para esa cuenta `_declararParte_` SI deja declarar por otro: sin el filtro, esa
   sesion pintaria los fichajes de todo el equipo y declararia el de otra persona con TU
   justificacion y TU categoria. No es un boton que falla: es uno que acierta sobre las horas
   de quien no eres.
   ✅ Y de regalo: con la semilla de demo `PART_BACK` es `null`, la lista sale vacia y no hay
   forma de mandarle al servidor el `id` de un parte inventado. */
function _bloqMios_(){
  if(!Array.isArray(PART_BACK)) return [];
  var yo=_fichaYo_();
  return PART_BACK.filter(function(p){
    return p && p.autor===yo && (p.estado==='sin_declarar' || p.estado==='detalle');
  });
}

/* El parte que se esta declarando, o `null`. ⛔ Se busca DENTRO de `_bloqMios_()` y no en la
   lista cruda: el refresco de 90 s puede habertelo movido -lo declaraste desde el movil, o
   caduco- y entonces `declararId` apunta a algo que ya no admite declaracion. Que devuelva
   `null` es lo que deja a la pantalla DECIRLO en vez de mandar una peticion condenada. */
function _bloqDecl_(){
  var id=BLOQ_FORM.declararId;
  if(id==null) return null;
  var l=_bloqMios_().filter(function(p){ return p.id===id; });
  return l.length ? l[0] : null;
}

/* Que falta para poder enviar, o `null` si no falta nada. Mismo papel que `_fichaFalta_` y
   OTRA pregunta: alli la duracion la calcula el servidor al cerrar la sesion; aqui la escribe
   la persona, asi que es parte de lo que hay que validar.
   ⛔ EL TOPE SALE DE `_maxHorasParte_()`, no de un 14 escrito aqui. Y no es adorno: el
   servidor RECORTA en silencio (`autocierre`), asi que sin este freno se declaran 20 h, se
   guardan 14 y la persona se entera al cierre de mes, si se entera.
   ⛔ Y LA FECHA SE VALIDA. `_dmyAISO_` CONVIERTE, no valida: lo que no reconoce lo devuelve
   tal cual, asi que «30 julio» viaja al servidor tal cual, la tarjeta que firma el coordinador
   sale sin fecha legible y el aviso de mes -que compara `AAAA-MM`- se calla. */
function _bloqFalta_(){
  var f=BLOQ_FORM, decl=_bloqDecl_();
  if(f.declararId!=null && !decl) return 'Ese parte ya no espera declaraci\u00f3n';
  if(!decl){
    /* ⛔ ESTO VALIDABA SOLO EL FORMATO: `31/02/2026` pasaba, `_dmyAISO_` lo convertía a
       `2026-02-31` y el servidor lo aceptaba —su comprobación es `^\d{4}-\d{2}`—. La
       puerta buena ya existía en `comun.js`: `_fechaDMY_` rechaza además las fechas
       imposibles, porque `new Date(2026,1,31)` **no falla, rueda al mes siguiente**. */
    if(!_fechaDMY_(f.fecha)) return 'La fecha va como DD/MM/AAAA y tiene que existir';
    var d=_bloqDur_(), tope=_maxHorasParte_();
    /* ⛔ CUATRO CAUSAS, CUATRO FRASES. Esto decia «La salida tiene que ser posterior a la
       entrada» para CUALQUIER duracion invalida, incluida la de pasarse del tope: quien lo
       leia se iba a mirar unas horas que estaban bien.
       ⚠️ AQUI PONIA que tambien saltaba con un bloque de SIETE MINUTOS, y ESO NO SE PUEDE
          ESCRIBIR: `optHoras` da 96 opciones de cuarto en cuarto y **ninguna vacia**
          (medido el 19/08), asi que toda duracion es multiplo de 15 y `Math.round(d/15)/4`
          no redondea nunca. `'corto'` y `'sin'` son CONTRATO de una puerta compartida, no
          casos que el usuario alcance. Lo vigila `probar_pega_duracion.py`, que se pone
          rojo el dia que el catalogo cambie -- y entonces hay que revisar el changelog. */
    var _cr=_minutosReales_(BLOQ_FORM.fecha, BLOQ_FORM.ini, BLOQ_FORM.fin);   /* medianoche y cambio de hora */
    /* ⛔ Y EL RANGO VACIO SE DICE APARTE, que es la cuarta causa y estaba MUERTA.
       `_bloqDur_` pasa por `_minHM_`, que hace `parseInt(...)||0`: con los dos campos en
       blanco devuelve **0** -- o sea un numero --, asi que la rama `'sin'` de la puerta
       estaba escrita y era INALCANZABLE, y un formulario recien abierto acusaba de
       invertir unas horas que nadie habia escrito todavia. La puerta ya sabia decirlo;
       lo que faltaba era que esta cara le preguntara. */
    var _vacio = !String(BLOQ_FORM.ini||'').trim() || !String(BLOQ_FORM.fin||'').trim();
    var _pg=(typeof _pegaDeDuracion_==='function')
      ? _pegaDeDuracion_(_vacio ? null : d, tope, _cr)
      : (d>0?(d>tope?'largo':''):'cero');
    if(_pg==='largo') return 'Un parte no puede pasar de '+tope+' h (van '+h1(d)+')';
    if(_pg==='corto') return 'Ese bloque es demasiado corto: las horas se cuentan en '+
                             'cuartos, y menos de 8 minutos se queda en cero';
    if(_pg==='cero')  return 'La salida tiene que ser posterior a la entrada';
    if(_pg==='sin')   return 'Pon la entrada y la salida';
  }
  if(!_imputacion_(f)) return 'Falta a qu\u00e9 imputarlas';
  var n=f.just.trim().length;
  if(n<25) return 'Falta la justificaci\u00f3n ('+n+'/25 caracteres)';
  return null;
}

/* Quien firma lo que se declare con el perfil elegido, en nombre corto, o '' si no se sabe. */
/* ⛔⛔ UN PARTE QUE YA EXISTE NO CAMBIA DE SUBSISTEMA, Y LA PANTALLA LO PROMETIA (581.ª).
   📏 Los tres caminos que CREAN un parte si mandan el perfil — `ficharEntrada(perfil)`,
   `ficharSalida(…, perfil)` y `pushParte({subsistema: perf})` —. El unico que no lo manda
   es `declararParte(decl.id, …)`, y **no puede**: ese parte nacio con su `p.subsistema` y
   el servidor lo usa para decidir quien lo firma (`_puedeSobreParte_`).
   ⛔ Asi que el fallo no era «el perfil se tira»: era que **esta cara ofrece cambiar algo
   que ya esta decidido** y calculaba la promesa con lo elegido. Quien tiene dos perfiles
   elegia «coordinador de X», leia «se envia a Ana»… y lo firmaba Bea.
   📏 Medido el 11/09: **1 de 32** en `datos/panel.json` — que es lo que la app lee — y
   **6 de 32** en `datos/equipo.json` tienen DOS o mas perfiles. Y son coordinadores, que
   es la poblacion de esta cara.
   ✅ Cuando hay parte, manda **el suyo**. ⚠️ Y cuando NO lo hay sigue mandando el elegido,
   que no es un detalle: el bloque atrasado nuevo se crea con `pushParte({subsistema:
   perf})`, o sea que ahi elegir **si** decide. Las dos mitades tienen su comprobacion. */

/* ⛔⛔ EL CAMPO DE PERFIL, FUERA DE `_bloqPanel_` Y MIRANDO SI HAY PARTE (581.ª).
   Dos cosas, y la segunda es la que lo hace medible:
   1º **No se ofrece elegir lo que ya esta decidido.** Un parte que ya existe nacio con su
      `subsistema` y `declararParte` no puede moverlo, asi que el desplegable «Declaras como»
      era un **control muerto**: lo mueves, no pasa nada, y hasta la 581.ª encima la pantalla
      te prometia el firmante de lo elegido. En su sitio va un rotulo que dice **de que
      subsistema es ese parte**, que es el dato que la persona necesita para decidir si envia.
   2º **Y vive FUERA del cuerpo de `_bloqPanel_`**, como `_convPreHTML_` y por la misma razon
      escrita alli: metida dentro no habria forma de ejecutarla en el arnes y su mutacion
      saldria ciega. Un `if` mas en una funcion de 200 lineas es superficie que nadie mide.
   📏 El daño medido el 11/09: **1 de 32** en `datos/panel.json` — que es lo que la app lee —
   y **6 de 32** en `datos/equipo.json` tienen dos o mas perfiles. Son los coordinadores. */
function _bloqPerfilCampo_(){
  var d=_bloqDecl_();
  /* La MISMA pregunta que `_bloqSubsEfectivo_`, y por eso se decide igual: si hay parte,
     su subsistema manda — y entonces esto no es un desplegable, es un rotulo. */
  if(d && d.subsistema)
    return '<div style="min-width:210px"><span class="sc" style="display:block;margin-bottom:5px">'+
      'Declaras como</span><div class="nota" style="margin:0;padding:7px 9px">Este fichaje se '+
      'abri\u00f3 en <b>'+esc(d.subsistema)+'</b>, y eso ya no se cambia al declararlo.</div></div>';
  var ps=_perfilesDe_(miembro(_fichaYo_()));
  if(ps.length<=1) return '';
  var perf=_bloqPerfil_();
  return '<label style="min-width:210px"><span class="sc" style="display:block;margin-bottom:5px">'+
    'Declaras como</span><select id="bqPerfil" style="'+CAMPO_CSS+'">'+ps.map(function(x){
      return '<option value="'+esc(x.unidad)+'"'+(x.unidad===perf?' selected':'')+'>'+esc(x.txt)+'</option>';
    }).join('')+'</select></label>';
}
/* ⛔⛔ UNA SOLA PUERTA PARA «EL SUBSISTEMA EFECTIVO DE ESTE BLOQUE» (581.ª). La condicion
   estaba a punto de quedar copiada en TRES sitios de esta misma pantalla — la firma, el
   rotulo de «Trabajo de subsistema» y la guarda `soloYo` —, y tres copias de un criterio
   acaban siendo tres criterios: la diferencia se leeria como que un rotulo contradice al
   de al lado. Es la regla 11 aplicada a una condicion en vez de a una constante.
   ✅ Y dice lo que significa: si el parte YA existe manda **el suyo**, porque
   `declararParte` no puede moverlo; si no, manda el **elegido**, porque `pushParte` si lo
   manda. Las dos mitades tienen su comprobacion. */
function _bloqSubsEfectivo_(){
  var d=_bloqDecl_();
  return (d && d.subsistema) ? d.subsistema : _bloqPerfil_();
}

function _bloqFirma_(){
  var perf=_bloqSubsEfectivo_();
  if(!perf) return '';
  var n=_firmaDe_(perf, _fichaYo_());
  return n ? ((miembro(n)||{}).pila||n) : '';
}

function _bloqPanel_(){
  /* Sin backend no se declara, y no se apunta en local: un parte que el servidor no tiene no
     son horas de nadie, y en esta cara la semilla ya ha mentido antes. Misma regla que el
     reloj de al lado, dicha con las mismas palabras. */
  if(!_fichaHayBack_()) return pan('Declarar horas que no fichaste','sin conexi\u00f3n',
    vacioSimple('Sin sesi\u00f3n no se puede declarar','Entra con tu cuenta.'));

  var f=BLOQ_FORM, decl=_bloqDecl_(), pend=_bloqMios_();
  /* ⛔ `perf` SALE DE LA PUERTA (581.ª), no de `_bloqPerfil_()`: de aqui cuelgan el rotulo
     «Trabajo de subsistema · X» y la guarda `soloYo`, y los dos decian el subsistema
     ELEGIDO sobre un parte que ya tiene el suyo — la misma promesa falsa que la firma. */
  var perf=_bloqSubsEfectivo_(), yo=_fichaYo_(), firmaP=_bloqFirma_();
  var falta=_bloqFalta_();

  /* LO QUE CADUCA VA ARRIBA. Un `sin declarar` se pierde a los 7 dias y un bloque nuevo no:
     debajo del formulario se declara el rato de hoy y se pierde el de la semana pasada, que
     es justo el que estaba a punto de perderse. */
  var lista = !pend.length ? '' :
    '<div class="pb" style="padding:0">'+pend.map(function(p){
      var det=(p.estado==='detalle'), sel=!!(decl && decl.id===p.id);
      var cad=p.caduca_at ? ' \u00b7 caduca '+esc(_diaMadridDe_(p.caduca_at)) : '';
      return '<div class="dec" style="cursor:default"><span class="tx"><b>'+
        h1(p.horas)+' \u00b7 '+esc(_isoADMY_(String(p.fecha||'')))+
        (p.ini&&p.fin?' \u00b7 '+esc(p.ini)+'\u2013'+esc(p.fin):'')+'</b><small>'+
        (det ? 'te piden: '+esc(p.motivo||'m\u00e1s detalle')
             /* ⛔ 633.ª Y un AUTOCIERRE se dice aquí, ANTES de elegirlo: misma puerta que el móvil. */
             : (_avisoAutocierre_(p) ? 'autocerrado al tope de '+_maxHorasParte_()+' h' : 'fichaje cerrado sin justificar')+cad)+'</small></span>'+
        '<span class="der"><span class="chip wa">'+(det?'falta detalle':'sin declarar')+'</span>'+
        '<button class="btn sm'+(sel?' pri':'')+'" data-bdecl="'+p.id+'">'+
          (sel?'rellen\u00e1ndolo':(det?'Responder':'Declarar'))+'</button></span></div>';
    }).join('')+'</div>';

  /* ⛔ Y SE DICE A QUE MES VA A CONTAR. Daniel (11/08): «tu puedes declarar un bloque horario
     atrasado de julio en agosto, si… pero eso tendra que entrar al nuevo mes, nunca al
     anterior». El backend ya lo hace asi -`_periodoParte_` no mira `fecha` y cae en
     `creado_at`-; lo que faltaba en esta cara es DECIRLO donde se ve. Se pinta de una forma y
     se contabiliza de otra es como se firma una cosa creyendo otra. */
  var mes=(typeof _avisoMesDelBloque_==='function') ? _avisoMesDelBloque_(f.fecha, HOY) : '';
  var avisoMes = (decl || !mes) ? '' :
    '<div class="nota" style="margin-top:11px">Es de <b>otro mes</b>: estas horas contar\u00e1n en '+
    '<b>'+esc(_nomPeriodo_(mes))+'</b>, el mes de trabajo en curso. Las de un mes ya cerrado no se pueden mover.</div>';

  /* ⛔ Y SI EL RANGO CRUZA MEDIANOCHE, SE DICE. `_bloqDur_` ya envuelve
     (`d<0?d+1440`) y no lo dice: quien se equivoca de casilla ve una duracion plausible
     y la manda a firmar. La banda sale de `_maxHorasParte_()` - ver `_cruceNoche_`.
     ⚠️ Va aparte de `_bloqFalta_` A PROPOSITO: eso BLOQUEA el envio, y hay turno
     nocturno real en produccion. Un aviso informa; una validacion rompe un parte legitimo. */
  var cruce=(typeof _cruceNoche_==='function') ? _cruceNoche_(f.ini, f.fin) : '';
  var avisoNoche = (decl || !cruce) ? '' : (
    cruce==='noche'
      ? '<div class="nota" style="margin-top:11px">Cruza <b>medianoche</b>: se cuentan '+
        '<b>'+h1(_bloqDur_())+'</b>.</div>'
      : cruce==='duda'
      ? '<div class="nota" style="margin-top:11px;color:var(--warn)"><b>¿Seguro?</b> '+
        'La salida es anterior a la entrada. Si cruzó medianoche son <b>'+h1(_bloqDur_())+
        '</b>; si te equivocaste de casilla, <b>'+h1(24-_bloqDur_())+'</b>. <b>Las dos '+
        'caben en un parte</b>, así que esto no se decide solo: míralo antes de firmarlo.</div>'
      : '<div class="nota" style="margin-top:11px;color:var(--warn)"><b>Parece del '+
        'revés.</b> Así son <b>'+h1(_bloqDur_())+'</b>, más de lo que un parte admite; '+
        'al revés serían <b>'+h1(24-_bloqDur_())+'</b>. Cambia entrada por salida si es eso.</div>');

  var cab;
  if(decl){
    cab='<div class="pb" style="border-top:1px solid var(--line)">'+
      '<div class="nota" style="border-top:0;padding:0"><b>'+h1(decl.horas)+'</b> del '+
        esc(_isoADMY_(String(decl.fecha||'')))+
        (decl.ini&&decl.fin?' ('+esc(decl.ini)+'\u2013'+esc(decl.fin)+')':'')+
        ' \u00b7 la <b>duraci\u00f3n ya la fij\u00f3 el servidor</b> al cerrar el fichaje y aqu\u00ed no se toca. '+
        (decl.estado==='detalle'
          ? 'Te pidieron m\u00e1s detalle: corrige lo que ya mandaste, no empieces de cero.'
          : 'Solo falta decir a qu\u00e9 imputarlas y justificarlas.')+'</div>'+
      /* ⛔⛔ 633.ª EL AVISO DE DANIEL (09/09), ENCIMA DEL BOTÓN QUE LO RESUELVE: «si fueron 14 h
         sin querer pero si q trabajaste o algo asi q mejor lo declares como bloque dsps en
         lugar de usar los de 14». Sin él, esta cabecera dice «la duración ya la fijó el
         servidor» —el tope vendido como medida— y nada explica por qué cancelar y declarar un
         bloque. ⚠️ El texto sale de `_avisoAutocierre_`: el MISMO que la tarjeta del móvil. */
      (_avisoAutocierre_(decl) ? '<div class="nota" style="margin-top:10px;color:var(--warn)">'+esc(_avisoAutocierre_(decl))+'</div>' : '')+
      '<div style="margin-top:10px"><button class="btn sm" data-bcancel>Cancelar y declarar un bloque</button></div>'+
    '</div>';
  } else if(f.declararId!=null){
    /* ⛔ APUNTA A UN PARTE QUE YA NO ESTA, y pasa de verdad: lo declaraste desde el movil o
       caduco, y el refresco de 90 s se lo llevo. Se DICE y se ofrece salir, en vez de dejar el
       formulario apuntando a un `id` que el servidor va a rechazar con un mensaje que no
       explica nada. */
    cab='<div class="pb" style="border-top:1px solid var(--line)">'+
      '<div class="nota" style="border-top:0;padding:0">El fichaje que ibas a declarar <b>ya no '+
      'espera declaraci\u00f3n</b>: o se declar\u00f3 desde el m\u00f3vil, o caduc\u00f3. Nada de lo que '+
      'escribas aqu\u00ed ir\u00eda a ning\u00fan sitio.</div>'+
      '<div style="margin-top:10px"><button class="btn sm" data-bcancel>Declarar un bloque</button></div>'+
    '</div>';
  } else {
    cab='<div class="pb" style="border-top:1px solid var(--line)">'+
      '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end">'+
        '<label style="width:150px"><span class="sc" style="display:block;margin-bottom:5px">Fecha</span>'+
          '<input class="mono" id="bqFecha" value="'+esc(f.fecha)+'" placeholder="DD/MM/AAAA" style="'+CAMPO_CSS+'"></label>'+
        '<label style="width:128px"><span class="sc" style="display:block;margin-bottom:5px">Entrada</span>'+
          '<select id="bqIni" style="'+CAMPO_CSS+'">'+optHoras(f.ini)+'</select></label>'+
        '<label style="width:128px"><span class="sc" style="display:block;margin-bottom:5px">Salida</span>'+
          '<select id="bqFin" style="'+CAMPO_CSS+'">'+optHoras(f.fin)+'</select></label>'+
        '<div style="flex:1;min-width:190px">'+
          '<div class="mono" id="bqDur" style="font-size:24px;line-height:1;font-weight:600">'+h1(_bloqDur_())+'</div>'+
          '<div class="sc" style="margin-top:5px">de trabajo declarado \u00b7 sin fichaje</div>'+
        '</div>'+
      '</div>'+avisoMes+avisoNoche+
    '</div>';
  }

  /* ⚠️ TUS tareas, y filtradas por responsable como en el reloj: `getTareas` le sirve al admin
     las de TODO el equipo (v52), asi que sin filtro esta cara ofreceria imputar tus horas a la
     tarea de otra persona. Se reusa `_fichaTareas_`: es la misma pregunta. */
  var opts=_fichaTareas_().map(function(t){
    return '<option value="'+esc(t.n)+'"'+(f.tarea===t.n?' selected':'')+'>'+esc(t.n)+'</option>';
  }).join('');
  /* ⛔ POR LA PUERTA DE ARRIBA (581.ª): aqui se montaba a pelo con `ps.length>1` y **sin
     mirar si hay parte**, asi que al declarar uno que ya existe se ofrecia elegir algo que
     no decide nada. Y dentro de esta funcion no habia forma de ejecutarlo en el arnes. */
  var selPerfil=_bloqPerfilCampo_();
  var etiDet = f.cat==='reunion' ? 'Nombre de la reuni\u00f3n'
             : f.cat==='turno'   ? 'Qu\u00e9 turno' : 'Concepto';
  var campoImput = f.cat==='tareas'
    ? '<label style="flex:2;min-width:240px"><span class="sc" style="display:block;margin-bottom:5px">Imputar a</span>'+
      '<select id="bqTarea" style="'+CAMPO_CSS+'">'+
        '<option value="">\u2014 elige una de tus tareas \u2014</option>'+opts+
        '<option value="Trabajo de subsistema"'+(f.tarea==='Trabajo de subsistema'?' selected':'')+
          '>Trabajo de subsistema \u00b7 '+esc(perf)+'</option>'+
        '<option value="__otro__"'+(f.tarea==='__otro__'?' selected':'')+'>Otro (lo escribo)</option>'+
      '</select></label>'+
      (f.tarea==='__otro__'
        ? '<label style="flex:2;min-width:200px"><span class="sc" style="display:block;margin-bottom:5px">Cu\u00e1l</span>'+
          '<input id="bqDet" value="'+esc(f.detalle)+'" placeholder="nombre de la tarea" style="'+CAMPO_CSS+'"></label>'
        : '')
    : '<label style="flex:2;min-width:240px"><span class="sc" style="display:block;margin-bottom:5px">'+etiDet+'</span>'+
      '<input id="bqDet" value="'+esc(f.detalle)+'" placeholder="p. ej. Turno de taller del 19/07" style="'+CAMPO_CSS+'"></label>';

  /* ⛔ Y SI EL FIRMANTE ERES TU, SE DICE. `_firmaDe_` escala al PD cuando el coordinador de
     la unidad es el propio autor -- pero si el autor ES el PD, escala A SI MISMO, y ese parte
     entra en una cola que NADIE puede firmar: `_decidirParte_` rechaza al autor («no puedes
     decidir tu propio parte») y `_puedeSobreParte_` rechaza a Jose («sin potestad sobre este
     parte»: pide rango >= 3 o ser el coordinador de esa unidad, y de «Project Director» no lo
     es nadie). La cola del escritorio SI le pinta los botones a Jose -- `revisoresDeParte`
     escala a el--, asi que hoy la pantalla promete una firma que el servidor rechaza.
     ✅ Se declara igual, que las horas queden registradas, pero se dice ANTES. Es lo unico
     que esta cara puede hacer: el arreglo de verdad es del backend y esta apuntado. */
  /* ⛔ …y desde el 15/08 el PD SI puede, asi que a el no se le avisa: el aviso decia la
     verdad cuando el servidor rechazaba, y repetirlo ahora seria asustar con algo que
     ya funciona -- un guardia que canta sobre lo correcto se acaba ignorando. */
  /* ⛔⛔ HOY ESTA CONDICION ES INALCANZABLE, Y SE DICE (564.ª). Se midio siguiendo las
     dos ramas de `_firmaDe_`: devuelve `PD_NOM` cuando el coordinador de esa unidad es
     `quien`, y el coordinador en los demas casos. Para que salga `yo` hacen falta las
     dos a la vez, y solo la primera puede darlo -- o sea `yo === PD_NOM`, cuyo
     `rangoNom` es **3**, asi que el `rangoNom(yo)<3` de al lado lo corta SIEMPRE.
     ⚠️ No es un fallo: es la 15/08 haciendo su trabajo. El aviso se escribio cuando el
     servidor rechazaba al PD; al arreglarse, se le anadio `rangoNom(yo)<3` para dejar de
     asustarle -- y como el PD era el UNICO que cumplia la primera mitad, la rama entera
     se quedo sin nadie. **La cura correcta mato el caso, no solo el aviso.**
     ✅ Se conserva -- no se borra -- porque lo que la revive es un cambio en `_firmaDe_`:
     el dia que escale a **si mismo** en vez de al PD, este texto vuelve a hacer falta y
     ya esta escrito. Borrarlo obligaria a redescubrir por que hizo falta.
     ⚠️ Y por eso su mutacion sale **CIEGA a proposito**: no hay entrada que llegue aqui.
     Lo que NO puede pasar es que eso se lea como cobertura. */
  var soloYo = !!(perf && _firmaDe_(perf, yo)===yo) && rangoNom(yo)<3;
  var avisoFirma = !soloYo ? '' :
    '<div class="nota" style="margin-top:11px"><b>Con este perfil el firmante ser\u00edas t\u00fa y '+
    'nadie firma lo suyo</b>, as\u00ed que <b>nadie podr\u00e1 aprobar este parte</b>. '+
    'Si tienes otro perfil, declara con ese.</div>';

  var form='<div class="pb" style="border-top:1px solid var(--line)">'+
    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end;margin-bottom:11px">'+
      selPerfil+
      '<label style="min-width:170px"><span class="sc" style="display:block;margin-bottom:5px">Categor\u00eda</span>'+
      '<select id="bqCat" style="'+CAMPO_CSS+'">'+
        '<option value="tareas"'+(f.cat==='tareas'?' selected':'')+'>Tarea</option>'+
        '<option value="reunion"'+(f.cat==='reunion'?' selected':'')+'>Reuni\u00f3n no convocada</option>'+
        '<option value="turno"'+(f.cat==='turno'?' selected':'')+'>Turno no convocado</option>'+
        '<option value="compensacion"'+(f.cat==='compensacion'?' selected':'')+'>Compensaci\u00f3n</option>'+
      '</select></label>'+
      campoImput+
    '</div>'+
    '<label style="display:block"><span class="sc" style="display:block;margin-bottom:5px">Qu\u00e9 estuviste haciendo</span>'+
    '<textarea id="bqJust" rows="3" placeholder="Qu\u00e9 hiciste, con qui\u00e9n y d\u00f3nde. M\u00ednimo 25 caracteres." '+
      'style="'+CAMPO_CSS+';resize:vertical;font-size:12.5px">'+esc(f.just)+'</textarea></label>'+
    '<p class="sc" id="bqFalta" style="margin:8px 0 0;letter-spacing:.08em">'+
      esc(falta||('Todo listo: se env\u00eda a '+(firmaP||'tu coordinador')+'.'))+'</p>'+
    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin-top:11px">'+
      '<button class="btn pri" id="bqEnviar"'+(falta?' disabled':'')+'>'+
        (decl?'Declarar este fichaje':'Declarar '+h1(_bloqDur_()))+'</button>'+
      (firmaP?'<span class="sc">lo firma '+esc(firmaP)+'</span>':'')+
    '</div>'+
    avisoFirma+
    /* 31/10: la nota fija decia «Nadie firma lo suyo … sube al Project Director» TAMBIÉN al PD, que sí firma lo suyo
       (cabecera de este fichero; `_firmaDe_` lo pone primero). A él se le dice lo que pasa de verdad. */
    '<div class="nota" style="margin-top:11px">Queda <b>pendiente</b> y <b>no suma</b> hasta '+
      'que la firme quien te corresponde. '+
      (rangoNom(yo)>=3
        ? '<b>Como Project Director, lo tuyo lo firmas t\u00fa</b>: no sube a nadie m\u00e1s.'
        : 'Si declaras como coordinador de tu propia unidad, lo firma el <b>Project Director</b>.')+'</div>'+
  '</div>';

  return pan('Declarar horas que no fichaste',
    decl ? 'declarando un fichaje sin justificar'
         : (pend.length ? pend.length+' esperando declaraci\u00f3n' : 'un bloque a posteriori'),
    lista+cab+form, pend.length?'destaca':'');
}

/* Actualiza SOLO los rotulos y el candado del boton, sin repintar. ⛔ Igual que `_fichaAviso_`:
   `pintar()` reconstruye `#main`, asi que llamarlo desde un `oninput` te quita el foco y el
   cursor a media justificacion -- y esta justificacion son 25 caracteres minimo, que es donde
   mas se escribe de toda la pantalla. */
function _bloqAviso_(){
  var falta=_bloqFalta_(), decl=_bloqDecl_(), firmaP=_bloqFirma_();
  var t=document.getElementById('bqFalta'), b=document.getElementById('bqEnviar');
  var d=document.getElementById('bqDur');
  if(t) t.textContent = falta || ('Todo listo: se env\u00eda a '+(firmaP||'tu coordinador')+'.');
  if(d) d.textContent = h1(_bloqDur_());
  if(b){ b.disabled=!!falta;
         b.textContent = decl ? 'Declarar este fichaje' : ('Declarar '+h1(_bloqDur_())); }
}

/* ⭐ 26/10 · Daniel: «Sí, mientras no esté firmado». TUS partes que nadie ha firmado (`pendiente` o con detalle pedido),
   para RETIRARLOS o CORREGIR sus horas — lo que el móvil ya hace en «Tus partes». Del crudo `PART_BACK`, como
   `_bloqMios_`, y SÓLO los tuyos (`_fichaYo_`): bajo «Actúas como» no se toca lo ajeno. El servidor es quien se planta
   (sólo el autor, sólo sin firmar); esto no ofrece lo que rechazaría. */
function _misSinFirmarE_(){
  if(!Array.isArray(PART_BACK)) return [];
  var yo=_fichaYo_();
  return PART_BACK.filter(function(p){ return p && p.autor===yo && (p.estado==='pendiente' || p.estado==='detalle'); });
}

function _misSinFirmarHTML_(){
  var l=_misSinFirmarE_();
  if(!l.length) return '';
  return pan('Tus partes sin firmar', l.length+(l.length===1?' parte':' partes')+' · los puedes retirar o corregir',
    '<div class="pb" style="padding:0">'+l.map(function(p){
      var _ctc=_txtCorreccion_(p.correcciones);
      return '<div class="dec" style="cursor:default"><span class="tx"><b>'+esc(p.tarea||'Parte')+'</b><small>'+
        esc(_isoADMY_(p.fecha)||'')+' · '+nf2(Number(p.horas)||0)+' h'+(p.estado==='detalle'?' · te piden detalle':'')+
        (_ctc?' · '+esc(_ctc):'')+'</small></span>'+
        '<button class="btn mini" data-epcorr="'+p.id+'">Corregir horas</button> '+
        /* 26/10: «horas y descripción». Sólo en `pendiente`: con detalle pedido ya la cambia la respuesta. */
        (p.estado==='pendiente' ? '<button class="btn mini" data-epdesc="'+p.id+'">Corregir descripción</button> ' : '')+
        '<button class="btn mini" data-epret="'+p.id+'">Retirar</button></div>';
    }).join('')+'</div>'+
    '<div class="nota">Mientras nadie lo firme. Quien firma ve que lo corregiste («… corregidas por su autor»).</div>');
}

/* ═══ LO TUYO · LO QUE NO CUENTA, DE QUÉ SE COMPONEN TUS HORAS Y TODO TU HISTÓRICO (31/10) ══════════════
   🗣️ Daniel: «llevar al escritorio todo lo que hay en el móvil ahora y completar las funciones que promete y no
   tiene». Inventario `docs/inventario-paridad-2026-10-31.md` §A4, §A5 y §A7.

   ⛔ A QUIEN LE RECHAZABAN UN PARTE EN EL ESCRITORIO NO LO VEÍA EN «LO TUYO»: sólo salían los pendientes y los de
   detalle (`_misSinFirmarE_`). Los rechazados —con su MOTIVO— y los caducados sólo estaban en el «Histórico» de
   Partes, mezclados con los de todos y sin decir cuáles eran tuyos.
   ✅ Salen de `PARTES` (normalizado), no de `PART_BACK`: `normParte` ya lleva `motivo`, `decidido_*` y `periodo`, y así
   la MAQUETA también los pinta (con `PART_BACK` a `null` la rama no se vería nunca).
   ⚠️ Y SÓLO los estados que ningún otro panel de esta vista enseña ya: `pend`/`detalle` van en «Tus partes sin
   firmar» (con sus botones) y `sindecl` en «Declarar horas que no fichaste», de TODOS los meses. Repetirlos aquí
   sería pintar dos veces lo mismo — el móvil los junta porque es UNA lista; esta cara tiene un panel por acción.
   ⛔ SÓLO LOS TUYOS, por `_fichaYo_` (la sesión, no «Ver como»), como el resto de «Lo tuyo». */
var _ESTADOS_NO_CUENTAN_E_=['rechazado','cad','rev','raro'];

/* TUS partes que no cuentan, partidos por mes: los de este mes y «De meses anteriores» (los plegados). Por la MISMA
   puerta que el móvil (`_esDeMesPasado_` con `_periodoAbierto_`, que ya lee `periodo`, `creado_at` y `iso`). */
function _misPartesNoCuentanE_(){
  var yo=_fichaYo_(), per=_periodoAbierto_();
  var l=(PARTES||[]).filter(function(p){
    return p && yo && p.autor===yo && _ESTADOS_NO_CUENTAN_E_.indexOf(p.estado)>=0;
  }).sort(function(a,b){ return String(b.iso||'').localeCompare(String(a.iso||'')); });
  return { mias:l.filter(function(p){ return !_esDeMesPasado_(p, per); }),
           viejas:l.filter(function(p){ return _esDeMesPasado_(p, per); }) };
}

/* Una fila de «lo que no cuenta»: qué pasó, y POR QUÉ cuando el servidor lo dijo. ⚠️ Un motivo que no consta NO se
   inventa (`motivo` vacío → sin cita); un caducado no tiene motivo: lo dice la propia caducidad. */
function _filaNoCuentaE_(p){
  var et=p.estado==='rechazado' ? '<span class="chip no">rechazado</span>'
        :p.estado==='cad' ? '<span class="chip no">caducado</span>'
        :p.estado==='rev' ? '<span class="chip no">'+(p.ret?'retirado':'revertido')+'</span>'
        :'<span class="chip">estado desconocido</span>';
  var que=p.estado==='rechazado' ? 'decidido '+_firmaParte_(p)
        :p.estado==='cad' ? 'caducó sin declararse a tiempo: no cuenta'
        :p.estado==='rev' ? (p.ret ? 'lo retiraste tú: no se firma ni cuenta' : 'revertido: ya no cuenta')
        :'el servidor lo manda con un estado que esta pantalla no conoce';
  var mot=p.estado==='rechazado' ? p.motivo : (p.estado==='rev' && !p.ret ? p.revmot : null);
  return '<div class="dec ltfila" style="cursor:default"><span class="tx"><b>'+esc(p.tarea||'Parte')+'</b><small>'+
      esc(p.fecha||'')+' · '+esc(que)+'</small>'+
      (mot?'<span class="ltmot"><span class="sc">'+(p.estado==='rechazado'?'motivo':'por qué')+'</span>'+
        esc(mot)+'</span>':'')+
    '</span><span class="der"><span class="mono">'+nf2(Number(p.horas)||0)+' h</span>'+et+'</span></div>';
}

function _misPartesNoCuentanHTML_(){
  var r=_misPartesNoCuentanE_(), n=r.mias.length+r.viejas.length;
  if(!n) return '';
  var hV=r.viejas.reduce(function(t,x){ return t+(Number(x.horas)||0); },0);
  return pan('Tus partes que no cuentan', n+(n===1?' parte':' partes')+' · rechazados, caducados y revertidos',
    '<div class="pb" style="padding:0">'+
      (r.mias.length ? r.mias.map(_filaNoCuentaE_).join('')
        : '<div class="nota" style="border-top:0">Ninguno de este mes. Lo que hay es de meses anteriores, plegado debajo.</div>')+
      (r.viejas.length
        ? '<details class="ltplg"><summary><b>De meses anteriores</b><span class="sc">'+r.viejas.length+
            (r.viejas.length===1?' parte':' partes')+' · '+nf2(hV)+' h</span></summary>'+
          r.viejas.map(_filaNoCuentaE_).join('')+'</details>'
        : '')+
    '</div>'+
    '<div class="nota">Estos partes <b>no suman horas</b>. Un rechazo se lee con su motivo; para volver a pedir esas horas, '+
    'declara otro parte con lo que falte.</div>');
}

/* LO QUE TUS IMPUTACIONES SUMARON A CADA CATEGORÍA (gemela de `desgloseCat` del móvil, que pinta chips; aquí barras).
   No es el total de la categoría en Notion —que además lleva reuniones automáticas, cursos…—: es la parte que puedes
   verificar tú. Una categoría desconocida o sin categoría cae en «Compensaciones», como el motor (`aplicar_horas.py`). */
function _sumaPorCatE_(ps){
  var g={}, orden=['reunion','tareas','turno','compensacion'];
  (ps||[]).forEach(function(p){
    var k=(p.cat && (p.cat in CAT_ETI)) ? p.cat : 'compensacion';
    g[k]=(g[k]||0)+(Number(p.horas)||0);
  });
  return orden.filter(function(k){ return g[k]; }).map(function(k){ return {k:k, eti:CAT_ETI[k], h:g[k]}; });
}

function _desgloseCatHTMLE_(ps){
  var l=_sumaPorCatE_(ps);
  if(!l.length) return '';
  var tot=l.reduce(function(t,x){ return t+x.h; },0);
  return '<div class="ltcat"><div class="sc">De qué se componen · lo que sumaron tus partes</div>'+
    l.map(function(x){
      var w=tot>0 ? (x.h/tot*100) : 0;
      return '<div class="fila"><span class="k">'+esc(x.eti)+'</span>'+
        '<span class="tr"><i style="width:'+w.toFixed(1)+'%"></i></span>'+
        '<span class="v mono">'+nf2(x.h)+' h</span></div>';
    }).join('')+'</div>';
}

/* TUS partes aprobados, de TODOS los meses: lo que cuenta de verdad (`aprobado` agrupa aprobada/otorgada/aplicada). */
function _misAprobadosE_(){
  var yo=_fichaYo_();
  return (PARTES||[]).filter(function(p){ return p && yo && p.autor===yo && p.estado==='aprobado'; });
}

/* LOS GRUPOS DEL HISTÓRICO, ya ordenados (del más nuevo al más viejo; los sin fecha, al final). Gemela de la mitad de
   datos de `_histHorasHTML_` (móvil): el grupo es el MES QUE GRABÓ EL SERVIDOR (`periodo`) y sin él, la fecha del
   trabajo (20/10, auditoría: lo atrasado cuenta en el mes en que entró). `cDev` es la compensación base devengada a
   día de hoy: va SOLO al mes abierto (`per`), se SUMA a su total y crea el grupo si no existe — el parte de verdad
   nace al cerrar, y una fila sintética en un mes CERRADO saldría dos veces. */
function _gruposHistE_(todos, per, cDev){
  var g=[], idx={}, i, p, mp, d, k;
  for(i=0;i<(todos||[]).length;i++){
    p=todos[i]; mp=/^(\d{4})-(\d{2})$/.exec(String(p.periodo||''));
    d=mp ? new Date(+mp[1], +mp[2]-1, 1) : _fechaDMY_(p.fecha);
    k=d ? (d.getFullYear()+'-'+((d.getMonth()+1)<10?'0':'')+(d.getMonth()+1)) : '';
    if(!(k in idx)){ idx[k]=g.length; g.push({k:k, d:d, items:[], h:0, comp:null}); }
    g[idx[k]].items.push(p); g[idx[k]].h+=(Number(p.horas)||0);
  }
  var orden=function(a,b){ if(!a.d && !b.d) return 0; if(!a.d) return 1; if(!b.d) return -1; return b.d-a.d; };
  if(per && cDev!=null && cDev>0){
    if(!(per in idx)){ idx[per]=g.length; g.push({k:per, d:new Date(), items:[], h:0, comp:null}); }
    g[idx[per]].comp=cDev; g[idx[per]].h+=cDev;
  }
  g.sort(orden);
  return g;
}

function _histHorasHTMLE_(mi){
  var todos=_misAprobadosE_();
  if(!todos.length) return '';   /* como el móvil: sin movimientos no hay histórico (la compensación ya está en el mes de arriba) */
  var per=_periodoAbierto_();
  var cb=_compBase_(mi), cDev=null;
  if(per && typeof cb==='number' && cb>0) cDev=_devengadoAHoy_(mi, cb, _fraccionDelMes_());
  var g=_gruposHistE_(todos, per, cDev);
  if(!g.length) return '';
  var out='', tempPrev=null, j, i, gr, temp, tot=0;
  for(j=0;j<g.length;j++){
    gr=g[j]; temp=gr.d ? _temporadaDe_(gr.d) : null;
    /* El salto de temporada va ANTES del grupo más viejo: lo de debajo de la línea es la temporada que cerró. */
    if(temp && tempPrev && temp!==tempPrev) out+='<div class="ltsep">cierre de temporada '+esc(temp)+'</div>';
    if(temp) tempPrev=temp;
    out+='<div class="ltmes"><b>'+(gr.d ? esc(_mesLargo_(gr.d)) : 'Sin fecha')+'</b>'+
      (gr.d ? '<span class="chip'+(per && gr.k===per?' wa">sin cerrar':'">cerrado')+'</span>' : '')+
      '<span class="ln"></span><span class="mono">'+nf2(gr.h)+' h</span></div>';
    /* ⚠️ La fila calculada va MARCADA como tal, no disfrazada de parte: cuando el cierre escriba el parte de verdad
       vendrá del registro y se pintará como los demás. */
    if(gr.comp!=null) out+='<div class="dec ltfila" style="cursor:default"><span class="tx"><b>Compensación base</b>'+
      '<small>devengada a día de hoy · se cierra a fin de mes</small></span><span class="der">'+
      '<span class="mono">'+nf2(gr.comp)+' h</span><span class="chip">calculada</span></span></div>';
    for(i=0;i<gr.items.length;i++){
      var p=gr.items[i];
      out+='<div class="dec ltfila" style="cursor:default"><span class="tx"><b>'+esc(p.tarea||'Parte')+'</b><small>'+
        esc(p.fecha||'')+(p.cat && (p.cat in CAT_ETI) ? ' · '+esc(CAT_ETI[p.cat]) : '')+
        '</small></span><span class="der"><span class="mono">'+nf2(Number(p.horas)||0)+' h</span></span></div>';
    }
    tot+=gr.h;
  }
  return pan('Todo tu histórico', todos.length+(todos.length===1?' movimiento':' movimientos')+' · separados por cierres',
    '<div class="pb" style="padding:0"><details class="ltplg" style="border-top:0"><summary><b>Ver mes a mes</b>'+
      '<span class="sc">'+nf2(tot)+' h en total</span></summary>'+out+'</details></div>'+
    '<div class="nota">El registro <b>no se borra nunca</b>: al cerrar el mes sus horas pasan aquí y empieza el siguiente.</div>');
}

/* TU RITMO FRENTE AL EQUIPO Y AL MES ANTERIOR (§A7). Gemela de la mitad de datos de `_compHorasHTML_` (móvil): se
   compara el RITMO (h/día), no el total —el mes en curso va a medias y el anterior está entero—, sin la compensación
   base (que no se trabaja) y con ella DEVENGADA en rampa, no descontada. Devuelve `null` si no hay nada que comparar:
   antes que inventarse un número, no se dice nada.
   ⚠️ «vs. equipo» sólo con la media que MANDA EL SERVIDOR (`equipo_mes.media`, con ≥3 personas): el respaldo local del
   móvil (`_mediaEquipo_`) no se trae a esta cara — el servidor la manda también al escritorio. Y a quien acaba de
   entrar no se le compara (`_recienLlegado_`): se le dice por qué. «vs. mes anterior» sólo si el dato ES del mes
   anterior (`_antComparable_` con `mes` nulo = derivado del periodo); el respaldo con su propio mes no se trae. */
function _ritmoHorasE_(mi){
  var base=_hMesReal_(mi);
  if(base==null) return null;
  var d=_diasDelMes_(), dia=Math.max(1, d.dia);
  var bt=_devengadoAHoy_(mi, base, _fraccionDelMes_());
  var num=(bt==null ? base : bt), ritmo=num/dia, filas=[];
  var ant=_antComparable_(mi);
  if(ant!=null && ant.mes==null){
    var bA=_devengadoAHoy_(mi, ant.h, 1);
    var e0=DATA.equipo_mes, dAnt=_diasMesAnterior_(d.periodo, e0 ? e0.dias_ant : null);
    var rAnt=(bA==null ? ant.h : bA)/dAnt;
    var pm=/^(\d{4})-(\d{2})$/.exec(String(d.periodo||'')), nomA=pm ? MESES_L[(+pm[2]+10)%12] : 'el mes anterior';
    filas.push({k:'vs. '+nomA, v:ritmo, ref:rAnt, txt:nf2(rAnt)+' h/día en '+nomA});
  }
  var e=DATA.equipo_mes, nuevo=_recienLlegado_(mi);
  if(!nuevo && e && typeof e.media==='number' && (e.n||0)>=3 && e.media>0)
    filas.push({k:'vs. equipo', v:ritmo, ref:e.media/dia, txt:nf2(e.media/dia)+' h/día de media'});
  filas=filas.filter(function(f){ return typeof f.ref==='number' && isFinite(f.ref) && f.ref>0; });
  if(!filas.length && !nuevo) return null;
  return { ritmo:ritmo, num:num, dia:dia, conBase:(bt!=null), nuevo:nuevo, filas:filas };
}

function _ritmoHorasHTMLE_(mi){
  var r=_ritmoHorasE_(mi);
  if(!r) return '';
  if(r.nuevo) return pan('Tu ritmo', 'este mes',
    '<div class="nota" style="border-top:0">Es tu primer mes en el equipo: la comparación con el resto sale después de '+
    'tu primer cierre (hoy se haría con días en los que aún no estabas).</div>');
  return pan('Tu ritmo', nf2(r.ritmo)+' h/día',
    '<div class="ltrit">'+r.filas.map(function(f){
      var dl=(f.v-f.ref)/f.ref*100, w=Math.min(Math.abs(dl),80)/80*50, izq=dl>=0 ? 50 : 50-w;
      return '<div class="ltdl '+(dl>=0?'pos':'neg')+'"><span class="k">'+esc(f.k)+'</span>'+
        '<span class="tr"><i class="z"></i><b style="left:'+izq.toFixed(2)+'%;width:'+w.toFixed(2)+'%"></b></span>'+
        '<span class="vv"><b>'+pc(dl)+'</b><small>'+esc(f.txt)+'</small></span></div>';
    }).join('')+'</div>'+
    '<div class="nota">Tu ritmo: <b>'+nf2(r.ritmo)+' h/día</b> ('+nf2(r.num)+' h en '+r.dia+' días'+
    (r.conBase?', con la compensación base repartida hasta hoy':'')+'). Se compara el <b>ritmo</b>, no el total: '+
    'el mes en curso va a medias y el anterior está entero.</div>');
}

function _engMisSinFirmarE_(){
  $$('[data-epret]').forEach(function(b){ b.onclick=async function(){
    if(b.disabled) return;
    var _id=+b.dataset.epret;
    if(!confirm('Retirar este parte.\n\nNo llegará a firmarse ni contará. Se queda en tu lista como «retirada».\n\n¿Sigo?')) return;
    b.disabled=true;
    try{ await api.retirarParte(_id); tost('Parte retirado.'); await _cargarPartes_(); pintar(); }
    catch(e){ tostErr('No se pudo: ', e); b.disabled=false; }
  }; });
  $$('[data-epcorr]').forEach(function(b){ b.onclick=async function(){
    if(b.disabled) return;
    var _id=+b.dataset.epcorr;
    var _p=_misSinFirmarE_().filter(function(x){ return x.id===_id; })[0];
    if(!_p){ tost('Ese parte ya no está sin firmar.'); pintar(); return; }
    var _t=prompt('Horas de este parte (máximo '+_maxHorasParte_()+'):', String(_p.horas).replace('.', ','));
    if(_t==null) return;
    var _h=Number(String(_t).trim().replace(',', '.'));
    if(!(_h>0) || _h>_maxHorasParte_()){ tost('Pon unas horas entre 0 y '+_maxHorasParte_()+'.'); return; }
    b.disabled=true;
    try{ await api.corregirParte(_id, _h); tost('Horas corregidas.'); await _cargarPartes_(); pintar(); }
    catch(e){ tostErr('No se pudo: ', e); b.disabled=false; }
  }; });
  $$('[data-epdesc]').forEach(function(b){ b.onclick=async function(){
    if(b.disabled) return;
    var _id=+b.dataset.epdesc;
    var _p=_misSinFirmarE_().filter(function(x){ return x.id===_id; })[0];
    if(!_p){ tost('Ese parte ya no está sin firmar.'); pintar(); return; }
    var _t=prompt('Descripción de este parte:', _p.tarea||'');
    if(_t==null) return;
    _t=String(_t).trim();
    if(!_t){ tost('La descripción no puede quedar vacía.'); return; }
    b.disabled=true;
    try{ await api.corregirParte(_id, null, _t); tost('Descripción corregida.'); await _cargarPartes_(); pintar(); }
    catch(e){ tostErr('No se pudo: ', e); b.disabled=false; }
  }; });
}

function _engBloqueE_(){
  /* Elegir uno de la lista. ⛔ RESPONDER NO ES EMPEZAR DE CERO: un `sin declarar` viene vacio y
     hay que rellenarlo; uno al que le PIDEN DETALLE ya trae tarea, categoria y justificacion, y
     lo que toca es corregir. Vaciarlo obliga a reescribir de memoria lo que el coordinador esta
     mirando -- y de paso invita a mandar algo distinto de lo que pregunto. */
  $$('[data-bdecl]').forEach(function(b){ b.onclick=function(){
    var id=+b.dataset.bdecl;
    var l=_bloqMios_().filter(function(x){ return x.id===id; });
    if(!l.length){ tost('Ese parte ya no espera declaraci\u00f3n.'); pintar(); return; }
    var p=l[0], det=(p.estado==='detalle');
    BLOQ_FORM.declararId=id;
    BLOQ_FORM.cat = det ? (p.categoria||'tareas') : 'tareas';
    BLOQ_FORM.tarea='';
    BLOQ_FORM.detalle = det ? (p.tarea||'') : '';
    BLOQ_FORM.just = det ? (p.justificacion||'') : '';
    /* ⛔ La clave del bloque se tira: pertenecia al envio que estabas preparando, y
       `declararParte` no la usa. Arrastrarla haria que el siguiente bloque naciera con la
       clave de otro y el servidor devolviera aquel en vez de crear este. */
    BLOQ_FORM.clave=null;
    pintar();
  }; });

  var bc=document.querySelector('[data-bcancel]');
  if(bc) bc.onclick=function(){
    BLOQ_FORM.declararId=null; BLOQ_FORM.just=''; BLOQ_FORM.tarea=''; BLOQ_FORM.detalle='';
    pintar();
  };

  var bp=document.getElementById('bqPerfil');
  /* `pintar()` y no un repintado del select: al cambiar de perfil cambian TAMBIEN el rotulo de
     «Trabajo de subsistema» y la linea de quien firma. Repintar solo lo que se toco dejaria a
     las otras dos diciendo lo de antes, que es peor que no decir nada. */
  if(bp) bp.onchange=function(){ BLOQ_FORM.perfil=bp.value; pintar(); };
  var bcat=document.getElementById('bqCat');
  if(bcat) bcat.onchange=function(){ BLOQ_FORM.cat=bcat.value; BLOQ_FORM.tarea=''; BLOQ_FORM.detalle=''; pintar(); };
  var bt=document.getElementById('bqTarea');
  if(bt) bt.onchange=function(){ BLOQ_FORM.tarea=bt.value;
    if(bt.value==='__otro__'){ BLOQ_FORM.detalle=''; pintar(); } else _bloqAviso_(); };
  var bd=document.getElementById('bqDet');
  if(bd) bd.oninput=function(){ BLOQ_FORM.detalle=bd.value; _bloqAviso_(); };
  var bj=document.getElementById('bqJust');
  if(bj) bj.oninput=function(){ BLOQ_FORM.just=bj.value; _bloqAviso_(); };
  /* La fecha repinta: de ella depende el aviso de «es de otro mes», que es una frase entera y
     no un rotulo. Los desplegables de hora, no: solo cambian la duracion y el boton. */
  var bfe=document.getElementById('bqFecha');
  if(bfe) bfe.onchange=function(){ BLOQ_FORM.fecha=bfe.value; pintar(); };
  var bi=document.getElementById('bqIni');
  if(bi) bi.onchange=function(){ BLOQ_FORM.ini=bi.value; _bloqAviso_(); };
  var bfi=document.getElementById('bqFin');
  if(bfi) bfi.onchange=function(){ BLOQ_FORM.fin=bfi.value; _bloqAviso_(); };

  var be=document.getElementById('bqEnviar');
  if(be) be.onclick=async function(){
    /* ⛔ EL CANDADO VA ANTES DEL `await`, y son DOS cosas distintas: la primera linea corta el
       segundo clic que YA VENIA en camino -- el que produce el envio duplicado--, y
       `disabled=true` corta los siguientes. Con `declararParte` el segundo intento llega a un
       parte que ya paso a `pendiente`, sale con «este parte no admite declaracion» y quien lo
       lee cree que NO se declaro: lo vuelve a declarar como bloque nuevo y esas horas se le
       cuentan dos veces. */
    if(be.disabled) return;
    var f=BLOQ_FORM, falta=_bloqFalta_();
    if(falta){ tost(falta+'.'); return; }
    var decl=_bloqDecl_(), imput=_imputacion_(f), perf=_bloqPerfil_()||null;
    var teclea=_bloqDur_(), firmaP=_bloqFirma_();
    be.disabled=true; var prev=be.textContent; be.textContent='Declarando\u2026';
    try{
      var guardado=null;
      if(decl){
        /* `declararParte` NO crea nada: mueve un parte que YA existe de `sin_declarar` (o de
           `detalle`) a `pendiente`. Su proteccion contra el envio repetido es el ESTADO -- el
           segundo sale con «este parte no admite declaracion (pendiente)»--, asi que aqui no
           viaja clave: meterle una seria una segunda regla para lo mismo. */
        var upd=await api.declararParte(decl.id, imput, f.just.trim(), f.cat);
        if(upd && upd.id!=null && Array.isArray(PART_BACK)){
          var i=-1, k;
          for(k=0;k<PART_BACK.length;k++){ if(PART_BACK[k] && PART_BACK[k].id===upd.id){ i=k; break; } }
          if(i>=0) PART_BACK[i]=upd; else PART_BACK.push(upd);
          _partesReal_();
        }
        guardado=upd; f.declararId=null;
      } else {
        /* ⛔ LA CLAVE DE UN SOLO USO NACE FUERA DE `api.pushParte` Y SOBREVIVE AL FALLO.
           `api._post` reintenta hasta tres veces: nacida dentro, cada reintento seria un envio
           distinto. Y conservada en el formulario, el reintento A MANO tras un corte -- el caso
           en que el servidor SI guardo y la respuesta se perdio-- llega con la MISMA y
           `_parteConClave_` devuelve el parte que ya hay en vez de crear un segundo. Es la
           unica proteccion que cubre el envio duplicado que NO es un doble clic. */
        if(!f.clave) f.clave=_claveUso_();
        var rec=await api.pushParte({ fecha:_dmyAISO_(f.fecha), tarea:imput, categoria:f.cat,
          horas:teclea, ini:f.ini, fin:f.fin, justificacion:f.just.trim(), sinFichaje:true,
          subsistema:perf, clave:f.clave });
        guardado=(rec && rec.partes && rec.partes[0]) ? rec.partes[0] : null;
        if(guardado && Array.isArray(PART_BACK)){ PART_BACK.push(guardado); _partesReal_(); }
        f.clave=null;
      }
      /* ⛔ SE LIMPIA DESPUES DE QUE EL SERVIDOR CONTESTE, nunca antes: limpiar primero y fallar
         despues borra lo que la persona acaba de escribir y no queda en ningun sitio.
         ⛔ Y SE LIMPIAN TAMBIEN EL PERFIL Y LA FECHA. Dejarlos pegados hace que una eleccion
         puntual -- «esto fue como coordinador de X», «esto fue del 30/07»-- enrute y feche TODO
         lo siguiente igual, en silencio y sin volver a preguntar. Es el fallo exacto que ya
         mordio dos veces en el movil, campo a campo. */
      f.just=''; f.tarea=''; f.detalle=''; f.perfil=null; f.fecha=HOY;
      /* ⛔ SE CONFIRMA LO GUARDADO, NO LO TECLEADO. El backend recorta al tope y devuelve el
         parte: teclear 20 h guardaba 14 y esto habria cantado «20 declaradas», seis horas
         perdidas con un mensaje en verde. Y si no vuelve el parte, `h` es `null` = «no lo se»,
         que NO es cero: se confirma el envio sin inventarse un numero. */
      var h=(guardado && typeof guardado.horas==='number') ? guardado.horas : null;
      tost(h==null
        ? ('Declarado \u00b7 a la cola de '+(firmaP||'tu coordinador')+' (las horas te las confirma \u00e9l)')
        : (h1(h)+' declaradas \u00b7 a la cola de '+(firmaP||'tu coordinador')+
           (Math.abs(h-teclea)>0.001 ? ' \u00b7 el servidor guard\u00f3 '+h1(h)+', no lo que pon\u00eda en pantalla' : '')+
           '. No suman hasta que las firme.'));
      pintar();
    }catch(e){
      /* ⛔ Y EL BOTON VUELVE A ESTAR VIVO, CON EL FORMULARIO INTACTO. Una escritura que se traga
         su error deja a alguien creyendo que declaro: son horas que no existen y que nadie echa
         en falta hasta el cierre de mes. */
      be.disabled=false; be.textContent=prev; tostErr('No se pudo declarar: ', e);
    }
  };
}





/* ═══ EL PARTE DE BLOQUE EN EL ESCRITORIO (29/10) ═════════════════════════════════════════════════════
   La lógica vive en `comun.js` (`_bloque*_`); aquí sólo dónde se pinta. No hay modal en esta cara: el formulario
   va DENTRO del panel desde el que se abrió (`BLQ.donde` = la vista), y como vive en `BLQ` sobrevive a `pintar()`.
   ⛔ `mias`/`otras` ya vienen partidas por `puedeDecidirParte`: un coordinador no decide un bloque (lo decide el PD,
   `decidirBloque`), así que a él las líneas de bloque le salen SIN botones. */
var _bloqueCbE_={
  abrir:function(){ BLQ.donde=vista; pintar(); },
  refrescar:function(){ pintar(); },
  cerrar:function(){ pintar(); },
  hecho:function(){ _cargarPartes_().then(pintar); },
  decidido:function(bq, rech){
    var no={}; (rech||[]).forEach(function(x){ no[String(x.id)]=1; });
    (PART_BACK||[]).forEach(function(x){ if(String(x.bloque)===String(bq) && x.estado==='pendiente') x.estado=no[String(x.id)]?'rechazada':'aprobada'; });
    _partesReal_(); pintar(); _cargarPartes_().then(pintar);
  }
};
function _bloquePuedeDecidirE_(){ return rangoNom(ACTOR)>=3 || (typeof esAdmin==='function' && esAdmin()); }
function _bloqueTituloE_(id){
  var r=(REUS||[]).filter(function(x){ return String(x.id)===String(id); })[0]; return r && (r.titulo||r.tit);
}
function _bloqueColaPanelE_(lista){
  var g=_bloqueGrupos_(lista).grupos;
  if(!g.length) return '';
  var dec=_bloquePuedeDecidirE_();
  return pan('Partes de bloque', g.length+(g.length===1?' bloque':' bloques'),
    '<div class="pb">'+_bloqueColaHTML_(g, {decide:dec, horas:function(p){ return p.horas; },
      nombre:function(p){ return _m(p.autor).pila||p.autor; }, titulo:_bloqueTituloE_})+'</div>', 'destaca');
}
function _bloqueReuPanelE_(){
  if(!(REUS||[]).length) return '';
  var r=_reuSelE_();
  var puede=_puedeBloqueReu_(r, _actorSanc_(), (typeof esAdmin==='function' && esAdmin()));
  var abierto=!!(BLQ && BLQ.donde===vista);
  if(!puede && !abierto) return '';
  return pan('Parte de bloque', r.en_curso?'<span class="chip wa">en curso</span>':esc(r.titulo||r.tit||''),
    '<div class="pb">'+(abierto?_bloqueFormHTML_():_bloqueReuHTML_(r, puede))+'</div>');
}
function _bloqueManualPanelE_(){
  if(rangoNom(ACTOR)<1) return '';
  var abierto=!!(BLQ && BLQ.donde===vista);
  return pan('Declarar parte de bloque','varias personas, un mismo horario',
    '<div class="pb">'+(abierto?_bloqueFormHTML_():
      '<button class="btn pri" data-bloqueman>Declarar parte de bloque</button>'+
      '<p class="mini" style="margin:8px 0 0;color:var(--ink3)">Se crea un parte pendiente por participante; lo decide el PD de una vez.</p>')+'</div>');
}
function _engBloqueE_(){
  _bloqueColaCablear_(_bloqueCbE_);
  if(BLQ && BLQ.donde===vista) _bloqueCablear_(_bloqueCbE_);
  _bloqueReuCablear_(_reuSelE_, _bloqueCbE_);
  $$('[data-bloqueman]').forEach(function(b){ b.onclick=function(){
    var h=new Date();
    _bloqueAbrir_({modo:'declarar', fecha:h.getFullYear()+'-'+pad(h.getMonth()+1)+'-'+pad(h.getDate()), parts:[]});
    _bloqueCbE_.abrir(); }; });
}
