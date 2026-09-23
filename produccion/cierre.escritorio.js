/* ═══ CIERRE · cara escritorio ═══════════════════════════════════════════════════════════
   3 funciones sacadas de `escritorio.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

async function _cargarCierre_(){
  if(typeof backendOK==='undefined' || !backendOK || !SESION){ CIERRE_ERR='sin conexión'; return; }
  try{ CIERRE=await api.getCierre(); CIERRE_ERR=null; }
  catch(e){ CIERRE=null; CIERRE_ERR=(e&&e.message)||String(e); }
  pintar();
}

/* El ultimo dia del mes y los que faltan, CALCULADOS. Estaban escritos a mano en el HTML
   («31/07/2026», «7 días»): en octubre habrian seguido diciendo lo mismo. */
/* ⛔ `hoy` ES OPCIONAL Y EXISTE PARA PODER PREGUNTARLE. El desvio del cambio de hora solo
   aparece **25 dias al año**, asi que un banco que la ejecute con el reloj de la maquina sale
   CIEGO 340 dias y ROJO los otros 25 -- las dos formas de no vigilar nada. Con la fecha
   inyectable, el caso pregunta por el 1 de octubre cualquier dia del año.
   ⚠️ Produccion la sigue llamando sin argumento: no cambia nada de lo que se ve. */
/* El DIA de una fecha, sin hora y sin huso. Se cuenta con esto y no restando dos `Date`
   locales porque en Europe/Madrid un intervalo que cruce el cambio de hora son N dias **+1 h**,
   y segun el redondeo eso se convierte en un dia entero.
   ⛔ VIVE AQUI Y NO DENTRO DE CADA FUNCION porque lo usan DOS (`_finDeMes_` y
   `_plazoCierre_`), y dos copias de la misma linea no son un detalle de estilo: la segunda
   copia **duplico un ancla de mutacion** y dejo esa mutacion sin probar -- salio «el ancla
   sale 2 veces», que es como se pierde un guardia sin que nadie lo borre. */
function _diaUTC_(d){ return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); }

function _finDeMes_(hoy){
  var h=hoy||new Date(), fin=new Date(h.getFullYear(), h.getMonth()+1, 0);
  /* ⛔ POR UTC, NO POR HORA LOCAL. Restar dos `Date` locales cuenta las HORAS reales, y
     en Europe/Madrid el intervalo hasta el 31/10 cruza el cambio de hora del **25/10**: son
     N dias **+1 h**, y `Math.ceil` lo sube a **N+1**.
     ⛔ Medido barriendo los 730 dias de 2026 y 2027: **desvio de un dia del 1 al 25 de
     octubre de 2026** y ninguno en 2027 -- en 2027 el cambio cae el 31, fuera del intervalo.
     El 1 de octubre la pantalla diria «QUEDAN **31 dias**» de un mes que tiene 31.
     ⚠️ Y su banco se habria puesto **rojo solo**, esos 25 dias, sin que nadie tocara nada:
     un rojo con fecha de caducidad puesta, que es de los que acaban apagando un guardia.
     ✅ `Date.UTC` cuenta dias de calendario y no horas, asi que el huso no entra. */
  var dias=Math.max(0, Math.round((_diaUTC_(fin)-_diaUTC_(h))/86400000));
  var p=function(x){ return (x<10?'0':'')+x; };
  return { txt:p(fin.getDate())+'/'+p(fin.getMonth()+1)+'/'+fin.getFullYear(), dias:dias,
           mes:['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
                'septiembre','octubre','noviembre','diciembre'][h.getMonth()] };
}

/* ⛔ EL PLAZO DEL MES QUE SE CIERRA -- QUE NO ES EL QUE CORRE.

   La cabecera de esta vista pintaba `_finDeMes_()`, o sea el fin del mes EN CURSO, justo al
   lado del titulo «Cierre de julio». El 18 de agosto decia **«CIERRA 31/08/2026 · QUEDAN 13
   dias»** sobre una pantalla que cierra JULIO: dos meses distintos en la misma tarjeta. Y la
   regla que lo prohibe estaba escrita veinte lineas mas arriba en `escritorio.html`, desde el
   04/08: *«El mes que se CIERRA no es el que corre»*.

   ⛔ Y «QUEDAN» no era solo un numero mal: era la PALABRA equivocada. Un mes que ya termino no
   tiene dias que queden -- tiene dias que **lleva** esperando, que es exactamente la presion
   que esta pantalla existe para enseñar. Por eso devuelve `dias` contando al reves.

   ⚠️ `new Date(a, m, 0)` es el dia CERO del mes actual, o sea el ULTIMO del anterior: el salto
   de año sale solo (`new Date(2026,0,0)` es el 31/12/2025) y no hay ninguna resta de meses a
   mano que equivocarse. De ahi salen el dia y el nombre, preguntandoselos a `_finDeMes_` --
   una sola puerta para los nombres de mes.

   ⚠️ Y se cuenta por `Date.UTC`, no restando dos `Date` locales, por lo mismo que aprendio
   `_finDeMes_`: en Europe/Madrid un intervalo que cruza el cambio de hora son N dias **+1 h**.
   Aqui el intervalo tipico cruza el 25/10 cada año. */
function _plazoCierre_(hoy){
  var h=hoy||new Date();
  var fin=new Date(h.getFullYear(), h.getMonth(), 0);   /* el ultimo dia del mes anterior */
  var f=_finDeMes_(fin);
  return { txt:f.txt, mes:f.mes, dias:Math.max(0, Math.round((_diaUTC_(h)-_diaUTC_(fin))/86400000)) };
}

/* Lo que el movil pinta en `<details>` uno por persona, aqui es UNA tabla: en 1920 px se
   compara de un vistazo -que es para lo que se revisa un cierre- y en un telefono no cabe.
   Los campos van con su NOMBRE REAL de Notion aunque sean largos: lo que se lee aqui tiene
   que ser lo mismo que hay en la ficha, o no se puede contrastar. */
function _fichasPlanHTML_(plan){
  var fs=plan.fichas||[];
  if(!fs.length) return '';
  var filas=fs.map(function(f){
    var cs=(f.c||[]).map(function(c){
      return '<div><span class="sc">'+esc(c[0])+'</span> '+esc(_numPlan_(c[1]))+
        ' → <b>'+esc(_numPlan_(c[2]))+'</b></div>';
    }).join('');
    var extra=[];
    if(f.mp) extra.push(esc(f.mp));
    if(f.cp) extra.push('pierde '+esc(_numPlan_(f.cp))+' h de compensación');
    if(f.est && f.est!=='normal') extra.push('queda <b>'+esc(f.est)+'</b>');
    return '<tr><td><b>'+esc(f.n||'?')+'</b></td><td>'+esc(f.u||'—')+'</td>'+
      '<td>'+(cs||'<span class="sc">sin cambios</span>')+
      (extra.length?'<div class="sc" style="margin-top:4px">'+extra.join(' · ')+'</div>':'')+'</td></tr>';
  }).join('');
  return '<div class="nota" style="padding-bottom:0"><b>Qué le cambia a cada uno</b> — '+
    fs.length+' persona'+(fs.length===1?'':'s')+'</div>'+
    tabla([['Persona'],['Unidad'],['Qué cambia']], filas);
}



/* ═══ EL CIERRE DE TEMPORADA · una vez al año, el 1 de septiembre ═════════════════════════
   Hermano del mensual y con el mismo contrato: la cara ENCOLA, y quien escribe en Notion es
   `rutinas/aplicar_temporada.py` desde el gate, con alguien mirando el plan.

   ⛔ ESE DIA HAY DOS CIERRES Y EL ORDEN IMPORTA: primero el mensual de agosto, despues el
   ajuste del Art. 29l. Al reves el mensual copiaria a «Puntos mes anterior» el 5 que acaba de
   poner el ajuste y borraria los puntos reales de agosto. La regla NO se repite aqui: la tiene
   `flujos/temporada.validar_temporada` y llega como bloqueo, con su texto. Esta pantalla lo
   pinta; no lo deduce. Una regla escrita en dos sitios es una regla que va a divergir. */
async function _cargarTemporada_(){
  if(typeof backendOK==='undefined' || !backendOK || !SESION){ TEMP_ERR='sin conexión'; return; }
  try{ TEMP=await api.getTemporada(); TEMP_ERR=null; }
  catch(e){ TEMP=null; TEMP_ERR=(e&&e.message)||String(e); }
  pintar();
}

/* Los dos botones. El de calcular NO toca Notion; el de aplicar SI, y por eso pregunta con
   los numeros delante. */
function _pinTemporada_(m){
  var _ct=m.querySelector('[data-calctemp]');
  if(_ct) _ct.onclick=async function(){
    if(_ct.disabled) return;
    if(typeof backendOK==='undefined' || !backendOK || !SESION){
      tost('Sin conexión no se puede calcular el cierre de temporada.'); return; }
    /* ⛔ LA PRORROGA SE PREGUNTA, y las tres respuestas son distintas. El Art. 29l solo aplica
       si la Junta la aprobo con 2/3 (Art. 29k); «todavia no se ha votado» NO es «se voto que
       no», y el plan lo distingue: sin decision registrada se declara NO aplicable en vez de
       calcular un ajuste que nadie ha aprobado. Cancelar aqui manda `null`, que es eso. */
    var r=prompt('¿La Junta aprobó la prórroga con 2/3 (Art. 29k)?' + String.fromCharCode(10,10) +
      'Escribe SI o NO. Si lo dejas en blanco o cancelas, se calcula como «todavía sin votar», '+
      'y entonces el plan saldrá NO APLICABLE — que es lo correcto: el Art. 29l empieza con un '+
      '«si».', '');
    var pro = (r===null || !String(r).trim()) ? null
            : /^s/i.test(String(r).trim()) ? true : /^n/i.test(String(r).trim()) ? false : null;
    if(!confirm('Calcular el cierre de TEMPORADA.' + String.fromCharCode(10,10) +
      'NO se aplica nada: la rutina saca el plan (a quién le sube los puntos al suelo de 5, la '+
      'cuota de cada uno y el ranking) y lo dejará aquí para que lo revises.' +
      String.fromCharCode(10,10) + 'Prórroga: ' +
      (pro===null?'SIN VOTAR (el plan saldrá no aplicable)':pro?'aprobada':'no aprobada') +
      String.fromCharCode(10,10) + '¿Sigo?')) return;
    _ct.disabled=true; var prev=_ct.textContent; _ct.textContent='Encolando…';
    try{
      await api.calcularTemporada({prorrogado:pro});
      tost('Cierre de temporada encolado. La rutina lo recoge en la siguiente pasada.');
      await _cargarTemporada_();
    }catch(e){ _ct.disabled=false; _ct.textContent=prev;
      tostErr('No se pudo encolar: ', e); }
  };

  var _at=m.querySelector('[data-aplicartemp]');
  if(_at) _at.onclick=async function(){
    if(_at.disabled) return;
    var pl=(TEMP&&TEMP.plan)||null; if(!pl) return;
    if(typeof backendOK==='undefined' || !backendOK || !SESION){
      tost('Sin conexión no se puede aplicar.'); return; }
    /* ⛔ Y esto NO se salta desde aqui: si el plan trae bloqueos, el aplicador se planta igual.
       Ofrecerlo seria mentir sobre lo que va a pasar. */
    if(!pl.aplicable){ tost('El plan no es aplicable todavía: mira los bloqueos.'); return; }
    var t=(pl.totales)||{};
    if(!confirm('APLICAR el cierre de la temporada '+(pl.temporada||'')+'.' +
      String.fromCharCode(10,10) +
      'Esto SI escribe en Notion: sube a '+(t.suelo||5)+' puntos a '+(t.suben_a_suelo||0)+
      ' persona(s) (Art. 29l) y cierra la temporada. De aquí salen la cuota y la renovación.' +
      String.fromCharCode(10,10) +
      'Antes de tocar Notion se congela el plan y se sube el bloque a Drive; si eso falla, no '+
      'se escribe nada.' + String.fromCharCode(10,10) + '¿Lo has revisado?')) return;
    _at.disabled=true; var prev=_at.textContent; _at.textContent='Encolando…';
    try{
      await api.aplicarTemporada(pl.temporada);
      tost('Encolado para aplicar. La rutina lo recoge en la siguiente pasada.');
      await _cargarTemporada_(); pintar();
    }catch(e){ _at.disabled=false; _at.textContent=prev;
      tostErr('No se pudo aplicar: ', e); }
  };
}
