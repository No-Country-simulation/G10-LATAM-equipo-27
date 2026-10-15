import os

from dotenv import load_dotenv


load_dotenv()


def get_oci_settings():
    return {
        "config_file": os.getenv("OCI_CONFIG_FILE"),
        "config_profile": os.getenv(
            "OCI_CONFIG_PROFILE",
            "DEFAULT"
        ),
        "namespace": os.getenv("OCI_NAMESPACE"),
        "bucket_name": os.getenv("OCI_BUCKET_NAME"),
    }

def validate_oci_settings(settings: dict):
    required_settings = {
        "OCI_CONFIG_FILE": settings["config_file"],
        "OCI_NAMESPACE": settings["namespace"],
        "OCI_BUCKET_NAME": settings["bucket_name"],
    }

    missing = [
        name
        for name, value in required_settings.items()
        if not value
    ]

    if missing:
        raise RuntimeError(
            "Falta configuración OCI: "
            + ", ".join(missing)
        )