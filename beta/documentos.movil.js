/* ═══ DOCUMENTOS · cara movil ═══════════════════════════════════════════════════════════
   9 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

function revisoresDe(e){
  var r = e.ambito==='general' ? [PD_NOM]
        : e.ambito==='subsistema' ? [PD_NOM,REV2_NOM]
        : [coordinadorDe(e.subsistema)];
  r=r.filter(function(n){return n!==e.autor;});          /* nadie revisa lo suyo */
  if(!r.length) r=[PD_NOM,REV2_NOM].filter(function(n){return n!==e.autor;});
  if(!r.length) r=[PD_NOM];
  return r;
}

function pilaDe(n){ return _pilaDeM_(n); }


/* EQUIVALENTE (no GEMELA) — y la diferencia es REGLA DE PRODUCTO, no un descuido.
   Daniel (05/08): «en telefono solo se puede checkear los documentos tuyos pendientes de
   revision o los que tienes tu pendientes de revisar; no aparecen hasta que esten
   completamente analizados y listos con el link bien embebido».
   Por eso el MOVIL decide solo en `revision` -es lo unico que llega a ver- y el ESCRITORIO
   tambien en `recibido` y `analizado`, donde se ve el pipeline entero. Los campos tambien
   difieren (`e.estado` / `d.est`) porque cada cara consume su propia forma del dato. */
function puedeDecidirDoc(e){
  var yo=yoNombre();
  if(yo===e.autor) return false;                          /* ni mandando por rango */
  var rev=revisoresDe(e), maxR=Math.max.apply(null,rev.map(rangoNom));
  var habilitado = rev.indexOf(yo)>=0 || rangoNom(yo)>maxR;
  if(!habilitado) return false;
  if(e.estado==='revision') return true;                  /* sin decidir: cualquiera habilitado */
  /* ya decidido: solo el que decidio, o alguien de MAS rango. El bloqueo mutuo es
     la regla cerrada del pipeline: el primero que decide bloquea a sus iguales. */
  return e.revisor===pilaDe(yo) || rangoNom(yo)>rangoPila(e.revisor);
}

function filaDoc(e,mio){
  var st=e.estado==='cambios'?['cambios','no']:e.estado==='revision'?['en revisión','pend']:
         e.estado==='publicado'?['publicado','conf']:[e.estado,'neu'];
  return '<div class="fila clic '+(mio?(e.estado==='cambios'?'borde-no':'borde-pe'):'')+'" data-doc="'+e.id+'" data-p>'+
    '<div class="a"><b>'+esc(e.titulo)+'</b><small><span class="mono">'+e.ref+'</span> · '+
    esc(e.autor.split(' ')[0])+' · '+AMB[e.ambito]+'</small></div>'+
    '<div class="d"><span class="pil '+st[1]+'">'+st[0]+'</span> <span class="chev">›</span></div></div>';
}

/* ¿ME SIRVE HOY LA PANTALLA DE DOCUMENTOS? UNA sola puerta, porque la leen dos sitios
   que tienen que decir lo mismo: la barra de abajo (¿enseño la pestaña?) y `vDocs`
   (¿pinto «Nada por aqui»?). Si divergieran, habria una pestaña que al pulsarla no
   tiene nada — que es justo lo que reporto Adrian. */
function _docsPend_(){
  return ENT_REV.filter(function(e){return e.estado==='revision' && revisoresDe(e).indexOf(yoNombre())>=0;});
}

function _docsRelevantes_(){
  /* Con `||[]` porque estas listas las llena el backend y pueden no haber llegado. Antes
     asumían que sí, y al usarse desde `_destVisibles_` -que corre en CADA pintado- un dato
     que falta dejaba de romper una pantalla para romper la app entera. */
  return !!((_docsPend_()||[]).length || (ENTREGABLES||[]).length ||
            (esPD() && (ENT_REV||[]).length));
}

function vDocs(){
  var mios=ENTREGABLES;
  var pend=_docsPend_();
  var enCurso=ENT_REV.concat([]);
  var h='<div class="h1">Documentos</div><p class="h1s">Tus documentos y los que tienes que revisar.</p>';
  /* NADA DE NADA: una sola caja explicada, en vez de tres estados vacios decorados que
     juntos miden media pantalla. La explicacion hace falta UNA vez, no tres. */
  if(!_docsRelevantes_()){
    return h+'<div class="tarj">'+vacio('Nada por aquí',
      (esCoord()
        ? 'No hay ningún documento esperando tu firma, y tú no has enviado ninguno. Cuando '+
          'alguien de tu unidad envíe un archivo, te llegará aquí.'
        : 'No has enviado ningún documento y no tienes ninguno que revisar: los tuyos los '+
          'firma tu coordinador.'),
      '',false)+'</div>';
  }
  h+='<h2 class="sec">Pendiente de tu revisión<span class="ln"></span>'+pend.length+'</h2>';
  h+= pend.length
    ? '<div class="tarj">'+pend.map(function(e){return filaDoc(e,false);}).join('')+'</div>'
    : '<div class="tarj">'+vacioMini(esCoord()?'Ningún documento espera tu firma.'
        :'Nada que revisar: tus documentos los firma tu coordinador.')+'</div>';
  if(esPD()){
    h+='<h2 class="sec">En curso<span class="ln"></span>'+enCurso.length+'</h2>'+
       '<div class="tarj">'+
       (enCurso.length
         ? enCurso.map(function(e){return filaDoc(e,false);}).join('')+
           '<p class="rnota">Todos los expedientes abiertos ahora mismo. El detalle por subsistema está en el escritorio.</p>'
         : vacioMini('Ningún expediente del equipo está abierto.'))+
       '</div>';
  }
  h+='<h2 class="sec">Mis documentos<span class="ln"></span>'+mios.length+'</h2>'+
     '<div class="tarj">'+
     (mios.length
       ? mios.map(function(e){return filaDoc(e,true);}).join('')
       : vacioMini('Todavía no has enviado ninguno. Los que envíes aparecerán aquí con su estado.'))+
     '</div>';
  return h;
}

/* ficha del expediente: análisis, calidad, visor y las 4 acciones reales */
function verDoc(id){
  var e=ENTREGABLES.concat(ENT_REV).filter(function(x){return x.id===id;})[0];
  if(!e) return;
  var puede=puedeDecidirDoc(e);
  var revs=revisoresDe(e).map(function(n){return n.split(' ')[0];}).join(' o ');
  var sevTxt={baja:'alta',media:'media',alta:'baja'};
  var an=e.analisis, secs='';
  if(an){
    if(an.proposito) secs+='<h4>Propósito</h4><p style="margin:0;font-size:12.5px;color:var(--ink2);line-height:1.55">'+esc(an.proposito)+'</p>';
    [['Alcance',an.alcance],['Decisiones',an.decisiones],['Riesgos',an.riesgos],['Fechas clave',an.fechasClave]].forEach(function(x){
      if(x[1]&&x[1].length) secs+='<h4>'+x[0]+'</h4><ul class="obj">'+x[1].map(function(v){return '<li>'+esc(v)+'</li>';}).join('')+'</ul>';
    });
  }
  var acc = puede
    ? '<h4>Tu decisión</h4>'+
      '<label class="campo"><span class="sc">Título · puedes corregirlo al aprobar</span><input id="dTit" value="'+esc(e.titulo)+'"></label>'+
      '<label class="campo"><span class="sc">Motivo <span class="req">*</span> si pides cambios o rechazas</span>'+
      '<textarea id="dMot" placeholder="lo leerá el autor…"></textarea></label>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
        '<button class="btn pri" style="flex:1 1 46%" data-p data-dec="aprobado" data-id="'+e.id+'">Aprobar</button>'+
        '<button class="btn" style="flex:1 1 46%" data-p data-dec="anot" data-id="'+e.id+'">Con anotaciones</button>'+
        '<button class="btn" style="flex:1 1 46%" data-p data-dec="cambios" data-id="'+e.id+'">Solicitar cambios</button>'+
        '<button class="btn no" style="flex:1 1 46%" data-p data-dec="rechazado" data-id="'+e.id+'">Rechazar</button>'+
      '</div>'
    : (e.autor===yoNombre() && e.estado==='cambios')
      ? '<div class="avisolargo" style="margin-top:14px"><b>Te pidieron cambios.</b> '+esc(e.nota||'')+
        '</div><button class="btn pri full" style="margin-top:10px" data-p data-dec="reenviar" data-id="'+e.id+'">Reenviar corregido</button>'
      : (revisoresDe(e).indexOf(yoNombre())>=0 && e.estado!=='revision'
          ? '<p class="rnota" style="margin-top:14px">🔒 Ya está decidido. Puedes consultarlo, pero solo alguien de más rango puede cambiar la decisión.</p>'
          : '<p class="rnota" style="margin-top:14px">Este expediente lo revisa <b>'+revs+'</b>. Tú no decides aquí.</p>');

  abrirModal('<div class="mtit">'+esc(e.titulo)+'</div>'+
    '<div class="msub"><span class="mono">'+e.ref+'</span> · '+esc(e.autor)+' · '+esc(e.subsistema)+'</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'+
      '<span class="pil neu">'+AMB[e.ambito]+'</span>'+
      '<span class="pil '+(e.estado==='revision'?'pend':e.estado==='cambios'?'no':'conf')+'">'+esc(estDoc(e.estado)[0])+'</span>'+
      (e.sev?'<span class="pil '+(e.sev==='alta'?'no':e.sev==='media'?'pend':'conf')+'">calidad '+sevTxt[e.sev]+'</span>':'')+
    '</div>'+
    '<p style="font-size:12.5px;color:var(--ink2);line-height:1.55;margin:0">'+esc(e.resumen||'Sin descripción.')+'</p>'+
    secs+
    ((e.issues&&e.issues.length)?'<h4>Avisos de calidad · '+e.issues.length+'</h4><ul class="obj">'+
      e.issues.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')+
    /* EL DOCUMENTO DE VERDAD. Aqui habia una maqueta con rayas grises que decia «sin vista
       previa»: esta pantalla existe para LEER el archivo antes de decidir, y decidir sin
       poder abrirlo es aprobar a ciegas — justo lo que venia a evitar. */
    '<h4>Documento</h4>'+
    (_idDrive_(e.drive)
      /* Nace ABIERTO: esta pantalla existe para leer el archivo antes de decidir, y decidir
         sin abrirlo es aprobar a ciegas. Y ahora con pantalla completa, como el resto. */
      ? _visorHTML_({id:_idDrive_(e.drive), url:e.drive, titulo:'El documento', sub:e.ref,
                     queEs:'el documento', plegado:false})
      : '<div class="doc"><div class="dcar">Este expediente no trae enlace al archivo.<br>'+
        'Pideselo a quien lo subio antes de decidir.</div></div>')+
    '<p class="rnota" style="margin-top:10px">Revisa: <b>'+revs+'</b></p>'+
    acc);
  /* Se cablea DESPUES de abrir el modal: un iframe dentro de la cadena de strings no
     arranca hasta que esta en el DOM. */
  _cablearVisor_();
}

