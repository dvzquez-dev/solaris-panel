/* ═══ BUZON · cara escritorio ═══════════════════════════════════════════════════════════
   15 funciones sacadas de `escritorio.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* EL PINTOR. `alTerminar(dataUrl)` recibe las dos capas YA fusionadas, o no se llama si
   se cancela. Todo el estado vive aquí dentro: al cerrarse no queda nada. */
/* EQUIVALENTE (no GEMELA): el escritorio anade zoom con la RUEDA del raton —con raton no hay dos dedos—; el movil no. Auditado el 05/08: es la unica diferencia y todo lo demas es identico byte a byte. */
function _abrirPintor_(fondoUrl, alTerminar){
  var caja=$('#pintor'), zona=$('#pzona'), lienzo=$('#plienzo');
  var img=$('#pfondo'), cv=$('#ptrazos');
  /* ⛔⛔ EL PINTOR SIEMPRE CONTESTA, PASE LO QUE PASE. En el escritorio esta
     envuelto en una PROMESA (`_pedirCaptura_`), y su `fin()` sólo se llama desde
     aquí: si una salida se va sin avisar, la promesa **no se asienta nunca**, el
     `await` de `reportarModal` se queda colgado y `reportarBug` no llega a correr.
     Lo que se pierde no es la foto —es el título, el detalle y la gravedad recién
     escritos—, y sin un solo error a la vista. Había DOS salidas mudas: cancelar y
     este `return` de aquí abajo.
     ⚠️ Al cancelar se contesta con la foto ORIGINAL sin marcar, no con nada: es lo
     que dice el propio aviso («salir sin guardar **lo que has pintado**») y lo que
     el móvil ya hacía de hecho, porque allí `BZ_FOTO` se fija antes de abrir. */
  var contestado=false;
  function contestar(url, n){
    if(contestado) return;
    contestado=true;
    if(typeof alTerminar==='function') alTerminar(url, n||0);
  }
  if(!caja||!img||!cv){ contestar(fondoUrl, 0); return; }
  var ctx=cv.getContext('2d');
  /* TRAZOS, no píxeles: cada uno es {color, grosor, pts:[[x,y],…]} en coordenadas de
     IMAGEN. Deshacer es quitar el último y repintar. Con capturas de pantalla a resolución
     completa, guardar un snapshot por trazo se come la memoria de un móvil. */
  var trazos=[], activo=null;
  var color=PINT_COLORES[0], grosor=PINT_GROSORES[1], modo='pintar';
  var vista={e:1, x:0, y:0}, punteros={}, pellizco=null;

  function aplicarVista(){
    lienzo.style.transform='translate('+vista.x.toFixed(1)+'px,'+vista.y.toFixed(1)+'px) scale('+vista.e.toFixed(4)+')';
  }
  function repintar(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.lineCap='round'; ctx.lineJoin='round';
    trazos.concat(activo?[activo]:[]).forEach(function(t){
      if(!t.pts.length) return;
      ctx.strokeStyle=t.color; ctx.lineWidth=t.grosor;
      ctx.beginPath(); ctx.moveTo(t.pts[0][0], t.pts[0][1]);
      /* Un toque sin arrastre es un punto: sin esto, marcar algo pequeño no pinta nada. */
      if(t.pts.length===1) ctx.lineTo(t.pts[0][0]+0.01, t.pts[0][1]);
      else for(var i=1;i<t.pts.length;i++) ctx.lineTo(t.pts[i][0], t.pts[i][1]);
      ctx.stroke();
    });
  }
  /* LA CONVERSIÓN QUE IMPORTA. El lienzo va dentro de un contenedor con `transform`, así
     que su `getBoundingClientRect()` YA incluye zoom y desplazamiento: dividir por el ancho
     del rectángulo da la coordenada en píxeles de imagen sin tocar la matriz a mano. Con
     cuentas propias, el trazo se desplaza en cuanto haces zoom. */
  function aImagen(ev){
    var r=cv.getBoundingClientRect();
    return [ (ev.clientX-r.left)/r.width*cv.width, (ev.clientY-r.top)/r.height*cv.height ];
  }
  function encajar(){
    var rz=zona.getBoundingClientRect();
    var k=Math.min(rz.width/cv.width, rz.height/cv.height);
    vista.e=k; vista.x=(rz.width-cv.width*k)/2; vista.y=(rz.height-cv.height*k)/2;
    aplicarVista();
  }
  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }

  zona.onpointerdown=function(ev){
    /* La captura va en `try` y ANTES de nada: `setPointerCapture` LANZA si el navegador no
       reconoce ese puntero, y sin el try la excepción se lleva por delante el resto del
       manejador — el dedo no se registra, `punteros` se queda con uno solo y el pellizco no
       llega a existir. Que la captura falle no puede impedir seguir el gesto. */
    try{ zona.setPointerCapture(ev.pointerId); }catch(_){}
    punteros[ev.pointerId]={x:ev.clientX,y:ev.clientY};
    var ids=Object.keys(punteros);
    if(ids.length===2){
      /* DOS DEDOS SIEMPRE HACEN ZOOM, aunque estés en modo pintar: es el gesto que todo el
         mundo prueba primero. Si había un trazo empezado se descarta, porque era el primer
         dedo del pellizco y no un trazo de verdad. */
      activo=null; repintar();
      var a=punteros[ids[0]], b=punteros[ids[1]], rz=zona.getBoundingClientRect();
      /* El punto medio se guarda RELATIVO al area, que es el sistema en el que vive
         `vista.x`. Con coordenadas de pantalla se mezclan dos origenes distintos. */
      pellizco={ d:dist(a,b), cx:(a.x+b.x)/2-rz.left, cy:(a.y+b.y)/2-rz.top,
                 e:vista.e, x:vista.x, y:vista.y };
      return;
    }
    if(ids.length>2) return;
    if(modo==='pintar'){
      var p=aImagen(ev);
      activo={ color:color, grosor:Math.max(1, grosor*Math.max(cv.width,cv.height)), pts:[p] };
      repintar();
    } else {
      /* Arrastrar es un DELTA, asi que aqui el origen da igual; se guarda en pantalla.
         `d:0` es lo que distingue arrastre de pellizco. */
      pellizco={ d:0, cx:ev.clientX, cy:ev.clientY, e:vista.e, x:vista.x, y:vista.y };
    }
  };
  zona.onpointermove=function(ev){
    if(!punteros[ev.pointerId]) return;
    punteros[ev.pointerId]={x:ev.clientX,y:ev.clientY};
    var ids=Object.keys(punteros);
    if(ids.length>=2 && pellizco && pellizco.d){
      var a=punteros[ids[0]], b=punteros[ids[1]];
      var k=Math.max(0.2, Math.min(8, dist(a,b)/pellizco.d));
      var e2=Math.max(0.1, Math.min(12, pellizco.e*k));
      var kk=e2/pellizco.e;
      /* El punto medio de los dedos se queda quieto: es lo que hace que el pellizco se
         sienta bien. Sin esto la imagen se va del dedo al ampliar. */
      var rz=zona.getBoundingClientRect();
      var cx=(a.x+b.x)/2-rz.left, cy=(a.y+b.y)/2-rz.top;
      vista.e=e2;
      vista.x=cx-(pellizco.cx-pellizco.x)*kk;
      vista.y=cy-(pellizco.cy-pellizco.y)*kk;
      aplicarVista(); return;
    }
    if(activo && modo==='pintar'){
      var p=aImagen(ev);
      var u=activo.pts[activo.pts.length-1];
      /* Se descartan los puntos que no aportan: con el dedo llegan decenas por segundo y
         guardarlos todos engorda el repintado sin cambiar el trazo. */
      if(Math.hypot(p[0]-u[0], p[1]-u[1]) > 0.7){ activo.pts.push(p); repintar(); }
      return;
    }
    if(pellizco && !pellizco.d && modo==='mover'){
      vista.x=pellizco.x+(ev.clientX-pellizco.cx);
      vista.y=pellizco.y+(ev.clientY-pellizco.cy);
      aplicarVista();
    }
  };
  function soltar(ev){
    delete punteros[ev.pointerId];
    if(!Object.keys(punteros).length){
      pellizco=null;
      if(activo){ trazos.push(activo); activo=null; repintar(); }
    }
  }
  zona.onpointerup=soltar; zona.onpointercancel=soltar; zona.onpointerleave=soltar;
  /* ÚNICA DIFERENCIA CON EL MÓVIL, y va marcada: con ratón no hay dos dedos, así que la
     rueda hace zoom. Misma cuenta que el pellizco —el punto bajo el cursor se queda
     quieto—, con el cursor haciendo de punto medio. */
  zona.onwheel=function(ev){
    ev.preventDefault();
    var rz=zona.getBoundingClientRect();
    var px=ev.clientX-rz.left, py=ev.clientY-rz.top;
    var k=Math.exp(-ev.deltaY*0.0015);
    var e2=Math.max(0.1, Math.min(12, vista.e*k)), kk=e2/vista.e;
    vista.x=px-(px-vista.x)*kk;
    vista.y=py-(py-vista.y)*kk;
    vista.e=e2; aplicarVista();
  };

  /* la paleta: los presets más el selector de color del sistema, que es el «típico» */
  var pc=$('#pcolores');
  pc.innerHTML=PINT_COLORES.map(function(c,i){
    return '<button class="pcol'+(i===0?' on':'')+'" data-pc="'+c+'" style="background:'+c+'" data-p aria-label="color"></button>';
  }).join('')+'<input type="color" id="pcolorlibre" value="'+PINT_COLORES[0]+'" aria-label="otro color">';
  function marcarColor(c){
    color=c;
    $$('#pcolores .pcol').forEach(function(b){ b.classList.toggle('on', b.dataset.pc===c); });
  }
  $$('#pcolores .pcol').forEach(function(b){ b.onclick=function(){ marcarColor(b.dataset.pc); }; });
  var cl=$('#pcolorlibre'); if(cl) cl.oninput=function(){ marcarColor(cl.value); };

  var pg=$('#pgrosor');
  pg.innerHTML=PINT_GROSORES.map(function(g,i){
    var d=Math.round(4+i*4);
    return '<button data-pg="'+g+'"'+(i===1?' class="on"':'')+' data-p aria-label="grosor">'+
      '<i style="width:'+d+'px;height:'+d+'px"></i></button>';
  }).join('');
  $$('#pgrosor button').forEach(function(b){ b.onclick=function(){
    grosor=+b.dataset.pg;
    $$('#pgrosor button').forEach(function(x){ x.classList.toggle('on', x===b); }); }; });

  $$('#pmodo button').forEach(function(b){ b.onclick=function(){
    modo=b.dataset.pm;
    $$('#pmodo button').forEach(function(x){ x.classList.toggle('on', x===b); }); }; });
  /* ⛔ Y LA BARRA SE PONE AL DÍA AL ABRIR. `modo` se reinicia a 'pintar' aquí
     dentro, pero la clase `.on` de `#pmodo` vive en el HTML **estático** y sólo la
     movía el clic de arriba: abrías, tocabas «Mover», cerrabas, y desde la segunda
     apertura el botón decía «Mover» mientras el lienzo pintaba.
     ⚠️ `#pcolores` y `#pgrosor` no lo sufrían porque se rehacen enteros unas líneas
     más arriba, con el `on` puesto en el índice que toca. `#pmodo` es el único de
     los tres que no se repinta, y por eso es el único que se desincronizaba. */
  $$('#pmodo button').forEach(function(x){ x.classList.toggle('on', x.dataset.pm===modo); });
  $('#pdeshacer').onclick=function(){
    if(!trazos.length){ tost('No hay nada que deshacer.'); return; }
    trazos.pop(); repintar();
  };

  function cerrar(){ caja.classList.remove('on'); caja.setAttribute('aria-hidden','true'); }
  $('#pcancelar').onclick=function(){
    if(trazos.length && !confirm('Vas a salir sin guardar lo que has pintado. ¿Seguro?')) return;
    cerrar();
    /* ⛔ Y SE CONTESTA: cerrar la caja NO es contestar. Quien abrió el pintor puede
       estar esperando —en el escritorio lo está, dentro de un `await`—, y dejarlo
       esperando se lleva por delante el reporte entero. */
    contestar(fondoUrl, 0);
  };
  $('#plisto').onclick=function(){
    /* LA FUSIÓN POR CAPAS: la de abajo es la foto tal cual, la de arriba lo pintado. Sale
       un solo fichero, que es lo que se puede abrir en cualquier parte. */
    var out=document.createElement('canvas');
    out.width=cv.width; out.height=cv.height;
    var o=out.getContext('2d');
    o.drawImage(img, 0, 0, out.width, out.height);
    o.drawImage(cv, 0, 0);
    cerrar();
    /* Por la MISMA puerta que cancelar: así un clic tardío en «Cancelar» no puede
       contestar por segunda vez y pisar la imagen marcada con la foto en crudo. */
    contestar(out.toDataURL('image/jpeg', 0.82), trazos.length);
  };

  img.onload=function(){
    cv.width=img.naturalWidth; cv.height=img.naturalHeight;
    img.style.width=cv.width+'px'; img.style.height=cv.height+'px';
    repintar(); encajar();
  };
  img.src=fondoUrl;
  caja.classList.add('on'); caja.setAttribute('aria-hidden','false');
  if(img.complete && img.naturalWidth) img.onload();
}

/* ADJUNTAR EN EL ESCRITORIO. Aqui no hay modal —reportar es una cadena de `prompt()`—,
   asi que se pregunta y se abre el selector. **Despues** de los `prompt`, nunca durante:
   un `prompt` bloquea el hilo y el selector de fichero no llegaria a abrirse. */
function _pedirCaptura_(){
  return new Promise(function(ok){
    var f=document.createElement('input');
    f.type='file'; f.accept='image/*'; f.style.display='none';
    document.body.appendChild(f);
    /* Si se cierra el selector sin elegir nada no salta ningun evento, asi que la
       promesa se resolveria nunca. Se resuelve al volver el foco a la ventana. */
    var cerrado=false;
    function fin(v){ if(cerrado) return; cerrado=true; f.remove(); ok(v); }
    f.onchange=async function(){
      var file=f.files&&f.files[0];
      if(!file){ fin(null); return; }
      try{
        var im=await _leerImagen_(file);
        _abrirPintor_(im.url, function(url){ fin(url); });
      }catch(err){ tost('No se pudo usar esa imagen: '+((err&&err.message)||err)); fin(null); }
    };
    window.addEventListener('focus', function ret(){
      window.removeEventListener('focus', ret);
      setTimeout(function(){ if(!(f.files&&f.files.length)) fin(null); }, 400);
    });
    f.click();
  });
}

async function reportarModal(){
  if(typeof backendOK==='undefined' || !backendOK || !SESION){
    tost('Sin conexión con el servidor no se puede reportar.'); return; }
  var esMejora=confirm('¿Es una MEJORA?'+String.fromCharCode(10,10)+
    'Aceptar = proponer una mejora.'+String.fromCharCode(10)+'Cancelar = reportar un fallo.');
  var tit=(prompt(esMejora?'¿Qué mejorarías? (en una línea)':'¿Qué ha pasado? (en una línea)')||'').trim();
  if(!tit) return;
  var det=(prompt(esMejora?'¿Por qué? ¿Qué te cuesta hoy? (el problema de fondo, no la solución)'
                         :'¿Qué esperabas que pasara?')||'').trim();
  var ua=navigator.userAgent||'';
  var nav=/Firefox/.test(ua)?'Firefox':/Edg/.test(ua)?'Edge':/Chrome/.test(ua)?'Chrome':/Safari/.test(ua)?'Safari':'otro';
  var datos={ titulo:tit, donde:'Escritorio', pantalla:((V[vista]&&V[vista].t)||vista),
    /* La version del CODIGO, no la de los datos: ver la gemela del movil. */
    version:BUILD,
    contexto:'escritorio'+(CANAL==='beta'?' · BETA':(VERSION?' · v'+VERSION:''))+' · '+nav+' · '+screen.width+'x'+screen.height+
      ' · build '+BUILD+' · datos '+(DATA.generado||'?') };
  if(esMejora){ datos.mejora=tit; datos.porque=det; datos.a_quien=''; }
  else {
    datos.esperaba=det; datos.paso=tit;
    /* ⛔ AQUI HABIA `datos.gravedad='Molesta'` CLAVADO. Se pregunta, y si no se reconoce la
       respuesta NO SE ESCRIBE EL CAMPO: el eje se queda sin medir y la ficha lo pide. */
    var _g=_normGravedad_(prompt('\u00bfCu\u00e1nto molesta? Escribe una de las tres:'+
      String.fromCharCode(10,10)+'Bloquea \u00b7 Molesta \u00b7 Cosm\u00e9tico'+
      String.fromCharCode(10,10)+
      '(Cancelar o dejarlo en blanco = sin medir; se ver\u00e1 como que falta)'));
    if(_g) datos.gravedad=_g;
  }
  /* La captura se ofrece AL FINAL, cuando ya no hay `prompt` abierto. Y se ofrece, no se
     exige: hay reportes que no son de sitio y pedir una foto los frenaria. */
  if(confirm('¿Quieres adjuntar una captura?'+String.fromCharCode(10,10)+
    'Se abre para marcarla con el lápiz antes de enviarla.'+String.fromCharCode(10)+
    'Cancelar = enviar sin foto.')){
    var cap=await _pedirCaptura_();
    if(cap) datos.captura=cap;
  }
  try{
    /* La clave va FUERA del reintento: se calcula aquí, una vez, y viaja
       igual en los tres intentos de `api._post`. */
    datos.clave = _claveReporte_(SESION && SESION.nombre, datos.titulo);
    var r=await (esMejora?api.reportarMejora(datos):api.reportarBug(datos));
    /* Si la foto no se guardo, se dice: el backend solo devuelve `captura` cuando la ha
       subido a Drive. Callarse seria dejar creer que la marcaste para nada. */
    var sinFoto = datos.captura && !(r && r.captura);
    tost((esMejora?'Mejora enviada':'Fallo reportado')+' · '+((r&&r.id)||'')+'.'+
      (sinFoto?' ⚠️ La foto NO se ha guardado: al servidor le falta ese paso.':''));
    if(vista==='buzon') _cargarBuzon_();
  }catch(e){ tostErr('No se pudo enviar: ', e); }
}

function _estBuzon_(e){ return EST_BUZON[e]||[String(e||'—'),'']; }

async function _cargarBuzon_(){
  /* ⛔ SE MARCA QUE SE ESTÁ ACTUALIZANDO, y NO se vacía el dato. Daniel (09/08): *«que
     cuando se recarguen los datos … no empiece de 0»*. Antes, entrar al buzón ponía
     `BUZON=null` y la pantalla volvía a «cargando…» aunque la cola fuera la misma.
     ⚠️ Y conservar **callando** sería peor: lo viejo se leería como fresco. Por eso hay
     un estado propio (`BUZON_CARGANDO`) que la vista enseña. */
  BUZON_CARGANDO=true; try{ pintar(); }catch(_){}
  if(typeof backendOK==='undefined' || !backendOK || !SESION){
    BUZON_CARGANDO=false;
    /* ⛔ Sin conexión NO se borra lo que ya había: se dice el motivo y se deja mirar. Con
       `BUZON=[]` la cola parecía **vacía**, que no es lo mismo que **no leída**. */
    if(BUZON===null) BUZON=[];
    BUZON_ERR='sin conexión'; try{ pintar(); }catch(_){} return;
  }
  try{ BUZON=await api.getBuzon(); BUZON_ERR=null; }
  catch(e){ if(BUZON===null) BUZON=[]; BUZON_ERR=(e&&e.message)||String(e); }
  BUZON_CARGANDO=false;
  pintar();
}

function _fichaBuzon_(r){
  var st=_estBuzon_(r.estado), esBug=!_esMejora_(r);
  var campo=function(t,v){ return v? ('<div class="sub"><span class="sc">'+t+'</span>'+
    '<p style="margin:4px 0 0;font-size:12.5px;color:var(--ink2);line-height:1.6">'+esc(v)+'</p></div>') : ''; };
  return '<div class="parte" id="bz-'+esc(r.id)+'">'+
    '<div class="h"><b>'+esc(r.titulo)+'</b>'+
      '<span class="u">'+esc(r.id)+'</span>'+
      '<button class="btn sm" style="margin-left:auto" data-bzsel="">Cerrar</button></div>'+
    '<div class="pils">'+
      '<span class="chip">'+(esBug?'fallo':'mejora')+'</span>'+
      '<span class="chip">'+esc(_m(r.quien).pila)+'</span>'+
      '<span class="chip">'+esc(r.donde||'—')+(r.pantalla?' · '+esc(r.pantalla):'')+'</span>'+
      /* El eje que decide las horas, A LA VISTA en la tarjeta: antes solo se pintaba en los
         bugs, asi que en una mejora no habia forma de ver por que proponia lo que proponia. */
      (esBug&&r.gravedad?'<span class="chip '+(r.gravedad==='Bloquea'?'no':r.gravedad==='Molesta'?'wa':'')+'">'+esc(r.gravedad)+'</span>':'')+
      (!esBug&&r.valor?'<span class="chip '+(r.valor==='Alto'?'no':r.valor==='Medio'?'wa':'')+'">valor '+esc(r.valor)+'</span>':'')+
      '<span class="chip '+st[1]+'">'+st[0]+'</span>'+
    '</div>'+
    campo(esBug?'Qué esperaba':'Por qué', esBug?r.esperaba:r.porque)+
    campo('Contexto', r.contexto)+
    campo('Diagnóstico', r.diagnostico)+
    campo('Recomendación', r.recomendacion)+
    /* TUS anotaciones, si diste el adelante con matices. Van DESPUÉS de la recomendación
       a propósito: la recomendación es lo que propone quien lo analizó, esto es lo que
       decides tú encima. Quien construya lee las dos, en ese orden. */
    (r.anotaciones? '<div class="sub"><span class="sc">Tus anotaciones</span>'+
       '<p style="margin:4px 0 0;font-size:12.5px;color:#f0cf9e;line-height:1.55">'+
       esc(r.anotaciones)+'</p></div>' : '')+
    /* La captura que adjuntó quien reporta. Para lo visual vale por tres párrafos. */
    (r.captura && /^https?:/.test(String(r.captura))
      ? '<div class="sub"><span class="sc">Captura</span>'+
        '<p style="margin:4px 0 0"><a href="'+esc(r.captura)+'" target="_blank" rel="noopener" '+
        'style="color:var(--red2);font-size:12.5px">ver la captura que adjuntó</a></p></div>'
      : (r.captura ? campo('Captura', r.captura) : ''))+
    (r.vista_previa? '<div class="sub"><span class="sc">Vista previa</span>'+
       '<p style="margin:4px 0 0"><a href="'+esc(r.vista_previa)+'" target="_blank" rel="noopener" '+
       'style="color:var(--red2);font-size:12.5px">abrir el artefacto con los cambios puestos</a></p></div>' : '')+
    /* La compensación va JUNTO a la decisión, no en otra pantalla: el número solo se puede
       juzgar leyendo lo que costó el reporte, y eso está aquí arriba. */
    ((r.estado==='Publicado') ? _compHTML_(r) : '')+
    (r.recomendacion ? _accBuzon_(r, esBug)
      : '<div class="ruta">Todavía sin analizar. Cuando esté reproducido y valorado, aparecen '+
        'aquí el diagnóstico y la recomendación, y con ellos los botones.</div>')+
  '</div>';
}

/* ¿ES UNA MEJORA? **Manda el ID**, igual que en el backend (`_decidirReporte_`): lleva dentro
   el tipo y la cara, asi que no se puede acabar mirando el eje equivocado por un `tipo` mal
   puesto o ausente. `tipo` queda de respaldo para lo que venga sin id. */
function _esMejora_(r){
  var id=String((r&&r.id)||'');
  if(id.indexOf('MEJ-')===0) return true;
  if(id.indexOf('BUG-')===0) return false;
  return (r&&r.tipo)==='mejora';
}

/* Como se llama el eje que mas pesa, en ESTE reporte. Una sola puerta: si esto se decide
   suelto en cada sitio, vuelve a pasar lo del 29/07. */
function _ejeComp_(r){ return _esMejora_(r) ? 'valor' : 'gravedad'; }

/* ⛔ LA GRAVEDAD QUE SE TECLEA, LLEVADA A LAS TRES QUE HAY -- O A NADA.

   El movil la coge de un SELECTOR (`buzon.movil.js`, `data-g`), asi que alli siempre llega
   buena. El escritorio no tiene modal: reporta con `prompt`, o sea que aqui entra lo que a
   uno le de por escribir. Se toleran mayusculas, espacios y la falta de tilde -teclear
   `Cosmético` en un `prompt` es incomodo- y se devuelve SIEMPRE la forma canonica, que es la
   clave de `PESOS_COMP`.

   ⛔ Y LO QUE NO RECONOCE DEVUELVE CADENA VACIA, nunca una de las tres «por si acaso». Quien
   llama NO escribe entonces el campo, con lo que el eje se queda **sin medir** —que es
   exactamente lo que `PESOS_COMP.ejeSinMedir` existe para valer— y `faltan` lo canta en la
   ficha. Poner aqui un valor por defecto es «no lo se» convertido en dato (§3c-24), y ademas
   **apaga el aviso** que existe para pedirlo.

   ⚠️ Y esto no es teorico: hasta el 18/08 `reportarModal()` clavaba `gravedad='Molesta'` sin
   preguntar. Un fallo que BLOQUEA reportado desde el portatil salia sin chip rojo y se
   proponia a **0,50 h en vez de 2,00** -- y esas horas van a la cuota. */
function _normGravedad_(txt){
  var s = String(txt == null ? '' : txt).replace(/^\s+|\s+$/g, '').toLowerCase();
  s = s.replace(/[\u00e1\u00e0\u00e4]/g, 'a').replace(/[\u00e9\u00e8\u00eb]/g, 'e')
       .replace(/[\u00ed\u00ec\u00ef]/g, 'i').replace(/[\u00f3\u00f2\u00f6]/g, 'o')
       .replace(/[\u00fa\u00f9\u00fc]/g, 'u');
  if (s === 'bloquea') return 'Bloquea';
  if (s === 'molesta') return 'Molesta';
  if (s === 'cosmetico') return 'Cosm\u00e9tico';
  return '';
}

/* Suma ponderada -> cuartos de hora -> el escalon de `ESCALA_COMP` que le toca. */
function _ponderaComp_(r){
  var P=PESOS_COMP, h=0, porque=[];
  var eje=_ejeComp_(r), v=String(r[eje]||'');
  if(P[eje][v]!=null){ h+=P[eje][v]; porque.push(v.toLowerCase()+' +'+P[eje][v].toFixed(2)); }
  else { h+=P.ejeSinMedir; porque.push('sin '+eje+' medido +'+P.ejeSinMedir.toFixed(2)); }
  var a=String(r.alcance||''), c=String(r.calidad||'');
  if(P.alcance[a]!=null){ h+=P.alcance[a]; porque.push('alcance '+a+' +'+P.alcance[a].toFixed(2)); }
  if(P.calidad[c]!=null){ h+=P.calidad[c]; porque.push('calidad '+c+' +'+P.calidad[c].toFixed(2)); }
  /* \u26d4 EL ESFUERZO, QUE TENIA PESOS, COLUMNA Y VISTO BUENO Y NO LO LEIA NADIE.
     Daniel lo pidio el 27/07 -«se debe valorar cuanto esfuerzo ha costado encontrar ese bug
     especifico»- y aprobo los valores el 11/08. La tabla estaba puesta, la columna existia y
     la nota de arriba explicaba que «un `Molesta` dificil de encontrar pasa de 0,50 a 1,00 h»
     -- pero esta funcion, que es la que suma, **no lo miraba**.
     \u26d4 Medido el 13/08: con `dificil`, con `directo` o con basura, la propuesta salia
     IDENTICA (0,50 h), y `faltan` decia **«nada»** -- o sea que la pantalla le afirmaba al PD
     que no quedaba ningun eje por medir. Quien reporta un bug que costo encontrar cobraba
     **0,50 h en vez de 1,00**, y esas horas van a la cuota.
     \u26a0\ufe0f Va SIN respaldo a proposito, al reves que el eje de gravedad: `directo` vale 0, asi
     que «no consta» y «lo encontre de frente» pagarian igual y un `ejeSinMedir` aqui
     inventaria horas. Lo que se hace es DECIRLO, y de eso se encarga `faltan`. */
  var ef=String(r.esfuerzo||'');
  if(P.esfuerzo[ef]!=null){ h+=P.esfuerzo[ef]; porque.push('esfuerzo '+ef+' +'+P.esfuerzo[ef].toFixed(2)); }
  var horas=Math.round(h*4)/4;                 // EL REDONDEO A CUARTOS que pidio Daniel
  var techo=_esMejora_(r) ? P.topeMejora : P.tope;
  if(horas<P.minimo) horas=P.minimo;
  if(horas>techo){ horas=techo; porque.push('techo de '+(_esMejora_(r)?'mejora':'bug')+' '+techo.toFixed(2)); }
  porque.push('suma '+h.toFixed(2)+' → '+horas.toFixed(2)+' h');
  return {horas:horas, porque:porque};
}

/* La etiqueta que le corresponde a esas horas, para que el numero venga con su significado. */
function _etiquetaComp_(horas){
  for(var i=ESCALA_COMP.length-1;i>=0;i--) if(horas>=ESCALA_COMP[i][0]) return ESCALA_COMP[i][1];
  return ESCALA_COMP[0][1];
}

/* Devuelve `{horas, etiqueta, porque[], faltan[]}`. `faltan` son los ejes que el triaje no
   escribio: se asume lo conservador y SE DICE, en vez de disimular el hueco. */
function _compPropuesta_(r){
  var p=_ponderaComp_(r), faltan=[];
  if(!r[_ejeComp_(r)]) faltan.push(_ejeComp_(r));
  if(!r.alcance) faltan.push('alcance');
  if(!r.calidad) faltan.push('calidad del reporte');
  /* \u26d4 Y EL ESFUERZO SE DICE CUANDO FALTA. Sin esta linea, `faltan` contestaba «nada»
     mientras el eje no se estaba midiendo: la pantalla afirmandole al PD que ya lo ha mirado
     todo. Es el mismo «no lo se» disfrazado de dato que este fichero evita en los otros tres. */
  if(!r.esfuerzo) faltan.push('esfuerzo de encontrarlo');
  return {horas:p.horas, etiqueta:_etiquetaComp_(p.horas), porque:p.porque, faltan:faltan};
}

/* NADIE SE COMPENSA A SI MISMO, y solo cuenta lo que llego a produccion -que es cuando se sabe
   lo que valia-. Devuelve el motivo por el que NO se puede, o null si se puede.

   ⚠️ SE BORRO POR ACCIDENTE el 29/07 (commit 2b09b32, al reescribir el bloque de la escala) y
   `_compHTML_` la seguia llamando: la ficha de **cualquier reporte `Publicado`** moria con
   `ReferenceError: _compPuede_ is not defined`. O sea que la pantalla con la que se paga llevaba
   un dia muerta, publicada en beta, y no se vio porque nadie abrio una ficha ya publicada.

   Restaurada el 30/07 con UN cambio sobre el original: la identidad sale de `_actorSanc_()` y no
   de `ACTOR`. `ACTOR` lo reescribe «ver como» (:4886), asi que el PD mirando la ficha de Adrian
   se veria a si mismo como autor y se quedaria **sin poder compensarle**. Es literalmente el
   fallo que se corrigio en sanciones el 28/07: la autoridad no se hereda mirando. */
function _compPuede_(r){
  if((r.estado||'')!=='Publicado') return 'solo cuando esté publicado';
  var yo=_actorSanc_();
  if(r.quien===yo || _m(r.quien).pila===_m(yo).pila) return 'es tuyo: nadie se compensa a sí mismo';
  if(r.horas_otorgadas) return 'ya compensado con '+r.horas_otorgadas+' h';
  return null;
}

function _compHTML_(r){
  var p=_compPropuesta_(r), no=_compPuede_(r);
  var ID=esc(r.id);
  return '<div class="sub"><span class="sc">Compensación en horas</span>'+
    '<p style="margin:4px 0 0;font-size:12.5px;color:var(--ink2);line-height:1.55">'+
      'La matriz propone <b>'+p.horas+' h</b> — '+esc(p.porque.join(' · '))+'.'+
      (p.faltan.length? '<br><span style="color:var(--warn)">El triaje no escribió '+
        esc(p.faltan.join(' ni '))+': se ha supuesto lo más conservador.</span>' : '')+
      '<br><span style="color:var(--ink3)">La escala todavía no la has fijado tú; estos '+
      'valores son una propuesta y están en <span class="mono">MATRIZ_COMP</span>.</span></p>'+
    (no
      ? '<div class="ruta">No se puede otorgar: '+esc(no)+'.</div>'
      : '<div class="acts">'+
          '<label style="display:flex;align-items:center;gap:7px;font-size:12.5px">Horas'+
          '<input type="number" step="0.25" min="0" max="8" value="'+p.horas+'" data-comph="'+ID+'" '+
          'style="width:78px;background:#0A0909;border:1px solid var(--line);border-radius:8px;'+
          'padding:7px 9px;color:var(--ink);font:inherit;font-size:12.5px"></label>'+
          '<button class="btn pri" data-comp="'+ID+'">Otorgar a '+esc(_m(r.quien).pila)+'</button>'+
        '</div>')+
  '</div>';
}

function _accBuzon_(r, esBug){
  var t=esBug?'bug':'mejora', ID=esc(r.id);
  var notas=(BZ_NOTAS[r.id]!=null?BZ_NOTAS[r.id]:(r.anotaciones||''));
  function bot(acc, txt, cls){
    return '<button class="btn '+(cls||'')+'" data-bz="'+ID+'" data-bzt="'+t+'" data-bzacc="'+acc+'">'+txt+'</button>';
  }
  /* Confirmacion en linea: se sustituyen los botones por el aviso y un si/no. Se ve el aviso
     Y el reporte a la vez, que es lo que un `confirm()` no deja hacer. */
  if(BZ_CONF && BZ_CONF.id===r.id){
    var seca=BZ_CONF.acc, conN=BZ_CONF.notas;
    return '<div class="sub" style="border-color:var(--red2)">'+
      '<span class="sc">'+(conN?seca.toUpperCase()+' CON ANOTACIONES':seca.toUpperCase())+'</span>'+
      '<p style="margin:4px 0 0;font-size:12.5px;color:var(--ink2);line-height:1.55">'+
        esc(BZ_AVISO[seca]||'')+'</p>'+
      (conN?'<p style="margin:6px 0 0;font-size:12.5px;color:#f0cf9e;line-height:1.55">'+
        esc((BZ_NOTAS[r.id]||'').trim())+'</p>':'')+
      '<div class="acts">'+
        '<button class="btn pri" data-bzok="'+ID+'" data-bzt="'+t+'">Confirmar</button>'+
        '<button class="btn" data-bzno="">Volver</button>'+
      '</div></div>';
  }
  /* YA CONSTRUIDO Y EN LA BETA. Aquí NO va un botón de «publicar» por reporte: un release
     sube el fichero ENTERO, así que todo lo que esté en la beta sale a la vez o no sale.
     Un botón por reporte describiría algo que no ocurre. Daniel (28/07): «tengo que poder
     publicar en bloque, no tiene sentido publicar las cosas una a una», y «lo de publicar
     los cambios sí que es a mi orden por este chat».
     Lo que sí hace falta aquí es poder SACAR uno del lote antes de que salga. */
  if(r.estado==='Listo para revisar'){
    return '<div class="ruta">Hecho y <b>en la beta</b>, sin publicar. Sale a producción con el '+
      'próximo release, junto con todo lo demás que haya en la beta — y el release lo pides tú.'+
      '<br>Si este no debe salir, sácalo del lote descartándolo con tus anotaciones.</div>'+
      '<textarea data-bznotas="'+ID+'" placeholder="Por qué lo sacas del lote…">'+esc(notas)+'</textarea>'+
      '<div class="acts">'+
        bot('Adelante+','Devolver: rehacer con anotaciones')+
        bot('Descartado+','Sacar del lote, con anotaciones','no')+
      '</div>';
  }
  /* ⛔ UN REPORTE CERRADO YA NO SE DECIDE. Hasta el 04/08 esto caia al bloque de 4 decisiones
     para CUALQUIER estado que no fuera «Listo para revisar»: un reporte `Publicado` o
     `Descartado` seguia ofreciendo «Adelante» y «Descartar», y el servidor lo escribia sin
     comprobar el estado previo. Ofrecer una accion que reescribe algo terminal es peor que no
     ofrecerla: parece que queda algo por decidir cuando ya se decidio.
     El freno de verdad esta en `_decidirReporte_` (las caras son dos y el dato uno); esto es
     lo que evita que se llegue a pulsar. */
  if(r.estado==='Publicado' || r.estado==='Descartado'){
    return '<div class="ruta">Este reporte ya está <b>'+esc(r.estado.toLowerCase())+'</b>'+
      (r.decidido_por?', decidido por <b>'+esc(_m(r.decidido_por).pila||r.decidido_por)+'</b>':'')+
      (r.decidido_at?' · '+esc(String(r.decidido_at).slice(0,16).replace('T',' ')):'')+
      '. No quedan decisiones que tomar.'+
      ((notas||'').trim()?'<br><span style="color:var(--ink3)">Anotaciones: '+esc(notas.trim())+'</span>':'')+
      '</div>';
  }
  return '<textarea data-bznotas="'+ID+'" placeholder="Anotaciones — qué parte sí, qué parte no, cómo lo quieres. Las lee quien lo construya antes de empezar…">'+
      esc(notas)+'</textarea>'+
    '<div class="acts">'+
      bot('Adelante','Adelante, hazlo','pri')+
      bot('Adelante+','Adelante, con anotaciones')+
      bot('Descartado+','Descartar con anotaciones','no')+
      bot('Descartado','Descartar','no')+
    '</div>';
}

function _filaBuzon_(r){
  if(BUZON_SEL===r.id) return _fichaBuzon_(r);
  var st=_estBuzon_(r.estado);
  return '<div class="dec" data-bzsel="'+esc(r.id)+'">'+
    '<span class="ic"><svg><use href="#i-doc"/></svg></span>'+
    '<span class="tx"><b>'+esc(r.titulo)+'</b><small><span class="mono">'+esc(r.id)+'</span> · '+
      esc(_m(r.quien).pila)+' · '+esc(r.donde||'—')+(r.pantalla?' · '+esc(r.pantalla):'')+'</small></span>'+
    '<span class="der">'+
      ((!_esMejora_(r)&&r.gravedad==='Bloquea')?'<span class="chip no">bloquea</span>':'')+
      ((_esMejora_(r)&&r.valor==='Alto')?'<span class="chip no">valor alto</span>':'')+
      '<span class="chip '+st[1]+'">'+st[0]+'</span><span class="chev">›</span></span></div>';
}

