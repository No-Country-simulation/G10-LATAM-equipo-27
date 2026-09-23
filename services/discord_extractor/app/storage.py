"""Cliente de OCI Object Storage: sube el paquete JSON de interacciones."""

from __future__ import annotations

from datetime import datetime, timezone

import oci

from app.config import Settings
from app.schemas import PaqueteInteracciones


class ObjectStorageClient:
    """Wrapper delgado sobre el SDK de OCI para subir objetos JSON.

    Soporta dos formas de autenticacion (ver Settings.oci_auth):
    - "instance_principal": para cuando el servicio corre dentro de una VM
      de OCI, sin necesidad de llaves (recomendado para el despliegue).
    - "config": usa el archivo ~/.oci/config (perfil OCI_CONFIG_PROFILE),
      pensado para correr y probar en local.
    """

    def __init__(self, settings: Settings):
        self._settings = settings

        if settings.oci_auth == "instance_principal":
            signer = oci.auth.signers.InstancePrincipalsSecurityTokenSigner()
            self._client = oci.object_storage.ObjectStorageClient(config={}, signer=signer)
        else:
            config = oci.config.from_file(profile_name=settings.oci_config_profile)
            self._client = oci.object_storage.ObjectStorageClient(config)

    def _namespace(self) -> str:
        if self._settings.oci_namespace:
            return self._settings.oci_namespace
        return self._client.get_namespace().data

    def subir_paquete(self, paquete: PaqueteInteracciones) -> tuple[str, str]:
        """Sube el paquete como JSON y devuelve (bucket, ruta_objeto)."""
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        ruta_objeto = (
            f"discord/{paquete.periodo_referencia}/"
            f"{self._settings.discord_guild_id}-{timestamp}.json"
        )
        contenido = paquete.model_dump_json(indent=2).encode("utf-8")

        self._client.put_object(
            namespace_name=self._namespace(),
            bucket_name=self._settings.oci_bucket_name,
            object_name=ruta_objeto,
            put_object_body=contenido,
            content_type="application/json",
        )
        return self._settings.oci_bucket_name, ruta_objeto
