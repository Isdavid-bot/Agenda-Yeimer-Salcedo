/* =============================================================================
   DATOS.JS — Textos de la marca, redes y conexión con la agenda.

   ⚠️  PRECIOS, SERVICIOS Y PRODUCTOS YA NO SE CAMBIAN AQUÍ:
       se cambian en la Hoja de cálculo de Google de Yeimer
       (pestañas "Servicios" y "Productos"). La página los lee de ahí.

   Lo de abajo en "respaldo" solo se usa en MODO DEMO (sin apiUrl) o si la
   hoja no responde.
   ============================================================================= */

const DATOS = {

  marca: {
    nombre: "Yeimer Salcedo",
    titulo: ["El mejor", "barbero de", "Montería"],
    ciudad: "Montería",
    frase: "Mi hermanito, yo llego donde tú digas con todo mi equipo y la capa. Escoge tu corte, aparta tu hora y listo.",
    beneficios: ["Visita gratis en Montería", "Citas de 90 min"],
    despedida: ["Nos vemos pronto,", "mi hermanito."],
    fotos: ["fotos/yeimer-1.jpg", "fotos/yeimer-2.jpg", "fotos/yeimer-3.jpg"],
    fotosSegundos: 3,
    foto: "fotos/yeimer-1.jpg"
  },

  contacto: {
    whatsapp: "57XXXXXXXXXX",   // solo para modo demo; el real va en la hoja (Ajustes)
    correo: "",                  // correo de Yeimer para la política de datos
    instagram: "https://www.instagram.com/yeimersalcedooficial",
    instagramUsuario: "@yeimersalcedooficial",
    tiktok: "https://www.tiktok.com/@yeimersalcedooficial",
    tiktokUsuario: "@yeimersalcedooficial",
    facebook: "https://www.facebook.com/yeimer.salcedo.2025/",   // ← PONER
    facebookNombre: "Yeimer Salcedo El mejor barbero de Monteria"
  },

  agenda: {
    // Pega aquí la URL de la aplicación web de Apps Script (termina en /exec).
    // Vacío = MODO DEMO (horarios de ejemplo, no agenda nada).
    apiUrl: "https://script.google.com/macros/s/AKfycbw4V2vAVoArUxTCnIcXQQxv_zMypJHhPjyJE1CXxdvCHLu08c74xNXh_MUxmYa96bXd/exec",
    diasAdelante: 14,
    diasCerrados: [0]            // 0 = domingo (debe coincidir con el Apps Script)
  },

  respaldo: {
    nota: "Visita gratis en la zona urbana de Montería. Fuera del casco urbano se cobra domicilio.",
    duracion: 90,
    inicios: ["08:00", "09:30", "11:00", "12:30", "14:00", "15:30"],
    servicios: [
      { id: "s1", nombre: "Corte básico",     incluye: "Corte de cabello",          precio: 50000 },
      { id: "s2", nombre: "Corte completo",   incluye: "Corte de cabello + barba",  precio: 60000 },
      { id: "s3", nombre: "Completo + cejas", incluye: "Corte + barba + cejas",     precio: 65000, etiqueta: "Todo" }
    ],
    productos: [
      { id: "p1", nombre: "Cera moldeadora",    detalle: "Fijación alta, mate",    precio: 18000 },
      { id: "p2", nombre: "Gel efecto húmedo",  detalle: "Fijación media, brillo", precio: 15000 },
      { id: "p3", nombre: "Aceite para barba",  detalle: "Suaviza e hidrata",      precio: 25000 },
      { id: "p4", nombre: "Loción after shave", detalle: "Calma la piel",          precio: 20000 },
      { id: "p5", nombre: "Polvo texturizante", detalle: "Volumen sin peso",       precio: 24000 },
      { id: "p6", nombre: "Shampoo anticaspa",  detalle: "Uso diario",             precio: 22000 }
    ]
  }
};
