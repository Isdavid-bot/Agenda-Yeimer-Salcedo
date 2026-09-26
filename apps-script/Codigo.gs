/* =============================================================================
   YEIMER SALCEDO — Agenda, catálogo y recordatorios
   Va dentro de una Hoja de cálculo de Google en la cuenta de Yeimer
   (Extensiones → Apps Script). Instrucciones completas en GUIA.md.

   Qué hace:
     • Lee servicios, productos y ajustes desde la hoja (se editan ahí).
     • Consulta las horas libres del Google Calendar de Yeimer.
     • Crea la cita en su calendario y la registra en la pestaña "Citas".
     • Envía correo de confirmación al cliente y aviso a Yeimer.
     • Envía recordatorio al cliente 24 h antes (correo, y WhatsApp si se activa).
     • Cada noche le manda a Yeimer la agenda de mañana con botones de WhatsApp.
   ============================================================================= */

const CONFIG = {
  ZONA: 'America/Bogota',
  DIAS_MAX: 60,                                           // hasta cuántos días adelante (tope duro)
  RECORDATORIO_HORAS: 24,                                 // recordatorio al cliente
  HORA_RESUMEN: 19,                                       // 7 pm: agenda de mañana

  // --- Cómo le llega la cita al cliente (si deja correo) ---
  INVITAR_CLIENTE: true,   // invitación de Google Calendar (como las páginas de citas de Google):
                           // la cita queda en SU calendario, con RSVP, y si Yeimer la mueve
                           // o la cancela, al cliente le llega la actualización.
  CORREO_MARCA: false,     // además, correo de confirmación con el diseño de la marca

  // --- WhatsApp automático (OPCIONAL, ver GUIA.md parte 5). Vacío = apagado ---
  WA_TOKEN: '',
  WA_PHONE_ID: '',
  WA_PLANTILLA: 'recordatorio_cita',
  WA_IDIOMA: 'es'

  // Duración de la cita, horario, días cerrados, PIN del panel, etc. ya NO están
  // aquí: se editan desde el Panel (admin.html) o directo en la pestaña "Ajustes",
  // así Yeimer los cambia sin tocar código.
};

const HOJAS = { SERV: 'Servicios', PROD: 'Productos', AJ: 'Ajustes', CITAS: 'Citas' };
const POR_DEFECTO = { horas_inicio: '08:00,09:30,11:00,12:30,14:00,15:30', duracion_min: 90, dias_cerrados: '0', aviso_min: 120, dias_adelante: 14, pin_admin: '1234' };
function agendaCfg_() {
  return {
    inicios: (ajuste_('horas_inicio') || POR_DEFECTO.horas_inicio).split(',').map(s => s.trim()).filter(Boolean).map(aMin_),
    duracion: Number(ajuste_('duracion_min')) || POR_DEFECTO.duracion_min,
    cerrados: (ajuste_('dias_cerrados') || POR_DEFECTO.dias_cerrados).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n)),
    avisoMin: Number(ajuste_('aviso_min')) || POR_DEFECTO.aviso_min,
    diasAdelante: Math.min(CONFIG.DIAS_MAX, Number(ajuste_('dias_adelante')) || POR_DEFECTO.dias_adelante)
  };
}
const DIAS = ['', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

/* =============================================================================
   MENÚ EN LA HOJA
   ============================================================================= */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('✂️ Yeimer')
    .addItem('1. Configurar (solo la primera vez)', 'configurar')
    .addItem('Enviarme un correo de prueba', 'probarCorreo')
    .addToUi();
}

/* =============================================================================
   CONFIGURACIÓN INICIAL — crea pestañas, datos de ejemplo y tareas automáticas
   ============================================================================= */
function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', ss.getId());
  ss.setSpreadsheetTimeZone(CONFIG.ZONA);

  crearHoja_(ss, HOJAS.SERV, ['ID', 'Nombre', 'Incluye', 'Precio', 'Etiqueta', 'Activo'], [
    ['s1', 'Corte básico', 'Corte de cabello', 50000, '', 'SI'],
    ['s2', 'Corte completo', 'Corte de cabello + barba', 60000, '', 'SI'],
    ['s3', 'Completo + cejas', 'Corte + barba + cejas', 65000, 'Todo', 'SI']
  ], [4]);

  crearHoja_(ss, HOJAS.PROD, ['ID', 'Nombre', 'Detalle', 'Precio', 'Activo'], [
    ['p1', 'Cera moldeadora', 'Fijación alta, mate', 18000, 'SI'],
    ['p2', 'Gel efecto húmedo', 'Fijación media, brillo', 15000, 'SI'],
    ['p3', 'Aceite para barba', 'Suaviza e hidrata', 25000, 'SI'],
    ['p4', 'Loción after shave', 'Calma la piel', 20000, 'SI'],
    ['p5', 'Polvo texturizante', 'Volumen sin peso', 24000, 'SI'],
    ['p6', 'Shampoo anticaspa', 'Uso diario', 22000, 'SI']
  ], [4]);

  crearHoja_(ss, HOJAS.AJ, ['Clave', 'Valor', 'Para qué sirve'], [
    ['whatsapp', '57XXXXXXXXXX', 'WhatsApp de Yeimer: 57 + número, sin espacios ni +'],
    ['correo_avisos', Session.getEffectiveUser().getEmail(), 'A dónde llegan los avisos de citas nuevas'],
    ['nota_servicios', 'Visita gratis en la zona urbana de Montería. Fuera del casco urbano se cobra domicilio.', 'Texto bajo los servicios'],
    ['zona_cobertura', 'Montería y alrededores', 'Se muestra en la página y sirve de referencia interna'],
    ['horas_inicio', '08:00,09:30,11:00,12:30,14:00,15:30', 'Horas en que puede EMPEZAR una cita (24h, separadas por coma)'],
    ['duracion_min', '90', 'Duración de cada cita, en minutos'],
    ['dias_cerrados', '0', 'Días que no trabaja: 0=domingo 1=lunes 2=martes 3=miércoles 4=jueves 5=viernes 6=sábado (varios: 0,6)'],
    ['aviso_min', '120', 'No se puede reservar con menos de estos minutos de anticipación'],
    ['dias_adelante', '14', 'Hasta cuántos días adelante se puede agendar'],
    ['pin_admin', '1234', 'Clave para entrar al Panel (admin.html). CÁMBIALA apenas empieces.']
  ], []);

  const citas = crearHoja_(ss, HOJAS.CITAS,
    ['Creada', 'Inicio', 'Nombre', 'WhatsApp', 'Correo', 'Dirección', 'Servicio', 'Productos', 'Total', 'Nota', 'Estado', 'Recordatorio', 'EventoID'], [], [9]);
  citas.getRange('A:B').setNumberFormat('ddd d mmm yyyy, h:mm am/pm');
  citas.hideColumns(13);

  const hoja1 = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
  if (hoja1 && ss.getSheets().length > 1 && hoja1.getLastRow() === 0) ss.deleteSheet(hoja1);

  // Tareas automáticas
  ScriptApp.getProjectTriggers().forEach(t => {
    if (['enviarRecordatorios', 'resumenDiario'].indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('enviarRecordatorios').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('resumenDiario').timeBased().atHour(CONFIG.HORA_RESUMEN).everyDays(1).inTimezone(CONFIG.ZONA).create();

  aviso_('Listo, mi hermanito ✂️\n\nSe crearon las pestañas y las tareas automáticas.\n\nSiguiente paso: Implementar → Nueva implementación → Aplicación web (ver GUIA.md).');
}

function crearHoja_(ss, nombre, encabezados, filas, colsPrecio) {
  let sh = ss.getSheetByName(nombre);
  if (sh) return sh;                                   // no pisar datos existentes
  sh = ss.insertSheet(nombre);
  sh.getRange(1, 1, 1, encabezados.length).setValues([encabezados])
    .setFontWeight('bold').setBackground('#0b0b0a').setFontColor('#c9a45c');
  if (filas.length) sh.getRange(2, 1, filas.length, encabezados.length).setValues(filas);
  sh.setFrozenRows(1);
  colsPrecio.forEach(c => sh.getRange(2, c, 999, 1).setNumberFormat('$#,##0'));
  sh.autoResizeColumns(1, encabezados.length);
  return sh;
}

/* =============================================================================
   API WEB  (la página llama aquí)
   ============================================================================= */
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.accion === 'catalogo') return json_(catalogo_());
    if (p.accion === 'horas') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(p.fecha || '')) return json_({ error: 'fecha' });
      return json_({ libres: horasLibres_(p.fecha) });
    }
    if (p.accion === 'panel') {
      const estado = estadoAcceso_(p.pin);
      if (estado !== 'ok') return json_({ ok: false, error: estado });
      return json_(datosPanel_());
    }
    return json_({ ok: true, servicio: 'Agenda Yeimer' });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function doPost(e) {
  const d0 = JSON.parse(e.postData.contents || '{}');
  if (d0.accion && d0.accion !== 'reservar') return accionPanel_(d0);   // rutas del panel

  const lock = LockService.getScriptLock();
  let resp;
  let cita = null;
  try {
    lock.waitLock(20000);
    const d = d0;
    if (d.web) return json_({ ok: true });                         // trampa anti-bots

    // ---- validación ----
    const ag = agendaCfg_();
    const inicios = ag.inicios;
    const inicio = Number(d.inicio);
    const nombre = limpio_(d.nombre, 80);
    const telefono = String(d.telefono || '').replace(/\D/g, '');
    const direccion = limpio_(d.direccion, 200);
    const correo = limpio_(d.correo, 120);
    const nota = limpio_(d.nota, 500);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.fecha || '') || inicios.indexOf(inicio) === -1) return json_({ ok: false, error: 'hora' });
    if (nombre.length < 2 || telefono.length < 7 || direccion.length < 4) return json_({ ok: false, error: 'datos' });
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return json_({ ok: false, error: 'correo' });
    if (d.consentimiento !== true) return json_({ ok: false, error: 'consentimiento' });

    // ---- precios desde la hoja (no se confía en lo que manda el navegador) ----
    const cat = catalogo_();
    const serv = cat.servicios.find(s => s.id === String(d.servicioId));
    if (!serv) return json_({ ok: false, error: 'servicio' });
    let total = serv.precio;
    const lineas = [];
    (Array.isArray(d.productos) ? d.productos : []).forEach(it => {
      const p = cat.productos.find(x => x.id === String(it.id));
      const cant = Math.max(0, Math.min(10, parseInt(it.cant, 10) || 0));
      if (p && cant) { total += p.precio * cant; lineas.push(p.nombre + ' ×' + cant); }
    });
    const productos = lineas.join(', ') || 'Ninguno';

    // ---- disponibilidad (se vuelve a revisar dentro del candado) ----
    if (horasLibres_(d.fecha, ag).indexOf(inicio) === -1) return json_({ ok: false, error: 'ocupado' });

    const ini = new Date(inicioDia_(d.fecha).getTime() + inicio * 60000);
    const fin = new Date(ini.getTime() + ag.duracion * 60000);
    const wa = telWa_(telefono);

    // La descripción la ven Yeimer y el cliente (si se le envía invitación)
    const waYeimer = String(ajuste_('whatsapp') || '').replace(/\D/g, '');
    const descripcion = [
      'Servicio: ' + serv.nombre + ' (' + cop_(serv.precio) + ')',
      'Productos: ' + productos,
      'Total: ' + cop_(total),
      'Dirección: ' + direccion,
      nota ? 'Nota: ' + nota : '',
      '',
      'Cliente: ' + nombre + ' · WhatsApp +' + wa + ' (https://wa.me/' + wa + ')',
      waYeimer.length >= 10 ? '¿Algún cambio? Escríbeme: https://wa.me/' + waYeimer : '',
      '',
      '— Agendado desde la página de Yeimer Salcedo'
    ].filter((x, i, a) => x !== '' || (a[i - 1] !== '' && i > 0)).join('\n').trim();

    const opciones = { description: descripcion, location: direccion };
    if (correo && CONFIG.INVITAR_CLIENTE) { opciones.guests = correo; opciones.sendInvites = true; }

    const ev = calendario_().createEvent('✂️ Barbería en casa con Yeimer Salcedo (' + nombre + ')', ini, fin, opciones);
    ev.addPopupReminder(60);

    const dentroVentana = (ini.getTime() - Date.now()) <= CONFIG.RECORDATORIO_HORAS * 3600000;
    hoja_(HOJAS.CITAS).appendRow([
      new Date(), ini, nombre, '+' + wa, correo, direccion, serv.nombre, productos, total, nota,
      'Agendada', dentroVentana ? 'No aplica (reserva cercana)' : '', ev.getId()
    ]);
    SpreadsheetApp.flush();

    cita = { ini: ini, nombre: nombre, wa: wa, correo: correo, direccion: direccion, servicio: serv.nombre, productos: productos, total: total, nota: nota };
    resp = { ok: true, correo: !!correo, invitacion: !!(correo && CONFIG.INVITAR_CLIENTE) };
  } catch (err) {
    resp = { ok: false, error: String(err) };
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }

  // Correos fuera del candado (si fallan, la cita igual queda creada)
  if (cita) {
    try { if (cita.correo && (CONFIG.CORREO_MARCA || !CONFIG.INVITAR_CLIENTE)) correoConfirmacion_(cita); } catch (err) { console.error(err); }
    try { correoAvisoYeimer_(cita); } catch (err) { console.error(err); }
  }
  return json_(resp);
}

/* =============================================================================
   CATÁLOGO Y DISPONIBILIDAD
   ============================================================================= */
function catalogo_() {
  const servicios = filas_(HOJAS.SERV).filter(activo_).map((r, i) => ({
    id: String(r.id || 's' + (i + 1)), nombre: String(r.nombre), incluye: String(r.incluye || ''),
    precio: num_(r.precio), etiqueta: String(r.etiqueta || '')
  }));
  const productos = filas_(HOJAS.PROD).filter(activo_).map((r, i) => ({
    id: String(r.id || 'p' + (i + 1)), nombre: String(r.nombre), detalle: String(r.detalle || ''),
    precio: num_(r.precio)
  }));
  const ag = agendaCfg_();
  return {
    servicios: servicios, productos: productos,
    ajustes: { whatsapp: ajuste_('whatsapp'), nota_servicios: ajuste_('nota_servicios'), zona_cobertura: ajuste_('zona_cobertura') },
    agenda: { duracion: ag.duracion, inicios: ag.inicios, diasCerrados: ag.cerrados, diasAdelante: ag.diasAdelante }
  };
}

function horasLibres_(fecha, ag) {
  ag = ag || agendaCfg_();
  const base = inicioDia_(fecha);
  const diaIso = Number(Utilities.formatDate(base, CONFIG.ZONA, 'u'));   // 1=lunes…7=domingo
  const diaJs = diaIso % 7;                                              // 0=domingo…6=sábado
  if (ag.cerrados.indexOf(diaJs) !== -1) return [];

  const hoy = inicioDia_(Utilities.formatDate(new Date(), CONFIG.ZONA, 'yyyy-MM-dd'));
  if (base < hoy || base.getTime() - hoy.getTime() > CONFIG.DIAS_MAX * 86400000) return [];

  const ocupados = calendario_().getEvents(base, new Date(base.getTime() + 86400000))
    .filter(ev => ev.getMyStatus() !== CalendarApp.GuestStatus.NO)
    .map(ev => [ev.getStartTime().getTime(), ev.getEndTime().getTime()]);

  const limite = Date.now() + ag.avisoMin * 60000;
  return ag.inicios.filter(m => {
    const ini = base.getTime() + m * 60000, fin = ini + ag.duracion * 60000;
    if (ini < limite) return false;
    return !ocupados.some(o => ini < o[1] && fin > o[0]);
  });
}

/* =============================================================================
   PANEL DE ADMINISTRACIÓN (admin.html) — todo protegido con PIN
   ============================================================================= */
// Freno de fuerza bruta: 8 intentos fallidos en 15 min bloquean el panel otros 15 min.
// No distingue por dispositivo (Apps Script no expone la IP de quien llama), pero
// basta para que probar las 10.000 combinaciones de un PIN de 4 dígitos sea
// impráctico. Mientras más largo el PIN, más inútil se vuelve intentar adivinarlo.
function estadoAcceso_(pin) {
  const cache = CacheService.getScriptCache();
  if (Date.now() < Number(cache.get('admin_bloqueo') || 0)) return 'bloqueado';

  const real = String(ajuste_('pin_admin') || POR_DEFECTO.pin_admin).trim();
  if (pin && String(pin).trim() === real) { cache.remove('admin_intentos'); return 'ok'; }

  const intentos = Number(cache.get('admin_intentos') || 0) + 1;
  cache.put('admin_intentos', String(intentos), 900);
  if (intentos >= 8) cache.put('admin_bloqueo', String(Date.now() + 15 * 60000), 900);
  return 'pin';
}

function accionPanel_(d) {
  try {
    const estado = estadoAcceso_(d.pin);
    if (estado !== 'ok') return json_({ ok: false, error: estado });
    switch (d.accion) {
      case 'guardar_pin':       return guardarPin_(d);
      case 'guardar_ajustes':   return guardarAjustes_(d);
      case 'guardar_servicios': return guardarFilas_(HOJAS.SERV, ['id', 'nombre', 'incluye', 'precio', 'etiqueta', 'activo'], d.filas);
      case 'guardar_productos': return guardarFilas_(HOJAS.PROD, ['id', 'nombre', 'detalle', 'precio', 'activo'], d.filas);
      case 'cancelar_cita':     return cancelarCita_(d.eventoId);
      default: return json_({ ok: false, error: 'accion' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Todo lo que ve el panel al abrirse: agenda, clientes, ingresos, catálogo y ajustes
function datosPanel_() {
  const filas = hoja_(HOJAS.CITAS).getDataRange().getValues().slice(1)
    .filter(r => r[1] instanceof Date)
    .map(r => ({ ini: r[1], nombre: r[2], whatsapp: r[3], correo: r[4], direccion: r[5], servicio: r[6], productos: r[7], total: Number(r[8]) || 0, nota: r[9], estado: r[10], eventoId: r[12] }));

  const hoy = inicioDia_(Utilities.formatDate(new Date(), CONFIG.ZONA, 'yyyy-MM-dd'));
  const finHoy = new Date(hoy.getTime() + 86400000);
  const finSemana = new Date(hoy.getTime() + 7 * 86400000);
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  const activas = filas.filter(c => c.estado !== 'Cancelada');
  const enRango = (c, a, b) => c.ini >= a && c.ini < b;

  const sumar = lista => lista.reduce((s, c) => s + c.total, 0);
  const hoyCitas = activas.filter(c => enRango(c, hoy, finHoy)).sort((a, b) => a.ini - b.ini);
  const semanaCitas = activas.filter(c => enRango(c, hoy, finSemana)).sort((a, b) => a.ini - b.ini);
  const mesCitas = activas.filter(c => c.ini >= inicioMes && c.ini < finHoy);

  // Clientes frecuentes: se agrupan por WhatsApp (más confiable que el nombre)
  const porCliente = {};
  activas.forEach(c => {
    const k = c.whatsapp || c.nombre;
    if (!porCliente[k]) porCliente[k] = { nombre: c.nombre, whatsapp: c.whatsapp, visitas: 0, total: 0, ultima: c.ini };
    porCliente[k].visitas++; porCliente[k].total += c.total;
    if (c.ini > porCliente[k].ultima) porCliente[k].ultima = c.ini;
  });
  const clientes = Object.values(porCliente).sort((a, b) => b.total - a.total);

  const ag = agendaCfg_();
  return {
    hoy: hoyCitas, semana: semanaCitas, clientes: clientes,
    resumen: {
      hoy: { citas: hoyCitas.length, ingresos: sumar(hoyCitas) },
      semana: { citas: semanaCitas.length, ingresos: sumar(semanaCitas) },
      mes: { citas: mesCitas.length, ingresos: sumar(mesCitas) }
    },
    servicios: filas_(HOJAS.SERV).map(r => ({ id: String(r.id), nombre: String(r.nombre), incluye: String(r.incluye || ''), precio: num_(r.precio), etiqueta: String(r.etiqueta || ''), activo: activo_(r) })),
    productos: filas_(HOJAS.PROD).map(r => ({ id: String(r.id), nombre: String(r.nombre), detalle: String(r.detalle || ''), precio: num_(r.precio), activo: activo_(r) })),
    ajustes: {
      whatsapp: ajuste_('whatsapp'), correo_avisos: ajuste_('correo_avisos'), nota_servicios: ajuste_('nota_servicios'),
      zona_cobertura: ajuste_('zona_cobertura'), horas_inicio: ajuste_('horas_inicio') || POR_DEFECTO.horas_inicio,
      duracion_min: Number(ajuste_('duracion_min')) || POR_DEFECTO.duracion_min,
      dias_cerrados: ajuste_('dias_cerrados') || POR_DEFECTO.dias_cerrados,
      aviso_min: Number(ajuste_('aviso_min')) || POR_DEFECTO.aviso_min,
      dias_adelante: Number(ajuste_('dias_adelante')) || POR_DEFECTO.dias_adelante
    }
  };
}

function guardarPin_(d) {
  const nuevo = String(d.nuevoPin || '').trim();
  if (nuevo.length < 4) return json_({ ok: false, error: 'El PIN debe tener al menos 4 dígitos' });
  setAjuste_('pin_admin', nuevo);
  return json_({ ok: true });
}

function guardarAjustes_(d) {
  const permitidas = ['whatsapp', 'correo_avisos', 'nota_servicios', 'zona_cobertura', 'horas_inicio', 'duracion_min', 'dias_cerrados', 'aviso_min', 'dias_adelante'];
  Object.keys(d.valores || {}).forEach(k => { if (permitidas.indexOf(k) !== -1) setAjuste_(k, String(d.valores[k]).trim()); });
  return json_({ ok: true });
}

// Actualiza filas existentes (por ID) y agrega las nuevas; nunca borra una fila —
// para quitar un servicio/producto de la web, se apaga con "activo" en false.
function guardarFilas_(nombreHoja, columnas, filas) {
  if (!Array.isArray(filas)) return json_({ ok: false, error: 'filas' });
  const sh = hoja_(nombreHoja);
  const v = sh.getDataRange().getValues();
  const idxId = columnas.indexOf('id');
  const porId = {};
  for (let i = 1; i < v.length; i++) porId[String(v[i][idxId])] = i + 1;   // fila real en la hoja

  filas.forEach(f => {
    const id = String(f.id || '').trim() || Utilities.getUuid().slice(0, 8);
    const fila = columnas.map(c => c === 'activo' ? (f.activo === false ? 'NO' : 'SI') : (c === 'precio' ? num_(f[c]) : String(f[c] ?? '').trim()));
    fila[idxId] = id;
    if (porId[id]) sh.getRange(porId[id], 1, 1, columnas.length).setValues([fila]);
    else sh.appendRow(fila);
  });
  return json_({ ok: true });
}

function cancelarCita_(eventoId) {
  if (!eventoId) return json_({ ok: false, error: 'eventoId' });
  const ev = calendario_().getEventById(eventoId);
  if (ev) ev.deleteEvent();               // si tenía invitado, Calendar le manda la cancelación solo
  const sh = hoja_(HOJAS.CITAS);
  const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) if (v[i][12] === eventoId) sh.getRange(i + 1, 11).setValue('Cancelada');
  return json_({ ok: true });
}

function setAjuste_(clave, valor) {
  const sh = hoja_(HOJAS.AJ);
  const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) if (String(v[i][0]).trim() === clave) { sh.getRange(i + 1, 2).setValue(valor); return; }
  sh.appendRow([clave, valor, '']);
}

/* =============================================================================
   TAREAS AUTOMÁTICAS
   ============================================================================= */
// Cada hora: recordatorio al cliente cuando falten ~24 h
function enviarRecordatorios() {
  const sh = hoja_(HOJAS.CITAS);
  const v = sh.getDataRange().getValues();
  const ahora = Date.now();
  for (let i = 1; i < v.length; i++) {
    const [, inicio, nombre, wa, correo, direccion, servicio, , , , estado, recordatorio, evId] = v[i];
    if (estado !== 'Agendada' || recordatorio) continue;

    const ev = evId ? calendario_().getEventById(evId) : null;
    if (!ev) { sh.getRange(i + 1, 11).setValue('Cancelada'); continue; }
    const ini = ev.getStartTime();                        // por si Yeimer la movió
    if (ini.getTime() !== new Date(inicio).getTime()) sh.getRange(i + 1, 2).setValue(ini);

    const falta = ini.getTime() - ahora;
    if (falta <= 0) { sh.getRange(i + 1, 12).setValue('No enviado (ya pasó)'); continue; }
    if (falta > CONFIG.RECORDATORIO_HORAS * 3600000) continue;

    const canales = [];
    try { if (correo) { correoRecordatorio_({ ini: ini, nombre: nombre, correo: correo, direccion: direccion, servicio: servicio }); canales.push('correo'); } } catch (err) { console.error(err); }
    try { if (whatsappActivo_() && enviarWhatsApp_(String(wa), [primerNombre_(nombre), cuando_(ini), String(direccion)])) canales.push('WhatsApp'); } catch (err) { console.error(err); }
    sh.getRange(i + 1, 12).setValue(canales.length ? 'Enviado por ' + canales.join(' y ') : 'Sin correo');
  }
}

// Cada noche: a Yeimer le llega la agenda de mañana con botones de WhatsApp
function resumenDiario() {
  const manana = inicioDia_(Utilities.formatDate(new Date(Date.now() + 86400000), CONFIG.ZONA, 'yyyy-MM-dd'));
  const fin = manana.getTime() + 86400000;
  const v = hoja_(HOJAS.CITAS).getDataRange().getValues().slice(1);
  const citas = v.map(r => {
    if (r[10] !== 'Agendada') return null;
    const ev = r[12] ? calendario_().getEventById(r[12]) : null;
    if (!ev) return null;
    const ini = ev.getStartTime();
    if (ini.getTime() < manana.getTime() || ini.getTime() >= fin) return null;
    return { ini: ini, nombre: r[2], wa: String(r[3]).replace(/\D/g, ''), direccion: r[5], servicio: r[6], productos: r[7], total: r[8] };
  }).filter(Boolean).sort((a, b) => a.ini - b.ini);

  if (!citas.length) return;
  const bloques = citas.map(c => {
    const msg = encodeURIComponent('Hola ' + primerNombre_(c.nombre) + ', mi hermanito! Te recuerdo tu cita de mañana a las ' + hora_(c.ini) + ' (' + c.servicio + '). Llego a: ' + c.direccion + '. ¡Nos vemos! ✂️');
    return '<tr><td style="padding:16px 0;border-top:1px solid #2a2a27">' +
      '<div style="font-size:18px;font-weight:700;color:#c9a45c">' + hora_(c.ini) + '</div>' +
      '<div style="font-size:16px;margin-top:4px">' + esc_(c.nombre) + ' — ' + esc_(c.servicio) + '</div>' +
      '<div style="font-size:14px;color:#a6a095;margin-top:4px">' + esc_(c.direccion) + '<br>Llevar: ' + esc_(c.productos) + ' · Total ' + cop_(c.total) + '</div>' +
      '<a href="https://wa.me/' + c.wa + '?text=' + msg + '" style="display:inline-block;margin-top:10px;background:#c9a45c;color:#0b0b0a;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px">Enviar recordatorio por WhatsApp</a>' +
      '</td></tr>';
  }).join('');

  MailApp.sendEmail({
    to: ajuste_('correo_avisos') || Session.getEffectiveUser().getEmail(),
    subject: '✂️ Tu agenda de mañana: ' + citas.length + (citas.length === 1 ? ' cita' : ' citas'),
    htmlBody: marco_('Mañana, ' + DIAS[Number(Utilities.formatDate(manana, CONFIG.ZONA, 'u'))],
      '<table style="width:100%;border-collapse:collapse">' + bloques + '</table>'),
    name: 'Agenda web'
  });
}

/* =============================================================================
   CORREOS
   ============================================================================= */
function correoConfirmacion_(c) {
  MailApp.sendEmail({
    to: c.correo,
    subject: '✂️ Tu cita quedó agendada — ' + cuando_(c.ini),
    htmlBody: marco_('¡Listo, ' + esc_(primerNombre_(c.nombre)) + '!',
      '<p style="margin:0 0 20px;color:#a6a095">Mi hermanito, tu cita quedó en mi agenda. Te espero con todo listo.</p>' +
      tabla_([['Cuándo', cuando_(c.ini)], ['Dónde', esc_(c.direccion)], ['Servicio', esc_(c.servicio)], ['Te llevo', esc_(c.productos)], ['Total', '<b style="color:#c9a45c">' + cop_(c.total) + '</b>']]) +
      '<p style="margin:22px 0 0;color:#a6a095;font-size:14px">Un día antes te llega un recordatorio. Si necesitas cambiar la hora, escríbeme.</p>' +
      botonWa_()),
    name: 'Yeimer Salcedo'
  });
}

function correoRecordatorio_(c) {
  MailApp.sendEmail({
    to: c.correo,
    subject: '⏰ Mañana nos vemos — ' + hora_(c.ini),
    htmlBody: marco_('Nos vemos mañana, ' + esc_(primerNombre_(c.nombre)),
      '<p style="margin:0 0 20px;color:#a6a095">Mi hermanito, te recuerdo tu cita. Llego con todo mi equipo.</p>' +
      tabla_([['Cuándo', cuando_(c.ini)], ['Dónde', esc_(c.direccion)], ['Servicio', esc_(c.servicio)]]) +
      '<p style="margin:22px 0 0;color:#a6a095;font-size:14px">¿Algún cambio? Escríbeme y lo cuadramos.</p>' +
      botonWa_()),
    name: 'Yeimer Salcedo'
  });
}

function correoAvisoYeimer_(c) {
  const msg = encodeURIComponent('Hola ' + primerNombre_(c.nombre) + ', mi hermanito! Confirmado: ' + cuando_(c.ini) + '. Nos vemos ✂️');
  MailApp.sendEmail({
    to: ajuste_('correo_avisos') || Session.getEffectiveUser().getEmail(),
    subject: '🆕 Nueva cita: ' + c.nombre + ' — ' + cuando_(c.ini),
    htmlBody: marco_('Nueva cita',
      tabla_([['Cliente', esc_(c.nombre)], ['Cuándo', cuando_(c.ini)], ['Dónde', esc_(c.direccion)], ['Servicio', esc_(c.servicio)], ['Llevar', esc_(c.productos)], ['Total', cop_(c.total)], ['Nota', esc_(c.nota || '—')]]) +
      '<a href="https://wa.me/' + c.wa + '?text=' + msg + '" style="display:inline-block;margin-top:22px;background:#c9a45c;color:#0b0b0a;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">Escribirle por WhatsApp</a>'),
    name: 'Agenda web'
  });
}

function probarCorreo() {
  const yo = Session.getEffectiveUser().getEmail();
  correoConfirmacion_({ ini: new Date(Date.now() + 86400000), nombre: 'Cliente de prueba', correo: yo, direccion: 'Calle de prueba', servicio: 'Corte completo', productos: 'Cera moldeadora ×1', total: 78000 });
  aviso_('Correo de prueba enviado a ' + yo);
}

function marco_(titulo, cuerpo) {
  return '<div style="background:#0b0b0a;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">' +
    '<div style="max-width:520px;margin:0 auto;background:#121211;border:1px solid #2a2a27;border-radius:18px;padding:30px 26px;color:#f2eee6">' +
    '<div style="font-size:12px;letter-spacing:3px;color:#c9a45c;font-weight:700;text-transform:uppercase">Yeimer Salcedo</div>' +
    '<div style="font-size:26px;font-weight:800;margin:10px 0 18px;text-transform:uppercase">' + titulo + '</div>' +
    cuerpo +
    '<div style="margin-top:28px;padding-top:16px;border-top:1px solid #2a2a27;font-size:12px;color:#6d6860">El mejor barbero de Montería · A domicilio</div>' +
    '</div></div>';
}
function tabla_(filas) {
  return '<table style="width:100%;border-collapse:collapse;font-size:15px">' + filas.map(f =>
    '<tr><td style="padding:10px 0;border-top:1px solid #2a2a27;color:#6d6860;font-size:12px;text-transform:uppercase;letter-spacing:1px;width:90px;vertical-align:top">' + f[0] +
    '</td><td style="padding:10px 0;border-top:1px solid #2a2a27">' + f[1] + '</td></tr>').join('') + '</table>';
}
function botonWa_() {
  const wa = String(ajuste_('whatsapp') || '').replace(/\D/g, '');
  if (wa.length < 10) return '';
  return '<a href="https://wa.me/' + wa + '" style="display:inline-block;margin-top:18px;background:#c9a45c;color:#0b0b0a;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">Escribirme por WhatsApp</a>';
}

/* =============================================================================
   WHATSAPP AUTOMÁTICO (opcional — WhatsApp Business Cloud API de Meta)
   ============================================================================= */
function whatsappActivo_() { return !!(CONFIG.WA_TOKEN && CONFIG.WA_PHONE_ID); }
function enviarWhatsApp_(telefono, parametros) {
  const r = UrlFetchApp.fetch('https://graph.facebook.com/v20.0/' + CONFIG.WA_PHONE_ID + '/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + CONFIG.WA_TOKEN },
    payload: JSON.stringify({
      messaging_product: 'whatsapp', to: telWa_(telefono), type: 'template',
      template: { name: CONFIG.WA_PLANTILLA, language: { code: CONFIG.WA_IDIOMA },
        components: [{ type: 'body', parameters: parametros.map(t => ({ type: 'text', text: String(t) })) }] }
    })
  });
  if (r.getResponseCode() >= 300) { console.error(r.getContentText()); return false; }
  return true;
}

/* =============================================================================
   AUXILIARES
   ============================================================================= */
function libro_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function hoja_(n) { return libro_().getSheetByName(n); }
function calendario_() { return CalendarApp.getDefaultCalendar(); }
function filas_(nombre) {
  const sh = hoja_(nombre); if (!sh) return [];
  const v = sh.getDataRange().getValues(); if (v.length < 2) return [];
  const k = v[0].map(h => String(h).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
  return v.slice(1).filter(r => String(r[1]).trim()).map(r => { const o = {}; k.forEach((c, i) => o[c] = r[i]); return o; });
}
function ajuste_(clave) {
  const r = filas_(HOJAS.AJ).find(x => String(x.clave).trim() === clave);
  return r ? String(r.valor).trim() : '';
}
function activo_(r) { return String(r.activo || 'SI').trim().toUpperCase() !== 'NO'; }
function num_(v) { return typeof v === 'number' ? v : Number(String(v).replace(/[^\d]/g, '')) || 0; }
function aMin_(t) { const p = t.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
function inicioDia_(f) { return Utilities.parseDate(f + ' 00:00', CONFIG.ZONA, 'yyyy-MM-dd HH:mm'); }
function limpio_(s, max) { return String(s || '').replace(/[<>]/g, '').trim().slice(0, max); }
function telWa_(t) { t = String(t).replace(/\D/g, ''); return (t.length === 10 && t[0] === '3') ? '57' + t : t; }
function primerNombre_(n) { return String(n).trim().split(/\s+/)[0]; }
function cop_(n) { return '$' + Number(n || 0).toLocaleString('es-CO'); }
function esc_(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function hora_(d) {
  const H = Number(Utilities.formatDate(d, CONFIG.ZONA, 'H')), m = Utilities.formatDate(d, CONFIG.ZONA, 'mm');
  return ((H + 11) % 12 + 1) + ':' + m + (H < 12 ? ' am' : ' pm');
}
function cuando_(d) {
  const f = k => Number(Utilities.formatDate(d, CONFIG.ZONA, k));
  return DIAS[f('u')] + ' ' + f('d') + ' de ' + MESES[f('M') - 1] + ', ' + hora_(d);
}
function aviso_(txt) { try { SpreadsheetApp.getUi().alert(txt); } catch (_) { console.log(txt); } }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
