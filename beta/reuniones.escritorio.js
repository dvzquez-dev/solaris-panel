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
    /* ⛔ `creado` SE TIRABA AQUI, y con el el tercer eslabon de la cadena con la que se
       elige el porcentaje del periodo. El motor SI lo usa (`construir_reunion.py:79`), asi
       que una reunion fijada sin limite se juzgaba con un mes en la pantalla y otro en el
       motor -- y con 8 casillas, errar el mes mueve el minimo tanto como erraba el redondeo.
       ⚠️ `fecha` se queda aunque HOY no llegue nunca: el motor tambien la prueba primero, y
       dos cadenas identicas es justo lo que se persigue. */
    total:r.total||0, resp:r.resp||{}, nResp:r.nResp||0, fecha:r.fecha||null,
    creado:r.creado||null,
    ordenDia:r.ordenDia||"", vision:r.vision||"anonima",
    /* ⛔⛔ `agregado` SE TIRABA AQUI, y con el la unica señal de que el servidor NO ha
       mandado las demas filas. Daniel (15/08): *«Oculta: solo quien convoca ve cualquier
       cosa. O sea, el resto solo puede cubrir su disponibilidad y ya esta.»* El backend
       lo cumple —manda `agregado:false` y solo TU fila—; esta cara no lo miraba ni una
       vez, asi que derivaba el mapa, el recuento y **una lista NOMINAL de quien no ha
       cubierto, con su chip de sancion**, a partir de gente cuyas filas nunca llegaron.
       ⚠️ `!== false` y no `|| true`: un backend viejo que no manda el campo tiene que
       seguir viendo el agregado. Es la misma forma que usa el movil (`_normReuM_`).
       ⛔ Y es el mismo fallo que ya se arreglo aqui con `slot`/`duracion` tres lineas mas
       abajo: un campo que se tira al normalizar no da error, deja un hueco. */
    agregado:r.agregado !== false,
    /* `slot` (la casilla que se pinta) y `duracion` (lo que hay que juntar seguido), con
       EL MISMO respaldo que el movil (`_normReuM_`). Aqui se TIRABAN los dos, asi que el
       panel de fijar no tenia con que exigir el minimo: se podia fijar una reunion de 1 h 30
       en media hora **sin un aviso**. Y esta es la cara donde se fija. */
    slot:+r.slot || ((Array.isArray(r.franjas)?r.franjas:[])[0] && +r.franjas[0].dur) || 60,
    duracion:+r.duracion || 0,
    fijada:_labelFijada_(r.fijada), fijadaBl:_bloquesFijada_(r),
    /* ⛔ EL SELLO DE PROCEDENCIA, y existe por una acción irreversible. Las tres reuniones de
       la SEMILLA (`var REUS=[…]` en `escritorio.html`) llevan `id` 1, 2 y 3, que son **ids
       reales en la hoja del backend**. Y la semilla sigue en pantalla con una sesión de
       verdad más rato del que parece: por la rama de `quienSoy` —la que corre cuando el
       bootstrap no contesta— `REUS` no se toca hasta el primer `_refrescoVivo_`, y ése
       conserva lo viejo si la lista llega vacía. Sin este sello, «Eliminar» sobre la
       reunión 1 inventada borraría la reunión 1 de verdad, con las respuestas de todo el
       equipo dentro. Mismo patrón que el `_fuera:true` de `_m()`: una marca que dice de
       dónde salió el objeto. */
    _srv:true}; }

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

/* ⛔ `_genUnion_` VIVE EN `comun.js` (07/08), que cargan las dos caras. Estaba
   aqui y en la otra cara con el MISMO cuerpo. No se declara aqui: dos globales con
   el mismo nombre y el navegador se queda con la ultima que cargue, sin dar error. */


/* EQUIVALENTE · movil.html — convocados por defecto según el tipo. Aquí «yo» es ACTOR (la
   identidad con la que se está actuando), no `YO`: es la única diferencia y va marcada. */
function _presetInvitados_(tipo){
  var yo=ACTOR||'', out=[];
  /* ⛔⛔ ESTA RAMA FALTABA, Y EL COMENTARIO DE `t.onchange` AFIRMABA QUE ESTABA. Se
     arregló el móvil el 15/08 —el Consejo no estaba «por configurar»: Daniel dio los diez
     nombres el 22/07 y viven en `CONSEJO_PUSH`—, se escribió la nota en las DOS caras y
     el código sólo en una. Aquí «Consejo» caía en el `false` de abajo y convocar una
     reunión de consejo **no invitaba a nadie**, en la cara donde convoca la coordinación.
     ⚠️ La lista llega en el panel (`DATA.consejo`) y NO se copia aquí: dos copias de la
     misma verdad acaban siendo dos verdades. Si el panel no la trae —backend viejo—, se
     devuelve vacío y se pone a mano: se degrada, no se inventa.
     ⚠️ Y se cruza con los ACTIVOS, como los demás tipos: sin eso, el consejo sería el
     único que invita a gente dada de baja. */
  if(tipo==='consejo'){
    var cons=(typeof DATA!=='undefined' && DATA && DATA.consejo) || [];
    _activos_().forEach(function(m){
      if(m.nombre===yo) return;
      for(var i=0;i<cons.length;i++) if(String(cons[i])===String(m.nombre)){ out.push(m.nombre); return; }
    });
    return out;
  }
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
  /* ⛔ UN MIEMBRO RASO SÍ CONVOCA — reunión de trabajo, y nada más. Aquí ponía
     `if(rangoNom(ACTOR)<1) return ''` y el panel entero desaparecía, mientras el MÓVIL se
     lo ofrecía a los 27 con solo cambiar la etiqueta. El que manda es el backend, y **sí
     le admite**: le degrada el tipo a `trabajo` en vez de negarle.
     ⚠️ Y NO basta con quitar el candado: el selector ofrece los seis tipos. Un raso
     elegiría «General», el servidor se lo cambiaría a `trabajo` **en silencio**, y eso es
     peor que no ofrecerlo — se convoca creyendo que va todo el equipo. Se le ofrece
     **solo lo que el servidor le va a conceder**. */
  var _coord = rangoNom(ACTOR) >= 1;
  var E=CAMPO_CSS;
  var lab=function(t){ return '<span class="sc" style="display:block;margin-bottom:5px">'+t+'</span>'; };
  /* ⚠️ Y el preset arranca por el tipo que ESA persona puede convocar: con `'general'`
     fijo, un raso abría el panel con las 32 marcadas para una reunión de trabajo. */
  if(CONV_INV===null) CONV_INV=new Set(_presetInvitados_(_coord ? 'general' : 'trabajo'));
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
        (_coord ? ('<option value="general">General · todo el equipo</option>'+
        '<option value="junta">Junta Directiva · coordinación</option>'+
        '<option value="consejo">Consejo</option>'+
        '<option value="subsistema">Subsistema · tu unidad</option>'+
        '<option value="mixta">Mixta · varios subsistemas</option>') : '')+
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
       que elige «General» después de haber trasteado. ⚠️ Desde el 15/08 **consejo SÍ
       tiene preset** (los diez de `DATA.consejo`, ver `reuniones.movil.js`); los que
       siguen sin él son mixta y trabajo. Los tipos sin preset (
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
      tostErr('No se pudo convocar: ', e); }
  };
}


/* ── CONTESTAR TU DISPONIBILIDAD DESDE EL ESCRITORIO ───────────────────────────────────
   ⛔ EL HUECO QUE ESTO CIERRA: `api.responder` estaba declarada y no la llamaba NADIE.
   `_presetInvitados_('junta')` son **coordinadores + PD** -- la poblacion exacta de esta
   cara --, y no cubrir una de junta o consejo es **1 punto plano, siempre**. O sea que el
   que gobierna no podia contestar desde aqui la unica reunion que siempre le cuesta un
   punto a el: tenia que sacar el movil.
   ⚠️ LOS INDICES VAN SIN REORDENAR, y esto es lo que no se puede tocar: `_ordenarFranjas_`
   REMAPEA los indices de franja para pintar, y `responder` espera `valores` alineado a la
   POSICION de `bloques` tal y como los tiene la reunion. Alinearlo al objeto reordenado
   guardaria tu disponibilidad en OTRA HORA -- le paso a la Reunion General, donde el indice
   4 pasaba de las 22:00 a las 14:00. Se pinta ordenado igualmente porque el eje se calcula
   por MINUTOS.
   ⚠️ El ciclo por modalidad es el del movil y es decision cerrada: telematica 0↔1 ·
   presencial 0↔2 · hibrida 0→1→2→0. Aqui no se re-decide. */
var MIDISP = {};        /* id de reunion -> array alineado a `bloques` (0/1/2), lo que llevas sin guardar */

function _puedoCubrir_(r){
  if(!r || r.fijada) return false;                     /* fijada = ya no se contesta */
  var yo = (typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '';
  if(!yo) return false;
  /* ⛔ SIN LISTA DE INVITADOS, LA REUNION ES DE TODOS — y aqui se leia como «de nadie», asi que
     el panel devolvia '' y NADIE podia cubrirla desde el escritorio. Lo peor es que la misma
     pantalla, tres centimetros mas abajo, te nombra en «sin cubrir» con la sancion que te
     caeria: `_cobertura_` (mismo fichero) hace `universo = inv.length ? inv : _activos_()`.
     🔁 Y no hace falta una reunion vieja para caer aqui: `normReu` pone `invitados:[]` siempre
     que la lista no venga en el array del servidor.
     ⚠️ El gemelo de TURNOS ya lo tenia resuelto (`_miTurnoCv_`: `!inv.length || …`) y con su
     caso. Se copia la regla, no se inventa otra: el movil dice lo mismo — «sin lista se
     mantiene el comportamiento de siempre: todos». */
  var inv = r.invitados||[];
  if(!inv.length) return true;
  for(var i=0;i<inv.length;i++) if(String(inv[i])===yo) return true;
  return false;
}

function _misValores_(r){
  var yo = (typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '';
  if(MIDISP[r.id]) return MIDISP[r.id];
  var prev = (r.resp && r.resp[yo]) || [];
  return (r.bloques||[]).map(function(_,i){ return +prev[i] || 0; });
}

/* El siguiente valor de una celda, segun la modalidad. Copiado tal cual de
   `reuniones.movil.js:614`: es la MISMA regla, no una version del escritorio. */
function _sigValor_(cur, modo){
  return modo==='presencial'  ? (cur===2?0:2)
       : modo==='telematica'  ? (cur===1?0:1)
       : ((cur||0)+1)%3;
}

/* ⛔⛔ QUE HACE UN CLIC SOBRE TU DISPONIBILIDAD — y por qué vive aquí y no dentro del
   `onclick`. Es una regla con consecuencias reales: de estas casillas come el pipeline de
   sanciones (`flujos/reunion_a_votos.py` cuenta las que valen ≥1 y `flujos/sanciones.py` hace
   `cubrio_minimo = voto and bloques >= minimo`). Metida en un manejador anónimo **no la puede
   ejecutar ningún banco**, y lo único que quedaría es mirarla por fuente.

   ⛔ EL MÍNIMO VA A LA DERECHA DEL CLIC, igual que en el móvil (decisión de Daniel: el hueco
   nace donde pones el dedo y se lleva lo que dura la reunión). Aquí NO había **nada**: se
   marcaba media hora suelta para una reunión de hora y media, se guardaba, y ni podías ir ni
   te lo decía nadie. Estirar a partir de ahí es libre.

   Devuelve `{vals, cortas, minS, slot}`, o `{vals:null, nocabe:<minutos>}` cuando la reunión
   entera no entra desde ahí — se **rechaza y se dice**, nunca se estira hacia atrás: mover la
   marca a una hora que la persona no ha pedido es inventarle disponibilidad. */
function _clicDispo_(r, bi, vals){
  var bl = (r && r.bloques || [])[bi];
  if(!bl) return null;
  var out = (vals || []).slice();
  var nuevo = _sigValor_(+out[bi] || 0, r.modalidad || 'hibrida');
  var minS = _slotsMin_(r.duracion, r.slot), slot = +r.slot || 60;
  /* indice de bloque a partir de (dia, franja): `bloques` es la lista de lo OFERTADO */
  var pos = {}; (r.bloques || []).forEach(function(x, i){ pos[x[0] + '_' + x[1]] = i; });
  var q, j;
  if(nuevo !== 0){
    var idx = [];
    for(q = 0; q < minS; q++){
      j = pos[bl[0] + '_' + (bl[1] + q)];
      if(j == null) return {vals:null, nocabe:minS * slot, cortas:0, minS:minS, slot:slot};
      idx.push(j);
    }
    for(q = 0; q < idx.length; q++) out[idx[q]] = nuevo;
  } else {
    out[bi] = 0;
  }
  /* ⛔ Y LO QUE QUEDA CORTO SE QUITA, con el mismo cálculo que el teléfono: al apagar una
     celda del medio, lo que sobra a los lados deja de servir para nada. */
  var cortas = _rachasCortas_((r.dias || []).length, (r.franjas || []).length, minS,
    function(dd, ff){ var k = pos[dd + '_' + ff]; return k != null && (+out[k] || 0) > 0; });
  cortas.forEach(function(x){
    for(var f = x[1]; f <= x[2]; f++){ var k = pos[x[0] + '_' + f]; if(k != null) out[k] = 0; }
  });
  return {vals:out, nocabe:0, cortas:cortas.length, minS:minS, slot:slot};
}

function _miDispoPanel_(r){
  if(!_puedoCubrir_(r)) return '';
  /* ⛔ CON EL PLAZO CERRADO SE VE PERO NO SE TOCA. El servidor rechaza la respuesta
     (`Codigo.gs:4582`) y esta cara no preguntaba nada: dejaba repintar la rejilla entera y
     sólo al pulsar «Guardar» salía un error crudo. Se enseña igual —lo marcado es lo que
     consta y hay derecho a verlo— pero sin celdas pulsables y sin botón que prometa. */
  var _cerrado = !_plazoAbierto_(r.limite);
  var vals=_misValores_(r), modo=r.modalidad||'hibrida';
  /* indice de bloque a partir de (dia, franja): `bloques` es la lista de lo OFERTADO */
  var pos={}; (r.bloques||[]).forEach(function(b,i){ pos[b[0]+'_'+b[1]]=i; });
  var _t0=Math.min.apply(null, r.franjas.map(_minHM_));
  var _t1=Math.max.apply(null, r.franjas.map(function(f){ return _minHM_(f)+_duF(f); }));
  var _paso=0; r.franjas.forEach(function(f){ _paso=_mcd_(_paso,_minHM_(f)); _paso=_mcd_(_paso,_duF(f)); });
  _paso=Math.max(15, Math.min(60, _paso||60));
  var _eje=[]; for(var _t=_t0; _t<_t1; _t+=_paso) _eje.push(_t);
  var COL=['transparent','var(--tel)','var(--red)'];
  var g='<div class="heat"><div class="hg" style="grid-template-columns:auto repeat('+_eje.length+',minmax(20px,1fr))">';
  g+='<div class="hc"></div>';
  _eje.forEach(function(t){ g+='<div class="hc rh">'+((t%60===0)?'<span>'+pad(Math.floor(t/60)%24)+'</span>':'')+'</div>'; });
  r.dias.forEach(function(d,di){
    g+='<div class="hc rd">'+d+'</div>';
    var ix=0;
    while(ix<_eje.length){
      /* que franja ofertada cubre este instante de este dia */
      var fi=-1, t=_eje[ix];
      for(var q=0;q<r.franjas.length;q++){
        if(pos[di+'_'+q]==null) continue;
        var a=_minHM_(r.franjas[q]);
        if(t>=a && t<a+_duF(r.franjas[q])){ fi=q; break; }
      }
      var k=1;
      while(ix+k<_eje.length){
        var t2=_eje[ix+k], fi2=-1;
        for(var q2=0;q2<r.franjas.length;q2++){
          if(pos[di+'_'+q2]==null) continue;
          var a2=_minHM_(r.franjas[q2]);
          if(t2>=a2 && t2<a2+_duF(r.franjas[q2])){ fi2=q2; break; }
        }
        if(fi2!==fi) break;
        k++;
      }
      var geo='grid-column:span '+k;
      if(fi<0){ g+='<div class="cel" style="'+geo+';background:transparent"></div>'; }
      else{
        var bi=pos[di+'_'+fi], v=+vals[bi]||0;
        /* Sin `data-mid` no hay cable: `_cablearMiDispo_` no la engancha y no se puede pulsar. */
        g+='<div class="cel'+(_cerrado?'':' mid')+'"'+(_cerrado?'':' data-mid="'+r.id+'" data-bi="'+bi+'"')+' title="'+
          _hmMin_(_minHM_(r.franjas[fi]))+'\u2013'+_hmMin_(_minHM_(r.franjas[fi])+_duF(r.franjas[fi]))+'" style="'+
          geo+';cursor:'+(_cerrado?'default':'pointer')+';background:'+COL[v]+'"></div>';
      }
      ix+=k;
    }
  });
  g+='</div></div>';
  var ley = modo==='presencial' ? '<span><i style="background:var(--red)"></i>presencial</span>'
          : modo==='telematica' ? '<span><i style="background:var(--tel)"></i>telem\u00e1tica</span>'
          : '<span><i style="background:var(--red)"></i>presencial + telem\u00e1tico</span><span><i style="background:var(--tel)"></i>solo telem\u00e1tico</span>';
  var sucio = !!MIDISP[r.id];
  return '<div class="micub" style="margin:0 0 15px">'+
    '<h4 class="sc" style="margin:0 0 7px">Tu disponibilidad</h4>'+g+
    '<div class="leg" style="margin-top:6px">'+ley+'</div>'+
    (_cerrado
      ? '<p class="rnota" style="margin:9px 0 0;color:var(--warn)">El plazo cerró: esto es lo que '+
        'quedó marcado y ya no se puede cambiar — el servidor no acepta respuestas fuera de plazo.</p>'
      : '<div style="margin-top:9px;display:flex;gap:9px;align-items:center">'+
      '<button class="pri" data-midguardar="'+r.id+'"'+(sucio?'':' disabled')+'>Guardar mi disponibilidad</button>'+
      /* ⛔ EL MINIMO SE DICE ANTES DE PULSAR. El movil lo pone en su contador («cada toque
         marca …»); aqui no se decia en ningun sitio, asi que el primer clic marcaba tres
         casillas de golpe sin que nadie lo hubiera anunciado. */
      /* ⛔ Y AQUÍ TAMBIÉN EL MÍNIMO SIN SANCIÓN, que esta cara no decía en ningún sitio: el
         número sólo salía en el panel de riesgo, que es la vista del que coordina. Quien cubre
         tiene que verlo MIENTRAS marca. Avisa; no impide (decisión de Daniel, 18/08). */
      (function(){
        var _n=0, _k; for(_k=0;_k<vals.length;_k++) if((+vals[_k]||0)>0) _n++;
        var _a=_avisoMinimo_(_n, _minimoExigido_(r));
        return _a.txt ? ('<small'+(_a.falta?' style="color:var(--warn)"':' style="color:var(--ink2)"')+
          '>'+_a.txt+'</small>') : '';
      })()+
      '<small style="color:var(--ink2)">'+(sucio?'tienes cambios sin guardar'
        :('haz clic en las celdas para marcar cu\u00e1ndo puedes'+
          (_slotsMin_(r.duracion, r.slot)>1
            ? (' \u00b7 cada clic marca '+_durTxt_(_slotsMin_(r.duracion, r.slot)*(+r.slot||60))+', que es lo que dura')
            : '')))+'</small>'+
    '</div>')+'</div>';
}

/* Cablea las celdas y el boton. Se llama desde `pintar()`; si la vista no lo pinta, no hace nada. */
function _cablearMiDispo_(){
  $$('[data-mid]').forEach(function(c){
    c.onclick=function(){
      var id=c.dataset.mid, bi=+c.dataset.bi;
      var r=null; for(var i=0;i<REUS.length;i++) if(String(REUS[i].id)===String(id)){ r=REUS[i]; break; }
      if(!r) return;
      var d=_clicDispo_(r, bi, _misValores_(r));
      if(!d) return;
      /* ⛔ Se RECHAZA y se dice, no se estira hacia atras: mover la marca a una hora que la
         persona no ha pedido es inventarle disponibilidad, y de aqui salen sanciones. */
      if(d.nocabe){
        tost('Ahí no entra la reunión entera ('+_durTxt_(d.nocabe)+'): el horario de ese día acaba antes.');
        return;
      }
      MIDISP[r.id]=d.vals;
      pintar();
      var av=_avisoCorto_(d.cortas, d.minS, d.slot); if(av) tost(av);
    };
  });
  $$('[data-midguardar]').forEach(function(b){
    b.onclick=async function(){
      if(b.disabled) return;
      /* ⛔ NO SE CONTESTA POR NADIE. El backend honra el `nombre` cuando quien llama es
         admin, asi que esto escribia ENCIMA de la disponibilidad de otra persona -- y a
         esa persona le vuelve «te falta cubrir» con su sancion detras. La regla ya estaba
         escrita 45 lineas mas abajo, en `_puedeBorrarReuE_`. */
      if(typeof _identidadPrestada_==='function' && _identidadPrestada_(
           (typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '')){
        tost('Est\u00e1s actuando como otra persona: no se contesta por nadie.');
        return;
      }
      var id=b.dataset.midguardar, r=null;
      for(var i=0;i<REUS.length;i++) if(String(REUS[i].id)===String(id)){ r=REUS[i]; break; }
      if(!r) return;
      /* ⛔ Y AQUI TAMBIEN, aunque el boton no deberia existir: entre pintar y pulsar puede
         haber entrado un refresco, y el plazo vence solo. Una guarda que solo vive en el
         pintado es un rotulo -- la que decide se pregunta al PULSAR. */
      if(!_plazoAbierto_(r.limite)){
        tost('El plazo cerr\u00f3 el '+_plazoTxt_(r.limite)+': el servidor ya no acepta respuestas.');
        return;
      }
      var vals=_misValores_(r);
      b.disabled=true; var t=b.textContent; b.textContent='Guardando\u2026';
      try{
        /* ⚠ Lo que VIAJA es la identidad de la SESION, no la que se mira. Defensa en
           profundidad: aunque el bloqueo de arriba fallara, se escribiria en TU fila. */
        var _quien=(typeof _actorSanc_==='function') ? _actorSanc_() : ((typeof ACTOR!=='undefined' && ACTOR) ? String(ACTOR) : '');
        await api.responder(r.id, _quien, vals);
        if(!r.resp) r.resp={};
        r.resp[_quien]=vals;
        delete MIDISP[r.id];                       /* ya no hay nada sin guardar */
        /* ⛔ SE GUARDA IGUAL Y SE AVISA, como en el móvil: entregar menos es una opción, pero
           nadie puede enterarse de la propuesta de puntos al día siguiente. */
        var _gn=0, _gi; for(_gi=0;_gi<vals.length;_gi++) if((+vals[_gi]||0)>0) _gn++;
        var _gav=_avisoMinimo_(_gn, _minimoExigido_(r));
        tost(_gav.falta
          ? ('Guardado: '+_gn+' franja'+(_gn===1?'':'s')+'. Ojo, '+_gav.txt+' \u2014 por debajo se propone Art. 29i.')
          : 'Disponibilidad guardada.');
        pintar();
      }catch(e){
        /* ⛔ UNA ESCRITURA QUE SE TRAGA SU ERROR ES TRABAJO PERDIDO EN SILENCIO: se avisa y
           se deja el boton vivo, y `MIDISP` NO se borra -- lo marcado sigue en pantalla para
           poder reintentar sin volver a pintarlo entero. */
        b.disabled=false; b.textContent=t;
        tost('No se pudo guardar: '+((e&&e.message)||e)+'. Vuelve a intentarlo.');
      }
    };
  });
}
/* ── ELIMINAR UNA REUNIÓN, DESDE LA CARA QUE LAS CONVOCA ──────────────────────────────
   ⛔ POR QUÉ EXISTE, y la pregunta seria era si debía existir. Borrar se lleva por delante la
   disponibilidad de otras personas y **no se deshace**: `_borrarReunion_` borra la fila de la
   reunión Y todas sus filas de `Respuestas`. Lo que decide que sí:
   · el riesgo **ya está aceptado** —el móvil borra desde el 06/08, contra el mismo backend—,
     así que no tenerlo aquí no protege: obliga a hacerlo en la pantalla donde peor se lee
     cuánta gente pierde su trabajo;
   · **quien convoca está aquí** (`convocarReunionPanel` pide rango >= 1) y el backend deja
     borrar al **convocante o admin**: es casi exactamente la población de esta cara;
   · y **sin la puerta la salida es peor**: con una reunión convocada por error, lo único que
     esta pantalla ofrecía era **fijarla** — cerrar la disponibilidad y afirmar una fecha que
     no existe. Se empujaba a mentir para tapar un error.

   ⛔ NO SE BLOQUEA LA FIJADA, a propósito. Un bloqueo aquí se rodea en diez segundos desde el
   móvil, que no lo tiene, y deja sin borrar una reunión cancelada después de fijarse. Se
   **avisa** en el `confirm` y decide quien la convocó. */

/* ⛔ ¿PUEDE BORRAR ESTA REUNIÓN? Es la regla del BACKEND —`_borrarReunion_` exige convocante o
   admin, **no rango**— porque un botón que ofrece lo que el servidor va a negar es peor que no
   tenerlo.
   ⛔ LA IDENTIDAD SALE DE LA SESIÓN (`_actorSanc_()`) Y NO DE `ACTOR`, que lo reescribe
   «Actúas como»: el backend gatea por **token**, así que con otra identidad puesta el botón
   hablaría de un permiso que ese token no tiene. Es el mismo motivo por el que `V.libros` y
   `_puedeCerrarMes_` ya usan `_actorSanc_()`.
   ⛔ Y EXIGE `_srv`: ver el sello en `normReu`. Los ids de la semilla son reales.
   GEMELA en la regla —que no en la identidad— de `_puedeBorrarReuM_` (`reuniones.movil.js`). */
function _puedeBorrarReuE_(r){
  if(!r || r.id==null || !r._srv) return false;
  if(typeof esAdmin==='function' && esAdmin()) return true;
  var yo=(typeof _actorSanc_==='function') ? _actorSanc_() : null;
  return !!(yo && r.convocante && String(yo)===String(r.convocante));
}

/* Cuánta gente pierde su disponibilidad si se borra. Se dice ANTES de preguntar: un «¿seguro?»
   que no dice qué se pierde no informa de nada, y lo que se pierde es trabajo de otros.
   ⛔ SE COGE EL MAYOR DE LAS DOS CUENTAS, y no la que haya. Son la misma magnitud —una fila
   por persona en `Respuestas`— medida en dos momentos: `nResp` la cuenta **el servidor** al
   listar y llega siempre; `resp` es el detalle que hidrata `_hidratarReus_`, que puede no
   haber llegado. Quedarse corto aquí es decir «no pierdes nada» justo antes de perderlo;
   pasarse solo hace mirar dos veces.
   ⚠️ Se cuentan las FILAS, igual que `_cobertura_` («han cubierto»), y no quien marcó algún
   hueco: contestar «no puedo ningún día» también es haber contestado, y también se borra. */
function _nRespReuE_(r){
  var n=0, resp=(r&&r.resp)||{}, k;
  for(k in resp){ if(Object.prototype.hasOwnProperty.call(resp,k) && Array.isArray(resp[k])) n++; }
  var srv=+((r&&r.nResp)||0);
  return n>srv ? n : srv;
}

/* La caja del botón. Devuelve '' si no te toca: el botón no se pinta gris, no se pinta. */
function _borrarReuBoxE_(r){
  if(!_puedeBorrarReuE_(r)) return '';
  var n=_nRespReuE_(r);
  return '<div style="margin-top:18px;border-top:1px solid var(--line);padding-top:13px">'+
    '<button class="btn" data-borrarreu="'+esc(r.id)+'" style="color:var(--red2);'+
      'border-color:var(--red)">Eliminar reunión</button>'+
    '<div class="nota" style="border-top:0;padding:9px 0 0">'+
      (n ? ('Se borra también la disponibilidad que ya cubrieron <b>'+n+'</b> persona'+
            (n===1?'':'s')+'.')
         : 'Según el servidor todavía no la ha cubierto nadie.')+
      ' <b>No se puede deshacer.</b></div></div>';
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
      'y el hueco elegido sale <b>en verde</b> en el mapa de todo el mundo.'+
      /* Se DICE el minimo antes de intentarlo: un aviso al pulsar llega tarde y se lee
         como un fallo de la app. Con reuniones de antes del modelo (`duracion` 0) el
         minimo es 1 y no se dice nada, que es como se comportaba siempre. */
      (_slotsMin_(r.duracion, r.slot)>1
        ? (' Dura <b>'+_slotsMin_(r.duracion, r.slot)+' franjas</b> ('+_durTxt_(r.duracion)+
           '), asi que no se puede fijar en menos.') : '')+'</p>'+
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
    '</div>'+
    _borrarReuBoxE_(r)+
    '</div>');
}

/* ⛔ `_minHM_` VIVE EN `comun.js` (07/08), que cargan las dos caras. Estaba aqui y en
   `reuniones.movil.js` con el MISMO cuerpo: `gemelas.py` las contaba pero no las nombraba,
   asi que nadie iba a por ellas. No se declara aqui: dos globales con el mismo nombre y el
   navegador se queda con la ultima que cargue. */


/* etiqueta de franja: el dato real las trae como {ini,dur}; la semilla, como string */
function _iniF(f){ return (f&&typeof f==='object') ? String(f.ini||'') : String(f||''); }

function _duF(f){ return (f&&typeof f==='object') ? (+f.dur||60) : 60; }

/* ⛔ `_pctMinimo_` Y `_minimoExigido_` VIVEN EN `comun.js` (18/08), que cargan las dos caras.
   Estaban aqui y su constante en `escritorio.html`, asi que el MOVIL no los tenia y quien
   cubre desde el telefono no veia nunca cuantas franjas se le exigen. Y el redondeo divergia
   del motor: `Math.round` contra `math.ceil`, 29 de 117 casos al 25 % y 47 de 117 al 30 %,
   siempre pidiendo UNA MENOS de la que el motor exige. No se declaran aqui: dos globales con
   el mismo nombre y el navegador se queda con la ultima que cargue. */

/* ⛔ LA CADENA VA POR `_refMinimo_`, no copiada. Esta función tenía la versión vieja de DOS
   eslabones tres líneas por debajo de la buena: hoy da lo mismo porque el primero y el
   tercero no llegaban, y es exactamente la copia que empieza a mentir el día que sí lleguen.
   ⛔⛔ Y HONRA `r.minimo` COMO `_cobertura_`. No lo hacía, así que la LISTA de quién está
   bajo mínimo se decidía con un número y el rótulo de al lado enseñaba otro — y con la
   semilla (que no trae `bloques` ni `total`) el rótulo salía **«0 franjas (25 % de 0)»**
   junto a un chip de «−1 punto». Un recuento imposible al lado de una acusación. */
function _etiquetaMinimo_(r){
  var tot=r.total||(r.bloques||[]).length||0;
  if(r.minimo!=null) return r.minimo+' franjas (lo fijó quien convoca)';
  var pct=Math.round(_pctMinimo_(_refMinimo_(r))*100);
  return _minimoExigido_(r)+' franjas ('+pct+' % de '+tot+')';
}

/* ⛔ UN RECUENTO QUE NO SE SABE SE PINTA «—», Y NUNCA EN VERDE.
   Con la reunion `oculta` el servidor no manda las demas filas, asi que `_cobertura_`
   devuelve `cubren`/`conv` a `null` (§3c-24: «no lo se» no es 0). Imprimirlos tal cual
   sacaba la palabra «null» en la tabla, y el `up` los pintaba de **verde de «cubierta
   entera»** porque `null===null` es cierto.
   ⛔ Son DOS funciones y no una a proposito: imprimir mal y colorear mal son mentiras
   distintas, y una sola puerta dejaria pasar la mitad sin que se notara. */
function _cifraCob_(v){ return v==null ? '\u2014' : String(v); }
function _claseCob_(cubren, conv){ return (cubren!=null && cubren===conv) ? 'up' : 'wa'; }

/* quien ha cubierto, quien no y cuantos estaban convocados — derivado, no inventado */
function _cobertura_(r){
  var resp=r.resp||{};
  /* ⛔ SIN AGREGADO NO HAY NADA QUE DERIVAR. Con `agregado:false` el servidor ha mandado
     SOLO TU FILA: cualquier cuenta hecha aqui sale de una AUSENCIA de datos, no de un
     dato. `sinCubrir` seria la lista de los otros 29 **con nombre y apellidos** y su chip
     de sancion, fabricada entera a partir de restar «los invitados» menos «los que tienen
     fila» — y fila solo llega la tuya.
     ⚠️ Se devuelven `null`s, NO listas vacias ni ceros: unas listas vacias dirian «nadie
     en riesgo», que es afirmar algo que no se sabe (§3c-24). Se conserva la FORMA para
     que los cuatro consumidores no revienten, y `oculto` es lo que miran para decidir
     que enseñar. */
  if(r && r.agregado === false)
    return {cubren:null, conv:null, sinCubrir:null, bajoMin:null,
            minimo:_minimoExigido_(r), oculto:true};
  var cubren=Object.keys(resp).filter(function(n){ return Array.isArray(resp[n]); });
  var universo = (r.invitados&&r.invitados.length) ? r.invitados
               : (r.tipo==='general' ? _activos_().map(function(m){return m.nombre;}) : cubren);
  /* el convocante organiza: esta exento de cubrir su propia encuesta */
  universo = universo.filter(function(n){ return n!==r.convocante; });
  /* ⛔⛔ Y LAS FILAS ANONIMIZADAS TAMPOCO SIRVEN PARA NOMBRAR A NADIE (18/08).
     La guarda de arriba cubre `oculta`. Falta su hermana: con `vision:'anonima'` el
     servidor conserva TU fila con tu nombre y renombra las ajenas a `#1`, `#2`…
     (`Codigo.gs:4566-4571`) **pero deja `agregado` en true**, asi que esto seguia
     derivando. Medido EJECUTANDOLO antes de tocar nada, con Carla cubriendo como `#1`:
         cubren=2 | conv=3 | sinCubrir=Carla+Dani | bajoMin=-
     O sea que a Carla, que CUBRIO DE SOBRA, la lista de riesgo la nombra con apellidos y
     le cuelga su chip de «sancion que implicaria». Y `bajoMin` puede sacar un `#1`, que
     no es nadie. Acusar a quien hizo lo que tenia que hacer es peor que no avisar.
     ⛔ NO SE REPLICA AQUI LA REGLA DE VISIBILIDAD -- eso serian dos criterios para la
     misma pregunta, y el backend lo prohibe por escrito («LA BANDERA VA EXPLICITA, y no
     se deduce en la cara»). Lo que se mira es si el DATO sirve: una clave de respuesta que
     no es NADIE del universo significa que las filas no son nominales, y sin filas
     nominales no se puede decir quien falta. Es una comprobacion de integridad, no una
     politica.
     ⚠️ Y SE CONSERVAN LOS RECUENTOS, al reves que en `oculta`, porque aqui SI se saben:
     con `oculta` llega **solo tu fila** y contar seria inventar; con `anonima` llegan
     todas y solo faltan los nombres. «2 de 3 han cubierto» es verdad y es util; lo unico
     que no se puede decir es QUIENES. Callar un dato que se tiene tambien es mentir. */
  var _sinNombre = cubren.filter(function(n){
    return n!==r.convocante && universo.indexOf(n)<0;
  });
  if(_sinNombre.length)
    return {cubren:cubren.length, conv:universo.length, sinCubrir:null, bajoMin:null,
            minimo:(r.minimo!=null ? r.minimo : _minimoExigido_(r)), oculto:true};
  var sin = universo.filter(function(n){ return cubren.indexOf(n)<0; });
  var minimo = r.minimo!=null ? r.minimo : _minimoExigido_(r);
  /* ⛔⛔ EL `c>0` ESCONDIA JUSTO A QUIEN EL MOTOR VA A SANCIONAR. Quien abre la encuesta,
     la deja entera a cero y guarda —«no puedo ningun dia»— tiene fila, asi que sale de
     `sinCubrir`; y con `c===0` salia tambien de `bajoMin`. **Se caia de las dos listas de
     riesgo**, y el panel remataba con «Nadie en riesgo».
     ⛔ Pero el motor SI lo coge: `flujos/reunion_a_votos.py:49` cuenta `(v or 0) >= 1`
     -> 0 bloques, y `flujos/sanciones.py:728` hace `cubrio_minimo = voto and bloques >=
     minimo` -> **False**. Al dia siguiente le encola una propuesta de puntos por no
     llegar al minimo, y el panel que existe para avisar ANTES es justo el que no le
     nombra. */
  var bajo = cubren.filter(function(n){
    var v=resp[n]||[]; var c=0; v.forEach(function(x){ if((+x||0)>0) c++; });
    return c<minimo && n!==r.convocante;
  });
  return {cubren:cubren.length, conv:universo.length, sinCubrir:sin, bajoMin:bajo, minimo:minimo};
}

/* REFRESCO EN VIVO DE LA REUNION QUE TIENES DELANTE (08/08).

   ⛔ POR QUE. `decisiones-app.md` [22/07]: *«Reuniones y revisiones de documentos -> refresco
   rapido (~9 s, polling de lo que tengas abierto)... esas dos son colaborativas en tiempo real
   (varios marcando a la vez)»*. El movil lo cumplia desde siempre; **el escritorio no**, y es
   justo la cara donde se mira el mapa de calor llenarse mientras la gente contesta.

   ⛔ Y no era «solo» que faltara el reloj: `_hidratarReus_` hace `continue` cuando la reunion
   YA trae respuestas, asi que una vez cargada **no se volvia a mirar nunca**. La rejilla se
   quedaba en el estado que tuviera al entrar, sin dar ninguna señal.

   Lo destapó `gemelas.py`: `_arrancarRefrescoVivo_` sale al 98 % entre las dos caras — mismo
   nombre, casi el mismo cuerpo. Ese 2 % era esta linea. */
/* Las claves de pantalla que ENSEÑAN una reunión, y por tanto las únicas donde vale la pena
   refrescarla. Son **claves del nav** (`GRUPOS` en `escritorio.html`), no el rótulo del grupo.

   ⛔ NACE DE UN FALLO DE VOCABULARIO QUE LLEVABA VIVO DESDE SIEMPRE. La guarda decía
      `vista!=='reuniones'`, y `'reuniones'` es el **rótulo** del grupo `['Reuniones',
      ['convoc','dispo','actas']]` — nunca el valor de `vista`. O sea que la condición era
      **siempre verdadera** y el refresco abortaba en su primera línea: **4.320 veces al día**
      sin hacer nada, y sin un solo error.
   ⛔ Y lo que se perdía no es cosmético: el mapa de calor, el contador de cobertura y la lista
      de quién no ha cubierto se quedaban con el dato **del momento del login**. Quien fija
      fecha y orden del día pulsa sobre un mapa viejo, y la lista de sancionables por no cubrir
      **puede señalar a alguien que ya contestó**.
   ✅ La gemela del móvil estaba bien desde siempre (`ST.vista!=='reu'`, y `'reu'` SÍ es una
      clave del nav): el escritorio copió la forma con el vocabulario equivocado. Es §3c-9 —
      cada cara, leída por separado, se lee perfecta.
   ⚠️ Va como FUNCIÓN y no como `var`: un módulo sólo lleva declaraciones `function`
      (ARRANQUE §5b), igual que `_pesoPerfil_`. */
function _vistasReuE_(){ return ['convoc','dispo','actas']; }

async function _refrescarReuAbiertaE_(){
  if(typeof backendOK==='undefined' || !backendOK || !SESION) return;
  if(_REFREU_E_ || document.hidden) return;
  /* solo lo que tienes delante: pedir la reunion mientras miras el cierre es cuota tirada.
     ⛔ Y las claves salen de `_vistasReuE_`, NO de una comparacion contra el rotulo del
     grupo: eso era lo que dejaba esta funcion muerta desde que existe. */
  if(typeof vista==='undefined' || _vistasReuE_().indexOf(vista)<0) return;
  /* ⛔ NO SE REPINTA MIENTRAS ALGUIEN ESCRIBE: aqui no hay modales, pero si formularios, y
     repintar le borra lo tecleado. Es la misma guardia que usa `_refrescoVivo_`. */
  if(typeof _escribiendoE_==='function' && _escribiendoE_()) return;
  var r = REUS[Math.min(RE_SEL, REUS.length-1)] || REUS[0];
  if(!r || r.id==null) return;
  _REFREU_E_=true;
  try{
    var d=await api.get(r.id);
    var resp=(d && d.resp) || null;
    if(!resp) return;
    var antes=_firmaResp_(r);
    var copia={resp:resp};
    /* Si nadie ha contestado nada nuevo NO se repinta: reconstruir la pantalla cada 20 s para
       dejarla igual se nota, y en un panel que vive abierto toda la tarde, molesta. */
    if(_firmaResp_(copia)===antes) return;
    r.resp=resp; r.calor=null;              // calor null: se recalcula con las respuestas
    /* ⛔ LA MISMA COMPARACION, OTRA VEZ, y esta no estaba fichada: la encontro un agente
       al medir la de arriba. Con las dos, el arreglo toca DOS lineas -- reparar solo la
       primera habria hecho que el refresco leyera el dato nuevo y NO repintara, o sea un
       arreglo que corre entero y no cambia nada en pantalla. */
    if(_vistasReuE_().indexOf(vista)>=0 && !(typeof _escribiendoE_==='function' && _escribiendoE_())) pintar();
  }catch(_){ /* una lectura que falla no puede tumbar el panel */ }
  finally{ _REFREU_E_=false; }
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

