/* ═══ HORAS · cara escritorio ═══════════════════════════════════════════════════════════
   8 funciones sacadas de `escritorio.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* enrutado de un parte: coordinador de la unidad del autor; si el autor ES el
   coordinador, ESCALA al revisor de más rango. Nadie firma lo suyo. */
function revisoresDeParte(p){
  var c=coordinadorDe(p.unidad);
  if(c!==p.autor) return [c];
  return [PD_NOM,REV2_NOM].filter(function(n){return n!==p.autor;});
}

function puedeDecidirParte(p,quien){
  if(quien===p.autor) return false;
  var rev=revisoresDeParte(p), maxR=Math.max.apply(null,rev.map(rangoNom));
  return rev.indexOf(quien)>=0 || rangoNom(quien)>maxR;
}

function pendientes(){return PARTES.filter(function(p){return p.estado==='pend';});}

function parteCard(p){
  var m=_m(p.autor), rev=revisoresDeParte(p), puede=puedeDecidirParte(p,ACTOR);
  var esc2=(coordinadorDe(p.unidad)===p.autor);
  return '<div class="parte" id="parte-'+p.id+'">'+
    '<div class="h"><b>'+esc(m.pila)+'</b><span class="u">'+esc(p.unidad)+'</span>'+
      '<span class="u">'+p.fecha+' · '+p.ini+'–'+p.fin+'</span>'+
      '<span class="q">'+nf(p.horas,1)+'<small> h</small></span></div>'+
    '<div class="just"><span class="sc">'+esc(p.tarea)+'</span>'+esc(p.just)+'</div>'+
    '<div class="fl">'+p.flags.map(function(f){
      return '<span class="chip '+(f[0]==='ok'?'ok':'wa')+'">'+esc(f[1])+'</span>';}).join('')+
      (p.origen==='bloque'?'':'<span class="chip ok">con fichaje</span>')+'</div>'+
    '<div class="ruta">'+(puede?'Puedes decidirlo.':'Lo firma '+esc(rev.map(function(n){return _m(n).pila;}).join(' o '))+', no t\u00fa.')+'</div>'+
    (puede?'<textarea data-motivo placeholder="Motivo — obligatorio para rechazar o pedir detalle…"></textarea>'+
      '<div class="acts">'+
        '<button class="btn pri" data-parte="'+p.id+'" data-acc="si">Aprobar</button>'+
        '<button class="btn" data-parte="'+p.id+'" data-acc="det">Pedir detalle</button>'+
        '<button class="btn no" data-parte="'+p.id+'" data-acc="no">Rechazar</button>'+
      '</div>':'')+
  '</div>';
}

function bloquePanel(){
  if(rangoNom(ACTOR)<1) return '';
  var actor=_m(ACTOR), esPD=rangoNom(ACTOR)>=2, unidad=(actor&&actor.unidad)||'';
  var reg=_activos_().filter(function(m){ return !m.cargo; }); // miembros de subsistema, sin bajas
  var pool=esPD?reg:reg.filter(function(m){ return m.unidad===unidad; });
  if(!pool.length) return pan('Bloque de horas','a varios de tu subsistema de golpe',
    '<div class="pb"><p style="margin:0;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
    'No hay nadie de tu subsistema a quien otorgar horas en bloque.</p></div>');
  var subs=[]; reg.forEach(function(m){ if(subs.indexOf(m.unidad)<0) subs.push(m.unidad); });
  var filtro = esPD
    ? '<label style="display:block;margin-bottom:10px"><span class="sc" style="display:block;margin-bottom:5px">Subsistema</span>'+
      '<select id="bloSub" style="width:100%;max-width:260px;background:#0A0909;border:1px solid var(--line);border-radius:8px;padding:8px 10px;color:var(--ink);font:inherit;font-size:12.5px">'+
      '<option value="">Todos</option>'+subs.map(function(u){ return '<option>'+esc(u)+'</option>'; }).join('')+'</select></label>'
    : '<div class="chips" style="margin-bottom:10px"><span class="chip">'+esc(unidad)+'</span></div>';
  var chips=pool.map(function(m){
    return '<button type="button" class="pick" data-nom="'+esc(m.nombre)+'" data-unidad="'+esc(m.unidad)+'">'+esc(m.pila)+'</button>';
  }).join('');
  return pan('Bloque de horas','a varios de tu subsistema de golpe',
    '<div class="pb"><p style="margin:0 0 12px;font-size:12.5px;color:var(--ink2);line-height:1.6">'+
    'Un traslado, un montaje, una feria a la que fue medio subsistema: en vez de otorgar uno a uno, '+
    '<b>marca a quienes participaron</b> y ponles las mismas horas de una vez. Todos comparten concepto y '+
    'cantidad, y no se otorga nada hasta que pulsas el botón. Entran como <b>otorgadas</b>, igual que '+
    'las individuales.</p>'+
    filtro+
    '<div class="chips" id="bloPool" style="margin-bottom:12px">'+chips+'</div>'+
    '<div style="display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end">'+
      '<label style="min-width:150px"><span class="sc" style="display:block;margin-bottom:5px">Categoría</span>'+'<select id="bloCat" style="width:100%;background:#0A0909;border:1px solid var(--line);border-radius:8px;padding:8px 10px;color:var(--ink);font:inherit;font-size:12.5px">'+'<option value="reunion">Reunión</option><option value="tareas">Tarea</option>'+'<option value="turno">Turno</option><option value="compensacion" selected>Compensación</option></select></label>'+'<label style="width:120px"><span class="sc" style="display:block;margin-bottom:5px">Horas c/u</span>'+
      '<input class="mono" id="bloH" value="2,0" style="width:100%;background:#0A0909;border:1px solid var(--line);border-radius:8px;padding:8px 10px;color:var(--ink);font-family:var(--mono);font-size:12.5px"></label>'+
      '<label style="flex:2;min-width:200px"><span class="sc" style="display:block;margin-bottom:5px">Concepto</span>'+
      '<input id="bloC" placeholder="p. ej. Traslado a campo de pruebas" style="width:100%;background:#0A0909;border:1px solid var(--line);border-radius:8px;padding:8px 10px;color:var(--ink);font:inherit;font-size:12.5px"></label>'+
      '<button class="btn pri" data-bloque>Otorgar el bloque</button>'+
    '</div></div>');
}

function normParte(p){
  var fl=[];
  if(p.autocierre) fl.push(['wa','autocerrado al tope de 14 h']);
  if(p.sinFichaje) fl.push(['wa','declarado sin fichaje']);
  if(p.origen==='otorgada') fl.push(['ok','otorgada por '+((p.decidido_por)||'coordinación')]);
  return { id:p.id, autor:p.autor, unidad:p.subsistema||'—', fecha:_isoADMY_(p.fecha),
    ini:p.ini||'—', fin:p.fin||'—', horas:Number(p.horas)||0, tarea:p.tarea||'',
    origen:p.sinFichaje?'bloque':'turno', just:p.justificacion||'', flags:fl,
    estado:_EST_PARTE_[p.estado]||'pend', decisor:p.decidido_por||null,
    dec:p.decidido_at?_isoADMY_(String(p.decidido_at).slice(0,10)):null, motivo:p.motivo||null, _real:true };
}

/* Vuelca la cola real de partes sobre PARTES (que si no se queda con la semilla). */
function _partesReal_(){
  if(!Array.isArray(PART_BACK)) return;                 // sin backend: semilla
  PARTES=PART_BACK.map(normParte);
}

async function _cargarPartes_(){
  try{ var arr=await api.getPartes({}); if(Array.isArray(arr)) PART_BACK=arr; }
  catch(e){ PART_BACK=null; }
  _partesReal_();
}

