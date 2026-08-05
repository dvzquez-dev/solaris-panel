/* ═══ REUNIONES · cara escritorio ═══════════════════════════════════════════════════════════
   17 funciones sacadas de `escritorio.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* normaliza una reunión del backend a la forma que pintan las vistas */
function normReu(r){ r=r||{};
  return {id:r.id, titulo:r.titulo, tipo:r.tipo||"general", modalidad:r.modalidad||"hibrida",
    convocante:r.convocante||"", invitados:Array.isArray(r.invitados)?r.invitados:[],
    limite:r.limite||null, dias:Array.isArray(r.dias)?r.dias:[],
    franjas:Array.isArray(r.franjas)?r.franjas:[], bloques:Array.isArray(r.bloques)?r.bloques:[],
    total:r.total||0, resp:r.resp||{}, nResp:r.nResp||0, fecha:r.fecha||null,
    ordenDia:r.ordenDia||"", vision:r.vision||"anonima",
    fijada:_labelFijada_(r.fijada), fijadaBl:_bloquesFijada_(r)}; }

/* El backend manda `fijada` como objeto {fecha,franjas,bloques,label,iso}; pintarlo tal
   cual daba «[object Object]» en la tabla de convocatorias. */
function _labelFijada_(f){
  if(!f) return '';
  if(typeof f==='string') return f;
  return f.label || f.iso || '';
}

/* 🔴 LOS BLOQUES DE LA FIJADA, que este normalizador TIRABA.
   El mapa de calor sabía pintar la fijada en verde —está ahí, por rango de minutos— pero
   leía `r.fijadaBl`, y `normReu` solo se quedaba con la etiqueta. Así que el verde solo se
   veía en la sesión en la que fijabas la fecha (ahí se asigna a mano) y **se perdía en
   cuanto recargabas**: la fecha fijada volvía a salir roja. Daniel, unas cuantas veces.
   Es la CUARTA vez que un normalizador tira un dato que sí venía (`origen`, `ordenDia`,
   `enlaceDrive`, y este). Por eso el mapa funcional tiene ya su tabla de procedencia.
   Se aceptan las dos formas, igual que en el móvil: el objeto del backend, o `fijadaBl`
   suelto cuando lo que se re-normaliza es una reunión que ya pasó por aquí. */
function _bloquesFijada_(r){
  var f=r&&r.fijada;
  if(f && typeof f==='object' && Array.isArray(f.bloques)) return f.bloques;
  return Array.isArray(r&&r.fijadaBl) ? r.fijadaBl : [];
}

/* GEMELA · movil.html — UNA SOLA REJILLA para todos los días, contigua y anclada al
   tamaño de slot. Antes cada día generaba SUS franjas desde SU hora de inicio, y un día a
   las 17:00 y otro a las 17:30 daban franjas alternas que se pisaban. Ahora el origen es
   común (el inicio más temprano, bajado al múltiplo del slot) y cada día solo OFERTA los
   slots que le caben enteros. `rangos` son horas decimales [ini,fin]; [0,0] = día off. */
function _genUnion_(rangos, slot){
  slot=Math.max(5, Math.min(240, +slot||60));
  var act=rangos.filter(function(r){ return r && r[1]>r[0]; });
  if(!act.length) return { F:[], perDia:rangos.map(function(){ return []; }) };
  var m0=Math.min.apply(null, act.map(function(r){ return Math.round(r[0]*60); }));
  var m1=Math.max.apply(null, act.map(function(r){ return Math.round(r[1]*60); }));
  m0=Math.floor(m0/slot)*slot;
  var F=[];
  for(var t=m0; t+slot<=m1+1e-9 && F.length<400; t+=slot)
    F.push({ini:pad(Math.floor(t/60))+':'+pad(t%60), dur:slot});
  var perDia=rangos.map(function(r){
    var out=[]; if(!(r && r[1]>r[0])) return out;
    var a=Math.round(r[0]*60), b=Math.round(r[1]*60);
    F.forEach(function(_,i){ var ti=m0+i*slot; if(ti>=a && ti+slot<=b) out.push(i); });
    return out;
  });
  return { F:F, perDia:perDia };
}

/* EQUIVALENTE · movil.html — convocados por defecto según el tipo. Aquí «yo» es ACTOR (la
   identidad con la que se está actuando), no `YO`: es la única diferencia y va marcada. */
function _presetInvitados_(tipo){
  var yo=ACTOR||'', out=[];
  _activos_().forEach(function(m){
    if(m.nombre===yo) return;
    var meto = tipo==='general' ? true
             : tipo==='subsistema' ? (m.unidad===((_m(yo)||{}).unidad))
             : tipo==='junta' ? (m.cargo==='Coordinador'||m.cargo==='Project Director')
             : false;
    if(meto) out.push(m.nombre);
  });
  return out;
}

function convocarReunionPanel(){
  if(rangoNom(ACTOR)<1) return '';                    // solo coordinación o superior
  var E=CAMPO_CSS;
  var lab=function(t){ return '<span class="sc" style="display:block;margin-bottom:5px">'+t+'</span>'; };
  if(CONV_INV===null) CONV_INV=new Set(_presetInvitados_('general'));
  var hoy=new Date(), iso=function(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); };
  var mas=function(d,n){ var x=new Date(d); x.setDate(x.getDate()+n); return iso(x); };
  var subs={}; _activos_().forEach(function(m){ if(m.unidad) subs[m.unidad]=1; });
  var chipsSub=Object.keys(subs).sort().map(function(u){
    return '<button type="button" class="pick" data-csub="'+esc(u)+'">'+esc(u)+'</button>'; }).join('');
  var pool=_activos_().slice().sort(function(a,b){ return String(a.pila).localeCompare(String(b.pila)); });
  var chips=pool.map(function(m){
    return '<button type="button" class="pick'+(CONV_INV.has(m.nombre)?' on':'')+'" data-cinv="'+esc(m.nombre)+'">'+
      esc(m.pila)+'</button>'; }).join('');
  return pan('Convocar reunión','sale el mapa de disponibilidad',
    '<div class="pb">'+
    '<p style="margin:0 0 12px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
      'A los convocados les toca <b>cubrir su disponibilidad</b>, y de no cubrirla salen '+
      'sanciones. Elige bien a quién metes.</p>'+
    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end;margin-bottom:11px">'+
      '<label style="width:210px">'+lab('Tipo')+'<select id="cvTipo" style="'+E+'">'+
        '<option value="general">General · todo el equipo</option>'+
        '<option value="junta">Junta Directiva · coordinación</option>'+
        '<option value="consejo">Consejo</option>'+
        '<option value="subsistema">Subsistema · tu unidad</option>'+
        '<option value="mixta">Mixta · varios subsistemas</option>'+
        '<option value="trabajo">Reunión de trabajo</option></select></label>'+
      '<label style="width:210px">'+lab('Modalidad')+'<select id="cvMod" style="'+E+'">'+
        '<option value="hibrida">Híbrida</option><option value="presencial">Presencial</option>'+
        '<option value="telematica">Telemática</option></select></label>'+
      '<label style="flex:1;min-width:220px">'+lab('Título')+
        '<input id="cvTit" placeholder="Reunión sin título" style="'+E+'"></label>'+
    '</div>'+
    lab('Subsistemas · marca uno y entra su gente')+
    '<div class="chips" style="margin:0 0 8px">'+chipsSub+'</div>'+
    lab('Convocados <b id="cvN">'+CONV_INV.size+'</b>')+
    '<div class="chips" id="cvPool" style="margin:0 0 12px">'+chips+'</div>'+
    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end;margin-bottom:11px">'+
      '<label style="width:150px">'+lab('Desde')+'<input type="date" id="cvD0" value="'+iso(hoy)+'" style="'+E+'"></label>'+
      '<label style="width:150px">'+lab('Hasta')+'<input type="date" id="cvD1" value="'+mas(hoy,6)+'" style="'+E+'"></label>'+
      '<label style="width:120px">'+lab('De')+'<select id="cvH0" style="'+E+'">'+optHoras('16:00')+'</select></label>'+
      '<label style="width:120px">'+lab('A')+'<select id="cvH1" style="'+E+'">'+optHoras('23:00')+'</select></label>'+
    '</div>'+
    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end;margin-bottom:11px">'+
      '<label style="width:150px">'+lab('Tamaño de casilla')+'<select id="cvSlot" style="'+E+'">'+
        '<option value="15">15 min</option><option value="30" selected>30 min</option>'+
        '<option value="60">1 h</option></select></label>'+
      '<label style="width:150px">'+lab('Dura la reunión')+'<select id="cvDura" style="'+E+'">'+
        '<option value="30">30 min</option><option value="60" selected>1 h</option>'+
        '<option value="90">1 h 30 min</option><option value="120">2 h</option></select></label>'+
      '<label style="width:150px">'+lab('Fecha límite')+'<input type="date" id="cvLim" value="'+mas(hoy,5)+'" style="'+E+'"></label>'+
      '<label style="flex:1;min-width:220px">'+lab('Orden del día · enlace')+
        '<input id="cvOrden" placeholder="https://drive.google.com/…" style="'+E+'"></label>'+
    '</div>'+
    /* HORARIO POR DÍA. Se pinta al vuelo (`#cvDias`) porque depende de las fechas, que
       cambian mientras rellenas. Un día apagado NO es un día con horario vacío: es un día
       que no se ofrece, y eso se ve. */
    '<div style="display:flex;gap:9px;align-items:flex-end;margin-bottom:9px;flex-wrap:wrap">'+
      '<label style="flex:1;min-width:240px">'+lab('Copiar la distribución de otra reunión')+
        '<select id="cvCopia" style="'+E+'"><option value="">— sin copiar —</option>'+
        (REUS||[]).filter(function(r){ return (r.franjas||[]).length; }).map(function(r){
          return '<option value="'+esc(r.id)+'">'+esc(r.titulo||('Reunión '+r.id))+
                 ' · '+((r.dias||[]).length)+' días</option>'; }).join('')+
        '</select></label>'+
      '<button class="btn" id="cvHorAbrir" type="button">Horario por día</button>'+
    '</div>'+
    '<div id="cvDias" hidden style="margin-bottom:11px"></div>'+
    '<div class="nota" id="cvPrev" style="border-top:0;margin-bottom:11px">—</div>'+
    '<button class="btn pri" data-convreu>Convocar la reunión</button>'+
    '</div>');
}

function _cablearConvocar_(){
  var t=$('#cvTipo'); if(!t) return;                  // no está la vista o no hay potestad
  var val=function(id){ var e=$('#'+id); return e?e.value:''; };
  var dias=function(){ return _diasEntre_(val('cvD0'), val('cvD1')); };
  /* El rango de CADA dia: el suyo si lo tiene, el general si no, y `null` si esta apagado.
     `_genUnion_` ya sabe tratar los tres casos -filtra `r && r[1]>r[0]`-, asi que aqui no hay
     que decidir nada mas: solo dejar de tirar la informacion. */
  var rangos=function(){
    var h0=_horasHM_(val('cvH0')), h1=_horasHM_(val('cvH1'));
    return dias().map(function(d){
      var c=CONV_HOR[d];
      if(!c) return [h0,h1];
      if(c.off) return null;
      return [_horasHM_(c.h0||val('cvH0')), _horasHM_(c.h1||val('cvH1'))];
    });
  };
  function pintaChips(){
    $$('#cvPool [data-cinv]').forEach(function(b){
      b.classList.toggle('on', CONV_INV.has(b.dataset.cinv)); });
    var n=$('#cvN'); if(n) n.textContent=CONV_INV.size;
  }
  function upd(){
    var sl=+val('cvSlot')||30, du=+val('cvDura')||60;
    var u=_genUnion_(rangos(), sl);
    var nb=u.perDia.reduce(function(a,x){ return a+x.length; },0), nd=dias().length;
    var nS=_slotsMin_(du,sl);
    var p=$('#cvPrev'); if(!p) return;
    /* La cuenta se dice ANTES de convocar: cuántas casillas salen, cuántas hay que juntar
       y a cuánta gente se le va a reclamar. Es lo que decide si el mapa sirve. */
    p.innerHTML = (!nd) ? 'Revisa las fechas: el rango está vacío o al revés.'
      : (!u.F.length || !nb) ? 'Con ese horario no sale ninguna casilla.'
      : '<b>'+u.F.length+'</b> casilla'+(u.F.length===1?'':'s')+' de <b>'+_durTxt_(sl)+'</b> · '+
        '<b>'+nb+'</b> bloques en <b>'+nd+'</b> día'+(nd===1?'':'s')+' · '+
        'hay que juntar <b>'+nS+'</b> seguida'+(nS===1?'':'s')+' ('+_durTxt_(nS*sl)+') para que cuente · '+
        '<b>'+CONV_INV.size+'</b> convocados'+
        (du%sl ? ' · la duración no es múltiplo de la casilla, se redondea hacia arriba' : '');
  }
  /* La tabla de días se repinta cada vez que cambian las fechas: es la única forma de que
     no se quede hablando de días que ya no existen. Lo configurado se conserva por FECHA, no
     por posición, así que mover el rango un día no descoloca lo que ya habías puesto. */
  function pintaDias(){
    var c=$('#cvDias'); if(!c) return;
    /* `CAMPO_CSS` y no `E`: `E` es una variable LOCAL de `convocarReunionPanel` y aqui no
       existe. Usarla hacia que esta funcion lanzara justo despues de quitar el `hidden`, o
       sea que el bloque se abria VACIO y sin un solo error a la vista. Cazado ejecutando. */
    var E=CAMPO_CSS;
    var ds=dias();
    if(!ds.length){ c.innerHTML='<div class="nota" style="border-top:0">Revisa las fechas.</div>'; return; }
    c.innerHTML='<div class="nota" style="border-top:0;margin-bottom:7px">Sin tocar nada, todos '+
      'los días usan el horario de arriba. Apaga un día para no ofrecerlo.</div>'+
      ds.map(function(d){
        var cf=CONV_HOR[d]||{}, off=!!cf.off;
        return '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;'+
          (off?'opacity:.45':'')+'">'+
          '<b style="width:82px;font-size:12.5px">'+esc(d)+'</b>'+
          '<select data-chd="'+esc(d)+'" data-q="h0" '+(off?'disabled':'')+' style="'+E+';width:118px">'+
            optHoras(cf.h0||val('cvH0'))+'</select>'+
          '<select data-chd="'+esc(d)+'" data-q="h1" '+(off?'disabled':'')+' style="'+E+';width:118px">'+
            optHoras(cf.h1||val('cvH1'))+'</select>'+
          '<button class="btn sm" type="button" data-choff="'+esc(d)+'">'+(off?'Apagado':'Activo')+'</button>'+
        '</div>';
      }).join('');
    $$('[data-chd]',c).forEach(function(sel){
      sel.onchange=function(){
        var d=sel.dataset.chd; CONV_HOR[d]=CONV_HOR[d]||{};
        CONV_HOR[d][sel.dataset.q]=sel.value; upd();
      };
    });
    $$('[data-choff]',c).forEach(function(b){
      b.onclick=function(){
        var d=b.dataset.choff; CONV_HOR[d]=CONV_HOR[d]||{};
        CONV_HOR[d].off=!CONV_HOR[d].off; pintaDias(); upd();
      };
    });
  }
  var ha=$('#cvHorAbrir');
  if(ha) ha.onclick=function(){
    var c=$('#cvDias'); if(!c) return;
    if(c.hasAttribute('hidden')){ c.removeAttribute('hidden'); pintaDias(); ha.classList.add('on'); }
    else { c.setAttribute('hidden',''); ha.classList.remove('on'); }
  };
  /* COPIAR LA DISTRIBUCIÓN. Se copia el horario de cada día POR POSICIÓN. Si la vieja tenía
     menos días, los que sobran se quedan con el horario general: lo normal es alargar una
     tanda, y apagarlos sería decidir por quien convoca. */
  var cp=$('#cvCopia');
  if(cp) cp.onchange=function(){
    var r=(REUS||[]).filter(function(x){ return String(x.id)===cp.value; })[0];
    if(!r){ CONV_HOR={}; pintaDias(); upd(); return; }
    var ds=dias(), F=r.franjas||[], bl=r.bloques||[];
    /* Solo se copia si las franjas de origen traen HORA. Las hay que no -formatos viejos, o
       una reunión que nunca llegó a tener rejilla-, y sin `ini` la cuenta sale de un cero y
       escribe un horario inventado (salían días de 00:00 a 01:00). Antes que eso, se dice. */
    var conHora=F.filter(function(f){ return f && f.ini; }).length;
    if(!conHora){
      cp.value='';
      tost('Esa reunión no tiene horario que copiar: sus franjas no traen hora.');
      return;
    }
    /* De los bloques se saca, por día, la primera y la última franja ofertada: eso ES su
       horario. Reconstruirlo así -y no guardarlo aparte- evita que las dos cosas discrepen. */
    var porDia={};
    bl.forEach(function(b){ if(!Array.isArray(b)) return;
      var d=b[0], f=b[1]; if(!F[f]) return;
      if(!porDia[d]) porDia[d]={a:f,b:f}; else { if(f<porDia[d].a) porDia[d].a=f; if(f>porDia[d].b) porDia[d].b=f; }
    });
    /* Una reunión SIN `bloques` no es una reunión sin horario: es una rectangular, donde
       todas las franjas se ofrecen todos los días. Sin este respaldo, copiar de una de esas
       no hacía nada y parecía que el botón estaba roto. */
    if(!Object.keys(porDia).length && F.length){
      var todo={a:0, b:F.length-1};
      (r.dias||ds).forEach(function(_,i){ porDia[i]=todo; });
    }
    CONV_HOR={};
    ds.forEach(function(d,i){
      var p=porDia[i]; if(!p) return;
      var ini=F[p.a].ini, finM=_horasHM_(F[p.b].ini)*60 + (+F[p.b].dur||60);
      CONV_HOR[d]={ h0:ini, h1:pad(Math.floor(finM/60))+':'+pad(Math.round(finM%60)) };
    });
    var c=$('#cvDias'); if(c && c.hasAttribute('hidden')){ c.removeAttribute('hidden'); if(ha) ha.classList.add('on'); }
    pintaDias(); upd();
    tost('Copiado el horario de «'+(r.titulo||r.id)+'» a '+Object.keys(CONV_HOR).length+' día(s).');
  };
  /* Cambiar las fechas rehace la tabla: si no, habla de días que ya no existen. */
  ['cvD0','cvD1','cvH0','cvH1'].forEach(function(id){
    var e=$('#'+id); if(!e) return;
    var antes=e.onchange;
    e.onchange=function(){ if(antes) antes.call(e); if(!$('#cvDias').hasAttribute('hidden')) pintaDias(); upd(); };
  });
  t.onchange=function(){
    /* Al cambiar el tipo se rehace la lista de convocados: es lo que espera cualquiera
       que elige «General» después de haber trasteado. Los tipos sin preset (consejo,
       mixta, trabajo) la dejan VACÍA a propósito, para que se elija a mano. */
    CONV_INV=new Set(_presetInvitados_(t.value)); pintaChips(); upd();
  };
  $$('[data-csub]').forEach(function(b){
    b.onclick=function(){
      b.classList.toggle('on');
      var u=b.dataset.csub, on=b.classList.contains('on');
      _activos_().forEach(function(m){ if(m.unidad===u && m.nombre!==ACTOR){
        if(on) CONV_INV.add(m.nombre); else CONV_INV.delete(m.nombre); } });
      pintaChips(); upd();
    };
  });
  $$('#cvPool [data-cinv]').forEach(function(b){
    b.onclick=function(){ var n=b.dataset.cinv;
      if(CONV_INV.has(n)) CONV_INV.delete(n); else CONV_INV.add(n);
      pintaChips(); upd(); };
  });
  ['cvD0','cvD1','cvH0','cvH1','cvSlot','cvDura'].forEach(function(id){
    var e=$('#'+id); if(e) e.onchange=upd; });
  upd();
  var bt=$('[data-convreu]');
  if(bt) bt.onclick=async function(){
    if(bt.disabled) return;
    var ds=dias(); if(!ds.length){ tost('Revisa las fechas: no hay días.'); return; }
    if(!CONV_INV.size){ tost('No has convocado a nadie.'); return; }
    var sl=+val('cvSlot')||30, du=+val('cvDura')||60;
    var u=_genUnion_(rangos(), sl), bloques=[];
    u.perDia.forEach(function(idxs,d){ idxs.forEach(function(fi){ bloques.push([d,fi]); }); });
    if(!u.F.length || !bloques.length){ tost('Con ese horario no sale ninguna casilla.'); return; }
    var nS=_slotsMin_(du,sl);
    /* Si el horario no da para la reunión entera, NADIE podrá marcar y la reunión nace
       muerta. Se avisa una vez y se deja convocar igual: puede ser a propósito. */
    if(u.F.length<nS && !bt.dataset.avisado){
      bt.dataset.avisado='1';
      tost('Ojo: el horario no da para '+_durTxt_(nS*sl)+' seguidos, así que nadie podrá '+
        'marcar. Pulsa otra vez para convocarla igual.');
      return;
    }
    var reu={ titulo:(val('cvTit')||'').trim()||'Reunión sin título',
      tipo:val('cvTipo')||'trabajo', modalidad:val('cvMod')||'hibrida',
      convocante:ACTOR||'', invitados:Array.from(CONV_INV),
      dias:ds, franjas:u.F, bloques:bloques, total:bloques.length,
      limite:val('cvLim')||null,
      /* `duracion` va REDONDEADA al múltiplo de casilla, igual que en el móvil: es lo que
         hay que juntar seguido para que valga, no la duración cruda. Si aquí se mandara
         la cruda, el mínimo al cubrir saldría distinto en cada cara. */
      slot:sl, duracion:nS*sl,
      ordenDia:(val('cvOrden')||'').trim(), vision:'anonima', resp:{} };
    if(!backendOK || !SESION){ tost('Sin conexión no se puede convocar.'); return; }
    if(!confirm('Convocar «'+reu.titulo+'» a '+reu.invitados.length+' personas.'+
      String.fromCharCode(10,10)+'Les tocará cubrir su disponibilidad, y de no cubrirla '+
      'salen sanciones.')) return;
    bt.disabled=true; var prev=bt.textContent; bt.textContent='Convocando…';
    try{
      await api.crear(reu);
      CONV_INV=null; CONV_HOR={};                     // la siguiente empieza limpia
      tost('Reunión convocada · '+reu.invitados.length+' convocados, '+bloques.length+' bloques.');
      /* Se RECARGA del servidor en vez de fabricar una copia local: así no se enseña algo
         que en la nube no está. Se conservan las respuestas ya hidratadas —la lista NO las
         trae, viven en su propia hoja— o los mapas de calor se quedarían a cero. */
      var lista=await api.listar();
      if(Array.isArray(lista) && lista.length){
        var prevResp={}; REUS.forEach(function(x){ if(x && x.resp && Object.keys(x.resp).length) prevResp[x.id]=x.resp; });
        REUS.length=0;
        lista.map(normReu).forEach(function(r){ if(prevResp[r.id]){ r.resp=prevResp[r.id]; r.calor=null; } REUS.push(r); });
      }
      pintar();
    }catch(e){ bt.disabled=false; bt.textContent=prev;
      tost('No se pudo convocar: '+((e&&e.message)||e)); }
  };
}

function _fijarPanel_(){
  if(!REUS.length) return '';
  var opts=REUS.map(function(r,i){
    return '<option value="'+i+'">'+esc(r.tit||r.titulo||('Reunión '+r.id))+'</option>'; }).join('');
  var r=REUS[Math.min(RE_SEL, REUS.length-1)]||REUS[0];
  var E=CAMPO_CSS;
  var lab=function(t){ return '<span class="sc" style="display:block;margin-bottom:5px">'+t+'</span>'; };
  var dias=(r.dias||[]).map(function(d,i){ return '<option value="'+i+'">'+esc(d)+'</option>'; }).join('');
  var fr=(r.franjas||[]).map(function(f,i){
    return '<option value="'+i+'">'+esc(_iniF(f))+'</option>'; }).join('');
  return pan('Fijar fecha y orden del día', r.fijada?('fijada · '+esc(r.fijada)):'sin fijar',
    '<div class="pb">'+
    '<p style="margin:0 0 12px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
      'Elige el hueco con el mapa de calor delante. Al fijarla, la disponibilidad se cierra '+
      'y el hueco elegido sale <b>en verde</b> en el mapa de todo el mundo.</p>'+
    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end;margin-bottom:12px">'+
      '<label style="flex:2;min-width:190px">'+lab('Reunión')+
        '<select id="reSel" style="'+E+'">'+opts+'</select></label>'+
      '<label style="width:130px">'+lab('Día')+'<select id="reDia" style="'+E+'">'+dias+'</select></label>'+
      '<label style="width:120px">'+lab('Desde')+'<select id="reF0" style="'+E+'">'+fr+'</select></label>'+
      '<label style="width:120px">'+lab('Hasta')+'<select id="reF1" style="'+E+'">'+fr+'</select></label>'+
      '<button class="btn pri" data-fijar>Fijar</button>'+
      (r.fijada?'<button class="btn" data-desfijar style="color:var(--warn);border-color:var(--warn)">Cancelar fijado</button>':'')+
    '</div>'+
    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end">'+
      '<label style="flex:1;min-width:240px">'+lab('Orden del día · enlace o texto')+
        '<input id="reOrden" value="'+esc(r.ordenDia||'')+'" placeholder="https://… o los puntos a tratar" style="'+E+'"></label>'+
      '<button class="btn" data-orden>Guardar orden del día</button>'+
    '</div></div>');
}

/* ═══ GEMELAS de movil.html: misma familia de horas, mismos nombres. ═══
   Aguantan 'HH:MM' y {ini:'HH:MM'}: antes cada sitio tenia su propio parser. */
function _minHM_(v){
  var t=(v && typeof v==='object') ? v.ini : v;
  var p=String(t==null?'':t).split(':');
  return (parseInt(p[0],10)||0)*60 + (parseInt(p[1],10)||0);
}

function _calorDe_(r, pond){
  if(!pond && Array.isArray(r.calor) && r.calor.length) return r.calor;      // semilla
  var nD=(r.dias||[]).length, nF=(r.franjas||[]).length;
  var cel=[]; for(var i=0;i<nD;i++){ cel.push(new Array(nF).fill(null)); }
  var nombres=Object.keys(r.resp||{}).filter(function(n){ return Array.isArray(r.resp[n]); });
  (r.bloques||[]).forEach(function(b,i){
    if(!Array.isArray(b)) return;
    var d=b[0], f=b[1];
    if(!(cel[d]) || f<0 || f>=nF) return;
    var n=0; nombres.forEach(function(nm){ var v=+r.resp[nm][i]||0; if(v>0) n+= (pond? v : 1); });
    cel[d][f]=n;
  });
  return cel;
}

/* etiqueta de franja: el dato real las trae como {ini,dur}; la semilla, como string */
function _iniF(f){ return (f&&typeof f==='object') ? String(f.ini||'') : String(f||''); }

function _duF(f){ return (f&&typeof f==='object') ? (+f.dur||60) : 60; }

function _pctMinimo_(iso){
  var mes=null;
  var m=String(iso||'').match(/^(\d{4})-(\d{2})/);
  if(m) mes=+m[2];
  if(mes==null) mes=new Date().getMonth()+1;
  return MESES_MINIMO_BAJO.indexOf(mes)>=0 ? 0.25 : 0.30;
}

function _minimoExigido_(r){
  var tot = r.total || (r.bloques||[]).length || 0;
  var ref = r.fecha || r.limite || (typeof DATA!=='undefined'?DATA.generado:'');
  return Math.max(1, Math.round(tot*_pctMinimo_(ref)));
}

function _etiquetaMinimo_(r){
  var pct=Math.round(_pctMinimo_(r.fecha||r.limite||DATA.generado)*100);
  return _minimoExigido_(r)+' franjas ('+pct+' % de '+(r.total||(r.bloques||[]).length||0)+')';
}

/* quien ha cubierto, quien no y cuantos estaban convocados — derivado, no inventado */
function _cobertura_(r){
  var resp=r.resp||{};
  var cubren=Object.keys(resp).filter(function(n){ return Array.isArray(resp[n]); });
  var universo = (r.invitados&&r.invitados.length) ? r.invitados
               : (r.tipo==='general' ? _activos_().map(function(m){return m.nombre;}) : cubren);
  /* el convocante organiza: esta exento de cubrir su propia encuesta */
  universo = universo.filter(function(n){ return n!==r.convocante; });
  var sin = universo.filter(function(n){ return cubren.indexOf(n)<0; });
  var minimo = r.minimo!=null ? r.minimo : _minimoExigido_(r);
  var bajo = cubren.filter(function(n){
    var v=resp[n]||[]; var c=0; v.forEach(function(x){ if((+x||0)>0) c++; });
    return c>0 && c<minimo && n!==r.convocante;
  });
  return {cubren:cubren.length, conv:universo.length, sinCubrir:sin, bajoMin:bajo, minimo:minimo};
}

async function _hidratarReus_(){
  if(typeof backendOK==='undefined' || !backendOK || !SESION) return;
  for(var i=0;i<REUS.length;i++){
    var r=REUS[i];
    if(r.resp && Object.keys(r.resp).length) continue;
    try{
      var d=await api.get(r.id);
      if(d && d.resp){ r.resp=d.resp; r.calor=null; }   // calor null: se recalcula con las respuestas
    }catch(_){ /* una reunion que no se puede leer no debe tumbar el resto */ }
  }
  try{ pintar(); }catch(_){}
}

