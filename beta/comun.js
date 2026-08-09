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

/* ⛔ LAS NOVEDADES SON DE DANIEL, Y SOLO EN BETA. (Encargo suyo, 07/08: «lo de novedades
   solo debe aparecerme a mi, Daniel, a una persona distinta jamas y solo aparece en beta».)

   Hasta hoy la entrada del menu NO tenia ninguna condicion, y eso NO se notaba en beta —donde
   `_puedeBeta_` ya deja fuera a todo el mundo menos al PD—: se notaba en **produccion**, que
   sirve el MISMO HTML y donde `_puedeBeta_` devuelve `true` para cualquiera porque el canal
   no es beta. O sea que los 32 miembros tenian en su menu el registro de cambios de
   desarrollo. El menu ya oculta `sanciones` y `cierre` por rango; esta se habia quedado sin
   su linea.

   ⚠️ Es una condicion MAS DURA que `_puedeBeta_`, no la misma: aquella deja pasar a todos
   fuera de beta (es un gate de canal), y esta exige **beta Y rango**. Reutilizarla habria
   dejado el agujero igual. */
function _puedeVerNovedades_(){ return CANAL==='beta' && (esAdmin() || _rangoBeta_()>=3); }

/* 'HH:MM' (o `{ini:'HH:MM'}`) -> minutos. **UNA sola puerta**, aqui, que cargan las dos caras.

   ⛔ Historia corta: en el movil hubo CINCO parsers de horas con tres unidades de salida
   distintas; se unificaron en este. Pero la unificacion se hizo **por cara**, asi que quedo
   la MISMA funcion, con el mismo nombre y el mismo cuerpo, en `reuniones.movil.js` y en
   `reuniones.escritorio.js`. Y `durForm` de `horas.movil.js` seguia parseando a mano.

   ⚠️ Y no eran equivalentes del todo: `durForm` usaba `+p[0]`, que con basura da **NaN**
   -y `NaN` se propaga a la duracion sin dar error-, mientras que este `parseInt(...,10)||0`
   se queda con lo que entienda. Dos copias de una regla que nadie compara son dos reglas.

   Aguanta las dos formas porque la rejilla de reuniones pasa `{ini,dur}` y los formularios
   pasan la cadena pelada. */
function _minHM_(v){
  var t=(v && typeof v==='object') ? v.ini : v;
  var p=String(t==null?'':t).split(':');
  return (parseInt(p[0],10)||0)*60 + (parseInt(p[1],10)||0);
}

/* LA REJILLA DE FRANJAS de una convocatoria: **UNA sola**, contigua y anclada al tamaño de
   slot, para todos los dias a la vez. `rangos` son horas decimales `[ini,fin]` por dia;
   `[0,0]` = dia apagado. Devuelve `{F, perDia}`: las franjas comunes y, por dia, cuales le
   caben ENTERAS.

   ⛔ POR QUE EL ORIGEN ES COMUN. Antes cada dia generaba sus franjas desde SU hora de
   inicio y con una «cadencia» propia: un dia a las 17:00 y otro a las 17:30 daban franjas
   alternas que se pisaban, y con cadencia de 15 min y franja de 1 h salian cuatro franjas
   por hora solapandose. Ahora el origen es el inicio mas temprano bajado al multiplo del
   slot, asi que no hay solapes que dibujar.

   ⛔ **UNA sola puerta, aqui** (07/08). Estaba en `reuniones.escritorio.js` y en
   `reuniones.movil.js` con el MISMO cuerpo -18 lineas cada una-, y las dos caras cargan
   este fichero. Era la ultima de las gemelas que de verdad se podian mover: las otras siete
   son anidadas y usan las variables locales de su contenedora.

   ⚠️ El tope de `F.length<400` no es decoracion: con un slot de 5 min y un rango largo esto
   generaria miles de franjas y la rejilla dejaria de dibujarse. */
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

/* ⚠️ AUTORIDAD TRIPLICADA a proposito (mapa §5, D9): `rangoNom`, `coordinadorDe`,
   `revisoresDe` y `puedeDecidir*` existen aqui, en `movil.html` y en el backend
   (`_rangoNom_`, `_coordinadorDe_`, `_revisoresDe_`, `_puedeDecidir_`). **El backend es
   la unica frontera de seguridad**; las dos caras llevan su copia solo para PINTAR.
   Si cambias una regla de autoridad, son TRES ficheros.
   `puedeDecidirParte` y `puedeDecidirDoc` NO se funden: son dos autoridades distintas
   -horas y documentos- y darles el mismo nombre las haria parecer la misma. */
function _rangoBeta_(){ return (SESION&&SESION.nombre) ? rangoNom(SESION.nombre) : 0; }

function _activos_(){ return (DATA.miembros||[]).filter(function(m){ return !m.baja; }); }

/* Las horas del mes ANTERIOR, **del panel de verdad**. `null` si no llegan.

   ⛔ ESTO EXISTE PORQUE LA COMPARATIVA TIRABA DE LA SEMILLA. `_compHorasHTML_` leia `YO.hAnt`,
   y ese campo **solo esta en los datos de demo** de `movil.html` -medido el 07/08: cero
   apariciones en `comun.js` y cero en el backend-. Asi que la fila «vs. mes anterior» comparaba
   contra un numero fijo escrito a mano, que ni cambia de mes ni es de nadie. Daniel: «esta
   comparando con junio en lugar de con julio, se quedo congelado». Estaba congelado porque era
   una constante.

   ⛔ Y el codigo PROMETIA lo contrario -«mientras el backend no lo mande, la fila no se pinta,
   en vez de inventarse un 0»-: la semilla hacia que esa promesa no se cumpliera nunca, porque
   siempre habia un dato. **Un valor de demo no es la ausencia de dato: la disfraza.**

   El panel real trae `carga_mes_anterior` (comprobado en `datos/panel.json`). Se acepta tambien
   `horasMesAnt` por si el backend lo proyecta con ese nombre al miembro. */
/* Lo que hay del mes anterior PARA COMPARAR, con el mes al que pertenece de verdad.

   ⛔ Daniel (07/08): *«¿y por qué ya no me aparece la comparación con el mes anterior?»*. La
   quité yo esa misma tarde, y con buen motivo a medias: la fila leía `hAnt`, que en el panel
   subido al servidor vale **2 h con `mesAnt: 'junio'`** estando en agosto. O sea que decía
   «vs. julio» enseñando **junio**. Al pasarla al dato bueno (`carga_mes_anterior`) la fila
   desapareció, porque **ese campo no está en el panel que hay subido** — arreglé la mentira y de
   paso me llevé la fila.

   ⛔ **El fallo no era comparar con junio: era decir que era julio.** Así que el dato viejo
   vuelve a valer, pero **viaja con su propia etiqueta**: si sale de ahí, la fila dice
   «vs. junio». Cuando el panel del servidor traiga `carga_mes_anterior`, se usa ese y el mes
   se deriva del periodo — sin tocar nada más.

   ⚠️ `_hAntReal_` (aquí abajo) **no cambia**: sigue devolviendo **solo** el dato bueno, porque
   el escritorio la usa para decir quién sube y quién baja, y ahí un número de otro mes mezclado
   con los de éste sí sería mentir. Aquí se compara **contigo mismo** y el rótulo dice contra
   qué; allí se compara **entre personas** y no hay dónde ponerlo. */
function _antComparable_(m){
  var h=_hAntReal_(m);
  if(h!=null) return {h:h, mes:null};             // mes null = se deriva del periodo del servidor
  var v=(m && typeof m.hAnt==='number') ? m.hAnt : null;
  if(v!=null && v>0 && m.mesAnt) return {h:v, mes:String(m.mesAnt)};
  return null;                                    // sin nada que comparar: la fila no se pinta
}

function _hAntReal_(m){
  m = m || {};
  var v = (typeof m.horasMesAnt==='number') ? m.horasMesAnt
        : (typeof m.carga_mes_anterior==='number') ? m.carga_mes_anterior : null;
  return (typeof v==='number' && v>0) ? v : null;
}

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

/* `_ApiSesion` marca lo que NO se arregla reintentando: tu identidad ha dejado de valer.
   ⛔ POR QUE EXISTE. Bug de Jose Manuel del 07/08, gravedad **Bloquea**: *«desde la
   aplicación web de pc no es posible finalizar una sesión de trabajo… aparece un error que es
   algo así como "token invalido"»*. El token de Google **caduca a la hora**; `SESION.token` se
   fija en el login y no se renueva mientras la pestaña siga abierta, y el escritorio vive
   abierto toda la tarde. El backend contesta `token no válido` — correcto para una máquina y
   **inútil para una persona**: no dice que haya que volver a entrar. Lo intentó dos veces y lo
   dio por roto.
   ⚠️ Y NO se reintenta (`transito` es falso a propósito): repetir con el mismo token caducado
   da el mismo error tres veces y tarda el triple en decir lo mismo. */
function _ApiSesion(m){ this.message=m; this.sesion=true; }

/* ¿Es este error del backend uno de identidad? Los tres los lanza `_verificarIdentidad_`.
   ⛔ Se mira con una lista CERRADA, no con un `/token/`: hay errores que llevan la palabra
   «token» y no son de sesión — mandar a alguien a volver a entrar cuando el problema es otro
   le hace perder el trabajo que tenga a medias. */
function _esErrorDeSesion_(err){
  var e=String(err||'');
  return /token no v\u00e1lido|token no valido/i.test(e) ||
         /^sin token$/i.test(e) ||
         /token de otra aplicaci/i.test(e);
}


/* ¿Sirve todavia la identidad guardada en este navegador? Devuelve el token o `null`.

   ⛔ POR QUE VIVE AQUI. El umbral estaba escrito **dos veces** — una en cada cara — junto con
   su lectura de `localStorage`. Es la regla que decide **quien entra sin volver a
   autenticarse**: dos copias de eso acaban siendo dos reglas distintas.

   ⛔ Y EL NUMERO NO ES CAPRICHO: un token de Google **vive una hora**. Se le dan 50 minutos
   para no reutilizar uno que va a caducar en mitad de la primera peticion — que es justo el
   fallo que reporto Jose Manuel el 07/08 («token invalido» al cerrar un fichaje).

   ⚠️ Esto NO es seguridad: quien manda es el servidor, que revalida el token en cada
   llamada (`_verificarIdentidad_`). Esto solo evita una ida y vuelta que ya se sabe perdida.
   Sin `ts` la edad sale enorme y devuelve `null`, que es el lado seguro: pedir login de mas
   molesta; darlo por bueno de menos, no. */
function _tokenGuardadoUtil_(sg, ahora){
  if(!sg || !sg.token) return null;
  return ((ahora || Date.now()) - (sg.ts || 0) < 50*60*1000) ? sg.token : null;
}

/* Lo que hay guardado de la sesion, o `null`. Nunca lanza: un `localStorage` con basura no
   puede impedir entrar. */
function _sesionGuardada_(){
  try{ return JSON.parse(localStorage.getItem('sol_sess') || 'null'); }
  catch(_){ return null; }
}


/* El aviso de abajo. `tost(m)` caduca solo; `tost(m, {fijo:true})` **se queda hasta que lo
   tocas**.

   ⛔ EL MODO FIJO NO ES UN CAPRICHO: lo pide una decisión ya tomada (`decisiones-app.md`,
   28/07). Se probó un aviso importante con un toast de 2,4 s y **Daniel no lo vio** — *«no me
   salió el aviso de nada, así que mal»*. De ahí la regla: **un aviso que caduca solo sirve para
   lo que no importa**.

   ⛔ Y hacía falta ya: el mensaje de «sesión caducada» son ~110 caracteres, que en 2,4 segundos
   **no da tiempo a leer**. Un arreglo que explica bien lo que pasa y lo enseña dos segundos
   deja a la persona igual que antes.

   ⚠️ Vivía DUPLICADO en las dos caras y ya había divergido: 2600 ms en el escritorio y 2400 en
   el móvil. Misma lógica, dos números — la señal de siempre de que hay dos copias. */
function tost(m, o){
  var t=$('#tost'); if(!t) return;
  t.textContent=m;
  clearTimeout(t._h);
  var cerrar=function(){ t.classList.remove('on','fijo'); t.onclick=null; };
  t.classList.add('on');
  if(o && o.fijo){
    /* `.fijo` es lo que le devuelve el `pointer-events`: en reposo el toast no captura
       clics, y sin esto no habría forma de cerrarlo. */
    t.classList.add('fijo');
    t.onclick=cerrar;
    return;
  }
  t.classList.remove('fijo'); t.onclick=null;
  t._h=setTimeout(cerrar, 2600);
}


/* El aviso de que una ESCRITURA no salió. Fijo si la culpa es la sesión.

   ⛔ POR QUÉ UNA PUERTA Y NO 20 SITIOS. Había **20** `catch` con la misma línea
   —`tost('No se pudo…: '+((e&&e.message)||e))`— repartidos por las dos caras. Veinte copias
   de una decisión son veinte decisiones distintas en cuanto alguien toca una.

   ⛔ Y LA DECISIÓN ES DE DANIEL (`decisiones-app.md`, 28/07): *un aviso que caduca solo sirve
   para lo que no importa*. Que no salga una hora de trabajo importa. El mensaje de sesión
   caducada son ~110 caracteres: en 2,6 s no da tiempo a leerlo, y encima es el único que dice
   qué hacer para recuperarse.

   ⚠️ Solo se queda fijo lo que EXIGE una acción. Un «no hay red» sigue siendo efímero: reintentar
   es obvio y un aviso que hay que cerrar a mano, si sale por todo, se ignora. */
function tostErr(prefijo, e){
  tost(String(prefijo || '') + ((e && e.message) || e), (e && e.sesion) ? {fijo:true} : null);
}

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
  /* ⛔ LA SESION CADUCADA SE DICE EN CRISTIANO. Ver `_ApiSesion`: el backend contesta
     `token no válido`, que es exacto y no le sirve de nada a quien está intentando cerrar su
     fichaje. Aquí se traduce a lo único accionable: vuelve a entrar. */
  if(_esErrorDeSesion_(err))
    throw new _ApiSesion("Tu sesi\u00f3n con Google ha caducado (dura una hora). Vuelve a entrar "+
                         "con tu cuenta y repite la acci\u00f3n \u2014 no se ha guardado nada.");
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
    return Promise.resolve(api[accion](arg)).catch(function(e){
      /* ⛔ SIGUE TRAGANDO, pero NO todo es lo mismo. Que falte un dato es normal y no
         puede tumbar a los demás — para eso nació esto. Que la **sesión** haya caducado
         es otra cosa: no va a venir ninguno, **nunca más**, y el panel se queda
         repintando lo de hace horas sin un solo error. En el escritorio, que vive
         abierto toda la tarde, eso es decidir sanciones sobre una cola vieja. */
      if (e && e.sesion) _sesionMuerta_(true);
      return null;
    });
  }catch(_){ return Promise.resolve(null); }
}

/* ¿Se ha muerto la sesión mientras la pestaña seguía abierta? En `window` y no en una
   variable de módulo: `comun.js` no lleva ni una sentencia ejecutable de nivel superior. */
function _sesionMuerta_(v){
  if (v !== undefined) window.__SESION_MUERTA = !!v;
  return !!window.__SESION_MUERTA;
}

/* Lo dice UNA vez, y con el aviso que no caduca.

   ⛔ UNA VEZ, no una cada 90 s: un aviso que reaparece solo cada minuto y medio se cierra
   sin leer a la tercera, y entonces ya da igual lo que ponga.

   ⛔ Y FIJO, por la decisión del 28/07: *un aviso que caduca solo sirve para lo que no
   importa*. Aquí lo que se dice es que **lo que estás mirando ya no es de fiar**. */
function _avisarSesionMuerta_(){
  if (!_sesionMuerta_() || window.__SESION_MUERTA_DICHA) return false;
  window.__SESION_MUERTA_DICHA = true;
  tost('Tu sesi\u00f3n ha caducado: esta pantalla ya NO se est\u00e1 actualizando y lo que ves '+
       'puede ser de hace horas. Recarga y vuelve a entrar.', {fijo:true});
  return true;
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
  /* Rango 2: a todos menos a quien tenga MAS rango que el. Se mira el RANGO y no el
     nombre: escrito con el nombre dentro, el dia que cambie el PD el nuevo queda
     DESPROTEGIDO y el anterior sigue blindado. Lo comprueba `probar_sancionar.py`. */
  if (r === 2) return rangoSanc(objetivo) < 3;
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
/* Las horas de un mes SIN la compensacion que llega por el cargo.

   ⛔ Daniel (07/08): «la comparacion de horas con el mes anterior deberia tener en cuenta que las
   compensaciones deberian ser descontadas (la compensacion base, no las que se apañan a
   posteriori)». Y tiene razon de fondo: la base **no se trabaja, se cobra por el puesto**, asi que
   dejarla dentro hace que la comparativa mida el CARGO y no el trabajo — a quien coordina le sale
   un ritmo alto sin haber fichado una hora, y comparado consigo mismo nunca se mueve, porque esa
   parte es constante todos los meses.

   ⚠️ **La EXTRA no se descuenta**, y es la mitad del encargo: esa se la ha ganado alguien haciendo
   algo de mas —cubrir un turno, un reporte— y se la asigna el PD a mano. Quitarla seria borrar
   justo lo unico de los dos que reconoce trabajo real.

   El suelo es 0: si alguien tiene menos horas que su base, su trabajo del mes es 0, no negativo. */
function _horasSinBase_(m, h){
  if(typeof h!=='number' || !isFinite(h)) return null;
  return Math.max(0, Math.round((h - _compBase_(m))*100)/100);
}

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
      /* ⛔ CON `await`. Sin el, el `catch` de abajo **no coge nada**: la promesa se
         rechaza sola y sale por la ventana como «unhandled rejection». Aqui el silencio
         SI es aceptable -esto corre en cada apertura y se reintenta solo-, pero tiene
         que ser un silencio elegido, no un error que se escapa por un hueco. */
      if(sub && typeof SESION!=='undefined' && SESION){
        await api.guardarPush(sub.toJSON());
        _pushFallo_(null);   /* ⛔ y el exito lo BORRA: un aviso que no se retira miente */
      }
    }
  }catch(e){
    /* ⛔ NO SE TRAGA. Este re-guardado existe porque los navegadores ROTAN la
       suscripcion, y arriba esta escrito lo que pasa si no se re-guarda: **dejan de
       llegar avisos en silencio**. Tragarse su error es provocar justo eso.
       ⚠️ No bloquea ni avisa por su cuenta: corre al abrir, y una caida puntual se
       arregla sola en la siguiente apertura. Lo que hace es dejar CONSTANCIA, y la
       pantalla de avisos la enseña — ahi si esta mirando quien puede actuar. */
    _pushFallo_((e && e.message) || String(e));
  }
}

/* Lo ultimo que fallo al registrar los avisos, o `null`. En `window` y no en una variable
   de modulo: `comun.js` no lleva ni una sentencia ejecutable de nivel superior, y eso es
   lo que lo hace seguro de cargar antes que nada. */
function _pushFallo_(v){
  if (v !== undefined) window.__PUSH_FALLO = v || null;
  return window.__PUSH_FALLO || null;
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

/* Una clave de un solo uso para un envío. ⛔ Se genera UNA VEZ por envío y se reutiliza en
   los reintentos: si se generara dentro del reintento, cada intento traería una clave distinta
   y el servidor los vería como envíos distintos — que es justo el fallo que esto evita.
   No es criptográfica y no hace falta que lo sea: solo tiene que no repetirse entre envíos de
   la misma persona en el mismo segundo. */
function _claveUso_(){
  return 'c' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/* ═══ EL BLOQUE MÍNIMO DE UN TURNO ═════════════════════════════════════════════════
   Espejo de `reglas/turnos.py:bloque_desde`. Daniel (07/08/2026): franjas por horas, *«que te
   obligue a mínimo 4 horas… prácticamente como se comportaría una reunión de 4 horas»*.

   ⛔ **El bloque SIEMPRE mide `minimo`, y por eso se ANCLA HACIA ATRÁS si no cabe.** Tocar las
   21:00 en un día que acaba a las 22:00 no puede dar un turno de una hora: da el de 19 a 22.
   Recortarlo dejaría decir «puedo un turno» a quien no llega, y no daría ningún error — saldría
   un turno corto en el reparto y nadie sabría por qué.

   ⛔ **Con MENOS franjas que el mínimo se marca SOLO la tocada.** Es el caso de las
   convocatorias de dos franjas (mañana/tarde), donde cada franja YA es un turno entero: marcar
   las dos diría que puedes por la tarde cuando dijiste que por la mañana. */
function _minTurno_(cv){
  var m = cv && cv.min_h;
  return (typeof m==='number' && m>0) ? m : 1;
}

function _bloqueDesde_(franjas, k, minimo){
  var claves=[], i;
  for(i=0;i<(franjas||[]).length;i++){
    var f=franjas[i];
    claves.push(f && typeof f==='object' ? f.k : f);
  }
  var pos=-1;
  for(i=0;i<claves.length;i++) if(claves[i]===k) pos=i;
  if(pos<0) return [];
  if(!(minimo>1) || claves.length<minimo) return [k];
  var ini=Math.min(pos, claves.length-minimo);
  return claves.slice(ini, ini+minimo);
}

/* Quien FIRMA un parte enrutado a esa unidad, contando que nadie decide lo suyo.
   ⛔ Y de aqui sale sola la regla que pidio Daniel -«todos los fichajes que no esten routeados
   deberian recaer en mi»-: si fichas EN CONCEPTO DE COORDINADOR de tu propia unidad, el que
   aprobaria serias tu, y como nadie firma lo suyo, sube al PD. No hay que escribir nada mas.
   Se pinta en la pantalla de fichar para que la consecuencia de elegir perfil **se vea antes
   de elegirlo**: es la mitad de la decision, y hasta ahora era invisible. */
function _firmaDe_(unidad, quien){
  var c = coordinadorDe(unidad);
  return c === quien ? PD_NOM : c;
}

/* Quien coordina esa unidad; si nadie, el PD. */
function coordinadorDe(u){
  var c = buscaMiembro(function(m){ return m.cargo==='Coordinador' && m.unidad===u; });
  return c ? c.nombre : PD_NOM;
}


/* ⛔ EL MAPA DE CALOR · UNA SOLA VEZ (05/08/2026). Estaba escrito en las DOS caras con la
   etiqueta GEMELA encima, y **ya divergian** — que es exactamente lo que ese comentario
   avisaba que iba a pasar (mapa §5, D6). Diferencias medidas:

     · el ESCRITORIO tenia un atajo de SEMILLA (`r.calor` precalculado) que el movil no. Es de
       demo: en cuanto llegan respuestas reales se pone a `null` y se recalcula. Se conserva,
       porque sin el la pantalla de demo no pinta nada, y va marcado como lo que es.
     · con BLOQUES DUPLICADOS el movil ACUMULA y el escritorio SOBREESCRIBIA con el ultimo.
       Gana acumular: un bloque repetido es un dato malo, y perder respuestas en silencio es
       peor que contarlas de mas — al menos se nota.

   `pond=false` cuenta PERSONAS (cualquier valor > 0); `pond=true` suma los VALORES
   (presencial+telematico=2, telematico=1). El movil necesita las dos y la llama dos veces.

   ⚠️ `null` NO es cero: es **bloque NO OFERTADO**. Con horario por dia no todas las franjas
   existen todos los dias, y pintar un hueco muerto como «no puede nadie» es mentir. Por eso la
   matriz nace a `null` y solo los bloques realmente ofertados pasan a 0.

   ⚠️ Y el indice de `resp[nombre][i]` es la posicion en `bloques`, **no** la franja: si
   `bloques` se reordena (lo hace `_ordenarFranjas_`), hay que pasar aqui el reordenado y sus
   respuestas alineadas. Mezclar los dos ordenes es lo que apuntaba a otra hora. */
function _calorDe_(r, pond){
  if(!pond && Array.isArray(r.calor) && r.calor.length) return r.calor;   // semilla de demo
  var dias=r.dias||[], F=r.franjas||[], bl=r.bloques||[], resp=r.resp||{};
  var cel=dias.map(function(){ return F.map(function(){ return null; }); });
  bl.forEach(function(b){ if(Array.isArray(b) && cel[b[0]] && b[1]>=0 && b[1]<F.length) cel[b[0]][b[1]]=0; });
  Object.keys(resp).forEach(function(nom){
    var v=resp[nom]; if(!Array.isArray(v)) return;
    for(var i=0;i<bl.length;i++){
      var val=+v[i]||0; if(!(val>0)) continue;
      if(!Array.isArray(bl[i])) continue;
      var d=bl[i][0], f=bl[i][1];
      if(cel[d] && cel[d][f]!=null) cel[d][f] += (pond ? val : 1);
    }
  });
  return cel;
}

/* ⛔ ¿ES LA UNIDAD DE DOCUMENTACIÓN TÉCNICA? El nombre llega de tres sitios y no coincide:
   `UCT` (el viejo, y el que sigue usando Cowork), `Documentación Técnica` (el del roster) y
   `Unidad de Documentación Técnica` (el canónico que devuelve `umbral.coordinadas`). Se
   pregunta por la unidad, NO por quién la lleva — que es justo lo que se viene a arreglar. */
/* `AAAA-MM-DD` → «lun 10», para rotular una rejilla de días.

   ⛔ Esto es FORMATO, no calendario. La regla de cuándo se abre y cuándo vence una
   convocatoria vive en `reglas/convocatoria.py` y no se reescribe en ninguna cara; aquí
   solo se pone nombre a un día que ya viene dado.

   ⚠️ Se ancla al MEDIODIA local a propósito: `new Date('2026-08-10')` se parsea como UTC
   —así lo manda la norma para la forma corta—, con lo que en un huso al oeste devuelve el
   día ANTERIOR. Con `T12:00` no hay huso que lo mueva.

   El array va DENTRO: `comun.js` no lleva ni una sentencia ejecutable de nivel superior, y
   esa es la propiedad que hizo que se pudiera sacar del HTML sin arrastrar orden de carga. */
/* ===== PERFILES: con QUE CARGO fichas =========================================
   Espejo de `reglas/perfiles.py`. Daniel (06/08): *"si Bruno ficha en concepto de
   coordinador de logistica no es lo mismo que fichando en concepto de miembro de
   propulsion"*. El perfil fija el SUBSISTEMA del parte, y el subsistema fija QUIEN
   LO APRUEBA -- asi que elegir perfil es elegir a quien le llega la firma.

   Y de ahi sale sola la regla que pidio Daniel -"todos los fichajes que no esten
   routeados deberian recaer en mi"-: si fichas en concepto de coordinador de tu
   propia unidad, el que aprobaria serias tu, y como nadie decide lo suyo, sube al
   PD. No hay que escribir nada.

   La clave es la UNIDAD, no el rol: dos perfiles de la misma unidad enrutan igual
   y se FUNDEN en uno (se conserva el rotulo de mas peso). Ofrecer dos opciones que
   hacen lo mismo es ruido que hay que leer igual.

   Esto es la PANTALLA. La validacion de verdad la hace el SERVIDOR: sin ella
   cualquiera mandaria sus horas a la cola de cualquier coordinador. */
/* Cuanto pesa cada rol al fundir dos perfiles de la misma unidad: coordinar manda
   sobre estar. Es una FUNCION y no un `var` a proposito: `comun.js` no lleva ni una
   sentencia ejecutable de nivel superior -- es lo unico que lo hace seguro de cargar
   antes que nada, y el dia que lleve una, dejara de serlo sin que nadie lo note. */
function _pesoPerfil_(rol){ return rol==='coordinador' ? 2 : 1; }

function _limpio_(v){ return ((v==null?'':v)+'').replace(/^\s+|\s+$/g,''); }

/* `coordina` llega como cadena, lista o nada.
   Una cadena NO se itera como lista: recorrer "Logistica" daria nueve perfiles de
   una letra. Es el fallo mudo de un campo que a veces viene suelto y a veces en
   lista, y aqui acabaria enrutando horas a ninguna parte. */
function _unidadesCoord_(v){
  if(!v) return [];
  if(typeof v==='string') v=[v];
  if(typeof v.length!=='number') return [];
  var out=[],i,u;
  for(i=0;i<v.length;i++){ u=_limpio_(v[i]); if(u) out.push(u); }
  return out;
}

/* Los perfiles de `m`, de mas peso a menos y luego por unidad. Lista VACIA si no se
   sabe nada de esa persona: eso es "no lo se", y quien llame tiene que poder
   distinguirlo de "tiene un perfil". Nunca se inventa uno. */
function _perfilesDe_(m){
  if(!m||typeof m!=='object') return [];
  var orden=[], por={}, i, u, unidad=_limpio_(m.unidad);
  if(unidad){ por[unidad]={unidad:unidad,rol:'miembro',txt:'miembro de '+unidad}; orden.push(unidad); }
  var cs=_unidadesCoord_(m.coordina);
  for(i=0;i<cs.length;i++){
    u=cs[i];
    if(!por[u]) orden.push(u);
    else if(_pesoPerfil_(por[u].rol)>=_pesoPerfil_('coordinador')) continue;
    por[u]={unidad:u,rol:'coordinador',txt:'coordinador de '+u};
  }
  var out=[];
  for(i=0;i<orden.length;i++) out.push(por[orden[i]]);
  out.sort(function(a,b){
    var d=_pesoPerfil_(b.rol)-_pesoPerfil_(a.rol);
    return d ? d : (a.unidad<b.unidad?-1:a.unidad>b.unidad?1:0);
  });
  return out;
}

/* Con uno solo NO se pregunta: un desplegable de una opcion es un paso que no
   decide nada y que hay que tocar igual. */
function _hayQuePreguntarPerfil_(m){ return _perfilesDe_(m).length>1; }

/* El que sale marcado. Es LA UNIDAD DE LA PERSONA, no el primero de la lista:
   fichar "como miembro de lo tuyo" es lo que se hace el 99 % de las veces, y poner
   arriba el cargo haria que quien coordina algo enrutara por error TODAS sus horas
   a su propio cargo -- que ademas es justo el caso que acaba en el PD por no poder
   firmarse uno mismo. */
function _perfilDefecto_(m){
  var ps=_perfilesDe_(m), i, unidad=_limpio_(m&&m.unidad);
  if(!ps.length) return null;
  for(i=0;i<ps.length;i++) if(ps[i].unidad===unidad) return ps[i];
  return ps[0];
}

function _perfilValido_(m,unidad){
  var ps=_perfilesDe_(m), i, u=_limpio_(unidad);
  for(i=0;i<ps.length;i++) if(ps[i].unidad===u) return true;
  return false;
}

/* ═══ NOVEDADES · la capa de «esto es nuevo, míralo» ════════════════════════════════
   Daniel (06/08/2026): *«una capa completamente retirable… unas cosas que me rodeen las cosas
   nuevas para que las checkee, desde la última vez que las vi»* · *«lo suyo sería que vayan por
   TANDAS: al cerrar una que no se borre sino que se deseleccione y se guarde en un historial
   para tú llevar cuenta de que voy aprobando y cuándo»*.

   ⛔ **UNA SOLA LISTA, en `comun.js`, para las dos caras.** Cada entrada dice a qué cara y a qué
   pantalla pertenece, así que cada cara enseña lo suyo sin que haya dos listas que mantener —
   que es como acaban diciendo cosas distintas.

   ⛔ **Cerrar una tanda NO la borra.** Se le pone fecha y se va al historial: la lista de arriba
   es «lo que te falta por mirar» y la de abajo es «lo que ya miraste, y cuándo». Borrarlas
   dejaría sin respuesta la pregunta de para qué es esto — saber qué has revisado.

   ⚠️ **Hoy el «visto» se guarda en ESTE navegador** (`localStorage`). Es lo que se puede hacer
   sin tocar el servidor: `setControl` exige ser la cuenta de administración
   (`ADMIN_EMAIL = solaris@uvigoaerotech.com`), y con la cuenta personal lo rechazaría. Para que
   el historial llegue **también a quien programa** hace falta una acción nueva en el backend
   gateada a rango ≥ 3. Está apuntado, y NO se finge: el pie de la capa lo dice. */

/* ⛔ DE DONDE SALE LA HORA DE UN PARTE, EN UN SOLO SITIO Y CON UN SOLO VOCABULARIO.
   Habia TRES para el mismo hecho y por eso no coincidian: el booleano `sinFichaje`, el `origen`
   que manda el backend (`fichaje` · `manual` · `otorgada` · `reversion`) y un `bloque`/`turno`
   que se inventaba el escritorio. Las diferencias eran los fallos:

   · Un parte OTORGADO salia en el escritorio con DOS etiquetas a la vez -- «declarado sin
     fichaje» en ambar Y «otorgada por X»--, o sea **acusando al miembro de algo que hizo el
     sistema**. Medido sobre los partes reales del servidor: los cuatro `otorgada`.
   · Y la ficha de decision del movil pintaba «declarado sin fichaje» sobre un parte que traia
     **su hora de entrada y de salida escritas al lado**. Daniel (07/08): *«todos ponian
     declarado sin fichaje, no se hasta que punto eh»*. Tenia razon en dudar.

   ⚠️ **La pregunta es «de donde sale», no «que le falta».** `sinFichaje` contesta lo segundo, y
   por eso metia en el mismo saco lo que otorga la coordinacion y lo que alguien declara a mano.

   Devuelve `{tono, txt}` o `null`. El tono lo pinta cada cara a su manera; lo que NO se decide
   dos veces es cual es. */
/* CUANTOS APUNTES ANUNCIA «Ultimos movimientos». La compensacion del cargo **es uno** — Daniel
   (07/08): *«dice 0 apuntes este mes cuando si los hay: la compensacion inicial es un apunte»*—,
   y tenia razon dos veces: el cuerpo ya la pinta como una fila mas, y la lista de abajo ya le
   reservaba su hueco (`MOVS_N-1`). El unico sitio que no la contaba era **el numero que la
   anuncia**, o sea la pantalla contradiciendose sola.

   ⚠️ Se cuenta cuando **lleva horas**: con el dato real de Notion, o si alguien pone un cargo a 0
   en `COMP_CARGO`, la fila valdria cero y anunciar un apunte de cero horas seria el mismo fallo
   del reves. Hoy no pasa (`_compBase_` da 2 h por defecto), pero depende de una constante que se
   edita.
   ⚠️ Y la EXTRA no suma otro: va **dentro** del mismo apunte — por eso comparten hueco.

   Vive aparte porque es lo unico de esa tarjeta que se puede EJECUTAR en un banco: el resto es
   HTML con medio modulo detras. */
function _apuntesMes_(fichajes, horasComp, horasExtra){
  return (fichajes||0) + (((horasComp||0)!==0 || (horasExtra||0)!==0) ? 1 : 0);
}

function _etiOrigenParte_(p){
  var o = p && p.origen;
  if(o === 'fichaje') return null;              // el caso normal no necesita rotulo
  if(o === 'otorgada') return { tono:'ok', txt:'otorgada por ' + ((p && p.decidido_por) || 'coordinación') };
  if(o === 'reversion') return { tono:'ok', txt:'reversión del parte ' + ((p && p.revierte) || '?') };
  if(o === 'manual'){
    /* Con hora de entrada y salida escritas, «sin fichaje» se lee como «no dijo cuando», que es
       falso y visible: el rango esta ahi al lado. Lo que le falta es el cronometro, no el dato. */
    return { tono:'aviso', txt:(p && p.ini && p.fin) ? 'declarado a mano' : 'declarado sin fichaje' };
  }
  /* Un parte VIEJO sin `origen`: es lo unico que se sabe de el y no se le inventa procedencia. */
  return (p && p.sinFichaje) ? { tono:'aviso', txt:'declarado sin fichaje' } : null;
}

function _novedades_(){
  /* Lo más nuevo primero. Al cerrar una pieza se añade su tanda AQUÍ, en ese momento.

     ⛔ CRITERIO DE ENTRADA: **solo entra lo que se puede MIRAR en la app**. Esta capa existe
     para que Daniel revise; una regla de Python sin pantalla no tiene nada que revisar, y
     meterla aquí le manda a buscar algo que no está. El 06/08 quedaron fuera a propósito
     `reglas/convocatoria.que_toca` y `reglas/perfiles.py`: son la base de dos pantallas que
     todavía no existen, y entrarán **cuando entre su pantalla**.

     El sitio donde SÍ va todo —también lo invisible— es `docs/tandas.md`. Dos lectores, dos
     documentos: aquí lo que se toca, allí lo que se hizo. */
  return [
    { id:'2026-08-09-plazo-palabras', fecha:'2026-08-09',
      titulo:'El plazo para cubrir ya se dice en palabras',
      items:[
        {cara:'movil', vista:'reu', txt:'Antes ponía «cierra el 20/08/2026» y tenías que '
          + 'mirar el calendario. Ahora dice «cierra HOY», «cierra mañana» o «cierra en 2 días» '
          + 'cuando corre prisa, y «el plazo cerró el 08/08» si ya venció — en la lista, en la '
          + 'ficha y en la tarjeta de Próxima reunión. Ese plazo es el que mira el motor de '
          + 'sanciones, así que no es un adorno.'}
      ] },
    { id:'2026-08-09-dura-reunion', fecha:'2026-08-09',
      titulo:'Ahora se ve cuánto dura cada reunión, antes de abrirla',
      items:[
        {cara:'movil', vista:'reu', txt:'En Reuniones, cada una dice lo que dura junto a '
          + 'cuándo cierra y a cuánta gente hay convocada — «cierra el 20/08 · 12 convocados · '
          + 'dura 1 h 30 min». Antes ese dato solo aparecía al abrir «Cubrir mi disponibilidad», '
          + 'así que no sabías si te cuadraba hasta estar dentro. Las reuniones creadas antes de '
          + 'este modelo no lo traen y no dicen nada, en vez de inventarse una hora.'}
      ] },
    { id:'2026-08-09-fijar-minimo', fecha:'2026-08-09',
      titulo:'Fijar una reunión ya no la deja en menos de lo que dura',
      items:[
        {cara:'escritorio', vista:'reuniones', txt:'Al fijar la fecha, «Desde» y «Hasta» '
          + 'admitían cualquier cosa: una reunión de 1 h 30 se podía fijar en media hora y '
          + 'nadie avisaba. Ahora el panel dice cuántas franjas dura, se estira sola al '
          + 'mínimo si te quedas corto —y te lo dice— y no deja fijarla si desde esa hora no '
          + 'cabe entera. El móvil ya lo hacía; esta es la pantalla donde de verdad se fija.'}
      ] },
    { id:'2026-08-08-arreglos-web', fecha:'2026-08-08',
      titulo:'Tres arreglos que solo se ven cuando algo va mal',
      items:[
        {cara:'escritorio', vista:'panel', txt:'Si el inicio de sesión de Google no carga, ahora '
          + 'lo DICE, con un botón de reintentar. Antes entrabas directo a la app con la semilla '
          + 'de demostración y con pinta de funcionar: cualquier decisión tomada ahí era sobre '
          + 'datos inventados. Ver la demo sigue estando, pero como elección tuya.'},
        {cara:'movil', vista:'estado', txt:'La app instalada de beta vuelve a abrir: al mudar la '
          + 'web a carpetas, el acceso directo arrancaba en una página que ya no existía. Si la '
          + 'tienes en la pantalla de inicio, mejor bórrala y vuelve a añadirla.'},
        {cara:'movil', vista:'estado', txt:'Las notificaciones vuelven a llevar su icono: pedían '
          + 'una imagen que se había movido de sitio, así que llegaban peladas.'}
      ] },
    { id:'2026-08-08-partes-viejos', fecha:'2026-08-08',
      titulo:'Tus partes de meses anteriores ya no estorban',
      items:[
        {cara:'movil', vista:'horas', txt:'Los partes de meses pasados se han ido a su propio '
          + 'bloque plegado, «De meses anteriores», que nace cerrado. Los de este mes se ven '
          + 'solos y el contador de arriba cuenta solo esos, para que cuadre con lo que ves.'},
        {cara:'movil', vista:'horas', txt:'No se han ocultado ni borrado: son horas tuyas y '
          + 'siguen a un toque. Si prefieres que desaparezcan del todo o que solo se marquen, '
          + 'dilo y se cambia — esto es reversible.'}
      ] },
    { id:'2026-08-08-mes-anterior-vivo', fecha:'2026-08-08',
      titulo:'Ya puedes compararte con el mes pasado',
      items:[
        {cara:'movil', vista:'horas', txt:'La fila «vs. el mes pasado» llevaba sin funcionar '
          + 'desde que se escribio, y no daba ningun error: una parte del programa se rompia por '
          + 'dentro al leer el registro del Drive y devolvia una lista vacia sin quejarse. Ya '
          + 'esta: el servidor devuelve la media real del equipo en julio.'},
        {cara:'movil', vista:'horas', txt:'Falta un detalle para afinarlo del todo: para saber '
          + 'cuantos dias duro julio hacen falta DOS cierres guardados y de momento solo esta el '
          + 'suyo. En cuanto cierres agosto se ajusta solo, sin tocar nada.'}
      ] },
    { id:'2026-08-08-anio-hoja', fecha:'2026-08-08',
      titulo:'La comparacion con el mes pasado, un paso mas cerca',
      items:[
        {cara:'movil', vista:'horas', txt:'El registro del Drive escribe el año una sola vez y '
          + 'luego encadena los meses, asi que al buscar «julio de 2026» no se encontraba nada: '
          + 'para el programa ese mes no existia. Ahora el año se deduce del orden de los meses. '
          + 'Todavia falta un detalle para que la fila del mes pasado aparezca, y esta localizado.'}
      ] },
    { id:'2026-08-08-mes-real', fecha:'2026-08-08',
      titulo:'Lo del mes de cierre a cierre ya funciona DE VERDAD',
      items:[
        {cara:'movil', vista:'horas', txt:'Estaba escrito pero no llegaba a funcionar: la parte '
          + 'que mira cuando se cerro el mes buscaba la fecha en un sitio y quien la guarda la '
          + 'escribe en otro, asi que no la encontraba nunca y se caia a contar dias de '
          + 'calendario — siempre, desde el primer dia. Hoy 8 de agosto: el calendario diria 8 '
          + 'dias y ahora dice 5, que son los que van desde que se cerro julio el dia 4.'},
        {cara:'movil', vista:'horas', txt:'Lo que esto cambia es tu ritmo: dividir tus horas '
          + 'entre 8 dias en vez de entre 5 lo dejaba en poco mas de la mitad, y a todo el '
          + 'equipo a la vez.'}
      ] },
    { id:'2026-08-07-pd-agregado', fecha:'2026-08-07',
      titulo:'Daniel: tu propia app era la unica que no recibia esto',
      items:[
        {cara:'movil', vista:'horas', txt:'Todo lo del mes de cierre a cierre estaba llegando a '
          + 'todo el equipo menos a ti. El servidor manda un resumen del mes (los dias que lleva, '
          + 'la media del equipo) y a quien tiene rango de Project Director se le devolvia el '
          + 'panel completo por otro camino, sin ese resumen. Tu app entonces se lo calculaba '
          + 'sola: contaba los dias del calendario en vez de los que van desde el cierre, y '
          + 'sacaba una media del equipo sin descontar la compensacion de cada cargo — o sea '
          + 'comparaba tus horas ya descontadas contra una media sin descontar.'},
        {cara:'movil', vista:'horas', txt:'No daba ningun error porque cada una de esas lecturas '
          + 'tiene un plan B, y el plan B es justo el numero equivocado. Ahora el resumen viaja '
          + 'por la misma puerta para todo el mundo.'}
      ] },
    { id:'2026-08-07-mes-anterior-cierre', fecha:'2026-08-07',
      titulo:'Y el mes ANTERIOR tambien se mide de cierre a cierre',
      items:[
        {cara:'movil', vista:'horas', txt:'La comparativa «vs. el mes pasado» ya no divide entre los días del calendario, sino entre los que ese mes duró de verdad: del cierre del mes anterior al suyo. Tu ejemplo: si junio se cerró el 29 y julio el 4 de agosto, julio duró 37 días, no 31 — y dividir por 31 inflaba el ritmo de julio, del equipo entero a la vez y sin dar ningún error.'},
        {cara:'movil', vista:'horas', txt:'Hacen falta DOS cierres guardados para saber cuándo empezó un mes, y ahora mismo solo está el de julio. Hasta el próximo cierre mensual se sigue usando el calendario: aproximado, pero no inventado. En cuanto cierres agosto, el número pasa a ser el real y no hay que tocar nada.'}
      ] },
    { id:'2026-08-07-mes-de-cierre', fecha:'2026-08-07',
      titulo:'Tus horas se comparan por el mes DE VERDAD, no por el calendario',
      items:[
        {cara:'movil', vista:'horas', txt:'Un mes no dura lo que dice el calendario: dura desde que se cierra el anterior hasta que se cierra ese. Julio se cerró el 4 de agosto, así que agosto empezó ese día. La app dividía tus horas entre los días del calendario, y a principios de mes eso hacía que el ritmo saliera a poco más de la mitad del real — a todo el equipo a la vez.'},
        {cara:'movil', vista:'horas', txt:'Y la comparación con el mes anterior sale ahora del registro del Drive, que es donde está el dato bueno. Eso quiere decir que si se corrige algo a mano en el panel, la app lo respeta en vez de ignorarlo.'}
      ] },
    { id:'2026-08-07-medidor-memoria', fecha:'2026-08-07',
      titulo:'El medidor ya no se cae a cero cada vez que abres la app',
      items:[
        {cara:'movil', vista:'estado', txt:'Al entrar, el medidor de conducta se vaciaba y volvía a llenarse aunque no hubiera pasado nada. Ahora recuerda tus puntos entre recargas: si no han cambiado, aparece lleno y ya. Si han cambiado, se anima — que es cuando la animación dice algo.'},
        {cara:'movil', vista:'estado', txt:'Y si lo tocas, se rearma desde cero a propósito: ahí la animación es lo que has pedido.'}
      ] },
    { id:'2026-08-07-partes-orden', fecha:'2026-08-07',
      titulo:'Tus partes de horas salen ordenados por fecha',
      items:[
        {cara:'movil', vista:'horas', txt:'No estaban ordenados por nada: salían en el orden en que los mandara el servidor, así que uno de un mes viejo podía aparecer por encima de los de hoy. Ahora lo más reciente va primero y lo antiguo cae al fondo.'}
      ] },
    { id:'2026-08-07-turnos-hueco', fecha:'2026-08-07',
      titulo:'Turnos dice qué falta cuando no hay semana convocada',
      items:[
        {cara:'movil', vista:'turnos', txt:'Si no hay ninguna semana abierta, la pantalla no decía absolutamente nada — así que parecía que lo de rellenar disponibilidad no existía. Ahora avisa de que no hay nada que rellenar todavía, y a quien puede convocar le dice dónde se hace.'}
      ] },
    { id:'2026-08-07-arranque-escritorio', fecha:'2026-08-07',
      titulo:'El escritorio tampoco se recarga solo al entrar',
      items:[
        {cara:'escritorio', vista:'estado', txt:'Igual que en el móvil: al entrar volvía a pedir las siete cosas —turnos, tareas, panel, sanciones, partes, documentos y reuniones— 300 ms después de haberlas recibido, y repintaba encima. Aquí molestaba más, porque repintar pierde el scroll de donde estuvieras.'},
        {cara:'escritorio', vista:'estado', txt:'Si el servidor no contesta a la primera, esa recarga SIGUE ocurriendo: es lo que salva la pantalla, y sin ella turnos, tareas y documentos se quedarían con datos de ejemplo hasta el minuto y medio.'}
      ] },
    { id:'2026-08-07-lote-congelado', fecha:'2026-08-07',
      titulo:'El bloque de sanciones del escritorio se quedaba en el lote de cuando entrabas',
      items:[
        {cara:'escritorio', vista:'sanciones', txt:'El panel se refresca solo cada 90 segundos, pero al traer las sanciones nuevas no volvía a montar el bloque: seguías viendo el lote que había al entrar, con una pantalla recién repintada que lo hacía parecer al día. Si se cerraba un bloque nuevo mientras tenías la pestaña abierta, no aparecía hasta recargar.'},
        {cara:'escritorio', vista:'horas', txt:'Lo mismo con la cola de partes de horas. Y de paso: si se cae la red durante un refresco, ya no se pierde la cola real —antes volvía a salir la de ejemplo, sin avisar—.'}
      ] },
    { id:'2026-08-07-fosil-escritorio', fecha:'2026-08-07',
      titulo:'El escritorio comparaba las horas contra un mes fosilizado',
      items:[
        {cara:'escritorio', vista:'equipo', txt:'Las «lecturas automáticas» de Equipo decían quién sube y quién baja «respecto al mes pasado», y el mes pasado que usaban era JUNIO — un número viejo que se quedó guardado en el servidor y que ya no actualiza nadie. Es el mismo fallo que estaba en el móvil, en la otra cara, y con el rótulo correcto no se notaba.'},
        {cara:'escritorio', vista:'equipo', txt:'Ahora sale del dato real; y si no lo hay, en vez de inventarse una comparación dice que todavía no se puede comparar la evolución.'}
      ] },
    { id:'2026-08-07-widget-extra', fecha:'2026-08-07',
      titulo:'La pantalla de entrada ya no se carga una vez de más',
      items:[
        {cara:'movil', vista:'estado', txt:'Al entrar, la app volvía a pedir turnos, tareas, reuniones y tu panel 300 ms después de haberlos recibido, y repintaba la pantalla encima de la que acababa de dibujar. Esa segunda pasada era el parpadeo que quedaba. Ahora, si el arranque trajo los datos, no se pide nada más.'},
        {cara:'movil', vista:'estado', txt:'Si el arranque falla, ese refresco SIGUE ocurriendo: es lo que salva la pantalla cuando el servidor no contesta a la primera, y sin él los turnos y las tareas se quedarían vacíos hasta el minuto y medio.'}
      ] },
    { id:'2026-08-07-sin-base', fecha:'2026-08-07',
      titulo:'La comparativa de horas ya no cuenta la compensación de tu cargo',
      items:[
        {cara:'movil', vista:'horas', txt:'La fila «vs. <mes anterior>» sumaba la compensación que te llega por el cargo (PD 7 h, coordinador 3,5 h, miembro 2 h). Esa no se trabaja: se cobra por el puesto y es la misma todos los meses, así que la comparativa medía tu cargo en vez de tu trabajo — y comparado contigo mismo no se movía nunca. Ahora se descuenta en los DOS lados.'},
        {cara:'movil', vista:'horas', txt:'La compensación EXTRA (la que asigna el PD a mano por cubrir un turno o un reporte) SÍ sigue contando: es lo único de las dos que reconoce trabajo real. Y con menos horas que tu base la cuenta se queda en 0, no en negativo.'},
        {cara:'movil', vista:'horas', txt:'Y la fila «vs. equipo» también, que esa hubo que arreglarla en el servidor (backend v69): la base depende del cargo de cada uno, y tu móvil no conoce ni las horas ni el cargo de los demás. Si se hubiera descontado solo en tu lado, la comparación sería con descuento contra sin descuento — peor que no tocarla.'}
      ] },
    { id:'2026-08-08-panel-congelado', fecha:'2026-08-08',
      titulo:'El panel ya avisa cuando deja de actualizarse',
      items:[
        {cara:'escritorio', vista:'estado', txt:'Si tu sesi\u00f3n caduca con el panel abierto, **dejaba de actualizarse sin decir nada**: segu\u00eda repintando lo de hace horas y no aparec\u00eda ning\u00fan error. Se pod\u00eda estar decidiendo sobre una cola vieja creyendo que estaba al d\u00eda. Ahora lo dice, una vez y sin que se vaya solo.'},
        {cara:'movil', vista:'estado', txt:'Igual en el m\u00f3vil, aunque ah\u00ed pasa menos porque se recarga m\u00e1s.'}
      ] },
    { id:'2026-08-08-aviso-que-se-lee', fecha:'2026-08-08',
      titulo:'Los avisos importantes ya no se van solos',
      items:[
        {cara:'movil', vista:'horas', txt:'Si no se puede enviar un fichaje porque tu sesi\u00f3n ha caducado, el aviso **se queda hasta que lo tocas**. Antes desaparec\u00eda en dos segundos y medio, que no da tiempo a leer lo que hay que hacer.'}
      ] },
    { id:'2026-08-08-avisos-de-verdad', fecha:'2026-08-08',
      titulo:'Activar los avisos ya no se da por hecho',
      items:[
        {cara:'movil', vista:'estado', txt:'Al activar las notificaciones, si el registro en el servidor fallaba **no se dec\u00eda nada** y entrabas igual: el tel\u00e9fono ten\u00eda el permiso, pero el servidor no sab\u00eda a d\u00f3nde mandarte los avisos, as\u00ed que no te llegaba ninguno. Ahora lo dice y puedes reintentar.'},
        {cara:'movil', vista:'estado', txt:'Y si al abrir el panel no se puede confirmar tu registro, sale un aviso en la pantalla de notificaciones. Los navegadores rotan esa suscripci\u00f3n de vez en cuando, y si no se vuelve a guardar los avisos dejan de llegar sin que nadie se entere.'}
      ] },
    { id:'2026-08-08-sesion-caducada', fecha:'2026-08-08',
      titulo:'\u00abToken inv\u00e1lido\u00bb al cerrar el fichaje: ahora dice qu\u00e9 hacer',
      items:[
        {cara:'movil', vista:'horas', txt:'Si dejas la app abierta m\u00e1s de una hora, tu identidad de Google caduca y el servidor rechaza lo que env\u00edes. Sal\u00eda un \u00abtoken no v\u00e1lido\u00bb que no dec\u00eda nada. Ahora dice que la sesi\u00f3n ha caducado, que vuelvas a entrar, y que NO se ha guardado nada \u2014 as\u00ed sabes que puedes repetir sin miedo a fichar dos veces.'},
        {cara:'escritorio', vista:'horas', txt:'Igual aqu\u00ed, y es donde m\u00e1s pasa: este panel se deja abierto toda la tarde.'}
      ] },
    { id:'2026-08-08-reu-en-vivo', fecha:'2026-08-08',
      titulo:'El mapa de calor del escritorio ya se llena solo',
      items:[
        {cara:'escritorio', vista:'reuniones', txt:'La reuni\u00f3n que tengas abierta se actualiza sola cada 20 segundos: ves llegar las respuestas de la gente sin recargar. Antes esta pantalla se quedaba con lo que trajo al entrar \u2014 y no lo dec\u00eda, as\u00ed que pod\u00edas estar decidiendo la fecha mirando un mapa de hace una hora.'},
        {cara:'escritorio', vista:'reuniones', txt:'Solo se refresca si est\u00e1s en Reuniones, y no repinta si nadie ha contestado nada nuevo: una pantalla que se reconstruye sola cada 20 segundos para dejarse igual, molesta.'},
        {cara:'movil', vista:'reu', txt:'En el m\u00f3vil esto ya funcionaba. Lo que cambia es que ahora las dos caras usan la misma pieza para saber si algo ha cambiado, en vez de una copia cada una.'}
      ] },
    { id:'2026-08-07-horas-cuatro', fecha:'2026-08-07',
      titulo:'El parseo de horas estaba escrito cuatro veces',
      items:[
        {cara:'movil', vista:'horas', txt:'La duración de un parte se calculaba con un parseo de horas propio, distinto del que usan las reuniones. Con un dato raro daba NaN, y eso se propaga a las horas sin dar error: el parte saldría en blanco. Ahora las dos caras usan la misma.'},
        {cara:'escritorio', vista:'reuniones', txt:'La rejilla de franjas de una convocatoria también estaba duplicada entre las dos caras. Una sola, y probada: dos días que empiezan a horas distintas ya no dan franjas que se pisen.'}
      ] },
    { id:'2026-08-07-novedades-tuyas', fecha:'2026-08-07',
      titulo:'Novedades ya es solo tuya, y la app entra de una pasada',
      items:[
        {cara:'movil', vista:'estado', txt:'La entrada «Novedades» del menú NO tenía ninguna condición: en beta no se notaba, pero producción sirve el mismo HTML, así que los 32 la tenían con el registro de cambios de desarrollo. Ahora exige beta Y ser PD.'},
        {cara:'escritorio', vista:'estado', txt:'Lo mismo aquí, y filtrado también por donde se entra de verdad: esconder el botón no cierra la puerta.'},
        {cara:'movil', vista:'horas', txt:'El widget de la entrada se pintaba dos veces de más al abrir la app: había dos funciones pidiendo los mismos datos y la primera no marcaba la hora del último refresco, que es lo único que frena a la siguiente.'}
      ] },
    { id:'2026-08-07-curso', fecha:'2026-08-07',
      titulo:'Ya se ve quién está fichado ahora mismo',
      items:[
        {cara:'escritorio', vista:'horas', txt:'La vista «Fichajes en curso» pintaba tres personas de mentira. Ahora pregunta al servidor: quién tiene la entrada abierta, desde qué hora, en qué unidad y cuánto lleva.'},
        {cara:'escritorio', vista:'horas', txt:'Quien pasa de 10 h sale en ámbar, y quien está en pausa se pinta distinto de quien está trabajando.'},
        {cara:'escritorio', vista:'horas', txt:'Si el servidor no contesta lo dice, en vez de enseñar una lista vieja donde alguien que cerró hace horas seguiría saliendo como fichado.'}
      ] },
    { id:'2026-08-07-ritmo', fecha:'2026-08-07',
      titulo:'La comparativa de horas ya no dice que vas peor cuando vas mejor',
      items:[
        {cara:'movil', vista:'horas', txt:'Debajo de la barra se comparaba tu mes A MEDIAS contra el mes anterior ENTERO. A día 7, con 9,8 h este mes y 31 h el pasado, salía −68 % — y salía en rojo a principios de todos los meses, arreglándose sola según pasaban los días. Ahora se compara el RITMO (h/día): ese mismo caso sale +40 %.'},
        {cara:'movil', vista:'horas', txt:'Y «vs. equipo» compara con la media real de horas que lleva el equipo este mes, no con un 10,9 que estaba escrito a mano en el código y no se movía nunca. Si no hay dato, la fila no se pinta.'}
      ] },
    { id:'2026-08-07-avisos', fecha:'2026-08-07', titulo:'Los avisos de la convocatoria: los enciendes tú',
      items:[
        {cara:'escritorio', vista:'turnos', txt:'Interruptor nuevo «mandar los avisos al móvil». Nace APAGADO: hasta que lo enciendas no le llega nada a nadie.'},
        {cara:'escritorio', vista:'turnos', txt:'Apagado la rutina sigue calculando y deja escrito lo que mandaría, así que cuando lo enciendas ya habrás leído el texto exacto.'},
        {cara:'escritorio', vista:'turnos', txt:'Encendido avisa al abrir, a las 24 h, a las 3 h y a los 10 min — y el recordatorio solo a quien no ha contestado.'}
      ]},
    { id:'2026-08-07-mapa', fecha:'2026-08-07', titulo:'El mapa de disponibilidad ya es de verdad',
      items:[
        {cara:'escritorio', vista:'turnos', txt:'Pintaba los datos de ejemplo: se veía un mapa de calor con nombres y horas que no eran de nadie. Ahora sale de lo que ha contestado la gente.'},
        {cara:'escritorio', vista:'turnos', txt:'Y si no hay convocatoria abierta, el mapa NO se queda con el de mentira — que es con lo que se repartirían turnos.'}
      ]},
    { id:'2026-08-07-convocar', fecha:'2026-08-07', titulo:'El botón de convocar ya hace algo',
      items:[
        {cara:'escritorio', vista:'turnos', txt:'Encolaba la convocatoria y NADIE la recogía: decía «Encolado» y no pasaba nada, nunca. Ya la monta la rutina.'},
        {cara:'escritorio', vista:'turnos', txt:'Y hay una casilla nueva: «preguntar POR HORAS» — un toque marca el turno de 4 h. Antes era una constante del código y decidías tú por mensaje.'}
      ]},
    { id:'2026-08-07-sw', fecha:'2026-08-07', titulo:'Una notificación de la beta abría la app del equipo',
      items:[
        {cara:'movil', vista:'estado', txt:'Las notificaciones llevaban la dirección de producción escrita a mano, así que tocar una de la beta te abría la app de verdad — y si la tenías abierta, se la traía encima.'},
        {cara:'movil', vista:'estado', txt:'Ahora cada canal abre el suyo. No hacía falta que se notase para estar mal: siempre abría *una* app.'}
      ]},
    { id:'2026-08-07-detalle', fecha:'2026-08-07', titulo:'«Pedir detalle» ya sirve para algo',
      items:[
        {cara:'movil', vista:'horas', txt:'Si te piden detalle, ahora VES LA PREGUNTA en la propia ficha — antes solo ponía «te piden más detalle» y tocaba adivinar.'},
        {cara:'movil', vista:'horas', txt:'Y hay botón «Responder»: llega al formulario con lo que ya habías escrito, para corregir en vez de rehacerlo.'},
        {cara:'movil', vista:'horas', txt:'Al responder, el parte vuelve a la cola y la petición deja de colgar — el coordinador ya no relee una queja que está contestada.'}
      ]},
    { id:'2026-08-07-origen', fecha:'2026-08-07', titulo:'Los partes ya dicen DE DÓNDE salen sus horas',
      items:[
        {cara:'movil', vista:'horas', txt:'Tenías razón al dudar: «declarado sin fichaje» salía hasta en partes que enseñan su hora de entrada y de salida. Ahora esos dicen «declarado a mano».'},
        {cara:'movil', vista:'horas', txt:'Y lo que otorga la coordinación dice «otorgada por» con el nombre, en gris — no en ámbar, que era acusar al miembro de algo que hizo el sistema.'},
        {cara:'escritorio', vista:'horas', txt:'En el escritorio un parte otorgado salía con DOS etiquetas a la vez, contradiciéndose. Ahora sale una, y la misma que en el móvil.'},
        {cara:'movil', vista:'horas', txt:'Y «Últimos movimientos» ya no dice «0 apuntes este mes» teniendo tu compensación ahí: la cuenta, que es un apunte.'}
      ]},
    { id:'2026-08-07-revertir', fecha:'2026-08-07', titulo:'Ya puedes deshacer un parte que firmaste',
      items:[
        {cara:'movil', vista:'horas', txt:'Tarjeta nueva «Ya decidiste», debajo de la cola: ahí está lo que ya firmaste, por si te equivocaste.'},
        {cara:'movil', vista:'horas', txt:'Revertir exige un motivo. Si las horas ya contaban en su mes, se le RESTAN — y la ficha te lo avisa antes, con la cifra.'},
        {cara:'movil', vista:'horas', txt:'Y el aviso de aprobar ya no dice «no se puede deshacer»: desde hoy sería mentira.'}
      ]},
    { id:'2026-08-07-horas', fecha:'2026-08-07', titulo:'Horas: desplegables, y el parte aprobado ya desaparece',
      items:[
        {cara:'movil', vista:'horas', txt:'«Esperan tu decisión» es ahora un desplegable que dice cuántos partes y cuántas horas hay que conceder, sin abrirlo. Dentro, uno por miembro.'},
        {cara:'movil', vista:'horas', txt:'«Tus partes» igual, con un solo nivel.'},
        {cara:'movil', vista:'horas', txt:'Y al aprobar, el parte YA desaparece de la lista: antes se quedaba hasta que aprobabas el siguiente.'},
        {cara:'movil', vista:'fichar', txt:'Un envío no puede crear dos partes aunque la red falle y se reintente.'}
      ]},
    { id:'2026-08-07-registro', fecha:'2026-08-07', titulo:'Lo que marcas como visto ya no se queda en tu móvil',
      items:[
        {cara:'movil', vista:'estado', txt:'El «Ya lo he visto» se guarda en el servidor, con la fecha y quién lo marcó — así lo ve también quien programa.'},
        {cara:'escritorio', vista:'panel', txt:'Mismo registro en las dos caras: marcas en una y aparece marcado en la otra.'},
        {cara:'movil', vista:'estado', txt:'Si el servidor no contesta, te lo dice en vez de perderlo en silencio.'}
      ]},
    { id:'2026-08-06-perfil', fecha:'2026-08-06', titulo:'Elegir con qué cargo fichas',
      items:[
        {cara:'movil', vista:'fichar', txt:'Si tienes más de un cargo, arriba de la justificación sale «Fichas como»: eliges con cuál. Con uno solo no aparece nada.'},
        {cara:'movil', vista:'fichar', txt:'Debajo te dice QUIÉN LO VA A FIRMAR y a qué subsistema cuentan esas horas, antes de enviarlo.'},
        {cara:'movil', vista:'fichar', txt:'Si fichas como coordinador de lo tuyo, sube al PD: nadie firma lo suyo.'}
      ]},
    { id:'2026-08-06-horas', fecha:'2026-08-06', titulo:'Aprobar horas desde el teléfono',
      items:[
        {cara:'movil', vista:'horas', txt:'Bloque «Esperan tu decisión» lo primero de Horas: aprobar, pedir detalle o rechazar las horas de tu gente, con motivo obligatorio.'},
        {cara:'movil', vista:'horas', txt:'Lo que no está enrutado cae en el PD — sale solo de que nadie decide lo suyo.'}
      ]},
    { id:'2026-08-06-turnos-admin', fecha:'2026-08-06', titulo:'Convocar y ver la disponibilidad',
      items:[
        {cara:'escritorio', vista:'turnos', txt:'«Convocar disponibilidad»: abres el plazo de una semana. Solo rango ≥ 3.'},
        {cara:'escritorio', vista:'turnos', txt:'Mapa de la semana: cuánta gente puede, filtro CUVI/CITI, símbolo de coche y desglose en tres cestas al pasar el ratón.'},
        {cara:'escritorio', vista:'turnos', txt:'Debajo del mapa: cuánta gente ha contestado y QUIÉN NO.'}
      ]},
    { id:'2026-08-06-turnos-movil', fecha:'2026-08-06', titulo:'Cubrir disponibilidad de turnos',
      items:[
        {cara:'movil', vista:'turnos', txt:'Pincel arriba (CUVI · CITI · Los dos · No puedo + coche) y rejilla de la semana. Repintar lo mismo lo borra.'},
        {cara:'movil', vista:'turnos', txt:'El pie dice cuántas horas quedan de plazo y cuántas casillas llevas SIN contestar.'}
      ]}
  ];
}

/* Lo que YA se ha visto, en este navegador: `{id: {at}}`. Nunca lanza. */
/* ═══ EL REGISTRO DE REVISIÓN VIVE EN EL SERVIDOR (v63) ═══════════════════════════
   Daniel (06/08/2026): «al cerrar una que no se borre sino que se deseleccione y se guarde en
   un historial, **para tú llevar cuenta** de qué voy aprobando y cuándo».

   ⛔ Ese «para TÚ llevar cuenta» es la razón entera: en `localStorage` el registro vive en SU
   móvil y quien programa de madrugada no lo ve. Con la capa en el navegador, la frase de Daniel
   era literalmente imposible de cumplir.

   ⛔ **El servidor MANDA cuando está cargado, y el local pasa a ser su copia.** No se fusionan:
   fusionar haría que una tanda que él desmarcó en el servidor **resucitara** desde una entrada
   vieja del móvil — deshacer dejaría de funcionar y no daría ningún error.

   ⚠️ Y solo lo carga y lo escribe **rango ≥ 3**. No es seguridad, es significado: el registro es
   «lo que el PD ha revisado». Para el resto del equipo la capa sigue siendo un «qué hay de
   nuevo» local, que es lo que es para ellos. */
function _novPuedeRegistro_(){
  if (typeof SESION==='undefined' || !SESION || !SESION.nombre) return false;
  if (typeof esAdmin==='function' && esAdmin()) return true;
  return (typeof _rangoBeta_==='function') && _rangoBeta_() >= 3;
}

/* El estado de la carga, en `window` y no en una variable de módulo: `comun.js` no lleva ni
   una sentencia ejecutable de nivel superior, y eso es lo que lo hace seguro de cargar antes
   que nada. Estados: sin pedir · pidiendo · ok · error. */
function _novSrvEstado_(v){
  if (v !== undefined) window.__novSrvEstado = v;
  return window.__novSrvEstado || 'sin pedir';
}
function _novSrv_(){ return window.__novSrv || null; }

/* Pide el registro UNA vez y repinta cuando llega. Se llama desde `_engNov_`, que ya corre
   después de cada pintado en las dos caras — así no hay que tocar dos arranques distintos ni
   añadir una ida y vuelta al de siempre. */
function _novCargar_(repintar){
  if (_novSrvEstado_() !== 'sin pedir') return;
  if (!_novPuedeRegistro_() || typeof api==='undefined' || !api.getNovedadesVistas) return;
  _novSrvEstado_('pidiendo');
  api.getNovedadesVistas().then(function(v){
    window.__novSrv = v || {};
    _novSrvEstado_('ok');
    /* El local pasa a ser copia del servidor: si se queda con lo suyo, la próxima vez que se
       abra sin conexión enseñaría un estado que ya no es. */
    try{ localStorage.setItem('solaris_nov_vistas', JSON.stringify(window.__novSrv)); }catch(_){}
    if (typeof repintar==='function') repintar();
  }).catch(function(){ _novSrvEstado_('error'); });
}

function _novVistas_(){
  var s=_novSrv_(); if(s) return s;          // el registro del servidor manda
  try{ return JSON.parse(localStorage.getItem('solaris_nov_vistas')||'{}')||{}; }
  catch(_){ return {}; }
}

/* Marca una tanda como vista. Devuelve el instante, que es lo que se enseña en el historial. */
function _novMarcar_(id){
  var v=_novVistas_(), at=new Date().toISOString();
  v[id]={at:at};
  try{ localStorage.setItem('solaris_nov_vistas', JSON.stringify(v)); }catch(_){}
  if(_novSrv_()) window.__novSrv=v;
  _novAlServidor_(id, true);
  return at;
}

/* Manda la decisión al servidor sin esperarla. ⛔ Se pinta ANTES de saber si llegó, a
   propósito: el botón tiene que responder al dedo. Y si falla, se dice — un registro que
   se pierde en silencio es peor que no tenerlo, porque parece que está. */
function _novAlServidor_(id, visto){
  if(!_novPuedeRegistro_() || typeof api==='undefined' || !api.marcarNovedadVista) return;
  api.marcarNovedadVista(id, visto).then(function(v){
    if(v){ window.__novSrv=v; _novSrvEstado_('ok'); }
  }).catch(function(e){
    if(typeof tost==='function') tost('No se pudo guardar en el servidor: '+((e&&e.message)||e));
  });
}

/* Deshacer: si te lo cargas por error, vuelve a la lista. Sin esto, un toque mal dado es
   definitivo — y el historial es justo lo que permite ofrecerlo. */
function _novOlvidar_(id){
  var v=_novVistas_(); delete v[id];
  try{ localStorage.setItem('solaris_nov_vistas', JSON.stringify(v)); }catch(_){}
  if(_novSrv_()) window.__novSrv=v;
  _novAlServidor_(id, false);
}

/* Las tandas de ESTA cara que aún no has visto, y las que sí. `cara` es 'movil'|'escritorio'. */
function _novDe_(cara, vistas){
  vistas = vistas || _novVistas_();
  var out={pendientes:[], hechas:[]};
  _novedades_().forEach(function(t){
    var items=(t.items||[]).filter(function(i){ return i.cara===cara; });
    if(!items.length) return;                      // nada de esta cara: ni se nombra
    var copia={id:t.id, fecha:t.fecha, titulo:t.titulo, items:items};
    if(vistas[t.id]){ copia.visto_at=vistas[t.id].at; out.hechas.push(copia); }
    else out.pendientes.push(copia);
  });
  return out;
}

/* Cuántas novedades sin ver tiene cada pantalla: `{turnos:2, horas:1}`. Es lo que pone el
   puntito en el nav — «rodear lo nuevo» sin tener que abrir nada. */
function _novPorVista_(cara){
  var n={};
  _novDe_(cara).pendientes.forEach(function(t){
    t.items.forEach(function(i){ n[i.vista]=(n[i.vista]||0)+1; });
  });
  return n;
}

/* La capa, en HTML. **Un solo constructor para las dos caras**: cada una le pone su CSS a
   las clases `nov*`, pero el texto y el comportamiento son los mismos. Dos constructores
   acabarían diciendo cosas distintas, que es la lección que este proyecto lleva escrita
   desde `_calorDe_`.

   `cara` es 'movil' | 'escritorio'. Si no hay nada de esa cara, devuelve '' — y entonces la
   capa **no existe**, que es lo que la hace «completamente retirable». */
function _novHTML_(cara){
  var d=_novDe_(cara);
  if(!d.pendientes.length && !d.hechas.length) return '';
  var item=function(i){ return '<li>'+esc(i.txt)+'</li>'; };
  var tanda=function(t, hecha){
    return '<div class="novt'+(hecha?' ok':'')+'" data-nov="'+esc(t.id)+'">'+
      '<div class="novh"><b>'+esc(t.titulo)+'</b><span class="novf">'+esc(t.fecha)+'</span></div>'+
      '<ul class="novl">'+t.items.map(item).join('')+'</ul>'+
      (hecha
        ? '<div class="novb"><span class="novv">visto el '+esc(_novCuando_(t.visto_at))+'</span>'+
          '<button data-novolv="'+esc(t.id)+'" data-p>Volver a marcarlo</button></div>'
        : '<div class="novb"><button class="si" data-novok="'+esc(t.id)+'" data-p>Ya lo he visto</button></div>')+
    '</div>';
  };
  return '<div class="novc" id="novc">'+
    '<div class="novtit">Novedades'+(d.pendientes.length?' · <b>'+d.pendientes.length+' sin ver</b>':'')+'</div>'+
    (d.pendientes.length
      ? d.pendientes.map(function(t){ return tanda(t,false); }).join('')
      : '<p class="novnada">Nada nuevo sin mirar. Lo que vaya entrando aparecerá aquí.</p>')+
    (d.hechas.length
      ? '<details class="novhist"><summary>Ya revisadas · '+d.hechas.length+'</summary>'+
        d.hechas.map(function(t){ return tanda(t,true); }).join('')+'</details>'
      : '')+
    '<p class="novpie">'+(_novSrv_()
      ? 'El «visto» queda <b>en el servidor</b>, con la fecha y quién lo marcó — así lo ve también quien programa.'
      : (_novPuedeRegistro_()
          ? 'El «visto» se guarda <b>en este navegador</b>; el registro del servidor no ha cargado (se reintenta al volver a entrar).'
          : 'El «visto» se guarda <b>en este navegador</b>. El registro compartido es del director.'))+'</p>'+
  '</div>';
}

/* `2026-08-06T19:12:00.000Z` → `06/08/2026, 21:12`. Formato, no calendario. */
function _novCuando_(iso){
  var s=String(iso||''); if(s.length<10) return s;
  var d=new Date(s);
  if(isNaN(+d)) return s.slice(0,10);
  return _isoADMY_(s.slice(0,10))+', '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
}

/* Cablea los dos botones. `repintar` es la función de pintado de la cara — las dos se llaman
   `pintar`, pero se pasa como argumento para no dar por hecho el nombre desde `comun.js`. */
function _engNov_(repintar){
  var c=document.getElementById('novc'); if(!c) return;
  _novCargar_(repintar);        // una sola vez; repinta cuando llega

  c.querySelectorAll('[data-novok]').forEach(function(b){
    b.onclick=function(){ _novMarcar_(b.dataset.novok); if(repintar) repintar(); };
  });
  c.querySelectorAll('[data-novolv]').forEach(function(b){
    b.onclick=function(){ _novOlvidar_(b.dataset.novolv); if(repintar) repintar(); };
  });
}

function _diaCorto_(iso){
  var s=String(iso==null?'':iso);
  if(!/^\d{4}-\d{2}-\d{2}/.test(s)) return s;      // lo que no reconozca, se devuelve tal cual
  var d=new Date(s.slice(0,10)+'T12:00');
  if(isNaN(+d)) return s;
  return ['dom','lun','mar','mi\u00e9','jue','vie','s\u00e1b'][d.getDay()]+' '+s.slice(8,10);
}

function esUCT(u){
  return /documentaci[oó]n\s+t[eé]cnica/i.test(String(u || '')) || /^\s*UCT\s*$/i.test(String(u || ''));
}

/* ⛔ EL SEGUNDO REVISOR DOCUMENTAL SE DERIVA DEL CARGO, NO DE UN NOMBRE (05/08/2026).
   Daniel: *«es porque José es coordinador de la UCT, no por ser él sino por su cargo»*.

   `REV2_NOM` decide `rangoNom(...)===2`, o sea **quién puede aprobar un expediente de
   subsistema**. Hasta hoy cada cara lo calculaba a su manera, y las dos mal:

     · el MÓVIL buscaba `/^José Manuel Torres/` — **un nombre propio dentro de un regex**. El día
       que José deje el cargo, la autoridad documental se va con él y nadie se entera;
     · el ESCRITORIO, si ese nombre no estaba en el roster, cogía **el primer coordinador que no
       fuera el PD**, quienquiera que fuese — o sea que repartía autoridad por orden de lista.

   Dos políticas distintas para la misma pregunta es D1 con otro disfraz, y aquí el resultado no
   es un texto feo: es quién firma documentos. Ahora es UNA función y tres escalones, del dato
   bueno al conservador:

     1. quien **coordina** la UCT (`coordina`, la lista que trae el panel);
     2. si el backend aún no manda ese campo, el coordinador cuya **unidad** sea la UCT;
     3. y si no hay ninguno, **el PD** — nunca «el primero que aparezca». Es lo mismo que hace
        `_coordinadorDe_` en el backend, que cae a `DOC_PD`: sin coordinador, la autoridad sube,
        no se reparte al azar. */
function _rederivarRev2_(){
  var m = buscaMiembro(function(x){
    var c = x.coordina;
    if (!c) return false;
    if (typeof c === 'string') return esUCT(c);
    for (var i = 0; i < c.length; i++) if (esUCT(c[i])) return true;
    return false;
  });
  if (!m) m = buscaMiembro(function(x){ return x.cargo === 'Coordinador' && esUCT(x.unidad); });
  REV2_NOM = m ? m.nombre : PD_NOM;
  return REV2_NOM;
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

/* La huella de las respuestas de una reunion: `{nombre:[bloques]}` -> una cadena estable.
   Sirve para una sola cosa, y es la que hace usable el refresco en vivo: **saber si algo ha
   cambiado antes de repintar**. Reconstruir la rejilla cada 20 s para dejarla igual se nota
   y molesta, sobre todo mientras alguien esta pintando su disponibilidad.
   ⛔ Vive aqui desde el 08/08 porque la usan LAS DOS CARAS. Nació en `reuniones.movil.js`
   cuando solo el movil refrescaba; al darle el refresco al escritorio, dejarla duplicada
   habria sido crear la gemela numero 19. */
function _firmaResp_(r){
  var q=(r&&r.resp)||{}, k=Object.keys(q).sort(), out=[];
  for(var i=0;i<k.length;i++) out.push(k[i]+':'+(q[k[i]]||[]).join(''));
  return out.join('|');
}
