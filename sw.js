/* Service worker del app Solaris — Web Push. Ver docs/notificaciones-push-plan.md.
   Se sirve desde la raíz del sitio publicado (web/sw.js -> /solaris-panel/sw.js).
   Maneja 'push' (muestra la notificación) y 'notificationclick' (abre/enfoca la app). */
const APP_URL = '/solaris-panel/';

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
    icon: d.icon || 'icon-192.png',          // relativo a /solaris-panel/ (lo genera build_hostable)
    badge: d.badge || 'favicon-32.png',
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
      if (c.url.includes('/solaris-panel/') && 'focus' in c) {
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
