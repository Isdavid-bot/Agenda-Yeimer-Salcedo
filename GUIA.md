# Página de Yeimer Salcedo — Guía de instalación y uso

## Cómo está armada

```
index.html            La página pública (no hace falta tocarla)
admin.html            El Panel de Yeimer — celular, protegido con PIN
politica.html         Política de datos (Ley 1581)
datos.js              Textos de marca, redes y la URL de la agenda
fotos/yeimer.jpg      Foto principal (se reemplaza con el mismo nombre)
fotos/compartir.jpg   Imagen que sale al compartir el link por WhatsApp
apps-script/Codigo.gs Código que va en la Hoja de Google de Yeimer
```

**Dónde se cambia cada cosa**

| Quiero cambiar… | Dónde |
|---|---|
| Precios, servicios, productos | **Panel de Yeimer** (`admin.html`) → pestaña *Carta* — o directo en la Hoja de Google |
| Horario, días libres, WhatsApp, correo, zona | **Panel de Yeimer** (`admin.html`) → pestaña *Ajustes* — o directo en la Hoja |
| Ver la agenda del día, la semana, ingresos y clientes frecuentes | **Panel de Yeimer** (`admin.html`) |
| Cancelar una cita | **Panel de Yeimer** → botón *Cancelar* en la cita (el cliente recibe la cancelación solo) |
| Reprogramar una cita | Cancelarla en el panel y crear la nueva a la hora correcta (no hay arrastrar-y-soltar todavía) |
| Foto, frase, redes | `datos.js` / carpeta `fotos` (hay que subir el cambio a GitHub) |

Los cambios, sea desde el panel o desde la hoja, se ven en la página **de inmediato**, sin subir nada a GitHub.

### El Panel de Yeimer (`admin.html`)

Es una página aparte, protegida con un **PIN de 4 a 8 dígitos**, pensada para el celular. Yeimer entra ahí — no a la hoja de cálculo — para el día a día:

- **Hoy / Semana:** sus citas con hora, cliente, dirección y total. Cada una tiene un botón para escribirle por WhatsApp (con el mensaje ya armado) y otro para **cancelarla** (si el cliente dejó correo, a él le llega la cancelación automáticamente, sin que Yeimer haga nada más).
- **Clientes:** todos los que le han pagado, ordenados por cuánto le han dejado en total — así ve de un vistazo quiénes son sus clientes frecuentes.
- **Carta:** editar precios, agregar o apagar servicios y productos. "Apagar" (el interruptor) los oculta de la página sin borrar el historial; "Eliminar" sí los quita de la lista.
- **Ajustes:** qué días no trabaja, a qué horas puede empezar una cita, cuánto dura cada una, la anticipación mínima, su WhatsApp, el correo donde le llegan los avisos, la zona de cobertura y el texto de nota en la página. También puede cambiar el PIN ahí mismo.

El PIN que trae por defecto es `1234` — es lo primero que hay que cambiar, en *Ajustes → Seguridad*. Como es solo un PIN (no un usuario con contraseña de verdad), no lo compartas fuera del círculo de confianza; para una barbería es un nivel de protección razonable, no bancario.

**Un límite real, dicho sin rodeos:** el panel no tiene "arrastrar y mover" una cita a otra hora. Para reprogramar, se cancela la cita actual y se crea una nueva en el horario correcto. Es más clics, pero evita el riesgo de mover algo sin querer.

---

## Parte 1 — Hoja de Google y Apps Script (en la cuenta de Yeimer)

1. Desde la cuenta de Google **de Yeimer**, crear una hoja nueva en **sheets.google.com** y llamarla *Página Yeimer*.
2. Menú **Extensiones → Apps Script**.
3. Borrar lo que aparece, pegar todo `apps-script/Codigo.gs` y guardar (ícono de disquete).
4. Arriba, en el selector de funciones, elegir **`configurar`** y darle **Ejecutar**.
   - Pedirá permisos: *Revisar permisos → cuenta de Yeimer → Configuración avanzada → Ir a (proyecto) → Permitir*.
   - Es normal que diga "app no verificada": es código de él, en su propia cuenta.
5. Volver a la hoja: ya existen las pestañas **Servicios, Productos, Ajustes y Citas** con los datos iniciales.
6. En **Ajustes**, poner el WhatsApp real de Yeimer (`57` + número, sin espacios).
7. En Apps Script: **Implementar → Nueva implementación**
   - Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
8. Copiar la **URL de la aplicación web** (termina en `/exec`).
9. Opcional: en la hoja, menú **✂️ Yeimer → Enviarme un correo de prueba**, para ver cómo le llegan los correos al cliente.
10. En la pestaña **Ajustes**, fila `pin_admin`, queda el PIN `1234` por defecto. Es el que usarás para entrar a `admin.html` — cámbialo apenas puedas, desde el propio Panel (Ajustes → Seguridad).

> **Si después cambias el código**: *Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva → Implementar*. Así la URL sigue siendo la misma.

---

## Parte 2 — Conectar la página

1. Abrir `datos.js` y pegar la URL en `agenda.apiUrl`, entre las comillas.
2. Poner el enlace real de Facebook y, si quieres, el correo de Yeimer (sale en la política de datos).
3. Subir los cambios (Parte 3).

Mientras `apiUrl` esté vacío, la página funciona en **modo demo**: muestra una etiqueta arriba, usa horarios de ejemplo y no guarda nada.

---

## Parte 3 — Publicar en Vercel (gratis)

1. En **github.com** crear un repositorio (por ejemplo `yeimer-salcedo`) y subir **todos** los archivos de esta carpeta.
2. En **vercel.com**: *Add New → Project* → elegir el repositorio → **Deploy**.
3. Queda en `yeimer-salcedo.vercel.app`. Cada cambio que subas a GitHub se publica solo.
4. Con dominio propio: Vercel → *Settings → Domains*. Luego cambiar en `index.html` la línea `og:image` por la URL completa de `fotos/compartir.jpg`.

---

## Parte 4 — Qué pasa en cada reserva

**Al confirmar:**
- La página vuelve a verificar que la hora siga libre (dos personas no pueden tomar la misma).
- Se crea el evento de 90 min en el Calendar de Yeimer con nombre, WhatsApp (con enlace directo), dirección, servicio, productos a llevar y total.
- Queda registrada en la pestaña **Citas**.
- **Al cliente (si dejó correo):** la **invitación de Google Calendar**, igual que las páginas de citas de Google: le queda la cita en su calendario (Gmail, Outlook, iPhone), con botón para aceptar.
  - Si Yeimer mueve o cancela el evento y Calendar le pregunta *"¿Enviar actualización a los invitados?"*, debe decir **Enviar**: al cliente le llega el cambio solo.
  - ¿Prefieres además el correo con el diseño de la marca? En `CONFIG` de `Codigo.gs`, pon `CORREO_MARCA: true`. Si quieres solo el correo de marca y no la invitación, pon `INVITAR_CLIENTE: false`.
- **A Yeimer:** correo "Nueva cita" con botón para escribirle al cliente.

**Automáticamente:**
- **24 h antes:** recordatorio por correo al cliente.
- **Todas las noches a las 7 pm:** Yeimer recibe *"Tu agenda de mañana"* con un botón por cliente que abre WhatsApp con el recordatorio ya escrito. Solo le da enviar.
- Si Yeimer **borra** la cita del Calendar, queda como *Cancelada* y no se envía recordatorio.
- Si la **mueve** de hora en el Calendar, el recordatorio sale con la hora nueva.

Los precios siempre se calculan desde la hoja, no desde el navegador: nadie puede alterar el total.

---

## Parte 5 — WhatsApp 100% automático (opcional, más adelante)

Hoy el recordatorio por WhatsApp es de **un toque** (Yeimer lo envía desde el resumen de la noche). Es gratis y sale desde su propio número.

Para que salga solo, sin que él toque nada, se necesita la **API de WhatsApp Business de Meta**:
1. Cuenta en Meta Business + número dedicado verificado (no puede ser el WhatsApp personal que ya usa en la app).
2. Plantilla aprobada llamada `recordatorio_cita` con 3 variables: nombre, fecha/hora, dirección.
3. Poner el token y el Phone Number ID en `CONFIG` (`WA_TOKEN`, `WA_PHONE_ID`) de `Codigo.gs`.

Meta cobra por cada mensaje de este tipo (valores bajos, se consultan en su página de precios). El código ya está listo: al llenar esos dos datos se activa solo.

---

## Límites a tener en cuenta
- Gmail gratuito permite ~100 correos al día desde Apps Script. Sobra para una agenda de barbero.
- Anticipación mínima para reservar: 2 horas (`AVISO_MIN`).
- Se puede reservar hasta 14 días adelante (`diasAdelante` en `datos.js`).

## Lista antes de lanzar
- [ ] Parte 1 completa
- [ ] URL pegada en `datos.js` y Facebook real
- [ ] Entrar al Panel (`admin.html`) con el PIN `1234` y **cambiarlo de una vez**
- [ ] En el Panel → Ajustes: WhatsApp real, correo de avisos, horario real, días libres reales
- [ ] En el Panel → Carta: precios y productos reales de Yeimer
- [ ] 2 o 3 reservas de prueba → revisar Calendar, pestaña Citas y correos → cancelarlas desde el Panel
- [ ] Link en la bio de Instagram, TikTok y Facebook
