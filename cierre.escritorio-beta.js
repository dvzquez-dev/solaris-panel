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

