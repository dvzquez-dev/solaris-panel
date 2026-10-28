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
  /* ⛔ AQUÍ SE COGÍA «EL PRIMER COORDINADOR QUE NO FUERA EL PD», quienquiera que fuese, y eso
     reparte por orden de lista la autoridad para aprobar un expediente de subsistema. Además
     el móvil lo calculaba de OTRA forma (con el nombre de José en un regex): dos políticas para
     la misma pregunta. Ahora es una sola, en `comun.js`, y deriva del CARGO — coordinador de la
     UCT—; si no hay ninguno cae al PD, que es lo que hace también `_coordinadorDe_` en el
     backend: sin coordinador la autoridad sube, no se sortea. */
  _rederivarRev2_();
}

/* miembro() puede devolver null y eso es correcto (sirve para preguntar «existe?»).
   Lo que NO puede es usarse directo en el render: el dato real trae nombres que no
   casan con el roster (un turno del Discord firmado con otro apellido, un parte de
   alguien que ya se fue). _m() SIEMPRE devuelve algo pintable y marca al desconocido. */

function _m(n){
  var x=miembro(n); if(x) return x;
  var nom=String(n||'').trim();
  /* ⛔⛔ LOS NUMEROS VAN A `null`, NO A CERO (§3c-24). Aqui ponia `hMes:0, horasTemp:0,
     meses:1` — tres valores INVENTADOS que pasan los filtros `typeof === 'number'` como si
     estuvieran medidos, en el MISMO objeto donde `puntos`, `hAnt` y `cuota` ya decian
     `null`. Y `meses:1` era el peor: `horasTemp/meses` da un ritmo de 0, o sea que un
     nombre que no casa con el roster entraba en el ranking como si no hubiera trabajado.
     ⚠️ Lo que NO cambia es que `_m()` siempre devuelve algo pintable y marcado `_fuera`:
     esa es su razon de existir, y devolver `null` romperia sus dos llamadas. */
  return {nombre:nom||'\u2014', pila:(nom.split(' ')[0]||'\u2014'), unidad:'\u2014',
          cargo:null, puntos:null, hMes:null, hAnt:null, horasTemp:null, meses:null,
          cuota:null, coche:null, infraccion:false, _fuera:true};
}



/* ⛔⛔ ES LA CUARTA PUERTA A «¿ESTE MANDA?», Y ERA LA UNICA QUE NO PREGUNTABA POR LA
   JURISDICCION. Las otras tres -`rangoNom`, `rangoSanc` y `esCoord`- consultan
   `_subcoordDe_`; esta no la nombraba ni una vez. Y lo que devuelve **no es un adorno**:
   es la unica linea del escritorio que le dice a alguien **quien es** (`#yoR`, y la fila
   «Actuas como» del diagnostico).
   ⛔ EL DAÑO: un **subcoordinador** -a quien el servidor admite con **rango 1**, y que
   tiene gente bajo su jurisdiccion- se leia a si mismo como **«Miembro»**. Le decimos
   que no manda a alguien que manda.
   ⚠️ Y LA SEGUNDA MITAD: `'Coordinador de '+m.unidad` imprime **el subsistema**, no lo
   que coordina. Lo desmiente por escrito `coordinadorDe` en `comun.js` -- *«nadie tiene
   una Unidad como `unidad`»*-, y quien coordina una Unidad lo lleva en `coordina`.
   ⚠️ El orden importa y es por RANGO: PD, revisor fijo, coordinador, subcoordinador. A
   quien es las dos cosas se le ensena la mayor, que es la que decide. */
function _rolDe_(nombre){
  if(nombre===PD_NOM) return 'Project Director';
  if(nombre===REV2_NOM) return 'Revisor fijo';
  /* 21/10 (auditor 10, 🟡 8): por `_cargoTxt_`, la de las dos caras (antes «Miembro» a quien coordina sin cargo, y
     `coordina` concatenado con «+»). Sin ficha, sólo el nombre: la subcoordinación se pregunta igual. */
  return _cargoTxt_(miembro(nombre) || {nombre:nombre});
}

function colaDecision(){
  var out=[];
  pendientes().filter(function(p){return puedeDecidirParte(p,ACTOR);}).forEach(function(p){
    out.push({ic:'i-reloj',b:h1(p.horas)+' de '+_m(p.autor).pila,
      /* Mismo vocabulario que las otras dos pantallas: `bloque` ya no existe. */
      s:esc(p.tarea)+' · '+p.fecha+(_etiOrigenParte_(p)?' · '+_etiOrigenParte_(p).txt:''),
      chip:'<span class="chip wa">parte de horas</span>',ir:'partes',foco:'parte-'+p.id});
  });
  docsMios().forEach(function(d){
    out.push({ic:'i-doc',b:esc(d.tit),s:d.ref+' · '+_m(d.autor).pila+' · '+esc(ambDoc(d.amb))+   /* 20/10: como la lista, no el crudo */
      (d.iss?' · '+d.iss+' aviso'+(d.iss===1?'':'s'):''),
      /* ⛔ POR LA PUERTA UNICA. Aqui habia una copia con el `else` en `'ok'` -verde-, asi
         que `null`, un valor fuera del enum y la cadena vacia salian los TRES con el chip
         de «salio bien», y el texto decia literalmente «severidad null». Y con vocabulario
         INVERTIDO respecto a la lista de Documentos: «severidad baja» aqui, «calidad alta»
         alla, del mismo expediente. */
      chip:chipSevDoc(d.sev),
      ir:'docdec',foco:'doc-'+d.id});
  });
  /* ⛔ …y con `LOTE.items.length`: sin eso, la tarjeta seguía saliendo diciendo
     «0 personas · Art. libre · nada se aplica hasta cerrarlo entero», que manda al PD
     a una pantalla donde no hay nada que hacer. */
  /* ⛔ 21/10 (auditor 7, 🟡 10): y con la MISMA cuenta que el globo de Sanciones (`conteo`: todas las pendientes, de
     todos los bloques y las sueltas), no `LOTE.items` — con 7 en tres bloques decía 2, y con el bloque del desplegable
     cerrado desaparecía con 5 esperando. Sin respuesta del servidor, `conteo` cae al bloque (lo de antes). */
  var _sp=conteo('sanciones');
  if(_sp && rangoNom(ACTOR)>=3)
    out.push({ic:'i-gavel',b:'Sanciones por decidir',
      s:_sp+(_sp===1?' pendiente':' pendientes')+' · nada se aplica hasta cerrar su bloque',
      chip:'<span class="chip no">por decidir</span>',ir:'sanciones',foco:'lote'});
  /* ⛔ 26/10 — Daniel (25/10): un coordinador puede mover el plazo de una tarea SUYA, *«pero me notifica en algun lugar
     del escritorio (app)»*. Aquí: una fila por plazo movido así en los últimos 14 días (los sirve el bootstrap, sólo al PD). */
  if(rangoNom(ACTOR)>=3) ((typeof PLAZOS_PROPIOS!=='undefined' && PLAZOS_PROPIOS)||[]).forEach(function(x){
    out.push({ic:'i-reloj',b:'\u00ab'+esc(x.tarea||'una tarea')+'\u00bb: plazo movido por su responsable',
      s:esc(x.por||'?')+' \u00b7 '+(x.de?esc(_isoADMY_(String(x.de).slice(0,10))):'sin plazo')+' \u2192 '+
        esc(_isoADMY_(String(x.a||'').slice(0,10)))+(x.at?' \u00b7 el '+esc(_isoADMY_(String(x.at).slice(0,10))):''),
      chip:'<span class="chip">plazo</span>',ir:'tareas',foco:'plazo-'+String(x.pagina||'')});
  });
  REUS.forEach(function(r0){
    /* 950.ª: sólo si te toca a ti fijarla (el convocante, o el PD con la cuenta admin) — ver `_fijarEsMio_`. */
    if(r0.fijada || !_fijarEsMio_(r0)) return;
    var cob=_cobertura_(r0);
    /* ⛔ REUNION OCULTA: no se sabe cuantos han cubierto, asi que no hay tarjeta. Sin
       esto salia por accidente —`null>=null` es `0>=0`, cierto, y caia en el `return`
       de abajo—, que es un acierto que no sobrevive al siguiente refactor. */
    if(cob.oculto) return;
    var r=Object.assign({}, r0, {tit:r0.tit||r0.titulo,
      conv:(r0.conv!=null?r0.conv:cob.conv), cubren:(r0.cubren!=null?r0.cubren:cob.cubren),
      limite:r0.limite||'sin l\u00edmite'});
    if(r.cubren>=r.conv) return;
    out.push({ic:'i-cal',b:'\u00ab'+esc(r.tit)+'\u00bb sin fijar',
      /* ⛔ EL PLAZO EN PALABRAS, igual que en el móvil: aquí salía la fecha cruda, así que
         quien coordina veía dos textos distintos para el mismo dato según la pantalla. */
      s:r.cubren+' de '+r.conv+' han cubierto \u00b7 '+_plazoTxt_(r.limite),
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
  /* ⛔ DEL PANEL REAL, NO DE `hAnt`. Este era **el mismo fallo que Daniel reportó en el movil**
     («esta comparando con junio en lugar de con julio, se quedo congelado»), en la otra cara y sin
     que nadie lo hubiera mirado: `hAnt` **no lo escribe ningun script** -cero apariciones en los
     `.py`- y **no esta en `Codigo.gs`**; lo que hay es un valor fosil dentro del KV `panel`, de
     cuando se subio por ultima vez. Medido el 07/08: `hAnt: 2` con `mesAnt: 'junio'`, estando en
     agosto. O sea que «quien mas sube este mes» se calculaba **contra junio**.

     ⚠️ Y esta rotulado «respecto al mes pasado», asi que el numero no se ve raro: se lee como si
     fuera de julio. Un dato viejo con la etiqueta correcta no parece un fallo, parece un dato.

     ✅ El `else` de aqui abajo YA hacia lo correcto («no se finge una comparativa que no existe»);
     lo unico que impedia llegar a el era el fosil. Con `_hAntReal_` -la misma puerta que usa el
     movil- sin dato se cae a esa rama, que es lo que toca: mejor no decir nada que comparar
     contra un mes que no es. */
  var _ant=function(m){ return _hAntReal_(m); };   /* ya devuelve null si falta o es <=0 */
  /* ⛔ Y TAMBIEN HACE FALTA EL DE ESTE MES. `_ant(m)!=null` garantiza el del mes
     pasado y nada mas: sin `hMes`, `vpc` da **NaN** y el `sort` con NaN no ordena --
     el titular «quien mas sube» sale de quien caiga primero. Es el mismo criterio del
     `else` de abajo: no se finge una comparativa que no existe. */
  var conAnt=_activos_().filter(function(m){
    return _ant(m)!=null && typeof m.hMes==='number'; });
  if(conAnt.length>=2){
    /* ⛔⛔ RITMO CONTRA RITMO, NO TOTAL CONTRA TOTAL (20/10). Aquí se comparaba `hMes` —las horas que
       LLEVA el mes en curso— contra el mes anterior ENTERO, así que antes de fin de mes casi todo el
       equipo «bajaba», y quien más subía podía salir con un porcentaje NEGATIVO («X es quien más sube:
       −40 %»). El móvil compara por ritmo desde el 13/08 (`_compHorasHTML_`: «el mes en curso va a
       medias y el anterior está entero»); ésta es la misma cuenta: h/día con la base DEVENGADA, el mes
       pasado a fracción 1 y entre los días que DURÓ (`_diasMesAnterior_`, de cierre a cierre).
       ⚠️ Y el verbo sale del SIGNO: con todos subiendo, el último no «baja», «sube menos». */
    var _dm=_diasDelMes_(), _dia=Math.max(1,_dm.dia), _fr=_fraccionDelMes_();
    var _dAnt=_diasMesAnterior_(_dm.periodo, DATA.equipo_mes ? DATA.equipo_mes.dias_ant : null);
    var _rit=function(m){ var b=_devengadoAHoy_(m, m.hMes, _fr); return (b==null?m.hMes:b)/_dia; };
    var _ritAnt=function(m){ var a=_ant(m), b=_devengadoAHoy_(m, a, 1); return (b==null?a:b)/_dAnt; };
    var _rh=function(v){ return nf2(Math.round(v*100)/100); };
    var vpc=function(m){ return (_rit(m)-_ritAnt(m))/_ritAnt(m)*100; };
    var subida=conAnt.slice().sort(function(a,b){return vpc(b)-vpc(a);})[0];
    var bajada=conAnt.slice().sort(function(a,b){return vpc(a)-vpc(b);})[0];
    xs.push(['up',esc(subida.pila)+(vpc(subida)>=0?' es quien m\u00e1s sube: ':' es quien menos baja: ')+pc(vpc(subida))+
      ' de ritmo respecto al mes pasado ('+_rh(_ritAnt(subida))+' \u2192 '+_rh(_rit(subida))+' h/d\u00eda).']);
    xs.push(['dn',esc(bajada.pila)+(vpc(bajada)<0?' es quien m\u00e1s baja: ':' es quien menos sube: ')+pc(vpc(bajada))+
      ' ('+_rh(_ritAnt(bajada))+' \u2192 '+_rh(_rit(bajada))+' h/d\u00eda).']);
  } else {
    /* no se finge una comparativa que no existe: se dice que falta el dato.
       ⛔ 20/10 (auditoría): SIN `equipo_mes` NO ES QUE NO HAYA HORAS — el servidor no manda las del mes anterior porque
       la cara no sabría con qué mes rotularlas. Eso es «no lo sé» (§3c-24), y se dice así. */
    var _sinMes=!(DATA && DATA.equipo_mes);
    xs.push(['wa', _sinMes
      ? 'Todavía no ha llegado el dato del mes (cuál está abierto y cuántos días lleva), así que no se puede comparar con el anterior.'
      : 'Todav\u00eda no hay horas del mes anterior, as\u00ed que no se puede comparar la evoluci\u00f3n.']);
    /* 21/10 (auditor 6): devengado, como Miembros y Registro — en crudo el PD (7 h de base el día 1) ganaba por su cargo */
    /* 22/10 (refutador, 🟠 1): sólo entre quienes TIENEN dato, y con dos como mínimo — a un coordinador (sólo ve sus
       horas) se le decía que era quien más horas llevaba del equipo. */
    var _conDev=_activos_().filter(function(m){ return typeof _hMesDevCara_(m)==='number'; });
    var top=_conDev.length>=2 ? _conDev.slice().sort(function(a,b){return _hMesDevCara_(b)-_hMesDevCara_(a);})[0] : null;
    if(top) xs.push(['up',esc(top.pila)+' es quien m\u00e1s horas lleva este mes: '+h1(_hMesDevCara_(top)||0)+'.']);
  }
  var enAire=pendientes().reduce(function(a,p){return a+p.horas;},0);
  if(enAire>0) xs.push(['wa',h1(enAire)+' están sin firmar. Mientras sigan ahí, el umbral del mes y el '+
    'ranking se calculan con datos incompletos.']);
  var sinCubrir=REUS.reduce(function(a,r){
    /* ⛔ Y una reunion OCULTA no suma: `_cobertura_` devuelve `null` y aqui se cuenta 0.
       No es «nadie sin cubrir», es «no lo se» — pero el aviso solo se imprime `if
       (sinCubrir)`, asi que un 0 calla en vez de afirmar. Lo que NO puede pasar es que
       cuente los 29 que el servidor no mando. */
    var sc = r.sinCubrir || _cobertura_(r).sinCubrir;   /* el dato real no lo trae: se deriva */
    return a+((sc&&sc.length)||0); },0);
  if(sinCubrir) xs.push(['wa',sinCubrir+' personas no han cubierto alguna disponibilidad abierta. '+
    'Mira «Disponibilidad y riesgo» para ver qué sanción implicaría a cada una.']);
  /* ⛔ 21/10 (auditor 20, 🟠): por `horas`, que es lo que trae el servidor (`getFichajesAbiertos`); `min` sólo lo
     tiene la semilla de la maqueta. Contando `min`, los fichajes REALES no encendían el aviso nunca. Y se piden aquí
     también, por la misma puerta que «Fichajes en curso» (una sola vez): si no, el PD no se enteraba sin abrirla. */
  if(typeof _cursoCargar_==='function') _cursoCargar_(typeof pintar==='function'?pintar:null);
  var largos=CURSO.filter(function(c){
    var h = (typeof c.horas==='number') ? c.horas : (typeof c.min==='number' ? c.min/60 : null);
    return h!=null && h>=10;
  }).length;
  if(largos) xs.push(['wa',largos+' fichaje'+(largos===1?'':'s')+' lleva'+(largos===1?'':'n')+
    ' más de 10 h abierto. A las 14 h se cierran solos y quedan sin declarar (caducan a las '+_caducaAutocierreH_()+' h).']);
  return xs.map(function(x){
    return '<div style="display:flex;gap:9px;padding:8px 0;border-top:1px solid rgba(50,44,46,.7);font-size:12.5px;color:var(--ink2);line-height:1.55">'+
      '<span class="'+x[0]+'" style="flex:none;font-family:var(--mono)">'+(x[0]==='up'?'▲':x[0]==='dn'?'▼':'!')+'</span>'+
      '<span>'+x[1]+'</span></div>';
  }).join('');
}

function conteo(k){
  if(k==='partes') return pendientes().filter(function(p){return puedeDecidirParte(p,ACTOR);}).length;
  if(k==='sindeclarar') return PARTES.filter(function(p){return p.estado==='sindecl';}).length;
  /* ⛔ 21/10 (auditor 8, 🟡 13): TUS partes DEVUELTOS (`detalle`), que «Lo tuyo» enseña y que bloquean el cierre del mes.
     Daba 0: un coordinador con un parte suyo devuelto no veía ningún número. Los `sin_declarar` van en «Sin declarar». */
  if(k==='libros') return (typeof _bloqMios_==='function')
    ? _bloqMios_().filter(function(p){ return p.estado==='detalle'; }).length : 0;
  /* ⛔ AQUI PONIA `CURSO_CONECTADO`, QUE NO EXISTE EN NINGUN SITIO, y esa sola
     palabra dejaba entrar al panel sin login: el `ReferenceError` reventaba
     `pintar()` en el arranque, abortaba el bloque `<script>` entero y la linea que
     pone el gate de Google -que va DESPUES- no llegaba a ejecutarse. La bandera de
     verdad es `CURSO_SRV`, y solo 'ok' significa que el servidor contesto. */
  if(k==='curso')  return CURSO_SRV==='ok' ? CURSO.length : 0;   // sin conectar no hay nada que contar
  if(k==='docdec') return docsMios().length;
  /* ⛔ POR LA MISMA PUERTA QUE LA VISTA. Estas dos eran una COPIA del filtro, asi que el
     globo y la lista podian decir cosas distintas -- y de hecho las dos se quedaron cortas
     a la vez, que es lo que pasa cuando una regla vive en dos sitios. */
  if(k==='docurso')return DOCS.filter(function(d){return _docEnCurso_(d.est);}).length;
  if(k==='docpub') return DOCS.filter(function(d){return _docResuelto_(d.est);}).length;
  /* ⛔ 21/10 (auditor de sanciones): TODAS las pendientes — todos los bloques y las sueltas —, no sólo el bloque del
     desplegable (decía 2 con 7 esperando, y cambiaba al cambiar el desplegable). Sin respuesta, lo de antes. */
  if(k==='sanciones') return Array.isArray(SANC_BACK)
    ? SANC_BACK.filter(function(s){ return s && s.estado==='pendiente'; }).length
    : (LOTE.cerrado?0:LOTE.items.length);
  if(k==='apela')  return 0;        // no hay cola de apelaciones: contar la maqueta era mentir
  if(k==='convoc') return _nReusAbiertas_();   // 21/10 (auditor 10, 🟡 11): las abiertas, no todas
  if(k==='turnos') return TURNOS.length;
  if(k==='tareas') return TAREAS.filter(function(t){ return !_tareaHecha_(t&&t.e); }).length;   // 20/10: las vivas, como la pantalla
  if(k==='miembros') return _activos_().length;   // 21/10 (auditor 10, 🟡 9): las bajas no son el equipo
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
      /* 21/10 (auditor 19, 🟡 12): en la maqueta, el bloque de sanciones de ejemplo es el de SU jurisdicción. */
      if(typeof _loteDemoDelActor_==='function') _loteDemoDelActor_();
      pintar();
    };
  });
}

