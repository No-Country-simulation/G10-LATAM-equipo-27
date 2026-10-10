import os
import oci
from dotenv import load_dotenv

load_dotenv()

def subir_json_a_oci(ruta_archivo_local: str, nombre_objeto_oci: str) -> bool:
    """
    Sube un archivo JSON al bucket de OCI Object Storage.
    Si faltan credenciales o la cuenta está pendiente, realiza un bypass seguro.
    """
    bucket_name = os.getenv("OCI_BUCKET_NAME", "communitylab-assets")
    config_file = os.getenv("OCI_CONFIG_FILE", "~/.oci/config")
    compartment_id = os.getenv("OCI_COMPARTMENT_ID")

    # Validación de entorno previo a la llamada
    if not os.path.exists(os.path.expanduser(config_file)) and not os.getenv("OCI_USER_OCID"):
        print(f"⚠️ [OCI Modo Offline] Credenciales OCI no detectadas. Archivo preservado en: {ruta_archivo_local}")
        return False

    try:
        # Carga la configuración del CLI o API key de OCI
        config = oci.config.from_file(file_location=os.path.expanduser(config_file))
        object_storage_client = oci.object_storage.ObjectStorageClient(config)
        
        # Obtener namespace asignado al tenancy
        namespace = object_storage_client.get_namespace().data

        with open(ruta_archivo_local, "rb") as f:
            object_storage_client.put_object(
                namespace_name=namespace,
                bucket_name=bucket_name,
                object_name=nombre_objeto_oci,
                put_object_body=f,
                content_type="application/json"
            )
            
        print(f"🚀 Objeto subido a OCI: {bucket_name}/{nombre_objeto_oci}")
        return True

    except Exception as e:
        print(f"❌ Error al conectar o subir a OCI: {str(e)}")
        return False