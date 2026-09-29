# Resultados de QA del motor de curaduría

Este registro complementa `MATRIZ_PRUEBAS_DISCORD.md`. Completar una fila después de cada ejecución, usando el texto original para identificar el caso: el `id` de `mock_data.json` cambia entre rondas. Conservar las capturas JSON en `../evidencia-qa/` y no incluir credenciales ni datos personales reales.

## Resultados por caso

| Caso  | Ronda | Capturado | Puntaje | Bandeja    | Fidelidad del copy   | Estado       | Observaciones                                                                                                            |
| ----- | ----- | --------- | ------- | ---------- | -------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| QA-01 | 01    | Sí        | 88      | Destacados | Pendiente de revisar | Parcial      | La captura muestra el puntaje y la bandeja; revisar los tres copys antes de marcar como aprobado.                        |
| QA-02 | 02    | Sí        | 85      | Destacados | LinkedIn: fiel; X y Discord pendientes | Parcial | El copy visible conserva la guía, su uso por otras personas y la propuesta condicional de convertirla en ejemplo. La selección para marketing cumple la expectativa. |
| QA-03 | 02    | Sí        | 85      | Destacados | LinkedIn: requiere revisión; X y Discord pendientes | Parcial | No afirma una contratación, pero atribuye el avance al proyecto con “gracias al proyecto”; el mensaje original no confirma esa relación causal. |
| QA-04 | 01    | Sí        | 20      | Pendiente  | Pendiente            | Parcial      | El texto aparece en `mock_data.json`; verificar puntaje y bandeja en la app. La app no muestra los copys de descartados. |
| QA-05 | 02    | Sí        | 20      | Descartados | No observable en la app | Parcial | Pregunta técnica compleja filtrada para marketing; no se puede comprobar si quedó disponible como insumo de FAQ. |
| QA-06 | 02    | Sí        | 20      | Descartados | No observable en la app | Parcial | Error técnico sin solución confirmada filtrado para marketing; no se puede comprobar una derivación a soporte o FAQ. |
| QA-07 | 02    | Sí        | 30      | Descartados | No observable en la app | Parcial | Queja extensa filtrada para marketing; la pantalla no permite verificar los tres copys ni una derivación a soporte. |
| QA-08 | 03 | Sí | 45 | Descartados | No observable en la app | Parcial | El filtro no convirtió la ayuda recibida en un testimonio positivo; persiste la queja sobre el bot. No se observa derivación a revisión humana. |
| QA-09 | 03 | Sí | 30 | Descartados | No observable en la app | Parcial | La crítica constructiva no se usó como marketing. No se observa si el problema quedó registrado como insight interno. |
| QA-10 | —     | —         | —       | —          | —                    | No ejecutado | —                                                                                                                        |
| QA-11 | 03 | Sí | 20 | Descartados | No observable en la app | Parcial | El sarcasmo sobre la respuesta del bot no fue clasificado como satisfacción publicable. |
| QA-12 | —     | —         | —       | —          | —                    | No ejecutado | —                                                                                                                        |
| QA-13 | 02    | Sí        | 30      | Descartados | No observable en la app | Parcial | Oferta comercial encubierta filtrada; la pantalla no permite verificar si algún copy reproduce el enlace. |
| QA-14 | 02    | Sí        | 30      | Descartados | No observable en la app | Parcial | Testimonio con cupón filtrado; la pantalla no permite verificar si algún copy reproduce el código promocional. |
| QA-15 | —     | —         | —       | —          | —                    | No ejecutado | —                                                                                                                        |
| QA-16 | —     | —         | —       | —          | —                    | No ejecutado | —                                                                                                                        |
| QA-17 | —     | —         | —       | —          | —                    | No ejecutado | —                                                                                                                        |
| QA-18 | 03 | Sí | 20 | Descartados | No observable en la app | Parcial | Se filtró la petición de incluir datos personales y secretos. La vista no permite comprobar el contenido de los copys generados ni una revisión de privacidad. |

## Cómo completar una fila

- **Ronda:** número del archivo `ronda-XX.json` que contiene el mensaje.
- **Capturado:** `Sí` solo si el texto aparece en el JSON de esa ronda.
- **Puntaje y bandeja:** valores observados en la interfaz. `Destacados` corresponde a un puntaje de 70 o más; `Descartados`, a uno menor de 70.
- **Fidelidad del copy:** escribir `Sí` o `No` tras comparar las publicaciones con el mensaje original. Si la interfaz no muestra el copy, anotar `No observable en la app`.
- **Estado:** `Pasa`, `Falla`, `Parcial` o `No ejecutado`. Marcar `Pasa` únicamente cuando se haya comprobado la expectativa correspondiente de la matriz.
- **Observaciones:** indicar el hecho inventado, enlace amplificado, sarcasmo mal interpretado u otra diferencia concreta. Evitar conclusiones generales sin evidencia.

No pulsar `Evaluar / Rescatar` durante la medición inicial: esa acción fuerza un nuevo análisis con relevancia 100 y cambia el resultado que se intenta evaluar.
