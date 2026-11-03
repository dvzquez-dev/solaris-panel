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
  /* 01/11 (artifact [334a41fb8e]): la reforma manda, la junta no genera falta — una sola puerta, `_sancionaSola_`. */
  if(!_sancionaSola_(tipo)) return {p:0,txt:'sin sanción automática · potestad del coordinador'};
  /* ⛔⛔ «NO CONSTA» NO ES «CERO», Y AQUI DECIDE PUNTOS DE DISCIPLINA (565.ª).
     `VECES` es una tabla de **SEIS NOMBRES DE DEMO** (`escritorio.html`), y los nombres
     que llegan aqui son **REALES**: salen de `r.sinCubrir`, que viene de `_cobertura_`.
     Con el roster de 26/27 -- **23 personas** -- casi nadie esta en esa tabla, asi que el
     `||0` convertia **«no se su historial»** en **«es su primera vez»**: a un reincidente
     la pantalla le cantaba *«aviso · 1.ª vez, sin puntos»* y *«0 antecedentes esta
     temporada»*. Es la misma forma que el «Revisa: Antia» del 10/09: **una semilla de
     demo leida como dato real**.
     ✅ Ahora son TRES respuestas y no dos: **p:0** (consta y es la primera), **p>=1**
     (consta y reincide) y **p:null** (no consta). Un `0` explicito en la tabla sigue
     dando «1.ª vez» -- eso es un dato --; lo que ya no se inventa es el hueco.
     ✅ **Y DESDE LA 575.ª EL DATO ES REAL.** Aqui ponia que la reincidencia la cuenta
     `reglas/gradiente.py` y que **no viajaba al panel**, asi que lo unico honesto que
     podia hacer esta cara era decir que no lo sabia. Ya no: la 572.ª puso el cable
     -- `flujos/ensamblar.py` escribe `antecedentes` por miembro, un entero por familia --
     y esto lo lee por `_vecesSinCubrir_`. `VECES`, la tabla de seis nombres de demo,
     **se retiro**.
     ⚠️ Y el `null` sigue existiendo, con MAS motivos que antes: quien no esta en el
     panel, quien esta y no trae el campo -- el backend recorta el miembro para quien no
     es admin ni PD --, y quien lo trae con algo que no es un numero. */
  return _escalaSinCubrir_(nombre);   /* la regla (y sus tres respuestas) vive en `comun.js`: el móvil la lee igual */
}

/* ⛔ LA GEMELA DEL MOVIL, Y CON EL MISMO FALLO: vaciaba la lista antes de saber si
   llegaba y se tragaba el error, asi que un corte de red se pintaba como «No tienes
   subidas ni bajadas de puntos esta temporada» — y encima seguido de «Si el servidor
   es anterior a la v53 esto sale vacio aunque las haya», que CULPA A LA VERSION del
   servidor de lo que puede ser la red.
   ⚠️ Aqui ponia que era PEOR que en el movil *«porque `_refrescoVivo_` no llama a esta
   carga, asi que la mentira no se corrige sola — dura toda la sesion»*. **FALSO desde la
   569.ª**: `escritorio.html` la llama dentro del refresco, y se reintenta cada 90 s.
   ⛔ Y la correccion se escribio ALLI — citando esta misma frase— y **no aqui, donde se
   enuncia**: §3c-19 en su forma mas barata de producir. Una premisa corregida en el sitio
   que la CITA sobrevive entera en el que la AFIRMA, y la siguiente persona lee esta. */
async function _cargarMovimientosE_(){
  MOVS_E.length=0;
  _llego_('movsE', false);
  try{
    /* 31/10 (pasada de usuario, fila 4): con TOPE. Una petición que no contesta ya no deja «Cargando…» para siempre:
       a los 20 s se da por fallida y la pantalla ofrece «Reintentar». */
    var a=await Promise.race([api.getMisMovimientos(),
      new Promise(function(_, no){ setTimeout(function(){ no(new Error('tiempo')); }, 20000); })]);
    if(!Array.isArray(a)){ _llego_('movsEerr', true); return false; }
    a.forEach(function(s){ MOVS_E.push(_movDeSancion_(s)); });
    _llego_('movsE', true); _llego_('movsEerr', false);
    return true;
  }catch(_){ _llego_('movsEerr', true); return false; }
}

/* 31/10 (fila 4): ¿cómo está el libro de puntos? 'ok' (llegó, vacío o no) · 'cargando' (hay sesión y aún no contestó) ·
   'error' (falló, o no hay sesión: nada lo va a traer). La maqueta no tiene servidor: ahí es «ok», sin movimientos. */
function _estadoMovsE_(){
  if(_llego_('movsE')) return 'ok';
  if(_llego_('movsEerr')) return 'error';
  var sesion = (typeof backendOK!=='undefined' && backendOK && typeof SESION!=='undefined' && SESION);
  if(sesion) return 'cargando';
  return (typeof _demoLocal_==='function' && _demoLocal_()) ? 'ok' : 'error';
}

function _engMovsE_(){
  $$('[data-movreint]').forEach(function(b){
    b.onclick=function(){
      _llego_('movsEerr', false); pintar();
      _cargarMovimientosE_().then(function(){ if(vista==='libros') pintar(); });
    };
  });
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
    var crit=_zonaCritica_(i,valor);
    segs+='<path class="seg vac'+(crit?' zc':'')+'" d="'+arco(i,AR,1)+'"/>';
    if(f>0) segs+='<path class="seg" stroke="'+(crit?'var(--warn)':'var(--red)')+'" d="'+arco(i,AR,f)+'"/>';
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
  /* ⛔⛔ TRES CUBOS Y NO DOS. Esto era `if(!Number(x.pts)) avisos++`, y `!Number(x)` es
     cierto para el **0** y para el **hueco**: un bloque con un dato perdido salia
     indistinguible de uno con un aviso de verdad -- la pantalla decia «1 aviso» sobre
     algo que no sabia. Hoy el hueco tiene su propio recuento y SE NOMBRA. */
  var vals=[],avisos=0,huecos=0;
  LOTE.items.forEach(function(x){
    var p=_ptsSanc_(x.pts);
    if(p===null){ huecos++; return; }
    if(p===0){ avisos++; return; }
    if(vals.indexOf(p)<0) vals.push(p);
  });
  vals.sort(function(a,b){return Math.abs(a)-Math.abs(b);});
  /* el rotulo de un valor sale de `_etPtsSanc_`, que es el que usan tambien la fila de
     la persona y la cola del movil: un solo texto para el mismo dato. */
  var nS=LOTE.items.length-avisos-huecos;
  var t = !vals.length ? '' : (vals.length===1 ? _etPtsSanc_(vals[0])+(nS>1?' c/u':'')
        : 'de '+_etPtsSanc_(vals[0])+' a '+_etPtsSanc_(vals[vals.length-1]));
  if(avisos) t += (t?' · ':'')+avisos+' aviso'+(avisos===1?'':'s');
  if(huecos) t += (t?' · ':'')+huecos+' sin dato';
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

/* ⛔⛔ EL INDICE DEL BLOQUE QUE SE MIRA, EN UNA SOLA PUERTA (566.ª). Estaba calculado
   DOS VECES con criterios DISTINTOS: `_loteReal_` clampaba
   (`Math.min(LOTE_SEL, LOTES_PEND.length-1)`) y `_selectorLotes_` no (`i===LOTE_SEL`).
   Y nadie resetea `LOTE_SEL`: lo asigna un unico sitio (`escritorio.html`, el `onchange`).
   📏 Lo que se veia: con 3 bloques eliges el 3.º (`LOTE_SEL=2`), el refresco de 90 s
   deja 2, y entonces **el panel pinta el bloque B y el desplegable enseña el A** -- porque
   ninguna `<option>` queda `selected` y el navegador marca la primera. Debajo hay un boton
   que **aplica en Notion y publica el comunicado**: decidir sobre el bloque equivocado no
   da ningun error.
   ⚠️ Es la regla 11 en su forma mas cara: *una constante derivable no se teclea dos
   veces*. Aqui no era una constante sino un indice, y las dos formas eran razonables por
   separado -- la diferencia ES el fallo.
   ✅ Devuelve **0 si no hay bloques**, que es lo que ya hacia el `|| LOTES_PEND[0]` de
   `_loteReal_`: un `-1` aqui se leeria como «el ultimo» en cualquier `[]`. */
function _loteIdx_(){
  var n = (LOTES_PEND && LOTES_PEND.length) || 0;
  if(!n) return 0;
  return Math.max(0, Math.min(LOTE_SEL, n - 1));
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
  return '<div class="pb" style="padding-bottom:0"><div style="display:block">'+
    '<span class="sc" style="display:block;margin-bottom:5px">Hay '+LOTES_PEND.length+' bloques pendientes</span>'+
    nxElige('loteSel', LOTES_PEND.map(function(l,i){ return [i, _nombreLoteEsc_(l)]; }), _loteIdx_())+
    '</div></div>';
}

/* ═══ CORREGIR LOS PUNTOS DE UNA PERSONA DENTRO DEL BLOQUE (31/10, B6) ═══════════════════════════════════════════
   Antes la cara decía «no se pueden corregir desde aquí» y mandaba a sacar a la persona y aplicarla suelta (y entonces
   salía otro comunicado). `corregirPuntosLote` cambia `puntos` de UNA pendiente SIN sacarla del bloque: sigue siendo uno y
   con un solo comunicado, y `aplicar.py`/`comunicar.py` leen la misma fila, así que aplican y dicen los corregidos. Con
   motivo obligatorio; el servidor manda en el permiso y rechaza una ya aplicada, y aquí se enseña su mensaje tal cual. */
var LOTE_EDIT = null;     // id de la fila con el editor abierto (sólo uno)
var LOTE_EDIT_MSG = '';   // lo que dijo el servidor (o la validación) la última vez que no entró
var LOTE_EDIT_BORR = null; // lo tecleado {pts, mot}: un repintado tras un rechazo NO lo borra

/* ¿Se ofrece corregir esta fila? Sólo con bloque real y sesión (la semilla no tiene a quién escribir), y no un premio:
   su recompensa son horas, no puntos. */
function _lcorrOfrece_(x){
  return !!(LOTE.real && LOTE.lote && typeof backendOK !== 'undefined' && backendOK && SESION &&
            !_esPremioSanc_(x.origen, x.extra));
}

/* Los puntos que se teclean: lo de `_validaPuntosSanc_` para una sanción, y 0–5 para una revocación (devuelve puntos). */
function _lcorrValida_(x, crudo){
  if(x.origen === 'revocacion'){
    var t = String(crudo == null ? '' : crudo).replace(/^\s+|\s+$/g, '');
    return /^\d+$/.test(t) && +t <= 5 ? {ok:true, pts:parseInt(t, 10)}
                                       : {ok:false, msg:'Una revocación devuelve un entero de 0 a 5.'};
  }
  return _validaPuntosSanc_(crudo);
}

function _lcorrBoton_(x){
  return _lcorrOfrece_(x) ? '<button class="lcorr" data-corr="'+x.id+'" title="Cambiar los puntos de '+esc(x.n)+
    ' sin sacarla del bloque">'+(LOTE_EDIT===x.id ? 'Cancelar' : 'Corregir puntos')+'</button>' : '';
}

/* «corregido de −1 por Pedro: motivo» bajo el nombre, para que lo corregido no pase por lo que propuso el motor */
function _lcorrNota_(x){
  if(x.pAntes === null || x.pAntes === undefined || x.pAntes === x.pts) return '';
  return '<span class="lcorrn">corregido de '+esc(_etPtsSanc_(x.pAntes))+(x.pPor ? ' por '+esc(x.pPor) : '')+
    (x.pMot ? ' · '+esc(x.pMot) : '')+'</span>';
}

function _lcorrForm_(x){
  if(LOTE_EDIT !== x.id || !_lcorrOfrece_(x)) return '';
  return '<div class="lcorrf" data-lcf="'+x.id+'">'+
    nxNum('lcPts', LOTE_EDIT_BORR ? LOTE_EDIT_BORR.pts : (x.pts===null?'':x.pts), {min:(x.origen==='revocacion'?0:-5), max:(x.origen==='revocacion'?5:0), sufijo:'pts'})+
    '<input type="text" id="lcMot" maxlength="200" aria-label="Motivo de la corrección" placeholder="Motivo de la corrección (obligatorio)" value="'+
      esc(LOTE_EDIT_BORR ? LOTE_EDIT_BORR.mot : '')+'">'+
    '<button class="btn sm pri" data-lcg="'+x.id+'">Guardar</button>'+
    '<span class="sc">no la saca del bloque ni aplica nada</span>'+
    (LOTE_EDIT_MSG ? '<span class="err" role="alert">'+esc(LOTE_EDIT_MSG)+'</span>' : '')+'</div>';
}

function _engSancCorregir_(){
  $$('[data-corr]').forEach(function(b){
    b.onclick=function(){
      var id=+b.dataset.corr;
      LOTE_EDIT = (LOTE_EDIT===id) ? null : id; LOTE_EDIT_MSG=''; LOTE_EDIT_BORR=null;
      pintar();
      var p=$('#lcMot'); if(p) p.focus();
    };
  });
  $$('[data-lcg]').forEach(function(b){
    b.onclick=async function(){
      var id=+b.dataset.lcg;
      var x=LOTE.items.filter(function(i){ return i.id===id; })[0]; if(!x) return;
      var crudo=($('#lcPts')||{}).value, v=_lcorrValida_(x, crudo), mot=String((($('#lcMot')||{}).value)||'').replace(/^\s+|\s+$/g,'');
      LOTE_EDIT_BORR={pts:crudo, mot:mot};     // por si hay que repintar con un aviso: lo tecleado se queda
      if(!v.ok){ LOTE_EDIT_MSG=v.msg; pintar(); return; }
      if(!mot){ LOTE_EDIT_MSG='Pon el motivo de la corrección: queda escrito con tu nombre.'; pintar(); return; }
      var prev=b.textContent; b.disabled=true; b.textContent='Guardando…';
      try{
        var r=await api.corregirPuntosLote(id, v.pts, mot);
        LOTE_EDIT=null; LOTE_EDIT_MSG=''; LOTE_EDIT_BORR=null;
        await _cargarSancionesCon_(r);       /* con `cola` en la respuesta no hay viaje aparte */
        tost('Puntos corregidos. Siguen en el bloque y no se ha aplicado nada.');
        pintar();
      }catch(e){
        /* el botón revive y el motivo del servidor se ve EN el editor (sin permiso, ya aplicada…), no sólo en un aviso */
        b.disabled=false; b.textContent=prev;
        LOTE_EDIT_MSG=(e && e.message) || String(e); pintar(); tostErr('No se pudo corregir: ', e);
      }
    };
  });
}

/* ⛔ 21/10 (auditor de sanciones): LA PREVISIÓN «antes → después» DE UNA FILA DEL BLOQUE, o '' si no se sabe. Era
   `var antes=m?m.puntos:10`: a quien no es PD el roster le llega SIN `puntos`, y salía «undefined → NaN»; a quien no
   está en el roster, un 10 inventado. Sin puntos de verdad no hay previsión (§3c-24). Si la decisión no es «aceptar» o
   los puntos de la sanción no llegaron, se queda quieta: lo que va a pasar de verdad al cerrar el bloque. */
function _prevPuntosLote_(m, x){
  var antes = (m && typeof m.puntos === 'number' && isFinite(m.puntos)) ? m.puntos : null;
  if(antes === null) return '';
  var desp = (x && x.dec === 'aceptar' && typeof x.pts === 'number') ? Math.max(0, Math.min(10, antes + x.pts)) : antes;
  return antes + ' → ' + desp;
}

/* ⛔ 21/10 (auditor de sanciones): EL DÍA DE UNA SANCIÓN RESUELTA, como se lee: `decidido_at` (si no, `creado_at`), en
   el día de Madrid (`_ahoraLocalISO_`) y en DD/MM/AAAA. Sin fecha legible, «—». */
function _diaSancHist_(s){
  /* 21/10: el día de Madrid sale de la puerta común (`_diaMadridDe_`), la misma que la caducidad de los partes. */
  return _diaMadridDe_((s && (s.decidido_at || s.creado_at)) || '') || '\u2014';
}

/* ⛔ 21/10 (auditor de sanciones): QUÉ SUELTAS CABEN EN UN PAQUETE. El servidor no mete dos veces a la misma persona en
   el mismo paquete y es TODO O NADA, así que mandar todas hacía fallar la operación entera en cuanto alguien tenía dos.
   Va UNA por persona — la más antigua (`creado_at`) — y las demás se quedan sueltas: `{van:[…], quedan:[…]}`. */
function _sueltasAgrupables_(ss){
  var orden = (ss||[]).slice().sort(function(a,b){ return String(a.creado_at||'').localeCompare(String(b.creado_at||'')); });
  var visto = {}, van = [], quedan = [];
  orden.forEach(function(s){
    var k = String(s.nombre||'');
    if(visto.hasOwnProperty(k)) quedan.push(s); else { visto[k] = 1; van.push(s); }
  });
  return {van: van, quedan: quedan};
}

/* 31/10: «Procede veto» y sus dos tareas, ARRIBA de la cola: es lo más grave del Título VII (`_vetoFilas_`, en comun.js). Si no hay
   nada que atender ni esperando, no existe (un panel vacío anuncia trabajo que no hay). */
function _panelVeto_(){
  var v=_vetoFilas_(SANC_BACK||[]);
  return v.html ? pan('Procede veto', v.n?String(v.n):'esperando', '<div style="padding:0 14px 8px">'+v.html+'</div>', v.n?'destaca':'') : '';
}

function _panelSueltas_(){
  var ss=_sancSueltas_();
  /* ⛔⛔ «NINGUNA» Y «NO LO SÉ» NO SE PINTAN IGUAL. `SANC_BACK` arranca en `null` y se
     queda en `null` si `getSanciones` falla, así que la lista salía vacía por las dos
     razones — y lo que se leía era la primera: **«ninguna»**, con sanciones pendientes
     contra personas reales **invisibles** en la pantalla donde se deciden. */
  if(!ss.length && !_llego_('sanc')) return pan('Sanciones sueltas','sin leer',
    vacioSimple('No se han podido cargar las sanciones',
      'Se reintenta cada 90 s; si sigue igual, recarga la p\u00e1gina.'));
  if(!ss.length) return pan('Sanciones sueltas','ninguna',
    vacioSimple('No hay sanciones sueltas','Las que no van en bloque —cada una con su motivo y su artículo— aparecen aquí.'));
  return pan('Sanciones sueltas', ss.length+'',
    tabla([['Persona'],['Motivo'],['Art.',0],['Puntos',1],['']],
      ss.map(function(s){
        var m=_m(s.nombre);
        return '<tr><td>'+esc((m&&m.pila)||s.nombre)+'</td>'+
          '<td style="color:var(--ink2)">'+esc(s.motivo||'\u2014')+'</td>'+
          '<td class="mono" style="color:var(--ink3)">'+esc(s.articulo||'libre')+'</td>'+
          /* ⛔ EL IDIOMA QUE ESTA CARA YA USA (`escritorio.html:2463`): un hueco
             dice «sin dato», no **0** -- que en esta columna se lee como «fue un
             aviso». Y el color sale del MISMO valor, asi que un hueco no se pinta
             de rojo por un `<0` sobre un cero inventado. */
          /* ⛔ 21/10 (auditor de sanciones): el ROTULO de las dos caras (`_etSancFila_`), no el número en crudo — una
             revocación de +2 salía «2» y un premio «0», que en esta columna se lee «aviso». */
          '<td class="r mono '+(_ptsSanc_(s.puntos)<0?'dn':'')+'">'
            +esc(_etSancFila_(s.puntos, s.origen, s.extra))+'</td>'+
          '<td class="r"><span class="decs" data-sid="'+s.id+'">'+
            '<button data-sdec="aprobar">Aplica</button>'+
            /* ⛔ 21/10: una revocación o un premio suelto no se justifica — el servidor lo rechaza. */
            (_esNoJustificable_(s.origen, s.extra) ? '' : '<button data-sdec="justificar">Justifica</button>')+
            '<button data-sdec="rechazar">Rechaza</button>'+
          '</span> <button class="btn sm" data-seditar="'+s.id+'">Editar</button></td></tr>';
      }).join(''))+
    '<div class="pb" style="padding-top:0"><button class="btn sm" data-agrupar>Agrupar en un paquete</button>'+
      '<span class="sc" style="margin-left:9px">un solo comunicado para todas</span></div>'+
    '<div class="nota">Cada suelta se decide por separado. <b>Editar</b> cambia puntos, motivo y artículo '+
    '<b>al aplicarla</b>. Una ya aplicada no se edita: se <b>revoca</b> abajo, en «Se pueden revocar».</div>');
}


/* ══ REVOCAR: LA VIA DE APELACION, DE VUELTA EN ESTA CARA (763.a, 02/10) ════════════

   ⛔ VA EN UN PANEL PROPIO Y NO EN LA TABLA DEL HISTORIAL: revocar **exige un motivo**, y una
   celda de tabla no tiene sitio para un motivo obligatorio. Misma forma que «Ya firmaste» de
   horas (`_escRevPanel_`), que es la que Daniel ya usa para deshacer con motivo.
   ⛔ Y MARCADORES PROPIOS (`data-rvsid`/`data-rvsmot`/`data-rvs`), no los de decidir: las dos
   listas conviven en la MISMA pantalla y los manejadores enganchan por atributo **sin acotar**.
   Es la leccion de `data-revid` en horas y de `data-pdr` en el movil.
   ⛔ SI NO HAY NADA, NO EXISTE: un panel «Se pueden revocar · 0» en cada visita anuncia trabajo
   que no hay y compite con la cola de verdad. */
function _revocablesSanc_(){
  if (!Array.isArray(SANC_BACK)) return [];
  return SANC_BACK.filter(function(s){ return _puedeRevocarSanc_(s, SANC_BACK); });
}

/* 02/11: el nombre de un lote en el escritorio (`_nombreLote_`, comun.js), con las reuniones del SERVIDOR (`_srv`: los ids de la
   semilla son ids reales) y la fecha de su primera fila. Nunca el id crudo. */
function _nombreLoteEsc_(lote){
  var f = null;
  (Array.isArray(SANC_BACK) ? SANC_BACK : []).some(function(x){ if (x && x.lote === lote){ f = x.creado_at; return true; } return false; });
  return _nombreLote_(lote, (typeof REUS !== 'undefined' && Array.isArray(REUS) ? REUS : []).filter(function(r){ return r && r._srv; }), f);
}

function _revocarSancCard_(s){
  var m = _m(s.nombre), pts = _ptsSanc_(s.puntos);
  return '<div class="parte" data-rvsid="' + esc(s.id) + '">' +
    '<div class="h"><b>' + esc((m && m.pila) || s.nombre) + '</b>' +
      '<span class="u">' + esc(s.articulo ? ('Art. ' + s.articulo) : '\u2014') + '</span>' +
      '<span class="u">' + esc(_nombreLoteEsc_(s.lote)) + '</span>' +
      '<span class="q">' + esc(_etSancFila_(s.puntos, s.origen, s.extra)) + '</span></div>' +
    '<div class="just"><span class="sc">' + esc(s.motivo || '\u2014') + '</span></div>' +
    /* ⛔ EL AVISO CAMBIA SEGUN SI DEVUELVE PUNTOS O NO. Un solo texto esconderia justo el
       caso raro: revocar un aviso **no devuelve nada**, retira el registro -- y eso es lo que
       pesa en el gradiente, que cuenta ocurrencias. */
    '<div class="ruta">' + (pts
      ? 'Revocar le <b>devuelve ' + Math.abs(pts) + ' punto' + (Math.abs(pts) === 1 ? '' : 's') +
        '</b>. Entra en la cola como pendiente y se confirma con su bloque.'
      : 'Era un <b>aviso</b>: no devuelve puntos, retira el <b>registro</b> y su reincidencia. '+
        'Entra en la cola como pendiente y se confirma con su bloque.') + '</div>' +
    '<textarea data-rvsmot placeholder="Motivo de la revocaci\u00f3n \u2014 obligatorio, al menos 8 caracteres\u2026"></textarea>' +
    '<div class="acts"><button class="btn no" data-rvs="' + esc(s.id) + '">Revocar</button></div>' +
  '</div>';
}

function _panelRevocarSanc_(){
  var lista = _revocablesSanc_(), i, cuerpo = '';
  if (!lista.length) return '';
  for (i = 0; i < lista.length; i++) cuerpo += _revocarSancCard_(lista[i]);
  return pan('Se pueden revocar', lista.length + '',
    '<div class="pb"><p style="margin:0;font-size:12.5px;color:var(--ink2);line-height:1.6">' +
    'Una sanci\u00f3n ya aplicada se retira con un <b>motivo</b>; la revocaci\u00f3n queda ' +
    'pendiente y se confirma con su bloque.</p></div>' + cuerpo);
}

/* ⛔⛔ Y ESTO ES EL CABLE, que es donde murio la version anterior de esta pantalla: «Denegar» y
   «Estimar» estaban pintados y **no enganchados a nada** -- pulsarlos no hacia absolutamente
   nada y no lo decia. Sobre puntos de personas, eso es lo mas parecido a mentir que puede hacer
   una interfaz. */
async function _engRevocarSanc_(){
  $$('[data-rvs]').forEach(function(b){
    b.onclick = async function(){
      if (b.disabled) return;
      var caja = b.closest('[data-rvsid]'); if (!caja) return;
      var ta = caja.querySelector('[data-rvsmot]'), mot = ta ? ta.value.trim() : '';
      /* El mismo minimo que «Revertir» de horas (8): un viaje de red para que te digan lo que
         ya se sabia es una pantalla que te hace perder el rato. */
      if (mot.length < 8){
        if (ta){ ta.focus(); ta.style.borderColor = 'rgba(232,145,46,.6)';
          setTimeout(function(){ ta.style.borderColor = ''; }, 1600); }
        tost('Revocar exige un motivo de al menos 8 caracteres. Sin \u00e9l no se env\u00eda.');
        return;
      }
      if (typeof backendOK === 'undefined' || !backendOK || !SESION
          || !Array.isArray(SANC_BACK)){
        tost('Sin conexi\u00f3n no se puede revocar: no se ha guardado nada.'); return; }
      /* ⛔ SE RELEE DE `SANC_BACK` POR SU ID, no se confia en lo pintado: entre pintar y pulsar
         hay un refresco cada 9 s, y la sancion puede haber cambiado de estado. */
      var s = null, i;
      for (i = 0; i < SANC_BACK.length; i++)
        if (String(SANC_BACK[i].id) === String(caja.dataset.rvsid)) s = SANC_BACK[i];
      if (!s){ tost('Esa sanci\u00f3n ya no est\u00e1 en la cola: recarga la pantalla.'); return; }
      /* ⛔ Y SE VUELVE A PREGUNTAR AL PREDICADO sobre el dato releido: si mientras escribias el
         motivo entro una revocacion de otro, mandar la segunda REGALA puntos. */
      if (!_puedeRevocarSanc_(s, SANC_BACK)){
        tost('Esa sanci\u00f3n ya no se puede revocar: puede que haya entrado otra revocaci\u00f3n.');
        pintar(); return; }
      /* ⛔ SIN `|| 0`: un `null` aqui es «no se cuantos puntos devuelve», y el texto
         de abajo afirmaba *«Era un aviso: no devuelve puntos»* -- ensenandole a quien
         pulsa una cosa que no se sabe, justo antes de escribirla. */
      var _p = _ptsSanc_(s.puntos);
      if (_p === null){
        tost('Esta sanci\u00f3n no dice cu\u00e1ntos puntos quit\u00f3, as\u00ed que no se puede saber '
           + 'cu\u00e1ntos devolver. Arr\u00e9glalos antes de revocarla.');
        return; }
      if (!(await dialogoSiNo('Revocar esta sanci\u00f3n.' + String.fromCharCode(10, 10) +
        (_p ? 'Le devuelve ' + Math.abs(_p) + ' punto' + (Math.abs(_p) === 1 ? '' : 's') + '.'
            : 'Era un aviso: retira el registro, no devuelve puntos.') +
        String.fromCharCode(10, 10) +
        'Entra en la cola como PENDIENTE y se confirma con su bloque. \u00bfSigo?'))) return;
      b.disabled = true; var prev = b.textContent; b.textContent = 'Revocando\u2026';
      try{
        var r = await api.pushSancion([_filaRevocacion_(s, mot)]);
        /* ⛔⛔ SE LEE `rechazadas`. El backend **SALTA** a quien no es de tu jurisdiccion en vez
           de lanzar, asi que sin mirarlo el `tost` cantaria una revocacion que NO EXISTE -- y
           sobre los puntos de una persona. Se relanza para caer en el `catch` de siempre. */
        if (r && r.rechazadas && r.rechazadas.length)
          throw new Error('no puedes tocar la sanci\u00f3n de ' + r.rechazadas.join(', ') +
                          ': est\u00e1 fuera de tu jurisdicci\u00f3n');
        /* 21/10 (auditor 12, 🟠 3): y si el servidor dice que los puntos no valen, NO es «ya estaba en la cola». */
        if (r && r.invalidas && r.invalidas.length)
          throw new Error('el servidor no acepta esos puntos para ' + r.invalidas.join(', '));
        /* ⚠️ Y LO QUE ENTRO, no lo que se mando: `nuevas` puede ser 0 si la clave ya estaba
           -- o sea si ya la habias mandado --, y decir «hecho» ahi manda a esperar algo que no
           va a pasar dos veces. */
        var _n = (r && typeof r.nuevas === 'number') ? r.nuevas : 1;
        tost(_n ? 'Revocaci\u00f3n en la cola, pendiente de confirmar con su bloque.'
                : 'Esa revocaci\u00f3n ya estaba en la cola: no se ha duplicado.');
        await _cargarSancionesCon_(r);
        pintar();
      }catch(e){ tostErr('No se pudo revocar', e); }
      finally{ b.disabled = false; b.textContent = prev || 'Revocar'; }
    };
  });
}

/* ══ DESHACER UN PREMIO DE HORAS (02/11, Daniel: «Sí, solo el PD, y se restan las horas») ═══════════════════════════
   Los premios ya APLICADOS (`_puedeDeshacerPremio_`), para el PD. ⛔ Es de CARA, no seguridad: el servidor manda (`deshacerPremio`
   es sólo del PD) y aquí se enseña su mensaje tal cual. Lo elegido va en rojo y confirma `dialogoSiNo`; sin casillas ni desplegables. */
function _soyPDSanc_(){ return typeof SESION !== 'undefined' && !!SESION && Number(SESION.rango) >= 3; }

function _premiosDeshacer_(){
  if (!_soyPDSanc_() || !Array.isArray(SANC_BACK)) return [];
  return SANC_BACK.filter(function(s){ return _puedeDeshacerPremio_(s, SANC_BACK); });
}

function _panelDeshacerPremio_(){
  var lista = _premiosDeshacer_(), i, cuerpo = '', s, m;
  if (!lista.length) return '';        /* sin nada que deshacer no existe el panel: no anuncia trabajo que no hay */
  for (i = 0; i < lista.length; i++){
    s = lista[i]; m = _m(s.nombre);
    cuerpo += '<div class="parte" data-dpid="' + esc(s.id) + '">' +
      '<div class="h"><b>' + esc((m && m.pila) || s.nombre) + '</b>' +
        '<span class="u">' + esc(_nombreLoteEsc_(s.lote)) + '</span>' +
        /* 02/11 (Daniel: «pone premio más 0,5»): el premio en PALABRAS, no el rótulo corto de la fila */
        '<span class="q">' + esc(_premioEnPalabras_(s.extra, null)) + '</span></div>' +
      '<div class="just"><span class="sc">' + esc(s.motivo || '\u2014') + '</span></div>' +
      '<div class="ruta">Al deshacerlo se <b>resta ' + esc(nf2(s.extra.compensacion)) + ' h</b> de su Compensaciones al aplicar; ' +
        'el premio original queda en el historial.</div>' +
      '<div class="acts"><button class="btn no" data-dp="' + esc(s.id) + '">Deshacer premio</button></div>' +
    '</div>';
  }
  return pan('Premios que se pueden deshacer', lista.length + '', cuerpo);
}

async function _engDeshacerPremio_(){
  $$('[data-dp]').forEach(function(b){
    b.onclick = async function(){
      if (b.disabled) return;
      if (typeof backendOK === 'undefined' || !backendOK || !SESION || !Array.isArray(SANC_BACK)){
        tost('Sin conexi\u00f3n: no se ha deshecho nada.'); return; }
      /* se relee de `SANC_BACK` por su id y se vuelve a preguntar al predicado: entre pintar y pulsar hay un refresco */
      var s = null, i;
      for (i = 0; i < SANC_BACK.length; i++)
        if (String(SANC_BACK[i].id) === String(b.dataset.dp)) s = SANC_BACK[i];
      if (!s || !_puedeDeshacerPremio_(s, SANC_BACK)){
        tost('Ese premio ya no se puede deshacer: puede que ya lo hayas deshecho.'); pintar(); return; }
      var h = nf2(s.extra.compensacion);
      if (!(await dialogoSiNo('Deshacer este premio.' + String.fromCharCode(10, 10) +
        'A ' + s.nombre + ' se le restan ' + h + ' h de Compensaciones.' + String.fromCharCode(10, 10) +
        'Se resta al aplicar. \u00bfSigo?'))) return;
      b.disabled = true; var prev = b.textContent; b.textContent = 'Deshaciendo\u2026';
      try{
        var r = await api.deshacerPremio(s.id);
        /* `repetida`: ya estaba deshecho (un reintento de red); no se resta dos veces y se dice */
        tost(r && r.repetida ? 'Ese premio ya estaba deshecho: no se ha restado otra vez.'
                             : 'Premio deshecho: se restan ' + h + ' h al aplicar.');
        await _cargarSancionesCon_(r);
        pintar();
      }catch(e){ tostErr('No se pudo deshacer el premio', e); }
      finally{ b.disabled = false; b.textContent = prev || 'Deshacer premio'; }
    };
  });
}

function _panelHistSanc_(){
  var hs=_sancHist_();
  /* ⛔ Y SU GEMELA (§3c-31): curar sólo el panel de arriba dejaría este afirmando
     «vacío» por el mismo motivo, y aquí la lectura es peor todavía — «todavía no hay
     sanciones resueltas» se lee como que **no se ha sancionado a nadie nunca**. */
  if(!hs.length && !_llego_('sanc')) return pan('Historial','sin leer',
    vacioSimple('No se ha podido cargar el historial',
      'Recarga la página.'));
  if(!hs.length) return pan('Historial','vacío',
    vacioSimple('Todavía no hay sanciones resueltas','Cada una que apruebes, justifiques o rechaces queda aquí con su decisión.'));
  return pan('Historial', hs.length+'',
    tabla([['Persona'],['Motivo'],['Estado',0],['Puntos',1],['Cuándo',1]],
      hs.slice(0,40).map(function(s){
        var m=_m(s.nombre);
        /* ⚠️ AQUI HABIA UN MAPA IDENTIDAD (568.ª): cada clave se traducia A SI MISMA
           (`aplicada:'aplicada'`, `aprobada:'aprobada'`…) y el `||s.estado` cubria el
           resto, asi que `et` era **siempre** `s.estado`. No traducia nada.
           ⚠️ Y no es inofensivo: un mapa de estados **parece** la puerta donde se decide
           como se lee cada uno, asi que el siguiente que quiera cambiar un rotulo lo
           edita ahi… y el `||` de al lado se lo come si se equivoca de clave. Un
           traductor que no traduce es peor que no tenerlo: invita a confiar en el.
           ✅ Su gemela del movil tiene el suyo DE VERDAD (`PD_EST`: «aplicada» -> «ya
           cuenta en su mes»). Si algun dia esta cara quiere rotulos propios, el sitio es
           ese mapa — con traducciones distintas del original, que es lo que lo hace uno. */
        var et=s.estado;
        var tono=(s.estado==='rechazada'||s.estado==='revocada')?'dn':(s.estado==='aplicada'?'up':'');
        return '<tr><td>'+esc((m&&m.pila)||s.nombre)+'</td>'+
          '<td style="color:var(--ink2)">'+esc(s.motivo||'\u2014')+'</td>'+
          '<td class="mono '+tono+'">'+esc(et)+'</td>'+
          /* ⛔ Igual que su gemela de arriba: el hueco se dice, no se rellena. */
          '<td class="r mono">'+esc(_etSancFila_(s.puntos, s.origen, s.extra))+'</td>'+   /* 21/10: el rótulo, no el número */
          /* ⛔ 21/10 (auditor de sanciones): la fecha de la DECISIÓN (la de propuesta si no consta), en el día de Madrid y
             en DD/MM/AAAA — era `creado_at` recortado: ISO, UTC y otra fecha. */
          '<td class="r mono" style="color:var(--ink3)">'+esc(_diaSancHist_(s))+'</td></tr>';
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
  /* 01/11 (escm1): PLEGADO y detrás del bloque a decidir. Poner una sanción es raro (430 px arriba) y decidir el bloque es
     lo urgente. Sigue en el DOM plegado (`#ponerSanc` lo repinta `_repintarPonerSanc_`); lo abierto se recuerda. */
  return '<div class="acord libre'+(SANC_PON_AB?' ab':'')+'" id="ponsanc"><div class="hh" data-ponsanc>'+
      '<span class="tx"><b>Poner una sanci\u00f3n</b><small>'+n+(n===1?' persona':' personas')+' bajo tu jurisdicci\u00f3n</small></span>'+
      '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div>'+
    '<div class="bb"><div class="pb" id="ponerSanc">'+_ponerSancCuerpo_()+'</div></div></div>';
}
var SANC_PON_AB=false;

function _ponerSancCuerpo_(){
  var lab=function(t){ return '<span class="sc" style="display:block;margin-bottom:5px">'+t+'</span>'; };
  var E=CAMPO_CSS;
  /* ⛔ El callback de tareas es ASINCRONO y repinta el panel ENTERO: pasa por la MISMA puerta que el resto de repintados
     (`_repintarPonerSanc_`), que recoge antes lo tecleado. El modelo (qué tareas, cargando, error) es de `comun.js`. */
  var m=_sancTareasModelo_(_repintarPonerSanc_);
  _aseguraMotivosRri_(_repintarPonerSanc_);   /* 01/11: el catálogo entero lo sirve el servidor (`getMotivosRri`) */
  var K={ campo:function(t,h){ return '<div style="display:block;margin-bottom:9px">'+lab(t)+h+'</div>'; },
          nota:function(h,aviso){ return '<div class="nota" style="margin:0 0 9px'+(aviso?';color:var(--warn)':'')+'">'+h+'</div>'; } };
  return '<div class="sanwrap">'+
    '<div>'+
      lab('A qui\u00e9n')+
      _sancQuienHTML_({repintar:_repintarPonerSanc_})+
    '</div>'+
    '<div>'+
      '<div style="display:block;margin-bottom:9px">'+lab('Motivo')+
        nxElige('snMotivo', _motivosParaBuscar_(), SANC_FORM.motivo||'', {max:5})+'</div>'+
      (SANC_FORM.motivo==='libre'
        ? '<label style="display:block;margin-bottom:9px">'+lab('Cu\u00e1l')+
            '<input id="snLibre" placeholder="Qu\u00e9 ha pasado" value="'+esc(SANC_FORM.libre||'')+'" style="'+E+'"></label>'+
          '<label style="display:block;margin-bottom:9px">'+lab('Art\u00edculo del RRI')+
            '<input id="snArt" value="'+esc(SANC_FORM.art||'libre')+'" style="'+E+'"></label>'
        : '')+
      _sancPlazoHTML_(m, K)+
      '<div style="display:block;margin-bottom:11px">'+lab('Puntos')+
        _ptsCampoSancHTML_()+'</div>'+
      '<button class="btn pri" id="btnSanc">Poner la sanci\u00f3n</button>'+
      '<div class="nota" id="snMsg" style="margin:9px 0 0">La sanci\u00f3n entra <b>pendiente</b>: se decide '+
      'abajo, y el comunicado sale despu\u00e9s.</div>'+
    '</div>'+
  '</div>';
}

/* ⛔ LA UNICA PUERTA PARA REPINTAR EL PANEL. Estas dos lineas estaban copiadas en dos
   sitios -aqui y en el callback de `_tareasDe_`- y solo una recogia antes. Dos copias de un
   gesto acaban siendo dos gestos distintos, y la diferencia es el bug: fue exactamente este.
   ⚠️ Recoge AUNQUE los campos ya se guarden al teclear (`_atarSancForm_`): esto es la red,
   no el mecanismo. */
function _repintarPonerSanc_(){
  _recogerSancForm_();
  var c=$('#ponerSanc'); if(!c) return;
  c.innerHTML=_ponerSancCuerpo_(); _cablearPonerSanc_();
}

function _cablearPonerSanc_(){
  $$('[data-ponsanc]').forEach(function(h){ h.onclick=function(){ SANC_PON_AB=h.parentNode.classList.toggle('ab'); }; });
  var msg=function(t,mal){ var b=$('#snMsg'); if(b){ b.textContent=t; b.style.color=mal?'var(--warn)':''; } };
  /* Los campos se guardan al teclear y el motivo repinta: `_sancCablearCampos_` (comun.js). Se llama a
     `_repintarPonerSanc_` por su nombre, sin alias local: lo unico que hace visible que la puerta es UNA. */
  _sancCablearCampos_(_repintarPonerSanc_);
  var bt=$('#btnSanc');
  if(bt) bt.onclick=async function(){
    var res=await _enviarSancionForm_({msg:msg, bt:bt});
    if(!res.ok) return;
    await _cargarSancionesCon_(res.r);     // la cola de abajo tiene que enterarse
    pintar();
  };
}

/* ⛔ UN FALLO DE RED NO BORRA LO QUE YA VALE. El `catch` ponía `SANC_BACK=null`, y `null`
   significa **semilla ficticia**: en el arranque daba igual -ya era null-, pero desde que esta
   funcion es tambien la del refresco vivo, un corte de red a los 90 s cambiaba la cola REAL de
   sanciones por la de ejemplo, sin decir nada. Se conserva lo que hubiera. */
async function _cargarSanciones_(){
  /* ⛔⛔ ¿LLEGÓ? Por la MISMA puerta que usa `_cargarMovimientosE_` cien líneas más
     arriba en este fichero. Su docstring en `comun.js` ya decía exactamente esto:
     *«decirle a alguien que no tiene sanciones cuando el servidor no contestó se lee
     como «estoy limpio», y ahí ya no se vuelve a mirar»*. Estaba escrito, resuelto para
     los movimientos, y **no se había traído aquí** — §3c-19: la premisa vive donde se CITA. */
  _llego_('sanc', false);
  try{ var arr=await api.getSanciones({}); if(Array.isArray(arr)){ SANC_BACK=arr; _llego_('sanc', true); } }
  catch(e){ if(!Array.isArray(SANC_BACK)) SANC_BACK=null; }
  _loteReal_();
}

/* 29/10 (la pantalla iba lenta): las escrituras de sanciones contestan con `cola` — la cola ya escrita, la misma que daria
   `getSanciones` justo despues—, asi que se pinta con eso y no se pide aparte. Sin `cola` (Apps Script, un servidor viejo,
   una respuesta rara) se pide como siempre: nunca se pinta una cola que no llego. Mismos efectos que `_cargarSanciones_`. */
async function _cargarSancionesCon_(r){
  if(r && Array.isArray(r.cola)){ SANC_BACK=r.cola; _llego_('sanc', true); _loteReal_(); return; }
  await _cargarSanciones_();
}

/* Construye el BLOQUE de sanciones desde la cola REAL del backend (SANC_BACK) cuando hay
   pendientes agrupadas en un lote. Con ids reales, marcar una decisión viaja al backend y
   «cerrar el bloque» levanta el flag que lee el motor Python. Sin backend o sin lote
   pendiente, se queda la semilla de demostración (LOTE.real queda sin marcar). */
function _loteReal_(){
  if(!Array.isArray(SANC_BACK)){
    /* ⛔⛔ `null` SIGNIFICA DOS COSAS Y SOLO UNA AUTORIZA LA SEMILLA (§3c-24). Aqui se
       salia igual en las dos:
       · **sin backend** — demostracion local, sin sesion: la semilla ES lo que se ensena,
         y vaciarla romperia lo unico que se puede mirar sin servidor (esa es la gemela
         que ya vigila `probar_refresco_escritorio.py` §1b);
       · **hay backend y sesion, y el servidor NO contesto** — ahi no se sabe nada, y
         dejar la semilla puesta le ensena al PD **«Bloque abierto · 5 personas» de gente
         inventada**, con su globo rojo, su tarjeta en la pantalla de inicio y un boton
         que dice que aplica en Notion y manda el comunicado. En la pantalla desde la que
         se aprueban sanciones de personas reales.
       ✅ La puerta para distinguirlo ya existe y es la misma que usa el resto de la cara
       (`escritorio.html:2368`): `backendOK && SESION`. No es un criterio nuevo.
       ⚠️ Y se vacia SIN marcar `real`: el bloque desaparece y los paneles de al lado ya
       dicen «sin leer» por `_llego_('sanc')` (602.ª). Lo que no puede quedar es una cola
       de mentira con el boton de aplicar encendido. */
    if(typeof backendOK!=='undefined' && backendOK &&
       typeof SESION!=='undefined' && SESION){
      LOTES_PEND=[];
      LOTE={ real:true, lote:null, nombre:null, cerrado:false, motivo:'—',
             art:'libre', items:[] };
    }
    return;                                                               // sin backend
  }
  var pend=SANC_BACK.filter(function(s){ return s.estado==='pendiente' && s.lote; });
  if(!pend.length){
    /* ⛔ AQUI SE SALIA DEJANDO LA SEMILLA, y esto no es «no lo se»: el backend HA
       CONTESTADO y ha dicho que no hay ningun lote pendiente. Eso es un DATO. Como
       es ademas el estado NORMAL -- y el que habra el 1 de septiembre, empezando
       temporada--, el PD veia de forma permanente **cinco personas inventadas con
       sus puntos**, un globo rojo con un 5 y una tarjeta en su pantalla de inicio; y
       el boton de cerrar le decia que aplicaba en Notion y mandaba el comunicado
       cuando no viajaba nada.
       ⚠️ La leccion ya estaba escrita DOS LINEAS mas abajo del contador de al lado
       -- «no hay cola de apelaciones: contar la maqueta era mentir»--, aplicada en
       `apela` y en `curso` y no aqui. Y el movil limpia esta misma semilla.
       ⚠️ Sin backend (arriba) SI se deja: ahi la semilla es la demostracion local,
       que es para lo que se hizo. */
    LOTES_PEND=[];
    LOTE={ real:true, lote:null, nombre:null, cerrado:false, motivo:'—',
           art:'libre', items:[] };
    return;
  }
  /* Antes se cogia SIEMPRE `pend[0].lote`: con dos bloques, el segundo no existia para
     el panel. Ahora se listan todos y se puede cambiar de uno a otro. */
  LOTES_PEND=[]; pend.forEach(function(x){ if(LOTES_PEND.indexOf(x.lote)<0) LOTES_PEND.push(x.lote); });
  /* ⚠️ Y AQUI SE ACABO EL `|| LOTES_PEND[0]`: era inalcanzable -- `_loteIdx_` ya devuelve
     un indice dentro de rango, y a esta linea no se llega con la lista vacia (el `if
     (!pend.length)` de arriba sale antes). Un respaldo que no puede dispararse se lee como
     una red que no existe. */
  var lote=LOTES_PEND[_loteIdx_()];
  var its=pend.filter(function(s){ return s.lote===lote; });
  /* 22/10 (ensayo de la reunión #3, 🟡 8): el bloque dice de QUÉ reunión es, no sólo su código */
  /* (refutador 29, 🟡 4) sólo reuniones del SERVIDOR (`_srv`): los ids de la semilla son ids reales */
  LOTE={ real:true, lote:lote, nombre:_nombreLoteEsc_(lote), cerrado:false,
    motivo:its[0].motivo||'—', art:its[0].articulo||'libre',
    /* ⛔ `_ptsSanc_`, NO `Number(s.puntos)||0` (758.a bis). Aqui es donde el «no llego»
       se convertia en un **0**, y a partir de este punto ya no hay forma de distinguirlo
       de un aviso de verdad: todo lo de abajo media un dato fabricado aqui. */
    /* ⛔ `origen` Y `extra` VIAJAN (759.a bis). Sin ellos la fila no puede saber que es un
       PREMIO -- y `construir_reunion.py` los mete en el mismo lote --, asi que se pintaba
       como «aviso» y se le ofrecia «Justifica», que el servidor se salta en silencio.
       📏 Medido antes: 2 escrituras de `origen` en la app y CERO lecturas. */
    items:its.map(function(s){ return {id:s.id, n:s.nombre, pts:_ptsSanc_(s.puntos),
      /* 31/10 (B6): si el PD corrigió sus puntos, la fila dice de cuánto, quién y por qué */
      pAntes:_ptsSanc_(s.puntos_antes), pMot:s.puntos_motivo||null, pPor:s.puntos_corregidos_por||null,
      origen:s.origen||null, extra:s.extra||null, motivo:s.motivo||null,
      /* ⛔ sustituida el 01/11 por Daniel (artifact [83777de2e0]: «por default todas a aceptar… quitaria la opcion de
         sin marcar»): ahora SI es `'aceptar'` por defecto (`_decDe_`, comun.js). Lo que sigue es la historia:
         ⛔ `null`, NO `'aceptar'`. Aqui se fabricaba la decision de todo lo que nadie
         habia tocado, y el panel la pintaba como ELEGIDA: los 30 con el boton «Acepta»
         encendido, la prevision de puntos restando, y el boton de cerrar diciendo
         «Aprobar el bloque · 30 sanciones». Un clic escribe en Notion y manda el
         comunicado con los 30 nombres.
         ⚠️ Y borraba lo marcado desde el movil: `s.decision` viene del servidor. */
      dec:_decDe_(s)}; }) };
}


/* ═══ APELACIONES DE TAREAS · la cola del consejo (31/10, RRI Art. 34) ══════════════════════════════
   🗣️ Daniel: *«Móvil es para todos, escritorio es para el consejo»*. El miembro apela desde el móvil; aquí las resuelven
   el PD y el coordinador o subcoordinador de la unidad (la cláusula «otra», sólo el PD). Las puertas viven en `comun.js`
   (`_apelPuedes_`); el servidor es quien manda. Sin `puedes_resolver` no hay botones: se enseña y se dice quién la resuelve. */
/* La tarjeta de una SANCIÓN apelada: quién, qué sanción, qué dice, y las tres salidas (todas con motivo). Sin permiso, quién resuelve. */
function _apelTarjetaSanc_(a){
  var m = _m(a.autor), puedes = _apelPuedes_(a), l = _enlaceWeb_(a.enlace);
  return '<div class="parte" data-apid="' + esc(a.id) + '" data-apclase="sancion">' +
    '<div class="h"><b>' + esc((m && m.pila) || a.autor) + '</b>' +
      '<span class="u">' + esc(a.unidad || '—') + '</span><span class="u">sanción</span>' +
      '<span class="q" style="font-size:12px;font-family:var(--sans);font-weight:500">' + esc(_apelEspera_(a.at)) + '</span></div>' +
    '<div class="ruta" style="margin-top:6px"><b>' + esc(a.motivo_sancion || a.titulo) + '</b> · ' + esc(_etSancFila_(a.puntos, null, null)) +
      ' · ' + esc(_isoADMY_(String(a.fecha_sancion || '').slice(0, 10)) || 'sin fecha') +
      ((a.impuesta_por || []).length ? ' · puesta por ' + esc(a.impuesta_por.join(', ')) : '') + '</div>' +
    '<div class="just"><span class="sc">Apela</span>' + esc(a.motivo) + (l ? '<br>' + l : '') + '</div>' +
    (puedes
      ? '<textarea data-apres placeholder="Tu respuesta — obligatoria en las tres salidas…"></textarea>' +
        '<div class="acts"><button class="btn ok" data-apdec="estimada">Estimar</button>' +
        '<button class="btn ok" data-apdec="parcial">Rebajar a aviso</button>' +
        '<button class="btn no" data-apdec="desestimada">Desestimar</button>' +
        '<span class="err" role="alert" data-aperr></span></div>'
      : '<div class="ruta">' + (a.autor === _fichaYo_() ? 'Es tuya: la resuelve otra persona.'
        : a.instancia === 'junta' ? 'Resuelve la Junta: el PD es parte.' : 'La resuelve el Project Director.') + '</div>') +
  '</div>';
}
function _apelTarjeta_(a){
  if (a.clase === 'sancion') return _apelTarjetaSanc_(a);
  var m = _m(a.autor), puedes = _apelPuedes_(a);
  return '<div class="parte" data-apid="' + esc(a.id) + '">' +
    '<div class="h"><b>' + esc((m && m.pila) || a.autor) + '</b>' +
      '<span class="u">' + esc(a.unidad || '—') + '</span>' +
      '<span class="u">cláusula ' + esc(a.clausula === 'otra' ? 'otra' : a.clausula) + '</span>' +
      '<span class="q" style="font-size:12px;font-family:var(--sans);font-weight:500">' + esc(_apelEspera_(a.at)) + '</span></div>' +
    '<div class="ruta" style="margin-top:6px"><b>' + esc(a.titulo) + '</b> · plazo ' + esc(_plazoDMY_(a.plazo) || 'sin fecha') + '</div>' +
    '<div class="just"><span class="sc">' + esc(_apelClausulaTxt_(a.clausula)) + '</span>' + esc(a.motivo) + '</div>' +
    (puedes
      ? '<textarea data-apres placeholder="Tu respuesta — obligatoria si desestimas…"></textarea>' +
        '<div class="acts"><span class="sc">Nuevo plazo</span>' + nxFecha('', '', {min: _hoyNxISO_(), attrs: 'data-appl'}) +
        '<button class="btn ok" data-apest="plazo">Estimar con ese plazo</button>' +
        '<button class="btn ok" data-apest="quitar">Estimar y quitarle la tarea</button>' +
        '<button class="btn no" data-apdes="1">Desestimar</button></div>'
      : '<div class="ruta">' + (a.autor === _fichaYo_() ? 'Es tuya: la resuelve otra persona.'
        : (a.clausula === 'otra' ? 'La decide la Junta y la apunta el PD.' : 'La resuelve el coordinador de ' + esc(a.unidad) + ' o el PD.')) + '</div>') +
  '</div>';
}
function _apelResuelta_(a){
  var m = _m(a.autor), q = _m(a.decidido_por);
  return '<div class="parte"><div class="h"><b>' + esc((m && m.pila) || a.autor) + '</b>' +
      '<span class="u">' + esc(a.titulo) + '</span>' +
      '<span class="q" style="font-size:11px;font-family:var(--mono);color:var(--' + (a.estado === 'desestimada' ? 'red2' : 'ok') + ')">' +
        esc(a.estado === 'parcial' ? 'a aviso' : a.estado) + '</span></div>' +
    '<div class="ruta">' + esc(_apelEstadoTxt_(a)) + ' <span style="color:var(--ink3)">· ' + esc((q && q.pila) || a.decidido_por || '') +
      ', ' + esc(_isoADMY_(String(a.decidido_at || '').slice(0, 10))) + '</span></div></div>';
}
function _vApela_(){
  var L = _apelLista_(), ab = L.filter(function(a){ return a.estado === 'abierta'; }),
      re = L.filter(function(a){ return a.estado !== 'abierta'; }).sort(function(x, y){
        return String(y.decidido_at).localeCompare(String(x.decidido_at)); });
  ab.sort(function(x, y){ return String(x.at).localeCompare(String(y.at)); });      // la que más lleva esperando, arriba
  return pan('Apelaciones abiertas', ab.length + '',
      ab.length ? ab.map(_apelTarjeta_).join('')
        : vacioSimple('No hay apelaciones abiertas', 'Cuando alguien apele, aparecerá aquí.')) +
    (re.length ? pan('Resueltas · últimos ' + APEL_DIAS_VISTA + ' días', re.length + '', re.map(_apelResuelta_).join('')) : '') +
    '<div class="nota">Una tarea estimada cambia su plazo, o se la quita a quien apeló, y se le avisa. ' +
    'Una sanción estimada devuelve los puntos; «Rebajar a aviso» los devuelve y deja un aviso.</div>';
}
/* ═══ TUS PUNTOS Y SANCIONES · «Lo tuyo» del escritorio (31/10, fila 24 de la pasada del escritorio) ═══════════
   El móvil enseña en Estado la conducta y «Tus sanciones» con «Apelar»; el escritorio sólo tenía la cola de quien RESUELVE.
   Misma lista (`_misSancLista_`), misma apelación (`_apelarSancion_`) y mismos textos (`APEL_SANC_TXT`) que el móvil: aquí sólo
   se pinta. La identidad es la SESIÓN (`_actorSanc_`), no «ver como». No hay «Alegar»: se quitó el 31/10 (`apelsanc2`).
   Dentro del plazo, «Apelar hasta …» abre el formulario BAJO la fila (el escritorio no tiene modal); fuera de plazo, la fila lo dice
   y no ofrece nada. El PD también sale: sus sanciones las resuelve otra persona (`_puedeResolverApelacion_`), no él. */
function _misSancPanelE_(mi){
  var p = mi && mi.puntos, L = _misSancLista_().filter(function(s){ return s; });
  var cuerpo = L.length ? L.map(function(s){
    var est = _sancEstadoM_(s), pts = _etSancFila_(s.puntos, null, null);
    return '<div class="parte" data-msfila="' + esc(s.id) + '"><div class="h"><b>' + esc(s.motivo || 'Sanción') + '</b>' +
        '<span class="u">' + esc(pts) + ' · ' + esc(_isoADMY_(String(s.fecha || '').slice(0, 10)) || '') + '</span></div>' +
      (est ? '<div class="ruta msest" style="color:' + est[1] + '">' + esc(est[0]) + '</div>' : '') +
      (s.apelable
        ? '<div class="acts"><button class="btn" data-msapelar="' + esc(s.id) + '">Apelar hasta ' + esc(_isoADMY_(s.apelable_hasta) || '') + '</button></div>'
        : (!s.apelacion ? '<div class="ruta">' + esc(s.no_apelable || 'El plazo para apelar ya pasó.') + '</div>' : '')) +
    '</div>';
  }).join('') : vacioSimple('Ninguna sanción', 'No tienes sanciones aplicadas esta temporada.');
  return '<div id="msBloque">' + pan('Tus puntos y sanciones', (typeof p === 'number' && isFinite(p)) ? 'Conducta ' + p + ' / 10' : 'Conducta —', cuerpo) + '</div>';
}
/* Cablea «Apelar»: abre el formulario bajo la fila. Motivo obligatorio (mismo aviso que el móvil); el rechazo del servidor se queda EN la fila. */
function _engMisSanc_(){
  $$('[data-msapelar]').forEach(function(b){
    b.onclick = function(){
      var fila = b.closest('[data-msfila]'), s = _misSancLista_().filter(function(x){ return x.id === b.dataset.msapelar; })[0];
      if (!s || !fila || fila.querySelector('[data-msform]')) return;
      var f = document.createElement('div'); f.setAttribute('data-msform', '1'); f.style.marginTop = '10px';
      f.innerHTML = '<p class="ruta">' + esc(APEL_SANC_TXT.tienes(s.apelable_hasta)) + '</p>' +
        '<label class="campo"><span class="sc">' + APEL_SANC_TXT.campo + ' <span class="req">*</span></span>' +
          '<textarea data-msmotivo placeholder="' + esc(APEL_SANC_TXT.ayuda) + '"></textarea></label>' +
        '<label class="campo"><span class="sc">' + APEL_SANC_TXT.enlace + '</span>' +
          '<input data-msenlace type="url" inputmode="url" placeholder="https://…" autocomplete="off"></label>' +
        '<div class="acts"><button class="btn" data-msno>Cancelar</button><button class="btn ok" data-msenviar>Enviar</button>' +
          '<span class="err" role="alert" data-mserr style="color:var(--red2);font-size:12px"></span></div>';
      fila.appendChild(f); b.style.display = 'none';
      var mo = f.querySelector('[data-msmotivo]'), en = f.querySelector('[data-msenviar]'), er = f.querySelector('[data-mserr]');
      mo.focus();
      f.querySelector('[data-msno]').onclick = function(){ f.remove(); b.style.display = ''; };
      en.onclick = function(){
        if (!mo.value.trim()){ er.textContent = APEL_SANC_TXT.vacio; mo.focus(); return; }
        er.textContent = ''; en.disabled = true;
        _apelarSancion_(s, mo.value.trim(), (f.querySelector('[data-msenlace]').value || '').trim())
          .then(function(){ return _cargarMisSanciones_(); })
          .then(function(){ pintar(); tost(APEL_SANC_TXT.enviada); })
          .catch(function(e){ en.disabled = false; er.textContent = (e && e.message) || String(e); });
      };
    };
  });
}
function _engApela_(){
  $$('[data-apid]').forEach(function(caja){
    var ap = null, i, L = _apelLista_();
    for (i = 0; i < L.length; i++) if (L[i].id === caja.dataset.apid) ap = L[i];
    function resolver(b, datos){
      if (!ap || ap.estado !== 'abierta'){ tost('Esa apelación ya no está abierta: recarga la pantalla.'); pintar(); return; }
      b.disabled = true;
      _resolverApelacion_(ap, datos).then(function(r){
        pintar(); tost('Apelación ' + (r && r.estado === 'estimada' ? 'estimada' : 'desestimada') + '. Se le avisa a ' +
          ((_m(ap.autor) && _m(ap.autor).pila) || ap.autor) + '.');
      }).catch(function(e){ b.disabled = false; tost('No se pudo guardar la respuesta: ' + ((e && e.message) || e)); });
    }
    var ta = caja.querySelector('[data-apres]'), pl = caja.querySelector('[data-appl]');
    $$('[data-apdec]', caja).forEach(function(b){
      b.onclick = function(){
        var er = caja.querySelector('[data-aperr]'), txt = ta ? ta.value.trim() : '', bs = $$('[data-apdec]', caja);
        if (!txt){ if (er) er.textContent = 'Escribe el motivo: queda con tu nombre.'; if (ta) ta.focus(); return; }
        if (!ap || ap.estado !== 'abierta'){ tost('Esa apelación ya no está abierta: recarga la pantalla.'); pintar(); return; }
        if (er) er.textContent = '';
        bs.forEach(function(x){ x.disabled = true; });
        _resolverApelacion_(ap, {decision: b.dataset.apdec, resolucion: txt}).then(function(){
          pintar(); tost({estimada: 'Apelación estimada: vuelven los puntos.', parcial: 'Rebajada a aviso.', desestimada: 'Apelación desestimada.'}[b.dataset.apdec]);
        }).catch(function(e){        /* el rechazo del servidor se queda EN la tarjeta, con los botones vivos y lo tecleado intacto */
          bs.forEach(function(x){ x.disabled = false; });
          if (er) er.textContent = (e && e.message) || String(e);
        });
      };
    });
    $$('[data-apest]', caja).forEach(function(b){
      b.onclick = function(){
        var q = b.dataset.apest === 'quitar';
        if (!q && !(pl && pl.value)){ if (pl) pl.focus(); tost('Pon el nuevo plazo, o usa «Estimar y quitarle la tarea».'); return; }
        resolver(b, {decision: 'estimada', resolucion: ta ? ta.value.trim() : '', plazo: q ? undefined : pl.value, quitar: q || undefined});
      };
    });
    $$('[data-apdes]', caja).forEach(function(b){
      b.onclick = function(){
        if (!(ta && ta.value.trim())){
          if (ta){ ta.focus(); ta.style.borderColor = 'rgba(232,145,46,.6)'; setTimeout(function(){ ta.style.borderColor = ''; }, 1600); }
          tost('Para desestimar hay que dar el motivo.'); return; }
        resolver(b, {decision: 'desestimada', resolucion: ta.value.trim()});
      };
    });
  });
}
