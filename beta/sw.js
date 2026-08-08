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
