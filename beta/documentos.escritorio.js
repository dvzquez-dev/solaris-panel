/* ═══ DOCUMENTOS · cara escritorio ═══════════════════════════════════════════════════════════
   10 funciones sacadas de `escritorio.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

function revisoresDe(d){
  /* ⛔ EL `else` ES EL PD, NO EL COORDINADOR, y es lo que dice el SERVIDOR
     (`Codigo.gs`: `archivo -> coordinador · subsistema -> [PD,JOSE] · ELSE -> PD`).
     Aqui estaba al reves: un `ambito` no canonico se le ofrecia al COORDINADOR --que
     pulsa Aprobar y se come «sin permiso para decidir»-- y se escondia del PD, que es
     el unico que el servidor aceptaria. El expediente se quedaba parado sin que nadie
     supiera por que.
     ⚠️ Y `archivo` pasa a ser EXPLICITO: un `else` que reparte autoridad es como se
     cuela un ambito nuevo en el reparto equivocado sin que nadie lo decida. */
  var r = d.amb==='archivo' ? [coordinadorDe(d.sub)]
        : d.amb==='subsistema' ? [PD_NOM,REV2_NOM]
        : [PD_NOM];
  r=r.filter(function(n){return n!==d.autor;});
  if(!r.length) r=[PD_NOM,REV2_NOM].filter(function(n){return n!==d.autor;});
  if(!r.length) r=[PD_NOM];
  return r;
}

/* El backend sirve el entregable con SU forma (titulo, ambito, estado, severidad,
   issues[], subsistema) y estas vistas leen la corta (tit, amb, est, sev, iss, sub).
   Sin este adaptador la bandeja salia vacia y las filas sin titulo. Ojo: `iss` es una
   CUENTA, no la lista, porque la vista escribe «N avisos». */
function _normDocE_(d, i){
  if(!d) return d;
  if(d.tit!==undefined && d.est!==undefined) return d;      // ya viene corta (semilla)
  var iss = Array.isArray(d.issues) ? d.issues.length : (+d.issues||0);
  return {
    id:      (d.id!==undefined ? d.id : i),
    ref:     d.ref || '',
    tit:     d.titulo || d.tit || d.ref || '',
    autor:   d.autor || '',
    sub:     d.subsistema || d.sub || '',
    tipo:    d.tipo || '',
    amb:     d.ambito || d.amb || '',
    est:     d.estado || d.est || '',
    /* ⛔ `null` = «no lo se». Aqui se fabricaba `'baja'` por SEGUNDA vez -el backend ya
       lo hacia-, y `CAL_DOC` traduce `baja` a **«alta»**: el `'sin medir'` que `calDoc`
       ya tenia escrito era **inalcanzable** por el camino del defecto. */
    sev:     d.severidad || d.sev || null,
    iss:     iss,
    avisos:  Array.isArray(d.issues) ? d.issues : [],        // la lista, para leerlos
    resumen: d.resumen || '',
    fecha:   d.fecha || '',
    /* Lo que el backend mandaba y esta cara tiraba a la basura: sin `analisis` no hay
       proposito ni riesgos que leer, sin `nota` no se ve por que se pidieron cambios, y
       sin `revisor` no se puede saber si ya decidio alguien ni si puedes pisarlo. */
    analisis:  d.analisis || null,
    nota:      d.nota || '',
    revisor:   d.revisor || null,
    decision:  d.decision || null,
    /* ⛔ EL RESPALDO DE LA FIRMA. `_firmaDocTxt_` prefiere `decision.at` y cae a
       `decidedAt`; sin copiarlo aqui, los expedientes decididos ANTES de que existiera
       `decision` se quedaban sin CUANDO en esta cara y con el en la otra — la asimetria
       que cada cara, leida por separado, parece correcta. */
    decidedAt: d.decidedAt || null,
    etiquetas: d.etiquetas || [],
    sustituye: d.sustituyeA || null,
    bloqueo: d.bloqueo || null,
    drive:   d.enlaceDrive || null,
    notion:  d.paginaNotion || null,
    _crudo:  d
  };
}

function docsMios(){return DOCS.filter(function(d){return d.est==='revision' && revisoresDe(d).indexOf(ACTOR)>=0;});}

function calDoc(sev){ return 'calidad '+(CAL_DOC[sev]||'sin medir'); }

function ambDoc(a){ return AMB_DOC[a]||String(a||'—'); }

/* GEMELA de `puedeDecidirDoc` del movil y de `_puedeDecidir_` del backend: nadie firma
   lo suyo, el primero que decide bloquea a sus iguales, y solo alguien de MAS rango
   puede pisar esa decision. La fila solo miraba `est==='revision'`, asi que una vez
   decidido no habia forma de corregir un error desde aqui. */

/* ⛔ «Ha pasado el analisis» en UNA sola puerta: lo miran el boton y -en el servidor- el
   guardia que de verdad publica. Dos formas de preguntar lo mismo acaban contestando
   distinto, y aqui la diferencia es publicar un documento que nadie ha leido. */
function _yaAnalizado_(d){
  var e = d && (d.est || d.estado);
  return e !== 'recibido' && e !== 'analizado';
}

/* EQUIVALENTE (no GEMELA) — y la diferencia es REGLA DE PRODUCTO, no un descuido.
   Daniel (05/08): «en telefono solo se puede checkear los documentos tuyos pendientes de
   revision o los que tienes tu pendientes de revisar; no aparecen hasta que esten
   completamente analizados y listos con el link bien embebido».
   Por eso el MOVIL decide solo en `revision` -es lo unico que llega a ver- y el ESCRITORIO
   tambien en `recibido` y `analizado`, donde se ve el pipeline entero. Los campos tambien
   difieren (`e.estado` / `d.est`) porque cada cara consume su propia forma del dato. */
function puedeDecidirDoc(d){
  if(!d || d.autor===ACTOR) return false;
  var rev=revisoresDe(d), maxR=Math.max.apply(null,rev.map(rangoNom));
  if(rev.indexOf(ACTOR)<0 && rangoNom(ACTOR)<=maxR) return false;
  if(['revision','recibido','analizado'].indexOf(d.est)>=0) return true;
  return d.revisor===_m(ACTOR).pila || rangoNom(ACTOR)>rangoPila(d.revisor);
}

function filaDoc(d){
  if(DOC_SEL===d.id) return docCard(d);
  var rev=revisoresDe(d).map(function(n){return _m(n).pila;}).join(' o ');
  var st=estDoc(d.est), mio=puedeDecidirDoc(d) && d.est==='revision';
  return '<div class="dec" id="doc-'+d.id+'" data-docsel="'+d.id+'">'+
    '<span class="ic"><svg><use href="#i-doc"/></svg></span>'+
    '<span class="tx"><b>'+esc(d.tit)+'</b><small><span class="mono">'+esc(d.ref)+'</span> · '+
      esc(_m(d.autor).pila)+' · '+ambDoc(d.amb)+' · firma '+esc(rev)+
      (d.iss?' · '+d.iss+' aviso'+(d.iss===1?'':'s'):'')+'</small></span>'+
    '<span class="der">'+
      (mio?'<span class="chip wa">te toca</span>':'')+
      /* ⛔ SIN CLASE = NEUTRO. El `else` era `'ok'` -verde-, asi que «calidad sin
         medir» se pintaba con el mismo chip que «calidad alta»: quien mira una lista
         de expedientes de reojo lee el COLOR, no el texto. */
      '<span class="chip '+(d.sev==='alta'?'no':d.sev==='media'?'wa':d.sev==='baja'?'ok':'')+'">'+calDoc(d.sev)+'</span>'+
      '<span class="chip '+st[1]+'">'+st[0]+'</span><span class="chev">›</span>'+
    '</span></div>';
}

/* EL EXPEDIENTE ENTERO, que es lo que hay que leer antes de firmar: resumen ejecutivo,
   analisis, avisos de calidad, la ultima decision con su motivo, el documento de Drive
   incrustado, y las cuatro palabras clave del correo real -aprobar, aprobar con
   anotaciones, solicitar cambios, rechazar- mas deshacer y reenviar. */
/* La DECISION ANTERIOR de un expediente, tal y como la ve el revisor sin desplegar nada: es
   lo que hay que juzgar para decidir si se pisa. `''` si todavia no hay ninguna.

   ⛔ SALE DE `d.decision`, NO RECONSTRUIDA DEL ESTADO. Aqui se deducia de `d.est` y `d.revisor`,
      y asi se perdian las dos cosas que hacen falta para juzgarla: el **cuando** (`decision.at`,
      que el backend guarda desde siempre) y los **ajustes** de un «con anotaciones» —o sea, QUE
      titulo y QUE etiquetas cambio el revisor anterior—. Ademas `d.est` **no puede** distinguir
      `aprobado` de `anot`: `Codigo.gs:993` deja los dos en `publicado`.
   ⛔ Y decia «Sin motivo escrito.» sobre un APROBADO, que no es una omision: es una afirmacion
      FALSA. Un aprobado no lleva motivo **por diseño** —`Codigo.gs:993` pone `nota=null`—, asi
      que eso se lee como que alguien se lo dejo sin escribir y manda a buscar una explicacion
      que nunca existio.
   ⛔ Y ES UNA FUNCION APARTE PARA PODER EJECUTARLA: `docCard` monta ademas el visor, el analisis
      y las cuatro acciones, asi que ningun banco la corre — y una mutacion sobre esto saldria
      CIEGA. Extraida, el arnes la ejercita en dos lineas.
   ⚠️ `st` se RECIBE, no se recalcula: `docCard` ya lo tiene, y una segunda copia del mapa de
      estados es justo el fallo que `estDoc` vino a cerrar. */
function _previaDocE_(d, st){
  if(!d) return '';
  var acc=(typeof _accionDocTxt_==='function')?_accionDocTxt_(d.decision&&d.decision.accion):'';
  var aju=(typeof _ajustesDocTxt_==='function')?_ajustesDocTxt_(d):'';
  var fir=(typeof _firmaDocTxt_==='function')?_firmaDocTxt_(d):'';
  var rot=(st&&st[0])||'';
  if(!(d.est==='cambios'||d.est==='rechazado'||d.revisor)) return '';
  return '<div class="just" style="border-left-color:var(--warn)"><span class="sc">'+
    (fir?('decidió '+esc(fir)):'última decisión')+' · '+esc(acc||rot)+'</span>'+
    (d.nota ? esc(d.nota) : (acc==='Aprobado' ? 'Aprobado sin anotaciones.' : ''))+
    (aju?'<br><span class="sc">Ajustó: '+esc(aju)+'</span>':'')+'</div>';
}

/* Los mismos avisos con la marca del escritorio. Mismo motivo que en el móvil para que
   sea una función suelta: `docCard` no la ejecuta ningún banco. El CRITERIO no se repite —
   sale de `_avisosDoc_`—; aquí sólo cambia la envoltura, que es lo único que difiere de
   verdad entre las dos caras. */
function _avisosDocE_(d){
  var xs = (typeof _avisosDoc_==='function') ? _avisosDoc_(d) : [];
  return xs.map(function(a){
    return '<div class="just" style="border-left-color:var(--warn)"><span class="sc">'+
           esc(a.t)+'</span>'+esc(a.d)+'</div>';
  }).join('');
}

/* Los mismos dos pasos con la marca del escritorio. Daniel (18/08): las instrucciones van en
   las DOS caras —«movil y escrityorio, recuerda q escritorio solo la tiene el consejo»—. */
function _pasosCorregirE_(d){
  var ps = (typeof _pasosCorregirDoc_==='function')
    ? _pasosCorregirDoc_({estado:d && d.est, ref:d && d.ref}) : [];
  if(!ps.length) return '';
  return '<div class="just" style="border-left-color:var(--warn)">'+
    '<span class="sc">Para corregirlo son dos pasos, en este orden</span>'+
    'El botón de abajo <b>no sube nada</b>: sólo devuelve el expediente a la cola de revisión.'+
    '<ol class="obj" style="margin:6px 0 0;padding-left:20px">'+
    ps.map(function(p){
      return '<li style="margin-bottom:5px"><b>'+esc(p.t)+'</b>'+
        (p.url ? ' — <a href="'+esc(p.url)+'" target="_blank" rel="noopener">abrir el formulario</a>'
               : '')+
        '<br><span class="sc">'+esc(p.d)+'</span></li>';
    }).join('')+'</ol></div>';
}

function docCard(d){
  var revs=revisoresDe(d), rev=revs.map(function(n){return _m(n).pila;}).join(' o ');
  var puede=puedeDecidirDoc(d), st=estDoc(d.est), an=d.analisis||null, secs='';
  var lista=function(t,xs){ return (xs&&xs.length)
    ? '<div class="sub"><span class="sc">'+t+'</span><ul class="obj">'+
      xs.map(function(v){return '<li>'+esc(v)+'</li>';}).join('')+'</ul></div>' : ''; };
  if(an){
    if(an.proposito) secs+='<div class="sub"><span class="sc">Propósito</span>'+
      '<p style="margin:4px 0 0;font-size:12.5px;color:var(--ink2);line-height:1.6">'+esc(an.proposito)+'</p></div>';
    /* Mismo motivo que en el móvil: la lista vive en `_seccionesAnalisis_`. Aquí eran
       cuatro `lista(…)` encadenados a mano, y les faltaban las dos mismas. */
    _seccionesAnalisis_(an).forEach(function(x){ secs+=lista(x[0], x[1]); });
    var _cnt=_conteosDoc_(an);
    if(_cnt) secs+='<div class="sub"><span class="sc">En números</span>'+
      '<p style="margin:4px 0 0;font-size:12px;color:var(--ink3)">'+esc(_cnt)+'</p></div>';
  }
  var avisos = (d.avisos&&d.avisos.length) ? lista('Avisos de calidad · '+d.avisos.length, d.avisos)
    : (d.iss ? '<div class="sub"><span class="sc">Calidad</span><p style="margin:4px 0 0;font-size:12px;'+
        'color:var(--ink3);line-height:1.55">'+d.iss+' aviso'+(d.iss===1?'':'s')+' de calidad, sin detalle. '+
        'Los manda Cowork con el expediente.</p></div>' : '');
  var previa = _previaDocE_(d, st);
  var idD=_idDrive_(d.drive);
  var visor = d.drive
    /* Nace ABIERTO, igual que en el movil: esta ficha existe para leer el archivo antes de
       decidir. Y con pantalla completa, que era lo que faltaba aqui y estaba en otro sitio. */
    ? _visorHTML_({id:idD, url:d.drive, titulo:'El documento', sub:d.ref,
                   queEs:'el documento', plegado:false})
    : '<div class="doc"><div class="dcar">Este expediente no trae enlace al archivo.<br>'+
      'Cowork lo manda en <span class="mono">enlaceDrive</span>; sin él no hay nada que leer aquí.</div></div>';
  var acc;
  if(puede){
    acc='<label style="display:block;margin-top:11px">'+
      '<span class="sc" style="display:block;margin-bottom:5px">Título · puedes corregirlo al aprobar con anotaciones</span>'+
      '<input id="dtit-'+d.id+'" value="'+esc(d.tit)+'" style="'+CAMPO_CSS+'"></label>'+
      '<label style="display:block;margin-top:9px">'+
      '<span class="sc" style="display:block;margin-bottom:5px">Etiquetas · separadas por comas</span>'+
      '<input id="detq-'+d.id+'" value="'+esc(_etiquetasDe_(d).join(', '))+'" style="'+CAMPO_CSS+'"></label>'+
      '<textarea data-motivo placeholder="Motivo — obligatorio para pedir cambios o rechazar. Lo lee el autor…"></textarea>'+
      /* ⛔⛔ APROBAR = PUBLICAR, y no se publica lo que nadie ha analizado. Esta cara ve
         `recibido` y `analizado` a proposito -Daniel, 05/08: en el movil «no aparecen
         hasta que esten completamente analizados»; aqui se ve el pipeline entero-, pero
         VER no es APROBAR: eso ultimo era una deduccion que nadie tomo, y el servidor la
         aceptaba. Se publicaba un expediente sin analizar y, muchas veces, **sin fichero
         que leer** -lo dice la propia ficha dos lineas mas arriba-.
         ⚠️ «Solicitar cambios» y «Rechazar» siguen ahi: son la forma legitima de parar
         algo que viene mal, y ninguno de los dos publica nada. */
      '<div class="acts">'+
        (_yaAnalizado_(d)
          ? '<button class="btn pri" data-doc="'+d.id+'" data-acc="aprobado">Aprobar</button>'+
            '<button class="btn" data-doc="'+d.id+'" data-acc="anot">Aprobar con anotaciones</button>'
          : '<span class="sc" style="align-self:center">A\u00fan sin analizar: se puede parar, no publicar.</span>')+
        '<button class="btn" data-doc="'+d.id+'" data-acc="cambios">Solicitar cambios</button>'+
        '<button class="btn no" data-doc="'+d.id+'" data-acc="rechazado">Rechazar</button>'+
        (d.est!=='revision'&&d.revisor?'<button class="btn" data-doc="'+d.id+'" data-acc="deshacer">Deshacer y devolver a revisión</button>':'')+
      '</div>';
  } else if(d.autor===ACTOR && d.est==='cambios'){
    /* ⛔ Mismo rotulo mentiroso que en el movil: el boton no sube nada.
       ⚠️ Y el escritorio nombra el estado `est`, no `estado`: por eso `_pasosCorregirE_`
       traduce antes de preguntar. Pasarle el objeto crudo daria SIEMPRE lista vacia --
       instrucciones escritas, probadas y mudas en una cara entera. */
    acc=_pasosCorregirE_(d)+'<div class="acts"><button class="btn pri" data-doc="'+d.id+'" data-acc="reenviar">Ya está corregido: devolver a revisión</button></div>';
  } else if(d.autor===ACTOR){
    acc='<div class="ruta">Es tuyo: lo firma <b>'+esc(rev)+'</b>. Nadie decide lo suyo, tampoco tú.</div>';
  } else if(d.revisor){
    acc='<div class="ruta">Ya lo decidió <b>'+esc(d.revisor)+'</b>. Puedes consultarlo; para cambiar la '+
      'decisión hace falta más rango que quién la tomó.</div>';
  } else {
    acc='<div class="ruta">Lo firma <b>'+esc(rev)+'</b>, no tú.</div>';
  }
  return '<div class="parte" id="doc-'+d.id+'">'+
    '<div class="h"><b>'+esc(d.tit)+'</b>'+
      '<span class="u">'+esc(d.ref)+'</span>'+
      '<span class="u">'+esc(d.tipo||'documento')+'</span>'+
      '<button class="btn sm" style="margin-left:auto" data-docsel="">Cerrar</button></div>'+
    '<div class="pils">'+
      '<span class="chip">'+esc(_m(d.autor).pila)+' · '+esc(d.sub||'—')+'</span>'+
      '<span class="chip">'+ambDoc(d.amb)+'</span>'+
      '<span class="chip '+st[1]+'">'+st[0]+'</span>'+
      /* ⛔ SIN CLASE = NEUTRO. El `else` era `'ok'` -verde-, asi que «calidad sin
         medir» se pintaba con el mismo chip que «calidad alta»: quien mira una lista
         de expedientes de reojo lee el COLOR, no el texto. */
      '<span class="chip '+(d.sev==='alta'?'no':d.sev==='media'?'wa':d.sev==='baja'?'ok':'')+'">'+calDoc(d.sev)+'</span>'+
      (d.fecha?'<span class="chip">'+esc(d.fecha)+'</span>':'')+
      /* Mismo motivo que en el móvil: verlas no es decidir. */
      (_etiquetasDe_(d).length
        ? '<span class="chip">'+esc(_etiquetasDe_(d).join(' · '))+'</span>' : '')+
    '</div>'+
    _avisosDocE_(d)+
    '<div class="just"><span class="sc">Resumen ejecutivo</span>'+
      esc(d.resumen||'El expediente llegó sin resumen. Léelo abajo antes de firmar.')+'</div>'+
    previa+secs+avisos+visor+
    '<div class="ruta" style="margin-top:11px">'+(puede?'Lo firmas tú.':'Firma: <b>'+esc(rev)+'</b>')+
      ' · Decidir aquí sustituye a contestar el correo de aprobación.</div>'+
    acc+
  '</div>';
}

/* LAS ACTAS SON EXPEDIENTES, no una tabla aparte. Aqui habia tres filas escritas a mano
   con referencias inventadas. Y el dato ya estaba en casa: el Form del pipeline tiene
   `Acta` como Tipo de documento y la referencia es `Acta_S-6301_26`, asi que la lista de
   actas es un FILTRO sobre los expedientes que esta cara ya carga. */
function _esActa_(d){
  /* Por el tipo si viene; si no, por el prefijo de la referencia, que lo lleva siempre.
     Los expedientes viejos pueden no traer `tipo` y la referencia nunca falta. */
  return /^acta$/i.test(String(d.tipo||'')) || /^Acta_/i.test(String(d.ref||''));
}

