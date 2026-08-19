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

/* El cuerpo de la justificacion de un parte, o cadena vacia si no aporta nada.

   ⛔⛔ AVISO AL QUE VENGA: esto NO es lo que Daniel senalaba, y creerlo lleva a tapar un dato
   malo con CSS. El se quejaba de ver partes de «Longship» en la cola, y la causa real esta en
   `docs/pendientes.md`: son los partes 16/17/18, REVERTIDOS el 09/08 -- el nombre lo dijo el
   mismo por voz el 08/08 y lo corrigio al dia siguiente («no era longship, era onshape»)-, y
   sus contrapartes en negativo las SALTA el gate («horas no positivas») porque la rama que
   acepta negativos con `origen == 'reversion'` esta escrita y SIN FUSIONAR. Siguen en
   pantalla porque la reversion no se aplico, no porque se pinten mal.
   ✅ Lo de aqui abajo es cosmetica REAL y aparte, y se queda por eso -- pero no arregla
   aquello, y **esconder el texto habria hecho mas dificil ver el dato viejo**.

   ⛔ Nace de dos capturas de Daniel (18/08) sobre la misma tarjeta:
     · una justificacion que REPITE la tarea palabra por palabra -- «REUNION DE PUESTA EN
       MARCHA DE LONGSHIP» arriba y «Reunion de puesta en marcha de Longship» debajo --, y
     · una justificacion VACIA, que dejaba una caja con borde y nada dentro.
   Las dos son la misma suposicion: que `just` siempre aporta algo distinto de `tarea`. En un
   parte OTORGADO por la coordinacion no hay nada mas que contar, asi que coincide.

   ⚠️ Se compara SIN TILDES Y EN MINUSCULAS, no con `===`: en el caso real los dos textos
   difieren solo en mayusculas, asi que la comparacion exacta habria dicho que son distintos
   y el duplicado seguiria ahi. Se compara por lo que se LEE. */
function _justUtil_(tarea, just){
  var j = String(just == null ? '' : just).replace(/^\s+|\s+$/g, '');
  if(!j) return '';
  var pela = function(s){
    return String(s).toLowerCase().replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ')
      .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
      .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n');
  };
  return pela(j) === pela(tarea || '') ? '' : j;
}

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
  /* Las horas de ESTE MES, o `null` si no han llegado. `horasMes` es el campo que el
     backend superpone desde Notion en cada lectura: es el unico que dice las horas del
     mes en curso.
     ⛔ AQUI HABIA UN RESPALDO A `hMes`, Y DEVOLVIA OTRA MAGNITUD. El comentario que lo
     justificaba decia que `hMes` es *«una COPIA que hace `_aplicarPanel_` … y una copia
     puede quedarse atras»*. **Falso, y medido**: en el panel que sirve el backend,
     `hMes` es lo que escribe `flujos/ensamblar.py` -- `horas_mes`, o sea **la media
     ponderada de la TEMPORADA** (32 de 32 cuadran con `horasTemp/meses`, y 0 con
     `horasMes`). No es una copia atrasada de este mes: es el ritmo del año.
     ⛔ Y el daño no era cosmetico: quien no tuviera el dato vivo veia su media anual
     rotulada «este mes llevas X, en vivo», y en el escritorio esa cifra se comparaba
     contra el UMBRAL DEL MES para decidir quien va por debajo.
     ✅ Ahora se contesta `null`, que todos los lectores ya saben leer: el movil cae a
     sumar sus partes aprobados y el escritorio dice que la foto es parcial. «No ha
     llegado» es una respuesta; un numero de otra magnitud, no.
     ⚠️ OJO al leer el escritorio: alli `_aplicarPanel_` PISA `m.hMes` con este valor,
     asi que **despues** de aplicar el panel `hMes` si son las horas del mes. El campo
     significa dos cosas segun donde se lea, y por eso la unica puerta es esta. */
  return (typeof m.horasMes==='number') ? m.horasMes : null;
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
/* ⛔ EL DIA DEL MES SALE DEL SERVIDOR, Y VIVE AQUI PORQUE LO USAN LAS DOS CARAS.
   Estaba solo en `horas.movil.js`, asi que `_umbral_` -que se llama desde el movil Y desde
   el escritorio- no podia usarlo y pesaba el mes abierto con el CALENDARIO. Regla de
   negocio de Daniel: «un mes dura desde el anterior cierre del mes anterior al cierre de
   ese mes». `equipo_mes.dia` lo calcula `_diasDesdeCierre_` en el backend. */
function _diasDelMes_(){
  var e=DATA.equipo_mes;
  /* ⛔ `cont` ES EL MISMO DIA CON DECIMALES, y va aparte del entero porque son DOS PREGUNTAS:
     `dia` se IMPRIME («20 h en 10 de 31 dias») y `cont` PESA. Daniel (15/08): «cuando pase de
     un dia a otro, en ese instante que pasa de dia veinte a dia veintiuno, va a bajar
     instantaneamente un poco la media ... tiene que ir ponderado realmente el instante en el
     que se mide».
     ⚠️ Y si el backend es VIEJO y no manda `diaCont`, `cont` cae al entero: eso no apaga nada,
     deja el comportamiento de siempre. «No lo se» no es «cero» (§3c-24). */
  if(e && e.dia>0 && e.dias_mes>0) return {dia:e.dia, total:e.dias_mes,
    cont:(typeof e.diaCont==='number' && e.diaCont>0) ? e.diaCont : e.dia,
    periodo:e.periodo||null};
  var d=new Date();
  /* El respaldo del calendario tambien lleva su hora: mismo criterio que el servidor -- el
     dia N va de N,0 a N,999-, para que caer al respaldo no cambie la FORMA del numero. */
  return {dia:d.getDate(), total:new Date(d.getFullYear(),d.getMonth()+1,0).getDate(),
    cont:d.getDate() + (d.getHours()*3600 + d.getMinutes()*60 + d.getSeconds())/86400,
    periodo:null};
}

function _fraccionDelMes_(d){
  /* ⛔ SIN ARGUMENTO, EL PESO SALE DEL DIA DESDE EL CIERRE, no del dia del calendario.
     Hasta el 12/08 esto dividia `d.getDate()` por los dias del mes natural, teniendo
     `equipo_mes.dia` al lado sin tocar — o sea que la regla estaba ENUNCIADA en
     `_diasDesdeCierre_` y CITADA en el comentario de aqui al lado («el abierto, a
     prorrata»), y aplicada en ninguno de los dos (§3c-19).
     ⚠️ MEDIDO: en un dia normal son ~0,2 h de objetivo, pero en la ventana 1-4 de cada
     mes —cuando el mes de TRABAJO en curso sigue siendo el anterior y el calendario ya
     dice «dia 1»— son **1,9 h** de diferencia, para las 33 personas a la vez.
     ✅ Y con esta vara el `Math.min(1, ...)` deja de ser inalcanzable: el dia desde el
     cierre SI puede pasarse de los dias del mes (32 de 31), que es justo el caso malo. */
  if(!d){
    var e=_diasDelMes_();
    /* ⛔ CON `cont`, NO CON `dia`: es lo que convierte el peso en continuo. Con el entero, el
       objetivo de las 33 caras daba un ESCALON a medianoche -- «va a bajar instantaneamente un
       poco la media, y eso tampoco es asi» (Daniel, 15/08).
       ⚠️ Y NO se toca el `ritmo` de `_compHorasHTML_`, que sigue dividiendo por el ENTERO: ahi
       el numero va impreso junto a su division («20 h en 10 de 31 dias»), y ya costo un fallo
       que la division impresa no diera el numero impreso. Aqui no se imprime nada: solo pesa.
       ⚠️ Y la guarda va INLINE y no con `_oNum_`: el arnes del banco extrae ESTAS DOS
       funciones sueltas, asi que llamar a una tercera lo revienta -- y un arnes roto no mide
       el producto, mide el arnes. */
    if(e && e.total>0) return Math.max(0, Math.min(1, (e.cont>0 ? e.cont : e.dia)/e.total));
  }
  d=d||new Date();
  var dias=new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();   // dia 0 del siguiente
  return Math.max(0, Math.min(1, d.getDate()/dias));
}

/* El numero si es un numero, y si no el respaldo. ⛔ EXISTE PORQUE `||` NO SIRVE:
   `0` es falsy, asi que `x||respaldo` tapa un cero que alguien mando a proposito.
   ⚠️ Y se descarta `NaN` explicitamente: `typeof NaN` es `'number'`, o sea que un
   `NaN` colado pasaria el filtro y envenenaria el `Math.max`/`Math.min` entero
   -toda comparacion con NaN es falsa- dejando el umbral en NaN y la pantalla con
   un objetivo vacio. */
function _oNum_(v, respaldo){
  return (typeof v==='number' && !isNaN(v)) ? v : respaldo;
}

/* ══ LA CURVA DE LA CUOTA, EN LA CARA ═══════════════════════════════════════════════

   Daniel (15/08/2026), sobre la cuota: *«se recalcula en cada fichaje»*. Hoy la cara **no
   calcula nada**: `cuota` y `cuota_base` llegan ya hechas en el roster, o sea que lo que
   ves es la foto del ultimo `push`. Para que se mueva al fichar hace falta la curva AQUI.

   ⛔ **GEMELA de `reglas/cuota.py`, y por eso se contrasta EJECUTANDO las dos** sobre una
   rejilla (`rutinas/probar_cuota_cara.py`). Dos copias de una formula de dinero es donde
   nacen las divergencias, y aqui una divergencia es que la app te prometa una cuota y el
   cierre te cobre otra.

   ⚠️ **ESTO NO HACE LA CUOTA VIVA POR SI SOLO, y conviene saberlo**: el `umbral` y el
   `techo` son de POBLACION —salen de las horas/mes de las 32—, asi que cada parte aprobado
   de cualquiera mueve la cuota de las otras 31. La cara de un miembro raso recibe un roster
   **sin las horas de los demas**, asi que puede recalcular con los ingredientes que le
   lleguen, no inventarlos. Lo que falta esta escrito en `docs/pendientes.md`. */

/* `lgamma` no existe en JS: Lanczos (g=7, n=9), el mismo que usa media biblioteca
   cientifica. Precision ~1e-13, de sobra para una cuota que se trunca al centimo. */
function _lgamma_(x){
  var g = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
           771.32342877765313, -176.61502916214059, 12.507343278686905,
           -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if(x < 0.5){
    /* Reflexion: G(x)G(1-x) = pi/sin(pi x).
       ⛔ EL VALOR ABSOLUTO NO ES ADORNO, Y LO CAZO UN CASO: `lgamma` devuelve log|G(x)|,
       y para x = -0,5 el seno vale -1, o sea `Math.log(-pi)` = **NaN**. Sin el `abs`,
       esta rama -que existe justo para los negativos- devolvia NaN en la mitad de ellos.
       ⚠️ A la curva de la cuota NO le afectaba: su argumento mas pequeno es exactamente
       0,5 y nunca baja de ahi. Se arregla porque `_lgamma_` dice ser `lgamma`, esta
       indexada como utilidad, y el que la reutilice manana no va a leer esta nota. */
    return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - _lgamma_(1 - x);
  }
  var z = x - 1, a = g[0], t = z + 7.5, i;
  for(i = 1; i < 9; i++) a += g[i] / (z + i);
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

/* La fraccion continua de la beta incompleta. Portada linea a linea de
   `reglas/cuota.py:_betacf`, incluidos los guardas de `FPMIN` y el corte a 300. */
function _betacf_(a, b, x){
  var FPMIN = 1e-300, EPS = 3e-12;
  var qab = a + b, qap = a + 1, qam = a - 1;
  var c = 1, d = 1 - qab * x / qap, h, m, m2, aa, de;
  if(Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d; h = d;
  for(m = 1; m < 300; m++){
    m2 = 2 * m;
    aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if(Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;  if(Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if(Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;  if(Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; de = d * c; h *= de;
    if(Math.abs(de - 1) < EPS) break;
  }
  return h;
}

function _betai_(a, b, x){
  if(x <= 0) return 0;
  if(x >= 1) return 1;
  var lbeta = _lgamma_(a + b) - _lgamma_(a) - _lgamma_(b);
  var bt = Math.exp(lbeta + a * Math.log(x) + b * Math.log(1 - x));
  if(x < (a + 1) / (a + b + 2)) return bt * _betacf_(a, b, x) / a;
  return 1 - bt * _betacf_(b, a, 1 - x) / b;
}

function _tCdf_(z, df){
  var x = df / (df + z * z), ib = _betai_(df / 2, 0.5, x);
  return z >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}

/* Los mismos numeros que `PARAMS` en `reglas/cuota.py`. Van en una FUNCION y no en una
   global porque un modulo de la app solo lleva declaraciones `function` (ARRANQUE §5b) —
   y ademas asi el banco puede extraerla y ejecutarla. */
function _paramsCuota_(){
  return {cuota_min: 20, cuota_max: 70, df: 4, scale_low: 0.22,
          extra_top: 0.80, gamma_top: 2.4, base: 2};
}

/* Cuota BRUTA para `h` horas/mes. Gemela de `reglas/cuota.py:curva`, sin `hard_max`:
   ese modo reproduce el pin duro del script viejo y la app no lo usa nunca.
   ⛔ El techo de 70 EUR es ASINTOTICO a proposito (decision de Daniel): la normalizacion
   es SOLO por el extremo del umbral, no por los dos. Normalizar por los dos cierra el
   salto igual de bien y CLAVA los 70 -- medido, +17,75 EUR a 15 personas. */
function _curvaCuota_(h, ancla, umbral, techo){
  var p = _paramsCuota_(), cmin = p.cuota_min, cmax = p.cuota_max;
  var cUmbral = cmin + p.extra_top, cuota, s, x, y;
  if(h >= umbral){
    if(techo <= umbral){ cuota = cmin; }
    else {
      s = Math.max(0, Math.min(1, (h - umbral) / (techo - umbral)));
      cuota = cmin + p.extra_top * Math.pow(1 - s, p.gamma_top);
    }
  } else if(umbral <= ancla){
    cuota = cUmbral;
  } else {
    x = Math.max(0, Math.min(1, (h - ancla) / (umbral - ancla)));
    y = _tCdf_((x - 0.5) / p.scale_low, p.df) / _tCdf_(0.5 / p.scale_low, p.df);
    cuota = cmax - y * (cmax - cUmbral);
  }
  return Math.max(cmin, Math.min(cmax, cuota));
}

/* Trunca al centimo, SIEMPRE a la baja. Gemela de `reglas/cuota.py:truncar_centimo`, con
   su mismo margen: sin el `1e-9`, 0,29 cae a 0,28 por el binario. */
function _truncarCentimo_(x){ return Math.floor(x * 100 + 1e-9) / 100; }

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
    /* ⛔ `||` NO VALE AQUI: un `lo:0` legitimo -«sin suelo»- es falsy y saldria 8,
       y un `frac:0` saldria 2/3. Son tres numeros que el backend PUEDE mandar a cero
       a proposito, asi que el respaldo tiene que dispararse cuando NO VIENE el dato,
       no cuando el dato vale cero. Hasta hoy era teorico porque nadie producia
       `panel.umbral`; con el productor restaurado (12/08) muerde de verdad. */
    if(den>0) return Math.max(_oNum_(ing.lo, UMBRAL_LO), Math.min(_oNum_(ing.hi, UMBRAL_HI), _oNum_(ing.frac, UMBRAL_FRAC)*(num/den)));
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

/* ══ LA CUOTA EN DIRECTO ═══════════════════════════════════════════════════════════
   Daniel (15/08/2026): *«se recalcula en cada fichaje»*. Hasta hoy la cara **no calculaba
   nada**: `cuota` y `cuota_base` llegaban ya hechas en el roster, o sea que se veia la foto
   del ultimo `push` — y entre `push` y `push` pasan dias.

   ⛔⛔ **LA PREMISA QUE BLOQUEABA ESTO ERA FALSA, Y LA TUMBO UNA MEDICION.** La ficha decia
   que faltaban «dos numeros de poblacion que hoy no viajan»: el umbral por persona y el
   techo. **No hacen falta como campos**: los dos salen de `horasTemp` y `meses` de cada
   miembro, que **si** viajan (`flujos/ensamblar.py:DEL_MOTOR`). Medido el 18/08 sobre las 32
   reales con **solo** esos dos campos: umbral **11,7976**, techo **67,2545**, y **32 de 32
   cuotas identicas** a las del motor. Lo que faltaba era el **cable**, no el dato.

   ⛔ **LO QUE SI SIGUE SIN VIAJAR, y hay que decirlo**: el desglose **mes a mes**
   (`{'AAAA-MM': horas}`), que sale de `datos/historico.json` y es lo que hace que **julio y
   agosto pesen 0,5** (Daniel, 15/08). Sin el, esto reproduce el ritmo **sin ponderar** —
   `horas_mes`, no `media_ponderada`—, que es el mismo respaldo explicito que usa
   `reglas/cuota.py:ritmo` cuando no hay desglose. Medido el 17/08: la ponderacion mueve a
   **26 de 32** personas. Por eso el numero se presenta como **estimacion** y no como factura
   (decision del 15/08), y por eso hay ficha abierta para que el desglose viaje.

   ⚠️ El `desglose` que YA viaja NO sirve para esto: son dos claves de **carga**
   (`aporta_mes_actual`, `arrastre`), no horas por mes. */

/* Los EUROS que descuenta cada turno conduciendo al CITI. Gemela de
   `reglas/cuota.py:DESCUENTO_COCHE`; el banco compara los dos numeros, que para eso esta. */
function _descuentoCoche_(){ return 4; }

/* ⛔ «TODAVIA NO PUEDE APARECER». Decision de Daniel (15/08/2026), literal — y es una
   NEGACION, asi que va copiada entera: *«No aparece, no aparece. En el primer mes aun
   no puede aparecer una persona. A partir del primer cierre, ya esta, mas facil.»*
   ⛔ EL CRITERIO ES `cierres`, NO `meses`. `meses` es antiguedad y el motor exige
   `meses == cierres + 1` cuando el ultimo mes es el abierto, asi que `meses:1` puede
   ser *un cierre* o *cero cierres y un mes en curso*: indistinguibles. `cierres` lo
   escribe `flujos/umbral.py` en cada miembro, contando meses CERRADOS del historico.
   ⛔ Y AUSENTE NO ES CERO. Devuelve `true` **solo si consta** que no tiene ninguno; si
   el campo no ha llegado -un panel de antes de que esto existiera, o el backend que no
   contesta- eso es «no lo se» y **no se echa a nadie**. Fallar hacia «sale de mas»
   ensena un puesto discutible; fallar hacia «no sale» borra a 32 personas de la unica
   pantalla que las ve. */
function _sinCierres_(m){
  return !!m && typeof m.cierres === 'number' && m.cierres <= 0;
}

/* ⛔ EL PRIMER MES NO LLEVA CUOTA. Daniel (15/08/2026), literal: *«el primer mes
   como tal si que es cierto en septiembre o el primer mes que alguien no este en el
   equipo que deberian no ponerle la cuota, porque no tiene mucho sentido»*. Gemela de
   `reglas/cuota.py:exento_primer_mes`, y existe porque la cara NO la conocia: el
   motor perdonaba y la pantalla cobraba.
   🔁 Medido: el 1 de septiembre las 32 pasan a cero cierres a la vez, `_hMesDe_`
   devuelve 0 h/mes -que es un dato, no un «no lo se»- y la curva clava **67,80 EUR**,
   la cuota mas cara que existe. El motor, en cambio, archiva **0,00 EUR**. Eran
   2.169,60 EUR en pantalla contra 0,00 reales, en tres sitios a la vez.
   ⛔ TRES ESTADOS, como la del motor: `true`, `false` y **`null` = no se sabe**.
   `cierres === 0` es un HECHO -ningun mes cerrado, o sea que sigue en el primero-;
   el campo AUSENTE es que no se ha podido mirar el historico, y son cosas distintas:
   tratar el ausente como exento **perdona dinero que se debe**.
   ⚠️ El hecho no se reinventa: lo decide `_sinCierres_`, que es quien ya sabe que
   el criterio es `cierres` y no `meses` (`meses:1` puede ser un cierre o cero cierres
   con un mes en curso). Aqui solo se anade el brazo del «no lo se», porque las dos
   preguntas son distintas: para el RANKING, ausente = no se echa a nadie; para el
   DINERO, ausente = no se perdona nada. */
function _exentoPrimerMes_(m){
  if(!m || typeof m.cierres !== 'number') return null;
  return _sinCierres_(m);
}

/* h/mes de UNA persona. Gemela del respaldo de `reglas/cuota.py:ritmo` -> `horas_mes`.
   ⛔ DEVUELVE `null` CUANDO NO SE SABE, nunca 0: con 0 h/mes la curva clava la cuota **mas
   cara que existe**. Es el fallo del 15/08 con dinero detras — las 32 a 67,80 EUR el 1 de
   septiembre— y aqui volveria por la puerta de al lado.
   ✅ Con `meses` a 0 devuelve las horas CRUDAS, que es lo que decidio Daniel (14/08): *«Se
   usan las horas reales sin dividir por meses»*. Y ademas es correcto: sin ningun mes
   cerrado, todas tus horas son del mes en curso. */
function _hMesDe_(m){
  if(!m) return null;
  /* \u26d4 EL RITMO SALE DEL MOTOR, NO SE REINVENTA (19/08). `reglas/cuota.py:ritmo` existe
     literalmente «para que no haya dos», y su docstring avisa: *«el dia que alguien llame a
     `horas_mes` por su cuenta tendra una persona con dos ritmos segun quien pregunte, y las
     diferencias entre las dos copias SON los bugs»*. **La cara era ese alguien**: aqui se
     rehacia `horasTemp / meses` a mano, ignorando el `hMes` que el motor ya calcula --con la
     ponderacion de julio y agosto a la mitad, que pidio Daniel el 15/08-- y ya envia.
     \u1f4cf MEDIDO el 19/08 sobre las 32 reales, con el historico del checkout principal: el
     ritmo difiere en **31 de 32** (hasta 1,43 h/mes) y el importe en **27 de 32**, con un
     desvio maximo de **9,24 EUR** por persona.
     \u26a0 Y HOY NO MUEVE NADA, que es lo que lo hace seguro: el panel que hay en el KV se
     genero SIN el desglose, asi que su `hMes` es la division plana (desvio <= 0,055 h/mes,
     redondeo). Esto se vuelve correcto el dia que se suba un panel con el historico delante. */
  var r = m.hMes;
  if(typeof r === 'number' && isFinite(r)) return r;
  /* \u26a0 El respaldo sigue siendo el de siempre, y NO sobra: un panel viejo -o uno servido
     por un backend sin este campo- no puede dejar la pantalla sin cuota. Y con `meses` a 0 van
     las horas CRUDAS sin dividir, que es la decision de Daniel del 14/08. */
  var h = m.horasTemp;
  if(typeof h !== 'number' || !isFinite(h)) return null;
  return m.meses ? h / m.meses : h;
}

/* Los ritmos de TODO el equipo. Es la muestra de poblacion de la que salen el umbral y el
   techo: quien no tiene ritmo calculable no cuenta como un cero — **se cae de la muestra**,
   igual que en `media_mensual` («quien no aparece no estaba, y no cuenta como un cero»). */
function _ritmosEquipo_(){
  var L = [];
  (DATA.miembros || []).forEach(function(m){
    var r = _hMesDe_(m);
    if(typeof r === 'number' && isFinite(r)) L.push(r);
  });
  return L;
}

/* ⛔⛔ ESTE UMBRAL NO ES EL QUE ENSENA LA APP, Y CONFUNDIRLOS CUESTA DINERO. Este pondera
   por **persona** (`reglas/cuota.py:umbral_dinamico`) y es el que usa la curva; `_umbral_()`
   pondera por **mes** (`umbral_temporada`) y es el que Daniel definio el 27/07 para
   **ensenar**. Sobre las 32 reales son **11,98 frente a 12,81**, y usar el que no toca mueve
   **+27,23 EUR** tocando a **28 personas**. Las dos conviven a proposito: unificarlas cambia
   lo que paga cada uno y **esa decision no esta tomada**.
   ⚠️ Por eso se llama `_umbralCuota_` y no `_umbral2_`: el nombre dice para que sirve. */
function _umbralCuota_(){
  var L = _ritmosEquipo_(), s = 0, i;
  if(!L.length) return null;
  for(i = 0; i < L.length; i++) s += L[i];
  return Math.max(UMBRAL_LO, Math.min(UMBRAL_HI, UMBRAL_FRAC * (s / L.length)));
}

/* El techo de la curva: el maximo h/mes del equipo (`reglas/cuota.py:cuotas`). */
function _techoCuota_(){
  var L = _ritmosEquipo_();
  if(!L.length) return null;
  return Math.max.apply(null, L);
}

/* La cuota BASE de un miembro, calculada aqui y ahora. `null` si falta cualquier
   ingrediente — un «no lo se» no se presenta como un importe. */
function _cuotaViva_(m){
  var h = _hMesDe_(m), u = _umbralCuota_(), t = _techoCuota_();
  if(h === null || u === null || t === null) return null;
  return _truncarCentimo_(_curvaCuota_(h, _paramsCuota_().base, u, t));
}

/* Lo que PAGAS: la base, menos el descuento por conducir, y con la exencion del
   primer mes por delante. Gemela de `flujos/cuotas.py`, que hace exactamente esto y
   en este orden. Suelo 0 EUR -se puede llegar a pagar 0, nunca a cobrar-.
   ⛔ LA EXENCION VA SOBRE `final` Y NO SOBRE `base`, igual que en el motor: la base
   se conserva CON SU IMPORTE porque es lo que habria pagado, y es lo que hace que la
   fila cuadre consigo misma cuando alguien la audite. Ponerla a 0 deja un importe que
   no explica de donde sale el perdon.
   ⛔ Y SE COMPARA CON `=== true` A PROPOSITO: `_exentoPrimerMes_` devuelve `null`
   cuando no se sabe, y `null` NO exime -- es lo mismo que hace `flujos/cuotas.py` con
   su `if ex:`, donde el `None` cae por falsy y se cobra. Perdonar sin saber es
   regalar dinero del equipo; el que decide con criterio es el motor, no la pantalla. */
function _cuotaVivaFinal_(m){
  var b = _cuotaViva_(m), n;
  if(b === null) return null;
  if(_exentoPrimerMes_(m) === true) return 0;
  n = Number(m && m.coche) || 0;
  return _truncarCentimo_(Math.max(0, b - n * _descuentoCoche_()));
}

/* ⛔ UNA SOLA PUERTA PARA LAS DOS CARAS. Los dos importes que se ensenan —la base y lo que
   pagas— y **de donde salen**. Existe porque hasta hoy cada cara leia `mi.cuota` a pelo: dos
   sitios que contestan a la misma pregunta acaban contestando cosas distintas, y aqui la
   diferencia serian euros.
   ⚠️ `viva:false` NO es un fallo: es el respaldo honesto cuando aun no hay padron —el roster
   tarda en llegar—, y entonces se ensena lo que sirvio el backend **diciendo que es de la
   ultima foto**. Un importe sin fecha es lo que hace que nadie sepa si discutirlo. */
function _cuotaDe_(m){
  var vb = _cuotaViva_(m), vf = _cuotaVivaFinal_(m), sb, sf;
  if(vb !== null && vf !== null) return {base: vb, final: vf, viva: true};
  sb = (m && typeof m.cuota_base === 'number' && isFinite(m.cuota_base)) ? m.cuota_base : null;
  sf = (m && typeof m.cuota === 'number' && isFinite(m.cuota)) ? m.cuota : null;
  return {base: sb, final: sf, viva: false};
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

/* ⛔ LA CLAVE DE UN ENVIO, PARA QUE UN REINTENTO NO LO DUPLIQUE. `api._post` hace TRES
   intentos en dos segundos contra un fallo de TRANSPORTE —Apps Script pierde el cuerpo
   del POST de vez en cuando—, y si lo que se pierde es la RESPUESTA el servidor ya
   escribió: el reintento añade una SEGUNDA fila. Con la compensación en marcha, eso es
   cobrar dos veces el mismo reporte.
   ⛔ Y ES ESTABLE PARA UN ENVÍO, no para un intento: se calcula **una vez**, antes de
   llamar, y se manda igual en los tres. Generarla dentro del reintento —que es la forma
   que parece correcta— daría una clave distinta cada vez y el servidor no deduplicaría
   nada. Es la misma idea que `_parteConClave_`, que el backend ya usa para las horas.
   ⚠️ Nada de aleatorio: lleva **quién** dentro, así que dos personas distintas no pueden
   colisionar aunque pulsen en el mismo milisegundo. */
function _claveReporte_(quien, titulo){
  var t = String(titulo || '').replace(/\s+/g,' ').slice(0, 40);
  return String(quien || '?') + '|' + new Date().getTime() + '|' + t;
}

/* ⛔ REINTENTO PASIVO — LA REGLA DE DANIEL (11/08/2026), Y ES PARA TODA LA APP.
   Literal: «vale que siga diciendo cargando pero que lo reintente por detras sin decirtelo
   constantemente, en caso de ser incapaz si quieres (y esto aplica para cualquiera) se podria
   poner boton de reintentar, pero yo prefiero que en toda la app sea de reintentos pasivos».

   ⛔ NO ES EL REINTENTO DE `api._post`, Y CONFUNDIRLOS ES NO ARREGLAR NADA. Aquel hace TRES
   intentos en dos segundos contra un fallo de TRANSPORTE (Apps Script pierde el cuerpo del POST
   de vez en cuando). Cuando esos tres se agotan, la carga se rinde PARA SIEMPRE: el `catch(e){}`
   deja el global como estaba y la pantalla se queda en «Cargando…» hasta que alguien recargue
   a mano. Esta puerta es la de DESPUES de aquella.

   ✅ Y POR ESO «CARGANDO…» DEJA DE SER MENTIRA. Yo propuse cambiarlo por «no se pudo
   consultar» con un boton de reintentar, razonando que decir «Cargando» cuando ya no carga
   nada es mentir. Daniel eligio lo contrario y con mejor argumento: lo que lo convertia en
   mentira no era el TEXTO, era que **no se reintentaba**. Si de verdad se reintenta, es cierto.

   ⛔ SOLO PARA LECTURAS. Reintentar una ESCRITURA la duplica —dos partes, dos sanciones, dos
   fichajes— y ahi el silencio del reintento pasivo es justo lo peor: nadie se entera de que ha
   pasado dos veces. Las escrituras tienen su propia proteccion (la clave de un solo uso del
   parte), que es otra cosa y vive en otro sitio. */
/* ¿LLEGO ESTA CARGA? Una sola puerta para todas, y no una variable suelta por cara.
   ⛔ EXISTE PORQUE UNA LISTA VACIA NO DICE POR QUE ESTA VACIA. `MOVS` y `MOVS_E` son
   arrays, nunca `null`, asi que «no hay» y «no llego» se pintaban IGUAL — y lo que se
   pintaba era lo primero: «Sin movimientos esta temporada». Decirle a alguien que no
   tiene sanciones cuando el servidor no contesto se lee como «estoy limpio», y ahi ya
   no se vuelve a mirar.
   ⚠️ Se consulta SIN argumento y se fija CON el, para que no haya dos funciones que
   puedan divergir. Y arranca en falso: antes de la primera carga, «no ha llegado» es
   la verdad. */
var _LLEGO = {};
function _llego_(clave, v){
  if(v !== undefined) _LLEGO[clave] = (v === true);
  return _LLEGO[clave] === true;
}

var RP_BASE = 3000;     /* la primera espera */
var RP_TOPE = 60000;    /* y el techo, que no se pasa */

/* Cuanto se espera ANTES del intento `n` (n=1 es el primer reintento). Duplica y topa.
   ⛔ EL TECHO NO ES COSMETICO: sin el, duplicar llega a horas en una tarde, y un reintento que
   vuelve dentro de tres horas no es un reintento — una pestaña abierta toda la tarde no se
   recuperaria nunca, que es exactamente el caso de Jose Manuel con el escritorio.
   ⛔ Y NO EMPIEZA EN CERO: `api._post` acaba de gastar ~2 s en sus tres intentos. Volver de
   inmediato seria un CUARTO intento contra lo mismo, no un reintento pasivo. */
function _esperaReintento_(n){
  var i = Math.max(1, Math.floor(n || 1));
  return Math.min(RP_TOPE, RP_BASE * Math.pow(2, i - 1));
}

/* Los reintentos VIVOS, por clave.
   ⛔ EXISTE PARA QUE NO SE APILEN, y esa es la averia clasica de esto: `render()` puede pedir
   la misma carga cinco veces en un segundo, y cinco cadenas de reintentos son cinco veces el
   trafico contra un backend que ya esta caido, ademas de cinco `render()` seguidos. */
var _RP_VIVOS = {};

/* `intentar()` devuelve **exactamente `true`** (o una promesa que resuelve a `true`) cuando la
   carga fue bien. Al lograrlo se llama a `alLograr` UNA vez: ahi es donde el «Cargando…» se
   convierte solo en la pantalla de verdad, sin que nadie toque nada.

   ⛔ POR QUE `=== true` Y NO `!== false`. Las quince cargas de la app hoy no devuelven nada
   (`_cargarSancionesM_` acaba en `catch(e){}`). Con `!== false`, una carga sin adaptar
   devolveria `undefined`, esto lo leeria como EXITO, la cadena se cortaria al primer intento
   y `alLograr` se dispararia una vez: **un no-op silencioso con toda la pinta de funcionar**
   — que es exactamente la averia que Daniel quiere arreglar, disfrazada de arreglo.
   ✅ Con `=== true`, una carga sin adaptar reintenta para siempre (una peticion por minuto al
   llegar al techo): molesto y VISIBLE. Entre fallar callando y fallar de cara, de cara.
   ⛔ Y NO HAY NINGUN `tost` AQUI DENTRO, a proposito: «sin decirtelo constantemente».
   ⚠️ `temporizar` se inyecta para poder probar esto sin esperar minutos de reloj — el banco le
   pasa un temporizador falso. Sin esa costura, esta funcion solo se podria mirar. */
function _reintentoPasivo_(clave, intentar, alLograr, temporizar){
  if(_RP_VIVOS[clave]) return false;
  var tmp = temporizar || function(f, ms){ return setTimeout(f, ms); };
  var n = 1, paso, tras, poner;

  /* ⚠️ Se guarda un OBJETO, no lo que devuelva el temporizador: un doble de prueba puede
     devolver `undefined` o `0`, y entonces el guardia de arriba dejaria apilar.
     ⛔ Y LA RANURA SE PONE **ANTES** DE CREAR EL TEMPORIZADOR. Escribirla despues deja el
     registro sucio en cuanto el temporizador ejecute ya —el `delete` del exito corre primero
     y la asignacion de despues lo resucita—, y entonces esa clave queda bloqueada para
     siempre: la pantalla no volveria a reintentar en toda la sesion. Lo cazo el banco con su
     temporizador falso; leyendo no se ve, porque `setTimeout` de verdad nunca es sincrono. */
  poner = function(ms){
    var ranura = { h: null };
    _RP_VIVOS[clave] = ranura;
    ranura.h = tmp(paso, ms);
  };

  tras = function(ok){
    if(ok){ delete _RP_VIVOS[clave]; if(alLograr) alLograr(); return; }
    n++;
    poner(_esperaReintento_(n));
  };

  /* ⛔ UNA SESION CADUCADA NO SE REINTENTA, Y ESTO NO ES OPINION MIA: lo dice `_ApiSesion`
     desde el 07/08 —«repetir con el mismo token caducado da el mismo error tres veces y tarda
     el triple en decir lo mismo»—. Sin esta salida, dejar el escritorio abierto una hora
     metia CADA carga en un bucle de 60 s para siempre contra un backend que va a decir que no
     eternamente, y ademas en silencio: es el bug de Jose Manuel con un bucle infinito encima.
     ✅ Se para y se deja hablar a quien ya sabe decirlo (`_sesionMuerta_`), que ademas lo dice
     UNA vez y vuelve a ofrecer el login. */
  var rendirse = function(err){
    delete _RP_VIVOS[clave];
    if(typeof _sesionMuerta_ === 'function') _sesionMuerta_(true);
  };
  var esDeSesion = function(e){
    if(!e) return false;
    if(e.sesion) return true;
    return typeof _esErrorDeSesion_ === 'function' && _esErrorDeSesion_(e.message || e);
  };

  paso = function(){
    var p;
    try{ p = intentar(); }
    catch(e){ if(esDeSesion(e)) return rendirse(e); tras(false); return; }
    if(p && typeof p.then === 'function')
      p.then(function(r){ tras(r === true); },
             function(e){ if(esDeSesion(e)) return rendirse(e); tras(false); });
    else tras(p === true);
  };

  poner(_esperaReintento_(n));
  return true;
}

function _apiParse(txt, accion){
  var j=null; try{ j=JSON.parse(txt); }catch(_){}
  /* Lo que vuelve no es JSON: es la pagina HTML de Google del 404 transitorio.
     ⛔ Y LO DICE ASI, distinto del «no» de abajo. Los dos ponian «respuesta no válida del
     backend» y se comportan AL REVES: esto lleva `transito`, o sea que `api._post` lo
     REINTENTA TRES VECES antes de rendirse; lo de abajo es un rechazo con criterio y sale a
     la primera. Con el mismo texto, quien lee el aviso no puede saber si la app lo intento
     tres veces o ni lo intento — le paso a Daniel el 15/08. */
  if(!j) throw new _ApiTransito("el servidor no contestó en JSON (se reintentó)");
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
  /* Un «no» del backend SIN motivo. No se reintenta -- tiene criterio, repetirlo da lo
     mismo tres veces--, asi que se dice que fue un rechazo y no un fallo de linea. */
  throw new Error(err||"el backend rechazó la acción sin decir por qué");
}

/* Mapea un parte del BACKEND (subsistema/justificacion/estado 'pendiente'…) al modelo que
   pinta el escritorio (unidad/just/estado 'pend'…). Sin datos inventados: los flags de
   calidad de la maqueta no existen en real, salvo los que el propio dato delata. */
/* ⛔ CUÁNTOS DÍAS QUEDAN, Y SI CORRE PRISA — EN UN SOLO SITIO.
   Dos pantallas hacen esta cuenta: **Tareas** («vence hoy», desde el 27/07) y **Reuniones**
   («cierra HOY», desde el 09/08). La segunda copia la escribí yo esa noche, y el proyecto tiene
   fichado a dónde lleva eso: *dos copias de una regla que nadie compara son dos reglas*. Aquí
   vive la **cuenta**; las **palabras** se quedan en cada pantalla, porque una tarea «vence» y una
   reunión «cierra», y eso no es un detalle técnico sino cómo se habla de cada cosa.

   ⛔ Devuelve **`null`** si no hay fecha o no se entiende: «no lo sé» no se contesta con un `0`,
   que aquí significaría «vence HOY» y mandaría a correr por nada (§3c-24 de ARRANQUE).
   ⚠️ Y **hacia abajo**: `Math.floor`, así que cualquier negativo es «ya pasó». Redondear al alza
   daría «mañana» el día que vence. */
/* ══ ¿DE QUÉ MES ES ESTE PARTE, Y ESTÁ CERRADO? ═════════════════════════════
   Daniel (09/08): *«me salen para revocar aún cosas del mes anterior, eso no se debería poder
   revocar si es del mes anterior uno ya cerrado (hablamos de mes contable, o sea que el de
   julio acabó el 4 de agosto)»*.

   ⛔ LA FECHA DE UN PARTE NO ES `fin`. En los que salen de un FICHAJE, `ini` y `fin` son
   HORAS SUELTAS (`'22:45'`) y la fecha vive en `creado_at`. Coger «el primero que exista» se
   queda con la hora y devuelve mes vacío — o sea **NO bloquea**, que es lo contrario de lo
   que se pide. Al backend se lo destaparon los DATOS REALES: de 11 partes en vivo, **7**
   tenían `fin` en `HH:MM`, y uno era de julio con julio ya cerrado.
   ⚠️ La regla se ESPEJA a propósito (`_fechaDeParte_` en el `.gs`): son dos runtimes, y lo
   que las ata es una comprobación de **simetría**, no de corrección (§3c-9). */
/* ⛔ A QUE MES CUENTA UN BLOQUE ATRASADO — y por que la pantalla tiene que decirlo.
   Daniel (11/08): *«Tu puedes declarar un bloque horario atrasado de julio en agosto, si. Eso
   se puede pero eso tendra que entrar al nuevo mes… nunca al anterior. Siempre al actual.
   Aunq sea atrasado debe ser asi porque si no peta»*.

   ✅ Y ASI FUNCIONA YA, pero por accidente y sin que nadie lo diga: `_periodoParte_` mira
   `[fin, ini, creado_at]` y **`fecha` no esta en esa lista**; para un bloque a mano `ini`/`fin`
   son `HH:MM`, asi que cae a `creado_at` — el mes en que se creo. Coincide con la regla.

   ⛔ LO QUE NO COINCIDE ES LO QUE SE VE. La tarjeta que firma el coordinador pone la fecha
   que escribio la persona, y esa fecha puede ser de otro mes. Se pinta de una forma y se
   contabiliza de otra, que es como se firma una cosa creyendo otra.
   ✅ Devuelve el aviso cuando la fecha escrita cae en un mes distinto del actual, y '' cuando
   no hay nada que avisar. */
function _avisoMesDelBloque_(fechaDMY, hoyDMY){
  var f = _dmyAISO_(String(fechaDMY || ''));
  var h = _dmyAISO_(String(hoyDMY || ''));
  if(!/^\d{4}-\d{2}/.test(f) || !/^\d{4}-\d{2}/.test(h)) return '';
  return f.slice(0,7) === h.slice(0,7) ? '' : h.slice(0,7);
}

/* ⛔ LOS PUNTOS DE SALIDA, COMO LISTA CERRADA Y CON SU CIUDAD APARTE.
   Daniel (11/08): «Lista casi mejor. y no es un turno que sale de vigo, es un turno que
   contemple el trayecto ourense - vigo. La lista es: Enfrente del Politécnico (parada de
   autobús), Ourense; CUVI, Vigo; CITI, Ourense».

   ⛔ Y LA `ciudad` VA EN SU PROPIO CAMPO, que es el punto entero. Lo que decide si un turno
   lleva trayecto NO es de dónde sale: es que el trayecto **cruce entre ciudades**. Con la
   ciudad separada eso es una comparación de un renglón; metida dentro del nombre serían
   casos especiales, uno por sitio, y el cuarto punto que se añada rompe la regla.

   ⚠️ Y por eso es lista y no texto libre: con texto libre «CUVI», «cuvi» y «CUVI, Vigo» son
   tres sitios distintos y la comparación no se puede hacer nunca. El «casi» de Daniel es
   honesto —una lista deja fuera un punto nuevo hasta que alguien lo añada—, y la respuesta a
   eso no es texto libre: es que añadir una fila aquí sea trivial. Lo es. */
var PUNTOS_TURNO = [
  { id:'poli-ou', nombre:'Enfrente del Politécnico (parada de autobús)', ciudad:'Ourense' },
  { id:'cuvi-vi', nombre:'CUVI',                                          ciudad:'Vigo'    },
  { id:'citi-ou', nombre:'CITI',                                          ciudad:'Ourense' }
];

function _puntoTurno_(id){
  for (var i=0;i<PUNTOS_TURNO.length;i++) if (PUNTOS_TURNO[i].id === id) return PUNTOS_TURNO[i];
  return null;                    /* ⛔ `null` = «no lo sé», nunca un punto inventado */
}

/* ¿El trayecto cruza de ciudad? `true` / `false` / **`null` cuando no se sabe**.
   ⛔ EL `null` NO ES DECORACIÓN: quien recibe un «no lo sé» NO puede tratarlo como «no cruza»,
   porque eso es exactamente perder un descuento de 4 € sin que nadie se entere. Es la regla
   del proyecto sobre los valores que significan «no lo sé», y aquí hay dinero detrás. */
function _trayectoCruzaCiudad_(origenId, destinoId){
  var o = _puntoTurno_(origenId), d = _puntoTurno_(destinoId);
  if (!o || !d) return null;
  return o.ciudad !== d.ciudad;
}

/* ═══ EL TIEMPO EXTRA DE UN TURNO · EL MODELO ════════════════════════════════════
   Daniel (15/08/2026), literal: *«si nos quedamos mas de cuatro horas … tiene que haber un
   mecanismo en el escritorio: el responsable de turno le da a un boton, se valida, y hay un
   campo para rellenar si hubo tiempo extra a partir de las cuatro horas»*. Y el punto que
   lo define entero: *«a lo mejor es tiempo extra que no le cuenta a alguien que vive cerca,
   pero si a alguien que vive lejos o alguien que se tuvo que desplazar»*.

   ⛔ POR ESO EL EXTRA ES **POR PERSONA**, no un numero del turno. Un solo campo «el turno
   duro 6 h» reparte 2 h a todo el mundo por igual, que es exactamente lo que el ejemplo de
   Daniel dice que NO vale. La unidad de este modelo es la fila de una persona.

   ⛔ Y EL TURNO NO SE MIDE EN HORAS: se suma **1 al contador**, y el x4 lo pone la formula
   de Notion. Por eso el 4 vive aqui como `_horasTurnoBase_()` y no como un `4` suelto: es la
   MISMA constante que la formula `prop("Turnos fabricacion (este mes)")*4`, y el dia que una
   cambie hay que ver la otra. El extra es lo que se declara **por encima** de esa base, y va
   al campo `Compensaciones` — el que ya entra en las dos formulas. */
function _horasTurnoBase_(){ return 4; }

/* Cuanto extra ADMITE un turno que duro `durH` horas: lo que pase de la base, y nunca menos
   de 0. Es el TECHO de cada fila, no lo que le toca a nadie.
   ⛔ Y EXISTE PARA QUE EL EXTRA NO SE PUEDA INVENTAR. Sin techo, el responsable puede
   declararle a alguien mas horas de las que el turno duro, y eso entra en `Compensaciones`
   —o sea en la cuota y en el ranking— sin que nada lo contradiga. El turno es el hecho; el
   reparto es la interpretacion. */
function _extraTope_(durH){
  var d = (typeof durH === 'number' && isFinite(durH)) ? durH : 0;
  return Math.max(0, d - _horasTurnoBase_());
}

/* Quien ESTUVO en un turno, sin repetidos y en el orden en que vienen los roles.
   ⛔ SOLO LOS QUE TIENEN `miembro`. Una fila de `roles` puede traer `texto` (el apodo que
   alguien escribio en Discord) sin `miembro` resuelto: eso es un «no se quien es», y
   [[la regla del proyecto]] dice que un «no lo se» no se convierte en un dato. Colarlo aqui
   seria declarar horas a un nombre que no casa con nadie del roster. */
/* ⛔ LOS ROLES QUE NO DICEN QUE ESA PERSONA FUERA. `datos/turnos.json` es el **ANUNCIO
   del canal**, no un acta: `Posible` es *puede que venga* y `Reserva` es *va de reserva*.
   📏 Medido sobre los 23 turnos reales: son **3 filas** de **3 personas con nombre**
   (`Posible`, `Posible · Coche`, `Reserva · Coche`).
   ⚠️ Se busca DENTRO de la cadena, no `===`: el rol es texto libre y acumula papeles, y el
   dato real trae `'Posible · Coche'`. Con `===` el compuesto se escapa del filtro.
   ⛔ GEMELA de `reglas/turnos.py:es_firme` — misma pregunta, dos idiomas. Si divergen, la
   misma persona cuenta distinto segun el aparato. Lo contrasta `probar_extra_turno.py`. */
function _rolesDudosos_(){ return ['posible', 'reserva']; }
function _esFirmeRol_(rol){
  var r = String(rol == null ? '' : rol).toLowerCase(), d = _rolesDudosos_(), i;
  for(i = 0; i < d.length; i++){
    if(r.indexOf(d[i]) >= 0) return false;
  }
  return true;
}

function _asistentesTurno_(t){
  var vistos = {}, out = [];
  ((t && t.roles) || []).forEach(function(r){
    var n = r && r.miembro;
    if(!n || vistos[n] || !_esFirmeRol_(r.rol)) return;
    vistos[n] = 1;
    out.push(n);
  });
  return out;
}

/* Los que aparecen en el turno pero cuyo rol NO dice que fueran. ⛔ **No se tiran**: el
   responsable es quien sabe si al final vinieron, asi que siguen saliendo en el panel de
   cerrar el turno — pero **sembrados a CERO**, no al tope. */
function _dudososTurno_(t){
  var firmes = {}, vistos = {}, out = [];
  _asistentesTurno_(t).forEach(function(n){ firmes[n] = 1; });
  ((t && t.roles) || []).forEach(function(r){
    var n = r && r.miembro;
    if(!n || firmes[n] || vistos[n] || _esFirmeRol_(r.rol)) return;
    vistos[n] = 1;
    out.push(n);
  });
  return out;
}

/* El nombre del responsable de turno, o `null` si el turno no lo tiene.
   ⚠️ `rol` es texto libre y ACUMULA papeles separados por comas — el dato real trae
   `'Coche, Responsable de turno'`. Por eso se busca la etiqueta DENTRO de la cadena y no se
   compara entera: con `===` el responsable que ademas lleva coche deja de serlo. */
function _responsableTurno_(t){
  var l = ((t && t.roles) || []).filter(function(r){
    return r && r.miembro && String(r.rol||'').toLowerCase().indexOf('responsable de turno') >= 0;
  });
  return l.length ? l[0].miembro : null;
}

/* ⛔ QUIEN PUEDE CERRAR UN TURNO. El responsable de ESE turno, y el PD.
   Daniel ya le habia dado a este cargo el papel de «confirma quien fue de verdad al acabar»
   (ver `CARGOS_TURNO`); declarar el extra es la otra mitad del mismo gesto.
   ⚠️ El PD entra porque si no, un turno cuyo responsable se va del equipo —o simplemente no
   lo cierra— **no lo puede cerrar nadie** y sus horas se quedan sin declarar para todos los
   que fueron. Un permiso sin puerta de atras es un dato perdido. */
function _puedeCerrarTurno_(t, nombre){
  if(!t || !nombre) return false;
  if(_responsableTurno_(t) === nombre) return true;
  return rangoNom(nombre) >= 3;
}

/* Que falta o que esta mal en un cierre, o `null` si se puede mandar. `cierre` es
   `{nombre: horasExtra}` con los asistentes CONFIRMADOS.
   ⛔ MISMO CONTRATO QUE `_bloqFalta_`: devuelve el MOTIVO, no un booleano. Un `false` obliga
   a la pantalla a recalcular por su cuenta por que no puede enviar, y ahi es donde el boton
   y el mensaje acaban diciendo cosas distintas. */
function _cierreTurnoFalta_(cierre, tope){
  var c = cierre || {}, nombres = Object.keys(c), i, n, v;
  if(!nombres.length) return 'Confirma qui\u00e9n fue de verdad al turno';
  var techo = (typeof tope === 'number' && isFinite(tope)) ? tope : 0;
  for(i=0;i<nombres.length;i++){
    n = nombres[i]; v = c[n];
    if(typeof v !== 'number' || !isFinite(v)) return 'Las horas de ' + n + ' no son un n\u00famero';
    if(v < 0) return 'Nadie puede tener horas extra negativas (' + n + ')';
    /* ⛔ El techo es el turno, no el criterio de nadie: declarar mas horas de las que el
       turno duro es inventar compensacion. */
    if(v > techo) return 'El turno dio para ' + techo + ' h extra como mucho, y ' + n +
      ' tiene ' + v;
    /* Cuartos de hora, como todo lo demas que declara horas en este proyecto. */
    if(Math.abs(v * 4 - Math.round(v * 4)) > 1e-9) return 'Las horas van a cuartos (' + n + ')';
  }
  return null;
}

/* El reparto de PARTIDA: todos los asistentes con el tope entero.
   ⛔ Y ES EL TOPE, NO CERO, A PROPOSITO. El valor por defecto tiene que ser **lo que de
   verdad paso** —si el turno duro 6 h, los que estaban se quedaron 6 h—, y cualquier
   desviacion un acto deliberado del responsable. Con 0 por defecto, olvidarse de rellenar
   sale igual que decidir que nadie se quedo, y eso descuenta horas a gente que las trabajo
   sin que aparezca ningun error.
   ⚠️ ESTO ES UN JUICIO MIO, no una cita: el mensaje de Daniel no dice cual es el defecto.
   Si el suyo es el contrario, se cambia aqui y en ningun sitio mas. */
function _cierreTurnoInicial_(t, durH){
  var tope = _extraTope_(durH), out = {};
  _asistentesTurno_(t).forEach(function(n){ out[n] = tope; });
  /* ⛔ LOS DUDOSOS ENTRAN EN LA LISTA, PERO A CERO. Hasta el 17/08 se sembraban al TOPE
     como todo el mundo: quien solo figuraba como `Posible` salia con las horas extra
     enteras puestas, y habia que acordarse de bajarlas. El defecto tiene que ser «lo que
     se sabe», y de estos **no se sabe si fueron**.
     ⛔ Y no se les quita de la lista: el responsable es quien sabe si al final vinieron —
     borrarlos le impediria declarar las horas de alguien que SI fue. */
  _dudososTurno_(t).forEach(function(n){ out[n] = 0; });
  return out;
}

/* ⛔ LOS TRES CARGOS QUE NO SE PUEDEN DEJAR EN BLANCO.
   Daniel: «para convocar un turno es obligatorio q se cubran los cargos importantes,
   responsable de turno, responsable audiovisual, responsable de memoria y coche (opcional)».

   ⚠️ El de TURNO tiene un segundo papel decidido el mismo día: es quien confirma **quién fue
   de verdad** al acabar, y de esa confirmación depende el descuento del coche. Sin él no hay
   ni turno ni forma de cerrarlo. */
/* ⚠️ `corto` existe porque los tres botones van uno al lado del otro en la fila de cada
   persona, y «Responsable audiovisual» no cabe ahí. El nombre largo (`et`) va en el `title` y
   en los mensajes: lo que se lee al equivocarse tiene que ser el nombre entero, no la
   abreviatura — un «falta AV» no le dice nada a quien convoca por primera vez. */
var CARGOS_TURNO = [
  { k:'turno',       corto:'turno', et:'Responsable de turno',
    nota:'confirma quién fue de verdad al acabar' },
  { k:'audiovisual', corto:'AV',    et:'Responsable audiovisual',  nota:'' },
  { k:'memoria',     corto:'memoria', et:'Responsable de memoria', nota:'' }
];

/* Devuelve las CLAVES de los cargos que faltan, en el orden de `CARGOS_TURNO`. Vacío = se
   puede convocar.
   ⛔ DEVUELVE CUÁLES FALTAN, no un booleano: un `false` obliga a la pantalla a recalcular el
   motivo por su cuenta, y ahí es donde las dos versiones se separan y acaban diciendo cosas
   distintas. Con la lista, el botón y el mensaje leen lo MISMO. */
function _cargosQueFaltan_(cargos){
  var c = cargos || {}, faltan = [];
  for (var i=0;i<CARGOS_TURNO.length;i++){
    var k = CARGOS_TURNO[i].k;
    if (!(c[k] && String(c[k]).replace(/^\s+|\s+$/g,''))) faltan.push(k);
  }
  return faltan;
}

/* ⛔ Y EL COCHE ES OPCIONAL, PERO SI SE PONE TIENE QUE ESTAR ENTERO.
   Daniel: «el coche tiene q tener un campo pa poner de donde sale y a donde va» y «que haya
   una casilla para cuando el trayecto de ida no sea el mismo que el de vuelta y que
   normalmente no este activada».

   Devuelve las pegas de UN coche (lista de claves), vacío si está bien. Un coche a medias es
   peor que ninguno: se convoca creyendo que hay transporte resuelto y no lo hay.
   ⚠️ `vueltaDistinta` apagada por defecto NO se comprueba aquí —eso es del formulario—, pero
   si está encendida, la vuelta tiene que estar completa igual que la ida. */
function _pegasDelCoche_(coche){
  var c = coche || {}, pegas = [];
  if (!_puntoTurno_(c.origen))  pegas.push('origen');
  if (!_puntoTurno_(c.destino)) pegas.push('destino');
  if (c.vueltaDistinta){
    if (!_puntoTurno_(c.vueltaOrigen))  pegas.push('vueltaOrigen');
    if (!_puntoTurno_(c.vueltaDestino)) pegas.push('vueltaDestino');
  }
  return pegas;
}

/* La etiqueta de un coche por su posición: «Coche 1», «Coche 2»…
   Daniel: «ya apareceria lo clasico despues de disposicion de personas: Coche 1, Coche ...
   Coche ... sabes osea si hay varios y eso».
   ⚠️ Base 1 a propósito: nadie dice «Coche 0». */
function _etiquetaCoche_(i){ return 'Coche ' + (Number(i) + 1); }

/* ⛔⛔ CUANTAS QUEDAN SIN MARCAR EN UN BLOQUE DE SANCIONES, en un solo sitio.
   El bloque **se cierra entero**, y cerrarlo es EL DISPARO: levanta `aplicar_sanciones`,
   el motor escribe en Notion y **manda el comunicado con las menciones**. Una sancion
   sin marcar NO es una aceptada — pero el servidor la da por aceptada
   (`_confirmarLote_`: `s.decision || 'aceptar'`), asi que esta guarda es lo unico que
   separa «no lo he mirado» de «sancionado y publicado con su nombre».
   ⛔ El movil la tenia desde siempre; el escritorio **no la tuvo nunca**, y ademas
   fabricaba `dec:'aceptar'` al montar el lote: las 30 salian con «Acepta» encendido y
   el boton decia «Aprobar el bloque · 30 sanciones». Un clic.
   ✅ Vive aqui para que las dos caras cuenten IGUAL y para que se pueda ejecutar en un
   banco: la de una cara sola es la que se queda sin gemela. */
/* ⛔⛔ LO QUE EL SERVIDOR DICE QUE SE SALTO NO SE TIRA.
   `_confirmarLote_` y `_marcarLote_` solo tocan lo que pasa `_puedeSobreSancion_` y
   devuelven el resto (`sinPermiso` / `saltadas`). Esas sanciones **se quedan
   pendientes**: si la pantalla no lo dice, quien cierra el bloque se va convencido de
   haberlo cerrado entero y nadie vuelve a mirarlo. Medido el 18/08: cero lectores de
   los dos campos en toda la app.
   ⚠️ Devuelve cadena VACIA con 0 para poder concatenarlo sin condicionales en cada
   cara — que es como las dos frases se separan. */
function _saltadasTxt_(n){
  n = Number(n) || 0;
  if (n <= 0) return '';
  return ' \u00b7 ' + n + (n === 1 ? ' no la puedes decidir t\u00fa: sigue pendiente.'
                                    : ' no las puedes decidir t\u00fa: siguen pendientes.');
}

function _faltanPorMarcar_(items){
  var n = 0, i, L = items || [];
  for (i = 0; i < L.length; i++) if (!(L[i] && L[i].dec)) n++;
  return n;
}

/* ⛔ EL MOTIVO POR EL QUE NO SE PUEDE CONVOCAR, en UNA sola frase y en un solo sitio.
   Lo necesitan DOS: el boton (que sale `disabled` con esto encima) y la comprobacion del
   envio. Dos textos distintos para la misma regla es como se acaba diciendo «falta el
   audiovisual» arriba y «marca a alguien» abajo.
   ✅ Devuelve '' cuando se puede convocar, para que quien lo llame no tenga que negar nada. */
/* «a», «a y b», «a, b y c». Nace ahora y no antes: hasta hoy habia UN cliente -la lista de
   cargos que faltan- y una utilidad con un solo cliente es adivinar. Con el segundo -las pegas
   de un coche- ya son dos formas de escribir lo mismo, que es como empiezan a separarse.
   ⚠️ Y la CONCORDANCIA se queda fuera a proposito: «Falta el» / «Faltan los» depende de lo que
   se enumere, no de como se una. */
function _unirY_(a){
  var L = a || [];
  if (L.length <= 2) return L.join(' y ');
  return L.slice(0, L.length - 1).join(', ') + ' y ' + L[L.length - 1];
}

/* Como se llama en la PANTALLA cada hueco de un coche. Las palabras son las de los rotulos del
   formulario («Sale de», «Va a», «Vuelve desde», «Vuelve a»): un mensaje que use otras manda a
   buscar un campo que no existe con ese nombre. */
function _pegaCocheTxt_(k){
  if (k === 'origen')        return 'de d\u00f3nde sale';
  if (k === 'destino')       return 'a d\u00f3nde va';
  if (k === 'vueltaOrigen')  return 'desde d\u00f3nde vuelve';
  if (k === 'vueltaDestino') return 'a d\u00f3nde vuelve';
  return k;
}

function _porQueNoSeConvoca_(cargos, cuantos, coches){
  if(!cuantos) return 'Marca al menos a una persona.';
  var faltan = _cargosQueFaltan_(cargos), nombres = [], i, j;
  for(i=0;i<faltan.length;i++){
    for(j=0;j<CARGOS_TURNO.length;j++){
      if(CARGOS_TURNO[j].k === faltan[i]) nombres.push(CARGOS_TURNO[j].et);
    }
  }
  var partes = [];
  /* ⚠️ El nombre LARGO, no la abreviatura de los botones: un «falta AV» no le dice nada a
     quien convoca por primera vez. */
  /* Y EL VERBO CONCUERDA. Con dos cargos, «Falta los ...» esta mal escrito, y esto lo lee el
     equipo entero: un mensaje de error con una falta de concordancia se recuerda mas que lo
     que decia. Con tres, comas y la ultima con «y». */
  if(nombres.length)
    partes.push((nombres.length === 1 ? 'Falta el ' : 'Faltan los ') + _unirY_(nombres) + '.');

  /* ⛔ Y LOS COCHES, POR ESTA MISMA PUERTA -- que es el cable que faltaba desde el 11/08.
     `_pegasDelCoche_` estaba escrita, con banco, y **no la llamaba nadie**: se podia convocar un
     turno con un «Coche 1» sin origen ni destino, o con la vuelta a medias. Daniel pidio el
     campo («el coche tiene q tener un campo pa poner de donde sale y a donde va») y la casilla
     de la vuelta distinta; la mitad del encargo se perdia en silencio.
     ⛔ Va AQUI y no en el boton porque esta funcion es la que leen LOS DOS -- el boton que sale
     `disabled` y la comprobacion del envio-. Ponerlo en uno solo es como se acaba con un boton
     apagado sin motivo, o con un motivo que no apaga el boton.
     ⚠️ Un coche sin ninguna pega no dice nada: la lista vacia significa «se puede».
     ⚠️ Y `coches` es OPCIONAL: un turno sin coches es lo normal, y `undefined` no es una pega. */
  var L = coches || [], k, pg, huecos;
  for(i=0;i<L.length;i++){
    pg = _pegasDelCoche_(L[i]);
    if(!pg.length) continue;
    huecos = [];
    for(k=0;k<pg.length;k++) huecos.push(_pegaCocheTxt_(pg[k]));
    partes.push('Al ' + _etiquetaCoche_(i) + ' le falta' + (huecos.length === 1 ? ' ' : 'n ') +
                _unirY_(huecos) + '.');
  }
  return partes.join(' ');
}

/* ⛔ EL `rol` QUE DE VERDAD SE LEE — y por que esto no es cosmetica.
   La cara recoge quien lleva coche (boton 🚗) y quien es responsable de turno (radio), y
   los manda al backend, que los escribe en columnas People de Notion. **Y nadie las vuelve a
   leer**: `_turnoDeNotion_` saca los roles SOLO del texto `Reparto`, compuesto con `r.rol`, que
   es lo que alguien teclea a mano en «su papel (opcional)». Y `reglas/cuota.py` cobra el
   descuento buscando la palabra «coche» DENTRO de ese texto.
   → Marcar el boton no producia ningun descuento. La pantalla prometia algo que no entregaba.

   ✅ El formato no se inventa: los datos reales ya son asi — «Responsable de turno, Coche»,
   «Responsable de turno, Coche, Responsable de memoria».
   ⚠️ Y lo que la persona escribio a mano se CONSERVA y va primero: es lo que ella quiso decir;
   lo de los botones se añade detras, sin pisarlo ni duplicarlo. */
function _rolDeTurno_(escrito, marcas){
  var m = marcas || {}, partes = [], i;
  var puesto = String(escrito == null ? '' : escrito).replace(/^\s+|\s+$/g,'');
  if(puesto) partes.push(puesto);
  var auto = [];
  if(m.responsable) auto.push('Responsable de turno');
  if(m.coche)       auto.push('Coche');
  var bajo = puesto.toLowerCase();
  for(i=0;i<auto.length;i++){
    /* ⛔ NO SE DUPLICA lo que ya escribio a mano: `cuota.py` cuenta por SUBCADENA, asi que un
       «Coche, Coche» no cobra doble hoy — pero la ficha se leeria como una chapuza, y el dia
       que alguien cuente ocurrencias en vez de buscar la palabra, cobraria dos veces. */
    if(bajo.indexOf(auto[i].toLowerCase()) < 0) partes.push(auto[i]);
  }
  return partes.join(', ');
}

function _periodoParte_(p){
  var c = [p && p.fin, p && p.ini, p && p.creado_at], i, s;
  for (i = 0; i < c.length; i++){
    s = String(c[i] == null ? '' : c[i]);
    if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7);
  }
  return null;                    /* ⛔ `null` = «no lo sé», nunca '' (§3c-24) */
}

/* El periodo cerrado si el parte cae dentro de él; `false` si está abierto; **`null` cuando
   no se sabe** — y quien recibe el `null` **NO bloquea**.

   ⛔⛔ UN MES ES CONTABLE, NO DE CALENDARIO — y por eso el corte es un INSTANTE.
   Daniel (09/08): *«hablamos de mes CONTABLE, o sea que el de julio acabó el 4 de agosto»*.
   El servidor cumple esa frase literal (`_parteEnMesCerrado_`: `creado_at < ultimoCierre.at`);
   aquí se comparaba el **mes de calendario** del parte contra el último periodo cerrado, así
   que del **1 de agosto al instante del cierre** los dos criterios se separan y esta cara
   ofrecía «Revertir» sobre partes que el servidor rechaza. Pasa **todos los meses**.

   ✅ Con el instante delante se usa **el predicado del servidor, no uno parecido**: mismo
   campo (`creado_at`), misma comparación. La disyuntiva de abajo —fallar hacia «ofrecer» o
   hacia «esconder»— existía **solo mientras la cara no podía saberlo**, y sí puede: el
   `cierre_plan` viaja entero (`Codigo.gs:1285`) y lleva `resultado.at`.
   ⛔ El instante SE PREFIERE del argumento `uc` (el último cierre que sirve el backend, dato
   **durable**) porque la ranura `cierre_plan` **la pisa un cálculo nuevo**
   (`rutinas/calcular_cierre.py:213` sube un plan con `aplicado:false` y sin `resultado`).
   ⚠️ Y el periodo que se enseña sale de **la misma fuente que el instante**: decir «2026-08
   cerrado» porque el plan a medias habla de agosto, cuando lo cerrado es julio, es peor que
   no decir nada.
   ⚠️ No se exige `aplicado`: un `uc` **es** un cierre aplicado —de ahí sale—, y exigirlo
   devolvería el agujero justo en la ventana que este bloque existe para tapar.

   ⛔ Y SIN INSTANTE se conserva lo de antes, que es cortesía: fallar hacia «ofrecer» deja que
   el servidor explique; hacia «esconder» quita una acción legítima **sin decir por qué**, y
   eso no se puede depurar desde el móvil. */
function _mesCerradoParte_(p, plan, uc){
  var at  = (uc && uc.at) || (plan && plan.resultado && plan.resultado.at) || null;
  var per = (uc && uc.periodo) || (plan && plan.periodo) || null;
  if (at && per){
    var cre = String((p && p.creado_at) || '');
    /* ⛔ `null` y no `false`: un parte sin `creado_at` es «no lo sé» (§3c-24), y es lo mismo
       que contesta el servidor ahí. Leerlo como «abierto» vuelve a ofrecer el botón. */
    if (!/^\d{4}-\d{2}-\d{2}/.test(cre)) return null;
    return cre < String(at) ? String(per) : false;
  }
  if (!plan || !plan.aplicado || !plan.periodo) return null;
  var p2 = _periodoParte_(p);
  if (!p2) return null;
  return p2 <= String(plan.periodo) ? String(plan.periodo) : false;
}

function _diasHasta_(ms){
  var t = +ms;
  if (ms == null || !isFinite(t)) return null;
  /* 86400000 y no `_MSDIA_`: esa constante vive en el HTML de cada cara, y declararla aquí
     sería un global repetido en la misma cara — gana el último que cargue, sin error. */
  return Math.floor((t - _hoyDateM_().getTime()) / 86400000);
}

/* El corte de «corre prisa», uno solo para toda la app. Con una semana, media lista sale en
   rojo siempre y el aviso deja de significar nada. */
var _DIAS_PRISA_ = 3;

/* ⛔ EL PLAZO EN PALABRAS — PARA LAS DOS CARAS.
   Nació en el móvil el 09/08 y el escritorio seguía enseñando la fecha cruda: **el mismo plazo
   dicho de dos formas se lee como dos cosas**, y el que coordina mira las dos pantallas.

   ⛔ **Acepta los DOS formatos de fecha**, y esto no es cosmético: el backend manda `AAAA-MM-DD`
   y las semillas y Notion, `DD/MM/AAAA`. Con solo ISO, una fecha del otro formato daba
   **«sin límite»** — o sea, la pantalla diciéndote que no hay plazo cuando sí lo hay, que es
   justo el fallo que no da error y te cuesta puntos.

   ⚠️ Las **palabras** son las de una reunión (*cierra*). Una tarea *vence*, y esa pantalla tiene
   las suyas: lo que comparten es la **cuenta** (`_diasHasta_`), no el verbo. */
function _plazoTxt_(limite){
  var iso = _dmyAISO_(String(limite == null ? '' : limite)).slice(0, 10);
  var dias = _diasHasta_(Date.parse(iso));
  if (dias === null) return 'sin l\u00edmite';
  if (dias < 0)  return 'el plazo cerr\u00f3 el ' + _isoADMY_(iso);
  if (dias === 0) return 'cierra HOY';
  if (dias === 1) return 'cierra ma\u00f1ana';
  if (dias <= _DIAS_PRISA_) return 'cierra en ' + dias + ' d\u00edas';
  return 'cierra el ' + _isoADMY_(iso);
}

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
       'puede ser de hace horas. Vuelve a entrar.', {fijo:true});
  /* \u26d4 Y NO BASTA CON DECIRLO: SE VUELVE A OFRECER LA ENTRADA.
     Daniel (09/08): *\xabno me inicia sesi\u00f3n en escritorio\xbb*. Medido en la beta publicada:
     `SESION` a `null`, **ning\u00fan gate en el DOM** y la app pintada con la semilla de demo y
     una identidad que **no es la suya**. La funci\u00f3n que pinta el login estaba **bien** \u2014
     llamada a mano aparece entera\u2014: lo que faltaba es que **alguien la llamara** cuando la
     sesi\u00f3n se muere en marcha. El aviso dec\u00eda \xabrecarga y vuelve a entrar\xbb y dejaba la
     pantalla sin **nada que pulsar**.
     \u26a0\ufe0f La direcci\u00f3n no puede hacer da\u00f1o: si a\u00fan hubiera sesi\u00f3n, `_arrancarGis_` se planta
     sola (`if(SESION) return;`). Fallar hacia \xabte ofrezco entrar\xbb cuesta un gate de m\u00e1s;
     fallar hacia \xabte lo digo y ya\xbb deja a alguien decidiendo sobre datos inventados.
     \u26a0\ufe0f Va por el nombre y con guarda porque **cada cara tiene su puerta**: en el escritorio
     es `_arrancarGis_` \u2014 y **el m\u00f3vil TAMBIEN la tiene** (`movil.html`), as\u00ed que esto
     arregla LAS DOS. \u26d4 Aqu\u00ed escrib\u00ed primero que el m\u00f3vil no la ten\u00eda: **era falso**, y se
     vio ejecutando. La guarda se queda igual, pero por su raz\u00f3n de verdad: cuesta nada, y
     el d\u00eda que una cara la pierda esto no puede reventar **justo al caducar la sesi\u00f3n**. */
  try{ if (typeof _arrancarGis_ === 'function') _arrancarGis_(); }catch(_){}
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

/* ¿Esto es una LISTA de verdad? ⛔ EXISTE PORQUE `[]` ES TRUTHY: la comprobacion de
   cache decia `if (SANC_TAREAS.lista)`, y con eso el `[]` que dejaba el camino de
   FALLO pasaba por dato bueno. `Array.isArray` no existe en ES3 —el arnes de los
   bancos—, asi que se mira por `length`, que es lo que de verdad se usa despues. */
function _esLista_(x){ return !!x && typeof x.length === 'number'; }

/* ⛔⛔ LAS TAREAS DE LAS QUE ALGUIEN ES RESPONSABLE, filtradas de una lista YA CARGADA.
   SINCRONA, y ésa es toda la diferencia con `_tareasDe_` de aquí abajo: aquélla PIDE al
   servidor las de una persona y las cachea en **un solo hueco** (`SANC_TAREAS.quien`),
   compartido con la pantalla de sanciones. Llamarla desde «fichar» tiraría la caché de
   sanciones y al revés. Son dos preguntas distintas con la misma palabra.
   ⛔ Existe porque el backend sirve **todas** las tareas a la cuenta admin: sin filtro, el
   desplegable que dice «elige una de TUS tareas» lista las de las 32 personas, y el parte
   se guarda imputado a la de otro sin un aviso. El escritorio filtraba y el móvil no.
   ⚠️ `r` llega como nombre suelto o como lista de nombres completos. La semilla de demo
   trae el nombre corto y no casa con nadie — y eso es lo correcto: **mejor ninguna que
   una inventada**. */
function _tareasResp_(tareas, nombre){
  var n=String(nombre||''), L=(tareas&&tareas.length)?tareas:[];
  if(!n) return [];
  var out=[], i, j, r;
  for(i=0;i<L.length;i++){
    r=L[i]&&L[i].r; if(!r) continue;
    if(typeof r==='string'){ if(r===n) out.push(L[i]); continue; }
    for(j=0;j<r.length;j++) if(r[j]===n){ out.push(L[i]); break; }
  }
  return out;
}

function _tareasDe_(nombre, alLlegar){
  var n = String(nombre || '');
  if (!n) return [];
  /* ⛔ LA CACHE SOLO SIRVE ARRAYS. Antes bastaba con que `lista` fuera truthy, y el
     camino de FALLO guardaba `[]` — que es truthy —, asi que un corte de red quedaba
     cacheado como «no tiene ninguna» PARA TODA LA SESION: esa persona no se volvia a
     pedir nunca. Y lo que se pinta con eso empuja a sancionar por otro articulo. */
  if (SANC_TAREAS.quien === n && _esLista_(SANC_TAREAS.lista)) return SANC_TAREAS.lista;
  if (SANC_TAREAS.quien === n && SANC_TAREAS.cargando) return null;   // ya se esta pidiendo
  /* ⛔ Y CON UN FALLO YA APUNTADO NO SE REINTENTA EN BUCLE. `render()` pasa por aqui
     muchas veces, asi que reintentar en cada pintado seria una peticion por fotograma
     contra un backend que ya ha dicho que no. Se devuelve `null` —«no se sabe»— y
     quien pinta lee `SANC_TAREAS.error` para decirlo.
     ⚠️ El reintento SI ocurre al cambiar de persona: `quien` distinto vuelve a pedir. */
  if (SANC_TAREAS.quien === n && SANC_TAREAS.error) return null;
  SANC_TAREAS = { quien: n, lista: null, cargando: true };
  api.getTareas(n).then(function(l){
    /* Solo se acepta la respuesta si sigue siendo la persona que se pidio: si mientras llegaba
       se eligio a otra, pintar esto seria ofrecer las tareas de quien no es. */
    if (SANC_TAREAS.quien !== n) return;
    SANC_TAREAS = { quien: n, lista: l || [], cargando: false };
    if (alLlegar) alLlegar();
  }).catch(function(e){
    if (SANC_TAREAS.quien !== n) return;
    /* ⛔ `null`, NO `[]`. Un fallo de red no es «no tiene ninguna tarea»: es «no se
       sabe», y guardarlo como lista vacia es la fila de §3c-24 — un valor que
       significa «no lo se» leido como un dato. */
    SANC_TAREAS = { quien: n, lista: null, cargando: false, error: (e && e.message) || String(e) };
    if (alLlegar) alLlegar();
  });
  return null;                                   // null = «cargando», distinto de [] = «no tiene»
}

/* ⛔ EL ESTADO DEL FORMULARIO DE SANCIONES SE GUARDA AL TECLEAR, NO AL REPINTAR.

   Las dos caras ya llevaban escrita la regla buena -«el estado no puede vivir en el DOM,
   porque el DOM se rehace»- y la cumplian en UN SOLO sitio: un `recoger()` privado, llamado
   desde su `repintar()`. El problema es que el panel se repinta desde MAS sitios:

     · el callback de `_tareasDe_` -asincrono, sin guarda ninguna-, que dispara cuando llegan
       las tareas del sancionado, un rato indeterminado despues de que empieces a escribir;
     · el refresco vivo de cada 90 s (escritorio), cuya guarda `_escribiendoE_()` mira el
       elemento CON FOCO -asi que protege mientras tecleas, pero no en cuanto pulsas un
       nombre de la lista, que es justo el paso siguiente del flujo-.

   Y lo que se perdia no quedaba en blanco: `_ponerSancCuerpo_` repinta con
   `SANC_FORM.pts||'-1'` y `SANC_FORM.art||'libre'`, asi que **volvia un valor FABRICADO con
   pinta de elegido** -y eso es lo que se enviaba al pulsar «Sancionar»-. Un campo vacio se ve;
   un `-1` puesto solo, no.

   ⛔ POR ESO NO SE ARREGLA TAPANDO LOS REPINTADOS: se quita la clase entera. Si cada campo
   escribe en `SANC_FORM` en cuanto cambia, `SANC_FORM` no puede estar mas viejo que el DOM y
   da igual quien repinte, hoy o el mes que viene.
   ⚠️ Va en `comun.js` y no dos veces porque las dos caras usan LOS MISMOS ids y el MISMO
   `SANC_FORM`: dos copias de una autoridad acaban siendo dos autoridades.
   ⚠️ Y va como `function` y no como `var` porque un modulo solo lleva declaraciones `function`
   (ARRANQUE.md §5b), igual que `_escEstParte_`. */
/* ⛔ LOS PUNTOS DE UNA SANCION: LO QUE LA PANTALLA YA PROMETE, HECHO CUMPLIR.

   El campo se pinta con `step="1" min="-5" max="0"` desde siempre. **Esos atributos no paran
   nada**: el envio es el `onclick` de un `<button>` suelto, no el submit de un `<form>`, y en
   toda ronda3 no hay ni una llamada a `checkValidity` -- medido. Solo limitan las flechitas.
   Y la unica comprobacion al enviar era `if(!(pts<=0))`.

   ⛔ Medido el 18/08, capa por capa, con un -50 puesto a mano:
     · los atributos del input .......... no lo paran (no hay validacion de formulario)
     · `!(pts<=0)` en las DOS caras ..... no lo para (-50 <= 0 es cierto)
     · el despachador del backend ....... no mira puntos
     · `_pushSancion_` (`Codigo.gs`) .... escribe `Number(s.puntos) || 0` tal cual
     · aprobar con edicion .............. `Number(opts.puntos)`, sin tope
     · el aplicador a Notion ............ `acotar()` impide el NEGATIVO, no la desproporcion
   O sea: **no hay ninguna capa que lo pare**. Un -50 se guarda en la cola, se anuncia en
   Discord como -50, y al aplicarse deja a la persona en **0 de una sola sancion** -- estado de
   evaluacion del Art. 32 -- donde el catalogo del RRI permite como mucho -5. Y el contraste
   posterior da OK, porque compara contra el valor YA acotado: la red de seguridad confirma el
   desastre como correcto.

   ⚠️ Y `parseInt` TRUNCA en vez de rechazar: `-3.7` entraba como **-3**, en silencio.
   ⚠️ Y el mensaje del campo vacio era «son 0 o negativos», que manda a mirar el SIGNO cuando
   el problema es que no hay numero.

   ⛔ EL RANGO NO ES INVENTADO: es el que el propio campo anuncia, y coincide con
   `datos/rri_motivos.json` (lo mas caro que quita un articulo son 5 puntos). El **0** sigue
   siendo valido a proposito: es el AVISO de la primera ocurrencia (`reglas/gradiente.py`).
   ⚠️ Las SUMAS del RRI (Art. 31b/31c, +1/+2) NO caben aqui, y no es un olvido: esta pantalla
   pone sanciones. El panel viejo (`navegador/app.html`) es el que las admite.

   ⚠️ `trim` por regex y no `String.prototype.trim`: en el ES3 de `cscript` -donde corren los
   bancos- ese metodo no existe, y un banco que revienta se lee igual que uno que no encuentra
   nada. */
function _validaPuntosSanc_(crudo){
  var t = String(crudo === null || crudo === undefined ? '' : crudo).replace(/^\s+|\s+$/g, '');
  if (t === '')
    return { ok:false, msg:'Pon los puntos: el campo esta vacio.' };
  if (!/^-?\d+$/.test(t))
    return { ok:false, msg:'Los puntos son un numero entero: \u00ab'+t+'\u00bb no lo es.' };
  var n = parseInt(t, 10);
  if (n > 0)
    return { ok:false, msg:'Una sancion resta: pon 0 (aviso) o un numero negativo.' };
  if (n < -5)
    return { ok:false, msg:'Lo maximo que quita una sancion del RRI son 5 puntos, y has puesto '+n+'.' };
  return { ok:true, pts:n };
}

/* Los puntos que el catalogo le pone a un articulo. `null` = «no lo se» -no un `-1` fabricado-,
   que es lo que hay que devolver cuando el motivo no esta en la lista. */
function _puntosDeMotivo_(mot){
  var L = (typeof RRI_MOTIVOS !== 'undefined' && RRI_MOTIVOS) || [], i;
  for (i = 0; i < L.length; i++)
    if (L[i] && L[i][0] === mot && typeof L[i][2] === 'number') return String(L[i][2]);
  return null;
}

function _sancCampos_(){
  return { snMotivo:'motivo', snLibre:'libre', snArt:'art', snTarea:'tarea',
           snPlazo:'plazo', snPts:'pts', snFiltro:'filtro' };
}

/* La barrida de golpe: sigue haciendo falta porque un campo puede cambiar sin evento -lo
   rellena el navegador, o lo toca otro codigo-, y porque es la red por si algun dia se anade
   un campo al formulario y nadie se acuerda de atarlo. */
function _recogerSancForm_(){
  var M=_sancCampos_(), id, e;
  for(id in M){ if(!M.hasOwnProperty(id)) continue;
    e=$('#'+id); if(!e) continue;
    SANC_FORM[M[id]]=e.value; }
}

/* ⛔ `addEventListener` Y NO `e.oninput=`, a proposito: sobre estos mismos campos ya hay
   manejadores puestos con `on*` -`snFiltro` rehace la lista, `snMotivo` repinta, `snPlazo`
   guarda el plazo-. Asignar `on*` aqui los PISARIA, o seria pisado por ellos, segun el orden
   en que se cablee; y esa dependencia de orden es de las que se rompen sin dar error. Con
   `addEventListener` conviven, y ademas mueren solos con el nodo en cada repintado. */
function _atarSancForm_(){
  var M=_sancCampos_(), id;
  for(id in M){ if(!M.hasOwnProperty(id)) continue;
    (function(e, k){
      if(!e) return;
      var guardar=function(){ SANC_FORM[k]=e.value; };
      e.addEventListener('input', guardar);
      e.addEventListener('change', guardar);
    })($('#'+id), M[id]); }
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

/* ⛔ EL CHANGELOG, PLEGADO POR TANDA — Y POR QUE NO SE TOCA LA ALTURA DEL MODAL.

   Daniel (15/08): *«la novedad tal y como esta te ocupan toda la pantalla, no, eso no»* — y en
   el mismo tiron: *«lo deseable es el changelog»*. O sea que el changelog se queda; lo que
   sobra es la sabana.

   La salida facil era bajar `.modal .card{max-height:92%}`. Se descarto por dos razones, y la
   segunda es la de peso:
     1. esa clase la comparten TODOS los modales: arreglaria uno y encogeria una docena;
     2. **no ataca la causa**. El modal llega al tope porque dentro va el changelog ENTERO. Con
        el contenido plegado la caja se ajusta sola y el tope no se alcanza. Acotar la altura
        habria dejado la sabana igual de larga dentro de una ventana mas pequeña — mas scroll,
        no menos.

   Parte por `###`, que en el changelog es UNA TANDA, y deja **la primera abierta**: es «que hay
   de nuevo», que es a lo que se entra. Lo de antes queda a un toque.

   ⛔ PARTE EL MARKDOWN, NO EL HTML. Post-procesar la salida de `_mdHTML_` con expresiones
   regulares seria fragil por gusto: aqui la fuente es texto con una regla de una linea y el
   HTML lo sigue generando la MISMA puerta de siempre, sin una segunda implementacion.
   ⚠️ Y el titulo pasa por `_mdHTML_` tambien: metido crudo en el `<summary>`, un `**` del
   changelog sale con los asteriscos en pantalla -- y el changelog esta lleno de ellos. Se le
   quita el `<p>` que lo envuelve porque un parrafo dentro de un `summary` no es HTML valido. */
function _mdPlegado_(md){
  var cab=[], secs=[], act=null;
  String(md||'').split(/\r?\n/).forEach(function(l){
    var m=l.match(/^###\s+(.*)$/);
    if(m){ if(act) secs.push(act); act={tit:m[1], cuerpo:[]}; }
    else if(act) act.cuerpo.push(l);
    else cab.push(l);
  });
  if(act) secs.push(act);
  /* Sin ninguna tanda no se inventa un `<details>`: envolver el documento entero dejaria lo
     unico que hay detras de un toque. Se devuelve tal cual. */
  if(!secs.length) return _mdHTML_(cab.join('\n'));
  var out=_mdHTML_(cab.join('\n'));
  for(var i=0;i<secs.length;i++){
    var t=_mdHTML_(secs[i].tit).replace(/^<p>/,'').replace(/<\/p>$/,'');
    out += '<details class="novsec"'+(i===0?' open':'')+'><summary>'+t+'</summary>'
         + _mdHTML_(secs[i].cuerpo.join('\n')) + '</details>';
  }
  return out;
}

/* La pantalla de novedades. Si el sellado no se hizo, se DICE en vez de enseñar un hueco:
   un changelog vacio parece que no ha cambiado nada, que es lo contrario de la verdad. */
function _novedadesHTML_(){
  var cuerpo = String(CHANGELOG_MD||'').trim()
    ? '<div class="mdoc">'+_mdPlegado_(CHANGELOG_MD)+'</div>'
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

/* ⛔ LA TEMPORADA SALE DEL PERIODO DEL SERVIDOR, NO DEL RELOJ DEL TELEFONO. Su hermana
   `_deEsteMes_` -que vive doce lineas mas abajo y a la que llama el MISMO `_ultimosMov_`- se
   paso al periodo el 13/08 con la razon escrita, y esta se quedo con `_hoyDateM_()`. Filtra
   el LIBRO DE PUNTOS (RRI Art. 29), o sea la disciplina de 32 personas.
   ⚠️ Y el corte de temporada es el **1 de septiembre**: en el filo del 31/08-01/09, o con
   el reloj del telefono desviado, el libro esconderia apuntes de la temporada en curso o
   enseñaria los de la anterior -- y un apunte que de verdad FALTE es indistinguible del que
   la vista tapa (es lo que dice `_notaRegistro_` aqui al lado).
   ✅ El dia 1 del periodo basta para decidir la temporada: `_temporadaDe_` solo mira el mes.
   ⚠️ Sin periodo se sigue cayendo al reloj, y hace falta: es lo unico que hay antes de que
   llegue el panel, y callar el libro entero seria peor que enseñarlo con un mes de margen. */
function _deEstaTemporada_(d){
  if(!d) return false;
  var per = (typeof _diasDelMes_==='function') ? (_diasDelMes_()||{}).periodo : null;
  if(/^\d{4}-\d{2}$/.test(String(per||''))){
    return _temporadaDe_(d) === _temporadaDe_(new Date(+per.slice(0,4), (+per.slice(5,7))-1, 1));
  }
  return _temporadaDe_(d) === _temporadaDe_(_hoyDateM_());
}

/* ⛔ CADA MAGNITUD SE REINICIA CON LO SUYO, y confundirlo hace que la app diga otra cosa que el
   Panel de Rendimientos (Daniel, 30/07):
     · PUNTOS -> por TEMPORADA (RRI Art. 29).
     · HORAS  -> por MES. El cierre mensual pone a cero Carga tareas, Reuniones, Cursos y
       Turnos (`flujos/cierre.py`), asi que enseñar la temporada en Horas seria enseñar horas
       que el panel ya no cuenta. */
/* ⛔ SE MUDÓ DESDE `horas.movil.js` el 13/08, y por la misma razón exacta que
   `_diasDelMes_` el 12/08: la usa `_deEsteMes_`, que vive AQUÍ. Con la función en
   el módulo, `comun.js` no la alcanzaba y teníamos **dos definiciones de «este
   mes» en la misma tarjeta**: la cifra grande medía de CIERRE A CIERRE y el
   desglose de abajo, por el CALENDARIO del teléfono. Dejar una copia aquí serían
   dos puertas para la misma pregunta.

   ⛔ EL PERIODO LO PONE EL SERVIDOR (`equipo_mes.periodo`), no el reloj del móvil:
   con la fecha del teléfono, a dos personas les plegaría cosas distintas el mismo
   día.
   ⚠️ Sin periodo o sin fecha devuelve **false** — o sea NO se pliega. Ante la duda,
   el parte se ve: esconder algo por no saber de cuándo es, es peor que enseñarlo
   de más.
   ⚠️ «Mes pasado» no es exactamente «mes cerrado»: un mes anterior podría seguir
   sin cerrarse. Se usa el mes porque es lo que la cara puede saber sola, y para lo
   que esto hace —quitar ruido de lo viejo— basta. Lo que **nunca** se pliega es el
   mes en curso. */
function _esDeMesPasado_(p, periodo){
  var per = String(periodo||'');
  if(!/^\d{4}-\d{2}$/.test(per)) return false;
  var iso = String((p&&p.iso)||'');
  if(!/^\d{4}-\d{2}/.test(iso)) return false;
  return iso.slice(0,7) < per;
}

/* ⛔ «ESTE MES» ES «LO QUE NO ES DE UN MES PASADO», Y POR LA MISMA PUERTA QUE LA CIFRA
   GRANDE. Hasta el 13/08 esto comó el mes del **reloj del teléfono** mientras `vHoras`
   —seis líneas más arriba en la misma tarjeta— usaba `equipo_mes.periodo`, o sea el mes
   de trabajo **de cierre a cierre**. Del día 1 al día del cierre las dos vistas
   discrepaban: arriba «37 h este mes» y abajo «todavía no se te ha contado ningún
   fichaje». A las 32 personas, **todos los meses** — julio se aplicó el 04/08.
   ⚠️ Y el daño es el que describe `_notaRegistro_` aquí al lado: *un parte que de verdad
   FALTE es indistinguible del que la vista esconde*. Aquí la vista los escondía TODOS,
   y el número de arriba juraba que estaban.
   ✅ Se define como el **complemento** de `_esDeMesPasado_` en vez de reimplementar la
   regla: así las dos mitades de la tarjeta no pueden volver a separarse.
   ⚠️ **Sin periodo se sigue cayendo al calendario**, y hace falta: `_esDeMesPasado_`
   contesta `false` a todo cuando no lo hay —su «ante la duda, se ve»—, y tomar eso por
   «todo es de este mes» metería en la lista partes de hace medio año. */
function _deEsteMes_(d){
  if(!d) return false;
  var per = (typeof _diasDelMes_==='function') ? (_diasDelMes_()||{}).periodo : null;
  if(/^\d{4}-\d{2}$/.test(String(per||''))){
    var m = d.getMonth()+1;
    var iso = d.getFullYear() + '-' + (m<10?'0':'') + m + '-01';
    return !_esDeMesPasado_({iso:iso}, per);
  }
  var h=_hoyDateM_();
  return d.getMonth()===h.getMonth() && d.getFullYear()===h.getFullYear();
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
function _notaRegistro_(total, ambito, cuantos){
  /* ⛔ `cuantos` = CUANTOS SE PINTAN DE VERDAD, y NO siempre es `MOVS_N`. El libro de
     horas del movil reserva uno de los cinco huecos para la compensacion (Daniel, 03/08:
     «los ultimos 5 tambien son los ultimos 5 del mes, INCLUYENDO la compensacion»), asi
     que pinta `MOVS_N-1` fichajes. Esta nota comparaba contra 5 igualmente:
       · con 6 fichajes decia «se ensenan los 5 mas recientes, de 6» y ensenaba 4;
       · con exactamente 5 decia «Todo lo de este mes» **escondiendo uno**.
     ⚠️ Y el escritorio pinta TODOS, asi que decia que escondia cosas que no escondia.
     ⛔ El dano no es el numero: es que esta es la pantalla a la que alguien entra JUSTO a
     comprobar si le contaron un parte. Un parte que de verdad FALTE es indistinguible del
     que la vista esconde -- y la nota le firma que estan todos.
     ⚠️ Sin el argumento se mantiene `MOVS_N`, que es lo que hacen los dos libros de
     PUNTOS: esos si pintan `r.ultimos`, o sea `slice(0, MOVS_N)`. */
  var n = (typeof cuantos === 'number') ? cuantos : MOVS_N;
  var d = (ambito==='mes') ? 'de este mes' : 'de la temporada';
  return total>n
    ? 'Se enseñan los <b>'+n+'</b> más recientes '+d+', de '+total+'. '+
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

/* ⛔⛔ ¿EL CIERRE ACABÓ CORTO? Devuelve null si no, o el desglose si sí.
   El aplicador NO se para con un `ausente` -- y hace bien: «si su página ya no está, esa
   persona se fue, y eso no dice nada de las otras 31». Así que `parado` sale **false** y
   las dos caras leían «no parado» como «todo bien»: un cierre 25/32 se titulaba **APLICADO
   en verde** y **perdía el botón**, dejando a 7 personas con la carga del mes cerrado sin
   poner a cero. El mes siguiente esas horas se cuentan dos veces, y de h/mes salen la
   cuota y el ranking (que es colectivo: mueve a las 32).
   ⛔ El criterio NO es «¿hubo ausentes?» sino «¿se aplicaron MENOS de las que el plan
   cubre?»: así cae también una pasada que murió a medias o cualquier forma de acabar
   corto que nadie haya pensado. `aplicadas` es el TOTAL del periodo (sale del registro) y
   el denominador es `totales.personas` (= número de fichas del plan): son comparables.
   ⚠️ Sin denominador NO se afirma que falten: se cae a `ausentes`, que ya es un «no se
   aplicaron» contado. Inventar un total y restar sería peor que callar (§3c-24).
   ⚠️ Y esto es un RÓTULO, no una guarda: no autoriza nada. Lo que el botón dispara ya lo
   vuelve a comprobar el servidor. No hace falta gemela en el backend. */
function _cierreIncompleto_(plan){
  var r = plan && plan.resultado;
  if(!r) return null;
  var de = (plan.totales && plan.totales.personas) || plan.personas ||
           (plan.fichas && plan.fichas.length) || 0;
  var hechas = Number(r.aplicadas) || 0;
  var aus = Number(r.ausentes) || 0;
  /* ⚠️ La rama sin denominador NO devuelve `aus` aquí: lo hace la línea de abajo, y tener
     las dos formas dejaba una MUTACIÓN EQUIVALENTE — `: aus` y `: 0` daban el mismo
     resultado en todos los casos, así que el banco no podía distinguirlas. Una sola
     forma de llegar al número. */
  var faltan = de ? Math.max(0, de - hechas) : 0;
  if(faltan < aus) faltan = aus;
  if(faltan <= 0) return null;
  return { faltan: faltan, de: de, hechas: hechas, ausentes: aus,
           nombres: (r.nombres_ausentes || []).slice(0) };
}

/* ⛔⛔ ¿ESTAS HORAS YA CUENTAN? Son DOS estados y no uno: `conf` = las trabajaste y te las
   **aprobaron**; `otor` = te las **otorgó** la coordinación (compensaciones). Cuentan
   igual, pero **no son lo mismo** y la pantalla las nombra distinto — llamar «otorgada» a
   una hora que trabajaste es decirle a alguien que se la han regalado.
   ⛔ Existe como PUERTA porque el criterio estaba escrito como la cadena `'otor'` en
   **cuatro** sitios: el contador del mes, la barra, la lista de «lo que ya cuenta» y el
   desglose. Añadir el segundo estado tocando sólo unos cuantos habría hecho **desaparecer**
   las horas aprobadas de la pantalla y del total — que es el gemelo exacto de lo que el
   banco ya vigila para `rev`: sacarlo de una lista sin ponerlo en otra. */
function _cuentaYa_(e){ return e === 'conf' || e === 'otor'; }

/* A qué hora EMPIEZA y a qué hora ACABA la franja `i` de una reunión. En `comun.js` porque
   las dos caras dicen la misma hora: el móvil en el titular del mapa y el escritorio en
   «mejor hueco». `_minHM_` acepta la franja como objeto `{ini,dur}` o como cadena. */
function _hFranja_(R,fi){ var f=(R.franjas||[])[fi]; return f ? _hmMin_(_minHM_(f)) : '—'; }

function _hFinFranja_(R,fi){ var f=(R.franjas||[])[fi];
  return f ? _hmMin_(_minHM_(f) + (+f.dur>0 ? +f.dur : 60)) : '—'; }

/* ⛔⛔ LA MEJOR HORA ES UNA VENTANA, NO UNA CASILLA — y esto vive aquí porque el escritorio
   lo hacía mal: recomendaba la **casilla suelta** con más gente. Con casillas de 30 min y
   una reunión de 1 h eso no responde a nada: si a las 18:00 pueden 12 y a las 18:30 sólo 2,
   a las 18:00 **la reunión no cabe** — y es la cara donde se FIJA la fecha.
   ⛔ Se cuenta a quien puede en TODA la ventana: es una **intersección de personas**, no el
   mínimo casilla a casilla. Dos personas que cubren media hora cada una no hacen una hora.
   ⚠️ Sin respuestas cargadas —la lista no las trae hasta abrir la reunión— se cae a la
   casilla suelta que le pasen, marcada con `exacta:false` para que el rótulo no prometa
   «la reunión entera». Es «no lo sé» dicho, no disimulado.
   ⚠️ Y sólo se miran ventanas cuyas casillas estén TODAS ofertadas: una que se salga del
   horario del día sería una hora en la que nadie pudo marcar. */
function _mejorVentana_(R, minSlots, best){
  var n = (+minSlots > 0) ? +minSlots : 1;
  var b = best || {d:0, f:0, v:0};
  var suelta = {d:b.d||0, f0:b.f||0, f1:b.f||0, v:b.v||0, exacta:false};
  var of = {}, i, di, f, k;
  var bl = R.bloques || [];
  for(i=0;i<bl.length;i++) of[bl[i][0]+'_'+bl[i][1]] = 1;
  var quien = [], nom = Object.keys(R.resp || {});
  for(i=0;i<nom.length;i++){
    var v = R.resp[nom[i]] || [], set = {}, hay = false;
    for(k=0;k<bl.length;k++) if(+v[k] > 0){ set[bl[k][0]+'_'+bl[k][1]] = 1; hay = true; }
    if(hay) quien.push(set);
  }
  if(!quien.length) return suelta;
  var dias = R.dias || [], fr = R.franjas || [];
  var mejor = {d:0, f0:0, f1:0, v:-1};
  for(di=0; di<dias.length; di++){
    for(f=0; f+n<=fr.length; f++){
      var vale = true;
      for(i=0;i<n;i++) if(!of[di+'_'+(f+i)]){ vale = false; break; }
      if(!vale) continue;
      var c = 0;
      for(k=0;k<quien.length;k++){
        var todos = true;
        for(i=0;i<n;i++) if(!quien[k][di+'_'+(f+i)]){ todos = false; break; }
        if(todos) c++;
      }
      if(c > mejor.v) mejor = {d:di, f0:f, f1:f+n-1, v:c};
    }
  }
  if(mejor.v < 0) return suelta;
  return {d:mejor.d, f0:mejor.f0, f1:mejor.f1, v:mejor.v, exacta:true};
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

/* ⚠️ `hoy` ES OPCIONAL Y EXISTE PARA PODER PREGUNTARLE, igual que en `_finDeMes_`: sin
   fecha inyectable, su caso solo se puede escribir para el mes en el que corre el banco -- y
   el que importa es el SALTO DE AÑO, que solo pasa en enero. Produccion la sigue llamando sin
   argumento y no cambia nada de lo que se ve. */
function _mesACerrar_(hoy){
  var h=hoy||new Date(), a=h.getFullYear(), m=h.getMonth();  /* getMonth() es 0-11 */
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
      } else if(sub){
        /* ⛔⛔ UN NO-OP MUDO NO SE DISTINGUE DE UN EXITO. Sin sesion esto no lanza, asi
           que no entra en el `catch` de abajo y **no deja ningun rastro**: exactamente el
           mismo silencio que cuando se ha guardado bien. Y es el caso NORMAL en el
           arranque -- esta funcion corre a los 800 ms, antes de que nadie haya entrado.
           Con la constancia puesta, la pantalla de avisos puede decir que tu suscripcion
           no esta registrada en vez de enseñar un «activadas» en verde. */
        _pushFallo_('sin sesi\u00f3n al arrancar: el aviso no se registr\u00f3 en el servidor');
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

/* ⛔⛔ LA CLASE DE PILDORA DEL MOVIL PARA UN ESTADO, DERIVADA — no inventada.
   `EST_DOC` guarda la clase del ESCRITORIO (`''`/`wa`/`ok`/`no`, que son `chip`) y el
   movil pinta `pil` (`neu`/`pend`/`conf`/`no`). Son DOS VOCABULARIOS, y sin puente cada
   sitio se inventaba el suyo: la ficha del movil calculaba la clase a mano con un `else`
   que caia en **`conf`**, o sea que **«rechazado» salia en VERDE** (`.pil.conf` es
   `--ok`). Tambien `recibido`, `analizado` y `publicando`.
   ⚠️ Un estado DESCONOCIDO cae a `neu`, no a `conf`: «no se» no es «confirmado»
   (§3c-24). Es justo el caso que producia el fallo. */
/* ⛔⛔ LAS DOS MITADES DEL PIPELINE, Y ENTRE LAS DOS TIENEN QUE ESTAR TODOS LOS ESTADOS.
   Antes cada sitio escribia su lista a mano, y las tres que habia eran LA MISMA lista corta:
   `['recibido','analizado','revision','cambios']`. O sea que `publicando`, `aprobado`, `anot`
   y `rechazado` no estaban en NINGUNA -- ni en «En curso», ni en «Publicados», ni en lo que el
   servidor sirve al PD.
   ⛔ El daño no es teorico y tiene dos formas medidas (19/08):
     · Cowork re-empuja `notion_page_created` sobre algo YA publicado -> `_normEstado_` lo deja
       en `publicando` -> se cae de «Publicados» Y de «En curso»: DESAPARECE de la pantalla.
     · Rechazas un expediente desde el escritorio y `DOC_SEL=null; pintar()` lo deja fuera de
       las tres vistas -- tambien para su AUTOR, que se queda sin saber que se lo rechazaron.
   ⛔ Por eso son DOS listas y no una: lo que importa es que su UNION cubra lo que
   `_normEstado_` puede producir. Eso lo vigila `probar_documentos_caras.py` LEYENDO el mapa
   del backend, no con una lista escrita a mano aqui -- que es como se quedo corta la anterior.
   ⚠️ `aprobado` y `anot` son alcanzables aunque `_decidirDoc_` no los deje nunca: llegan de un
   push historico de Cowork, que si los trae. */
var DOC_EN_CURSO=['recibido','analizado','revision','cambios','publicando','aprobado','anot'];
var DOC_RESUELTO=['publicado','rechazado'];
function _docEnCurso_(est){ return DOC_EN_CURSO.indexOf(String(est==null?'':est))>=0; }
function _docResuelto_(est){ return DOC_RESUELTO.indexOf(String(est==null?'':est))>=0; }

function _pilEstDoc_(e){
  var c = estDoc(e)[1];
  return c === 'ok' ? 'conf' : c === 'wa' ? 'pend' : c === 'no' ? 'no' : 'neu';
}

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

/* ⛔⛔ EL MÍNIMO AVISA, NO BLOQUEA — decisión de Daniel (18/08), literal:
   *«aunque la app te pida un minimo de franjas, puedes entregar un numero inferior, eso si te
   tiene que advertir de que cual es el minimo sin sancion»*.
   O sea que el número no es una puerta: es una **advertencia**, y tiene que decir **qué es**.
   «Te piden 26 de 102» no lo dice; «26 es el mínimo sin sanción» sí.
   ⚠️ SE CUENTA EN CASILLAS, no en huecos: es lo que cuenta el motor
   (`flujos/reunion_a_votos.py:49` suma las que valen ≥ 1, no las rachas).
   ⛔ Y NO CONFUNDIR CON `_slotsMin_`, que sí es una restricción dura: una racha más corta que
   la reunión no sirve para ir a nada. Son dos mínimos distintos y se dicen distinto.
   Devuelve `{falta, exigido, txt}`; `falta` a 0 significa que no hay nada que advertir. */
function _avisoMinimo_(marcadas, exigido){
  var m = +marcadas || 0, e = +exigido || 0;
  if(!e) return {falta:0, exigido:0, txt:''};
  var falta = Math.max(0, e - m);
  return { falta: falta, exigido: e,
    txt: falta
      ? ('te faltan ' + falta + ' para el mínimo sin sanción (' + e + ')')
      : ('llegas al mínimo sin sanción (' + e + ')') };
}

/* ⛔⛔ ¿SIGUE ABIERTO EL PLAZO PARA CUBRIR? — copiada del servidor, no inventada.
   El servidor la aplica en `_responder_` (`Codigo.gs:4582`) y **rechaza**; las dos caras no
   preguntaban nada, así que dejaban pintar la rejilla entera y sólo al pulsar «Guardar» salía
   un error crudo. Quien se queda ahí sale como «no cubrió» y se lleva el **Art. 30g**.
   ⛔ SE COPIA LA COMPARACIÓN LITERAL, incluida su normalización: es de cadenas, con resolución
   de MINUTOS y **inclusiva** en el instante exacto (`>=`, la misma frontera que
   `reglas/convocatoria.py`). Una cara «mejor» que el servidor discreparía justo en el borde,
   que es donde importa — y eso es un doble más estricto que la realidad.
   ⚠️ `_ahoraLocalISO_` se construye A MANO y NO con `toISOString()`, que es UTC: en verano
   vamos +2 y la cara diría que quedan dos horas de plazo que el servidor ya cerró. Es el mismo
   fallo que el backend tuvo y arregló, y por eso no se repite aquí.
   ⚠️ Sin `limite` no hay plazo que vencer: abierto. */
function _ahoraLocalISO_(d){
  var x = d || new Date(), p = function(n){ return (n < 10 ? '0' : '') + n; };
  return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()) +
         'T' + p(x.getHours()) + ':' + p(x.getMinutes());
}

/* Una fecha pelada vale TODO su día — «cierra el 20/08» se lee como «tienes el 20». Y un
   separador con espacio se pasa a `T`, porque así es como llega de la hoja. */
function _normLimite_(limite){
  var s = String(limite || '');
  if (!s || s === 'null' || s === 'undefined') return '';
  if (s.length === 10) return s + 'T23:59';
  return s.charAt(10) === ' ' ? (s.slice(0, 10) + 'T' + s.slice(11)) : s;
}

function _plazoAbierto_(limite, ahora){
  var s = _normLimite_(limite);
  if (!s) return true;
  return s >= (ahora || _ahoraLocalISO_());
}

/* ⛔⛔ CUÁNTAS FRANJAS SE TE EXIGEN — y por qué esto vive en una sola puerta.
   Es el número contra el que se decide si alguien se lleva una sanción del **Art. 29i**
   («solo marcó N de M bloques»), así que la pantalla y el motor tienen que decir **el mismo**.
   Estaba sólo en `reuniones.escritorio.js` + `escritorio.html`, y divergía del motor por el
   redondeo.

   ⛔ MEDIDO, ejecutando, con totales de 4 a 120 (117 casos): `Math.round` (lo que había) y
   `math.ceil` (`flujos/sanciones.py:422`, lo que el motor exige) **divergen en 29 de 117 al
   25 % y en 47 de 117 al 30 %**, y siempre en la misma dirección — la app pedía **una casilla
   MENOS**. O sea que quien marcaba exactamente lo que su pantalla le pedía salía sancionado.
   📏 Con los **102 bloques** reales de julio salen 26 y 26 · 31 y 31: coincidían **por
   casualidad**, que es lo que ha mantenido esto invisible.
   ⛔ Es la misma clase de fallo que `flujos/construir_reunion.py:69-87` ya documenta y
   cuantifica para el salto de mes; aquello alineó la FECHA de referencia y **el redondeo se
   quedó atrás**.

   ⚠️ `MESES_MINIMO_BAJO` cita a `flujos/construir_reunion.py:60` — dic–ene y may–ago al 25 %,
   el resto al 30 % (Reforma §P3). Vivía en `escritorio.html`, así que **el móvil no lo tenía**
   y quien cubre desde el teléfono no veía nunca cuántas franjas se le exigen. */
var MESES_MINIMO_BAJO=[1,5,6,7,8,12];

function _pctMinimo_(iso){
  var mes=null;
  var m=String(iso||'').match(/^(\d{4})-(\d{2})/);
  if(m) mes=+m[2];
  if(mes==null) mes=new Date().getMonth()+1;
  return MESES_MINIMO_BAJO.indexOf(mes)>=0 ? 0.25 : 0.30;
}

/* La fecha con la que se juzga el PERIODO: la de la REUNIÓN, no la de hoy — una reunión de
   septiembre convocada en agosto exige el 30 %, no el 25 %.
   ⚠️ La cadena es la del motor LITERAL (`fecha_de_referencia`, `construir_reunion.py:69`):
   `fecha` → `limite` → `creado` → **hoy**.
   ⛔ EL ÚLTIMO ESLABÓN ERA `DATA.generado` Y ESO NO ES «HOY»: es la fecha en que se generó el
   panel, que puede ser de hace meses — o sea que una reunión sin ninguna de las tres se
   juzgaba con el mes del volcado mientras el motor la juzgaba con el de hoy. Devolviendo `''`
   cae al respaldo que `_pctMinimo_` ya tenía (`new Date().getMonth()+1`), que es literalmente
   el `date.today()` del motor. Un eslabón menos y una divergencia menos.
   ⛔⛔ Y OJO CON LOS DOS PRIMEROS, que me los tumbó un lector adversarial: `r.fecha` **no
   existe** (no hay columna en `COLS_REU` y ningún creador la manda) y `creado` **lo tiraban los
   normalizadores**. Se mantienen los tres porque el motor prueba los tres —dos cadenas
   idénticas es el objetivo—, pero lo que hace que sirvan es que `normReu`/`_normReuM_`/
   `_fuenteReuM_` **conserven `creado`**, no esta función. */
function _refMinimo_(r){
  return (r && (r.fecha || r.limite || r.creado)) || '';
}

/* ⛔ `Math.ceil`, NO `Math.round`: es la fórmula del motor (`sanciones.py:422`), y la que
   manda es la del motor porque es la que sanciona. Y sin suelo de 1, también como el motor:
   con `tot>0` el suelo nunca mordía (25 % de 1 ya redondea hacia arriba a 1), así que lo
   único que hacía era exigir 1 franja en una reunión de **cero** casillas — donde nadie puede
   marcar nada y el motor no exige ninguna. */
function _minimoExigido_(r){
  var tot = (r && (r.total || (r.bloques||[]).length)) || 0;
  return Math.ceil(tot * _pctMinimo_(_refMinimo_(r)));
}

/* ⛔⛔ LAS RACHAS QUE SE QUEDAN CORTAS — la regla que sólo tenía el teléfono.
   Marcar media hora suelta para una reunión de hora y media **no sirve para nada**: no puedes
   ir. Y es peor que inútil, porque de esas casillas come el pipeline de sanciones —
   `flujos/reunion_a_votos.py:49` cuenta las casillas con `(v or 0) >= 1` y
   `flujos/sanciones.py:728` hace `cubrio_minimo = voto and bloques >= minimo` — así que una
   marca que no te sirve a ti **sí cuenta para el motor**.
   📏 MEDIDO, y sale al revés de lo que parece: el motor **no sanciona** por marcar corto, te da
   un **aprobado falso**. 26 casillas sueltas en una reunión de 1 h 30 salen `cubrio_minimo =
   True` y **entran en premiados** (`sanciones.py:756`) con una disponibilidad a la que no
   puedes ir. Y no es que se le olvide mirarlo: el diccionario que le llega
   (`reunion_a_votos.py:56-64`) **no lleva `duracion`, ni `slot`, ni `franjas`** — la geometría
   se tira antes, así que la contigüidad **sólo se puede defender aquí, en el navegador**.
   ⛔ La sanción sí existe, y la produce esta misma puerta: lo corto se borra, esas casillas no
   llegan al servidor, bajan los `bloques` y cae el Art. 29i con el motivo «solo marcó N de M
   bloques» — un número que **no explica** que la app le quitó lo que había marcado. Por eso el
   aviso de `_avisoCorto_` no es cortesía: es la única señal que recibe.
   ⛔ Y LAS DOS CARAS ESCRIBEN EN LA MISMA FILA: lo que el ordenador dejaba guardar, el
   teléfono lo **saneaba** al primer toque. La disponibilidad de alguien desaparecía sola.
   ⚠️ ESTO NO BORRA: devuelve **qué** rachas se quedan cortas, como `[día, franjaIni,
   franjaFin]`. Quien borra es cada cara sobre su estructura — el móvil sobre un `Map`
   `dia_franja`, el escritorio sobre un array alineado a `bloques` — y meter aquí una de las
   dos convertiría la puerta en la mitad de una de ellas.
   ⚠️ `marcada(dia, franja)` la pone quien llama: una franja **no ofertada** contesta `false`,
   así que corta la racha. Es lo correcto: no se puede estar disponible donde no hay hueco. */
function _rachasCortas_(nDias, nFranjas, minSlots, marcada){
  var n = (+minSlots > 0) ? +minSlots : 1;
  var nD = +nDias || 0, nF = +nFranjas || 0;
  var out = [], di, f, a;
  for(di = 0; di < nD; di++){
    f = 0;
    while(f < nF){
      if(!marcada(di, f)){ f++; continue; }
      a = f;
      while(f < nF && marcada(di, f)) f++;
      if(f - a < n) out.push([di, a, f - 1]);
    }
  }
  return out;
}

/* Y lo que se le dice a la persona, que también tiene que ser lo mismo en las dos caras: si
   una dice «se ha quitado» y la otra no dice nada, la que calla parece que lo guardó. */
function _avisoCorto_(nCortas, minSlots, slot){
  var n = +nCortas || 0;
  if(!n) return '';
  var d = _durTxt_(((+minSlots > 0) ? +minSlots : 1) * (+slot || 60));
  return n === 1 ? ('Un hueco se quedó por debajo de ' + d + ' y se ha quitado.')
                 : ('Se han quitado ' + n + ' huecos que quedaban por debajo de ' + d + '.');
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
/* ⛔ LO QUE DURA UN TURNO COMO MINIMO, EN UN SOLO SITIO PARA LAS DOS CARAS.
   Daniel (07/08): *«un turno dura unas 4 horas pero a veces dura mas a veces menos… que
   te obligue a minimo 4 horas, tal y como estaba en reuniones»*. El motor lo tiene desde
   entonces (`reglas/turnos.MIN_HORAS_TURNO = 4`) y **esta cara se quedo en 1**.
   ✅ Y el 14/08 Daniel lo cerro: *«Un turno de una hora no es un turno. El JS recibe la
   misma funcion y deja de tener su propio valor por defecto. Es el valor que ya usa el
   motor.»* Gana Python.
   ⚠️ Va como FUNCION y no como `var` porque un modulo solo lleva declaraciones
   `function` (ARRANQUE §5b), igual que `_maxHorasParte_`. */
function _minHorasTurno_(){ return 4; }

function _minTurno_(cv){
  var m = cv && cv.min_h;
  /* ⛔ EL RESPALDO YA NO ES UN `1` PROPIO. Con el 1, una convocatoria a la que le
     faltara `min_h` dejaba decir «puedo un turno» marcando UNA hora, y no daba ningun
     error: salia un turno corto en el reparto y nadie sabia por que. Es exactamente el
     patron del `12` del movil contra el `14` del servidor. */
  return (typeof m==='number' && m>0) ? m : _minHorasTurno_();
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

/* Quien coordina esa unidad; si nadie, el PD.
   ⛔ `coordina` MANDA TAMBIEN, Y AQUI NO SE MIRABA. El backend cerro este mismo agujero el
   12/08 -- Daniel: «es porque Jose es coordinador de la UCT, no por ser el sino por su
   cargo»-- y la cara se quedo con la primera pasada sola. Y **nadie tiene una Unidad como
   `unidad`**: el roster guarda una sola por persona y es su subsistema, asi que la unica via
   por la que la UCT tiene coordinador es este segundo bucle.
   ⛔ Lo que se veia: un expediente de la UCT **no le salia a Jose** en «Pendiente de tu
   revision», `puedeDecidirDoc` daba `false` y la ficha rotulaba «Revisa: Daniel» -- y si era
   lo unico que tenia pendiente, **no veia ni la pestana**.
   ✅ El recorrido de `coordina` es `_unidadesCoord_`, que ya existe: llega como cadena, lista
   o nada, y **una cadena no se itera** (daria doce unidades de una letra). */
function coordinadorDe(u){
  var c = buscaMiembro(function(m){ return m.cargo==='Coordinador' && m.unidad===u; });
  if (c) return c.nombre;
  c = buscaMiembro(function(m){
    if (m.cargo!=='Coordinador') return false;
    var v = (typeof _unidadesCoord_==='function') ? _unidadesCoord_(m.coordina) : [], i;
    for (i=0;i<v.length;i++) if (v[i]===u) return true;
    return false;
  });
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

/* ── LA CONVOCATORIA DE TURNOS, EN LAS DOS CARAS ─────────────────────────────────
   Vivian en `turnos.movil.js` y bajaron aqui el 14/08, cuando el escritorio paso a poder
   contestar la convocatoria: esa cara no carga el fichero del movil, asi que la alternativa
   era copiarlas. Son puras y pequenas, y el dia que una de las dos caras cambie el criterio
   de «abierta» sin la otra, la gente veria una rejilla que el servidor rechaza. */

/* `sin_abrir` | `abierta` | `cerrada`. Sin instantes NO se escribe: la frontera cerrada es
   lo que hace que una celda vacía signifique una sola cosa. */

/* ¿ESTOY MIRANDO LA APP COMO OTRA PERSONA?
   ⛔ POR QUE EXISTE, con el caso delante (14/08). El móvil tiene un selector «Ver como»
   para la cuenta admin que reasigna el **global `YO`** -- y `YO` era a la vez «a quién miro»
   y «quién soy al escribir». Sin ninguna guarda:
   · en REUNIONES se mandaba `nombre = YO.nombre` y el backend, **para el admin**, honra ese
     nombre: se guardaba encima de la disponibilidad de OTRA persona. Si quedaba a cero, a esa
     persona le vuelve a salir «te falta cubrir» -- y de no cubrir salen sanciones.
   · en TURNOS es peor y al revés: se LEÍA la fila del suplantado (que no está cargada, así
     que la rejilla sale **en blanco**) y se ESCRIBÍA la de uno mismo, porque ahí manda el
     token. La rejilla viaja entera: tu disponibilidad real quedaba **sustituida por una
     rejilla vacía**, bajo el nombre de otra persona, sin forma de verlo.
   ✅ La regla ya estaba decidida y escrita en el propio móvil -- `_actorSanc_`: *«la
   autoridad no se hereda mirando»* --, pero se había aplicado **solo en sanciones**. Una
   premisa no vive donde se enuncia: vive donde se cita.
   ⚠ Sin sesión (demo local) devuelve `false` a propósito: ahí no hay nada que escribir
   -- los dos guardados salen antes si no hay `SESION` --, así que bloquear sería estorbar
   sin proteger nada. */
/* LOS TIPOS DE AVISO QUE HOY EMITE ALGUIEN DE VERDAD.
   ⛔ POR QUE ES UNA FUNCION Y NO UN `var`: los modulos de capacidad solo llevan declaraciones
   `function` -- ni un `var`, ni una llamada de nivel superior --, y esta lista la necesitan
   LAS DOS caras. Vivia en `escritorio.html`, asi que el movil no podia marcarla aunque
   quisiera: pintaba los cinco interruptores a secas.
   ⛔ Y LO QUE SE JUEGA lo dice el propio movil, sobre los fijos: «ensenar uno que no hace nada
   es peor que no ensenarlo: lo apagas, crees que lo apagaste, te llegan igual -- y a partir de
   ahi no te fias tampoco de los dos que si funcionan». Vale igual al reves: enciendes
   «documentos», crees que te avisaran de una revision pendiente, y no te avisa nada.
   ⚠️ Se actualiza cuando un emisor empiece a mandar ese tipo, no antes. */
/* ¿ESTE PARTE YA TOCO NOTION?
   ⛔ POR QUE IMPORTA: revertir una `aprobada` sin aplicar **no deja rastro**; revertir una que
   ya esta en la ficha **emite una contraparte que RESTA de la ficha de esa persona**. Decir lo
   mismo en los dos casos esconde justo el que importa.
   ⛔ Y POR QUE LOS DOS TERMINOS: el estado puede ir por detras del sello. Si el motor escribio
   en Notion y el estado no llego a rodar, mirar solo `estado` dice «aun no cuenta» **cuando
   revertir SI resta** -- el unico caso en que el aviso hace falta.
   ⚠️ Vivia SOLO en el escritorio (`_escRevYaCuenta_`), y el propio fichero dejo escrito que el
   movil se habia quedado en `p.estado==='aplicada'`: «mismo hueco, otra cara». Se copio la
   nota y no el arreglo, asi que la misma persona veia dos respuestas segun el aparato -- y una
   de las dos le invita a volver a declararlo. */
function _yaCuentaEnSuMes_(p){ return !!(p && (p.estado==='aplicada' || p.aplicado_at)); }

/* ⛔ LOS TIPOS DE AVISO QUE ALGUN EMISOR PRODUCE HOY. No es la lista de los que EXISTEN:
   es la de los que de verdad llegan, y la pantalla de Ajustes marca el resto con «hoy no
   se manda ninguno de este tipo». Un interruptor que promete algo que nadie emite enseña
   a ignorar la pantalla entera.
   ✅ `documentos` entra el 19/08, y no por criterio: hasta ese dia el backend no tenia
   NINGUN emisor de documentos -- `_encolarPush_` tenia dos llamadores y ninguno lo era.
   Ahora los tiene: `_avisarDoc_`, desde la decision y desde lo que entra en revision.
   ⚠️ Lo vigila `probar_notis_escritorio.py` comparando esta lista con los emisores que
   encuentra EN EL CODIGO, y fue el que canto este cambio antes de que se me ocurriera:
   su mensaje decia, literal, «si FALTA uno -el caso que viene-, dice hoy no se manda
   ninguno de algo que si se manda».
   🔴 `horas` sigue fuera a proposito: nadie lo emite todavia. */
function _notisVivos_(){ return ['turnos','reuniones','avisos','documentos']; }

function _identidadPrestada_(visto){
  if(typeof SESION==='undefined' || !SESION || !SESION.nombre) return false;
  var v = String(visto||'');
  return !!v && v !== String(SESION.nombre);
}

function _convEstado_(cv, ahora){
  var t=ahora?+ahora:Date.now(), a=Date.parse(cv.abre), l=Date.parse(cv.limite);
  if(isNaN(a)||isNaN(l)) return 'cerrada';
  if(t<a) return 'sin_abrir';
  return t<=l ? 'abierta' : 'cerrada';
}

/* Las horas que TE quedan a ti para contestar. Ojo: NO es `ventana_real_h` de Python, que
   contesta a otra pregunta —«si convoco ahora, cuánto le queda a la gente»— y es de quien
   convoca. Misma aritmética, distinta pregunta: por eso son dos y no una. */
function _convQuedan_(cv, ahora){
  var t=ahora?+ahora:Date.now(), l=Date.parse(cv.limite);
  return isNaN(l)||l<=t ? 0 : (l-t)/3600000;
}

/* Las clases de estado que puede llevar una celda, sacadas de la convocatoria. Cablearlas
   haría que un sitio nuevo dejara restos de la clase anterior al repintar. */
function _convClases_(cv){ return (cv.sitios||[]).concat(['ambos','no']); }
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

/* ⛔ EL TOPE DE HORAS DE UN PARTE, EN UN SOLO SITIO PARA LAS DOS CARAS. Vivia en dos:
   el backend topa en 14 (`MAX_HORAS_PARTE`, y el autocierre a 14 esta documentado) y
   el movil bloqueaba el envio por encima de 12, asi que quien hubiera trabajado 13 h
   NO PODIA DECLARARLAS por la app aunque el servidor las aceptara.
   ✅ Y no era una regla mas estricta a proposito, esta MEDIDO: el 12 del movil es del
   24/07 y el 14 del backend del 25/07 -- el movil se quedo con el valor de la vispera.
   ⚠️ Va como FUNCION y no como `var` porque un modulo solo lleva declaraciones
   `function`: las capacidades no se llevan sus globales. */
function _maxHorasParte_(){ return 14; }

/* ═══ EL AVISO DE CRUCE DE MEDIANOCHE · UNA PUERTA PARA LAS DOS CARAS ════════════
   Un bloque declarado a mano con `fin < ini` admite DOS lecturas, y suman SIEMPRE 24 h:
   · la ENVUELTA — cruza medianoche: `1440 - (ini - fin)`. Es la que calculan hoy `durForm`
     y `_bloqDur_`, las dos, **sin decirlo en ningun sitio**.
   · la INVERTIDA — la persona escribio la salida donde iba la entrada: `ini - fin`.
   Cual quiso NO se puede saber desde fuera. Lo que si se puede preguntar es cual de las dos
   es **legal**, y el arbitro no se elige: es el mismo tope que ya aplica el servidor.

   ⛔ EL UMBRAL NO SE ELIGE, SE DERIVA de `_maxHorasParte_()`. Por eso aqui no hay ningun
   `600` escrito a mano: si manana el tope baja a 12 h, la banda de duda **se cierra sola**.
   Un numero fijo seria el guardia que canta sobre trabajo bien hecho — y la muestra real
   para calibrarlo es **n=8**, demasiado poca para calibrar nada. Se DERIVA justamente
   porque no se puede calibrar.

   Los tres estados son EXHAUSTIVOS, porque `env + inv = 1440` siempre:
   · `'inversion'` — la envuelta PASA del tope, o sea que **no es admisible**: la invertida es
     la unica lectura legal. Se AVISA de que parece del reves.
   · `'duda'`      — **las dos caben**. La maquina no puede decidir: se PREGUNTA.
   · `'noche'`     — solo cabe la envuelta (la invertida pasa del tope, SIEMPRE). Es un turno
     nocturno legitimo: se INFORMA, no se advierte.
   · `''`          — no cruza (`fin >= ini`), o no son horas: no hay nada que decir.

   MEDIDO sobre los **4.560** pares con `fin < ini` de la rejilla real (96x96, cuartos de
   hora): la particion sale **2.964 `inversion` / 816 `duda` / 780 `noche`**, y la banda de
   duda es **SIMETRICA** — `[10 h, 14 h]` con el tope en 14.
   Y sobre datos REALES, **0 falsos positivos de 31** (los 8 partes con horas del repo y los
   23 turnos): el unico que cruza —el parte real `21:45-00:15`— sale `'noche'`, que informa
   y no advierte.

   ⛔ DECIDE Y DEVUELVE UN CODIGO; LA FRASE LA REDACTA CADA CARA. Mismo patron que
   `_avisoMesDelBloque_`: las dos caras no dicen las cosas igual, y meter el texto aqui
   obligaria a que si.
   ⛔ Y NO RECHAZA NADA, a proposito. Hay turno nocturno REAL en produccion (`05/08
   21:45-00:15`), asi que un `fin < ini` que se plante rompe un parte legitimo de cada uno
   que exista. Esto avisa; decidir es de la persona.
   ⚠️ Y TAMPOCO CABE EN EL SERVIDOR, medido: el cliente manda `23:00`, `02:00`, `horas: 3`,
   que es **internamente consistente** — el servidor recalcularia 3 y no veria nada. Tiene
   ESTRICTAMENTE MENOS informacion que la cara: no tiene a quien preguntar.
   ⚠️ La guarda de forma no es adorno: `_minHM_` con basura devuelve **0**, no `NaN`, asi que
   sin ella `_cruceNoche_('10:00', null)` saldria `'duda'` sobre un formulario a medias. */
function _cruceNoche_(iniHM, finHM, topeH){
  var re=/^\d{1,2}:\d{2}$/;
  if(!re.test(String(iniHM==null?'':iniHM)) || !re.test(String(finHM==null?'':finHM))) return '';
  var ini=_minHM_(iniHM), fin=_minHM_(finHM);
  if(fin>=ini) return '';
  var tope=(topeH==null?_maxHorasParte_():topeH)*60;
  var inv=ini-fin, env=1440-inv;
  if(env>tope) return 'inversion';
  return inv>tope ? 'noche' : 'duda';
}

/* ═══ POR QUE NO VALE ESA DURACION · UNA PUERTA PARA LAS DOS CARAS ══════════════════════
   Las dos caras hacian la misma pregunta y contestaban con UN solo mensaje que tapaba TRES
   causas distintas -- y en dos de ellas mentia:

   · El escritorio decia «La salida tiene que ser posterior a la entrada» y eso salta tambien
     con un bloque de SIETE MINUTOS: `_bloqDur_` redondea a cuartos de hora, asi que
     `Math.round(7/15)/4` es **0** sobre un rango perfectamente ordenado. Quien lo lee va a
     mirar las horas, que estan bien.
   · El movil decia «Falta la duracion» y eso sale tambien cuando la duracion ESTA y **pasa
     del tope**, que es justo lo contrario de faltar.

   ⛔ DECIDE Y DEVUELVE UN CODIGO; LA FRASE LA REDACTA CADA CARA -- mismo patron que
   `_avisoMesDelBloque_` y `_cruceNoche_`: las dos caras no dicen las cosas igual.
   · `''`      — la duracion vale.
   · `'sin'`   — no hay ninguna sesion ni bloque que medir.
   · `'largo'` — la hay y **pasa del tope**. Va ANTES que nada: es el unico caso en que el
     numero existe y se puede enseñar, y decirle «falta» a alguien que ha puesto quince horas
     le manda a rellenar lo que ya tiene.
   · `'corto'` — el rango esta bien ordenado pero **redondea a cero**: menos de 7,5 minutos.
   · `'cero'`  — entrada y salida son la misma hora, o no se sabe cuanto dura.
   ⚠️ `crudoMin` es OPCIONAL: sin el no se puede distinguir «corto» de «cero», y entonces se
   contesta `'cero'` en vez de adivinar. Un «no lo se» no se disfraza del caso concreto. */
function _pegaDeDuracion_(dur, tope, crudoMin){
  if(typeof dur !== 'number' || !isFinite(dur)) return 'sin';
  if(typeof tope === 'number' && isFinite(tope) && dur > tope) return 'largo';
  if(dur > 0) return '';
  if(typeof crudoMin === 'number' && isFinite(crudoMin) && crudoMin > 0) return 'corto';
  return 'cero';
}

/* ═══ EL RELOJ DE UNA SESION DE FICHAJE · UNA PUERTA PARA LAS DOS CARAS ══════════════════
   Vive aqui desde el 14/08 porque **el escritorio tambien ficha**. Hasta hoy esta cuenta
   —minutos de pared desde `ini`, tope de un parte, menos las pausas— estaba solo en
   `horas.movil.js`, y copiarla habria sido la tercera version de la MISMA regla en el mismo
   runtime: [[feedback_una_sola_puerta_por_servicio]] («cinco copias acaban siendo cinco
   funciones distintas, y las diferencias son los bugs»).

   ⚠️ GEMELA EN OTRO RUNTIME: `_pausaMs_` del backend hace esta misma cuenta en milisegundos.
   No se pueden fundir —son runtimes distintos— pero **si cambia la semantica de `pausas`, hay
   que tocar las dos**. Mapa §5, D7.
   ⚠️ Y HOY NO DICEN LO MISMO EN UN CASO, medido, que se HEREDA del movil y se conserva a
   proposito para no cambiar de paso lo que ensena la otra cara: el backend RECORTA cada pausa
   a la ventana del parte (`_pausaMs_(pausas, finMs)` con `finMs` ya topado) y esto no. Una
   sesion de 30 h con una pausa de 1 h en la hora 20: el servidor cierra 14 h y esta cuenta
   pone 13 h en pantalla. Solo se alcanza POR ENCIMA del tope, donde el barrido del gate
   —cada 2 min— normalmente ya ha cerrado la sesion. Apuntado, no arreglado aqui.
   ⚠️ Y ESE RECORTE TIENE UNA SEGUNDA CARA que aqui no estaba dicha: una pausa ABIERTA
   cuenta hasta `Date.now()` **sin techo**, mientras el backend la recorta a `finMs`. Es
   la misma divergencia -- el recorte a la ventana -- vista desde el tramo abierto, y se
   alcanza por el mismo sitio: por encima del tope. Tambien apuntada, tambien sin tocar.
   ✅ Lo que SI se arreglo el 19/08 es la tercera diferencia, que no era deliberada: la
   guarda de TIPO. Ver abajo. */
function _pausaMin_(pausas){
  var now=Date.now(), t=0;
  /* ⛔ LA GUARDA DE TIPO, QUE LA GEMELA YA TENIA. `_pausaMs_` del backend empieza con
     `Array.isArray(pausas) ? pausas : []` desde siempre; aqui habia `(pausas||[])`, que
     para el `null` y **no** para una cadena ni un objeto: los dos entran por la izquierda
     del `||` y despues se les llama un `forEach` que no tienen. Eso no da un numero raro:
     **lanza**, y se lleva por delante el repintado de la pantalla de quien esta fichando.
     ⚠️ Y `pausas` viene del backend POR LA RED, que es de donde llegan las formas que uno
        no escribio. Medido el 19/08: con `'x'` y con `{}` la funcion reventaba. */
  (Array.isArray(pausas) ? pausas : []).forEach(function(p){
    var pi=Date.parse(p.ini), pf=p.fin?Date.parse(p.fin):now;
    if(pf>pi) t+=(pf-pi);
  });
  return Math.round(t/60000);
}

/* Minutos NETOS de una sesion abierta en el servidor: reloj de pared desde `ini`, topado al
   maximo de un parte, menos las pausas, con suelo 0. En pausa el reloj se queda quieto porque
   el tramo abierto cuenta hasta ahora en las dos restas.
   ⛔ EL TOPE SALE DE `_maxHorasParte_()`, no de un 840 escrito a mano. El movil llevaba ese
   numero suelto: dos numeros para el mismo tope es como el `12` de `validarFichaje` y el `14`
   del servidor acabaron bloqueando por pantalla un parte que era legal. */
function _minSesion_(ini, pausas){
  if(!ini) return 0;
  var tope=_maxHorasParte_()*60;
  var pared=Math.round((Date.now()-Date.parse(ini))/60000);
  return Math.max(0, Math.min(tope, pared) - _pausaMin_(pausas));
}

/* HH:MM **LOCAL** de una fecha ISO (la hora de apertura que da el servidor).
   ⛔ Y NO `iso.slice(11,16)`: el backend sella los fichajes con `toISOString()`, o sea UTC,
   asi que recortar la cadena ensena la hora de Greenwich — en verano espanol, DOS HORAS
   ANTES de la real. Ese era el fallo vivo de «Fichajes en curso» (ver el paso E). */
function _hhmmDe_(iso){ var d=new Date(iso); return pad(d.getHours())+':'+pad(d.getMinutes()); }

/* Que es «la imputacion» de un parte: UN solo sitio, para que lo que se VALIDA y lo que se
   ENVIA no puedan desincronizarse en silencio (que es como estuvieron un tiempo en el movil).
   Vive aqui desde el 14/08 porque el escritorio ficha con la misma regla. */
function _imputacion_(f){ return f.cat==='tareas' ? (f.tarea==='__otro__' ? f.detalle.trim() : f.tarea) : f.detalle.trim(); }

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
    { id:'2026-08-20-exencion-primer-mes', fecha:'2026-08-20',
      titulo:'El primer mes ya no lleva cuota tambi\u00e9n en la app',
      items:[
        {cara:'movil', vista:'estado', txt:'**Quien est\u00e1 en su primer mes ve 0,00 \u20ac, y ve POR QU\u00c9.** Lo decidiste el 15/08 \u2014*\u00abel primer mes\u2026 deber\u00edan no ponerle la cuota\u00bb*\u2014 y el motor lo aplicaba desde entonces, pero **la pantalla no se hab\u00eda enterado**: calculaba la cuota en directo sin saber de la exenci\u00f3n. El 1 de septiembre las 32 pas\u00e1is a cero meses cerrados a la vez, y ah\u00ed la curva clava **67,80 \u20ac** \u2014la cuota m\u00e1s cara que existe\u2014 mientras lo archivado son **0,00**.'},
        {cara:'escritorio', vista:'estado', txt:'**Y el perd\u00f3n ya no se le cuelga al coche.** El recibo calculaba el descuento como *base menos lo que pagas*, as\u00ed que con la exenci\u00f3n el importe entero sal\u00eda como \u00abPor poner el coche \u00b7 0 turnos\u00bb \u2014a quien no ha conducido nunca. Ahora tiene su propia l\u00ednea, **Tu primer mes**: un 0 \u20ac sin motivo al lado no se distingue de un 0 \u20ac por el suelo del descuento del coche.'}
      ] },
    { id:'2026-08-19-subcoordinacion-en-las-caras', fecha:'2026-08-19',
      titulo:'Una subcoordinaci\u00f3n ya cuenta como coordinaci\u00f3n en las dos caras',
      items:[
        {cara:'escritorio', vista:'turnos', txt:'**Quien tiene una subcoordinaci\u00f3n ya ve los paneles de coordinaci\u00f3n.** El servidor le daba rango de coordinaci\u00f3n \u2014por eso le dejaba entrar al ordenador\u2014 y una vez dentro las pantallas no le ense\u00f1aban **ninguno**: ni convocar turno, ni el bloque de horas, ni el desglose de disponibilidad con nombres. La pantalla ten\u00eda el dato bueno y preguntaba a otro sitio.'},
        {cara:'movil', vista:'reu', txt:'**Y en el tel\u00e9fono ya puede convocar algo que no sea una reuni\u00f3n de trabajo.** El m\u00f3vil decid\u00eda mirando s\u00f3lo el **cargo**, as\u00ed que a quien tiene gente a su cargo sin figurar como coordinador le ofrec\u00eda un solo tipo \u2014mientras el ordenador y el servidor le admit\u00edan los seis.'}
      ] },
    { id:'2026-08-19-docs-ninguna-lista', fecha:'2026-08-19',
      titulo:'Documentos: ya no se pierde ningún expediente entre las listas',
      items:[
        {cara:'escritorio', vista:'docdec', txt:'**«Publicados» ahora es «Resueltos»**, y lista también los **rechazados**. Antes, al rechazar un expediente desaparecía de las tres vistas —también para su autor, que aquí no tiene ninguna lista propia—, así que se lo rechazaban y no se enteraba por esta pantalla.'},
        {cara:'escritorio', vista:'docurso', txt:'**Y «En curso» ya no se deja fuera lo que se está publicando.** Cuando el pipeline vuelve a publicar un documento, queda un rato en «publicando»: hasta ahora ese estado no salía ni aquí ni en publicados, así que el expediente **desaparecía de la pantalla** mientras duraba. Los números del menú y las listas salen ya del mismo sitio, así que no pueden decir cosas distintas.'},
        {cara:'movil', vista:'docs', txt:'**El segundo revisor ve «En curso» en el teléfono.** El servidor le mandaba el pipeline entero del equipo y la pantalla sólo se lo enseñaba al Project Director — y si no tenía nada propio, le decía «Nada por aquí» teniendo la lista cargada.'}
      ] },
    { id:'2026-08-19-docs-anotaciones-y-calidad', fecha:'2026-08-19',
      titulo:'Documentos: el título de «con anotaciones», tus etiquetas y el chip de calidad',
      items:[
        {cara:'movil', vista:'docs', txt:'**«Aprobar con anotaciones» ahora te pide el título** antes de mandarlo, como ya hacía el ordenador. Antes salía sin él: el documento quedaba diciendo que le habías ajustado el título y las etiquetas **sin haber ajustado nada**, y al autor no se le podía decir qué le habías cambiado.'},
        {cara:'movil', vista:'docs', txt:'**Y ya no se pierden tus etiquetas.** Si dejabas el título en blanco se caían también las etiquetas que acababas de escribir — y como el teléfono sí te las enseñaba cambiadas, **volvían solas** al refrescar. Vaciarlas del todo sigue valiendo: es una decisión tuya, no un descuido.'},
        {cara:'movil', vista:'docs', txt:'**El chip de calidad ya no miente.** Una calidad que el pipeline no sepa medir salía en **verde** —el color de «salió bien»— y con el texto «calidad undefined». Ahora sale en gris y dice **«calidad sin medir»**, que es lo que se sabe.'}
      ] },
    { id:'2026-08-19-coches-no-se-guardaron', fecha:'2026-08-19',
      titulo:'Si el trayecto de los coches no se guarda, ahora te lo dice',
      items:[
        {cara:'escritorio', vista:'turnos', txt:'Al convocar, el turno se crea en Notion y el **trayecto de los coches** se guarda aparte, en el servidor. Si eso segundo falla, el turno sigue existiendo —y así tiene que ser: reintentar te diría «ya hay turno ese día»—, pero **hasta ahora no te enterabas**: salía «Turno convocado en Notion» y los kilómetros no estaban en ningún sitio. El servidor ya lo contestaba; **nadie lo leía**. Ahora, si habías puesto coches y no se guardaron, el aviso te lo dice y te dice qué hacer.'}
      ] },
    { id:'2026-08-19-articulo-rri-correcto', fecha:'2026-08-19',
      titulo:'Dos de los seis motivos de sanción llevaban el artículo cambiado',
      items:[
        {cara:'escritorio', vista:'sanciones', txt:'La lista de motivos se ve igual, pero **el artículo que salía era otro**: «no rellenar un formulario» iba como **Art. 30g** —que es el Doodle general— y «no cubrir la disponibilidad» como **30h** —que es el de subsistema **reiterado**, a partir de 2 veces—. ⛔ Y el artículo **no es decoración**: es lo que decide en qué cuenta suma la reincidencia (0 / −1 / −2). 📏 Medido sobre el registro real: si hoy sancionabas por formulario, **10 de 14 personas** habrían recibido puntos distintos de los que les tocan, 9 de ellas **de más** — y su contador de formulario no avanzaba nunca. Ahora salen **29i** y **30g**.'},
        /* En el móvil las sanciones NO son una pantalla: salen del **menú**
           (`_abrirSanciones_`, un modal), así que la vista que se señala es la de
           inicio — igual que el buzón. Lo dice ya la entrada del 18/08 de aquí abajo. */
        {cara:'movil', vista:'estado', txt:'Lo mismo en el móvil (**menú → Sanciones**): el catálogo es una copia literal del del ordenador, así que el fallo estaba en las dos caras — y ésta es desde la que se sanciona sobre la marcha.'}
      ] },
    { id:'2026-08-19-duracion-las-dos-caras', fecha:'2026-08-19',
      titulo:'Las dos pantallas comparten quién decide por qué no vale una duración',
      items:[
        {cara:'escritorio', vista:'horas', txt:'**Las dos pantallas ya preguntan lo mismo**: hay una sola función que decide *cuál* de las cuatro causas invalida una duración, y cada pantalla escribe su frase. Antes cada una decidía por su cuenta, y por eso se contradecían. ⚠️ **Corrección**: aquí ponía que además arreglaba el aviso «con la entrada y la salida en blanco». **No se puede llegar a ese estado**: los campos de hora son desplegables sin opción vacía, así que un bloque nuevo siempre trae una hora puesta. El aviso existe, pero no vas a verlo — y decírtelo como si fuera un cambio visible era falso.'},
        {cara:'movil', vista:'horas', txt:'En el móvil pasa lo mismo, y con la misma corrección: lo que cambia de verdad es que **las dos caras comparten la decisión**, no que vayas a ver frases nuevas. Un bloque de siete minutos **no se puede escribir** —las horas van de cuarto en cuarto—, así que ese caso no existía en la pantalla aunque el código lo supiera contestar.'}
      ] },
    { id:'2026-08-19-por-que-no-vale-la-duracion', fecha:'2026-08-19',
      titulo:'Cuando una duración no vale, la app dice POR QUÉ',
      items:[
        {cara:'escritorio', vista:'horas', txt:'Antes, **cualquier** duración que no valiera —incluida la de pasarse del tope— salía con la misma frase: «La salida tiene que ser posterior a la entrada». Ahora cada causa tiene la suya, así que pasarse de las 14 h te lo dice tal cual en vez de mandarte a mirar unas horas que están bien. ⚠️ **Corregido el 19/08**: aquí ponía que esto arreglaba «un bloque de siete minutos», y **ese bloque no se puede escribir**: los campos de hora son desplegables de **cuarto en cuarto** (96 opciones, sin opción vacía), así que no hay forma de teclear 7 minutos. La frase existía y el caso no.'},
        {cara:'movil', vista:'horas', txt:'El botón decía «Falta la duración» también cuando la duración **estaba y pasaba del tope** — o sea que te mandaba a rellenar lo que ya tenías puesto. Ahora te dice que son demasiadas horas.'}
      ] },
    { id:'2026-08-19-coches-del-turno', fecha:'2026-08-19',
      titulo:'Los coches de un turno ya se rellenan, y el trayecto se guarda',
      items:[
        {cara:'escritorio', vista:'turnos', txt:'Al convocar un turno, **«+ añadir coche» ya funciona**: abre sus dos desplegables —de dónde sale y a dónde va— y, si la vuelta no es la misma, los otros dos. Estaba escrito y **el botón no hacía nada**. ⛔ Y el trayecto **viaja con el turno**: hasta ahora lo único que llegaba era «esta persona lleva coche», **sin decir de dónde a dónde** — y es el trayecto el que decide el descuento de **4 € por turno**. ⚠️ No deja convocar un coche a medias, y al convocar se vacía para que el turno siguiente no arrastre los kilómetros del anterior. ⚠️ Falta decidir en qué columna de Notion cae; hoy vive en el servidor y vuelve con cada turno, y necesita **desplegarlo**.'}
      ] },
    { id:'2026-08-19-ritmo-del-motor', fecha:'2026-08-19',
      titulo:'Tu ritmo h/mes sale del motor, no se lo calcula la pantalla',
      items:[
        {cara:'movil', vista:'horas', txt:'La pantalla se calculaba tus **h/mes** por su cuenta dividiendo horas entre meses, en vez de leer el ritmo que ya calcula el motor — que es el que pondera **julio y agosto a la mitad**. Eran dos números para lo mismo. ⚠️ Hoy cambia poco (16 de 32, como mucho **0,37 €**) porque el panel subido se generó sin el histórico; se vuelve correcto cuando se suba uno con él.'},
        {cara:'escritorio', vista:'ranking', txt:'Lo mismo en la clasificación y en la cuota del escritorio: el ritmo ya no se recalcula aquí.'}
      ] },
    { id:'2026-08-19-aviso-documentos', fecha:'2026-08-19',
      titulo:'La app ya te avisa al móvil de tus documentos',
      items:[
        {cara:'escritorio', vista:'ajustes', txt:'El interruptor de **Documentos** ya no dice «hoy no se manda ninguno de este tipo»: ahora sí se mandan. Te llega un aviso cuando **deciden sobre lo tuyo** —aprobado, cambios o rechazado— y, si eres revisor, cuando **entra algo que te toca revisar a ti** por tu unidad o tu cargo, no a los dos revisores fijos. ⛔ Y sigue siendo de los que **puedes apagar** desde aquí.'},
        {cara:'movil', vista:'docs', txt:'Lo mismo en el móvil: la decisión sobre tu documento te llega sin tener que entrar a mirar. ⚠️ Necesita el despliegue del backend para empezar a funcionar.'}
      ] },
    { id:'2026-08-19-sustituir-documento', fecha:'2026-08-19',
      titulo:'La app ya explica cómo sustituir un documento publicado',
      items:[
        {cara:'movil', vista:'docs', txt:'Si tu documento **ya está publicado** y tienes una versión nueva, la ficha te dice los pasos. ⛔ Y **no son los de corregir**: aquí es un envío **nuevo**, marcado como «sustituye a» con la referencia de éste. Seguir los de corregir —misma referencia— **le pisaría el archivo al documento que el equipo está leyendo**. El original no se borra: sigue publicado hasta que aprueben el nuevo.'},
        {cara:'escritorio', vista:'docs', txt:'Lo mismo en la tarjeta del escritorio, donde además decía «Es tuyo: lo firma X» sobre algo que **ya estaba firmado**.'}
      ] },
    { id:'2026-08-19-botones-reunion-verdad', fecha:'2026-08-19',
      titulo:'Los botones de una reunión ya dicen la verdad',
      items:[
        {cara:'movil', vista:'reu', txt:'«Fijar fecha», «Cancelar fijado» y «Orden del día» salían para **cualquier coordinador**, y el servidor solo se los acepta a **quien convocó la reunión** (o al admin). Si no era tuya, abrías el modal, elegías el día, arrastrabas las franjas, pulsabas Confirmar… y te decía que no. Ahora sólo salen si de verdad puedes. ⚠️ Si la convocaste tú, **igual que antes**.'}
      ] },
    { id:'2026-08-19-cuota-en-cero-meses', fecha:'2026-08-19',
      titulo:'La nota de tu cuota ya no dice \u00ab0 meses\u00bb',
      items:[
        {cara:'escritorio', vista:'horas', txt:'Debajo del importe explic\u00e1bamos de d\u00f3nde sale: \u00abde tus 132 h de la temporada en 11 meses dentro del equipo\u00bb. Correcto \u2014 salvo si llevas **cero meses cerrados**, donde pon\u00eda \u00aben 0 meses\u00bb y describ\u00eda una divisi\u00f3n que **no se hace**: sin ning\u00fan mes cerrado tus horas se usan **tal cual, sin dividir**. Ahora lo dice as\u00ed, y de paso te explica por qu\u00e9 tampoco sales todav\u00eda en la clasificaci\u00f3n.'},
        {cara:'escritorio', vista:'horas', txt:'\u26a0\ufe0f Y hab\u00eda un tercer caso escondido: si el panel **no trae** cu\u00e1ntos meses llevas, se pintaba un **0** igual que a quien de verdad no ha cerrado ninguno. No es lo mismo \u2014 uno es un dato y el otro es \u00abno lo s\u00e9\u00bb \u2014, y ahora se distingue.'}
      ] },
    { id:'2026-08-19-ranking-numero-fresco', fecha:'2026-08-19',
      titulo:'El filtro del ranking ya mira un n\u00famero de HOY',
      items:[
        {cara:'escritorio', vista:'ranking', txt:'Ayer se puso que quien no ha cerrado ning\u00fan mes no sale en la tabla. El filtro estaba bien \u2014 pero le\u00eda un n\u00famero que **s\u00f3lo se refrescaba al recalcular el umbral**, no al subir el panel: pod\u00eda ser de hace d\u00edas. Ahora se reescribe **cada vez que se arma el panel**.'},
        {cara:'escritorio', vista:'ranking', txt:'\u26a0\ufe0f **Y por qu\u00e9 importa la fecha**: el **1 de septiembre** la temporada nueva empieza con **cero meses cerrados para los 32 a la vez**. Con el n\u00famero viejo, el m\u00f3vil te habr\u00eda dicho \u00abSin puesto todav\u00eda\u00bb y esta tabla habr\u00eda seguido pintando **la clasificaci\u00f3n entera de la temporada pasada**, como si fuera la de esta. Las dos pantallas contestaban a la misma pregunta y una de las dos iba a mentir.'}
      ] },
    { id:'2026-08-19-ranking-primer-cierre', fecha:'2026-08-19',
      titulo:'La clasificación empieza en tu primer cierre de mes',
      items:[
        {cara:'escritorio', vista:'ranking', txt:'Quien todavía **no ha cerrado ningún mes** ya no sale en la tabla del ranking: hasta el primer cierre no hay con qué compararle. Antes salía, y no discretamente — con cero meses sus horas **no se dividen por nada**, así que un alta con 40 h entraba directa por arriba. Y ahora **se dice al pie** a cuántas personas deja fuera, que es lo que faltaba: un filtro mudo se lee como un fallo.'},
        {cara:'escritorio', vista:'ranking', txt:'⚠️ Pero **siguen contando en «CUOTA MEDIA» y en «A CERO»**: sus horas mueven la cuota de todo el equipo, así que ahí sí entran. Y si no hay ninguna fila —lo que pasará el **1 de septiembre**, cuando la temporada nueva deja a las 32 sin cierres a la vez— sale «Todavía no hay clasificación» en vez de una tabla vacía.'},
        {cara:'movil', vista:'horas', txt:'En el móvil ya funcionaba solo: sin puesto sale «Sin puesto todavía» en vez de un número inventado.'}
      ] },
    { id:'2026-08-19-globo-reuniones', fecha:'2026-08-19',
      titulo:'El globo rojo de Reuniones ya cuenta lo que te falta a ti',
      items:[
        {cara:'movil', vista:'reu', txt:'El número rojo de la pestaña **Reuniones** miraba **la reunión que tuvieras abierta**, no las que te faltan por cubrir. Con dos convocadas, si la más próxima ya la habías cubierto, **la que cerraba mañana no avisaba** — y de no cubrir a tiempo salen puntos (Art. 30g). Encima el globo cambiaba según lo que mirabas: abrir una reunión ya cubierta te apagaba tu propio aviso. Ahora cuenta **cuántas te faltan de verdad**, y dice el número, no un «hay algo».'},
        {cara:'movil', vista:'reu', txt:'Y si **la convocas tú**, ya no te sale globo: organizas, no cubres. Antes lo llevabas encendido siempre, y al tocarlo la propia pantalla te decía que a ti no se te pide disponibilidad.'}
      ] },
    { id:'2026-08-19-doc-corregir-dos-pasos', fecha:'2026-08-19',
      titulo:'Corregir un documento: la app ya te dice los dos pasos',
      items:[
        {cara:'movil', vista:'docs', txt:'Si te piden cambios, el botón decía «Reenviar corregido» y **no sube nada**: sólo devuelve el expediente a la cola. Ahora dice lo que hace —«Ya está corregido: devolver a revisión»— y encima salen **los dos pasos**: reenviar el archivo corregido por el formulario **con la MISMA referencia** (⚠️ no como «sustituye a…», que crearía un expediente nuevo y dejaría éste con la versión mala) y luego volver y pulsar. Y en ese orden: al pulsar **se borra el motivo** que te escribieron, que es donde pone qué corregir.'},
        {cara:'movil', vista:'docs', txt:'Y el aviso de después ya no te confirma algo que no ha pasado: si no has subido el archivo, te dice que el revisor verá la versión anterior. Antes ponía «Reenviado a revisión.» y se te apagaba el globo, así que te ibas convencido.'},
        {cara:'escritorio', vista:'docs', txt:'Las mismas instrucciones en el escritorio. ⚠️ Falta **el enlace al formulario**: hasta que lo tengamos, la app te dice a quién pedírselo en vez de mandarte a una página que no existe.'}
      ] },
    { id:'2026-08-19-doc-analisis-completo', fecha:'2026-08-19',
      titulo:'La ficha ya enseña las Acciones y los Pendientes del documento',
      items:[
        {cara:'movil', vista:'docs', txt:'El análisis que hace Cowork trae seis secciones y la ficha sólo pintaba cuatro: faltaban **Acciones** —los compromisos que crea el documento, con responsable y fecha— y **Pendientes** —lo que queda abierto—. Son justo lo que decide **aprobar o pedir cambios**, así que se firmaba sin verlas. Ya salen, y debajo la línea de números («2 decisiones · 3 acciones»).'},
        {cara:'escritorio', vista:'docs', txt:'Lo mismo en la tarjeta del escritorio. Y la lista de secciones vive ahora en **un solo sitio** para las dos caras: la siguiente que añada el pipeline entra en las dos o en ninguna, que es como se perdieron estas.'}
      ] },
    { id:'2026-08-19-doc-etiquetas', fecha:'2026-08-19',
      titulo:'«Aprobar con anotaciones» ya ajusta también las etiquetas',
      items:[
        {cara:'movil', vista:'docs', txt:'El botón dice «con anotaciones» y hasta hoy sólo dejaba corregir el **título**: las **etiquetas** no se podían tocar, aunque el servidor lleva desde siempre sabiendo aplicarlas. Ya salen en la ficha y hay un campo para ajustarlas al firmar —separadas por comas—. Se ven **aunque no te toque decidir**, para que el autor sepa con cuáles le publicaron su documento.'},
        {cara:'escritorio', vista:'docs', txt:'Lo mismo en la tarjeta del expediente: las etiquetas se ven y se ajustan al aprobar con anotaciones.'}
      ] },
    { id:'2026-08-19-doc-trabado-y-revision', fecha:'2026-08-19',
      titulo:'La ficha te avisa si el expediente está trabado o es una revisión',
      items:[
        {cara:'movil', vista:'docs', txt:'Si Cowork manda un expediente **trabado** —le falta algo y hace falta arreglarlo a mano: una referencia sin rellenar, anexos que no están, un **Acta**, que no existe como tipo en Notion— la ficha te lo dice **con el motivo escrito**, antes del resumen. Es un aviso, no un candado: sigues pudiendo decidir, pero ahora lo sabes. Antes esa información llegaba al servidor y **no la veía nadie** en esta cara.'},
        {cara:'movil', vista:'docs', txt:'Y si lo que te toca firmar es la **segunda versión** de un documento, la ficha te dice **a cuál sustituye** y que el original sigue publicado. Es una `ref` nueva, no una edición del anterior, así que no es lo mismo que juzgar un envío de primera vuelta.'},
        {cara:'escritorio', vista:'docs', txt:'Los dos avisos salen también en el escritorio, en la tarjeta del expediente. Y **sólo cuando los hay**: la mayoría no traen ninguno, y un «sustituye a: —» en todas las fichas es ruido que se aprende a saltar.'}
      ] },
    { id:'2026-08-18-reu-se-refresca', fecha:'2026-08-18',
      titulo:'La reunión que tienes abierta ya se actualiza sola',
      items:[
        {cara:'escritorio', vista:'reuniones', txt:'El mapa de calor, el contador de cobertura y la lista de quién no ha cubierto se quedaban **como estaban al entrar**: aunque la gente fuera contestando, la pantalla no se enteraba hasta recargar. Ahora se actualiza sola cada 20 segundos, como en el móvil. Importa al **fijar** una reunión —se decidía sobre un mapa viejo— y en «Disponibilidad y riesgo», donde la lista podía señalar a alguien que **ya había contestado**.'}
      ] },
    { id:'2026-08-18-riesgo-anonima', fecha:'2026-08-18',
      titulo:'La lista de riesgo ya no nombra a quien sí cubrió',
      items:[
        {cara:'escritorio', vista:'reuniones', txt:'En una reunión **anónima**, el panel de riesgo daba por no cubierta la disponibilidad de todo el que no fueras tú —porque sus filas llegan sin nombre— y **los listaba con nombre y apellidos** bajo «Sin cubrir», con su chip de la sanción que implicaría. Ahora dice **cuántos** han cubierto, que eso sí se sabe, y **no nombra a nadie**.'}
      ] },
    { id:'2026-08-18-doc-te-lo-cuentan', fecha:'2026-08-18',
      titulo:'Tu documento rechazado ya te dice por qué',
      items:[
        {cara:'movil', vista:'docs', txt:'Si te **rechazan** un expediente, ahora la ficha te dice **el motivo, quién lo decidió y cuándo**. Antes ahí ponía «Este expediente lo revisa Fulano. Tú no decides aquí» —sobre tu propio documento—, y el motivo sólo llegaba por correo. Lo mismo cuando te lo **aprueban**: antes tampoco se te contaba.'},
        {cara:'movil', vista:'docs', txt:'Y si te lo aprobaron **con anotaciones**, la app te dice **qué te cambiaron** —el título, las etiquetas—. Esa parte de la acción no se veía en ningún sitio: te cambiaban el título de tu documento y te enterabas comparándolo de memoria.'},
        {cara:'escritorio', vista:'docs', txt:'Al revisar, la **decisión anterior** ya lleva **la fecha** y, si fue «con anotaciones», **qué se ajustó** — que es lo que hay que juzgar para decidir si la pisas. Y sobre un aprobado ya no dice «Sin motivo escrito»: un aprobado no lleva motivo, así que esa frase mandaba a buscar una explicación que nunca existió.'}
      ] },
    { id:'2026-08-18-desglose-cuadra', fecha:'2026-08-18',
      titulo:'El desglose del mes ya dice el mismo número que la tarjeta',
      items:[
        {cara:'movil', vista:'horas', txt:'La tarjeta de **Horas** decía una cifra y la ventana que se abre al tocar «Ver el desglose completo» decía **otra**, las dos rotuladas «h este mes». La tarjeta ya contaba reuniones, cursos y turnos de fabricación; la ventana sumaba **sólo tus partes**, así que con tres turnos había **12 h de diferencia**. Ahora las dos leen el mismo dato. Y si el servidor todavía no lo sabe, la ventana suma tus partes **y lo dice**: pone «que cuentan» en vez de «este mes».'},
        {cara:'movil', vista:'horas', txt:'Y el **título** de esa ventana sale del mes de trabajo, no del reloj del teléfono. Un mes va **de cierre a cierre**: julio se cerró el 4 de agosto, así que del 1 al 4 la ventana se titulaba «Desglose de agosto» y listaba los partes de **julio**.'}
      ] },
    { id:'2026-08-18-minimo-avisa', fecha:'2026-08-18',
      titulo:'El mínimo de franjas avisa, no te bloquea',
      items:[
        {cara:'movil', vista:'reu', txt:'Mientras marcas disponibilidad, la app te dice **cu\u00e1ntas franjas te faltan para el m\u00ednimo sin sanci\u00f3n**, no un n\u00famero suelto. Y **puedes entregar menos**: se guarda igual, pero te avisa antes de que te llegue la propuesta de puntos.'}
      ] },
    { id:'2026-08-18-plazo-ultimo-dia', fecha:'2026-08-18',
      titulo:'El último día del plazo ya cuenta',
      items:[
        {cara:'movil', vista:'reu', txt:'Si una reuni\u00f3n \u00abcierra el 20/08\u00bb, ahora el **d\u00eda 20 cuenta entero**. Antes el servidor cerraba a las 00:00 de ese d\u00eda y quien cubr\u00eda se llevaba el aviso por no responder. Y si el plazo ya pas\u00f3, **la pantalla te lo dice** en vez de dejarte marcar y fallar al guardar.'}
      ] },
    { id:'2026-08-18-minimo-exigido', fecha:'2026-08-18',
      titulo:'El mínimo de franjas ya es el mismo que el del motor',
      items:[
        {cara:'movil', vista:'reu', txt:'Mientras marcas tu disponibilidad, el tel\u00e9fono ya te dice **cu\u00e1ntas franjas te piden** \u2014 el n\u00famero contra el que se decide si te cae una sanci\u00f3n. Antes s\u00f3lo estaba en el ordenador, y encima ped\u00eda **una menos** de la que el motor exige.'}
      ] },
    { id:'2026-08-18-hueco-minimo-e', fecha:'2026-08-18',
      titulo:'Marcar disponibilidad en el ordenador ya exige el hueco entero',
      items:[
        {cara:'escritorio', vista:'convoc', txt:'Al marcar cu\u00e1ndo puedes, **un clic marca lo que dura la reuni\u00f3n** \u2014 como en el tel\u00e9fono. Media hora suelta para una reuni\u00f3n de hora y media no serv\u00eda para ir, y encima el m\u00f3vil te la borraba despu\u00e9s. Y si algo se queda corto, ahora **te lo dice**.'}
      ] },
    { id:'2026-08-18-aprobada', fecha:'2026-08-18',
      titulo:'Un fichaje aprobado ya no dice «otorgada»',
      items:[
        {cara:'movil', vista:'horas', txt:'Un parte que trabajaste y te firmaron ya dice **\u00abaprobada\u00bb**, no \u00abotorgada\u00bb \u2014 esa palabra queda para las horas que te **da** la coordinaci\u00f3n. Y la tarjeta del mes las ense\u00f1a por separado: **\u00abX h aprobadas\u00bb** y **\u00abY h otorgadas\u00bb**.'}
      ] },
    { id:'2026-08-18-mejor-hueco', fecha:'2026-08-18',
      titulo:'«Mejor hueco» ya es donde cabe la reunión entera',
      items:[
        {cara:'escritorio', vista:'convoc', txt:'En el mapa de una reuni\u00f3n, **\u00abmejor franja\u00bb** te dec\u00eda la media hora con m\u00e1s gente \u2014 que no es donde cabe la reuni\u00f3n: si a las 18:00 pueden 12 y a las 18:30 s\u00f3lo 2, ah\u00ed **no cabe** una hora. Ahora dice **el hueco entero** y cu\u00e1nta gente puede **toda** la reuni\u00f3n. Y en vista Ponderada ya no llama \u00abpersonas\u00bb a los puntos.'}
      ] },
    { id:'2026-08-18-tareas-fecha', fecha:'2026-08-18',
      titulo:'«Tus tareas» ya son las tuyas, y la fecha se comprueba',
      items:[
        {cara:'movil', vista:'horas', txt:'Al fichar, el desplegable **\u00abelige una de tus tareas\u00bb** listaba las de **todo el equipo** si tienes permisos de direcci\u00f3n, y se pod\u00eda imputar el rato a la tarea de otra persona. Ya salen s\u00f3lo las tuyas. Y la **fecha** de un bloque declarado a mano ya se comprueba antes de enviarlo: una fecha mal escrita hac\u00eda que esas horas contaran en el mes equivocado \u2014y que se sumaran mes tras mes.'}
      ] },
    { id:'2026-08-18-reuniones', fecha:'2026-08-18',
      titulo:'El mapa ya no dice «nadie ha respondido» con respuestas dentro',
      items:[
        {cara:'movil', vista:'reu', txt:'En el mapa de una reuni\u00f3n, el titular dec\u00eda **\u00abtodav\u00eda no ha respondido nadie\u00bb** aunque hubiera respuestas: pasaba cuando **ninguno puede la reuni\u00f3n entera**, o cuando han contestado que **no pueden ning\u00fan d\u00eda**. Ahora dice cu\u00e1ntos han contestado. Y ya no se puede crear una reuni\u00f3n **sin invitar a nadie** \u2014 una reuni\u00f3n sin lista se le ped\u00eda a todo el equipo.'},
        {cara:'escritorio', vista:'convoc', txt:'Al convocar, el tipo **\u00abConsejo\u00bb** no marcaba a nadie: hab\u00eda que ponerlos a mano. Ya entran solos los del Consejo que sigan activos.'}
      ] },
    { id:'2026-08-18-candado-parte', fecha:'2026-08-18',
      titulo:'Un parte ya no se puede mandar dos veces sin querer',
      items:[
        {cara:'movil', vista:'horas', txt:'Al enviar un parte desde el tel\u00e9fono, el bot\u00f3n **no se apagaba**: dos toques seguidos \u2014o uno mientras el env\u00edo viajaba\u2014 mandaban **las mismas horas dos veces**. Ya se bloquea mientras se env\u00eda, y vuelve si falla. Y si se corta la red y lo reintentas a mano, el servidor **reconoce el env\u00edo** en vez de guardarlo otra vez.'}
      ] },
    { id:'2026-08-18-pildora-doc', fecha:'2026-08-18',
      titulo:'Un expediente rechazado ya no se pinta en verde',
      items:[
        {cara:'movil', vista:'docs', txt:'En la pantalla de **Documentos**, un expediente **rechazado** se pintaba **en verde** \u2014el mismo color que uno aprobado\u2014, y la lista ense\u00f1aba la palabra interna del sistema (\u00abpublicando\u00bb, \u00abanot\u00bb) en vez del nombre en castellano. Ya sale **en rojo** y con su nombre, y la lista y la ficha dicen lo mismo.'}
      ] },
    { id:'2026-08-18-cierre-a-medias', fecha:'2026-08-18',
      titulo:'Un cierre que acaba corto ya no se da por hecho',
      items:[
        {cara:'movil', vista:'estado', txt:'Un cierre del mes que acaba **corto** \u2014porque a alguien ya no se le encuentra la ficha en Notion\u2014 se titulaba **\u00abYa est\u00e1 aplicado\u00bb**, en verde, y **sin bot\u00f3n**: no hab\u00eda forma de terminarlo. Ahora sale **\u00abAplicado a medias\u00bb** en rojo, con **cu\u00e1ntas faltan de cu\u00e1ntas**, y vuelve el bot\u00f3n para terminar lo que queda. Si el cierre se par\u00f3 por un descuadre, el bot\u00f3n **no** vuelve: eso hay que mirarlo antes.'},
        {cara:'escritorio', vista:'cierre', txt:'Un cierre del mes que acaba **corto** \u2014porque a alguien ya no se le encuentra la ficha en Notion\u2014 se titulaba **\u00abYa est\u00e1 aplicado\u00bb**, en verde, y **sin bot\u00f3n**: no hab\u00eda forma de terminarlo. Ahora sale **\u00abAplicado a medias\u00bb** en rojo, con **cu\u00e1ntas faltan de cu\u00e1ntas**, y vuelve el bot\u00f3n para terminar lo que queda. Si el cierre se par\u00f3 por un descuadre, el bot\u00f3n **no** vuelve: eso hay que mirarlo antes.'}
      ] },
    { id:'2026-08-18-cerrar-turno', fecha:'2026-08-18',
      titulo:'El panel de cerrar un turno ya responde',
      items:[
        {cara:'escritorio', vista:'turnos', txt:'El panel **\u00abCerrar un turno\u00bb** se pintaba entero \u2014selector, duraci\u00f3n, qui\u00e9n fue, horas extra, bot\u00f3n\u2014 y **no respond\u00eda a nada**: faltaba engancharlo. Adem\u00e1s s\u00f3lo se pod\u00eda llegar al primer turno de la lista. Ya funciona. Y ahora la tabla incluye tambi\u00e9n a quien figuraba como **\u00abPosible\u00bb o \u00abReserva\u00bb y al final fue**: sale **sin marcar** y con **0 h** de partida, para que lo decidas t\u00fa.'}
      ] },
    { id:'2026-08-18-quien-coordina', fecha:'2026-08-18',
      titulo:'Qui\u00e9n coordina cada unidad, bien \u2014 con la UCT dentro',
      items:[
        {cara:'movil', vista:'estado', txt:'En **men\u00fa \u2192 El equipo**, la lista de qui\u00e9n coordina cada unidad dec\u00eda el **subsistema** de cada coordinador en vez de **lo que coordina** \u2014 as\u00ed que la **Unidad de Documentaci\u00f3n T\u00e9cnica no aparec\u00eda nunca**, y quien coordina algo sin tener el cargo tampoco sal\u00eda. Ya est\u00e1. Y en la pantalla de inicio: el aviso de horas pendientes ya no te nombra un firmante cuando tienes **dos perfiles** (lo decide el subsistema del parte, no tu unidad), y el de documentos con cambios **cuenta** en vez de decir \u00abun documento\u00bb habiendo dos.'}
      ] },
    { id:'2026-08-18-avisos-registro', fecha:'2026-08-18',
      titulo:'Los avisos ya no dicen «activadas» cuando no lo est\u00e1n',
      items:[
        {cara:'escritorio', vista:'estado', txt:'El chip verde de \u00abactivadas\u00bb miraba **s\u00f3lo el permiso del navegador**, no si el servidor sabe a d\u00f3nde mandarte los avisos. Y el ordenador **no volv\u00eda a registrarse nunca** despu\u00e9s de entrar, as\u00ed que cuando el navegador renovaba la suscripci\u00f3n los avisos dejaban de llegar **sin decir nada**. Ahora se registra al entrar, y si no se pudo confirmar el chip dice **\u00absin confirmar\u00bb** y explica por qu\u00e9. Los mensajes de esta pantalla tampoco desaparecen ya solos.'}
      ] },
    { id:'2026-08-18-bloque-a-medias', fecha:'2026-08-18',
      titulo:'Un bloque que se cierra a medias ahora lo dice',
      items:[
        {cara:'escritorio', vista:'sanciones', txt:'Al cerrar un bloque, el servidor **s\u00f3lo aplica las que t\u00fa puedes decidir**. Si alguna es de otra unidad, se la salta \u2014 y hasta ahora la pantalla no lo dec\u00eda: pon\u00eda \u00abBloque cerrado\u00bb y las saltadas **desaparec\u00edan del panel** sin que nadie hubiera decidido sobre ellas. Ahora dice cu\u00e1ntas quedan y **no da el bloque por cerrado** hasta que no quede ninguna. Y \u00abAceptan todas\u00bb ya marca el bloque **de una vez** en vez de una por una.'}
      ] },
    { id:'2026-08-18-mes-contable', fecha:'2026-08-18',
      titulo:'Revertir ya no se ofrece sobre un mes que est\u00e1 cerrado',
      items:[
        {cara:'escritorio', vista:'horas', txt:'Un parte trabajado en los primeros d\u00edas del mes, pero **creado antes de que se aplicara el cierre del mes anterior**, sal\u00eda con su bot\u00f3n **Revertir** y con la promesa \u00abrevertir le resta N h\u00bb. Al pulsarlo, el servidor contestaba que el mes est\u00e1 cerrado. Pasaba todos los meses, entre el d\u00eda 1 y el d\u00eda del cierre. Ahora la pantalla usa **el mismo criterio que el servidor** \u2014el mes de trabajo va **de cierre a cierre**, no del 1 al 31\u2014 y en su lugar dice que ese mes est\u00e1 cerrado y por qu\u00e9.'},
        {cara:'movil', vista:'horas', txt:'Lo mismo en la cola de partes del m\u00f3vil: donde antes sal\u00eda el bot\u00f3n, ahora sale la raz\u00f3n.'}
      ] },
    { id:'2026-08-18-riesgo-oculta', fecha:'2026-08-18',
      titulo:'Qui\u00e9n est\u00e1 en riesgo por no cubrir, sin inventarse a nadie',
      items:[
        {cara:'escritorio', vista:'dispo', txt:'En **Disponibilidad y riesgo** sal\u00eda, reuni\u00f3n por reuni\u00f3n, qui\u00e9n no ha cubierto y qu\u00e9 sanci\u00f3n le caer\u00eda. Fallaban dos cosas: a quien abr\u00eda la encuesta y la dejaba **entera a cero** no le nombraba ninguna de las dos listas \u2014y a \u00e9se el motor s\u00ed le pone los puntos\u2014, y en una reuni\u00f3n **oculta** se inventaba la lista de todos los dem\u00e1s, porque el servidor s\u00f3lo manda tu fila y aqu\u00ed se restaba \u00abconvocados \u2212 los que han contestado\u00bb. Ahora el primero sale donde tiene que salir, y una reuni\u00f3n oculta dice que lo es en vez de listar a nadie. **Cubrir tu disponibilidad sigue igual**: eso no se toca.'}
      ] },
    { id:'2026-08-18-lote-sin-marcar', fecha:'2026-08-18',
      titulo:'El bloque de sanciones ya no viene con todo marcado en \u00abAcepta\u00bb',
      items:[
        {cara:'escritorio', vista:'sanciones', txt:'Cuando el motor agrupa varias sanciones en un bloque, el ordenador te las ense\u00f1aba **todas marcadas en \u00abAcepta\u00bb** sin que t\u00fa hubieras tocado ninguna, con la previsi\u00f3n de puntos ya restando y el bot\u00f3n diciendo \u00abAprobar el bloque \u00b7 30 sanciones\u00bb. Un clic las aplicaba en Notion y mandaba el comunicado con los treinta nombres. Ahora **lo que no has marcado sale sin marcar** (ni aceptado ni tachado), el resumen dice **cu\u00e1ntas te faltan** y el bloque **no se cierra** hasta que las hayas mirado todas.'},
        /* En el m\u00f3vil las sanciones NO son una pantalla: salen del **men\u00fa**
           (`_abrirSanciones_`, un modal), as\u00ed que la vista que se se\u00f1ala es la de
           inicio \u2014 igual que el buz\u00f3n. */
        {cara:'movil', vista:'estado', txt:'En el m\u00f3vil (**men\u00fa \u2192 Sanciones**) esto ya estaba bien y no cambia: sigue avisando de las que te faltan antes de cerrar. Lo que cambia es que ahora **las dos caras cuentan por la misma puerta**, as\u00ed que no se pueden volver a separar.'}
      ] },
    { id:'2026-08-18-cuota-en-directo', fecha:'2026-08-18',
      titulo:'Tu cuota se recalcula sola, con tus horas de ahora',
      items:[
        {cara:'movil', vista:'horas', txt:'La cuota que ves ya **no es la del \u00faltimo '+
          'cierre**: se calcula con tus horas de ahora mismo, cada vez que abres la '+
          'pantalla. Antes fichabas cuatro turnos y el n\u00famero no se mov\u00eda hasta '+
          'que se volv\u00eda a subir el panel. Y si el equipo a\u00fan no ha cargado, te '+
          'lo dice: **\u00abes la \u00faltima cifra que sirvi\u00f3 el servidor\u00bb**.'},
        {cara:'escritorio', vista:'estado', txt:'Lo mismo en **Tu cuota** del ordenador, '+
          'por la misma puerta: la fila de abajo dice si el importe es el de ahora o el de '+
          'la \u00faltima foto.'}
      ] },
    { id:'2026-08-18-pintor-cancelar', fecha:'2026-08-18',
      titulo:'Cancelar el l\u00e1piz ya no se lleva por delante el reporte',
      items:[
        {cara:'escritorio', vista:'buzon', txt:'Si adjuntabas una captura, la marcabas y '+
          'luego pulsabas **Cancelar**, el reporte **se perd\u00eda entero** \u2014 el '+
          't\u00edtulo, el detalle y la gravedad que acababas de escribir\u2014 y la app '+
          'no dec\u00eda nada. Ahora se env\u00eda igual, con la **foto sin las marcas**: '+
          'lo que descartas al cancelar son los trazos, no la captura.'},
        /* En el m\u00f3vil el buz\u00f3n NO es una pantalla: sale del **men\u00fa**, as\u00ed
           que la vista que se se\u00f1ala es la de inicio. */
        {cara:'movil', vista:'estado', txt:'Y en el m\u00f3vil (**men\u00fa \u2192 Reportar un fallo**) '+
          'el bot\u00f3n de **Pintar/Mover** ya no se '+
          'queda con el modo de la vez anterior: dec\u00eda \u00abMover\u00bb desde la '+
          'segunda vez que abr\u00edas el l\u00e1piz **mientras el dedo pintaba**.'}
      ] },
    { id:'2026-08-18-gravedad-viaja', fecha:'2026-08-18',
      titulo:'La gravedad que eliges ya no se borra al cambiar de tipo',
      items:[
        {cara:'movil', vista:'estado', txt:'En **men\u00fa \u2192 Reportar un fallo**: marcabas '+
          '**Me bloquea**, te dabas cuenta de '+
          'que era m\u00e1s bien una mejora, y al volver a **Un fallo** la gravedad hab\u00eda '+
          'vuelto a **Molesta** \u2014 y con el chip marcado, as\u00ed que no se ve\u00eda. '+
          'Ahora sigue elegida la tuya. No es un detalle: de eso salen las horas que se te '+
          'proponen por el reporte, y son **2,00 h** contra **0,50 h**.'}
      ] },
    { id:'2026-08-18-coche-a-medias', fecha:'2026-08-18',
      titulo:'Un coche sin trayecto ya no deja convocar el turno',
      items:[
        {cara:'escritorio', vista:'turnos', txt:'Si a\u00f1ades un coche y le falta **de '+
          'd\u00f3nde sale** o **a d\u00f3nde va**, el bot\u00f3n de convocar te lo dice y no '+
          'te deja \u2014 y te dice **qu\u00e9 coche**, no un aviso gen\u00e9rico. Antes se '+
          'convocaba igual, con el transporte a medias y sin avisar. Tambi\u00e9n cuenta la '+
          'vuelta, si marcaste que no es la misma que la ida.'}
      ] },
    { id:'2026-08-18-puntos-sancion-con-tope', fecha:'2026-08-18',
      titulo:'Los puntos de una sanci\u00f3n ya no admiten cualquier n\u00famero',
      items:[
        {cara:'escritorio', vista:'sanciones', txt:'El campo de **Puntos** dec\u00eda \u00abde '+
          '\u22125 a 0\u00bb y no lo comprobaba nadie: se pod\u00eda mandar un **\u221250**, '+
          'que llegaba a la cola, **se anunciaba en Discord con ese n\u00famero** y dejaba a la '+
          'persona en 0 de una sola sanci\u00f3n. Ahora se comprueba, y los decimales '+
          '(`-3,7`) se rechazan en vez de recortarse a `-3` sin decir nada. El **0** sigue '+
          'valiendo: es el aviso de la primera vez.'},
        {cara:'movil', vista:'estado', txt:'Lo mismo en **men\u00fa \u2192 Sanciones**. Y el '+
          'n\u00famero que sale por defecto ya no es un \u22121 fijo: es **el que el RRI le pone '+
          'a ese art\u00edculo**, que hasta ahora la app tra\u00eda escrito y no miraba.'}
      ] },
    { id:'2026-08-18-sancion-no-pierde-lo-escrito', fecha:'2026-08-18',
      titulo:'Poner una sanci\u00f3n ya no se traga lo que acabas de escribir',
      items:[
        {cara:'escritorio', vista:'sanciones', txt:'Los **puntos** y el **art\u00edculo** que '+
          'teclees ya no se pierden cuando la pantalla se refresca sola. Pasaba al elegir el '+
          'motivo \u00abincumplir un plazo\u00bb: mientras llegaban las tareas de esa persona, '+
          'lo escrito se borraba **y volv\u00eda a \u2212\u00a01**, que es el valor por '+
          'defecto. Con lo cual se enviaba \u2212\u00a01 sin que nadie lo hubiera elegido.'},
        {cara:'movil', vista:'estado', txt:'Lo mismo en el m\u00f3vil, en **men\u00fa \u2192 '+
          'Sanciones**: los puntos y el art\u00edculo tecleados sobreviven al refresco. Y aqu\u00ed '+
          'pasaba adem\u00e1s al **marcar una sanci\u00f3n del bloque** y al abrir la pantalla '+
          'mientras cargaba la cola \u2014 la lista y el formulario comparten pantalla, as\u00ed '+
          'que repintar una repintaba el otro.'}
      ] },
    { id:'2026-08-18-cierre-mes-correcto', fecha:'2026-08-18',
      titulo:'La cabecera del cierre ya no anuncia la fecha del mes que NO se cierra',
      items:[
        {cara:'escritorio', vista:'cierre', txt:'Las chapas de arriba hablan del **mes que se '+
          'cierra**: **TERMIN\u00d3 31/07/2026 \u00b7 LLEVA 18 d\u00edas**. Antes dec\u00edan '+
          '**CIERRA 31/08/2026 \u00b7 QUEDAN 13 d\u00edas** encima de un panel titulado '+
          '\u00abCierre de julio\u00bb \u2014 dos meses distintos en la misma tarjeta.'}
      ] },
    { id:'2026-08-18-gravedad-se-pregunta', fecha:'2026-08-18',
      titulo:'Al reportar un fallo desde el escritorio, ahora te pregunta cu\u00e1nto molesta',
      items:[
        {cara:'escritorio', vista:'buzon', txt:'Reportar un fallo pide ahora la **gravedad** '+
          '(**Bloquea \u00b7 Molesta \u00b7 Cosm\u00e9tico**). Antes la pon\u00eda la app '+
          'sola, siempre **\u00abMolesta\u00bb**: un fallo que **bloquea** sal\u00eda sin el '+
          'chip rojo y se propon\u00eda a **0,50 h en vez de 2,00**.'},
        {cara:'escritorio', vista:'buzon', txt:'Y si lo dejas en blanco **no se inventa nada**: '+
          'el eje queda **sin medir** y la ficha lo pide, en vez de callarlo.'}
      ] },
    { id:'2026-08-17-posible-no-es-ir', fecha:'2026-08-17',
      titulo:'Al cerrar un turno, quien solo era \u00abPosible\u00bb ya no llega con las horas puestas',
      items:[
        {cara:'escritorio', vista:'turnos', txt:'En **Cerrar un turno**, quien figuraba como **\u00abPosible\u00bb** o **\u00abReserva\u00bb** en el anuncio del canal ya **no** sale con el tiempo extra entero puesto: sale a **0**. Sigue en la lista \u2014t\u00fa sabes si al final vino\u2014 pero hay que **sub\u00edrselo a prop\u00f3sito**, que es lo contrario de tener que acordarse de baj\u00e1rselo.'},
        {cara:'escritorio', vista:'turnos', txt:'\u26a0\ufe0f El motivo: `turnos.json` es el **anuncio** del canal, no un acta. Sobre los 23 turnos reales son **3 personas** con ese rol. Contarlas como asistencia son **12 h** que entran en la cuota y en el ranking sin que nadie lo haya dicho.'}
      ] },
    { id:'2026-08-17-deshacer-movil', fecha:'2026-08-17',
      titulo:'Deshacer una decisi\u00f3n sobre un documento, tambi\u00e9n desde el m\u00f3vil',
      items:[
        {cara:'movil', vista:'docs', txt:'En un expediente **ya decidido** aparece **\u00abDeshacer y devolver a revisi\u00f3n\u00bb**. Lo ten\u00eda el escritorio y aqu\u00ed no, y esta es la cara desde la que se revisa: quien se equivocaba de bot\u00f3n en el tel\u00e9fono se quedaba mirando un candado que dice *\u00absolo alguien de m\u00e1s rango puede cambiarlo\u00bb*. El servidor ya aceptaba la orden desde la v28.'},
        {cara:'movil', vista:'docs', txt:'Sale **solo si hay una decisi\u00f3n que deshacer** \u2014estado decidido **y** revisor\u2014, pregunta antes (**borra la firma de otra persona**) y deja el expediente **como estaba**: en revisi\u00f3n y **sin revisor**. No lo firma quien lo deshace.'}
      ] },
    { id:'2026-08-15-cierre-turno', fecha:'2026-08-15',
      titulo:'Cerrar un turno y repartir el tiempo extra, persona a persona',
      items:[
        {cara:'escritorio', vista:'turnos', txt:'Panel nuevo **\u00abCerrar un turno\u00bb**: si eres **responsable** de un turno (o el PD), eliges el turno, dices **cu\u00e1nto dur\u00f3 de verdad**, confirmas **qui\u00e9n fue** y repartes el tiempo extra. Hasta hoy no hab\u00eda d\u00f3nde declararlo.'},
        {cara:'escritorio', vista:'turnos', txt:'El extra se rellena **fila a fila**, no con un n\u00famero para todo el turno: *\u00aba lo mejor es tiempo extra que no le cuenta a alguien que vive cerca, pero s\u00ed a alguien que vive lejos\u00bb*. Arranca con **lo que dur\u00f3 el turno** para todos y se **baja** a quien no le corresponda.'},
        {cara:'escritorio', vista:'turnos', txt:'Y **nadie puede llevarse m\u00e1s horas de las que el turno dur\u00f3**: la base son **4 h** y el techo es lo que pase de ah\u00ed. \u26a0\ufe0f El bot\u00f3n **no escribe en Notion**: deja la propuesta a la vista para aplicarla.'},
        {cara:'movil', vista:'horas', txt:'Y en **Horas**, al declarar un bloque a mano, si pones la **salida antes que la entrada** ahora se te dice. Antes se daba por hecho que cruzaba medianoche **sin avisar**, as\u00ed que equivocarse de casilla no daba ning\u00fan error: daba una duraci\u00f3n cre\u00edble que se mandaba a firmar.'},
        {cara:'escritorio', vista:'horas', txt:'Mismo aviso aqu\u00ed. Y distingue **tres casos**: si solo cabe una lectura te lo dice como un dato (**turno nocturno**), y si caben **las dos** te **pregunta** en vez de decidir por su cuenta \u2014 porque no se puede saber cu\u00e1l quisiste. Ning\u00fan parte se bloquea: los turnos de noche son legales.'}
      ] },
    { id:'2026-08-15-cuota-estimacion', fecha:'2026-08-15',
      titulo:'La cuota se presenta como lo que es: una ESTIMACI\u00d3N',
      items:[
        {cara:'escritorio', vista:'horas', txt:'La fila que cierra el recibo dec\u00eda **\u00abLo que pagas\u00bb** sobre una cifra que **todav\u00eda se mueve**: la curva divide tus horas entre tus meses, y los dos n\u00fameros cambian en cada cierre. Ahora dice **\u00abEstimaci\u00f3n de lo que pagar\u00e1s\u00bb**, y debajo **cu\u00e1ndo se cierra de verdad** (en agosto, al acabar la temporada).'},
        {cara:'movil', vista:'estado', txt:'Y la entrada del men\u00fa promet\u00eda **\u00abLo que te toca pagar esta temporada\u00bb**. Es lo mismo: la cuota es **anual** y se cierra al final, as\u00ed que lo que ves hoy es a cu\u00e1nto **va camino** de irte. Ahora se llama **\u00abEstimaci\u00f3n de la cuota de esta temporada\u00bb**.'},
        {cara:'movil', vista:'estado', txt:'\u26a0\ufe0f Y lo que **NO** est\u00e1 arreglado, para que no te pille: quien no tiene ning\u00fan mes cerrado **sigue apareciendo en la clasificaci\u00f3n** y su estimaci\u00f3n sale de dividir por sus meses. **El 1 de septiembre pasa por ah\u00ed el equipo entero a la vez.**'}
      ] },
    { id:'2026-08-14-convocar-turnos', fecha:'2026-08-14',
      titulo:'Convocar la disponibilidad de turnos ya llega al servidor',
      items:[
        {cara:'movil', vista:'turnos', txt:'Convocar una semana estaba escrito entero \u2014el bot\u00f3n, el calendario, la rejilla\u2014 y **no llegaba al servidor**: la convocatoria se calculaba y se quedaba en el ordenador de quien la lanzaba. Por eso Turnos dec\u00eda siempre \u00abno hay ninguna semana convocada\u00bb y el reparto se hac\u00eda a ojo. Ya se sube.'},
        {cara:'movil', vista:'turnos', txt:'Y el **m\u00ednimo de 4 horas por turno** se perd\u00eda por el camino: al marcar una casilla se marcaba **una sola hora** en vez del bloque entero, as\u00ed que se pod\u00eda decir \u00abpuedo\u00bb sin llegar al m\u00ednimo y sin que nada avisara. *(Necesita el backend desplegado.)*'},
        {cara:'escritorio', vista:'turnos', txt:'A quien convocas y qui\u00e9n puede ser responsable de turno tambi\u00e9n se perd\u00edan al guardar la convocatoria: viajaban desde el bot\u00f3n y el servidor no los guardaba.'}
      ] },
    { id:'2026-08-13-horas-lo-que-no-se-sabe', fecha:'2026-08-13',
      titulo:'Horas dejaba de ense\u00f1ar datos que no eran tuyos',
      items:[
        {cara:'movil', vista:'horas', txt:'\u00abHoras por subsistema\u00bb ense\u00f1aba **cinco unidades de la maqueta** \u2014Avi\u00f3nica, GNC, Aeroestructuras, Propulsi\u00f3n, Org&Mark\u2014 con medias inventadas y numeradas como un ranking, porque el servidor todav\u00eda no manda esa lista. Ahora dice que falta el dato. Y las unidades nuevas (Recovery, Documentaci\u00f3n T\u00e9cnica, Seguridad y Verificaci\u00f3n, Log\u00edstica, Patrocinios) ya no quedan fuera de su propia pantalla.'},
        {cara:'movil', vista:'horas', txt:'Y en esa misma pantalla, \u00abeste mes\u00bb quer\u00eda decir **dos cosas distintas**: la cifra grande contaba el mes de trabajo (de cierre a cierre) y el desglose de abajo, el mes del calendario de tu m\u00f3vil. Del d\u00eda 1 al d\u00eda del cierre arriba pon\u00eda \u00ab37 h este mes\u00bb y abajo \u00abtodav\u00eda no se te ha contado ning\u00fan fichaje\u00bb. Ahora las dos mitades cuentan lo mismo.'}
      ] },
    { id:'2026-08-13-horas-numeros-que-no-cuadraban', fecha:'2026-08-13',
      titulo:'Tres n\u00fameros de Horas que no cuadraban con lo que dec\u00edan',
      items:[
        {cara:'movil', vista:'horas', txt:'La nota que explica tu ritmo ense\u00f1aba una divisi\u00f3n que **no daba ese ritmo**: dec\u00eda \u00ab1,65 h/d\u00eda (20 h en 10 d\u00edas)\u00bb, y 20 \u00f7 10 = 2. El ritmo va **sin la compensaci\u00f3n base** de tu cargo y el par\u00e9ntesis ense\u00f1aba las horas en bruto. Ahora ense\u00f1a el n\u00famero de verdad y dice por qu\u00e9 no son tus horas del mes.'},
        {cara:'movil', vista:'horas', txt:'En el ranking, tu fila **no se pintaba** si eras la \u00faltima persona del equipo: el total estaba escrito a mano en 32 y ahora sale del dato del servidor. Ve\u00edas dos rayas an\u00f3nimas y ninguna pista de que faltaba la tuya.'},
        {cara:'movil', vista:'horas', txt:'Y en esa misma fila, quien todav\u00eda no tiene ning\u00fan mes cerrado ve\u00eda **\u00ab\u221e h\u00bb**. Ahora sale una raya: no se sabe, y se dice.'}
      ] },
    { id:'2026-08-13-medidor-se-contradecia', fecha:'2026-08-13',
      titulo:'El medidor de conducta se contradec\u00eda a s\u00ed mismo',
      items:[
        {cara:'movil', vista:'estado', txt:'Con **2 puntos exactos** pon\u00eda \u00abEn evaluaci\u00f3n.\u00bb arriba y, justo debajo, \u00abpor debajo de 2 puntos se abre expediente\u00bb \u2014 o sea que a\u00fan te quedaba margen. El expediente se abre **con 2** (RRI Art. 32). Ahora el n\u00famero de la frase sale de la propia regla, as\u00ed que no pueden volver a separarse.'}
      ] },
    { id:'2026-08-12-plazos-que-se-escondian', fecha:'2026-08-12',
      titulo:'Dos pantallas escond\u00edan un dato que s\u00ed ten\u00edan',
      items:[
        {cara:'movil', vista:'tareas', txt:'**Todas** tus tareas dec\u00edan \u00absin fecha l\u00edmite\u00bb, tuvieran plazo o no \u2014 y por eso ninguna sal\u00eda en rojo. La pantalla que existe para que no se te pase un plazo era la que te lo tapaba. Ahora dice el plazo y avisa cuando corre prisa.'},
        {cara:'movil', vista:'reu', txt:'El **orden del d\u00eda** de una reuni\u00f3n sal\u00eda siempre vac\u00edo aunque el servidor lo tuviera, y el bot\u00f3n de quitarlo no se pintaba. Peor: guardar con el campo vac\u00edo **borraba el enlace para todo el equipo**. Ya no.'},
        {cara:'movil', vista:'reu', txt:'Y la disponibilidad de los dem\u00e1s te llega **sin sus nombres** salvo que repartas turnos o hayas convocado t\u00fa. El mapa de calor y el \u00abya has cubierto\u00bb se ven igual: lo \u00fanico que cambia es que qui\u00e9n dijo que no pod\u00eda deja de ser p\u00fablico.'}
      ] },
    { id:'2026-08-12-libro-horas-dice-lo-que-ensena', fecha:'2026-08-12',
      titulo:'El libro de horas anunciaba un n\u00famero y ense\u00f1aba otro',
      items:[
        {cara:'movil', vista:'horas', txt:'La lista de \u00abÚltimos movimientos\u00bb reserva un hueco para la compensaci\u00f3n, as\u00ed que pinta **4 fichajes**. La nota de abajo compraba contra 5: con **exactamente 5 fichajes** dec\u00eda \u00abTodo lo de este mes\u00bb **escondiendo uno**, y con 6 dec\u00eda \u00abse ense\u00f1an los 5\u00bb ense\u00f1ando 4.'},
        {cara:'movil', vista:'horas', txt:'Duele porque esa es la pantalla a la que entras **justo a comprobar si te contaron un parte**: uno que de verdad FALTE era indistinguible del que la vista escond\u00eda, y la nota te firmaba que estaban todos. Ahora dice **lo que pinta**.'},
        {cara:'escritorio', vista:'horas', txt:'Y al rev\u00e9s: el escritorio los pinta **todos** sin recortar, y anunciaba que escond\u00eda cosas que no escond\u00eda. Ahora dice que est\u00e1n todos.'}
      ] },
    { id:'2026-08-12-otorgar-confirma-lo-guardado', fecha:'2026-08-12',
      titulo:'Al otorgar horas, el aviso dice lo que se ha GUARDADO, no lo que tecleaste',
      items:[
        {cara:'escritorio', vista:'horas', txt:'El tope por parte son **14 h**. Si escrib\u00edas 20, se guardaban 14 y el aviso verde dec\u00eda \u00ab20 otorgadas\u00bb: **seis horas perdidas** sin un solo error.'},
        {cara:'escritorio', vista:'horas', txt:'Ahora el aviso sale con **las horas que se han guardado** y dice que se recortaron. El registro tambi\u00e9n guarda que hubo recorte, para que se note despu\u00e9s.'},
        {cara:'escritorio', vista:'horas', txt:'Y por debajo: el servidor ya **no acepta que quien otorga elija contra qu\u00e9 subsistema se mide su potestad** \u2014 antes bastaba con decir \u00abel m\u00edo\u00bb para otorgarle horas a cualquiera.'}
      ] },
    { id:'2026-08-11-cola-sanciones-movil', fecha:'2026-08-11',
      titulo:'La cola de sanciones del m\u00f3vil ya se carga (y respeta lo que marcaste en el ordenador)',
      items:[
        {cara:'movil', vista:'horas', txt:'La tarjeta \u00abPanel del PD \u00b7 disciplina\u00bb se quedaba en \u00abCargando la cola\u2026\u00bb **para siempre**. La cola se ped\u00eda antes de que la app supiera qui\u00e9n eres, as\u00ed que la pregunta \u00ab\u00bferes el PD?\u00bb se contestaba sobre un usuario de relleno y sal\u00eda siempre que no. Ahora la pide siempre y **decide el servidor** qui\u00e9n ve qu\u00e9.'},
        {cara:'movil', vista:'horas', txt:'Y los **coordinadores** ya ven su cola: el men\u00fa os ofrec\u00eda Sanciones y el servidor ya os la serv\u00eda, pero la pantalla solo la ped\u00eda si eras el PD, as\u00ed que \u00abPendientes de decidir\u00bb se quedaba cargando sin fin.'},
        {cara:'movil', vista:'horas', txt:'Y lo que marques en el **ordenador** ya llega al m\u00f3vil: marcabas 30 y al abrir el m\u00f3vil para cerrar el bloque te dec\u00eda \u00abFaltan 30 por marcar\u00bb. El servidor lo guardaba bien; era el m\u00f3vil, que lo buscaba con otro nombre.'}
      ] },
    { id:'2026-08-11-boton-lote-marcado', fecha:'2026-08-11',
      titulo:'Al marcar una sanci\u00f3n del bloque, ahora SE VE',
      items:[
        {cara:'movil', vista:'estado', txt:'Marcabas **S\u00ed** o **No** en una sanci\u00f3n del bloque y la pantalla quedaba **exactamente igual**: no hab\u00eda forma de saber cu\u00e1les llevabas. Ahora el bot\u00f3n marcado se queda en **verde** (o en rojo si rechazas). El ordenador ya lo hac\u00eda bien; era el m\u00f3vil el que se lo com\u00eda.'},
        {cara:'movil', vista:'estado', txt:'Y el bot\u00f3n **No** tampoco pod\u00eda verse marcado nunca: le faltaba directamente. Importa porque al cerrar el bloque, **lo que no marcas se da por aceptado**.'}
      ] },
    { id:'2026-08-11-mes-de-cierre-a-cierre', fecha:'2026-08-11',
      titulo:'Tu ritmo del mes vuelve a contarse de cierre a cierre',
      items:[
        {cara:'movil', vista:'horas', txt:'El servidor ya calculaba bien los d\u00edas del mes \u2014desde el \u00faltimo cierre, no desde el 1 del calendario\u2014 pero la app **no llegaba a recogerlo** y volv\u00eda a dividir por el calendario. Con julio cerrado el 4 de agosto, el 7 contaba 7 d\u00edas donde llevabas 4: tu ritmo sal\u00eda a poco m\u00e1s de la mitad del real, y le pasaba a todo el equipo a la vez sin dar ning\u00fan aviso. Tambi\u00e9n afecta a \u00abvs. equipo\u00bb y a la comparaci\u00f3n con el mes pasado.'},
        {cara:'escritorio', vista:'horas', txt:'Lo mismo en el ordenador: la misma cifra la calculaba el servidor y la cara la tiraba.'}
      ] },
    { id:'2026-08-09-recarga-sin-cero', fecha:'2026-08-09',
      titulo:'Al recargar, la pantalla ya no se queda en blanco',
      items:[
        {cara:'escritorio', vista:'buzon', txt:'Entrar al buz\u00f3n borraba la cola y '
          + 'la dejaba en \u00abcargando\u2026\u00bb cada vez, aunque no hubiera cambiado nada. '
          + 'Ahora se queda lo que ya hab\u00eda y arriba pone \u00abACTUALIZANDO\u2026\u00bb, para que '
          + 'sepas que lo que est\u00e1s leyendo es lo \u00faltimo que se pudo traer y no algo '
          + 'reci\u00e9n llegado. Y si no hay conexi\u00f3n ya no se ve la cola vac\u00eda: eso se '
          + 'le\u00eda como \u00abno hay reportes\u00bb cuando en realidad no se hab\u00edan podido leer.'}
      ] },
    { id:'2026-08-09-login-vuelve', fecha:'2026-08-09',
      titulo:'Si la sesi\u00f3n caduca, vuelve a salir el bot\u00f3n de entrar',
      items:[
        {cara:'escritorio', vista:'panel', txt:'Cuando la sesi\u00f3n se ca\u00eda estando dentro, la '
          + 'app avisaba y ah\u00ed se quedaba: pantalla muerta, datos de ejemplo con pinta de '
          + 'reales y nada que pulsar. Ahora vuelve a ofrecerte la entrada con tu cuenta.'},
        {cara:'movil', vista:'estado', txt:'Lo mismo en el m\u00f3vil: si la sesi\u00f3n caduca mientras '
          + 'lo usas, vuelve a salir el bot\u00f3n de entrar en vez de dejarte mirando datos que ya '
          + 'no se actualizan.'}
      ] },
    { id:'2026-08-10-mes-rotulado', fecha:'2026-08-10',
      titulo:'El panel dec\u00eda \u00abjulio\u00bb en agosto',
      items:[
        {cara:'escritorio', vista:'panel', txt:'El mes iba escrito a mano en cuatro '
          + 'sitios, as\u00ed que en agosto tus horas de este mes se presentaban como las '
          + 'de julio. Ahora el mes sale de la fecha. Y la chapa \u00abCIERRA 31/07\u00bb se ha '
          + 'quitado: un mes no cierra el \u00faltimo d\u00eda del calendario, y esa pantalla no '
          + 'sabe la fecha real \u2014 mejor no decirla que inventarla.'}
      ] },
    { id:'2026-08-09-carga-viva', fecha:'2026-08-09',
      titulo:'La carga que ve\u00edas era de julio',
      items:[
        {cara:'movil', vista:'horas', txt:'La tarjeta de carga daba un n\u00famero '
          + 'calculado el d\u00eda que se gener\u00f3 el panel, no hoy \u2014 y encima se '
          + 'titulaba \u00abMi carga del mes\u00bb. Ahora dice que es un \u00edndice, de qu\u00e9 '
          + 'fecha es, y a su lado las horas que llevas este mes en vivo.'},
        {cara:'escritorio', vista:'panel', txt:'Y en el escritorio las horas del mes '
          + 'sal\u00edan de esa misma foto aunque el dato al d\u00eda ya hubiera llegado: '
          + 'ahora manda el dato al d\u00eda.'}
      ] },
    { id:'2026-08-09-banda-carga', fecha:'2026-08-09',
      titulo:'La banda sana de carga pasa a 70\u2013120',
      items:[
        {cara:'movil', vista:'horas', txt:'En tu tarjeta de carga la franja verde iba de '
          + '60 a 90 y ahora va de 70 a 120, por decisi\u00f3n del Project Director. Se ha '
          + 'movido tambi\u00e9n la barra y sus n\u00fameros, no solo el r\u00f3tulo: si no, dir\u00eda una '
          + 'cosa y pintar\u00eda otra.'}
      ] },
    { id:'2026-08-09-plazo-escritorio', fecha:'2026-08-09',
      titulo:'El escritorio tambi\u00e9n dice el plazo en palabras',
      items:[
        {cara:'escritorio', vista:'equipo', txt:'En el panel de convocatorias, cada reuni\u00f3n '
          + 'dec\u00eda «cierra el 20/08/2026» mientras el m\u00f3vil ya dec\u00eda «cierra HOY». Ahora las dos '
          + 'caras usan el mismo texto. Y de paso entiende las fechas en los dos formatos: con '
          + 'una en formato DD/MM/AAAA antes sal\u00eda «sin l\u00edmite», o sea la pantalla diciendo que '
          + 'no hay plazo cuando s\u00ed lo hay.'}
      ] },
    { id:'2026-08-09-aviso-portada', fecha:'2026-08-09',
      titulo:'El aviso de la portada dice si el plazo es HOY',
      items:[
        {cara:'movil', vista:'estado', txt:'El aviso «Te falta cubrir una disponibilidad» '
          + 'terminaba en «cierra el 20/08/2026»: dentro de una alerta, y aun as\u00ed hab\u00eda que '
          + 'mirar el calendario. Ahora acaba en «cierra HOY», «cierra ma\u00f1ana» o «el plazo '
          + 'cerr\u00f3 el 07/08». Es el mismo texto que ver\u00e1s en Reuniones: cuatro sitios diciendo '
          + 'lo mismo con las mismas palabras.'}
      ] },
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

/* ⛔ LA COLA DE DECISIONES NO CONFIRMADAS — y NO es fusionar los dos registros.

   El agujero que tapa (Daniel, 15/08): `_novMarcar_` pinta la marca al momento y manda el POST
   **sin esperarlo**; si ese POST no llega, `_novCargar_` baja el registro del servidor —que no
   se entero— y **pisa la copia local**. Resultado: lo que marcaste vuelve a salir sin marcar al
   recargar, en silencio, porque el aviso ya se habia ido.

   ⚠️ **Fusionar los dos registros NO vale**, y esta escrito doce lineas mas arriba: haria
   resucitar una tanda que se desmarco a proposito. Por eso esto guarda **la decision** —`visto`
   true *o* false— y no una lista de marcados: un desmarcado pendiente se aplica **como
   desmarcado**, asi que deshacer sigue funcionando.

   Vive en su propia clave de `localStorage` a proposito: mezclarla con `solaris_nov_vistas`
   haria imposible distinguir «esto lo confirmo el servidor» de «esto esta por subir». */
var NOV_PEND_LS = 'solaris_nov_pend';
function _novPend_(){
  try{ return JSON.parse(localStorage.getItem(NOV_PEND_LS)||'{}')||{}; }
  catch(_){ return {}; }
}
function _novPendPoner_(id, visto){
  var p=_novPend_(); p[id]={visto:!!visto, at:new Date().toISOString()};
  try{ localStorage.setItem(NOV_PEND_LS, JSON.stringify(p)); }catch(_){}
}
function _novPendQuitar_(id){
  var p=_novPend_(); delete p[id];
  try{ localStorage.setItem(NOV_PEND_LS, JSON.stringify(p)); }catch(_){}
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
    var srv = v || {}, pend = _novPend_(), id;
    /* ⛔ LA COLA VA ENCIMA DE LO DEL SERVIDOR, porque es MAS NUEVA: son decisiones tomadas
       aqui que no llegaron a confirmarse. Sin esto, lo que marcaste con el POST caido
       desaparece al recargar y nadie se entera. */
    for(id in pend){ if(!pend.hasOwnProperty(id)) continue;
      if(pend[id] && pend[id].visto) srv[id]={at:pend[id].at}; else delete srv[id]; }
    window.__novSrv = srv;
    _novSrvEstado_('ok');
    /* El local pasa a ser copia del servidor: si se queda con lo suyo, la próxima vez que se
       abra sin conexión enseñaría un estado que ya no es. */
    try{ localStorage.setItem('solaris_nov_vistas', JSON.stringify(srv)); }catch(_){}
    /* Y se REINTENTA lo pendiente: una cola que guarda y no reintenta solo aplaza la perdida
       al siguiente dispositivo. `_novAlServidor_` la vacia sola cuando el POST entra. */
    for(id in pend){ if(pend.hasOwnProperty(id)) _novAlServidor_(id, pend[id].visto); }
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
    _novPendQuitar_(id);                    /* confirmado: fuera de la cola */
  }).catch(function(e){
    /* ⛔ Se APUNTA antes de avisar. El aviso se lo lleva el viento -- sale segundos despues
       del gesto, con la app ya parada--, asi que si la decision no queda escrita en algun
       sitio se pierde y no vuelve. */
    _novPendPoner_(id, visto);
    if(typeof tost==='function') tost('No se pudo guardar en el servidor: '+((e&&e.message)||e)+
      '. Queda apuntado y se reintenta al abrir.');
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

/* EL ENLACE DEL FORMULARIO de subida de documentos, o `''` si todavía no lo tenemos.

   ⛔ VACÍO A PROPÓSITO, y es lo único de esta pieza que espera a Daniel: la URL **no está en el
      repo** —remedido: `git grep -iE "forms\.gle|docs\.google\.com/forms|/forms/d/"` sobre el
      árbol entero da **un solo hit, y es la ficha que dice que hay cero**—. Una URL inventada
      manda a la gente a una página que no existe, que es peor que no ponerla.
   ✅ Con la cadena vacía, las instrucciones **lo dicen** en vez de pintar un enlace muerto, y
      encenderlo es cambiar ESTA línea y nada más. Por eso la pieza entera no está bloqueada. */
function _urlFormDocs_(){ return ''; }

/* LOS DOS PASOS PARA CORREGIR un expediente al que le han pedido cambios, en ESTE orden.
   `[]` si el expediente no está en `cambios`: es el único estado en que esto aplica.

   ⛔⛔ EL PASO 1 ES «CON LA MISMA REFERENCIA», NO «COMO SUSTITUCIÓN», y la diferencia lo es
      todo. `ref` es **la clave de upsert** (`Codigo.gs:1024`):
      · misma `ref` → entra por `if (ex)` (`:1065`) y `:1068` copia **todos** los campos, así que
        **refresca `enlaceDrive`** (`:1059`); y `:1067` deja el estado en `cambios` a propósito,
        que es justo lo que hace falta para que luego el botón lo mueva.
      · `ref` NUEVA (una sustitución, `:1071-1072`) → nace un expediente **distinto** y el viejo
        se queda igual, con el archivo sin corregir. El botón lo devolvería a la cola así, y el
        revisor vería **dos tarjetas**, una apuntando a la versión mala. Peor que no hacer nada.
   ⛔ Y SON DOS PORQUE NINGUNO SOLO FUNCIONA:
      · El botón (`Codigo.gs:965-967`) **sólo cambia el estado**. No toca `enlaceDrive`, así que
        el revisor abriría el mismo archivo de antes. El rótulo decía «Reenviar corregido» y no
        sube ni un byte.
      · Y volver a subirlo por el formulario **tampoco basta**: `:1067` conserva `cambios` a
        propósito, así que sin pulsar el botón el expediente no vuelve a la cola de nadie.
   ⛔ EL ORDEN NO ES ESTÉTICO: `Codigo.gs:967` hace `e.nota=null`. La `nota` es **el motivo que
      te escribió el revisor**, o sea la lista de lo que hay que corregir, y sólo se pinta
      mientras el estado es `cambios`. Pulsar el botón antes de corregir **borra las
      instrucciones**. */
/* ⛔ SUSTITUIR NO ES CORREGIR, Y LAS INSTRUCCIONES SON LAS CONTRARIAS. Por eso esto vive
   pegado a `_pasosCorregirDoc_` y las dos se nombran la una a la otra: quien tenga delante un
   expediente PUBLICADO y siga los pasos de corregir -misma referencia- **le pisa el archivo al
   documento que el equipo ya está leyendo**, sin que nadie lo apruebe.

   · corregir  → te pidieron cambios · MISMA referencia · NO marcar «sustituye a»
   · sustituir → ya está publicado   · envío NUEVO      · SÍ marcar «sustituye a»

   ⛔ Lo pidió Daniel el 18/08: *«para sobreescribir fichas nuevas capaz mejor que tambien se
   gestione por ahi. Obvio usando el formulario pero con buenas instrucciones detalladas en la
   app (movil y escritorio…)»*. Hasta hoy la app no lo explicaba en ninguna cara.

   ⚠️ SOLO al AUTOR y solo sobre lo que YA ESTÁ PUBLICADO (`publicado` o `cerrado`). A un
   revisor no le toca, y sobre un expediente a medias de revisión el consejo sería falso: ése
   se corrige, no se sustituye.
   ⚠️ Y un `rechazado` NO entra aquí a propósito: nadie ha decidido si lo suyo es un envío
   nuevo ENLAZADO al original o uno libre, y el original ni siquiera está publicado. Inventarlo
   sería darle una instrucción que el pipeline puede no aceptar. Está fichado como pregunta. */
function _pasosSustituirDoc_(e, yo){
  if(!e) return [];
  var est = String(e.estado || '');
  /* ⛔ `cerrado` NO es un estado que exista: `_normEstado_` lo traduce a `publicado`, asi
     que este segundo brazo del `and` no se evaluaba nunca -- y su caso en
     `probar_documentos_autor.py` llevaba meses en VERDE probando una rama inalcanzable. */
  if(est !== 'publicado') return [];
  if(!yo || !e.autor || String(e.autor) !== String(yo)) return [];
  var ref = e.ref || 'la referencia de este expediente';
  var url = _urlFormDocs_();
  return [
    { n:1, t:'Manda la version nueva por el formulario, marcada como «sustituye a»',
      d:'Ahi pones la referencia de este: ' + ref + '. Es un envio NUEVO: crea su propio '+
        'expediente y vuelve a pasar por revision. Al reves que corregir: aqui NO se reutiliza '+
        'la misma referencia, porque este ya esta publicado y no se toca.',
      url: (url && url.indexOf('http') === 0) ? url : '',
      /* El respaldo vive en la PUERTA, no en una cara: es la misma leccion del 19/08 que
         dejo al escritorio mandando al formulario sin decir a quien pedir el enlace. */
      sinUrl: (url && url.indexOf('http') === 0) ? ''
            : 'Si no tienes a mano el enlace del formulario, pideselo al Project Director.' },
    { n:2, t:'Este sigue publicado mientras tanto',
      d:'No se borra ni se retira. El original queda donde esta, y cuando aprueben el nuevo '+
        'constara a cual sustituye. Hasta entonces, lo que el equipo lee es este.',
      url:'', sinUrl:'' }
  ];
}


function _pasosCorregirDoc_(e){
  if(!e || e.estado!=='cambios') return [];
  var ref = e.ref || 'la misma referencia';
  var url = _urlFormDocs_();
  return [
    { n:1, t:'Vuelve a enviar el archivo corregido por el formulario',
      d:'Con la MISMA referencia: ' + ref + '. Así se actualiza el archivo de este mismo '+
        'expediente. NO lo mandes como «sustituye a…»: eso crea un expediente nuevo y deja '+
        'éste con la versión sin corregir.',
      url: (url && url.indexOf('http')===0) ? url : '',
      // ⛔ EL RESPALDO VIVE EN LA PUERTA, NO EN UNA CARA. Estaba escrito dentro del
      //    renderizador del móvil, así que el escritorio pintaba «reenvíalo por el
      //    formulario» y NINGÚN sitio al que ir ni a quién preguntar. Una instrucción a
      //    medias es peor que no darla: manda a hacer algo y esconde cómo. Lo destapó
      //    refutar el changelog del 19/08 antes de publicarlo, no un banco.
      sinUrl: (url && url.indexOf('http')===0) ? ''
            : 'Si no tienes a mano el enlace del formulario, pídeselo al Project Director.' },
    { n:2, t:'Vuelve aquí y pulsa el botón de abajo',
      d:'Es lo único que devuelve el expediente a la cola de revisión. Hazlo DESPUÉS: al '+
        'pulsarlo se borra el motivo que te escribieron, y es donde pone qué hay que corregir.',
      url:'' }
  ];
}

/* LAS SECCIONES DEL ANÁLISIS que hay que leer antes de firmar, en su orden y en UN SOLO SITIO:
   `[[rótulo, lista], …]`, saltándose las que no vienen o vienen vacías.

   ⛔ AQUÍ ESTABA EL FALLO, y no era un descuido: cada cara llevaba **su propia lista escrita a
      mano** —`[['Alcance',…],['Decisiones',…],['Riesgos',…],['Fechas clave',…]]` en el móvil, y
      cuatro `lista(…)` encadenados en el escritorio—, y las dos se dejaron **`acciones` y
      `pendientes`** al partir la pantalla. `app.html:1129-1130` sí las pinta. Dos listas
      paralelas escritas a mano no divergen si alguien se despista: divergen siempre.
   ⛔ Y lo que se perdía decide: **`acciones`** son los compromisos que crea el documento —con
      responsable y fecha—, o sea lo que separa «aprobar» de «solicitar cambios»; sin verlos se
      firma un acta que reparte tareas sin poder mirar si alguna va sin dueño ni plazo.
      **`pendientes`** es lo que queda abierto, o sea publicar ahora o esperar.
   ⚠️ El contrato lo promete dos veces: `:159` «lo que venga, se muestra» y `:179` «la tarjeta
      pinta cada sección solo si viene y no está vacía». */
function _seccionesAnalisis_(an){
  if(!an) return [];
  var pares = [['Alcance', an.alcance], ['Decisiones', an.decisiones],
               ['Acciones', an.acciones], ['Pendientes', an.pendientes],
               ['Riesgos', an.riesgos], ['Fechas clave', an.fechasClave]];
  var out = [];
  for(var i=0;i<pares.length;i++){
    if(pares[i][1] && pares[i][1].length) out.push([pares[i][0], pares[i][1]]);
  }
  return out;
}

/* La línea de conteos —«3 decisiones · 2 acciones»—, o `''` si no vienen o son todos cero.

   ⚠️ ORDEN FIJO, no `Object.keys`. El contrato enumera los cuatro (`:182`), y en ES3 el orden de
      recorrido de un objeto **no está garantizado**: con `Object.keys` la misma tarjeta puede
      salir en distinto orden en dos sitios, que es como se pierde la confianza en un número.
   ⚠️ Pero las claves que NO conozca se añaden al final en vez de tirarse: tirar en silencio un
      campo que manda el productor es exactamente el fallo que esta pieza viene a cerrar. */
function _conteosDoc_(an){
  var c = an && an.conteos;
  if(!c) return '';
  var orden = ['decisiones','acciones','pendientes','riesgos'], p = [], k, n;
  for(var i=0;i<orden.length;i++){
    n = Number(c[orden[i]]);
    if(n > 0) p.push(n + ' ' + orden[i]);
  }
  for(k in c){
    if(orden.indexOf(k) < 0 && Number(c[k]) > 0) p.push(Number(c[k]) + ' ' + k);
  }
  return p.join(' · ');
}

/* Las etiquetas de un expediente, SIEMPRE como lista de cadenas limpias.

   ⚠️ EL CAMPO LLEGA EN DOS FORMAS Y LAS DOS SON REALES: el backend guarda la lista
      (`Codigo.gs:1061`), pero un «aprobar con anotaciones» las manda escritas a mano y por el
      camino vuelven como **cadena separada por comas**. Es el mismo doble que ya costó caro en
      `coordina`: aquí se MIRA la forma —si sabe hacer `join`—, no se supone. Un `.map` sobre una
      cadena en ES3 no falla: devuelve `undefined` y la lista se queda vacía en silencio.
   ⚠️ Y filtra los vacíos: «tobera, , CFD» y «tobera,CFD,» son lo que la gente escribe de verdad,
      y una etiqueta vacía viaja al backend y se publica en Notion. */
function _etiquetasDe_(e){
  var v = e && e.etiquetas;
  if(!v) return [];
  var xs = v.join ? v : String(v).split(',');
  var out = [];
  for(var i=0;i<xs.length;i++){
    var t = String(xs[i]).replace(/^\s+|\s+$/g,'');
    if(t) out.push(t);
  }
  return out;
}

/* Lo que el revisor escribe en el campo → la lista que espera el backend. Misma limpieza, una
   sola vez: si cada cara parsea su propio campo, una acaba mandando espacios y la otra no. */
function _etiquetasDeTexto_(t){ return _etiquetasDe_({etiquetas: (t==null ? '' : String(t))}); }

/* La `ref` del documento al que este expediente sustituye, o `''`.

   ⚠️ PREGUNTA POR LOS DOS NOMBRES, y va aquí y no en cada cara: el móvil empuja el objeto
      **crudo** del backend (`sustituyeA`) y el escritorio lo normaliza a `sustituye`
      (`_normDocE_:70`). Resolverlo en cada cara serían dos criterios para la misma pregunta,
      que es exactamente por donde divergen. El alias `replaces_document` ya lo resuelve el
      backend antes de guardar, así que aquí sólo quedan estos dos. */
function _sustituyeDe_(e){ return (e && (e.sustituye || e.sustituyeA)) || ''; }

/* LO QUE HAY QUE LEER ANTES DE FIRMAR y no se pintaba en ninguna cara, como datos ya
   decididos: `[]` si el expediente no trae ninguno. Cada cara sólo lo envuelve con su marca.

   ⛔ `bloqueo` ES UNA REGRESIÓN, NO UN HUECO: `app.html:1175` LO PINTA
      (`<div class="docbloq">⚠ …`, con su CSS en `:483`), y esa es la cara publicada. Se perdió
      al partir la pantalla en las dos caras de ronda3, que es donde se trabaja hoy. Por eso la
      nota de calibración del 24/07 del contrato —«la tarjeta pinta lo básico … issues/bloqueo»,
      y de ahí «la app y el backend están listos»— **era verdadera cuando se escribió**: lo que
      caducó fue el reparto de caras, no la medición. Es el modo de fallo que más cuesta ver,
      porque la auditoría de la partición (`docs/auditoria-escritorio-vs-apphtml.md`) tampoco lo
      registró como perdido.
   ⚠️ `sustituyeA` NO es una regresión: **cero ocurrencias en `app.html`**. Nunca se pintó en
      ninguna parte, aunque el backend lo guarda desde el 22/07 (`Codigo.gs:1062`).
   ⛔ Y el contrato promete que `bloqueo` se ve, TRES veces: `:129`, `:282` y `:287-288`.
   ⛔ Y el PRIMER caso especial del contrato (§8) depende entero de esto: un `Acta` no existe en
      `Tipo Aerotech` de Notion, así que Cowork la empuja como intervención manual **con su
      motivo en `bloqueo`**. O sea que la clase de expediente que MÁS necesita el aviso es la
      que llegaba muda.

   ⚠️ AVISO, NO PUERTA. `puedeDecidirDoc` no lo mira, y aquí NO se le añade: el contrato pide
      que el revisor «decide con esa info a la vista» (`:288`), no que no pueda decidir.
      Convertir un aviso en un bloqueo sería inventar una política que nadie pidió, y encima
      dejaría un expediente sin salida cuando el bloqueo es justo lo que hay que resolver a
      mano. Se le pone delante y decide él. */
function _avisosDoc_(e){
  var xs = [];
  if(e && e.bloqueo)
    xs.push({ k:'bloqueo', t:'Expediente trabado.',
              d:String(e.bloqueo)+' Decidir aquí no lo destraba: hace falta arreglar eso.' });
  var s = _sustituyeDe_(e);
  if(s)
    xs.push({ k:'sustituye', t:'Es una revisión, no un envío nuevo.',
              d:'Sustituye a '+s+', que sigue publicado y no se borra.' });
  return xs;
}

/* La acción que se tomó sobre un expediente, legible. `''` si no se reconoce.

   ⛔ SALE DE `decision.accion`, NO DEL ESTADO, y ésa es toda la razón de que exista: el backend
      colapsa `aprobado` y `anot` en el MISMO estado (`publicado`, `Codigo.gs:993`), así que
      reconstruir la decisión desde `e.estado` —que es lo que hacían las dos caras— **no puede**
      distinguir «te lo aprobaron» de «te lo aprobaron cambiándote el título y las etiquetas».
      Y eso segundo es justo lo que el autor necesita saber. */
function _accionDocTxt_(a){
  return a==='aprobado'  ? 'Aprobado'
       : a==='anot'      ? 'Aprobado con anotaciones'
       : a==='cambios'   ? 'Cambios pedidos'
       : a==='rechazado' ? 'Rechazado' : '';
}

/* Quién firmó la decisión y cuándo: `'Ana Pérez · 18/08/2026, 21:12'`. `''` si no hay firma.

   ⛔ EL «CUÁNDO» NO SE PINTABA EN NINGUNA DE LAS DOS CARAS. El backend lo guarda desde siempre
      (`decision.at` y `decidedAt`, `Codigo.gs:997-1001`) y las dos caras reconstruían la
      decisión a mano desde el estado, que no lo lleva. Una firma sin fecha no se contrasta con
      nada, y esta pantalla existe para no firmar a ciegas.
   ⚠️ `decision.revisor` es el nombre ENTERO y `e.revisor` la pila (`_pilaDe_`): se prefiere el
      primero y el segundo es el RESPALDO, porque los expedientes decididos antes de que
      existiera `decision` solo tienen la pila. Sin respaldo, lo más antiguo —justo lo que lleva
      más tiempo esperando— se quedaría mudo.
   ⚠️ Y un «no lo sé» aquí es cadena vacía: quien llama decide si pinta algo o calla. */
function _firmaDocTxt_(e){
  if(!e) return '';
  var d=e.decision||null;
  var quien=(d&&d.revisor)||e.revisor||'';
  var cuando=(d&&d.at)||e.decidedAt||'';
  if(!quien) return '';
  return String(quien)+(cuando&&typeof _novCuando_==='function' ? ' · '+_novCuando_(cuando) : '');
}

/* Qué te ajustaron en un «aprobado con anotaciones». `''` si no ajustaron nada.

   ⛔ ES LA MITAD QUE FALTABA DE ESA ACCIÓN. `Aprobar con anotaciones` existe para tocar el
      título y las etiquetas (`Codigo.gs:992`), y **ninguna cara enseñaba QUÉ se tocó**: al autor
      le cambiaban el título de su documento y se enteraba comparándolo de memoria.
   ⚠️ `etiquetas` puede llegar como lista o como cadena —el mismo campo con dos formas que ya
      costó caro en `coordina` el 18/08—, así que se pregunta si sabe hacer `join` en vez de
      suponerlo. En JS una cadena tiene `.length` y es indexable: la forma equivocada no da
      error, da basura. */
function _ajustesDocTxt_(e){
  var a=e&&e.decision&&e.decision.ajustes;
  if(!a) return '';
  var p=[];
  if(a.titulo) p.push('título → «'+a.titulo+'»');
  if(a.etiquetas) p.push('etiquetas → '+(a.etiquetas.join?a.etiquetas.join(', '):a.etiquetas));
  return p.length ? p.join(' · ') : '';
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
   ⚠️ …PERO NO SOLO DE DOCUMENTOS, y esa frase es la que envejeció: hoy la usan como
   puerta de «¿es coordinación?» el panel de bloque de horas, el de convocar turno, el
   desglose de disponibilidad con nombres y los tipos de reunión convocables — todos
   preguntando `rangoNom(ACTOR) >= 1`. Una capa compartida se acota por la UNIÓN de sus
   clientes, no por el que la escribió.
   ⛔ NO es la de sanciones. Esa es `rangoSanc`, que sale de una tabla explícita
   (`RANGO_SANC`) porque ahí hay gente con rango sin tener cargo — deducirlo del
   `cargo` es justo el fallo que esa tabla existe para impedir. Se confunden
   solas: si vienes a tocar una, comprueba cuál. */
function rangoNom(n){
  if(n===PD_NOM) return 3;
  if(n===REV2_NOM) return 2;
  /* Rango 1 = TIENE GENTE BAJO SU JURISDICCION. Va por la MISMA puerta que ya usa
     `rangoSanc` (`_subcoordDe_`): una segunda tabla aqui seria el tercer criterio para
     la misma pregunta. El subcoordinador valia 1 en el servidor (`_rangoNom_`,
     `_rangoEscritorio_`) y 0 aqui, asi que el escritorio le DEJABA ENTRAR -el backend
     manda rango 1 en el arranque- y una vez dentro no le enseñaba ni un panel de
     coordinacion. La cara tenia el dato bueno en memoria (`SESION.rango`) y decidia con
     otro: `SESION.rango` se lee UNA sola vez, para el portazo (`< 0`).
     ✅ En DOCUMENTOS no cambia nada, y esta medido: 4.032 expedientes cruzados, 0
     diferencias -- nunca sale de `revisoresDe`, asi que su unico camino es `> maxR`, y
     `maxR` vale 1 o 3, nunca 0. El control (subcoordinador a rango 2) dio 256. */
  if(_subcoordDe_(n)) return 1;
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
