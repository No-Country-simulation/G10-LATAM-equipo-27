/* ==========================================================================
   CloudEdTech CommunityLab — Datos dummy
   Cifras base tomadas de los mocks del frontend original (2.481 mensajes,
   1.842 de audiencia, 72% positivo…). Todo lo demás es ficticio.
   ========================================================================== */
(function () {
  'use strict';

  // RNG con semilla: mismos datos en cada carga, distintos por período.
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  const TODAY = new Date(2026, 9, 19); // 19 oct 2026
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const fmtDay = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

  function dayLabels(days) {
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(TODAY); d.setDate(d.getDate() - i); out.push(fmtDay(d));
    }
    return out;
  }

  /** Serie diaria con tendencia, estacionalidad semanal y ruido. */
  function series(days, { base = 80, amp = 25, trend = 0.4, seed = 1, weekend = 0.65 } = {}) {
    const r = rng(seed * 97 + days);
    const out = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(TODAY); d.setDate(d.getDate() - (days - 1 - i));
      const wk = (d.getDay() === 0 || d.getDay() === 6) ? weekend : 1;
      const v = (base + trend * i + Math.sin(i / 2.3) * amp * 0.4 + (r() - 0.5) * amp) * wk;
      out.push(Math.max(0, Math.round(v)));
    }
    return out;
  }

  const roles = {
    admin: { label: 'Administrador', first: 'Valentina', last: 'Rojas' },
    reviewer: { label: 'Revisor', first: 'Matías', last: 'Fuentes' },
    community_manager: { label: 'Community Manager', first: 'Camila', last: 'Herrera' },
  };

  const kpis = {
    messages_processed: 2481, messages_change: 12.4,
    total_audience: 1842, audience_change: 6.8,
    positive_sentiment: 72, sentiment_change: 4.2,
    topics_detected: 24, new_topics: 8,
    content_generated: 37, pending_approvals: 8,
  };

  const sentiment = [
    { key: 'positive', label: 'Positivo', value: 1786, color: '--sentiment-positive' },
    { key: 'neutral', label: 'Neutral', value: 412, color: '--sentiment-neutral' },
    { key: 'question', label: 'Pregunta', value: 138, color: '--sentiment-question' },
    { key: 'negative', label: 'Negativo', value: 145, color: '--sentiment-negative' },
  ];

  const topics = [
    { name: 'Agentes IA', count: 486, change: 18, relevance: 94 },
    { name: 'LangGraph', count: 342, change: 26, relevance: 91 },
    { name: 'RAG', count: 298, change: 9, relevance: 88 },
    { name: 'Python', count: 251, change: -4, relevance: 76 },
    { name: 'Oracle Cloud (OCI)', count: 187, change: 12, relevance: 82 },
    { name: 'Prompt Engineering', count: 164, change: 3, relevance: 79 },
    { name: 'Empleabilidad', count: 121, change: 15, relevance: 73 },
    { name: 'Bases vectoriales', count: 96, change: 31, relevance: 85 },
  ];

  const channels = ['ia', 'proyectos', 'ayuda', 'general', 'empleos', 'oci', 'anuncios'];

  const messages = [
    { id: 1, initials: 'CG', author: 'Carlos Gómez', channel: 'ia', time: 'Hace 18 min', message: 'Después de varias semanas estudiando agentes de IA, finalmente logré construir mi primer proyecto funcional. ¡Gracias a todos por la ayuda!', sentiment: 'positive', score: 94, topic: 'Agentes IA', classification: 'Historia de éxito', relevance: 92, reactions: 34, replies: 12 },
    { id: 2, initials: 'LR', author: 'Laura Rodríguez', channel: 'proyectos', time: 'Hace 32 min', message: 'Terminé mi primer agente con LangGraph. Ahora quiero conectarlo a una base vectorial para que responda sobre la documentación del curso.', sentiment: 'positive', score: 88, topic: 'LangGraph', classification: 'Proyecto', relevance: 89, reactions: 21, replies: 7 },
    { id: 3, initials: 'JP', author: 'Javier Pérez', channel: 'ayuda', time: 'Hace 47 min', message: '¿Alguien sabe cómo manejar el contexto cuando los documentos del RAG superan el límite de tokens? Estoy probando chunking pero pierdo coherencia.', sentiment: 'question', score: 61, topic: 'RAG', classification: 'Pregunta frecuente', relevance: 84, reactions: 9, replies: 15 },
    { id: 4, initials: 'MS', author: 'María Soto', channel: 'general', time: 'Hace 1 h', message: 'La clase en vivo de ayer se cortó dos veces y no quedó la grabación. Es la segunda semana que pasa, ¿se puede revisar?', sentiment: 'negative', score: 22, topic: 'Plataforma', classification: 'Queja', relevance: 81, reactions: 17, replies: 6 },
    { id: 5, initials: 'DA', author: 'Diego Araya', channel: 'oci', time: 'Hace 1 h', message: 'Comparto mi guía para desplegar un endpoint de FastAPI en OCI Container Instances con el free tier. Cualquier feedback es bienvenido.', sentiment: 'positive', score: 90, topic: 'Oracle Cloud (OCI)', classification: 'Recurso compartido', relevance: 87, reactions: 41, replies: 5 },
    { id: 6, initials: 'FV', author: 'Fernanda Vidal', channel: 'empleos', time: 'Hace 2 h', message: 'Me acaban de confirmar mi primera entrevista como AI Engineer junior. El portafolio con agentes fue clave.', sentiment: 'positive', score: 97, topic: 'Empleabilidad', classification: 'Historia de éxito', relevance: 95, reactions: 88, replies: 23 },
    { id: 7, initials: 'TN', author: 'Tomás Navarro', channel: 'ia', time: 'Hace 2 h', message: '¿Cuál es la diferencia práctica entre un agente ReAct y un grafo con nodos condicionales en LangGraph?', sentiment: 'question', score: 58, topic: 'LangGraph', classification: 'Pregunta frecuente', relevance: 78, reactions: 6, replies: 9 },
    { id: 8, initials: 'IC', author: 'Isidora Castro', channel: 'general', time: 'Hace 3 h', message: 'Buen resumen semanal, me sirve mucho para ponerme al día.', sentiment: 'neutral', score: 55, topic: 'Comunidad', classification: 'Comentario', relevance: 42, reactions: 4, replies: 0 },
    { id: 9, initials: 'BM', author: 'Benjamín Muñoz', channel: 'ayuda', time: 'Hace 3 h', message: 'No puedo acceder a los materiales del módulo 4, me aparece error 403. Ya probé cerrando sesión.', sentiment: 'negative', score: 18, topic: 'Plataforma', classification: 'Soporte crítico', relevance: 90, reactions: 3, replies: 2 },
    { id: 10, initials: 'AR', author: 'Antonia Reyes', channel: 'proyectos', time: 'Hace 4 h', message: 'Armé un evaluador automático de prompts con LLM-as-judge. Subí el repo por si a alguien le sirve.', sentiment: 'positive', score: 86, topic: 'Prompt Engineering', classification: 'Recurso compartido', relevance: 83, reactions: 29, replies: 8 },
    { id: 11, initials: 'NL', author: 'Nicolás Lagos', channel: 'ia', time: 'Hace 5 h', message: 'Probando embeddings multilingües para español chileno, los resultados mejoran harto con un re-ranker.', sentiment: 'positive', score: 79, topic: 'Bases vectoriales', relevance: 80, classification: 'Insight técnico', reactions: 14, replies: 4 },
    { id: 12, initials: 'PE', author: 'Paula Espinoza', channel: 'general', time: 'Hace 6 h', message: '¿Habrá certificado para el bootcamp de agentes o es solo la ruta completa?', sentiment: 'question', score: 60, topic: 'Comunidad', classification: 'Pregunta', relevance: 64, reactions: 2, replies: 3 },
  ];

  const highlights = [
    { title: 'De estudiante a AI Engineer en 6 meses', author: 'Fernanda Vidal', channel: 'empleos', type: 'Historia de éxito', score: 97, reach: 1240, excerpt: 'Su portafolio de agentes con LangGraph le abrió la primera entrevista técnica.' },
    { title: 'Primer agente funcional en producción', author: 'Carlos Gómez', channel: 'ia', type: 'Historia de éxito', score: 94, reach: 860, excerpt: 'Después de semanas de práctica logró un agente que responde tickets de soporte.' },
    { title: 'Guía de FastAPI en OCI free tier', author: 'Diego Araya', channel: 'oci', type: 'Recurso compartido', score: 90, reach: 712, excerpt: 'Un paso a paso que ya usaron más de 40 miembros para desplegar su primer endpoint.' },
    { title: 'Evaluador de prompts con LLM-as-judge', author: 'Antonia Reyes', channel: 'proyectos', type: 'Recurso compartido', score: 86, reach: 534, excerpt: 'Repositorio abierto para comparar variantes de prompts con métricas automáticas.' },
  ];

  const hashtags = [
    { tag: 'agentesIA', count: 412, change: 22 }, { tag: 'langgraph', count: 356, change: 31 },
    { tag: 'rag', count: 288, change: 8 }, { tag: 'python', count: 241, change: -3 },
    { tag: 'oci', count: 176, change: 14 }, { tag: 'promptengineering', count: 149, change: 5 },
    { tag: 'primerempleo', count: 118, change: 19 }, { tag: 'fastapi', count: 97, change: 11 },
    { tag: 'embeddings', count: 84, change: 27 }, { tag: 'opensource', count: 63, change: -6 },
  ];

  const emojis = [
    { emoji: '🔥', name: 'fuego', count: 1284, change: 14 }, { emoji: '🙌', name: 'manos arriba', count: 962, change: 9 },
    { emoji: '🚀', name: 'cohete', count: 871, change: 21 }, { emoji: '💡', name: 'idea', count: 640, change: 6 },
    { emoji: '❤️', name: 'corazón', count: 598, change: -2 }, { emoji: '🤔', name: 'pensando', count: 311, change: 12 },
  ];

  const audience = {
    byCountry: [
      { label: 'Chile', value: 612 }, { label: 'México', value: 388 }, { label: 'Colombia', value: 274 },
      { label: 'Perú', value: 198 }, { label: 'Argentina', value: 176 }, { label: 'España', value: 104 }, { label: 'Otros', value: 90 },
    ],
    byLevel: [
      { label: 'Principiante', value: 734 }, { label: 'Intermedio', value: 689 }, { label: 'Avanzado', value: 419 },
    ],
    hours: [3, 2, 1, 1, 1, 2, 5, 11, 19, 26, 31, 34, 29, 27, 30, 33, 38, 44, 52, 61, 66, 54, 32, 12],
    segments: [
      { name: 'Miembros activos (7d)', value: 1124, pct: 61 },
      { name: 'Nuevos este mes', value: 186, pct: 10 },
      { name: 'Contribuyentes frecuentes', value: 243, pct: 13 },
      { name: 'En riesgo de abandono', value: 97, pct: 5 },
    ],
  };

  // Calendario: actividad por día del mes actual (octubre 2026)
  function calendar(year = 2026, month = 9) {
    const r = rng(year * 12 + month);
    const days = new Date(year, month + 1, 0).getDate();
    const out = [];
    for (let d = 1; d <= days; d++) {
      const dow = new Date(year, month, d).getDay();
      const future = new Date(year, month, d) > TODAY;
      const base = (dow === 0 || dow === 6) ? 30 : 85;
      const v = future ? 0 : Math.round(base + r() * 70);
      out.push({ day: d, dow, messages: v, events: future ? 0 : Math.floor(r() * 3), future });
    }
    return out;
  }

  const events = [
    { date: '21 oct', time: '19:00', title: 'Live coding: agentes con memoria', type: 'Evento', channel: 'anuncios' },
    { date: '23 oct', time: '18:30', title: 'Office hours RAG', type: 'Mentoría', channel: 'ayuda' },
    { date: '26 oct', time: '10:00', title: 'Publicación reporte semanal OCI', type: 'Reporte', channel: 'interno' },
    { date: '28 oct', time: '19:00', title: 'Demo day proyectos comunidad', type: 'Evento', channel: 'proyectos' },
  ];

  const drafts = [
    { id: 'D-104', source: messages[0], status: 'pending', type: 'Post LinkedIn', updated: 'Hace 12 min',
      generated: '🚀 Historias que inspiran: Carlos pasó de cero a su primer agente de IA funcional en pocas semanas. En CloudEdTech creemos en aprender construyendo, y su proyecto es prueba de ello. ¿Cuál será el tuyo? #AgentesIA #CloudEdTech' },
    { id: 'D-103', source: messages[5], status: 'approved', type: 'Anuncio Discord', updated: 'Hace 1 h',
      generated: '🎉 ¡Felicitaciones a @Fernanda Vidal por su primera entrevista como AI Engineer! Su portafolio de agentes marcó la diferencia. Si quieres armar el tuyo, revisa el canal #proyectos.' },
    { id: 'D-102', source: messages[4], status: 'review', type: 'Newsletter', updated: 'Hace 3 h',
      generated: 'Recurso de la semana: Diego Araya publicó una guía práctica para desplegar FastAPI en OCI usando el free tier. Ideal si estás dando tus primeros pasos en la nube.' },
    { id: 'D-101', source: messages[9], status: 'rejected', type: 'Post LinkedIn', updated: 'Ayer',
      generated: 'La comunidad no para: Antonia compartió un evaluador automático de prompts con LLM-as-judge…' },
  ];

  const complaints = [
    { id: 'Q-58', author: 'María Soto', channel: 'general', priority: 'Alta', status: 'Sin responder', time: 'Hace 1 h', text: messages[3].message,
      response: 'Hola María, lamentamos los cortes en la clase en vivo. Ya escalamos el problema con el proveedor de streaming y la grabación estará disponible hoy antes de las 20:00. Gracias por avisarnos.' },
    { id: 'Q-57', author: 'Benjamín Muñoz', channel: 'ayuda', priority: 'Crítica', status: 'En curso', time: 'Hace 3 h', text: messages[8].message,
      response: 'Hola Benjamín, detectamos un problema de permisos en el módulo 4. Ya está corregido; si sigues viendo el error 403, escríbenos por DM con tu correo de registro.' },
    { id: 'Q-55', author: 'Rocío Álvarez', channel: 'ayuda', priority: 'Media', status: 'Publicada', time: 'Ayer', text: 'El quiz del módulo 2 marca incorrecta una respuesta que está bien.',
      response: 'Gracias Rocío, corregimos la pregunta 7 del quiz y recalculamos los puntajes.' },
  ];

  const announcements = [
    { title: 'Nuevo bootcamp: Agentes de IA en producción', status: 'Publicado', channel: 'anuncios', date: '17 oct, 10:00', reach: 1532 },
    { title: 'Mantención programada de la plataforma', status: 'Programado', channel: 'anuncios', date: '22 oct, 23:00', reach: 0 },
    { title: 'Resultados del Demo Day de septiembre', status: 'Borrador', channel: 'proyectos', date: '—', reach: 0 },
  ];

  const ociReports = [
    { semana: '2026-W42', periodo: '12 – 18 oct', mensajes: 612, tamano: '184 KB', generado: '19 oct, 08:00', subido_oci: false },
    { semana: '2026-W41', periodo: '5 – 11 oct', mensajes: 587, tamano: '176 KB', generado: '12 oct, 08:00', subido_oci: true },
    { semana: '2026-W40', periodo: '28 sep – 4 oct', mensajes: 541, tamano: '162 KB', generado: '5 oct, 08:00', subido_oci: true },
    { semana: '2026-W39', periodo: '21 – 27 sep', mensajes: 498, tamano: '151 KB', generado: '28 sep, 08:00', subido_oci: true },
    { semana: '2026-W38', periodo: '14 – 20 sep', mensajes: 463, tamano: '140 KB', generado: '21 sep, 08:00', subido_oci: false },
  ];

  const myReports = [
    { name: 'Resumen ejecutivo septiembre', type: 'PDF', created: '01 oct 2026', size: '1,2 MB', status: 'Listo' },
    { name: 'Sentimiento por canal Q3', type: 'XLSX', created: '30 sep 2026', size: '420 KB', status: 'Listo' },
    { name: 'Top historias destacadas', type: 'PDF', created: '15 oct 2026', size: '860 KB', status: 'Listo' },
    { name: 'Exportación mensajes octubre', type: 'CSV', created: '19 oct 2026', size: '—', status: 'Generando' },
  ];

  const audit = [
    { time: '19 oct 2026, 09:42', user: 'Valentina Rojas', role: 'admin', action: 'Actualizó rol', target: 'Matías Fuentes → reviewer', ip: '190.98.12.44', level: 'warning' },
    { time: '19 oct 2026, 09:15', user: 'Camila Herrera', role: 'community_manager', action: 'Publicó respuesta', target: 'Queja Q-55', ip: '181.43.200.7', level: 'info' },
    { time: '19 oct 2026, 08:00', user: 'Sistema', role: 'system', action: 'Generó reporte semanal', target: '2026-W42', ip: '—', level: 'info' },
    { time: '18 oct 2026, 22:31', user: 'Desconocido', role: '—', action: 'Intento de acceso fallido', target: 'usuario: admin', ip: '45.155.205.3', level: 'danger' },
    { time: '18 oct 2026, 18:04', user: 'Matías Fuentes', role: 'reviewer', action: 'Aprobó contenido', target: 'Borrador D-103', ip: '200.27.91.10', level: 'success' },
    { time: '18 oct 2026, 17:50', user: 'Camila Herrera', role: 'community_manager', action: 'Regeneró contenido', target: 'Borrador D-102', ip: '181.43.200.7', level: 'info' },
    { time: '18 oct 2026, 11:20', user: 'Valentina Rojas', role: 'admin', action: 'Sincronizó Discord', target: '312 mensajes nuevos', ip: '190.98.12.44', level: 'info' },
    { time: '17 oct 2026, 16:02', user: 'Valentina Rojas', role: 'admin', action: 'Creó usuario', target: 'ignacio.paredes', ip: '190.98.12.44', level: 'success' },
  ];

  const users = [
    { initials: 'VR', name: 'Valentina Rojas', user: 'valentina.rojas', role: 'admin', status: 'Activo', last: 'Hace 5 min' },
    { initials: 'MF', name: 'Matías Fuentes', user: 'matias.fuentes', role: 'reviewer', status: 'Activo', last: 'Hace 1 h' },
    { initials: 'CH', name: 'Camila Herrera', user: 'camila.herrera', role: 'community_manager', status: 'Activo', last: 'Hace 12 min' },
    { initials: 'IP', name: 'Ignacio Paredes', user: 'ignacio.paredes', role: 'community_manager', status: 'Pendiente', last: 'Nunca' },
    { initials: 'SG', name: 'Sofía Guzmán', user: 'sofia.guzman', role: 'reviewer', status: 'Inactivo', last: 'Hace 34 días' },
  ];

  window.CE_DATA = {
    TODAY, rng, series, dayLabels, roles, kpis, sentiment, topics, channels, messages, highlights,
    hashtags, emojis, audience, calendar, events, drafts, complaints, announcements, ociReports,
    myReports, audit, users,
  };
})();
