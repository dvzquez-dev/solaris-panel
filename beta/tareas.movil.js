/* ═══ TAREAS · cara movil ═══════════════════════════════════════════════════════════
   2 funciones sacadas de `movil.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

function vTareas(){
  var hoy=new Date(_dmyAISO_(HOY)+'T00:00:00');   // mismo origen que HOY, no una fecha aparte
  var fin=TAREAS.filter(function(t){return /hech|finaliz|complet|termin|cerrad/i.test(t.e);})
    /* por FECHA real: comparar 'DD/MM/AAAA' como texto pone 12/06 por delante de 03/07 */
    .sort(function(a,b){ return String(_dmyAISO_(b.l)||'').localeCompare(String(_dmyAISO_(a.l)||'')); });
  var act=TAREAS.filter(function(t){return !/hech|finaliz|complet|termin|cerrad/i.test(t.e);})
    /* sin fecha limite van al final; `a.l.localeCompare` sobre null tumbaba la pantalla */
    .sort(function(a,b){
      var d=(TK_ORD[a.u]-TK_ORD[b.u]); if(d) return d;
      if(!a.l) return 1; if(!b.l) return -1;
      return String(_dmyAISO_(a.l)).localeCompare(String(_dmyAISO_(b.l)));
    });
  /* Una tarea puede no tener fecha limite: el backend manda `l:null` y es legitimo.
     Antes `l.split` reventaba y la pantalla entera se quedaba en blanco. */
  function vence(l){
    if(!l) return ['sin fecha límite',false];
    /* ⛔ LOS DOS FORMATOS, Y LA PREMISA DE AQUI DEBAJO ERA FALSA. Ponia «la fecha
       `DD/MM/AAAA` que manda Notion» y Notion **no manda eso**: `Codigo.gs` emite
       `l: date.start`, que es **ISO `AAAA-MM-DD`**. Con `split('/')`, `'2026-07-27'`
       daba un array de UNO, caia por `length<3` y la tarea salia como
       **«sin fecha limite»** — y nunca en rojo, porque el segundo elemento es `false`.
       ⛔ O sea: en cuanto entra el token, TODAS las tareas con plazo lo escondian. La
       pantalla que existe para que no se te pase un plazo era la que te lo tapaba, y de
       ahi sale el **Art. 30c** en un expediente de una persona real.
       ⚠️ Solo funcionaba con la semilla de demostracion, que si es `DD/MM/AAAA`.
       ✅ `_dmyAISO_` es la puerta que ya acepta los dos — la misma que usa `_plazoTxt_`,
       donde esta leccion ya estaba escrita. Se aplico donde se enuncio y no aqui, que es
       donde se citaba (§3c-19).
       ⚠️ Y la CUENTA sigue saliendo de `_diasHasta_` (`comun.js`), la misma que usa
       Reuniones: el corte de «corre prisa» y el redondeo tienen que ser UNO. */
    var iso=_dmyAISO_(String(l));
    if(!/^\d{4}-\d{2}-\d{2}/.test(iso)) return ['sin fecha límite',false];
    var d=_diasHasta_(Date.parse(iso));
    if(d===null) return ['sin fecha límite',false];
    if(d<0) return ['venció hace '+(-d)+' día'+(-d===1?'':'s'),true];
    if(d===0) return ['vence hoy',true];
    return ['vence en '+d+' día'+(d===1?'':'s'),d<=_DIAS_PRISA_];
  }
  function fila(t){
    var v=vence(t.l);
    return '<div class="fila"><div class="a"><b>'+esc(t.n)+'</b>'+
      '<small>'+esc(t.s)+' · '+esc(t.pr)+' · <span style="color:'+(v[1]?'var(--red2)':'var(--ink3)')+'">'+v[0]+'</span></small></div>'+
      '<div class="d"><span class="pil '+(t.e==='Revisando'?'conf':t.e==='En desarrollo'?'pend':'neu')+'">'+esc(t.e)+'</span></div></div>';
  }
  return '<div class="h1">Mis tareas</div><p class="h1s">'+act.length+' activa'+(act.length===1?'':'s')+
    ' · ordenadas por urgencia y fecha límite.</p>'+
    '<div class="tarj">'+(act.length?act.map(fila).join(''):
      vacio('Sin tareas asignadas','No tienes ninguna tarea asignada ahora mismo. Cuando tu coordinador '+
        'te asigne una, aparecerá aquí.','',false))+'</div>'+
    (act.length?'<div class="tarj" style="background:rgba(63,158,214,.05);border-color:rgba(63,158,214,.3)">'+
      '<p class="rnota" style="margin:0">Al fichar puedes imputar tus horas a cualquiera de estas tareas. '+
      'Si crees que una no te corresponde, puedes apelarla (Art. 34).</p></div>':'')+
    /* mismo cajon que en Turnos: cuenta y la ultima, para que las dos pantallas se lean igual */
    (fin.length?'<div class="cajon" data-caj data-p><span>Tareas pasadas <b>· '+fin.length+'</b>'+
        (fin[0]&&fin[0].l?' <span style="color:var(--ink3)">· la última, '+esc(fin[0].l)+'</span>':'')+'</span>'+
      '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></div>'+
      '<div class="cajsec"><div class="tarj">'+fin.map(fila).join('')+'</div></div>':'');
}

/* ¿Tienes tareas vivas? Mismo criterio que usa la pantalla para separar «en curso» de
   «hechas»: si divergieran habria una pestaña que al pulsarla no tiene nada, que es justo
   el fallo que reporto Adrian con Documentos. */
function _tareasRelevantes_(){
  return (TAREAS||[]).some(function(t){ return !/hech|finaliz|complet|termin|cerrad/i.test(t&&t.e); });
}

