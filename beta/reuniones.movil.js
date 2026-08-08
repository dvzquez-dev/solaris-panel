/* ═══ REUNIONES · cara movil ═══════════════════════════════════════════════════════════
   30 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* límite de una reunión en DD/MM (del dato, no cableado). */
function _limM_(R){ var l=R&&R.limite; if(!l) return 'sin límite'; l=String(l).slice(0,10); return _isoADMY_(l); }

function _msDeDDMM_(dd, base){
  var m=/^\s*(\d{1,2})\/(\d{1,2})/.exec(String(dd||''));
  if(!m) return null;
  var t=new Date(base.getFullYear(), (+m[2])-1, +m[1]).getTime();
  if(t < base.getTime()-182*_MSDIA_) t=new Date(base.getFullYear()+1, (+m[2])-1, +m[1]).getTime();
  return t;
}

/* Cuando OCURRE: la fijada, su dia fijado; la que no, su primer dia ofertado que no
   haya pasado. No es el limite para responder -eso es otra cosa y se dice aparte-. */
function _cuandoReuM_(r){
  var base=_hoyDateM_(), dias=(r&&r.dias)||[];
  if(r && r.fijada && (r.fijadaBl||[]).length){
    var t=_msDeDDMM_(dias[r.fijadaBl[0][0]], base);
    if(t!=null) return { ms:t, fijada:true };
  }
  var ts=dias.map(function(d){ return _msDeDDMM_(d, base); })
             .filter(function(x){ return x!=null; });
  if(!ts.length) return { ms:Infinity, fijada:!!(r&&r.fijada) };   // sin fechas legibles: al final
  var fut=ts.filter(function(t){ return t>=base.getTime(); });
  return { ms: fut.length ? Math.min.apply(null,fut) : Math.max.apply(null,ts),
           fijada: !!(r&&r.fijada) };
}

/* Lo que te falta cubrir, ordenado por lo que CADUCA ANTES. El plazo es lo que mira el
   motor de sanciones, asi que es lo que manda en el aviso -no la fecha de la reunion-. */
function _limMsM_(r){
  var l=r&&r.limite; if(!l) return Infinity;
  var t=Date.parse(String(l).slice(0,10)); return isNaN(t)?Infinity:t;
}

function _pendientesCubrirM_(){
  return (REUNIONES_M||[]).filter(function(r){
    return r && !r.cubierta && !r.exento && !r.fijada;   // fijada = el plazo ya se cerro
  }).sort(function(a,b){ return _limMsM_(a)-_limMsM_(b); });
}

function _diaTxtM_(d){
  var t=String(d==null?'':d).trim();
  var m=/(\d{1,2})\s*\/\s*(\d{1,2})/.exec(t);
  if(!m) return t;                                   // sin mes: no se le inventa uno
  var ms=_msDeDDMM_(m[1]+'/'+m[2], _hoyDateM_());
  return (ms!=null ? _DIAS3_[new Date(ms).getDay()]+' ' : '')+pad(+m[1])+'/'+pad(+m[2]);
}

/* La etiqueta de una reunion ya fijada se guardo con el formato de entonces. Se reescribe
   solo su parte de DIA y se deja la hora intacta. */
function _fijadaTxtM_(f){
  var t=String(f||''); if(!t) return t;
  var i=t.indexOf(' · ');
  return i<0 ? _diaTxtM_(t) : (_diaTxtM_(t.slice(0,i))+t.slice(i));
}

/* Borrar una reunion la puede borrar QUIEN LA CONVOCO (o el admin), no cualquier
   coordinador: es lo que exige el backend, y el boton tiene que decir la verdad. */
function _puedeBorrarReuM_(r){
  if(!r) return false;
  if(typeof esAdmin==='function' && esAdmin()) return true;
  return !!(YO && r.convocante && YO.nombre===r.convocante);
}

function _proximaReuM_(){
  var L=REUNIONES_M||[]; if(!L.length) return null;
  var hoy=_hoyDateM_().getTime();
  var con=L.map(function(r){ var c=_cuandoReuM_(r);
    return { r:r, ms:c.ms, fij:c.fijada, pasada:(c.ms<hoy) }; });
  con.sort(function(a,b){
    if(a.pasada!==b.pasada) return a.pasada?1:-1;   // lo que ya ocurrió, al final
    if(a.ms!==b.ms) return a.ms-b.ms;               // antes en el tiempo, antes en la lista
    if(a.fij!==b.fij) return a.fij?-1:1;            // a igualdad, manda la que tiene fecha
    return 0;
  });
  return con[0].r;
}

/* ---- HORAS: una sola familia. Habia CINCO parsers de 'HH:MM' repartidos por este
   fichero, con tres unidades de salida distintas y dos que reventaban si les llegaba un
   string en vez de un {ini}. Se unificaron en `_minHM_`... pero POR CARA, asi que quedaron
   dos copias identicas. Desde el 07/08 vive en `comun.js`, que cargan las dos. ---- */

/* ⛔ `_firmaResp_` VIVE EN `comun.js` (08/08), que cargan las dos caras. Estaba aqui
   cuando solo el movil refrescaba la reunion abierta; al darle ese refresco tambien al
   escritorio, copiarla habria sido crear otra gemela. */

async function _refrescarReuAbierta_(){
  if(typeof backendOK==='undefined' || !backendOK || !SESION) return;
  if(_REFREU_ || document.hidden) return;
  if(ST.vista!=='reu') return;                 // solo lo que tienes delante
  if(_modalAbierto_()) return;                 // no se cambia la rejilla mientras pintas
  var R=REUNION; if(!R || R.id==null) return;
  _REFREU_=true;
  try{
    var d=await api.getReunion(R.id);
    var resp=(d && (d.respuestas || (d.reunion && d.reunion.resp))) || null;
    if(!resp) return;
    var base=(d && d.reunion) || {};
    var nuevo=_normReuM_(_fuenteReuM_(R, base, resp));
    nuevo._hidratada=true;
    /* Si nadie ha contestado nada nuevo, NO se repinta: reconstruir la pantalla cada 20 s
       para dejarla igual se nota, y molesta. */
    if(_firmaResp_(nuevo)===_firmaResp_(R)) return;
    var i=REUNIONES_M.indexOf(R); if(i>=0) REUNIONES_M[i]=nuevo;
    REUNION=nuevo;
    if(ST.vista==='reu' && !_modalAbierto_()) _repintarSuave_();
  }catch(_){ } finally { _REFREU_=false; }
}

/* OJO: solo es «no tienes reuniones» si YA llegaron. Mientras se cargan hay que decir que
   se estan cargando, o alguien puede creer que no le toca cubrir nada y no cubrir. */
function _sinReuniones_(){ return !!(typeof backendOK!=='undefined' && backendOK && SESION && CARGA.reuniones && !REUNIONES_M.length); }

function _reunionesCargando_(){ return !!(typeof backendOK!=='undefined' && backendOK && SESION && !CARGA.reuniones); }


function _normReuM_(r){
  var dias=r.dias||[], F=r.franjas||[], bl=r.bloques||[], resp=r.resp||{};
  /* null = bloque NO OFERTADO (con horario por día no todas las franjas existen todos los
     días). app.html lo resolvía con un Set `oferta`; aquí la matriz nace a null y solo los
     bloques realmente ofertados pasan a 0. Así un hueco muerto no se pinta como «nadie puede».
     `pond` es la vista PONDERADA: suma los valores (presencial+telemático=2, telemático=1);
     `calor` cuenta PERSONAS (cualquier valor > 0). */
  /* Los bloques de la franja fijada pueden venir de DOS sitios: dentro de `fijada` cuando
     el backend manda el objeto {label,bloques,franjas}, o sueltos en `fijadaBl` cuando lo
     que se re-normaliza es una reunion que YA paso por aqui (al salir, `fijada` se aplana
     a la etiqueta). Mirar solo el objeto hacia que hidratar borrase el verde del mapa. */
  var _fijPrev=(r.fijada && typeof r.fijada==='object') ? (r.fijada.bloques||[])
             : (Array.isArray(r.fijadaBl) ? r.fijadaBl : []);
  var _ord=_ordenarFranjas_({franjas:F, bloques:bl, fijadaBl:_fijPrev});
  F=_ord.franjas; bl=_ord.bloques; _fijPrev=_ord.fijadaBl;
  var calor=_calorDe_({dias:dias, franjas:F, bloques:bl, resp:resp}, false);
  var pond =_calorDe_({dias:dias, franjas:F, bloques:bl, resp:resp}, true);
  /* `fijada` viene del backend como OBJETO con los indices ({fecha,franjas,bloques,label}).
     Antes se colapsaba a la etiqueta y se perdian los indices, asi que el mapa no podia
     pintar el hueco elegido en verde aunque el aviso lo prometiera. */
  var fijO=r.fijada, fijBl=_fijPrev.slice();
  var fij=fijO; if(fij && typeof fij==='object') fij=fij.label||fij.iso||null;
  return { id:r.id, titulo:r.titulo||'Reunión sin título', tipo:r.tipo||'general',
    modalidad:r.modalidad||'hibrida', limite:r.limite||null, fijada:fij||null, fijadaBl:fijBl,
    convocante:r.convocante||'', dias:dias, franjas:F, bloques:bl, resp:resp,
    /* El backend lo manda (`_ex.ordenDia`) y aqui se tiraba, asi que el dialogo salia
       siempre vacio y no habia forma de corregir un enlace mal pegado. */
    ordenDia:r.ordenDia||'',
    /* `slot` es la casilla que se pinta y `duracion` lo que hay que juntar seguido.
       Las reuniones de antes de este modelo no traen `duracion`: entonces el minimo es
       una casilla y todo se comporta como se comportaba. */
    slot: +r.slot || (F[0] && +F[0].dur) || 60, duracion: +r.duracion || 0,
    calor:calor, pond:pond, nInv:(r.invitados||[]).length,
    /* ¿ES TUYA? Antes solo se guardaba CUANTOS invitados hay, y sin los nombres nadie podia
       preguntarse «¿estoy yo?»: se le reclamaba cubrir a todo el equipo una reunion de un
       invitado. Y de no cubrir salen sanciones, asi que no es un aviso cosmetico.
       Sin lista de invitados (reuniones de antes de este modelo) se mantiene el
       comportamiento de siempre —todos—: hacerlas desaparecer de golpe seria peor. */
    invitado: (function(){
      var inv=Array.isArray(r.invitados)?r.invitados:null;
      if(!inv || !inv.length) return true;                       // sin lista: como antes
      if(!YO || !YO.nombre) return true;
      return inv.indexOf(YO.nombre)>=0 || YO.nombre===r.convocante;   // convocas = es tuya
    })(),
    cubierta: !!(YO && resp[YO.nombre] && resp[YO.nombre].some(function(x){ return +x>0; })),
    exento: !!(YO && r.convocante && YO.nombre===r.convocante),   // quien convoca ORGANIZA: no cubre su propia encuesta
    _real:true };
}

/* 🔴 UNA SOLA FUENTE POR HIDRATACION. Aqui estaba el «la fecha fijada sale roja».

   Las dos hidrataciones hacian esto: coger `R.franjas` -que YA estan ordenadas por hora y
   con los indices remapeados- y juntarlas con `base.fijada`, cuyos `bloques` traen los
   indices ORIGINALES del servidor. Mezclar los dos espacios apunta a otra franja: la
   General llego de Xoyondo como 18,19,20,21,22,10,11...17, asi que el indice 4 deja de ser
   las 22:00 y pasa a ser las 14:00. Y como las 14:00 de ese dia no se ofertaban, la celda
   se funde con todo el bloque rayado de la mañana y el verde no se pinta EN NINGUN SITIO:
   solo se ve verde si el tramo entero cae dentro del rango fijado.

   La regla: o todo del servidor, o todo de lo que ya teniamos. Nunca la mitad de cada. */
function _fuenteReuM_(R, base, resp){
  var delServidor = base && Array.isArray(base.franjas) && base.franjas.length && Array.isArray(base.bloques);
  var s = delServidor ? base : R;
  return { id:R.id, titulo:R.titulo, tipo:R.tipo, modalidad:R.modalidad,
    limite:R.limite, convocante:R.convocante, slot:R.slot, duracion:R.duracion,
    invitados:new Array(R.nInv), resp:resp,
    dias:s.dias||R.dias, franjas:s.franjas||R.franjas, bloques:s.bloques||R.bloques,
    /* Del servidor viene el objeto `fijada` con sus indices; de lo nuestro, la etiqueta ya
       aplanada mas `fijadaBl` YA remapeado. Cada camino, entero. */
    fijada: delServidor ? base.fijada : R.fijada,
    fijadaBl: delServidor ? [] : R.fijadaBl };
}

async function _hidratarReuM_(r){
  if(!r || r._hidratada) return r;
  try{ var d=await api.getReunion(r.id);
    var resp=(d && (d.respuestas || (d.reunion && d.reunion.resp))) || null;
    if(resp){ var base=(d && d.reunion) || {};
      /* `base.fijada` es el objeto del backend cuando lo hay; `r.fijada` ya es la etiqueta
         aplanada, asi que hay que arrastrar `fijadaBl` aparte o se pierde el verde. */
      var nuevo=_normReuM_(_fuenteReuM_(r, base, resp));
      nuevo._hidratada=true;
      var i=REUNIONES_M.indexOf(r); if(i>=0) REUNIONES_M[i]=nuevo;
      if(REUNION===r) REUNION=nuevo;
      return nuevo; }
  }catch(e){}
  r._hidratada=true; return r;
}

/* `yaPedidas`: una promesa de `listarReuniones` lanzada antes. La PETICION no necesita saber
   quien eres -el backend te identifica por el token-, pero NORMALIZARLA si (`_normReuM_`
   mira `YO.nombre` para saber que has contestado tu). Separarlas deja que la peticion vuele
   en paralelo con el `bootstrap` y solo el normalizado espere. Sin argumento, pide ella
   misma: asi la sigue usando el refresco en vivo sin enterarse. */
async function _cargarReunionesM_(yaPedidas){
  try{ var arr=await (yaPedidas || api.listarReuniones());
    CARGA.reuniones=true;
    if(Array.isArray(arr) && arr.length){
      /* SE CONSERVA LA QUE ESTABAS MIRANDO. Esta funcion tambien la llama el refresco en
         vivo cada 90 s: sin esto, estarias viendo una reunion y de pronto te saltaria a otra
         sola. Solo se elige la «proxima» cuando no habia ninguna abierta o ya no existe. */
      var _antes=(REUNION && REUNION.id)||null;
      /* Se filtra AQUI y no en cada pantalla: la lista, el globo del nav, «lo que caduca
         antes» y «tu proxima reunion» leen todos de `REUNIONES_M`, asi que repetir la
         condicion en cuatro sitios es garantizar que un dia se desincronicen.
         En el ESCRITORIO no se filtra: alli se ven todas a proposito. */
      REUNIONES_M=arr.map(_normReuM_).filter(function(r){ return r.invitado; });
      var mia=null;
      if(_antes!=null) mia=REUNIONES_M.filter(function(x){ return x.id===_antes; })[0]||null;
      /* Antes: la primera SIN FIJAR en orden de creacion. Ni miraba fechas, ni tenia
         sentido descartar las fijadas -son las que mas seguro ocurren-. */
      if(!mia) mia=_proximaReuM_()||REUNIONES_M[0];
      if(mia){ REUNION=mia; await _hidratarReuM_(mia); }
      /* Y LAS DEMAS TAMBIEN, en paralelo y sin bloquear: antes solo se hidrataba la
         «proxima» y el resto al abrirlas, de ahi el «aun me la tiene que cargar». Suelen
         ser una o dos. Si alguna falla, las demas siguen. */
      var _resto=REUNIONES_M.filter(function(x){ return x!==mia && !x._hidratada; });
      if(_resto.length){
        Promise.all(_resto.map(function(x){ return _hidratarReuM_(x).catch(function(){}); }))
          .then(function(){
            /* SOLO si estas mirando reuniones. Esto hidrata los mapas de calor del resto de
               la lista; si estas en Estado no cambia nada de lo que ves, y sin embargo era
               una SEGUNDA pintada del arranque —medida— que volvia a animar las barras.
               Daniel: «la barra sigue arrancando desde 0 2 o 3 veces al iniciar sesion». */
            if(ST.vista==='reu' && typeof _repintarSuave_==='function') _repintarSuave_();
          });
      }
    }
  }catch(e){}
}

function _proxReuHTML_(){
  var R=_proximaReuM_();
  if(_reunionesCargando_())
    return '<h2 class="sec">Próxima reunión<span class="ln"></span></h2>'+
      '<div class="tarj"><p class="rnota" style="margin:0;padding:6px 0">Cargando tus reuniones…</p></div>';
  if(_sinReuniones_() || !R)
    return '<h2 class="sec">Próxima reunión<span class="ln"></span></h2>'+
      '<div class="tarj">'+vacio('Ninguna reunión convocada',
        'Ahora mismo no estás convocado a ninguna reunión.','',false)+'</div>';
  var c=_cuandoReuM_(R), pasada=(c.ms<_hoyDateM_().getTime());
  /* Si lo único que queda ya ocurrió, se dice: llamar «próxima» a algo de la semana
     pasada es exactamente el tipo de mentira pequeña que hace desconfiar del resto. */
  var rotulo = pasada ? 'Última reunión' : 'Próxima reunión';
  var cuando = R.fijada ? esc(R.fijada)
    : ((R.dias&&R.dias.length) ? ('sin fecha fija · cierra el '+esc(_limM_(R)))
                               : ('cierra el '+esc(_limM_(R))));
  return '<h2 class="sec">'+rotulo+'<span class="ln"></span></h2>'+
    '<div class="tarj clic" data-ir="reu" data-reuid="'+esc(String(R.id))+'" data-p>'+
    '<div class="fila" style="padding-top:0"><div class="a"><b>'+esc(R.titulo)+'</b>'+
    '<small>'+cuando+' · '+esc((R.modalidad||'').toUpperCase())+'</small></div>'+
    '<div class="d"><span class="pil '+((R.fijada||R.cubierta||R.exento)?'conf':'pend')+'">'+
      (R.fijada?'fijada':(R.exento?'organizas':(R.cubierta?'cubierta':'te falta')))+'</span></div></div></div>';
}

function vReu(){
  if(_reunionesCargando_())
    return '<div class="h1">Reuniones</div><p class="h1s">Tus reuniones y encuestas de disponibilidad.</p>'+
      '<div class="tarj"><p class="rnota" style="margin:0;padding:6px 0">Cargando tus reuniones…</p></div>';
  if(_sinReuniones_())
    return '<div class="h1">Reuniones</div><p class="h1s">Tus reuniones y encuestas de disponibilidad.</p>'+
      '<button class="btn pri full" data-p id="btnCrear" style="margin-bottom:11px">Convocar '+(esCoord()?'reunión':'reunión de trabajo')+'</button>'+
      '<div class="tarj">'+vacio('Ninguna reunión convocada','Ahora mismo no estás convocado a ninguna '+
        'reunión. Cuando alguien convoque una, aparecerá aquí para que cubras tu disponibilidad.','',false)+'</div>';
  var R=REUNION, nF=R.franjas.length;
  /* Vista PONDERADA (solo tiene sentido en híbridas): presencial+telemático vale 2 y
     telemático 1, así que la ponderación es literalmente la suma de los valores. En
     «personas» se cuenta a cada uno una vez. Los null (no ofertado) no entran en nada. */
  var hib=(R.modalidad==='hibrida') && !!R.pond;
  var pondOn = hib && !!ST.pond;
  var M = pondOn ? R.pond : R.calor;
  var max=0; M.forEach(function(fila){fila.forEach(function(v){ if(v!=null&&v>max)max=v; });});
  var best={d:0,f:0,v:0};
  M.forEach(function(fila,di){fila.forEach(function(v,fi){ if(v!=null&&v>best.v)best={d:di,f:fi,v:v}; });});
  /* indice rapido de los bloques fijados, para pintarlos en verde */
  /* ── LA MEJOR HORA ES UNA VENTANA, NO UNA CASILLA ──────────────────────────
     Con slots de 30 min y una reunion de 1 h, la casilla con mas gente no responde a
     nada: si a las 18:00 pueden 12 y a las 18:30 solo 2, a las 18:00 NO cabe la reunion.
     Se busca la mejor ventana de lo que dura, y se cuenta a quien puede en TODA ella:
     es una INTERSECCION de personas, no el minimo casilla a casilla. Sin respuestas
     cargadas (la lista no las trae hasta abrir la reunion) se cae a la casilla suelta,
     que es lo que habia. ───────────────────────────────────────────────────────── */
  var _slotR=+R.slot || (R.franjas[0] && +R.franjas[0].dur) || 60;
  var _minR=_slotsMin_(R.duracion, _slotR);
  var _ofR={}; (R.bloques||[]).forEach(function(b){ _ofR[b[0]+'_'+b[1]]=1; });
  var _quien=[];                                  // un Set de 'd_f' por persona
  Object.keys(R.resp||{}).forEach(function(n){
    var v=R.resp[n]||[], set={}, hay=false;
    (R.bloques||[]).forEach(function(b,i){ if(+v[i]>0){ set[b[0]+'_'+b[1]]=1; hay=true; } });
    if(hay) _quien.push(set);
  });
  var vent={d:best.d, f0:best.f, f1:best.f, v:best.v, exacta:false};
  if(_quien.length){
    var mejor={d:0,f0:0,f1:0,v:-1};
    R.dias.forEach(function(_,di){
      for(var f=0; f+_minR<=R.franjas.length; f++){
        var ok=true;
        for(var i=0;i<_minR;i++) if(!_ofR[di+'_'+(f+i)]){ ok=false; break; }
        if(!ok) continue;
        var n=0;
        _quien.forEach(function(set){
          for(var i=0;i<_minR;i++) if(!set[di+'_'+(f+i)]) return;
          n++;
        });
        if(n>mejor.v) mejor={d:di, f0:f, f1:f+_minR-1, v:n};
      }
    });
    if(mejor.v>=0) vent={d:mejor.d, f0:mejor.f0, f1:mejor.f1, v:mejor.v, exacta:true};
  }
  /* EJE DE TIEMPO, no de franjas. Con horarios distintos por dia la union mezcla :00 y
     :30; una columna por franja hacia que cada dia llenara una de cada dos casillas y el
     mapa pareciera un tablero. Ahora la columna es un instante y cada franja ocupa lo que
     dura, asi que la fila de cada dia sale de una pieza. */
  var _mm=_minHM_;                          // antes: parser propio, identico a este
  var _du=function(f){ return +f.dur||60; };
  /* EL VERDE, POR HORA REAL Y NO POR INDICE DE FRANJA.
     (Va AQUI y no arriba: necesita `_mm`/`_du`, que se declaran justo encima. Puesto antes,
      `vReu` reventaba entera con «_mm is not a function» y la pantalla de Reuniones no
      pintaba nada.)

     Se buscaba `fijSet[dia+'-'+franja]` contra la franja que cubre cada instante — pero esa
     rejilla solo guarda UNA franja por instante, y las reuniones de antes del modelo de slot
     traen franjas de 60 min SOLAPADAS cada 30. Resultado: la general tenia su fijada en una
     franja que nunca ganaba ningun instante y no se pintaba NADA; y la de trabajo, fijada en
     dos franjas que se pisan, salia como un solo bloque en vez del rango entero.

     Con el rango en minutos da igual cuantas franjas sean ni si se solapan: una celda va en
     verde si su tramo cae dentro. */
  var fijRango={};
  (R.fijadaBl||[]).forEach(function(b){
    var di=b[0], fi=b[1], f=R.franjas[fi]; if(!f) return;
    var a=_mm(f), z=a+_du(f), r=fijRango[di];
    fijRango[di] = r ? [Math.min(r[0],a), Math.max(r[1],z)] : [a,z];
  });
  /* Una celda esta fijada si su tramo [t, t+paso) cae dentro del rango de su dia. */
  function _esFijada_(di, t, hasta){
    var r=fijRango[di]; return !!r && t>=r[0] && hasta<=r[1];
  }
  var paso=0; R.franjas.forEach(function(f){ paso=_mcd_(paso,_mm(f)); paso=_mcd_(paso,_du(f)); });
  paso=Math.max(15, Math.min(60, paso||60));
  var t0=Math.min.apply(null, R.franjas.map(_mm));
  var t1=Math.max.apply(null, R.franjas.map(function(f){ return _mm(f)+_du(f); }));
  var eje=[]; for(var _t=t0; _t<t1; _t+=paso) eje.push(_t);
  var _hhmm=_hmMin_;                        // antes: formateador propio, identico a este
  /* para cada dia y cada instante, que franja OFERTADA lo cubre (-1 = ninguna) */
  var cubre=R.dias.map(function(_,di){
    return eje.map(function(t){
      for(var fi=0; fi<R.franjas.length; fi++){
        if(M[di][fi]==null) continue;
        var a=_mm(R.franjas[fi]);
        if(t>=a && t<a+_du(R.franjas[fi])) return fi;
      }
      return -1;
    });
  });
  var g='<div style="overflow-x:auto;margin:0 2px"><div style="display:grid;gap:2px;grid-template-columns:auto repeat('+eje.length+',minmax(20px,1fr));min-width:280px">';
  g+='<div></div>';
  eje.forEach(function(t,ix){
    /* decision cerrada: la etiqueta va al LIMITE izquierdo = hora de inicio. Con paso fino
       solo se rotula la hora en punto, o no se leeria nada. */
    var enPunto=(t%60===0);
    g+='<div style="position:relative;min-height:15px">'+
      (enPunto?'<span style="position:absolute;left:0;top:2px;transform:translateX(-50%);'+
        'font-family:var(--mono);font-size:8.5px;color:var(--ink3)">'+pad(Math.floor(t/60)%24)+'</span>':'')+
      (ix===eje.length-1?'<span style="position:absolute;right:0;top:2px;font-family:var(--mono);'+
        'font-size:8.5px;color:var(--ink3)">'+_hhmm(t1).replace(':00','')+'</span>':'')+
      '</div>';
  });
  R.dias.forEach(function(d,di){
    g+='<div style="font-family:var(--mono);font-size:9.5px;color:var(--ink2);display:flex;'+
      'align-items:center;justify-content:flex-end;padding-right:6px">'+d+'</div>';
    /* UNA CELDA POR FRANJA, ancha lo que la franja dura. Antes se pintaba una celda por
       INSTANTE del eje y el numero solo en la que arrancaba: con paso de 30 min y franjas
       de una hora salia «3 · 3 · 3 ·», y parecia que en la mitad de los huecos no podia
       nadie. El eje de tiempo se queda; lo que cambia es que la franja no se trocea. */
    var ix=0;
    while(ix<eje.length){
      var fi=cubre[di][ix], k=1;
      while(ix+k<eje.length && cubre[di][ix+k]===fi) k++;      // hasta donde llega esta franja
      var geo='grid-column:span '+k+';height:21px;border-radius:2px';
      if(fi<0){                                                // fuera del horario de ese dia
        /* ...salvo que ahi este la reunion FIJADA. La fijada es una DECISION, no un dato de
           disponibilidad: tiene que verse aunque esa franja no estuviera ofertada ese dia.
           Pasa con las reuniones viejas, cuyas franjas de 60 min se solapan cada 30 y no
           cuadran con la rejilla. Si la decision no se ve, el mapa no sirve para lo unico
           que de verdad importa mirar. */
        if(_esFijada_(di, eje[ix], (ix+k<eje.length? eje[ix+k] : eje[ix]+paso))){
          g+='<div title="reunión fijada" style="'+geo+';background:rgba(53,199,89,.85);'+
            'outline:1px solid var(--ok);outline-offset:-1px"></div>';
          ix+=k; continue;
        }
        g+='<div title="fuera del horario de ese d\u00eda" style="'+geo+';'+
          'background:repeating-linear-gradient(45deg,rgba(255,255,255,.045) 0 3px,transparent 3px 6px);'+
          'border:1px solid var(--line)"></div>';
      } else {
        var v=M[di][fi], ini=_mm(R.franjas[fi]);
        var a=(0.12+0.88*(max?v/max:0)).toFixed(3);
        var _t0=eje[ix], _t1=(ix+k<eje.length? eje[ix+k] : ini+_du(R.franjas[fi]));
        var esBest=(di===vent.d && fi>=vent.f0 && fi<=vent.f1 && vent.v>0), fij=_esFijada_(di,_t0,_t1);
        var fondo = fij ? 'rgba(53,199,89,.85)' : 'rgba(228,30,37,'+a+')';
        var borde = fij ? ';outline:1px solid var(--ok);outline-offset:-1px'
                   : (esBest?';outline:1px solid var(--ink);outline-offset:-1px':'');
        g+='<div title="'+_hhmm(ini)+'\u2013'+_hhmm(ini+_du(R.franjas[fi]))+' \u00b7 '+v+'" style="'+geo+';'+
          'display:grid;place-items:center;font-family:var(--mono);font-size:8.5px;color:#fff;'+
          'background:'+fondo+borde+'">'+v+'</div>';
      }
      ix+=k;
    }
  });
  g+='</div></div>';

  return '<div class="h1">Reuniones</div><p class="h1s">Tus reuniones y encuestas de disponibilidad.</p>'+
    '<button class="btn pri full" data-p id="btnCrear" style="margin-bottom:11px">Convocar '+(esCoord()?'reunión':'reunión de trabajo')+'</button>'+
    '<h2 class="sec">Mis reuniones<span class="ln"></span>'+(REUNIONES_M.length||1)+'</h2>'+
    (REUNIONES_M.length>1
      ? '<div class="tarj">'+REUNIONES_M.map(function(x,i){
          var sel=(x.id===R.id);
          return '<div class="fila clic" data-reu="'+i+'" data-p'+(sel?' style="background:rgba(228,30,37,.07)"':'')+'>'+
            '<div class="a"><b>'+esc(x.titulo)+'</b><small>'+esc(x.tipo)+' · '+
            (x.fijada?'📌 '+esc(_fijadaTxtM_(x.fijada)):'cierra el '+_limM_(x))+' · '+x.nInv+' convocados</small></div>'+
            '<div class="d">'+(sel?'<span class="pil conf">viendo</span>':'<span class="chev">›</span>')+'</div></div>'; }).join('')+'</div>'
      : '')+
    '<div class="tarj">'+cab(R.tipo||'General', R.modalidad||'')+
      '<div class="fila" style="padding-top:0"><div class="a"><b>'+esc(R.titulo)+'</b>'+
      '<small>'+(R.convocante?'Convoca '+esc((_pilaDeM_(R.convocante)||R.convocante))+' · ':'')+(R.fijada?'📌 '+esc(_fijadaTxtM_(R.fijada)):'cierra el '+_limM_(R))+' · '+R.nInv+' convocados</small></div>'+
      '<div class="d"><span class="pil '+((R.fijada||R.cubierta||R.exento)?'conf':'no')+'">'+
        (R.fijada?'fijada':(R.exento?'organizas':(R.cubierta?'cubierta':'te falta')))+'</span></div></div>'+
      (R.fijada
        ? '<div class="avisolargo" style="border-color:rgba(62,180,137,.4);background:rgba(62,180,137,.08);color:#a9dcc6">'+
          '<b style="color:var(--ok)">📌 Reunión fijada · '+esc(R.fijada)+'</b><br>La disponibilidad está cerrada; el hueco elegido va en verde en el mapa.</div>'
        : (R.exento
            ? ''                                   /* organizas: no se te pide cubrir */
            : '<button class="btn pri full" data-p id="btnCubrir" style="margin-top:10px">'+
              (R.cubierta?'Editar mi disponibilidad':'Cubrir mi disponibilidad')+'</button>'))+
    /* si ya está fijada, el aviso de organizador sobra y quedaba colgando debajo del cartel verde */
    ((R.exento && !R.fijada)?'<p class="rnota" style="margin:-4px 0 10px">La convocas tú: <b>organizas, no cubres</b>. No se te pide disponibilidad.</p>':'')+
      (esCoord()?'<div style="display:flex;gap:8px;margin-top:9px;flex-wrap:wrap">'+
        '<button class="btn mini" data-p id="btnFijar" style="flex:1">'+(R.fijada?'Cambiar fecha/hora':'📌 Fijar fecha')+'</button>'+
        (R.fijada?'<button class="btn mini" data-p id="btnDesfijar" style="flex:1;color:var(--warn);border-color:var(--warn)">Cancelar fijado</button>':'')+
        '<button class="btn mini" data-p id="btnOrden" style="flex:1">Orden del día</button>'+
      '</div>':'')+
    '</div>'+
    '<h2 class="sec">Cuándo puede el equipo<span class="ln"></span></h2>'+
    '<div class="tarj">'+
      (hib?'<div class="modos" id="calModo" style="margin-bottom:10px">'+
        '<button data-pond="0" class="'+(pondOn?'':'on')+'" data-p>Personas</button>'+
        '<button data-pond="1" class="'+(pondOn?'on':'')+'" data-p>Ponderada</button></div>':'')+
      '<p class="rnota" style="margin:0 0 10px"><b>'+R.nInv+'</b> convocados · mejor hueco '+
      (vent.v>0
        ? '<b style="color:var(--red2)">'+esc(_diaTxtM_(R.dias[vent.d]))+' '+_hFranja_(R,vent.f0)+
          (vent.f1>vent.f0?('–'+_hFinFranja_(R,vent.f1)):'')+'</b> — '+vent.v+
          (vent.exacta ? (vent.v===1?' puede la reunión entera.':' pueden la reunión entera.')
                       : (pondOn?' puntos.':' pueden.'))
        : '<b>todavía no ha respondido nadie</b>.')+'</p>'+
      g+
      '<div class="leyh" style="margin-top:11px"><span>'+
        (pondOn?'el número son PUNTOS: presencial+telemático 2 · solo telemático 1'
               :'el número es cuánta gente puede')+'</span>'+
        '<span><i style="background:repeating-linear-gradient(45deg,rgba(255,255,255,.14) 0 3px,transparent 3px 6px);border:1px solid var(--line)"></i>fuera del horario de ese día</span></div>'+
    '</div>'+
    (_puedeBorrarReuM_(R)?'<button class="btn full" data-p id="btnBorrar" style="margin-top:6px;color:var(--red2);border-color:var(--red)">Eliminar reunión</button>':'');
}

/* ── CUBRIR DISPONIBILIDAD — pintar a dedo/arrastre, ciclo según modalidad ─
   telemática 0↔1 · presencial 0↔2 · híbrida 0→1→2→0 (decisión cerrada). ── */
function cubrirModal(){
  var R=REUNION, nF=R.franjas.length, nD=R.dias.length;
  var modo=R.modalidad;
  var _slot=+R.slot || (R.franjas[0] && +R.franjas[0].dur) || 60;
  var _minS=_slotsMin_(R.duracion, _slot);
  var instr = modo==='presencial' ? 'toca o arrastra · marca tu disponibilidad presencial'
            : modo==='telematica' ? 'toca o arrastra · marca tu disponibilidad telemática'
            : 'toca o arrastra · 1× telemático · 2× presencial + telemático · 3× quitar';
  var ley = modo==='presencial' ? '<span><i style="background:var(--red)"></i>presencial</span>'
          : modo==='telematica' ? '<span><i style="background:var(--tel)"></i>telemática</span>'
          : '<span><i style="background:var(--red)"></i>presencial + telemático</span><span><i style="background:var(--tel)"></i>solo telemático</span>';
  /* Precarga de lo ya enviado: sin esto, «Editar mi disponibilidad» abria la rejilla
     en blanco y guardar equivalia a borrar lo que tenias puesto.
     `resp[nombre]` esta alineado a la POSICION del bloque, no al indice de franja. */
  if(!ST.sel || ST._selDe!==R.id){
    ST.sel=new Map(); ST._selDe=R.id;
    var _mio=(R.resp||{})[(YO&&YO.nombre)||'']||[];
    (R.bloques||[]).forEach(function(b,i){
      var v=+_mio[i]||0; if(v>0) ST.sel.set(b[0]+'_'+b[1], v);
    });
  }
  var hd='<div class="rc"></div>';
  R.franjas.forEach(function(f,ix){
    hd+='<div class="rc rh"><span>'+f.ini.replace(':00','')+'</span>'+
      (ix===nF-1?'<span class="fin">23</span>':'')+'</div>';
  });
  /* Las casillas NO OFERTADAS ya no se pueden pintar. Antes se pintaban igual, se veian
     marcadas, y al guardar se caian sin decir nada: `vals` se arma recorriendo `bloques`,
     asi que lo que no era bloque no existia. */
  var _ofer={}; (R.bloques||[]).forEach(function(b){ _ofer[b[0]+'_'+b[1]]=1; });
  var rows='';
  R.dias.forEach(function(d,di){
    rows+='<div class="rc rd">'+d+'</div>';
    for(var f=0;f<nF;f++){
      var k=di+'_'+f;
      if(!_ofer[k]){ rows+='<div class="ecel off" title="fuera del horario de ese día"></div>'; continue; }
      var v=ST.sel.get(k)||0;
      rows+='<div class="ecel '+(v===2?'on2':v===1?'on1':'')+'" data-k="'+k+'"></div>';
    }
  });
  abrirModal('<div class="mtit">Marca tu disponibilidad</div>'+
    '<div class="msub">'+esc(YO.pila)+' · '+instr+'</div>'+
    (_minS>1?'<p class="rnota" style="margin:-4px 0 10px">La reunión dura <b>'+_durTxt_(_minS*_slot)+
      '</b>, así que cada toque marca <b>'+_minS+' casillas seguidas</b> a partir de ahí. '+
      'Puedes estirar más arrastrando; lo que quede más corto se quita solo.</p>':'')+
    '<div class="rejw"><div class="rej" id="rejC" style="grid-template-columns:auto repeat('+nF+',minmax(30px,1fr))">'+hd+rows+'</div></div>'+
    '<div class="leyh" style="margin-top:10px">'+ley+'</div>'+
    '<div class="sc" id="ecount" style="margin:12px 0 10px"></div>'+
    '<button class="btn pri full" data-p id="btnGuardarDisp">Guardar disponibilidad</button>');
  engancharRejilla();
}

function engancharRejilla(){
  var grid=$('#rejC'); if(!grid) return;
  var R=REUNION, modo=R.modalidad, nF=(R.franjas||[]).length;
  var slot=+R.slot || (R.franjas[0] && +R.franjas[0].dur) || 60;
  var minS=_slotsMin_(R.duracion, slot);          // casillas seguidas que exige la reunión
  var ofer={}; (R.bloques||[]).forEach(function(b){ ofer[b[0]+'_'+b[1]]=1; });
  var hay=function(di,f){ return f>=0 && f<nF && !!ofer[di+'_'+f]; };
  var sig=function(cur){ return modo==='presencial'?(cur===2?0:2) : modo==='telematica'?(cur===1?0:1) : ((cur||0)+1)%3; };
  /* La unidad es el HUECO, no la casilla: una racha mas corta que la reunion no sirve
     para nada -no puedes ir- y ademas el pipeline de sanciones te daria por «cubierto». */
  var rachas=function(di){
    var out=[], f=0;
    while(f<nF){
      if(!ST.sel.get(di+'_'+f)){ f++; continue; }
      var a=f; while(f<nF && ST.sel.get(di+'_'+f)) f++;
      out.push([a,f-1]);
    }
    return out;
  };
  /* Lo que queda corto se QUITA, nunca se completa: completarlo seria inventarle
     disponibilidad a una persona, y de aqui salen sanciones reales. */
  var sanear=function(){
    var n=0;
    R.dias.forEach(function(_,di){
      rachas(di).forEach(function(r){
        if(r[1]-r[0]+1>=minS) return;
        for(var i=r[0];i<=r[1];i++) ST.sel.delete(di+'_'+i);
        n++;
      });
    });
    return n;
  };
  var cont=function(){
    var e=$('#ecount'); if(!e) return;
    var hue=0, cas=0, p=0, t=0;
    R.dias.forEach(function(_,di){ rachas(di).forEach(function(r){ hue++; cas+=r[1]-r[0]+1; }); });
    ST.sel.forEach(function(v){ v===2?p++:t++; });
    e.innerHTML = !hue
      ? 'Sin marcar todavía'+(minS>1?(' · cada toque marca '+_durTxt_(minS*slot)):'')
      : '<b>'+hue+'</b> hueco'+(hue===1?'':'s')+' · '+_durTxt_(cas*slot)+' en total'+
        (modo==='hibrida' ? (' · '+p+' presencial'+(p===1?'':'es')+' · '+t+' telemática'+(t===1?'':'s')) : '');
  };
  cont();
  var ancla=null, ultimo=null, target=1, borra=false;
  var kk=function(k){ return k.split('_').map(Number); };
  var cabe=function(di,f){ for(var i=0;i<minS;i++) if(!hay(di,f+i)) return false; return true; };
  /* EL MINIMO VA A LA DERECHA DEL TOQUE (decision de Daniel): el hueco nace donde pones
     el dedo y se lleva lo que dura la reunion. Estirar a partir de ahi es libre. */
  var rango=function(){
    var A=kk(ancla), B=kk(ultimo||ancla);
    var f0=Math.min(A[1],B[1]);
    var f1=borra ? Math.max(A[1],B[1]) : Math.max(A[1]+minS-1, B[1]);
    return { d0:Math.min(A[0],B[0]), d1:Math.max(A[0],B[0]), f0:f0, f1:Math.min(nF-1,f1) };
  };
  var barrer=function(fn){
    var r=rango();
    for(var d=r.d0; d<=r.d1; d++) for(var f=r.f0; f<=r.f1; f++) if(hay(d,f)) fn(d+'_'+f);
  };
  var limpia=function(){ $$('.ecel.prev',grid).forEach(function(c){ c.classList.remove('prev'); }); };
  var prev=function(){ limpia(); barrer(function(k){
    var c=grid.querySelector('[data-k="'+k+'"]'); if(c) c.classList.add('prev'); }); };
  /* Se repinta la rejilla ENTERA porque `sanear` puede tocar casillas fuera del arrastre. */
  var repinta=function(){
    $$('.ecel[data-k]',grid).forEach(function(c){
      var v=ST.sel.get(c.dataset.k)||0;
      c.classList.remove('on1','on2');
      if(v===1) c.classList.add('on1'); else if(v===2) c.classList.add('on2');
    });
  };
  var commit=function(){
    barrer(function(k){ if(target===0) ST.sel.delete(k); else ST.sel.set(k,target); });
    var q=sanear();
    limpia(); repinta(); cont();
    if(q) tost(q===1 ? ('Un hueco se quedó por debajo de '+_durTxt_(minS*slot)+' y se ha quitado.')
                    : ('Se han quitado '+q+' huecos que quedaban por debajo de '+_durTxt_(minS*slot)+'.'));
  };
  grid.addEventListener('pointerdown',function(ev){
    var el=ev.target.closest('.ecel'); if(!el || !el.dataset.k) return;   // no ofertada: no se toca
    ev.preventDefault();
    var A=kk(el.dataset.k);
    target=sig(ST.sel.get(el.dataset.k)||0); borra=(target===0);
    if(!borra && !cabe(A[0],A[1])){
      tost('Ahí no entra la reunión entera ('+_durTxt_(minS*slot)+'): el horario de ese día acaba antes.');
      return;
    }
    ancla=el.dataset.k; ultimo=ancla;
    try{ grid.setPointerCapture(ev.pointerId); }catch(e){}
    prev();
  });
  grid.addEventListener('pointermove',function(ev){
    if(!ancla) return;
    var el=document.elementFromPoint(ev.clientX,ev.clientY);
    if(el && el.classList.contains('ecel') && el.dataset.k){ ultimo=el.dataset.k; prev(); }
  });
  grid.addEventListener('pointerup',function(){ if(ancla){ commit(); ancla=null; ultimo=null; } });
  var g=$('#btnGuardarDisp');
  /* GUARDA EN EL SERVIDOR. Antes solo ponia una marca local y decia «guardada»: en el
     servidor no quedaba nada, y de ahi come el pipeline de sanciones. `valores` va
     alineado a la POSICION de cada bloque, que es como lo espera `responder`. */
  if(g) g.onclick=async function(){
    if(g.disabled) return;
    var R2=REUNION;
    var vals=(R2.bloques||[]).map(function(b){ return ST.sel.get(b[0]+'_'+b[1])||0; });
    if(typeof backendOK!=='undefined' && backendOK && SESION){
      g.disabled=true; var prev=g.textContent; g.textContent='Guardando…';
      try{
        await api.responder(R2.id, (YO&&YO.nombre)||'', vals);
        if(!R2.resp) R2.resp={};
        R2.resp[(YO&&YO.nombre)||'']=vals;
        var re=_normReuM_(R2); REUNION=re;                    // recalcula el mapa con lo tuyo dentro
        var ix=REUNIONES_M.findIndex(function(x){ return x.id===re.id; });
        if(ix>=0) REUNIONES_M[ix]=re;
        ST._selDe=null;
        cerrarModal(); tost('Disponibilidad guardada.'); pintar();
      }catch(e){
        g.disabled=false; g.textContent=prev;
        tost('No se pudo guardar: '+((e&&e.message)||e)+'. Vuelve a intentarlo.');
      }
      return;
    }
    tost('Sin conexión no se puede guardar la disponibilidad.');
  };
}

/* nombres largos para la vista de 'horario distinto por día' (ahí caben y se leen mejor) */
function _diasLargos_(modo,d0,d1,fecha,nd){
  var out=[], a, i;
  if(modo==='rango'){ if(!d0||!d1) return out; a=new Date(d0+'T00:00:00'); var b=new Date(d1+'T00:00:00');
    for(i=0;i<62&&a<=b;i++){ out.push(_DL_[a.getDay()]+' '+a.getDate()); a.setDate(a.getDate()+1); } }
  else { a=new Date((fecha||'')+'T00:00:00'); for(i=0;i<nd;i++){ var d=new Date(a); d.setDate(a.getDate()+i); out.push(_DL_[d.getDay()]+' '+d.getDate()); } }
  return out;
}

/* ⛔ `_genUnion_` VIVE EN `comun.js` (07/08), que cargan las dos caras. Estaba
   aqui y en la otra cara con el MISMO cuerpo. No se declara aqui: dos globales con
   el mismo nombre y el navegador se queda con la ultima que cargue, sin dar error. */


/* Hora de inicio y de fin de una franja, para escribir un hueco como «18:00–19:00». */
function _hFranja_(R,fi){ var f=(R.franjas||[])[fi]; return f ? _hmMin_(_minHM_(f)) : '—'; }

function _hFinFranja_(R,fi){ var f=(R.franjas||[])[fi];
  return f ? _hmMin_(_minHM_(f) + (+f.dur>0 ? +f.dur : 60)) : '—'; }

/* convocados por defecto según el tipo (como app.html): general=todo el equipo, subsistema=tu unidad,
   junta=coordinadores+PD, consejo=por configurar, mixta/trabajo=a mano. */
function _presetInvitados_(tipo){
  var yo=(YO&&YO.nombre)||'', ms=_activos_(), out=[];
  ms.forEach(function(m){
    if(m.nombre===yo) return;
    var meto = tipo==='general' ? true
             : tipo==='subsistema' ? (m.unidad===(YO&&YO.unidad))
             : tipo==='junta' ? (m.cargo==='Coordinador'||m.cargo==='Project Director')
             : false;                              // consejo/mixta/trabajo: a mano
    if(meto) out.push(m.nombre);
  });
  return out;
}

function crearModal(){
  var coord=esCoord();
  var tipos=[['general','General · todo el equipo',true],['junta','Junta Directiva · coordinación',true],
    ['consejo','Consejo · por configurar',true],['subsistema','Subsistema · tu unidad',true],
    ['mixta','Mixta · varios subsistemas',true],['trabajo','Reunión de trabajo · invitas tú',false]];
  var op=tipos.filter(function(t){return coord||!t[2];})
    .map(function(t){return '<option value="'+t[0]+'">'+t[1]+'</option>';}).join('');
  var hoyISO=_dmyAISO_(HOY), mas=function(iso,n){ var d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n);
    return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); };
  var subs=(DATA.subsistemas||[]).map(function(sb){ return '<button type="button" class="cmixb" data-u="'+esc(sb.u||sb)+'" data-p>'+esc(sb.u||sb)+'</button>'; }).join('');
  var plant=PLANTILLAS_M.length ? '<label class="campo"><span class="sc">Copiar distribución de</span><select id="ceCopiar">'+
      '<option value="">— empezar en blanco —</option>'+PLANTILLAS_M.map(function(p,i){ return '<option value="'+i+'">'+esc(p.titulo)+'</option>'; }).join('')+'</select></label>' : '';
  abrirModal('<div class="mtit">Nueva '+(coord?'reunión':'reunión de trabajo')+'</div>'+
    '<label class="campo"><span class="sc">Tipo</span><select id="ceTipo">'+op+'</select></label>'+
    (coord?'':'<p class="rnota" style="margin:-4px 0 10px">Como miembro convocas <b>reuniones de trabajo</b> e invitas a quien quieras. Las generales, de junta o de subsistema las convoca coordinación.</p>')+
    '<label class="campo"><span class="sc">Modalidad</span><select id="ceMod">'+
      '<option value="hibrida">Híbrida (presencial + telemática)</option>'+
      '<option value="presencial">Presencial</option>'+
      '<option value="telematica">Telemática</option></select></label>'+
    '<div id="ceMixW" style="display:none"><span class="sc" style="display:block;margin-bottom:5px">Subsistemas que participan</span>'+
      '<div class="cmix" id="ceMix">'+subs+'</div></div>'+
    '<div id="ceInvW"><label class="campo"><span class="sc">Invitar</span><input id="ceInv" placeholder="escribe un nombre…" autocomplete="off"></label>'+
      '<div class="csug" id="ceSug" style="display:none"></div><div class="cchips" id="ceChips"></div></div>'+
    plant+
    '<label class="campo"><span class="sc">Título</span><input id="ceTit" placeholder="Reunión sin título"></label>'+
    '<label class="campo"><span class="sc">Fechas por</span><select id="ceModo"><option value="rango">Desde / hasta</option><option value="dur">Desde + nº de días</option></select></label>'+
    '<div class="dosc" id="ceRango"><label class="campo"><span class="sc">Desde</span><input class="mono" id="ceD0" type="date" value="'+hoyISO+'"></label>'+
      '<label class="campo"><span class="sc">Hasta</span><input class="mono" id="ceD1" type="date" value="'+mas(hoyISO,6)+'"></label></div>'+
    '<div class="dosc" id="ceDurW" style="display:none"><label class="campo"><span class="sc">Desde</span><input class="mono" id="ceFecha" type="date" value="'+hoyISO+'"></label>'+
      '<label class="campo"><span class="sc">Días</span><input class="mono" id="ceND" type="number" value="7" min="1" max="60"></label></div>'+
    '<div class="dosc"><label class="campo"><span class="sc">De</span><select id="ceH0">'+optHoras('16:00')+'</select></label>'+
      '<label class="campo"><span class="sc">A</span><select id="ceH1">'+optHoras('23:00')+'</select></label></div>'+
    '<label class="campo" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="cePerdia" style="width:auto"><span class="sc" style="margin:0">Horario distinto por día</span></label>'+
    '<div class="cdias" id="ceDias" style="display:none"></div>'+
    /* Dos preguntas, no dos rarezas: la casilla que se pinta, y lo que dura la reunión.
       La «cadencia solapada» se retiró: era una forma retorcida de decir «slots de 15
       min» y dejaba el mapa ilegible. */
    '<div class="dosc">'+
      '<label class="campo"><span class="sc">Tamaño de slot</span><select id="ceSlot">'+
        '<option value="15">15 min</option><option value="30" selected>30 min</option>'+
        '<option value="60">1 h</option></select></label>'+
      '<label class="campo"><span class="sc">Dura la reunión</span><select id="ceDura">'+
        '<option value="30">30 min</option><option value="60" selected>1 h</option>'+
        '<option value="90">1 h 30 min</option><option value="120">2 h</option>'+
        '<option value="180">3 h</option></select></label></div>'+
    '<p class="rnota" id="ceSlotHint"></p>'+
    '<div class="dosc"><label class="campo"><span class="sc">Límite para responder</span><input class="mono" id="ceLim" type="date" value="'+mas(hoyISO,5)+'"></label>'+
      '<label class="campo"><span class="sc">Hora (opcional)</span><input class="mono" id="ceLimH" type="time"></label></div>'+
    '<label class="campo"><span class="sc">Orden del día (enlace a Drive, opcional)</span>'+
      '<input id="ceOrden" placeholder="https://drive.google.com/…"></label>'+
    '<span class="sc" style="display:block;margin-bottom:6px">Visión de disponibilidad</span>'+
    '<div class="modos" id="ceVision">'+
      '<button data-v="publica" data-p>Pública</button>'+
      '<button data-v="anonima" class="on" data-p>Anónima</button>'+
      '<button data-v="oculta" data-p>Oculta</button></div>'+
    '<p class="rnota" id="ceHint">El equipo ve el mapa de calor con los totales, sin nombres.</p>'+
    '<p class="rnota" id="cePrev" style="color:var(--ink2)"></p>'+
    '<button class="btn pri full" style="margin-top:12px" data-p id="btnCrearOK">Crear encuesta</button>');

  var val=function(id){ var e=$('#'+id); return e?e.value:''; };
  var per=function(){ var e=$('#cePerdia'); return !!(e&&e.checked); };
  var hNum=_horasHM_;                       // antes: parser propio; ademas fallaba con 'H:MM'
  var dias=function(){ return val('ceModo')==='rango' ? _diasEntre_(val('ceD0'),val('ceD1'))
    : _diasDesde_(val('ceFecha')||_dmyAISO_(HOY), Math.max(1,+val('ceND')||1)); };
  var rangos=function(){ var ds=dias();
    if(!per()) return ds.map(function(){ return [hNum(val('ceH0')), hNum(val('ceH1'))]; });
    var rows=$$('#ceDias .drow');
    return ds.map(function(_,i){ var r=rows[i]; if(!r||r.classList.contains('off')) return [0,0];
      return [hNum(r.querySelector('.dr0').value), hNum(r.querySelector('.dr1').value)]; }); };
  var INV=new Set();
  var invRender=function(){ var c=$('#ceChips'); if(!c) return;
    c.innerHTML=Array.from(INV).map(function(n){
      var m=(DATA.miembros||[]).filter(function(x){ return x.nombre===n; })[0];
      return '<span class="cchip"><b>'+esc((m&&m.pila)||n)+'</b><button data-n="'+esc(n)+'" data-p>×</button></span>'; }).join('');
    $$('#ceChips button').forEach(function(b){ b.onclick=function(){ INV.delete(b.dataset.n); invRender(); upd(); }; }); };
  var sugRender=function(q){ var sg=$('#ceSug'); if(!sg) return; q=_sinTildes_((q||'').trim());
    if(!q){ sg.style.display='none'; return; }
    var hits=_activos_().filter(function(m){ return m.nombre!==(YO&&YO.nombre) && !INV.has(m.nombre) && _sinTildes_(m.nombre).indexOf(q)>=0; }).slice(0,6);
    if(!hits.length){ sg.style.display='none'; return; }
    sg.innerHTML=hits.map(function(m){ return '<div data-n="'+esc(m.nombre)+'" data-p>'+esc(m.nombre)+' <small>'+esc(m.cargo||m.unidad||'')+'</small></div>'; }).join('');
    sg.style.display='';
    $$('#ceSug div').forEach(function(d){ d.onclick=function(){ INV.add(d.dataset.n); $('#ceInv').value=''; sg.style.display='none'; invRender(); upd(); }; }); };
  var renderDias=function(){ var ds=_diasLargos_(val('ceModo'), val('ceD0'), val('ceD1'), val('ceFecha')||_dmyAISO_(HOY), Math.max(1,+val('ceND')||1));
    if(!ds.length) ds=dias();
    var prev=$$('#ceDias .drow').map(function(r){
      return {off:r.classList.contains('off'), a:r.querySelector('.dr0').value, b:r.querySelector('.dr1').value}; });
    $('#ceDias').innerHTML=ds.map(function(d,i){
      return '<div class="drow" data-d="'+i+'"><button type="button" class="dtog on" data-p aria-label="activar o desactivar el día"></button>'+
        '<span>'+esc(d)+'</span><select class="dr0">'+optHoras(val('ceH0'))+'</select><select class="dr1">'+optHoras(val('ceH1'))+'</select></div>'; }).join('');
    $$('#ceDias .drow').forEach(function(r,i){ var p=prev[i];
      if(p){ if(p.off) r.classList.add('off'); r.querySelector('.dr0').value=p.a; r.querySelector('.dr1').value=p.b; }
      var apl=function(){ var off=r.classList.contains('off');
        r.querySelectorAll('select').forEach(function(sl){ sl.disabled=off; });
        r.querySelector('.dtog').classList.toggle('on',!off); };
      apl();
      r.querySelector('.dtog').onclick=function(){ r.classList.toggle('off'); apl(); upd(); };
      r.querySelector('.dr0').onchange=upd; r.querySelector('.dr1').onchange=upd; }); };
  function upd(){
    var rg=val('ceModo')==='rango';
    if($('#ceRango')) $('#ceRango').style.display=rg?'':'none';
    if($('#ceDurW'))  $('#ceDurW').style.display=rg?'none':'';
    if($('#ceDias'))  $('#ceDias').style.display=per()?'':'none';
    var sl=+val('ceSlot')||30, du=+val('ceDura')||60;
    var u=_genUnion_(rangos(), sl);
    var nb=u.perDia.reduce(function(a,x){ return a+x.length; },0), nd=dias().length;
    /* Que hay que juntar para que valga, dicho antes de convocar y con la cuenta hecha. */
    var nS=_slotsMin_(du,sl), h=$('#ceSlotHint');
    if(h) h.innerHTML='Se pintan casillas de <b>'+_durTxt_(sl)+'</b> y hay que juntar '+
      '<b>'+nS+' seguida'+(nS===1?'':'s')+'</b> ('+_durTxt_(nS*sl)+') para que cuente.'+
      (du%sl ? ' La duración no es múltiplo del slot, así que se redondea hacia arriba.' : '');
    var p=$('#cePrev'); if(p) p.innerHTML=(u.F.length&&nb)
      ? '<b>'+u.F.length+' casilla'+(u.F.length===1?'':'s')+'</b> de '+_durTxt_(sl)+' · <b>'+nb+' bloques</b> en '+nd+' día'+(nd===1?'':'s')+
        (per()?' (horario por día)':'')+' · <b>'+INV.size+'</b> convocados.'
      : 'Revisa fechas u horario: no sale ninguna casilla.';
  }
  var tipoUpd=function(){ var t=val('ceTipo');
    if($('#ceMixW')) $('#ceMixW').style.display=(t==='mixta')?'':'none';
    if($('#ceInvW')) $('#ceInvW').style.display=(t==='general')?'none':'';
    $$('#ceMix .cmixb').forEach(function(b){ b.classList.remove('on'); });
    INV=new Set(_presetInvitados_(t)); invRender(); upd(); };
  $('#ceTipo').onchange=tipoUpd;
  $$('#ceMix .cmixb').forEach(function(b){ b.onclick=function(){ b.classList.toggle('on');
    var u=b.dataset.u, on=b.classList.contains('on');
    _activos_().forEach(function(m){ if(m.unidad===u && m.nombre!==(YO&&YO.nombre)){ if(on) INV.add(m.nombre); else INV.delete(m.nombre); } });
    invRender(); upd(); }; });
  var inp=$('#ceInv');
  if(inp){ inp.oninput=function(){ sugRender(inp.value); };
    inp.onblur=function(){ setTimeout(function(){ if($('#ceSug')) $('#ceSug').style.display='none'; },180); }; }
  ['ceModo','ceH0','ceH1','ceSlot','ceDura','ceND','ceD0','ceD1','ceLim','ceLimH'].forEach(function(id){
    var e=$('#'+id); if(e) e.onchange=function(){ if(per()) renderDias(); upd(); }; });
  $('#cePerdia').onchange=function(){ if(per()) renderDias(); upd(); };
  var cop=$('#ceCopiar');
  if(cop) cop.onchange=function(){ var v=cop.value; if(v==='') return; var c=PLANTILLAS_M[+v]; if(!c) return;
    if(c.titulo && $('#ceTit')) $('#ceTit').value=c.titulo;
    ['ceModo','ceH0','ceH1','ceSlot','ceDura','ceND'].forEach(function(id){ if(c[id]!=null && $('#'+id)) $('#'+id).value=c[id]; });
    if(c.modalidad && $('#ceMod')) $('#ceMod').value=c.modalidad;
    $('#cePerdia').checked=!!c.perdia; if(per()) renderDias(); upd(); };
  var hints={publica:'Cualquiera puede tocar un hueco y ver quién puede en esa franja.',
    anonima:'El equipo ve el mapa de calor con los totales, sin nombres.',
    oculta:'El equipo no ve el mapa; solo tú, para decidir.'};
  var vision='anonima';
  $$('#ceVision button').forEach(function(b){
    b.onclick=function(){ $$('#ceVision button').forEach(function(x){x.classList.remove('on');});
      b.classList.add('on'); vision=b.dataset.v; $('#ceHint').textContent=hints[vision]; }; });
  tipoUpd();
  /* crear: construye la reunión y la PERSISTE (api.crearReunion). Sin backend, queda local. */
  $('#btnCrearOK').onclick=async function(){
    var bt=$('#btnCrearOK'); if(bt.disabled) return;
    var ds=dias(); if(!ds.length){ tost('Revisa las fechas: no hay días.'); return; }
    var _sl=+val('ceSlot')||30, _du=+val('ceDura')||60;
    var u=_genUnion_(rangos(), _sl), bloques=[];
    u.perDia.forEach(function(idxs,d){ idxs.forEach(function(fi){ bloques.push([d,fi]); }); });
    if(!u.F.length || !bloques.length){ tost('Con ese horario no sale ninguna casilla.'); return; }
    /* El aviso de «los días no empiezan a la misma hora, el mapa saldrá a huecos» se
       retiró: con la rejilla única ya no puede pasar. Lo que sí hay que decir es si
       algún día se queda demasiado corto para que quepa la reunión entera. */
    var _nS=_slotsMin_(_du,_sl);
    var _cortos=u.perDia.filter(function(idxs,i){ return (rangos()[i]||[0,0])[1]>(rangos()[i]||[0,0])[0] && idxs.length<_nS; }).length;
    if(_cortos && !window.__avisoCorto__){
      window.__avisoCorto__=1;
      tost('Ojo: '+_cortos+' día'+(_cortos===1?'':'s')+' no da'+(_cortos===1?'':'n')+' para '+_durTxt_(_nS*_sl)+
        ' seguidos, así que ahí nadie podrá marcar. Pulsa otra vez para crearla igual.');
      bt.disabled=false; return;
    }
    var lim=val('ceLim') ? (val('ceLim')+(val('ceLimH')?' '+val('ceLimH'):'')) : null;
    var reu={ titulo:(val('ceTit')||'').trim()||'Reunión sin título', tipo:val('ceTipo')||'trabajo',
      modalidad:val('ceMod')||'hibrida', convocante:(YO&&YO.nombre)||'', invitados:Array.from(INV),
      dias:ds, franjas:u.F, bloques:bloques, total:bloques.length, limite:lim,
      slot:_sl, duracion:_nS*_sl,          // lo que hay que juntar seguido para que valga
      ordenDia:(val('ceOrden')||'').trim(), vision:vision, resp:{} };
    PLANTILLAS_M.unshift({ titulo:reu.titulo, ceModo:val('ceModo'), ceH0:val('ceH0'), ceH1:val('ceH1'),
      ceSlot:val('ceSlot'), ceDura:val('ceDura'), ceND:val('ceND'), modalidad:reu.modalidad, perdia:per() });
    if(PLANTILLAS_M.length>8) PLANTILLAS_M.length=8;
    bt.disabled=true; var prev=bt.textContent; bt.textContent='Creando…';
    if(typeof backendOK!=='undefined' && backendOK && SESION){
      try{ var d=await api.crearReunion(reu); if(d&&d.id) reu.id=d.id;
        cerrarModal();
        tost('Reunión convocada · '+reu.invitados.length+' convocados, '+bloques.length+' bloques.');
        /* Se RECARGA la lista del servidor. Antes se llamaba a `pintar()` sin haber metido
           la reunion nueva en `REUNIONES_M`: se repintaba lo mismo de antes y parecia que
           no se habia creado. Y se recarga en vez de fabricar una copia local, que es como
           se acaba enseñando algo que en la nube no esta. */
        CARGA.reuniones=false; pintar();            // «cargando», no «no tienes»
        await _cargarReunionesM_();
        var _nueva=(REUNIONES_M||[]).filter(function(x){ return x.id===reu.id; })[0];
        if(_nueva){ REUNION=_nueva; await _hidratarReuM_(_nueva); }
        ST.vista='reu'; pintar();
      }catch(e){ bt.disabled=false; bt.textContent=prev; tostErr('No se pudo convocar: ', e); }
      return;
    }
    cerrarModal(); tost('Sin conexión: la reunión no se ha guardado.');
  };
}

function fijarModal(){
  var R=REUNION;
  abrirModal('<div class="mtit">Fijar la reunión</div>'+
    '<div class="msub">Elige el <b>día</b> y toca donde <b>empieza</b>: se marcan solas las '+
    ('<b>'+_slotsMin_(R.duracion,R.slot)+'</b> franjas que dura'+(R.duracion?' ('+_durTxt_(R.duracion)+')':'')+'. ')+
    'Puedes estirar hacia la derecha, pero no dejarlo en menos. El resultado sale en verde en el mapa.</div>'+
    '<label class="campo"><span class="sc">Día</span><select id="fjDia">'+
      R.dias.map(function(d,i){return '<option value="'+i+'">'+esc(_diaTxtM_(d))+'</option>';}).join('')+'</select></label>'+
    '<span class="sc" style="display:block;margin-bottom:7px">Franjas de ese día</span>'+
    /* La hora de fin sale de la FRANJA, no de «la hora siguiente»: con slots de 15 o 30
       min, dar por hecho que cada franja dura una hora es sencillamente falso. */
    '<div class="pasos" id="fjSlots">'+R.franjas.map(function(f,i){
      return '<button data-k="'+i+'" data-p>'+_hFranja_(R,i)+'–'+_hFinFranja_(R,i)+'</button>';
    }).join('')+'</div>'+
    '<div class="sc" id="fjSel" style="margin:11px 0 0;color:var(--ok);font-size:12px"></div>'+
    '<button class="btn pri full" style="margin-top:13px" data-p id="btnFijarOK">Confirmar</button>');
  var anchor=-1,last=-1;
  /* EL MINIMO ES EL MISMO QUE AL CUBRIR. Una reunion de 1 h 30 con slots de 30 min ocupa
     TRES franjas, se este cubriendo o fijando: aqui se dejo el «toca la primera y la ultima»
     a pelo y se podia fijar en menos tiempo del que dura la reunion. (Daniel: «puse de 18:30
     a 20:00 y se marca como si fuera de 19:00 a 20:00».) */
  var MIN=_slotsMin_(R.duracion, R.slot), NF=R.franjas.length;
  var pintaSlots=function(){
    var lo=anchor<0?-1:Math.min(anchor,last), hi=anchor<0?-1:Math.max(anchor,last);
    $$('#fjSlots button').forEach(function(b,k){
      var on=(k>=lo&&k<=hi);
      b.style.background=on?'rgba(62,180,137,.16)':''; b.style.borderColor=on?'var(--ok)':'';
      b.style.color=on?'var(--ok)':''; b.style.fontWeight=on?'700':'';
    });
    var s=$('#fjSel');
    if(s) s.textContent = lo<0 ? '' : ('Elegido: '+_hFranja_(REUNION,lo)+'–'+_hFinFranja_(REUNION,hi));
  };
  $$('#fjSlots button').forEach(function(b,k){
    /* Si desde aqui no caben las franjas que dura, no se puede empezar aqui. Se apaga en vez
       de dejar tocar y corregir despues: lo mismo que hace la rejilla de cubrir. */
    if(k+MIN>NF){ b.disabled=true; b.style.opacity='.35'; b.title='No caben '+MIN+' franjas seguidas desde aquí'; }
    b.onclick=function(){
      if(b.disabled) return;
      if(anchor<0 || anchor!==last){
        anchor=k; last=Math.min(NF-1, k+MIN-1);      // un toque = el minimo, hacia la derecha
      } else {
        /* estirar es libre, pero nunca por debajo del minimo */
        last = (k>=anchor) ? Math.max(k, anchor+MIN-1) : k;
        if(k<anchor){ anchor=k; last=Math.max(last, k+MIN-1); }
        if(last>NF-1) last=NF-1;
      }
      pintaSlots();
    };
  });
  $('#btnFijarOK').onclick=async function(){
    var b=$('#btnFijarOK'); if(b.disabled) return;
    if(anchor<0){ tost('Toca dónde empieza la reunión.'); return; }
    if(Math.abs(last-anchor)+1 < MIN){ tost('La reunión dura '+MIN+' franjas: no se puede fijar en menos.'); return; }
    var R2=REUNION, di=+$('#fjDia').value;
    var lo=Math.min(anchor,last), hi=Math.max(anchor,last);
    var etiqueta=_diaTxtM_(R2.dias[di])+' · '+_hFranja_(R2,lo)+'–'+_hFinFranja_(R2,hi);
    /* Los BLOQUES son lo que el mapa pinta en verde. Sin ellos solo quedaba el borde de
       «mejor franja», que significa otra cosa. */
    var bloques=[]; for(var f=lo; f<=hi; f++) bloques.push([di,f]);
    if(typeof backendOK==='undefined' || !backendOK || !SESION){
      tost('Sin conexión no se puede fijar: no llegaría a nadie más.'); return; }
    b.disabled=true; var prev=b.textContent; b.textContent='Fijando…';
    try{
      await api.fijar(R2.id, {label:etiqueta, bloques:bloques, franjas:[lo,hi]});
      R2.fijada=etiqueta; R2.fijadaBl=bloques;
      cerrarModal();
      tost('Reunión fijada: '+etiqueta+'. La disponibilidad queda cerrada.');
      pintar();
    }catch(e){ b.disabled=false; b.textContent=prev;
      tostErr('No se pudo fijar: ', e); }
  };
}

