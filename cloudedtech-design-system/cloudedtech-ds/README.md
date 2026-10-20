# CloudEdTech CommunityLab · Design System

Design system y prototipo navegable del frontend de CommunityLab, construido a partir del sitio
[cloudedtech-communitylab.netlify.app](https://cloudedtech-communitylab.netlify.app/login)
(Tailwind slate + naranjo de marca `#FF7400`). Está hecho en HTML, CSS y JavaScript puro, sin build
ni dependencias que instalar.

## Cómo abrirlo

Abre cualquiera de estos archivos directamente en el navegador (doble clic):

| Archivo | Qué es |
|---|---|
| `design-system.html` | Guía del sistema: marca, color, tipografía, espaciado, íconos, componentes, gráficos, layout y tono de los textos, con ejemplos de código. |
| `login.html` | Réplica del login. Los botones “Demo” entran al prototipo con un rol. |
| `app.html` | Prototipo de las 14 pantallas con datos de ejemplo. |

Los gráficos usan Chart.js 4.4.1 desde cdnjs, así que necesitan conexión a internet. El resto
funciona sin conexión.

## Pantallas del prototipo

Navegación por `app.html#<ruta>`, con el menú filtrado según el rol (selector al pie del sidebar):

- **Todos los roles:** `dashboard`, `messages` (ingesta), `analytics`, `content` (redacción), `oci-storage`.
- **Admin y revisor:** `highlights`, `hashtags`, `audience`, `calendar`, `export`, `my-reports`.
- **Solo admin:** `audit`, `security`, `settings`.

Una ruta sin permiso muestra la pantalla “Acceso restringido”.

## Estructura

```
css/tokens.css       Tokens: primitivos (escalas) y semánticos por rol (--color-brand, --surface-card…)
css/components.css   Componentes con prefijo c- (botones, inputs, cards, pills, tablas, tabs, modal…)
css/layout.css       App shell (sidebar + main), grids responsivos y login
js/icons.js          Sprite de íconos Lucide: <svg class="icon"><use href="#i-nombre"/></svg>
js/data.js           Datos de ejemplo (CE_DATA) y generadores de series por período
js/charts.js         Fábrica de gráficos (CECharts) que toma los colores de los tokens
js/app.js            Router por hash, roles y comportamiento de cada pantalla
assets/              Logo para fondo oscuro (logo.svg) y para fondo claro (logo-dark.svg)
```

## Convenciones

- Los componentes usan solo tokens semánticos; para cambiar la marca basta con editar `tokens.css`.
- Clases: `c-` componente, `l-` layout, `t-` tipografía, `is-` estado (`c-btn c-btn--primary is-active`).
- Breakpoints: 640, 1024 (sidebar fijo) y 1536 px.
- Cifras con formato es-CL (`2.481`, `72%`).

## Importante

Todos los datos son de ejemplo (`js/data.js`): mensajes, usuarios, reportes y métricas. El
prototipo no se conecta a Discord, a la IA, a Supabase ni a OCI; las acciones (sincronizar, evaluar
lote, publicar, subir a OCI) solo simulan el flujo en el navegador.
