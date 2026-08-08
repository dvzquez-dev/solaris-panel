/* El worker de la RAIZ, que existe solo para DARSE DE BAJA.

   ⛔ POR QUE HACE FALTA UN FICHERO PARA ESTO. Hasta el 08/08 la app se servia desde la raiz
   del sitio, asi que `register('sw.js')` dejaba un worker con ambito `/solaris-panel/` en el
   navegador de todo el que la abriera. Al mudar las caras a `beta/` y `produccion/`, ese
   fichero desaparecio de la raiz y `/solaris-panel/sw.js` paso a dar **404**.

   Un 404 ahi no es inocuo: cuando el navegador comprueba si hay version nueva del worker y
   recibe un 404, **da de baja el registro por su cuenta**, en silencio. La suscripcion de
   push se va con el, el backend sigue mandando a un endpoint muerto, y nadie se entera de
   que dejaron de llegar avisos — porque un aviso que no llega no da error.

   El resultado es el mismo (el registro viejo tiene que morir: su ambito ya no corresponde a
   ninguna app), pero asi muere **cuando nosotros lo decimos y de una forma que se puede
   leer**, en vez de por un fallo de descarga. La app se registra de nuevo en su carpeta al
   abrirla, y `_pushInit_` rehace la suscripcion.

   ⚠️ NO lleva manejador `fetch` a proposito -ninguno de los nuestros lo lleva-: un worker sin
   `fetch` no intercepta una sola peticion. Se midio el 08/08 al descartar la hipotesis de que
   el worker viejo estuviera impidiendo cargar el login de Google. No podia. */

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Se reclama primero para que la baja alcance tambien a las pestanas ya abiertas.
    try { await self.clients.claim(); } catch (_) {}
    await self.registration.unregister();
  })());
});
