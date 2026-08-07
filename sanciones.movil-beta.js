/* ═══ SANCIONES · cara movil ═══════════════════════════════════════════════════════════
   19 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

async function _cargarSancionesM_(){
  if(!esPD()) return;
  try{ var a=await api.getSanciones({estado:'pendiente'}); if(Array.isArray(a)) SANC_M=a; }
  catch(e){}
}

async function _cargarMovimientosM_(){
  if(typeof MOVS==='undefined') return;
  MOVS.length=0;                                  // fuera la semilla, pase lo que pase
  try{
    var a=await api.getMisMovimientos();
    if(Array.isArray(a)) a.forEach(function(s){ MOVS.push(_movDeSancion_(s)); });
  }catch(e){ /* backend viejo o sin red: se queda vacío, que es lo que hacía antes */ }
}

/* La misma busqueda con distinto nombre en cada cara; se envuelve para que el bloque de
   autoridad de abajo sea IDENTICO en las dos y un diff lo confirme de un vistazo. */
/* EQUIVALENTE (no GEMELA): misma busqueda con distinto ayudante en cada cara —existe JUSTO para que el bloque de autoridad de debajo si sea identico—. */
function _mSanc_(n){ return (DATA.miembros||[]).filter(function(x){ return x.nombre===n; })[0]||null; }

/* QUIEN MANDA A EFECTOS DE SANCIONES · EQUIVALENTE (movil/escritorio).
   No es `yoNombre()`: ese sale de `YO`, y **`YO` se reescribe con «ver como»**, asi que el PD
   mirando la ficha de otro heredaba la jurisdiccion de ese otro. El backend (v49) compara
   contra `ident.nombre` -el de la SESION-, de modo que la cara y el servidor estaban
   respondiendo a preguntas distintas. La autoridad no se hereda mirando. */
function _actorSanc_(){
  if (typeof backendOK !== 'undefined' && backendOK && SESION && SESION.nombre) return SESION.nombre;
  return yoNombre();               // demo local (?demo), donde no hay sesion
}

function _sancionesHTML_(){
  /* El gate es el RANGO DE SANCIONES, no el cargo: Bruno tiene rango 2 sin ser nada en los
     documentos, y un consejero sin gente debajo es rango 0 aunque este en el consejo. */
  if(rangoSanc(_actorSanc_())<1) return '<div class="mtit">Sanciones</div>'+
    '<div class="msub">Esto no es para ti.</div>';
  /* La lista sale de la MISMA regla que el permiso. Ofrecer a alguien y que luego el envio
     falle es peor que no ofrecerlo: parece un fallo cuando es la norma. Y uno mismo SI esta,
     en los tres rangos, que es parte del modelo. */
  var grupos=_gruposSanc_(_actorSanc_(), SANC_FORM.filtro);
  var nTotal=sancionablesPor(_actorSanc_()).length;
  var esPlazo=(SANC_FORM.motivo==='plazo'||SANC_FORM.motivo==='plazoUrg');
  /* LAS TAREAS DEL SANCIONADO, no las mias -antes se ofrecian las propias y por eso no se
     podia sancionar a nadie por un plazo-. `null` = todavia se estan pidiendo. Y solo las
     VIVAS con enlace a Notion: sin `url` no se puede mover la fecha, y ofrecerla seria
     prometer algo que va a fallar al guardar. */
  var _tt=esPlazo ? _tareasDe_(SANC_FORM.quien, function(){
    if($('#modal').classList.contains('on')){ abrirModal(_sancionesHTML_()); _cablearSanciones_(); }
  }) : [];
  var cargandoT=(_tt===null);
  var tareas=(_tt||[]).filter(function(t){
    return t && t.url && !/hech|finaliz|complet|termin|cerrad/i.test(t.e||''); });
  return '<div class="mtit">Sanciones</div>'+
    '<div class="msub">Ponerlas y decidirlas. El comunicado sigue saliendo del escritorio.</div>'+
    '<h4>Poner una sanción</h4><div class="tarj">'+
      /* BUSCADOR, no desplegable. Con 40 personas un `<select>` es una lista que hay que
         recorrer con el pulgar; aquí se escriben tres letras. Filtra por nombre, pila o
         subsistema, y SIN TILDES: «aaron» encuentra a «Aarón». */
      '<label class="campo"><span class="sc">A quién</span>'+
        '<input id="snFiltro" placeholder="Escribe para filtrar · nombre o subsistema" '+
        'value="'+esc(SANC_FORM.filtro||'')+'" autocomplete="off"></label>'+
      '<div class="sanlista" id="snLista">'+_listaSancHTML_(grupos)+'</div>'+
      '<label class="campo"><span class="sc">Motivo</span><select id="snMotivo">'+
        '<option value="">— elige —</option>'+
        RRI_MOTIVOS.map(function(r){ return '<option value="'+r[0]+'"'+(SANC_FORM.motivo===r[0]?' selected':'')+'>'+esc(r[1])+'</option>'; }).join('')+
      '</select></label>'+
      (SANC_FORM.motivo==='libre'
        ? '<label class="campo"><span class="sc">Cuál</span><input id="snLibre" placeholder="Qué ha pasado" value="'+esc(SANC_FORM.libre||'')+'"></label>'+
          '<label class="campo"><span class="sc">Artículo del RRI</span><input id="snArt" value="'+esc(SANC_FORM.art||'libre')+'"></label>'
        : '')+
      (esPlazo
        ? (!SANC_FORM.quien
            ? '<p class="rnota" style="margin:0 0 10px">Elige primero a quién sancionas: las tareas '+
              'que se ofrecen son <b>las suyas</b>.</p>'
          : cargandoT
            ? '<p class="rnota" style="margin:0 0 10px">Buscando las tareas de '+
              esc(_pilaDeM_(SANC_FORM.quien)||SANC_FORM.quien)+'…</p>'
          : tareas.length
            ? '<label class="campo"><span class="sc">Qué tarea</span><select id="snTarea">'+
                '<option value="">— elige la tarea —</option>'+
                tareas.map(function(t){ return '<option value="'+esc(t.url)+'"'+(SANC_FORM.tarea===t.url?' selected':'')+'>'+esc(t.n||t.nombre||'(sin título)')+
                  (t.l?' · vencía '+esc(_isoADMY_(t.l)):'')+'</option>'; }).join('')+
              '</select></label>'+
              '<label class="campo"><span class="sc">Plazo nuevo</span><input type="date" id="snPlazo" value="'+esc(SANC_FORM.plazo||'')+'"></label>'+
              '<p class="rnota" style="margin:0 0 10px">El plazo nuevo se escribe <b>en Notion</b>. '+
              'Si eso falla, la sanción <b>no</b> se pone: no tiene sentido sancionar por un plazo y '+
              'dejar la tarea con la fecha vencida.</p>'
            : '<p class="rnota" style="margin:0 0 10px;color:var(--warn)">'+
              esc(_pilaDeM_(SANC_FORM.quien)||SANC_FORM.quien)+' no tiene ninguna tarea viva con enlace '+
              'a Notion, así que no se puede mover ningún plazo. Elige otro motivo.</p>')
        : '')+
      '<label class="campo"><span class="sc">Puntos</span><input type="number" id="snPts" value="'+esc(SANC_FORM.pts||'-1')+'" step="1" min="-5" max="0"></label>'+
      '<button class="btn pri full" data-p id="btnSanc">Poner la sanción</button>'+
      '<p class="rnota" id="snMsg" style="margin:8px 0 0"></p>'+
    '</div>'+
    '<h4>Pendientes de decidir</h4>'+_sancColaHTML_();
}

function _sancColaHTML_(){
  if(SANC_M===null) return '<div class="tarj">'+vacio('Cargando…','Buscando qué espera decisión.','',true)+'</div>';
  if(!SANC_M.length) return '<div class="tarj">'+vacio('Nada pendiente','Ninguna sanción espera decisión.','',false)+'</div>';
  var porLote={};
  SANC_M.forEach(function(x){ var k=x.lote||'(sueltas)'; (porLote[k]=porLote[k]||[]).push(x); });
  return Object.keys(porLote).map(function(k){
    var it=porLote[k], suelta=(k==='(sueltas)');
    return '<div class="tarj"><div class="lote"><div class="lote-h">'+
      '<b>'+it.length+' '+(it.length===1?'sanción':'sanciones')+'</b>'+
      '<span class="mono" style="color:var(--red2)">'+esc(k)+'</span></div>'+
      it.map(function(x){
        return '<div class="lote-i" style="flex-wrap:wrap;gap:6px">'+
          '<span class="n">'+esc(_pilaDeM_(x.nombre)||x.nombre||'')+'</span>'+
          '<span class="mono" style="color:var(--ink3);font-size:10.5px;flex:1">'+esc(x.motivo||'')+
            ' · '+(+x.puntos||0)+'</span>'+
          (suelta
            ? '<button class="btn mini" data-sok="'+esc(x.id)+'" data-p>Aprobar</button>'+
              '<button class="btn mini" data-sno="'+esc(x.id)+'" data-p style="color:var(--warn);border-color:var(--warn)">Rechazar</button>'
            : '<button class="btn mini" data-smarc="'+esc(x.id)+'" data-dec="aceptar" data-p'+
                (x.dec==='aceptar'?' class="btn mini on"':'')+'>Sí</button>'+
              '<button class="btn mini" data-smarc="'+esc(x.id)+'" data-dec="rechazar" data-p>No</button>')+
        '</div>';
      }).join('')+
      (suelta ? ''
        : '<p class="rnota">Dentro de un lote no se decide una a una: se marca cada una y el '+
          'bloque se cierra entero, porque aprobar de una en una podía aplicar medio bloque.</p>'+
          '<button class="btn full" data-scerrar="'+esc(k)+'" data-p>Cerrar el bloque entero</button>')+
    '</div></div>';
  }).join('');
}

/* Abre la pantalla y la deja cableada. Se vuelve a llamar despues de cada accion en vez de
   repintar a mano: asi la cola y el formulario no pueden quedar diciendo cosas distintas. */
async function _abrirSanciones_(){
  abrirModal(_sancionesHTML_());
  _cablearSanciones_();
  if(SANC_M===null){ await _cargarSancionesM_(); if($('#modal').classList.contains('on')){
    abrirModal(_sancionesHTML_()); _cablearSanciones_(); } }
}

function _cablearSanciones_(){
  var val=function(id){ var e=$('#'+id); return e?e.value:''; };
  var msg=function(t,mal){ var b=$('#snMsg'); if(b){ b.textContent=t; b.style.color=mal?'var(--warn)':'var(--ink3)'; } };

  /* LO PRIMERO: guardar TODO lo escrito antes de cualquier repintado. Esto es exactamente lo
     que faltaba: al cambiar el motivo se repintaba el modal y la persona elegida volvia al
     primero de la lista. El estado vivia en el DOM, y el DOM se rehace. */
  function recoger(){
    ['snMotivo','snLibre','snArt','snTarea','snPlazo','snPts','snFiltro'].forEach(function(id){
      var e=$('#'+id); if(!e) return;
      SANC_FORM[{snMotivo:'motivo',snLibre:'libre',snArt:'art',snTarea:'tarea',
                 snPlazo:'plazo',snPts:'pts',snFiltro:'filtro'}[id]]=e.value;
    });
  }
  function repintar(){ recoger(); abrirModal(_sancionesHTML_()); _cablearSanciones_(); }

  /* Elegir persona NO repinta el formulario: solo se marca en la lista. Repintar por esto
     seria volver a tirar lo escrito, que es el fallo que se acaba de arreglar. */
  $$('[data-sanq]').forEach(function(b){
    b.onclick=function(){
      SANC_FORM.quien=b.dataset.sanq;
      $$('[data-sanq]').forEach(function(x){ x.classList.toggle('on', x===b); });
      var m=$('#snMsg'); if(m){ m.textContent='A '+(_pilaDeM_(SANC_FORM.quien)||SANC_FORM.quien)+'.'; m.style.color='var(--ink3)'; }
      /* Con el motivo de plazo, cambiar de persona cambia LA LISTA DE TAREAS, asi que hay que
         repintar. En los demas motivos no se repinta: seria tirar lo escrito por nada. */
      if(SANC_FORM.motivo==='plazo'||SANC_FORM.motivo==='plazoUrg'){ SANC_FORM.tarea=''; repintar(); }
    };
  });
  /* Teclear rehace SOLO la lista, no el formulario. Y no pierde el foco ni el cursor. */
  var fi=$('#snFiltro');
  if(fi) fi.oninput=function(){
    SANC_FORM.filtro=fi.value;
    var c=$('#snLista'); if(!c) return;
    c.innerHTML=_listaSancHTML_(_gruposSanc_(_actorSanc_(), SANC_FORM.filtro));
    $$('[data-sanq]',c).forEach(function(b){
      b.onclick=function(){
        SANC_FORM.quien=b.dataset.sanq;
        $$('[data-sanq]').forEach(function(x){ x.classList.toggle('on', x===b); });
        if(SANC_FORM.motivo==='plazo'||SANC_FORM.motivo==='plazoUrg'){ SANC_FORM.tarea=''; repintar(); }
      };
    });
  };

  /* El motivo decide QUE MAS se pide, asi que al cambiarlo hay que repintar. Pero se recoge
     todo antes, y `_sancionesHTML_` vuelve a pintar lo elegido. */
  var mo=$('#snMotivo');
  if(mo) mo.onchange=function(){ repintar(); };
  var pl=$('#snPlazo'); if(pl) pl.onchange=function(){ SANC_FORM.plazo=pl.value; };

  var bt=$('#btnSanc');
  if(bt) bt.onclick=async function(){
    var quien=SANC_FORM.quien, mot=val('snMotivo'), pts=parseInt(val('snPts'),10);
    /* Propia del ENVIO: `esPlazo` es de la funcion que pinta y aqui no existe. */
    var esDePlazo=(mot==='plazo'||mot==='plazoUrg');
    if(!quien){ msg('Elige a quién: pulsa un nombre de la lista.', true); return; }
    if(!mot){ msg('Elige el motivo.', true); return; }
    if(!(pts<=0)){ msg('Los puntos de una sanción son 0 o negativos.', true); return; }
    var art=mot, texto='';
    RRI_MOTIVOS.forEach(function(r){ if(r[0]===mot) texto=r[1]; });
    if(mot==='libre'){
      texto=(val('snLibre')||'').trim(); art=(val('snArt')||'libre').trim();
      if(!texto){ msg('Escribe qué ha pasado.', true); return; }
    }
    var urlTarea='', plazo='';
    if(mot==='plazo'||mot==='plazoUrg'){
      urlTarea=val('snTarea'); plazo=val('snPlazo');
      if(!urlTarea){ msg('Elige la tarea cuyo plazo se incumplió.', true); return; }
      if(!plazo){ msg('Pon el plazo nuevo: sancionar por un plazo y no darle otro no arregla nada.', true); return; }
      /* De la lista DEL SANCIONADO -`SANC_TAREAS`-, no de `TAREAS`, que son las mias. Si se
         busca aqui, el titulo no aparece y el motivo queda en «una tarea»: es lo que le paso a
         la sancion de Jose del 28/07. Lo que se pinta y lo que se guarda tienen que salir del
         MISMO sitio. */
      var t=((SANC_TAREAS&&SANC_TAREAS.lista)||[]).filter(function(x){ return x.url===urlTarea; })[0];
      texto='Incumplir el plazo de «'+((t&&(t.n||t.nombre))||'una tarea')+'»';
      art=(mot==='plazoUrg') ? '30b' : '30c';   // el articulo REAL del RRI
    }
    if(typeof backendOK==='undefined' || !backendOK || !SESION){
      msg('Sin conexión no se puede: esto escribe en la cola de verdad.', true); return; }
    bt.disabled=true; var prev=bt.textContent; bt.textContent='Guardando…';
    try{
      /* EL ORDEN IMPORTA: primero Notion, luego la sancion. Si Notion falla no se sanciona;
         al reves quedaria la sancion puesta y la tarea con la fecha vieja, que es la unica de
         las dos combinaciones que no se ve mirando la cola. */
      if(mot==='plazo'||mot==='plazoUrg'){
        msg('Moviendo el plazo en Notion…');
        await api.moverLimiteTarea(urlTarea, plazo);
      }
      await api.pushSancion([{nombre:quien, motivo:texto, articulo:art, puntos:pts, origen:'manual'}]);
      SANC_M=null; SANC_FORM={quien:'', motivo:'', libre:'', art:'', tarea:'', plazo:'', pts:'-1', filtro:''};
      tost('Sanción puesta a '+(_pilaDeM_(quien)||quien)+'.'+(esDePlazo?' Plazo movido en Notion.':''));
      _abrirSanciones_();
    }catch(e){
      bt.disabled=false; bt.textContent=prev;
      msg('No se pudo: '+((e&&e.message)||e), true);
    }
  };

  /* Sueltas: se deciden una a una. */
  $$('[data-sok]').forEach(function(b){ b.onclick=function(){ _decidirSancM_(b.dataset.sok,'aprobar',b); }; });
  $$('[data-sno]').forEach(function(b){ b.onclick=function(){ _decidirSancM_(b.dataset.sno,'rechazar',b); }; });
  /* De lote: se MARCA, y el bloque se cierra entero. */
  $$('[data-smarc]').forEach(function(b){
    b.onclick=async function(){
      b.disabled=true;
      try{ await api.decidirSancion(b.dataset.smarc,'marcar',{decision:b.dataset.dec});
        (SANC_M||[]).forEach(function(x){ if(String(x.id)===b.dataset.smarc) x.dec=b.dataset.dec; });
        abrirModal(_sancionesHTML_()); _cablearSanciones_();
      }catch(e){ b.disabled=false; tost('No se pudo marcar: '+((e&&e.message)||e)); }
    };
  });
  $$('[data-scerrar]').forEach(function(b){
    b.onclick=async function(){
      var lote=b.dataset.scerrar;
      var it=(SANC_M||[]).filter(function(x){ return (x.lote||'(sueltas)')===lote; });
      var sinMarcar=it.filter(function(x){ return !x.dec; });
      if(sinMarcar.length){ tost('Faltan '+sinMarcar.length+' por marcar: el bloque se cierra entero.'); return; }
      b.disabled=true; b.textContent='Cerrando…';
      /* EN SERIE: cada `decidirSancion` coge el LockService del backend, y en paralelo se
         pisan entre ellas. Es lento y es lo correcto. */
      try{
        for(var i=0;i<it.length;i++)
          await api.decidirSancion(it[i].id, it[i].dec==='rechazar'?'rechazar':'aprobar', {});
        SANC_M=null; tost('Bloque cerrado · '+it.length+' sanciones.'); _abrirSanciones_();
      }catch(e){ b.disabled=false; b.textContent='Cerrar el bloque entero';
        tost('Se quedó a medias: '+((e&&e.message)||e)); }
    };
  });
}

async function _decidirSancM_(id, accion, b){
  b.disabled=true;
  try{ await api.decidirSancion(id, accion, {});
    SANC_M=null; tost(accion==='aprobar'?'Sanción aprobada.':'Sanción rechazada.'); _abrirSanciones_();
  }catch(e){ b.disabled=false; tost('No se pudo: '+((e&&e.message)||e)); }
}

function arcoSeg(i,r){
  var a0=(-90+i*MSTEP+MGAP/2)*Math.PI/180, a1=(-90+(i+1)*MSTEP-MGAP/2)*Math.PI/180;
  return 'M'+(MC+r*Math.cos(a0)).toFixed(2)+' '+(MC+r*Math.sin(a0)).toFixed(2)+
         ' A'+r+' '+r+' 0 0 1 '+(MC+r*Math.cos(a1)).toFixed(2)+' '+(MC+r*Math.sin(a1)).toFixed(2);
}

function estadoPts(p){return p<=2?'evaluacion':(p>=9?'elegible':'normal');}

/* COLOR DE CADA TRAMO DEL MEDIDOR (decisión de Daniel, 27/07).
   Al ser ELEGIBLE el anillo deja de ser rojo: los tramos del medio pasan a AZUL y los dos
   últimos —9/10 y 10/10— a VERDE, que es lo que se está celebrando.
   OJO con la corrección del 27/07: el verde de los 10/10 va en la BARRITA RECTA de las 12
   (ver `_colorTick_`), no en el arco. Aquí el tramo de las 12 es azul como los demás: no
   es un caso especial. Los arcos son las curvas; los ticks, las rectas de fuera. */
function _colorSeg_(i, p){
  var eleg = p>=9;
  if(!eleg) return (i<3 && p<=3) ? 'url(#gWa)' : 'url(#gRed)';
  /* Las DOS ULTIMAS curvas van VERDES; las del medio, azules. */
  return (i>=8) ? 'url(#gVer)' : 'url(#gAzu)';
}

/* LA BARRITA DE LAS 12 es la primera y la última a la vez, como en un reloj: marca dónde
   empieza y dónde acaba la vuelta. Se pone verde SI Y SOLO SI tienes los 10; con 9 sigue
   azul, porque la vuelta no está cerrada. */
function _colorTick_(i, p){
  if(p<9) return '';                       // sin elegibilidad manda el CSS de siempre
  /* Cada barrita marca UNA cifra, y se enciende cuando esa cifra se alcanza:
       · la del 9  -> con 9 puntos (y sigue con 10);
       · la de las 12, que es a la vez la 0 y la 10 -> solo con los 10, la vuelta cerrada.
     OJO: la del 9 NO tiene la clase `f` con 9 puntos, porque `f` marca el tramo que
     ARRANCA en ella y ese tramo aun no esta lleno. Por eso el CSS del verde no puede
     colgar de `.f`. */
  if(i===9) return 'cierra';                              // 9 y 10
  if(i===0 && p>=10) return 'cierra';                     // solo 10
  return 'eleg';
}

function medidorHTML(){
  var p=YO.puntos, segs='', ticks='', halo='', i;
  for(i=0;i<10;i++){
    var lleno=i<p, crit=i<3;
    var col = lleno ? _colorSeg_(i,p) : '';
    segs+='<path class="seg '+(lleno?'on':'vac'+(crit?' zc':''))+'" '+
      (lleno?'stroke="'+col+'" ':'')+'d="'+arcoSeg(i,MR)+'"/>';
    if(lleno) halo+='<path class="halo" stroke="'+col+'" d="'+arcoSeg(i,MR)+'"/>';
    /* la marca de cada tramo, fuera del anillo: es la que CHISPEA al prender */
    var a=(-90+i*MSTEP)*Math.PI/180;
    /* El color NO depende de que el tramo este lleno: la barrita del 9 se pone verde con 9
       puntos aunque su tramo (el decimo) siga vacio. */
    ticks+='<line class="tk'+(crit?' zc':'')+(lleno?' f':'')+' '+_colorTick_(i,p)+'" data-i="'+i+'" '+
      'x1="'+(MC+72*Math.cos(a)).toFixed(1)+'" y1="'+(MC+72*Math.sin(a)).toFixed(1)+'" '+
      'x2="'+(MC+79*Math.cos(a)).toFixed(1)+'" y2="'+(MC+79*Math.sin(a)).toFixed(1)+'"/>';
  }
  var giro=p*MSTEP-MGAP/2+MTIP;
  var est=estadoPts(p);
  return '<div class="medcaja">'+
    '<div class="med late'+(est==='elegible'?' aura':'')+'" id="med" data-p role="button" tabindex="0" aria-label="Puntos de conducta: '+p+' de 10'+(est==='elegible'?', elegible':'')+'">'+
      '<svg class="dial" viewBox="0 0 172 172" aria-hidden="true">'+
        '<defs>'+
          '<linearGradient id="gRed" x1="0" y1="0" x2="1" y2="1">'+
            '<stop offset="0" stop-color="#FF6B6F"/><stop offset=".55" stop-color="#E41E25"/><stop offset="1" stop-color="#8E1418"/></linearGradient>'+
          '<linearGradient id="gWa" x1="0" y1="0" x2="1" y2="1">'+
            '<stop offset="0" stop-color="#F5B25E"/><stop offset="1" stop-color="#E8912E"/></linearGradient>'+
          /* Azul telemático y verde de la paleta: NO se inventan colores nuevos. */
          '<linearGradient id="gAzu" x1="0" y1="0" x2="1" y2="1">'+
            '<stop offset="0" stop-color="#7FC4EA"/><stop offset=".55" stop-color="#3f9ed6"/><stop offset="1" stop-color="#1E6A96"/></linearGradient>'+
          '<linearGradient id="gVer" x1="0" y1="0" x2="1" y2="1">'+
            '<stop offset="0" stop-color="#7BE3BE"/><stop offset=".55" stop-color="#3EB489"/><stop offset="1" stop-color="#1E7A5A"/></linearGradient>'+
        '</defs>'+
        '<g class="fili"><path transform="translate(86 86) scale(5) translate(-12 -12)" '+
          'd="M12 1Q13.4 10.6 23 12 13.4 13.4 12 23 10.6 13.4 1 12 10.6 10.6 12 1Z"/></g>'+
        '<circle class="pista" cx="86" cy="86" r="'+MR+'"/>'+
        halo+'<g class="tks">'+ticks+'</g>'+segs+
      '</svg>'+
      '<div class="tip" id="medTip" style="transform:rotate('+giro+'deg)"><i><svg viewBox="0 0 24 24"><use href="#es"/></svg></i></div>'+
      '<div class="mid"><div class="n mono"><span id="medN">0</span><small>/10</small></div></div>'+
    '</div>'+
    /* La linea de puntitos se retiro (Daniel, 27/07): con el medidor circular basta. Decia
       lo mismo dos veces y encima en horizontal, que es la lectura que el anillo evita. */

    '<div class="medley">'+
      (est==='elegible'?'<b>Elegible.</b>':est==='evaluacion'?'<b style="color:var(--red2)">En evaluación.</b>':'<b>Sin expediente.</b>')+
      (p>3
        ? ' Te quedan <b>'+(p-3)+'</b> punto'+((p-3)===1?'':'s')+' antes de la zona crítica.'
        : ' Estás en <b>zona crítica</b>: por debajo de 2 puntos se abre expediente.')+
    '</div>'+
    '<button class="btn mini" data-p id="btnLibro" style="margin-top:11px">Desglose de puntos</button>'+
  '</div>'+
  _libroPuntosHTML_();
}

/* EL LIBRO DE PUNTOS. Mismo trato que el de horas y por la misma puerta (`_ultimosMov_`):
   los ultimos de la temporada, y el registro entero se conserva. */
function _libroPuntosHTML_(){
  /* ÁMBITO TEMPORADA: los puntos se reinician con ella (RRI Art. 29), no con el mes. */
  var r=_ultimosMov_(MOVS, function(m){ return m.f; }, null, 'temporada');
  return '<div class="libro" id="libro"><div id="libroIn" style="padding-top:6px">'+
    (r.ultimos.length ? r.ultimos.map(function(m){
      /* El 0 no lleva signo: «−0» obliga a leerlo dos veces para acabar sabiendo que no te
         quitaron nada. Es el caso de una justificada. */
      var sg = m.p>0 ? '+'+m.p : (m.p<0 ? '−'+Math.abs(m.p) : '0');
      return '<div class="retf"><span class="pt'+(m.p>0?' mas':'')+'">'+sg+'</span>'+
        '<span class="mo"><b>'+esc(m.t)+'</b><small>ART. '+esc(m.art)+' · '+esc(m.f)+'</small></span>'+
        '<span class="vv">'+(m.vv || (m.rep?'vuelve el<br>'+m.rep:'no caduca'))+'</span></div>';
    }).join('') : '<div class="retf" style="opacity:.7"><span class="mo"><b>Sin movimientos esta temporada</b>'+
      '<small>Aquí aparece cada subida o bajada de puntos, con su artículo y su fecha.</small></span></div>')+
    (r.ultimos.length ? '<p class="rnota" style="margin:8px 0 0">'+_notaRegistro_(r.total,'temporada')+'</p>' : '')+
  '</div></div>';
}

/* LA SECUENCIA DE ARMADO SE QUEDA, SIEMPRE. La quite para matar un «parece que se recarga»
   y me carge lo que a Daniel mas le gustaba del medidor: los tramos encendiendose en orden.
   Si el repintado molesta, se arregla repintando menos, NO apagando la animacion. */
/* Los puntos con los que se pinto el medidor la ultima vez. Igual que `_anchoPrev_` para las
   barras, y por el mismo motivo: sobrevive a la recarga. */
function _medPrev_(){
  try{ var v=localStorage.getItem('sol_med'); return v==null?null:Number(v); }catch(_){ return null; }
}
function _medGuardar_(p){ try{ localStorage.setItem('sol_med', String(p)); }catch(_){} }

/* `forzar` = lo ha pedido una persona tocando el medidor. Daniel (07/08), aclarando el encargo
   de antes: *«pero si le doy click sí se debería reiniciar desde 0, eso sí»*.

   ⛔ La regla completa son DOS reglas, y sin la segunda el arreglo se pasa de frenada:
     · **solo** → no se rearma (recargar o repintar no es un evento que contar);
     · **tocado** → se rearma aunque los puntos no hayan cambiado, porque ahí la animación **es
       lo que se ha pedido**: es el gesto de «enséñamela otra vez», no un efecto secundario. */
function armarMedidor(silencioso, forzar){
  var med=$('#med'); if(!med) return;
  medTimers.forEach(clearTimeout); medTimers=[];
  var p=YO.puntos, giro=p*MSTEP-MGAP/2+MTIP;
  var tip=$('#medTip'), num=$('#medN');
  /* ⛔ AL RECARGAR, SI TUS PUNTOS NO HAN CAMBIADO, NO SE REBOBINA. Daniel, y van dos veces:
     *«la estrellita y la animacion deberian empezar en el punto donde estaba anteriormente al
     recargar, en lugar de en 0; eso es el fallo principal»*.

     El camino de abajo hace `remove('arm')` -vacia el anillo y manda el puntero a 0- y luego
     lo arma escalonado. Eso esta bien la primera vez que ves tus puntos; en CADA recarga es
     ver tu medidor caerse a cero y volver a subir sin que haya pasado nada.

     El dato anterior vive en `localStorage`, que es lo unico que sobrevive a un F5 -- una
     variable de modulo se reinicia con la pagina, que es justo el caso que hay que cubrir.

     ⚠️ **Y si los puntos SI han cambiado, se anima**: el se guarda esa parte a proposito
     (*«deberia cambiar si hubiera cambio de puntos en directo»*). Lo que sobra es la
     animacion que no informa de nada. */
  var _pv=_medPrev_();
  _medGuardar_(p);
  if(!forzar && _pv===p) silencioso=true;

  /* CALLADO = APARECER LLENO, sin pasar por vacio.

     Esto sale ARRIBA del todo a proposito. Debajo hay un rebobinado que quita `arm`
     (vacia el anillo), pone el puntero a 0 grados, el numero a 0 y fuerza un reflow — y ese
     reflow hace que el vacio SE PINTE. Aunque justo despues se volviera a armar de golpe,
     el ojo ya ha visto el cero: es el «se resetea por la cara» que se ve cada vez que
     llega un dato de fondo. No basta con no animar: hay que NO REBOBINAR.

     Se apaga la transicion mientras se coloca, para que el anillo no se dibuje ni el
     puntero gire; y se devuelve despues, para que el siguiente cambio de verdad si
     transicione en vez de saltar. */
  if(redu() || silencioso){
    var segs=$$('.seg.on',med);
    segs.forEach(function(x){ x.style.transition='none'; });
    if(tip) tip.style.transition='none';
    med.classList.add('arm');
    if(num) num.textContent=p;
    if(tip) tip.style.transform='rotate('+giro+'deg)';
    void med.offsetWidth;
    segs.forEach(function(x){ x.style.transition=''; });
    if(tip) tip.style.transition='';
    return;
  }
  /* rebobinado instantáneo, para que solo el ARMADO vaya escalonado */
  med.classList.remove('arm');
  $$('.seg.on',med).forEach(function(s){s.style.transition='none';s.classList.remove('fog');});
  $$('.tk',med).forEach(function(t){
    t.classList.remove('chispa','chRoj','chOro','chAzu','chVer');
    t.style.stroke='';                     // vuelve al color que le toca por CSS
  });
  if(tip){tip.style.transition='none';tip.style.transform='rotate(0deg)';}
  if(num) num.textContent='0';
  void med.offsetWidth;
  $$('.seg.on',med).forEach(function(s){s.style.transition='';});
  if(tip) tip.style.transition='';

  /* Armado instantaneo: el estado FINAL, sin recorrerlo. Vale para quien pidio menos
     movimiento y para el repintado de fondo, que son el mismo caso -nadie ha pedido ver
     esto- aunque por motivos distintos. El color final ya lo pone el markup
     (`_colorSeg_`/`_colorTick_`), asi que aqui solo falta encenderlo. */
  /* (el caso callado/reduced ya salio arriba, antes de rebobinar) */
  med.classList.add('arm');
  if(tip) tip.style.transform='rotate('+giro+'deg)';

  var segs=$$('.seg.on',med);
  var PASO=78;          // ms entre barra y barra DENTRO de una ola
  var DESFASE=3;        // barras que va cada ola por detras de la anterior

  function fogonazo(sg){
    if(!sg) return;
    sg.classList.add('fog');
    medTimers.push(setTimeout(function(){ sg.classList.remove('fog'); },240));
  }
  /* Cada ola da un paso de mas al final, sin tramo: es para la barrita que marca TUS
     puntos. Con 10 es la de las 12, que es la misma que la del 0 —el medidor es un circulo
     y ahi la vuelta se cierra—; con 9, la del 9, cuyo tramo esta vacio y por eso ninguna
     ola normal la tocaria. */

  /* UNA OLA: recorre el anillo pintando cada tramo al pasar por el. Todas van al MISMO
     paso, asi que ninguna adelanta a la de delante: la distancia entre olas es constante y
     eso es lo que se lee como continuidad. `pinta(k)` devuelve el color del tramo k, o null
     si esta ola no tiene nada que decir ahi (la verde, en los ocho primeros).
     `p+1` pasos: el ultimo es solo la barrita de cierre. */
  function ola(t0, pinta, tinta, chispa, cuenta){
    for(var k=0;k<=p;k++){
      (function(k){
        medTimers.push(setTimeout(function(){
          var cierre = (k===p);
          var col = cierre ? null : pinta(k);
          if(col){ var sg=segs[k]; if(sg){ sg.style.stroke=col; fogonazo(sg); } }
          var iTk = cierre ? (p>=10?0:p) : k;   // el cierre con 10 es la del 0: es un circulo
          var tk = $('.tk[data-i="'+iTk+'"]',med);
          var tn = tinta(iTk);
          if(tk && tn){
            tk.style.stroke=tn;
            tk.classList.remove('chispa','chRoj','chOro','chAzu','chVer');
            tk.classList.add(chispa);
            void tk.getBoundingClientRect();   // reinicia la animacion; sin esto no repite
            tk.classList.add('chispa');
          }
          if(cuenta && num && !cierre) num.textContent=k+1;
        }, t0+k*PASO));
      })(k);
    }
  }

  var eleg = estadoPts(p)==='elegible';
  /* Sin elegibilidad, UNA ola y la de siempre. La cascada tiene que estar reservada o deja
     de significar nada. Aqui no se toca el color: el del markup ya es el bueno. */
  if(!eleg){
    ola(140, function(){ return null; }, function(){ return null; }, 'chRoj', true);
    return;
  }

  /* ELEGIBLE. Cuatro olas a 3 barras de distancia. El anillo arranca en ROJO aunque el dato
     ya sea de elegible: si no, la ola roja iria pintando de rojo lo que ya esta azul, que es
     la pelicula al reves. */
  med.classList.remove('aura');
  segs.forEach(function(sg){ sg.style.stroke='url(#gRed)'; });
  var ROJO='var(--red2)', ORO='#F2C94C', AZUL='var(--tel)', VERDE='#7BE3BE';
  /* QUIEN es verde lo deciden `_colorSeg_`/`_colorTick_`, que son las que pintan el estado
     final. Aqui habia dos reglas nuevas escritas a mano: con 10 puntos coincidian y con 9
     NO —ponia verdes tramos y barritas que no lo son—. Una regla, un sitio. */
  function verdeSeg(k){ return _colorSeg_(k,p)==='url(#gVer)'; }
  function verdeTk(i){ return _colorTick_(i,p)==='cierra'; }

  ola(140, function(){ return 'url(#gRed)'; }, function(){ return ROJO; }, 'chRoj', true);
  ola(140 + DESFASE*PASO, function(){ return ORO; }, function(){ return ORO; }, 'chOro', false);
  /* El aura -halo que respira y estrella dorada- entra con la ola AZUL, que es el color de
     elegible. Antes seria celebrar algo que todavia no se ve. */
  medTimers.push(setTimeout(function(){ med.classList.add('aura'); }, 140 + 2*DESFASE*PASO));
  ola(140 + 2*DESFASE*PASO, function(){ return 'url(#gAzu)'; }, function(){ return AZUL; }, 'chAzu', false);
  /* La VERDE arranca en 0 como las demas y da los mismos pasos; simplemente no tiene nada
     que pintar hasta llegar a los dos ultimos. No es un caso especial: es la misma ola.
     (Daniel: «como si empezase en 0 pero no se nota hasta donde es visible».) */
  ola(140 + 3*DESFASE*PASO,
      function(k){ return verdeSeg(k) ? 'url(#gVer)' : null; },
      function(i){ return verdeTk(i)  ? VERDE : null; },
      'chVer', false);
}

function panelPD(){
  /* LA COLA REAL. Antes se pintaba `LOTE`, la semilla de maqueta, y sus botones solo
     tocaban memoria: con cuenta real salia vacia y aun asi se podia «cerrar el bloque».
     Ahora sale de `SANC_M` (`getSanciones`), y si todavia no ha llegado se DICE, en vez de
     enseñar un cero que parece una respuesta. Decidir sigue siendo del escritorio. */
  if(SANC_M===null) return '<h2 class="sec">Panel del PD<span class="ln"></span>disciplina</h2>'+
    '<div class="tarj">'+vacio('Cargando la cola…','Buscando qué sanciones esperan decisión.','',true)+'</div>';
  if(!SANC_M.length) return '<h2 class="sec">Panel del PD<span class="ln"></span>disciplina</h2>'+
    '<div class="tarj">'+vacio('Nada pendiente','Ninguna sanción espera decisión ahora mismo.','',false)+'</div>';
  var porLote={};
  SANC_M.forEach(function(x){ var k=x.lote||'(sueltas)'; (porLote[k]=porLote[k]||[]).push(x); });
  return '<h2 class="sec">Panel del PD<span class="ln"></span>disciplina</h2>'+
    Object.keys(porLote).map(function(k){
      var it=porLote[k];
      return '<div class="tarj"><div class="lote"><div class="lote-h">'+
        '<b>'+it.length+' '+(it.length===1?'sanción':'sanciones')+'</b>'+
        '<span class="mono" style="color:var(--red2)">'+esc(k)+'</span></div>'+
        it.slice(0,8).map(function(x){
          return '<div class="lote-i"><span class="n">'+esc(_pilaDeM_(x.nombre)||x.nombre||'')+'</span>'+
            '<span class="mono" style="color:var(--ink3);font-size:10.5px">'+esc(x.motivo||'')+'</span></div>';
        }).join('')+
        (it.length>8?'<div class="lote-m">y '+(it.length-8)+' más</div>':'')+
        '<p class="rnota">Se deciden desde el <b>escritorio</b>, que es donde están el motivo, el '+
        'artículo y el comunicado. Aquí solo se consultan.</p></div></div>';
    }).join('');
}

/* La maqueta de antes se conserva SIN USAR: describe la interaccion que habra que portar el
   dia que se decida sancionar desde el movil. Borrarla seria perder el diseño; dejarla viva
   era mentir. */
function _panelPDmaqueta_(){
  var c={aceptar:0,justificar:0,rechazar:0};
  LOTE.items.forEach(function(x){c[x.dec]++;});
  var lote = !LOTE.items.length
    ? '<div class="lote">'+vacio('Sin bloques pendientes','Ninguna sanción espera tu decisión. Cuando el '+
        'motor prepare un bloque, aparecerá aquí para que lo cierres entero.','',false)+'</div>'
    : LOTE.cerrado
    ? '<div class="lote"><div class="lote-h"><b>'+LOTE.items.length+' personas</b>'+
      '<span class="pil conf">bloque cerrado</span></div>'+
      '<div class="lote-m">'+esc(LOTE.motivo)+' · Art. '+LOTE.articulo+'</div>'+
      '<p class="rnota">Entró entero y de una vez: se aplica en Notion con un único comunicado.</p></div>'
    : '<div class="lote"><div class="lote-h"><b>'+LOTE.items.length+' personas</b>'+
      '<span class="mono" style="color:var(--red2)">−1 punto c/u</span></div>'+
      '<div class="lote-m">'+esc(LOTE.motivo)+' · Art. '+LOTE.articulo+'</div>'+
      LOTE.items.map(function(x){
        var t=(x.dec!=='aceptar')?' tach':'';
        return '<div class="lrow"><span class="nm">'+esc(x.nombre.split(' ').slice(0,2).join(' '))+'</span>'+
          '<span class="vl'+t+'">'+(x.puntos===0?'aviso':x.puntos)+'</span>'+
          '<span class="decs" data-lid="'+x.id+'">'+
            '<button class="'+(x.dec==='aceptar'?'on a':'')+'" data-dec="aceptar" data-p>Acepta</button>'+
            '<button class="'+(x.dec==='justificar'?'on j':'')+'" data-dec="justificar" data-p>Justifica</button>'+
            '<button class="'+(x.dec==='rechazar'?'on r':'')+'" data-dec="rechazar" data-p>Rechaza</button>'+
          '</span></div>';
      }).join('')+
      '<div class="cierre"><div class="tx"><b style="color:var(--ok)">'+c.aceptar+'</b> se aplican · '+
        '<b>'+c.justificar+'</b> justificadas · <b style="color:var(--red2)">'+c.rechazar+'</b> rechazadas'+
        '<em>Marcar no aplica nada. No se sanciona a nadie hasta que cierras el bloque entero.</em></div>'+
        '<button class="btn pri full" style="margin-top:9px" data-p id="btnLote">Aprobar el bloque · '+c.aceptar+' sanciones</button>'+
      '</div></div>';

  var sueltas=SUELTAS.map(function(s){
    return '<div class="fila"><div class="a"><b>'+esc(s.nombre.split(' ')[0])+'</b>'+
      '<small>'+esc(s.motivo)+' · Art. '+s.articulo+'</small></div>'+
      '<div class="d"><span class="mono" style="color:var(--red2)">'+s.puntos+'</span></div></div>'+
      '<div style="display:flex;gap:7px;margin:2px 0 10px;flex-wrap:wrap">'+
        '<button class="btn mini ok" data-p>Aprobar</button>'+
        '<button class="btn mini" data-p>Modificar</button>'+
        '<button class="btn mini" data-p>Justificar</button>'+
        '<button class="btn mini no" data-p>Rechazar</button></div>';
  }).join('');

  return '<h2 class="sec">Panel del PD<span class="ln"></span>disciplina</h2>'+
    '<div class="tarj"><div class="fila" style="padding-top:0"><div class="a"><b>Sancionar a un miembro</b>'+
      '<small>Puntos del RRI (Título VII) o motivo libre</small></div>'+
      '<div class="d"><button class="btn mini" data-p id="btnSancionar">Abrir</button></div></div></div>'+
    '<h2 class="sec">Cola de sanciones<span class="ln"></span>'+(LOTE.items.length?(LOTE.cerrado?'bloque cerrado':'bloque abierto'):'vacía')+'</h2>'+
    lote+
    (sueltas?'<h2 class="sec">Sueltas<span class="ln"></span>'+SUELTAS.length+'</h2><div class="tarj">'+sueltas+'</div>':'');
}

function sancionarModal(){
  var motivos=RRI.restas.concat(RRI.sumas);
  abrirModal('<div class="mtit">🔨 Sancionar</div>'+
    '<div class="msub">Entra en la cola como <b>pendiente</b>: la confirmas aquí y se aplica después. '+
    'Varias personas a la vez van en un mismo bloque, con <b>un único comunicado</b>.</div>'+
    '<label class="campo"><span class="sc">A quién</span><select id="scPer">'+
      _activos_().map(function(m){return '<option>'+esc(m.nombre)+'</option>';}).join('')+'</select></label>'+
    '<label class="campo"><span class="sc">Motivo del RRI</span><select id="scMot">'+
      motivos.map(function(m){return '<option value="'+m.id+'">Art. '+m.art+' — '+esc(m.texto)+'</option>';}).join('')+
      '</select></label>'+
    '<label class="campo"><span class="sc">Puntos</span><input class="mono" id="scPts" value="-1"></label>'+
    '<button class="btn pri full" style="margin-top:8px" data-p id="btnScOK">Añadir a la cola</button>');
  $('#btnScOK').onclick=function(){ cerrarModal(); tost('Añadida a la cola (pendiente de confirmar).'); };
}

