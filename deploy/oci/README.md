# Despliegue en OCI (Always Free)

Guía paso a paso para desplegar `services/discord_extractor` en una VM Compute
Always Free de Oracle Cloud Infrastructure, con el paquete generado persistido
en un bucket de Object Storage. Todo se mantiene dentro de la capa **Always
Free**.

## 1. Bucket de Object Storage

1. Consola de OCI → **Storage → Buckets** → seleccionar el compartment del
   proyecto → **Create Bucket**.
2. Nombre: `communitylab-discord-raw`. Visibilidad: **Private** (por defecto).
   No hace falta cifrado con llave propia (usa la llave administrada por
   Oracle, incluida en Always Free).
3. Anotar el **namespace** de la cuenta (aparece arriba a la derecha de la
   consola, o con `oci os ns get`).

## 2. Crear la VM

1. Consola de OCI → **Compute → Instances** → **Create Instance**.
2. Shape Always Free recomendado: `VM.Standard.A1.Flex` (ARM, hasta 4 OCPU /
   24 GB en la capa gratuita) o, si no está disponible en la región,
   `VM.Standard.E2.1.Micro` (x86).
3. Imagen: Ubuntu (LTS) o Oracle Linux, la que tenga el equipo más a mano.
4. En **Add SSH keys**, subir la llave pública para poder conectarse.
5. En **Show advanced options → Management → Init script (cloud-init)**, pegar
   el contenido de [`cloud-init.yaml`](./cloud-init.yaml) (instala Docker y
   Git automáticamente al primer arranque).
6. Crear la instancia y anotar su **IP pública** y su **OCID** (lo vamos a
   necesitar para el dynamic group).

## 3. Abrir el puerto 8000

1. En la VPC/subnet de la instancia: **Security Lists** (o **Network Security
   Groups**) → **Add Ingress Rule**:
   - Source CIDR: `0.0.0.0/0` (o restringido a las IPs del equipo, si se
     prefiere).
   - Protocolo: TCP, puerto de destino: `8000`.
2. Dentro de la VM, el firewall del sistema operativo también debe permitir el
   puerto (Ubuntu con `ufw` inactivo por defecto no requiere nada más; en
   Oracle Linux con `firewalld`):
   ```bash
   sudo firewall-cmd --permanent --add-port=8000/tcp
   sudo firewall-cmd --reload
   ```

## 4. Dynamic Group + Policy (Instance Principal)

Esto permite que la API, corriendo dentro de la VM, escriba en el bucket
**sin usar ninguna API key** (usa la identidad de la propia instancia).

1. **Identity & Security → Dynamic Groups → Create Dynamic Group**.
   - Nombre: `communitylab-vm`.
   - Matching rule (reemplazar el OCID de la instancia):
     ```
     instance.id = '<OCID_DE_LA_INSTANCIA>'
     ```
2. **Identity & Security → Policies → Create Policy** (en el compartment del
   proyecto):
   ```
   Allow dynamic-group communitylab-vm to manage objects in compartment <NOMBRE_DEL_COMPARTMENT> where target.bucket.name='communitylab-discord-raw'
   ```

## 5. Clonar el repo y construir la imagen en la VM

Conectarse por SSH y, dentro de `services/discord_extractor`:

```bash
git clone https://github.com/No-Country-simulation/G10-LATAM-equipo-27.git
cd G10-LATAM-equipo-27/services/discord_extractor

cp .env.example .env
nano .env   # completar DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, API_KEY,
            # OCI_NAMESPACE, y dejar OCI_AUTH=instance_principal

docker build -t discord-extractor .
docker run -d --name discord-extractor \
  --env-file .env \
  -p 8000:8000 \
  --restart unless-stopped \
  discord-extractor
```

> Se construye la imagen directamente en la VM (en vez de subirla a un
> registry) para evitar problemas de arquitectura entre la máquina de
> desarrollo (x86/ARM) y la VM.

## 6. Verificar

Desde cualquier máquina con acceso a la IP pública:

```bash
curl http://<IP_PUBLICA>:8000/health
# {"status":"ok"}

curl -H "X-API-Key: <la que pusiste en .env>" http://<IP_PUBLICA>:8000/channels
```

Si `/channels` devuelve la lista de canales del servidor, el bot está bien
configurado. El siguiente paso es un `POST /extract` con `subir_a_oci: true`
y confirmar el objeto nuevo en el bucket (consola de OCI, o
`oci os object list -bn communitylab-discord-raw --namespace <namespace>`).

## Notas de costos

- Mantener siempre shapes, storage y transferencia dentro de los límites
  Always Free (ver la consola de OCI → **Governance → Cost Management**, o el
  panel de "Always Free" en el dashboard principal).
- El bucket no tiene costo mientras el volumen de datos se mantenga dentro de
  los 10 GB incluidos en Always Free.
