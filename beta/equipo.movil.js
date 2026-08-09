/* ═══ EQUIPO · cara movil ═══════════════════════════════════════════════════════════
   9 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* Habia dos en este mismo fichero (`_pilaDeM_` y `pilaDe`) con distinto fallback. Queda
   esta, con el bueno: si el nombre no esta en el roster, el nombre de pila. */
function _pilaDeM_(n){
  var m=(DATA.miembros||[]).filter(function(x){ return x.nombre===n; })[0];
  return (m && m.pila) || String(n||'').split(' ')[0];
}

/* Se rederivaban SOLO el PD, asi que REV2_NOM se quedaba en el nombre de la semilla y el
   rango 2 no existia con datos reales: Jose podia decidir un expediente en el escritorio y
   no en el movil. El segundo revisor es Jose Manuel Torres (DOC_JOSE en el backend); si no
   estuviera en el roster, se cae al coordinador de la UCT antes que a un nombre inventado. */
function _rederivarPD_(){
  var ms=DATA.miembros||[];
  var pd=ms.filter(function(m){ return m.cargo==='Project Director'; })[0];
  if(pd) PD_NOM=pd.nombre;
  /* ⛔ AQUÍ HABÍA UN NOMBRE PROPIO DENTRO DE UN REGEX (`/^José Manuel Torres/`), y decidía
     quién puede aprobar un expediente de subsistema. Daniel: *«es porque José es coordinador
     de la UCT, no por ser él sino por su cargo»*. La derivación vive ahora en `comun.js`
     (`_rederivarRev2_`), UNA para las dos caras: el escritorio la calculaba distinto. */
  _rederivarRev2_();
}



function aprobadorDe(autor,unidad){
  var c=coordinadorDe(unidad);
  if(c!==autor) return {nom:c,escalado:false};
  return {nom:PD_NOM,escalado:true};
}

/* Rol efectivo: en login REAL manda YO.cargo (el conmutador ST.rol es solo de la demo). Así el
   PD/coordinador que entra de verdad ve «Convocar reunión», el Panel PD, etc. */
function esCoord(){ return ST.rol==='coord' || ST.rol==='pd' || (typeof YO!=='undefined' && YO && (YO.cargo==='Coordinador' || YO.cargo==='Project Director')); }

function esPD(){ return ST.rol==='pd' || (typeof YO!=='undefined' && YO && YO.cargo==='Project Director'); }

function vEstado(){
  /* La capa de NOVEDADES va lo primero de la pantalla de inicio: es lo que hay que
     mirar antes que nada, y desaparece sola en cuanto se marca todo como visto. */
  var _nov=(typeof _novHTML_==='function')?_novHTML_('movil'):'';
  var pend=sumaE('pend');
  var av='';
  if(pend>0){
    var rt=aprobadorDe(YO.nombre,YO.unidad);
    av+='<div class="aviso" data-ir="horas" data-p><span class="ic"><svg><use href="#i-warn"/></svg></span>'+
      '<div style="flex:1"><b>'+h1(pend)+' esperando aprobación</b>'+
      '<p>Todavía no cuentan. Las firma '+esc(rt.nom.split(' ')[0])+', '+
      (rt.escalado?'Project Director':'coordinador de tu unidad')+'.</p></div>'+
      '<span class="chev">›</span></div>';
  }
  var cambios=ENTREGABLES.filter(function(e){return e.estado==='cambios';});
  if(cambios.length){
    av+='<div class="aviso mal" data-ir="docs" data-p><span class="ic"><svg><use href="#i-warn"/></svg></span>'+
      '<div style="flex:1"><b>Un documento tuyo tiene cambios pedidos</b>'+
      '<p><span class="mono">'+cambios[0].ref+'</span> · corrígelo y reenvíalo a revisión.</p></div>'+
      '<span class="chev">›</span></div>';
  }
  /* NO uses `REUNION` aqui: es el puntero de la pantalla de Reuniones y cambia al
     navegar, asi que este aviso te mandaba a cubrir la que estabas mirando mientras la
     que cierra manana no salia por ningun lado. Y de no cubrir a tiempo salen sanciones. */
  var _pend=_pendientesCubrirM_();
  if(_pend.length){
    var _p0=_pend[0], _resto=_pend.length-1;
    av+='<div class="aviso" data-ir="reu" data-reuid="'+esc(String(_p0.id))+'" data-p>'+
      '<span class="ic"><svg><use href="#i-warn"/></svg></span>'+
      '<div style="flex:1"><b>Te falta cubrir '+(_pend.length>1?(_pend.length+' disponibilidades'):'una disponibilidad')+'</b>'+
      /* ⛔ EL PLAZO EN PALABRAS, no la fecha cruda — y aqui es donde mas se nota: **este
         aviso existe justo para que no te caigan sanciones** (lo dice el comentario de
         arriba). «Cierra el 20/08/2026» obliga a mirar el calendario **dentro de una
         alerta**; «cierra HOY» es la alerta. Misma puerta que la lista, la ficha y la
         tarjeta del Estado: cuatro sitios diciendo lo mismo con las mismas palabras. */
      '<p>«'+esc(_p0.titulo)+'» — '+esc(_plazoTxtM_(_p0))+
        (_resto>0 ? (', y '+_resto+' más después') : '')+'.</p></div>'+
      '<span class="chev">›</span></div>';
  }

  /* Las tareas salieron de aqui: tienen pestana propia y en la portada solo alargaban
     la primera pantalla repitiendo lo mismo. */

  /* EL ORDEN: Conducta ABRE la pantalla. Se probo a mandarla al final (MEJ-1) y Daniel
     lo revirtio el 28/07: «estaba muchisimo mas guapo antes que estuviese arriba». */
  return _nov+'<div class="tarj">'+cab('Conducta','ciclo '+DATA.temporada)+medidorHTML()+'</div>'+
    av+
    /* LAS HORAS SALIERON DE AQUI (Daniel, 28/07: «quitaria las horas de estado y las
       dejaria solo en horas»). Estaban en dos pantallas con la misma cifra y la misma barra.
       Lo que se queda es el AVISO de horas esperando firma, arriba: eso no es una cifra que
       consultar, es algo que hacer. */
    /* OJO: aquí NO va `REUNION`. Ese es el puntero de la pantalla de Reuniones y cambia
       al navegar por la lista, así que esta tarjeta acababa mostrando «la última que
       abriste» con el rótulo de «la próxima». */
    _proxReuHTML_();
}

/* Quién coordina qué: consulta, no tarea diaria. Se abre desde el menú ⋮. */
function _coordinacionHTML_(){
  var coords=_activos_().filter(function(m){ return m.cargo; });
  return '<div class="mtit">El equipo</div>'+
    '<div class="msub">Quién coordina cada unidad</div>'+
    '<div class="tarj" style="margin:0">'+(coords.length?coords.map(function(m){
      return '<div class="fila"><div class="a"><b>'+esc(m.nombre)+'</b>'+
        '<small>'+(m.cargo==='Project Director'?'Project Director':'coordina '+esc(m.unidad))+'</small></div></div>';
    }).join('')
    : vacio('Sin datos de coordinación','Todavía no ha llegado quién coordina cada subsistema.','',false))+'</div>'+
    '<p class="rnota" style="text-align:center;margin:14px 0 0">SOLARIS · datos a '+esc(_isoADMY_(DATA.generado||''))+'</p>';
}

