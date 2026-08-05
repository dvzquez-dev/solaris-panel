/* ═══ CÓDIGO COMPARTIDO POR LAS DOS CARAS ═══════════════════════════════════════════════
   Lo cargan `movil.html` y `escritorio.html` con <script src>. Aquí vive lo que ANTES estaba
   COPIADO en las dos: 69 funciones idénticas, 468 líneas por cara.

   ⛔ Por qué ahora sí se puede: **no hay CSP** en lo publicado. GitHub Pages no manda la
   cabecera y las caras no la declaran (comprobado contra la beta servida; de hecho ya cargan
   un script de `accounts.google.com`). La regla «la CSP impide compartir código entre las
   caras» es cierta para un **Artifact de claude.ai** —un HTML suelto y autocontenido— y
   **falsa para GitHub Pages**. Si algún día vuelve a publicarse una cara como Artifact, esto
   hay que volver a meterlo dentro.

   ⚠️ Se carga ANTES del <script> grande de cada cara, así que estas funciones ya existen
   cuando aquel se ejecuta. Pueden usar los globales de su cara (`DATA`, `ACTOR`, `V`…): se
   llaman en tiempo de ejecución, cuando ya están definidos — igual que antes.

   ⛔ Y desaparecen de aquí los avisos «GEMELA · si tocas una, toca la otra»: con una sola
   copia son mentira, y un aviso que miente enseña a ignorar los que no.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

function redu(){return RM.matches;}

function nf(v,d){return new Intl.NumberFormat('es-ES',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}).format(v);}

function nf2(v){return new Intl.NumberFormat('es-ES',{minimumFractionDigits:0,maximumFractionDigits:2}).format(v);}

/* Las horas van con los decimales que TENGAN, no con uno fijo. Con `nf(v,1)` un cuarto de
   hora -0,25- se pintaba «0,3 h», que ademas no es ningun escalon de la escala de
   compensacion. Se muestran dos decimales solo si el numero los usa: 2 h se lee mejor que
   2,00 h, y 0,25 h tiene que leerse 0,25 h. GEMELA en las dos caras. */
function h1(v){ var n=Number(v)||0; return nf(n, (Math.round(n*100)%100===0) ? 0 : 2)+' h'; }

function pc(v){return (v>=0?'+':'−')+nf(Math.abs(v),1)+' %';}

function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function pad(n){return String(n).padStart(2,'0');}

function _hoyDateM_(){ var d=new Date(_dmyAISO_(HOY)+'T00:00:00'); return isNaN(d)?new Date():d; }

/* Quien puede usar la beta. Se deja en una funcion sola porque ensancharla es una linea:
   `|| _rangoBeta_()>=1` mete a los coordinadores. */
function _puedeBeta_(){ return CANAL!=='beta' || esAdmin() || _rangoBeta_()>=3; }

/* ⚠️ AUTORIDAD TRIPLICADA a proposito (mapa §5, D9): `rangoNom`, `coordinadorDe`,
   `revisoresDe` y `puedeDecidir*` existen aqui, en `movil.html` y en el backend
   (`_rangoNom_`, `_coordinadorDe_`, `_revisoresDe_`, `_puedeDecidir_`). **El backend es
   la unica frontera de seguridad**; las dos caras llevan su copia solo para PINTAR.
   Si cambias una regla de autoridad, son TRES ficheros.
   `puedeDecidirParte` y `puedeDecidirDoc` NO se funden: son dos autoridades distintas
   -horas y documentos- y darles el mismo nombre las haria parecer la misma. */
function _rangoBeta_(){ return (SESION&&SESION.nombre) ? rangoNom(SESION.nombre) : 0; }

function _activos_(){ return (DATA.miembros||[]).filter(function(m){ return !m.baja; }); }

function _hMesReal_(m){
  m = m || {};
  /* `horasMes` PRIMERO: es el campo que llega del backend con el overlay de Notion en
     vivo. `hMes` es una COPIA que hace `_aplicarPanel_` para las vistas que leen corto,
     y una copia puede quedarse atras. Ante la duda, el original. */
  return (typeof m.horasMes==='number') ? m.horasMes
       : (typeof m.hMes==='number') ? m.hMes : null;
}

/* EL UMBRAL, EN DIRECTO. Regla de Daniel (27/07):

     «cada mes tiene un peso de 1 y dentro de ese mes se reparte equitativamente entre los
      miembros activos; luego se normaliza a los meses que hay. Un mes con menos gente
      cuenta lo mismo que uno con mas: solo importa la media local de ese mes.»

   Y el mes EN CURSO entra con el peso de lo que lleva transcurrido (dia/dias del mes).
   Sin eso, cada dia 1 el umbral pegaria un salto al aparecer un mes entero de golpe; con
   eso se mueve poco a poco. Por eso se calcula AQUI y no viene ya hecho del backend: el
   peso cambia cada dia, y un numero subido ayer ya no seria el de hoy.

   Los ingredientes -las medias mensuales ya cerradas y la del mes abierto- SI vienen del
   panel (`flujos/umbral.py`), porque salen del historico mensual y eso la app no lo tiene.

   OJO: la poblacion del umbral NO es la de las estadisticas, y es a proposito.

   Las estadisticas del panel (medias, «en infraccion») miden al equipo que hay HOY, asi que
   van sobre `_activos_()`. El umbral es otra cosa: sale del RRI y mide la TEMPORADA, asi que
   entran TODOS los que estuvieron en ella —tambien quien luego se fue—, cada uno por los
   meses que estuvo. Si alguien curro medio año, ese medio año cuenta.

   Y la magnitud tampoco es `hMes` (lo que llevas ESTE mes) sino **horas de temporada
   divididas por meses de estancia**, que es lo que dice la primera linea de
   `reglas/cuota.py`. Asi quien lleva 3 meses no sale hundido frente a quien lleva 11: la
   ponderacion por meses ya esta dentro del propio ratio.

   No las 'armonices' en una sola: son dos preguntas distintas con dos respuestas distintas.
   (Lo hice y salio 13,13 donde tocaba 11,80.) */
function _fraccionDelMes_(d){
  d=d||new Date();
  var dias=new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();   // dia 0 del siguiente
  return Math.max(0, Math.min(1, d.getDate()/dias));
}

function _umbral_(){
  var ing=DATA.umbral;
  if(ing && ing.medias && ing.medias.length){
    var num=0, den=0;
    ing.medias.forEach(function(x){ num+=x; den+=1; });        // cada mes cerrado pesa 1
    var ma=ing.mesAbierto;
    if(ma && typeof ma.media==='number'){
      var w=_fraccionDelMes_();                                 // el abierto, a prorrata
      num+=ma.media*w; den+=w;
    }
    if(den>0) return Math.max(ing.lo||UMBRAL_LO, Math.min(ing.hi||UMBRAL_HI, (ing.frac||UMBRAL_FRAC)*(num/den)));
  }
  /* Sin ingredientes (backend viejo, o una cuenta a la que no se los sirven) se cae a la
     aproximacion por persona: media de `horasTemp/meses` de TODOS los de la temporada. No
     es la misma cuenta -pondera por persona, no por mes- pero es del mismo orden y honesta.
     Y si ni eso, al ultimo valor conocido: nunca a 2/3 de tus propias horas, que no es el
     umbral de nadie. */
  var hs=(DATA.miembros||[]).map(function(m){
      return (typeof m.horasTemp==='number' && m.meses) ? (m.horasTemp/m.meses) : null;
    }).filter(function(h){ return typeof h==='number'; });
  if(hs.length<2) return UMBRAL;
  var media=hs.reduce(function(a,h){ return a+h; },0)/hs.length;
  return Math.max(UMBRAL_LO, Math.min(UMBRAL_HI, UMBRAL_FRAC*media));
}

/* `_ApiTransito` marca los fallos que SI se reintentan: la peticion no llego entera. Se
   distingue de un «no» del backend, que no se reintenta porque tiene criterio. */
function _ApiTransito(m){ this.message=m; this.transito=true; }

function _apiParse(txt, accion){
  var j=null; try{ j=JSON.parse(txt); }catch(_){}
  /* Lo que vuelve no es JSON: es la pagina HTML de Google del 404 transitorio. */
  if(!j) throw new _ApiTransito("respuesta no válida del backend");
  if(j.ok===true) return j.data;
  var err=String(j.error||"");
  /* «acción desconocida: » con la accion VACIA = el cuerpo del POST se perdio por el camino
     y el backend no vio ninguna accion. Nunca llego a ejecutarse nada, asi que se repite. */
  if(accion && /^acci[oó]n desconocida/.test(err) && err.indexOf(accion)<0)
    throw new _ApiTransito("el cuerpo del POST no llegó ("+err+")");
  throw new Error(err||"respuesta no válida del backend");
}

/* Mapea un parte del BACKEND (subsistema/justificacion/estado 'pendiente'…) al modelo que
   pinta el escritorio (unidad/just/estado 'pend'…). Sin datos inventados: los flags de
   calidad de la maqueta no existen en real, salvo los que el propio dato delata. */
function _isoADMY_(f){ f=String(f||''); var m=f.match(/^(\d{4})-(\d{2})-(\d{2})/); return m?(m[3]+'/'+m[2]+'/'+m[1]):f; }

function _hmMin_(m){                       // minutos -> 'HH:MM'
  m=(+m||0); return pad(Math.floor(m/60)%24)+':'+pad(m%60);
}

function _horasHM_(v){ return _minHM_(v)/60; }

/* Maximo comun divisor. Vive AQUI, con la familia de `HH:MM`, y no dentro de `vReu`, porque es
   GEMELA byte a byte de la del escritorio y una closure no se puede comparar de un vistazo.
   Se usa para el PASO de la rejilla: el mcd de los inicios y las duraciones de las franjas. */
function _mcd_(a,b){ while(b){ var t=a%b; a=b; b=t; } return a; }

/* Pide una accion del api SIN que un fallo se lleve por delante a las demas. Nace de un
   fallo real: `api.getTurnos` no estaba declarada, y como la llamada iba en un
   `Promise.all`, el TypeError mataba tambien el refresco de reuniones que iba al lado.
   Devuelve `null` en vez de reventar, y deja rastro en la consola para que no vuelva a
   pasar en silencio. */
function _pide_(accion, arg){
  try{
    if(typeof api[accion]!=='function'){
      try{ console.warn('api.'+accion+' no existe: ese dato no se refresca'); }catch(_){}
      return Promise.resolve(null);
    }
    return Promise.resolve(api[accion](arg)).catch(function(){ return null; });
  }catch(_){ return Promise.resolve(null); }
}

function _ordenarFranjas_(r){
  var F=(r&&r.franjas)||[], bl=(r&&r.bloques)||[], fij=(r&&r.fijadaBl)||[];
  var idx=F.map(function(_,i){ return i; });
  if(idx.every(function(i){ return i===0 || _minHM_(F[i-1])<=_minHM_(F[i]); }))
    return {franjas:F, bloques:bl, fijadaBl:fij, cambio:false};
  idx.sort(function(a,b){ return _minHM_(F[a])-_minHM_(F[b]); });
  var pos=[]; idx.forEach(function(vi,k){ pos[vi]=k; });
  return {
    franjas:  idx.map(function(i){ return F[i]; }),
    bloques:  bl.map(function(b){ return Array.isArray(b)?[b[0],pos[b[1]]]:b; }),
    fijadaBl: fij.map(function(b){ return Array.isArray(b)?[b[0],pos[b[1]]]:b; }),
    cambio:   true
  };
}

/* De sanción a movimiento del libro. La forma que espera `medidorHTML` es `{f,art,t,p,vv}`.
   `vv` es la tercera columna —lo que pasa con esos puntos— y se resuelve AQUI y no al pintar,
   porque depende del estado y el pintado no tiene por qué saber de estados de sanción. */
function _movDeSancion_(s){
  var just=(s.estado==='justificada');
  var iso=String(s.fecha||'').slice(0,10);
  return {
    f: (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? _isoADMY_(iso) : (s.fecha||'')),
    art: String(s.articulo||'—'),
    t: String(s.motivo||'(sin motivo)'),
    /* La insignia y la etiqueta salen del MISMO dato. El backend ya manda 0 en una
       justificada, pero si algun dia mandara el valor crudo se veria «−1» al lado de «no
       restó», que es lo peor que puede pasar aqui: dos cosas ciertas por separado que juntas
       se contradicen, y la persona sin saber si le quitaron el punto o no. */
    p: just ? 0 : (Number(s.puntos)||0),
    /* Los puntos SE REINICIAN CADA TEMPORADA (RRI Art. 29), no caducan sanción a sanción. Se
       dice así, con palabras, en vez de inventarse una fecha exacta que el RRI no fija. */
    vv: just ? 'justificada<br>no restó' : 'hasta el fin<br>de temporada'
  };
}

function cerrarSesion(){
  SESION=null;
  try{ localStorage.removeItem('sol_sess'); localStorage.removeItem('sol_last_email'); }catch(_){}
  try{ if(window.google&&google.accounts&&google.accounts.id) google.accounts.id.disableAutoSelect(); }catch(_){}
  location.reload();
}

/* La subcoordinacion de alguien, o `null`. */
function _subcoordDe_(n){
  for (var i=0;i<SUBCOORD.length;i++) if (SUBCOORD[i].quien === String(n)) return SUBCOORD[i];
  return null;
}

function rangoSanc(nombre){
  var n = String(nombre || '');
  if (RANGO_SANC[n] != null) return RANGO_SANC[n];
  /* Rango 1 = tiene gente bajo su jurisdiccion: los coordinadores (su unidad) y quien tenga
     jurisdiccion propia declarada (un subcoordinador). */
  if (_subcoordDe_(n)) return 1;
  var m = _mSanc_(n);
  if (m && m.cargo === 'Coordinador') return 1;
  return 0;
}

/* ¿Puede `actor` sancionar a `objetivo`? Una sola puerta: si alguna pantalla decide esto por su
   cuenta, en dos semanas dira otra cosa que esta. */
function puedeSancionarA(actor, objetivo){
  var r = rangoSanc(actor);
  if (r <= 0) return false;
  if (r >= 3) return true;                                   // el PD, a cualquiera
  if (r === 2) return String(objetivo) !== PD_SANC;          // rango 2, a todos menos al PD
  /* Rango 1: a si mismo y a los suyos. */
  if (String(objetivo) === String(actor)) return true;
  var a = _mSanc_(actor), o = _mSanc_(objetivo);
  /* Coordinador de la unidad: la unidad ENTERA, subequipos incluidos. Se mira ANTES que la
     subcoordinacion porque Oscar es las dos cosas y lo que manda es lo mas amplio. */
  if (a && a.cargo === 'Coordinador' && o && a.unidad && a.unidad === o.unidad) return true;
  /* Subcoordinador: SU equipo y nada mas. No se le suma el subsistema — eso es justo lo
     que lo distingue del coordinador. */
  var sc = _subcoordDe_(String(actor));
  if (sc) return sc.gente.indexOf(String(objetivo)) >= 0;
  return false;
}

/* A quien puede sancionar, ya filtrado. Lo usan los dos formularios: que la lista salga de
   la MISMA regla que el permiso es lo que impide ofrecer a alguien y que el envio falle. */
function sancionablesPor(actor){
  return (DATA.miembros || []).filter(function(m){
    return m && !m.baja && puedeSancionarA(actor, m.nombre);
  });
}

/* EL ORDEN DE LOS SUBSISTEMAS, deducido y no escrito a mano: es el orden en que vienen los
   miembros del panel, que es el que trae Notion. Una constante aqui se quedaria vieja el dia
   que se reordene alla, y nadie se enteraria hasta que alguien mirase. */
function _ordenSubs_(){
  var vis=[];
  (DATA.miembros||[]).forEach(function(m){
    var u=m&&m.unidad; if(u && vis.indexOf(u)<0) vis.push(u);
  });
  return vis;
}

function _tareasDe_(nombre, alLlegar){
  var n = String(nombre || '');
  if (!n) return [];
  if (SANC_TAREAS.quien === n && SANC_TAREAS.lista) return SANC_TAREAS.lista;
  if (SANC_TAREAS.quien === n && SANC_TAREAS.cargando) return null;   // ya se esta pidiendo
  SANC_TAREAS = { quien: n, lista: null, cargando: true };
  api.getTareas(n).then(function(l){
    /* Solo se acepta la respuesta si sigue siendo la persona que se pidio: si mientras llegaba
       se eligio a otra, pintar esto seria ofrecer las tareas de quien no es. */
    if (SANC_TAREAS.quien !== n) return;
    SANC_TAREAS = { quien: n, lista: l || [], cargando: false };
    if (alLlegar) alLlegar();
  }).catch(function(e){
    if (SANC_TAREAS.quien !== n) return;
    SANC_TAREAS = { quien: n, lista: [], cargando: false, error: (e && e.message) || String(e) };
    if (alLlegar) alLlegar();
  });
  return null;                                   // null = «cargando», distinto de [] = «no tiene»
}

function _gruposSanc_(actor, filtro){
  var f=_sinTildes_(String(filtro||'').trim().toLowerCase());
  var gente=sancionablesPor(actor).filter(function(m){
    if(!f) return true;
    return _sinTildes_((m.nombre||'').toLowerCase()).indexOf(f)>=0 ||
           _sinTildes_((m.pila||'').toLowerCase()).indexOf(f)>=0 ||
           _sinTildes_((m.unidad||'').toLowerCase()).indexOf(f)>=0;
  });
  var orden=_ordenSubs_(), por={};
  gente.forEach(function(m){ var u=m.unidad||'—'; (por[u]=por[u]||[]).push(m); });
  return orden.filter(function(u){ return por[u]; }).map(function(u){
    var l=por[u].slice().sort(function(a,b){
      var ca=(a.cargo==='Coordinador')?0:1, cb=(b.cargo==='Coordinador')?0:1;
      if(ca!==cb) return ca-cb;                       // el coordinador, primero
      return String(a.nombre||'').localeCompare(String(b.nombre||''), 'es');
    });
    return {unidad:u, gente:l};
  });
}

/* La lista de personas. Se pinta aparte para poder rehacerla al teclear SIN tocar el resto
   del formulario: repintar el modal entero es lo que borraba lo ya elegido. */
function _listaSancHTML_(grupos){
  if(!grupos.length) return '<p class="rnota" style="margin:0;padding:8px 2px">Nadie con ese filtro.</p>';
  return grupos.map(function(g){
    return '<div class="sangrupo">'+esc(g.unidad)+'</div>'+
      g.gente.map(function(m){
        return '<button class="sanper'+(SANC_FORM.quien===m.nombre?' on':'')+'" data-sanq="'+esc(m.nombre)+'" data-p>'+
          '<b>'+esc(m.nombre)+'</b>'+(m.cargo==='Coordinador'?'<i>coord.</i>':'')+'</button>';
      }).join('');
  }).join('');
}

function _mdHTML_(md){
  function linea(s){
    return esc(s)
      .replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g,'$1<i>$2</i>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  /* ⛔ SE JUNTA PRIMERO Y SE FORMATEA DESPUES. Al reves -formateando linea a linea- una
     negrita que cruza dos lineas del markdown no se cierra nunca y sale `**` crudo en
     pantalla. El changelog esta lleno de ellas, porque las lineas van a 100 columnas. */
  var out=[], li=[], par=[], cita=[];
  function cierraLi(){
    if(!li.length) return;
    out.push('<ul>'+li.map(function(t){ return '<li>'+linea(t)+'</li>'; }).join('')+'</ul>');
    li=[];
  }
  /* Los parrafos se acumulan y se cierran de golpe: en el changelog una frase ocupa tres
     lineas y pintarlas como tres parrafos parte el texto donde no toca. */
  function cierraPar(){ if(par.length){ out.push('<p>'+linea(par.join(' '))+'</p>'); par=[]; } }
  function cierraCita(){ if(cita.length){ out.push('<blockquote>'+linea(cita.join(' '))+'</blockquote>'); cita=[]; } }
  function cierra(){ cierraLi(); cierraPar(); cierraCita(); }
  String(md||'').split(/\r?\n/).forEach(function(l){
    var t=l.replace(/\s+$/,''), m;
    if(/^---+$/.test(t)){ cierra(); out.push('<hr>'); return; }
    if((m=t.match(/^(#{1,4})\s+(.*)$/))){ cierra(); var n=m[1].length;
      out.push('<h'+n+'>'+linea(m[2])+'</h'+n+'>'); return; }
    if((m=t.match(/^>\s?(.*)$/))){ cierraLi(); cierraPar(); cita.push(m[1]); return; }
    if((m=t.match(/^[-*]\s+(.*)$/))){ cierraPar(); cierraCita(); li.push(m[1]); return; }
    if(!t){ cierra(); return; }
    /* Linea sangrada dentro de una vineta: es continuacion suya, no un parrafo nuevo. */
    if(li.length && /^\s+/.test(l)){ li[li.length-1]+=' '+t.replace(/^\s+/,''); return; }
    cierraLi(); cierraCita(); par.push(t);
  });
  cierra();
  return out.join('');
}

/* La pantalla de novedades. Si el sellado no se hizo, se DICE en vez de enseñar un hueco:
   un changelog vacio parece que no ha cambiado nada, que es lo contrario de la verdad. */
function _novedadesHTML_(){
  var cuerpo = String(CHANGELOG_MD||'').trim()
    ? '<div class="mdoc">'+_mdHTML_(CHANGELOG_MD)+'</div>'
    : '<p class="rnota">El changelog no se selló en esta build. Está en '+
      '<span class="mono">docs/changelog.md</span> del repositorio.</p>';
  return '<div class="mtit">Novedades</div>'+
    '<div class="msub">Qué ha cambiado en cada versión. Estás en '+
      esc(VERSION?('v'+VERSION):(CANAL==='beta'?'la beta':'una build sin publicar'))+
      ' · <span class="mono">'+esc(BUILD)+'</span></div>'+
    cuerpo;
}

/* las horas en pasos de 15 min. */
function optHoras(sel){
  var s='';
  for(var m=0;m<24*60;m+=15){
    var v=pad(Math.floor(m/60))+':'+pad(m%60);
    s+='<option value="'+v+'"'+(v===sel?' selected':'')+'>'+v+'</option>';
  }
  return s;
}

function _dmyAISO_(f){ f=String(f||''); var m=f.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m?(m[3]+'-'+m[2]+'-'+m[1]):f; }

/* La temporada va de septiembre a agosto · GEMELA de `reglas/disciplina.py:temporada_de`.
   Si esto y el Python discrepan, el que manda es el Python: ahi se calculan los puntos. */
function _temporadaDe_(d){
  var ini = (d.getMonth()+1) >= 9 ? d.getFullYear() : d.getFullYear()-1;
  return String(ini).slice(2)+'/'+String(ini+1).slice(2);
}

/* `DD/MM/AAAA` -> `Date`. Pasa por `_dmyAISO_`, que YA EXISTE y es GEMELA en las dos caras
   (mapa funcional §4.2). La primera version de esto traia su propio `match` de la fecha: un
   TERCER parser de la misma familia, que es justo lo que el mapa prohibe en su punto 2. */
function _fechaDMY_(s){
  var iso=_dmyAISO_(s);
  /* `_dmyAISO_` CONVIERTE, no valida: lo que no reconoce lo devuelve tal cual (probado:
     'no' sale 'no'). Reutilizar la puerta buena no exime de comprobar lo que sale, o la
     basura entra como `Invalid Date` y se cuela en los filtros. */
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(iso||''))) return null;
  var p=iso.split('-'), d=new Date(+p[0], (+p[1])-1, +p[2]);
  /* Y `new Date(2026,12,32)` NO falla: rueda al mes siguiente. Se contrasta que lo que sale
     es lo que entro, o una fecha imposible pasaria por buena. */
  return (d.getFullYear()===+p[0] && d.getMonth()===(+p[1])-1 && d.getDate()===+p[2]) ? d : null;
}

function _deEstaTemporada_(d){ return !!d && _temporadaDe_(d)===_temporadaDe_(_hoyDateM_()); }

/* ⛔ CADA MAGNITUD SE REINICIA CON LO SUYO, y confundirlo hace que la app diga otra cosa que el
   Panel de Rendimientos (Daniel, 30/07):
     · PUNTOS -> por TEMPORADA (RRI Art. 29).
     · HORAS  -> por MES. El cierre mensual pone a cero Carga tareas, Reuniones, Cursos y
       Turnos (`flujos/cierre.py`), asi que enseñar la temporada en Horas seria enseñar horas
       que el panel ya no cuenta. */
function _deEsteMes_(d){
  var h=_hoyDateM_();
  return !!d && d.getMonth()===h.getMonth() && d.getFullYear()===h.getFullYear();
}

function _mesLargo_(d){ return MESES_L[d.getMonth()]+' '+d.getFullYear(); }

function _compBase_(m){ var c=(m&&m.cargo)||null; return COMP_CARGO[c]!=null?COMP_CARGO[c]:2.0; }

function _compEsReal_(m){ var v=m&&m.compensaciones; return typeof v==='number' && isFinite(v); }

function _compMensual_(m){ return _compEsReal_(m) ? m.compensaciones : _compBase_(m); }

/* LO QUE HAY POR ENCIMA DE LA BASE, que es una cosa DISTINTA y se ensena aparte.
   Daniel (02/08): «cuando se esta extra en turnos etc yo asigno horas de compensacion... no es
   parte de la compensacion base, es una compensacion extra». La base llega sola por el puesto;
   el extra se lo ha ganado alguien y se lo asigna el a mano, asi que meterlos en la misma cifra
   esconde lo unico de los dos que reconoce algo que esa persona hizo.
   Notion guarda UN solo numero (base + extras), asi que esto se deriva — misma cuenta que
   `flujos/cierre.py:compensacion_perdida`. Se redondea al centimo porque la resta en coma
   flotante saca cosas como 2.0999999999999996 y eso no se le ensena a nadie. */
function _compExtra_(m){
  if(!_compEsReal_(m)) return 0;                 // sin el dato de Notion no se puede saber
  return Math.round((m.compensaciones-_compBase_(m))*100)/100;
}

/* Devuelve `{total, ultimos, suma}` de ESTA temporada. `fecha` saca el `DD/MM/AAAA` de cada
   elemento, que es como los escribe el resto de la app.
   ⚠️ Lo que NO tiene fecha legible **no se esconde**: se ve y se nota. Esconder un apunte roto
   es la forma mas rapida de que nadie se entere de que esta roto. */
function _ultimosMov_(lista, fecha, cuanto, ambito){
  var dentro = (ambito==='mes') ? _deEsteMes_ : _deEstaTemporada_;
  var conD=[], sinD=[], suma=0;
  (lista||[]).forEach(function(x){
    var d=_fechaDMY_(fecha(x));
    if(!d){ sinD.push(x); suma+=(cuanto?(+cuanto(x)||0):0); return; }
    if(!dentro(d)) return;
    conD.push({x:x,d:d}); suma+=(cuanto?(+cuanto(x)||0):0);
  });
  conD.sort(function(a,b){ return b.d-a.d; });
  var todos=sinD.concat(conD.map(function(o){ return o.x; }));
  return { total: todos.length, ultimos: todos.slice(0,MOVS_N), todos: todos, suma: suma };
}

/* La coletilla que aparece en los dos libros. Una sola frase, en un sitio. */
function _notaRegistro_(total, ambito){
  var d = (ambito==='mes') ? 'de este mes' : 'de la temporada';
  return total>MOVS_N
    ? 'Se enseñan los <b>'+MOVS_N+'</b> más recientes '+d+', de '+total+'. '+
      'El registro completo <b>se conserva</b>: aquí solo se pinta menos.'
    : 'Todo lo '+d+'. El registro completo <b>se conserva</b>.';
}

function _puedeImpersonar_(){ return !!(SESION && SESION.email===ADMIN_EMAIL); }

/* ⛔ ¿PUEDE CERRAR EL MES? Una sola puerta, porque lo preguntan el nav, el menú ⋮ y la
   pantalla: si cada uno lo dedujera por su cuenta, un día uno diría que sí y otro que no.
   El rango sale de `_actorSanc_()` —la SESIÓN— y no de `ACTOR`, que lo reescribe «ver como»:
   el admin mirando la ficha de otro no puede heredar su permiso, ni perder el suyo.
   ⚠️ Esto es CORTESÍA, no seguridad: la frontera real es `_calcularCierre_` en el backend, que
   exige rango >= 3. Aquí solo se evita ofrecer un botón que al pulsarlo dice que no. */
function _puedeCerrarMes_(){
  try{ return !!(_puedeImpersonar_() || rangoNom(_actorSanc_())>=3); }catch(_){ return false; }
}

/* «2026-07» es un identificador, no algo que se le lea a nadie. Daniel, viendo el boton:
   «pone cierre 2026-07, que dices, sera cierre de julio». Se saca del PROPIO periodo del plan y
   no de `_mesACerrar_()`: si algun dia se revisa un cierre viejo, tiene que decir SU mes, no el
   que tocaria hoy. GEMELA en las dos caras. */
function _nomPeriodo_(p){
  var m=/^(\d{4})-(\d{2})$/.exec(String(p||''));
  if(!m) return String(p||'');
  var i=parseInt(m[2],10)-1;
  return (MESES_L[i]||m[2])+' de '+m[1];
}

function _mesACerrar_(){
  var h=new Date(), a=h.getFullYear(), m=h.getMonth();       /* getMonth() es 0-11 */
  if(m===0){ a-=1; m=11; } else { m-=1; }
  var mm=m+1;
  return { p:a+'-'+(mm<10?'0':'')+mm, mes:MESES_L[m] };
}

function _numPlan_(v){
  if(v===true) return 'sí';
  if(v===false) return 'no';
  if(v===null||v===undefined||v==='') return '—';
  return (typeof v==='number') ? nf(v,(v%1?2:0)) : String(v);
}

/* De una URL de Drive saca el id del fichero, para poder pedir su visor incrustable. */
function _idDrive_(u){ var m=String(u||'').match(/\/d\/([A-Za-z0-9_-]{20,})/); return m?m[1]:null; }

function _visorHTML_(o){
  var abierto = !o.plegado;
  return '<div class="doc" data-visor>'+
    '<div class="dh" data-vabrir="'+esc(o.id||'')+'" data-p style="cursor:pointer">'+
      '<b>'+esc(o.titulo)+'</b><small>'+esc(o.sub||'')+(o.plegado?' · pulsa para leerlo':'')+'</small>'+
      /* La pantalla completa va en la cabecera y NO despliega: `stopPropagation` en su
         manejador. Sin eso, pulsarla plegaba el visor a la vez que lo maximizaba. */
      '<button class="vfull" data-vfull data-p title="Pantalla completa" aria-label="Pantalla completa">'+
        '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>'+
      '<svg class="vchev" viewBox="0 0 24 24" style="width:15px;height:15px;fill:none;'+
        'stroke:currentColor;stroke-width:2.4;transition:transform .3s'+(abierto?';transform:rotate(180deg)':'')+'">'+
        '<path d="M6 9l6 6 6-6"/></svg></div>'+
    '<div class="vcuerpo"'+(abierto?'':' hidden')+' data-quees="'+esc(o.queEs||'el documento')+'">'+
      (abierto?'<div class="dcar">Cargando '+esc(o.queEs||'el documento')+'…</div>':'')+'</div>'+
    (o.url?'<a class="da" href="'+esc(o.url)+'" target="_blank" rel="noopener">abrir en Drive</a>':'')+
  '</div>';
}

/* Mete el iframe de Drive en un cuerpo ya visible. Si no carga -permisos, CSP del hosting- se
   DICE y se ofrece el enlace: un hueco blanco eterno es peor, porque quien revisa no sabe si
   esperar o si esta roto. */
function _cargarVisor_(cuerpo, id){
  if(cuerpo.dataset.cargado) return; cuerpo.dataset.cargado='1';
  var que=cuerpo.dataset.quees||'el documento';
  if(!id){ cuerpo.innerHTML='<div class="dcar">El enlace no es un archivo de Drive reconocible.<br>'+
    'Ábrelo con el enlace de abajo.</div>'; return; }
  cuerpo.innerHTML='<div class="dcar">Cargando '+que+'…</div>';
  var f=document.createElement('iframe');
  f.className='dv'; f.setAttribute('loading','lazy'); f.setAttribute('allow','autoplay');
  f.src='https://drive.google.com/file/d/'+id+'/preview';
  var fallo=setTimeout(function(){ if(cuerpo.dataset.ok) return;
    cuerpo.innerHTML='<div class="dcar">No se pudo incrustar el visor.<br>Ábrelo en Drive con el enlace de abajo.</div>'; }, 6000);
  f.onload=function(){ cuerpo.dataset.ok='1'; clearTimeout(fallo); };
  cuerpo.innerHTML=''; cuerpo.appendChild(f);
}

function _cablearVisor_(raiz){
  var R=raiz||document;
  $$('[data-visor] .vcuerpo',R).forEach(function(c){          // los que nacen abiertos
    if(!c.hasAttribute('hidden')){
      var h=c.parentNode.querySelector('[data-vabrir]');
      _cargarVisor_(c, h && h.dataset.vabrir);
    }
  });
  $$('[data-vabrir]',R).forEach(function(h){
    h.onclick=function(){
      var caja=h.parentNode, cuerpo=caja.querySelector('.vcuerpo'), sv=caja.querySelector('.vchev');
      if(!cuerpo.hasAttribute('hidden')){ cuerpo.setAttribute('hidden',''); if(sv) sv.style.transform=''; return; }
      cuerpo.removeAttribute('hidden'); if(sv) sv.style.transform='rotate(180deg)';
      _cargarVisor_(cuerpo, h.dataset.vabrir);
    };
  });
  $$('[data-vfull]',R).forEach(function(b){
    b.onclick=function(ev){
      ev.stopPropagation();                                    // no despliega: solo maximiza
      var caja=b.closest('.doc'), cuerpo=caja.querySelector('.vcuerpo');
      var yaEsta=caja.classList.toggle('full');
      document.body.style.overflow = yaEsta ? 'hidden' : '';
      /* Maximizar con el visor plegado no enseñaria nada: se abre y se carga. */
      if(yaEsta && cuerpo.hasAttribute('hidden')){
        cuerpo.removeAttribute('hidden');
        var sv=caja.querySelector('.vchev'); if(sv) sv.style.transform='rotate(180deg)';
        _cargarVisor_(cuerpo, (caja.querySelector('[data-vabrir]')||{dataset:{}}).dataset.vabrir);
      }
    };
  });
  if(!_cablearVisor_._esc){
    _cablearVisor_._esc=true;
    document.addEventListener('keydown', function(e){
      if(e.key!=='Escape') return;
      var f=document.querySelector('.doc.full');
      if(f){ f.classList.remove('full'); document.body.style.overflow=''; }
    });
  }
}

function _urlB64_(b64){
  var pad='='.repeat((4-b64.length%4)%4);
  var t=(b64+pad).replace(/-/g,'+').replace(/_/g,'/');
  var raw=atob(t), arr=new Uint8Array(raw.length);
  for(var i=0;i<raw.length;i++) arr[i]=raw.charCodeAt(i);
  return arr;
}

function _pushSoportado_(){ return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }

async function _registrarSW_(){
  if(!('serviceWorker' in navigator)) return null;
  try{ _swReg=await navigator.serviceWorker.register('sw.js'); return _swReg; }catch(e){ return null; }
}

/* Al abrir: registra el SW y, si ya habia permiso y sesion, re-guarda la suscripcion por si
   el navegador la roto (pasa, y si no se re-guarda dejan de llegar avisos en silencio). */
async function _pushInit_(){
  if(!_pushSoportado_()) return;
  var reg=await _registrarSW_();
  try{
    if(reg && Notification.permission==='granted'){
      await navigator.serviceWorker.ready;
      var sub=await reg.pushManager.getSubscription();
      if(sub && typeof SESION!=='undefined' && SESION) api.guardarPush(sub.toJSON());
    }
  }catch(_){}
}

/* Reduce ANTES de nada. No es solo por el peso del envío: pintar sobre un lienzo de 12 Mpx
   en un móvil va a tirones, y la captura se sigue leyendo a 1600. */
function _leerImagen_(file){
  return new Promise(function(ok,mal){
    if(!file){ mal(new Error('sin fichero')); return; }
    if(!/^image\//.test(file.type||'')){ mal(new Error('eso no es una imagen')); return; }
    var fr=new FileReader();
    fr.onerror=function(){ mal(new Error('no se pudo leer el fichero')); };
    fr.onload=function(){
      var im=new Image();
      im.onerror=function(){ mal(new Error('no se pudo abrir la imagen')); };
      im.onload=function(){
        var k=Math.min(1, PINT_MAX/Math.max(im.naturalWidth, im.naturalHeight));
        var w=Math.max(1,Math.round(im.naturalWidth*k)), h=Math.max(1,Math.round(im.naturalHeight*k));
        var c=document.createElement('canvas'); c.width=w; c.height=h;
        c.getContext('2d').drawImage(im,0,0,w,h);
        ok({ url:c.toDataURL('image/jpeg',0.85), w:w, h:h });
      };
      im.src=fr.result;
    };
    fr.readAsDataURL(file);
  });
}

function _pesoKB_(dataUrl){
  var i=(dataUrl||'').indexOf(',');
  return i<0 ? 0 : Math.round((dataUrl.length-i-1)*0.75/1024);   // base64 → bytes
}

function estDoc(e){ return EST_DOC[e]||[String(e||'—'),'']; }

function _sinTildes_(t){ return (t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }

/* Las etiquetas de dia van en DD/MM, igual que la Reunion General: 'V 24' se lee
   peor y ademas pierde el mes, que importa cuando el rango cruza de mes. */
function _ddmm_(d){ return pad(d.getDate())+'/'+pad(d.getMonth()+1); }

function _diasDesde_(iso,n){ var out=[],b=new Date(iso+'T00:00:00');
  for(var i=0;i<n;i++){ var d=new Date(b); d.setDate(b.getDate()+i); out.push(_ddmm_(d)); } return out; }

function _diasEntre_(a0,a1){ var out=[]; if(!a0||!a1) return out;
  var a=new Date(a0+'T00:00:00'), b=new Date(a1+'T00:00:00'); if(b<a) return out;
  for(var i=0;i<62&&a<=b;i++){ out.push(_ddmm_(a)); a.setDate(a.getDate()+1); } return out; }

/* Cuantas casillas seguidas hacen falta para cubrir la reunión. Se redondea HACIA ARRIBA:
   media casilla no existe, y quedarse corto es no poder ir. Sin `duracion` (reuniones de
   antes de este modelo) da 1, que es como se comportaba la app hasta ahora. */
function _slotsMin_(duracion, slot){
  var d=+duracion||0, s=Math.max(5, +slot||60);
  return Math.max(1, Math.ceil(d/s) || 1);
}

function _durTxt_(min){
  min=Math.max(0, Math.round(+min||0));
  var h=Math.floor(min/60), m=min%60;
  if(!h) return m+' min';
  return h+' h'+(m?' '+m+' min':'');
}


/* ═══════════════════════════════════════════════════════════════════════════
   QUIÉN ES QUIÉN — una sola vez para las dos caras (05/08/2026)

   Estas tres estaban duplicadas, y `rutinas/gemelas.py` las venía señalando
   desde el 04/08 como §5 D9 («autoridad triplicada»). Lo que las mantenía
   separadas no era una diferencia de comportamiento: era que el móvil
   **repetía a mano el bucle de buscar a una persona** donde el escritorio
   llamaba a `miembro(n)`. Misma transformación, distinto ayudante — el patrón
   D20 exacto.

   Al dar `miembro()` a las dos caras, las tres se vuelven idénticas y caben
   aquí. Lo que se gana no son bytes: se gana que «¿quién coordina esto?» y
   «¿qué rango tiene este?» se contesten en UN sitio, que es lo que hace que
   cambiar la regla no exija acordarse de dos ficheros.

   ⚠️ Leen `DATA`, `PD_NOM` y `REV2_NOM` **en el momento de la llamada**, no al
   cargar: las dos caras arrancan con semillas distintas de `REV2_NOM` y las
   re-derivan del roster (`_rederivarCargos_` / `_rederivarPD_`). Congelarlas
   aquí las dejaría con el nombre de la semilla, que es un fallo que ya ocurrió.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ⛔ EL ÚNICO RECORRIDO DE `DATA.miembros`. Debajo hay tres preguntas distintas
   —por nombre, por unidad, por nombre de pila— y las tres se contestaban con su
   propio `for` escrito a mano, en cuatro ficheros. Un bucle, tres preguntas: eso
   es lo que hace que «buscar a alguien» se lea de un vistazo y que arreglar la
   búsqueda no sea acordarse de cuatro sitios.
   Devuelve la ficha o `null`; quien quiera un valor por defecto lo pone él. */
function buscaMiembro(cumple){
  var ms = DATA.miembros || [];
  for(var i=0;i<ms.length;i++) if(cumple(ms[i])) return ms[i];
  return null;
}

/* La ficha de alguien por su nombre, o `null`. La versión tolerante —que devuelve
   un fantasma en vez de `null`— es `_m()` y vive en el escritorio, que es quien la
   necesita para pintar filas de gente que ya no está. */
function miembro(n){
  return buscaMiembro(function(m){ return m.nombre===n; });
}

/* Quién coordina esa unidad; si nadie, el PD. */
function coordinadorDe(u){
  var c = buscaMiembro(function(m){ return m.cargo==='Coordinador' && m.unidad===u; });
  return c ? c.nombre : PD_NOM;
}

/* El rango de alguien a quien solo conocemos por el nombre de pila — que es como
   llegan firmados los turnos del Discord y los expedientes.
   Estaba escrita DOS VECES, una por cara, palabra por palabra (`documentos.movil.js`
   y `documentos.escritorio.js`). Si dos personas comparten pila gana la primera del
   roster: eso ya era así, y aquí queda dicho en vez de escondido en el bucle. */
function rangoPila(pila){
  var m = buscaMiembro(function(x){ return x.pila===pila; });
  return m ? rangoNom(m.nombre) : 0;
}

/* La escalera de autoridad de DOCUMENTOS: PD(3) > revisor fijo(2) >
   coordinador(1) > resto(0).
   ⛔ NO es la de sanciones. Esa es `rangoSanc`, que sale de una tabla explícita
   (`RANGO_SANC`) porque ahí hay gente con rango sin tener cargo — deducirlo del
   `cargo` es justo el fallo que esa tabla existe para impedir. Se confunden
   solas: si vienes a tocar una, comprueba cuál. */
function rangoNom(n){
  if(n===PD_NOM) return 3;
  if(n===REV2_NOM) return 2;
  var m=miembro(n);
  return (m && m.cargo==='Coordinador') ? 1 : 0;
}
