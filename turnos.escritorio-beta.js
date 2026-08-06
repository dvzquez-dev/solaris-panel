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
      '<button type="button" class="mini'+(TUR_RESP===n?' on':'')+'" data-resp="'+esc(n)+'">responsable</button>'+
      '<button type="button" class="mini'+(e.coche?' on':'')+'" data-coche="'+esc(n)+'">coche</button>'+
      '<button type="button" class="mini x" data-quita="'+esc(n)+'">quitar</button>'+
    '</div>';
  }).join('');
  cablearReparto();
}

function cablearReparto(){
  $$('#tuLista [data-rol]').forEach(function(i){
    i.oninput=function(){ if(TUR_SEL[i.dataset.rol]) TUR_SEL[i.dataset.rol].rol=i.value; };
  });
  $$('#tuLista [data-resp]').forEach(function(b){
    b.onclick=function(){ var n=b.dataset.resp; TUR_RESP=(TUR_RESP===n?null:n); pintarReparto(); };
  });
  $$('#tuLista [data-coche]').forEach(function(b){
    b.onclick=function(){ var n=b.dataset.coche; TUR_SEL[n].coche=!TUR_SEL[n].coche; pintarReparto(); };
  });
  $$('#tuLista [data-quita]').forEach(function(b){
    b.onclick=function(){
      var n=b.dataset.quita; delete TUR_SEL[n]; if(TUR_RESP===n) TUR_RESP=null;
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

function _pinDisp_(){
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
    '</div>'+
    '<button class="btn" data-convdisp>Convocar disponibilidad</button>'+
    '<div class="nota" id="cdNota">Se encola y la rutina lo recoge en la siguiente pasada. '+
      'Lo que salga —los días, el plazo y a quién se convoca— aparecerá arriba.</div>'+
    '</div>');
}

function _pinConvDisp_(m){
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

