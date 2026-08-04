/* ═══ BUZON · cara movil ═══════════════════════════════════════════════════════════
   5 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

function _contextoM_(){
  var ua=navigator.userAgent||'';
  var nav=/Firefox/.test(ua)?'Firefox':/Edg/.test(ua)?'Edge':/Chrome/.test(ua)?'Chrome':
          /Safari/.test(ua)?'Safari':'otro';
  /* El canal va DENTRO del contexto: dos ficheros con el mismo aspecto y distinto código
     son la forma más fácil de perseguir un fallo en el sitio equivocado. */
  return 'movil'+(CANAL==='beta'?' · BETA':(VERSION?' · v'+VERSION:''))+' · '+nav+' · '+screen.width+'x'+screen.height+
    ' · build '+BUILD+' · datos '+(DATA.generado||'?')+
    (_esStandalone_()?' · desde la pantalla de inicio':'');
}

/* EL PINTOR. `alTerminar(dataUrl)` recibe las dos capas YA fusionadas, o no se llama si
   se cancela. Todo el estado vive aquí dentro: al cerrarse no queda nada. */
function _abrirPintor_(fondoUrl, alTerminar){
  var caja=$('#pintor'), zona=$('#pzona'), lienzo=$('#plienzo');
  var img=$('#pfondo'), cv=$('#ptrazos');
  if(!caja||!img||!cv) return;
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
  $('#pdeshacer').onclick=function(){
    if(!trazos.length){ tost('No hay nada que deshacer.'); return; }
    trazos.pop(); repintar();
  };

  function cerrar(){ caja.classList.remove('on'); caja.setAttribute('aria-hidden','true'); }
  $('#pcancelar').onclick=function(){
    if(trazos.length && !confirm('Vas a salir sin guardar lo que has pintado. ¿Seguro?')) return;
    cerrar();
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
    alTerminar(out.toDataURL('image/jpeg', 0.82), trazos.length);
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

/* La fila del adjunto dentro del formulario del buzón. */
function _fotoBuzonHTML_(){
  if(!BZ_FOTO)
    return '<div class="bzfoto">'+
      '<div class="tx"><b>Una foto ayuda mucho</b>Sobre todo si es de sitio: adjunta una '+
      'captura y márcala con el lápiz.</div>'+
      '<button class="btn mini" id="bzAdj" data-p>Adjuntar</button></div>'+
      '<input type="file" id="bzFile" accept="image/*" style="display:none">';
  return '<div class="bzfoto">'+
    '<img class="mini" src="'+BZ_FOTO.url+'" alt="">'+
    '<div class="tx"><b>Foto adjunta</b>'+BZ_FOTO.w+'×'+BZ_FOTO.h+' · '+_pesoKB_(BZ_FOTO.url)+' KB'+
      (BZ_FOTO.trazos?' · '+BZ_FOTO.trazos+' trazo'+(BZ_FOTO.trazos===1?'':'s'):'')+'</div>'+
    '<button class="btn mini" id="bzPintar" data-p aria-label="marcar la foto">✏️</button>'+
    '<button class="btn mini" id="bzQuitar" data-p>Quitar</button></div>'+
    '<input type="file" id="bzFile" accept="image/*" style="display:none">';
}

function _cablearFotoBuzon_(repinta){
  var f=$('#bzFile'), adj=$('#bzAdj'), pin=$('#bzPintar'), qui=$('#bzQuitar');
  if(adj&&f) adj.onclick=function(){ f.click(); };
  if(f) f.onchange=async function(){
    var file=f.files&&f.files[0]; if(!file) return;
    try{
      var im=await _leerImagen_(file);
      BZ_FOTO={url:im.url, w:im.w, h:im.h, trazos:0};
      repinta();
      /* Se abre el pintor solo: casi siempre se adjunta PARA marcar algo, y así no hay que
         descubrir el lápiz. Salir sin pintar deja la foto igual. */
      _abrirPintor_(BZ_FOTO.url, function(url, n){
        BZ_FOTO={url:url, w:im.w, h:im.h, trazos:n}; repinta(); });
    }catch(e){ tost('No se pudo usar esa imagen: '+((e&&e.message)||e)); }
  };
  if(pin) pin.onclick=function(){
    /* Se vuelve a pintar sobre lo ya fusionado: los trazos anteriores quedan dentro de la
       foto y no se pueden deshacer, pero se pueden tapar. Guardar la original aparte para
       poder rehacer sería otra copia en memoria por cada reporte. */
    _abrirPintor_(BZ_FOTO.url, function(url,n){
      BZ_FOTO={url:url, w:BZ_FOTO.w, h:BZ_FOTO.h, trazos:(BZ_FOTO.trazos||0)+n}; repinta(); });
  };
  if(qui) qui.onclick=function(){ BZ_FOTO=null; repinta(); };
}

function buzonModal(tipo){
  var esBug=(tipo!=='mejora');
  var pant=_NOMBRE_PANTALLA_[ST.vista]||ST.vista;
  abrirModal('<div class="mtit">'+(esBug?'Reportar un fallo':'Proponer una mejora')+'</div>'+
    '<div class="msub">Estás en <b>'+esc(pant)+'</b> · se envía con tu nombre</div>'+
    '<div class="modos" id="bzTipo" style="margin-bottom:12px">'+
      '<button data-bt="bug" class="'+(esBug?'on':'')+'" data-p>Un fallo</button>'+
      '<button data-bt="mejora" class="'+(esBug?'':'on')+'" data-p>Una mejora</button></div>'+
    '<label class="campo"><span class="sc">'+(esBug?'¿Qué ha pasado?':'¿Qué mejorarías?')+
      ' <span class="req">*</span></span>'+
      '<input id="bzTit" placeholder="'+(esBug?'en una línea…':'en una línea…')+'" autocomplete="off"></label>'+
    '<label class="campo"><span class="sc">'+(esBug?'¿Qué esperabas que pasara?':'¿Por qué? ¿Qué te cuesta hoy?')+'</span>'+
      '<textarea id="bzDet" placeholder="'+(esBug?'y qué hiciste justo antes, si lo recuerdas…':'el problema de fondo, no la solución…')+'"></textarea></label>'+
    (esBug?'<span class="sc" style="display:block;margin-bottom:6px">¿Cuánto molesta?</span>'+
      '<div class="modos" id="bzGrav" style="margin-bottom:12px">'+
      '<button data-g="Bloquea" data-p>Me bloquea</button>'+
      '<button data-g="Molesta" class="on" data-p>Molesta</button>'+
      '<button data-g="Cosmético" data-p>Es cosmético</button></div>':'')+
    _fotoBuzonHTML_()+
    '<p class="rnota">Esto <b>no cambia nada por sí solo</b>: va a una cola que revisa el '+
    'Project Director. Si sale adelante, se prepara y se te avisa.</p>'+
    '<button class="btn pri full" data-p id="bzEnviar" style="margin-top:10px">Enviar</button>');
  var grav='Molesta';
  /* Se repinta SOLO la fila de la foto, no el modal entero: reconstruirlo borraría lo que
     ya hubieras escrito, que es la peor forma de perder un reporte. */
  function _repintaFoto_(){
    var vieja=$('.bzfoto'), inp=$('#bzFile');
    if(!vieja) return;
    var tmp=document.createElement('div'); tmp.innerHTML=_fotoBuzonHTML_();
    vieja.replaceWith(tmp.firstChild);
    if(inp) inp.remove();
    var nuevoInp=tmp.querySelector('#bzFile');
    if(nuevoInp) $('.bzfoto').parentNode.insertBefore(nuevoInp, $('.bzfoto').nextSibling);
    _cablearFotoBuzon_(_repintaFoto_);
  }
  _cablearFotoBuzon_(_repintaFoto_);
  $$('#bzGrav button').forEach(function(b){ b.onclick=function(){
    $$('#bzGrav button').forEach(function(x){x.classList.remove('on');});
    b.classList.add('on'); grav=b.dataset.g; }; });
  $$('#bzTipo button').forEach(function(b){ b.onclick=function(){ buzonModal(b.dataset.bt); }; });
  var env=$('#bzEnviar');
  env.onclick=async function(){
    if(env.disabled) return;
    var tit=($('#bzTit').value||'').trim(), det=($('#bzDet').value||'').trim();
    if(!tit){ tost('Escribe al menos en una línea qué pasa.'); $('#bzTit').focus(); return; }
    if(typeof backendOK==='undefined' || !backendOK || !SESION){
      tost('Sin conexión con el servidor no se puede enviar. Vuelve a intentarlo.'); return; }
    /* LA VERSION ES LA DEL CODIGO, no la de los datos. Antes iba `DATA.generado` -cuando se
       genero el panel-, que no dice nada de que build estaba viendo quien reporta. Y esa es
       la pregunta que costo dos rondas el 27/07: Pages cachea el HTML 10 min, asi que un
       reporte contra una build vieja manda a buscar un fallo que ya no existe. */
    var datos={ titulo:tit, donde:'Móvil', pantalla:pant,
                version:BUILD, contexto:_contextoM_() };
    if(BZ_FOTO && BZ_FOTO.url) datos.captura=BZ_FOTO.url;
    if(esBug){ datos.esperaba=det; datos.paso=tit; datos.gravedad=grav; }
    else { datos.mejora=tit; datos.porque=det; datos.a_quien=''; }
    env.disabled=true; var prev=env.textContent; env.textContent='Enviando…';
    try{
      var r=await (esBug?api.reportarBug(datos):api.reportarMejora(datos));
      /* SI LA FOTO NO SE GUARDÓ, SE DICE. El backend solo devuelve `captura` cuando la ha
         subido a Drive; mientras esa parte no esté desplegada, callarse sería dejar creer
         que la marcaste para nada. */
      var sinFoto = datos.captura && !(r && r.captura);
      BZ_FOTO=null;
      /* ACUSE ANTES DE CERRAR (Daniel, 28/07). Cerrar de golpe deja la duda de si llegó:
         el botón se pone en verde diciendo «Enviado», se ve un segundo y ENTONCES se
         cierra. Va aquí, después del `await`, así que solo se enseña cuando el servidor
         ya ha contestado — anunciar el envío antes de confirmarlo sería mentir bonito.
         Si la foto no entró, el modal NO se cierra solo: eso hay que leerlo, no verlo de
         refilón en un aviso que se va. */
      env.textContent='Enviado ✓';
      env.classList.remove('pri'); env.classList.add('ok');
      env.disabled=true;
      if(sinFoto){
        /* EL AVISO SE QUEDA EN PANTALLA, no en un `tost`. Lo puse en un aviso flotante y
           Daniel no vio nada: dura 2,4 s, sale abajo del todo y justo cuando el modal
           cambia. Perder una foto que alguien se ha parado a marcar y contarlo en un
           mensaje que se va es no contarlo. Ahora es un bloque ámbar dentro del
           formulario, con el id del reporte, y solo se va cuando cierras tú. */
        var _av=document.createElement('div');
        _av.className='avisolargo';
        _av.style.cssText='margin-top:10px;border-color:rgba(232,145,46,.45);'+
          'background:rgba(232,145,46,.10);color:#f0cf9e';
        _av.innerHTML='<b style="color:var(--warn)">El texto se ha guardado · '+esc((r&&r.id)||'')+'</b><br>'+
          'Pero <b>la foto no</b>: al servidor todavía le falta el paso que la sube. '+
          'Cuéntaselo a Daniel — es un despliegue de dos líneas.';
        env.parentNode.insertBefore(_av, env.nextSibling);
        _av.scrollIntoView({block:'nearest'});
        return;
      }
      setTimeout(function(){
        cerrarModal();
        tost((esBug?'Fallo reportado':'Mejora enviada')+' · '+((r&&r.id)||'')+'. Gracias.');
      }, 1000);
    }catch(e){ env.disabled=false; env.textContent=prev;
      tost('No se pudo enviar: '+((e&&e.message)||e)); }
  };
}

