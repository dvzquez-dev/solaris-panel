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
  /* 04/11 (Daniel, `Manual_S-9001_27`): con REVISORES PROPUESTOS válidos en el documento va directo al PD, que aprueba «esos son los
     revisores». Gemela de `revisores_de` del servidor (`probar_revisor_autor_doc.py`). */
  /* 05/11 (`pedirrev`): con una PETICIÓN de revisión pendiente del PD, los revisores son los PEDIDOS. Gemela de `revisores_de`. */
  var _pet=_peticionRevActiva_(e); if(_pet) return (_pet.revisores||[]).slice();
  if(_revisoresPropuestosValidos_(e).length) return _destinoConflictoDoc_(e);   /* 05/11 (`conflictojose`): a José, que valida sin firmar */
  var r = e.ambito==='archivo' ? [coordinadorDe(e.subsistema)]
        : e.ambito==='subsistema' ? [PD_NOM,REV2_NOM]
        : [PD_NOM];
  /* nadie revisa lo suyo — 02/11: TODOS los autores (el que lo sube, los que nombra el documento y los ajustados), no sólo `autor`. */
  var au=_autoresDe_(e), noAutor=function(n){return au.indexOf(n)<0;};
  r=r.filter(noAutor);
  /* 04/11: el PD es la excepción a «nadie revisa lo suyo» cuando es el último peldaño: si también es autor, le llega igual (no hay nadie
     por encima). Sin duplicar si `REV2_NOM === PD_NOM`. */
  if(!r.length) r=_destinoConflictoDoc_(e);   /* 05/11 (`conflictojose`): antes PD y José; ahora José valida, y si no puede, el PD */
  /* 01/11: SIN tercer peldaño. Antes acababa en `[PD_NOM]` sin volver a filtrar al autor: con `REV2_NOM === PD_NOM` y el PD
     de autor, el expediente se asignaba a su propio autor y no podía firmar NADIE, sin un error. Ahora `[]` es «no hay
     revisor asignable»: cada consumidor lo pinta («Sin revisor: avisa al Project Director») y nadie decide (`puedeDecidirDoc`). */
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
/* `_puedeDeshacerDoc_` vive en `comun.js` (02/11): la miran las DOS caras y tiene que saber lo que el servidor no deja deshacer. */


/* Qué hacer con una decisión de documento SIN conexión. Puro, para que un banco lo ejecute (el listener no se puede).
   Fuera de la maqueta: nada, y decirlo. En la maqueta: aplicar en memoria y decir sólo la decisión —la parte de antes
   del « · », que es la que promete publicar—. */
function _decSinRedDoc_(aviso, maqueta){
  if (!maqueta) return { aplicar:false, txt:'Sin conexión con el servidor: la decisión NO se ha guardado. Vuelve a intentarlo con red.' };
  return { aplicar:true, txt:String(aviso||'Hecho.').split(' · ')[0].replace(/\.$/, '')+' (maqueta: sólo en este teléfono, no se ha publicado nada).' };
}

function _aplicarDecDoc_(e, acc, mot, tit, etq, aj){
  if(!e) return null;
  if(acc==='reenviar'){ e.estado='revision'; e.nota=null; return e; }
  if(acc==='deshacer'){ e.estado='revision'; e.nota=null; e.revisor=null; return e; }
  if(acc==='aprobado'||acc==='anot'){
    if(acc==='anot' && tit) e.titulo=tit;
    /* ⛔ LA OTRA MITAD DE LA ACCION, que faltaba: el contrato define «aprobar con
       anotaciones» como ajustar titulo Y etiquetas, y `Codigo.gs:992` las aplica.
       Sin esto la pantalla prometia en su nombre algo que no podia hacer. */
    /* ⛔⛔ LA MISMA CONDICION QUE EL SERVIDOR (359.a, 24/08). Aqui ponia
       `&& etq && etq.length` y `Codigo.gs:1224` hace `if (extra.etiquetas)`. **`[]` es
       TRUTHY en JS**, asi que borrar TODAS las etiquetas y aprobar con anotaciones las
       quitaba en el servidor y **no aqui**: la pantalla seguia ensenando unas etiquetas
       que el documento ya no tenia, hasta el siguiente refresco. Dos criterios para la
       misma pregunta son dos preguntas.
       📏 Y no hay tercer estado que perder: `movil.html` pasa
       `ne=_etiquetasDeTexto_((.value)||'')`, que devuelve **siempre un array**. El campo
       nace relleno con las actuales, asi que «no tocarlo» ya manda las mismas y
       «vaciarlo» significa **quitalas todas**. No existe el caso «no consta».
       ⚠️ Y la ASIMETRIA con `tit` de la linea de arriba SE QUEDA a proposito: un titulo
       vacio NO es «quitalo» --un documento sin titulo no es un estado valido-- y ademas
       `movil.html` ya se planta antes (*«Con anotaciones hace falta un titulo»*). Son el
       mismo `if` con dos significados distintos, que es justo lo que los confundio. */
    if(acc==='anot' && etq) e.etiquetas=etq;
    /* 28/10: subtítulo ('' = quitarlo) y confidencialidad, como el servidor. `aj` es el `extra` de `_anotExtra_`. */
    if(acc==='anot' && aj){ if(aj.subtitulo!=null) e.subtitulo=aj.subtitulo; if(aj.confidencialidad) e.confidencialidad=aj.confidencialidad; if(aj.version) e.version=aj.version; }
    e.estado='aprobado';   /* 21/10 (auditor 11, 🔴 1): como el servidor — `publicado` lo pone quien publica */
  } else if(acc==='cambios'){ e.estado='cambios'; e.nota=mot; }
  else if(acc==='rechazado'){ e.estado='rechazado'; e.nota=mot; }
  else return null;                       /* desconocida: no se toca NADA */
  if(acc==='anot' && aj && aj.autores) e.decision={accion:acc, ajustes:{autores:aj.autores}};   /* 02/11: como el servidor, para que ninguno de ellos revise lo suyo */
  /* 04/11: como el servidor —aprobar con los revisores propuestos—, para que la ficha los enseñe antes del próximo refresco. */
  var _rp=((acc==='aprobado'||acc==='anot') && typeof _revisoresPropuestosValidos_==='function') ? _revisoresPropuestosValidos_(e) : [];
  if(_rp.length){ e.decision=Object.assign({accion:acc, revisor:yoNombre()}, e.decision||{}, {revisadoPor:_rp, validadoPor:yoNombre()}); }
  e.revisor=pilaDe(yoNombre());           /* constancia de quien decidio */
  return e;
}


/* EQUIVALENTE (no GEMELA): la MISMA regla en las dos caras, escrita con el vocabulario de cada
   una -- el estado es `e.estado` en el movil y `d.est` en el escritorio, y quien decide sale de
   `yoNombre` en una y de `ACTOR` en la otra --. Difieren los nombres, no la conducta.
   ⛔ AQUI PONIA que la diferencia era REGLA DE PRODUCTO: que el MOVIL solo decidia en `revision`
      y el ESCRITORIO tambien en `recibido` y `analizado`. Dejo de ser cierto en la 133.a, cuando
      el escritorio se alineo con el movil, y el comentario lo siguio diciendo en las dos caras.
      Medido el 14/09 (651.a), las dos ejecutadas sobre el mismo caso (9 estados, 5 revisores
      previos, 3 ambitos y 5 actores: 675 combinaciones): 0 divergencias, y las DOS dejan decidir
      fuera de `revision` en 200 de ellas.
   La regla de Daniel (05/08) -«en telefono solo se puede checkear los documentos tuyos
   pendientes de revision o los que tienes tu pendientes de revisar; no aparecen hasta que esten
   completamente analizados»- NO la impone esta funcion. Lo que PUBLICA solo se ofrece sobre lo
   ya analizado, y eso lo decide `_yaAnalizado_` (`comun.js`), la misma puerta en las dos caras;
   pedir cambios y rechazar se ofrecen antes a proposito, porque son la forma de pararlo. Y lo
   que el movil lista como pendiente (`_docsPend_`, solo `revision`) es una de las TRES listas de
   su pantalla: «En curso», la que ven el PD y el segundo revisor, ensena tambien `recibido` y
   `analizado`. */
function puedeDecidirDoc(e){
  if(!e) return false;                                     /* como el escritorio: sin expediente, nadie decide */
  if(_docYaPublicado_(e.estado)) return false;            /* lo publicado no se mueve: el servidor no lo deja (comun.js) */
  if(_peticionRevActiva_(e)) return false;                /* 05/11: con la petición viva no decide nadie; confirman los pedidos o la cancela el PD */
  var yo=yoNombre();
  var rev=revisoresDe(e), maxR=Math.max.apply(null,rev.map(rangoNom));
  if(_autorQueNoDecide_(e,yo,rev)) return false;          /* ni mandando por rango; 04/11: sólo el PD, si `revisoresDe` se lo da, decide lo suyo */
  if(!rev.length) return false;                           /* sin revisor asignable, ni mandando por rango (maxR sería -Infinity) */
  var habilitado = rev.indexOf(yo)>=0 || rangoNom(yo)>maxR;
  if(!habilitado) return false;
  if(e.estado==='revision') return true;                  /* sin decidir: cualquiera habilitado */
  /* ya decidido: solo el que decidio, o alguien de MAS rango. El bloqueo mutuo es
     la regla cerrada del pipeline: el primero que decide bloquea a sus iguales. */
  return e.revisor===pilaDe(yo) || rangoNom(yo)>rangoPila(e.revisor);
}

/* ⛔ EL AMBITO CAE AL TEXTO CRUDO, no a `undefined` (20/08, 125.ª). `AMB_DOC` solo
   tiene las tres claves canonicas, y `revisoresDe` --en este mismo fichero-- lleva
   una rama escrita para «cuando se cuela un ambito nuevo»: o sea que el codigo ya
   cuenta con recibir uno que no esta en el enum, y la fila lo pintaba `undefined`.
   ⚠️ AL TEXTO CRUDO Y NO A UNA CADENA VACIA: enseñar el ambito desconocido tal
   cual dice QUE paso; un hueco dice que NO HAY ambito, que es falso.
   ⚠️ Las otras dos caras ya lo hacian asi (`ambDoc` en el escritorio, `_ambD_` en
   `app.html`). El movil era la unica de las tres que indexaba a pelo. */
/* ⛔⛔ Y LA TABLA ES LA LEGIBLE, LA DEL ESCRITORIO (649.ª, 14/09). Hasta hoy el móvil leía un mapa que
   devolvía el ámbito tal cual («subsistema») y el escritorio, del mismo expediente, decía «informe de
   subsistema». Decisión [27/07]: el vocabulario de Cowork no se enseña. */
function ambDocM(a){ return AMB_DOC[a] || String(a || '—'); }
/* ⚠️ `esAutor`, no `mio` (20/10): en el escritorio `filaDoc(d, mio)` significa «puedo decidir», o sea lo
   CONTRARIO; con el mismo nombre, portar una línea de una cara a la otra la invertía sin error. */
function filaDoc(e,esAutor){
  /* ⛔ ESTA FUNCION NO LLAMABA A `estDoc` NUNCA: reescribia el mapa a mano y caia a
     `[e.estado,'neu']`, o sea al **enum crudo del backend** — la lista decia «publicando»
     o «analizado» y la ficha de esa misma fila decia otra cosa. Y ese arreglo YA se habia
     hecho: `EST_DOC` nacio con el comentario «el movil pintaba `e.estado` en crudo y el
     miembro leia «revision» o «anot»». Esta se quedo fuera. */
  var st=[estDoc(e.estado)[0], _pilEstDoc_(e.estado)];
  if(_peticionRevActiva_(e)) st=['pendiente de confirmaciones','pend'];   /* 05/11 (`pedirrev`) */
  /* ⛔ EL BORDE SE DECIDE POR SI SIGUE EN CURSO, no por descarte. Aquí sólo `cambios`
     escapaba del ámbar de «pendiente», así que **`publicado` y `rechazado` — que
     `comun.js` declara RESUELTOS en `DOC_RESUELTO` — llevaban borde de atención**: la
     misma fila con píldora verde «publicado» y borde ámbar, dos estados contradictorios
     sobre un expediente ya cerrado.
     ⚠️ Y se pregunta por la **puerta que ya existe** (`_docEnCurso_`), no por una lista
     nueva: el día que se añada un estado, esto lo hereda en vez de quedarse viejo — que
     es exactamente cómo nació este fallo. */
  var _pend = _docEnCurso_(e.estado) && e.estado!=='cambios';
  return '<div class="fila clic '+(esAutor?(e.estado==='cambios'?'borde-no':(_pend?'borde-pe':''))+'':'')+'" data-doc="'+e.id+'" data-p>'+
    '<div class="a"><b>'+esc(e.titulo)+'</b><small><span class="mono">'+e.ref+'</span> · '+
    esc(e.autor.split(' ')[0])+' · '+ambDocM(e.ambito)+'</small></div>'+
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
    /* 12/11 (refutar18): `_autoresDe_` (comun.js), no `d.autor`: quien firma con otro (`analisis.autores`) también tiene el documento como SUYO. */
    (_autoresDe_(d).indexOf(_yoDoc)>=0 ? ENTREGABLES : ENT_REV).push(d);
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

/* ⛔⛔ «EN CURSO» LA VE EL PD **Y JOSE**, no solo el PD. El servidor ya se la sirve a los dos
   -- `getEntregables` filtra por `_nomE===DOC_PD || _nomE===_docJose_()` --, asi que Jose se
   descargaba el pipeline entero en el telefono y NO VEIA NI UNO: `vDocs` lo pintaba
   `if(esPD())`, y `esPD()` es `rol==='pd' || cargo==='Project Director'` -- Jose es
   `Coordinador`. Peor todavia: `_docsRelevantes_` contaba `ENT_REV` con la misma condicion,
   asi que si no tenia nada propio la pantalla le decia «Nada por aqui» teniendo la lista
   cargada, y ni siquiera le salia la pestaña.
   ⛔ Se pregunta por `REV2_NOM`, que es la puerta que YA existe y que `_rederivarRev2_` calcula
   del panel -- no por un nombre escrito a mano, que es lo que dejaria a Jose fuera el dia que
   el segundo revisor sea otro. */
function _veEnCurso_(){
  return esPD() || (typeof REV2_NOM!=='undefined' && REV2_NOM && yoNombre()===REV2_NOM);
}

function _docsRelevantes_(){
  /* Con `||[]` porque estas listas las llena el backend y pueden no haber llegado. Antes
     asumían que sí, y al usarse desde `_destVisibles_` -que corre en CADA pintado- un dato
     que falta dejaba de romper una pantalla para romper la app entera. */
  return !!((_docsPend_()||[]).length || (ENTREGABLES||[]).length ||
            (_veEnCurso_() && (ENT_REV||[]).length));
}

/* ⛔⛔ «EN CURSO» SE SACA A SU PROPIA FUNCION PARA PODER EJECUTARLA. `vDocs` no la corre
   ningun banco -- es la pantalla Documentos entera del movil --, asi que lo que se decida
   aqui dentro no lo vigila nadie. Sacarla es lo mismo que se hizo con `_botonesDecM_`. */
function _docsEnCursoM_(){
  /* ⛔⛔ POR `_docEnCurso_`, NO POR UN FILTRO PROPIO. Esto era `ENT_REV.concat([])`, o sea
     el pipeline ENTERO bajo un titulo que dice «Todos los expedientes abiertos ahora
     mismo»: `publicado` y `rechazado` salian ahi con su pildora VERDE, y `comun.js` los
     declara `DOC_RESUELTO` **a proposito** -- su comentario dice «esto es lo que sigue EN
     VUELO». A fin de temporada la lista era el historico entero.
     ⛔ Y SIN DUPLICAR LO PENDIENTE: `pend` sale de `_docsPend_()`, que filtra este mismo
     `ENT_REV`, asi que el 100 % de lo pendiente salia DOS VECES en la misma pantalla, con
     el mismo contador. En el escritorio las dos listas son disjuntas POR CONSTRUCCION.
     ⚠️ Se comparan las ENTRADAS, no los `id`: `_docsPend_` devuelve los mismos objetos de
     `ENT_REV`, y comparar por `id` inventaria una clave que el reparto no promete. */
  var _p = _docsPend_() || [];
  return (ENT_REV||[]).filter(function(e){
    if(!_docEnCurso_(e.estado)) return false;
    for(var i=0;i<_p.length;i++){ if(_p[i] === e) return false; }
    return true;
  });
}

/* ⛔⛔ EL HISTORIAL: lo que ya está CERRADO (`publicado`, `rechazado`) de los expedientes que NO son tuyos.
   Daniel, 31/10: «una vez la rechazas, ya no te vuelve a aparecer nunca más». `ENT_REV` lo trae el servidor
   (`getEntregables`: lo que revisas, sea del estado que sea) y «En curso» lo descarta A PROPÓSITO por `_docEnCurso_`,
   así que un revisor que rechazaba (o publicaba) un expediente lo perdía de TODA la pantalla, con su «Deshacer»
   dentro de la ficha. Lo tuyo no hace falta aquí: «Mis documentos» ya lo lista sea cual sea su estado.
   ✅ Por `_docResuelto_` (comun.js), la misma puerta que usa el escritorio en «Resueltos»; sin lista propia. */
/* ⛔ refutar35 (13/11): Y LO QUE DECIDISTE Y TODAVÍA NO SE HA PUBLICADO (`aprobado`, `anot`, `cambios`), para quien NO ve «En curso» (una coordinadora).
   Sólo `publicado`/`rechazado` salían aquí: al cerrar la ficha de un expediente recién aprobado, Cris no lo tenía en NINGUNA lista —ni pendiente,
   ni en curso, ni historial— y el «Deshacer» del error de dedo (que existe justo para eso) se perdia en cuanto cerraba la ficha, durante los minutos
   hasta que se publica (y hoy `aprobado` puede quedarse, ver `project_documentos_sin_publicador`). El PD y José ya los tienen en «En curso». */
function _docsResueltosM_(){
  var enCurso=_veEnCurso_();
  return (ENT_REV||[]).filter(function(e){
    return _docResuelto_(e.estado) || (!enCurso && (e.estado==='aprobado' || e.estado==='anot' || e.estado==='cambios'));
  });
}
/* Plegado de serie: lo pendiente sigue arriba, sin mezclarse con lo cerrado. Un toque lo abre. */
var DOC_HIST_ABIERTO=false;

function vDocs(){
  var mios=ENTREGABLES;
  var pend=_docsPend_();
  var enCurso=_docsEnCursoM_();
  var h='<div class="h1">Documentos</div><p class="h1s">Tus documentos y los que tienes que revisar.</p>';
  /* NADA DE NADA: una sola caja explicada, en vez de tres estados vacios decorados que
     juntos miden media pantalla. La explicacion hace falta UNA vez, no tres. */
  /* ⛔ 21/10 (auditor 11, 🟠 2): sin expedientes LLEGADOS no se dice «Nada por aquí»: no se sabe. */
  if(typeof ENT_LLEGO!=='undefined' && ENT_LLEGO===false)
    return h+'<div class="tarj">'+vacio('No se han podido leer los documentos',
      'Se reintenta solo.',
      '',false)+'</div>';
  if(!_docsRelevantes_()){
    return h+'<div class="tarj">'+vacio('Nada por aquí',
      /* 21/10 (auditor 11, 🟡 7): `esCoord()` incluye al SUBCOORDINADOR, y el reparto (`coordinadorDe`, y el servidor)
         sólo nombra a quien tiene `cargo:'Coordinador'`: a él no le llega nada, y se le prometía. */
      'No tienes nada que revisar ni has enviado nada.',
      '',false)+'</div>';
  }
  h+='<h2 class="sec">Pendiente de tu revisión<span class="ln"></span>'+pend.length+'</h2>';
  h+= pend.length
    ? '<div class="tarj">'+pend.map(function(e){return filaDoc(e,false);}).join('')+'</div>'
    : '<div class="tarj">'+vacioMini(esCoord()?'Ningún documento espera tu firma.'
        :'Nada que revisar: tus documentos los firma tu coordinador.')+'</div>';
  if(_veEnCurso_()){
    h+='<h2 class="sec">En curso<span class="ln"></span>'+enCurso.length+'</h2>'+
       '<div class="tarj">'+
       (enCurso.length
         ? enCurso.map(function(e){return filaDoc(e,false);}).join('')+
           ''
         : vacioMini('Ningún expediente del equipo está abierto.'))+
       '</div>';
  }
  h+='<h2 class="sec">Mis documentos<span class="ln"></span>'+mios.length+'</h2>'+
     '<div class="tarj">'+
     (mios.length
       /* 14/11 (refutar46): «tu documento tiene cambios» llega aquí, y lo que pide algo de ti va PRIMERO (el orden sigue siendo el de llegada
          dentro de cada grupo: `sort` es estable). */
       ? mios.slice().sort(function(a,b){ return (b.estado==='cambios')-(a.estado==='cambios'); }).map(function(e){return filaDoc(e,true);}).join('')
       : vacioMini('Todavía no has enviado ninguno. Los que envíes aparecerán aquí con su estado.'))+
     '</div>';
  var hist=_docsResueltosM_();
  if(hist.length){
    h+='<h2 class="sec">Historial<span class="ln"></span>'+hist.length+'</h2>'+
       '<div class="tarj">'+
       (DOC_HIST_ABIERTO
         ? hist.map(function(e){return filaDoc(e,false);}).join('')
         : '<p class="rnota" style="margin:0 0 10px">Lo que ya está decidido, por ti o por alguien de más rango. Abre uno para verlo o, si lo decidiste tú, deshacerlo.</p>')+
       '<button class="btn full" data-p data-dochist>'+(DOC_HIST_ABIERTO?'Ocultar historial':'Ver historial ('+hist.length+')')+'</button>'+
       '</div>';
  }
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
  return '<div class="avisolargo" style="margin-top:10px"><b>¿Versión nueva?</b> Se envía como sustitución por el formulario; hasta que la aprueben, sigue publicado este.</div>'+
    _pasosHTML_(ps, 8, 6);
}

function _pasosCorregirM_(e){
  var ps = (typeof _pasosCorregirDoc_==='function') ? _pasosCorregirDoc_(e) : [];
  if(!ps.length) return '';
  return '<div class="avisolargo" style="margin-top:10px"><b>Para corregirlo son dos pasos, '+
    'en este orden.</b></div>'+
    _pasosHTML_(ps, 8, 6);
}

function _docAutorHTML_(e){
  if(!e || _autoresDe_(e).indexOf(yoNombre())<0) return '';   /* 12/11 (refutar18): también quien lo firma con otro */
  var est=e.estado;
  var m=_docAutorModelo_({estado:est, nota:e.nota, decision:e.decision, decidedAt:e.decidedAt, revisor:e.revisor, url:e.paginaNotion});
  if(!m) return '';
  var marco='<div class="avisolargo" style="margin-top:14px">';
  /* ⛔ EL ROTULO DECIA «Reenviar corregido» Y NO REENVIA NADA: `Codigo.gs:965-967`
     solo cambia el estado. Un boton que promete subir un archivo hace que quien lo
     pulsa CREA que ya lo ha subido, y se queda esperando a un revisor que abriria el
     archivo viejo. Ahora dice lo que hace. */
  /* ⛔ 27/10: SIN el botón «Ya está corregido»: la corrección que llega por el formulario devuelve el
     expediente a revisión sola (un envío nuevo = una ronda nueva, `servidor.e_push_entregable`). */
  if(m.tipo==='cambios') return marco+m.html+'</div>'+_pasosCorregirM_(e);
  /* Un RECHAZADO dice cómo rehacerlo desde el modelo común (`_docAutorModelo_`): las dos caras lo mismo. */
  return marco+m.html+'</div>'+(m.tipo==='decidido' ? _pasosSustituirM_(e) : '');
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

/* ⛔ LOS CUATRO BOTONES, EN SU PROPIA FUNCION. Estaban incrustados en el chorro de HTML de
   `verDoc`, que necesita media docena de globals para correr: por eso NINGUN banco podia
   ejecutarlos, y por eso el hueco de `_yaAnalizado_` vivio aqui sin que nadie lo viera.
   Sacarlo no es estetica: es lo que lo hace medible. */
/* El panel de «Cambiar autores» (PD y José, sin decidir): '' si no toca. Una sola puerta para la ficha y para `_botonesDecM_`. */
function _autorPDoc_(e){
  return (_puedeCambiarAutor_(e.estado, yoNombre()) && !_peticionRevActiva_(e)) ? _autorPanelHTML_('dA', e.id, _autoresActualesDe_(e), '') : '';
}
function _botonesDecM_(e){
  /* ✅ PARAR SI, PUBLICAR NO. `cambios` y `rechazado` son legitimos sobre algo que aun no
     ha pasado el analisis -- son justo la forma de pararlo--; `aprobado` y `anot`
     publican, y el servidor los rechaza (`_decAcciones_` lo decide, en `comun.js`).
     13/11 (docdecidir): cada accion enseña SU panel y el boton que decide vive dentro. */
  return _decPanelesHTML_(e, {yo: yoNombre(), pre: 'd', prePedir: 'pR', autorHTML: _autorPDoc_(e),
    anotHTML: _yaAnalizado_(e) ? _anotPanelHTML_('d', _anotActualDe_(e), e.id, '', {excluir:yoNombre()}) : '',
    boton: function(acc, rot, cls){ return '<button class="btn ' + cls + '" data-p data-dec="' + acc + '" data-id="' + e.id + '">' + esc(rot) + '</button>'; },
    deshacerHTML: _puedeDeshacerDoc_(e)
      ? '<div class="dec-fila"><button class="btn" style="flex:1 1 100%" data-p data-dec="deshacer" data-id="'+e.id+'">Deshacer y devolver a revisión</button></div>' : ''});
}

/* ⛔ QUÉ ESTÁS PISANDO (ficha del 20/08). La decisión anterior —quién, cuándo, qué y por qué— sólo la
   veía el AUTOR (`_docAutorHTML_`); el escritorio la pinta siempre (`_previaDocE_`), con su porqué:
   «es lo que hay que juzgar para decidir si se pisa». Y el PD, que puede pisar a cualquiera, revisa
   en el teléfono: se le ofrecían los cuatro botones sin decirle sobre qué. Mismas tres puertas de
   `comun.js` que la gemela; sólo cambia la envoltura y que aquí el campo es `estado`, no `est`. */
function _previaDocM_(e){
  if(!e) return '';
  if(!(e.estado==='cambios'||e.estado==='rechazado'||e.revisor)) return '';
  var acc=_accionDocTxt_(e.decision&&e.decision.accion)||_accionDocTxt_(e.estado);
  var aju=_ajustesDocTxt_(e), fir=_firmaDocTxt_(e);
  return '<div class="avisolargo" style="margin:10px 0"><b>'+
    (fir?('Decidió '+esc(fir)):'Última decisión')+(acc?' · '+esc(acc):'')+'</b> '+
    (e.nota ? esc(e.nota) : (acc==='Aprobado' ? 'Aprobado sin anotaciones.' : ''))+
    (aju?'<br>Ajustó: '+esc(aju):'')+
    ((typeof _revisadoPorTxt_==='function' && _revisadoPorTxt_(e))?'<br>'+esc(_revisadoPorTxt_(e)):'')+'</div>';
}

function verDoc(id){
  var e=ENTREGABLES.concat(ENT_REV).filter(function(x){return x.id===id;})[0];
  if(!e) return;
  _DOC_ABIERTO_=id;   /* 14/11: la que relee `_refrescarDocAbierto_` */
  var puede=puedeDecidirDoc(e);
  var revs=revisoresDe(e).map(function(n){return n.split(' ')[0];}).join(' o ');
  var sinRev=!revs;
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
  var _autorP = _autorPDoc_(e);
  var acc = puede
    ? '<h4>Tu decisión</h4>'+_revisionPropuestaHTML_(e, yoNombre())+
      /* ⛔ «CON ANOTACIONES» NO ES UN ADORNO: el título corregido SÓLO VIAJA en esa rama
         (`movil.html` construye `extra` únicamente ahí). Sin esas dos palabras, quien
         corrige el título y pulsa **Aprobar** lo publica con el VIEJO y sin un solo aviso:
         cree que lo corrigió. Lo que estaba mal era el RÓTULO, no el comportamiento —
         `CLAUDE.md` dice que «aprobar con anotaciones» es justo lo que ajusta título y
         etiquetas, y el escritorio ya lo rotulaba bien.
         ⚠️ Y el móvil se contradecía A SÍ MISMO dos líneas más abajo: las etiquetas SÍ
         decían «al aprobar con anotaciones». Asimetría entre caras Y dentro de una cara. */
      /* 28/10: los cuatro campos y SolarIA, en el panel COMPARTIDO con el escritorio (`comun.js` `_anotPanelHTML_`):
         título, subtítulo, confidencialidad (desplegable público/interno) y etiquetas. Sólo donde se puede aprobar. */
      _botonesDecM_(e)
    /* ⛔ LA RAMA DEL AUTOR SALE DE `_docAutorHTML_`, y no de un `estado==='cambios'` aquí
       dentro. Aquí había UNA sola rama y todo lo demás caía al `else` de abajo, así que al
       autor de un expediente RECHAZADO se le decía «Este expediente lo revisa X. Tú no
       decides aquí» —sobre SU documento y SU rechazo, sin motivo, sin quién y sin cuándo—.
       El motivo existía: `Codigo.gs:995` lo guarda en `e.nota` igual que para `cambios`.
       ⚠️ Se llama UNA vez y se guarda: llamarla dos veces en el ternario duplicaría el
       trabajo y, el día que lleve estado dentro, daría dos respuestas distintas. */
    : _mioDoc
      ? _mioDoc
      /* 12/11 (refutar18): a quien le PIDEN confirmar la revisión (es su revisor mientras la petición vive) no se le dice «lo revisa <él>. Tú no
         decides aquí»: lo que le toca lo dice `_peticionRevHTML_` justo debajo (como en el escritorio, que aquí pone ''). */
      : (_peticionRevActiva_(e) && revisoresDe(e).indexOf(yoNombre())>=0 ? ''
        : revisoresDe(e).indexOf(yoNombre())>=0 && e.estado!=='revision'
          ? '<p class="rnota" style="margin-top:14px">'+ico('candado')+' Ya está decidido. Puedes consultarlo, pero solo alguien de más rango puede cambiar la decisión.</p>'
          : (sinRev ? '<p class="rnota" style="margin-top:14px">Sin revisor: avisa al Project Director.</p>'
                    : '<p class="rnota" style="margin-top:14px">Este expediente lo revisa <b>'+revs+'</b>. Tú no decides aquí.</p>'));

  abrirModal('<div class="mtit">'+esc(e.titulo)+'</div>'+
    '<div class="msub"><span class="mono">'+e.ref+'</span> · '+esc(e.autor)+' · '+esc(e.subsistema)+'</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'+
      '<span class="pil neu">'+ambDocM(e.ambito)+'</span>'+
      /* ⛔ La clase sale de `EST_DOC`, no de un ternario a mano: el `else` era `conf` y
         pintaba **«rechazado» en VERDE** al autor que abre su propio expediente. */
      '<span class="pil '+_pilEstDoc_(e.estado)+'">'+esc(estDoc(e.estado)[0])+'</span>'+
      (_peticionRevActiva_(e) ? '<span class="pil pend">pendiente de confirmaciones</span>' : '')+   /* 05/11 (`pedirrev`) */
      /* ⛔ EL `else` ERA `conf` -VERDE-: cualquier severidad que no fuera `alta` ni
         `media` se pintaba con el color de «salio bien», y el texto salia literalmente
         «calidad undefined», porque `sevTxt` solo tiene baja/media/alta. Un `"high"`
         de Cowork -- que es el caso esperable, no el raro: el contrato ya mezcla
         ingles -- se le presentaba al que firma como el documento mas limpio de la
         bandeja.
         ⛔ El escritorio YA lo tenia arreglado (chip neutro + «calidad sin medir») y
         esta cara se quedo fuera del arreglo. Misma leccion que `_pilEstDoc_`: «no lo
         se» no es «confirmado». Desde el 19/08 `_normSev_` corta esto en el servidor;
         esto de aqui es el cinturon, porque la maqueta no pasa por el. */
      /* ⛔⛔ EL CHIP SE PINTA SIEMPRE, TAMBIÉN CON `null` (05/10). Aquí había un
         `(e.sev? … :'')`, así que una severidad que nadie reconoció **no pintaba NADA** en
         esta cara — y `null` NO es el caso raro: es lo que `_normSev_` devuelve para todo lo
         que no esté en el enum, y lo que `_normDocM_` pone a propósito.
         ⛔ Lo decidido es lo contrario, y está escrito desde el 27/07 (`decisiones-app.md`):
         *«si no hay dato, «calidad sin medir», NO un valor»*. El escritorio ya lo cumplía —
         `chipSevDoc` pinta siempre, desde sus TRES llamadas — y esta cara se quedó fuera.
         ⚠️ Y no da igual omitirlo: sin chip, el revisor no distingue «nadie midió la
         calidad» de «esta pantalla no enseña la calidad». Son dos cosas, y la primera es un
         motivo para mirar el documento antes de firmarlo. Es §3c-9 otra vez: lo que sólo
         está en una cara es el fallo que nadie ve. */
      '<span class="pil '+(e.sev==='alta'?'no':e.sev==='media'?'pend':e.sev==='baja'?'conf':'neu')+'">calidad '+(sevTxt[e.sev]||'sin medir')+'</span>'+
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
    /* ⛔ POR LA PUERTA UNICA (`_visorDocHTML_`), y la pregunta es «¿hay enlace?», no
       «¿se le saca el id?». Con un enlace que no case con `/d/<ID>/` esto decia «no trae
       enlace al archivo» sobre uno que SI lo trae, y mandaba a pedirselo al autor --
       mientras el escritorio, con el mismo dato, pintaba el visor. El caso del enlace no
       reconocible lo resuelve `_cargarVisor_`, que lo DICE y ofrece el enlace.
       Nace ABIERTO: esta pantalla existe para leer el archivo antes de decidir, y decidir
       sin abrirlo es aprobar a ciegas. */
    _visorDocHTML_(e.drive, e.ref,
      '<div class="doc"><div class="dcar">Este expediente no trae enlace al archivo.<br>'+
      /* 21/10 (auditor 19, 🟡 6): a quien lo SUBIÓ no se le manda a pedírselo a quien lo subió. */
      (_mioDoc ? 'Vuelve a mandarlo por el formulario con el enlace al archivo.</div></div>'
               : 'Pídeselo a quien lo subió antes de decidir.</div></div>'))+
    '<p class="rnota" style="margin-top:10px">'+(sinRev?'Sin revisor: avisa al Project Director.':'Revisa: <b>'+revs+'</b>')+'</p>'+
    /* 31/10: el rastro lo ve cualquiera; el campo para cambiar el autor, sólo el PD y José y sin decidir (`comun.js`). */
    _autorRastroHTML_(e)+_autoresDocHTML_(e)+
    (puede ? '' : _autorP)+   /* con la decisión a la vista, «Cambiar autores» es una acción más de `_botonesDecM_` (13/11) */
    _peticionRevHTML_(e, yoNombre(), 'pR', puede)+   /* 05/11 (`pedirrev`): el rastro, la cola de quien confirma y el panel del PD */
    (_mioDoc ? '' : _previaDocM_(e))+
    /* 01/11: sólo el PD, y sólo enseña algo si el expediente está decidido (`comun.js`); para cualquier otro es ''. */
    _fbpdRaiz_('ficha', e.id, 'btn mini')+
    acc);
  /* Se cablea DESPUES de abrir el modal: un iframe dentro de la cadena de strings no
     arranca hasta que esta en el DOM. */
  _cablearVisor_();
}

/* 14/11 — LA FICHA ABIERTA TAMBIÉN SE PONE AL DÍA. Daniel: «que en documentos el PD no tenga la pantalla desactualizada. Por diseño eso no debería ser
   así. Se supone que se actualiza cada segundo». Lo de cada segundo ya existía (`_arrancarVivo_`), pero con un modal abierto `_refrescoVivo_` no toca
   nada, y la ficha de un documento ES un modal: quien la leía cinco minutos decidía sobre el estado de cuando la abrió, y el PD podía pisar sin saberlo
   lo que una coordinadora acababa de decidir (refutar44). Aquí se relee SÓLO esa ficha y SÓLO si el sello de los documentos cambió (no es un
   `getEntregables` por segundo). Con algo escrito en la ficha no se repinta, que se perdería: se avisa encima. */
var _DOC_ABIERTO_=null, _DOC_SELLO_=null, _REFDOC_=false;
function _firmaDocM_(e){ return e ? [e.estado, e.revisor||'', (e.decision&&e.decision.accion)||'', e.nota||'', _peticionRevActiva_(e)?1:0].join('|') : ''; }
async function _refrescarDocAbierto_(sellos){
  if(_DOC_ABIERTO_==null) return;
  if(!_modalAbierto_()){ _DOC_ABIERTO_=null; return; }
  var se=sellos ? [sellos['entregables'], sellos['kv/entregables']].join('|') : null;
  if(se!==null && se===_DOC_SELLO_) return;
  if(_REFDOC_ || typeof api==='undefined' || typeof api.getEntregables!=='function') return;
  _REFDOC_=true;
  try{
    var id=_DOC_ABIERTO_, antes=ENTREGABLES.concat(ENT_REV).filter(function(x){return x.id===id;})[0];
    var L=await api.getEntregables(); if(!Array.isArray(L)) return;
    _DOC_SELLO_=se;
    var ahora=L.filter(function(x){return x && x.id===id;})[0];
    _repartirEntregablesM_(L);
    if(!ahora || _firmaDocM_(ahora)===_firmaDocM_(antes) || _DOC_ABIERTO_!==id || !_modalAbierto_()) return;
    var fir=(ahora.decision&&ahora.decision.revisor)||ahora.revisor||'', acc=_accionDocTxt_(ahora.decision&&ahora.decision.accion)||_accionDocTxt_(ahora.estado);
    var txt=(fir?fir+' acaba de decidirlo':'Acaba de cambiar')+(acc?': '+acc:'')+'.';
    if(!_MODAL_TOCADO_){ var sc=$('#modal .card').scrollTop; verDoc(id); $('#modal .card').scrollTop=sc; txt+=' Lo que ves ya está al día.'; }
    else txt+=' Lo de abajo aún es de antes (lo que escribiste sigue ahí): revísalo antes de decidir.';
    var b=document.getElementById('docCambio');
    if(!b){ b=document.createElement('div'); b.id='docCambio'; b.className='avisolargo'; b.style.margin='0 0 10px'; var mb=$('#modal-body'); mb.insertBefore(b, mb.firstChild); }
    b.textContent=txt;
  }catch(_){ } finally { _REFDOC_=false; }
}
