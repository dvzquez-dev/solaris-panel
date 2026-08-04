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
  var r = d.amb==='general' ? [PD_NOM] : d.amb==='subsistema' ? [PD_NOM,REV2_NOM] : [coordinadorDe(d.sub)];
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
    sev:     d.severidad || d.sev || 'baja',
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
function rangoPila(pila){ for(var i=0;i<DATA.miembros.length;i++)
  if(DATA.miembros[i].pila===pila) return rangoNom(DATA.miembros[i].nombre); return 0; }

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
      '<span class="chip '+(d.sev==='alta'?'no':d.sev==='media'?'wa':'ok')+'">'+calDoc(d.sev)+'</span>'+
      '<span class="chip '+st[1]+'">'+st[0]+'</span><span class="chev">›</span>'+
    '</span></div>';
}

/* EL EXPEDIENTE ENTERO, que es lo que hay que leer antes de firmar: resumen ejecutivo,
   analisis, avisos de calidad, la ultima decision con su motivo, el documento de Drive
   incrustado, y las cuatro palabras clave del correo real -aprobar, aprobar con
   anotaciones, solicitar cambios, rechazar- mas deshacer y reenviar. */
function docCard(d){
  var revs=revisoresDe(d), rev=revs.map(function(n){return _m(n).pila;}).join(' o ');
  var puede=puedeDecidirDoc(d), st=estDoc(d.est), an=d.analisis||null, secs='';
  var lista=function(t,xs){ return (xs&&xs.length)
    ? '<div class="sub"><span class="sc">'+t+'</span><ul class="obj">'+
      xs.map(function(v){return '<li>'+esc(v)+'</li>';}).join('')+'</ul></div>' : ''; };
  if(an){
    if(an.proposito) secs+='<div class="sub"><span class="sc">Propósito</span>'+
      '<p style="margin:4px 0 0;font-size:12.5px;color:var(--ink2);line-height:1.6">'+esc(an.proposito)+'</p></div>';
    secs+=lista('Alcance',an.alcance)+lista('Decisiones',an.decisiones)+
          lista('Riesgos',an.riesgos)+lista('Fechas clave',an.fechasClave);
  }
  var avisos = (d.avisos&&d.avisos.length) ? lista('Avisos de calidad · '+d.avisos.length, d.avisos)
    : (d.iss ? '<div class="sub"><span class="sc">Calidad</span><p style="margin:4px 0 0;font-size:12px;'+
        'color:var(--ink3);line-height:1.55">'+d.iss+' aviso'+(d.iss===1?'':'s')+' de calidad, sin detalle. '+
        'Los manda Cowork con el expediente.</p></div>' : '');
  /* La decision anterior se ve SIN desplegar: es lo que hay que juzgar para deshacerla. */
  var previa = (d.est==='cambios'||d.est==='rechazado'||d.revisor)
    ? '<div class="just" style="border-left-color:var(--warn)"><span class="sc">'+
      (d.revisor?('decidió '+esc(d.revisor)):'última decisión')+' · '+st[0]+'</span>'+
      esc(d.nota||'Sin motivo escrito.')+'</div>' : '';
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
      '<textarea data-motivo placeholder="Motivo — obligatorio para pedir cambios o rechazar. Lo lee el autor…"></textarea>'+
      '<div class="acts">'+
        '<button class="btn pri" data-doc="'+d.id+'" data-acc="aprobado">Aprobar</button>'+
        '<button class="btn" data-doc="'+d.id+'" data-acc="anot">Aprobar con anotaciones</button>'+
        '<button class="btn" data-doc="'+d.id+'" data-acc="cambios">Solicitar cambios</button>'+
        '<button class="btn no" data-doc="'+d.id+'" data-acc="rechazado">Rechazar</button>'+
        (d.est!=='revision'&&d.revisor?'<button class="btn" data-doc="'+d.id+'" data-acc="deshacer">Deshacer y devolver a revisión</button>':'')+
      '</div>';
  } else if(d.autor===ACTOR && d.est==='cambios'){
    acc='<div class="acts"><button class="btn pri" data-doc="'+d.id+'" data-acc="reenviar">Reenviar corregido</button></div>';
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
      '<span class="chip '+(d.sev==='alta'?'no':d.sev==='media'?'wa':'ok')+'">'+calDoc(d.sev)+'</span>'+
      (d.fecha?'<span class="chip">'+esc(d.fecha)+'</span>':'')+
    '</div>'+
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

