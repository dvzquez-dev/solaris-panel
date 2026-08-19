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
  /* ⛔ EL `else` ES EL PD, NO EL COORDINADOR, y es lo que dice el SERVIDOR
     (`Codigo.gs`: `archivo -> coordinador · subsistema -> [PD,JOSE] · ELSE -> PD`).
     Aqui estaba al reves: un `ambito` no canonico se le ofrecia al COORDINADOR --que
     pulsa Aprobar y se come «sin permiso para decidir»-- y se escondia del PD, que es
     el unico que el servidor aceptaria. El expediente se quedaba parado sin que nadie
     supiera por que.
     ⚠️ Y `archivo` pasa a ser EXPLICITO: un `else` que reparte autoridad es como se
     cuela un ambito nuevo en el reparto equivocado sin que nadie lo decida. */
  var r = e.ambito==='archivo' ? [coordinadorDe(e.subsistema)]
        : e.ambito==='subsistema' ? [PD_NOM,REV2_NOM]
        : [PD_NOM];
  r=r.filter(function(n){return n!==e.autor;});          /* nadie revisa lo suyo */
  if(!r.length) r=[PD_NOM,REV2_NOM].filter(function(n){return n!==e.autor;});
  if(!r.length) r=[PD_NOM];
  return r;
}

function pilaDe(n){ return _pilaDeM_(n); }


/* QUE LE PASA AL EXPEDIENTE LOCAL CON CADA DECISION. Vivia suelta dentro del listener de
   `movil.html`, o sea que **no la podia ejecutar ningun banco**: aqui tiene nombre y se
   prueba (`rutinas/probar_documentos_caras.py`).

   ⛔ Y AL SACARLA SALIO EL FALLO QUE HACIA FALTA VER: el cuerpo viejo acababa en un `else`
   que se tragaba CUALQUIER accion desconocida y la convertia en **rechazado**. O sea que
   anadir el boton de deshacer sin tocar esto habria **RECHAZADO** el expediente -- y el
   aviso habria dicho «Hecho.». Aqui una accion que no se reconoce devuelve `null` y **no
   toca nada**: quien llama decide, y lo que no se sabe no se ejecuta.

   ⛔ `deshacer` BORRA EL REVISOR, no lo sustituye por quien deshace. Un `revisor` puesto es
   lo que significa «esto ya lo decidio alguien»; dejarlo con el nombre del que deshizo
   convierte un expediente devuelto a revision en uno decidido por otra persona.
   ⚠️ Es la unica accion, junto a `reenviar`, que NO firma. */
/* CUANDO SE PUEDE DESHACER. Vivia como una condicion suelta dentro de la plantilla
   HTML, y ahi NO se puede ejecutar: una mutacion que la apagaba (`false&&...`) salio CIEGA
   porque la comprobacion leia el TEXTO del fichero -y `data-dec="deshacer"` sigue escrito
   aunque el boton no se pinte nunca-. Con nombre se ejecuta, y entonces si se distingue
   «esta escrito» de «se pinta» (ARRANQUE §3c: «existe» no es «se ejecuta»).

   ⛔ DECIDIDO **Y** CON REVISOR, las dos cosas. Sin revisor no hay decision que deshacer y
   el boton mandaria al backend una orden que no puede cumplir; sin mirar el estado se
   ofreceria «deshacer» sobre un expediente que ya esta en revision. Misma condicion que el
   escritorio, que es lo que hace que las dos caras ofrezcan lo mismo. */
function _puedeDeshacerDoc_(e){
  return !!(e && e.estado!=='revision' && e.revisor);
}


function _aplicarDecDoc_(e, acc, mot, tit, etq){
  if(!e) return null;
  if(acc==='reenviar'){ e.estado='revision'; e.nota=null; return e; }
  if(acc==='deshacer'){ e.estado='revision'; e.nota=null; e.revisor=null; return e; }
  if(acc==='aprobado'||acc==='anot'){
    if(acc==='anot' && tit) e.titulo=tit;
    /* ⛔ LA OTRA MITAD DE LA ACCION, que faltaba: el contrato define «aprobar con
       anotaciones» como ajustar titulo Y etiquetas, y `Codigo.gs:992` las aplica.
       Sin esto la pantalla prometia en su nombre algo que no podia hacer. */
    if(acc==='anot' && etq && etq.length) e.etiquetas=etq;
    e.estado='publicado';
  } else if(acc==='cambios'){ e.estado='cambios'; e.nota=mot; }
  else if(acc==='rechazado'){ e.estado='rechazado'; e.nota=mot; }
  else return null;                       /* desconocida: no se toca NADA */
  e.revisor=pilaDe(yoNombre());           /* constancia de quien decidio */
  return e;
}


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
  /* ⛔ ESTA FUNCION NO LLAMABA A `estDoc` NUNCA: reescribia el mapa a mano y caia a
     `[e.estado,'neu']`, o sea al **enum crudo del backend** — la lista decia «publicando»
     o «analizado» y la ficha de esa misma fila decia otra cosa. Y ese arreglo YA se habia
     hecho: `EST_DOC` nacio con el comentario «el movil pintaba `e.estado` en crudo y el
     miembro leia «revision» o «anot»». Esta se quedo fuera. */
  var st=[estDoc(e.estado)[0], _pilEstDoc_(e.estado)];
  return '<div class="fila clic '+(mio?(e.estado==='cambios'?'borde-no':'borde-pe'):'')+'" data-doc="'+e.id+'" data-p>'+
    '<div class="a"><b>'+esc(e.titulo)+'</b><small><span class="mono">'+e.ref+'</span> · '+
    esc(e.autor.split(' ')[0])+' · '+AMB[e.ambito]+'</small></div>'+
    '<div class="d"><span class="pil '+st[1]+'">'+st[0]+'</span> <span class="chev">›</span></div></div>';
}

/* Reparte los expedientes que manda el backend en «los mios» y «los que reviso».

   ⛔ UNA SOLA PUERTA, y nace de que habia UNA sola y hacian falta DOS sitios: esto vivia
   suelto dentro de `_aplicarBootstrapMovil_`, asi que el refresco en vivo no podia usarlo --
   y por eso el movil no refrescaba documentos: no habia con que repartirlos. Copiarlo habria
   sido la segunda version del mismo reparto, que es como divergen.

   El backend YA manda solo lo que te incumbe (los tuyos, los que revisas y, si eres PD o Jose,
   los que estan en vuelo): aqui solo se reparten.

   ⚠️ Devuelve cuantos ha repartido. ⛔ Y NO distingue «no habia nada» de «no llego nada»:
   las dos dan 0. Aqui ponia que si, y era falso — un comentario que promete una capacidad
   inexistente sobre codigo recien escrito, que es como nacen las suposiciones caras. Si
   algun dia hace falta distinguirlas, el sitio es el valor de retorno (un -1), no esta
   linea; hoy los dos llamadores tiran el numero y no hace falta.
   ⛔ Con una lista que NO es lista no se toca nada: `_pide_` devuelve `null` cuando la peticion
   falla, y vaciar las dos listas ahi seria borrar de la pantalla lo que si teniamos. */
function _repartirEntregablesM_(lista){
  if(typeof ENTREGABLES==='undefined' || typeof ENT_REV==='undefined') return 0;
  if(!lista || typeof lista.length!=='number' || typeof lista==='string') return 0;
  var _yoDoc=(typeof YO!=='undefined' && YO && YO.nombre) ? YO.nombre : '', i, d;
  ENTREGABLES.length=0; ENT_REV.length=0;
  for(i=0;i<lista.length;i++){
    d=lista[i];
    if(!d) continue;
    if(d.sev==null && d.severidad!=null) d.sev=d.severidad;   // la vista lee `sev`
    /* El backend manda `enlaceDrive` y aqui se quedaba sin recoger: el visor no tenia que
       enseñar. Normalizar es tirar lo que no nombras. */
    if(!d.drive && d.enlaceDrive) d.drive=d.enlaceDrive;
    (d.autor===_yoDoc ? ENTREGABLES : ENT_REV).push(d);
  }
  return ENTREGABLES.length + ENT_REV.length;
}

/* Lo que la pestaña Docs tiene que GRITAR: lo que espera una accion TUYA.

   ⛔ Antes esto vivia dentro de `badges()` como `ENTREGABLES.filter(estado==='cambios')`, o sea
   **solo tus documentos con cambios pedidos**, y se dejaba fuera lo que espera tu FIRMA -- que
   vive en `ENT_REV` y lo calcula `_docsPend_()`. Un coordinador con tres expedientes esperandole
   veia la pestaña sin un solo numero, y hoy ese globo es el unico aviso que hay.
   ⚠️ No se quita lo que ya contaba: las dos cosas piden algo tuyo y solo tu las desbloqueas.
   ✅ Y va POR `_docsPend_()`, no por un filtro propio: esa puerta ya la leen `_destVisibles_` y
   `vDocs`, y un tercer criterio para «¿tengo algo en Documentos?» es como divergen. */
function _docsAvisoM_(){
  var pend = (typeof _docsPend_==='function') ? (_docsPend_()||[]).length : 0;
  var mios = (typeof ENTREGABLES!=='undefined' && ENTREGABLES)
    ? ENTREGABLES.filter(function(e){ return e && e.estado==='cambios'; }).length : 0;
  return pend + mios;
}

/* ¿ME SIRVE HOY LA PANTALLA DE DOCUMENTOS? UNA sola puerta, porque la leen TRES sitios
   que tienen que decir lo mismo: la barra de abajo (¿enseño la pestaña?), `vDocs`
   (¿pinto «Nada por aqui»?) y el GLOBO del nav (¿cuantos?). Si divergieran, habria una
   pestaña que al pulsarla no tiene nada — que es justo lo que reporto Adrian.
   ⛔ Aqui ponia «dos sitios», y eran dos cuando se escribio. El tercero —`badges()`— nacio
   despues **con su propio filtro**, y por eso el globo no contaba las revisiones. Un
   comentario que enumera a sus lectores envejece solo, y mientras tanto AVALA la copia. */
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

/* Lo que ve el AUTOR de su propio expediente ya decidido. `''` si no hay nada que contarle.

   ⛔⛔ AQUI SOLO HABIA RAMA PARA `cambios`, y todo lo demas caia al `else` generico de `verDoc`.
      Al autor de un expediente RECHAZADO se le decia **«Este expediente lo revisa X. Tú no
      decides aquí»** —sobre SU documento y SU rechazo—, sin el motivo, sin quien y sin cuando.
      Y no era «no llega»: `Codigo.gs:995` guarda el motivo en `e.nota` para `rechazado`
      EXACTAMENTE igual que para `cambios`. Era «no se pinta».
   ⛔ El mismo `else` se tragaba las buenas noticias: a quien le publicaban un documento, la app
      le contestaba que no decide ahi.
   ⚠️ Esto es lo que hay que tener ANTES de apagar el correo (Daniel, 18/08: «la idea es dejar
      de usar el correo… casi mejor que todo este en la aplicacion, con el feedback etc.»). Hoy
      el correo es el unico sitio donde el autor de un rechazo se entera de por que.
   ⛔ Y la guarda del autor no es cosmetica: sin `e.autor!==yoNombre()` esto pintaria el motivo
      de un rechazo AJENO a cualquiera que abra la ficha. */
/* Los dos pasos con la marca del móvil. Función aparte para poder ejecutarla: `verDoc` monta
   además el visor y las cuatro acciones, así que ningún banco la corre. */
/* Los pasos de SUSTITUIR con la marca del movil. Gemelo de `_pasosCorregirM_`, y aparte
   por lo mismo: `verDoc` monta ademas el visor y las acciones, asi que ningun banco la
   corre. La lista la decide la puerta comun; aqui solo se envuelve. */
function _pasosSustituirM_(e){
  var ps = (typeof _pasosSustituirDoc_==='function')
    ? _pasosSustituirDoc_(e, yoNombre()) : [];
  if(!ps.length) return '';
  return '<div class="avisolargo" style="margin-top:10px"><b>¿Hay una versión nueva de este documento?</b> No se sube encima: se manda como <b>sustitución</b>, y éste sigue publicado hasta que aprueben la nueva.</div>'+
    '<ol class="obj" style="margin:8px 0 0;padding-left:20px">'+
    ps.map(function(p){
      return '<li style="margin-bottom:6px"><b>'+esc(p.t)+'</b>'+
        (p.url ? ' — <a href="'+esc(p.url)+'" target="_blank" rel="noopener">abrir el formulario</a>' : '')+
        '<br><span class="sc">'+esc(p.d)+'</span>'+
        (p.sinUrl ? '<br><span class="sc">'+esc(p.sinUrl)+'</span>' : '')+'</li>';
    }).join('')+'</ol>';
}

function _pasosCorregirM_(e){
  var ps = (typeof _pasosCorregirDoc_==='function') ? _pasosCorregirDoc_(e) : [];
  if(!ps.length) return '';
  return '<div class="avisolargo" style="margin-top:10px"><b>Para corregirlo son dos pasos, '+
    'en este orden.</b> El botón de abajo <b>no sube nada</b>: sólo devuelve el expediente a '+
    'la cola.</div>'+
    '<ol class="obj" style="margin:8px 0 0;padding-left:20px">'+
    ps.map(function(p){
      return '<li style="margin-bottom:6px"><b>'+esc(p.t)+'</b>'+
        (p.url ? ' — <a href="'+esc(p.url)+'" target="_blank" rel="noopener">abrir el formulario</a>'
               : '')+
        '<br><span class="sc">'+esc(p.d)+'</span>'+
        (p.sinUrl ? '<br><span class="sc">'+esc(p.sinUrl)+'</span>' : '')+'</li>';
    }).join('')+'</ol>';
}

function _docAutorHTML_(e){
  if(!e || e.autor!==yoNombre()) return '';
  var est=e.estado;
  var firma=(typeof _firmaDocTxt_==='function') ? _firmaDocTxt_(e) : '';
  var pie=firma ? '<br><span class="sc">'+esc(firma)+'</span>' : '';
  if(est==='cambios')
    return '<div class="avisolargo" style="margin-top:14px"><b>Te pidieron cambios.</b> '+
      esc(e.nota||'')+pie+'</div>'+
      _pasosCorregirM_(e)+
      /* ⛔ EL ROTULO DECIA «Reenviar corregido» Y NO REENVIA NADA: `Codigo.gs:965-967`
         solo cambia el estado. Un boton que promete subir un archivo hace que quien lo
         pulsa CREA que ya lo ha subido, y se queda esperando a un revisor que abriria el
         archivo viejo. Ahora dice lo que hace. */
      '<button class="btn pri full" style="margin-top:10px" data-p data-dec="reenviar" data-id="'+e.id+'">Ya está corregido: devolver a revisión</button>';
  /* ⛔ AQUI NO VAN LOS DOS PASOS, Y ES LA MITAD QUE SE ME ESCAPABA: `Codigo.gs:966` exige
     `estado==='cambios'` para reenviar, asi que desde un RECHAZADO **no hay boton**.
     Decirle a esta persona «vuelve y pulsa» la manda a buscar algo que no existe: lo suyo
     es un envio NUEVO -referencia nueva- enlazado al original, que no se borra. */
  if(est==='rechazado')
    return '<div class="avisolargo" style="margin-top:14px"><b>Te lo rechazaron.</b> '+
      esc(e.nota||'Sin motivo escrito.')+pie+'</div>';
  if(est==='aprobado'||est==='publicado'||est==='cerrado'){
    /* ⛔ LA ACCION SALE DE `decision.accion`, NO DEL ESTADO: el backend deja `aprobado` y `anot`
       en el MISMO `publicado`, asi que desde el estado no se puede saber si te lo aprobaron tal
       cual o te lo aprobaron CAMBIANDOTE el titulo y las etiquetas. */
    var acc=(typeof _accionDocTxt_==='function')
      ? (_accionDocTxt_(e.decision&&e.decision.accion)||'Aprobado') : 'Aprobado';
    var aj=(typeof _ajustesDocTxt_==='function') ? _ajustesDocTxt_(e) : '';
    /* ⚠️ EL ENLACE SOLO SI ES UNO DE VERDAD. `Codigo.gs:993` pone `paginaNotion = ... || '#notion'`
       —un marcador del prototipo—, y un enlace muerto con pinta de vivo es peor que ninguno:
       manda a pulsarlo y a pensar que la app esta rota. */
    var url=String(e.paginaNotion||'');
    return '<div class="avisolargo" style="margin-top:14px"><b>'+esc(acc)+'.</b> '+
      (aj?'Te ajustaron: '+esc(aj)+'. ':'')+pie+
      (url.indexOf('http')===0
        ? '<br><a href="'+esc(url)+'" target="_blank" rel="noopener">Ver la página publicada</a>'
        : '')+
      '</div>'+
      /* ⛔ Y AQUI LOS PASOS DE SUSTITUIR, PEGADOS -no en una rama propia-. Escribi
         primero un `if(est==='publicado')` DELANTE de este bloque y se COMIA lo que ya
         pintaba: la accion real («Aprobado con anotaciones»), que te ajustaron, la firma
         y el enlace a Notion. CUATRO comprobaciones de este banco se pusieron rojas a la
         vez y tenian razon. Una rama nueva delante de otra que ya funciona no añade:
         RESTA -- y el sintoma llega lejos del sitio, en comprobaciones que hablan de
         acentos y de etiquetas. */
      _pasosSustituirM_(e);
  }
  return '';
}

/* ficha del expediente: análisis, calidad, visor y las 4 acciones reales */
/* Los avisos de `_avisosDoc_` con la marca del móvil. Función aparte **para poder
   ejecutarla**: `verDoc` monta además el visor, las píldoras y las cuatro acciones, así que
   ningún banco la corre y toda mutación sobre esto saldría CIEGA (§3c-31). */
/* ⚠️ SIN atajo `if(!xs.length) return ''`: con `[]` el `map().join('')` ya devuelve `''`, así
   que esa rama no la podría distinguir ninguna comprobación, y una rama que nada distingue es
   superficie sin demostrar.
   ⛔ Y OJO CON CÓMO SE ESCRIBE ESTO: `probar_gemelas.py` cosecha la palabra que empieza por
      «EQUIVA…» de la ventana de comentario de cada función para saber qué parejas están
      DECLARADAS como deliberadas. Escribirla aquí —hablando de mutantes, no de gemelas— metía
      a esta función en esa lista y ponía el banco rojo. Un detector que busca NOMBRES no
      distingue una invocación de una mención: la denuncia crea el hecho. */
function _avisosDocM_(e){
  var xs = (typeof _avisosDoc_==='function') ? _avisosDoc_(e) : [];
  return xs.map(function(a){
    return '<div class="avisolargo" style="margin-bottom:10px"><b>'+esc(a.t)+'</b> '+
           esc(a.d)+'</div>';
  }).join('');
}

function verDoc(id){
  var e=ENTREGABLES.concat(ENT_REV).filter(function(x){return x.id===id;})[0];
  if(!e) return;
  var puede=puedeDecidirDoc(e);
  var revs=revisoresDe(e).map(function(n){return n.split(' ')[0];}).join(' o ');
  var sevTxt={baja:'alta',media:'media',alta:'baja'};
  var an=e.analisis, secs='';
  if(an){
    if(an.proposito) secs+='<h4>Propósito</h4><p style="margin:0;font-size:12.5px;color:var(--ink2);line-height:1.55">'+esc(an.proposito)+'</p>';
    /* La lista sale de `_seccionesAnalisis_`, no de aquí: aquí estaba escrita a mano y se
       dejaba `Acciones` y `Pendientes`, igual que la del escritorio. */
    _seccionesAnalisis_(an).forEach(function(x){
      secs+='<h4>'+x[0]+'</h4><ul class="obj">'+x[1].map(function(v){return '<li>'+esc(v)+'</li>';}).join('')+'</ul>';
    });
    var _cnt=_conteosDoc_(an);
    if(_cnt) secs+='<p class="rnota" style="margin:8px 0 0">'+esc(_cnt)+'</p>';
  }
  var _mioDoc = _docAutorHTML_(e);
  var acc = puede
    ? '<h4>Tu decisión</h4>'+
      '<label class="campo"><span class="sc">Título · puedes corregirlo al aprobar</span><input id="dTit" value="'+esc(e.titulo)+'"></label>'+
      '<label class="campo"><span class="sc">Etiquetas · separadas por comas, al aprobar con anotaciones</span>'+
      '<input id="dEtq" value="'+esc(_etiquetasDe_(e).join(', '))+'"></label>'+
      '<label class="campo"><span class="sc">Motivo <span class="req">*</span> si pides cambios o rechazas</span>'+
      '<textarea id="dMot" placeholder="lo leerá el autor…"></textarea></label>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
        '<button class="btn pri" style="flex:1 1 46%" data-p data-dec="aprobado" data-id="'+e.id+'">Aprobar</button>'+
        '<button class="btn" style="flex:1 1 46%" data-p data-dec="anot" data-id="'+e.id+'">Con anotaciones</button>'+
        '<button class="btn" style="flex:1 1 46%" data-p data-dec="cambios" data-id="'+e.id+'">Solicitar cambios</button>'+
        '<button class="btn no" style="flex:1 1 46%" data-p data-dec="rechazado" data-id="'+e.id+'">Rechazar</button>'+
        /* DESHACER. Lo tenia el escritorio y aqui NO, y esta es la cara en la que
           Daniel revisa: quien se equivocaba de boton desde el telefono se quedaba
           mirando un candado que dice «solo alguien de mas rango puede cambiarlo».
           Misma condicion que el escritorio -decidido y con revisor- y misma orden al
           backend (`api.decidir(..., 'deshacer', ...)`, aceptada desde v28). */
        (_puedeDeshacerDoc_(e)
          ? '<button class="btn" style="flex:1 1 100%" data-p data-dec="deshacer" data-id="'+e.id+'">Deshacer y devolver a revisión</button>' : '')+
      '</div>'
    /* ⛔ LA RAMA DEL AUTOR SALE DE `_docAutorHTML_`, y no de un `estado==='cambios'` aquí
       dentro. Aquí había UNA sola rama y todo lo demás caía al `else` de abajo, así que al
       autor de un expediente RECHAZADO se le decía «Este expediente lo revisa X. Tú no
       decides aquí» —sobre SU documento y SU rechazo, sin motivo, sin quién y sin cuándo—.
       El motivo existía: `Codigo.gs:995` lo guarda en `e.nota` igual que para `cambios`.
       ⚠️ Se llama UNA vez y se guarda: llamarla dos veces en el ternario duplicaría el
       trabajo y, el día que lleve estado dentro, daría dos respuestas distintas. */
    : _mioDoc
      ? _mioDoc
      : (revisoresDe(e).indexOf(yoNombre())>=0 && e.estado!=='revision'
          ? '<p class="rnota" style="margin-top:14px">🔒 Ya está decidido. Puedes consultarlo, pero solo alguien de más rango puede cambiar la decisión.</p>'
          : '<p class="rnota" style="margin-top:14px">Este expediente lo revisa <b>'+revs+'</b>. Tú no decides aquí.</p>');

  abrirModal('<div class="mtit">'+esc(e.titulo)+'</div>'+
    '<div class="msub"><span class="mono">'+e.ref+'</span> · '+esc(e.autor)+' · '+esc(e.subsistema)+'</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'+
      '<span class="pil neu">'+AMB[e.ambito]+'</span>'+
      /* ⛔ La clase sale de `EST_DOC`, no de un ternario a mano: el `else` era `conf` y
         pintaba **«rechazado» en VERDE** al autor que abre su propio expediente. */
      '<span class="pil '+_pilEstDoc_(e.estado)+'">'+esc(estDoc(e.estado)[0])+'</span>'+
      (e.sev?'<span class="pil '+(e.sev==='alta'?'no':e.sev==='media'?'pend':'conf')+'">calidad '+sevTxt[e.sev]+'</span>':'')+
    '</div>'+
    /* ANTES del resumen a propósito: si el expediente está trabado o es una
       revisión de otro, eso cambia lo que hay que mirar en todo lo de abajo. */
    _avisosDocM_(e)+
    '<p style="font-size:12.5px;color:var(--ink2);line-height:1.55;margin:0">'+esc(e.resumen||'Sin descripción.')+'</p>'+
    /* Las etiquetas se VEN aunque no puedas decidir: el campo editable de abajo solo
       sale si te toca firmar, y el AUTOR tiene que poder ver con cuales se publico
       lo suyo. Asi estaba en la app publicada (`app.html:1171`). */
    (_etiquetasDe_(e).length
      ? '<p class="rnota" style="margin:8px 0 0">Etiquetas: '+
        esc(_etiquetasDe_(e).join(', '))+'</p>' : '')+
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

