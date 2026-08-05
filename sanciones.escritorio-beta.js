/* ═══ SANCIONES · cara escritorio ═══════════════════════════════════════════════════════════
   18 funciones sacadas de `escritorio.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* La misma busqueda con distinto nombre en cada cara; se envuelve para que el bloque de
   autoridad de abajo sea IDENTICO en las dos y un diff lo confirme de un vistazo. */
/* EQUIVALENTE (no GEMELA): misma busqueda con distinto ayudante en cada cara —existe JUSTO para que el bloque de autoridad de debajo si sea identico—. */
function _mSanc_(n){ return _m(n); }

function sancionPor(tipo,nombre){
  if(tipo!=='general'&&tipo!=='junta'&&tipo!=='consejo') return {p:0,txt:'sin sanción automática · potestad del coordinador'};
  if(tipo==='junta'||tipo==='consejo') return {p:1,txt:'1 punto · escala plana'};
  var v=VECES[nombre]||0;
  if(v===0) return {p:0,txt:'aviso · 1.ª vez, sin puntos'};
  if(v===1) return {p:1,txt:'1 punto · 2.ª vez'};
  return {p:2,txt:'2 puntos · 3.ª o más (tope 2)'};
}

async function _cargarMovimientosE_(){
  MOVS_E.length=0;
  try{
    var a=await api.getMisMovimientos();
    if(Array.isArray(a)) a.forEach(function(s){ MOVS_E.push(_movDeSancion_(s)); });
  }catch(_){ }
}

function arco(i,r,frac){
  var a0=(-90+i*ASTEP+AGAP/2)*Math.PI/180;
  var a1=(-90+i*ASTEP+AGAP/2+(ASTEP-AGAP)*frac)*Math.PI/180;
  return 'M'+(ACX+r*Math.cos(a0)).toFixed(2)+' '+(ACY+r*Math.sin(a0)).toFixed(2)+
    ' A'+r+' '+r+' 0 0 1 '+(ACX+r*Math.cos(a1)).toFixed(2)+' '+(ACY+r*Math.sin(a1)).toFixed(2);
}

function anilloHTML(valor,etiqueta){
  var segs='',ticks='',i;
  for(i=0;i<10;i++){
    var f=Math.max(0,Math.min(1,valor-i));
    segs+='<path class="seg vac'+(i<3?' zc':'')+'" d="'+arco(i,AR,1)+'"/>';
    if(f>0) segs+='<path class="seg" stroke="'+(i<3?'var(--warn)':'var(--red)')+'" d="'+arco(i,AR,f)+'"/>';
    var a=(-90+i*ASTEP)*Math.PI/180;
    ticks+='<line class="tk'+(f>0?' f':'')+'" x1="'+(ACX+60*Math.cos(a)).toFixed(1)+'" y1="'+(ACY+60*Math.sin(a)).toFixed(1)+
      '" x2="'+(ACX+66*Math.cos(a)).toFixed(1)+'" y2="'+(ACY+66*Math.sin(a)).toFixed(1)+'"/>';
  }
  return '<div class="anillo"><svg viewBox="0 0 150 150"><circle class="pista" cx="75" cy="75" r="'+AR+'"/>'+
    ticks+segs+'</svg><div class="mid"><div class="n mono">'+nf(valor,1)+'<small>/10</small></div>'+
    '<div class="u">'+esc(etiqueta)+'</div></div></div>';
}

/* el rango de puntos del bloque se CALCULA, nunca se escribe a mano: un aviso (0
   puntos) no es «-1 punto», y un bloque puede mezclar valores. */
function rangoLote(){
  var vals=[],avisos=0;
  LOTE.items.forEach(function(x){ if(!Number(x.pts)) avisos++; else if(vals.indexOf(x.pts)<0) vals.push(x.pts); });
  vals.sort(function(a,b){return Math.abs(a)-Math.abs(b);});
  var et=function(pp){ return (pp>0?'+':'−')+Math.abs(pp)+' '+(Math.abs(pp)===1?'punto':'puntos'); };
  var nS=LOTE.items.length-avisos;
  var t = !vals.length ? '' : (vals.length===1 ? et(vals[0])+(nS>1?' c/u':'')
        : 'de '+et(vals[0])+' a '+et(vals[vals.length-1]));
  if(avisos) t += (t?' · ':'')+avisos+' aviso'+(avisos===1?'':'s');
  return t;
}

/* Los dos envoltorios que hacen que el bloque de arriba pueda ser IDENTICO al del movil:
   alli `_pilaDeM_` busca en el roster y `yoNombre()` sale de `YO`. Aqui ya existen `_m` y
   `ACTOR`, asi que se envuelven en vez de duplicar la busqueda. */
function _pilaDeM_(n){ var m=_m(n); return (m&&m.pila)||''; }

function _actorSanc_(){
  if (typeof backendOK !== 'undefined' && backendOK && SESION && SESION.nombre) return SESION.nombre;
  return ACTOR;                    // demo local, donde no hay sesion
}

function _sancSueltas_(){
  if(!Array.isArray(SANC_BACK)) return [];
  return SANC_BACK.filter(function(s){ return s.estado==='pendiente' && !s.lote; });
}

function _sancHist_(){
  if(!Array.isArray(SANC_BACK)) return [];
  return SANC_BACK.filter(function(s){ return s.estado && s.estado!=='pendiente'; })
    .sort(function(a,b){ return String(b.creado_at||'').localeCompare(String(a.creado_at||'')); });
}

function _selectorLotes_(){
  if(LOTES_PEND.length<2) return '';
  return '<div class="pb" style="padding-bottom:0"><label style="display:block">'+
    '<span class="sc" style="display:block;margin-bottom:5px">Hay '+LOTES_PEND.length+' bloques pendientes</span>'+
    '<select id="loteSel" style="width:100%;max-width:340px;background:#0A0909;border:1px solid var(--line);'+
    'border-radius:8px;padding:8px 10px;color:var(--ink);font:inherit;font-size:12.5px">'+
    LOTES_PEND.map(function(l,i){
      return '<option value="'+i+'"'+(i===LOTE_SEL?' selected':'')+'>'+esc(l)+'</option>'; }).join('')+
    '</select></label></div>';
}

function _panelSueltas_(){
  var ss=_sancSueltas_();
  if(!ss.length) return pan('Sanciones sueltas','ninguna',
    vacioSimple('No hay sanciones sueltas','Las que no van en bloque —cada una con su motivo y su artículo— aparecen aquí.'));
  return pan('Sanciones sueltas', ss.length+'',
    tabla([['Persona'],['Motivo'],['Art.',0],['Puntos',1],['']],
      ss.map(function(s){
        var m=_m(s.nombre);
        return '<tr><td>'+esc((m&&m.pila)||s.nombre)+'</td>'+
          '<td style="color:var(--ink2)">'+esc(s.motivo||'\u2014')+'</td>'+
          '<td class="mono" style="color:var(--ink3)">'+esc(s.articulo||'libre')+'</td>'+
          '<td class="r mono '+((+s.puntos||0)<0?'dn':'')+'">'+(Number(s.puntos)||0)+'</td>'+
          '<td class="r"><span class="decs" data-sid="'+s.id+'">'+
            '<button data-sdec="aprobar">Aplica</button>'+
            '<button data-sdec="justificar">Justifica</button>'+
            '<button data-sdec="rechazar">Rechaza</button>'+
          '</span> <button class="btn sm" data-seditar="'+s.id+'">Editar</button></td></tr>';
      }).join(''))+
    '<div class="pb" style="padding-top:0"><button class="btn sm" data-agrupar>Agrupar en un paquete</button>'+
      '<span class="sc" style="margin-left:9px">un solo comunicado para todas</span></div>'+
    '<div class="nota">Cada suelta se decide por su cuenta: no comparten motivo ni comunicado. '+
    '<b>Editar</b> corrige puntos, motivo y artículo <b>al aplicarla</b> —es lo único que deja el '+
    'backend—. <b>Revocar una ya aplicada no se hace desde aquí</b>: el servidor no deja tocar '+
    'lo aplicado, y la revocación va por <span class="mono">flujos/enviar_revocacion.py</span>.</div>');
}

function _panelHistSanc_(){
  var hs=_sancHist_();
  if(!hs.length) return pan('Historial','vacío',
    vacioSimple('Todavía no hay sanciones resueltas','Cada una que apruebes, justifiques o rechaces queda aquí con su decisión.'));
  return pan('Historial', hs.length+'',
    tabla([['Persona'],['Motivo'],['Estado',0],['Puntos',1],['Cuándo',1]],
      hs.slice(0,40).map(function(s){
        var m=_m(s.nombre);
        var et={aplicada:'aplicada',aprobada:'aprobada',justificada:'justificada',
                rechazada:'rechazada',revocada:'revocada'}[s.estado]||s.estado;
        var tono=(s.estado==='rechazada'||s.estado==='revocada')?'dn':(s.estado==='aplicada'?'up':'');
        return '<tr><td>'+esc((m&&m.pila)||s.nombre)+'</td>'+
          '<td style="color:var(--ink2)">'+esc(s.motivo||'\u2014')+'</td>'+
          '<td class="mono '+tono+'">'+esc(et)+'</td>'+
          '<td class="r mono">'+(Number(s.puntos)||0)+'</td>'+
          '<td class="r mono" style="color:var(--ink3)">'+esc(String(s.creado_at||'').slice(0,10))+'</td></tr>';
      }).join(''))+
    (hs.length>40?'<div class="nota">Se muestran las 40 más recientes de '+hs.length+'.</div>':''));
}

/* El panel. `_ponerSancCuerpo_` va aparte para poder repintar SOLO esto al cambiar el motivo:
   `pintar()` reconstruye `#main` entero y pierde el scroll, y esta pantalla lleva debajo la cola
   y el historial -saltar al principio cada vez que tocas un desplegable es inaceptable-. */
function _ponerSancionHTML_(){
  /* Rango 0 NO VE la opcion. El gate es el RANGO DE SANCIONES y no el cargo: Bruno es rango 2
     sin tocar un documento, y estar en el consejo no da rango por si solo. */
  if(rangoSanc(_actorSanc_())<1) return '';
  var n=sancionablesPor(_actorSanc_()).length;
  return pan('Poner una sanci\u00f3n', n+(n===1?' persona':' personas')+' bajo tu jurisdicci\u00f3n',
    '<div class="pb" id="ponerSanc">'+_ponerSancCuerpo_()+'</div>');
}

function _ponerSancCuerpo_(){
  var lab=function(t){ return '<span class="sc" style="display:block;margin-bottom:5px">'+t+'</span>'; };
  var E=CAMPO_CSS;
  var grupos=_gruposSanc_(_actorSanc_(), SANC_FORM.filtro);
  var esPlazo=(SANC_FORM.motivo==='plazo'||SANC_FORM.motivo==='plazoUrg');
  /* LAS TAREAS DEL SANCIONADO, no las mias -antes se ofrecian las propias y por eso no se podia
     sancionar a nadie por un plazo-. `null` = todavia se estan pidiendo. Y solo las VIVAS con
     enlace a Notion: sin `url` no se puede mover la fecha. */
  var _tt=esPlazo ? _tareasDe_(SANC_FORM.quien, function(){
    var c=$('#ponerSanc'); if(c){ c.innerHTML=_ponerSancCuerpo_(); _cablearPonerSanc_(); }
  }) : [];
  var cargandoT=(_tt===null);
  var tareas=(_tt||[]).filter(function(t){
    return t && t.url && !/hech|finaliz|complet|termin|cerrad/i.test(t.e||''); });
  return '<div class="sanwrap">'+
    '<div>'+
      '<label style="display:block;margin-bottom:9px">'+lab('A qui\u00e9n')+
        '<input id="snFiltro" placeholder="Escribe para filtrar \u00b7 nombre o subsistema" '+
        'value="'+esc(SANC_FORM.filtro||'')+'" autocomplete="off" style="'+E+'"></label>'+
      '<div class="sanlista" id="snLista">'+_listaSancHTML_(grupos)+'</div>'+
    '</div>'+
    '<div>'+
      '<label style="display:block;margin-bottom:9px">'+lab('Motivo')+
        '<select id="snMotivo" style="'+E+'"><option value="">\u2014 elige \u2014</option>'+
        RRI_MOTIVOS.map(function(r){ return '<option value="'+r[0]+'"'+(SANC_FORM.motivo===r[0]?' selected':'')+'>'+esc(r[1])+'</option>'; }).join('')+
      '</select></label>'+
      (SANC_FORM.motivo==='libre'
        ? '<label style="display:block;margin-bottom:9px">'+lab('Cu\u00e1l')+
            '<input id="snLibre" placeholder="Qu\u00e9 ha pasado" value="'+esc(SANC_FORM.libre||'')+'" style="'+E+'"></label>'+
          '<label style="display:block;margin-bottom:9px">'+lab('Art\u00edculo del RRI')+
            '<input id="snArt" value="'+esc(SANC_FORM.art||'libre')+'" style="'+E+'"></label>'
        : '')+
      (esPlazo
        ? (!SANC_FORM.quien
            ? '<div class="nota" style="margin:0 0 9px">Elige primero a quién sancionas: las tareas '+
              'que se ofrecen son <b>las suyas</b>.</div>'
          : cargandoT
            ? '<div class="nota" style="margin:0 0 9px">Buscando las tareas de '+
              esc(_pilaDeM_(SANC_FORM.quien)||SANC_FORM.quien)+'…</div>'
          : tareas.length
            ? '<label style="display:block;margin-bottom:9px">'+lab('Qu\u00e9 tarea')+
                '<select id="snTarea" style="'+E+'"><option value="">\u2014 elige la tarea \u2014</option>'+
                tareas.map(function(t){ return '<option value="'+esc(t.url)+'"'+(SANC_FORM.tarea===t.url?' selected':'')+'>'+esc(t.n||t.nombre||'(sin t\u00edtulo)')+
                  (t.l?' \u00b7 venc\u00eda '+esc(_isoADMY_(t.l)):'')+'</option>'; }).join('')+
              '</select></label>'+
              '<label style="display:block;margin-bottom:9px">'+lab('Plazo nuevo')+
                '<input type="date" id="snPlazo" value="'+esc(SANC_FORM.plazo||'')+'" style="'+E+'"></label>'+
              '<div class="nota" style="margin:0 0 9px">El plazo nuevo se escribe <b>en Notion</b>. Si eso '+
              'falla, la sanci\u00f3n <b>no</b> se pone: no tiene sentido sancionar por un plazo y dejar la '+
              'tarea con la fecha vencida.</div>'
            : '<div class="nota" style="margin:0 0 9px;color:var(--warn)">'+esc(_pilaDeM_(SANC_FORM.quien)||SANC_FORM.quien)+' no tiene ninguna tarea viva con enlace '+
              'a Notion, as\u00ed que no se puede mover ning\u00fan plazo. Elige otro motivo.</div>')
        : '')+
      '<label style="display:block;margin-bottom:11px;max-width:130px">'+lab('Puntos')+
        '<input type="number" id="snPts" value="'+esc(SANC_FORM.pts||'-1')+'" step="1" min="-5" max="0" style="'+E+'"></label>'+
      '<button class="btn pri" id="btnSanc">Poner la sanci\u00f3n</button>'+
      '<div class="nota" id="snMsg" style="margin:9px 0 0">La sanci\u00f3n entra <b>pendiente</b>: se decide '+
      'abajo, y el comunicado sale despu\u00e9s.</div>'+
    '</div>'+
  '</div>';
}

function _cablearPonerSanc_(){
  var val=function(id){ var e=$('#'+id); return e?e.value:''; };
  var msg=function(t,mal){ var b=$('#snMsg'); if(b){ b.textContent=t; b.style.color=mal?'var(--warn)':''; } };
  /* LO PRIMERO: guardar TODO lo escrito antes de cualquier repintado. El estado no puede vivir
     en el DOM, porque el DOM se rehace. */
  function recoger(){
    ['snMotivo','snLibre','snArt','snTarea','snPlazo','snPts','snFiltro'].forEach(function(id){
      var e=$('#'+id); if(!e) return;
      SANC_FORM[{snMotivo:'motivo',snLibre:'libre',snArt:'art',snTarea:'tarea',
                 snPlazo:'plazo',snPts:'pts',snFiltro:'filtro'}[id]]=e.value;
    });
  }
  /* Repinta SOLO el panel, no la pantalla. */
  function repintar(){ recoger(); var c=$('#ponerSanc'); if(!c) return;
    c.innerHTML=_ponerSancCuerpo_(); _cablearPonerSanc_(); }
  function marcar(b){
    SANC_FORM.quien=b.dataset.sanq;
    $$('[data-sanq]').forEach(function(x){ x.classList.toggle('on', x===b); });
    /* Con el motivo de plazo, cambiar de persona cambia LA LISTA DE TAREAS: hay que repintar.
       Con los demas motivos no se toca nada, que seria tirar lo escrito por nada. */
    if(SANC_FORM.motivo==='plazo'||SANC_FORM.motivo==='plazoUrg'){ SANC_FORM.tarea=''; repintar(); }
  }
  /* Elegir persona NO repinta: solo se marca. */
  $$('[data-sanq]').forEach(function(b){ b.onclick=function(){ marcar(b);
    msg('A '+(_pilaDeM_(SANC_FORM.quien)||SANC_FORM.quien)+'.'); }; });
  /* Teclear rehace SOLO la lista: ni pierde el foco ni borra lo ya elegido. */
  var fi=$('#snFiltro');
  if(fi) fi.oninput=function(){
    SANC_FORM.filtro=fi.value;
    var c=$('#snLista'); if(!c) return;
    c.innerHTML=_listaSancHTML_(_gruposSanc_(_actorSanc_(), SANC_FORM.filtro));
    $$('[data-sanq]',c).forEach(function(b){ b.onclick=function(){ marcar(b); }; });
  };
  /* El motivo decide QUE MAS se pide, asi que ese si repinta. */
  var mo=$('#snMotivo'); if(mo) mo.onchange=function(){ repintar(); };
  var pl=$('#snPlazo'); if(pl) pl.onchange=function(){ SANC_FORM.plazo=pl.value; };

  var bt=$('#btnSanc');
  if(bt) bt.onclick=async function(){
    var quien=SANC_FORM.quien, mot=val('snMotivo'), pts=parseInt(val('snPts'),10);
    /* Propia del ENVIO: `esPlazo` es de la funcion que pinta y aqui no existe. */
    var esDePlazo=(mot==='plazo'||mot==='plazoUrg');
    if(!quien){ msg('Elige a qui\u00e9n: pulsa un nombre de la lista.', true); return; }
    if(!mot){ msg('Elige el motivo.', true); return; }
    if(!(pts<=0)){ msg('Los puntos de una sanci\u00f3n son 0 o negativos.', true); return; }
    var art=mot, texto='';
    RRI_MOTIVOS.forEach(function(r){ if(r[0]===mot) texto=r[1]; });
    if(mot==='libre'){
      texto=(val('snLibre')||'').trim(); art=(val('snArt')||'libre').trim();
      if(!texto){ msg('Escribe qu\u00e9 ha pasado.', true); return; }
    }
    var urlTarea='', plazo='';
    if(mot==='plazo'||mot==='plazoUrg'){
      urlTarea=val('snTarea'); plazo=val('snPlazo');
      if(!urlTarea){ msg('Elige la tarea cuyo plazo se incumpli\u00f3.', true); return; }
      if(!plazo){ msg('Pon el plazo nuevo: sancionar por un plazo y no darle otro no arregla nada.', true); return; }
      /* De la lista DEL SANCIONADO -`SANC_TAREAS`-, no de `TAREAS`, que son las mias. Si se
         busca aqui, el titulo no aparece y el motivo queda en «una tarea»: es lo que le paso a
         la sancion de Jose del 28/07. Lo que se pinta y lo que se guarda tienen que salir del
         MISMO sitio. */
      var t=((SANC_TAREAS&&SANC_TAREAS.lista)||[]).filter(function(x){ return x.url===urlTarea; })[0];
      texto='Incumplir el plazo de \u00ab'+((t&&(t.n||t.nombre))||'una tarea')+'\u00bb';
      art=(mot==='plazoUrg') ? '30b' : '30c';   // el articulo REAL del RRI
    }
    if(!backendOK || !SESION){ msg('Sin conexi\u00f3n no se puede: esto escribe en la cola de verdad.', true); return; }
    bt.disabled=true; var prev=bt.textContent; bt.textContent='Guardando\u2026';
    try{
      /* EL ORDEN IMPORTA: primero Notion, luego la sancion. Al reves quedaria la sancion puesta
         y la tarea con la fecha vieja, que es la unica de las dos combinaciones malas que NO se
         ve mirando la cola. */
      if(esDePlazo){ msg('Moviendo el plazo en Notion\u2026'); await api.moverLimiteTarea(urlTarea, plazo); }
      await api.pushSancion([{nombre:quien, motivo:texto, articulo:art, puntos:pts, origen:'manual'}]);
      SANC_FORM={quien:'', motivo:'', libre:'', art:'', tarea:'', plazo:'', pts:'-1', filtro:''};
      tost('Sanci\u00f3n puesta a '+(_pilaDeM_(quien)||quien)+'.'+(esDePlazo?' Plazo movido en Notion.':''));
      await _cargarSanciones_();     // la cola de abajo tiene que enterarse
      pintar();
    }catch(e){
      bt.disabled=false; bt.textContent=prev;
      msg('No se pudo: '+((e&&e.message)||e), true);
    }
  };
}

async function _cargarSanciones_(){
  try{ var arr=await api.getSanciones({}); if(Array.isArray(arr)) SANC_BACK=arr; }
  catch(e){ SANC_BACK=null; }
  _loteReal_();
}

/* Construye el BLOQUE de sanciones desde la cola REAL del backend (SANC_BACK) cuando hay
   pendientes agrupadas en un lote. Con ids reales, marcar una decisión viaja al backend y
   «cerrar el bloque» levanta el flag que lee el motor Python. Sin backend o sin lote
   pendiente, se queda la semilla de demostración (LOTE.real queda sin marcar). */
function _loteReal_(){
  if(!Array.isArray(SANC_BACK)) return;                                   // sin backend
  var pend=SANC_BACK.filter(function(s){ return s.estado==='pendiente' && s.lote; });
  if(!pend.length) return;                                                // nada agrupado
  /* Antes se cogia SIEMPRE `pend[0].lote`: con dos bloques, el segundo no existia para
     el panel. Ahora se listan todos y se puede cambiar de uno a otro. */
  LOTES_PEND=[]; pend.forEach(function(x){ if(LOTES_PEND.indexOf(x.lote)<0) LOTES_PEND.push(x.lote); });
  var lote=LOTES_PEND[Math.min(LOTE_SEL, LOTES_PEND.length-1)] || LOTES_PEND[0];
  var its=pend.filter(function(s){ return s.lote===lote; });
  LOTE={ real:true, lote:lote, nombre:lote, cerrado:false,
    motivo:its[0].motivo||'—', art:its[0].articulo||'libre',
    items:its.map(function(s){ return {id:s.id, n:s.nombre, pts:Number(s.puntos)||0,
      dec:s.decision||'aceptar'}; }) };
}

