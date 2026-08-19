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
    /* ⛔ QUIEN FIRMA LO DECIDE EL SUBSISTEMA DEL PARTE, NO LA UNIDAD DE LA PERSONA, y aquí se
       nombraba a `coordinadorDe(YO.unidad)` sobre una cola que `sumaE` suma ENTERA. Daniel
       (06/08): *«si Bruno ficha en concepto de coordinador de logística no es lo mismo que
       fichando en concepto de miembro de propulsión»* — el perfil fija el subsistema, y el
       subsistema fija quién firma (`_firmaDe_`). La pantalla de fichar ya lo hace bien
       (`aprobadorDe(YO.nombre,_perfilElegido_())`); ésta se quedó en `YO.unidad` y nombraba a
       alguien que no firma la mitad de esas horas, en el aviso que existe justo para saber a
       quién reclamar.
       ⛔ Y AQUÍ NO SE ARREGLA NOMBRANDO AL BUENO: `normPMovil` no conserva el subsistema del
       parte, así que desde este aviso no hay con qué partir la cola por perfil. Lo que se
       quita es la AFIRMACIÓN, no el aviso — y sólo donde no se puede sostener: con un perfil
       único no hay ambigüedad y se sigue diciendo quién firma.
       📌 PENDIENTE (`docs/pendientes.md`): llevar el subsistema en `normPMovil` y partir el
       aviso por perfil es el arreglo entero, y toca un fichero que no es éste. */
    var _unPerfil=!_hayQuePreguntarPerfil_(YO);
    var rt=_unPerfil?aprobadorDe(YO.nombre,YO.unidad):null;
    av+='<div class="aviso" data-ir="horas" data-p><span class="ic"><svg><use href="#i-warn"/></svg></span>'+
      '<div style="flex:1"><b>'+h1(pend)+' esperando aprobación</b>'+
      '<p>Todavía no cuentan. '+(rt
        ? ('Las firma '+esc(rt.nom.split(' ')[0])+', '+
           (rt.escalado?'Project Director':'coordinador de tu unidad')+'.')
        : 'Las firma quien coordine el subsistema de cada parte.')+'</p></div>'+
      '<span class="chev">›</span></div>';
  }
  var cambios=ENTREGABLES.filter(function(e){return e.estado==='cambios';});
  if(cambios.length){
    /* ⛔ CON DOS DECÍA «Un documento» Y NOMBRABA SÓLO EL PRIMERO, mientras el globo del nav
       —`badges()`, con EL MISMO filtro— decía «2». Dos criterios para la misma pregunta en dos
       sitios que se leen a la vez: se va a Docs, se corrige el que se nombra, y el otro no
       existe para nadie. La forma se copia del aviso de reuniones, que está diez líneas más
       abajo en este mismo fichero y ya contaba; no se inventa otra manera de decirlo.
       ⚠️ Sin el «después» del hermano a propósito: aquella lista va ordenada por lo que caduca
       antes, y ésta llega en el orden que traiga el servidor. */
    var _c0=cambios[0], _cresto=cambios.length-1;
    av+='<div class="aviso mal" data-ir="docs" data-p><span class="ic"><svg><use href="#i-warn"/></svg></span>'+
      '<div style="flex:1"><b>'+(_cresto>0
        ? (cambios.length+' documentos tuyos tienen cambios pedidos')
        : 'Un documento tuyo tiene cambios pedidos')+'</b>'+
      '<p><span class="mono">'+_c0.ref+'</span>'+(_cresto>0?(', y '+_cresto+' más'):'')+
        ' · '+(_cresto>0?'corrígelos y reenvíalos':'corrígelo y reenvíalo')+' a revisión.</p></div>'+
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
/* ⛔ ESTO ENSEÑABA EL SUBSISTEMA DE CADA UNO, NO LO QUE COORDINA (`'coordina '+esc(m.unidad)`),
   y filtraba por `m.cargo`. Son las dos mitades del mismo agujero que `coordinadorDe` cerró en
   `comun.js` el 14/08 — Daniel: *«es porque José es coordinador de la UCT, no por ser él sino
   por su cargo»* —, y ahí quedó escrito lo que aquí faltaba: **nadie tiene una Unidad como
   `unidad`**, el roster guarda una sola por persona y es su subsistema. Consecuencias, las dos
   en la única pantalla que existe para contestar «¿a quién le llega esto?»:
     · la **Unidad de Documentación Técnica no podía salir NUNCA** (ni ninguna otra Unidad);
     · **quien coordina algo SIN cargo no aparecía en la lista** — la semilla de `movil.html`
       tiene ese caso puesto a propósito, y en el equipo real hay uno de dos perfiles.
   ✅ `coordina` se recorre por su puerta, `_unidadesCoord_`, la misma que usa `coordinadorDe`:
   llega como cadena, lista o nada, y **una cadena no se itera** (recorrer «Aviónica» daría
   ocho unidades de una letra). La unidad propia entra sólo si lo dice el CARGO, que es una
   condición distinta de «es su subsistema».
   ⚠️ Y a quien conste como `Coordinador` sin nada que coordinar se le pinta **el cargo**, no
   una unidad deducida: dejarlo fuera de la lista sería tan falso como inventarle una. */
function _coordinacionHTML_(){
  var filas=[];
  _activos_().forEach(function(m){
    if(m.cargo==='Project Director'){ filas.push({nom:m.nombre,txt:'Project Director'}); return; }
    var us=_unidadesCoord_(m.coordina);
    if(m.cargo==='Coordinador' && m.unidad && us.indexOf(m.unidad)<0) us.unshift(m.unidad);
    if(us.length) filas.push({nom:m.nombre,txt:'coordina '+us.join(' · ')});
    else if(m.cargo) filas.push({nom:m.nombre,txt:m.cargo});
  });
  return '<div class="mtit">El equipo</div>'+
    '<div class="msub">Quién coordina cada unidad</div>'+
    '<div class="tarj" style="margin:0">'+(filas.length?filas.map(function(f){
      return '<div class="fila"><div class="a"><b>'+esc(f.nom)+'</b>'+
        '<small>'+esc(f.txt)+'</small></div></div>';
    }).join('')
    : vacio('Sin datos de coordinación','Todavía no ha llegado quién coordina cada subsistema.','',false))+'</div>'+
    '<p class="rnota" style="text-align:center;margin:14px 0 0">SOLARIS · datos a '+esc(_isoADMY_(DATA.generado||''))+'</p>';
}

