/* Service worker del app Solaris — Web Push. Ver docs/notificaciones-push-plan.md.
   Maneja 'push' (muestra la notificación) y 'notificationclick' (abre/enfoca la app).

   ⛔ EL ÁMBITO SE PREGUNTA, NO SE ESCRIBE. Aquí había `const APP_URL = '/solaris-panel/'`, o
   sea la ruta de PRODUCCIÓN clavada a mano — y este mismo fichero lo registra también la beta,
   porque `comun.js` hace `register('sw.js')` y las dos caras viven en el mismo sitio. Efecto:
   **tocar una notificación de beta abría la app del equipo**, y el bucle de enfoque de abajo
   se traía a la ventana de producción si estaba abierta. No daba ningún error: abría *una* app.

   `self.registration.scope` es la carpeta desde la que se registró ESTE worker, así que cada
   canal abre el suyo. Y el día que beta viva en `beta/` funciona solo, sin tocar nada. */
const APP_URL = self.registration.scope;

/* ⛔ EL ICONO Y EL BADGE SE RESUELVEN POR CANAL, y hasta el 08/08 no lo hacian: estaban
   escritos `icon-192.png` y `favicon-32.png` a secas, **relativos al ambito del worker**. Al
   mudar el sitio a carpetas eso paso a apuntar a donde no hay nada -en `beta/` el icono se
   llama `icon-beta-192.png`, y el favicon se unifico en `recursos/`-, asi que **toda
   notificacion pedia dos 404**.

   ⚠️ Y no daba ningun error: una imagen que no carga simplemente no sale. El aviso llega,
   feo, y nadie lo ata a una mudanza de carpetas de hace semanas.

   `ICONO` lo reescribe `publicar_web.py` por canal -mismo mecanismo que ya usa con el
   manifest- y lo COMPRUEBA antes de subir, que es la mitad que faltaba. */
const ICONO = 'icon-beta-192.png';
const BADGE = '../recursos/favicon-32.png';

self.addEventListener('install', () => self.skipWaiting());
/* ══ LA CACHE — por que la app tardaba en abrir «a veces» ═════════════════════

   Daniel, 10/09/2026: *«el fallo es a tarda mucho en abrir a veces»*.

   📏 MEDIDO contra el sitio publicado, pidiendo compresion como un navegador — y la
   primera medida fue MIA y estaba mal (`urllib` no pide compresion, asi que dijo «sin
   comprimir» sobre un servidor que si comprime):

       13 peticiones · 378 KB en la RED · 1.008 KB en claro (gzip al 38 %)
       cache-control: max-age=600   -> pasados 10 minutos, las 13 se REVALIDAN

   Con red movil eso son segundos, y explica el «a veces»: depende de si hace mas de diez
   minutos que la abriste.

   ✅ stale-while-revalidate: se sirve lo que hay en cache —la app arranca YA— y la red
   refresca por detras para la proxima. La version nueva entra a la siguiente apertura.
   ⚠️ Ese es el precio, y se dice: una apertura con la cara de ayer. El worker hace
   `skipWaiting` + `clients.claim`, asi que el worker nuevo manda desde el primer momento.

   ⛔⛔ Y LO PELIGROSO NO ES CACHEAR: ES CACHEAR LO QUE NO SE DEBE. Aqui las respuestas son
   horas, puntos y sanciones de personas reales. Por eso QUE SE TOCA vive en UNA sola funcion
   -`_cacheable_`- y esa funcion **se ejecuta en el banco** con los casos que hacen dano.
   ⚠️ El manejador `fetch` en si NO se ejecuta en ningun banco, y hay que decirlo: usa
   `async`/`await` y `caches`, que el arnes de `cscript` (ES3) no tiene. Se vigila por forma. */
const CACHE = 'solaris-estaticos-v1';

/* ¿Esta peticion se puede guardar? La puerta unica, y por eso es una funcion aparte.

   ⛔ `GET` y nada mas: cachear un `POST` es creer hecha una escritura que no se mando.
   ⛔ Del PROPIO ambito y nada mas. Eso deja fuera, de una vez, el backend de Apps Script
      -cuyas respuestas son el panel del equipo-, el login de Google -de otro origen y con
      respuesta opaca- y **el otro canal**: beta y produccion viven en el mismo sitio, y una
      cache que los cruce sirve la app del equipo desde la de pruebas.
   ⛔ Y NUNCA el propio worker: un `sw.js` cacheado no se puede reemplazar, y eso dejaria la
      cache puesta para siempre sin forma de apagarla desde fuera. */
function _cacheable_(req, scope){
  if (!req || req.method !== 'GET') return false;
  var u = String(req.url || '');
  if (u.indexOf(scope) !== 0) return false;
  if (u.indexOf('sw.js') >= 0) return false;
  return true;
}

/* ══ ¿LO QUE ACABA DE LLEGAR ES DISTINTO DE LO QUE TENIAMOS? (545.ª, 10/09/2026)

   ⛔⛔ Daniel: *«no me llego nada a la app ni siquiera ninguna novedad»*. Esta cache
   sirve `guardado || red`, o sea **la cara de ayer** en la primera apertura -- el precio
   que yo mismo escribi aqui arriba y **no le consulte**. Con el abriendo la app una vez al
   dia, «la apertura siguiente» es **manana**.
   ⛔ **Y la cura no es quitar la cache**: entro para arreglar *«tarda mucho en abrir a
   veces»*, que tambien lo reporto el. Lo que se hace es **avisar**: se sigue sirviendo lo
   guardado al instante, y cuando la red trae algo distinto, la pagina lo dice.

   📏 MEDIDO CONTRA EL SITIO PUBLICADO antes de escribir esto: GitHub Pages manda
   **`ETag` en los cuatro ficheros probados** y es **identico en dos peticiones seguidas**
   al mismo contenido. O sea que es una huella COMPARABLE, que es lo unico que permite
   afirmar «cambio». Manda tambien `Last-Modified` y `Content-Length`, de respaldo. */
function _huella_(r){
  if (!r || !r.headers || typeof r.headers.get !== 'function') return null;
  var e = r.headers.get('etag');
  if (e) return 'e:' + e;
  var m = r.headers.get('last-modified');
  if (m) return 'm:' + m;
  var l = r.headers.get('content-length');
  if (l) return 'l:' + l;
  /* ⛔ SIN HUELLA SE DEVUELVE `null`, NO UNA CADENA VACIA: dos respuestas sin cabeceras
     darian `'' === ''` y se leerian como «no cambio», que es afirmar lo que no se sabe. */
  return null;
}

/* ¿Hay que avisar de que hay una version nueva? */
function _hayVersionNueva_(guardado, fresca){
  /* ⛔ SIN LAS DOS, NO HAY COMPARACION. Y el caso que importa es el PRIMERO: en la
     primera carga no hay `guardado`, asi que no hay «version nueva» -- hay **la
     primera**. Avisar ahi seria molestar a todo el que estrena la app. */
  if (!guardado || !fresca) return false;
  var a = _huella_(guardado), b = _huella_(fresca);
  /* ⛔ UN «NO LO SE» NO ES «CAMBIO» NI «NO CAMBIO»: sin huella comparable no se
     avisa. Fallar hacia «aviso de mas» aqui es un bucle de avisos en cada carga, que es
     como se aprende a ignorarlos -- y entonces se pierde el que si importa. */
  if (a === null || b === null) return false;
  return a !== b;
}

/* Se lo dice a las pestanas abiertas. ⚠️ NO recarga: alguien puede estar marcando su
   disponibilidad, y recargar por su cuenta le borra lo que llevaba. La pagina decide. */
async function _avisarVersion_(){
  try {
    var cls = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (var i = 0; i < cls.length; i++) {
      try { cls[i].postMessage({ tipo: 'version-nueva' }); } catch (_) {}
    }
  } catch (_) {}
}

self.addEventListener('fetch', (e) => {
  if (!_cacheable_(e.request, self.registration.scope)) return;   /* ni se toca: red normal */
  e.respondWith((async () => {
    /* ⛔⛔ SI LA CACHE NO SE PUEDE ABRIR, SE SIGUE COMO SI NO HUBIERA WORKER. En
       incognito o con la cuota llena, `caches.open` LANZA; sin este `try` la funcion
       async entera lanza, `respondWith` rechaza y **la peticion falla**. O sea que un
       fallo de la cache dejaria la app sin cargar — para todas las peticiones del
       ambito y para las 23 personas. Una cache que rompe es peor que no tener cache. */
    let c = null;
    try { c = await caches.open(CACHE); } catch (_) { return fetch(e.request); }
    let guardado = null;
    try { guardado = await c.match(e.request); } catch (_) { guardado = null; }
    const red = fetch(e.request).then((r) => {
      /* ⛔ Solo se guarda lo que llego BIEN: un 404 o un 500 cacheados se sirven como si
         fueran la app, y entonces el fallo dura hasta que alguien borre los datos. */
      /* ⚠️ El `put` tambien puede lanzar (cuota): que no se pueda guardar no es motivo
         para no devolver la respuesta que YA ha llegado. */
      if (r && r.ok) {
        /* ⛔ SE COMPARA ANTES DE PISAR: despues del `put`, `guardado` ya es lo
           nuevo y la comparacion saldria SIEMPRE igual -- verde para siempre. */
        if (_hayVersionNueva_(guardado, r)) { _avisarVersion_(); }
        try { c.put(e.request, r.clone()); } catch (_) {}
      }
      return r;
      /* ⛔⛔ `|| Response.error()` NO ES ADORNO: sin cache Y sin red, esto devolvia
         `undefined`, y `respondWith(undefined)` **rompe la peticion**. La app se
         quedaria sin cargar, y peor que hoy: sin worker el navegador al menos da su
         propio error de red. `Response.error()` es exactamente ese error. */
    }).catch(() => guardado || Response.error());
    /* ⛔ `guardado || red`: se devuelve lo de la cache SIN esperar a la red -eso es lo que
       hace que abra ya-, y la promesa de red sigue viva por detras refrescando. */
    return guardado || red;
  })());
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Llega una push: el emisor manda un JSON {title, body, url?, tag?, icon?, badge?}.
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; }
  catch (_) { d = { body: event.data ? event.data.text() : '' }; }
  const title = d.title || 'Solaris';
  const opts = {
    body: d.body || '',
    icon: d.icon || ICONO,
    badge: d.badge || BADGE,
    tag: d.tag || undefined,                  // mismo tag = agrupa/reemplaza (p.ej. una reunión concreta)
    renotify: !!d.tag,
    data: { url: d.url || APP_URL },
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

// Tap en la notificación: enfoca una ventana ya abierta del app, o abre una nueva.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || APP_URL;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) {
      // ⛔ MISMO MOTIVO que arriba: con la ruta a mano, la beta enfocaba una ventana de
      // producción y le NAVEGABA encima. Se compara contra el ámbito propio.
      if (c.url.indexOf(APP_URL) === 0 && 'focus' in c) {
        await c.focus();
        if ('navigate' in c && url && !c.url.endsWith(url)) { try { await c.navigate(url); } catch (_) {} }
        return;
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});

/* La suscripción puede caducar/rotar sola. Aquí no tenemos la VAPID pública para
   re-suscribir de forma robusta, así que la app la rehace al abrir (comprueba
   pushManager.getSubscription y re-guarda en el backend si cambió el endpoint). */
self.addEventListener('pushsubscriptionchange', () => { /* la app re-suscribe al abrir */ });
