#!/usr/bin/env node
/* Emisor de notificaciones push del app Solaris (DIY). Ver docs/notificaciones-push-plan.md.
   Flujo: lee getPushPendientes del backend Apps Script (avisos no enviados, cada uno con las
   suscripciones de sus destinatarios ya resueltas) -> envía cada aviso a esas suscripciones con
   web-push (firma VAPID + cifrado) -> purga los endpoints muertos (404/410) -> marca enviados.
   Pensado para correr en una GitHub Action cada pocos minutos.

   Variables de entorno (secrets del repo donde viva la Action):
     APP_PUSH_URL   -> la URL /exec del backend (la misma de config.json)
     PUSH_KEY       -> la clave de push maestra (secretos/push.json) — la usan getPushPendientes/marcarPushEnviada
     VAPID_PUBLIC   -> clave VAPID pública  (secretos/vapid.json)
     VAPID_PRIVATE  -> clave VAPID privada  (secretos/vapid.json) — SECRETO de verdad
     VAPID_SUBJECT  -> "mailto:solaris@uvigoaerotech.com" (opcional) */
const webpush = require("web-push");

const URL_EXEC = process.env.APP_PUSH_URL;
const KEY = process.env.PUSH_KEY;
const VAPID_PUBLIC = process.env.VAPID_PUBLIC;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:solaris@uvigoaerotech.com";

if (!URL_EXEC || !KEY || !VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error("Faltan env: APP_PUSH_URL / PUSH_KEY / VAPID_PUBLIC / VAPID_PRIVATE");
  process.exit(1);
}
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

async function llamar(action, body) {
  const r = await fetch(URL_EXEC, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({ action, key: KEY }, body || {})),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(action + ": " + j.error);
  return j.data;
}

async function main() {
  const pendientes = await llamar("getPushPendientes");
  if (!pendientes || !pendientes.length) { console.log("nada pendiente"); return; }
  const enviados = [];
  const muertos = [];
  for (const aviso of pendientes) {
    const payload = JSON.stringify({
      title: aviso.titulo, body: aviso.cuerpo,
      url: aviso.url || undefined, tag: aviso.tag || undefined,
    });
    let ok = 0, ko = 0;
    for (const t of (aviso.targets || [])) {
      const sub = { endpoint: t.endpoint, keys: t.keys };
      try { await webpush.sendNotification(sub, payload); ok++; }
      catch (e) {
        ko++;
        if (e.statusCode === 404 || e.statusCode === 410) muertos.push(t.endpoint);
        else console.error("  fallo:", (t.endpoint || "").slice(0, 48), e.statusCode || e.message);
      }
    }
    console.log(`aviso ${aviso.id} "${aviso.titulo}": ${ok} enviadas, ${ko} fallidas`);
    enviados.push(aviso.id);
  }
  await llamar("marcarPushEnviada", { ids: enviados, endpointsMuertos: muertos });
  console.log(`OK: ${enviados.length} avisos marcados; ${muertos.length} suscripciones muertas purgadas`);
}

main().catch((e) => { console.error(e); process.exit(1); });
