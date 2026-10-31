/* ═══ EN DIRECTO · cara escritorio ════════════════════════════════════════════════════════
   🗣️ Daniel (31/10): *«un coso que en directo sea como un live check de todo lo que está pasando en la app. Pero en
   plan bien animado… esto entra por aquí, sale por aquí… que se vea todas las funciones que tiene la app, funcionando
   en armonía»*.

   Un mapa: el mini PC en el centro y las seis piezas alrededor. Cada evento que llega de `getEnDirecto` viaja como un
   pulso por la línea de su pieza HACIA el centro (entra), salvo los avisos, que SALEN del centro hacia el móvil de la
   gente; lo del sistema (rutinas del gate, peticiones) late en el propio centro. Los contadores son de HOY y el registro
   corre debajo, lo último arriba.

   ⛔ Aquí SOLO hay declaraciones `function` (como el resto de módulos): el estado es `DIRECTO`, en `escritorio.html`.
   ⛔ El HTML de la vista (`_directoHTML_`) es SIEMPRE el mismo: `_pintarSiCambia_` no lo rehace en cada `pintar()` y
      las animaciones no se cortan. Lo que se mueve lo toca `_pinDirecto_` directamente en el DOM.
   ⛔ Sólo el PD (`_puedeVerDirecto_`): el servidor repite la puerta (`a_get_en_directo`); aquí se dice su motivo si la cierra.
   ⛔ `?demo` sin servidor: eventos inventados que se generan solos (`_directoDemo_`), y lo dice en la cabecera.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* Las piezas del mapa: dónde van (viewBox 1000×380), su color y si el pulso SALE del centro. */
function _directoPiezas_(){
  return [
    {k:'turnos',     t:'Turnos',     x:170, y:70,  c:'#E41E25'},
    {k:'horas',      t:'Horas',      x:170, y:190, c:'#FF4A4F'},
    {k:'sanciones',  t:'Sanciones',  x:170, y:310, c:'#E8912E'},
    {k:'documentos', t:'Documentos', x:830, y:70,  c:'#F4F3F3'},
    {k:'avisos',     t:'Avisos',     x:830, y:190, c:'#3f9ed6', sale:true},
    {k:'reuniones',  t:'Reuniones',  x:830, y:310, c:'#7FC3EA'}
  ];
}
function _directoPieza_(k){
  return _directoPiezas_().filter(function(p){ return p.k===k; })[0] || {k:'sistema', t:'Sistema', c:'#B2A8AB'};
}

/* La línea de una pieza al centro: una S suave, horizontal en los dos extremos. */
function _directoLinea_(p){
  var mx=(p.x+500)/2;
  return 'M'+p.x+','+p.y+' C'+mx+','+p.y+' '+mx+',190 500,190';
}

function _directoHTML_(){
  var ps=_directoPiezas_();
  var lineas=ps.map(function(p){
    return '<path class="dir-ln" id="dirL-'+p.k+'" d="'+_directoLinea_(p)+'" style="--c:'+p.c+'"/>';
  }).join('');
  var nodos=ps.map(function(p){
    var izq=p.x<500;
    return '<g class="dir-nodo" data-p="'+p.k+'" transform="translate('+p.x+','+p.y+')" style="--c:'+p.c+'">'+
      '<circle class="dir-onda" r="30"/><circle class="dir-anillo" r="30"/>'+
      '<text class="dir-n" y="7" text-anchor="middle">0</text>'+
      '<text class="dir-et" x="'+(izq?-44:44)+'" y="5" text-anchor="'+(izq?'end':'start')+'">'+p.t+'</text></g>';
  }).join('');
  return '<section class="dir">'+
    '<div class="dir-cab">'+
      '<span class="dir-vivo"><i></i><span>Conectando</span></span>'+
      '<span class="dir-cifra"><b class="mono" id="dirHoy">0</b><small>eventos hoy</small></span>'+
      '<span class="dir-cifra"><b class="mono" id="dirRitmo">0</b><small>en los últimos 10 min</small></span>'+
    '</div>'+
    '<div class="dir-mapa"><svg class="dir-svg" viewBox="0 0 1000 380" role="img" '+
      'aria-label="Mapa en directo: las piezas de la app alrededor del mini PC">'+
      '<g>'+lineas+'</g><g id="dirPulsos"></g>'+nodos+
      '<g class="dir-centro" data-p="sistema" transform="translate(500,190)">'+
        '<circle class="dir-onda" r="46"/><circle class="dir-halo" r="62"/><circle class="dir-nucleo" r="46"/>'+
        '<text class="dir-et0" y="-8" text-anchor="middle">mini PC</text>'+
        '<text class="dir-n" y="18" text-anchor="middle">0</text></g>'+
    '</svg></div>'+
    '<div class="dir-aviso" hidden></div>'+
    '<div class="dir-reg" id="dirReg" aria-live="polite"></div>'+
  '</section>';
}

function _directoFilaHTML_(e){
  var p=_directoPieza_(e.pieza), d=new Date(e.at);
  var mal=/^(error|fallo|crash|rendido|rechazada|rechazar|fallo_silenciado)$/.test(e.tipo||'');
  var q=e.quien ? ((_m(e.quien)&&_m(e.quien).pila) || e.quien) : '';
  return '<div class="dir-fila'+(mal?' mal':'')+'" style="--c:'+p.c+'">'+
    '<span class="dir-t mono">'+(isNaN(d)?'—':_hhmmDe_(e.at)+':'+pad(d.getSeconds()))+'</span>'+
    '<span class="dir-pz"><i></i>'+esc(p.t)+'</span>'+
    '<span class="dir-tx">'+(q?'<b>'+esc(q)+'</b>':'')+
      '<span class="dir-tipo">'+esc(String(e.tipo||'').replace('peticion','petición'))+'</span>'+esc(e.txt||'')+'</span>'+
  '</div>';
}

/* Lo que llega: fuera los repetidos (por `id`), al estado, a los contadores; y si `animar`, un pulso cada uno,
   escalonados para que se lean de uno en uno. Devuelve cuántos eran nuevos. */
function _directoLlegan_(evs, animar){
  var nuevos=(evs||[]).filter(function(e){ return e && e.id && !DIRECTO.vistos[e.id]; });
  /* Los contadores son de HOY (el día de Madrid, `_ahoraLocalISO_`): el registro trae también lo de ayer. */
  var hoy=_ahoraLocalISO_().slice(0,10);
  nuevos.forEach(function(e){
    DIRECTO.vistos[e.id]=1;
    DIRECTO.eventos.push(e);
    if(_ahoraLocalISO_(new Date(e.at)).slice(0,10)===hoy) DIRECTO.cuenta[e.pieza]=(DIRECTO.cuenta[e.pieza]||0)+1;
  });
  if(DIRECTO.eventos.length>DIRECTO_MAX) DIRECTO.eventos=DIRECTO.eventos.slice(-DIRECTO_MAX);
  if(vista!=='directo') return nuevos.length;
  var reg=document.getElementById('dirReg');
  nuevos.forEach(function(e, i){
    if(reg){
      reg.insertAdjacentHTML('afterbegin', _directoFilaHTML_(e));
      if(animar) reg.firstChild.classList.add('nueva');
      while(reg.children.length>DIRECTO_MAX) reg.removeChild(reg.lastChild);
    }
    if(animar) setTimeout(function(){ _directoPulso_(e); }, i*260);
  });
  _directoCifras_(animar ? nuevos.map(function(e){ return e.pieza; }) : []);
  return nuevos.length;
}

/* Los números: el de cada pieza, el del centro (sistema), los de hoy y el ritmo. `laten`: las piezas que acaban de
   recibir algo. */
function _directoCifras_(laten){
  var c=DIRECTO.cuenta, hoy=0, hace10=Date.now()-600000, ritmo=0;
  Object.keys(c).forEach(function(k){ hoy+=c[k]; });
  DIRECTO.eventos.forEach(function(e){ if(new Date(e.at).getTime()>=hace10) ritmo++; });
  $$('.dir-nodo, .dir-centro').forEach(function(g){
    var n=g.querySelector('.dir-n'); if(n) n.textContent=c[g.dataset.p]||0;
  });
  var h=document.getElementById('dirHoy'), r=document.getElementById('dirRitmo');
  if(h) h.textContent=hoy;
  if(r) r.textContent=ritmo;
  (laten||[]).forEach(function(k){ _directoLate_(k); });
}
function _directoLate_(k){
  var g=document.querySelector('.dir-nodo[data-p="'+k+'"]') || (k==='sistema' && document.querySelector('.dir-centro'));
  if(!g || redu()) return;
  g.classList.remove('late'); void g.getBoundingClientRect(); g.classList.add('late');
}

/* Un pulso por la línea de su pieza: entra al centro, o sale de él (avisos). Lo del sistema late en el centro.
   Con «reducir movimiento» no viaja nada: sólo cambian los números. */
function _directoPulso_(e){
  if(redu() || vista!=='directo') return;
  var p=_directoPieza_(e.pieza), ln=document.getElementById('dirL-'+p.k), capa=document.getElementById('dirPulsos');
  if(!capa) return;
  if(!ln){ _directoLate_('sistema'); return; }
  var NS='http://www.w3.org/2000/svg', L=ln.getTotalLength(), t0=null, DUR=1100;
  var cola=document.createElementNS(NS,'circle'), bola=document.createElementNS(NS,'circle');
  cola.setAttribute('r','9'); cola.setAttribute('class','dir-pulso-cola'); cola.style.fill=p.c;
  bola.setAttribute('r','4.5'); bola.setAttribute('class','dir-pulso'); bola.style.fill=p.c;
  capa.appendChild(cola); capa.appendChild(bola);
  ln.classList.add('activa');
  function paso(ts){
    if(t0===null) t0=ts;
    var u=Math.min(1,(ts-t0)/DUR), s=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;   // entrada y salida suaves
    var pt=ln.getPointAtLength((p.sale?s:1-s)*L);
    bola.setAttribute('cx',pt.x); bola.setAttribute('cy',pt.y);
    cola.setAttribute('cx',pt.x); cola.setAttribute('cy',pt.y);
    if(u<1 && bola.isConnected){ requestAnimationFrame(paso); return; }
    bola.remove(); cola.remove(); ln.classList.remove('activa');
    _directoLate_(p.sale?p.k:'sistema');
  }
  requestAnimationFrame(paso);
}

/* Una lectura: la primera sin cursor (y un lote grande, para que los contadores de hoy salgan bien), las siguientes
   desde el cursor. ⛔ Una a la vez: el reloj y el vivo pueden coincidir. */
async function _directoPedir_(){
  if(DIRECTO.enVuelo || !backendOK || !SESION) return;
  DIRECTO.enVuelo=true;
  try{
    var primera=DIRECTO.cursor===null;
    var r=await api.getEnDirecto(DIRECTO.cursor, primera?300:null);
    DIRECTO.err=null;
    if(r && r.cursor) DIRECTO.cursor=r.cursor;
    _directoLlegan_(r&&r.eventos, !primera);
  }catch(e){
    DIRECTO.err=(e&&e.message)||String(e);
  }finally{
    DIRECTO.enVuelo=false;
    _directoEstado_();
  }
}

/* La cabecera dice de dónde sale lo que se ve: en vivo, la maqueta, o por qué no hay nada. */
function _directoEstado_(){
  var v=document.querySelector('.dir-vivo'), av=document.querySelector('.dir-aviso');
  if(!v) return;
  var demo=!!DIRECTO.demo, err=DIRECTO.err;
  v.className='dir-vivo'+(err?' caido':demo?' maqueta':'');
  v.lastChild.textContent=err?'Sin datos':demo?'Maqueta · datos inventados':(backendOK&&SESION)?'En vivo':'Sin conexión';
  if(av){ av.hidden=!err; av.textContent=err?('No se puede leer: '+err):''; }
}

/* Un evento de la maqueta: gente de la semilla haciendo cosas plausibles. Sólo con `?demo` y sin servidor. */
function _directoDemo_(){
  var ms=(DATA.miembros||[]).filter(function(m){ return m && m.nombre; });
  var q=ms.length ? ms[Math.floor(Math.random()*ms.length)].nombre : 'Ana Pérez';
  var h=(Math.round((1+Math.random()*4)*4)/4).toLocaleString('es-ES');
  var tipos=[
    ['horas','entrada','empieza a fichar',q], ['horas','parte','cierra su fichaje: '+h+' h',q],
    ['horas','aprobada',h+' h de '+q,PD_NOM], ['turnos','empieza','turno en el taller',q],
    ['sanciones','propuesta','no abrió la app en 7 días (-1)',q], ['documentos','entra','Informe_S-2011_26 · Ensayo de tobera',q],
    ['documentos','aprobar','Acta_S-6301_26',PD_NOM], ['avisos','entregado','Turno mañana a las 10:00 · 6 personas'],
    ['reuniones','convoca','Reunión de Propulsión (subsistema)',q], ['sistema','rutina','corre avisar_turno (2 s)'],
    ['sistema','peticion','getPanel · 84 ms']];
  var t=tipos[Math.floor(Math.random()*tipos.length)];
  DIRECTO.demo++;
  return {id:'demo-'+DIRECTO.demo, at:new Date().toISOString(), pieza:t[0], tipo:t[1], txt:t[2], quien:t[3]};
}

/* Lo llama `pintar()` en cada pasada. En la vista: repone el registro (si la vista se acaba de pintar, viene vacío),
   las cifras y los relojes. Fuera de ella: los para. */
/* ⛔ «En directo» es SÓLO del Project Director (Daniel, 31/10: *«en el ordenador solo»*, *«una cosa solo para mí»*): la
   misma puerta que el cierre (`_puedeCerrarMes_`: PD o quien lo suplanta). El servidor la repite (`getEnDirecto`, rango 3). */
function _puedeVerDirecto_(){ return !!_puedeCerrarMes_(); }

function _pinDirecto_(){
  if(vista!=='directo' || !_puedeVerDirecto_()){
    if(DIRECTO.reloj){ clearInterval(DIRECTO.reloj); DIRECTO.reloj=null; }
    return;
  }
  var reg=document.getElementById('dirReg');
  if(reg && !reg.children.length && DIRECTO.eventos.length)
    reg.innerHTML=DIRECTO.eventos.slice().reverse().map(_directoFilaHTML_).join('');
  _directoCifras_([]);
  _directoEstado_();
  if(DIRECTO.reloj) return;
  var real=backendOK && SESION;
  if(real){
    _directoPedir_();
    /* La bitácora del gate y el diario no mueven el sello del almacén (`queHayNuevo` no los ve): cada 5 s, sólo con la
       pestaña a la vista. Lo del almacén llega antes, por el vivo (`_arrancarRefrescoVivo_`). */
    DIRECTO.reloj=setInterval(function(){ if(!document.hidden) _directoPedir_(); }, DIRECTO_CADA_MS);
  }else if(_demoLocal_()){
    if(!DIRECTO.demo) DIRECTO.demo=0.5;     // ya es maqueta antes del primer evento
    DIRECTO.reloj=setInterval(function(){
      if(Math.random()<.75) _directoLlegan_([_directoDemo_()], true);
    }, 700);
    _directoEstado_();
  }
}

/* Vuelta a empezar (al cambiar de sesión, o en los bancos): sin eventos, sin cursor, sin relojes. */
function _directoReset_(){
  if(DIRECTO.reloj) clearInterval(DIRECTO.reloj);
  DIRECTO.eventos=[]; DIRECTO.cursor=null; DIRECTO.cuenta={}; DIRECTO.vistos={}; DIRECTO.reloj=null;
  DIRECTO.demo=0; DIRECTO.err=null; DIRECTO.enVuelo=false;
  var reg=document.getElementById('dirReg'); if(reg) reg.innerHTML='';
}
