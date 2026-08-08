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
function _finDeMes_(){
  var h=new Date(), fin=new Date(h.getFullYear(), h.getMonth()+1, 0);
  var dias=Math.max(0, Math.ceil((fin-new Date(h.getFullYear(),h.getMonth(),h.getDate()))/86400000));
  var p=function(x){ return (x<10?'0':'')+x; };
  return { txt:p(fin.getDate())+'/'+p(fin.getMonth()+1)+'/'+fin.getFullYear(), dias:dias,
           mes:['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
                'septiembre','octubre','noviembre','diciembre'][h.getMonth()] };
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
