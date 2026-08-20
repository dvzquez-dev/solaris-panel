/* ═══ TURNOS · cara escritorio ═══════════════════════════════════════════════════════════
   3 funciones sacadas de `escritorio.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* ⛔ UNA SOLA PUERTA para desasignar. Se necesita en DOS sitios — al desmarcar el chip
   de una persona y al pulsar su «quita»— y con tres cargos son tres lineas cada vez.
   Dos copias de esto acaban siendo dos reglas distintas en cuanto alguien añada un
   cuarto cargo: una lo limpiaria y la otra no, y quedaria un cargo asignado a alguien
   que ya no esta en el turno. */
function _quitarDeCargos_(n){
  var k; for(k in TUR_CARGOS){ if(TUR_CARGOS[k] === n) TUR_CARGOS[k] = null; }
}

/* ⛔ EL BOTON SE ACTUALIZA AL PINTAR, no al pulsar. Daniel: «el boton de convocar no
   vale». Vive fuera del contenedor del reparto -lo pinta `convocarPanel()` una sola
   vez-, asi que se busca en el documento en vez de reconstruirlo.
   ⚠️ Si no esta en pantalla no pasa nada: esta funcion tambien corre en pantallas donde
   no hay formulario de convocar. */
function _pintarBotonConvocar_(){
  var b = document.querySelector('[data-convocar]');
  if(!b) return '';
  /* ⛔ Y LOS COCHES TAMBIEN: `_pegasDelCoche_` llevaba desde el 11/08 escrita, con banco y
     sin llamador, asi que se podia convocar con un «Coche 1» a medias. */
  var motivo = (typeof _porQueNoSeConvoca_==='function')
    ? _porQueNoSeConvoca_(TUR_CARGOS, Object.keys(TUR_SEL).length, TUR_COCHES) : '';
  b.disabled = !!motivo;
  b.textContent = motivo ? motivo : 'Convocar el turno';
  b.title = motivo || '';
  return motivo;
}

function pintarReparto(){
  var c=document.getElementById('tuLista'); if(!c) return;
  var nn=Object.keys(TUR_SEL);
  if(!nn.length){
    c.innerHTML='<p style="margin:0;font-size:12px;color:var(--ink3)">Nadie marcado todav\u00eda. '+
      'Pulsa arriba a qui\u00e9n convocas y aqu\u00ed le pones su papel.</p>';
    return;
  }
  c.innerHTML=nn.map(function(n){
    var e=TUR_SEL[n], m=_m(n);
    return '<div class="repf">'+
      '<b>'+esc((m&&m.pila)||n)+'</b>'+
      '<input data-rol="'+esc(n)+'" value="'+esc(e.rol||'')+'" placeholder="su papel (opcional)">'+
      /* ⛔ UN BOTON POR CARGO. Antes habia uno solo -«responsable»- y los otros dos se
         escribian a mano en el texto libre, donde nadie los podia exigir ni leer.
         ✅ Y una misma persona PUEDE llevar dos: si se prohibiera, un turno de tres
         personas no se podria convocar -hay tres cargos- y la pantalla se plantaria.
         Se avisa, no se impide. */
      CARGOS_TURNO.map(function(cg){
        return '<button type="button" class="mini'+(TUR_CARGOS[cg.k]===n?' on':'')+
          '" data-cargo="'+cg.k+'" data-quien="'+esc(n)+'" title="'+esc(cg.et)+
          '">'+esc(cg.corto)+'</button>'; }).join('')+
      '<button type="button" class="mini'+(e.coche?' on':'')+'" data-coche="'+esc(n)+'">coche</button>'+
      '<button type="button" class="mini x" data-quita="'+esc(n)+'">quitar</button>'+
    '</div>';
  }).join('');
  cablearReparto();
}

/* ⚠️ Se llama DESPUES de cablear, no antes: `cablearReparto()` corre justo detras de
   `pintarReparto()` en cada cambio, y asi el estado del boton se recalcula con el
   reparto ya puesto. */
function cablearReparto(){
  _pintarBotonConvocar_();
  $$('#tuLista [data-rol]').forEach(function(i){
    i.oninput=function(){ if(TUR_SEL[i.dataset.rol]) TUR_SEL[i.dataset.rol].rol=i.value; };
  });
  $$('#tuLista [data-cargo]').forEach(function(b){
    b.onclick=function(){
      var k=b.dataset.cargo, n=b.dataset.quien;
      /* ⚠️ Un cargo lo lleva UNA persona: asignarlo a otra se lo quita a la anterior
         sola. Volver a pulsar sobre quien ya lo tiene lo deja vacante. */
      TUR_CARGOS[k] = (TUR_CARGOS[k]===n ? null : n);
      pintarReparto();
    };
  });
  $$('#tuLista [data-coche]').forEach(function(b){
    b.onclick=function(){ var n=b.dataset.coche; TUR_SEL[n].coche=!TUR_SEL[n].coche; pintarReparto(); };
  });
  $$('#tuLista [data-quita]').forEach(function(b){
    b.onclick=function(){
      var n=b.dataset.quita; delete TUR_SEL[n]; _quitarDeCargos_(n);
      var chip=document.querySelector('#tuPool [data-tu="'+n.replace(/"/g,'&quot;')+'"]');
      if(chip) chip.classList.remove('on');
      pintarReparto();
    };
  });
}

/* ═══ EL MAPA DE DISPONIBILIDAD PARA TURNOS ═════════════════════════════════════════
   La mitad de ADMINISTRADOR: ver cuándo puede la gente y elegir el hueco. La de miembro
   —marcar— es del móvil.

   ⛔ ESPEJO DE `reglas/turnos.py:agregado`, no una versión libre. Mismo modelo de celda
   (ausente = no contestó · `{s:'no'}` = no puede · `{s:<sitio>|'ambos',c:bool}`) y **las
   tres cestas NO son excluyentes**: quien es del consejo y además lleva coche sale en las
   dos, porque esconder un coche detrás de un responsable deja turnos sin salir.
   ⚠️ Y como es un espejo, PUEDE DIVERGIR: se contrasta contra el Python en el navegador con
   las mismas fixtures que usa `probar_turnos.py`, y `probar_turnos.py` §14 vigila que este
   fichero no cablee lo que aquí se decide (cestas excluyentes, consejo copiado, fechas). */

function _dispClave_(dia, franja){ return dia+'|'+franja; }

/* La convocatoria que se está mirando. Sin filtrar por invitado: aquí manda quien convoca. */
function _dispViva_(){
  var L=(typeof CONVOCATORIAS!=='undefined'?CONVOCATORIAS:[]);
  return L.length ? L[0] : null;
}

/* ¿Puede esta respuesta, y en ese sitio? `''` = da igual el sitio. */
function _dispPuede_(v, sitio){
  if(!v || !v.s || v.s==='no') return false;
  if(!sitio) return true;
  return v.s===sitio || v.s==='ambos';
}

/* El agregado con su desglose, celda a celda. */
function _calorTurnos_(cv, sitio){
  var consejo={}; (cv.consejo||[]).forEach(function(n){ consejo[n]=1; });
  var out={};
  (cv.dias||[]).forEach(function(d){
    (cv.franjas||[]).forEach(function(fr){
      var k=_dispClave_(d,fr.k);
      /* ⛔ Las claves se llaman IGUAL que en `reglas/turnos.py:agregado`, no en camelCase.
         Esto es un espejo: el dia que el backend calcule el agregado y lo mande, la cara
         tiene que poder consumirlo sin traducir. Renombrar en la frontera es donde se
         pierde un campo sin que nadie de un error. */
      var c={n:0, hay_coche:false, responsables:[], coches:[], normales:[], no_pueden:[]};
      Object.keys(cv.resp||{}).sort().forEach(function(nom){
        var v=(cv.resp[nom]||{})[k];
        if(v && v.s==='no'){ c.no_pueden.push(nom); return; }
        if(!_dispPuede_(v,sitio)) return;
        c.n++;
        var esResp=!!consejo[nom], lleva=!!v.c;
        if(esResp) c.responsables.push(nom);
        if(lleva){ c.coches.push(nom); c.hay_coche=true; }
        if(!esResp && !lleva) c.normales.push(nom);
      });
      out[k]=c;
    });
  });
  return out;
}

/* Las celdas con más gente, de más a menos; a igualdad, ANTES es mejor (la clave es ISO). */
function _mejorTurno_(calor, minimo){
  var out=[];
  Object.keys(calor).forEach(function(k){ if(calor[k].n>=(minimo||1)) out.push(k); });
  out.sort(function(a,b){ return (calor[b].n-calor[a].n) || (a<b?-1:a>b?1:0); });
  return out;
}

/* Quién no ha contestado NADA. Es lo que el excel no podía decir. */
function _dispMudos_(cv){
  var out=[];
  (cv.invitados||[]).forEach(function(n){
    var r=cv.resp&&cv.resp[n];
    var vacio=true; if(r) for(var k in r){ if(Object.prototype.hasOwnProperty.call(r,k)) vacio=false; }
    if(vacio) out.push(n);
  });
  return out.sort();
}

function _dispPila_(nom){
  var m=(DATA.miembros||[]).filter(function(x){ return x.nombre===nom; })[0];
  return (m&&m.pila)||nom;
}

/* El desglose de una celda. ⛔ Los NOMBRES solo para quien convoca turnos (rango ≥ 1):
   §3.15 del plan — el consejo puede ser responsable pero NO ve el desglose. Liderar un
   turno y verlo todo son dos permisos distintos. */
function _dispDetalle_(cv, k, calor){
  var c=calor[k];
  if(!c) return '<div class="nadie">Pasa el ratón por una casilla para ver quién puede.</div>';
  var partes=String(k).split('|');
  var fr=(cv.franjas||[]).filter(function(f){ return f.k===partes[1]; })[0];
  var cab='<h5>'+esc(_isoADMY_(partes[0])||partes[0])+' · '+esc((fr&&fr.txt)||partes[1])+
    ' — <b style="color:var(--ink)">'+c.n+'</b> pueden'+(c.hay_coche?' · \uD83D\uDE97 hay coche':'')+'</h5>';
  if(rangoNom(ACTOR)<1){
    return cab+'<div class="nadie">El desglose con nombres es de quien convoca turnos.</div>';
  }
  var cesta=function(tit, lista, vacia){
    return '<div class="cesta"><b>'+tit+'</b> <span>'+
      (lista.length ? lista.map(_dispPila_).map(esc).join(', ')
                    : '<span class="nadie">'+vacia+'</span>')+'</span></div>';
  };
  return cab+
    cesta('Pueden ser responsables', c.responsables, 'nadie del consejo puede') +
    cesta('Con coche', c.coches, 'sin coche') +
    cesta('Resto', c.normales, '\u2014') +
    (c.no_pueden.length ? '<div class="cesta"><b>Han dicho que no</b> <span>'+
        c.no_pueden.map(_dispPila_).map(esc).join(', ')+'</span></div>' : '');
}


/* ── CONTESTAR TU DISPONIBILIDAD DE TURNOS, DESDE EL ESCRITORIO ───────────────────
   ⛔ EL HUECO QUE CIERRA: `api.guardarDisponibilidad` estaba declarada en `escritorio.html`
   y **no la llamaba nadie**. Esta cara SI lee la convocatoria y pinta el mapa agregado de
   arriba; lo unico que no podia era **contestarla**. Y quien abre el escritorio tambien hace
   turnos: para decir cuando puede tenia que sacar el movil, cada semana.
   ⚠️ MISMO CONTRATO QUE EL MOVIL, a proposito: clave `dia|franja` (`_convClave_` alli,
   `_dispClave_` aqui, identicas) y valor `{s:'no'}` o `{s:<sitio>|'ambos', c:<coche>}`. Los
   sitios NO se cablean: salen de `_convClases_(cv)`, que es la funcion que bajo a `comun.js`
   justo para que las dos caras no acaben con dos listas distintas.
   ⚠️ Y AQUI SE GUARDA CON BOTON, no a cada clic como en el movil. No es un descuido: alli
   el dedo pinta y suelta, aqui se arrastra el raton por veinte celdas -- guardar en cada una
   son veinte escrituras para una sola decision. A cambio hay que decir claramente que queda
   algo sin guardar, y por eso el boton lo dice. */
var MIT_PIN = null;        /* el pincel elegido; null = todavia no ha tocado nada */
var MIT_COCHE = false;
var MIT_CELDAS = null;     /* lo marcado sin guardar; null = no ha tocado nada */

/* La convocatoria que TE toca contestar: abierta y con tu nombre dentro. ⚠️ `_dispViva_` no
   vale aqui -- esa coge la primera y sin filtrar, porque el mapa de arriba es de quien
   convoca y ve la de todos. */
function _miTurnoCv_(){
  /* ⛔ LA SESION, NO `ACTOR`: «Actuas como» reescribe `ACTOR`, y este panel escribe.
     Con `ACTOR` se te ofrecia la convocatoria a la que esta invitada OTRA persona. */
  var yo = (typeof _actorSanc_==='function') ? _actorSanc_() : ((typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '');
  if(!yo) return null;
  var L = (typeof CONVOCATORIAS!=='undefined'?CONVOCATORIAS:[]);
  for(var i=0;i<L.length;i++){
    var cv=L[i];
    if(_convEstado_(cv)!=='abierta') continue;
    var inv=cv.invitados||[];
    if(!inv.length || inv.indexOf(yo)>=0) return cv;
  }
  return null;
}

function _misCeldas_(cv){
  if(MIT_CELDAS) return MIT_CELDAS;
  /* ⛔ LA FILA QUE SE LEE ES LA QUE SE VA A ESCRIBIR. Aqui `cv.resp` trae a las 32, asi
     que con `ACTOR` el panel pintaba la disponibilidad REAL de otra persona rotulada «Tu
     disponibilidad» -- y al guardar, `guardarDisponibilidad` no manda nombre: el backend
     resuelve por TOKEN y sustituia la TUYA por la de ese otro. */
  var yo = (typeof _actorSanc_==='function') ? _actorSanc_() : ((typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '');
  var r = (cv.resp && cv.resp[yo]) || {};
  var out = {}; for(var k in r) if(r.hasOwnProperty(k)) out[k]=r[k];
  return out;
}

/* Lo que pinta el pincel de ahora. Copiado del movil (`turnos.movil.js`): el «no puedo» va
   SIN `c`, porque un no-puedo con coche no significa nada y Python lo lee por `s`. */
function _mitQuiere_(){
  return MIT_PIN==='no' ? {s:'no'} : {s:MIT_PIN, c:!!MIT_COCHE};
}

/* Marcar una celda, o DESMARCARLA si ya llevaba justo lo mismo. ⚠️ Va aparte del
   cableado a proposito: es una DECISION, y metida dentro del `onclick` no habia forma
   de ejecutarla en el arnes -- su mutacion salia ciega. El movil hace lo mismo y por
   eso compara tambien el coche: cambiar solo el coche es un cambio, no un deshacer. */
function _mitToggle_(cv, mias, k, q){
  var v = mias[k];
  var igual = v && v.s===q.s && (q.s==='no' || !!v.c===!!q.c);
  /* ⛔ SE MARCA EL TURNO ENTERO, NO LA CASILLA — y esto es lo que la cabecera de arriba ya
     prometía («MISMO CONTRATO QUE EL MÓVIL, a propósito») sin cumplirlo. El móvil lo hace en
     `_convPintar_` con `_bloqueDesde_` y `_minTurno_`, que viven en `comun.js` porque las
     cargan las dos caras; aquí no las referenciaba nadie.
     ⚠️ La clave se parte y se arma con lo de ESTA cara (`String(k).split('|')` y
     `_dispClave_`): `_convClave_`/`_convDeClave_` son de `turnos.movil.js` y este bundle **no
     las tiene** — usarlas aquí sería un `ReferenceError` en la pantalla.
     ⛔ Y no es un detalle de comodidad: quien contesta desde el escritorio hacía clic, veía la
     celda pintada, pulsaba «Guardar mi disponibilidad»… y había declarado **una hora**.
     `reglas/turnos.MIN_HORAS_TURNO` es **4**, y su docstring dice lo que pasa entonces: *«no
     daría ningún error, saldría un turno corto en el reparto»*. Encima la propia pantalla le
     dice que *«no contestar es lo que hace que te pongan un turno cuando no puedes»* — marcó,
     no contó, y le cae el turno igual.
     ✅ NO-OP EXACTO donde hoy acierta: `_bloqueDesde_` devuelve `[k]` si el mínimo no es >1 o
     si la convocatoria tiene menos franjas que el mínimo. Con `min_h:1` marca una, que es lo
     correcto ahí. */
  var partes = String(k).split('|'), dia = partes[0];
  var bloque = _bloqueDesde_((cv&&cv.franjas)||[], partes[1], _minTurno_(cv));
  if(!bloque.length) bloque = [partes[1]];
  bloque.forEach(function(fk){
    var kk = _dispClave_(dia, fk);
    if(igual) delete mias[kk]; else mias[kk]=q;
  });
  return mias;
}

/* El rótulo del plazo, en TRES ramas. ⛔ Aquí había `Math.round(_convQuedan_(cv))` a secas, así
   que durante los últimos ~30 minutos la tarjeta rotulaba «te quedan **0 h** para contestar»
   con la rejilla VIVA y el botón de guardar activo. Eso se lee como plazo cerrado: se deja de
   contestar, y el turno lo reparte quien no sabe que podías — que es justo el fallo que toda
   esta pantalla existe para evitar. Y un plazo ya vencido decía **la misma frase**, o sea la
   misma frase para dos estados distintos.
   ✅ El móvil ya tenía las tres (`_convPieHTML_`, `turnos.movil.js`): esto trae ese criterio,
   no inventa otro.
   ⚠️ VA FUERA DE `_miTurnoPanel_` A PROPÓSITO, como `_mitToggle_`: metido dentro del panel no
   hay forma de ejecutarlo en el arnés y su mutación sale **ciega**. El instante entra por
   argumento para que el caso sea determinista.
   ⚠️ Y la rama del plazo vencido no es adorno aunque hoy `_miTurnoCv_` no deje llegar a ella:
   lo que se fija es el CONTRATO de la función, no lo que su único llamador usa hoy. */
function _mitPlazoTxt_(cv, ahora){
  var q=_convQuedan_(cv, ahora);
  return q<=0 ? 'plazo cerrado'
       : q<1  ? 'te quedan '+Math.round(q*60)+' min para contestar'
              : 'te quedan '+Math.round(q)+' h para contestar';
}
function _miTurnoPanel_(){
  var cv=_miTurnoCv_(); if(!cv) return '';
  var mias=_misCeldas_(cv), D=cv.dias||[], F=cv.franjas||[];
  var ET={cuvi:'CUVI', citi:'CITI', ambos:'Los dos', no:'No puedo'};
  var clases=_convClases_(cv);
  if(MIT_PIN===null) MIT_PIN=clases[0]||'no';
  var pin=clases.map(function(k){
    return '<button data-mtpin="'+k+'" class="'+(MIT_PIN===k?'on':'')+'">'+esc(ET[k]||k)+'</button>';
  }).join('');
  var cab='<div class="dmc dml"></div>'+D.map(function(d){
    var p=String(_diaCorto_(d)).split(' ');
    return '<div class="dmc">'+esc(p[0]||'')+'<br>'+esc(p[1]||String(d).slice(8,10))+'</div>';
  }).join('');
  var COL={cuvi:'rgba(228,30,37,.78)', citi:'rgba(63,158,214,.78)', ambos:'rgba(53,199,89,.78)'};
  var filas=F.map(function(fr){
    return '<div class="dmc dml">'+esc(fr.txt)+'</div>'+D.map(function(d){
      var k=_dispClave_(d,fr.k), v=mias[k];
      var st = (v && v.s && v.s!=='no') ? ('background:'+(COL[v.s]||'rgba(228,30,37,.78)')) : '';
      return '<div class="dcel'+((v&&v.s&&v.s!=='no')?'':' v0')+'" data-mtk="'+k+'" '+
        'style="cursor:pointer;'+st+'">'+
        ((v&&v.s==='no')?'\u2013':((v&&v.c)?'\uD83D\uDE97':''))+'</div>';
    }).join('');
  }).join('');
  var sucio=!!MIT_CELDAS;
  return pan('Tu disponibilidad',
    _mitPlazoTxt_(cv),
    '<div class="pb">'+
    '<p style="margin:0 0 10px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
      'Elige <b>d\u00f3nde puedes</b> y haz clic en los huecos. Lo que marques aqu\u00ed es lo que '+
      'cuenta para el reparto \u2014 y no contestar es lo que hace que te pongan un turno '+
      'cuando no puedes.</p>'+
    '<div class="dsit">'+pin+'</div>'+
    '<label class="campo" style="margin:9px 0;display:flex;gap:7px;align-items:center">'+
      '<input type="checkbox" data-mtcoche'+(MIT_COCHE?' checked':'')+'>'+
      '<span class="sc" style="margin:0">Puedo llevar coche en lo que marque</span></label>'+
    '<div class="dmapa" style="grid-template-columns:104px repeat('+D.length+',minmax(44px,1fr))">'+
      cab+filas+'</div>'+
    '<div style="margin-top:11px;display:flex;gap:9px;align-items:center">'+
      '<button class="btn pri" data-mtguardar'+(sucio?'':' disabled')+'>Guardar mi disponibilidad</button>'+
      '<small style="color:var(--ink2)">'+(sucio?'tienes cambios <b>sin guardar</b>':'sin cambios')+'</small>'+
    '</div></div>');
}

function _cablearMiTurno_(){
  $$('[data-mtpin]').forEach(function(b){
    b.onclick=function(){ MIT_PIN=b.dataset.mtpin; pintar(); };
  });
  $$('[data-mtcoche]').forEach(function(c){
    c.onchange=function(){ MIT_COCHE=!!c.checked; };
  });
  $$('[data-mtk]').forEach(function(c){
    c.onclick=function(){
      var cv=_miTurnoCv_(); if(!cv) return;
      MIT_CELDAS=_mitToggle_(cv, _misCeldas_(cv), c.dataset.mtk, _mitQuiere_());
      pintar();
    };
  });
  $$('[data-mtguardar]').forEach(function(b){
    b.onclick=async function(){
      if(b.disabled) return;
      /* ⛔ Y NO SE CONTESTA POR NADIE. */
      if(typeof _identidadPrestada_==='function' && _identidadPrestada_(
           (typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '')){
        tost('Est\u00e1s actuando como otra persona: tus turnos no se tocan desde aqu\u00ed.');
        return;
      }
      var cv=_miTurnoCv_(); if(!cv) return;
      var mias=_misCeldas_(cv);
      b.disabled=true; var t=b.textContent; b.textContent='Guardando\u2026';
      try{
        await api.guardarDisponibilidad(cv.id, mias);
        /* ⚠ El eco local va a la fila de la SESION, que es la que el servidor acaba de
           escribir: con `ACTOR` la pantalla enseñaba el cambio bajo el nombre equivocado
           y nunca se contradecia a si misma. */
        var yo=(typeof _actorSanc_==='function') ? _actorSanc_() : ((typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '');
        if(!cv.resp) cv.resp={};
        cv.resp[yo]=mias;
        MIT_CELDAS=null;                       /* ya no queda nada pendiente */
        tost('Disponibilidad guardada.'); pintar();
      }catch(e){
        /* ⛔ UNA DISPONIBILIDAD QUE SE PIERDE EN SILENCIO es la que luego hace que te pongan
           un turno cuando no puedes. Se avisa, se deja el boton vivo y `MIT_CELDAS` NO se
           borra: lo marcado sigue en pantalla para reintentar sin volver a pintarlo. */
        b.disabled=false; b.textContent=t;
        tostErr('No se pudo guardar tu disponibilidad: ', e);
      }
    };
  });
}
function _dispPanel_(){
  var cv=_dispViva_(); if(!cv) return '';
  var calor=_calorTurnos_(cv, DISP_SITIO);
  var top=_mejorTurno_(calor);
  var mudos=_dispMudos_(cv);
  var nInv=(cv.invitados||[]).length;
  var D=cv.dias||[], F=cv.franjas||[];
  var maxN=0; Object.keys(calor).forEach(function(k){ if(calor[k].n>maxN) maxN=calor[k].n; });
  var sit=function(k,txt){
    return '<button data-dsit="'+k+'" class="'+(DISP_SITIO===k?'on':'')+'">'+txt+'</button>';
  };
  var cab='<div class="dmc dml"></div>'+D.map(function(d){
    var p=String(_diaCorto_(d)).split(' ');
    return '<div class="dmc">'+esc(p[0]||'')+'<br>'+esc(p[1]||String(d).slice(8,10))+'</div>';
  }).join('');
  var filas=F.map(function(fr){
    return '<div class="dmc dml">'+esc(fr.txt)+'</div>'+D.map(function(d){
      var k=_dispClave_(d,fr.k), c=calor[k];
      /* El color es la INTENSIDAD del rojo Solaris según cuánta gente puede: el mapa se lee
         de un vistazo y el número exacto está dentro. Con nadie, la celda se queda apagada. */
      var op=maxN? (c.n/maxN) : 0;
      var st=c.n? ('background:rgba(228,30,37,'+(0.18+0.72*op).toFixed(2)+')') : '';
      return '<div class="dcel'+(c.n?'':' v0')+(top[0]===k?' dmejor':'')+'" data-dk="'+k+'" style="'+st+'">'+
        c.n+(c.hay_coche?'<span class="dch">\uD83D\uDE97</span>':'')+'</div>';
    }).join('');
  }).join('');
  return pan('Disponibilidad para turnos','semana del '+esc(_isoADMY_(D[0])||D[0]),
    '<div class="pb">'+
    '<p style="margin:0 0 10px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
      'Cuánta gente puede en cada hueco. <b>Pasa el ratón</b> por una casilla para ver quién. '+
      'El plazo vence el <b>'+esc(_isoADMY_(String(cv.limite).slice(0,10))||'')+'</b> a las '+
      esc(String(cv.limite).slice(11,16))+'.</p>'+
    '<div class="dsit">'+sit('','Los dos sitios')+sit('cuvi','Solo CUVI')+sit('citi','Solo CITI')+'</div>'+
    '<div class="dmapa" id="dMapa" style="grid-template-columns:104px repeat('+D.length+',minmax(44px,1fr))">'+
      cab+filas+'</div>'+
    '<div class="ddet" id="dDet">'+_dispDetalle_(cv, DISP_SEL||top[0], calor)+'</div>'+
    '<div class="nota">'+
      (nInv ? '<b>'+(nInv-mudos.length)+'</b> de <b>'+nInv+'</b> han contestado'+
              (mudos.length ? ' · <b>sin contestar:</b> '+mudos.map(_dispPila_).map(esc).join(', ') : '')
            : 'Nadie convocado todavía.')+
      ' — «sin contestar» no es «no puede»: son los únicos a los que tiene sentido insistir.'+
    '</div>'+
    '</div>');
}

/* ═══ EL MAPA PINTA LO QUE HA CONTESTADO LA GENTE ═══════════════════════════════════════
   Hasta hoy `_dispViva_()` leia `CONVOCATORIAS` **de memoria**, o sea los datos de demostracion:
   se abria el escritorio, se veia un mapa de calor con nombres y horas... y no era de nadie.
   `api.getDisponibilidad` estaba declarada en las dos caras y **no la llamaba nadie**.

   ⛔ Una ida y vuelta, no dos: la accion devuelve la convocatoria Y las respuestas, y desde hoy
   sin `id` sirve la vigente. Pedir primero cual es y luego sus respuestas serian dos viajes para
   una pantalla que se abre en el movil de alguien.
   ⚠️ Y el estado se guarda para no repreguntar en cada repintado: `pintar()` corre muchas veces
   por interaccion, y sin esto el mapa dispararia una peticion por cada raton que pasa. */
function _dispEstadoSrv_(v){
  if(v!==undefined) DISP_SRV=v;
  return (typeof DISP_SRV==='undefined') ? 'sin pedir' : DISP_SRV;
}

function _dispCargar_(repintar){
  if(_dispEstadoSrv_() !== 'sin pedir') return;
  if(typeof SESION==='undefined' || !SESION || typeof api==='undefined' || !api.getDisponibilidad) return;
  _dispEstadoSrv_('pidiendo');
  /* El interruptor se lee EN PARALELO con el mapa, no encadenado: son dos preguntas
     independientes y encadenarlas sumaria las dos esperas para pintar la misma pantalla.
     ⚠️ Y su fallo NO tumba el mapa (`catch` propio): que no se sepa si los avisos estan
     encendidos no es motivo para dejar sin disponibilidad a quien reparte turnos. */
  if(api.getControl){
    /* Se pide el CONTROL ENTERO porque es lo único que sabe hacer `api.getControl`, y
       la clave se saca aquí. ⛔ Cada entrada es `{valor, actualizado_at, por, nota}`,
       **no el valor a secas**: leer la entrada directamente daría un OBJETO —que es
       cierto— y el interruptor saldría encendido siempre, incluido el día que esté
       apagado. Es el mismo fallo que tuvo el gate meses con `calcular_cierre`. */
    api.getControl().then(function(c){
      var e = c && c[INTERRUPTOR_AVISOS];
      var val = (e && typeof e==='object' && 'valor' in e) ? e.valor : e;
      AVISOS_ON = (val===true || val==='true' || val===1 || val==='1');
      if(typeof repintar==='function') repintar();
    }).catch(function(){});
  }
  api.getDisponibilidad().then(function(r){
    _dispEstadoSrv_('ok');
    if(typeof CONVOCATORIAS==='undefined') return;
    /* ⛔ EL SERVIDOR MANDA. Sin convocatoria no se deja la de demostracion puesta: un mapa de
       mentira es peor que un hueco, porque se reparte gente con el. */
    CONVOCATORIAS.length=0;
    if(r && r.convocatoria){
      var cv=r.convocatoria;
      cv.resp = r.cv || {};
      cv.abierta = !!r.abierta;
      CONVOCATORIAS.push(cv);
    }
    if(typeof repintar==='function') repintar();
  }).catch(function(){
    /* ⛔ Un fallo NO deja el mapa de demostracion pintado: se marca el estado y se repinta, que
       es como la pantalla puede decir que no lo sabe en vez de enseñar algo inventado.
       ⛔ Y ESO LO DECIA EL COMENTARIO Y NO LO HACIA EL CODIGO. `CONVOCATORIAS.length=0` solo
       estaba en la rama de EXITO, asi que con el backend caido quedaba puesta la semilla de
       demostracion — una convocatoria entera, **con los nombres reales del consejo** y su
       plazo— y quien reparte turnos veia un mapa de calor perfecto y **repartia un turno
       real con el**. Un mapa de mentira es peor que un hueco, que es justo lo que dice la
       rama de arriba: la leccion estaba escrita a seis lineas de aqui.
       ⚠️ Y `DISP_SRV` no lo lee nadie mas: `_dispPanel_` no consulta el estado en ningun
       punto, asi que marcarlo no basta — hay que VACIAR. */
    if(typeof CONVOCATORIAS!=='undefined') CONVOCATORIAS.length=0;
    _dispEstadoSrv_('error');
    if(typeof repintar==='function') repintar();
  });
}

function _pinDisp_(){
  /* Se pide AQUI y no en el arranque: el mapa vive en una pestaña que puede no abrirse en
     toda la sesion, y cargarlo siempre seria una peticion de mas para todo el mundo. */
  _dispCargar_(typeof pintar==='function' ? pintar : null);
  var cv=_dispViva_(); if(!cv) return;
  var mapa=document.getElementById('dMapa'); if(!mapa) return;
  var calor=_calorTurnos_(cv, DISP_SITIO);
  var det=document.getElementById('dDet');
  var pinta=function(k){
    if(!det) return;
    det.innerHTML=_dispDetalle_(cv, k, calor);
    var ant=mapa.querySelector('.dcel.dsel'); if(ant) ant.classList.remove('dsel');
    var el=mapa.querySelector('[data-dk="'+k+'"]'); if(el) el.classList.add('dsel');
  };
  $$('#dMapa [data-dk]').forEach(function(el){
    /* El desglose va a una CAJA FIJA debajo, no a un tooltip flotante: tres cestas de nombres
       no caben en un globo sobre una celda de 44 px, y un tooltip sobre el borde del panel se
       sale. Además así se puede leer con calma y funciona igual con clic (táctil). */
    el.onmouseenter=function(){ DISP_SEL=el.dataset.dk; pinta(DISP_SEL); };
    el.onclick=function(){ DISP_SEL=el.dataset.dk; pinta(DISP_SEL); };
  });
  $$('.dsit [data-dsit]').forEach(function(b){
    b.onclick=function(){ DISP_SITIO=b.dataset.dsit; DISP_SEL=''; pintar(); };
  });
}

/* ═══ CONVOCAR DISPONIBILIDAD ═══════════════════════════════════════════════════════
   Abre el plazo para una semana. **Solo rango ≥ 3** — Daniel, §3.11 del plan: *«eso solo lo
   puedo hacer yo, eso sí que no va a cambiar»*.

   ⛔ AQUÍ NO SE CALCULA NINGUNA FECHA. Se encola **qué semana** se quiere y el servidor
   —`rutinas/calcular_convocatoria.py`, con la regla de `reglas/convocatoria.py`— resuelve la
   apertura y el límite. Es el patrón de la casa: **el escritorio encola, Python calcula**,
   igual que el cierre mensual y el de temporada.
   ⛔ Y por eso esta pantalla **no promete horas**: decir aquí «se abre el jueves a las 22:00»
   sería escribir la regla por segunda vez, en prosa, donde nadie la va a actualizar. */

function _puedeConvocarDisp_(){ return rangoNom(ACTOR) >= 3; }

function _convocarDispPanel_(){
  if(!_puedeConvocarDisp_()) return '';
  var E=CAMPO_CSS;
  var lab=function(t){ return '<span class="sc" style="display:block;margin-bottom:5px">'+t+'</span>'; };
  return pan('Convocar disponibilidad','abre el plazo · solo dirección',
    '<div class="pb">'+
    '<p style="margin:0 0 12px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
      'Elige <b>cualquier día</b> de la semana que quieras preguntar: se pregunta la semana '+
      'entera, de lunes a domingo. <b>El plazo lo calcula el servidor</b> con la regla del '+
      'calendario — aquí no se decide. Recoger disponibilidad <b>no sale de la app</b>: no toca '+
      'Notion ni el excel de Aerotech.</p>'+
    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end;margin-bottom:11px">'+
      '<label style="width:165px">'+lab('Semana (un día cualquiera)')+
        '<input type="date" id="cdSemana" style="'+E+'"></label>'+
      '<label style="display:flex;align-items:center;gap:7px;font-size:12.5px;padding-bottom:9px">'+
        '<input type="checkbox" id="cdCuvi" checked> CUVI</label>'+
      '<label style="display:flex;align-items:center;gap:7px;font-size:12.5px;padding-bottom:9px">'+
        '<input type="checkbox" id="cdCiti" checked> CITI</label>'+
      '<label style="display:flex;align-items:center;gap:7px;font-size:12.5px;padding-bottom:9px">'+
        '<input type="checkbox" id="cdTarde"> la tarde va partida (16:00 / 18:00)</label>'+
      /* ⛔ EL MODO LO ELIGE QUIEN CONVOCA, no quien programa. Era `horaria=False` en la
         firma de `montar`: una constante en Python, o sea que preguntar por horas
         dependia de que alguien tocara el codigo. La etiqueta dice lo que CAMBIA
         -«un toque marca 4 h»- y no el nombre del modo, que no le dice nada a nadie. */
      '<label style="display:flex;align-items:center;gap:7px;font-size:12.5px;padding-bottom:9px">'+
        '<input type="checkbox" id="cdHoraria"> preguntar POR HORAS (09:00–22:00); un '+
        'toque marca el turno de 4 h</label>'+
    '</div>'+
    '<button class="btn" data-convdisp>Convocar disponibilidad</button>'+
    '<div class="nota" id="cdNota">Se encola y la rutina lo recoge en la siguiente pasada. '+
      'Lo que salga —los días, el plazo y a quién se convoca— aparecerá arriba.</div>'+
    /* ⛔ EL INTERRUPTOR DE LOS AVISOS, aquí y no en un fichero de Python. Estos avisos
       llegan al MÓVIL de 23 personas: encenderlos no es decisión de quien programa —
       pero tampoco tiene por qué ser un mensaje pidiéndolo, que convierte una decisión
       suya en una espera. Nace APAGADO.
       ⚠️ Y la nota dice qué pasa mientras está apagado: la rutina **sigue calculando**
       y dejando en la bitácora el texto exacto que mandaría. Encenderlo no es un salto
       a ciegas. */
    '<div class="sep"></div>'+
    '<label style="display:flex;align-items:center;gap:7px;font-size:12.5px">'+
      '<input type="checkbox" id="cdAvisos"'+(AVISOS_ON?' checked':'')+'> '+
      '<b>mandar los avisos al móvil</b></label>'+
    '<div class="nota" id="cdAvNota">Apagado, la rutina sigue calculando y deja escrito '+
      'lo que mandaría, pero <b>no sale nada</b>. Encendido, avisa al abrir, a las 24 h, '+
      'a las 3 h y a los 10 min — y el recordatorio <b>solo a quien no ha contestado</b>.</div>'+
    '</div>');
}

function _engAvisosConv_(m){
  var c=(m||document).querySelector('#cdAvisos'); if(!c) return;
  c.onchange=async function(){
    var on=!!c.checked;
    /* ⛔ SE CONFIRMA AL ENCENDER, no al apagar. Encender manda notificaciones al movil de 23
       personas; apagar no le llega a nadie. Preguntar en los dos casos entrena a decir que si
       sin leer, que es como se acaba mandando algo sin querer. */
    if(on && !confirm('Vas a ENCENDER los avisos de la convocatoria.'+String.fromCharCode(10,10)+
      'A partir de ahora salen notificaciones al movil del equipo: al abrir la disponibilidad, '+
      'a las 24 h, a las 3 h y a los 10 minutos del cierre.'+String.fromCharCode(10,10)+
      'El recordatorio solo le llega a quien no ha contestado. Sigo?')){ c.checked=false; return; }
    c.disabled=true;
    try{
      await api.setControl(INTERRUPTOR_AVISOS, on, on?'avisos ENCENDIDOS':'avisos apagados');
      AVISOS_ON=on;
      tost(on?'Avisos encendidos.':'Avisos apagados. La rutina sigue calculando sin mandar.');
    }catch(e){
      /* ⛔ Si no se pudo guardar, la casilla VUELVE a donde estaba: dejarla marcada diria que
         los avisos estan encendidos cuando el servidor no se ha enterado. */
      c.checked=!on; tost('No se pudo: '+e);
    }finally{ c.disabled=false; }
  };
}

function _pinConvDisp_(m){
  _engAvisosConv_(m);
  var b=(m||document).querySelector('[data-convdisp]'); if(!b) return;
  b.onclick=async function(){
    if(b.disabled) return;
    if(typeof backendOK==='undefined' || !backendOK || !SESION){
      tost('Sin conexión no se puede convocar.'); return; }
    var sem=(document.getElementById('cdSemana')||{}).value||'';
    if(!sem){ tost('Elige una semana.'); return; }
    var sitios=[];
    if((document.getElementById('cdCuvi')||{}).checked) sitios.push('cuvi');
    if((document.getElementById('cdCiti')||{}).checked) sitios.push('citi');
    /* ⛔ Sin sitio no se convoca: una convocatoria sin dónde no se puede contestar, y dejarla
       salir vacía sería el mismo fallo mudo de siempre. */
    if(!sitios.length){ tost('Marca al menos un sitio (CUVI o CITI).'); return; }
    if(!confirm('Abrir la disponibilidad de la semana del '+sem+'.'+String.fromCharCode(10,10)+
      'NO sale nada fuera de la app: no toca Notion ni el excel de Aerotech. El servidor '+
      'calcula el plazo y monta la convocatoria.'+String.fromCharCode(10,10)+'¿Sigo?')) return;
    b.disabled=true; var prev=b.textContent; b.textContent='Encolando…';
    try{
      await api.setControl('convocar_disponibilidad', {
        semana: sem,
        tarde_partida: !!(document.getElementById('cdTarde')||{}).checked,
        /* ⛔ EL MODO LO ELIGE QUIEN CONVOCA. Era `horaria=False` en la firma de `montar`,
           o sea una constante que solo se podia cambiar tocando el codigo — y si la próxima
           semana se pregunta por horas o por medias tardes no es una decisión de quien
           programa. Aquí es una casilla y viaja en el encargo. */
        horaria: !!(document.getElementById('cdHoraria')||{}).checked,
        sitios: sitios,
        por: ACTOR,
        at: new Date().toISOString()
      }, 'convocatoria de disponibilidad para turnos');
      tost('Encolado. La rutina lo recoge en la siguiente pasada.');
      var n=document.getElementById('cdNota');
      if(n) n.innerHTML='<b>Encolado</b> para la semana del '+esc(sem)+'. El plazo lo calcula '+
        'el servidor; cuando lo procese, la convocatoria aparece arriba.';
    }catch(e){
      tost('No se pudo encolar: '+e);
    }finally{
      b.disabled=false; b.textContent=prev;
    }
  };
}

/* ⛔ UN COCHE ES UN TRAYECTO. Se pinta «Coche 1», «Coche 2»... con `_etiquetaCoche_`, que va
   en base 1 porque nadie dice «Coche 0».
   ⚠️ La casilla de la vuelta sale APAGADA por defecto y eso no es un detalle: un interruptor
   encendido de fabrica se acaba dejando puesto, y entonces la mitad de los turnos tendrian una
   vuelta inventada. Solo cuando se enciende aparecen sus dos campos. */
function _opcionesPunto_(sel){
  return '<option value="">— elige —</option>' + PUNTOS_TURNO.map(function(p){
    return '<option value="'+esc(p.id)+'"'+(sel===p.id?' selected':'')+'>'+
      esc(p.nombre)+' · '+esc(p.ciudad)+'</option>'; }).join('');
}

function pintarCoches(){
  var c = document.getElementById('tuCoches');
  if(!c) return;
  if(!TUR_COCHES.length){
    c.innerHTML = '<p style="margin:0;font-size:12px;color:var(--ink3)">Sin coches. '+
      'Un turno en Vigo no suele necesitar ninguno.</p>';
    return;
  }
  c.innerHTML = TUR_COCHES.map(function(co, i){
    /* ⚠️ Se avisa si el trayecto NO cruza de ciudad: no se impide -puede haber un coche
       dentro de la misma ciudad- pero conviene verlo, porque es lo que decide si el turno
       «contempla el trayecto Ourense-Vigo». */
    var cruza = _trayectoCruzaCiudad_(co.origen, co.destino);
    var nota = (cruza === false)
      ? '<span class="chip" style="margin-left:6px">mismo municipio</span>' : '';
    return '<div class="dec" data-coche-i="'+i+'" style="display:block;padding:8px 0">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
        '<b>'+esc(_etiquetaCoche_(i))+'</b>'+nota+
        '<button type="button" class="mini" data-quitacoche="'+i+'" '+
          'style="margin-left:auto">quitar</button>'+
      '</div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
        '<label style="flex:1;min-width:190px"><span class="sc">Sale de</span>'+
          '<select data-co-org="'+i+'">'+_opcionesPunto_(co.origen)+'</select></label>'+
        '<label style="flex:1;min-width:190px"><span class="sc">Va a</span>'+
          '<select data-co-dst="'+i+'">'+_opcionesPunto_(co.destino)+'</select></label>'+
      '</div>'+
      '<label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12.5px">'+
        '<input type="checkbox" data-co-vd="'+i+'"'+(co.vueltaDistinta?' checked':'')+'>'+
        'La vuelta no es la misma que la ida</label>'+
      (co.vueltaDistinta
        ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">'+
            '<label style="flex:1;min-width:190px"><span class="sc">Vuelve desde</span>'+
              '<select data-co-vorg="'+i+'">'+_opcionesPunto_(co.vueltaOrigen)+'</select></label>'+
            '<label style="flex:1;min-width:190px"><span class="sc">Vuelve a</span>'+
              '<select data-co-vdst="'+i+'">'+_opcionesPunto_(co.vueltaDestino)+'</select></label>'+
          '</div>'
        : '')+
    '</div>';
  }).join('');
  cablearCoches();
}

function cablearCoches(){
  $$('#tuCoches [data-co-org]').forEach(function(el){
    el.onchange = function(){ TUR_COCHES[+el.dataset.coOrg].origen = el.value; pintarCoches(); }; });
  $$('#tuCoches [data-co-dst]').forEach(function(el){
    el.onchange = function(){ TUR_COCHES[+el.dataset.coDst].destino = el.value; pintarCoches(); }; });
  $$('#tuCoches [data-co-vorg]').forEach(function(el){
    el.onchange = function(){ TUR_COCHES[+el.dataset.coVorg].vueltaOrigen = el.value; }; });
  $$('#tuCoches [data-co-vdst]').forEach(function(el){
    el.onchange = function(){ TUR_COCHES[+el.dataset.coVdst].vueltaDestino = el.value; }; });
  $$('#tuCoches [data-co-vd]').forEach(function(el){
    el.onchange = function(){
      var co = TUR_COCHES[+el.dataset.coVd];
      co.vueltaDistinta = !!el.checked;
      /* ⚠️ Al APAGARLA se borran sus campos: dejarlos puestos manda una vuelta que la
         casilla dice que no existe, y el backend no sabria cual de las dos creer. */
      if(!co.vueltaDistinta){ co.vueltaOrigen = null; co.vueltaDestino = null; }
      pintarCoches();
    }; });
  $$('#tuCoches [data-quitacoche]').forEach(function(b){
    b.onclick = function(){ TUR_COCHES.splice(+b.dataset.quitacoche, 1); pintarCoches(); }; });
}

/* ═══ CERRAR UN TURNO Y DECLARAR EL TIEMPO EXTRA ═════════════════════════════════
   Daniel (15/08): *«el responsable de turno le da a un boton, se valida, y hay un campo para
   rellenar si hubo tiempo extra a partir de las cuatro horas»*.

   ⛔ DOS GESTOS EN UNA PANTALLA, y es a proposito: **confirmar quien fue de verdad** (el papel
   que `CARGOS_TURNO` ya le daba al responsable) y **repartir el extra**. Separarlos obligaria a
   entrar dos veces al mismo turno para decir cosas sobre las mismas personas.
   ⛔ Y EL EXTRA SE EDITA FILA A FILA porque el ejemplo de Daniel lo exige: *«a lo mejor es
   tiempo extra que no le cuenta a alguien que vive cerca, pero si a alguien que vive lejos»*.
   Un solo campo por turno reparte a partes iguales, que es justo lo que ese ejemplo descarta.
   ⚠️ NO ESCRIBE EN NOTION. Deja la propuesta a la vista para aplicarla: escribir en Notion
   exige el visto bueno de Daniel **cada vez**, y son los puntos de personas reales. */
function _turnosCerrables_(){
  var out = [];
  (typeof TURNOS !== 'undefined' ? TURNOS : []).forEach(function(t, i){
    if(_puedeCerrarTurno_(t, ACTOR)) out.push(i);
  });
  return out;
}

function _cierreTurSel_(){
  var l = (typeof TURNOS !== 'undefined' ? TURNOS : []);
  return (CIERRE_TUR.i == null) ? null : (l[CIERRE_TUR.i] || null);
}

/* El techo de esta pantalla. `dur` es texto libre del campo, asi que puede no ser un numero:
   `_extraTope_` ya trata el no-numero como 0, que es el lado seguro (sin duracion no se
   declara ningun extra). */
function _cierreTurTope_(){
  var d = parseFloat(String(CIERRE_TUR.dur).replace(',', '.'));
  return _extraTope_(isFinite(d) ? d : 0);
}

/* Lo que se mandaria: SOLO los confirmados.
   ⛔ Quien no fue no lleva fila, en vez de llevar una con 0: son dos afirmaciones distintas
   —«estuvo y no le toca extra» frente a «no estuvo»— y el turno tambien cuenta un turno en el
   contador. Colar un 0 por un ausente le sumaria el turno a quien no fue. */
function _cierreTurMapa_(){
  var out = {}, t = _cierreTurSel_(), tope = _cierreTurTope_();
  /* ⛔ CON LOS DUDOSOS DENTRO: si el responsable marca a alguien que figuraba como
     `Posible` y al final fue, tiene que VIAJAR. Recorrer solo `_asistentesTurno_` hacia
     que marcarlo en la pantalla no sirviera de nada — el clic entraba y la propuesta
     salia sin el. */
  var esDud = {};
  _dudososTurno_(t).forEach(function(n){ esDud[n] = 1; });
  _asistentesTurno_(t).concat(_dudososTurno_(t)).forEach(function(n){
    if(!CIERRE_TUR.quien[n]) return;
    var v = CIERRE_TUR.extra[n];
    out[n] = (typeof v === 'number' && isFinite(v)) ? v : (esDud[n] ? 0 : tope);
  });
  return out;
}

function _cierreTurnoPanel_(){
  var cerrables = _turnosCerrables_();
  if(!cerrables.length) return '';
  if(CIERRE_TUR.i == null) CIERRE_TUR.i = cerrables[0];

  var t = _cierreTurSel_(), firmes = _asistentesTurno_(t), tope = _cierreTurTope_();
  var resp = _responsableTurno_(t);
  /* ⛔ LOS DUDOSOS TAMBIEN SALEN. `_asistentesTurno_` filtra por `_esFirmeRol_`, asi que
     quien figuraba como `Posible` o `Reserva` **y al final fue** no tenia fila: el
     responsable no podia darle ni su hora extra ni su turno. `comun.js` ya lo dice —«no
     se les quita de la lista: el responsable es quien sabe si al final vinieron»—, y
     `_dudososTurno_` existe desde el 17/08 **sin que la llamara nadie**.
     ⚠️ `_cierreTurnoInicial_` NO se usa a proposito: recibe `durH` y congela el tope de
     ese instante, pero aqui la duracion empieza VACIA y se teclea despues — sembrar con
     ella daria todo a 0 en la primera pintada. Este panel recalcula el tope en cada
     render, y eso es lo que hay que conservar. */
  var dud = _dudososTurno_(t), esDud = {};
  dud.forEach(function(n){ esDud[n] = 1; });
  var asis = firmes.concat(dud);
  /* Primera vez sobre este turno: los firmes se dan por idos; los dudosos NO.
     ⛔ Y la direccion importa: marcarlos por defecto le sumaria **un turno** a quien quiza
     no fue —lo dice el comentario de `_cierreTurMapa_` dos funciones mas arriba—, mientras
     que dejarlos sin marcar solo cuesta un clic a quien sabe la respuesta. */
  if(!Object.keys(CIERRE_TUR.quien).length){
    firmes.forEach(function(n){ CIERRE_TUR.quien[n] = true; });
    dud.forEach(function(n){ CIERRE_TUR.quien[n] = false; });
  }

  var mapa = _cierreTurMapa_(), falta = _cierreTurnoFalta_(mapa, tope);

  var opciones = cerrables.map(function(i){
    var x = TURNOS[i], f = x.fecha_txt || x.fecha || x.f || '?';
    return '<option value="'+i+'"'+(i===CIERRE_TUR.i?' selected':'')+'>'+
      esc(f + (x.hora ? ' · '+String(x.hora).slice(0,5) : '') +
          (x.punto ? ' · '+x.punto : '')) + '</option>';
  }).join('');

  var filas = asis.map(function(n){
    var on = !!CIERRE_TUR.quien[n];
    var v = CIERRE_TUR.extra[n];
    /* ⛔ EL DUDOSO ARRANCA A CERO, NO AL TOPE. De estos **no se sabe si fueron**, asi que
       el defecto tiene que ser «lo que se sabe»: si el responsable lo marca, decide el
       extra a mano. Al reves habria que acordarse de bajarlo. Es la regla que
       `_cierreTurnoInicial_` dejo escrita el 17/08 y que nadie ejecutaba. */
    var val = (typeof v === 'number' && isFinite(v)) ? v : (esDud[n] ? 0 : tope);
    return '<tr'+(on?'':' style="opacity:.45"')+'>'+
      '<td><label style="display:flex;align-items:center;gap:7px;cursor:pointer">'+
        '<input type="checkbox" data-ct-fue="'+esc(n)+'"'+(on?' checked':'')+'>'+
        esc((miembro(n)||{}).pila || n)+
        (n===resp?' <span class="chip">responsable</span>':'')+'</label></td>'+
      '<td class="r"><input class="mono" type="number" step="0.25" min="0" max="'+tope+'" '+
        'data-ct-extra="'+esc(n)+'" value="'+val+'" style="width:88px;text-align:right"'+
        (on?'':' disabled')+'> h</td></tr>';
  }).join('');

  var aviso = (tope <= 0)
    ? '<div class="nota">El turno no ha pasado de las <b>'+_horasTurnoBase_()+' h</b> de base, '+
      'as\u00ed que <b>no hay tiempo extra que repartir</b>. Cerrarlo sigue valiendo: confirma qui\u00e9n fue.</div>'
    : '<div class="nota">El turno dio <b>'+h1(tope)+'</b> por encima de la base de '+
      '<b>'+_horasTurnoBase_()+' h</b>. Ese es el <b>m\u00e1ximo por persona</b>, y se baja a quien no le '+
      'corresponda: no todo el mundo se qued\u00f3 lo mismo.</div>';

  var salida = CIERRE_TUR.hecho
    ? '<div class="nota" style="margin-top:11px"><b>Propuesta lista.</b> No se ha escrito nada en '+
      'Notion: eso lo aplica Daniel. Va al campo <b>Compensaciones</b>, y el turno suma '+
      '<b>1 al contador</b> (el \u00d74 lo pone la f\u00f3rmula).<pre class="mono" style="white-space:pre-wrap;'+
      'font-size:12px;margin:8px 0 0">'+esc(CIERRE_TUR.hecho)+'</pre></div>'
    : '';

  return pan('Cerrar un turno', cerrables.length+' tuyo(s)',
    '<label class="campo"><span class="sc">Qu\u00e9 turno</span>'+
      '<select id="ctSel">'+opciones+'</select></label>'+
    '<label class="campo"><span class="sc">Cu\u00e1nto dur\u00f3 de verdad (horas)</span>'+
      '<input class="mono" id="ctDur" type="number" step="0.25" min="0" '+
        'value="'+esc(CIERRE_TUR.dur)+'" placeholder="p. ej. 6"></label>'+
    aviso+
    (asis.length
      ? '<table class="tb" style="margin-top:9px"><thead><tr><th>Qui\u00e9n fue de verdad</th>'+
        '<th class="r">Extra</th></tr></thead><tbody>'+filas+'</tbody></table>'
      : '<div class="nota">Este turno no tiene a nadie resuelto en el roster.</div>')+
    '<button class="btn pri" id="ctEnviar"'+(falta?' disabled':'')+' style="margin-top:11px">'+
      (falta ? esc(falta) : 'Cerrar el turno')+'</button>');
}

function _cablearCierreTurno_(){
  var sel = document.getElementById('ctSel');
  if(sel) sel.onchange = function(){
    /* ⛔ Al cambiar de turno se BORRA el reparto: si se conservara, las horas escritas para
       una persona de un turno saldrian sembradas en otro turno distinto, con su nombre y con
       cara de haber sido tecleadas ahi. */
    CIERRE_TUR.i = +sel.value; CIERRE_TUR.quien = {}; CIERRE_TUR.extra = {};
    CIERRE_TUR.dur = ''; CIERRE_TUR.hecho = null; render();
  };
  var dur = document.getElementById('ctDur');
  if(dur) dur.onchange = function(){
    CIERRE_TUR.dur = dur.value;
    /* El techo baja: lo que ya estuviera por encima se recorta, o el boton quedaria
       bloqueado por un numero que la persona no puede ver de donde sale. */
    var tope = _cierreTurTope_();
    Object.keys(CIERRE_TUR.extra).forEach(function(n){
      if(CIERRE_TUR.extra[n] > tope) CIERRE_TUR.extra[n] = tope; });
    CIERRE_TUR.hecho = null; render();
  };
  $$('#s-turnos [data-ct-fue]').forEach(function(el){
    el.onchange = function(){ CIERRE_TUR.quien[el.dataset.ctFue] = !!el.checked; render(); }; });
  $$('#s-turnos [data-ct-extra]').forEach(function(el){
    el.onchange = function(){
      var v = parseFloat(String(el.value).replace(',', '.'));
      CIERRE_TUR.extra[el.dataset.ctExtra] = isFinite(v) ? v : 0;
      CIERRE_TUR.hecho = null; render();
    }; });
  var b = document.getElementById('ctEnviar');
  if(b) b.onclick = function(){
    var mapa = _cierreTurMapa_(), tope = _cierreTurTope_();
    var falta = _cierreTurnoFalta_(mapa, tope);
    if(falta){ b.textContent = falta; return; }
    var t = _cierreTurSel_();
    CIERRE_TUR.hecho = 'Turno ' + ((t && (t.fecha_txt || t.fecha || t.f)) || '?') +
      ' \u00b7 ' + Object.keys(mapa).length + ' persona(s), +1 turno cada una\n' +
      Object.keys(mapa).map(function(n){
        return '  ' + n + ' \u2192 ' + (mapa[n] ? ('+' + mapa[n] + ' h a Compensaciones')
                                                : 'sin extra'); }).join('\n');
    render();
  };
}

function convocarPanel(){
  if(rangoNom(ACTOR)<1) return '';                       // solo coordinaci\u00f3n o superior
  var E=CAMPO_CSS;
  var lab=function(t){ return '<span class="sc" style="display:block;margin-bottom:5px">'+t+'</span>'; };
  /* las bajas no se convocan: siguen en el roster por su historia, no para turnos nuevos */
  var pool=_activos_()
    .slice().sort(function(a,b){ return String(a.pila).localeCompare(String(b.pila)); });
  var chips=pool.map(function(m){
    return '<button type="button" class="pick'+(TUR_SEL[m.nombre]?' on':'')+'" data-tu="'+esc(m.nombre)+'">'+
      esc(m.pila)+'</button>';
  }).join('');
  return pan('Convocar turno','queda escrito en Notion',
    '<div class="pb">'+
    '<p style="margin:0 0 12px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
      'El turno les llega a los convocados y queda publicado en Notion. Marca qui\u00e9n va, ponle a cada uno '+
      'su papel y di qu\u00e9 hay que sacar. <b>No se puede convocar m\u00e1s de un turno el mismo d\u00eda.</b></p>'+

    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end;margin-bottom:11px">'+
      '<label style="width:145px">'+lab('Fecha')+'<input type="date" id="tuFecha" style="'+E+'"></label>'+
      '<label style="width:110px">'+lab('Hora')+'<input type="time" id="tuHora" style="'+E+'"></label>'+
      '<label style="width:135px">'+lab('Duraci\u00f3n')+
        '<input id="tuDur" placeholder="~ 3 horas" style="'+E+'"></label>'+
      '<label style="width:135px">'+lab('D\u00f3nde se trabaja')+'<select id="tuLugar" style="'+E+'">'+
        '<option>CITI</option><option>Vigo</option><option>Coasa</option><option>Otro</option></select></label>'+
      '<label style="flex:1;min-width:190px">'+lab('D\u00f3nde se queda')+
        '<input id="tuPunto" placeholder="enfrente del polit\u00e9cnico" style="'+E+'"></label>'+
      '<label style="display:flex;align-items:center;gap:7px;font-size:12.5px;padding-bottom:9px;cursor:pointer">'+
        '<input type="checkbox" id="tuCrucial" style="width:15px;height:15px;accent-color:var(--red)">Crucial</label>'+
    '</div>'+

    lab('Qui\u00e9n va')+
    '<div class="chips" id="tuPool" style="margin:0 0 10px">'+chips+'</div>'+
    '<div id="tuLista" style="margin-bottom:12px"></div>'+

    /* ⛔ LOS COCHES VAN AQUI, DETRAS DE LA GENTE, y el orden lo pidio Daniel:
       «lo clasico despues de disposicion de personas: Coche 1, Coche ...». Tiene
       sentido: no puedes repartir a gente que aun no has convocado. */
    lab('Coches · opcional')+
    '<div id="tuCoches" style="margin-bottom:6px"></div>'+
    '<div style="margin-bottom:12px">'+
      '<button type="button" class="btn mini" data-addcoche>+ añadir coche</button>'+
    '</div>'+

    '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:11px">'+
      '<label style="flex:1;min-width:230px">'+lab('Objetivos principales \u00b7 uno por l\u00ednea')+
        '<textarea id="tuObj1" rows="3" placeholder="Lijado del tramo 2&#10;Pegado de aletas" '+
        'style="'+E+';resize:vertical"></textarea></label>'+
      '<label style="flex:1;min-width:230px">'+lab('Objetivos secundarios \u00b7 si sobra tiempo')+
        '<textarea id="tuObj2" rows="3" placeholder="Ordenar el z\u00falo" '+
        'style="'+E+';resize:vertical"></textarea></label>'+
    '</div>'+

    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end">'+
      '<label style="flex:1;min-width:230px">'+lab('Aviso para los convocados')+
        '<input id="tuNota" placeholder="traed guantes y mascarilla" style="'+E+'"></label>'+
      '<button class="btn pri" data-convocar>Convocar el turno</button>'+
    '</div></div>');
}

