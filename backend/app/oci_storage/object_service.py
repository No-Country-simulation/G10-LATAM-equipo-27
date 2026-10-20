import json
import os

import oci

from app.oci_storage.config import get_oci_settings


def _get_client():
    settings = get_oci_settings()

    config_file = settings["config_file"]
    if not config_file:
        raise RuntimeError("OCI_CONFIG_FILE no configurado")

    config = oci.config.from_file(
        file_location=os.path.expanduser(config_file),
        profile_name=settings["config_profile"],
    )

    client = oci.object_storage.ObjectStorageClient(config)

    namespace = settings["namespace"] or client.get_namespace().data
    bucket = settings["bucket_name"]

    if not bucket:
        raise RuntimeError("OCI_BUCKET_NAME no configurado")

    return client, namespace, bucket


def list_json_objects(prefix: str = "", limit: int = 100):
    client, namespace, bucket = _get_client()

    response = client.list_objects(
        namespace_name=namespace,
        bucket_name=bucket,
        prefix=prefix,
        limit=limit,
    )

    return [
        {
            "name": obj.name,
            "size": obj.size,
            "time_created": (
                obj.time_created.isoformat()
                if obj.time_created
                else None
            ),
        }
        for obj in response.data.objects
        if obj.name.lower().endswith(".json")
    ]


def get_json_object(object_name: str):
    if not object_name.lower().endswith(".json"):
        raise ValueError("Solo se permiten archivos JSON")

    client, namespace, bucket = _get_client()

    response = client.get_object(
        namespace_name=namespace,
        bucket_name=bucket,
        object_name=object_name,
    )

    return json.loads(response.data.content.decode("utf-8"))
