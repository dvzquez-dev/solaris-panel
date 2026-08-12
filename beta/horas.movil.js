/* ═══ HORAS · cara movil ═══════════════════════════════════════════════════════════
   34 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

/* HH:MM local de una fecha ISO (la hora de apertura que da la nube) */
function _hhmmDe_(iso){ var d=new Date(iso); return pad(d.getHours())+':'+pad(d.getMinutes()); }

async function _partesDe_(nombre){
  if(!_partesAdmin){ try{ _partesAdmin=await api.getPartes({})||[]; }catch(_){ _partesAdmin=[]; } }
  return _partesAdmin.filter(function(p){return p.autor===nombre;}).map(normPMovil);
}

/* La coletilla que explica de donde sale una hora. Tres casos y ni uno mas:
     fichaje  -> nada, es lo normal y no hay que decirlo;
     manual   -> «sin fichaje», en ambar: quien firma tiene derecho a saber que no hubo
                 cronometro;
     otorgada -> «automatica», en gris: NO es un aviso, es informacion. Marcarla en ambar
                 seria acusar al miembro de algo que hizo el sistema.
   Un parte viejo sin `origen` se comporta como antes, con `sinFichaje`: es lo unico que se
   sabe de el, y no se le inventa una procedencia que no consta. */
function _origenParte_(p){
  /* El texto sale de `_etiOrigenParte_` (comun.js): aqui solo se decide COMO se pinta en esta
     lista -- corto, en linea y detras del resto. Antes esta funcion tenia su propia tabla de
     casos, que es como el escritorio y ella acabaron diciendo cosas distintas del mismo parte. */
  var e=_etiOrigenParte_(p);
  if(!e) return '';
  var col = e.tono==='ok' ? 'var(--ink3)' : 'var(--warn)';
  return ' · <span style="color:'+col+'">'+esc(e.txt)+'</span>';
}

/* ⛔ EL ISO SE CONSERVA. `f` sale ya formateado a `DD/MM/AAAA` para pintarlo, y ordenar por
   ese texto es incorrecto: «01/09» iría ANTES que «31/08». Sin el ISO no hay forma de poner
   los partes en orden ni de saber de qué mes es cada uno — y eso hace falta para las tres
   maneras de tratar los de meses cerrados (ocultar, marcar o plegar), decida Daniel la que
   decida. Normalizar es tirar lo que no nombras, y aquí se estaba tirando la fecha de verdad. */
function normPMovil(p){
  return { id:p.id, f:_isoADMY_(p.fecha), iso:String(p.fecha||''), t:p.tarea||'', q:Number(p.horas)||0,
    e:_E_MOVIL_[p.estado]||'pend', ini:p.ini||'', fin:p.fin||'', cat:p.categoria||null,
    just:p.justificacion||'', nota:p.motivo||p.justificacion||'', sinFichaje:!!p.sinFichaje,
    /* DE DONDE VIENE la hora: 'fichaje' | 'manual' | 'otorgada'. El backend lo guarda desde
       siempre y aqui se tiraba, asi que la vista solo tenia el booleano `sinFichaje` —que
       dice lo que FALTA, no de donde sale— y llamaba «sin fichaje» a lo que otorga el
       sistema. Ver `_origenParte_`. */
    /* ⛔ Y CON EL ORIGEN VIAJAN `decidido_por` Y `revierte`, porque `_etiOrigenParte_`
       los MIRA. Sin ellos el rotulo no da error: da una VERDAD A MEDIAS -- «otorgada
       por coordinacion» sin decir quien, y «reversion del parte ?»--, que es peor que
       un hueco porque parece completa. Se vio en el navegador; la ficha de decision
       ya los llevaba y esta no, o sea que las dos listas de la MISMA pantalla decian
       cosas distintas del mismo parte. */
    decidido_por:p.decidido_por||null, revierte:p.revierte||null,
    origen:p.origen||null, caduca:p.caduca_at||null }; }

/* ⚠️ MISMO DEFECTO QUE EL DE ABAJO, y se arregla igual aunque HOY no haga daño:
   `CARGA.partes` no lo lee nadie todavia (medido: una sola aparicion, la escritura).
   Es una trampa CARGADA para el dia que alguien pinte «Cargando tus partes…» — y
   ese dia el fallo no seria suyo, seria de esta linea.
   ⛔ Y al fallar, `PARTES` se queda con la SEMILLA de fabrica: seis partes
   inventados que se ven como tus horas, en el desglose y en el globo del nav. */
async function _cargarMisPartes_(){
  try{ var arr=await api.getPartes({mias:true});
    if(!Array.isArray(arr)) return false;
    PARTES=arr.map(normPMovil); CARGA.partes=true; return true; }
  catch(e){ return false; }
}

/* Al entrar, retoma el fichaje que hubiera abierto en la nube: el reloj sigue desde la
   hora del servidor, así que cerrar la app (o cambiar de móvil) no pierde la sesión. */
/* ⛔ EL `finally` DESARMABA LA GUARDA DE TRES LINEAS MAS ABAJO, y el comentario de
   aquella describe el daño exacto que causaba: «sin saber si YA tienes un fichaje
   abierto no se puede ofrecer «fichar entrada»: dirias «parado» a alguien que esta
   fichando y ficharia dos veces». Con `finally`, el camino de ERROR afirmaba que si
   lo sabia. En la practica: red inestable al entrar -> «SIN SESION ABIERTA» con una
   sesion corriendo en la nube; si esa persona declara un bloque con `sinFichaje`, a
   las 14 h el autocierre emite un SEGUNDO parte por las mismas horas.
   ✅ La bandera se pone donde significa algo: cuando la respuesta LLEGO. Que `f` sea
   nulo es una respuesta valida -no tienes ninguno abierto-; que reviente, no. */
async function _cargarFichajeAbierto_(){
  try{ var f=await api.getFichajeAbierto();
    if(f && f.ini){ var ps=f.pausas||[], ult=ps[ps.length-1];
      ST.ses={estado:(ult&&!ult.fin)?'pausada':'corriendo', cloudIni:f.ini, pausas:ps, desde:_hhmmDe_(f.ini), ult:_hhmmDe_(f.ini)}; }
    CARGA.fichaje=true; return true; }
  catch(e){ return false; }
}

/* ⛔ REARMA LAS CARGAS QUE NO LLEGARON — la regla de Daniel del 11/08 puesta a trabajar:
   «que lo reintente por detras sin decirtelo constantemente».

   ⛔ UN SOLO SITIO, Y A PROPOSITO. La tentacion es meter el reintento DENTRO de cada carga,
   y sale mal por dos motivos: (1) las cargas se llaman tambien desde el refresco de 90 s y
   desde despues de decidir, asi que cada llamada armaria su cadena; (2) el arranque las lanza
   en paralelo y las espera juntas — el momento en que se sabe QUE FALTA es justo despues de
   ese `Promise.all`, no dentro de ninguna.

   ✅ Y por eso se pregunta por la BANDERA y no por el resultado: la bandera es lo que la
   pantalla mira para decidir si dice «Cargando…». Si esta puesta, no hay nada que reintentar
   aunque la lista este vacia — vacia es una respuesta.

   ⚠️ Las tres son LECTURAS puras, comprobado contra el backend: `_getPartes_`,
   `_getFichajeAbierto_` y `_listar_` no escriben nada. Reintentar una ESCRITURA la duplicaria,
   y eso no se hace desde aqui. */
function _rearmarCargas_(){
  if(typeof _reintentoPasivo_ !== 'function') return 0;
  var n = 0;
  var repintar = function(){ if(typeof pintar === 'function') pintar(); };
  if(!CARGA.fichaje   && _reintentoPasivo_('fichaje',   _cargarFichajeAbierto_, repintar)) n++;
  if(!CARGA.partes    && _reintentoPasivo_('partes',    _cargarMisPartes_,      repintar)) n++;
  if(!CARGA.reuniones && _reintentoPasivo_('reuniones', _cargarReunionesM_,     repintar)) n++;
  return n;
}

function mediaSub(u){for(var i=0;i<DATA.subsistemas.length;i++) if(DATA.subsistemas[i].u===u) return DATA.subsistemas[i].media; return _mediaEquipo_();}

/* LA MEDIA DE HORAS DEL EQUIPO **ESTE MES**, la de verdad.

   ⛔ Esto salia de `DATA.subsistemas`, y el backend lo manda como `panel.subsistemas || []`
   sobre un panel que **NO TRAE ese campo**: la lista llegaba VACIA y la funcion caia en su
   reserva, un `MEDIA_EQ=10.9` **cableado**. O sea que «vs. equipo» comparaba contra un numero
   inventado que no se movia nunca — y en pantalla parecia un dato. (Daniel, 07/08: «el vs equipo
   deberia comparar con la media real de horas que lleva el equipo ese mes en ese dia».)

   Dos fuentes legitimas, una sola puerta:
     · `DATA.equipo_mes` — el agregado sin nombres que el backend manda a un miembro raso, que
       NO recibe las horas de nadie y por tanto no puede calcularla.
     · `DATA.miembros[].horasMes` — el PD si recibe el roster entero, y ahi se calcula en casa.
   Y si no hay ninguna devuelve **null**: la fila no se pinta. Es la misma politica que ya tenia
   «vs. mes anterior» — antes que inventarse un numero, no decir nada. */
function _mediaEquipo_(){
  var e=DATA.equipo_mes;
  if(e && typeof e.media==='number' && (e.n||0)>=3) return e.media;
  var ms=DATA.miembros||[], h=0, n=0;
  for(var i=0;i<ms.length;i++){
    if(ms[i].baja) continue;
    var x=_hMesReal_(ms[i]);
    /* ⛔ Quien no tiene el dato NO cuenta como 0: hundiria la media y todo el mundo saldria
       «por encima del equipo». Fuera del divisor tambien. */
    if(typeof x==='number'){ h+=x; n++; }
  }
  return n>=3 ? h/n : null;
}

/* En que dia del mes vamos, y cuantos tiene. **Lo manda el servidor** si puede: un movil con la
   fecha cambiada haria que la misma comparativa dijera cosas distintas a dos personas. */
/* ¿Ese parte es de un mes YA PASADO? Se compara `AAAA-MM` contra el periodo que manda el
   servidor.

   ⛔ EL PERIODO LO PONE EL SERVIDOR (`equipo_mes.periodo`), no el reloj del móvil: con la
   fecha del teléfono, a dos personas les plegaría cosas distintas el mismo día.

   ⚠️ Sin periodo o sin fecha devuelve **false** — o sea NO se pliega. Ante la duda, el parte
   se ve: esconder algo por no saber de cuándo es, es peor que enseñarlo de más.

   ⚠️ «Mes pasado» no es exactamente «mes cerrado»: un mes anterior podría seguir sin cerrarse.
   Se usa el mes porque es lo que la cara puede saber sola, y para lo que esto hace —quitar
   ruido de lo viejo— basta. Lo que **nunca** se pliega es el mes en curso. */
function _esDeMesPasado_(p, periodo){
  var per = String(periodo||'');
  if(!/^\d{4}-\d{2}$/.test(per)) return false;
  var iso = String((p&&p.iso)||'');
  if(!/^\d{4}-\d{2}/.test(iso)) return false;
  return iso.slice(0,7) < per;
}

/* ⛔ `_diasDelMes_` SE MUDO A `comun.js` el 12/08, y no por orden: `_umbral_` vive alli y
   se llama desde LAS DOS CARAS, asi que aqui no la alcanzaba y pesaba el mes abierto con
   el calendario. Dejar una copia aqui serian dos puertas para la misma pregunta. */

/* El NOMBRE del mes anterior a `AAAA-MM`. Sin periodo, se deduce de hoy. */
function _mesAnteriorDe_(periodo){
  /* La tabla va DENTRO a proposito: una funcion que depende de una constante de modulo no se
     puede extraer sola para probarla -el banco la saca con `jsfuente.funcion` y reventaba con
     «_MESES_ no esta definido»-. Doce cadenas no justifican esa atadura. */
  var _MESES_=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre',
               'octubre','noviembre','diciembre'];
  var y, m;
  if(/^\d{4}-\d{2}$/.test(String(periodo||''))){ y=+periodo.slice(0,4); m=+periodo.slice(5,7)-1; }
  else { var d=new Date(); y=d.getFullYear(); m=d.getMonth(); }
  var a=new Date(y, m-1, 1);
  return _MESES_[a.getMonth()];
}

/* Cuantos dias DURO el mes anterior al periodo `AAAA-MM`. Sin periodo, se deduce de hoy.

   ⛔ UN MES NO DURA LO QUE DICE EL CALENDARIO: dura del cierre del anterior al cierre de este
   (Daniel, 07/08: *«Bueno y si junio se cerro el 29, imaginate»*). Si junio cerro el 29/06 y
   julio el 04/08, julio duro **37 dias**, no 31 — y dividir por 31 infla el ritmo de julio de
   las 32 personas a la vez, sin dar ningun error.

   `servidor` es el `equipo_mes.dias_ant` que calcula el backend con el historico de cierres. Si
   no hay dos cierres guardados llega `null` y se cae al calendario: aproximado, pero no
   inventado. */
function _diasMesAnterior_(periodo, servidor){
  var sv = Number(servidor);
  if(isFinite(sv) && sv > 0) return sv;
  var y, m;
  if(/^\d{4}-\d{2}$/.test(String(periodo||''))){ y=+periodo.slice(0,4); m=+periodo.slice(5,7)-1; }
  else { var d=new Date(); y=d.getFullYear(); m=d.getMonth(); }
  return new Date(y, m, 0).getDate();          /* dia 0 del mes actual = ultimo del anterior */
}

function sumaE(e){return PARTES.filter(function(p){return p.e===e;}).reduce(function(a,p){return a+p.q;},0);}

function wBar(h){ return 100*(1-Math.exp(-Math.max(0,h)/K_BAR)); }

/* LA COMPARATIVA, pegada a la barra (Daniel, 28/07: «un espacio abajo en el mismo div»).

   Dos filas y no cuatro:
   · **vs mes anterior** — lo unico que dice si vas mejor o peor que tu, y no lo dice nada mas
     en toda la app. Sale de `_hAntReal_` (el panel REAL); si no llega, la fila no se pinta
     (en vez de inventarse un 0, que saldria como «+100 %»).
   · **vs equipo** — la media por persona del equipo. Es INDIVIDUAL: el ranking dice en que
     puesto estas, no cuanto te separa de la media, que es otra pregunta.

   Se cayeron a proposito «vs objetivo» (el objetivo ya es la marca de la propia barra, tres
   pixeles mas arriba) y «vs unidad» (Daniel: «el de vs unidad tambien [lo borraria]»). */
/* ⛔ SE COMPARA EL RITMO (h/dia), NO LAS HORAS EN BRUTO. (Daniel, 07/08: «deberia de ser una
   ponderacion de comparativa entre horas/dias que han transcurrido del mes, no de horas en
   bruto».)

   El mes en curso esta A MEDIAS y el anterior esta ENTERO. Comparar los totales a dia 7 decia
   «-78 %» a alguien que va **mejor** que el mes pasado, y lo decia todos los meses: la fila
   empezaba en rojo el dia 1 y se iba arreglando sola segun pasaban los dias. Un indicador que
   depende de que dia lo mires no informa de nada, y el que lo lee se acostumbra a ignorarlo.

   Con «vs. equipo» el sesgo ya se cancelaba —los dos numeros son del mismo mes al mismo dia—,
   pero se pasa igual a h/dia: son la misma fila, y dos filas contiguas que miden en unidades
   distintas es como se lee mal un numero correcto. */
function _compHorasHTML_(base){
  var f='', d=_diasDelMes_(), dia=Math.max(1, d.dia);
  /* ⛔ SIN LA COMPENSACION BASE, Y EN LOS DOS LADOS. La del cargo no se trabaja: se cobra
     por el puesto, es la MISMA todos los meses y meterla mide el cargo en vez del trabajo.
     Descontarla en uno solo de los dos lados seria peor que no descontarla. */
  var _bt=_horasSinBase_(YO, base);
  /* ⛔ EL NUMERADOR SE GUARDA PORQUE LA NOTA DE ABAJO LO ENSEÑA. Hasta el 13/08 el
     ritmo se calculaba con las horas SIN la base y el paréntesis que dice de dónde
     sale enseñaba `base`, o sea las horas EN BRUTO: la división impresa no daba
     nunca el número impreso. Un coordinador con 20 h el día 10 leía «Tu ritmo:
     1,65 h/día (20 h en 10 de 31 días)», y 20 ÷ 10 = 2. El desfase es exactamente la
     base de cada uno — **7 h para el PD**, así que la fila más incoherente era la
     suya. A las 32, todos los días del mes.
     ⚠️ Y el banco no podía verlo: `probar_ritmo.py` pasa TODAS sus aserciones de
     ritmo por un `limpio()` que recorta en el primer `<p ...>`, que es justo donde
     vive esta nota. No era una comprobación que pasara con el fallo: era un recorte
     del instrumento que hacía imposible plantear la pregunta. */
  var _num=(_bt==null?base:_bt);
  var ritmo=_num/dia;
  /* ⛔ EL MES ANTERIOR, Y EL MES SALE DEL DATO. Aqui ponía que `hAnt` «solo existe en los datos
     de demo»: **era falso y costó la fila**. `hAnt` está en el panel SUBIDO al servidor, con
     `mesAnt: 'junio'` estando en agosto. Al cambiarla al dato bueno (`carga_mes_anterior`) la
     fila **desapareció**, porque ese campo no está en el panel que hay subido. Daniel:
     *«¿y por qué ya no me aparece la comparación con el mes anterior?»*.

     El fallo nunca fue comparar con junio: fue **llamarlo julio**. Asi que `_antComparable_`
     devuelve lo que haya **con el mes al que pertenece**, y el rótulo lo dice. Sin nada, la
     fila sigue sin pintarse. */
  var _ant=_antComparable_(YO);
  if(_ant!=null){
    var _hA=_ant.h;
    var _bA=_horasSinBase_(YO, _hA);
    /* ⛔ EL DATO DEL SERVIDOR MIDE **EL MES ANTERIOR AL PERIODO**, y solo eso. Si lo que
       estamos comparando es el RESPALDO viejo —que trae su propio mes (`_ant.mes`) y puede ser
       otro distinto—, esos dias no son los suyos: dividir horas de junio entre los dias que
       duro julio da un ritmo que no es de nadie. Con respaldo se sigue con el calendario, que
       es lo que habia. */
    var _dsv = (_ant.mes==null && DATA.equipo_mes) ? DATA.equipo_mes.dias_ant : null;
    var dAnt=_diasMesAnterior_(d.periodo, _dsv);
    var rAnt=(_bA==null?_hA:_bA)/dAnt;
    var _nomAnt=_ant.mes || _mesAnteriorDe_(d.periodo);
    f+=deltaHTML('vs. '+_nomAnt, ritmo, rAnt, nf2(rAnt)+' h/día en '+_nomAnt);
  }
  var me=_mediaEquipo_();
  if(me>0) f+=deltaHTML('vs. equipo', ritmo, me/dia, nf2(me/dia)+' h/día de media');
  if(!f) return '';
  /* Que se vea CONTRA QUE se compara uno. Sin esto, «+12 %» respecto a un ritmo no se
     distingue de «+12 %» respecto a un total, y son cosas distintas. */
  return '<div class="comph">'+f+
    '<p class="rnota" style="margin:6px 0 0">Tu ritmo: <b>'+nf2(ritmo)+' h/día</b> ('+nf2(_num)+
    ' h en '+dia+' de '+d.total+' días'+(_bt==null?'':', sin la compensación base')+
    '). Se compara el <b>ritmo</b>, no el total: el mes '+
    'en curso va a medias y el anterior está entero.</p></div>';
}

function barraHorasHTML(id){
  /* La MISMA puerta que las dos tarjetas (`_hMesReal_`): esta era la TERCERA copia de
     «de donde salen las horas del mes». */
  var _hm=_hMesReal_(YO), notion=(_hm!=null);
  var cont=notion?_hm:sumaE('otor'), p=sumaE('pend');   /* otorgadas = todo lo que cuenta */
  /* La barra NUNCA se llena (escala asintótica), pero dentro del ancho que ocupa el total
     (otorgadas+pendientes) el reparto es LINEAL: si 4 de 20 h están pendientes, el rayado
     ocupa 1/5 de lo pintado — no un pixel al final como si fueran un extra. */
  var tot=cont+p, wtot=wBar(tot);
  var wco = tot>0 ? wtot*(cont/tot) : 0, wcop = wtot;
  /* La MARCA del objetivo va en la MISMA escala que lo pintado: dentro del ancho reservado
     el reparto es lineal, así que el objetivo cae en wtot*(UMBRAL/tot). Con la escala asintótica
     se descolocaba (con 87 h la barra llega casi al borde y el objetivo se quedaba a media barra).
     Si aún no hay horas, o el objetivo queda más a la derecha que el total, se ancla al final. */
  var wu = tot>0 ? Math.min(98, wtot*(UMBRAL/tot)) : wBar(UMBRAL);
  /* `data-k` es la clave de la MEMORIA de anchos, y a proposito NO es el id.
     Estado y Horas pintan LA MISMA barra con el mismo dato y distinto id
     (`barEstado` / `barHoras`), asi que indexando por id cada pantalla tenia su propia
     memoria: mirabas tus horas en Estado, pulsabas Horas... y la misma barra volvia a
     crecer desde cero. Con una clave por DATO, las dos comparten pasado. */
  return '<div class="barh" id="'+id+'" data-k="horasMes">'+
      '<i class="otor" data-w="'+wco.toFixed(2)+'"></i>'+
      '<i class="pend" data-l="'+wco.toFixed(2)+'" data-w="'+(wcop-wco).toFixed(2)+'"></i>'+
      '<span class="mk" data-l="'+wu.toFixed(2)+'"></span>'+
    '</div>'+
    '<div class="barhet"><span data-l="'+wu.toFixed(2)+'">objetivo '+h1(UMBRAL)+'</span></div>'+
    (tot>0
      ? '<div class="leyh">'+
          '<span><i style="background:var(--ok)"></i>cuentan</span>'+
          /* La leyenda va SIEMPRE, tengas o no horas pendientes: es la clave de colores de
             la barra, no un aviso. Que aparezca y desaparezca segun el dato hace que la
             barra cambie de significado sin avisar. (Daniel, 27/07.) */
          '<span'+(p>0?'':' style="opacity:.5"')+'><i style="background:repeating-linear-gradient(45deg,rgba(232,145,46,.9) 0 3px,transparent 3px 6px)"></i>pendientes · no cuentan</span>'+
        '</div>'
      : '')+
    (tot>0
      ? (p>0?'<p class="rnota" style="margin-top:9px">Lo rayado son '+nf2(p)+' h esperando firma: todavía no cuentan.</p>':'')
      : '<p class="rnota" style="margin-top:9px">Aún no tienes horas registradas este mes. El objetivo son '+h1(UMBRAL)+'.</p>')+
    /* La comparativa se compara contra lo que YA CUENTA, no contra el total con lo
       pendiente: lo pendiente puede caerse en la firma y entonces la comparacion
       habria dicho lo contrario de lo que acaba pasando. */
    _compHorasHTML_(cont);
}

function _guardarAnchos_(){ try{ localStorage.setItem('sol_anchos',JSON.stringify(_anchoPrev_)); }catch(_){} }

function animarBarras(root, silencioso){
  $$('.barh',root||document).forEach(function(b){
    $$('i',b).forEach(function(i,ix){
      var l=i.dataset.l, w=i.dataset.w;
      i.style.left=(l||0)+'%';
      var k=(b.dataset.k||b.id||b.className)+':'+ix, prev=_anchoPrev_[k];
      /* Un ancho no numerico (`NaN`, vacio) escrito como `width:NaN%` es CSS invalido:
         el navegador lo descarta y el tramo se queda en el `width:0` de la hoja, o sea
         creciendo desde cero sin que nadie lo haya pedido. Si no es un numero, no se
         guarda ni se anima. */
      if(!isFinite(parseFloat(w))){ i.style.width='0%'; return; }
      _anchoPrev_[k]=w;
      /* 🔴 `silencioso` LLEGABA Y NO SE MIRABA. El parametro estaba declarado, todas las
         llamadas lo pasaban... y el cuerpo no lo leia nunca. Lo unico que evitaba que un
         repintado de fondo reanimara la barra era el atajo `prev===w`, o sea: funcionaba
         de casualidad mientras el dato no cambiase, y en cuanto cambiaba -o la memoria
         estaba vacia- la barra se reiniciaba sin que nadie hubiera tocado nada.
         Callado = ancho final y punto. La regla del proyecto es «repintar menos, no
         apagar la animacion»: esto no apaga nada, solo deja de animar lo que no ha
         pedido el usuario. */
      if(silencioso || redu()){ i.style.width=w+'%'; return; }
      /* De donde parte: de lo que media antes si ya estaba pintada, y de cero solo la
         primera vez —que ahi si se quiere ver crecer—. */
      /* 🔴 EL SALTO A `prev` TIENE QUE SER UN SALTO, NO UNA TRANSICION.
         `.barh i` nace con `width:0` por CSS (regla de arriba) y `pintar()` fuerza DOS
         reflows sincronos entre el `innerHTML` y esta linea: `colocarViaje()` lee
         `getBoundingClientRect()` y `armarMedidor()` hace `void med.offsetWidth`. Un
         reflow CONFIRMA el 0 como estilo anterior, asi que asignar `prev%` deja de ser
         una colocacion instantanea y dispara `transition:width 1s`: la barra barre de
         CERO a `prev`, y 70 ms despues se redirige a `w`. Con el dato IDENTICO.
         Eso es el «se resetea y arranca de 0» que Daniel llevaba viendo: no dependia de
         los datos ni de la memoria, sino del reflow que hace otra funcion por el medio.
         Mismo remedio que ya usa `armarMedidor`: apagar la transicion, colocar, forzar
         el reflow y devolverla. */
      i.style.transition='none';
      i.style.width=(prev!=null?prev:0)+'%';
      void i.offsetWidth;
      i.style.transition='';
      if(prev===w) return;                    // mismo dato: ni se toca
      /* setTimeout, no rAF: en pestaña de fondo rAF no dispara y quedaría a cero */
      setTimeout(function(){ i.style.width=w+'%'; }, 70);
    });
    $$('.mk',b).forEach(function(m){ m.style.left=m.dataset.l+'%'; });
  });
  _guardarAnchos_();
  $$('.barhet span',root||document).forEach(function(s){ s.style.left=s.dataset.l+'%'; });
}

function deltaHTML(k,v,ref,txt){
  var d=ref?(v-ref)/ref*100:0, cls=d>=0?'pos':'neg';
  var w=Math.min(Math.abs(d),80)/80*50, left=d>=0?50:(50-w);
  return '<div class="dlt '+cls+'" data-w="'+w.toFixed(2)+'" data-l="'+left.toFixed(2)+'">'+
    '<span class="k">'+k+'</span>'+
    '<span class="tr"><i class="z"></i><b class="f"></b><s class="m"></s></span>'+
    '<span class="vv"><span class="'+(d>=0?'up':'dn')+'">'+pc(d)+'</span>'+
    '<span class="rr">'+esc(txt)+'</span></span></div>';
}

function animarDeltas(root){
  $$('.dlt',root||document).forEach(function(el){
    var w=parseFloat(el.dataset.w), l=parseFloat(el.dataset.l);
    var f=$('.f',el), m=$('.m',el);
    f.style.width='0'; f.style.left='50%'; m.style.left='50%';
    setTimeout(function(){
      f.style.width=w+'%'; f.style.left=l+'%';
      m.style.left=(el.classList.contains('pos')?50+w:50-w)+'%';
    }, redu()?0:80);
  });
}

/* GEMELA EN OTRO RUNTIME: `_pausaMs_` del backend hace esta MISMA cuenta en
   milisegundos (suma de tramos `{ini,fin}`; el tramo abierto cuenta hasta ahora). No se
   pueden fundir -son runtimes distintos- pero **si cambia la semantica de `pausas`, hay
   que tocar las dos**. Mapa §5, D7. */
function _pausaMinMovil_(pausas){ var now=Date.now(), t=0; (pausas||[]).forEach(function(p){ var pi=Date.parse(p.ini), pf=p.fin?Date.parse(p.fin):now; if(pf>pi) t+=(pf-pi); }); return Math.round(t/60000); }

function minSes(){
  var s=ST.ses;
  if(s.cloudIni) return Math.max(0, Math.min(840, Math.round((Date.now()-Date.parse(s.cloudIni))/60000)) - _pausaMinMovil_(s.pausas));  // nube: REAL menos pausas, tope 14 h (en pausa el reloj se congela)
  if(s.estado==='parada') return 0;
  if(s.estado==='pausada') return s.acum;
  return s.acum + Math.round((Date.now()-s.ini)/60000*DEMO_X);
}

/* al cerrar se redondea a cuartos de hora con suelo de 15 min: nadie declara 0 h */
function horasSesion(){ return Math.max(0.25, Math.round(minSes()/15)/4); }

function fmtHM(m){ return pad(Math.floor(m/60))+'<span class="c">:</span>'+pad(m%60); }

/* ⛔ POR LA PUERTA UNICA (`_minHM_` de `comun.js`), que antes era un parseo A MANO -la 4a
   copia del mismo calculo-. Y no eran equivalentes: `+p[0]` con basura da **NaN**, que se
   propaga a la duracion sin dar error, mientras que el `parseInt(...,10)||0` de la puerta
   se queda con lo que entienda. */
function durForm(){
  var d=_minHM_(ST.form.fin) - _minHM_(ST.form.ini);
  if(d<0) d+=1440;                       // cruza medianoche
  return Math.round(d/15)/4;             // a cuartos de hora
}

function vFichar(){
  var s=ST.ses, min=minSes(), largo=min>=600, corre=s.estado==='corriendo';
  var nube=(typeof backendOK!=='undefined' && backendOK && SESION);   // sesión respaldada por la nube
  /* ⛔ EL PERFIL ELEGIDO, no `YO.unidad`. Esta pantalla dice QUIEN FIRMA en DOS sitios —la
     tarjeta grande de aqui abajo y la linea bajo el selector de perfil— y hasta el 07/08
     solo una de las dos seguia al perfil: la grande estaba cableada a la unidad propia. En
     el caso literal que puso Daniel (Bruno, miembro de una unidad y coordinador de OTRA)
     la pantalla habria enseñado DOS NOMBRES DISTINTOS, y el prominente era el equivocado.
     Lo destapo un verificador adversarial, no yo: yo solo mire el bloque que acababa de
     escribir. Las dos frases salen ahora de `_perfilElegido_()`, que es la unica puerta. */
  var _perf=_perfilElegido_(), rt=aprobadorDe(YO.nombre,_perf);
  var opts=TAREAS.map(function(t){
    return '<option value="'+esc(t.n)+'"'+(ST.form.tarea===t.n?' selected':'')+'>'+esc(t.n)+'</option>';
  }).join('');

  var vivo=
    '<div class="tarj">'+cab('Sesión de trabajo', corre?'en curso':(s.estado==='pausada'?'en pausa':'parada'))+
      '<div class="sesion'+(corre?' corre':'')+(s.estado==='pausada'?' pausada':'')+(largo?' larga':'')+'" id="sesion">'+
        '<div class="rel mono" id="relSes">'+fmtHM(min)+'</div>'+
        '<div class="est"><span class="d"></span><span id="estSes">'+
          (corre?'CONTANDO DESDE LAS '+s.desde:(s.estado==='pausada'?'EN PAUSA · EL RELOJ ESTÁ PARADO':'SIN SESIÓN ABIERTA'))+
        '</span></div>'+
      '</div>'+
      (s.estado!=='parada' && !nube
        ? '<div class="pasos" style="justify-content:center;margin-top:12px">'+
          '<button data-p id="btnAdel">&#9193; adelantar 9 h <span style="color:var(--ink3)">(maqueta)</span></button></div>'
        : '')+
      '<div class="sesbtn">'+
        (s.estado==='parada'
          ? (CARGA.fichaje
              /* Sin saber si YA tienes un fichaje abierto no se puede ofrecer «fichar
                 entrada»: dirias «parado» a alguien que esta fichando y ficharia dos veces. */
              ? '<button class="btn pri full" data-p id="btnIni">Fichar entrada</button>'
              : '<button class="btn full" disabled>Comprobando si ya tienes un fichaje abierto…</button>')
          : (nube
              ? '<button class="btn" data-p id="btnPausa">'+(s.estado==='pausada'?'Reanudar':'Pausar')+'</button>'+'<button class="btn no" data-p id="btnFin">Fichar salida</button>'
              : '<button class="btn" data-p id="btnPausa">'+(s.estado==='pausada'?'Reanudar':'Pausar')+'</button>'+
                '<button class="btn no" data-p id="btnFin">Fichar salida</button>'))+
      '</div>'+
      (largo?'<div class="avisolargo"><b>Llevas más de 10 h abiertas.</b> Si olvidaste cerrarla, ciérrala ahora. '+
        'A las <b>14 h</b> se cierra sola con la hora de tu última actividad ('+s.ult+') y podrás ajustarla antes de enviarla.</div>':
        '<p class="rnota">Al fichar salida tendrás que justificar las horas. No cuentan hasta que tu coordinador las firma.</p>')+
    '</div>';

  var bloque=
    '<div class="tarj">'+cab('Bloque declarado','a posteriori')+
      '<label class="campo"><span class="sc">Fecha</span><input class="mono" id="fFecha" value="'+ST.form.fecha+'"></label>'+
      /* ⛔ Y SE DICE A QUE MES VA A CONTAR si no es el de la fecha escrita. Sin esto,
         la tarjeta pone 30/07 y las horas caen en agosto: el coordinador firma una
         cosa creyendo otra. Es la regla de Daniel puesta donde se ve, no solo
         cumplida por dentro. */
      (function(){ var m=(typeof _avisoMesDelBloque_==='function')
          ? _avisoMesDelBloque_(ST.form.fecha, HOY) : '';
        return m ? '<p class="rnota" style="margin:2px 0 0">Es de otro mes: estas '+
          'horas contarán en <b>'+esc(m)+'</b>, el mes en curso. Las de un mes ya '+
          'cerrado no se pueden mover.</p>' : ''; })()+
      '<div class="selh">'+
        '<label class="campo" style="margin:0"><span class="sc">Entrada</span><select id="fIni">'+optHoras(ST.form.ini)+'</select></label>'+
        '<span class="flecha">→</span>'+
        '<label class="campo" style="margin:0"><span class="sc">Salida</span><select id="fFin">'+optHoras(ST.form.fin)+'</select></label>'+
      '</div>'+
      '<div class="pasos">'+
        '<button data-add="15" data-p>+15 min</button><button data-add="30" data-p>+30 min</button>'+
        '<button data-add="60" data-p>+1 h</button><button data-add="-60" data-p>−1 h</button>'+
      '</div>'+
      '<div class="durb"><span class="q mono" id="fDurQ">'+nf(durForm(),2)+' h</span>'+
        '<span class="t">de trabajo declarado.<br><span style="color:var(--ink3)">Sin cronómetro se marca '+
        '<b>sin fichaje</b>, y tu coordinador lo verá al firmarlo.</span></span></div>'+
    '</div>';

  var decl = ST.form.declararId!=null ? PARTES.filter(function(x){return x.id===ST.form.declararId;})[0] : null;
  return '<div class="h1">Fichar</div><p class="h1s">'+HOY+' · tus horas no cuentan hasta que tu coordinador las firma.</p>'+
    (decl
      ? '<div class="tarj" style="border-color:rgba(232,145,46,.5)"><div class="fila" style="padding-top:0"><div class="a"><b>Fichaje sin declarar</b>'+
        '<small>'+nf(decl.q,2)+' h · '+esc(decl.f)+' — elige categoría y justifícalo abajo. Si no, caduca a los 7 días.</small></div>'+
        '<div class="d"><button class="btn mini" data-canceldecl data-p>Cancelar</button></div></div></div>'
      : ('<div class="modos" id="modos">'+
          '<button data-mo="vivo" class="'+(ST.modo==='vivo'?'on':'')+'" data-p>Sesión en vivo</button>'+
          '<button data-mo="bloque" class="'+(ST.modo==='bloque'?'on':'')+'" data-p>Declarar bloque</button>'+
        '</div>'+
        (ST.modo==='vivo'?vivo:bloque)))+

    '<div class="tarj">'+cab('Justificación','obligatoria')+
      _perfilSelHTML_()+
      '<label class="campo"><span class="sc">Categoría <span class="req">*</span></span>'+
        '<select id="fCat">'+
          '<option value="tareas"'+(ST.form.cat==='tareas'?' selected':'')+'>Tarea</option>'+
          '<option value="reunion"'+(ST.form.cat==='reunion'?' selected':'')+'>Reunión no convocada</option>'+
          '<option value="turno"'+(ST.form.cat==='turno'?' selected':'')+'>Turno no convocado</option>'+
          '<option value="compensacion"'+(ST.form.cat==='compensacion'?' selected':'')+'>Compensación</option>'+
        '</select></label>'+
      (ST.form.cat==='tareas'
        ? '<label class="campo"><span class="sc">Imputar a <span class="req">*</span></span>'+
            '<select id="fTarea"><option value="">— elige una de tus tareas —</option>'+opts+
            '<option value="Trabajo de subsistema"'+(ST.form.tarea==='Trabajo de subsistema'?' selected':'')+'>Trabajo de subsistema · '+esc(_perfilElegido_())+'</option>'+
            '<option value="__otro__"'+(ST.form.tarea==='__otro__'?' selected':'')+'>Otro (lo escribo)</option>'+
            '</select></label>'+
            (ST.form.tarea==='__otro__'
              ? '<label class="campo"><span class="sc">Cuál <span class="req">*</span></span><input id="fDetalle" value="'+esc(ST.form.detalle)+'" placeholder="nombre de la tarea"></label>'
              : '')
        : '<label class="campo"><span class="sc">'+
            (ST.form.cat==='reunion'?'Nombre de la reunión':ST.form.cat==='turno'?'Qué turno':'Concepto')+
            ' <span class="req">*</span></span><input id="fDetalle" value="'+esc(ST.form.detalle)+'" placeholder="'+
            (ST.form.cat==='reunion'?'p. ej. Integración motor / estructura del 20/07':ST.form.cat==='turno'?'p. ej. Turno de taller del 19/07':'tiempo real que el sistema no refleja')+
            '"></label>')+
      '<label class="campo" style="margin-bottom:6px"><span class="sc">Qué estuviste haciendo <span class="req">*</span></span>'+
        '<textarea id="fJust" placeholder="Qué hiciste, con quién y dónde. Mínimo 25 caracteres.">'+esc(ST.form.just)+'</textarea></label>'+
      '<div class="justfila">'+
        '<div class="aroJ" id="aroJ"><svg viewBox="0 0 40 40"><circle class="f" cx="20" cy="20" r="16"/>'+
          '<circle class="p" cx="20" cy="20" r="16" pathLength="100"/></svg>'+
          '<span class="n mono" id="aroN">0</span></div>'+
        '<span class="tx" id="justTx">Te faltan <b>25 caracteres</b>.</span>'+
      '</div>'+
    '</div>'+

    '<h2 class="sec">Antes de enviar<span class="ln"></span></h2>'+
    '<div class="tarj">'+
      '<div class="const" id="const">'+
        /* Vertices: duracion arriba en el centro, los otros dos abajo. Las aristas van de
           estrella a estrella, no de caja a caja, por eso arrancan a la altura del icono. */
        '<svg class="ar" viewBox="0 0 300 150" preserveAspectRatio="none">'+
          '<path id="ar1" d="M150 26 Q96 52 62 96"></path>'+
          '<path id="ar2" d="M150 26 Q204 52 238 96"></path>'+
          '<path id="ar3" d="M62 96 Q150 118 238 96"></path>'+
        '</svg>'+
        '<div class="nodo" id="n1" style="left:50%;top:6px"><span class="es"><svg viewBox="0 0 24 24"><use href="#es"/></svg></span>'+
          '<span>Duración<em id="e1"></em></span></div>'+
        '<div class="nodo" id="n2" style="left:21%;top:80px"><span class="es"><svg viewBox="0 0 24 24"><use href="#es"/></svg></span>'+
          '<span>Imputación<em id="e2"></em></span></div>'+
        '<div class="nodo" id="n3" style="left:79%;top:80px"><span class="es"><svg viewBox="0 0 24 24"><use href="#es"/></svg></span>'+
          '<span>Justificación<em id="e3"></em></span></div>'+
      '</div>'+
      '<div class="figcierra" id="figMsg"><span class="es"><svg viewBox="0 0 24 24"><use href="#es"/></svg></span>'+
        '<span>Faltan datos: todavía no se puede enviar.</span></div>'+
    '</div>'+

    '<div class="ruta"><div class="cu"><span class="sc">Quién lo firma</span>'+
      '<p>Va a <b>'+esc(rt.nom)+'</b>, '+(rt.escalado?'Project Director':'coordinador de '+esc(_perf))+'.'+
      (rt.escalado?'<span class="esc">NADIE FIRMA LO SUYO · COMO COORDINAS '+esc(_perf).toUpperCase()+', PASA AL PROJECT DIRECTOR</span>':'')+'</p></div></div>'+

    '<button class="btn pri full" data-p id="btnEnviar" disabled style="margin-top:13px">'+
      '<span id="lblEnviar">Faltan datos para enviar</span></button>'+
    '<p class="rnota" style="margin:10px 2px 0">Al enviarlo queda <b style="color:var(--warn)">PENDIENTE</b> y no suma. '+
    'Solo cuenta cuando '+esc(rt.nom.split(' ')[0])+' lo aprueba.</p>';
}

/* validación: los tres nodos y las dos aristas */
function validarFichaje(){
  var f=ST.form;
  var declP = f.declararId!=null ? PARTES.filter(function(x){return x.id===f.declararId;})[0] : null;
  var haySes = !!declP || ST.modo!=='vivo' || minSes()>0 || !!ST.ses.cloudIni;   /* declarar: ya hay sesión cerrada */
  var dur = declP ? declP.q : (ST.modo==='vivo' ? ((minSes()>0||ST.ses.cloudIni)?horasSesion():0) : durForm());
  /* ⛔ EL TOPE SALE DE `_maxHorasParte_()`, no de un 12 escrito aqui: el servidor topa
     en 14 y con el 12 de aqui un parte de 13 h quedaba bloqueado POR PANTALLA aunque
     fuera legal. Los dos numeros nacieron con un dia de diferencia y este se quedo. */
  var _topeH = _maxHorasParte_();
  var n1 = declP ? true : (haySes && dur>0 && dur<=_topeH);
  /* la regla de qué es "la imputación" vive en _imputacion_(): un solo sitio, para que si
     cambia no haya que acordarse de tocar aquí Y en enviarFichaje (antes no daba error, solo
     desincronizaba silenciosamente lo que se valida de lo que se envía). */
  var imput = _imputacion_(f);
  var n2 = !!imput;
  var n3 = f.just.trim().length>=25;

  var e1=$('#e1'), e2=$('#e2'), e3=$('#e3');
  /* Debajo de cada estrella NO va el valor: que se encienda ya dice que ese requisito
     esta cubierto, y repetirlo recargaba el dibujo. La unica excepcion es pasarse de
     12 h, que no es adorno sino un tope que bloquea el envio. */
  if(e1) e1.textContent = (dur>_topeH) ? ('excede '+_topeH+' h') : '';
  if(e2) e2.textContent = '';
  if(e3) e3.textContent = '';

  [['n1',n1],['n2',n2],['n3',n3]].forEach(function(x){
    var el=$('#'+x[0]); if(el) el.classList.toggle('on',x[1]);
  });
  /* Cada arista une DOS vertices y se dibuja cuando los dos estan encendidos. La base
     (ar3) es la que CIERRA el triangulo, y por eso solo aparece con los tres. */
  var a1=$('#ar1'), a2=$('#ar2'), a3=$('#ar3');
  if(a1) a1.classList.toggle('on', n1&&n2);
  if(a2) a2.classList.toggle('on', n1&&n3);
  if(a3) a3.classList.toggle('on', n2&&n3);

  /* el aro de la justificación */
  var pct=Math.min(1,f.just.trim().length/25);
  var aro=$('#aroJ'), p=$('.p',aro||document), n=$('#aroN'), tx=$('#justTx');
  if(p) p.style.strokeDashoffset=(100-pct*100).toFixed(1);
  if(aro) aro.classList.toggle('ok',n3);
  if(n) n.textContent=Math.min(25,f.just.trim().length);
  if(tx) tx.innerHTML = n3
    ? 'Justificación suficiente. <b>Cuanto más concreta, antes te la firman.</b>'
    : 'Te faltan <b>'+(25-f.just.trim().length)+' caracteres</b>.';

  var todo=n1&&n2&&n3;
  var msg=$('#figMsg');
  if(msg){
    msg.classList.toggle('ok',todo);
    $('span:last-child',msg).textContent = todo
      ? 'Todo listo: ya se puede enviar.'
      : 'Faltan datos: todavía no se puede enviar.';
  }
  var b=$('#btnEnviar'), l=$('#lblEnviar');
  if(b){
    b.disabled=!todo;
    if(l) l.textContent = todo ? ('Enviar '+nf(dur,2)+' h a aprobación')
      : (!n1?'Falta la duración':(!n2?'Falta a qué imputarlas':'Falta la justificación'));
  }
  return todo;
}

/* La longitud REAL de cada arista, que es de donde salen el trazo y su desplazamiento.
   Si se queda en el fallback, la linea se dibuja a trazos en vez de entera: un dasharray
   de 80 sobre una arista de 113 es «trazo, hueco, trozo». Pasaba de verdad, porque
   `getTotalLength()` devuelve 0 mientras la pantalla no esta renderizada y `pintar()` mide
   en el mismo tick en que la enseña. Por eso se fuerza el calculo de estilo antes, y se
   reintenta en el siguiente frame si alguna sigue sin medir. */
function medirAristas(){
  var svg=$('.const svg.ar'); if(!svg) return;
  void svg.getBoundingClientRect();           // fuerza el layout: sin esto mide 0
  var faltan=false;
  ['ar1','ar2','ar3'].forEach(function(id){
    var p=$('#'+id); if(!p) return;
    var L=0; try{ L=p.getTotalLength(); }catch(e){}
    if(L>0) p.style.setProperty('--L',L); else faltan=true;
  });
  if(faltan) requestAnimationFrame(medirAristas);
}

/* ═══ EL PERFIL AL FICHAR ══════════════════════════════════════════════════════════
   Daniel (06/08/2026): «el enrutado ese debe estar en la pestana fichar tambien implementado
   para que cuando alguien tenga mas de un cargo pueda escoger que "perfil" usa».

   ⛔ Con un solo perfil NO SE PINTA. Un desplegable de una opcion no decide nada y hay que
   leerlo igual: la inmensa mayoria del equipo tiene uno solo, y a esos la pantalla no cambia.
   ⛔ Va ARRIBA DEL TODO de la justificacion, encima de «Categoria», porque no es un campo mas:
   cambia QUIEN FIRMA, y eso enmarca todo lo que se rellene debajo. */
function _perfilElegido_(){
  var p = ST.form.perfil, ps = _perfilesDe_(YO);
  if (p && _perfilValido_(YO, p)) return p;
  var d = _perfilDefecto_(YO);
  return d ? d.unidad : (ps[0] ? ps[0].unidad : '');
}
function _perfilSelHTML_(){
  if (!_hayQuePreguntarPerfil_(YO)) return '';
  var ps = _perfilesDe_(YO), el = _perfilElegido_();
  return '<label class="campo"><span class="sc">Fichas como <span class="req">*</span></span>'+
    '<select id="fPerfil">'+ ps.map(function(p){
      return '<option value="'+esc(p.unidad)+'"'+(p.unidad===el?' selected':'')+'>'+esc(p.txt)+'</option>';
    }).join('') +'</select></label>'+
    '<p class="mini" style="margin:-4px 0 10px">Lo firma <b>'+esc(_firmaDe_(el, YO.nombre))+'</b>'+
    ' · estas horas cuentan para <b>'+esc(el)+'</b></p>';
}

/* Envío del fichaje. Con cuenta real y sesión EN VIVO → api.ficharSalida: la NUBE cierra
   la sesión abierta y calcula las horas (de la entrada al momento del envío). Un BLOQUE
   declarado a mano → api.pushParte (sin fichaje). Sin backend: memoria (semilla). */
function _imputacion_(f){ return f.cat==='tareas' ? (f.tarea==='__otro__' ? f.detalle.trim() : f.tarea) : f.detalle.trim(); }

async function enviarFichaje(){
  if(!validarFichaje()) return;
  var f=ST.form, imput=_imputacion_(f);
  if(f.declararId!=null && backendOK && SESION){   // declarar un parte 'sin declarar' ya cerrado
    tost('Declarando…');
    try{ var p=await api.declararParte(f.declararId, imput, f.just.trim(), f.cat);
      if(p){ var i=PARTES.findIndex(function(x){return x.id===f.declararId;}); if(i>=0) PARTES[i]=normPMovil(p); }
      f.declararId=null; f.just=''; f.tarea=''; f.detalle=''; f.perfil=null;
      tost('Declarado · a la cola de tu coordinador.'); irA('horas');
    }catch(e){ tostErr('No se pudo declarar: ', e); }
    return;
  }
  if(backendOK && SESION){
    tost('Enviando…');
    try{
      var nuevo=null, h=0;
      if(ST.modo==='vivo' && ST.ses.cloudIni){
        var r=await api.ficharSalida(imput, f.just.trim(), f.cat, _perfilElegido_());   // la nube cierra, calcula y guarda la categoría
        if(r && r.parte){ nuevo=normPMovil(r.parte); h=r.parte.horas; }
      } else {
        var dur=durForm();
        /* ⛔ La clave se genera AQUI, fuera de `api.pushParte`, porque `api._post` reintenta
           hasta tres veces: si naciera dentro, cada reintento seria un envio distinto. */
        var rec=await api.pushParte({ fecha:_dmyAISO_(f.fecha), tarea:imput, categoria:f.cat, horas:dur,
          ini:f.ini, fin:f.fin, justificacion:f.just.trim(), sinFichaje:true,
          subsistema:_perfilElegido_(), clave:_claveUso_() });
        if(rec&&rec.partes&&rec.partes[0]){ nuevo=normPMovil(rec.partes[0]); h=dur; }
      }
      if(nuevo) PARTES.unshift(nuevo);
      /* ⛔ `perfil` TAMBIEN se limpia. Dejarlo pegado del envio anterior haria que una
         eleccion puntual («esto fue como coordinador de X») enrutara **todo lo siguiente**
         a ese cargo, en silencio y sin volver a preguntar -- que es exactamente el fallo
         que la regla del defecto («por defecto va TU UNIDAD, no el cargo») existe para
         evitar. Se descubrio mirandolo en el navegador: la pantalla no lo delata. */
      /* ⛔ Y LA FECHA TAMBIEN, por el MISMO motivo que el perfil de aqui arriba — el
         comentario de al lado razona este fallo exacto para el otro campo y a este no
         se le aplico. Declaras un bloque atrasado del 30/07 y TODOS los siguientes de
         esa sesion salen con el 30/07, en silencio y sin volver a preguntar. Vuelve a
         HOY, que es el caso normal. */
      ST.ses={estado:'parada'}; f.just=''; f.tarea=''; f.detalle=''; f.perfil=null;
      f.fecha=HOY;
      tost('Fichaje enviado · '+nf(h,2)+' h a la cola de tu coordinador');
      irA('horas');
    }catch(e){
      /* ⛔ SI LA CULPA ES LA SESION, EL AVISO NO CADUCA. Es el caso que reportó José
         Manuel: el mensaje explica que hay que volver a entrar y que no se guardó nada,
         y son ~110 caracteres — en 2,4 segundos **no da tiempo a leerlo**. La regla ya
         estaba decidida (`decisiones-app.md`, 28/07): *un aviso que caduca solo sirve
         para lo que no importa*. Perder un fichaje importa. */
      tost('No se pudo enviar: '+((e&&e.message)||e), (e && e.sesion) ? {fijo:true} : null);
    }
    return;
  }
  var durd = ST.modo==='vivo' ? horasSesion() : durForm();   // demo local (sin backend)
  PARTES.unshift({id:++SEQ, f:f.fecha, t:imput, cat:f.cat, q:durd, e:'pend',
    ini:f.ini, fin:f.fin, just:f.just.trim(),
    sinFichaje: ST.modo==='bloque'});
  ST.ses={estado:'parada',ini:null,acum:0,desde:null,ult:ST.ses.ult};
  f.just=''; f.tarea=''; f.detalle=''; f.perfil=null;
  tost('Enviado · '+nf(durd,2)+' h pendientes de firma');
  irA('horas');
}

function catEti(c){ return CAT_ETI[c]||CAT_ETI.compensacion; }

/* Desglose de lo que TUS imputaciones sumaron a cada categoría (no el total de la categoría en
   Notion, que además lleva reuniones auto, cursos, etc.): es la parte que puedes verificar tú. */
function desgloseCat(ps){
  if(!ps.length) return '';
  var g={}, orden=['reunion','tareas','turno','compensacion'];
  ps.forEach(function(p){ var k=(p.cat in CAT_ETI)?p.cat:'compensacion'; g[k]=(g[k]||0)+p.q; });
  var chips=orden.filter(function(k){return g[k];}).map(function(k){
    return '<span class="pil neu" style="margin:0 6px 6px 0">'+esc(CAT_ETI[k])+' <b class="mono">'+h1(g[k])+'</b></span>';
  }).join('');
  return '<div style="display:flex;flex-wrap:wrap;margin:2px 0 4px">'+chips+'</div>';
}

function filaParte(p){
  var cls = p.e==='conf'?'borde-ok':p.e==='otor'?'borde-ot':(p.e==='rech'||p.e==='cad')?'borde-no':'borde-pe';
  var pil = p.e==='conf'?'<span class="pil conf">aprobada</span>'
          : p.e==='otor'?'<span class="pil otor">otorgada</span>'
          : p.e==='rech'?'<span class="pil no">rechazada</span>'
          : p.e==='det' ?'<span class="pil pend">falta detalle</span>'
          : p.e==='cad' ?'<span class="pil no">caducada</span>'
          : p.e==='sindecl'?'<span class="pil pend">sin declarar</span>'
          : '<span class="pil pend">en cola</span>';
  var sub = p.e==='otor' ? (p.nota?esc(p.nota):(p.f+(p.ini?' · '+p.ini+'–'+p.fin:'')))
          : p.e==='pend' ? 'esperando aprobación'
          /* ⛔ SE ENSEÑA LA PREGUNTA, NO QUE HAY UNA. «Te piden más detalle» no dice QUÉ
             falta, así que el miembro tiene que adivinar o preguntar por Discord — y el
             motivo lo escribió el coordinador precisamente para eso. Es obligatorio en el
             servidor (mínimo 8 caracteres), así que aquí siempre hay algo que enseñar. */
          : p.e==='det'  ? (p.nota ? 'te piden: '+esc(p.nota) : 'te piden más detalle')
          : p.e==='rech' ? 'rechazada'+(p.nota?' · '+esc(p.nota):'')
          : p.e==='sindecl' ? (p.f+(p.ini?' · '+p.ini+'–'+p.fin:'')+(p.caduca?' · caduca '+_isoADMY_((''+p.caduca).slice(0,10)):''))
          : (p.f+(p.ini?' · '+p.ini+'–'+p.fin:''));
  var catTxt = (p.e==='conf'||p.e==='otor') ? ' · sumó a '+catEti(p.cat)
             : p.e==='pend' ? ' · irá a '+catEti(p.cat) : '';
  /* ⛔ Y EL BOTON TAMBIEN EN 'det'. Sin el, la linea de arriba prometia «vuelve a enviarla»
     sobre una ficha sin nada que pulsar: la promesa estaba escrita desde el primer dia y no
     habia camino. Dice «Responder» y no «Declarar» porque no es lo mismo — ahi ya hay un
     parte escrito y lo que se hace es contestar a una pregunta concreta. */
  var accion = (p.e==='sindecl' || p.e==='det')
    ? '<button class="btn mini" data-declarar="'+p.id+'" data-p style="margin-right:7px">'+
        (p.e==='det' ? 'Responder' : 'Declarar')+'</button>'
    : '';
  return '<div class="fila '+cls+'"><div class="a"><b>'+esc(p.t||'Fichaje sin declarar')+'</b><small>'+sub+catTxt+
    _origenParte_(p)+'</small></div>'+
    '<div class="d">'+accion+pil+' <b class="mono">'+h1(p.q)+'</b></div></div>';
}

function _movHorasHTML_(confs){
  var r=_ultimosMov_(confs, function(p){ return p.f; }, function(p){ return p.q; }, 'mes');
  var _cr=_compEsReal_(YO), _cb=_compBase_(YO), _cx=_compExtra_(YO), comp=_compMensual_(YO);
  /* El rotulo dice lo que SE SABE. Sin el dato de Notion no se puede afirmar que sea el tuyo:
     es el defecto del cargo y se dice asi. Llamar «tuyo» a un numero deducido es la clase de
     mentira pequena que hace que nadie se fie del resto de la pantalla. */
  var _cet = _cr ? 'la que te toca por tu cargo · no se ficha'
                 : 'se te asigna cada mes · no se ficha';
  /* LA EXTRA, EN SU PROPIA FILA. Ver `_compExtra_`: no es mas cantidad de lo mismo, es otra
     cosa — la base llega por el puesto y la extra la asigna el PD por trabajo de mas. */
  var _fx = !_cx ? '' :
    '<div class="fila borde-ot"><div class="a"><b>Compensación extra</b>'+
      '<small>'+(_cx>0?'te la ha asignado el Project Director por trabajo de más':
                       'ajuste sobre la base de tu cargo')+' · solo de este mes</small></div>'+
      '<div class="d"><b class="mono">'+(_cx>0?'+':'')+nf2(_cx)+' h</b></div></div>';
  /* ⛔ LA COMPENSACION ES UN APUNTE, Y LA CABECERA NO LA CONTABA. Daniel (07/08):
     *«dice 0 apuntes este mes cuando si los hay: la compensacion inicial es un
     apunte»*. Y tenia razon dos veces: el cuerpo la pinta como una fila mas, y la
     lista de abajo YA le reserva un hueco (`MOVS_N-1`) porque ocupa uno de los cinco.
     O sea que el unico sitio que no la contaba era el numero que la anuncia.
     ⚠️ Se cuenta cuando LLEVA HORAS, no siempre: con el dato real de Notion una
     compensacion puede valer 0, y anunciar un apunte de cero horas seria el mismo
     fallo del reves. Con el defecto del cargo nunca es 0 (`_compBase_` da 2 h).
     ⚠️ Y la EXTRA no suma otro: va dentro del mismo apunte -- lo dice el comentario
     de abajo y por eso comparten hueco. */
  var _ap = _apuntesMes_(r.total, _cr?_cb:comp, _cx);
  return '<div class="plg" style="margin-top:11px"><div class="plgh" data-plg data-p>'+
      '<b>Últimos movimientos</b><small>'+_ap+' apunte'+(_ap===1?'':'s')+' este mes · '+
        'de qué se componen estas horas</small>'+
      '<svg viewBox="0 0 24 24" style="margin-left:auto;width:15px;height:15px;fill:none;'+
        'stroke:currentColor;stroke-width:2.4;transition:transform .3s"><path d="M6 9l6 6 6-6"/></svg></div>'+
    '<div class="plgc" hidden>'+
      /* LA COMPENSACION POR CARGO VA LA PRIMERA: es la contribucion que nadie ve venir -no la
         fichas, te la dan- y la que hace que la cuenta cuadre con el Panel de Rendimientos. */
      '<div class="fila borde-ot"><div class="a"><b>Compensación'+(_cr?' por tu cargo':' mensual por cargo')+'</b>'+
        '<small>'+esc(_cet)+'</small></div>'+
        '<div class="d"><b class="mono">'+nf2(_cr?_cb:comp)+' h</b></div></div>'+_fx+
      (r.total ? desgloseCat(r.todos) : '')+
      '<p class="rnota" style="margin:8px 0 10px">'+
        (r.total
          ? 'A qué categoría del Panel de Rendimientos sumó cada una de tus horas de este mes. '+
            _notaRegistro_(r.total,'mes', Math.max(0, MOVS_N-1))
          : 'Este mes todavía no se te ha contado ningún fichaje. Al cerrar el mes esto vuelve a '+
            'empezar; el registro <b>no se borra</b>.')+'</p>'+
      /* LA COMPENSACION CUENTA COMO UNO DE LOS CINCO (Daniel, 03/08: «los ultimos 5 tambien
         son los ultimos 5 del mes, INCLUYENDO la compensacion inicial»). Antes se pintaba
         aparte y encima de los 10, asi que la pantalla anunciaba un numero y ensenaba otro.
         La extra, cuando la hay, va DENTRO de ese mismo apunte: es la misma contribucion. */
      r.todos.slice(0, Math.max(0, MOVS_N-1)).map(filaParte).join('')+
      '<button class="btn mini" data-desgmes data-p style="margin-top:9px">'+
        'Ver el desglose completo de este mes</button>'+
    '</div></div>';
}

function _desgloseMesHTML_(confs){
  var r=_ultimosMov_(confs, function(p){ return p.f; }, function(p){ return p.q; }, 'mes');
  var comp=_compMensual_(YO), total=r.suma+comp;
  var cargo=(YO&&YO.cargo)||'miembro', _cr=_compEsReal_(YO), _cb=_compBase_(YO), _cx=_compExtra_(YO);
  var fila=
    '<div class="fila borde-ot"><div class="a"><b>Compensación'+(_cr?' por tu cargo':' mensual por cargo')+'</b>'+
      '<small>'+esc(cargo)+' · se te asigna cada mes, no se ficha · vuelve a asignarse en el '+
      'cierre</small></div>'+
    '<div class="d"><span class="pil otor">automática</span> <b class="mono">'+nf2(_cr?_cb:comp)+' h</b></div></div>'+
    /* La EXTRA va en su propia fila: es trabajo reconocido, no mas base. Sin el dato de Notion
       (`_compExtra_` devuelve 0) esta fila no existe, en vez de ensenar un cero que no dice nada. */
    (!_cx ? '' :
    '<div class="fila borde-ot"><div class="a"><b>Compensación extra</b>'+
      '<small>'+(_cx>0?'asignada por el Project Director por trabajo de más (turnos extra y demás)':
                       'ajuste sobre la base de tu cargo')+' · <b>solo de este mes</b>: en el cierre '+
      'la compensación vuelve a la base</small></div>'+
    '<div class="d"><span class="pil otor">asignada</span> <b class="mono">'+(_cx>0?'+':'')+nf2(_cx)+' h</b></div></div>');
  return '<div class="mtit">Desglose de '+esc(_mesLargo_(_hoyDateM_()))+'</div>'+
    '<div class="msub">Todas tus contribuciones de este mes, sin recortar.</div>'+
    '<div class="tarj">'+
      '<div class="cifh"><span class="g mono">'+nf2(total)+'</span><span class="sc">h este mes</span></div>'+
      desgloseCat(r.todos)+
    '</div>'+
    '<div class="tarj">'+fila+r.todos.map(filaParte).join('')+'</div>'+
    '<p class="rnota">'+(_cr
      ? 'La <b>base</b> te toca por el cargo (Project Director 7 h · Coordinador 3,5 h · miembro '+
        '2 h) y llega sola. La <b>extra</b> la asigna el Project Director cuando haces trabajo de '+
        'más, y <b>no se arrastra</b>: en el cierre la compensación vuelve a la base.'
      : 'La compensación por cargo es la <b>base</b> (Project Director 7 h · Coordinador 3,5 h · '+
        'miembro 2 h). Si tienes extras oficiales encima, están en Notion y esta pantalla '+
        '<b>todavía no los conoce</b>: hace falta el backend v54.')+'<br>'+
      'El registro <b>no se borra nunca</b>: al cerrar el mes estas horas pasan al histórico y '+
      'aquí empieza el mes nuevo.</p>';
}

function _cuotaHTML_(){
  var eur=function(n){return nf(n,2)+' €';};
  var recibo = YO.coche
    ? '<div class="rl"><span>Cuota por tus horas</span><span class="ra">'+eur(YO.cuota_base)+'</span></div>'+
      '<div class="rl desc"><span>Por poner el coche · '+YO.coche+' turno'+(YO.coche===1?'':'s')+'</span>'+
      '<span class="ra">−'+eur(YO.cuota_base-YO.cuota)+'</span></div>'
    : '<p class="rnota">Aún sin descuentos · poner el coche para ir al CITI resta 4 € por turno.</p>';
  return '<div class="mtit">Tu cuota</div>'+
    '<div class="msub">Se cierra en agosto, al acabar la temporada. Es requisito para renovar.</div>'+
    '<div class="tarj acc">'+
      '<div class="cifh"><span class="g mono" style="color:var(--ok)">'+nf(YO.cuota,2)+'</span><span class="sc">€ al año</span></div>'+
      '<div style="margin-top:12px;border-top:1px solid var(--line);padding-top:10px">'+recibo+'</div>'+
      '<p class="rnota">Sale de tus horas de la temporada: el objetivo se mueve entre 8 y 15 h/mes, con '+
      '2 h de base. Se descuentan 4 € por cada turno al que lleves el coche fuera de Vigo, y nunca baja de 0 €.</p></div>';
}

/* ═══ DECIDIR PARTES DE HORAS DESDE EL MÓVIL ════════════════════════════════════════
   Daniel (06/08): *«habilitar el teléfono a los coordinadores y subcoordinadores (y a mí) a
   aceptar y aprobar fichajes; todos los fichajes que no estén routeados deberían recaer en
   mí»*.

   ⛔ LA AUTORIDAD NO SE DECIDE AQUÍ. El backend ya la comprueba: `_puedeSobreParte_` (rango ≥ 3
   o coordinador del subsistema del parte) y, en `_decidirParte_`, **nadie decide lo suyo**. De
   ahí sale la regla que pedía Daniel sin escribir nada nuevo: si fichas *en concepto de*
   coordinador de tu propia unidad, el que aprobaría serías tú — y como no puedes, **cae en el
   PD**. Esta pantalla evita el error honesto, no al que quiera saltársela.

   ⛔ Y no se filtra por rango en la cara para decidir QUÉ se ve: se pide al servidor y se pinta
   lo que devuelva. Filtrar aquí sería tener la regla en dos idiomas — y la de la cara siempre
   se queda vieja. */

/* Cómo se ve un parte en la lista de decisión. Estaba metido dentro del cargador, así que
   la respuesta de `decidirParte` no podía reutilizarlo y había que re-preguntar al
   servidor solo para volver a formatear lo mismo. */
function _normPDec_(p){
  return { id:p.id, autor:p.autor, pila:_pilaDeM_(p.autor), unidad:p.subsistema||'—',
    f:_isoADMY_(p.fecha), ini:p.ini||'—', fin:p.fin||'—', q:Number(p.horas)||0,
    t:p.tarea||'', just:p.justificacion||'', sinFichaje:!!p.sinFichaje,
    /* ⛔ `ini`/`fin`/`decidido_por`/`revierte` viajan porque `_etiOrigenParte_` los MIRA:
       sin `ini`/`fin` un declarado a mano se rotula «sin fichaje» teniendo su hora al lado,
       y sin `decidido_por` un otorgado dice «otorgada por coordinación» sin nombre. */
    decidido_por:p.decidido_por||null, revierte:p.revierte||null,
    estado:p.estado, origen:p.origen||null };
}

/* ⛔ EL PERIODO CERRADO, para no ofrecer un botón que el servidor va a negar. `getCierre`
   es del PD, que es justo quien ve este panel; si falla se queda en `null` y **todo sigue
   como antes** — la cara es cortesía, el que se planta es el backend. */
var CIERRE_PLAN = null;

function _cargarCierrePlan_(){
  if (!(api && api.getCierre)) return Promise.resolve(null);
  return api.getCierre().then(function(c){
    CIERRE_PLAN = (c && c.plan) || null; return CIERRE_PLAN;
  }).catch(function(){ return null; });   /* ⛔ un fallo NO se lee como «mes abierto» */
}

function _cargarPartesDec_(){
  /* Los que esperan decisión, **sin** los tuyos: el backend ya te sirve solo lo que te toca. */
  return _cargarCierrePlan_().then(function(){ return api.getPartes({}); }).then(function(arr){
    if(!Array.isArray(arr)) return;
    var yo=(YO&&YO.nombre)||'';
    PARTES_DEC = arr.filter(function(p){
      return (p.estado==='pendiente' || p.estado==='detalle') && p.autor!==yo;
    }).map(_normPDec_);
    /* ⛔ Y DE LA MISMA RESPUESTA, lo ya decidido. Pedirlo en otra llamada seria un segundo
       viaje para datos que ya vienen en el primero -- `getPartes` devuelve la cola entera que
       te toca ver--, y ademas abriria la puerta a que las dos listas se contradigan porque
       cada una vio una foto distinta. */
    /* ⛔ Se quedan en la lista y se MARCAN, no se esconden: esconderlos deja la misma
       pregunta sin respuesta («¿dónde está el parte que firmé?») y encima calla el motivo. */
    PARTES_REV = arr.filter(function(p){
      return _pdRevertible_(p) && p.autor!==yo;
    }).map(function(p){
      var n = _normPDec_(p);
      n.cerrado = _mesCerradoParte_(p, CIERRE_PLAN);
      return n;
    });
  }).catch(function(){});
}

/* El rótulo de procedencia en la ficha de decisión: mismo texto que en «Tus partes», otro
   envoltorio (aquí es un bloque propio, no una coletilla). ⛔ `pdw` es ÁMBAR: se reserva para lo
   que hay que mirar. Lo otorgado por la coordinación va en gris — marcarlo en ámbar sería pedirle
   a quien firma que desconfíe de algo que hizo el sistema. */
function _pdOrigenHTML_(p){
  var e=_etiOrigenParte_(p);
  if(!e) return '';
  return e.tono==='ok'
    ? '<span class="pdw" style="background:none;color:var(--ink3)">'+esc(e.txt)+'</span>'
    : '<span class="pdw">'+esc(e.txt)+'</span>';
}

/* Una ficha de parte, dentro de la lista de decisión. Se saca aparte porque ahora vive dentro
   de DOS desplegables y el HTML de la ficha no tiene por qué enterarse de eso. */
function _pdFichaHTML_(p){
  return '<div class="pdi" data-pd="'+p.id+'">'+
        '<div class="fila"><div class="a"><b>'+esc(p.pila)+'</b>'+
          '<small>'+esc(p.unidad)+' · '+esc(p.f)+' · '+esc(p.ini)+'–'+esc(p.fin)+'</small></div>'+
          '<div class="d mono" style="font-weight:600">'+nf2(p.q)+' h</div></div>'+
        '<div class="pdt">'+esc(p.t)+'</div>'+
        (p.just?'<div class="pdj">'+esc(p.just)+'</div>':'')+
        /* ⛔ EL ROTULO SALE DE `origen`, NO DEL BOOLEANO. Con `sinFichaje` esta ficha
           llamaba «declarado sin fichaje» a un parte que ensena su hora de entrada y salida
           dos lineas mas arriba, y tambien a lo que otorga la coordinacion. Es la ficha que
           Daniel tiene delante cuando firma horas de alguien: ahi el rotulo tiene que decir
           de donde salen, no que les falta. */
        _pdOrigenHTML_(p)+
        '<input class="pdm" type="text" placeholder="Motivo — obligatorio para rechazar o pedir detalle">'+
        '<div class="pdb">'+
          '<button data-pdacc="aprobar" data-p>Aprobar</button>'+
          '<button data-pdacc="detalle" data-p>Pedir detalle</button>'+
          '<button data-pdacc="rechazar" class="no" data-p>Rechazar</button>'+
        '</div></div>';
}

/* ═══ «ESPERAN TU DECISIÓN» · DESPLEGABLE DE DESPLEGABLES ══════════════════════════════
   Daniel (07/08): *«este tipo de cosas siempre mejor que sean desplegables: ponga ahí esperan
   tu decisión —desplegable que ponga número de partes y total de horas a conceder— y al abrir
   me salga un desplegable de desplegables (1 por miembro), y dentro de cada miembro lo que me
   muestras ahora»*.

   ⛔ **Nace CERRADO.** El valor del cambio es justamente que la cabecera diga el total sin
   ocupar la pantalla: abrirlo por defecto lo dejaría igual que antes con un clic de más.
   ⚠️ Salvo cuando hay **un solo miembro**: ahí el segundo desplegable no separa nada de nada,
   así que se abre solo. Un nivel de pliegue que no agrupa nada es un clic regalado. */
/* ⛔ EL ARMAZON DE LOS DOS DESPLEGABLES, ESCRITO UNA SOLA VEZ. «Esperan tu decision» y «Ya
   decidiste» se pliegan igual: cabecera con cuantos partes y cuantas horas, dentro un
   desplegable por persona **en orden de llegada**, y las fichas dentro. Lo unico que cambia es
   el titulo, la nota y como se pinta cada ficha.

   ⚠️ **Nacio duplicado y lo canto el mutador**, no una revision: tres mutaciones que llevaban
   dias cazando pasaron a decir «ANCLA NO UNICA (2)» en cuanto la segunda copia entro. Es la
   forma mas barata que tiene esta casa de enterarse de que algo se ha escrito dos veces —
   arreglar el orden en una copia y dejar la otra alfabetica no habria dado ningun error. */
function _pdGrupoHTML_(id, titulo, nota, lista, ficha){
  if(!lista.length) return '';
  var horas=0; lista.forEach(function(p){ horas+=p.q; });
  /* Agrupado por autor CONSERVANDO EL ORDEN de llegada: ordenar por nombre pondria a la misma
     persona arriba siempre, y lo que interesa es lo que lleva mas tiempo esperando. */
  var orden=[], por={};
  lista.forEach(function(p){
    if(!por[p.autor]){ por[p.autor]=[]; orden.push(p.autor); }
    por[p.autor].push(p);
  });
  /* Con UN solo miembro el segundo nivel no separa nada de nada: se abre solo. Un pliegue que
     no agrupa es un clic regalado. */
  var unico = orden.length===1;
  return '<div class="tarj" id="'+id+'">'+
    '<details class="pdgrupo">'+
      '<summary><b>'+titulo+'</b>'+
        '<span class="pdnum">'+lista.length+' '+(lista.length===1?'parte':'partes')+
        ' · '+nf2(horas)+' h</span></summary>'+
      '<p class="rnota" style="margin:8px 0 10px">'+nota+'</p>'+
      orden.map(function(a){
        var ps=por[a], h=0; ps.forEach(function(x){ h+=x.q; });
        return '<details class="pdpers"'+(unico?' open':'')+'>'+
          '<summary><b>'+esc(ps[0].pila)+'</b>'+
            '<span class="pdnum">'+ps.length+' · '+nf2(h)+' h</span></summary>'+
          ps.map(ficha).join('')+
        '</details>';
      }).join('')+
    '</details></div>';
}

function _partesDecHTML_(){
  return _pdGrupoHTML_('pdec', 'Esperan tu decisión',
    'Son horas de tu gente: <b>no cuentan hasta que las firmes</b>. Rechazar o pedir detalle '+
    'exige un motivo.', PARTES_DEC, _pdFichaHTML_);
}

/* ⛔ QUE SE PUEDE REVERTIR, EN UN SOLO SITIO. La lista de estados vive aqui y no repartida
   por la pantalla: el dia que el backend admita uno mas, se toca una linea.
   ⚠️ `pendiente` NO esta y no es un olvido: no hay ninguna decision que deshacer, y ofrecerlo
   seria un boton que solo sabe dar error. */
function _pdRevertible_(p){
  var e = p && p.estado;
  return e==='aprobada' || e==='rechazada' || e==='otorgada' || e==='aplicada';
}

/* Como quedo el parte, en las palabras de quien lo mira -- no en las del backend. «aplicada»
   no le dice nada a nadie; «ya cuenta en su mes» si. */
var PD_EST = { aprobada:'aprobada', aplicada:'ya cuenta en su mes', otorgada:'otorgada por ti',
               rechazada:'rechazada', revertida:'revertida', anulada:'anulada' };

function _pdRevFichaHTML_(p){
  /* ⛔ EL AVISO DEPENDE DE SI YA TOCO NOTION. Revertir una aprobada sin aplicar no deja rastro;
     revertir una aplicada emite una contraparte que RESTA de su ficha. Decir lo mismo en los
     dos casos es esconder el unico que importa. */
  var enFicha = p.estado==='aplicada';
  /* ⛔ LA CABECERA SE MONTA UNA SOLA VEZ. La tuve duplicada un rato -una copia para el mes
     cerrado y otra para el normal- y eso, además de invitar a que las dos diverjan, dejó
     **un ancla de mutación apuntando a dos sitios**: la protección queda afirmada y sin
     verificar, porque una mutación que no sabe dónde ir NO SE HACE. */
  var cab = '<div class="pdi" data-pdr="'+p.id+'">'+
        '<div class="fila"><div class="a"><b>'+esc(p.pila)+'</b>'+
          '<small>'+esc(p.unidad)+' · '+esc(p.f)+' · '+esc(PD_EST[p.estado]||p.estado)+'</small></div>'+
          '<div class="d mono" style="font-weight:600">'+nf2(p.q)+' h</div></div>'+
        '<div class="pdt">'+esc(p.t)+'</div>';
  /* ⛔ MES CERRADO: ni botón ni caja de motivo, y **se dice por qué**. Sus horas ya están
     en Notion y de ahí salió la cuota; la contraparte negativa se restaría del mes EN
     CURSO — horas de otro mes, a alguien que no ha hecho nada, y sin dar error. */
  if (p.cerrado){
    return cab+
        '<span class="pdw">Mes cerrado ('+esc(p.cerrado)+'): ya no se revierte. '+
          'Esas horas ya cuentan y de ahí salió la cuota.</span>'+
      '</div>';
  }
  return cab+
        '<span class="pdw">'+(enFicha
          ? 'Ya sumadas: revertir le RESTA '+nf2(p.q)+' h de su ficha'
          : 'Aun no cuenta: revertir lo devuelve a la cola')+'</span>'+
        '<input class="pdrm" type="text" placeholder="Motivo — obligatorio (al menos 8 letras)">'+
        '<div class="pdb"><button data-pdrev="1" class="no" data-p>Revertir</button></div>'+
      '</div>';
}

/* ═══ «YA DECIDISTE» ═══════════════════════════════════════════════════════════════════
   Daniel (07/08): *«un sitio donde revisar/modificar/revertir los partes aprobados, como las
   sanciones»*. Hasta hoy una firma equivocada se quedaba firmada para siempre.

   ⛔ **Nace cerrado, y va DEBAJO de «Esperan tu decision»**: lo que hay que hacer va antes que
   lo que ya esta hecho. Arriba competiria por la atencion con la cola de verdad. */
function _pdRevHTML_(){
  return _pdGrupoHTML_('prev', 'Ya decidiste',
    'Repasa lo que ya firmaste. <b>Revertir exige un motivo</b>; si las horas ya contaban, se '+
    'le restan.', PARTES_REV, _pdRevFichaHTML_);
}

function _engPartesRev_(){
  var c=$('#prev'); if(!c) return;
  $$('#prev [data-pdrev]').forEach(function(b){
    b.onclick=async function(){
      if(b.disabled) return;
      var caja=b.closest('[data-pdr]'); if(!caja) return;
      var id=+caja.dataset.pdr;
      var mot=((caja.querySelector('.pdrm')||{}).value||'').trim();
      /* Mismo minimo que el servidor (8): comerse un viaje de red para que te digan lo que ya
         se sabia es una pantalla que te hace perder el rato. */
      if(mot.length<8){ tost('Pon un motivo (al menos 8 caracteres).'); return; }
      var p=null; PARTES_REV.forEach(function(x){ if(x.id===id) p=x; });
      if(!confirm('Revertir este parte.\n\n'+((p&&p.estado==='aplicada')
        ? 'Las horas YA cuentan: se emitira un apunte que se las resta de su ficha.'
        : 'Todavia no contaban: vuelve a la cola de decision.')+'\n\n¿Sigo?')) return;
      $$('#prev [data-pdrev]').forEach(function(x){ x.disabled=true; });
      var prev=b.textContent; b.textContent='…';
      try{
        var r=await api.revertirParte(id, mot);
        tost((r && r.reversion) ? 'Revertido. Se le restan las horas.' : 'Revertido.');
        /* Se quita con lo que ya tenemos, sin volver a preguntar -- por lo mismo que
           `_engPartesDec_`: la relectura salia antes de que el Sheet confirmase y devolvia el
           estado de antes, dejando la ficha «congelada» en pantalla. */
        PARTES_REV = PARTES_REV.filter(function(x){ return x.id!==id; });
        pintar();
        _cargarPartesDec_().then(pintar);
      }catch(e){
        tost('No se pudo: '+e);
        $$('#prev [data-pdrev]').forEach(function(x){ x.disabled=false; });
        b.textContent=prev;
      }
    };
  });
}

function _engPartesDec_(){
  var c=$('#pdec'); if(!c) return;
  $$('#pdec [data-pdacc]').forEach(function(b){
    b.onclick=async function(){
      if(b.disabled) return;
      var caja=b.closest('[data-pd]'); if(!caja) return;
      var id=+caja.dataset.pd, acc=b.dataset.pdacc;
      var mot=((caja.querySelector('.pdm')||{}).value||'').trim();
      /* ⛔ El motivo se exige AQUÍ TAMBIÉN, no solo en el servidor: el backend lo rechaza con
         un error, y comerse un viaje de red para que te digan lo que ya se sabía es una
         pantalla que te hace perder el rato. El mínimo es el mismo que el suyo (8). */
      if(acc!=='aprobar' && mot.length<8){
        tost('Pon un motivo (al menos 8 caracteres).'); return; }
      /* ⛔ ESTE AVISO DECIA «ya no se pueden deshacer desde aquí» Y HOY ES FALSO: desde que
         existe «Ya decidiste», sí se puede. Un aviso que exagera se aprende a ignorar, y el día
         que diga algo de verdad grave nadie lo leerá. */
      if(acc==='aprobar' && !confirm('Aprobar estas horas.\n\nPasan a contar en el mes de quien '+
        'las declaró. Si te equivocas, lo deshaces en «Ya decidiste».\n\n¿Sigo?')) return;
      $$('#pdec [data-pdacc]').forEach(function(x){ x.disabled=true; });
      var prev=b.textContent; b.textContent='…';
      try{
        var upd=await api.decidirParte(id, acc, mot||null);
        tost(acc==='aprobar'?'Aprobado. Ya cuenta.':(acc==='rechazar'?'Rechazado.':'Detalle pedido.'));
        /* ⛔ SE QUITA DE LA LISTA CON LA RESPUESTA QUE YA TENEMOS, sin volver a preguntar.
           `decidirParte` DEVUELVE el parte decidido: pedirlo otra vez era, además de un
           viaje de más, una carrera — la lectura salía antes de que el Sheet confirmase la
           escritura y devolvía el estado de antes, así que la lista iba una decisión por
           detrás y el último se quedaba «congelado». El servidor ahora vuelca, pero esto
           es lo que hace que no dependa de eso. Es lo que ya hacía el escritorio. */
        if(upd && (upd.estado==='pendiente' || upd.estado==='detalle')){
          PARTES_DEC = PARTES_DEC.map(function(x){ return x.id===id ? _normPDec_(upd) : x; });
        } else {
          PARTES_DEC = PARTES_DEC.filter(function(x){ return x.id!==id; });
        }
        pintar();
        _cargarPartesDec_().then(pintar);        // y se re-sincroniza por detrás
      }catch(e){
        tost('No se pudo: '+e);
        $$('#pdec [data-pdacc]').forEach(function(x){ x.disabled=false; });
        b.textContent=prev;
      }
    };
  });
}

function vHoras(){
  var o=sumaE('otor'), p=sumaE('pend');
  /* MISMA PUERTA que la tarjeta de Estado (`_hMesReal_`). Habia dos tarjetas de «horas del
     mes» -una aqui y otra en `vEstado`- leyendo campos DISTINTOS, y en cuanto se toco una
     se pusieron a decir numeros distintos en la misma app: 91 h en Horas y otra cosa en
     Estado. Daniel: «no te dije que no duplicases funciones». Si mañana cambia de donde
     salen las horas, se cambia en `_hMesReal_` y las dos se enteran. */
  var _hm=_hMesReal_(YO);
  var notion=(_hm!=null);
  var cuentan=notion?_hm:o;
  /* ⛔ ORDENADOS POR FECHA, lo más nuevo primero. No había **ni un solo `sort`** en toda la
     pantalla: los partes salían en el orden en que los mandara el servidor, así que los de un
     mes viejo podían aparecer por delante de los de hoy. Daniel: *«¿por qué siguen
     apareciéndome los partes del mes anterior?»* — esto no los quita (eso lo decide él), pero
     los manda al fondo, que es donde estorban menos. */
  var _porFecha=function(a,b){ return String(b.iso||'').localeCompare(String(a.iso||'')); };
  var _todasMias=PARTES.filter(function(x){return x.e==='pend'||x.e==='det'||x.e==='rech'||x.e==='sindecl'||x.e==='cad';}).sort(_porFecha);   // en cola / con detalle pedido / rechazados / sin declarar / caducados
  var confs=PARTES.filter(function(x){return x.e==='otor';}).sort(_porFecha);   // lo que ya cuenta
  /* ⛔ LOS DE MESES PASADOS, APARTE. Ordenarlos los mandaba al fondo, pero seguían **en la
     misma lista** — y la queja de Daniel era que **aparecen**, no que aparezcan arriba. */
  /* ⚠️ El periodo se pide AQUI. La primera version usaba `d.periodo` copiado de
     `_compHorasHTML_` —donde `var d=_diasDelMes_()` si existe— y en esta funcion no: la
     pantalla de Horas reventaba entera con `ReferenceError`. El banco no lo vio porque miraba
     el texto; lo cazó pintar la pantalla en el navegador. */
  var _perAhora=_diasDelMes_().periodo;
  var mias=_todasMias.filter(function(x){ return !_esDeMesPasado_(x, _perAhora); });
  var viejas=_todasMias.filter(function(x){ return _esDeMesPasado_(x, _perAhora); });

  /* ranking CENSURADO: tu puesto y tus vecinos, sin nombres ajenos */
  /* ⛔ EL TOTAL SALE DEL DATO, NO DE UN 32 ESCRITO A MANO. El backend manda
     `ranking.total = ms.length` y el móvil lo tiraba. Con la persona nº 33 el bucle
     iba de 31 a min(32, 35) = 32 y **nunca llegaba a su propia fila**: veía dos rayas
     anónimas sin la suya, y como `filas` no salía vacía tampoco saltaba el «Sin puesto
     todavía». Hoy el roster son 32: estaba a UN ALTA de morder. El escritorio sí lo
     guarda (`DATA._ranking`), o sea que era una asimetría entre caras (§3c-9). */
  var _rk=(typeof DATA!=='undefined' && DATA && DATA._ranking) || null;
  var puesto=+YO.puesto||0;
  var total=Math.max(+((_rk&&_rk.total))||0, (DATA&&DATA.miembros&&DATA.miembros.length)||0, puesto);
  var filas='';
  /* ⛔ Y «NO SÉ CUÁNTAS HORAS POR MES» NO SE PINTA COMO UN NÚMERO. `YO.horasTemp/YO.meses`
     sin guarda da **Infinity** con `meses:0` —y `h1` lo formatea como **«∞ h»**—, y **NaN**
     con los dos campos ausentes, que `h1` convierte en **«0 h»**: la app diciéndole a
     alguien que su ponderado es cero. La guarda existe **enunciada dos veces** y en las
     dos devolviendo `null`: `comun.js` (`_umbral_`) y el escritorio, esta con el
     comentario *«se dice, no se finge»*. Aquí el móvil se protegía con `puesto>0`, que
     es OTRO campo — y `flujos/temporada.py` asigna puesto también a los de `meses = 0`.
     ⚠️ Esto NO decide dónde va en el ranking (eso lo decide Daniel): decide que, sea
     donde sea, no se le enseña un número inventado. */
  var _hm=(typeof YO.horasTemp==='number' && YO.meses) ? (YO.horasTemp/YO.meses) : null;
  for(var i=Math.max(1,puesto-2); puesto>0 && i<=Math.min(total,puesto+2); i++){
    filas += (i===puesto)
      ? '<div class="r yo"><span class="p mono">'+i+'</span><span class="n">'+esc(YO.pila)+' (tú)</span>'+
        '<span class="h mono">'+(_hm==null?'—':h1(_hm))+'</span></div>'
      : '<div class="r"><span class="p mono">'+i+'</span><span class="cens"></span></div>';
  }

  /* Lo que ESPERA TU FIRMA va lo primero: es de otra gente y tiene a alguien esperando. */
  return '<div class="h1">Horas</div><p class="h1s">Lo que ya cuenta este mes y lo que sigue pendiente de firma.</p>'+
    _partesDecHTML_()+
    _pdRevHTML_()+
    '<div class="tarj">'+cab('Horas del mes', notion?'Panel de Rendimientos':'otorgadas · pendientes')+
      '<div class="cifh"><span class="g mono" id="gHoras">'+nf2(cuentan)+'</span><span class="sc">h '+(notion?'este mes':'que cuentan')+'</span></div>'+
      '<div style="display:flex;gap:7px;margin-top:9px;flex-wrap:wrap">'+
        (notion
          ? (p?'<span class="pil pend">+'+nf2(p)+' h fichadas · pendientes de firma</span>':'')
          : ((o?'<span class="pil otor">'+nf2(o)+' h otorgadas</span>':'')+
             (p?'<span class="pil pend">+'+nf2(p)+' h pendientes</span>':'')))+
      '</div>'+
      barraHorasHTML('barHoras')+
      /* EL DESGLOSE, PEGADO A LA CIFRA (Daniel, 31/07: «como desplegable opcional donde estan
         las horas, no aparte»). Antes vivia al fondo, dentro del historial: para saber de que
         se componia tu numero habia que bajar la pantalla entera y abrir otra cosa. */
      _movHorasHTML_(confs)+
    '</div>'+

    /* ⛔ UN SOLO NIVEL, no dos. Daniel (07/08): *«la misma lógica del desplegable, pero esta
       vez, como son tuyos, no hace falta desplegable de desplegables sino solo uno»*. Agrupar
       tus propios partes por autor sería agruparlos por ti. */
    /* El contador del titulo cuenta SOLO los de este mes: si sumara los plegados, el
       numero no cuadraria con lo que se ve al abrir. */
    '<h2 class="sec">Tus partes<span class="ln"></span>'+mias.length+'</h2>'+
    '<div class="tarj">'+
      (mias.length
        ? '<details class="pdgrupo"><summary><b>Tus partes</b><span class="pdnum">'+
            mias.length+' '+(mias.length===1?'parte':'partes')+' · '+
            nf2(mias.reduce(function(t,x){ return t+(Number(x.q)||0); },0))+' h</span></summary>'+
          mias.map(filaParte).join('')+'</details>'
        : (viejas.length
            ? vacio('Ningún parte de este mes',
                'Lo que tienes en cola es de meses anteriores: está justo debajo, plegado.',
                'ficha desde la pestaña Fichar', false)
            : vacio('Ningún parte en cola',
                'No tienes horas esperando firma. Las que envíes aparecerán aquí con su estado '+
                'hasta que tu coordinador las apruebe.','ficha desde la pestaña Fichar', false)))+
      /* ⛔ CERRADO POR DEFECTO (sin `open`): es justo lo que estorbaba. Pero **sigue estando**,
         porque son horas suyas y esconderlas del todo es perder información — plegar se puede
         deshacer con un dedo, borrar el bloque no. */
      (viejas.length
        ? '<details class="pdgrupo"><summary><b>De meses anteriores</b><span class="pdnum">'+
            viejas.length+' '+(viejas.length===1?'parte':'partes')+' · '+
            nf2(viejas.reduce(function(t,x){ return t+(Number(x.q)||0); },0))+' h</span></summary>'+
          viejas.map(filaParte).join('')+'</details>'
        : '')+
    '</div>'+

    /* Las horas por subsistema van JUSTO detras de tus partes (Daniel, 28/07): lo tuyo
       primero, y al lado con que se compara. El historial se fue al fondo. */
    _rankSubsHTML_()+

    /* ⛔ SE LLAMABA «Mi carga del mes» Y NO ES LA CARGA DEL MES. `carga` es el indice de
       Notion: arrastra un 12 % del mes anterior del anterior y un 18 % del anterior, o sea
       que un 30 % del numero es historia (`reglas/carga.py`). Y ademas viene del PANEL, que
       hoy es una foto — el overlay en vivo trae puntos, horas y compensaciones, `carga` no.
       Daniel: «y la carga del mes que aparece no se si esta bien». Tenia razon. */
    '<h2 class="sec">Mi índice de carga<span class="ln"></span>banda sana 70–120</h2>'+
    '<div class="tarj">'+
      (typeof YO.carga==='number'
        ? '<div style="position:relative;height:30px;margin:4px 0 8px">'+
            '<div style="position:absolute;top:11px;left:0;right:0;height:8px;border-radius:5px;background:var(--sur2)"></div>'+
            '<div style="position:absolute;top:11px;left:38.9%;width:27.8%;height:8px;background:#1d3a2b"></div>'+
            '<div style="position:absolute;top:6px;left:calc('+Math.min(100,YO.carga/1.8).toFixed(1)+'% - 1.5px);width:3px;height:18px;'+
              'background:var(--red);border-radius:2px;box-shadow:0 0 8px rgba(228,30,37,.55)"></div>'+
            '<span style="position:absolute;top:-2px;left:38.9%;font-family:var(--mono);font-size:9px;color:var(--ink3)">70</span>'+
            '<span style="position:absolute;top:-2px;left:66.7%;font-family:var(--mono);font-size:9px;color:var(--ink3)">120</span>'+
          '</div>'+
          '<div class="fila" style="padding-bottom:0;border:0"><div class="a"><b>Carga '+nf(YO.carga,0)+'</b>'+
          /* ⛔ «de este mes» era FALSO: ese reparto se calculo cuando se genero el panel,
             no hoy. Ahora dice de cuando es, y debajo van las horas VIVAS — que es lo que
             se puede afirmar del mes en curso sin inventar nada. */
          (YO.desglose?'<small>índice del panel del '+esc(_isoADMY_(DATA.generado||'—'))+' · de ese mes '+nf(YO.desglose.aporta_mes_actual||0,0)+' · arrastre '+nf(YO.desglose.arrastre||0,0)+'</small>':'')+
          (_hMesReal_(YO)!=null?'<small>este mes llevas '+h1(_hMesReal_(YO))+', en vivo</small>':'')+
          '</div><div class="d">banda sana 70–120</div></div>'
        : vacio('Sin dato de carga','Tu carga de trabajo la calcula el motor al cerrar el mes. Todavía no ha llegado.','',false))+
    '</div>'+
    '<h2 class="sec">Ranking de horas<span class="ln"></span>temporada '+DATA.temporada+'</h2>'+
    '<div class="tarj rank">'+
      (filas
        ? filas+'<p class="rnota">Se ponderan tus horas de la temporada entre los meses que llevas en el '+
          'equipo. Ves tu puesto y el de tus vecinos; el resto va sin nombre.</p>'
        : vacio('Sin puesto todavía','Tu posición se calcula con las horas de la temporada al cerrar el mes.','',false))+
    '</div>'+

    /* La cuota se fue al menu ⋮: es una cifra que se consulta dos veces al año. */
    (esPD()?panelPD():'');
}

/* Ranking de subsistemas: vive en HORAS, al lado del ranking personal, porque las dos
   cosas responden a lo mismo -«¿cómo voy?»- y antes obligaban a cambiar de pestaña. */
function _rankSubsHTML_(){
  var subs=DATA.subsistemas||[], maxS=subs.length?subs[0].media:1;
  return '<h2 class="sec">Horas por subsistema<span class="ln"></span>media/persona</h2>'+
    '<div class="tarj">'+(subs.length?subs.map(function(s,i){
      var mio=s.u===YO.unidad;
      return '<div class="fila"><div class="a"><b'+(mio?' style="color:var(--red2)"':'')+'>'+(i+1)+'. '+esc(s.u)+(mio?' (tú)':'')+'</b>'+
        '<small>'+s.n+' personas</small>'+
        '<div style="height:7px;border-radius:4px;background:var(--sur2);margin-top:6px;overflow:hidden">'+
        '<i style="display:block;height:100%;width:'+(s.media/maxS*100).toFixed(0)+'%;border-radius:4px;'+
        'background:'+(mio?'var(--red)':'var(--ink3)')+'"></i></div></div>'+
        '<div class="d">'+h1(s.media)+'</div></div>';
    }).join('')
    : vacio('Sin datos de subsistemas','La media por unidad se calcula al cerrar el mes. Todavía no ha llegado.','',false))+'</div>';
}

