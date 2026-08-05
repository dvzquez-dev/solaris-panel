/* ═══ EQUIPO · cara escritorio ═══════════════════════════════════════════════════════════
   11 funciones sacadas de `escritorio.html`. Lo carga esa cara con <script src>, ANTES de su bloque
   grande, así que ya existen cuando aquel se ejecuta.

   ⛔ Aquí SOLO hay declaraciones `function`. El estado (`var`), los registros y las llamadas de
   arranque se quedan en el HTML: un módulo que se lleve estado se lleva el orden de carga, y ahí
   es donde se rompe sin dar error. Estas funciones siguen usando los globales de su cara — se
   llaman en tiempo de ejecución, cuando ya están definidos.

   ⛔ Y es de UNA cara. La otra tiene su propio fichero aunque alguna función se llame igual:
   fusionarlas es otro cambio, con otro riesgo y su propia verificación.
   ═══════════════════════════════════════════════════════════════════════════════════════ */

function _rederivarCargos_(){
  var pd=DATA.miembros.filter(function(m){ return m.cargo==='Project Director'; })[0];
  if(pd) PD_NOM=pd.nombre;
  if(!miembro(REV2_NOM)){
    /* sin segundo revisor en el roster, el escalado cae en el PD y hay que decirlo */
    var c=DATA.miembros.filter(function(m){ return m.cargo==='Coordinador' && m.nombre!==PD_NOM; })[0];
    REV2_NOM = c ? c.nombre : PD_NOM;
  }
}

/* miembro() puede devolver null y eso es correcto (sirve para preguntar «existe?»).
   Lo que NO puede es usarse directo en el render: el dato real trae nombres que no
   casan con el roster (un turno del Discord firmado con otro apellido, un parte de
   alguien que ya se fue). _m() SIEMPRE devuelve algo pintable y marca al desconocido. */

function _m(n){
  var x=miembro(n); if(x) return x;
  var nom=String(n||'').trim();
  return {nombre:nom||'\u2014', pila:(nom.split(' ')[0]||'\u2014'), unidad:'\u2014',
          cargo:null, puntos:null, hMes:0, hAnt:null, horasTemp:0, meses:1, cuota:null,
          coche:0, infraccion:false, _fuera:true};
}



function _rolDe_(nombre){
  if(nombre===PD_NOM) return 'Project Director';
  if(nombre===REV2_NOM) return 'Revisor fijo';
  var m=miembro(nombre);
  return (m&&m.cargo==='Coordinador') ? ('Coordinador de '+m.unidad) : 'Miembro';
}

function colaDecision(){
  var out=[];
  pendientes().filter(function(p){return puedeDecidirParte(p,ACTOR);}).forEach(function(p){
    out.push({ic:'i-reloj',b:h1(p.horas)+' de '+_m(p.autor).pila,
      s:esc(p.tarea)+' · '+p.fecha+(p.origen==='bloque'?' · declarado sin fichaje':''),
      chip:'<span class="chip wa">parte de horas</span>',ir:'partes',foco:'parte-'+p.id});
  });
  docsMios().forEach(function(d){
    out.push({ic:'i-doc',b:esc(d.tit),s:d.ref+' · '+_m(d.autor).pila+' · ámbito '+d.amb+
      (d.iss?' · '+d.iss+' aviso'+(d.iss===1?'':'s'):''),
      chip:'<span class="chip '+(d.sev==='alta'?'no':d.sev==='media'?'wa':'ok')+'">severidad '+d.sev+'</span>',
      ir:'docdec',foco:'doc-'+d.id});
  });
  if(!LOTE.cerrado && rangoNom(ACTOR)>=3)
    out.push({ic:'i-gavel',b:'Bloque de sanciones · '+LOTE.nombre,
      s:LOTE.items.length+' personas · Art. '+LOTE.art+' · nada se aplica hasta cerrarlo entero',
      chip:'<span class="chip no">bloque abierto</span>',ir:'sanciones',foco:'lote'});
  REUS.forEach(function(r0){
    if(r0.fijada) return;
    var cob=_cobertura_(r0);
    var r=Object.assign({}, r0, {tit:r0.tit||r0.titulo,
      conv:(r0.conv!=null?r0.conv:cob.conv), cubren:(r0.cubren!=null?r0.cubren:cob.cubren),
      limite:r0.limite||'sin l\u00edmite'});
    if(r.cubren>=r.conv) return;
    out.push({ic:'i-cal',b:'\u00ab'+esc(r.tit)+'\u00bb sin fijar',
      s:r.cubren+' de '+r.conv+' han cubierto \u00b7 cierra el '+r.limite,
      chip:'<span class="chip">reunión</span>',ir:'dispo',foco:'reu-'+r.id});
  });
  return out;
}

/* lecturas automáticas: lo que un humano no ve de un vistazo en una tabla */
function insightsHTML(){
  var xs=[];
  /* se ordena por el MISMO porcentaje que luego se imprime: si no, el rotulo nombra
     a uno y ensena un numero que no es el mayor. */
  /* Tambien solo activos: «quien mas sube este mes» no puede ser alguien que se fue. */
  var conAnt=_activos_().filter(function(m){ return m.hAnt!=null && m.hAnt>0; });
  if(conAnt.length>=2){
    var vpc=function(m){ return (m.hMes-m.hAnt)/m.hAnt*100; };
    var subida=conAnt.slice().sort(function(a,b){return vpc(b)-vpc(a);})[0];
    var bajada=conAnt.slice().sort(function(a,b){return vpc(a)-vpc(b);})[0];
    xs.push(['up',esc(subida.pila)+' es quien m\u00e1s sube: '+pc(vpc(subida))+
      ' respecto al mes pasado ('+h1(subida.hAnt)+' \u2192 '+h1(subida.hMes)+').']);
    xs.push(['dn',esc(bajada.pila)+' es quien m\u00e1s baja: '+pc(vpc(bajada))+
      ' ('+h1(bajada.hAnt)+' \u2192 '+h1(bajada.hMes)+').']);
  } else {
    /* no se finge una comparativa que no existe: se dice que falta el dato */
    xs.push(['wa','Todav\u00eda no hay horas del mes anterior, as\u00ed que no se puede comparar la evoluci\u00f3n.']);
    var top=_activos_().slice().sort(function(a,b){return (b.hMes||0)-(a.hMes||0);})[0];
    if(top) xs.push(['up',esc(top.pila)+' es quien m\u00e1s horas lleva este mes: '+h1(top.hMes||0)+'.']);
  }
  var enAire=pendientes().reduce(function(a,p){return a+p.horas;},0);
  if(enAire>0) xs.push(['wa',h1(enAire)+' están sin firmar. Mientras sigan ahí, el umbral del mes y el '+
    'ranking se calculan con datos incompletos.']);
  var sinCubrir=REUS.reduce(function(a,r){
    var sc = r.sinCubrir || _cobertura_(r).sinCubrir;   /* el dato real no lo trae: se deriva */
    return a+((sc&&sc.length)||0); },0);
  if(sinCubrir) xs.push(['wa',sinCubrir+' personas no han cubierto alguna disponibilidad abierta. '+
    'Mira «Disponibilidad y riesgo» para ver qué sanción implicaría a cada una.']);
  var largos=CURSO.filter(function(c){return c.min>=600;}).length;
  if(largos) xs.push(['wa',largos+' fichaje'+(largos===1?'':'s')+' lleva'+(largos===1?'':'n')+
    ' más de 10 h abierto. A las 14 h se cierran solos con la hora de la última actividad.']);
  return xs.map(function(x){
    return '<div style="display:flex;gap:9px;padding:8px 0;border-top:1px solid rgba(50,44,46,.7);font-size:12.5px;color:var(--ink2);line-height:1.55">'+
      '<span class="'+x[0]+'" style="flex:none;font-family:var(--mono)">'+(x[0]==='up'?'▲':x[0]==='dn'?'▼':'!')+'</span>'+
      '<span>'+x[1]+'</span></div>';
  }).join('');
}

function conteo(k){
  if(k==='partes') return pendientes().filter(function(p){return puedeDecidirParte(p,ACTOR);}).length;
  if(k==='sindeclarar') return PARTES.filter(function(p){return p.estado==='sindecl';}).length;
  if(k==='curso')  return CURSO_CONECTADO ? CURSO.length : 0;   // sin conectar no hay nada que contar
  if(k==='docdec') return docsMios().length;
  if(k==='docurso')return DOCS.filter(function(d){return ['recibido','analizado','revision','cambios'].indexOf(d.est)>=0;}).length;
  if(k==='docpub') return DOCS.filter(function(d){return d.est==='publicado';}).length;
  if(k==='sanciones') return LOTE.cerrado?0:LOTE.items.length;
  if(k==='apela')  return 0;        // no hay cola de apelaciones: contar la maqueta era mentir
  if(k==='convoc') return REUS.length;
  if(k==='turnos') return TURNOS.length;
  if(k==='tareas') return TAREAS.length;
  if(k==='miembros') return DATA.miembros.length;
  if(k==='reclutar') return 0;      // idem: no hay candidaturas en ningun sistema
  return 0;
}

/* llevar al sitio EXACTO, no a la sección: la fila que se abre queda marcada */
function enfocar(id){
  setTimeout(function(){
    var el=document.getElementById(id); if(!el) return;
    if(el.classList.contains('acord')) el.classList.add('ab');
    el.scrollIntoView({block:'center',behavior:redu()?'auto':'smooth'});
    el.style.transition='box-shadow .3s linear';
    el.style.boxShadow='0 0 0 2px var(--red)';
    setTimeout(function(){ el.style.boxShadow=''; },1600);
  },80);
}

function _pintarActua_(){
  var caja=$('#actua'); if(!caja) return;
  var m=miembro(ACTOR);
  $('#yoN').textContent = m ? m.nombre.split(' ').slice(0,2).join(' ') : (SESION?SESION.nombre:'—');
  $('#yoR').textContent = _rolDe_(ACTOR);
  $('#yoAv').textContent = ini(m?m.nombre:(SESION&&SESION.nombre)||'??');
  if(!_puedeImpersonar_() && SESION){ caja.style.display='none'; return; }
  caja.style.display='';
  var opts=[];
  if(miembro(PD_NOM)) opts.push([PD_NOM,'Project Director']);
  if(miembro(REV2_NOM)) opts.push([REV2_NOM,'Revisor fijo']);
  DATA.miembros.filter(function(x){ return x.cargo==='Coordinador' && x.nombre!==PD_NOM && x.nombre!==REV2_NOM; })
    .slice(0,3).forEach(function(x){ opts.push([x.nombre, x.pila||x.nombre.split(' ')[0]]); });
  if(!opts.length) opts=[[ACTOR,'Yo']];
  $$('#actua button',caja).forEach(function(b){ b.remove(); });
  opts.forEach(function(o){
    var b=document.createElement('button');
    b.dataset.nom=o[0]; b.textContent=o[1];
    b.className=(o[0]===ACTOR?'on':'');
    caja.appendChild(b);
  });
  $$('#actua button').forEach(function(b){
    b.onclick=function(){
      $$('#actua button').forEach(function(x){x.classList.toggle('on',x===b);});
      ACTOR=b.dataset.nom;
      $('#yoN').textContent=(miembro(ACTOR)||{}).nombre||ACTOR;
      $('#yoR').textContent=_rolDe_(ACTOR);
      $('#yoAv').textContent=ini(ACTOR);
      var est=$('#actuaEst');
      var dx=Math.abs((b.offsetLeft-5)-(parseFloat(est.style.transform.replace(/[^0-9.-]/g,''))||0));
      est.style.transform='translateX('+(b.offsetLeft-5)+'px)';
      if(!redu() && dx>2){ est.classList.remove('vuela'); void est.offsetWidth; est.classList.add('vuela');
        setTimeout(function(){est.classList.remove('vuela');},380); }
      pintar();
    };
  });
}

