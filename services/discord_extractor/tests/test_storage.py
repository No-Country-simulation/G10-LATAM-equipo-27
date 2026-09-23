"""Tests de ObjectStorageClient, con el SDK de OCI mockeado (sin red real)."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from app.config import Settings
from app.schemas import Interaccion, PaqueteInteracciones
from app.storage import ObjectStorageClient


def _settings(**overrides) -> Settings:
    base = dict(
        api_key="test-key",
        discord_bot_token="test-token",
        discord_guild_id="42",
        oci_auth="config",
        oci_namespace="mi-namespace",
        oci_bucket_name="communitylab-discord-raw",
    )
    base.update(overrides)
    return Settings(**base)


def _paquete() -> PaqueteInteracciones:
    return PaqueteInteracciones(
        origen_comunidad="Discord_ONE_G10",
        periodo_referencia="Semana_38",
        extraido_en=datetime.now(timezone.utc),
        interacciones=[
            Interaccion(
                id="1",
                autor="Mariana",
                canal="#general",
                texto="hola",
                fecha=datetime.now(timezone.utc),
            )
        ],
    )


@patch("app.storage.oci.config.from_file", return_value={})
@patch("app.storage.oci.object_storage.ObjectStorageClient")
def test_subir_paquete_con_auth_config(mock_client_cls, _mock_from_file):
    mock_client = MagicMock()
    mock_client_cls.return_value = mock_client

    cliente = ObjectStorageClient(_settings())
    bucket, ruta = cliente.subir_paquete(_paquete())

    assert bucket == "communitylab-discord-raw"
    assert ruta.startswith("discord/Semana_38/42-")
    assert ruta.endswith(".json")
    mock_client.put_object.assert_called_once()
    kwargs = mock_client.put_object.call_args.kwargs
    assert kwargs["namespace_name"] == "mi-namespace"
    assert kwargs["bucket_name"] == "communitylab-discord-raw"
    assert kwargs["object_name"] == ruta
    assert b'"origen_comunidad"' in kwargs["put_object_body"]


@patch("app.storage.oci.auth.signers.InstancePrincipalsSecurityTokenSigner")
@patch("app.storage.oci.object_storage.ObjectStorageClient")
def test_usa_instance_principal_cuando_corresponde(mock_client_cls, mock_signer_cls):
    mock_client = MagicMock()
    mock_client_cls.return_value = mock_client
    mock_signer_cls.return_value = MagicMock()

    ObjectStorageClient(_settings(oci_auth="instance_principal"))

    mock_signer_cls.assert_called_once()
    _, kwargs = mock_client_cls.call_args
    assert kwargs["signer"] is mock_signer_cls.return_value


@patch("app.storage.oci.config.from_file", return_value={})
@patch("app.storage.oci.object_storage.ObjectStorageClient")
def test_resuelve_namespace_automaticamente_si_no_se_configura(mock_client_cls, _mock_from_file):
    mock_client = MagicMock()
    mock_client.get_namespace.return_value.data = "namespace-detectado"
    mock_client_cls.return_value = mock_client

    cliente = ObjectStorageClient(_settings(oci_namespace=""))
    bucket, ruta = cliente.subir_paquete(_paquete())

    mock_client.get_namespace.assert_called_once()
    kwargs = mock_client.put_object.call_args.kwargs
    assert kwargs["namespace_name"] == "namespace-detectado"
