# Página de Yeimer Salcedo — Guía de instalación y uso

## Cómo está armada

```
index.html            La página pública (no hace falta tocarla)
cancelar.html         Página a la que llega el cliente desde su correo para cancelar o cambiar su cita
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

> **Velocidad:** para que la página cargue rápido, el servidor guarda el catálogo 5 minutos en la memoria de Google. Esa memoria se borra sola cuando guardas cambios en el Panel o editas la hoja a mano, así que lo normal es que veas el cambio al instante. Si por alguna razón Google no avisa de una edición hecha en la hoja (a veces pasa con pegados grandes o ediciones desde otras apps), el cambio aparece a más tardar a los 5 minutos.

### El Panel de Yeimer (`admin.html`)

Es una página aparte, protegida con un **PIN de 4 a 8 dígitos**, pensada para el celular. Yeimer entra ahí — no a la hoja de cálculo — para el día a día:

- **Hoy / Semana:** sus citas con hora, cliente, dirección y total. Cada una tiene un botón para escribirle por WhatsApp (con el mensaje ya armado) y otro para **cancelarla** (si el cliente dejó correo, a él le llega la cancelación automáticamente, sin que Yeimer haga nada más).
- **Clientes:** todos los que le han pagado, ordenados por cuánto le han dejado en total — así ve de un vistazo quiénes son sus clientes frecuentes.
- **Carta:** editar precios, agregar o apagar servicios y productos. Cada servicio tiene dos campos opcionales:
  - **Duración (minutos):** si lo dejas vacío, dura lo normal de una cita (90 min). Si pones, por ejemplo, 30, ese servicio se ofrece cada 30 minutos dentro de la jornada, y solo bloquea esos 30 minutos en el Calendar.
  - **Precio máx.:** si lo llenas, la página muestra "desde $20.000 · hasta $25.000", el total sale como "Total desde…" y el Calendar y los correos dicen "desde … (hasta …, según el trabajo)". En los ingresos del Panel se suma el precio base. Si algún día el servicio tiene un solo precio, borra este campo. "Apagar" (el interruptor) los oculta de la página sin borrar el historial; "Eliminar" sí los quita de la lista.
- **Ajustes:** qué días no trabaja, a qué horas puede empezar una cita, cuánto dura cada una, la anticipación mínima, su WhatsApp, el correo donde le llegan los avisos, la zona de cobertura y el texto de nota en la página. También puede cambiar el PIN ahí mismo.

El PIN que trae por defecto es `1234` — es lo primero que hay que cambiar, en *Ajustes → Seguridad*. Como es solo un PIN (no un usuario con contraseña de verdad), no lo compartas fuera del círculo de confianza; para una barbería es un nivel de protección razonable, no bancario.

### Política de cancelación

**Qué ve el cliente.** Al agendar (paso 4) aparece la política y una casilla "Acepto la política de cancelación" que debe marcar. Esa aceptación queda guardada en la hoja *Citas* (cuándo aceptó, y con qué plazo y cargo: las columnas `AceptoEn`, `PlazoH` y `CargoPol`). La política vuelve a aparecer en la confirmación, en la invitación del calendario y en el recordatorio de 24 horas, siempre con un botón **"Cancelar o cambiar mi cita"**.

**Valores de arranque:** 4 horas de plazo sin costo y $20.000 de cargo. Se cambian en *Panel → Ajustes → Política de cancelación* (plazo, cargo, el texto completo y la dirección de la página). En el texto se escribe `{horas}` y `{cargo}` y se reemplazan solos. Cada cita se rige por la política que aceptó al agendar: si luego cambias los valores, solo aplican a las citas nuevas.

**Cómo puede cancelar un cliente**
- **Con el enlace** del correo o de la invitación (`cancelar.html`). Si falta más del plazo, cancela sin costo y la hora queda libre al instante. Si falta menos, la página le advierte el cargo y le ofrece primero escribirle a Yeimer; si cancela igual, queda registrado como tardía.
- **Respondiendo "No"** a la invitación de Google Calendar: se detecta cada hora y cuenta como cancelación suya (el momento que cuenta es cuando se detecta).
- **Avisándole a Yeimer por WhatsApp.** Entonces Yeimer la registra en el Panel (ver abajo).

**Cómo cobra Yeimer.** El sistema no cobra solo: detecta, prepara y deja que Yeimer decida.
- Cuando alguien cancela tarde, a Yeimer le llega un correo "⚠️ Cancelación TARDÍA" y aparece en *Panel → Cobros* (también como número rojo en la pestaña y un aviso arriba de *Hoy*).
- Cada cobro tiene un botón de **WhatsApp** con el mensaje ya escrito (recuerda la política aceptada, el valor, pregunta si paga por Nequi o transferencia, e invita a contar si fue una emergencia), y los botones **Cobrado** y **Perdonar**. Lo ya resuelto queda en el historial, con "Deshacer".
- En *Clientes* se ve cuántas cancelaciones tardías tiene cada uno. Sugerencia de uso: la primera vez, perdonar y avisar; desde la segunda, cobrar. Pero lo decide él.

**Desde el Panel**
- **Cancelar** una cita abre una hoja que pregunta *"¿El cliente me avisó?"* o *"¿Yo la cancelo?"*. Si el cliente avisó, muestra en el momento si es **a tiempo** o **tardía** (según cuántas horas faltan) y cuánto quedaría por cobrar, antes de confirmar. Si Yeimer cancela, nunca hay cargo.
- **No se presentó:** aparece en las citas que ya empezaron. Queda por cobrar igual que una cancelación tardía.

**Recomendación:** pon la *Anticipación mínima para reservar* (Ajustes) al menos igual al plazo de cancelación (4 horas = 240 minutos). Si no, alguien puede agendar con menos de 4 horas de anticipación y esa cita nace ya dentro del plazo con cargo. El Panel te avisa si están desalineados.

**Límites:** reprogramar es cancelar y agendar de nuevo (o hablar por WhatsApp). La cancelación por "No" en el calendario puede tardar hasta una hora en detectarse. Para citas muy tempranas (8:00 am), un plazo de 4 horas cae de madrugada (4:00 am): en la práctica, el cliente debe cancelar la noche anterior.

### Instalar el Panel como app en el celular

El Panel se puede poner en la pantalla de inicio del celular de Yeimer, con su ícono (el monograma dorado "YS"), y se abre a pantalla completa, sin barra del navegador.

**Archivos que lo hacen posible** (van en la raíz del proyecto, junto a `admin.html`): `admin.webmanifest`, `admin-sw.js` y la carpeta `icons/`. Si falta alguno, el Panel sigue funcionando en el navegador, pero no se deja instalar.

**Cómo instalarla** (desde el celular de Yeimer, abriendo `tu-link.vercel.app/admin.html`):
- **Android (Chrome):** tocar los tres puntos ⋮ → "Instalar app" (o "Agregar a pantalla de inicio"). En *Ajustes* del Panel también aparece un botón "Instalar en este celular".
- **iPhone (Safari):** tocar el botón Compartir (el cuadrito con la flecha) → "Agregar a pantalla de inicio". Tiene que ser desde Safari.

La primera vez, dentro de la app, escribe el PIN con la casilla **"Mantener sesión en este celular"** marcada. Desde ahí la app abre directo, sin pedir el PIN.

**Seguridad:** como el PIN queda recordado en el celular, quien tenga el celular desbloqueado puede abrir el Panel. Por eso el celular debe tener bloqueo de pantalla. Si Yeimer pierde el celular o lo presta, desde otro dispositivo cambia el PIN (Ajustes → Seguridad): el celular viejo deja de entrar. Para salir en un celular: Ajustes → "Cerrar sesión en este celular".

**Qué hace la app, y qué no:**
- Al volver a abrirla (si pasó más de un minuto), trae sola los datos frescos.
- Si no hay internet, abre igual y avisa "Sin conexión", pero no muestra la agenda: los datos siempre vienen de internet. Nada de la agenda ni de los clientes se guarda en el celular.
- **No manda notificaciones.** Para enterarse de una cita nueva, Yeimer ya recibe el correo "Nueva cita"; con las notificaciones de la app de Gmail activadas, le suena el celular.
- Cuando se publique una versión nueva del Panel, la app la toma sola, sin reinstalar.

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

## Protección contra abuso del formulario
El formulario es público, así que el sistema se defiende solo (límites en `CONFIG.LIMITE` de `Codigo.gs`):
- Máximo **2 citas pendientes** a la vez por teléfono o por correo, y 3 reservas en 24 h (cuentan las canceladas).
- Máximo **12 reservas por hora** y **40 por día** en total: si alguien intenta llenar la agenda con citas falsas, se corta solo y el cliente ve "escríbeme por WhatsApp".
- Solo celulares colombianos válidos; no se aceptan enlaces ni dominios en nombre, dirección o nota (nadie puede usar el Gmail de Yeimer para mandar invitaciones con links).
- Máximo 30 invitaciones de Calendar por día; pasado eso la cita se crea igual, pero sin invitar.
- Tope de 30 intentos por minuto en todo el sitio y trampa anti-bots (campo oculto).
- El Panel muestra un aviso rojo mientras el PIN tenga menos de 6 dígitos (el PIN `1234` queda marcado como débil). Tras 8 intentos fallidos se bloquea 15 minutos.
- Si un cliente real queda bloqueado por estos límites, Yeimer puede agendarlo directo en su Google Calendar.

## Límites a tener en cuenta
- Gmail gratuito permite ~100 correos al día desde Apps Script. Sobra para una agenda de barbero.
- Anticipación mínima para reservar: se cambia en el Panel → Ajustes (recomendado 240 min, igual al plazo de cancelación).
- Se puede reservar hasta 14 días adelante (`diasAdelante` en `datos.js`).

## Lista antes de lanzar
- [ ] Parte 1 completa
- [ ] URL pegada en `datos.js` y Facebook real
- [ ] Entrar al Panel (`admin.html`) con el PIN `1234` y **cambiarlo de una vez** por uno de 6 dígitos o más
- [ ] En el Panel → Ajustes: WhatsApp real, correo de avisos, horario real, días libres reales
- [ ] En el Panel → Carta: precios y productos reales de Yeimer
- [ ] 2 o 3 reservas de prueba → revisar Calendar, pestaña Citas y correos → cancelarlas desde el Panel
- [ ] Revisar la política en *Ajustes* (plazo, cargo y texto) y poner la anticipación mínima en 240 minutos
- [ ] Hacer una reserva de prueba, cancelarla con el enlace del correo y ver cómo llega a *Cobros*
- [ ] Link en la bio de Instagram, TikTok y Facebook
