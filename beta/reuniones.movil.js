/* ═══ REUNIONES · cara movil ═══════════════════════════════════════════════════════════
   30 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* límite de una reunión en DD/MM (del dato, no cableado). */
function _limM_(R){ var l=R&&R.limite; if(!l) return 'sin límite'; l=String(l).slice(0,10); return _isoADMY_(l); }

/* ⛔ EL PLAZO EN PALABRAS, Y CON SU URGENCIA. `_limM_` da la fecha pelada
   («cierra el 20/08/2026») y deja la cuenta a quien mira: si es hoy, si es mañana o si ya
   pasó, lo tiene que deducir la persona restando en la cabeza. Y ese plazo **es justo lo que
   mira el motor de sanciones** — lo dice `_pendientesCubrirM_` tres lineas mas abajo. Un dato
   que decide **puntos** no se enseña como un numero que hay que restar.
   ⚠️ NO dice que se puede o no hacer despues («ya no puedes cubrir»): eso lo decide el gate,
   no la pantalla. Dice **cuando cerro**, que es lo que consta.
   ⚠️ Y el corte de «pronto» son 3 dias a proposito: con una semana, media lista saldria en
   rojo siempre y el aviso dejaria de significar nada. */
function _plazoTxtM_(r){
  /* ⛔ UN ADAPTADOR, NO UNA COPIA. El texto lo decide `_plazoTxt_` en `comun.js`, que usan las
     dos caras; aquí solo se saca el campo de la reunión. Cuando esto era una función entera, el
     escritorio enseñaba la fecha cruda porque su cara no la tenía. */
  return _plazoTxt_(r && r.limite);
}

function _msDeDDMM_(dd, base){
  var m=/^\s*(\d{1,2})\/(\d{1,2})/.exec(String(dd||''));
  if(!m) return null;
  var t=new Date(base.getFullYear(), (+m[2])-1, +m[1]).getTime();
  if(t < base.getTime()-182*_MSDIA_) t=new Date(base.getFullYear()+1, (+m[2])-1, +m[1]).getTime();
  return t;
}

/* Cuando OCURRE: la fijada, su dia fijado; la que no, su primer dia ofertado que no
   haya pasado. No es el limite para responder -eso es otra cosa y se dice aparte-. */
function _cuandoReuM_(r){
  var base=_hoyDateM_(), dias=(r&&r.dias)||[];
  if(r && r.fijada && (r.fijadaBl||[]).length){
    var t=_msDeDDMM_(dias[r.fijadaBl[0][0]], base);
    if(t!=null) return { ms:t, fijada:true };
  }
  var ts=dias.map(function(d){ return _msDeDDMM_(d, base); })
             .filter(function(x){ return x!=null; });
  if(!ts.length) return { ms:Infinity, fijada:!!(r&&r.fijada) };   // sin fechas legibles: al final
  var fut=ts.filter(function(t){ return t>=base.getTime(); });
  return { ms: fut.length ? Math.min.apply(null,fut) : Math.max.apply(null,ts),
           fijada: !!(r&&r.fijada) };
}

/* Lo que te falta cubrir, ordenado por lo que CADUCA ANTES. El plazo es lo que mira el
   motor de sanciones, asi que es lo que manda en el aviso -no la fecha de la reunion-. */
function _limMsM_(r){
  var l=r&&r.limite; if(!l) return Infinity;
  var t=Date.parse(String(l).slice(0,10)); return isNaN(t)?Infinity:t;
}

function _pendientesCubrirM_(){
  return (REUNIONES_M||[]).filter(function(r){
    /* ⛔ 20/10 (auditoría): Y CON EL PLAZO ABIERTO. Sin fijar y con el plazo ya cerrado, la ficha dice «Ya no se puede
       cubrir» y esto la seguía contando —la primera del aviso y el globo en rojo hasta que alguien la fijara—. */
    return r && (!r.cubierta || r.bajoMin) && !r.exento && !r.fijada &&   // fijada = el plazo ya se cerro; bajoMin: 🔴 1 (auditor 21)
      r.invitado!==false &&       // 11/11 (reumovil): sin convocatoria, no se te reclama
      !_reuFinalizada_(r) &&      // 04/11: lo celebrado ya no pende
      !(typeof _plazoAbierto_==='function' && !_plazoAbierto_(r.limite));
  }).sort(function(a,b){ return _limMsM_(a)-_limMsM_(b); });
}

function _diaTxtM_(d){
  var t=String(d==null?'':d).trim();
  var m=/(\d{1,2})\s*\/\s*(\d{1,2})/.exec(t);
  if(!m) return t;                                   // sin mes: no se le inventa uno
  var ms=_msDeDDMM_(m[1]+'/'+m[2], _hoyDateM_());
  return (ms!=null ? _DIAS3_[new Date(ms).getDay()]+' ' : '')+pad(+m[1])+'/'+pad(+m[2]);
}

/* La etiqueta de una reunion ya fijada se guardo con el formato de entonces. Se reescribe
   solo su parte de DIA y se deja la hora intacta. */
function _fijadaTxtM_(f){
  var t=String(f||''); if(!t) return t;
  var i=t.indexOf(' · ');
  return i<0 ? _diaTxtM_(t) : (_diaTxtM_(t.slice(0,i))+t.slice(i));
}

/* QUIEN LA CONVOCO (o el admin), no cualquier coordinador: es lo que exige el backend,
   y el boton tiene que decir la verdad.
   ⛔ Y VALE PARA LAS TRES ACCIONES DE LA FICHA, no solo para borrar. `Codigo.gs` las
   gatea con la MISMA linea en las tres: `_borrarReunion_` (:4685), `_editarReunion_`
   (:4707, que es el orden del dia) y `_fijarReunion_` (:4731). Se llama «Borrar» por
   donde nacio; lo que decide es «¿puedes ADMINISTRAR esta reunion?».
   ⚠️ Si algun dia una de las tres deja de compartir la regla, esto pasa a ser DOS
   preguntas y hay que partirlo -- una sola puerta para dos contratos distintos es peor
   que dos puertas. */
function _puedeBorrarReuM_(r){
  if(!r) return false;
  if(typeof esAdmin==='function' && esAdmin()) return true;
  /* ⛔ `_actorSanc_()`, NO `YO.nombre`: con sesion real la identidad que manda
     es la de la SESION, y `YO` es el selector de demo. Con `YO.nombre` aqui,
     cualquiera con sesion podia borrar la reunion de otro cambiando de persona
     en la pantalla. Es la misma familia que `_convMias_` y `_misCeldas_`, y la
     funcion de «quien soy de verdad» ya existia. */
  var _yo = (typeof _actorSanc_==='function') ? _actorSanc_() : (YO && YO.nombre);
  return !!(_yo && r.convocante && String(_yo)===String(r.convocante));
}

function _proximaReuM_(){
  /* 04/11: una FINALIZADA no es «la próxima» ni «la última»: Estado no enseña lo que su convocante ya dio por celebrado. */
  /* 11/11: ni una PASADA (franja fijada ya acabada, aunque nadie la finalizara): va al cajón «Pasadas» y no es lo que se elige al abrir. */
  /* 11/11 (reumovil): «tu próxima» es de las tuyas, no de las que sólo ves. `!==false`: sin el campo (maquetas), cuenta como tuya. */
  var L=(REUNIONES_M||[]).filter(function(r){ return r.invitado!==false && !_reuArchivada_(r); }); if(!L.length) return null;
  var hoy=_hoyDateM_().getTime();
  var con=L.map(function(r){ var c=_cuandoReuM_(r);
    return { r:r, ms:c.ms, fij:c.fijada, pasada:(c.ms<hoy) }; });
  con.sort(function(a,b){
    if(a.pasada!==b.pasada) return a.pasada?1:-1;   // lo que ya ocurrió, al final
    if(a.ms!==b.ms) return a.ms-b.ms;               // antes en el tiempo, antes en la lista
    if(a.fij!==b.fij) return a.fij?-1:1;            // a igualdad, manda la que tiene fecha
    return 0;
  });
  return con[0].r;
}

/* ---- HORAS: una sola familia. Habia CINCO parsers de 'HH:MM' repartidos por este
   fichero, con tres unidades de salida distintas y dos que reventaban si les llegaba un
   string en vez de un {ini}. Se unificaron en `_minHM_`... pero POR CARA, asi que quedaron
   dos copias identicas. Desde el 07/08 vive en `comun.js`, que cargan las dos. ---- */

/* ⛔ `_firmaResp_` VIVE EN `comun.js` (08/08), que cargan las dos caras. Estaba aqui
   cuando solo el movil refrescaba la reunion abierta; al darle ese refresco tambien al
   escritorio, copiarla habria sido crear otra gemela. */

async function _refrescarReuAbierta_(){
  if(typeof backendOK==='undefined' || !backendOK || !SESION) return;
  if(_REFREU_ || document.hidden) return;
  if(ST.vista!=='reu') return;                 // solo lo que tienes delante
  if(_modalAbierto_()) return;                 // no se cambia la rejilla mientras pintas
  var R=REUNION; if(!R || R.id==null) return;
  _REFREU_=true;
  try{
    var d=await api.getReunion(R.id);
    var resp=(d && (d.respuestas || (d.reunion && d.reunion.resp))) || null;
    if(!resp) return;
    var base=(d && d.reunion) || {};
    var nuevo=_normReuM_(_fuenteReuM_(R, base, resp, d && d.agregado));
    nuevo._hidratada=true;
    /* Si nadie ha contestado nada nuevo, NO se repinta: reconstruir la pantalla cada 20 s
       para dejarla igual se nota, y molesta. */
    if(_firmaResp_(nuevo)===_firmaResp_(R)) return;
    var i=REUNIONES_M.indexOf(R); if(i>=0) REUNIONES_M[i]=nuevo;
    REUNION=nuevo;
    if(ST.vista==='reu' && !_modalAbierto_()) _repintarSuave_();
  }catch(_){ } finally { _REFREU_=false; }
}

/* OJO: solo es «no tienes reuniones» si YA llegaron. Mientras se cargan hay que decir que
   se estan cargando, o alguien puede creer que no le toca cubrir nada y no cubrir. */
function _sinReuniones_(){ return !!(typeof backendOK!=='undefined' && backendOK && SESION && CARGA.reuniones && !REUNIONES_M.length); }

function _reunionesCargando_(){ return !!(typeof backendOK!=='undefined' && backendOK && SESION && !CARGA.reuniones); }


function _normReuM_(r){
  var dias=r.dias||[], F=r.franjas||[], bl=r.bloques||[], resp=r.resp||{};
  /* null = bloque NO OFERTADO (con horario por día no todas las franjas existen todos los
     días). app.html lo resolvía con un Set `oferta`; aquí la matriz nace a null y solo los
     bloques realmente ofertados pasan a 0. Así un hueco muerto no se pinta como «nadie puede».
     `pond` es la vista PONDERADA: suma los valores (presencial+telemático=2, telemático=1);
     `calor` cuenta PERSONAS (cualquier valor > 0). */
  /* Los bloques de la franja fijada pueden venir de DOS sitios: dentro de `fijada` cuando
     el backend manda el objeto {label,bloques,franjas}, o sueltos en `fijadaBl` cuando lo
     que se re-normaliza es una reunion que YA paso por aqui (al salir, `fijada` se aplana
     a la etiqueta). Mirar solo el objeto hacia que hidratar borrase el verde del mapa. */
  var _fijPrev=(r.fijada && typeof r.fijada==='object') ? (r.fijada.bloques||[])
             : (Array.isArray(r.fijadaBl) ? r.fijadaBl : []);
  var _ord=_ordenarFranjas_({franjas:F, bloques:bl, fijadaBl:_fijPrev});
  F=_ord.franjas; bl=_ord.bloques; _fijPrev=_ord.fijadaBl;
  /* 21/10 (auditor 13, 🟡 11): la permutación hasta los índices ORIGINALES, COMPUESTA con la que ya traía (aquí se
     re-normaliza lo ya normalizado, y entonces `_ord.orig` es la identidad). Fijar la usa para hablar con el servidor. */
  var _o0=Array.isArray(r._franjaOrig) ? r._franjaOrig : null;
  var _forig=(_ord.orig||[]).map(function(i){ return (_o0 && _o0[i]!==undefined) ? _o0[i] : i; });
  var calor=_calorDe_({dias:dias, franjas:F, bloques:bl, resp:resp}, false);
  var pond =_calorDe_({dias:dias, franjas:F, bloques:bl, resp:resp}, true);
  /* `fijada` viene del backend como OBJETO con los indices ({fecha,franjas,bloques,label}).
     Antes se colapsaba a la etiqueta y se perdian los indices, asi que el mapa no podia
     pintar el hueco elegido en verde aunque el aviso lo prometiera. */
  var fijO=r.fijada, fijBl=_fijPrev.slice();
  var fij=fijO; if(fij && typeof fij==='object') fij=fij.label||fij.iso||null;
  return { id:r.id, titulo:r.titulo||'Reunión sin título', tipo:r.tipo||'general',
    /* ⛔ `creado` y `fecha` son el 1.º y el 3.º eslabón de la cadena con la que se elige el
       porcentaje del periodo (`_refMinimo_`, `comun.js`). Esta lista es BLANCA: lo que no
       esté aquí se pierde en la puerta, y eso dejaba el mínimo del teléfono decidido por
       una cadena distinta a la del motor. */
    modalidad:r.modalidad||'hibrida', limite:r.limite||null, fijada:fij||null, fijadaBl:fijBl,
    fecha:r.fecha||null, creado:r.creado||null,
    convocante:r.convocante||'', dias:dias, franjas:F, bloques:bl, resp:resp, _franjaOrig:_forig,
    /* ⛔ Se LEE y se conserva: el cable entre las dos funciones lo vigila `probar_reunion_movil.py`
       comparando lo que esta lee con lo que `_fuenteReuM_` entrega. Un campo que una lee y la
       otra no entrega es el fallo que ya paso CUATRO veces en este mismo objeto. */
    agregado: r.agregado !== false,
    /* El backend lo manda (`_ex.ordenDia`) y aqui se tiraba, asi que el dialogo salia
       siempre vacio y no habia forma de corregir un enlace mal pegado. */
    ordenDia:r.ordenDia||'',
    controlAsistencia:(typeof r.controlAsistencia==='boolean') ? r.controlAsistencia : undefined,   /* 12/11: sin la clave, la de antes de la opción */
    minimoPct:(typeof r.minimoPct==='number') ? r.minimoPct : null,   /* 01/11: el mínimo que eligió quien convocó; sin él, el del periodo */
    /* `slot` es la casilla que se pinta y `duracion` lo que hay que juntar seguido.
       Las reuniones de antes de este modelo no traen `duracion`: entonces el minimo es
       una casilla y todo se comporta como se comportaba. */
    slot: +r.slot || (F[0] && +F[0].dur) || 60, duracion: +r.duracion || 0,
    calor:calor, pond:pond, nInv:(r.invitados||[]).length,
    /* ⛔ LOS NOMBRES, no solo cuantos (817.a). Sin ellos no se pueden editar los convocados, y
       `_fuenteReuM_` devolvia `new Array(nInv)` -un array con HUECOS-: al hidratar, `invitado`
       (abajo) daba `false` a todos menos al convocante, porque `indexOf` no encuentra a nadie
       en un array sin nombres. Hoy `invitado` solo se lee al cargar la lista, asi que no mordia;
       pero era una trampa armada. Lista blanca: lo que no se nombra aqui se pierde. */
    invitados: Array.isArray(r.invitados) ? r.invitados.slice() : [],
    /* nResp = la cuenta del SERVIDOR (`_listar_`). `_nRespReu_` la necesita para no decir
       'nadie' sobre una reunion sin hidratar justo antes de BORRARLA. Lista blanca: lo que
       no se nombra aqui, se pierde (640.ª). */
    nResp: +r.nResp || 0,
    /* ¿ES TUYA? Antes solo se guardaba CUANTOS invitados hay, y sin los nombres nadie podia
       preguntarse «¿estoy yo?»: se le reclamaba cubrir a todo el equipo una reunion de un
       invitado. Y de no cubrir salen sanciones, asi que no es un aviso cosmetico.
       Sin lista de invitados (reuniones de antes de este modelo) se mantiene el
       comportamiento de siempre —todos—: hacerlas desaparecer de golpe seria peor. */
    invitado: (function(){
      var inv=Array.isArray(r.invitados)?r.invitados:null;
      if(!inv || !inv.length) return true;                       // sin lista: como antes
      if(!YO || !YO.nombre) return true;
      return inv.indexOf(YO.nombre)>=0 || YO.nombre===r.convocante;   // convocas = es tuya
    })(),
    cubierta: !!(YO && resp[YO.nombre] && resp[YO.nombre].some(function(x){ return +x>0; })),
    /* ⛔ 22/10 (auditor 21, 🔴 1): `cubierta` es «has marcado algo» (de ahí «Editar mi disponibilidad»), y con eso solo la
       chapa decía «cubierta» y el aviso de la portada se iba con 2 de 9 franjas — a la persona a la que el motor le encola
       la sanción (`sanciones.py`: `cubrio_minimo = voto and bloques >= minimo`), mientras el escritorio la nombraba «en
       riesgo · Art. 29i». La misma puerta que el escritorio: `_avisoMinimo_` con `_minimoExigido_` (y el tipo, que ya
       calla en las reuniones que no sancionan solas). */
    bajoMin: (function(){
      if(!YO || !resp[YO.nombre]) return false;
      var n = resp[YO.nombre].filter(function(x){ return +x>0; }).length;
      if(!n) return false;   /* sin `typeof` de respaldo: `comun.js` va siempre, y un respaldo callaba el aviso (probar_cobertura) */
      /* 22/10 (refutador, 🟠 5): SIN el tipo. En subsistema/mixta/trabajo el escritorio la lista igual («por debajo del
         mínimo · potestad del coordinador»); con el tipo, el móvil decía «cubierta» a esa misma persona. */
      return _avisoMinimo_(n, _minimoExigido_(r)).falta > 0;
    })(),
    exento: !!(YO && r.convocante && YO.nombre===r.convocante),   // quien convoca ORGANIZA: no cubre su propia encuesta
    /* 26/10 (triaje A4d): te convocaron con el plazo YA VENCIDO: no se te sanciona por no cubrirla */
    tarde: !!(YO && Array.isArray(r.invitados_tarde) && r.invitados_tarde.indexOf(YO.nombre)>=0),
    invitados_tarde: Array.isArray(r.invitados_tarde) ? r.invitados_tarde.slice() : [],   /* para re-hidratar */
    en_curso: (r.en_curso && typeof r.en_curso==='object') ? r.en_curso : null,   /* 29/10: la pone `empezarReunion`; la ficha enseña el cronómetro */
    bloque: r.bloque||null,   /* 01/11: el bloque que ya fichó la reunión (apaga «ya ha pasado: ficha el bloque») */
    finalizada_at: r.finalizada_at||null, celebrada: !!r.celebrada,   /* 04/11: la dio por celebrada su convocante (sale de Estado; al mes, al Archivo) · no se borra */
    _real:true };
}

/* 🔴 UNA SOLA FUENTE POR HIDRATACION. Aqui estaba el «la fecha fijada sale roja».

   Las dos hidrataciones hacian esto: coger `R.franjas` -que YA estan ordenadas por hora y
   con los indices remapeados- y juntarlas con `base.fijada`, cuyos `bloques` traen los
   indices ORIGINALES del servidor. Mezclar los dos espacios apunta a otra franja: la
   General llego de Xoyondo como 18,19,20,21,22,10,11...17, asi que el indice 4 deja de ser
   las 22:00 y pasa a ser las 14:00. Y como las 14:00 de ese dia no se ofertaban, la celda
   se funde con todo el bloque rayado de la mañana y el verde no se pinta EN NINGUN SITIO:
   solo se ve verde si el tramo entero cae dentro del rango fijado.

   La regla: o todo del servidor, o todo de lo que ya teniamos. Nunca la mitad de cada. */
function _fuenteReuM_(R, base, resp, ag){
  var delServidor = base && Array.isArray(base.franjas) && base.franjas.length && Array.isArray(base.bloques);
  var s = delServidor ? base : R;
  return { id:R.id, titulo:R.titulo, tipo:R.tipo, modalidad:R.modalidad,
    /* ⚠️ Y AQUI TAMBIEN, que es la gemela: un campo que `_normReuM_` lee y esta no entrega
       es el fallo que ya paso CUATRO veces en este mismo objeto. */
    fecha:R.fecha, creado:R.creado,
    limite:R.limite, convocante:R.convocante, slot:R.slot, duracion:R.duracion,
    /* ⛔ Los NOMBRES si los hay (817.a); `new Array(nInv)` solo para una reunion que llego sin ellos. */
    invitados:(Array.isArray(R.invitados) && R.invitados.length) ? R.invitados.slice() : new Array(R.nInv),
    invitados_tarde:Array.isArray(R.invitados_tarde) ? R.invitados_tarde.slice() : [],   /* 26/10 (A4d) */
    resp:resp, nResp:R.nResp,
    /* 21/10 (auditor 13, 🟡 11): la permutación hasta los índices ORIGINALES sólo vale si se re-normaliza LO YA
       NORMALIZADO (`R`); con las franjas del servidor (`base`, en su orden original) se calcula de cero. */
    _franjaOrig: delServidor ? null : R._franjaOrig,
    /* ⛔ `agregado` LO DECIDE EL SERVIDOR Y AQUI SOLO SE ARRASTRA. Volver a aplicar la regla
       («¿es oculta? ¿convoco yo?») serian DOS criterios para la misma pregunta, y acaban
       siendo dos preguntas distintas. Y deducirlo de «no me han llegado filas» tampoco vale:
       eso no distingue `oculta` de «todavia no ha contestado nadie».
       ⚠️ `ag == null` es un backend VIEJO que no manda el campo -- no es un «no»: se mantiene
       el comportamiento de siempre en vez de esconderle el mapa a todo el equipo de golpe. */
    agregado: (ag == null ? (R.agregado !== false) : ag !== false),
    /* ⛔ `ordenDia` VA AQUI, Y ES LA CUARTA VEZ QUE UN NORMALIZADOR TIRA UN DATO QUE SI
       VENIA. `_normReuM_` lo rescata (lo dice su comentario), pero quien lo alimenta es
       ESTA funcion, que arma un objeto explicito de 15 campos y no lo nombraba: no habia
       ni un instante en que `ordenDia` sobreviviera en el movil.
       ⛔ El dano no era solo que el dialogo saliera vacio: `movil.html` pinta el campo con
       `R2.ordenDia||''` y esconde el boton de quitar, asi que al pulsar **Guardar** con el
       campo vacio se llamaba `setOrdenDia(id, '')` y **se borraba el enlace real para todo
       el equipo**. Una pantalla que afirma que no hay orden del dia y te deja confirmarlo.
       ⚠️ La leccion ya estaba escrita en `movil.html` («normalizar es tirar lo que no
       nombras», con `origen` y este mismo `ordenDia` en la lista). Se aplico donde se
       enuncio y no donde se citaba (§3c-19). Por eso la comprobacion de su banco es
       ESTRUCTURAL: compara lo que `_normReuM_` LEE con lo que esta ENTREGA. */
    ordenDia:R.ordenDia,
    controlAsistencia:R.controlAsistencia,   /* 12/11: la gemela de la lectura de `_normReuM_` */
    minimoPct:R.minimoPct,   /* 01/11: el mínimo que eligió quien convocó (la gemela de la lectura de `_normReuM_`) */
    bloque:R.bloque,       /* 01/11: la gemela de `en_curso` en `_normReuM_` */
    finalizada_at:R.finalizada_at, celebrada:R.celebrada,   /* 04/11: la gemela de la lectura de `_normReuM_` */
    en_curso:R.en_curso,   /* 29/10: sin esto el cronómetro de la ficha se perdía al rehidratar (lo cazó `probar_reunion_movil`) */
    dias:s.dias||R.dias, franjas:s.franjas||R.franjas, bloques:s.bloques||R.bloques,
    /* Del servidor viene el objeto `fijada` con sus indices; de lo nuestro, la etiqueta ya
       aplanada mas `fijadaBl` YA remapeado. Cada camino, entero. */
    fijada: delServidor ? base.fijada : R.fijada,
    fijadaBl: delServidor ? [] : R.fijadaBl };
}

async function _hidratarReuM_(r){
  if(!r || r._hidratada) return r;
  try{ var d=await api.getReunion(r.id);
    var resp=(d && (d.respuestas || (d.reunion && d.reunion.resp))) || null;
    if(resp){ var base=(d && d.reunion) || {};
      /* `base.fijada` es el objeto del backend cuando lo hay; `r.fijada` ya es la etiqueta
         aplanada, asi que hay que arrastrar `fijadaBl` aparte o se pierde el verde. */
      var nuevo=_normReuM_(_fuenteReuM_(r, base, resp, d && d.agregado));
      nuevo._hidratada=true;
      var i=REUNIONES_M.indexOf(r); if(i>=0) REUNIONES_M[i]=nuevo;
      if(REUNION===r) REUNION=nuevo;
      return nuevo; }
  }catch(e){}
  r._hidratada=true; return r;
}

/* `yaPedidas`: una promesa de `listarReuniones` lanzada antes. La PETICION no necesita saber
   quien eres -el backend te identifica por el token-, pero NORMALIZARLA si (`_normReuM_`
   mira `YO.nombre` para saber que has contestado tu). Separarlas deja que la peticion vuele
   en paralelo con el `bootstrap` y solo el normalizado espere. Sin argumento, pide ella
   misma: asi la sigue usando el refresco en vivo sin enterarse. */
async function _cargarReunionesM_(yaPedidas){
  try{ var arr=await (yaPedidas || api.listarReuniones());
    /* ⛔ LA BANDERA, SOLO SI DE VERDAD LLEGO LA LISTA. Estaba justo detras del
       `await` y DELANTE de comprobar el array, asi que un fallo la ponia igual. Y
       en el arranque el fallo ni siquiera lanza: `movil.html` pasa la promesa ya
       blindada con `.catch(function(){ return null; })`, o sea que llega `null`,
       `Array.isArray(null)` es falso y te quedabas con la bandera puesta y la lista
       vacia. Resultado en pantalla: «Ninguna reunion convocada · Ahora mismo no
       estas convocado a ninguna reunion» — justo lo que el comentario de
       `_sinReuniones_` prohibe, porque de no cubrir salen SANCIONES.
       ⚠️ Y la condicion de la bandera NO lleva `.length`: una lista VACIA es una
       respuesta buena -de verdad no tienes ninguna- y tiene que apagar el
       «Cargando…». Lo que no vale es que no haya lista. */
    if(!Array.isArray(arr)) return false;
    CARGA.reuniones=true;
    _asisDeListaM_(arr);       // 31/10: ¿alguna general tuya con la asistencia abierta? (sin esperar: la tarjeta se pinta sola)
    if(arr.length){
      /* SE CONSERVA LA QUE ESTABAS MIRANDO. Esta funcion tambien la llama el refresco en
         vivo cada 90 s: sin esto, estarias viendo una reunion y de pronto te saltaria a otra
         sola. Solo se elige la «proxima» cuando no habia ninguna abierta o ya no existe. */
      var _antes=(REUNION && REUNION.id)||null;
      /* Se filtra AQUI y no en cada pantalla: la lista, el globo del nav, «lo que caduca
         antes» y «tu proxima reunion» leen todos de `REUNIONES_M`, asi que repetir la
         condicion en cuatro sitios es garantizar que un dia se desincronicen.
         En el ESCRITORIO no se filtra: alli se ven todas a proposito.
         11/11 (reumovil): y AQUI tampoco se filtra por `invitado`. Quien decide que ves es el SERVIDOR (`puede_ver_reunion`: tu
         subsistema, la junta…): lo que llega es lo que estas autorizado a ver. `invitado` solo separa «Mis reuniones» de «Otras que
         puedes ver» y decide si se te pide cubrir (`_pendientesCubrirM_`, `_proximaReuM_`, la ficha). */
      REUNIONES_M=arr.map(_normReuM_);
      var mia=null;
      if(_antes!=null) mia=REUNIONES_M.filter(function(x){ return x.id===_antes; })[0]||null;
      /* Antes: la primera SIN FIJAR en orden de creacion. Ni miraba fechas, ni tenia
         sentido descartar las fijadas -son las que mas seguro ocurren-. */
      if(!mia) mia=_proximaReuM_()||REUNIONES_M[0];
      if(mia){ REUNION=mia; await _hidratarReuM_(mia); }
      /* Y LAS DEMAS TAMBIEN, en paralelo y sin bloquear: antes solo se hidrataba la
         «proxima» y el resto al abrirlas, de ahi el «aun me la tiene que cargar». Suelen
         ser una o dos. Si alguna falla, las demas siguen. */
      var _resto=REUNIONES_M.filter(function(x){ return x!==mia && !x._hidratada; });
      if(_resto.length){
        Promise.all(_resto.map(function(x){ return _hidratarReuM_(x).catch(function(){}); }))
          .then(function(){
            /* SOLO si estas mirando reuniones. Esto hidrata los mapas de calor del resto de
               la lista; si estas en Estado no cambia nada de lo que ves, y sin embargo era
               una SEGUNDA pintada del arranque —medida— que volvia a animar las barras.
               Daniel: «la barra sigue arrancando desde 0 2 o 3 veces al iniciar sesion». */
            if(ST.vista==='reu' && typeof _repintarSuave_==='function') _repintarSuave_();
          });
      }
    }
    return true;
  }catch(e){}
  return false;
}

function _proxReuHTML_(){
  var R=_proximaReuM_();
  if(_reunionesCargando_())
    return '<h2 class="sec">Próxima reunión<span class="ln"></span></h2>'+
      '<div class="tarj"><p class="rnota" style="margin:0;padding:6px 0">Cargando tus reuniones…</p></div>';
  if(_sinReuniones_() || !R)
    return '<h2 class="sec">Próxima reunión<span class="ln"></span></h2>'+
      '<div class="tarj">'+vacio('Ninguna reunión convocada','','',false)+'</div>';
  var c=_cuandoReuM_(R), pasada=(c.ms<_hoyDateM_().getTime());
  /* Si lo único que queda ya ocurrió, se dice: llamar «próxima» a algo de la semana
     pasada es exactamente el tipo de mentira pequeña que hace desconfiar del resto. */
  var rotulo = pasada ? 'Última reunión' : 'Próxima reunión';
  /* ⛔ EL MISMO PLAZO Y CON LAS MISMAS PALABRAS que en Reuniones: dos sitios que dicen lo
     mismo de dos formas distintas se leen como dos cosas distintas. */
  var cuando = R.fijada ? esc(R.fijada)
    : ((R.dias&&R.dias.length) ? ('sin fecha fija · '+esc(_plazoTxtM_(R)))
                               : esc(_plazoTxtM_(R)));
  return '<h2 class="sec">'+rotulo+'<span class="ln"></span></h2>'+
    '<div class="tarj clic" data-ir="reu" data-reuid="'+esc(String(R.id))+'" data-p>'+
    '<div class="fila" style="padding-top:0"><div class="a"><b>'+esc(R.titulo)+'</b>'+
    '<small>'+cuando+' · '+esc(_modalidadTxt_(R.modalidad).toUpperCase())+'</small></div>'+
    '<div class="d"><span class="pil '+((R.fijada||(R.cubierta&&!R.bajoMin)||R.exento||R.tarde)?'conf':'pend')+'">'+
      (R.fijada?'fijada':(R.exento?'organizas':R.tarde?'convocado tarde':(R.bajoMin?'bajo el mínimo':(R.cubierta?'cubierta':'te falta'))))+'</span></div></div></div>';
}

/* ⛔ CUANTO DURA LA REUNION, EN UNA SOLA FORMA. Hasta el 09/08 el dato existia (`duracion`)
   y **no se enseñaba en ninguna parte** hasta abrir el modal de marcar: un miembro veia
   «cierra el 12 · 18 convocados» sin saber si eran 30 min o dos horas, que es justo lo que
   decide si le cuadra. Es la misma leccion que el fallo del escritorio de esta noche: **el
   minimo tiene que VERSE, no solo cumplirse**.
   ⚠️ Devuelve **cadena vacia** si la reunion no trae `duracion` — las de antes de este modelo
   no la tienen, y ahí inventar «1 h» seria peor que callar. */
/* ¿Hay que ESCONDER el agregado de esta reunión? Lo decide el servidor y esto solo lo lee.
   ⛔ VIVE FUERA DE `vReu` A PROPÓSITO: dentro son doscientas líneas de HTML que no ejecuta
   ningún banco, así que una mutación sobre la condición habría salido CIEGA por no haber nada
   que llamar — no por falta de caso. Mismo patrón que `_avisoMesDelBloque_`: decide y
   devuelve; la pantalla redacta.
   ⛔ Y `=== false` Y NO `!R.agregado`: una reunión de un backend viejo llega SIN el campo, y
   `undefined` ahí significa «no lo sé», no «no» (§3c-24). Con `!R.agregado` el mapa se le
   apagaría a las 33 personas el día que el backend vaya por detrás del `.html`. */
function _sinAgregadoM_(R){ return !!R && R.agregado === false; }

/* 22/10 (auditor 23, 🟠 8): el NÚMERO de convocados que se enseña, sin quien ya está de baja (`_invitadosVivos_`).
   `nInv` no se toca: es la cuenta del servidor y `#btnInvitados` la usa para saber si tiene la lista entera. Sin los
   nombres (o con huecos), el número del servidor tal cual. */
function _nConvM_(x){
  var l = (x && Array.isArray(x.invitados)) ? x.invitados : [];
  if(!l.length || l.length !== x.nInv || l.some(function(n){ return !n; })) return x ? x.nInv : 0;
  return _invitadosVivos_(l).length;
}
function _duraTxtM_(r){
  var d = +(r && r.duracion) || 0;
  return d > 0 ? ' \u00b7 dura ' + _durTxt_(d) : '';
}

/* ⛔⛔ EL TITULAR DEL MAPA: qué hueco recomendar, o POR QUÉ no hay ninguno. PURA, y
   sacada aquí a propósito — estaba dentro de una concatenación de veinte líneas en
   `vReu`, y por eso **no la ejecutaba ningún banco**.
   ⛔ Lo que decía mal: se caía a «todavía no ha respondido nadie» siempre que `vent.v`
   era 0, y eso pasa en DOS casos que no son silencio — han contestado y **ninguno puede
   la reunión entera**, o han contestado que **no pueden ningún día**. Quien convoca leía
   «nadie ha respondido» con tres respuestas en la hoja: o persigue a quien ya contestó, o
   fija fecha a ciegas. Es §3c-24 otra vez: **ausente ≠ votó que no**, y la cara de
   escritorio ya lo había aprendido (mete al que contestó todo a cero en `bajoMin`).
   ⚠️ `nresp` cuenta CLAVES de `resp`, que sólo se escriben al contestar: son respuestas
   de verdad, no gente convocada. */
function _titularHueco_(R, vent, nresp, pondOn){
  if(vent.v>0)
    return '<b style="color:var(--red2)">'+esc(_diaTxtM_(R.dias[vent.d]))+' '+_hFranja_(R,vent.f0)+
      (vent.f1>vent.f0?('–'+_hFinFranja_(R,vent.f1)):'')+'</b> — '+vent.v+
      (vent.exacta ? (vent.v===1?' puede la reunión entera.':' pueden la reunión entera.')
                   : (pondOn?' puntos.':' pueden.'));
  return nresp ? 'han contestado '+nresp+', y ninguno puede la reunión entera.'
               : 'todavía no ha respondido nadie.';
}

/* ⛔ 20/10 — LAS REUNIONES SIN CONVOCAR, con su acta: fecha, la etiqueta y el expediente (pulsar abre `verDoc`, por
   el `[data-doc]` que ya engancha `_engTurnosYDocs_`). Salen de los expedientes que el backend te manda: hoy los ve
   quien los firma o los revisa, y el PD. Sin ninguna, no ocupa nada. */
function _sinConvocarHTMLM_(){
  var l=_actasSinConvocar_((typeof ENTREGABLES!=='undefined'?ENTREGABLES:[]).concat(typeof ENT_REV!=='undefined'?ENT_REV:[]));
  if(!l.length) return '';
  return '<h2 class="sec">Sin convocar<span class="ln"></span>'+l.length+'</h2>'+
    '<div class="tarj">'+l.map(function(d){
      var f=String(d.fecha||'');
      return '<div class="fila clic" data-doc="'+d.id+'" data-p><div class="a"><b>'+esc(d.titulo||d.ref||'Acta')+'</b>'+
        '<small>'+(/^\d{4}-\d{2}-\d{2}/.test(f)?esc(_isoADMY_(f.slice(0,10)))+' · ':'')+'reunión sin convocar · ver su acta</small></div>'+
        '<div class="d"><span class="pil '+_pilEstDoc_(d.estado)+'">'+esc(estDoc(d.estado)[0])+'</span> <span class="chev">›</span></div></div>';
    }).join('')+'</div>';
}

/* 04/11 · «MIS REUNIONES»: las vivas y, debajo, el cajón plegable «Pasadas» (11/11: finalizadas o ya celebradas; antes, «Archivo» al mes) con
   las que ya pasaron (`_reuPartir_`, `comun.js`). `data-reu` lleva el índice en `REUNIONES_M`, no en esta mitad. Si la que
   miras está en el archivo, el cajón sale abierto: no se esconde lo que tienes delante. */
function _listaReusM_(R){
  var par=_reuPartir_(REUNIONES_M);
  /* 11/11 (reumovil): las vivas se parten en las TUYAS (convocado o convocante) y «Otras que puedes ver» (las de tu nivel sin
     estar convocado): plegado por defecto, como «Pasadas». Las pasadas siguen todas en su cajón. */
  var mias=par.vivas.filter(function(x){ return x.invitado!==false; }), otras=par.vivas.filter(function(x){ return x.invitado===false; });
  var fila=function(x){
          var sel=(x.id===R.id), i=REUNIONES_M.indexOf(x);
          return '<div class="fila clic" data-reu="'+i+'" data-p'+(sel?' style="background:rgba(228,30,37,.07)"':'')+'>'+
            '<div class="a"><b>'+esc(x.titulo)+'</b><small>'+esc(x.tipo)+' · '+
            (x.fijada?'📌 '+esc(_fijadaTxtM_(x.fijada)):esc(_plazoTxtM_(x)))+' · '+_nConvM_(x)+' convocados'+
            _duraTxtM_(x)+'</small></div>'+
            '<div class="d">'+(sel?'<span class="pil conf">viendo</span>':(_reuFinalizada_(x)?'<span class="pil">finalizada</span>':'<span class="chev">›</span>'))+'</div></div>'; };
  var abierto=par.archivo.indexOf(R)>=0, abiertoO=otras.indexOf(R)>=0;
  return (mias.length ? '<div class="tarj">'+mias.map(fila).join('')+'</div>' : '')+
    (otras.length
      ? '<div class="cajon'+(abiertoO?' ab':'')+'" data-caj data-p><span>Otras que puedes ver <b>· '+otras.length+'</b></span>'+
        '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div>'+
        '<div class="cajsec'+(abiertoO?' on':'')+'"><div class="tarj">'+otras.map(fila).join('')+'</div></div>'
      : '')+
    (par.archivo.length
      ? '<div class="cajon'+(abierto?' ab':'')+'" data-caj data-p><span>Pasadas <b>· '+par.archivo.length+'</b></span>'+
        '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div>'+
        '<div class="cajsec'+(abierto?' on':'')+'"><div class="tarj">'+par.archivo.map(fila).join('')+'</div></div>'
      : '');
}

function vReu(){
  if(_reunionesCargando_())
    return '<div class="h1">Reuniones</div><p class="h1s">Tus reuniones y encuestas de disponibilidad.</p>'+
      '<div class="tarj"><p class="rnota" style="margin:0;padding:6px 0">Cargando tus reuniones…</p></div>';
  if(_sinReuniones_())
    return '<div class="h1">Reuniones</div><p class="h1s">Tus reuniones y encuestas de disponibilidad.</p>'+
      '<button class="btn pri full" data-p id="btnCrear" style="margin-bottom:11px">Convocar '+(esCoord()?'reunión':'reunión de trabajo')+'</button>'+
      _sinConvocarHTMLM_()+
      '<div class="tarj">'+vacio('Ninguna reunión convocada','Cuando te convoquen a una, saldrá aquí.','',false)+'</div>';
  var R=REUNION, nF=R.franjas.length;
  /* Vista PONDERADA (solo tiene sentido en híbridas): presencial+telemático vale 2 y
     telemático 1, así que la ponderación es literalmente la suma de los valores. En
     «personas» se cuenta a cada uno una vez. Los null (no ofertado) no entran en nada. */
  var hib=(R.modalidad==='hibrida') && !!R.pond;
  var pondOn = hib && !!ST.pond;
  var M = pondOn ? R.pond : R.calor;
  var max=0; M.forEach(function(fila){fila.forEach(function(v){ if(v!=null&&v>max)max=v; });});
  var best={d:0,f:0,v:0};
  M.forEach(function(fila,di){fila.forEach(function(v,fi){ if(v!=null&&v>best.v)best={d:di,f:fi,v:v}; });});
  /* indice rapido de los bloques fijados, para pintarlos en verde */
  /* ── LA MEJOR HORA ES UNA VENTANA, NO UNA CASILLA ──────────────────────────
     Con slots de 30 min y una reunion de 1 h, la casilla con mas gente no responde a
     nada: si a las 18:00 pueden 12 y a las 18:30 solo 2, a las 18:00 NO cabe la reunion.
     Se busca la mejor ventana de lo que dura, y se cuenta a quien puede en TODA ella:
     es una INTERSECCION de personas, no el minimo casilla a casilla. Sin respuestas
     cargadas (la lista no las trae hasta abrir la reunion) se cae a la casilla suelta,
     que es lo que habia. ───────────────────────────────────────────────────────── */
  var _slotR=+R.slot || (R.franjas[0] && +R.franjas[0].dur) || 60;
  var _minR=_slotsMin_(R.duracion, _slotR);
  /* ⛔⛔ CUANTAS PERSONAS HAN CONTESTADO, que NO es lo mismo que cuántas pueden. La clave
     de `resp` sólo se escribe al contestar (`R2.resp[_quien]=vals`), así que esto cuenta
     respuestas de verdad — incluidas las de quien contestó que **no puede ningún día**,
     que es justo la que se estaba leyendo como silencio. §3c-24: ausente ≠ votó que no. */
  var _nresp=Object.keys(R.resp||{}).length;
  /* ⚠️ El cálculo se mudó a `_mejorVentana_` (`comun.js`) el 18/08: el escritorio
     recomendaba **la casilla suelta** con más gente y hacía falta lo mismo allí. */
  /* 01/11: con orden del día de duración conocida, la ventana es de los bloques que ESE orden pide (`comun.js`). */
  var _vf=_ventanaFijar_(R, _minR, best), vent=_vf.vent;
  var _huecoM_=function(){ var f=_ventanaFijar_(R, _minR, best);
    return '<b>'+_nConvM_(R)+'</b> convocados · '+(f.vent.v>0?'mejor hueco ':'')+_titularHueco_(R, f.vent, _nresp, pondOn)+_notaOrdenHTML_(f); };
  _ordSt_(R.id).sugHTML=_huecoM_;
  /* El orden del día llega por red DESPUÉS de pintar: con él cambia el hueco recomendado, y el mapa lo resalta de nuevo (la fijada no se toca). */
  _ordSt_(R.id).sugMapa=function(){
    var v=_ventanaFijar_(R, _minR, best).vent, id=String(R.id).replace(/"/g,'');
    Array.prototype.forEach.call(document.querySelectorAll('[data-qp^="'+id+'|"]'), function(c){
      if(c.getAttribute('data-fij')) return;
      var p=c.getAttribute('data-qp').split('|'), b=_esHuecoFijar_(v, +p[1], +p[2]);
      c.style.outline=b?'1px solid var(--ink)':''; c.style.outlineOffset=b?'-1px':'';
    });
  };
  /* EJE DE TIEMPO, no de franjas. Con horarios distintos por dia la union mezcla :00 y
     :30; una columna por franja hacia que cada dia llenara una de cada dos casillas y el
     mapa pareciera un tablero. Ahora la columna es un instante y cada franja ocupa lo que
     dura, asi que la fila de cada dia sale de una pieza. */
  var _mm=_minHM_;                          // antes: parser propio, identico a este
  var _du=function(f){ return +f.dur||60; };
  /* EL VERDE, POR HORA REAL Y NO POR INDICE DE FRANJA.
     (Va AQUI y no arriba: necesita `_mm`/`_du`, que se declaran justo encima. Puesto antes,
      `vReu` reventaba entera con «_mm is not a function» y la pantalla de Reuniones no
      pintaba nada.)

     Se buscaba `fijSet[dia+'-'+franja]` contra la franja que cubre cada instante — pero esa
     rejilla solo guarda UNA franja por instante, y las reuniones de antes del modelo de slot
     traen franjas de 60 min SOLAPADAS cada 30. Resultado: la general tenia su fijada en una
     franja que nunca ganaba ningun instante y no se pintaba NADA; y la de trabajo, fijada en
     dos franjas que se pisan, salia como un solo bloque en vez del rango entero.

     Con el rango en minutos da igual cuantas franjas sean ni si se solapan: una celda va en
     verde si su tramo cae dentro. */
  var fijRango={};
  (R.fijadaBl||[]).forEach(function(b){
    var di=b[0], fi=b[1], f=R.franjas[fi]; if(!f) return;
    var a=_mm(f), z=a+_du(f), r=fijRango[di];
    fijRango[di] = r ? [Math.min(r[0],a), Math.max(r[1],z)] : [a,z];
  });
  /* Una celda esta fijada si su tramo [t, t+paso) cae dentro del rango de su dia. */
  function _esFijada_(di, t, hasta){
    var r=fijRango[di]; return !!r && t>=r[0] && hasta<=r[1];
  }
  var paso=0; R.franjas.forEach(function(f){ paso=_mcd_(paso,_mm(f)); paso=_mcd_(paso,_du(f)); });
  paso=Math.max(15, Math.min(60, paso||60));
  var t0=Math.min.apply(null, R.franjas.map(_mm));
  var t1=Math.max.apply(null, R.franjas.map(function(f){ return _mm(f)+_du(f); }));
  var eje=[]; for(var _t=t0; _t<t1; _t+=paso) eje.push(_t);
  var _hhmm=_hmMin_;                        // antes: formateador propio, identico a este
  /* para cada dia y cada instante, que franja OFERTADA lo cubre (-1 = ninguna) */
  var cubre=R.dias.map(function(_,di){
    return eje.map(function(t){
      for(var fi=0; fi<R.franjas.length; fi++){
        if(M[di][fi]==null) continue;
        var a=_mm(R.franjas[fi]);
        if(t>=a && t<a+_du(R.franjas[fi])) return fi;
      }
      return -1;
    });
  });
  /* 🗣️ Daniel: *«las horas en las FILAS, los dias en las COLUMNAS; es lo que hace
     Xoyondo y when2meet»*. Antes el eje de TIEMPO iba en `grid-template-columns` y los
     dias eran filas: en un telefono eso obliga a deslizar en horizontal para leer la
     hora, que es justo lo que no cabe.
     ⛔ Y LAS CELDAS SE COLOCAN A MANO (`grid-column`/`grid-row`), no por flujo: al girar,
     la fusion pasa de `span` de columnas a `span` de FILAS, y con el flujo implicito una
     celda que ocupa varias filas descoloca todo lo que venga detras. */
  var g='<div style="margin:0 2px"><div style="display:grid;gap:2px;grid-template-columns:28px repeat('+R.dias.length+',minmax(20px,1fr));grid-template-rows:auto repeat('+eje.length+',13px)">';
  g+='<div style="grid-column:1;grid-row:1"></div>';
  R.dias.forEach(function(d,di){
    g+='<div style="grid-column:'+(di+2)+';grid-row:1;font-family:var(--mono);'+
      'font-size:9px;color:var(--ink2);text-align:center;padding-bottom:3px">'+esc(d)+'</div>';
  });
  /* ⛔ 19/10: y A CABALLO de ese límite, no debajo (Daniel, 14/10: «justo en el medio de dos slots»):
     media línea más medio `gap` (2 px) hacia arriba, con `transform` para no tocar la caja del grid.
     La hora de FIN igual, sobre la raya de abajo de la última fila.
     La etiqueta de la hora va al LIMITE SUPERIOR de su fila, que es la misma decision
     que estaba escrita para el eje horizontal (iba al limite izquierdo = hora de inicio)
     girada 90 grados. Centrarla seria ambiguo: `docs/decisiones-app.md`.
     Con paso fino solo se rotula la hora en punto, o no se leeria nada. */
  eje.forEach(function(t,ix){
    if(t%60!==0) return;
    g+='<div style="grid-column:1;grid-row:'+(ix+2)+';font-family:var(--mono);'+
      'font-size:8.5px;color:var(--ink3);text-align:right;padding-right:4px;'+
      'line-height:1;transform:translateY(calc(-50% - 1px))">'+pad(Math.floor(t/60)%24)+'</div>';
  });
  /* y la hora de FIN, al pie de la ultima fila: cierra el eje igual que antes lo cerraba
     por la derecha. Sin esto el mapa no dice hasta que hora llega. */
  g+='<div style="grid-column:1;grid-row:'+(eje.length+2)+';font-family:var(--mono);'+
    'font-size:8.5px;color:var(--ink3);text-align:right;padding-right:4px;line-height:1;'+
    'transform:translateY(calc(-50% - 1px))">'+_hhmm(t1).replace(':00','')+'</div>';
  R.dias.forEach(function(d,di){
    /* UNA CELDA POR FRANJA, ancha lo que la franja dura. Antes se pintaba una celda por
       INSTANTE del eje y el numero solo en la que arrancaba: con paso de 30 min y franjas
       de una hora salia «3 · 3 · 3 ·», y parecia que en la mitad de los huecos no podia
       nadie. El eje de tiempo se queda; lo que cambia es que la franja no se trocea. */
    var ix=0;
    while(ix<eje.length){
      var fi=cubre[di][ix], k=1;
      while(ix+k<eje.length && cubre[di][ix+k]===fi) k++;      // hasta donde llega esta franja
      /* ⛔ `span` DE FILAS y columna FIJA, y los dos dichos a mano. Antes era
         `grid-column:span k` con altura fija; girado, lo que se fusiona son las filas
         del eje de tiempo y la columna es la del dia. */
      var geo='grid-column:'+(di+2)+';grid-row:'+(ix+2)+'/span '+k+';border-radius:2px';
      if(fi<0){                                                // fuera del horario de ese dia
        /* ...salvo que ahi este la reunion FIJADA. La fijada es una DECISION, no un dato de
           disponibilidad: tiene que verse aunque esa franja no estuviera ofertada ese dia.
           Pasa con las reuniones viejas, cuyas franjas de 60 min se solapan cada 30 y no
           cuadran con la rejilla. Si la decision no se ve, el mapa no sirve para lo unico
           que de verdad importa mirar. */
        if(_esFijada_(di, eje[ix], (ix+k<eje.length? eje[ix+k] : eje[ix]+paso))){
          g+='<div title="reunión fijada" style="'+geo+';background:rgba(53,199,89,.85);'+
            'outline:1px solid var(--ok);outline-offset:-1px"></div>';
          ix+=k; continue;
        }
        g+='<div title="fuera del horario de ese d\u00eda" style="'+geo+';'+
          'background:repeating-linear-gradient(45deg,rgba(255,255,255,.045) 0 3px,transparent 3px 6px);'+
          'border:1px solid var(--line)"></div>';
      } else {
        var v=M[di][fi], ini=_mm(R.franjas[fi]);
        var a=(0.12+0.88*(max?v/max:0)).toFixed(3);
        var _t0=eje[ix], _t1=(ix+k<eje.length? eje[ix+k] : ini+_du(R.franjas[fi]));
        var esBest=_esHuecoFijar_(vent, di, fi), fij=_esFijada_(di,_t0,_t1);
        var fondo = fij ? 'rgba(53,199,89,.85)' : _calorColor_(R.modalidad, a);
        var borde = fij ? ';outline:1px solid var(--ok);outline-offset:-1px'
                   : (esBest?';outline:1px solid var(--ink);outline-offset:-1px':'');
        /* 20/10 · «quién puede»: tocar la celda lo dice en la caja de debajo (`_cablearQuienPuede_`). */
        g+='<div data-qp="'+esc(R.id)+'|'+di+'|'+fi+'"'+(fij?' data-fij="1"':'')+' data-qpt="'+esc(d+' · '+_hhmm(ini)+'\u2013'+_hhmm(ini+_du(R.franjas[fi])))+'"'+
          ' title="'+_hhmm(ini)+'\u2013'+_hhmm(ini+_du(R.franjas[fi]))+' \u00b7 '+v+'" style="'+geo+';cursor:pointer;'+
          'display:grid;place-items:center;font-family:var(--mono);font-size:8.5px;color:#fff;'+
          'background:'+fondo+borde+'">'+v+'</div>';
      }
      ix+=k;
    }
  });
  g+='</div></div>';

  return '<div class="h1">Reuniones</div><p class="h1s">Tus reuniones y encuestas de disponibilidad.</p>'+
    '<button class="btn pri full" data-p id="btnCrear" style="margin-bottom:11px">Convocar '+(esCoord()?'reunión':'reunión de trabajo')+'</button>'+
    '<h2 class="sec">Mis reuniones<span class="ln"></span>'+(_reuPartir_(REUNIONES_M).vivas.filter(function(x){ return x.invitado!==false; }).length||1)+'</h2>'+
    (REUNIONES_M.length>1 || R.invitado===false
      ? _listaReusM_(R)
      : '')+
    '<div class="tarj">'+cab(R.tipo||'General', _modalidadTxt_(R.modalidad))+
      '<div class="fila" style="padding-top:0"><div class="a"><b>'+esc(R.titulo)+'</b>'+
      '<small>'+(R.convocante?'Convoca '+esc((_pilaDeM_(R.convocante)||R.convocante))+' · ':'')+(R.fijada?'📌 '+esc(_fijadaTxtM_(R.fijada)):esc(_plazoTxtM_(R)))+' · '+_nConvM_(R)+' convocados'+
      _duraTxtM_(R)+'</small></div>'+
      '<div class="d"><span class="pil '+((R.fijada||(R.cubierta&&!R.bajoMin)||R.exento||R.tarde)?'conf':(R.invitado===false?'conf':'no'))+'">'+
        (R.invitado===false?'solo lectura':(R.fijada?'fijada':(R.exento?'organizas':R.tarde?'convocado tarde':(R.bajoMin?'bajo el mínimo':(R.cubierta?'cubierta':'te falta')))))+'</span></div></div>'+
      /* 11/11 (reumovil): la ves por tu nivel, no porque te hayan convocado: sin rejilla, sin «te falta» (cubrir y responder son de convocados) */
      (R.invitado===false && !R.fijada
        ? '<p class="rnota" style="margin:2px 0 10px">No estás convocado a esta reunión: puedes verla, no marcar disponibilidad.</p>'
        : '')+
      (R.fijada
        ? '<div class="avisolargo" style="border-color:rgba(62,180,137,.4);background:rgba(62,180,137,.08);color:#a9dcc6">'+
          '<b style="color:var(--ok)">Reunión fijada · '+esc(R.fijada)+'</b><br>Disponibilidad cerrada.</div>'
        : (R.invitado===false ? ''
          : R.exento
            /* 🗣️ Daniel (14/10): *«que permita, por favor, al que organiza la reunión
               poner su disponibilidad. Si le apetece. En plan, opcional. Pero básicamente
               así es más fácil de debuguear»*.
               ⛔ Aquí había un `''`: al convocante NO se le ofrecía la rejilla. Ahora
               `exento` significa **no se te EXIGE**, no «no puedes» -- y la diferencia
               importa fuera de depurar: quien convoca también va a la reunión, y su hueco
               cuenta para elegir la franja.
               ✅ Y es el MISMO botón `#btnCubrir` de abajo, no uno nuevo: su manejador ya
               está enganchado y `guardarDisp` no mira si eres el convocante. Un botón
               propio sería una segunda puerta a la misma cosa. */
            ? (!R.fijada && _plazoAbierto_(R.limite)
                ? '<button class="btn full" data-p id="btnCubrir" style="margin-top:10px">'+
                  (R.cubierta?'Editar mi disponibilidad':'Marcar la mía también (opcional)')+
                  '</button>'
                : '')
            /* ⛔ CON EL PLAZO CERRADO NO SE OFRECE CUBRIR. El servidor lo RECHAZA
               (`Codigo.gs:4582`) y hasta hoy la pantalla no preguntaba nada: se pintaba la
               rejilla entera, se marcaba, y sólo al pulsar «Guardar» salía un error crudo.
               Quien se rinde ahí sale como «no cubrió» y se lleva el Art. 30g — o sea que la
               promesa de la pantalla le costaba el punto. Se dice ANTES y con la fecha. */
            : !_plazoAbierto_(R.limite)
              ? '<div class="avisolargo" style="border-color:rgba(230,168,58,.4);background:rgba(230,168,58,.08);color:#e8cfa0">'+
                '<b style="color:var(--warn)">El plazo cerró · '+esc(_limM_(R))+'</b><br>'+
                (R.cubierta
                  ? 'Lo que dejaste marcado sigue contando; ya no se puede cambiar.'
                  : 'Ya no se puede cubrir: el servidor no acepta respuestas fuera de plazo.')+'</div>'
              : '<button class="btn pri full" data-p id="btnCubrir" style="margin-top:10px">'+
                (R.cubierta?'Editar mi disponibilidad':'Cubrir mi disponibilidad')+'</button>'))+
    /* si ya está fijada, el aviso de organizador sobra y quedaba colgando debajo del cartel verde */
    ((R.exento && !R.fijada)?'<p class="rnota" style="margin:-4px 0 10px">La convocas tú, así que no se te <i>pide</i> disponibilidad. Puedes marcarla si quieres.</p>':'')+
      /* ⛔ LA REGLA ES LA DEL BACKEND, Y NO ES `esCoord()`. Aqui se ofrecian los tres
         botones a CUALQUIER coordinador, y las tres acciones que llaman las gatea
         `Codigo.gs` por **convocante o admin** -con la misma linea en las tres:
         `_borrarReunion_` :4685, `_editarReunion_` :4707, `_fijarReunion_` :4731-.
         Un coordinador que no convoco abria «Fijar fecha», elegia dia y franjas, pulsaba
         Confirmar y el servidor le contestaba «solo el convocante o admin». Un boton que
         ofrece lo que el servidor va a negar es peor que no tenerlo, y este ademas gasta
         el trabajo de elegir la franja antes de decir que no.
         ✅ Se pasa por la puerta que YA existia tres lineas mas abajo para el boton de
         borrar: la misma regla, escrita una vez. */
      (_puedeBorrarReuM_(R)?'<div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap">'+
        '<button class="btn mini" data-p id="btnFijar" style="flex:1">'+(R.fijada?'Cambiar fecha/hora':'📌 Fijar fecha')+'</button>'+
        (R.fijada?'<button class="btn mini" data-p id="btnDesfijar" style="flex:1;color:var(--warn);border-color:var(--warn)">Cancelar fijado</button>':'')+
        '<button class="btn mini" data-p id="btnInvitados" style="flex:1">Convocados</button>'+
        '<button class="btn mini" data-p id="btnEditarReu" style="flex:1">Título y plazo</button>'+
      '</div>':'')+
    /* 01/11: la asistencia es del PD, no de quien convocó: su botón va aparte del de «Fijar/Convocados». */
    /* 04/11: la asistencia es de quien convoca (y del PD); y «Finalizar» también: la da por celebrada, la saca de Estado y cierra la palabra. */
    (_asisBotonM_(R)?'<div style="margin-top:9px"><button class="btn mini full" data-p id="btnAsistencia">'+ico('portapapeles')+' Palabra de asistencia</button></div>':'')+
    (_reuPuedeFinalizar_(R, _asisYoM_(), (typeof esAdmin==='function' && esAdmin())) && (_demoLocal_() || (typeof backendOK!=='undefined' && backendOK && !!R._real))
      ? '<div style="margin-top:9px"><button class="btn mini full" data-p id="btnFinalizarReu">Finalizar reunión</button></div>'
      : (_reuFinalizada_(R) ? '<p class="rnota" style="margin:9px 0 0">Finalizada el '+esc(_isoADMY_(String(R.finalizada_at).slice(0,10)))+'.</p>' : ''))+
    _ordenDiaReuHTML_(R)+
    _audioReuHTML_(R)+
    _bloqueReuHTML_(R, _puedeBloqueReu_(R, (typeof _actorSanc_==='function'?_actorSanc_():(YO&&YO.nombre)), (typeof esAdmin==='function' && esAdmin())))+
    '</div>'+
    '<h2 class="sec">Cuándo puede el equipo<span class="ln"></span></h2>'+
    /* ⛔ EN `oculta` NO SE PINTA EL AGREGADO, y no basta con que el servidor deje de mandarlo:
       con solo TU fila, `_calorDe_` dibuja un mapa que te cuenta a ti y el titular diría
       «mejor hueco … 1 puede». No es una fuga, pero es una MENTIRA — y de este mapa salen las
       propuestas de sanción por no cubrir. Daniel (15/08): «el resto solo puede cubrir su
       disponibilidad y ya esta». */
    (_sinAgregadoM_(R)
      ? '<div class="tarj"><p class="rnota" style="margin:0;padding:6px 0">Esta reunión es '+
        'oculta: el mapa solo lo ve quien la convoca'+
        (R.convocante?' ('+esc(R.convocante)+')':'')+'. Tú solo marcas tu disponibilidad.'+
        '</p></div>'
      : '<div class="tarj">'+
      (hib?'<div class="modos" id="calModo" style="margin-bottom:10px">'+
        '<button data-pond="0" class="'+(pondOn?'':'on')+'" data-p>Personas</button>'+
        '<button data-pond="1" class="'+(pondOn?'on':'')+'" data-p>Ponderada</button></div>':'')+
      '<p class="rnota" style="margin:0 0 10px" data-ordsug="'+esc(R.id)+'">'+_huecoM_()+'</p>'+
      g+
      '<p class="rnota" data-qpbox="'+esc(R.id)+'" style="margin:9px 0 0">Toca un hueco del mapa para ver quién puede.</p>'+
      '<div class="leyh" style="margin-top:11px"><span><i style="background:'+_calorColor_(R.modalidad,.9)+'"></i>'+
        _calorLeyenda_(R.modalidad, pondOn)+'</span>'+
        '<span><i style="background:repeating-linear-gradient(45deg,rgba(255,255,255,.14) 0 3px,transparent 3px 6px);border:1px solid var(--line)"></i>fuera del horario de ese día</span></div>'+
    '</div>')+
    (_puedeBorrarReuM_(R) && _reuSePuedeBorrar_(R)?'<button class="btn full" data-p id="btnBorrar" style="margin-top:6px;color:var(--red2);border-color:var(--red)">Eliminar reunión</button>':'')+
    /* ⛔ 20/10: «Sin convocar» va AL FINAL. Estaba entre el rótulo «Mis reuniones» y la tarjeta de la reunión, y con
       una sola reunión (la lista no se pinta) el rótulo quedaba vacío y la reunión parecía «sin convocar». Visto en
       la maqueta al darle un acta sin convocar; ningún banco miraba el ORDEN. */
    _sinConvocarHTMLM_();
}

/* ── CUBRIR DISPONIBILIDAD — pintar a dedo/arrastre, ciclo según modalidad ─
   telemática 0↔1 · presencial 0↔2 · híbrida 0→1→2→0 (decisión cerrada). ── */
function cubrirModal(){
  var R=REUNION, nF=R.franjas.length, nD=R.dias.length;
  var modo=R.modalidad;
  var _slot=+R.slot || (R.franjas[0] && +R.franjas[0].dur) || 60;
  var _minS=_slotsMin_(R.duracion, _slot);
  var instr = modo==='presencial' ? 'toca o arrastra · marca tu disponibilidad presencial'
            : modo==='telematica' ? 'toca o arrastra · marca tu disponibilidad telemática'
            : 'toca o arrastra · 1× telemático · 2× presencial + telemático · 3× quitar';
  var ley = modo==='presencial' ? '<span><i style="background:var(--red)"></i>presencial</span>'
          : modo==='telematica' ? '<span><i style="background:var(--tel)"></i>telemática</span>'
          : '<span><i style="background:var(--red)"></i>presencial + telemático</span><span><i style="background:var(--tel)"></i>solo telemático</span>';
  /* Precarga de lo ya enviado: sin esto, «Editar mi disponibilidad» abria la rejilla
     en blanco y guardar equivalia a borrar lo que tenias puesto.
     `resp[nombre]` esta alineado a la POSICION del bloque, no al indice de franja. */
  if(!ST.sel || ST._selDe!==R.id){
    ST.sel=new Map(); ST._selDe=R.id;
    var _mio=(R.resp||{})[(YO&&YO.nombre)||'']||[];
    (R.bloques||[]).forEach(function(b,i){
      var v=+_mio[i]||0; if(v>0) ST.sel.set(b[0]+'_'+b[1], v);
    });
  }
  /* ⛔⛔ UN DÍA = UNA COLUMNA, UNA FRANJA = UNA FILA (13/10). Estaba al revés y por
     eso no cabía en un teléfono: las franjas son MUCHAS y los días POCOS, así que el
     eje largo tiene que ser el vertical, que es el que un móvil tiene de sobra.
     🗣️ Daniel: *«un día una columna con sus horas, y en las filas los bloques
     horarios … no tiene mucho que ver con lo que es la pantalla de un teléfono»*. */
  var hd='<div class="rc"></div>';
  R.dias.forEach(function(d){
    hd+='<div class="rc rh rhd">'+esc(d)+'</div>';
  });
  /* Las casillas NO OFERTADAS ya no se pueden pintar. Antes se pintaban igual, se veian
     marcadas, y al guardar se caian sin decir nada: `vals` se arma recorriendo `bloques`,
     asi que lo que no era bloque no existia. */
  var _ofer={}; (R.bloques||[]).forEach(function(b){ _ofer[b[0]+'_'+b[1]]=1; });
  /* ⛔ LA CLAVE NO CAMBIA: sigue siendo `dia_franja`, así que ni `ST.sel` ni lo que se
     guarda se enteran de que la rejilla se ha girado. Lo único que cambia es el ORDEN en
     que se pintan las celdas — y el arrastre va por `elementFromPoint`, no por posición.
     ✅ Y la etiqueta de la hora es además **el asa para deslizar**: ver `.rc.rd` en el CSS. */
  var rows='', _hayOff=false;
  R.franjas.forEach(function(f,fi){
    rows+='<div class="rc rd" aria-hidden="true"><span>'+f.ini.replace(':00','')+'</span></div>';
    for(var di=0;di<nD;di++){
      var k=di+'_'+fi;
      if(!_ofer[k]){ _hayOff=true; rows+='<div class="ecel off" title="fuera del horario de ese día"></div>'; continue; }
      var v=ST.sel.get(k)||0;
      rows+='<div class="ecel '+(v===2?'on2':v===1?'on1':'')+'" data-k="'+k+'"></div>';
    }
  });
  abrirModal('<div class="mtit">Marca tu disponibilidad</div>'+
    '<div class="msub">'+esc(YO.pila)+' · '+instr+'</div>'+
    (_minS>1?'<p class="rnota" style="margin:-4px 0 10px">Dura '+_durTxt_(_minS*_slot)+
      ': cada toque marca '+_minS+' casillas seguidas. '+
      'Arrastra para alargar.</p>':'')+
    /* 🗣️ «Y que lo ponga escrito en algún lugar» (14/10). **El mismo texto y la misma clase que
       en Turnos**: dos frases distintas para el mismo gesto en dos pantallas es como se aprende
       que la app es incoherente. Y va **encima** de la rejilla: debajo lo lee quien ya se ha
       rendido. */
    '<div class="rgesto">Un dedo <b>pinta</b> · dos dedos <b>deslizan</b></div>'+
    '<div class="rejw"><div class="rej" id="rejC" style="grid-template-columns:auto repeat('+nD+',minmax(44px,1fr))">'+hd+rows+'</div></div>'+
    /* 🟡 4 (auditor 19): la leyenda explica la casilla rayada, igual que la del mapa de calor — sólo si la hay. */
    '<div class="leyh" style="margin-top:10px">'+ley+(_hayOff?'<span><i style="background:repeating-linear-gradient(45deg,rgba(255,255,255,.14) 0 3px,transparent 3px 6px);border:1px solid var(--line)"></i>fuera del horario de ese día</span>':'')+'</div>'+
    '<div class="sc" id="ecount" style="margin:12px 0 10px"></div>'+
    '<button class="btn pri full" data-p id="btnGuardarDisp">Guardar disponibilidad</button>');
  engancharRejilla();
}

function engancharRejilla(){
  var grid=$('#rejC'); if(!grid) return;
  var R=REUNION, modo=R.modalidad, nF=(R.franjas||[]).length;
  var slot=+R.slot || (R.franjas[0] && +R.franjas[0].dur) || 60;
  var minS=_slotsMin_(R.duracion, slot);          // casillas seguidas que exige la reunión
  var ofer={}; (R.bloques||[]).forEach(function(b){ ofer[b[0]+'_'+b[1]]=1; });
  var hay=function(di,f){ return f>=0 && f<nF && !!ofer[di+'_'+f]; };
  var sig=function(cur){ return modo==='presencial'?(cur===2?0:2) : modo==='telematica'?(cur===1?0:1) : ((cur||0)+1)%3; };
  /* La unidad es el HUECO, no la casilla: una racha mas corta que la reunion no sirve
     para nada -no puedes ir- y ademas el pipeline de sanciones te daria por «cubierto». */
  var rachas=function(di){
    var out=[], f=0;
    while(f<nF){
      if(!ST.sel.get(di+'_'+f)){ f++; continue; }
      var a=f; while(f<nF && ST.sel.get(di+'_'+f)) f++;
      out.push([a,f-1]);
    }
    return out;
  };
  /* Lo que queda corto se QUITA, nunca se completa: completarlo seria inventarle
     disponibilidad a una persona, y de aqui salen sanciones reales.
     ⛔ EL CALCULO VIVE EN `comun.js` desde el 18/08 y **no cambia de comportamiento**: lo que
     cambia es que el ORDENADOR tambien lo tiene. Estaba solo aqui, y las dos caras escriben
     en la MISMA fila del servidor -- asi que lo que el escritorio dejaba guardar, este
     `sanear` se lo borraba a la persona en cuanto tocaba la rejilla en el telefono. */
  var sanear=function(){
    var cortas=_rachasCortas_(R.dias.length, nF, minS, function(d,f){
      return !!ST.sel.get(d+'_'+f);
    });
    cortas.forEach(function(r){
      for(var i=r[1];i<=r[2];i++) ST.sel.delete(r[0]+'_'+i);
    });
    return cortas.length;
  };
  var cont=function(){
    var e=$('#ecount'); if(!e) return;
    var hue=0, cas=0, p=0, t=0;
    R.dias.forEach(function(_,di){ rachas(di).forEach(function(r){ hue++; cas+=r[1]-r[0]+1; }); });
    ST.sel.forEach(function(v){ v===2?p++:t++; });
    /* ⛔ CUÁNTAS FRANJAS TE PIDEN, que el teléfono no decía en ningún sitio: la constante
       del periodo vivía sólo en `escritorio.html`. Es el número contra el que se decide si te
       cae el Art. 29i, así que quien cubre tiene derecho a verlo MIENTRAS marca, no a
       enterarse cuando le llega la propuesta de puntos. */
    /* ⛔ LA CONDICIÓN VA SOBRE EL DATO, NO SOBRE SI EL CÓDIGO EXISTE. Con `typeof …` y un
       `0` de respaldo, un `_minimoExigido_` ausente **borraba la frase entera** en vez de
       cantar: la comprobación fallaba hacia el silencio, que es justo lo que esta línea
       vino a arreglar. Si hay casillas ofertadas el mínimo es ≥ 1 siempre (25 % de 1 ya
       redondea hacia arriba), así que la única razón legítima de no decir nada es que no
       haya ninguna. */
    var _tot = (R.bloques||[]).length;
    /* ⛔ EL NÚMERO DICE QUÉ ES. «Te piden 26 de 102» es un dato suelto; lo que hace falta saber
       es que 26 es **el mínimo sin sanción**, y cuántas te faltan para llegar. Daniel (18/08):
       *«puedes entregar un numero inferior, eso si te tiene que advertir de que cual es el
       minimo sin sancion»*. Se avisa; no se impide. */
    var _av = _tot ? _avisoMinimo_(cas, _minimoExigido_(R), R.tipo) : {falta:0, txt:''};
    var _pide = _av.txt ? (' · <b'+(_av.falta?' style="color:var(--warn)"':'')+'>'+_av.txt+'</b>') : '';
    e.innerHTML = !hue
      ? 'Sin marcar todavía'+(minS>1?(' · cada toque marca '+_durTxt_(minS*slot)):'')+_pide
      : '<b>'+hue+'</b> hueco'+(hue===1?'':'s')+' · '+_durTxt_(cas*slot)+' en total'+
        (modo==='hibrida' ? (' · '+p+' presencial'+(p===1?'':'es')+' · '+t+' telemática'+(t===1?'':'s')) : '')+
        _pide;
  };
  cont();
  var ancla=null, ultimo=null, target=1, borra=false;
  var kk=function(k){ return k.split('_').map(Number); };
  var cabe=function(di,f){ for(var i=0;i<minS;i++) if(!hay(di,f+i)) return false; return true; };
  /* EL MINIMO VA A LA DERECHA DEL TOQUE (decision de Daniel): el hueco nace donde pones
     el dedo y se lleva lo que dura la reunion. Estirar a partir de ahi es libre. */
  var rango=function(){
    var A=kk(ancla), B=kk(ultimo||ancla);
    var f0=Math.min(A[1],B[1]);
    var f1=borra ? Math.max(A[1],B[1]) : Math.max(A[1]+minS-1, B[1]);
    return { d0:Math.min(A[0],B[0]), d1:Math.max(A[0],B[0]), f0:f0, f1:Math.min(nF-1,f1) };
  };
  var barrer=function(fn){
    var r=rango();
    for(var d=r.d0; d<=r.d1; d++) for(var f=r.f0; f<=r.f1; f++) if(hay(d,f)) fn(d+'_'+f);
  };
  var limpia=function(){ $$('.ecel.prev',grid).forEach(function(c){ c.classList.remove('prev'); }); };
  var prev=function(){ limpia(); barrer(function(k){
    var c=grid.querySelector('[data-k="'+k+'"]'); if(c) c.classList.add('prev'); }); };
  /* Se repinta la rejilla ENTERA porque `sanear` puede tocar casillas fuera del arrastre. */
  var repinta=function(){
    $$('.ecel[data-k]',grid).forEach(function(c){
      var v=ST.sel.get(c.dataset.k)||0;
      c.classList.remove('on1','on2');
      if(v===1) c.classList.add('on1'); else if(v===2) c.classList.add('on2');
    });
  };
  var commit=function(){
    barrer(function(k){ if(target===0) ST.sel.delete(k); else ST.sel.set(k,target); });
    var q=sanear();
    limpia(); repinta(); cont();
    /* El texto tambien es compartido: si una cara avisa y la otra calla, la que calla
       parece que lo guardo. */
    var _av=_avisoCorto_(q, minS, slot); if(_av) tost(_av);
  };
  /* ⛔⛔ EL GESTO VA ENGANCHADO **ANTES** QUE EL PINTOR: los dos escuchan en el MISMO elemento,
     así que corren en el orden en que se registran, y al revés el `pointerdown` del segundo dedo
     movería el ancla antes de que nadie sepa que vienen dos.
     ✅ Abortar aquí es **más barato que en Turnos y por eso no hay copia**: el `pointerdown` sólo
     pone el ancla y **previsualiza**; lo que escribe es `commit()`, en el `pointerup`. Así que
     abortar es tirar el ancla y limpiar — no se ha confirmado nada.
     🗣️ Daniel (14/10): *«Deslizar para las reuniones va a ser completamente OBLIGATORIO»*. */
  var dd=_dosDedos_(grid, function(){ ancla=null; ultimo=null; limpia(); });
  grid.addEventListener('pointerdown',function(ev){
    if(dd.deslizando()) return;
    var el=ev.target.closest('.ecel'); if(!el || !el.dataset.k) return;   // no ofertada: no se toca
    ev.preventDefault();
    var A=kk(el.dataset.k);
    target=sig(ST.sel.get(el.dataset.k)||0); borra=(target===0);
    if(!borra && !cabe(A[0],A[1])){
      tost('Ahí no entra la reunión entera ('+_durTxt_(minS*slot)+'): el horario de ese día acaba antes.');
      return;
    }
    ancla=el.dataset.k; ultimo=ancla;
    try{ grid.setPointerCapture(ev.pointerId); }catch(e){}
    prev();
  });
  grid.addEventListener('pointermove',function(ev){
    if(dd.deslizando() || !ancla) return;
    var el=document.elementFromPoint(ev.clientX,ev.clientY);
    if(el && el.classList.contains('ecel') && el.dataset.k){ ultimo=el.dataset.k; prev(); }
  });
  /* ⚠️ Con el trazo abortado por el segundo dedo, `ancla` ya es `null`, así que `commit`
     **no corre**: deslizar no confirma nada. La guarda ya estaba y por eso no hay que tocarla;
     va dicho porque es la línea que decide si lo previsualizado se escribe. */
  grid.addEventListener('pointerup',function(){ if(ancla){ commit(); ancla=null; ultimo=null; } });
  var g=$('#btnGuardarDisp');
  /* GUARDA EN EL SERVIDOR. Antes solo ponia una marca local y decia «guardada»: en el
     servidor no quedaba nada, y de ahi come el pipeline de sanciones. `valores` va
     alineado a la POSICION de cada bloque, que es como lo espera `responder`. */
  if(g) g.onclick=async function(){
    if(g.disabled) return;
    /* ⛔ NO SE CONTESTA POR NADIE. Con «Ver como», `YO` era la identidad que viajaba
       y el backend la honra para el admin: esto guardaba encima de la disponibilidad de
       otra persona, que luego se come el «te falta cubrir» y su sanción. */
    if(typeof _identidadPrestada_==='function' && _identidadPrestada_(yoNombre())){
      tost('Est\u00e1s viendo la app como otra persona: no se contesta por nadie. Vuelve a tu vista para guardar la tuya.');
      return;
    }
    var R2=REUNION;
    /* ⛔ SE PREGUNTA AL PULSAR, no solo al pintar: entre una cosa y otra puede haber entrado un
       refresco, y el plazo vence SOLO. Una guarda que unicamente vive en el pintado es un
       rotulo, y el servidor rechaza igual. */
    if(!_plazoAbierto_(R2.limite)){
      tost('El plazo cerr\u00f3 el '+_limM_(R2)+': el servidor ya no acepta respuestas.');
      return;
    }
    var vals=(R2.bloques||[]).map(function(b){ return ST.sel.get(b[0]+'_'+b[1])||0; });
    if(typeof backendOK!=='undefined' && backendOK && SESION){
      g.disabled=true; var prev=g.textContent; g.textContent='Guardando…';
      try{
        /* ⚠ La identidad que VIAJA es con la que se escribe (`_actorSanc_`: la de la
           sesión), no `YO` -- que «Ver como» reasigna. Defensa en profundidad: aunque
           el bloqueo de arriba fallara, esto escribiría en TU fila y no en la de otro. */
        var _quien=(typeof _actorSanc_==='function') ? _actorSanc_() : ((YO&&YO.nombre)||'');
        await api.responder(R2.id, _quien, vals);
        if(!R2.resp) R2.resp={};
        R2.resp[_quien]=vals;
        /* ⛔ SE GUARDA IGUAL Y SE AVISA. Daniel (18/08): entregar menos del mínimo es una
           OPCIÓN, no un error — lo que no puede pasar es que nadie te diga que ahí hay una
           propuesta de puntos esperando. Va DESPUÉS del `await`, con lo que de verdad se
           guardó, no con lo que había en pantalla. */
        var _gm=0; for(var _i=0;_i<vals.length;_i++) if((+vals[_i]||0)>0) _gm++;
        var _ga=_avisoMinimo_(_gm, _minimoExigido_(R2), R2.tipo);
        var re=_normReuM_(R2); REUNION=re;                    // recalcula el mapa con lo tuyo dentro
        var ix=REUNIONES_M.findIndex(function(x){ return x.id===re.id; });
        if(ix>=0) REUNIONES_M[ix]=re;
        ST._selDe=null;
        /* ⛔ 21/10 (auditor 19, 🟠 1): O el aviso del Art. 29i O «guardada», nunca los dos: el segundo `tost` pisaba al
           primero en el mismo tick y la persona sólo leía «Disponibilidad guardada.» (el escritorio ya lo hacía así). */
        cerrarModal();
        tost(_ga.falta ? ('Guardado: '+_gm+' franja'+(_gm===1?'':'s')+'. Ojo, '+_ga.txt+' \u2014 por debajo se propone Art. 29i.')
                       : 'Disponibilidad guardada.');
        pintar();
      }catch(e){
        g.disabled=false; g.textContent=prev;
        tost('No se pudo guardar: '+((e&&e.message)||e)+'. Vuelve a intentarlo.');
      }
      return;
    }
    tost('Sin conexión no se puede guardar la disponibilidad.');
  };
}

/* nombres largos para la vista de 'horario distinto por día' (ahí caben y se leen mejor) */
function _diasLargos_(modo,d0,d1,fecha,nd){
  var out=[], a, i;
  if(modo==='rango'){ if(!d0||!d1) return out; a=new Date(d0+'T00:00:00'); var b=new Date(d1+'T00:00:00');
    /* ⛔ EL MISMO TOPE QUE LA REJILLA, y por el mismo sitio (535.ª). Aquí había un `62`
       tecleado en una rama y NADA en la otra: `dias()` cortaba y esto pintaba 900 filas,
       o sea 838 huérfanas que `rangos()` no lee. Dos partes de la misma pantalla
       contestando distinto a «cuántos días hay». */
    for(i=0;i<_topeDias_()&&a<=b;i++){ out.push(_DL_[a.getDay()]+' '+a.getDate()); a.setDate(a.getDate()+1); } }
  else { a=new Date((fecha||'')+'T00:00:00'); for(i=0;i<nd&&i<_topeDias_();i++){ var d=new Date(a); d.setDate(a.getDate()+i); out.push(_DL_[d.getDay()]+' '+d.getDate()); } }
  return out;
}

/* El horario que ya habías puesto, conservado por DÍA y no por posición (31/10): al mover el «desde» una semana,
   la fila 0 deja de ser el mismo día y el lunes heredaba el horario del jueves. `prev` son las filas de antes
   `{d:'lun 3', off, a, b}` y `ds` las etiquetas nuevas; devuelve, por cada etiqueta nueva, su fila de antes o null.
   Cada fila vieja se gasta una vez: «mar 3» sale en febrero y en marzo de un año no bisiesto (28 días). */
function _horarioPrevPorDia_(prev, ds){
  var usado=[];
  return ds.map(function(d){
    for(var i=0;i<prev.length;i++){ if(!usado[i] && prev[i].d===d){ usado[i]=true; return prev[i]; } }
    return null; }); }

/* ⛔ `_genUnion_` VIVE EN `comun.js` (07/08), que cargan las dos caras. Estaba
   aqui y en la otra cara con el MISMO cuerpo. No se declara aqui: dos globales con
   el mismo nombre y el navegador se queda con la ultima que cargue, sin dar error. */


/* Hora de inicio y de fin de una franja, para escribir un hueco como «18:00–19:00». */
/* ⚠️ `_hFranja_` y `_hFinFranja_` se mudaron a `comun.js` el 18/08: la cara de escritorio
   necesita lo mismo —a qué hora empieza y acaba la franja `i`— para decir la ventana, y
   tenerlo sólo aquí obligaba a escribirlo otra vez allí. */

/* convocados por defecto según el tipo: general=todo el equipo, subsistema=tu unidad,
   junta=coordinadores+PD, **consejo=los 10 del Consejo**, mixta/trabajo=a mano.

   ⛔ EL CONSEJO NO ESTABA «POR CONFIGURAR»: LO ESTABA DESDE EL 22/07. Daniel dio los diez
   nombres ese día y viven en `CONSEJO_PUSH` del backend, que ya los usa para enrutar avisos.
   Aquí caían en el `false` de abajo, así que convocar una reunión de consejo **no invitaba a
   nadie** — y la etiqueta del desplegable decía «por configurar», que es de donde salió la nota
   falsa de que faltaba una decisión suya. La pantalla describía el estado de la pantalla, no el
   del sistema.
   ⚠️ La lista **llega en el panel** (`DATA.consejo`) y no se copia aquí: dos copias de la misma
   verdad acaban siendo dos verdades. Si el panel no la trae —backend viejo—, se devuelve vacío
   como antes y el convocante los pone a mano: se degrada, no se inventa. */
function _presetInvitados_(tipo){
  var yo=(YO&&YO.nombre)||'', ms=_activos_(), out=[];
  if(tipo==='consejo'){
    var cons=(typeof DATA!=='undefined' && DATA && DATA.consejo) || [];
    /* ⛔ Se cruza con los ACTIVOS: un miembro del consejo dado de baja no se convoca, igual
       que en los demás tipos —que salen de `_activos_()`—. Sin esto, el consejo sería el único
       tipo que invita a gente que ya no está. */
    ms.forEach(function(m){
      if(m.nombre===yo) return;
      for(var i=0;i<cons.length;i++) if(String(cons[i])===String(m.nombre)){ out.push(m.nombre); return; }
    });
    return out;
  }
  ms.forEach(function(m){
    if(m.nombre===yo) return;
    var meto = tipo==='general' ? true
             : (tipo==='subsistema' || tipo==='mixta') ? (m.unidad===(YO&&YO.unidad))   // 04/11: la mixta nace con SU subsistema ya dentro
             : tipo==='junta' ? (m.cargo==='Coordinador'||m.cargo==='Project Director')
             : false;                              // trabajo: a mano
    if(meto) out.push(m.nombre);
  });
  return out;
}

function crearModal(){
  var coord=_tiposConvocables_(YO&&YO.nombre).length>1;    // 04/11: más que `trabajo`
  /* 04/11 (Daniel): los tipos que se ofrecen salen de `_tiposConvocables_` (espejo de `disciplina.puede_convocar`). */
  var tipos=[['general','General · todo el equipo'],['junta','Junta Directiva · coordinación'],
    ['consejo','Consejo · sus miembros'],['subsistema','Subsistema · tu unidad'],
    ['mixta','Mixta · tu subsistema y 1-2 más'],['trabajo','Reunión de trabajo · invitas tú']];
  var _tp=_tiposConvocables_(YO&&YO.nombre);
  var op=tipos.filter(function(t){return _tp.indexOf(t[0])>=0;});
  var hoyISO=_dmyAISO_(HOY), mas=function(iso,n){ var d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n);
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); };
  var subs=(DATA.subsistemas||[]).map(function(sb){ return '<button type="button" class="cmixb" data-u="'+esc(sb.u||sb)+'" data-p>'+esc(sb.u||sb)+'</button>'; }).join('');
  var plant=PLANTILLAS_M.length ? '<div class="campo"><span class="sc">Copiar distribución de</span>'+
      nxElige('ceCopiar', [['','— empezar en blanco —']].concat(PLANTILLAS_M.map(function(p,i){ return [String(i), p.titulo]; })), '')+'</div>' : '';
  abrirModal('<div class="mtit">Nueva '+(coord?'reunión':'reunión de trabajo')+'</div>'+
    '<div class="campo"><span class="sc">Tipo</span>'+nxElige('ceTipo', op, op[0][0])+'</div>'+
    _avisoGrabaHTML_('ceGraba')+
    (coord?'':'<p class="rnota" style="margin:-4px 0 10px">Como miembro convocas reuniones de trabajo. Las demás las convocan quienes tienen potestad para ello.</p>')+
    '<div class="campo"><span class="sc">Modalidad</span>'+
      nxElige('ceMod', [['hibrida','Híbrida (presencial + telemática)'],['presencial','Presencial'],['telematica','Telemática']], 'hibrida')+'</div>'+
    '<div id="ceMixW" style="display:none"><span class="sc" style="display:block;margin-bottom:5px">Subsistemas que participan</span>'+
      '<div class="cmix" id="ceMix">'+subs+'</div></div>'+
    '<div id="ceInvW"><span class="sc" style="display:block;margin-bottom:5px">Invitar</span>'+
      /* El selector de personas ÚNICO (comun.js): el equipo entero menos quien convoca. */
      elegirPersonas('ceInv', {universo:_activos_().map(function(m){ return m.nombre; }).filter(function(n){ return n!==(YO&&YO.nombre); }),
        titulo:'Invitados', alCambiar:function(l){ INV=new Set(l); upd(); }})+'</div>'+
    plant+
    '<label class="campo"><span class="sc">Título</span><input id="ceTit" placeholder="Reunión sin título"></label>'+
    '<div class="campo"><span class="sc">Fechas por</span>'+nxElige('ceModo', [['rango','Desde / hasta'],['dur','Desde + nº de días']], 'rango')+'</div>'+
    '<div id="ceRango"><div class="campo"><span class="sc">Desde</span>'+nxFecha('ceD0', hoyISO, {min:hoyISO})+'</div>'+
      '<div class="campo"><span class="sc">Hasta</span>'+nxFecha('ceD1', mas(hoyISO,6), {min:hoyISO})+'</div></div>'+
    '<div id="ceDurW" style="display:none"><div class="campo"><span class="sc">Desde</span>'+nxFecha('ceFecha', hoyISO, {min:hoyISO})+'</div>'+
      '<div class="campo"><span class="sc">Días</span>'+nxNum('ceND', 7, {min:1, max:_topeDias_()})+'</div></div>'+
    '<div class="campo"><span class="sc">De</span>'+nxHora('ceH0', '16:00')+'</div>'+
    '<div class="campo"><span class="sc">A</span>'+nxHora('ceH1', '23:00')+'</div>'+
    '<div class="campo"><span class="sc">Horario distinto por día</span>'+nxSiNo('cePerdia', false)+'</div>'+
    '<div class="cdias" id="ceDias" style="display:none"></div>'+
    /* Dos preguntas, no dos rarezas: la casilla que se pinta, y lo que dura la reunión.
       La «cadencia solapada» se retiró: era una forma retorcida de decir «slots de 15
       min» y dejaba el mapa ilegible. */
    '<div class="dosc">'+
      '<div class="campo"><span class="sc">Tamaño de slot</span>'+
        nxElige('ceSlot', [['15','15 min'],['30','30 min'],['60','1 h']], '30')+'</div>'+
      '<div class="campo"><span class="sc">Dura la reunión</span>'+
        nxElige('ceDura', [['30','30 min'],['60','1 h'],['90','1 h 30 min'],['120','2 h'],['180','3 h']], '60')+'</div></div>'+
    '<p class="rnota" id="ceSlotHint"></p>'+
    '<div class="campo"><span class="sc">Límite para responder</span>'+nxFecha('ceLim', mas(hoyISO,5), {min:hoyISO})+'</div>'+
      '<div class="campo"><span class="sc">Hora del límite</span>'+nxHora('ceLimH', '23:59')+'</div>'+
    '<span class="sc" style="display:block;margin-bottom:6px">Visión de disponibilidad</span>'+
    '<div class="modos" id="ceVision">'+
      '<button data-v="publica" data-p>Pública</button>'+
      '<button data-v="anonima" class="on" data-p>Anónima</button>'+
      '<button data-v="oculta" data-p>Oculta</button></div>'+
    '<p class="rnota" id="ceHint">El equipo ve el mapa de calor con los totales, sin nombres.</p>'+
    /* 01/11 (Daniel [c8bd27e9d3]): el mínimo lo elige quien convoca entre el del periodo y ±5; las de trabajo no lo llevan. */
    '<div id="ceMin" hidden></div>'+
    _controlAsisCampoHTML_('ceControl')+
    '<p class="rnota" id="cePrev" style="color:var(--ink2)"></p>'+
    '<button class="btn pri full" style="margin-top:12px" data-p id="btnCrearOK">Convocar la reunión</button>');

  var val=function(id){ var e=$('#'+id); return e?e.value:''; };
  var per=function(){ return nxSi('cePerdia'); };
  var hNum=_horasHM_;                       // antes: parser propio; ademas fallaba con 'H:MM'
  var dias=function(){ return val('ceModo')==='rango' ? _diasEntre_(val('ceD0'),val('ceD1'))
    : _diasDesde_(val('ceFecha')||_dmyAISO_(HOY), Math.max(1,+val('ceND')||1)); };
  var rangos=function(){ var ds=dias();
    if(!per()) return ds.map(function(){ return [hNum(val('ceH0')), hNum(val('ceH1'))]; });
    var rows=$$('#ceDias .drow');
    return ds.map(function(_,i){ var r=rows[i]; if(!r||r.classList.contains('off')) return [0,0];
      return [hNum(r.querySelector('.dr0').value), hNum(r.querySelector('.dr1').value)]; }); };
  var INV=new Set();
  /* El selector es el de `comun.js` (`elegirPersonas`): `INV` es el Set que se manda, y `invRender` le dice al
     selector lo que `tipoUpd` o los subsistemas marcados han puesto (sin avisar a `alCambiar`: no hay bucle). */
  var invRender=function(){ elegirPersonasPoner('ceInv', Array.from(INV)); };
  var renderDias=function(){ var ds=_diasLargos_(val('ceModo'), val('ceD0'), val('ceD1'), val('ceFecha')||_dmyAISO_(HOY), Math.max(1,+val('ceND')||1));
    if(!ds.length) ds=dias();
    var prev=$$('#ceDias .drow').map(function(r){
      return {d:r.querySelector('span').textContent, off:r.classList.contains('off'), a:r.querySelector('.dr0').value, b:r.querySelector('.dr1').value}; });
    var prevDe=_horarioPrevPorDia_(prev, ds);
    $('#ceDias').innerHTML=ds.map(function(d,i){ var p=prevDe[i];
      return '<div class="drow'+(p&&p.off?' off':'')+'" data-d="'+i+'"><button type="button" class="dtog on" data-p aria-label="activar o desactivar el día"></button>'+
        '<span>'+esc(d)+'</span>'+nxHora('', p?p.a:val('ceH0'), {attrs:'class="dr0"'})+nxHora('', p?p.b:val('ceH1'), {attrs:'class="dr1"'})+'</div>'; }).join('');
    $$('#ceDias .drow').forEach(function(r,i){
      var apl=function(){ var off=r.classList.contains('off');
        _nxOff_(r.querySelector('.dr0'), off); _nxOff_(r.querySelector('.dr1'), off);
        r.querySelector('.dtog').classList.toggle('on',!off); };
      apl();
      r.querySelector('.dtog').onclick=function(){ r.classList.toggle('off'); apl(); upd(); };
      r.querySelector('.dr0').onchange=upd; r.querySelector('.dr1').onchange=upd; }); };
  function upd(){
    var rg=val('ceModo')==='rango';
    if($('#ceRango')) $('#ceRango').style.display=rg?'':'none';
    if($('#ceDurW'))  $('#ceDurW').style.display=rg?'none':'';
    if($('#ceDias'))  $('#ceDias').style.display=per()?'':'none';
    var sl=+val('ceSlot')||30, du=+val('ceDura')||60;
    var u=_genUnion_(rangos(), sl);
    var nb=u.perDia.reduce(function(a,x){ return a+x.length; },0), nd=dias().length;
    /* Que hay que juntar para que valga, dicho antes de convocar y con la cuenta hecha. */
    var nS=_slotsMin_(du,sl), h=$('#ceSlotHint');
    _minimoConvPintar_($('#ceMin'), 'm', val('ceTipo'), val('ceLim'), upd);
    _controlAsisCampoPintar_('ceControl', val('ceTipo'));
    var hz=_horarioConv_(u.perDia, rangos(), nS, sl, val('ceTipo'), _minimoConvPct_($('#ceMin'), val('ceLim')));
    if(h) h.innerHTML='Cada casilla es de '+_durTxt_(sl)+'; hay que marcar '+
      nS+' seguida'+(nS===1?'':'s')+' ('+_durTxt_(nS*sl)+') para que cuente.'+
      (du%sl ? ' Si no encaja, se redondea hacia arriba.' : '');
    /* ⛔⛔ EL RECORTE SE DICE. `nd` es `dias().length`, o sea el número **YA topado** por la
       función del tope: pidiendo 01/01→31/12 esto imprimía «… en **62 días**» y se quedaba
       tan ancho. Y lo silencioso no es la cuenta, es la **contradicción**: el selector
       sigue marcando el 31/12 y la rejilla acaba el 03/03, sin una palabra.
       ⚠️ Y no es «‘no lo sé’ leído como un dato»: 62 **llega al dato** — `_crear_` guarda
       `bloques` con 62 días y a partir de ahí 62 ES la convocatoria, para el motor y para
       las sanciones. Por eso se avisa ANTES de convocar, que es cuando se puede cambiar. */
    var _ped=_diasPedidos_(val('ceModo'), val('ceD0'), val('ceD1'), Math.max(1,+val('ceND')||1));
    var _rec=_ped-nd;
    var p=$('#cePrev'); if(p) p.innerHTML=((u.F.length&&nb)
      ? '<b>'+u.F.length+' casilla'+(u.F.length===1?'':'s')+'</b> de '+_durTxt_(sl)+' · <b>'+nb+' bloques</b> en '+nd+' día'+(nd===1?'':'s')+
        (per()?' (horario por día)':'')+' · <b>'+INV.size+'</b> convocados.'
      : 'Revisa fechas u horario: no sale ninguna casilla.')+
      (_rec>0 ? '<br><b style="color:var(--warn)">Se piden '+_ped+' días y la app reparte '+
        'como mucho '+_topeDias_()+': se han recortado los '+_rec+' últimos.</b> Lo que se '+
        'convoque será lo de arriba, no lo que marca la fecha de fin.' : '')+
      (hz.bloqueo ? '<br><b style="color:var(--red)">'+esc(hz.bloqueo)+' No se puede convocar así.</b>'
        : hz.aviso ? '<br><b style="color:var(--warn)">'+esc(hz.aviso)+'</b>' : '');
  }
  var tipoUpd=function(){ var t=val('ceTipo');
    if($('#ceMixW')) $('#ceMixW').style.display=(t==='mixta')?'':'none';
    /* ⛔⛔ CON «GENERAL» **TAMBIEN** SE ENSEÑA LA LISTA. Aqui se escondia, y los
       invitados SI estaban puestos: `_presetInvitados_('general')` devuelve a todos
       los activos menos tu, y `tipoUpd()` corre al abrir. Pero una pantalla que no
       ensena a nadie dice «no hay nadie» — Daniel lo leyo asi y tenia razon:
       *«si le das a reunion general, no te mete automaticamente a todos los
       miembros»*. Y encima no dejaba QUITAR a uno, que es justo para lo que sirve.
       ⚠️ El ESCRITORIO nunca lo escondio: era una asimetria de una sola cara. */
    if($('#ceInvW')) $('#ceInvW').style.display='';
    $$('#ceMix .cmixb').forEach(function(b){ b.classList.remove('on'); });
    if(t==='mixta') $$('#ceMix .cmixb').forEach(function(b){ if(YO && b.dataset.u===YO.unidad) b.classList.add('on'); });   // 04/11: SU subsistema, preseleccionado
    INV=new Set(_presetInvitados_(t)); invRender(); upd(); };
  $('#ceTipo').onchange=tipoUpd;
  _avisoGrabaPon_('ceTipo','ceGraba');
  $$('#ceMix .cmixb').forEach(function(b){ b.onclick=function(){ b.classList.toggle('on');
    var u=b.dataset.u, on=b.classList.contains('on');
    _activos_().forEach(function(m){ if(m.unidad===u && m.nombre!==(YO&&YO.nombre)){ if(on) INV.add(m.nombre); else INV.delete(m.nombre); } });
    invRender(); upd(); }; });
  ['ceModo','ceH0','ceH1','ceSlot','ceDura','ceND','ceD0','ceD1','ceLim','ceLimH'].forEach(function(id){
    var e=$('#'+id); if(e) e.onchange=function(){ if(per()) renderDias(); upd(); }; });
  $('#cePerdia').onchange=function(){ if(per()) renderDias(); upd(); };
  var cop=$('#ceCopiar');
  if(cop) cop.onchange=function(){ var v=cop.value; if(v==='') return; var c=PLANTILLAS_M[+v]; if(!c) return;
    if(c.titulo && $('#ceTit')) $('#ceTit').value=c.titulo;
    ['ceModo','ceH0','ceH1','ceSlot','ceDura','ceND'].forEach(function(id){ if(c[id]!=null && $('#'+id)) nxPon(id, c[id]); });
    if(c.modalidad && $('#ceMod')) nxPon('ceMod', c.modalidad);
    nxPon('cePerdia', c.perdia ? '1' : '0'); if(per()) renderDias(); upd(); };
  var hints={publica:'Cualquiera puede tocar un hueco y ver quién puede en esa franja.',
    anonima:'El equipo ve el mapa de calor con los totales, sin nombres.',
    oculta:'El equipo no ve el mapa; solo tú, para decidir.'};
  var vision='anonima';
  $$('#ceVision button').forEach(function(b){
    b.onclick=function(){ $$('#ceVision button').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on'); vision=b.dataset.v; $('#ceHint').textContent=hints[vision]; }; });
  tipoUpd();
  /* crear: construye la reunión y la PERSISTE (api.crearReunion). Sin backend, queda local. */
  $('#btnCrearOK').onclick=async function(){
    var bt=$('#btnCrearOK'); if(bt.disabled) return;
    /* ⛔⛔ SIN ESTO SE CREABA UNA REUNION CON CERO INVITADOS, y una reunión sin lista la
       app se la enseña **a todo el equipo** con «te falta cubrir» — que es literalmente el
       daño que motivó el campo `invitado`: «se le reclamaba cubrir a todo el equipo una
       reunión de un invitado. Y de no cubrir salen sanciones». Se llega solo: «reunión de
       trabajo» tiene el preset vacío a propósito. El escritorio lo impide desde siempre;
       esta cara no, y el servidor tampoco lo mira. */
    if(!INV.size){ tost('No has convocado a nadie.'); return; }
    if(val('ceTipo')==='mixta'){ var _mb=_mixtaBloqueo_(Array.from(INV), YO&&YO.unidad); if(_mb){ tost(_mb); return; } }   // 04/11
    var ds=dias(); if(!ds.length){ tost('Revisa las fechas: no hay días.'); return; }
    var _sl=+val('ceSlot')||30, _du=+val('ceDura')||60;
    var u=_genUnion_(rangos(), _sl), bloques=[];
    u.perDia.forEach(function(idxs,d){ idxs.forEach(function(fi){ bloques.push([d,fi]); }); });
    if(!u.F.length || !bloques.length){ tost('Con ese horario no sale ninguna casilla.'); return; }
    /* ⛔ 01/11 (Daniel [4e2c13a995]): «si no se pudiese de verdad, obvio no se puede convocar». Antes se avisaba y se
       dejaba convocar con «pulsa otra vez»; ahora, si con este horario nadie puede llegar al mínimo (o nadie puede marcar),
       no se convoca y se dice con números. Los días cortos que NO impiden llegar sólo se avisan en la vista previa. */
    var _nS=_slotsMin_(_du,_sl);
    var _hz=_horarioConv_(u.perDia, rangos(), _nS, _sl, val('ceTipo'), _minimoConvPct_($('#ceMin'), val('ceLim')));
    if(_hz.bloqueo){ tost(_hz.bloqueo+' Cambia el horario o el mínimo.'); bt.disabled=false; return; }
    var lim=val('ceLim') ? (val('ceLim')+(val('ceLimH')?' '+val('ceLimH'):'')) : null;
    var reu={ titulo:(val('ceTit')||'').trim()||'Reunión sin título', tipo:val('ceTipo')||'trabajo',
      modalidad:val('ceMod')||'hibrida', convocante:(YO&&YO.nombre)||'', invitados:Array.from(INV),
      dias:ds, franjas:u.F, bloques:bloques, total:bloques.length, limite:lim,
      slot:_sl, duracion:_nS*_sl,          // lo que hay que juntar seguido para que valga
      minimoPct:(function(){ var c=$('#ceMin'); return (c && !c.hidden && +c.dataset.sel>0) ? +c.dataset.sel : null; })(),   // 01/11
      vision:vision, controlAsistencia:_controlAsisDeForm_('ceControl', val('ceTipo')), resp:{} };
    PLANTILLAS_M.unshift({ titulo:reu.titulo, ceModo:val('ceModo'), ceH0:val('ceH0'), ceH1:val('ceH1'),
      ceSlot:val('ceSlot'), ceDura:val('ceDura'), ceND:val('ceND'), modalidad:reu.modalidad, perdia:per() });
    if(PLANTILLAS_M.length>8) PLANTILLAS_M.length=8;
    /* 26/10 (auditor 33, 🟡 A2 — Daniel: «Sí, en nombre de X»): con «Ver como», se dice y se confirma. */
    var _enN=_avisoEnNombreDe_(reu.convocante); if(_enN && !(await dialogoSiNo(_enN+'\u00bfConvocarla?'))) return;
    bt.disabled=true; var prev=bt.textContent; bt.textContent='Convocando…';
    if(typeof backendOK!=='undefined' && backendOK && SESION){
      try{ var d=await api.crearReunion(reu); if(d&&d.id) reu.id=d.id;
        cerrarModal();
        tost('Reunión convocada · '+reu.invitados.length+' convocados, '+bloques.length+' bloques.');
        /* Se RECARGA la lista del servidor. Antes se llamaba a `pintar()` sin haber metido
           la reunion nueva en `REUNIONES_M`: se repintaba lo mismo de antes y parecia que
           no se habia creado. Y se recarga en vez de fabricar una copia local, que es como
           se acaba enseñando algo que en la nube no esta. */
        CARGA.reuniones=false; pintar();            // «cargando», no «no tienes»
        await _cargarReunionesM_();
        var _nueva=(REUNIONES_M||[]).filter(function(x){ return x.id===reu.id; })[0];
        if(_nueva){ REUNION=_nueva; await _hidratarReuM_(_nueva); }
        ST.vista='reu'; pintar();
      }catch(e){ bt.disabled=false; bt.textContent=prev; tostErr('No se pudo convocar: ', e); }
      return;
    }
    cerrarModal(); tost('Sin conexión: la reunión no se ha guardado.');
  };
}

function fijarModal(){
  var R=REUNION;
  abrirModal('<div class="mtit">Fijar la reunión</div>'+
    '<div class="msub">Elige el día y toca donde empieza: se marcan solas las '+
    (_largoFijar_(R)+' franjas que dura'+(R.duracion?' ('+_durTxt_(R.duracion)+')':'')+(_largoFijar_(R)>_slotsMin_(R.duracion,R.slot)?', las que pide su orden del día':'')+'. ')+
    'Puedes estirar hacia la derecha, no acortar. El resultado sale en verde en el mapa.</div>'+
    '<div class="campo"><span class="sc">Día</span>'+
      nxElige('fjDia', R.dias.map(function(d,i){return [String(i), _diaTxtM_(d)];}), '0')+'</div>'+
    '<span class="sc" style="display:block;margin-bottom:7px">Franjas de ese día</span>'+
    /* La hora de fin sale de la FRANJA, no de «la hora siguiente»: con slots de 15 o 30
       min, dar por hecho que cada franja dura una hora es sencillamente falso. */
    '<div class="pasos" id="fjSlots">'+R.franjas.map(function(f,i){
      return '<button data-k="'+i+'" data-p>'+_hFranja_(R,i)+'–'+_hFinFranja_(R,i)+'</button>';
    }).join('')+'</div>'+
    '<div class="sc" id="fjSel" style="margin:11px 0 0;color:var(--ok);font-size:12px"></div>'+
    '<button class="btn pri full" style="margin-top:13px" data-p id="btnFijarOK">Confirmar</button>');
  var anchor=-1,last=-1;
  /* EL MINIMO ES EL MISMO QUE AL CUBRIR. Una reunion de 1 h 30 con slots de 30 min ocupa
     TRES franjas, se este cubriendo o fijando: aqui se dejo el «toca la primera y la ultima»
     a pelo y se podia fijar en menos tiempo del que dura la reunion. (Daniel: «puse de 18:30
     a 20:00 y se marca como si fuera de 19:00 a 20:00».) */
  var MIN=_slotsMin_(R.duracion, R.slot), NF=R.franjas.length, SPAN=_largoFijar_(R);
  var pintaSlots=function(){
    var lo=anchor<0?-1:Math.min(anchor,last), hi=anchor<0?-1:Math.max(anchor,last);
    $$('#fjSlots button').forEach(function(b,k){
      var on=(k>=lo&&k<=hi);
      b.style.background=on?'rgba(62,180,137,.16)':''; b.style.borderColor=on?'var(--ok)':'';
      b.style.color=on?'var(--ok)':''; b.style.fontWeight=on?'700':'';
    });
    var s=$('#fjSel');
    if(s) s.textContent = lo<0 ? '' : ('Elegido: '+_hFranja_(REUNION,lo)+'–'+_hFinFranja_(REUNION,hi));
  };
  $$('#fjSlots button').forEach(function(b,k){
    /* Si desde aqui no caben las franjas que dura, no se puede empezar aqui. Se apaga en vez
       de dejar tocar y corregir despues: lo mismo que hace la rejilla de cubrir. */
    if(k+MIN>NF){ b.disabled=true; b.style.opacity='.35'; b.title='No caben '+MIN+' franjas seguidas desde aquí'; }
    b.onclick=function(){
      if(b.disabled) return;
      if(anchor<0 || anchor!==last){
        anchor=k; last=Math.min(NF-1, k+SPAN-1);     // un toque = lo que dura (la reunion o su orden del dia), hacia la derecha
      } else {
        /* estirar es libre, pero nunca por debajo del minimo */
        last = (k>=anchor) ? Math.max(k, anchor+MIN-1) : k;
        if(k<anchor){ anchor=k; last=Math.max(last, k+MIN-1); }
        if(last>NF-1) last=NF-1;
      }
      pintaSlots();
    };
  });
  $('#btnFijarOK').onclick=async function(){
    var b=$('#btnFijarOK'); if(b.disabled) return;
    if(anchor<0){ tost('Toca dónde empieza la reunión.'); return; }
    if(Math.abs(last-anchor)+1 < MIN){ tost('La reunión dura '+MIN+' franjas: no se puede fijar en menos.'); return; }
    var R2=REUNION, di=+$('#fjDia').value;
    var lo=Math.min(anchor,last), hi=Math.max(anchor,last);
    var etiqueta=_diaTxtM_(R2.dias[di])+' · '+_hFranja_(R2,lo)+'–'+_hFinFranja_(R2,hi);
    /* Los BLOQUES son lo que el mapa pinta en verde. Sin ellos solo quedaba el borde de
       «mejor franja», que significa otra cosa. */
    var bloques=[]; for(var f=lo; f<=hi; f++) bloques.push([di,f]);
    if(typeof backendOK==='undefined' || !backendOK || !SESION){
      tost('Sin conexión no se puede fijar.'); return; }
    /* 26/10 (auditor 33, 🟠 A1 — Daniel: «Avisar y confirmar»): con el plazo vivo, se avisa y se confirma. */
    var _avF=_avisoFijarAntes_(R2); if(_avF && !(await dialogoSiNo(_avF))) return;
    b.disabled=true; var prev=b.textContent; b.textContent='Fijando…';
    try{
      /* 21/10 (auditor 13, 🟡 11): al servidor, en índices ORIGINALES (como fija el escritorio); aquí, los de pantalla. */
      var _O=R2._franjaOrig||[], _ox=function(f){ return _O[f]===undefined ? f : _O[f]; };
      var _bloqSrv=bloques.map(function(x){ return [x[0], _ox(x[1])]; });
      await api.fijar(R2.id, {label:etiqueta, bloques:_bloqSrv, franjas:[_ox(lo),_ox(hi)]});
      R2.fijada=etiqueta; R2.fijadaBl=bloques;
      cerrarModal();
      tost('Reunión fijada: '+etiqueta+'. La disponibilidad queda cerrada.');
      pintar(); if(typeof _ordenTrasFijar_==='function') _ordenTrasFijar_(R2.id);   // refutar15: sus horas de reloj salen de la fijada
    }catch(e){ b.disabled=false; b.textContent=prev;
      tostErr('No se pudo fijar: ', e); }
  };
}



/* ══ LA ASISTENCIA EN DIRECTO DE LAS GENERALES — la TARJETA del móvil (31/10) ═══════════════════════════════
   🗣️ Daniel: «Simplemente tienen que abrirla, darle al botón estoy presente […] poner una palabra en el cuadrito». Si una
   general tuya tiene la asistencia abierta, sale ARRIBA de Estado «Estás en la general: escribe la palabra que se proyecta»;
   al abrir la app con ella abierta se avisa UNA vez (`marcarVisto`: así se ilumina tu cuadrito en el escenario del PD).
   El servidor decide si estás convocado y nunca manda la palabra: aquí sólo se teclea. */
var ASIS_M={est:{}, visto:{}, txt:{}, msg:{}, demo:false};   // est[id] = {titulo, v}; msg[id] = el último aviso (sobrevive al repintado)

/* De la lista cruda de `listarReuniones`: las que traen `asistencia_abierta`. Las que ya no, se quitan. */
function _asisDeListaM_(arr){
  var abiertas={};
  (arr||[]).forEach(function(r){ if(r && r.id!=null && r.asistencia_abierta) abiertas[r.id]=r; });
  Object.keys(ASIS_M.est).forEach(function(id){ if(!abiertas[id]) delete ASIS_M.est[id]; });
  Object.keys(abiertas).forEach(function(id){ _asisChequearM_(abiertas[id]); });
  if(!Object.keys(abiertas).length) _asisPintarM_();
}

async function _asisChequearM_(r){
  var id=r.id;
  try{
    var v=await api.getAsistencia(id, false);
    if(v && v.abierta && v.convocado){
      ASIS_M.est[id]={titulo:r.titulo||'la reunión', v:v};
      if(!ASIS_M.visto[id]){ ASIS_M.visto[id]=true; api.marcarVisto(id).catch(function(){}); }
    } else delete ASIS_M.est[id];
  }catch(e){ /* sin red o sin sesión: la tarjeta simplemente no sale */ }
  _asisPintarM_();
}

function _asisTarjetaHTML_(id, e){
  var v=e.v, hecho=v.presente_at;
  return '<div class="tarj acc" data-asisreu="'+esc(id)+'"><div class="tt"><span class="sc">Asistencia en directo</span></div>'+
    '<b style="display:block;margin-bottom:6px">Estás en «'+esc(e.titulo||'la reunión')+'»: '+(hecho?'ya constas presente':'escribe la palabra de tu modalidad')+'</b>'+
    (hecho
      ? '<div class="asisOk">'+ico('tick')+' Presente ('+esc(_hhmmDe_(hecho))+')</div>'
      : '<div style="display:flex;gap:8px"><input class="asisIn" data-asispal autocomplete="off" autocapitalize="none" '+
        'placeholder="la palabra" value="'+esc(ASIS_M.txt[id]||'')+'">'+
        '<button class="btn pri" data-p data-asisok>Estoy presente</button></div>')+
    '<div class="rnota" data-asismsg style="margin:6px 0 0;min-height:1em">'+esc(ASIS_M.msg[id]||'')+'</div></div>';
}

/* El HTML de las tarjetas abiertas (o ''). Se cablea tras insertarse, con el truco de `_audioReuHTML_`. */
function _asisTarjetaM_(){
  if(_demoLocal_() && !ASIS_M.demo){ ASIS_M.demo=true;
    _asisDeListaM_([{id:9001, titulo:'Reunión General de octubre', tipo:'general', asistencia_abierta:true}]); }
  var h=Object.keys(ASIS_M.est).map(function(id){ return _asisTarjetaHTML_(id, ASIS_M.est[id]); }).join('');
  if(h) setTimeout(_asisCablearM_,0);
  return h;
}

function _asisCablearM_(){
  Array.prototype.forEach.call(document.querySelectorAll('[data-asisreu]'), function(t){
    var id=t.getAttribute('data-asisreu'), i=t.querySelector('[data-asispal]'), b=t.querySelector('[data-asisok]'),
        m=t.querySelector('[data-asismsg]');
    if(!i || !b) return;
    i.oninput=function(){ ASIS_M.txt[id]=i.value; };
    /* 03/11: el aviso se guarda en ASIS_M.msg y lo vuelve a pintar `_asisTarjetaHTML_`: un refresco de Estado rehacía la
       tarjeta y lo borraba a los pocos milisegundos (lo cazó `probar_asistencia_app` saliendo rojo a ratos). */
    var aviso=function(t){ ASIS_M.msg[id]=t; if(m) m.textContent=t; };
    var enviar=async function(){
      if(b.disabled) return;
      if(!i.value.trim()){ aviso('Escribe la palabra (la presencial, en el encerado; la telemática, por voz o por chat).'); return; }   /* un botón que no contesta parece roto */
      b.disabled=true;
      try{
        var r=await api.estoyPresente(isNaN(+id)?id:+id, i.value);
        ASIS_M.est[id].v.presente_at=(r&&r.presente_at)||new Date().toISOString(); delete ASIS_M.msg[id];
        _asisPintarM_(); tost('Presente: apuntado.');
      }catch(e){ aviso(String((e&&e.message)||e).replace(/^Error:\s*/,'')); b.disabled=false; }
    };
    b.onclick=enviar;
    i.onkeydown=function(ev){ if(ev.key==='Enter') enviar(); };
  });
}

/* ══ 01/11 · LA ASISTENCIA, DESDE EL MÓVIL DEL PD ═══════════════════════════════════════════════════════════
   🗣️ Daniel: *«que sea editable fácilmente desde el teléfono mientras en mi ordenador se ve esa pantallita ya que a veces la gente
   resulta que puede venir de improviso»*. El escenario sigue siendo del escritorio (lo que se proyecta); aquí, el mando: abrir y
   cerrar, ver la palabra, **tocar a alguien para marcarlo presente (o quitarlo)** y **añadir** a quien llega sin estar en la lista
   — se añade y queda presente de un gesto. Una general, la abre el PD; también una telemática. El que vino por telemático sale en
   azul (`modos`, del servidor). La lista se refresca cada 3 s mientras el panel está abierto. */
var ASIS_PM=null;   // {id, v, timer, ocupado}

/* Quién soy para abrir/cerrar la asistencia y finalizar: la SESIÓN (el servidor gatea por token), o `YO` en la maqueta. */
function _asisYoM_(){
  return (typeof SESION!=='undefined' && SESION && SESION.nombre) || (typeof YO!=='undefined' && YO && YO.nombre) || '';
}
/* ¿Sale el botón? En cualquier reunión de verdad (con servidor, o en `?demo`) y a quien la gestiona: su convocante, el PD o el admin
   (`_puedeBloqueReu_`, la regla del servidor). 04/11: ya no es sólo de las generales ni sólo del PD. */
function _asisBotonM_(R){
  return !!R && R.id!=null && _controlAsistencia_(R) && _puedeBloqueReu_(R, _asisYoM_(), (typeof esAdmin==='function' && !!esAdmin())) &&
    (_demoLocal_() || (typeof backendOK!=='undefined' && backendOK && !!R._real));
}

function _asisFilaM_(n, v){
  var pres=(v.presentes||{})[n], vis=(v.vistos||{})[n], tel=pres && _asisModo_(v, n)==='tel';
  var col=pres ? (tel?'var(--tel)':'var(--ok)') : (vis ? 'var(--warn)' : 'var(--line2)');
  return '<button type="button" class="asisFM" data-asisn="'+esc(n)+'" data-p style="display:flex;width:100%;align-items:center;gap:10px;min-height:44px;'+
    'margin:0 0 6px;padding:8px 12px;border-radius:12px;text-align:left;font:inherit;color:var(--ink);cursor:pointer;background:'+
    (pres ? (tel?'rgba(63,158,214,.18)':'rgba(62,180,137,.18)') : 'var(--sur)')+';border:1px solid '+col+'">'+
    '<b style="flex:1;font-weight:600">'+esc(n)+'</b><span class="mono" style="font-size:11px;color:'+col+'">'+
    (pres ? (ico('tick')+' '+esc(_hhmmDe_(pres))+(tel?' · telemático':'')) : (vis?'ha abierto la app':'toca para marcar'))+'</span></button>';
}

function _asisPanelHTMLM_(){
  var A=ASIS_PM, v=A&&A.v; if(!v) return '<p class="rnota">Cargando…</p>';
  var cu=_asisCuenta_(v), conv=v.convocados||[];
  if(!v.existe) return '<p class="rnota" style="margin:0 0 10px">Aún no se ha abierto la asistencia de esta reunión.</p>'+
    (A.fin ? '<p class="rnota">La reunión está finalizada: ya no se abre.</p>' : '<button class="btn pri full" data-p data-asisabrirm>Mostrar la palabra</button>');
  /* 04/11: una palabra por modalidad — la presencial, para el encerado; la telemática, por voz o por chat (👤 Daniel). */
  var cab=v.abierta
    ? _asisPalabras_(v).map(function(w){
        return '<div style="text-align:center;margin:2px 0 8px">'+(w.rot?'<div class="rnota" style="margin:0 0 2px;color:'+(w.modo==='tel'?'var(--tel)':'var(--ink2)')+'">'+esc(w.rot)+
          (w.modo==='tel'?' · díctala o ponla en el chat':' · al encerado')+'</div>':'')+
          '<div class="asisPalM" data-asispal="'+esc(w.modo)+'" style="font-size:34px;font-weight:700;letter-spacing:.04em">'+esc(w.pal||'')+'</div></div>'; }).join('')
    : '<p class="rnota" style="margin:0 0 6px">Asistencia cerrada: puedes corregir la lista.</p>';
  return cab+'<p class="rnota" data-asiscuenta style="text-align:center;margin:0 0 10px"><b>'+cu.presentes+'</b> de '+cu.convocados+' presentes'+
    (cu.tel?' · <span style="color:var(--tel)">'+cu.tel+' por telemático</span>':'')+'</p>'+
    conv.map(function(n){ return _asisFilaM_(n, v); }).join('')+
    '<div style="margin-top:10px">'+elegirPersonas('asisQuienM', {universo:_activos_().map(function(m){ return m.nombre; }).filter(function(n){ return conv.indexOf(n)<0; }),
      multi:false, titulo:'Llega alguien que no está en la lista', vacio:'Escribe un nombre.'})+
    '<button class="btn full" data-p data-asisanadirm style="margin-top:8px">Añadir y marcar presente</button></div>'+
    '<div style="display:flex;gap:8px;margin-top:10px">'+
    (v.abierta?'<button class="btn" data-p data-asiscerrarm style="flex:1">Cerrar asistencia</button>':(A.fin?'':'<button class="btn" data-p data-asisreabrirm style="flex:1">Reabrir</button>'))+
    '<button class="btn" data-p data-asiscopiarm style="flex:1">Copiar la lista</button></div>';
}

async function _asisRefrescarM_(){
  var A=ASIS_PM; if(!A || A.ocupado) return;
  var _pn=document.querySelector('[data-asispanelm]');
  if(!_pn || !_pn.offsetParent){ _asisSalirM_(); return; }      // el panel se cerró (o se ocultó): se acaba el refresco
  A.ocupado=true;
  try{
    var v=await api.getAsistencia(A.id, true); if(ASIS_PM!==A) return;
    A.v=v; _asisPintarPanelM_();
  }catch(e){ /* un fallo suelto no lo tumba: el siguiente ciclo lo recupera */ }
  finally{ A.ocupado=false; }
}
function _asisSalirM_(){ if(ASIS_PM && ASIS_PM.timer) clearInterval(ASIS_PM.timer); ASIS_PM=null; }

function _asisPintarPanelM_(){
  var c=document.querySelector('[data-asispanelm]'), A=ASIS_PM; if(!c || !A) return;
  var esc_=document.querySelector('[data-psel-in="asisQuienM"]'), tecleado=esc_?esc_.value:'', foco=document.activeElement===esc_;
  c.innerHTML=_asisPanelHTMLM_();
  var inp=document.querySelector('[data-psel-in="asisQuienM"]'); if(inp && tecleado){ inp.value=tecleado; if(foco) inp.focus(); }
  var on=function(sel, f){ var b=c.querySelector(sel); if(b) b.onclick=async function(){ if(b.disabled) return; b.disabled=true;
    try{ await f(); }catch(e){ tostErr('No se pudo: ', e); } finally{ b.disabled=false; } }; };
  on('[data-asisabrirm]', async function(){ await api.abrirAsistencia(A.id); await _asisRefrescarM_(); });
  on('[data-asiscerrarm]', async function(){ await api.cerrarAsistencia(A.id); await _asisRefrescarM_(); });
  on('[data-asisreabrirm]', async function(){ await api.abrirAsistencia(A.id); await _asisRefrescarM_(); });
  on('[data-asisanadirm]', async function(){
    var i2=document.querySelector('[data-psel-in="asisQuienM"]');
    var n=(elegirPersonasMarcadas('asisQuienM')[0]||(i2?i2.value:'')).trim(); if(!n) return;
    if(i2) i2.value='';                      // ya está: el campo se vacía ANTES de refrescar (el refresco conserva lo tecleado)
    await api.marcarPresente(A.id, n, true); await _asisRefrescarM_(); tost(n+': presente.'); });
  on('[data-asiscopiarm]', async function(){
    var t=_asisListaTxt_(A.v);
    try{ await navigator.clipboard.writeText(t); tost('Lista copiada.'); }catch(_){ tost('No se pudo copiar.'); } });
  Array.prototype.forEach.call(c.querySelectorAll('[data-asisn]'), function(b){
    b.onclick=async function(){                // un toque: marca o quita (llega de improviso, o se equivocó)
      var n=b.getAttribute('data-asisn'); if(b.disabled) return; b.disabled=true;
      try{ await api.marcarPresente(A.id, n, !((A.v.presentes||{})[n])); await _asisRefrescarM_(); }
      catch(e){ tostErr('No se pudo: ', e); } finally{ b.disabled=false; } };
  });
}

function _asisAbrirPanelM_(R){
  _asisSalirM_();
  ASIS_PM={id:R.id, v:null, timer:null, ocupado:false, fin:_reuFinalizada_(R)};
  abrirModal('<div class="mtit">Asistencia en directo</div><div class="msub">'+esc(R.titulo||'')+'</div><div data-asispanelm><p class="rnota">Cargando…</p></div>');
  _asisRefrescarM_();
  ASIS_PM.timer=setInterval(_asisRefrescarM_, 3000);
}

/* Repinta SÓLO las tarjetas (no la vista entera: perdería lo que estás tecleando). Si no había y ahora sí, o al revés, la
   vista entera, una vez. */
function _asisPintarM_(){
  var hay=document.querySelectorAll('[data-asisreu]').length, debe=Object.keys(ASIS_M.est).length;
  if(hay!==debe){ if(typeof _repintarSuave_==='function') _repintarSuave_(); return; }
  Array.prototype.forEach.call(document.querySelectorAll('[data-asisreu]'), function(t){
    var id=t.getAttribute('data-asisreu'), e=ASIS_M.est[id];
    if(e && e.v.presente_at && !t.querySelector('.asisOk')) t.outerHTML=_asisTarjetaHTML_(id, e);
  });
}
