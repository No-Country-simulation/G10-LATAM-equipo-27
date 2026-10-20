"""
Trabajador independiente de analisis de mensajes Discord.
No publica mensajes ni modifica el listener.
"""

import logging
import time

from servicio_analisis import analizar_pendientes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

logger = logging.getLogger("cloudedtech.analizador")

INTERVALO_SEGUNDOS = 30
LIMITE_POR_CICLO = 10
ESPERA_MAXIMA_SEGUNDOS = 900


def main():
    logger.info("Analizador automatico iniciado")

    errores_consecutivos = 0

    while True:
        try:
            resultado = analizar_pendientes(
                limite=LIMITE_POR_CICLO
            )

            procesados = resultado["procesados"]
            analizados = resultado["analizados"]
            errores = resultado["errores"]

            if procesados:
                logger.info(
                    "Procesados=%s Analizados=%s Errores=%s",
                    procesados,
                    analizados,
                    errores,
                )

            if errores > 0:
                errores_consecutivos += 1
            else:
                errores_consecutivos = 0

        except Exception:
            errores_consecutivos += 1
            logger.exception("Error en el ciclo de analisis")

        espera = min(
            INTERVALO_SEGUNDOS * (2 ** min(errores_consecutivos, 5)),
            ESPERA_MAXIMA_SEGUNDOS,
        ) if errores_consecutivos else INTERVALO_SEGUNDOS

        if errores_consecutivos:
            logger.warning(
                "Reintento de analisis en %s segundos",
                espera,
            )

        time.sleep(espera)


if __name__ == "__main__":
    main()