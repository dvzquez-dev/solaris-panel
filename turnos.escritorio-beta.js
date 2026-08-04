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

