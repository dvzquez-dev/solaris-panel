/* ═══ CIERRE · cara movil ═══════════════════════════════════════════════════════════
   5 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

function _fichaPlanHTML_(f){
  var filas=(f.c||[]).map(function(c){
    return '<div class="rl"><span>'+esc(c[0])+'</span>'+
      '<span class="ra">'+esc(_numPlan_(c[1]))+' → <b>'+esc(_numPlan_(c[2]))+'</b></span></div>';
  }).join('');
  var extra=[];
  if(f.mp) extra.push(esc(f.mp));
  if(f.cp) extra.push('pierde '+esc(_numPlan_(f.cp))+' h de compensación');
  if(f.est && f.est!=='normal') extra.push('queda <b>'+esc(f.est)+'</b>');
  return '<details class="plg"><summary><b>'+esc(f.n||'?')+'</b>'+
    (f.u?' <small>'+esc(f.u)+'</small>':'')+
    ' <small>· '+((f.c||[]).length)+' cambio'+(((f.c||[]).length)===1?'':'s')+'</small></summary>'+
    filas+(extra.length?'<p class="rnota">'+extra.join(' · ')+'</p>':'')+'</details>';
}

function _planHTML_(plan){
  var t=plan.totales||{}, fs=plan.fichas||[];
  var cuando=plan.calculado ? String(plan.calculado).slice(0,16).replace('T',' ') : '';
  var cab='<div class="rec">'+
    '<div class="rl"><span>Personas</span><span class="ra"><b>'+(t.personas||fs.length||0)+'</b></span></div>'+
    '<div class="rl"><span>Horas que se ponen a cero</span><span class="ra"><b>'+
      esc(_numPlan_(t.horas_a_cero||0))+' h</b></span></div>'+
    '<div class="rl"><span>Suben puntos</span><span class="ra"><b>'+(t.suben_puntos||0)+'</b></span></div>'+
    '<div class="rl"><span>Bajan puntos</span><span class="ra"><b>'+(t.bajan_puntos||0)+'</b></span></div>'+
    '<div class="rl"><span>Con infracción marcada</span><span class="ra"><b>'+(t.con_infraccion||0)+'</b></span></div>'+
    '</div>';
  var avisos=(plan.avisos||[]).length
    ? '<p class="rnota" style="color:var(--warn)"><b>'+plan.avisos.length+' aviso'+
      (plan.avisos.length===1?'':'s')+'</b>: '+esc(plan.avisos.slice(0,3).join(' · '))+'</p>'
    : '';
  /* ⛔ EL MISMO TRI-ESTADO QUE LA MITAD DE ABAJO, Y POR LA MISMA PUERTA.
     Esto decidia con `plan.aplicado` **a secas** mientras `_decidirCierreHTML_` decide con
     `plan.aplicado || plan.resultado`: **dos criterios sobre el mismo plan**. Y el aplicador
     produce de verdad los estados donde discrepan -- `aplicado` sale del REGISTRO, no de la
     pasada, y `resultado` se escribe SIEMPRE.
     ⛔ Medido el 13/08: con el aplicador parado a medias y las 32 descuadrando, arriba decia
     «**Todavia no se ha aplicado**… el boton esta abajo» y abajo «**PARADO A MEDIAS · 32
     descuadres**» — **y ningun boton**. Y en el caso parcial (20 escritas, 12 mal), arriba
     afirmaba «**Ya esta aplicado**» sobre un cierre que se paro.
     ✅ Tres estados y no dos, porque hay tres: **parado** manda sobre **aplicado**, y este
     sobre «todavia no». El escritorio ya lo hacia asi (§3c-9: lo que solo esta en una cara
     es el fallo que nadie ve). */
  var _hecho = !!(plan.aplicado || plan.resultado), _parado = !!plan.parado;
  /* ⛔ CUARTO ESTADO, y no es cosmetico: un cierre que acaba 25 de 32 decía «Ya está
     aplicado» porque `parado` solo mira descuadres y fallos -- un `ausente` no para al
     aplicador. Las 7 que faltan se quedan con la carga del mes sin poner a cero. */
  var _inc = _cierreIncompleto_(plan);
  var _estado = _parado ? '<b>Se paró a medias.</b> Hay fichas nuevas y viejas conviviendo.'
              : _inc   ? '<b>Aplicado a medias:</b> se escribieron '+_inc.hechas+
                         (_inc.de?' de '+_inc.de:'')+'. <b>Faltan '+_inc.faltan+'.</b>'
              : _hecho  ? '<b>Ya está aplicado.</b>'
                        : '<b>Todavía no se ha aplicado.</b>';
  return '<p class="rnota" style="margin:0 0 10px">Plan de <b>'+esc(_nomPeriodo_(plan.periodo))+'</b>'+
      (cuando?', calculado el '+esc(cuando):'')+'. '+_estado+'</p>'+
    cab+avisos+
    '<p class="rnota" style="margin:12px 0 4px">Qué le cambia a cada uno · toca para abrir</p>'+
    fs.map(_fichaPlanHTML_).join('')+
    /* ⛔ Y ESTE PIE MANDABA AL BOTON SIN MIRAR SI HAY BOTON. Decia «el boton esta
       abajo» tambien cuando el cierre esta **parado a medias**, que es justo el caso en que
       `_decidirCierreHTML_` **no pinta ninguno**: se lee como «te falta pulsar algo» cuando
       lo que hace falta es mirar por que se paro. Antes decia «no se hace desde aqui», con
       el boton justo debajo -- el mismo fallo, del reves. */
    '<p class="rnota">'+(_parado
      ? 'No lo vuelvas a lanzar sin mirar por qué se paró: hay fichas escritas y sin escribir '+
        'a la vez, y repetirlo encima no lo arregla.'
      : _inc
      ? 'A '+_inc.faltan+' persona'+(_inc.faltan===1?'':'s')+' no se le escribió nada: su carga '+
        'del mes cerrado sigue puesta, y el mes que viene esas horas se cuentan dos veces. '+
        'El botón de abajo termina lo que falta.'
      : _hecho
      ? 'Ya está escrito en las fichas de Notion: de ahí salen la cuota y la renovación.'
      : 'Aplicarlo escribe en las fichas de Notion, y de ahí salen la cuota y la '+
        'renovación. Revísalo antes: el botón está abajo.')+'</p>';
}

function _decidirCierreHTML_(plan){
  var r=plan.resultado||null;
  /* ⛔ El botón vuelve SOLO si faltan fichas, y con el número dentro. La regla «aplicado =
     sin botón» sigue en pie para el camino normal; lo que no puede seguir es que 25 de 32
     cuente como aplicado. Relanzar es seguro: el aplicador sigue por donde iba y devuelve
     `ya` para lo que ya tiene el estado final. */
  var inc=_cierreIncompleto_(plan);
  if(plan.aplicado || r){
    var lin=['<b>'+((r&&r.aplicadas)||0)+'</b> aplicadas'];
    if(r&&r.ya_estaban) lin.push((r.ya_estaban)+' ya estaban');
    if(r&&r.ausentes) lin.push('<b>'+r.ausentes+'</b> sin ficha en Notion'+
      (r.nombres_ausentes&&r.nombres_ausentes.length?' ('+esc(r.nombres_ausentes.join(', '))+')':''));
    if(r&&r.descuadres) lin.push('<b style="color:var(--warn)">'+r.descuadres+' descuadres</b>');
    if(r&&r.fallos) lin.push('<b style="color:var(--warn)">'+r.fallos+' fallos</b>');
    return '<div class="rec" style="margin-top:12px"><div class="rl"><span>Estado</span>'+
      '<span class="ra"><b>'+(plan.parado?'PARADO A MEDIAS':inc?'APLICADO A MEDIAS':'aplicado')+
      '</b></span></div></div>'+
      '<p class="rnota">'+lin.join(' · ')+
      (r&&r.at?' · '+esc(String(r.at).slice(0,16).replace('T',' ')):'')+'</p>'+
      (plan.parado?'<p class="rnota" style="color:var(--warn)">Se paró a medias: hay fichas '+
        'nuevas y viejas conviviendo. <b>No lo vuelvas a lanzar sin mirarlo.</b></p>'
       :inc?'<p class="rnota" style="color:var(--warn)"><b>Faltan '+inc.faltan+'</b>'+
        (inc.de?' de '+inc.de:'')+': su carga del mes cerrado sigue puesta y el mes que viene '+
        'esas horas se cuentan dos veces.</p>'+
        '<button class="btn pri" data-aplicarcierre style="width:100%;margin-top:10px">'+
        'Terminar el cierre · faltan '+inc.faltan+'</button>'+
        '<p class="rnota">Relanzarlo es seguro: sigue por donde iba y no reescribe a quien ya '+
        'está. Si alguna sigue sin ficha en Notion, volverá a salir aquí.</p>':'');
  }
  return '<button class="btn pri" data-aplicarcierre style="width:100%;margin-top:14px">'+
      'Aplicar el cierre de '+esc(_nomPeriodo_(plan.periodo))+'</button>'+
    '<p class="rnota">Esto <b>sí escribe</b> en Notion, en '+((plan.totales&&plan.totales.personas)||
      plan.personas||'?')+' fichas. Lo hace un script determinista que comprueba el «antes» de '+
      'cada una y se planta si algo no cuadra.</p>';
}

function _cierreHTML_(est, err, cargando){
  var cer=_mesACerrar_();
  var cab='<h3 style="margin:0 0 4px">Cierre de '+esc(cer.mes)+'</h3>'+
    '<p class="rnota" style="margin:0 0 12px">Cierra el corte que va desde el cierre anterior '+
    'hasta hoy. <b>No aplica nada</b>: encola el calculo y el plan se revisa antes.</p>';
  if(cargando) return cab+'<p class="rnota">Preguntando al servidor en que punto esta…</p>';
  if(err) return cab+'<p class="rnota" style="color:var(--warn)">No se pudo comprobar: '+
    esc(err)+'. <b>No</b> quiere decir que este todo listo.</p>';
  var bloq=(est&&est.bloqueos)||[], enc=(est&&est.encolado)||null, plan=(est&&est.plan)||null;
  var filas=bloq.map(function(b){
    return '<div class="rl"><span>'+esc(b.texto||b.que)+'</span>'+
      '<span class="ra" style="color:var(--warn)">bloquea</span></div>'; }).join('');
  /* ⛔ LOS BLOQUEOS SE PINTAN TAMBIEN CON PLAN, Y ESA ERA LA HUELLA: `filas` se
     calculaba aqui arriba y **se tiraba**, porque este `return` salia antes de usarla.
     ⛔ Lo que pasaba, medido: se calcula el plan el dia 1 sin bloqueos; el dia 2 entran dos
     partes de julio sin decidir; se abre el movil, se ve el plan y el boton «Aplicar el
     cierre» **sin una palabra de que hay dos partes pendientes**, y se aplica. Esas horas no
     entran en el corte y la cuota de esas personas sale mal — que es literalmente lo que
     avisa el texto de esta misma pantalla. El escritorio pinta los chips rojos encima del
     boton; el movil los escondia.
     ⚠️ Van ARRIBA del plan, no al final: leidos despues de decidir no sirven de nada. */
  if(plan) return cab+(filas ? '<div class="rec">'+filas+'</div>'+
      '<p class="rnota" style="color:var(--warn)"><b>Esto entra en la cuenta y sigue sin '+
      'resolver.</b> Si aplicas el cierre ahora, lo que se decida despues deja mal la cuota '+
      'de alguien.</p>' : '')+_planHTML_(plan)+_decidirCierreHTML_(plan);
  if(enc) return cab+'<p class="rnota">Encolado. La rutina lo recoge en la siguiente pasada '+
    '(va cada 2 minutos) y deja el plan.</p>';
  return cab+(filas ? '<div class="rec">'+filas+'</div>'+
      '<p class="rnota">Estas bloquean porque entran en la cuenta: unas horas que se decidan '+
      'despues del cierre dejan mal la cuota de alguien.</p>' : '')+
    '<button class="btn pri" data-cerrarmes'+(bloq.length?' disabled':'')+
      ' style="width:100%;margin-top:10px">'+
      (bloq.length?'Bloqueado · '+bloq.length+' sin resolver'
                  :'Calcular el cierre de '+esc(cer.mes))+'</button>';
}

function _abrirCierre_(){
  abrirModal(_cierreHTML_(null,null,true));
  var pinta=function(est,err){
    var c=$('#modal-body'); if(!c) return;
    c.innerHTML=_cierreHTML_(est,err,false);
    var ap=$('[data-aplicarcierre]');
    if(ap) ap.onclick=async function(){
      var pl=(est&&est.plan)||{}, n=((pl.totales&&pl.totales.personas)||pl.personas||'?');
      if(!confirm('APLICAR el cierre de '+_nomPeriodo_(pl.periodo)+'.\n\nEsto ESCRIBE en Notion en '+n+
                  ' fichas: pone las cargas a cero, hace rodar los puntos y devuelve las '+
                  'compensaciones al defecto del cargo.\n\nDe aqui salen la cuota y la '+
                  'renovacion.\n\n¿Seguro?')) return;
      ap.disabled=true; ap.textContent='Encolando…';
      try{ await api.aplicarCierre(pl.periodo||null);
           tost('Aplicación encolada. La rutina la recoge en la siguiente pasada.');
           pinta(await api.getCierre(), null); }
      catch(e){ ap.disabled=false; tostErr('No se pudo encolar: ', e); }
    };
    var b=$('[data-cerrarmes]'); if(!b) return;
    b.onclick=async function(){
      if(!confirm('Calcular el cierre de '+_mesACerrar_().mes+'.\n\nNO se aplica nada: la '+
                  'rutina saca el plan y lo deja para revisarlo.\n\n¿Sigo?')) return;
      b.disabled=true; b.textContent='Encolando…';
      try{ await api.calcularCierre(false, _mesACerrar_().p);
           tost('Cierre encolado. La rutina lo recoge en la siguiente pasada.');
           pinta(await api.getCierre(), null); }
      catch(e){ b.disabled=false; tostErr('No se pudo encolar: ', e); }
    };
  };
  /* Se pide al ABRIR y no al arrancar: es una llamada mas al backend y esta pantalla la abre
     una sola persona, casi nunca. Mismo criterio que Ajustes. */
  api.getCierre().then(function(d){ pinta(d,null); })
                 .catch(function(e){ pinta(null,(e&&e.message)||String(e)); });
}

